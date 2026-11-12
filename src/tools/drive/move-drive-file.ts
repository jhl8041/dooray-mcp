/**
 * Move Drive File Tool
 * Move a file or folder to another location
 */

import { z } from 'zod';
import * as driveApi from '../../api/drive.js';
import { formatError } from '../../utils/errors.js';

export const moveDriveFileSchema = z.object({
  driveId: z.string().describe('Drive ID'),
  fileId: z.string().describe('File or folder ID to move'),
  destinationFileId: z.string().describe('Destination folder ID. Use "trash" to move to trash'),
});

export type MoveDriveFileInput = z.infer<typeof moveDriveFileSchema>;

export async function moveDriveFileHandler(args: MoveDriveFileInput) {
  try {
    await driveApi.moveDriveFile(args);
    const dest = args.destinationFileId === 'trash' ? 'trash' : `folder ${args.destinationFileId}`;
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          success: true,
          message: `File/folder moved to ${dest} successfully.`,
        }),
      }],
    };
  } catch (error) {
    return { content: [{ type: 'text', text: `Error: ${formatError(error)}` }], isError: true };
  }
}

export const moveDriveFileTool = {
  name: 'move-drive-file',
  description: `Move a file or folder in a Dooray drive.

**Required:**
- driveId: The drive ID
- fileId: File or folder ID to move
- destinationFileId: Target folder ID, or "trash" to move to trash

**Examples:**
- Move to folder: { "driveId": "123", "fileId": "456", "destinationFileId": "789" }
- Move to trash: { "driveId": "123", "fileId": "456", "destinationFileId": "trash" }

**Note:** To permanently delete, first move to trash, then use delete-drive-file.`,
  inputSchema: {
    type: 'object',
    properties: {
      driveId: { type: 'string', description: 'Drive ID' },
      fileId: { type: 'string', description: 'File or folder ID to move' },
      destinationFileId: { type: 'string', description: 'Destination folder ID or "trash"' },
    },
    required: ['driveId', 'fileId', 'destinationFileId'],
  },
};
