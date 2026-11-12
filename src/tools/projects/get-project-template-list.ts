/**
 * Get Project Template List Tool
 * Get list of project task templates
 */

import { z } from 'zod';
import * as projectsApi from '../../api/projects.js';
import { formatError } from '../../utils/errors.js';
import { filterTemplateForList } from '../../utils/response-filters.js';

export const getProjectTemplateListSchema = z.object({
  projectId: z.string().describe('Project ID to get templates from'),
  page: z.number().optional().describe('Page number (default: 0)'),
  size: z.number().optional().describe('Items per page (default: 20, max: 100)'),
});

export type GetProjectTemplateListInput = z.infer<typeof getProjectTemplateListSchema>;

export async function getProjectTemplateListHandler(args: GetProjectTemplateListInput) {
  try {
    const result = await projectsApi.getProjectTemplates({
      projectId: args.projectId,
      page: args.page,
      size: args.size,
    });

    // Filter to compact response to reduce token usage
    const compactResult = {
      totalCount: result.totalCount,
      data: result.data.map(filterTemplateForList),
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

export const getProjectTemplateListTool = {
  name: 'get-project-template-list',
  description: `Get list of project task templates.

Templates are pre-created task structures with predefined title and body content. This tool retrieves all available templates in a project.

**URL Pattern Recognition**:
When given a Dooray URL like "https://nhnent.dooray.com/task/PROJECT_ID", extract the PROJECT_ID (the first numeric ID after "/task/") and use it as the projectId parameter.

**Note**: Returns compact response with essential fields only (id and templateName).

**Pagination**:
- Default page size is 20 (maximum: 100)
- Use page parameter to get additional pages if totalCount > size
- Set size parameter to control items per page (max: 100)

Examples:
- Get all templates (first page): {"projectId": "123456"}
- Get second page: {"projectId": "123456", "page": 1, "size": 20}
- Get with custom page size: {"projectId": "123456", "page": 0, "size": 50}

Returns a paginated response with totalCount and an array of templates containing id and templateName.

Templates help users quickly create tasks with predefined structure and content, useful for common task types like bug reports, feature requests, or documentation tasks.`,
  inputSchema: {
    type: 'object',
    properties: {
      projectId: {
        type: 'string',
        description: 'Project ID to get templates from',
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
