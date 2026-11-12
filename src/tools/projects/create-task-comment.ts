/**
 * Create Task Comment Tool
 * Add a comment to an existing task
 */

import { z } from 'zod';
import * as projectsApi from '../../api/projects.js';
import { formatError } from '../../utils/errors.js';

const bodySchema = z.object({
  mimeType: z.enum(['text/x-markdown', 'text/html']),
  content: z.string(),
});

export const createTaskCommentSchema = z.object({
  projectId: z.string().describe('Project ID where the task belongs'),
  taskId: z.string().describe('Task ID to add comment to'),
  body: bodySchema.describe('Comment content'),
  attachFileIds: z.array(z.string()).optional().describe('Array of file IDs to attach (optional)'),
});

export type CreateTaskCommentInput = z.infer<typeof createTaskCommentSchema>;

export async function createTaskCommentHandler(args: CreateTaskCommentInput) {
  try {
    const result = await projectsApi.createTaskComment({
      projectId: args.projectId,
      taskId: args.taskId,
      body: args.body,
      attachFileIds: args.attachFileIds,
    });

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

export const createTaskCommentTool = {
  name: 'create-task-comment',
  description: `Add a comment (댓글) to an existing Dooray task.

This tool creates a comment on a task, separate from editing the task body itself. Use this for:
- Adding progress updates or status notes
- Responding to questions or discussions
- Logging information related to the task
- Attaching files with context

**When to Use**:
- **create-task-comment**: For adding discussion, updates, or notes (댓글)
- **update-task**: For modifying the task description, title, or metadata

**URL Pattern Recognition**:
When given a Dooray task URL like "https://nhnent.dooray.com/task/PROJECT_ID/TASK_ID":
- Extract the first numeric ID after "/task/" as projectId
- Extract the second numeric ID as taskId

**File Attachments**:
- To attach files, first upload them using the file upload API
- Then provide the returned file IDs in the attachFileIds parameter
- See: https://helpdesk.dooray.com/share/pages/9wWo-xwiR66BO5LGshgVTg/2939987647631384419

**Content Format**:
- Use "text/x-markdown" for markdown formatting (recommended)
- Use "text/html" for rich HTML content
- Body format: {"mimeType": "text/x-markdown", "content": "..."}

**Examples**:
- Simple comment: {
    "projectId": "123456",
    "taskId": "789012",
    "body": {"mimeType": "text/x-markdown", "content": "Progress update: Completed initial implementation"}
  }
- With markdown: {
    "projectId": "123456",
    "taskId": "789012",
    "body": {
      "mimeType": "text/x-markdown",
      "content": "## Test Results\\n\\n- ✅ All unit tests passing\\n- ✅ Integration tests passed\\n- ⏳ Performance testing in progress"
    }
  }
- With file attachments: {
    "projectId": "123456",
    "taskId": "789012",
    "body": {"mimeType": "text/x-markdown", "content": "See attached screenshots"},
    "attachFileIds": ["file123", "file456"]
  }

Returns: Created comment with ID.`,
  inputSchema: {
    type: 'object',
    properties: {
      projectId: {
        type: 'string',
        description: 'Project ID where the task belongs',
      },
      taskId: {
        type: 'string',
        description: 'Task ID to add comment to',
      },
      body: {
        type: 'object',
        properties: {
          mimeType: {
            type: 'string',
            enum: ['text/x-markdown', 'text/html'],
            description: 'Content format (use text/x-markdown for most cases)',
          },
          content: {
            type: 'string',
            description: 'Comment content',
          },
        },
        required: ['mimeType', 'content'],
        description: 'Comment content with format',
      },
      attachFileIds: {
        type: 'array',
        items: { type: 'string' },
        description: 'Array of file IDs to attach (optional). Files must be uploaded first using the file upload API.',
      },
    },
    required: ['projectId', 'taskId', 'body'],
  },
};
