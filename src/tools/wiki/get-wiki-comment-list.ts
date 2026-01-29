/**
 * Get Wiki Comment List Tool
 * Get comments on a wiki page
 */

import { z } from 'zod';
import * as wikiApi from '../../api/wiki.js';
import { formatError } from '../../utils/errors.js';

export const getWikiCommentListSchema = z.object({
  wikiId: z.string().describe('Wiki ID'),
  pageId: z.string().describe('Page ID'),
  page: z.number().optional().describe('Page number (0-based)'),
  size: z.number().optional().describe('Page size (default: 20, max: 100)'),
});

export type GetWikiCommentListInput = z.infer<typeof getWikiCommentListSchema>;

export async function getWikiCommentListHandler(args: GetWikiCommentListInput) {
  try {
    const result = await wikiApi.getWikiPageComments(args);
    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
  } catch (error) {
    return { content: [{ type: 'text', text: `Error: ${formatError(error)}` }], isError: true };
  }
}

export const getWikiCommentListTool = {
  name: 'get-wiki-comment-list',
  description: 'Get comments on a wiki page. Returns newest first. Each comment has: id, page, createdAt, modifiedAt, creator, body.',
  inputSchema: {
    type: 'object',
    properties: {
      wikiId: { type: 'string', description: 'Wiki ID (required)' },
      pageId: { type: 'string', description: 'Page ID (required)' },
      page: { type: 'number', description: 'Page number (0-based, default: 0)' },
      size: { type: 'number', description: 'Page size (default: 20, max: 100)' },
    },
    required: ['wikiId', 'pageId'],
  },
};
