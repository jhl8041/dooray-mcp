/**
 * Delete Attachment Tool
 * Delete a file attachment from a task
 */

import { z } from 'zod';
import * as projectsApi from '../../api/projects.js';
import { formatError } from '../../utils/errors.js';

export const deleteAttachmentSchema = z.object({
  projectId: z.string().describe('Project ID'),
  taskId: z.string().describe('Task ID (post ID)'),
  fileId: z.string().describe('File ID to delete'),
});

export type DeleteAttachmentInput = z.infer<typeof deleteAttachmentSchema>;

export async function deleteAttachmentHandler(args: DeleteAttachmentInput) {
  try {
    await projectsApi.deleteTaskAttachment(
      args.projectId,
      args.taskId,
      args.fileId
    );

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: true,
            message: `File ${args.fileId} successfully deleted from task.`,
          }),
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

export const deleteAttachmentTool = {
  name: 'delete-attachment',
  description: `Delete a file attachment from a Dooray task.

**Required Parameters:**
- projectId: The project ID
- taskId: The task ID (post ID)
- fileId: The file ID to delete (get from get-attachment-list)

**Example:**
{
  "projectId": "123456",
  "taskId": "789012",
  "fileId": "abc123"
}

**Returns:** Success message confirming deletion.

**Note:** This action is irreversible. The file will be permanently removed from the task.`,
  inputSchema: {
    type: 'object',
    properties: {
      projectId: {
        type: 'string',
        description: 'Project ID',
      },
      taskId: {
        type: 'string',
        description: 'Task ID (post ID)',
      },
      fileId: {
        type: 'string',
        description: 'File ID to delete',
      },
    },
    required: ['projectId', 'taskId', 'fileId'],
  },
};
