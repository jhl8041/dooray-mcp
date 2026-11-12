/**
 * Rename Drive File Tool
 * Rename a file or folder in a drive
 */

import { z } from 'zod';
import * as driveApi from '../../api/drive.js';
import { formatError } from '../../utils/errors.js';

export const renameDriveFileSchema = z.object({
  driveId: z.string().describe('Drive ID'),
  fileId: z.string().describe('File or folder ID to rename'),
  name: z.string().describe('New name'),
});

export type RenameDriveFileInput = z.infer<typeof renameDriveFileSchema>;

export async function renameDriveFileHandler(args: RenameDriveFileInput) {
  try {
    await driveApi.renameDriveFile(args);
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          success: true,
          message: `File/folder renamed to "${args.name}" successfully.`,
        }),
      }],
    };
  } catch (error) {
    return { content: [{ type: 'text', text: `Error: ${formatError(error)}` }], isError: true };
  }
}

export const renameDriveFileTool = {
  name: 'rename-drive-file',
  description: `Rename a file or folder in a Dooray drive.

**Required:**
- driveId: The drive ID
- fileId: File or folder ID to rename
- name: New name

**Example:**
{ "driveId": "123", "fileId": "456", "name": "new-name.txt" }`,
  inputSchema: {
    type: 'object',
    properties: {
      driveId: { type: 'string', description: 'Drive ID' },
      fileId: { type: 'string', description: 'File or folder ID' },
      name: { type: 'string', description: 'New name' },
    },
    required: ['driveId', 'fileId', 'name'],
  },
};
