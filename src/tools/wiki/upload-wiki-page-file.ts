/**
 * Upload Wiki Page File Tool
 * Upload a file to an existing wiki page using curl (307 redirect handling)
 */

import { z } from 'zod';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs';
import { formatError } from '../../utils/errors.js';
import { logger } from '../../utils/logger.js';

const execAsync = promisify(exec);

export const uploadWikiPageFileSchema = z.object({
  wikiId: z.string().describe('Wiki ID'),
  pageId: z.string().describe('Wiki page ID'),
  filePath: z.string().describe('Absolute path to the file to upload'),
});

export type UploadWikiPageFileInput = z.infer<typeof uploadWikiPageFileSchema>;

export async function uploadWikiPageFileHandler(args: UploadWikiPageFileInput) {
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
    const apiUrl = `${baseUrl}/wiki/v1/wikis/${args.wikiId}/pages/${args.pageId}/files`;

    // Step 1: Make initial request to get 307 redirect location
    logger.debug(`Wiki page file upload step 1: POST ${apiUrl}`);

    const step1Command = `curl -s -X POST '${apiUrl}' \
      --header 'Authorization: dooray-api ${apiToken}' \
      --form 'type=general' \
      --form 'file=@"${args.filePath}"' \
      -w '\\n%{http_code}\\n%{redirect_url}' \
      -o /dev/null`;

    const step1Result = await execAsync(step1Command);
    const step1Lines = step1Result.stdout.trim().split('\n');
    const httpCode = step1Lines[step1Lines.length - 2];
    const redirectUrl = step1Lines[step1Lines.length - 1];

    logger.debug(`Step 1 response: HTTP ${httpCode}, redirect: ${redirectUrl}`);

    let result: { id: string; attachFileId: string; name: string; mimeType: string; type: string; size: number; createdAt: string };

    if (httpCode === '307' && redirectUrl) {
      // Step 2: Follow redirect and upload to file server
      logger.debug(`Wiki page file upload step 2: POST ${redirectUrl}`);

      const step2Command = `curl -s -X POST '${redirectUrl}' \
        --header 'Authorization: dooray-api ${apiToken}' \
        --form 'type=general' \
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
        --form 'type=general' \
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
            attachFileId: result.attachFileId,
            fileName: result.name || fileName,
            mimeType: result.mimeType,
            size: result.size,
            message: `File "${result.name || fileName}" successfully uploaded to wiki page.`,
          }, null, 2),
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

export const uploadWikiPageFileTool = {
  name: 'upload-wiki-page-file',
  description: `Upload a file to an existing Dooray wiki page.

**Required Parameters:**
- wikiId: The wiki ID
- pageId: The wiki page ID to attach the file to
- filePath: Absolute path to the file to upload (e.g., "/Users/name/document.pdf")

**Example:**
{
  "wikiId": "123456",
  "pageId": "789012",
  "filePath": "/Users/nhn/Downloads/report.pdf"
}

**Returns:** File ID and attach file ID of the uploaded file.

**Note:** The file must exist at the specified path. The type is set to "general" automatically.`,
  inputSchema: {
    type: 'object',
    properties: {
      wikiId: {
        type: 'string',
        description: 'Wiki ID',
      },
      pageId: {
        type: 'string',
        description: 'Wiki page ID to attach the file to',
      },
      filePath: {
        type: 'string',
        description: 'Absolute path to the file to upload',
      },
    },
    required: ['wikiId', 'pageId', 'filePath'],
  },
};
