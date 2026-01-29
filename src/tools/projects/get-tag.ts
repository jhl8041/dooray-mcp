/**
 * MCP Tool: get-tag
 * Get details of a specific tag in a Dooray project
 */

import { z } from 'zod';
import * as projectsApi from '../../api/projects.js';
import { formatError } from '../../utils/errors.js';

export const getTagSchema = z.object({
  projectId: z.string().describe('Project ID'),
  tagId: z.string().describe('Tag ID'),
});

export type GetTagInput = z.infer<typeof getTagSchema>;

export async function getTagHandler(args: GetTagInput) {
  try {
    const result = await projectsApi.getTagDetails(args.projectId, args.tagId);

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

export const getTagTool = {
  name: 'get-tag',
  description: `Get details of a specific tag in a Dooray project.

**Response Format**:
\`\`\`json
{
  "id": "12345",
  "name": "Priority:High",
  "color": "ff0000",
  "tagGroup": {
    "id": "group123",
    "name": "Priority",
    "mandatory": true,
    "selectOne": true
  }
}
\`\`\`

**Response Fields**:
- **id**: Tag ID
- **name**: Tag name (includes group prefix if it's a group tag)
- **color**: Hex color code without #
- **tagGroup**: Tag group information (null for individual tags)
  - **id**: Group ID
  - **name**: Group name
  - **mandatory**: If true, at least one tag from this group is required when creating tasks
  - **selectOne**: If true, exactly one tag must be selected; if false, multiple tags can be selected

**Examples**:
- Get tag: \`{"projectId": "123", "tagId": "456"}\`

**Use Cases**:
- Check tag details before assigning to a task
- Verify tag group settings (mandatory, selectOne)
- Get tag color and group information`,
  inputSchema: {
    type: 'object',
    properties: {
      projectId: {
        type: 'string',
        description: 'Project ID',
      },
      tagId: {
        type: 'string',
        description: 'Tag ID to get details for',
      },
    },
    required: ['projectId', 'tagId'],
  },
};
