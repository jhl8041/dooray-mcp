/**
 * Get Project Member List Tool
 * Get list of project members with detailed information
 */

import { z } from 'zod';
import * as projectsApi from '../../api/projects.js';
import * as commonApi from '../../api/common.js';
import { formatError } from '../../utils/errors.js';

export const getProjectMemberListSchema = z.object({
  projectId: z.string().describe('Project ID to get members from'),
  roles: z.array(z.enum(['admin', 'member'])).optional().describe('Filter by roles (admin, member)'),
  page: z.number().optional().describe('Page number (default: 0)'),
  size: z.number().optional().describe('Items per page (default: 20, max: 100)'),
});

export type GetProjectMemberListInput = z.infer<typeof getProjectMemberListSchema>;

export async function getProjectMemberListHandler(args: GetProjectMemberListInput) {
  try {
    // Step 1: Fetch project members (only IDs and roles)
    const projectMembers = await projectsApi.getProjectMembers(args);

    // Step 2: Fetch detailed info for each member in parallel
    const memberDetailsPromises = projectMembers.data.map(async (pm) => {
      try {
        const details = await commonApi.getMemberDetails(pm.organizationMemberId);
        return {
          id: details.id,
          name: details.name,
          externalEmailAddress: details.externalEmailAddress,
        };
      } catch (error) {
        // If member details fail, return partial info
        return {
          id: pm.organizationMemberId,
          name: 'Unknown',
          externalEmailAddress: 'Unknown',
        };
      }
    });

    const enrichedMembers = await Promise.all(memberDetailsPromises);

    // Step 3: Return compact response with only requested fields
    const compactResult = {
      totalCount: projectMembers.totalCount,
      data: enrichedMembers,
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

export const getProjectMemberListTool = {
  name: 'get-project-member-list',
  description: `Get list of members in a project with their details.

This tool fetches project members and enriches each member with detailed information including name and email address.

**URL Pattern Recognition**:
When given a Dooray URL like "https://nhnent.dooray.com/task/PROJECT_ID", extract the PROJECT_ID (the first numeric ID after "/task/") and use it as the projectId parameter.

**Role Filtering**:
- Optionally filter by roles: ["admin"], ["member"], or ["admin", "member"]
- If not specified, returns all members regardless of role

**Pagination**:
- Default page size is 20 (maximum: 100)
- Use page parameter to get additional pages if totalCount > size

**Note**: Returns compact response with essential fields only (id, name, externalEmailAddress).

Examples:
- Get all members: {"projectId": "123456"}
- Get only admins: {"projectId": "123456", "roles": ["admin"]}
- Get with pagination: {"projectId": "123456", "page": 0, "size": 50}

Returns a paginated response with totalCount and array of members containing:
- **id**: Member ID (organizationMemberId)
- **name**: Member's display name
- **externalEmailAddress**: Member's email address

Use this tool to find project members for assigning tasks or understanding team composition.`,
  inputSchema: {
    type: 'object',
    properties: {
      projectId: {
        type: 'string',
        description: 'Project ID to get members from',
      },
      roles: {
        type: 'array',
        items: {
          type: 'string',
          enum: ['admin', 'member'],
        },
        description: 'Filter by roles (optional)',
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
