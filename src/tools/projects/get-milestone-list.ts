/**
 * Get Milestone List Tool
 * Get list of milestones for a project
 */

import { z } from 'zod';
import * as projectsApi from '../../api/projects.js';
import { formatError } from '../../utils/errors.js';
import { filterMilestoneForList } from '../../utils/response-filters.js';

export const getMilestoneListSchema = z.object({
  projectId: z.string().describe('Project ID'),
  status: z.enum(['open', 'closed']).optional().describe('Filter by milestone status'),
});

export type GetMilestoneListInput = z.infer<typeof getMilestoneListSchema>;

export async function getMilestoneListHandler(args: GetMilestoneListInput) {
  try {
    const result = await projectsApi.getMilestones({
      projectId: args.projectId,
      status: args.status,
    });

    // Filter to compact response to reduce token usage (result is Milestone[], not paginated)
    const compactResult = result.map(filterMilestoneForList);

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

export const getMilestoneListTool = {
  name: 'get-milestone-list',
  description: `Get list of milestones for a project.

Milestones are used to organize and track tasks by release or sprint. This tool retrieves all milestones in a project.

**Note**: Returns compact response with essential fields only.

**URL Pattern Recognition**:
When given a Dooray URL like "https://nhnent.dooray.com/task/PROJECT_ID", extract the PROJECT_ID (the first numeric ID after "/task/") and use it as the projectId parameter.

Examples:
- Get all milestones: {"projectId": "123456"}
- Get only open milestones: {"projectId": "123456", "status": "open"}
- Get only closed milestones: {"projectId": "123456", "status": "closed"}

Returns an array of milestones with id, name, and status. Use milestone IDs when creating or updating tasks.`,
  inputSchema: {
    type: 'object',
    properties: {
      projectId: {
        type: 'string',
        description: 'Project ID to get milestones from',
      },
      status: {
        type: 'string',
        enum: ['open', 'closed'],
        description: 'Filter by milestone status (open or closed)',
      },
    },
    required: ['projectId'],
  },
};
