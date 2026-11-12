/**
 * Get Attachment List Tool
 * Get list of attachments for a task
 */

import { z } from 'zod';
import * as projectsApi from '../../api/projects.js';
import { formatError } from '../../utils/errors.js';

export const getAttachmentListSchema = z.object({
  projectId: z.string().describe('Project ID'),
  taskId: z.string().describe('Task ID (post ID)'),
});

export type GetAttachmentListInput = z.infer<typeof getAttachmentListSchema>;

export async function getAttachmentListHandler(args: GetAttachmentListInput) {
  try {
    const result = await projectsApi.getTaskAttachments({
      projectId: args.projectId,
      taskId: args.taskId,
    });

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result),
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

export const getAttachmentListTool = {
  name: 'get-attachment-list',
  description: `Get list of file attachments for a Dooray task.

**Required Parameters:**
- projectId: The project ID
- taskId: The task ID (post ID)

**Note:** This API returns only "general" type files attached to the task.

**Example:**
{
  "projectId": "123456",
  "taskId": "789012"
}

**Returns:** List of attachments with id, name, size, mimeType, createdAt, and creator info.

**Response Fields:**
- totalCount: Total number of files
- data[]: Array of file objects
  - id: File ID
  - name: File name
  - size: File size
  - mimeType: MIME type
  - createdAt: Creation timestamp (ISO-8601)
  - creator: Creator info (type, member.organizationMemberId)`,
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
    },
    required: ['projectId', 'taskId'],
  },
};
