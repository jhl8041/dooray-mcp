/**
 * Delete Task Comment Tool
 * Delete a comment on a task
 */

import { z } from 'zod';
import * as projectsApi from '../../api/projects.js';
import { formatError } from '../../utils/errors.js';

export const deleteTaskCommentSchema = z.object({
  projectId: z.string().describe('Project ID'),
  taskId: z.string().describe('Task ID'),
  commentId: z.string().describe('Comment ID'),
});

export type DeleteTaskCommentInput = z.infer<typeof deleteTaskCommentSchema>;

export async function deleteTaskCommentHandler(args: DeleteTaskCommentInput) {
  try {
    await projectsApi.deleteTaskComment(args.projectId, args.taskId, args.commentId);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({ success: true, message: 'Comment deleted successfully' }, null, 2),
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

export const deleteTaskCommentTool = {
  name: 'delete-task-comment',
  description: `Delete a comment (댓글) on a Dooray task. This cannot be undone.

Confirm the target with get-task-comment before deleting.

**Examples**:
- {"projectId": "123", "taskId": "456", "commentId": "789"}

Returns: success message.`,
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
