/**
 * Get Task Comment Tool
 * Get a single comment on a task
 */

import { z } from 'zod';
import * as projectsApi from '../../api/projects.js';
import { formatError } from '../../utils/errors.js';

export const getTaskCommentSchema = z.object({
  projectId: z.string().describe('Project ID'),
  taskId: z.string().describe('Task ID'),
  commentId: z.string().describe('Comment ID'),
});

export type GetTaskCommentInput = z.infer<typeof getTaskCommentSchema>;

export async function getTaskCommentHandler(args: GetTaskCommentInput) {
  try {
    const result = await projectsApi.getTaskComment(args.projectId, args.taskId, args.commentId);

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

export const getTaskCommentTool = {
  name: 'get-task-comment',
  description: `Get a single comment (댓글) on a Dooray task with its full body.

Use the comment ID from get-task-comment-list. Call this before update-task-comment to get the current body.

**Examples**:
- {"projectId": "123", "taskId": "456", "commentId": "789"}

Returns: comment with id, type, subtype, createdAt, creator, body {mimeType, content}, files.`,
  inputSchema: {
    type: 'object',
    properties: {
      projectId: {
        type: 'string',
        description: 'Project ID',
      },
      taskId: {
        type: 'string',
        description: 'Task ID',
      },
      commentId: {
        type: 'string',
        description: 'Comment ID',
      },
    },
    required: ['projectId', 'taskId', 'commentId'],
  },
};
