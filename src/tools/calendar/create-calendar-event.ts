/**
 * Create Calendar Event Tool
 * Create an event (일정) in a calendar
 */

import { z } from 'zod';
import * as calendarApi from '../../api/calendar.js';
import { formatError } from '../../utils/errors.js';
import { eventFieldsSchema, eventFieldsJsonSchema, toCalendarEventBody } from './event-fields.js';

export const createCalendarEventSchema = z.object({
  calendarId: z.string().describe('Calendar ID to create the event in'),
  ...eventFieldsSchema,
});

export type CreateCalendarEventInput = z.infer<typeof createCalendarEventSchema>;

export async function createCalendarEventHandler(args: CreateCalendarEventInput) {
  try {
    const { calendarId, ...fields } = args;
    const result = await calendarApi.createCalendarEvent(calendarId, toCalendarEventBody(fields));

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

export const createCalendarEventTool = {
  name: 'create-calendar-event',
  description: `Create an event (일정 등록) in a Dooray calendar.

**Required**: calendarId, subject, startedAt, endedAt.
Get calendarId from get-calendar-list (default=true is the user's own calendar).

**Time Format**:
- Timed event: "2026-10-22T10:00:00+09:00"
- Whole day event: set wholeDayFlag=true and use date format "2026-10-22+09:00". endedAt is the next day ("2026-10-23+09:00" for a one day event)

**Attendees**: {id, type} where type is "member" (organizationMemberId) or "email" (email address).
Use get-my-member-info, get-project-member-list, get-member-list to find member IDs.

**Examples**:
- Meeting: {"calendarId": "123", "subject": "주간 회의", "startedAt": "2026-10-22T10:00:00+09:00", "endedAt": "2026-10-22T11:00:00+09:00", "location": "4-5 회의실", "attendees": [{"id": "456", "type": "member"}]}
- Whole day: {"calendarId": "123", "subject": "휴가", "startedAt": "2026-10-22+09:00", "endedAt": "2026-10-23+09:00", "wholeDayFlag": true}
- Weekly: add "recurrenceRule": {"frequency": "weekly", "byday": "MO", "timezoneName": "Asia/Seoul"}

Returns: {id} of the created event.`,
  inputSchema: {
    type: 'object',
    properties: {
      calendarId: {
        type: 'string',
        description: 'Calendar ID to create the event in',
      },
      ...eventFieldsJsonSchema,
    },
    required: ['calendarId', 'subject', 'startedAt', 'endedAt'],
  },
};
