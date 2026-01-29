/**
 * Get Wiki Comment Tool
 * Get a specific wiki comment
 */

import { z } from 'zod';
import * as wikiApi from '../../api/wiki.js';
import { formatError } from '../../utils/errors.js';

export const getWikiCommentSchema = z.object({
  wikiId: z.string().describe('Wiki ID'),
  pageId: z.string().describe('Page ID'),
  commentId: z.string().describe('Comment ID'),
});

export type GetWikiCommentInput = z.infer<typeof getWikiCommentSchema>;

export async function getWikiCommentHandler(args: GetWikiCommentInput) {
  try {
    const result = await wikiApi.getWikiPageComment(args.wikiId, args.pageId, args.commentId);
    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
  } catch (error) {
    return { content: [{ type: 'text', text: `Error: ${formatError(error)}` }], isError: true };
  }
}

export const getWikiCommentTool = {
  name: 'get-wiki-comment',
  description: 'Get a specific wiki comment. Returns: id, page, createdAt, modifiedAt, creator, body.',
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
