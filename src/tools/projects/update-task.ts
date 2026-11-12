/**
 * Update Task Tool
 * Update an existing task
 */

import { z } from 'zod';
import * as projectsApi from '../../api/projects.js';
import { formatError } from '../../utils/errors.js';
import { transformMembers, toRequestMembers, mergeMembers } from '../../utils/member-transform.js';
import { omitTaskBodyContent } from '../../utils/response-filters.js';

const memberSchema = z.object({
  id: z.string(),
  type: z.enum(['member', 'group', 'email']),
});

const bodySchema = z.object({
  mimeType: z.enum(['text/x-markdown', 'text/html']),
  content: z.string(),
});

export const updateTaskSchema = z.object({
  projectId: z.string().describe('Project ID'),
  taskId: z.string().describe('Task ID to update'),
  subject: z.string().optional().describe('New task subject/title'),
  body: bodySchema.optional().describe('New task body content'),
  assignees: z.array(memberSchema).optional().describe('New list of assignees'),
  cc: z.array(memberSchema).optional().describe('New list of CC recipients'),
  dueDate: z.string().optional().describe('New due date (ISO 8601 format)'),
  milestoneId: z.string().nullable().optional().describe('New milestone ID (null to remove)'),
  tagIds: z.array(z.string()).optional().describe('New array of tag IDs'),
  priority: z.enum(['highest', 'high', 'normal', 'low', 'lowest', 'none']).optional().describe('Task priority level'),
  workflowId: z.string().optional().describe('New workflow ID (status)'),
  parentPostId: z.string().optional().describe('Parent task ID to set as parent (상위 업무 설정)'),
  addAssignees: z.array(memberSchema).optional().describe('Assignees to add, keeping current ones'),
  removeAssignees: z.array(memberSchema).optional().describe('Assignees to remove'),
  addCc: z.array(memberSchema).optional().describe('CC recipients to add, keeping current ones'),
  removeCc: z.array(memberSchema).optional().describe('CC recipients to remove'),
  addTagIds: z.array(z.string()).optional().describe('Tag IDs to add, keeping current tags'),
  removeTagIds: z.array(z.string()).optional().describe('Tag IDs to remove'),
});

export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;

/**
 * Resolve options that need the current task: add/remove options, and assignees or cc passed alone
 * The Dooray API replaces users as a whole, so the side that was not passed is sent with its current members
 * Replacement options (assignees, cc, tagIds) and add/remove options for the same field cannot be mixed
 */
async function resolveChangesAgainstCurrentTask(args: UpdateTaskInput) {
  const usersIncremental = [args.addAssignees, args.removeAssignees, args.addCc, args.removeCc]
    .some(list => list !== undefined);
  const usersPartial = (args.assignees === undefined) !== (args.cc === undefined);
  const tagsIncremental = args.addTagIds !== undefined || args.removeTagIds !== undefined;
  if (!usersIncremental && !usersPartial && !tagsIncremental) return {};

  if (usersIncremental && (args.assignees !== undefined || args.cc !== undefined)) {
    throw new Error('Use either assignees/cc (replace) or addAssignees/removeAssignees/addCc/removeCc (add, remove), not both');
  }
  if (tagsIncremental && args.tagIds !== undefined) {
    throw new Error('Use either tagIds (replace) or addTagIds/removeTagIds (add, remove), not both');
  }

  const task = await projectsApi.getTaskDetails(args.taskId, args.projectId);
  const changes: { users?: { to: ReturnType<typeof mergeMembers>; cc: ReturnType<typeof mergeMembers> }; tagIds?: string[] } = {};

  if (usersIncremental) {
    // Send both lists so the side that was not touched keeps its current members
    changes.users = {
      to: mergeMembers(
        toRequestMembers(task.users?.to),
        transformMembers(args.addAssignees),
        transformMembers(args.removeAssignees)
      ),
      cc: mergeMembers(toRequestMembers(task.users?.cc), transformMembers(args.addCc), transformMembers(args.removeCc)),
    };
  } else if (usersPartial) {
    changes.users = {
      to: args.assignees !== undefined ? transformMembers(args.assignees) ?? [] : toRequestMembers(task.users?.to),
      cc: args.cc !== undefined ? transformMembers(args.cc) ?? [] : toRequestMembers(task.users?.cc),
    };
  }

  if (tagsIncremental) {
    const removeIds = new Set(args.removeTagIds || []);
    const currentIds = (task.tags || []).map(tag => tag.id);
    changes.tagIds = [...new Set([...currentIds, ...(args.addTagIds || [])])].filter(id => !removeIds.has(id));
  }

  return changes;
}

