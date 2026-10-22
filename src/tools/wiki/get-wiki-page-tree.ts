/**
 * Get Wiki Page Tree Tool
 * Walk the wiki page hierarchy (위키 페이지 트리)
 */

import { z } from 'zod';
import * as wikiApi from '../../api/wiki.js';
import { formatError } from '../../utils/errors.js';

const MAX_PAGES = 500;

export const getWikiPageTreeSchema = z.object({
  wikiId: z.string().describe('Wiki ID'),
  parentPageId: z.string().optional().describe('Start from this page (default: wiki top level)'),
  depth: z.number().int().min(1).max(10).optional().describe('How many levels to walk (default: 3, max: 10)'),
});

export type GetWikiPageTreeInput = z.infer<typeof getWikiPageTreeSchema>;

interface TreeNode {
  id: string;
  subject: string;
  children?: TreeNode[];
}

export async function getWikiPageTreeHandler(args: GetWikiPageTreeInput) {
  try {
    const maxDepth = args.depth ?? 3;
    let pageCount = 0;
    let truncated = false;

    // The API only returns one level (siblings), so walk level by level
    async function walk(parentPageId: string | undefined, level: number): Promise<TreeNode[]> {
      const pages = await wikiApi.getWikiPages({ wikiId: args.wikiId, parentPageId });
      const nodes: TreeNode[] = [];
      for (const page of pages) {
        if (pageCount >= MAX_PAGES) {
          truncated = true;
          break;
        }
        pageCount++;
        const node: TreeNode = { id: page.id, subject: page.subject };
        if (level < maxDepth) {
          const children = await walk(page.id, level + 1);
          if (children.length > 0) node.children = children;
        }
        nodes.push(node);
      }
      return nodes;
    }

    const tree = await walk(args.parentPageId, 1);

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({ pageCount, truncated, depth: maxDepth, tree }, null, 2),
      }],
    };
  } catch (error) {
    return { content: [{ type: 'text', text: `Error: ${formatError(error)}` }], isError: true };
  }
}

export const getWikiPageTreeTool = {
  name: 'get-wiki-page-tree',
  description: `Get the wiki page hierarchy as a tree (위키 페이지 트리).

get-wiki-page-list returns only one level. This tool walks down the levels and returns nested {id, subject, children}.
Each level costs one API call per page, so keep depth small for large wikis. The walk stops at ${MAX_PAGES} pages (truncated=true).

**Examples**:
- Top 3 levels: {"wikiId": "123"}
- Under a page, 2 levels: {"wikiId": "123", "parentPageId": "456", "depth": 2}`,
  inputSchema: {
    type: 'object',
    properties: {
      wikiId: { type: 'string', description: 'Wiki ID (required)' },
      parentPageId: { type: 'string', description: 'Start from this page (default: wiki top level)' },
      depth: { type: 'number', minimum: 1, maximum: 10, description: 'How many levels to walk (default: 3, max: 10)' },
    },
    required: ['wikiId'],
  },
};
