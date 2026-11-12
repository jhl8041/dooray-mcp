/**
 * Get Drive File Meta Tool
 * Get file metadata by file ID
 */

import { z } from 'zod';
import * as driveApi from '../../api/drive.js';
import { formatError } from '../../utils/errors.js';

export const getDriveFileMetaSchema = z.object({
  fileId: z.string().describe('File ID'),
});

export type GetDriveFileMetaInput = z.infer<typeof getDriveFileMetaSchema>;

export async function getDriveFileMetaHandler(args: GetDriveFileMetaInput) {
  try {
    const result = await driveApi.getDriveFileMeta(args.fileId);
    return { content: [{ type: 'text', text: JSON.stringify(result) }] };
  } catch (error) {
    return { content: [{ type: 'text', text: `Error: ${formatError(error)}` }], isError: true };
  }
}

export const getDriveFileMetaTool = {
  name: 'get-drive-file-meta',
  description: `Get file metadata by file ID (without needing drive ID).

**Required:** fileId

Returns: file ID, driveId, name, version, type, subType, mimeType, size, creator, parent info.

**Note:** Use the returned driveId for download or other operations that require it.`,
  inputSchema: {
    type: 'object',
    properties: {
      fileId: { type: 'string', description: 'File ID' },
    },
    required: ['fileId'],
  },
};
