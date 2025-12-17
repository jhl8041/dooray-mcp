/**
 * Create Task Tool
 * Create a new task in a project
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

export const createTaskSchema = z.object({
  projectId: z.string().describe('Project ID where the task will be created'),
  parentPostId: z.string().optional().describe('Parent task ID to create this as a subtask'),
  isDraft: z.boolean().optional().describe('Set to true to create a draft task (임시 업무) that can be continued in the browser. Default: false'),
  subject: z.string().describe('Task subject/title'),
  body: bodySchema.optional().describe('Task body content'),
  assignees: z.array(memberSchema).optional().describe('List of assignees'),
  cc: z.array(memberSchema).optional().describe('List of CC recipients'),
  dueDate: z.string().optional().describe('Due date (ISO 8601 format: YYYY-MM-DDTHH:mm:ssZ)'),
  milestoneId: z.string().optional().describe('Milestone ID'),
  tagIds: z.array(z.string()).optional().describe('Array of tag IDs'),
  priority: z.enum(['highest', 'high', 'normal', 'low', 'lowest', 'none']).optional().describe('Task priority level'),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;

export async function createTaskHandler(args: CreateTaskInput) {
  try {
    const isDraft = args.isDraft || false;
    
    const apiParams = {
      projectId: args.projectId,
      parentPostId: args.parentPostId,
      subject: args.subject,
      body: args.body,
      users: {
        to: transformMembers(args.assignees),
        cc: transformMembers(args.cc),
      },
      dueDate: args.dueDate,
      milestoneId: args.milestoneId,
      tagIds: args.tagIds,
      priority: args.priority,
    };

    if (isDraft) {
      // Create draft task
      const result = await projectsApi.createDraftTask(apiParams);
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              id: result.id,
              url: result.url,
              message: 'Draft task created successfully. Open the URL in your browser to continue editing.',
            }, null, 2),
          },
        ],
      };
    } else {
      // Create regular task
      const result = await projectsApi.createTask(apiParams);

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    }
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

export const createTaskTool = {
  name: 'create-task',
  description: `Create a new task (업무) in a Dooray project. Required: projectId, subject.

**DRAFT vs REGULAR**: ASK USER which type to create:
- **Draft (isDraft: true)**: Returns URL to continue editing in browser. Use for complex tasks or when user wants to review.
- **Regular (isDraft: false, default)**: Saves immediately. Use when all info is available.

**INTERACTIVE WORKFLOW**:
1. **Templates**: Ask about get-project-template-list. If yes, use get-project-template for defaults.
2. **Content**: Get subject and body. If no template and no body, ask user for details.
3. **Assignees/CC**: Use get-my-member-info, get-project-member-list, or get-project-member-group-list. Format: {id, type: "member|group|email"}
4. **Tags**: Call get-tag-list. **CRITICAL**: Check mandatory tag groups - must select or creation fails (500 error). selectOne=true requires exactly ONE tag from group.

**Key Points**:
- Priority defaults to "none"
- Set parentPostId for subtasks (하위업무)
- Extract PROJECT_ID from URLs like "https://nhnent.dooray.com/task/PROJECT_ID"

**Examples**:
- Draft: {"projectId": "123", "subject": "Bug fix", "isDraft": true}
- Regular: {"projectId": "123", "subject": "Deploy", "assignees": [{"id": "user1", "type": "member"}], "tagIds": ["tag1"], "priority": "high"}

Returns: Task object (regular) or {id, url, message} (draft).`,
  inputSchema: {
    type: 'object',
    properties: {
      projectId: {
        type: 'string',
        description: 'Project ID where the task will be created',
      },
      parentPostId: {
        type: 'string',
        description: 'Parent task ID to create this as a subtask (하위업무). Omit to create a regular task.',
      },
      isDraft: {
        type: 'boolean',
        description: 'Set to true to create a draft task (임시 업무) that can be continued in the browser. Returns a URL for further editing. Default: false (creates regular task).',
      },
      subject: {
        type: 'string',
        description: 'Task subject/title (required)',
      },
      body: {
        type: 'object',
        properties: {
          mimeType: {
            type: 'string',
            enum: ['text/x-markdown', 'text/html'],
            description: 'Content format',
          },
          content: {
            type: 'string',
            description: 'Task body content',
          },
        },
        required: ['mimeType', 'content'],
        description: 'Task body with formatted content. IMPORTANT: If user has not provided body content and no template is selected, ask the user for task details/description before creating the task.',
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
        description: 'List of assignees (담당자). To get assignee options: (1) use get-my-member-info for current user, (2) use get-project-member-list for project members, (3) use get-project-member-group-list for member groups. Each assignee object has {id: string, type: "member"|"group"|"email"}.',
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
        description: 'List of CC recipients (참조). To get CC options: (1) use get-my-member-info for current user, (2) use get-project-member-list for project members, (3) use get-project-member-group-list for member groups. Each CC object has {id: string, type: "member"|"group"|"email"}.',
      },
      dueDate: {
        type: 'string',
        description: 'Due date in ISO 8601 format (YYYY-MM-DDTHH:mm:ssZ)',
      },
      milestoneId: {
        type: 'string',
        description: 'Milestone ID to associate with this task',
      },
      tagIds: {
        type: 'array',
        items: { type: 'string' },
        description: 'Array of tag IDs to apply to this task. IMPORTANT: Check for mandatory tag groups using get-tag-list tool. Projects may require specific tags from mandatory tag groups.',
      },
      priority: {
        type: 'string',
        enum: ['highest', 'high', 'normal', 'low', 'lowest', 'none'],
        description: 'Task priority level (highest, high, normal, low, lowest, none). Default: "none" if not specified by user.',
      },
    },
    required: ['projectId', 'subject'],
  },
};
