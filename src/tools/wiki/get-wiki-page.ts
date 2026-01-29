/**
 * Get Wiki Page Tool
 * Get wiki page details including body content
 */

import { z } from 'zod';
import * as wikiApi from '../../api/wiki.js';
import { formatError } from '../../utils/errors.js';

export const getWikiPageSchema = z.object({
  pageId: z.string().describe('Wiki page ID'),
  wikiId: z.string().optional().describe('Wiki ID (optional)'),
});

export type GetWikiPageInput = z.infer<typeof getWikiPageSchema>;

export async function getWikiPageHandler(args: GetWikiPageInput) {
  try {
    const result = args.wikiId
      ? await wikiApi.getWikiPageByWikiId(args.wikiId, args.pageId)
      : await wikiApi.getWikiPage(args.pageId);
    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
  } catch (error) {
    return { content: [{ type: 'text', text: `Error: ${formatError(error)}` }], isError: true };
  }
}

export const getWikiPageTool = {
  name: 'get-wiki-page',
  description: `Get wiki page details including body content.

**Two API endpoints supported**:
1. With pageId only: GET /wiki/v1/pages/{page-id}
2. With wikiId + pageId: GET /wiki/v1/wikis/{wiki-id}/pages/{page-id}

Returns: id, wikiId, version, subject, body (mimeType, content), creator, referrers, files, images.`,
  inputSchema: {
    type: 'object',
    properties: {
      pageId: { type: 'string', description: 'Wiki page ID (required)' },
      wikiId: { type: 'string', description: 'Wiki ID (optional)' },
    },
    required: ['pageId'],
  },
};
