/**
 * Create Drive Folder Tool
 * Create a new folder in a drive
 */

import { z } from 'zod';
import * as driveApi from '../../api/drive.js';
import { formatError } from '../../utils/errors.js';

export const createDriveFolderSchema = z.object({
  driveId: z.string().describe('Drive ID'),
  folderId: z.string().describe('Parent folder ID where the new folder will be created. Use root folder ID for top-level'),
  name: z.string().describe('Name for the new folder'),
});

export type CreateDriveFolderInput = z.infer<typeof createDriveFolderSchema>;

export async function createDriveFolderHandler(args: CreateDriveFolderInput) {
  try {
    const result = await driveApi.createDriveFolder(args);
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          success: true,
          folderId: result.id,
          message: `Folder "${args.name}" created successfully.`,
        }),
      }],
    };
  } catch (error) {
    return { content: [{ type: 'text', text: `Error: ${formatError(error)}` }], isError: true };
  }
}

export const createDriveFolderTool = {
  name: 'create-drive-folder',
  description: `Create a new folder in a Dooray drive.

**Required:**
- driveId: The drive ID
- folderId: Parent folder ID (where the new folder will be created)
- name: Folder name

**Example:**
{ "driveId": "123", "folderId": "456", "name": "New Folder" }

Returns: ID of the created folder.`,
  inputSchema: {
    type: 'object',
    properties: {
      driveId: { type: 'string', description: 'Drive ID' },
      folderId: { type: 'string', description: 'Parent folder ID' },
      name: { type: 'string', description: 'Folder name' },
    },
    required: ['driveId', 'folderId', 'name'],
  },
};
