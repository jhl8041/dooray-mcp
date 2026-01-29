/**
 * Update Wiki Page Comment Tool
 * Update a comment on a wiki page
 */

import { z } from 'zod';
import * as wikiApi from '../../api/wiki.js';
import { formatError } from '../../utils/errors.js';

export const updateWikiPageCommentSchema = z.object({
  wikiId: z.string().describe('Wiki ID'),
  pageId: z.string().describe('Page ID'),
  commentId: z.string().describe('Comment ID'),
  content: z.string().describe('New comment content (markdown)'),
});

export type UpdateWikiPageCommentInput = z.infer<typeof updateWikiPageCommentSchema>;

export async function updateWikiPageCommentHandler(args: UpdateWikiPageCommentInput) {
  try {
    await wikiApi.updateWikiPageComment(args);
    return { content: [{ type: 'text', text: JSON.stringify({ success: true, message: 'Comment updated successfully' }, null, 2) }] };
  } catch (error) {
    return { content: [{ type: 'text', text: `Error: ${formatError(error)}` }], isError: true };
  }
}

export const updateWikiPageCommentTool = {
  name: 'update-wiki-page-comment',
  description: 'Update a comment on a wiki page.',
  inputSchema: {
    type: 'object',
    properties: {
      wikiId: { type: 'string', description: 'Wiki ID (required)' },
      pageId: { type: 'string', description: 'Wiki page ID (required)' },
      commentId: { type: 'string', description: 'Comment ID (required)' },
      content: { type: 'string', description: 'New comment content in markdown (required)' },
    },
    required: ['wikiId', 'pageId', 'commentId', 'content'],
  },
};
