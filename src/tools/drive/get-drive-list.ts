/**
 * Get Drive List Tool
 * Get list of accessible drives
 */

import { z } from 'zod';
import * as driveApi from '../../api/drive.js';
import { formatError } from '../../utils/errors.js';

export const getDriveListSchema = z.object({
  type: z.enum(['private', 'project']).optional().describe('Drive type: private (personal) or project'),
  scope: z.enum(['private', 'public']).optional().describe('Project scope (only when type=project): private or public'),
  state: z.string().optional().describe('Project state filter (e.g. "active", "archived"). Default: active'),
  projectId: z.string().optional().describe('Filter by project ID'),
});

export type GetDriveListInput = z.infer<typeof getDriveListSchema>;

export async function getDriveListHandler(args: GetDriveListInput) {
  try {
    const result = await driveApi.getDrives(args);
    return { content: [{ type: 'text', text: JSON.stringify(result) }] };
  } catch (error) {
    return { content: [{ type: 'text', text: `Error: ${formatError(error)}` }], isError: true };
  }
}

export const getDriveListTool = {
  name: 'get-drive-list',
  description: `Get list of accessible Dooray drives.

**Drive Types:**
- private: Personal drive (default)
- project: Project drives (use scope to filter private/public projects)

**Examples:**
- Personal drive: { "type": "private" }
- Project drives: { "type": "project", "scope": "private" }
- Public project drives: { "type": "project", "scope": "public" }

Returns: drive ID, name, type, and associated project info.`,
  inputSchema: {
    type: 'object',
    properties: {
      type: { type: 'string', enum: ['private', 'project'], description: 'Drive type: private or project' },
      scope: { type: 'string', enum: ['private', 'public'], description: 'Project scope (only when type=project)' },
      state: { type: 'string', description: 'Project state filter (default: active)' },
      projectId: { type: 'string', description: 'Filter by project ID' },
    },
  },
};
