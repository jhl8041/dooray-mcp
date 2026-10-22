/**
 * Get Calendar Event Tool
 * Get event (일정) details including body and attendees
 */

import { z } from 'zod';
import * as calendarApi from '../../api/calendar.js';
import { formatError } from '../../utils/errors.js';

export const getCalendarEventSchema = z.object({
  calendarId: z.string().describe('Calendar ID'),
  eventId: z.string().describe('Event ID'),
});

export type GetCalendarEventInput = z.infer<typeof getCalendarEventSchema>;

export async function getCalendarEventHandler(args: GetCalendarEventInput) {
  try {
    const result = await calendarApi.getCalendarEvent(args.calendarId, args.eventId);

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

export const getCalendarEventTool = {
  name: 'get-calendar-event',
  description: `Get details of a Dooray calendar event (일정 상세).

Both calendarId and eventId are required. Take them from get-calendar-event-list (calendar.id and id).

**Examples**:
- {"calendarId": "123", "eventId": "456"}

Returns: event with body, users (from = organizer, to = attendees, cc) and each attendee status (accepted, declined, tentative, not_confirmed), recurrenceRule and files.`,
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
    },
    required: ['calendarId', 'eventId'],
  },
};
