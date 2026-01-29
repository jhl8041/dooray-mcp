/**
 * Get Wiki Page Comment List Tool
 * Get comments on a wiki page
 */

import { z } from 'zod';
import * as wikiApi from '../../api/wiki.js';
import { formatError } from '../../utils/errors.js';

export const getWikiPageCommentListSchema = z.object({
  wikiId: z.string().describe('Wiki ID'),
  pageId: z.string().describe('Page ID'),
  page: z.number().optional().describe('Page number (0-based)'),
  size: z.number().optional().describe('Page size (default: 20, max: 100)'),
});

export type GetWikiPageCommentListInput = z.infer<typeof getWikiPageCommentListSchema>;

export async function getWikiPageCommentListHandler(args: GetWikiPageCommentListInput) {
  try {
    const result = await wikiApi.getWikiPageComments(args);
    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
  } catch (error) {
    return { content: [{ type: 'text', text: `Error: ${formatError(error)}` }], isError: true };
  }
}

export const getWikiPageCommentListTool = {
  name: 'get-wiki-page-comment-list',
  description: 'Get comments on a wiki page. Returns newest first. Each comment has: id, page, createdAt, modifiedAt, creator, body.',
  inputSchema: {
    type: 'object',
    properties: {
      wikiId: { type: 'string', description: 'Wiki ID (required)' },
      pageId: { type: 'string', description: 'Wiki page ID (required)' },
      page: { type: 'number', description: 'Page number (0-based, default: 0)' },
      size: { type: 'number', description: 'Page size (default: 20, max: 100)' },
    },
    required: ['wikiId', 'pageId'],
  },
};
