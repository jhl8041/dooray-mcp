/**
 * Get Task List Tool
 * Get list of tasks with filters
 */

import { z } from 'zod';
import * as projectsApi from '../../api/projects.js';
import { formatError } from '../../utils/errors.js';
import { filterTaskForList, filterPaginatedResponse } from '../../utils/response-filters.js';

export const getTaskListSchema = z.object({
  projectId: z.string().describe('Project ID (required)'),
  // Member filters
  fromEmailAddress: z.string().optional().describe('Filter by creator email address'),
  fromMemberIds: z.array(z.string()).optional().describe('Filter by creator member IDs (organizationMemberId)'),
  toMemberIds: z.array(z.string()).optional().describe('Filter by assignee member IDs (organizationMemberId)'),
  ccMemberIds: z.array(z.string()).optional().describe('Filter by CC member IDs (organizationMemberId)'),
  // Task filters
  tagIds: z.array(z.string()).optional().describe('Filter by tag IDs'),
  parentPostId: z.string().optional().describe('Filter by parent post ID (get subtasks)'),
  postNumber: z.number().optional().describe('Filter by specific task number'),
  postWorkflowClasses: z.array(z.string()).optional().describe('Filter by workflow classes: backlog, registered, working, closed'),
  postWorkflowIds: z.array(z.string()).optional().describe('Filter by workflow IDs defined in the project'),
  milestoneIds: z.array(z.string()).optional().describe('Filter by milestone IDs'),
  subjects: z.string().optional().describe('Partial match on the task title only'),
  // Date filters (supports: today, thisweek, prev-Nd, next-Nd, or ISO8601 range like "2021-01-01T00:00:00+09:00~2021-01-10T00:00:00+09:00")
  createdAt: z.string().optional().describe('Filter by creation date (today, thisweek, prev-7d, next-7d, or ISO8601 range)'),
  updatedAt: z.string().optional().describe('Filter by update date (today, thisweek, prev-7d, next-7d, or ISO8601 range)'),
  dueAt: z.string().optional().describe('Filter by due date (today, thisweek, prev-7d, next-7d, or ISO8601 range)'),
  // Sorting
  order: z.string().optional().default('-postUpdatedAt').describe('Sort order: postDueAt, postUpdatedAt, createdAt (prefix with - for descending, e.g., -createdAt). Default: -postUpdatedAt (most recently updated first)'),
  // Pagination
  page: z.number().min(0).optional().describe('Page number (default: 0)'),
  size: z.number().min(1).max(100).optional().describe('Items per page (default: 20, max: 100)'),
});

export type GetTaskListInput = z.infer<typeof getTaskListSchema>;

