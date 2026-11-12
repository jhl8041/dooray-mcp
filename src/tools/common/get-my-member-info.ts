/**
 * Get My Member Info Tool
 * Get information about the authenticated user
 */

import { z } from 'zod';
import * as commonApi from '../../api/common.js';
import { formatError } from '../../utils/errors.js';

export const getMyMemberInfoSchema = z.object({});

export type GetMyMemberInfoInput = z.infer<typeof getMyMemberInfoSchema>;

export async function getMyMemberInfoHandler(args: GetMyMemberInfoInput) {
  try {
    const result = await commonApi.getMyMemberInfo();

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

export const getMyMemberInfoTool = {
  name: 'get-my-member-info',
  description: `Get information about the authenticated user.

This tool retrieves your Dooray member profile using your API token. Most importantly, it returns your member ID which is needed for other operations like filtering tasks by assignee.

No parameters needed - it automatically uses your authentication token.

Examples:
- Get my info: {} (empty parameters)
- "What's my Dooray member ID?"
- "Show my Dooray profile"

Returns your complete member profile including:
- **id**: Your member ID (important for task queries)
- name, email, organization
- locale, timezone settings
- display preferences

This is often the first tool to call to get your member ID for use in other tools like list-tasks.`,
  inputSchema: {
    type: 'object',
    properties: {},
  },
};
