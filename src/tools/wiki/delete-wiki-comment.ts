/**
 * Delete Wiki Comment Tool
 * Delete a wiki comment
 */

import { z } from 'zod';
import * as wikiApi from '../../api/wiki.js';
import { formatError } from '../../utils/errors.js';

export const deleteWikiCommentSchema = z.object({
  wikiId: z.string().describe('Wiki ID'),
  pageId: z.string().describe('Page ID'),
  commentId: z.string().describe('Comment ID'),
});

export type DeleteWikiCommentInput = z.infer<typeof deleteWikiCommentSchema>;

export async function deleteWikiCommentHandler(args: DeleteWikiCommentInput) {
  try {
    await wikiApi.deleteWikiPageComment(args.wikiId, args.pageId, args.commentId);
    return { content: [{ type: 'text', text: JSON.stringify({ success: true, message: 'Comment deleted successfully' }, null, 2) }] };
  } catch (error) {
    return { content: [{ type: 'text', text: `Error: ${formatError(error)}` }], isError: true };
  }
}

export const deleteWikiCommentTool = {
  name: 'delete-wiki-comment',
  description: 'Delete a wiki comment.',
  inputSchema: {
    type: 'object',
    properties: {
      wikiId: { type: 'string', description: 'Wiki ID (required)' },
      pageId: { type: 'string', description: 'Page ID (required)' },
      commentId: { type: 'string', description: 'Comment ID (required)' },
    },
    required: ['wikiId', 'pageId', 'commentId'],
  },
};
