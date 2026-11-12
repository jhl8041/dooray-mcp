/**
 * Copy Drive File Tool
 * Copy a file to another location
 */

import { z } from 'zod';
import * as driveApi from '../../api/drive.js';
import { formatError } from '../../utils/errors.js';

export const copyDriveFileSchema = z.object({
  driveId: z.string().describe('Source drive ID'),
  fileId: z.string().describe('File ID to copy'),
  destinationDriveId: z.string().describe('Destination drive ID'),
  destinationFileId: z.string().describe('Destination folder ID'),
});

export type CopyDriveFileInput = z.infer<typeof copyDriveFileSchema>;

export async function copyDriveFileHandler(args: CopyDriveFileInput) {
  try {
    await driveApi.copyDriveFile(args);
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          success: true,
          message: `File copied successfully.`,
        }),
      }],
    };
  } catch (error) {
    return { content: [{ type: 'text', text: `Error: ${formatError(error)}` }], isError: true };
  }
}

export const copyDriveFileTool = {
  name: 'copy-drive-file',
  description: `Copy a file in a Dooray drive to another location.

**Required:**
- driveId: Source drive ID
- fileId: File ID to copy
- destinationDriveId: Target drive ID (can be same or different drive)
- destinationFileId: Target folder ID

**Example:**
{ "driveId": "123", "fileId": "456", "destinationDriveId": "123", "destinationFileId": "789" }`,
  inputSchema: {
    type: 'object',
    properties: {
      driveId: { type: 'string', description: 'Source drive ID' },
      fileId: { type: 'string', description: 'File ID to copy' },
      destinationDriveId: { type: 'string', description: 'Destination drive ID' },
      destinationFileId: { type: 'string', description: 'Destination folder ID' },
    },
    required: ['driveId', 'fileId', 'destinationDriveId', 'destinationFileId'],
  },
};