export async function updateTaskHandler(args: UpdateTaskInput) {
  try {
    const incremental = await resolveChangesAgainstCurrentTask(args);

    // 1. 기본 필드 업데이트 파라미터 구성
    const updateParams: Record<string, unknown> = {};

    if (args.subject !== undefined) updateParams.subject = args.subject;
    if (args.body !== undefined) updateParams.body = args.body;
    if (args.dueDate !== undefined) updateParams.dueDate = args.dueDate;
    if (args.milestoneId !== undefined) updateParams.milestoneId = args.milestoneId;
    if (args.tagIds !== undefined) updateParams.tagIds = args.tagIds;
    if (args.priority !== undefined) updateParams.priority = args.priority;

    // users 필드: assignees 또는 cc가 제공된 경우에만 포함
    if (args.assignees !== undefined || args.cc !== undefined) {
      updateParams.users = {
        to: transformMembers(args.assignees),
        cc: transformMembers(args.cc),
      };
    }

    // 현재 task 기준으로 계산한 담당자, 참조자, 태그 (추가, 제거 옵션이나 한쪽만 넘긴 교체)
    if (incremental.users) updateParams.users = incremental.users;
    if (incremental.tagIds) updateParams.tagIds = incremental.tagIds;

    // 2. 기본 필드 업데이트 (변경사항이 있는 경우만)
    let result = null;
    if (Object.keys(updateParams).length > 0) {
      result = await projectsApi.updateTask(args.projectId, args.taskId, updateParams);
    }

    // 3. workflow 변경 (별도 API 호출)
    if (args.workflowId !== undefined) {
      await projectsApi.setTaskWorkflow(args.projectId, args.taskId, args.workflowId);
    }

    // 4. 상위 업무 설정 (별도 API 호출)
    if (args.parentPostId !== undefined) {
      await projectsApi.setParentPost(args.projectId, args.taskId, args.parentPostId);
    }

    // 5. 최종 task 상태 반환 (수정 API 는 result 가 null 이라 다시 조회한다). 본문은 길이만 남긴다
    if (!result) {
      result = await projectsApi.getTaskDetails(args.taskId, args.projectId);
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(omitTaskBodyContent(result)),
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Error: ${formatError(error)}`,
        },
      ],
      isError: true,
    };
  }
}

export const updateTaskTool = {
  name: 'update-task',
  description: `Update an existing task in a Dooray project.

Only provide the fields you want to change. Fields you leave out keep their current values, so get-task is not needed first.

**Fields**:
- **Assignees, CC**: assignees and cc each REPLACE that list. Passing only one of them keeps the other list. addAssignees, removeAssignees, addCc, removeCc change only the members you list. Do not combine add/remove options with assignees or cc
  - Member options: get-my-member-info, get-project-member-list, get-project-member-group-list. Format {"id": "...", "type": "member|group|email"} ("member": organizationMemberId, "group": group id, "email": email address)
- **Tags**: tagIds REPLACES all tags. addTagIds, removeTagIds change only the tags you list. Do not combine them with tagIds
  - Check get-tag-list first: tags from every mandatory tag group (tagGroup.mandatory=true) must remain or the update fails with 500. tagGroup.selectOne=true allows exactly one tag from that group
- **Workflow**: workflowId from get-project-workflow-list. Classes: backlog (대기), registered (등록/할 일), working (진행 중), closed (완료)
- **Parent (상위 업무)**: parentPostId. A task that already has sub-tasks cannot be set as a parent
- **Korean Terms**: "to" = 담당자 (assignee), "cc" = 참조 (reference)
- **Priority**: Use "none" to remove priority

**URL Pattern Recognition**:
When given a Dooray task URL like "https://nhnent.dooray.com/task/PROJECT_ID/TASK_ID":
- Extract the first numeric ID after "/task/" as projectId
- Extract the second numeric ID as taskId

**Examples**:
- Change priority: {"projectId": "123", "taskId": "42", "priority": "high"}
- Replace assignees, keep CC: {"projectId": "123", "taskId": "42", "assignees": [{"id": "user123", "type": "member"}]}
- Change status: {"projectId": "123", "taskId": "42", "workflowId": "ID from get-project-workflow-list"}
- Update tags: {"projectId": "123", "taskId": "42", "tagIds": ["tag1", "tag2"]}
- Clear milestone: {"projectId": "123", "taskId": "42", "milestoneId": null}
- Set parent task: {"projectId": "123", "taskId": "42", "parentPostId": "99"}
- Add a CC, keep others: {"projectId": "123", "taskId": "42", "addCc": [{"id": "user456", "type": "member"}]}
- Add and remove tags: {"projectId": "123", "taskId": "42", "addTagIds": ["tag3"], "removeTagIds": ["tag1"]}

Returns: Updated task. The body is returned as mimeType and contentLength. Use get-task to read the body.`,
  inputSchema: {
    type: 'object',
    properties: {
      projectId: {
        type: 'string',
        description: 'Project ID where the task belongs',
      },
      taskId: {
        type: 'string',
        description: 'Task ID to update',
      },
      subject: {
        type: 'string',
        description: 'New task subject/title',
      },
      body: {
        type: 'object',
        properties: {
          mimeType: {
            type: 'string',
            enum: ['text/x-markdown', 'text/html'],
          },
          content: {
            type: 'string',
          },
        },
        required: ['mimeType', 'content'],
        description: 'New task body content',
      },
      assignees: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            type: { type: 'string', enum: ['member', 'group', 'email'] },
          },
          required: ['id', 'type'],
        },
        description: 'New complete list of assignees (담당자). REPLACES all existing assignees. CC is kept when cc is not passed. To get options: (1) use get-my-member-info for current user, (2) use get-project-member-list for project members, (3) use get-project-member-group-list for member groups. Each assignee object has {id: string, type: "member"|"group"|"email"}.',
      },
      cc: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            type: { type: 'string', enum: ['member', 'group', 'email'] },
          },
          required: ['id', 'type'],
        },
        description: 'New complete list of CC recipients (참조). REPLACES all existing CC recipients. Assignees are kept when assignees is not passed. To get options: (1) use get-my-member-info for current user, (2) use get-project-member-list for project members, (3) use get-project-member-group-list for member groups. Each CC object has {id: string, type: "member"|"group"|"email"}.',
      },
      dueDate: {
        type: 'string',
        description: 'New due date in ISO 8601 format',
      },
      milestoneId: {
        type: ['string', 'null'],
        description: 'New milestone ID, or null to remove milestone',
      },
      tagIds: {
        type: 'array',
        items: { type: 'string' },
        description: 'New complete array of tag IDs. REPLACES all existing tags. IMPORTANT: Check for mandatory tag groups using get-tag-list tool. Projects may require specific tags from mandatory tag groups, or update will fail with 500 error.',
      },
      priority: {
        type: 'string',
        enum: ['highest', 'high', 'normal', 'low', 'lowest', 'none'],
        description: 'Task priority level (highest, high, normal, low, lowest, none)',
      },
      workflowId: {
        type: 'string',
        description: 'New workflow ID (status). Use get-project-workflow-list to see available workflow statuses for this project. Workflow classes: backlog (대기), registered (등록/할 일), working (진행 중), closed (완료).',
      },
      parentPostId: {
        type: 'string',
        description: 'Parent task ID to set as parent (상위 업무 설정). Nested hierarchy is NOT allowed: a task that already has sub-tasks cannot be set as a parent.',
      },
      addAssignees: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            type: { type: 'string', enum: ['member', 'group', 'email'] },
          },
          required: ['id', 'type'],
        },
        description: 'Assignees to add, keeping current ones. Cannot be combined with assignees or cc.',
      },
      removeAssignees: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            type: { type: 'string', enum: ['member', 'group', 'email'] },
          },
          required: ['id', 'type'],
        },
        description: 'Assignees to remove. Cannot be combined with assignees or cc.',
      },
      addCc: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            type: { type: 'string', enum: ['member', 'group', 'email'] },
          },
          required: ['id', 'type'],
        },
        description: 'CC recipients to add, keeping current ones. Cannot be combined with assignees or cc.',
      },
      removeCc: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            type: { type: 'string', enum: ['member', 'group', 'email'] },
          },
          required: ['id', 'type'],
        },
        description: 'CC recipients to remove. Cannot be combined with assignees or cc.',
      },
      addTagIds: {
        type: 'array',
        items: { type: 'string' },
        description: 'Tag IDs to add, keeping current tags. Cannot be combined with tagIds.',
      },
      removeTagIds: {
        type: 'array',
        items: { type: 'string' },
        description: 'Tag IDs to remove. Cannot be combined with tagIds.',
      },
    },
    required: ['projectId', 'taskId'],
  },
};
