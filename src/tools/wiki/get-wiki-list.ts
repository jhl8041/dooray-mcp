/**
 * Get Wiki List Tool
 * Get list of accessible wikis
 */

import { z } from 'zod';
import * as wikiApi from '../../api/wiki.js';
import { formatError } from '../../utils/errors.js';

export const getWikiListSchema = z.object({
  page: z.number().optional().describe('Page number (0-based)'),
  size: z.number().optional().describe('Page size (default: 20)'),
});

export type GetWikiListInput = z.infer<typeof getWikiListSchema>;

export async function getWikiListHandler(args: GetWikiListInput) {
  try {
    const result = await wikiApi.getWikis(args);
    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
  } catch (error) {
    return { content: [{ type: 'text', text: `Error: ${formatError(error)}` }], isError: true };
  }
}

export const getWikiListTool = {
  name: 'get-wiki-list',
  description: 'Get list of accessible wikis. Returns wiki ID, name, project, type, scope, and home page ID.',
  inputSchema: {
    type: 'object',
    properties: {
      page: { type: 'number', description: 'Page number (0-based, default: 0)' },
      size: { type: 'number', description: 'Page size (default: 20)' },
    },
  },
};
