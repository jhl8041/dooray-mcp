/**
 * Get Project List Tool
 * Get list of projects accessible by the user
 */

import { z } from 'zod';
import * as projectsApi from '../../api/projects.js';
import { formatError } from '../../utils/errors.js';
import { filterProjectForList, filterPaginatedResponse } from '../../utils/response-filters.js';

export const getProjectListSchema = z.object({
  page: z.number().min(0).optional().describe('Page number for pagination (default: 0)'),
  size: z.number().min(1).max(100).optional().describe('Number of items per page (default: 20, max: 100)'),
});

export type GetProjectListInput = z.infer<typeof getProjectListSchema>;

export async function getProjectListHandler(args: GetProjectListInput) {
  try {
    const result = await projectsApi.getProjects({
      page: args.page,
      size: args.size,
    });

    // Filter to compact response to reduce token usage
    const compactResult = filterPaginatedResponse(result, filterProjectForList);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(compactResult),
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Error: ${formatError(error)}`,
        },
      ],
      isError: true,
    };
  }
}

export const getProjectListTool = {
  name: 'get-project-list',
  description: `Get list of active projects that you belong to.

This tool retrieves only active projects where you are a member. Archived projects are excluded.

**Note**: Returns compact response with essential fields only. For complete project details, use get-project.

**IMPORTANT**: When the user provides a specific Dooray URL (e.g., "https://nhnent.dooray.com/task/PROJECT_ID"), do NOT use this tool. Instead, extract the PROJECT_ID from the URL and call get-project directly to get information about that specific project.

This tool is for browsing your active projects when no specific project URL or ID is provided.

Examples:
- Get all your active projects: {} (empty parameters)
- Get second page with 50 items: {"page": 1, "size": 50}

Returns a paginated list with project id and name (project code) for each project.`,
  inputSchema: {
    type: 'object',
    properties: {
      page: {
        type: 'number',
        description: 'Page number for pagination (default: 0)',
        minimum: 0,
      },
      size: {
        type: 'number',
        description: 'Number of items per page (default: 20, max: 100)',
        minimum: 1,
        maximum: 100,
      },
    },
  },
};
