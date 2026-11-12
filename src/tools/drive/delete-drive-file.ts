/**
 * Delete Drive File Tool
 * Permanently delete a file from trash
 */

import { z } from 'zod';
import * as driveApi from '../../api/drive.js';
import { formatError } from '../../utils/errors.js';

export const deleteDriveFileSchema = z.object({
  driveId: z.string().describe('Drive ID'),
  fileId: z.string().describe('File ID to permanently delete (must be in trash)'),
});

export type DeleteDriveFileInput = z.infer<typeof deleteDriveFileSchema>;

export async function deleteDriveFileHandler(args: DeleteDriveFileInput) {
  try {
    await driveApi.deleteDriveFile(args.driveId, args.fileId);
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          success: true,
          message: `File permanently deleted.`,
        }),
      }],
    };
  } catch (error) {
    return { content: [{ type: 'text', text: `Error: ${formatError(error)}` }], isError: true };
  }
}

export const deleteDriveFileTool = {
  name: 'delete-drive-file',
  description: `Permanently delete a file from a Dooray drive trash.

**Important:** The file must already be in the trash folder. To move a file to trash first, use move-drive-file with destinationFileId="trash".

**Required:**
- driveId: The drive ID
- fileId: File ID to permanently delete

**Example:**
{ "driveId": "123", "fileId": "456" }`,
  inputSchema: {
    type: 'object',
    properties: {
      driveId: { type: 'string', description: 'Drive ID' },
      fileId: { type: 'string', description: 'File ID (must be in trash)' },
    },
    required: ['driveId', 'fileId'],
  },
};
