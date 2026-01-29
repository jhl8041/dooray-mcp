/**
 * Update Wiki Page Tool
 * Update wiki page title and/or content
 */

import { z } from 'zod';
import * as wikiApi from '../../api/wiki.js';
import { formatError } from '../../utils/errors.js';

const referrerSchema = z.object({
  type: z.literal('member'),
  member: z.object({ organizationMemberId: z.string() }),
});

export const updateWikiPageSchema = z.object({
  wikiId: z.string().describe('Wiki ID'),
  pageId: z.string().describe('Page ID'),
  subject: z.string().optional().describe('New page title'),
  content: z.string().optional().describe('New page content (markdown)'),
  referrers: z.array(referrerSchema).nullable().optional().describe('New referrers (null to clear)'),
});

export type UpdateWikiPageInput = z.infer<typeof updateWikiPageSchema>;

export async function updateWikiPageHandler(args: UpdateWikiPageInput) {
  try {
    await wikiApi.updateWikiPage({
      wikiId: args.wikiId,
      pageId: args.pageId,
      subject: args.subject,
      body: args.content ? { mimeType: 'text/x-markdown', content: args.content } : undefined,
      referrers: args.referrers,
    });
    return { content: [{ type: 'text', text: JSON.stringify({ success: true, message: 'Wiki page updated successfully' }, null, 2) }] };
  } catch (error) {
    return { content: [{ type: 'text', text: `Error: ${formatError(error)}` }], isError: true };
  }
}

export const updateWikiPageTool = {
  name: 'update-wiki-page',
  description: `Update wiki page title and/or content.

**Required**: wikiId, pageId, subject
**Optional**: content, referrers

**IMPORTANT - subject is required**:
- Even when only updating content, subject MUST be provided
- Without subject, API returns 400 error ("Requested subject can not be null")
- If you want to keep the existing title, first call get-wiki-page to get the current subject, then include it in the update

**Workflow for content-only update**:
1. Call get-wiki-page with wikiId and pageId to get current page info
2. Call update-wiki-page with the existing subject and new content

Set referrers to null to clear all referrers.`,
  inputSchema: {
    type: 'object',
    properties: {
      wikiId: { type: 'string', description: 'Wiki ID (required)' },
      pageId: { type: 'string', description: 'Page ID (required)' },
      subject: { type: 'string', description: 'Page title (required by API even for content-only updates)' },
      content: { type: 'string', description: 'New page content in markdown (optional)' },
      referrers: {
        type: ['array', 'null'],
        items: {
          type: 'object',
          properties: {
            type: { type: 'string', const: 'member' },
            member: { type: 'object', properties: { organizationMemberId: { type: 'string' } }, required: ['organizationMemberId'] },
          },
          required: ['type', 'member'],
        },
        description: 'Referrers (watchers). Set to null to clear all.',
      },
    },
    required: ['wikiId', 'pageId'],
  },
};
