/**
 * Download Wiki Page File Tool
 * Download a file attached to a wiki page
 */

import { z } from 'zod';
import fs from 'fs';
import path from 'path';
import * as wikiApi from '../../api/wiki.js';
import { formatError } from '../../utils/errors.js';

export const downloadWikiPageFileSchema = z.object({
  wikiId: z.string().describe('Wiki ID'),
  pageId: z.string().describe('Wiki page ID'),
  fileId: z.string().describe('File ID (from page detail API response $.result.files.id or $.result.images.id)'),
  savePath: z.string().optional().describe('Local file path to save the downloaded file. If omitted, returns base64 data (only suitable for small files)'),
});

export type DownloadWikiPageFileInput = z.infer<typeof downloadWikiPageFileSchema>;

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

export async function downloadWikiPageFileHandler(args: DownloadWikiPageFileInput) {
  try {
    const result = await wikiApi.downloadWikiPageFile(
      args.wikiId,
      args.pageId,
      args.fileId
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
        targetPath = path.join(targetPath, filename || `wiki-file-${args.fileId}`);
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
            fileId: args.fileId,
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

export const downloadWikiPageFileTool = {
  name: 'download-wiki-page-file',
  description: `Download a file attached to a Dooray wiki page.

**Required Parameters:**
- wikiId: The wiki ID
- pageId: The wiki page ID
- fileId: The file ID (get from wiki page detail API: $.result.files.id or $.result.images.id)

**Optional:**
- savePath: Local path to save the file. Can be a directory (filename auto-detected) or full file path. **Recommended for large files.**

**Examples:**
- Save to file: { "wikiId": "123", "pageId": "456", "fileId": "789", "savePath": "/tmp/downloads/" }
- Base64 (small files): { "wikiId": "123", "pageId": "456", "fileId": "789" }

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
      wikiId: {
        type: 'string',
        description: 'Wiki ID',
      },
      pageId: {
        type: 'string',
        description: 'Wiki page ID',
      },
      fileId: {
        type: 'string',
        description: 'File ID (from page detail API)',
      },
      savePath: {
        type: 'string',
        description: 'Local path to save (directory or full path). Recommended for large files.',
      },
    },
    required: ['wikiId', 'pageId', 'fileId'],
  },
};
