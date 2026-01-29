/**
 * MCP Tool: update-tag-group
 * Update tag group settings in a Dooray project
 */

import { z } from 'zod';
import * as projectsApi from '../../api/projects.js';
import { formatError } from '../../utils/errors.js';

export const updateTagGroupSchema = z.object({
  projectId: z.string().describe('Project ID'),
  tagGroupId: z.string().describe('Tag group ID'),
  mandatory: z
    .boolean()
    .optional()
    .describe(
      'If true, at least one tag from this group is required when creating tasks'
    ),
  selectOne: z
    .boolean()
    .optional()
    .describe(
      'If true, exactly one tag must be selected. If false, multiple tags can be selected'
    ),
});

export type UpdateTagGroupInput = z.infer<typeof updateTagGroupSchema>;

export async function updateTagGroupHandler(args: UpdateTagGroupInput) {
  try {
    await projectsApi.updateTagGroup({
      projectId: args.projectId,
      tagGroupId: args.tagGroupId,
      mandatory: args.mandatory,
      selectOne: args.selectOne,
    });

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              success: true,
              message: 'Tag group updated successfully',
              tagGroupId: args.tagGroupId,
              updates: {
                ...(args.mandatory !== undefined && { mandatory: args.mandatory }),
                ...(args.selectOne !== undefined && { selectOne: args.selectOne }),
              },
            },
            null,
            2
          ),
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

export const updateTagGroupTool = {
  name: 'update-tag-group',
  description: `Update tag group settings in a Dooray project.

**Tag Group Settings**:
- **mandatory**: When true, at least one tag from this group must be assigned when creating/updating tasks
- **selectOne**: When true, exactly ONE tag from this group can be selected. When false, multiple tags can be selected

**Common Configurations**:
1. **Required single selection** (e.g., Priority, Status):
   \`{"mandatory": true, "selectOne": true}\`
   - User MUST select exactly one tag

2. **Required multiple selection** (e.g., Categories, Skills):
   \`{"mandatory": true, "selectOne": false}\`
   - User MUST select at least one tag, can select multiple

3. **Optional single selection**:
   \`{"mandatory": false, "selectOne": true}\`
   - User can optionally select one tag

4. **Optional multiple selection** (default):
   \`{"mandatory": false, "selectOne": false}\`
   - User can optionally select multiple tags

**Finding Tag Group ID**:
Use get-tag-list to find tags and their tagGroup information:
\`\`\`json
{
  "tagGroup": {
    "id": "group123",  // Use this as tagGroupId
    "name": "Priority",
    "mandatory": false,
    "selectOne": false
  }
}
\`\`\`

**Examples**:
- Make group required with single selection:
  \`{"projectId": "123", "tagGroupId": "group456", "mandatory": true, "selectOne": true}\`
- Allow multiple selections:
  \`{"projectId": "123", "tagGroupId": "group456", "selectOne": false}\`

**Note**: Only provide the settings you want to change. Omitted settings will not be modified.`,
  inputSchema: {
    type: 'object',
    properties: {
      projectId: {
        type: 'string',
        description: 'Project ID',
      },
      tagGroupId: {
        type: 'string',
        description:
          'Tag group ID (found in tagGroup.id from get-tag-list or get-tag response)',
      },
      mandatory: {
        type: 'boolean',
        description:
          'If true, at least one tag from this group is required when creating tasks',
      },
      selectOne: {
        type: 'boolean',
        description:
          'If true, exactly one tag must be selected. If false, multiple tags can be selected',
      },
    },
    required: ['projectId', 'tagGroupId'],
  },
};
