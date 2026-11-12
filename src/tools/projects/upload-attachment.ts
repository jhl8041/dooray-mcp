/**
 * Upload Attachment Tool
 * Upload a file attachment to a task using curl
 */

import { z } from 'zod';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs';
import { formatError } from '../../utils/errors.js';
import { logger } from '../../utils/logger.js';

const execAsync = promisify(exec);

export const uploadAttachmentSchema = z.object({
  projectId: z.string().describe('Project ID'),
  taskId: z.string().describe('Task ID (post ID)'),
  filePath: z.string().describe('Absolute path to the file to upload'),
});

export type UploadAttachmentInput = z.infer<typeof uploadAttachmentSchema>;

export async function uploadAttachmentHandler(args: UploadAttachmentInput) {
  try {
    const apiToken = process.env.DOORAY_API_TOKEN;
    if (!apiToken) {
      throw new Error('DOORAY_API_TOKEN environment variable is required');
    }

    // Verify file exists
    if (!fs.existsSync(args.filePath)) {
      throw new Error(`File not found: ${args.filePath}`);
    }

    const fileName = path.basename(args.filePath);
    const baseUrl = process.env.DOORAY_API_BASE_URL || 'https://api.dooray.com';
    const apiUrl = `${baseUrl}/project/v1/projects/${args.projectId}/posts/${args.taskId}/files`;

    // Step 1: Make initial request to get 307 redirect location
    logger.debug(`Upload step 1: POST ${apiUrl}`);

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
      // Step 2: Follow redirect and upload to file server
      logger.debug(`Upload step 2: POST ${redirectUrl}`);

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
      // Direct upload succeeded (no redirect)
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
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: true,
            fileId: result.id,
            fileName: fileName,
            message: `File "${fileName}" successfully uploaded to task.`,
          }),
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

export const uploadAttachmentTool = {
  name: 'upload-attachment',
  description: `Upload a file attachment to a Dooray task.

**Required Parameters:**
- projectId: The project ID
- taskId: The task ID (post ID) to attach the file to
- filePath: Absolute path to the file to upload (e.g., "/Users/name/document.pdf")

**Example:**
{
  "projectId": "123456",
  "taskId": "789012",
  "filePath": "/Users/nhn/Downloads/report.pdf"
}

**Returns:** File ID of the uploaded attachment.

**Note:** The file must exist at the specified path. Maximum file size depends on Dooray's server limits.`,
  inputSchema: {
    type: 'object',
    properties: {
      projectId: {
        type: 'string',
        description: 'Project ID',
      },
      taskId: {
        type: 'string',
        description: 'Task ID (post ID) to attach the file to',
      },
      filePath: {
        type: 'string',
        description: 'Absolute path to the file to upload',
      },
    },
    required: ['projectId', 'taskId', 'filePath'],
  },
};
