/**
 * Dooray Calendar API
 * Handles calendar and event (일정) operations
 */

import { getClient } from './client.js';
import {
  Calendar,
  CalendarListParams,
  CalendarEvent,
  CalendarEventListParams,
  CalendarEventBody,
  CalendarEventDeleteType,
  CreateCalendarEventResponse,
  PaginatedResponse,
} from '../types/dooray-api.js';

const CALENDAR_BASE = '/calendar/v1';

/**
 * Get calendars the user can access (subscription calendars are not included)
 */
export async function getCalendars(params?: CalendarListParams): Promise<PaginatedResponse<Calendar>> {
  const client = getClient();
  return client.getPaginated<Calendar>(`${CALENDAR_BASE}/calendars`, {
    page: params?.page ?? 0,
    size: params?.size ?? 20,
  });
}

/**
 * Get events in a time range (max 1 year). The list response does not include event body.
 * The path only accepts "*" as calendar id. Use the calendars parameter to narrow down.
 */
export async function getCalendarEvents(params: CalendarEventListParams): Promise<CalendarEvent[]> {
  const client = getClient();
  const queryParams: Record<string, unknown> = {
    timeMin: params.timeMin,
    timeMax: params.timeMax,
  };
  if (params.calendars && params.calendars.length > 0) queryParams.calendars = params.calendars.join(',');
  if (params.postType) queryParams.postType = params.postType;
  if (params.category) queryParams.category = params.category;

  return client.get<CalendarEvent[]>(`${CALENDAR_BASE}/calendars/*/events`, queryParams);
}

/**
 * Get event details including body and attendees
 */
export async function getCalendarEvent(calendarId: string, eventId: string): Promise<CalendarEvent> {
  const client = getClient();
  return client.get<CalendarEvent>(`${CALENDAR_BASE}/calendars/${calendarId}/events/${eventId}`);
}

/**
 * Create an event
 */
export async function createCalendarEvent(
  calendarId: string,
  body: CalendarEventBody
): Promise<CreateCalendarEventResponse> {
  const client = getClient();
  return client.post<CreateCalendarEventResponse>(`${CALENDAR_BASE}/calendars/${calendarId}/events`, body);
}

/**
 * Update an event. Only non-empty fields are updated.
 */
export async function updateCalendarEvent(
  calendarId: string,
  eventId: string,
  body: CalendarEventBody
): Promise<void> {
  const client = getClient();
  await client.put(`${CALENDAR_BASE}/calendars/${calendarId}/events/${eventId}`, body);
}

/**
 * Delete an event. For recurring events, deleteType decides the range.
 */
export async function deleteCalendarEvent(
  calendarId: string,
  eventId: string,
  deleteType: CalendarEventDeleteType
): Promise<void> {
  const client = getClient();
  await client.post(`${CALENDAR_BASE}/calendars/${calendarId}/events/${eventId}/delete`, { deleteType });
}
