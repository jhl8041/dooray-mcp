/**
 * Get Tag List Tool
 * Get list of tags for a project
 */

import { z } from 'zod';
import * as projectsApi from '../../api/projects.js';
import { formatError } from '../../utils/errors.js';
import { groupTagsByTagGroup } from '../../utils/response-filters.js';

export const getTagListSchema = z.object({
  projectId: z.string().describe('Project ID'),
  page: z.number().optional().describe('Page number (default: 0)'),
  size: z.number().optional().describe('Items per page (default: 100, max: 100)'),
});

export type GetTagListInput = z.infer<typeof getTagListSchema>;

export async function getTagListHandler(args: GetTagListInput) {
  try {
    const result = await projectsApi.getTags({
      projectId: args.projectId,
      page: args.page,
      size: args.size,
    });

    // Group tags by tagGroup for better organization
    const groupedResult = groupTagsByTagGroup(result.data);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(groupedResult),
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

export const getTagListTool = {
  name: 'get-tag-list',
  description: `Get list of tags for a project, grouped by tag groups.

Tags are used to categorize and label tasks. This tool retrieves all available tags organized by their tag groups for better clarity.

**Response Format**:
Returns tags grouped by their tagGroup:
\`\`\`json
{
  "tagGroups": [
    {
      "id": "group1",
      "name": "Type",
      "mandatory": true,
      "selectOne": true,
      "tags": [
        { "id": "tag1", "name": "Bug" },
        { "id": "tag2", "name": "Feature" }
      ]
    }
  ]
}
\`\`\`

**CRITICAL - Mandatory Tag Groups**:
When creating/updating tasks, you MUST include tags from all mandatory tag groups:
- **mandatory: true** - At least one tag from this group is required
- **selectOne: true** - Exactly ONE tag must be selected from this group
- **selectOne: false** - One OR MORE tags must be selected from this group

Failing to provide required tags will result in a 500 error.

**URL Pattern Recognition**:
When given a Dooray URL like "https://nhnent.dooray.com/task/PROJECT_ID", extract the PROJECT_ID (the first numeric ID after "/task/") and use it as the projectId parameter.

**Pagination**:
- Default page size is 100 (maximum) to retrieve all tags
- Use page parameter to get additional pages if totalCount > 100

**Examples**:
- Get all tags: {"projectId": "123456"}
- Get second page: {"projectId": "123456", "page": 1, "size": 100}

Use tag IDs when creating or updating tasks with create-task or update-task tools.`,
  inputSchema: {
    type: 'object',
    properties: {
      projectId: {
        type: 'string',
        description: 'Project ID to get tags from',
      },
      page: {
        type: 'number',
        description: 'Page number for pagination (default: 0)',
      },
      size: {
        type: 'number',
        description: 'Number of items per page (default: 100, max: 100)',
      },
    },
    required: ['projectId'],
  },
};
