/**
 * Update Task Body Tool
 * Replace part of a task body (본문 일부 치환)
 */

import { z } from 'zod';
import * as projectsApi from '../../api/projects.js';
import { formatError } from '../../utils/errors.js';
import { replaceText } from '../../utils/text-replace.js';

export const updateTaskBodySchema = z.object({
  projectId: z.string().describe('Project ID'),
  taskId: z.string().describe('Task ID'),
  oldText: z.string().describe('Exact text to replace in the current body'),
  newText: z.string().describe('Replacement text'),
  replaceAll: z.boolean().optional().describe('Replace every occurrence (default: false)'),
});

export type UpdateTaskBodyInput = z.infer<typeof updateTaskBodySchema>;

export async function updateTaskBodyHandler(args: UpdateTaskBodyInput) {
  try {
    const task = await projectsApi.getTaskDetails(args.taskId, args.projectId);
    if (!task.body) {
      throw new Error('Task has no body to replace');
    }

    const replaced = replaceText(task.body.content, args.oldText, args.newText, args.replaceAll);

    // Keep the current mimeType so markdown is not stored as html (or the other way around)
    await projectsApi.updateTask(args.projectId, args.taskId, {
      body: { mimeType: task.body.mimeType, content: replaced.content },
    });

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({ success: true, replacedCount: replaced.count, mimeType: task.body.mimeType }, null, 2),
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

export const updateTaskBodyTool = {
  name: 'update-task-body',
  description: `Replace part of a task body (업무 본문 일부 치환).

Use this instead of update-task when only a few spots in a long body change. It reads the current body, replaces oldText with newText, and saves it with the same mimeType. The rest of the body (including inline images and file links) stays as it is.

**Rules**:
- oldText must match the current body exactly (copy it from get-task)
- Fails if oldText is not found
- Fails if oldText appears more than once, unless replaceAll is true. Add surrounding text to make it unique

**Examples**:
- {"projectId": "123", "taskId": "456", "oldText": "2. 배포", "newText": "2. 카나리 배포"}
- {"projectId": "123", "taskId": "456", "oldText": "TODO", "newText": "완료", "replaceAll": true}

Returns: replacedCount and the body mimeType.`,
  inputSchema: {
    type: 'object',
    properties: {
      projectId: {
        type: 'string',
        description: 'Project ID',
      },
      taskId: {
        type: 'string',
        description: 'Task ID',
      },
      oldText: {
        type: 'string',
        description: 'Exact text to replace in the current body',
      },
      newText: {
        type: 'string',
        description: 'Replacement text',
      },
      replaceAll: {
        type: 'boolean',
        description: 'Replace every occurrence (default: false)',
      },
    },
    required: ['projectId', 'taskId', 'oldText', 'newText'],
  },
};
