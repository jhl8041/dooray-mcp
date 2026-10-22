/**
 * Get Calendar Event List Tool
 * Get events (일정) in a time range
 */

import { z } from 'zod';
import * as calendarApi from '../../api/calendar.js';
import { formatError } from '../../utils/errors.js';

export const getCalendarEventListSchema = z.object({
  timeMin: z.string().describe('Range start, inclusive (ISO 8601, e.g. 2026-10-22T00:00:00+09:00)'),
  timeMax: z.string().describe('Range end, exclusive (ISO 8601). Range must be 1 year or less'),
  calendars: z.array(z.string()).optional().describe('Calendar IDs to include (default: all)'),
  postType: z.enum(['toMe', 'toCcMe', 'fromToCcMe']).optional().describe('Filter by my role in the event'),
  category: z.enum(['general', 'post', 'milestone']).optional().describe('Event category'),
});

export type GetCalendarEventListInput = z.infer<typeof getCalendarEventListSchema>;

export async function getCalendarEventListHandler(args: GetCalendarEventListInput) {
  try {
    const events = await calendarApi.getCalendarEvents(args);

    // Return compact response with essential fields only
    const compactResult = events.map(event => ({
      id: event.id,
      calendar: event.calendar,
      subject: event.subject,
      startedAt: event.startedAt,
      endedAt: event.endedAt,
      wholeDayFlag: event.wholeDayFlag,
      location: event.location,
      category: event.category,
      recurrenceType: event.recurrenceType,
    }));

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({ totalCount: compactResult.length, data: compactResult }, null, 2),
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

export const getCalendarEventListTool = {
  name: 'get-calendar-event-list',
  description: `Get Dooray calendar events (일정 목록) in a time range.

**Required**: timeMin (inclusive) and timeMax (exclusive). The range must be 1 year or less.

The list does not include event body or attendees. Use get-calendar-event for details.
Subscription calendars are not included.

**Filters**:
- calendars: Calendar IDs from get-calendar-list (default: all calendars)
- postType: toMe (I am an attendee), toCcMe (attendee or CC), fromToCcMe (organizer, attendee or CC)
- category: general (일반 일정), post (업무 마감일), milestone

**Examples**:
- Today: {"timeMin": "2026-10-22T00:00:00+09:00", "timeMax": "2026-10-23T00:00:00+09:00"}
- This month in one calendar: {"timeMin": "2026-10-01T00:00:00+09:00", "timeMax": "2026-11-01T00:00:00+09:00", "calendars": ["123"]}

Returns: events with id, calendar {id, name}, subject, startedAt, endedAt, wholeDayFlag, location, category, recurrenceType.`,
  inputSchema: {
    type: 'object',
    properties: {
      timeMin: {
        type: 'string',
        description: 'Range start, inclusive (ISO 8601, e.g. 2026-10-22T00:00:00+09:00)',
      },
      timeMax: {
        type: 'string',
        description: 'Range end, exclusive (ISO 8601). Range must be 1 year or less',
      },
      calendars: {
        type: 'array',
        items: { type: 'string' },
        description: 'Calendar IDs to include (default: all)',
      },
      postType: {
        type: 'string',
        enum: ['toMe', 'toCcMe', 'fromToCcMe'],
        description: 'Filter by my role in the event',
      },
      category: {
        type: 'string',
        enum: ['general', 'post', 'milestone'],
        description: 'Event category',
      },
    },
    required: ['timeMin', 'timeMax'],
  },
};
