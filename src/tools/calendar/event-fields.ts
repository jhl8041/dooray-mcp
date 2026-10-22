/**
 * Calendar Event Fields
 * Input fields shared by create-calendar-event and update-calendar-event
 */

import { z } from 'zod';
import { CalendarEventBody } from '../../types/dooray-api.js';
import { transformMembers } from '../../utils/member-transform.js';

const attendeeSchema = z.object({
  id: z.string(),
  type: z.enum(['member', 'email']),
});

export const eventFieldsSchema = {
  subject: z.string().describe('Event title'),
  startedAt: z.string().describe('Start time (ISO 8601, e.g. 2026-10-22T10:00:00+09:00). Whole day: 2026-10-22+09:00'),
  endedAt: z.string().describe('End time (ISO 8601). Whole day: next day, e.g. 2026-10-23+09:00'),
  wholeDayFlag: z.boolean().optional().describe('true for a whole day event'),
  location: z.string().optional().describe('Location'),
  body: z.object({
    mimeType: z.enum(['text/x-markdown', 'text/html']),
    content: z.string(),
  }).optional().describe('Event description'),
  attendees: z.array(attendeeSchema).optional().describe('Attendees (참석자). {id, type: "member"|"email"}'),
  cc: z.array(attendeeSchema).optional().describe('CC (참조). {id, type: "member"|"email"}'),
  recurrenceRule: z.object({
    frequency: z.enum(['daily', 'weekly', 'monthly', 'yearly']),
    interval: z.number().optional(),
    until: z.string().optional(),
    byday: z.string().optional(),
    bymonth: z.string().optional(),
    bymonthday: z.string().optional(),
    timezoneName: z.string().optional(),
  }).optional().describe('Recurrence rule for a recurring event'),
  busy: z.boolean().optional().describe('true: busy (바쁨), false: free (한가함)'),
  visibility: z.enum(['public', 'private']).optional().describe('public (공개) or private (비공개)'),
  alarms: z.array(z.object({
    action: z.enum(['mail', 'app']),
    trigger: z.string(),
  })).optional().describe('Alarms. trigger is an RFC 2445 duration, e.g. "TRIGGER:-PT10M"'),
};

const attendeeJsonSchema = {
  type: 'array',
  items: {
    type: 'object',
    properties: {
      id: { type: 'string', description: 'organizationMemberId (member) or email address (email)' },
      type: { type: 'string', enum: ['member', 'email'] },
    },
    required: ['id', 'type'],
  },
};

export const eventFieldsJsonSchema = {
  subject: {
    type: 'string',
    description: 'Event title',
  },
  startedAt: {
    type: 'string',
    description: 'Start time (ISO 8601, e.g. 2026-10-22T10:00:00+09:00). Whole day: 2026-10-22+09:00',
  },
  endedAt: {
    type: 'string',
    description: 'End time (ISO 8601). Whole day: next day, e.g. 2026-10-23+09:00',
  },
  wholeDayFlag: {
    type: 'boolean',
    description: 'true for a whole day event',
  },
  location: {
    type: 'string',
    description: 'Location',
  },
  body: {
    type: 'object',
    properties: {
      mimeType: { type: 'string', enum: ['text/x-markdown', 'text/html'] },
      content: { type: 'string' },
    },
    required: ['mimeType', 'content'],
    description: 'Event description',
  },
  attendees: {
    ...attendeeJsonSchema,
    description: 'Attendees (참석자). Use get-my-member-info, get-member-list to find member IDs',
  },
  cc: {
    ...attendeeJsonSchema,
    description: 'CC (참조)',
  },
  recurrenceRule: {
    type: 'object',
    properties: {
      frequency: { type: 'string', enum: ['daily', 'weekly', 'monthly', 'yearly'] },
      interval: { type: 'number' },
      until: { type: 'string', description: 'Recurrence end (ISO 8601)' },
      byday: { type: 'string', description: 'SU, MO, TU, WE, TH, FR, SA, 1 MO, -1 WE etc.' },
      bymonth: { type: 'string', description: '1 - 12' },
      bymonthday: { type: 'string', description: '1 - 31' },
      timezoneName: { type: 'string', description: 'e.g. Asia/Seoul' },
    },
    required: ['frequency'],
    description: 'Recurrence rule for a recurring event',
  },
  busy: {
    type: 'boolean',
    description: 'true: busy (바쁨), false: free (한가함)',
  },
  visibility: {
    type: 'string',
    enum: ['public', 'private'],
    description: 'public (공개) or private (비공개)',
  },
  alarms: {
    type: 'array',
    items: {
      type: 'object',
      properties: {
        action: { type: 'string', enum: ['mail', 'app'] },
        trigger: { type: 'string', description: 'RFC 2445 duration, e.g. "TRIGGER:-PT10M"' },
      },
      required: ['action', 'trigger'],
    },
    description: 'Alarms',
  },
};

type EventFieldsInput = Partial<z.infer<z.ZodObject<typeof eventFieldsSchema>>>;

/**
 * Convert tool input to the Dooray calendar event request body
 * Fields that are not provided are left out, so update only changes what was given
 */
export function toCalendarEventBody(args: EventFieldsInput): CalendarEventBody {
  const body: CalendarEventBody = {};

  const to = transformMembers(args.attendees);
  const cc = transformMembers(args.cc);
  if (to || cc) {
    body.users = {
      ...(to && { to }),
      ...(cc && { cc }),
    };
  }

  if (args.subject !== undefined) body.subject = args.subject;
  if (args.body !== undefined) body.body = args.body;
  if (args.startedAt !== undefined) body.startedAt = args.startedAt;
  if (args.endedAt !== undefined) body.endedAt = args.endedAt;
  if (args.wholeDayFlag !== undefined) body.wholeDayFlag = args.wholeDayFlag;
  if (args.location !== undefined) body.location = args.location;
  if (args.recurrenceRule !== undefined) body.recurrenceRule = args.recurrenceRule;

  if (args.busy !== undefined || args.visibility !== undefined || args.alarms !== undefined) {
    body.personalSettings = {
      ...(args.alarms !== undefined && { alarms: args.alarms }),
      ...(args.busy !== undefined && { busy: args.busy }),
      ...(args.visibility !== undefined && { class: args.visibility }),
    };
  }

  return body;
}
