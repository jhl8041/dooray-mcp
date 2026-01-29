/**
 * Create Wiki Comment Tool
 * Create a comment on a wiki page
 */

import { z } from 'zod';
import * as wikiApi from '../../api/wiki.js';
import { formatError } from '../../utils/errors.js';

export const createWikiCommentSchema = z.object({
  wikiId: z.string().describe('Wiki ID'),
  pageId: z.string().describe('Page ID'),
  content: z.string().describe('Comment content (markdown)'),
});

export type CreateWikiCommentInput = z.infer<typeof createWikiCommentSchema>;

export async function createWikiCommentHandler(args: CreateWikiCommentInput) {
  try {
    const result = await wikiApi.createWikiPageComment(args);
    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
  } catch (error) {
    return { content: [{ type: 'text', text: `Error: ${formatError(error)}` }], isError: true };
  }
}

export const createWikiCommentTool = {
  name: 'create-wiki-comment',
  description: 'Create a comment on a wiki page. Content is in markdown format. Returns: id.',
  inputSchema: {
    type: 'object',
    properties: {
      wikiId: { type: 'string', description: 'Wiki ID (required)' },
      pageId: { type: 'string', description: 'Page ID (required)' },
      content: { type: 'string', description: 'Comment content in markdown (required)' },
    },
    required: ['wikiId', 'pageId', 'content'],
  },
};
