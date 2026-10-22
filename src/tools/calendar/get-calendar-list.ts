/**
 * Get Calendar List Tool
 * Get calendars the user can access
 */

import { z } from 'zod';
import * as calendarApi from '../../api/calendar.js';
import { formatError } from '../../utils/errors.js';

export const getCalendarListSchema = z.object({
  page: z.number().min(0).optional().describe('Page number (default: 0)'),
  size: z.number().min(1).max(100).optional().describe('Items per page (default: 20, max: 100)'),
});

export type GetCalendarListInput = z.infer<typeof getCalendarListSchema>;

export async function getCalendarListHandler(args: GetCalendarListInput) {
  try {
    const result = await calendarApi.getCalendars(args);

    // Return compact response with essential fields only
    const compactResult = {
      totalCount: result.totalCount,
      data: result.data.map(calendar => ({
        id: calendar.id,
        name: calendar.name,
        type: calendar.type,
        default: calendar.me?.default,
        role: calendar.me?.role,
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

export const getCalendarListTool = {
  name: 'get-calendar-list',
  description: `Get the list of Dooray calendars (캘린더 목록) the user can access.

Subscription calendars are not included. The calendar marked default=true is the user's own default calendar.

Use the returned calendar id for create-calendar-event, or to filter get-calendar-event-list.

**Examples**:
- {} (first 20 calendars)
- {"size": 100}

Returns: totalCount and calendars with id, name, type (private, project), default, role.`,
  inputSchema: {
    type: 'object',
    properties: {
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
