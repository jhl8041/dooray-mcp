import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createCaptureClient } from './helpers/capture-client.js';
import { getMemberListHandler } from '../src/tools/common/get-member-list.js';
import { getMemberHandler } from '../src/tools/common/get-member.js';
import { getCalendarListHandler } from '../src/tools/calendar/get-calendar-list.js';
import { getCalendarEventListHandler } from '../src/tools/calendar/get-calendar-event-list.js';
import { getCalendarEventHandler } from '../src/tools/calendar/get-calendar-event.js';
import { createCalendarEventHandler } from '../src/tools/calendar/create-calendar-event.js';
import { updateCalendarEventHandler } from '../src/tools/calendar/update-calendar-event.js';
import { deleteCalendarEventHandler } from '../src/tools/calendar/delete-calendar-event.js';

function parseText(result: { content: Array<{ type: string; text?: string }> }) {
  return JSON.parse(result.content[0].text || '');
}

test('get-member-list searches members and returns compact fields', async () => {
  const requests = createCaptureClient([
    { id: 'm1', name: '홍길동', userCode: 'gildong', externalEmailAddress: 'a@example.com', locale: 'ko_KR' },
  ]);
  const result = await getMemberListHandler({ name: '홍길동', size: 50 });

  assert.equal(requests[0].url, '/common/v1/members');
  assert.deepEqual(requests[0].params, { page: 0, size: 50, name: '홍길동' });
  assert.deepEqual(parseText(result).data, [
    { id: 'm1', name: '홍길동', userCode: 'gildong', externalEmailAddress: 'a@example.com' },
  ]);
});

test('get-member reads one member', async () => {
  const requests = createCaptureClient({ id: 'm1', name: '홍길동' });
  const result = await getMemberHandler({ memberId: 'm1' });

  assert.equal(result.isError, undefined);
  assert.deepEqual(requests.map(r => `${r.method} ${r.url}`), ['GET /common/v1/members/m1']);
});

test('get-calendar-list returns compact calendars', async () => {
  const requests = createCaptureClient([
    { id: 'c1', name: '내 캘린더', type: 'private', createdAt: '', me: { default: true, role: 'owner', color: '#333' } },
  ]);
  const result = await getCalendarListHandler({});

  assert.deepEqual(requests[0].params, { page: 0, size: 20 });
  assert.deepEqual(parseText(result).data, [{ id: 'c1', name: '내 캘린더', type: 'private', default: true, role: 'owner' }]);
});

test('get-calendar-event-list sends the time range and drops bulky fields', async () => {
  const requests = createCaptureClient([
    { id: 'e1', calendar: { id: 'c1', name: '내 캘린더' }, subject: '회의', startedAt: 's', endedAt: 'e', category: 'general', tenant: { id: 't' } },
  ]);
  const result = await getCalendarEventListHandler({ timeMin: '2026-10-22T00:00:00+09:00', timeMax: '2026-10-23T00:00:00+09:00' });

  assert.equal(requests[0].url, '/calendar/v1/calendars/*/events');
  const parsed = parseText(result);
  assert.equal(parsed.totalCount, 1);
  assert.equal(parsed.data[0].tenant, undefined);
  assert.equal(parsed.data[0].subject, '회의');
});

test('get-calendar-event reads one event', async () => {
  const requests = createCaptureClient({ id: 'e1' });
  await getCalendarEventHandler({ calendarId: 'c1', eventId: 'e1' });

  assert.deepEqual(requests.map(r => `${r.method} ${r.url}`), ['GET /calendar/v1/calendars/c1/events/e1']);
});

test('create-calendar-event posts the event body without calendarId', async () => {
  const requests = createCaptureClient({ id: 'e1' });
  const result = await createCalendarEventHandler({
    calendarId: 'c1',
    subject: '휴가',
    startedAt: '2026-10-22+09:00',
    endedAt: '2026-10-23+09:00',
    wholeDayFlag: true,
  });

  assert.deepEqual(parseText(result), { id: 'e1' });
  assert.deepEqual(requests, [{
    method: 'POST',
    url: '/calendar/v1/calendars/c1/events',
    params: undefined,
    data: { subject: '휴가', startedAt: '2026-10-22+09:00', endedAt: '2026-10-23+09:00', wholeDayFlag: true },
  }]);
});

test('update-calendar-event sends only provided fields', async () => {
  const requests = createCaptureClient();
  await updateCalendarEventHandler({ calendarId: 'c1', eventId: 'e1', location: '7층 회의실' });

  assert.deepEqual(requests, [{
    method: 'PUT',
    url: '/calendar/v1/calendars/c1/events/e1',
    params: undefined,
    data: { location: '7층 회의실' },
  }]);
});

test('update-calendar-event without fields fails before writing', async () => {
  const requests = createCaptureClient();
  const result = await updateCalendarEventHandler({ calendarId: 'c1', eventId: 'e1' });

  assert.equal(result.isError, true);
  assert.equal(requests.length, 0);
});

test('delete-calendar-event posts deleteType to the delete endpoint', async () => {
  const requests = createCaptureClient();
  await deleteCalendarEventHandler({ calendarId: 'c1', eventId: 'e1', deleteType: 'this' });

  assert.deepEqual(requests[0].data, { deleteType: 'this' });
  assert.equal(requests[0].url, '/calendar/v1/calendars/c1/events/e1/delete');
});
