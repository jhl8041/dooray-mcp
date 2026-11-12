/**
 * Upload Drive File Tool
 * Upload a file to a drive folder using curl (307 redirect handling)
 */

import { z } from 'zod';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs';
import { formatError } from '../../utils/errors.js';
import { logger } from '../../utils/logger.js';

const execAsync = promisify(exec);

export const uploadDriveFileSchema = z.object({
  driveId: z.string().describe('Drive ID'),
  parentId: z.string().describe('Parent folder ID to upload into'),
  filePath: z.string().describe('Absolute path to the file to upload'),
});

export type UploadDriveFileInput = z.infer<typeof uploadDriveFileSchema>;

export async function uploadDriveFileHandler(args: UploadDriveFileInput) {
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
    const apiUrl = `${baseUrl}/drive/v1/drives/${args.driveId}/files?parentId=${args.parentId}`;

    // Step 1: Initial request to get 307 redirect
    logger.debug(`Drive upload step 1: POST ${apiUrl}`);

    const step1Command = `curl -s -X POST '${apiUrl}' \
      --header 'Authorization: dooray-api ${apiToken}' \
      --form 'file=@"${args.filePath}"' \
      -w '\\n%{http_code}\\n%{redirect_url}' \
      -o /dev/null`;

    const step1Result = await execAsync(step1Command);
    const step1Lines = step1Result.stdout.trim().split('\n');
    const httpCode = step1Lines[step1Lines.length - 2];
    const redirectUrl = step1Lines[step1Lines.length - 1];

    logger.debug(`Step 1 response: HTTP ${httpCode}, redirect: ${redirectUrl}`);

    let result: { id: string };

    if (httpCode === '307' && redirectUrl) {
      // Step 2: Follow redirect
      logger.debug(`Drive upload step 2: POST ${redirectUrl}`);

      const step2Command = `curl -s -X POST '${redirectUrl}' \
        --header 'Authorization: dooray-api ${apiToken}' \
        --form 'file=@"${args.filePath}"'`;

      const step2Result = await execAsync(step2Command);
      const response = JSON.parse(step2Result.stdout);

      if (!response.header?.isSuccessful) {
        throw new Error(response.header?.resultMessage || 'Upload failed');
      }

      result = response.result;
    } else if (httpCode === '200' || httpCode === '201') {
      const directCommand = `curl -s -X POST '${apiUrl}' \
        --header 'Authorization: dooray-api ${apiToken}' \
        --form 'file=@"${args.filePath}"'`;

      const directResult = await execAsync(directCommand);
      const response = JSON.parse(directResult.stdout);

      if (!response.header?.isSuccessful) {
        throw new Error(response.header?.resultMessage || 'Upload failed');
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
          fileName: fileName,
          message: `File "${fileName}" uploaded successfully to drive.`,
        }),
      }],
    };
  } catch (error) {
    return { content: [{ type: 'text', text: `Error: ${formatError(error)}` }], isError: true };
  }
}

export const uploadDriveFileTool = {
  name: 'upload-drive-file',
  description: `Upload a file to a Dooray drive folder.

**Required:**
- driveId: The drive ID
- parentId: Parent folder ID to upload the file into
- filePath: Absolute path to the file to upload

**Example:**
{ "driveId": "123", "parentId": "456", "filePath": "/Users/name/document.pdf" }

Returns: File ID of the uploaded file.

**Note:** The file must exist at the specified path.`,
  inputSchema: {
    type: 'object',
    properties: {
      driveId: { type: 'string', description: 'Drive ID' },
      parentId: { type: 'string', description: 'Parent folder ID' },
      filePath: { type: 'string', description: 'Absolute path to the file to upload' },
    },
    required: ['driveId', 'parentId', 'filePath'],
  },
};
