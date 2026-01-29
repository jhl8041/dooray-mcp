/**
 * MCP Tool: create-tag
 * Create a new tag in a Dooray project
 */

import { z } from 'zod';
import * as projectsApi from '../../api/projects.js';
import { formatError } from '../../utils/errors.js';

export const createTagSchema = z.object({
  projectId: z.string().describe('Project ID'),
  name: z
    .string()
    .describe(
      'Tag name. For individual tag: "myTag". For group tag: "groupName:tagName"'
    ),
  color: z
    .string()
    .optional()
    .describe('Tag color in hex format without # (e.g., "ffffff", "c6eab3")'),
});

export type CreateTagInput = z.infer<typeof createTagSchema>;

export async function createTagHandler(args: CreateTagInput) {
  try {
    const result = await projectsApi.createTag({
      projectId: args.projectId,
      name: args.name,
      color: args.color,
    });

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

export const createTagTool = {
  name: 'create-tag',
  description: `Create a new tag in a Dooray project.

**Tag Types**:
1. **Individual Tag**: A standalone tag without a group
   - Example: \`{"name": "urgent", "color": "ff0000"}\`

2. **Group Tag**: A tag belonging to a tag group (using "groupName:tagName" format)
   - Example: \`{"name": "Priority:High", "color": "ff0000"}\`
   - Example: \`{"name": "Priority:Medium", "color": "ffff00"}\`
   - Tags with the same group name prefix will be grouped together

**Color Format**:
- 6-character hex color code without the # symbol
- Examples: "ffffff" (white), "ff0000" (red), "c6eab3" (light green)
- If not specified, a default color will be assigned

**Response**:
Returns the created tag's ID:
\`\`\`json
{
  "id": "12345"
}
\`\`\`

**Tag Groups**:
After creating group tags, you can configure the group's behavior (mandatory, selectOne) using the update-tag-group tool.

**Examples**:
- Individual tag: \`{"projectId": "123", "name": "Bug", "color": "ff0000"}\`
- Group tag: \`{"projectId": "123", "name": "Type:Feature", "color": "00ff00"}\``,
  inputSchema: {
    type: 'object',
    properties: {
      projectId: {
        type: 'string',
        description: 'Project ID to create the tag in',
      },
      name: {
        type: 'string',
        description:
          'Tag name. Use "groupName:tagName" format for group tags, or just "tagName" for individual tags',
      },
      color: {
        type: 'string',
        description:
          'Tag color in hex format without # (e.g., "ffffff"). Optional.',
      },
    },
    required: ['projectId', 'name'],
  },
};
