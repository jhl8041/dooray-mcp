/**
 * Get Project Tool
 * Get detailed information about a specific project
 */

import { z } from 'zod';
import * as projectsApi from '../../api/projects.js';
import { formatError } from '../../utils/errors.js';

export const getProjectSchema = z.object({
  projectId: z.string().describe('Project ID'),
});

export type GetProjectInput = z.infer<typeof getProjectSchema>;

export async function getProjectHandler(args: GetProjectInput) {
  try {
    const result = await projectsApi.getProjectDetails(args.projectId);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result),
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

export const getProjectTool = {
  name: 'get-project',
  description: `Get detailed information about a specific Dooray project.

This tool retrieves complete details of a single project including its configuration, scope, organization, and category information.

**URL Pattern Recognition**:
When given a Dooray URL like "https://nhnent.dooray.com/task/PROJECT_ID" or "https://nhnent.dooray.com/task/PROJECT_ID/TASK_ID", extract the PROJECT_ID (the first numeric ID after "/task/") and use it as the projectId parameter.

**IMPORTANT**: When a specific project URL is provided, use this tool directly instead of calling get-project-list first.

Examples:
- From URL: Extract "1769381697328002548" from "https://nhnent.dooray.com/task/1769381697328002548" → {"projectId": "1769381697328002548"}
- From URL with task: Extract "1769381697328002548" from "https://nhnent.dooray.com/task/1769381697328002548/4143841687558152504" → {"projectId": "1769381697328002548"}
- Direct ID: {"projectId": "123456"}
- "Show me details of project 123456"

Returns project information including:
- **id**, **code**, **name**: Basic project identifiers
- **description**: Project description
- **scope**: private or public
- **organizationId**: Organization this project belongs to
- **projectCategoryId**: Category ID (null if no category)
- **projectType**: default, task, or issue
- **state**: active or archived

Use this to get full details about a specific project when you have its project ID or URL.`,
  inputSchema: {
    type: 'object',
    properties: {
      projectId: {
        type: 'string',
        description: 'Project ID to retrieve details for',
      },
    },
    required: ['projectId'],
  },
};
