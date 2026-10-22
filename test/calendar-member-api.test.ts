import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createCaptureClient } from './helpers/capture-client.js';
import * as calendarApi from '../src/api/calendar.js';
import * as commonApi from '../src/api/common.js';
import { toCalendarEventBody } from '../src/tools/calendar/event-fields.js';

test('member search sends search conditions as query parameters', async () => {
  const requests = createCaptureClient([]);
  await commonApi.searchMembers({ name: '홍길동', externalEmailAddresses: ['a@example.com', 'b@example.com'] });

  assert.deepEqual(requests, [{
    method: 'GET',
    url: '/common/v1/members',
    params: { page: 0, size: 20, name: '홍길동', externalEmailAddresses: 'a@example.com,b@example.com' },
    data: undefined,
  }]);
});

test('event list uses "*" calendar path and joins calendar IDs', async () => {
  const requests = createCaptureClient([]);
  await calendarApi.getCalendarEvents({
    timeMin: '2026-10-01T00:00:00+09:00',
    timeMax: '2026-11-01T00:00:00+09:00',
    calendars: ['1', '2'],
    postType: 'toMe',
  });

  assert.equal(requests[0].url, '/calendar/v1/calendars/*/events');
  assert.deepEqual(requests[0].params, {
    timeMin: '2026-10-01T00:00:00+09:00',
    timeMax: '2026-11-01T00:00:00+09:00',
    calendars: '1,2',
    postType: 'toMe',
  });
});

test('event delete is a POST with deleteType', async () => {
  const requests = createCaptureClient();
  await calendarApi.deleteCalendarEvent('1', '2', 'wholeFromThis');

  assert.deepEqual(requests, [{
    method: 'POST',
    url: '/calendar/v1/calendars/1/events/2/delete',
    params: undefined,
    data: { deleteType: 'wholeFromThis' },
  }]);
});

test('event body maps attendees and personal settings to the API format', () => {
  assert.deepEqual(
    toCalendarEventBody({
      subject: '주간 회의',
      startedAt: '2026-10-22T10:00:00+09:00',
      endedAt: '2026-10-22T11:00:00+09:00',
      attendees: [{ id: '1', type: 'member' }, { id: 'a@example.com', type: 'email' }],
      busy: false,
      visibility: 'private',
    }),
    {
      users: {
        to: [
          { type: 'member', member: { organizationMemberId: '1' } },
          { type: 'emailUser', emailUser: { emailAddress: 'a@example.com' } },
        ],
      },
      subject: '주간 회의',
      startedAt: '2026-10-22T10:00:00+09:00',
      endedAt: '2026-10-22T11:00:00+09:00',
      personalSettings: { busy: false, class: 'private' },
    }
  );
});

test('event body leaves out fields that were not provided', () => {
  assert.deepEqual(toCalendarEventBody({ location: '7층 회의실' }), { location: '7층 회의실' });
  assert.deepEqual(toCalendarEventBody({}), {});
});
