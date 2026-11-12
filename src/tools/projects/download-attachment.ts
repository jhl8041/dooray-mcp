/**
 * Download Attachment Tool
 * Download a file attachment from a task
 */

import { z } from 'zod';
import fs from 'fs';
import path from 'path';
import * as projectsApi from '../../api/projects.js';
import { formatError } from '../../utils/errors.js';

export const downloadAttachmentSchema = z.object({
  projectId: z.string().describe('Project ID'),
  taskId: z.string().describe('Task ID (post ID)'),
  fileId: z.string().describe('File ID'),
  savePath: z.string().optional().describe('Local file path to save the downloaded file. If omitted, returns base64 data (only suitable for small files)'),
});

export type DownloadAttachmentInput = z.infer<typeof downloadAttachmentSchema>;

/**
 * Extract filename from Content-Disposition header
 */
function extractFilename(contentDisposition?: string): string | undefined {
  if (!contentDisposition) return undefined;

  // Try to extract filename from header
  // Format: attachment; filename="example.pdf" or attachment; filename*=UTF-8''example.pdf
  const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
  if (filenameMatch) {
    let filename = filenameMatch[1].replace(/['"]/g, '');
    // Handle URL-encoded filenames
    try {
      filename = decodeURIComponent(filename);
    } catch {
      // If decoding fails, use as-is
    }
    return filename;
  }
  return undefined;
}

export async function downloadAttachmentHandler(args: DownloadAttachmentInput) {
  try {
    const result = await projectsApi.downloadTaskAttachment(
      args.projectId,
      args.taskId,
      args.fileId
    );

    // Extract filename from Content-Disposition header
    const filename = extractFilename(result.contentDisposition);

    if (args.savePath) {
      // Save to local file
      let targetPath = args.savePath;
      const isDirectory = targetPath.endsWith('/') ||
        (fs.existsSync(targetPath) && fs.statSync(targetPath).isDirectory());

      if (isDirectory) {
        if (!fs.existsSync(targetPath)) {
          fs.mkdirSync(targetPath, { recursive: true });
        }
        targetPath = path.join(targetPath, filename || `attachment-${args.fileId}`);
      } else {
        const dir = path.dirname(targetPath);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
      }

      fs.writeFileSync(targetPath, Buffer.from(result.data));

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: true,
              fileId: args.fileId,
              filename: filename,
              contentType: result.contentType,
              contentLength: result.contentLength,
              savedTo: targetPath,
              message: `File saved to "${targetPath}" (${result.contentLength} bytes)`,
            }),
          },
        ],
      };
    }

    // Convert ArrayBuffer to Base64 (for small files)
    const base64Data = Buffer.from(result.data).toString('base64');

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: true,
            fileId: args.fileId,
            filename: filename,
            contentType: result.contentType,
            contentLength: result.contentLength,
            base64Data: base64Data,
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

export const downloadAttachmentTool = {
  name: 'download-attachment',
  description: `Download a file attachment from a Dooray task.

**Required Parameters:**
- projectId: The project ID
- taskId: The task ID (post ID)
- fileId: The file ID (get from get-attachment-list)

**Optional:**
- savePath: Local path to save the file. Can be a directory (filename auto-detected) or full file path. **Recommended for large files.**

**Examples:**
- Save to file: { "projectId": "123", "taskId": "456", "fileId": "789", "savePath": "/tmp/downloads/" }
- Base64 (small files): { "projectId": "123", "taskId": "456", "fileId": "789" }

**Response Fields:**
- success: Whether download succeeded
- fileId: The file ID
- filename: Original filename
- contentType: MIME type of the file
- contentLength: File size in bytes
- savedTo: (when savePath used) Local path where file was saved
- base64Data: (when savePath omitted) Base64 encoded file content`,
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
      savePath: {
        type: 'string',
        description: 'Local path to save (directory or full path). Recommended for large files.',
      },
    },
    required: ['projectId', 'taskId', 'fileId'],
  },
};
