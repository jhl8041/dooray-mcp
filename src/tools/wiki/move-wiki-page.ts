/**
 * Move Wiki Page Tool
 * Move a wiki page under another parent, to another wiki, or change its order
 */

import { z } from 'zod';
import * as wikiApi from '../../api/wiki.js';
import { formatError } from '../../utils/errors.js';

export const moveWikiPageSchema = z.object({
  wikiId: z.string().describe('Wiki ID the page belongs to'),
  pageId: z.string().describe('Page ID to move'),
  targetParentPageId: z.string().describe('New parent page ID'),
  targetWikiId: z.string().optional().describe('Target wiki ID when moving to another wiki'),
  withChildren: z.boolean().optional().describe('Move child pages together (default: true)'),
  beforePageId: z.string().optional().describe('Place right after this sibling page. "0" moves it to the top'),
});

export type MoveWikiPageInput = z.infer<typeof moveWikiPageSchema>;

export async function moveWikiPageHandler(args: MoveWikiPageInput) {
  try {
    await wikiApi.moveWikiPage(args);
    return { content: [{ type: 'text', text: JSON.stringify({ success: true, message: 'Wiki page moved successfully' }, null, 2) }] };
  } catch (error) {
    return { content: [{ type: 'text', text: `Error: ${formatError(error)}` }], isError: true };
  }
}

export const moveWikiPageTool = {
  name: 'move-wiki-page',
  description: `Move a wiki page (위키 페이지 이동).

Moves the page under another parent page, into another wiki (targetWikiId), or changes its order among siblings (beforePageId).
Child pages move together by default. Set withChildren=false to move only this page.

**Examples**:
- Change parent: {"wikiId": "123", "pageId": "456", "targetParentPageId": "789"}
- Move only this page: {"wikiId": "123", "pageId": "456", "targetParentPageId": "789", "withChildren": false}
- Move to the top of siblings: {"wikiId": "123", "pageId": "456", "targetParentPageId": "789", "beforePageId": "0"}`,
  inputSchema: {
    type: 'object',
    properties: {
      wikiId: { type: 'string', description: 'Wiki ID the page belongs to (required)' },
      pageId: { type: 'string', description: 'Page ID to move (required)' },
      targetParentPageId: { type: 'string', description: 'New parent page ID (required)' },
      targetWikiId: { type: 'string', description: 'Target wiki ID when moving to another wiki' },
      withChildren: { type: 'boolean', description: 'Move child pages together (default: true)' },
      beforePageId: { type: 'string', description: 'Place right after this sibling page. "0" moves it to the top' },
    },
    required: ['wikiId', 'pageId', 'targetParentPageId'],
  },
};
