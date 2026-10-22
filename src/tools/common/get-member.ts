/**
 * Get Member Tool
 * Get details of an organization member
 */

import { z } from 'zod';
import * as commonApi from '../../api/common.js';
import { formatError } from '../../utils/errors.js';

export const getMemberSchema = z.object({
  memberId: z.string().describe('Organization member ID'),
});

export type GetMemberInput = z.infer<typeof getMemberSchema>;

export async function getMemberHandler(args: GetMemberInput) {
  try {
    const result = await commonApi.getMemberDetails(args.memberId);

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

export const getMemberTool = {
  name: 'get-member',
  description: `Get details of a Dooray organization member (멤버 상세).

Use the organizationMemberId found in task assignees, comment creators, calendar attendees, or get-member-list results.

**Examples**:
- {"memberId": "1234567890123456789"}

Returns: id, name, userCode, externalEmailAddress, englishName, nickname, locale, timezoneName and more.`,
  inputSchema: {
    type: 'object',
    properties: {
      memberId: {
        type: 'string',
        description: 'Organization member ID',
      },
    },
    required: ['memberId'],
  },
};
