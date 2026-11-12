/**
 * Get Task Comment List Tool
 * Get list of comments on a specific task
 */

import { z } from 'zod';
import * as projectsApi from '../../api/projects.js';
import { formatError } from '../../utils/errors.js';
import { filterTaskCommentForList, filterPaginatedResponse } from '../../utils/response-filters.js';

export const getTaskCommentListSchema = z.object({
  projectId: z.string().describe('Project ID where the task belongs'),
  taskId: z.string().describe('Task ID to get comments from'),
  page: z.number().min(0).optional().describe('Page number (default: 0)'),
  size: z.number().min(1).max(100).optional().describe('Items per page (default: 20, max: 100)'),
  order: z.enum(['createdAt', '-createdAt']).optional().describe('Sort order: createdAt (oldest first, default), -createdAt (newest first)'),
});

export type GetTaskCommentListInput = z.infer<typeof getTaskCommentListSchema>;

export async function getTaskCommentListHandler(args: GetTaskCommentListInput) {
  try {
    const result = await projectsApi.getTaskComments({
      projectId: args.projectId,
      taskId: args.taskId,
      page: args.page,
      size: args.size,
      order: args.order,
    });

    // Filter response to reduce token usage
    const filtered = filterPaginatedResponse(result, filterTaskCommentForList);

    return {
      content: [{ type: 'text', text: JSON.stringify(filtered) }],
    };
  } catch (error) {
    return {
      content: [{ type: 'text', text: `Error: ${formatError(error)}` }],
      isError: true,
    };
  }
}

export const getTaskCommentListTool = {
  name: 'get-task-comment-list',
  description: `Get list of comments (댓글) on a specific Dooray task.

This tool fetches all comments that have been added to a task. Comments are discussions, updates, or notes added by team members.

**URL Pattern Recognition**:
When given a Dooray task URL like "https://nhnent.dooray.com/task/PROJECT_ID/TASK_ID" or "https://nhnent.dooray.com/project/tasks/TASK_ID":
- Extract the first numeric ID after "/task/" as projectId (if present)
- Extract the second numeric ID (or the ID after "/tasks/") as taskId

**IMPORTANT**: Both projectId and taskId are REQUIRED.

**Pagination**:
- Default page size is 20 (maximum: 100)
- Use page parameter to get additional pages if totalCount > size

**Sorting**:
- Default: createdAt (oldest comments first)
- Use "-createdAt" to get newest comments first

**Note**: Returns filtered response with essential fields only (id, creator, body).

Examples:
- Get all comments (first page): {"projectId": "123456", "taskId": "789012"}
- Get newest comments first: {"projectId": "123456", "taskId": "789012", "order": "-createdAt"}
- Get second page: {"projectId": "123456", "taskId": "789012", "page": 1, "size": 20}

Returns a paginated response with totalCount and array of comments containing:
- **id**: Comment ID
- **creator**: Who wrote the comment (member or emailUser)
  - For members: {"type": "member", "member": {"organizationMemberId": "..."}}
  - For email users: {"type": "emailUser", "emailUser": {"emailAddress": "...", "name": "..."}}
- **body**: Comment content with mimeType and content

Use this tool to view discussion history, progress updates, or notes on a task.`,
  inputSchema: {
    type: 'object',
    properties: {
      projectId: {
        type: 'string',
        description: 'Project ID where the task belongs',
      },
      taskId: {
        type: 'string',
        description: 'Task ID to get comments from',
      },
      page: {
        type: 'number',
        description: 'Page number (default: 0)',
      },
      size: {
        type: 'number',
        description: 'Items per page (default: 20, max: 100)',
      },
      order: {
        type: 'string',
        enum: ['createdAt', '-createdAt'],
        description: 'Sort order: createdAt (oldest first, default), -createdAt (newest first)',
      },
    },
    required: ['projectId', 'taskId'],
  },
};
