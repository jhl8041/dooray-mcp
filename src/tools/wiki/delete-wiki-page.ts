/**
 * Delete Wiki Page Tool
 * Delete a wiki page
 */

import { z } from 'zod';
import * as wikiApi from '../../api/wiki.js';
import { formatError } from '../../utils/errors.js';

export const deleteWikiPageSchema = z.object({
  wikiId: z.string().describe('Wiki ID'),
  pageId: z.string().describe('Page ID'),
});

export type DeleteWikiPageInput = z.infer<typeof deleteWikiPageSchema>;

export async function deleteWikiPageHandler(args: DeleteWikiPageInput) {
  try {
    await wikiApi.deleteWikiPage(args.wikiId, args.pageId);
    return { content: [{ type: 'text', text: JSON.stringify({ success: true, message: 'Wiki page deleted successfully' }, null, 2) }] };
  } catch (error) {
    return { content: [{ type: 'text', text: `Error: ${formatError(error)}` }], isError: true };
  }
}

export const deleteWikiPageTool = {
  name: 'delete-wiki-page',
  description: `Delete a wiki page (위키 페이지 삭제).

Confirm the target with get-wiki-page before deleting, and check child pages with get-wiki-page-tree.`,
  inputSchema: {
    type: 'object',
    properties: {
      wikiId: { type: 'string', description: 'Wiki ID (required)' },
      pageId: { type: 'string', description: 'Wiki page ID (required)' },
    },
    required: ['wikiId', 'pageId'],
  },
};
