/**
 * Delete Calendar Event Tool
 * Delete an event (일정)
 */

import { z } from 'zod';
import * as calendarApi from '../../api/calendar.js';
import { formatError } from '../../utils/errors.js';

export const deleteCalendarEventSchema = z.object({
  calendarId: z.string().describe('Calendar ID'),
  eventId: z.string().describe('Event ID'),
  deleteType: z.enum(['this', 'wholeFromThis', 'whole']).optional().default('this')
    .describe('Range for recurring events (default: this)'),
});

export type DeleteCalendarEventInput = z.infer<typeof deleteCalendarEventSchema>;

export async function deleteCalendarEventHandler(args: DeleteCalendarEventInput) {
  try {
    await calendarApi.deleteCalendarEvent(args.calendarId, args.eventId, args.deleteType);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({ success: true, message: 'Event deleted successfully' }, null, 2),
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

export const deleteCalendarEventTool = {
  name: 'delete-calendar-event',
  description: `Delete a Dooray calendar event (일정 삭제).

**Recurring Events** (deleteType):
- this: Only this occurrence (default)
- wholeFromThis: This and following occurrences
- whole: All occurrences

For a recurring event, use the occurrence event ID from get-calendar-event-list.

**Examples**:
- {"calendarId": "123", "eventId": "456"}
- {"calendarId": "123", "eventId": "456", "deleteType": "whole"}

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
      deleteType: {
        type: 'string',
        enum: ['this', 'wholeFromThis', 'whole'],
        description: 'Range for recurring events (default: this)',
      },
    },
    required: ['calendarId', 'eventId'],
  },
};
