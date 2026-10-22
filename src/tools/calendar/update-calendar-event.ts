/**
 * Update Calendar Event Tool
 * Update an event (일정). Only provided fields are changed.
 */

import { z } from 'zod';
import * as calendarApi from '../../api/calendar.js';
import { formatError } from '../../utils/errors.js';
import { eventFieldsSchema, eventFieldsJsonSchema, toCalendarEventBody } from './event-fields.js';

export const updateCalendarEventSchema = z.object({
  calendarId: z.string().describe('Calendar ID'),
  eventId: z.string().describe('Event ID'),
  ...eventFieldsSchema,
  subject: eventFieldsSchema.subject.optional(),
  startedAt: eventFieldsSchema.startedAt.optional(),
  endedAt: eventFieldsSchema.endedAt.optional(),
});

export type UpdateCalendarEventInput = z.infer<typeof updateCalendarEventSchema>;

export async function updateCalendarEventHandler(args: UpdateCalendarEventInput) {
  try {
    const { calendarId, eventId, ...fields } = args;
    const body = toCalendarEventBody(fields);
    if (Object.keys(body).length === 0) {
      throw new Error('Provide at least one field to update');
    }

    await calendarApi.updateCalendarEvent(calendarId, eventId, body);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({ success: true, message: 'Event updated successfully' }, null, 2),
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

export const updateCalendarEventTool = {
  name: 'update-calendar-event',
  description: `Update a Dooray calendar event (일정 수정).

Only the fields you provide are changed. Unprovided fields keep their current values.

**IMPORTANT**:
- attendees and cc REPLACE the current lists. Call get-calendar-event first and include existing attendees you want to keep
- When changing time, provide both startedAt and endedAt

**Examples**:
- Change time: {"calendarId": "123", "eventId": "456", "startedAt": "2026-10-22T14:00:00+09:00", "endedAt": "2026-10-22T15:00:00+09:00"}
- Change location: {"calendarId": "123", "eventId": "456", "location": "7층 회의실"}

Returns: success message.`,
  inputSchema: {
    type: 'object',
    properties: {
      calendarId: {
        type: 'string',
        description: 'Calendar ID',
      },
      eventId: {
        type: 'string',
        description: 'Event ID',
      },
      ...eventFieldsJsonSchema,
    },
    required: ['calendarId', 'eventId'],
  },
};
