/**
 * Create Wiki Page Comment Tool
 * Create a comment on a wiki page
 */

import { z } from 'zod';
import * as wikiApi from '../../api/wiki.js';
import { formatError } from '../../utils/errors.js';

export const createWikiPageCommentSchema = z.object({
  wikiId: z.string().describe('Wiki ID'),
  pageId: z.string().describe('Page ID'),
  content: z.string().describe('Comment content (markdown)'),
});

export type CreateWikiPageCommentInput = z.infer<typeof createWikiPageCommentSchema>;

export async function createWikiPageCommentHandler(args: CreateWikiPageCommentInput) {
  try {
    const result = await wikiApi.createWikiPageComment(args);
    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
  } catch (error) {
    return { content: [{ type: 'text', text: `Error: ${formatError(error)}` }], isError: true };
  }
}

export const createWikiPageCommentTool = {
  name: 'create-wiki-page-comment',
  description: 'Create a comment on a wiki page. Content is in markdown format. Returns: id.',
  inputSchema: {
    type: 'object',
    properties: {
      wikiId: { type: 'string', description: 'Wiki ID (required)' },
      pageId: { type: 'string', description: 'Wiki page ID (required)' },
      content: { type: 'string', description: 'Comment content in markdown (required)' },
    },
    required: ['wikiId', 'pageId', 'content'],
  },
};
