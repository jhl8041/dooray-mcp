/**
 * Update Wiki Comment Tool
 * Update a wiki comment content
 */

import { z } from 'zod';
import * as wikiApi from '../../api/wiki.js';
import { formatError } from '../../utils/errors.js';

export const updateWikiCommentSchema = z.object({
  wikiId: z.string().describe('Wiki ID'),
  pageId: z.string().describe('Page ID'),
  commentId: z.string().describe('Comment ID'),
  content: z.string().describe('New comment content (markdown)'),
});

export type UpdateWikiCommentInput = z.infer<typeof updateWikiCommentSchema>;

export async function updateWikiCommentHandler(args: UpdateWikiCommentInput) {
  try {
    await wikiApi.updateWikiPageComment(args);
    return { content: [{ type: 'text', text: JSON.stringify({ success: true, message: 'Comment updated successfully' }, null, 2) }] };
  } catch (error) {
    return { content: [{ type: 'text', text: `Error: ${formatError(error)}` }], isError: true };
  }
}

export const updateWikiCommentTool = {
  name: 'update-wiki-comment',
  description: 'Update a wiki comment content.',
  inputSchema: {
    type: 'object',
    properties: {
      wikiId: { type: 'string', description: 'Wiki ID (required)' },
      pageId: { type: 'string', description: 'Page ID (required)' },
      commentId: { type: 'string', description: 'Comment ID (required)' },
      content: { type: 'string', description: 'New comment content in markdown (required)' },
    },
    required: ['wikiId', 'pageId', 'commentId', 'content'],
  },
};
