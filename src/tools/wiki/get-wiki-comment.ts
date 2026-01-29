/**
 * Get Wiki Page Comment Tool
 * Get a specific comment on a wiki page
 */

import { z } from 'zod';
import * as wikiApi from '../../api/wiki.js';
import { formatError } from '../../utils/errors.js';

export const getWikiPageCommentSchema = z.object({
  wikiId: z.string().describe('Wiki ID'),
  pageId: z.string().describe('Page ID'),
  commentId: z.string().describe('Comment ID'),
});

export type GetWikiPageCommentInput = z.infer<typeof getWikiPageCommentSchema>;

export async function getWikiPageCommentHandler(args: GetWikiPageCommentInput) {
  try {
    const result = await wikiApi.getWikiPageComment(args.wikiId, args.pageId, args.commentId);
    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
  } catch (error) {
    return { content: [{ type: 'text', text: `Error: ${formatError(error)}` }], isError: true };
  }
}

export const getWikiPageCommentTool = {
  name: 'get-wiki-page-comment',
  description: 'Get a specific comment on a wiki page. Returns: id, page, createdAt, modifiedAt, creator, body.',
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
