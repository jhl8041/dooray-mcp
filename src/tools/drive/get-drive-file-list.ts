/**
 * Get Drive File List Tool
 * Get list of files and folders in a drive
 */

import { z } from 'zod';
import * as driveApi from '../../api/drive.js';
import { formatError } from '../../utils/errors.js';

export const getDriveFileListSchema = z.object({
  driveId: z.string().describe('Drive ID'),
  parentId: z.string().optional().describe('Parent folder ID. Use "root" for top-level items'),
  type: z.enum(['folder', 'file']).optional().describe('Filter by type: folder or file'),
  subTypes: z.string().optional().describe('Filter by subTypes (e.g. "root,trash")'),
  page: z.number().optional().describe('Page number (0-based)'),
  size: z.number().optional().describe('Page size'),
});

export type GetDriveFileListInput = z.infer<typeof getDriveFileListSchema>;

export async function getDriveFileListHandler(args: GetDriveFileListInput) {
  try {
    const result = await driveApi.getDriveFiles(args);
    return { content: [{ type: 'text', text: JSON.stringify(result) }] };
  } catch (error) {
    return { content: [{ type: 'text', text: `Error: ${formatError(error)}` }], isError: true };
  }
}

export const getDriveFileListTool = {
  name: 'get-drive-file-list',
  description: `Get list of files and folders in a Dooray drive.

**Required:** driveId
**Optional:** parentId (use "root" for top-level), type filter, pagination

**Examples:**
- Top-level: { "driveId": "123", "parentId": "root" }
- Subfolder: { "driveId": "123", "parentId": "456" }
- Only folders: { "driveId": "123", "parentId": "root", "type": "folder" }
- With pagination: { "driveId": "123", "parentId": "root", "page": 0, "size": 20 }

Returns: file/folder ID, name, type, size, dates, creator info.`,
  inputSchema: {
    type: 'object',
    properties: {
      driveId: { type: 'string', description: 'Drive ID' },
      parentId: { type: 'string', description: 'Parent folder ID (use "root" for top-level)' },
      type: { type: 'string', enum: ['folder', 'file'], description: 'Filter by type' },
      subTypes: { type: 'string', description: 'Filter by subTypes (e.g. "root,trash")' },
      page: { type: 'number', description: 'Page number (0-based)' },
      size: { type: 'number', description: 'Page size' },
    },
    required: ['driveId'],
  },
};
