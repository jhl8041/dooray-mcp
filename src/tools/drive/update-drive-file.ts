/**
 * Update Drive File Tool
 * Upload a new version of an existing file using curl (307 redirect handling)
 */

import { z } from 'zod';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs';
import { formatError } from '../../utils/errors.js';
import { logger } from '../../utils/logger.js';

const execAsync = promisify(exec);

export const updateDriveFileSchema = z.object({
  driveId: z.string().describe('Drive ID'),
  fileId: z.string().describe('File ID to update'),
  filePath: z.string().describe('Absolute path to the new version of the file'),
});

export type UpdateDriveFileInput = z.infer<typeof updateDriveFileSchema>;

export async function updateDriveFileHandler(args: UpdateDriveFileInput) {
  try {
    const apiToken = process.env.DOORAY_API_TOKEN;
    if (!apiToken) {
      throw new Error('DOORAY_API_TOKEN environment variable is required');
    }

    if (!fs.existsSync(args.filePath)) {
      throw new Error(`File not found: ${args.filePath}`);
    }

    const fileName = path.basename(args.filePath);
    const baseUrl = process.env.DOORAY_API_BASE_URL || 'https://api.dooray.com';
    const apiUrl = `${baseUrl}/drive/v1/drives/${args.driveId}/files/${args.fileId}?media=raw`;

    // Step 1: Initial PUT request to get 307 redirect
    logger.debug(`Drive update step 1: PUT ${apiUrl}`);

    const step1Command = `curl -s -X PUT '${apiUrl}' \
      --header 'Authorization: dooray-api ${apiToken}' \
      --form 'file=@"${args.filePath}"' \
      -w '\\n%{http_code}\\n%{redirect_url}' \
      -o /dev/null`;

    const step1Result = await execAsync(step1Command);
    const step1Lines = step1Result.stdout.trim().split('\n');
    const httpCode = step1Lines[step1Lines.length - 2];
    const redirectUrl = step1Lines[step1Lines.length - 1];

    logger.debug(`Step 1 response: HTTP ${httpCode}, redirect: ${redirectUrl}`);

    let result: { id: string; version?: number };

    if (httpCode === '307' && redirectUrl) {
      // Step 2: Follow redirect with PUT
      logger.debug(`Drive update step 2: PUT ${redirectUrl}`);

      const step2Command = `curl -s -X PUT '${redirectUrl}' \
        --header 'Authorization: dooray-api ${apiToken}' \
        --form 'file=@"${args.filePath}"'`;

      const step2Result = await execAsync(step2Command);
      const response = JSON.parse(step2Result.stdout);

      if (!response.header?.isSuccessful) {
        throw new Error(response.header?.resultMessage || 'Update failed');
      }

      result = response.result;
    } else if (httpCode === '200' || httpCode === '201') {
      const directCommand = `curl -s -X PUT '${apiUrl}' \
        --header 'Authorization: dooray-api ${apiToken}' \
        --form 'file=@"${args.filePath}"'`;

      const directResult = await execAsync(directCommand);
      const response = JSON.parse(directResult.stdout);

      if (!response.header?.isSuccessful) {
        throw new Error(response.header?.resultMessage || 'Update failed');
      }

      result = response.result;
    } else {
      throw new Error(`Unexpected HTTP status: ${httpCode}`);
    }

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          success: true,
          fileId: result.id,
          version: result.version,
          fileName: fileName,
          message: `File "${fileName}" updated successfully (new version uploaded).`,
        }),
      }],
    };
  } catch (error) {
    return { content: [{ type: 'text', text: `Error: ${formatError(error)}` }], isError: true };
  }
}

export const updateDriveFileTool = {
  name: 'update-drive-file',
  description: `Upload a new version of an existing file in a Dooray drive.

**Required:**
- driveId: The drive ID
- fileId: The file ID to update
- filePath: Absolute path to the new version of the file

**Example:**
{ "driveId": "123", "fileId": "456", "filePath": "/Users/name/updated-document.pdf" }

Returns: File ID and new version number.

**Note:** This replaces the file content with a new version. The file must exist at the specified path.`,
  inputSchema: {
    type: 'object',
    properties: {
      driveId: { type: 'string', description: 'Drive ID' },
      fileId: { type: 'string', description: 'File ID to update' },
      filePath: { type: 'string', description: 'Absolute path to the new file version' },
    },
    required: ['driveId', 'fileId', 'filePath'],
  },
};
