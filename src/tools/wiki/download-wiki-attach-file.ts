/**
 * Download Wiki Attach File Tool
 * Download a file from wiki using attachFileId
 */

import { z } from 'zod';
import fs from 'fs';
import path from 'path';
import * as wikiApi from '../../api/wiki.js';
import { formatError } from '../../utils/errors.js';

export const downloadWikiAttachFileSchema = z.object({
  wikiId: z.string().describe('Wiki ID'),
  attachFileId: z.string().describe('Attach file ID (from page detail API: $.result.files.attachFileId or $.result.images.attachFileId)'),
  savePath: z.string().optional().describe('Local file path to save the downloaded file. If omitted, returns base64 data (only suitable for small files)'),
});

export type DownloadWikiAttachFileInput = z.infer<typeof downloadWikiAttachFileSchema>;

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

export async function downloadWikiAttachFileHandler(args: DownloadWikiAttachFileInput) {
  try {
    const result = await wikiApi.downloadWikiAttachFile(
      args.wikiId,
      args.attachFileId
    );

    const filename = extractFilename(result.contentDisposition);

    if (args.savePath) {
      let targetPath = args.savePath;
      const isDirectory = targetPath.endsWith('/') ||
        (fs.existsSync(targetPath) && fs.statSync(targetPath).isDirectory());

      if (isDirectory) {
        if (!fs.existsSync(targetPath)) {
          fs.mkdirSync(targetPath, { recursive: true });
        }
        targetPath = path.join(targetPath, filename || `wiki-attach-${args.attachFileId}`);
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
              attachFileId: args.attachFileId,
              filename: filename,
              contentType: result.contentType,
              contentLength: result.contentLength,
              savedTo: targetPath,
              message: `File saved to "${targetPath}" (${result.contentLength} bytes)`,
            }, null, 2),
          },
        ],
      };
    }

    const base64Data = Buffer.from(result.data).toString('base64');

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: true,
            attachFileId: args.attachFileId,
            filename: filename,
            contentType: result.contentType,
            contentLength: result.contentLength,
            base64Data: base64Data,
          }, null, 2),
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

export const downloadWikiAttachFileTool = {
  name: 'download-wiki-attach-file',
  description: `Download a file from a Dooray wiki using attach file ID.

**Required Parameters:**
- wikiId: The wiki ID
- attachFileId: The attach file ID (get from wiki page detail API: $.result.files.attachFileId or $.result.images.attachFileId)

**Optional:**
- savePath: Local path to save the file. Can be a directory (filename auto-detected) or full file path. **Recommended for large files.**

**Examples:**
- Save to file: { "wikiId": "123", "attachFileId": "456", "savePath": "/tmp/downloads/" }
- Base64 (small files): { "wikiId": "123", "attachFileId": "456" }

**Note:** The attachFileId is different from fileId. Use this endpoint when you have an attachFileId from the page detail API's $.result.files.attachFileId or $.result.images.attachFileId field.`,
  inputSchema: {
    type: 'object',
    properties: {
      wikiId: {
        type: 'string',
        description: 'Wiki ID',
      },
      attachFileId: {
        type: 'string',
        description: 'Attach file ID (from page detail API)',
      },
      savePath: {
        type: 'string',
        description: 'Local path to save (directory or full path). Recommended for large files.',
      },
    },
    required: ['wikiId', 'attachFileId'],
  },
};
