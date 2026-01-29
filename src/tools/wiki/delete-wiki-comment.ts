/**
 * Delete Wiki Page Comment Tool
 * Delete a comment on a wiki page
 */

import { z } from 'zod';
import * as wikiApi from '../../api/wiki.js';
import { formatError } from '../../utils/errors.js';

export const deleteWikiPageCommentSchema = z.object({
  wikiId: z.string().describe('Wiki ID'),
  pageId: z.string().describe('Page ID'),
  commentId: z.string().describe('Comment ID'),
});

export type DeleteWikiPageCommentInput = z.infer<typeof deleteWikiPageCommentSchema>;

export async function deleteWikiPageCommentHandler(args: DeleteWikiPageCommentInput) {
  try {
    await wikiApi.deleteWikiPageComment(args.wikiId, args.pageId, args.commentId);
    return { content: [{ type: 'text', text: JSON.stringify({ success: true, message: 'Comment deleted successfully' }, null, 2) }] };
  } catch (error) {
    return { content: [{ type: 'text', text: `Error: ${formatError(error)}` }], isError: true };
  }
}

export const deleteWikiPageCommentTool = {
  name: 'delete-wiki-page-comment',
  description: 'Delete a comment on a wiki page.',
  inputSchema: {
    type: 'object',
    properties: {
      wikiId: { type: 'string', description: 'Wiki ID (required)' },
      pageId: { type: 'string', description: 'Wiki page ID (required)' },
      commentId: { type: 'string', description: 'Comment ID (required)' },
    },
    required: ['wikiId', 'pageId', 'commentId'],
  },
};
