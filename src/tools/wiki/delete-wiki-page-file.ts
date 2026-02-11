/**
 * Delete Wiki Page File Tool
 * Delete a file attached to a wiki page
 */

import { z } from 'zod';
import * as wikiApi from '../../api/wiki.js';
import { formatError } from '../../utils/errors.js';

export const deleteWikiPageFileSchema = z.object({
  wikiId: z.string().describe('Wiki ID'),
  pageId: z.string().describe('Wiki page ID'),
  fileId: z.string().describe('File ID to delete (from page detail API: $.result.files.id or $.result.images.id)'),
});

export type DeleteWikiPageFileInput = z.infer<typeof deleteWikiPageFileSchema>;

export async function deleteWikiPageFileHandler(args: DeleteWikiPageFileInput) {
  try {
    await wikiApi.deleteWikiPageFile(
      args.wikiId,
      args.pageId,
      args.fileId
    );

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: true,
            message: `File ${args.fileId} successfully deleted from wiki page.`,
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

export const deleteWikiPageFileTool = {
  name: 'delete-wiki-page-file',
  description: `Delete a file attached to a Dooray wiki page.

**Required Parameters:**
- wikiId: The wiki ID
- pageId: The wiki page ID
- fileId: The file ID to delete (get from wiki page detail API: $.result.files.id or $.result.images.id)

**Example:**
{
  "wikiId": "123456",
  "pageId": "789012",
  "fileId": "abc123"
}

**Returns:** Success message confirming deletion.

**Note:** This action is irreversible. The file will be permanently removed from the wiki page.`,
  inputSchema: {
    type: 'object',
    properties: {
      wikiId: {
        type: 'string',
        description: 'Wiki ID',
      },
      pageId: {
        type: 'string',
        description: 'Wiki page ID',
      },
      fileId: {
        type: 'string',
        description: 'File ID to delete',
      },
    },
    required: ['wikiId', 'pageId', 'fileId'],
  },
};
