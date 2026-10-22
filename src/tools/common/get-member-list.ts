/**
 * Get Member List Tool
 * Search organization members (not limited to a project)
 */

import { z } from 'zod';
import * as commonApi from '../../api/common.js';
import { formatError } from '../../utils/errors.js';

export const getMemberListSchema = z.object({
  name: z.string().optional().describe('Member name'),
  userCode: z.string().optional().describe('User ID (like match)'),
  userCodeExact: z.string().optional().describe('User ID (exact match)'),
  externalEmailAddresses: z.array(z.string()).optional().describe('Email addresses (exact match)'),
  idProviderUserId: z.string().optional().describe('SSO user ID (e.g. employee number)'),
  page: z.number().min(0).optional().describe('Page number (default: 0)'),
  size: z.number().min(1).max(100).optional().describe('Items per page (default: 20, max: 100)'),
});

export type GetMemberListInput = z.infer<typeof getMemberListSchema>;

export async function getMemberListHandler(args: GetMemberListInput) {
  try {
    const result = await commonApi.searchMembers(args);

    // Return compact response with essential fields only
    const compactResult = {
      totalCount: result.totalCount,
      data: result.data.map(member => ({
        id: member.id,
        name: member.name,
        userCode: member.userCode,
        externalEmailAddress: member.externalEmailAddress,
      })),
    };

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(compactResult, null, 2),
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

export const getMemberListTool = {
  name: 'get-member-list',
  description: `Search members across the whole Dooray organization (조직 전체 멤버 검색).

Unlike get-project-member-list, this is not limited to one project. Use it to find the organizationMemberId of someone outside the project (e.g. to add them as CC by email or member ID).

**Search Conditions** (combine as needed):
- name: Member name
- userCode: User ID, like match
- userCodeExact: User ID, exact match
- externalEmailAddresses: Email addresses, exact match only (not a like search)
- idProviderUserId: SSO user ID (e.g. employee number)

**Examples**:
- By name: {"name": "홍길동"}
- By email: {"externalEmailAddresses": ["user@example.com"]}
- By user ID: {"userCodeExact": "gildong.hong"}

Returns: totalCount and members with id (organizationMemberId), name, userCode, externalEmailAddress. Use get-member for full details.`,
  inputSchema: {
    type: 'object',
    properties: {
      name: {
        type: 'string',
        description: 'Member name',
      },
      userCode: {
        type: 'string',
        description: 'User ID (like match)',
      },
      userCodeExact: {
        type: 'string',
        description: 'User ID (exact match)',
      },
      externalEmailAddresses: {
        type: 'array',
        items: { type: 'string' },
        description: 'Email addresses (exact match)',
      },
      idProviderUserId: {
        type: 'string',
        description: 'SSO user ID (e.g. employee number)',
      },
      page: {
        type: 'number',
        minimum: 0,
        description: 'Page number (default: 0)',
      },
      size: {
        type: 'number',
        minimum: 1,
        maximum: 100,
        description: 'Items per page (default: 20, max: 100)',
      },
    },
  },
};
