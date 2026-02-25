/**
 * Update Task Tool
 * Update an existing task
 */

import { z } from 'zod';
import * as projectsApi from '../../api/projects.js';
import { formatError } from '../../utils/errors.js';
import { transformMembers } from '../../utils/member-transform.js';

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
});

export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;

export async function updateTaskHandler(args: UpdateTaskInput) {
  try {
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

    // 5. 최종 task 상태 반환 (기본 업데이트 없이 workflow나 상위 업무만 변경한 경우)
    if (!result) {
      result = await projectsApi.getTaskDetails(args.taskId, args.projectId);
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2),
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

**RECOMMENDED WORKFLOW** (guide for AI assistants):

1. **Fetch Current Task**: Call get-task to retrieve current values before updating
   - Preserves existing data when only updating specific fields
   - Shows current assignees, tags, milestone, workflow status
   - Use returned data to know what values to preserve

2. **Determine Changes**: Identify what needs updating
   - If changing assignees/cc: Get options from get-my-member-info, get-project-member-list, get-project-member-group-list
   - Member types: {"id": "...", "type": "member|group|email"}
   - "member": organizationMemberId, "group": group id, "email": email address

3. **Handle Tags**: Call get-tag-list if updating tags
   - **CRITICAL**: Check tagGroup.mandatory=true - MUST include tags from all mandatory groups or update fails (500 error)
   - tagGroup.selectOne=true: Select exactly ONE tag from group
   - tagGroup.selectOne=false: Select one or MORE tags from group
   - **IMPORTANT**: tagIds is a COMPLETE replacement, not additive

4. **Handle Workflow**: Use get-project-workflow-list to see available statuses
   - Provide workflowId to change task status
   - Workflow classes: backlog (대기), registered (등록/할 일), working (진행 중), closed (완료)

5. **Handle Parent Post (상위 업무)**: Provide parentPostId to set a parent task
   - Nested hierarchy is NOT allowed: a task that already has sub-tasks cannot be set as a parent

**IMPORTANT NOTES**:
- **Complete Replacement**: assignees, cc, and tagIds completely REPLACE existing values (not merged)
- **Preserve Data**: Only provide fields you want to change; unprovided fields remain unchanged
- **Korean Terms**: "to" = 담당자 (assignee), "cc" = 참조 (reference)
- **Priority**: Use "none" to remove priority

**URL Pattern Recognition**:
When given a Dooray task URL like "https://nhnent.dooray.com/task/PROJECT_ID/TASK_ID":
- Extract the first numeric ID after "/task/" as projectId
- Extract the second numeric ID as taskId

**Examples**:
- Change priority: {"projectId": "123", "taskId": "42", "priority": "high"}
- Update assignees: {"projectId": "123", "taskId": "42", "assignees": [{"id": "user123", "type": "member"}]}
- Change status: {"projectId": "123", "taskId": "42", "workflowId": "working"}
- Update tags: {"projectId": "123", "taskId": "42", "tagIds": ["tag1", "tag2"]}
- Clear milestone: {"projectId": "123", "taskId": "42", "milestoneId": null}
- Set parent task: {"projectId": "123", "taskId": "42", "parentPostId": "99"}

Returns: Updated task with all current details.`,
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
        description: 'New complete list of assignees (담당자). REPLACES all existing assignees. To get options: (1) use get-my-member-info for current user, (2) use get-project-member-list for project members, (3) use get-project-member-group-list for member groups. Each assignee object has {id: string, type: "member"|"group"|"email"}.',
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
        description: 'New complete list of CC recipients (참조). REPLACES all existing CC recipients. To get options: (1) use get-my-member-info for current user, (2) use get-project-member-list for project members, (3) use get-project-member-group-list for member groups. Each CC object has {id: string, type: "member"|"group"|"email"}.',
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
    },
    required: ['projectId', 'taskId'],
  },
};
