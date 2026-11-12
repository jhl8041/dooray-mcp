/**
 * Get Project Member Group List Tool
 * Get list of project member groups
 */

import { z } from 'zod';
import * as projectsApi from '../../api/projects.js';
import { formatError } from '../../utils/errors.js';
import { filterMemberGroupForList } from '../../utils/response-filters.js';

export const getProjectMemberGroupListSchema = z.object({
  projectId: z.string().describe('Project ID to get member groups from'),
  page: z.number().optional().describe('Page number (default: 0)'),
  size: z.number().optional().describe('Items per page (default: 20, max: 100)'),
});

export type GetProjectMemberGroupListInput = z.infer<typeof getProjectMemberGroupListSchema>;

export async function getProjectMemberGroupListHandler(args: GetProjectMemberGroupListInput) {
  try {
    const result = await projectsApi.getProjectMemberGroups({
      projectId: args.projectId,
      page: args.page,
      size: args.size,
    });

    // Filter to compact response to reduce token usage
    const compactResult = {
      totalCount: result.totalCount,
      data: result.data.map(filterMemberGroupForList),
    };

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

export const getProjectMemberGroupListTool = {
  name: 'get-project-member-group-list',
  description: `Get list of member groups in a project.

Member groups are collections of members that can be assigned to tasks as a group. This tool retrieves all member groups configured in a project.

**URL Pattern Recognition**:
When given a Dooray URL like "https://nhnent.dooray.com/task/PROJECT_ID", extract the PROJECT_ID (the first numeric ID after "/task/") and use it as the projectId parameter.

**Pagination**:
- Default page size is 20 (maximum: 100)
- Use page parameter to get additional pages if totalCount > size

**Note**: Returns compact response with essential fields only (id and code).

Examples:
- Get all member groups: {"projectId": "123456"}
- Get with pagination: {"projectId": "123456", "page": 0, "size": 50}

Returns a paginated response with totalCount and array of member groups containing:
- **id**: Member group ID
- **code**: Member group name/code

Use this tool to find member groups for assigning tasks to groups of members.`,
  inputSchema: {
    type: 'object',
    properties: {
      projectId: {
        type: 'string',
        description: 'Project ID to get member groups from',
      },
      page: {
        type: 'number',
        description: 'Page number for pagination (default: 0)',
      },
      size: {
        type: 'number',
        description: 'Number of items per page (default: 20, max: 100)',
      },
    },
    required: ['projectId'],
  },
};