export async function getTaskListHandler(args: GetTaskListInput) {
  try {
    const result = await projectsApi.getTasks({
      projectId: args.projectId,
      fromEmailAddress: args.fromEmailAddress,
      fromMemberIds: args.fromMemberIds,
      toMemberIds: args.toMemberIds,
      ccMemberIds: args.ccMemberIds,
      tagIds: args.tagIds,
      parentPostId: args.parentPostId,
      postNumber: args.postNumber,
      postWorkflowClasses: args.postWorkflowClasses,
      postWorkflowIds: args.postWorkflowIds,
      milestoneIds: args.milestoneIds,
      subjects: args.subjects,
      createdAt: args.createdAt,
      updatedAt: args.updatedAt,
      dueAt: args.dueAt,
      order: args.order,
      page: args.page,
      size: args.size,
    });

    // Filter to compact response to reduce token usage
    const compactResult = filterPaginatedResponse(result, filterTaskForList);

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

export const getTaskListTool = {
  name: 'get-task-list',
  description: `Get list of tasks in a Dooray project with powerful filtering and sorting.

**IMPORTANT**: projectId is REQUIRED. This tool fetches tasks from a specific project.

**Note**: Returns compact response with essential fields only. For complete task details, use get-task.

**URL Pattern Recognition**:
When given a Dooray URL like "https://nhnent.dooray.com/task/PROJECT_ID" or "https://nhnent.dooray.com/task/PROJECT_ID/TASK_ID", extract the PROJECT_ID (the first numeric ID after "/task/") and use it as the projectId parameter. When a URL is provided, use get-project for project info instead of get-project-list.

**Member ID Filters** (use organizationMemberId from get-my-member-info):
- toMemberIds: Tasks assigned to specific members
- ccMemberIds: Tasks where members are in CC
- fromMemberIds: Tasks created by specific members

**Workflow Filters**:
- postWorkflowClasses: ["backlog", "registered", "working", "closed"]
- postWorkflowIds: Project-specific workflow IDs

**Date Filters** (flexible patterns):
- "today" - Today's tasks
- "thisweek" - This week's tasks
- "prev-7d" - Last 7 days
- "next-7d" - Next 7 days
- ISO8601 range: "2021-01-01T00:00:00+09:00~2021-01-10T00:00:00+09:00"

**Examples**:
1. All tasks in project:
   {"projectId": "123456"}

2. Tasks assigned to me:
   {"projectId": "123456", "toMemberIds": ["my-org-member-id"]}

3. Tasks in "working" status:
   {"projectId": "123456", "postWorkflowClasses": ["working"]}

4. Tasks due today:
   {"projectId": "123456", "dueAt": "today"}

5. Recent tasks (sorted by update time):
   {"projectId": "123456", "updatedAt": "prev-7d", "order": "-postUpdatedAt"}

6. Tasks with specific milestone and tags:
   {"projectId": "123456", "milestoneIds": ["milestone123"], "tagIds": ["tag456"]}

**Sorting**:
- Default: Tasks are sorted by most recently updated first (-postUpdatedAt)
- Custom: Use order parameter with: postDueAt, postUpdatedAt, createdAt
- Prefix with - for descending (e.g., "-createdAt")

**Title search**: subjects matches part of the task title only. Body and comments are not searched, so 0 results does not mean no task mentions the keyword.

Returns totalCount and tasks with id, number, subject, workflowClass, priority, milestone, tags (id only), createdAt, updatedAt. Assignees, CC and dueDate are not included: use get-task.`,
  inputSchema: {
    type: 'object',
    properties: {
      projectId: {
        type: 'string',
        description: 'Project ID (REQUIRED)',
      },
      fromEmailAddress: {
        type: 'string',
        description: 'Filter by creator email address',
      },
      fromMemberIds: {
        type: 'array',
        items: { type: 'string' },
        description: 'Filter by creator member IDs',
      },
      toMemberIds: {
        type: 'array',
        items: { type: 'string' },
        description: 'Filter by assignee member IDs (organizationMemberId)',
      },
      ccMemberIds: {
        type: 'array',
        items: { type: 'string' },
        description: 'Filter by CC member IDs',
      },
      tagIds: {
        type: 'array',
        items: { type: 'string' },
        description: 'Filter by tag IDs',
      },
      parentPostId: {
        type: 'string',
        description: 'Filter by parent post ID (get subtasks)',
      },
      postNumber: {
        type: 'number',
        description: 'Filter by specific task number',
      },
      postWorkflowClasses: {
        type: 'array',
        items: { type: 'string' },
        description: 'Filter by workflow classes: backlog, registered, working, closed',
      },
      postWorkflowIds: {
        type: 'array',
        items: { type: 'string' },
        description: 'Filter by workflow IDs',
      },
      milestoneIds: {
        type: 'array',
        items: { type: 'string' },
        description: 'Filter by milestone IDs',
      },
      subjects: {
        type: 'string',
        description: 'Partial match on the task title only. Body and comments are not searched',
      },
      createdAt: {
        type: 'string',
        description: 'Filter by creation date (today, thisweek, prev-7d, next-7d, or ISO8601 range)',
      },
      updatedAt: {
        type: 'string',
        description: 'Filter by update date (today, thisweek, prev-7d, next-7d, or ISO8601 range)',
      },
      dueAt: {
        type: 'string',
        description: 'Filter by due date (today, thisweek, prev-7d, next-7d, or ISO8601 range)',
      },
      order: {
        type: 'string',
        description: 'Sort order: postDueAt, postUpdatedAt, createdAt (prefix with - for descending)',
      },
      page: {
        type: 'number',
        description: 'Page number (default: 0)',
        minimum: 0,
      },
      size: {
        type: 'number',
        description: 'Items per page (default: 20, max: 100)',
        minimum: 1,
        maximum: 100,
      },
    },
    required: ['projectId'],
  },
};
