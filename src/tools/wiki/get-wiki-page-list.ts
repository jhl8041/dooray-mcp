/**
 * Get Wiki Page List Tool
 * Get wiki pages at one depth level
 */

import { z } from 'zod';
import * as wikiApi from '../../api/wiki.js';
import { formatError } from '../../utils/errors.js';

export const getWikiPageListSchema = z.object({
  wikiId: z.string().describe('Wiki ID'),
  parentPageId: z.string().optional().describe('Parent page ID (null for root pages)'),
});

export type GetWikiPageListInput = z.infer<typeof getWikiPageListSchema>;

export async function getWikiPageListHandler(args: GetWikiPageListInput) {
  try {
    const result = await wikiApi.getWikiPages(args);
    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
  } catch (error) {
    return { content: [{ type: 'text', text: `Error: ${formatError(error)}` }], isError: true };
  }
}

export const getWikiPageListTool = {
  name: 'get-wiki-page-list',
  description: 'Get wiki pages at one depth level (siblings). Use parentPageId to get child pages, omit for root pages.',
  inputSchema: {
    type: 'object',
    properties: {
      wikiId: { type: 'string', description: 'Wiki ID (required)' },
      parentPageId: { type: 'string', description: 'Parent page ID (optional, omit for root pages)' },
    },
    required: ['wikiId'],
  },
};
