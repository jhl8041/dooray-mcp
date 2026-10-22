/**
 * Update Wiki Page Body Tool
 * Replace part of a wiki page body (본문 일부 치환)
 */

import { z } from 'zod';
import * as wikiApi from '../../api/wiki.js';
import { formatError } from '../../utils/errors.js';
import { replaceText } from '../../utils/text-replace.js';

export const updateWikiPageBodySchema = z.object({
  wikiId: z.string().describe('Wiki ID'),
  pageId: z.string().describe('Page ID'),
  oldText: z.string().describe('Exact text to replace in the current body'),
  newText: z.string().describe('Replacement text'),
  replaceAll: z.boolean().optional().describe('Replace every occurrence (default: false)'),
});

export type UpdateWikiPageBodyInput = z.infer<typeof updateWikiPageBodySchema>;

export async function updateWikiPageBodyHandler(args: UpdateWikiPageBodyInput) {
  try {
    const page = await wikiApi.getWikiPageByWikiId(args.wikiId, args.pageId);
    if (!page.body) {
      throw new Error('Wiki page has no body to replace');
    }

    const replaced = replaceText(page.body.content, args.oldText, args.newText, args.replaceAll);
    await wikiApi.updateWikiPageContent(args.wikiId, args.pageId, replaced.content);

    return { content: [{ type: 'text', text: JSON.stringify({ success: true, replacedCount: replaced.count }, null, 2) }] };
  } catch (error) {
    return { content: [{ type: 'text', text: `Error: ${formatError(error)}` }], isError: true };
  }
}

export const updateWikiPageBodyTool = {
  name: 'update-wiki-page-body',
  description: `Replace part of a wiki page body (위키 본문 일부 치환).

Use this instead of update-wiki-page when only a few spots in a long page change. The title and the rest of the body stay as they are.

**Rules**:
- oldText must match the current body exactly (copy it from get-wiki-page)
- Fails if oldText is not found
- Fails if oldText appears more than once, unless replaceAll is true

**Examples**:
- {"wikiId": "123", "pageId": "456", "oldText": "v1.2", "newText": "v1.3"}
- {"wikiId": "123", "pageId": "456", "oldText": "TODO", "newText": "완료", "replaceAll": true}`,
  inputSchema: {
    type: 'object',
    properties: {
      wikiId: { type: 'string', description: 'Wiki ID (required)' },
      pageId: { type: 'string', description: 'Wiki page ID (required)' },
      oldText: { type: 'string', description: 'Exact text to replace in the current body' },
      newText: { type: 'string', description: 'Replacement text' },
      replaceAll: { type: 'boolean', description: 'Replace every occurrence (default: false)' },
    },
    required: ['wikiId', 'pageId', 'oldText', 'newText'],
  },
};
