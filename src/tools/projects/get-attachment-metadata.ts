/**
 * Get Attachment Metadata Tool
 * Get metadata of a specific file attachment
 */

import { z } from 'zod';
import * as projectsApi from '../../api/projects.js';
import { formatError } from '../../utils/errors.js';

export const getAttachmentMetadataSchema = z.object({
  projectId: z.string().describe('Project ID'),
  taskId: z.string().describe('Task ID (post ID)'),
  fileId: z.string().describe('File ID'),
});

export type GetAttachmentMetadataInput = z.infer<typeof getAttachmentMetadataSchema>;

export async function getAttachmentMetadataHandler(args: GetAttachmentMetadataInput) {
  try {
    const result = await projectsApi.getTaskAttachmentMetadata(
      args.projectId,
      args.taskId,
      args.fileId
    );

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

export const getAttachmentMetadataTool = {
  name: 'get-attachment-metadata',
  description: `Get metadata of a specific file attachment in a Dooray task.

**Required Parameters:**
- projectId: The project ID
- taskId: The task ID (post ID)
- fileId: The file ID (get from get-attachment-list)

**Example:**
{
  "projectId": "123456",
  "taskId": "789012",
  "fileId": "abc123"
}

**Returns:** File metadata including id, name, size, mimeType, createdAt, and creator info.

**Response Fields:**
- id: File ID
- name: File name
- size: File size
- mimeType: MIME type
- createdAt: Creation timestamp (ISO-8601)
- creator: Creator info (type, member.organizationMemberId)

**Note:** This returns metadata only, not the file content. Use download-attachment to get the actual file.`,
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
        description: 'File ID',
      },
    },
    required: ['projectId', 'taskId', 'fileId'],
  },
};
