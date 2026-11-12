/**
 * Get Project Workflow List Tool
 * Retrieve workflow statuses (업무 상태) for a project
 */

import { z } from 'zod';
import * as projectsApi from '../../api/projects.js';
import { formatError } from '../../utils/errors.js';
import { filterWorkflowForList } from '../../utils/response-filters.js';

export const getProjectWorkflowListSchema = z.object({
  projectId: z.string().describe('Project ID to get workflows from'),
});

export type GetProjectWorkflowListInput = z.infer<typeof getProjectWorkflowListSchema>;

export async function getProjectWorkflowListHandler(args: GetProjectWorkflowListInput) {
  try {
    const result = await projectsApi.getProjectWorkflows({
      projectId: args.projectId,
    });

    // Filter to compact response to reduce token usage
    const compactResult = result.map(filterWorkflowForList);

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

export const getProjectWorkflowListTool = {
  name: 'get-project-workflow-list',
  description: `Get list of workflow statuses (업무 상태) for a project.

Workflows represent the task statuses available in a project. There are four workflow classes:
- backlog: 대기 (waiting/backlog)
- registered: 등록/할 일 (registered/to-do)
- working: 진행 중 (in progress)
- closed: 완료 (completed/done)

Each project may have custom workflows within these classes. Use workflow IDs when creating or updating tasks (e.g., in create-task or update-task tools).

**URL Pattern Recognition**:
When given a Dooray URL like "https://nhnent.dooray.com/task/PROJECT_ID", extract the PROJECT_ID (the numeric ID after "/task/") and use it as the projectId parameter.

Examples:
- Get all workflows: {"projectId": "1769381697328002548"}

Returns: Array of workflows with id, name, order, and class.`,
  inputSchema: {
    type: 'object',
    properties: {
      projectId: {
        type: 'string',
        description: 'Project ID to get workflow statuses from',
      },
    },
    required: ['projectId'],
  },
};
