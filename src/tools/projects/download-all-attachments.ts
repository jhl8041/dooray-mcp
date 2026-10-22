/**
 * Download All Attachments Tool
 * Download every file attached to a task into a local directory
 */

import { z } from 'zod';
import fs from 'fs';
import path from 'path';
import * as projectsApi from '../../api/projects.js';
import { formatError } from '../../utils/errors.js';

export const downloadAllAttachmentsSchema = z.object({
  projectId: z.string().describe('Project ID'),
  taskId: z.string().describe('Task ID (post ID)'),
  saveDir: z.string().describe('Local directory to save the files into (created if missing)'),
  overwrite: z.boolean().optional().describe('Overwrite files that already exist (default: false)'),
});

export type DownloadAllAttachmentsInput = z.infer<typeof downloadAllAttachmentsSchema>;

/**
 * Keep only the file name part so a server-provided name cannot escape saveDir
 */
function safeFileName(name: string | undefined, fileId: string): string {
  const base = path.basename(name || '').trim();
  return base && base !== '.' && base !== '..' ? base : `attachment-${fileId}`;
}

export async function downloadAllAttachmentsHandler(args: DownloadAllAttachmentsInput) {
  try {
    const attachments = await projectsApi.getTaskAttachments({ projectId: args.projectId, taskId: args.taskId });
    fs.mkdirSync(args.saveDir, { recursive: true });

    const succeeded: Array<{ fileId: string; savedTo: string; size: number }> = [];
    const failed: Array<{ fileId: string; name?: string; error: string }> = [];

    // Download one by one to stay under the API rate limit
    for (const attachment of attachments.data) {
      try {
        const targetPath = path.join(args.saveDir, safeFileName(attachment.name, attachment.id));
        if (fs.existsSync(targetPath) && !args.overwrite) {
          throw new Error(`File already exists: ${targetPath}. Set overwrite to true to replace it`);
        }

        const result = await projectsApi.downloadTaskAttachment(args.projectId, args.taskId, attachment.id);
        fs.writeFileSync(targetPath, Buffer.from(result.data));
        succeeded.push({ fileId: attachment.id, savedTo: targetPath, size: result.data.byteLength });
      } catch (error) {
        failed.push({ fileId: attachment.id, name: attachment.name, error: formatError(error) });
      }
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({ count: attachments.data.length, succeeded, failed }, null, 2),
        },
      ],
      // Partial failure is still an error so the caller checks the failed list
      ...(failed.length > 0 && { isError: true }),
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

export const downloadAllAttachmentsTool = {
  name: 'download-all-attachments',
  description: `Download every file attached to a Dooray task into a local directory (첨부 일괄 다운로드).

Files are saved with their original names. Existing files are not overwritten unless overwrite is true.
If some files fail, the others are still downloaded and the result lists both succeeded and failed files.

**Examples**:
- {"projectId": "123", "taskId": "456", "saveDir": "/tmp/task-456/"}

Returns: count, succeeded [{fileId, savedTo, size}], failed [{fileId, name, error}].`,
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
      saveDir: {
        type: 'string',
        description: 'Local directory to save the files into (created if missing)',
      },
      overwrite: {
        type: 'boolean',
        description: 'Overwrite files that already exist (default: false)',
      },
    },
    required: ['projectId', 'taskId', 'saveDir'],
  },
};
