/**
 * Member Transform Utility
 * Transforms member format from MCP tool format to Dooray API format
 */

import { DoorayApiMember } from '../types/dooray-api.js';

export interface MemberInput {
  id: string;
  type: 'member' | 'group' | 'email';
}

/**
 * Transform member format from MCP tool format to Dooray API format
 *
 * MCP Format: { id: "123", type: "member" }
 * Dooray API Format:
 *   - member: { type: "member", member: { organizationMemberId: "123" } }
 *   - email: { type: "emailUser", emailUser: { emailAddress: "user@example.com" } }
 *   - group: { type: "group", group: { projectMemberGroupId: "123" } }
 */
export function transformMembers(members?: MemberInput[]): DoorayApiMember[] | undefined {
  if (!members || members.length === 0) return undefined;

  return members.map(m => {
    switch (m.type) {
      case 'member':
        return {
          type: 'member',
          member: {
            organizationMemberId: m.id,
          },
        };
      case 'email':
        return {
          type: 'emailUser',
          emailUser: {
            emailAddress: m.id,
          },
        };
      case 'group':
        return {
          type: 'group',
          group: {
            projectMemberGroupId: m.id,
          },
        };
      default:
        throw new Error(`Unknown member type: ${m.type}`);
    }
  });
}

/**
 * Convert task users from a get-task response back to the request format
 * Response users carry extra fields (name, group members) that the update API does not take
 */
export function toRequestMembers(users?: unknown[]): DoorayApiMember[] {
  if (!users) return [];

  return users.flatMap((user): DoorayApiMember[] => {
    const u = user as {
      type?: string;
      member?: { organizationMemberId?: string };
      emailUser?: { emailAddress?: string; name?: string };
      group?: { projectMemberGroupId?: string };
    };
    if (u.type === 'member' && u.member?.organizationMemberId) {
      return [{ type: 'member', member: { organizationMemberId: u.member.organizationMemberId } }];
    }
    if (u.type === 'emailUser' && u.emailUser?.emailAddress) {
      return [{ type: 'emailUser', emailUser: { emailAddress: u.emailUser.emailAddress, name: u.emailUser.name } }];
    }
    if (u.type === 'group' && u.group?.projectMemberGroupId) {
      return [{ type: 'group', group: { projectMemberGroupId: u.group.projectMemberGroupId } }];
    }
    return [];
  });
}

function memberKey(member: DoorayApiMember): string {
  return [
    member.type,
    member.member?.organizationMemberId ?? member.emailUser?.emailAddress ?? member.group?.projectMemberGroupId,
  ].join(':');
}

/**
 * Add and remove members on top of the current list, keeping order and dropping duplicates
 */
export function mergeMembers(
  current: DoorayApiMember[],
  add: DoorayApiMember[] = [],
  remove: DoorayApiMember[] = []
): DoorayApiMember[] {
  const removeKeys = new Set(remove.map(memberKey));
  const merged = new Map<string, DoorayApiMember>();
  for (const member of [...current, ...add]) {
    const key = memberKey(member);
    if (!removeKeys.has(key) && !merged.has(key)) merged.set(key, member);
  }
  return [...merged.values()];
}
