/**
 * Download Drive File Tool
 * Download a file from a drive
 */

import { z } from 'zod';
import fs from 'fs';
import path from 'path';
import * as driveApi from '../../api/drive.js';
import { formatError } from '../../utils/errors.js';

export const downloadDriveFileSchema = z.object({
  driveId: z.string().describe('Drive ID'),
  fileId: z.string().describe('File ID to download'),
  savePath: z.string().optional().describe('Local file path to save the downloaded file. If omitted, returns base64 data (only suitable for small files)'),
});

export type DownloadDriveFileInput = z.infer<typeof downloadDriveFileSchema>;

/**
 * Extract filename from Content-Disposition header
 */
function extractFilename(contentDisposition?: string): string | undefined {
  if (!contentDisposition) return undefined;

  const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
  if (filenameMatch) {
    let filename = filenameMatch[1].replace(/['"]/g, '');
    try {
      filename = decodeURIComponent(filename);
    } catch {
      // If decoding fails, use as-is
    }
    return filename;
  }
  return undefined;
}

export async function downloadDriveFileHandler(args: DownloadDriveFileInput) {
  try {
    const result = await driveApi.downloadDriveFile(args.driveId, args.fileId);
    const filename = extractFilename(result.contentDisposition);

    if (args.savePath) {
      // Save to local file
      let targetPath = args.savePath;
      const isDirectory = targetPath.endsWith('/') ||
        (fs.existsSync(targetPath) && fs.statSync(targetPath).isDirectory());

      if (isDirectory) {
        // Ensure directory exists
        if (!fs.existsSync(targetPath)) {
          fs.mkdirSync(targetPath, { recursive: true });
        }
        targetPath = path.join(targetPath, filename || `drive-file-${args.fileId}`);
      } else {
        // Ensure parent directory exists
        const dir = path.dirname(targetPath);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
      }

      fs.writeFileSync(targetPath, Buffer.from(result.data));

      return {
        content: [{
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
        }],
      };
    }

    // Return base64 (for small files)
    const base64Data = Buffer.from(result.data).toString('base64');

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          success: true,
          fileId: args.fileId,
          filename: filename,
          contentType: result.contentType,
          contentLength: result.contentLength,
          base64Data: base64Data,
        }),
      }],
    };
  } catch (error) {
    return { content: [{ type: 'text', text: `Error: ${formatError(error)}` }], isError: true };
  }
}

export const downloadDriveFileTool = {
  name: 'download-drive-file',
  description: `Download a file from a Dooray drive.

**Required:**
- driveId: The drive ID
- fileId: The file ID to download

**Optional:**
- savePath: Local path to save the file. Can be a directory (filename auto-detected) or full file path. **Recommended for large files.**

**Examples:**
- Save to file: { "driveId": "123", "fileId": "456", "savePath": "/tmp/downloads/" }
- Save with name: { "driveId": "123", "fileId": "456", "savePath": "/tmp/myfile.pdf" }
- Base64 (small files): { "driveId": "123", "fileId": "456" }

**Tip:** If you only have a file ID, use get-drive-file-meta first to get the driveId.`,
  inputSchema: {
    type: 'object',
    properties: {
      driveId: { type: 'string', description: 'Drive ID' },
      fileId: { type: 'string', description: 'File ID to download' },
      savePath: { type: 'string', description: 'Local path to save (directory or full path). Recommended for large files.' },
    },
    required: ['driveId', 'fileId'],
  },
};
