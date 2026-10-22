import { test } from 'node:test';
import assert from 'node:assert/strict';
import { transformMembers } from '../src/utils/member-transform.js';

test('member, email, group are converted to the Dooray API user format', () => {
  assert.deepEqual(
    transformMembers([
      { id: '1', type: 'member' },
      { id: 'user@example.com', type: 'email' },
      { id: '2', type: 'group' },
    ]),
    [
      { type: 'member', member: { organizationMemberId: '1' } },
      { type: 'emailUser', emailUser: { emailAddress: 'user@example.com' } },
      { type: 'group', group: { projectMemberGroupId: '2' } },
    ]
  );
});

test('empty input returns undefined', () => {
  assert.equal(transformMembers([]), undefined);
  assert.equal(transformMembers(undefined), undefined);
});
