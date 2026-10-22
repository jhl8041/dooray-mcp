/**
 * Get Task Tool
 * Get detailed information about a specific task
 */

import { z } from 'zod';
import * as projectsApi from '../../api/projects.js';
import { formatError } from '../../utils/errors.js';

export const getTaskSchema = z.object({
  taskId: z.string().describe('Task ID (unique identifier)'),
  projectId: z.string().optional().describe('Project ID (optional)'),
});

export type GetTaskInput = z.infer<typeof getTaskSchema>;

export async function getTaskHandler(args: GetTaskInput) {
  try {
    const result = await projectsApi.getTaskDetails(args.taskId, args.projectId);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2),
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

export const getTaskTool = {
  name: 'get-task',
  description: `Get detailed information about a specific task.

This tool retrieves complete details of a task including its full body content, attachments, workflow status, assignees, and all metadata.

**URL Pattern Recognition - Two formats supported**:

1. **Project-scoped URL**: "https://nhnent.dooray.com/task/PROJECT_ID/TASK_ID"
   - Extract the first numeric ID after "/task/" as projectId (optional)
   - Extract the second numeric ID as taskId (required)
   - Example: "https://nhnent.dooray.com/task/1769381697328002548/4206132384174602537"
     → {"taskId": "4206132384174602537", "projectId": "1769381697328002548"}

2. **Task-only URL**: "https://nhnent.dooray.com/project/tasks/TASK_ID"
   - Extract the numeric ID after "/tasks/" as taskId
   - Example: "https://nhnent.dooray.com/project/tasks/4206132384174602537"
     → {"taskId": "4206132384174602537"}
   - Same for "https://nhnent.dooray.com/task/to/TASK_ID"

**IMPORTANT**:
- **taskId is REQUIRED**, projectId is OPTIONAL
- The taskId is the unique identifier (ID) from the URL, NOT the sequential task number shown in the UI
- You can fetch task details with just the taskId without knowing the projectId
- When a specific task URL is provided, use this tool directly instead of calling get-project-list first
- To find taskId from task descriptions, use get-task-list to search and get task IDs

Examples:
- From URL pattern 1: {"taskId": "4206132384174602537", "projectId": "1769381697328002548"}
- From URL pattern 2: {"taskId": "4206132384174602537"}
- Just taskId: {"taskId": "789012345"}
- With both IDs: {"taskId": "789012345", "projectId": "123456"}

**Returns complete task information including:**
- **Basic info**: id, number, subject, taskNumber (PROJECT-CODE/NUMBER format)
- **Project**: project object with id and code
- **Status**: workflowClass (registered/working/closed), workflow (id and name), closed flag, priority
- **Dates**: createdAt, updatedAt, dueDate, dueDateFlag
- **Content**: body with mimeType (text/x-markdown or text/html) and content
- **Hierarchy**: parent task information (id, number, subject) if this is a subtask
- **People**: users object with from (creator), to (assignees), cc (watchers)
- **Organization**: milestone (id, name), tags array (id, name)
- **Files**: files array with attachments (id, name, size)`,
  inputSchema: {
    type: 'object',
    properties: {
      taskId: {
        type: 'string',
        description: 'Task ID (unique identifier, REQUIRED)',
      },
      projectId: {
        type: 'string',
        description: 'Project ID (optional, can be omitted)',
      },
    },
    required: ['taskId'],
  },
};
