/**
 * Create Wiki Page Tool
 * Create a new wiki page
 */

import { z } from 'zod';
import * as wikiApi from '../../api/wiki.js';
import { formatError } from '../../utils/errors.js';

const referrerSchema = z.object({
  type: z.literal('member'),
  member: z.object({ organizationMemberId: z.string() }),
});

export const createWikiPageSchema = z.object({
  wikiId: z.string().describe('Wiki ID'),
  subject: z.string().describe('Page title'),
  content: z.string().describe('Page content (markdown)'),
  parentPageId: z.string().optional().describe('Parent page ID'),
  attachFileIds: z.array(z.string()).optional().describe('Attachment file IDs'),
  referrers: z.array(referrerSchema).optional().describe('Referrers (watchers)'),
});

export type CreateWikiPageInput = z.infer<typeof createWikiPageSchema>;

export async function createWikiPageHandler(args: CreateWikiPageInput) {
  try {
    const result = await wikiApi.createWikiPage({
      wikiId: args.wikiId,
      subject: args.subject,
      body: { mimeType: 'text/x-markdown', content: args.content },
      parentPageId: args.parentPageId,
      attachFileIds: args.attachFileIds,
      referrers: args.referrers,
    });
    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
  } catch (error) {
    return { content: [{ type: 'text', text: `Error: ${formatError(error)}` }], isError: true };
  }
}

export const createWikiPageTool = {
  name: 'create-wiki-page',
  description: `Create a new wiki page.

**Required**: wikiId, subject, content
**Optional**: attachFileIds, referrers

**IMPORTANT - parentPageId**:
- parentPageId is practically required for creating new pages
- Without parentPageId, API returns 400 error ("입력한 내용에 오류가 있습니다")
- To create a page, first use get-wiki-page-list to find the parent page (e.g., Home page)
- Then provide that page's ID as parentPageId

**Workflow**:
1. Call get-wiki-list to get wikiId
2. Call get-wiki-page-list with wikiId to find parent page (usually "Home")
3. Call create-wiki-page with parentPageId set to the Home page ID

Content is in markdown format. Returns: id, wikiId, parentPageId, version.`,
  inputSchema: {
    type: 'object',
    properties: {
      wikiId: { type: 'string', description: 'Wiki ID (required)' },
      subject: { type: 'string', description: 'Page title (required)' },
      content: { type: 'string', description: 'Page content in markdown (required)' },
      parentPageId: { type: 'string', description: 'Parent page ID (practically required - without this, API returns 400 error)' },
      attachFileIds: { type: 'array', items: { type: 'string' }, description: 'Attachment IDs' },
      referrers: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            type: { type: 'string', const: 'member' },
            member: { type: 'object', properties: { organizationMemberId: { type: 'string' } }, required: ['organizationMemberId'] },
          },
          required: ['type', 'member'],
        },
        description: 'Referrers (watchers)',
      },
    },
    required: ['wikiId', 'subject', 'content'],
  },
};
