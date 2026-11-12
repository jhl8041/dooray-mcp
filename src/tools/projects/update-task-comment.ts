/**
 * Update Task Comment Tool
 * Update an existing comment on a task
 */

import { z } from 'zod';
import * as projectsApi from '../../api/projects.js';
import { formatError } from '../../utils/errors.js';

const bodySchema = z.object({
  content: z.string().describe('Comment content'),
  mimeType: z.enum(['text/x-markdown', 'text/html']).describe('Content format (use text/x-markdown for most cases)'),
});

export const updateTaskCommentSchema = z.object({
  projectId: z.string().describe('Project ID where the task belongs'),
  taskId: z.string().describe('Task ID where the comment exists'),
  commentId: z.string().describe('Comment ID to update'),
  body: bodySchema.optional().describe('New comment content'),
  attachFileIds: z.array(z.string()).optional().describe('Array of file IDs to attach (optional)'),
});

export type UpdateTaskCommentInput = z.infer<typeof updateTaskCommentSchema>;

export async function updateTaskCommentHandler(args: UpdateTaskCommentInput) {
  try {
    await projectsApi.updateTaskComment({
      projectId: args.projectId,
      taskId: args.taskId,
      commentId: args.commentId,
      body: args.body,
      attachFileIds: args.attachFileIds,
    });

    return {
      content: [
        {
          type: 'text',
          text: `Successfully updated comment ${args.commentId}`
        }
      ],
    };
  } catch (error) {
    return {
      content: [{ type: 'text', text: `Error: ${formatError(error)}` }],
      isError: true,
    };
  }
}

export const updateTaskCommentTool = {
  name: 'update-task-comment',
  description: `Update an existing comment (댓글) on a Dooray task.

This tool modifies the content or attachments of an existing task comment.

**IMPORTANT LIMITATION**: Comments created from incoming emails CANNOT be modified. Only regular comments can be updated.

**URL Pattern Recognition**:
When given a Dooray task URL like "https://nhnent.dooray.com/task/PROJECT_ID/TASK_ID" or "https://nhnent.dooray.com/project/tasks/TASK_ID":
- Extract the first numeric ID after "/task/" as projectId (if present)
- Extract the second numeric ID (or the ID after "/tasks/") as taskId
- Use get-task-comment-list to find the comment ID you want to update

**REQUIRED**: projectId, taskId, and commentId are all required.

**Optional Parameters**: You can provide either body, attachFileIds, or both. If you only want to update the text, just provide body. If you only want to update attachments, just provide attachFileIds.

**File Attachments**:
- To attach files, first upload them using the file upload API
- Then provide the returned file IDs in the attachFileIds parameter
- See: https://helpdesk.dooray.com/share/pages/9wWo-xwiR66BO5LGshgVTg/2939987647631384419

**Workflow**:
1. Use get-task-comment-list to find the comment you want to update and get its ID
2. Call update-task-comment with the comment ID and new content/attachments
3. The comment will be modified immediately

**Content Format**:
- Use "text/x-markdown" for markdown formatting (recommended)
- Use "text/html" for rich HTML content
- Body format: {"mimeType": "text/x-markdown", "content": "..."}

**Examples**:
- Update comment text only: {
    "projectId": "123456",
    "taskId": "789012",
    "commentId": "4219415732999317024",
    "body": {
      "mimeType": "text/x-markdown",
      "content": "## Updated Comment\\n\\nThis comment has been revised"
    }
  }

- Update with new attachments: {
    "projectId": "123456",
    "taskId": "789012",
    "commentId": "4219415732999317024",
    "body": {
      "mimeType": "text/x-markdown",
      "content": "See updated files"
    },
    "attachFileIds": ["file123", "file456"]
  }

Returns: Success message upon completion.`,
  inputSchema: {
    type: 'object',
    properties: {
      projectId: {
        type: 'string',
        description: 'Project ID where the task belongs',
      },
      taskId: {
        type: 'string',
        description: 'Task ID where the comment exists',
      },
      commentId: {
        type: 'string',
        description: 'Comment ID to update',
      },
      body: {
        type: 'object',
        properties: {
          content: {
            type: 'string',
            description: 'Comment content',
          },
          mimeType: {
            type: 'string',
            enum: ['text/x-markdown', 'text/html'],
            description: 'Content format (use text/x-markdown for most cases)',
          },
        },
        required: ['content', 'mimeType'],
        description: 'New comment content',
      },
      attachFileIds: {
        type: 'array',
        items: {
          type: 'string',
        },
        description: 'Array of file IDs to attach (optional)',
      },
    },
    required: ['projectId', 'taskId', 'commentId'],
  },
};
