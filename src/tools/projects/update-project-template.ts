/**
 * Update Project Template Tool
 * Update an existing task template in a project
 */

import { z } from 'zod';
import * as projectsApi from '../../api/projects.js';
import { formatError } from '../../utils/errors.js';

const memberAssignmentSchema = z.object({
  type: z.enum(['member', 'emailUser']),
  organizationMemberId: z.string().optional().describe('Organization member ID (for type: member)'),
  emailAddress: z.string().optional().describe('Email address (for type: emailUser)'),
  name: z.string().optional().describe('Name (for type: emailUser)'),
});

const bodySchema = z.object({
  mimeType: z.enum(['text/x-markdown', 'text/html']),
  content: z.string(),
});

export const updateProjectTemplateSchema = z.object({
  projectId: z.string().describe('Project ID where the template belongs'),
  templateId: z.string().describe('Template ID to update'),
  templateName: z.string().describe('Template name (required)'),
  users: z.object({
    to: z.array(memberAssignmentSchema).optional().describe('Default assignees'),
    cc: z.array(memberAssignmentSchema).optional().describe('Default CC recipients'),
  }).optional().describe('Default users for tasks created from this template'),
  body: bodySchema.optional().describe('Default task body content'),
  guide: bodySchema.optional().describe('Guide content shown to users when writing tasks'),
  subject: z.string().optional().describe('Default task subject'),
  dueDate: z.string().optional().describe('Default due date (ISO 8601 format)'),
  dueDateFlag: z.boolean().optional().describe('Enable due date (true=enabled, false=disabled)'),
  milestoneId: z.string().optional().describe('Default milestone ID'),
  tagIds: z.array(z.string()).optional().describe('Default tag IDs'),
  priority: z.enum(['highest', 'high', 'normal', 'low', 'lowest', 'none']).optional().describe('Default priority'),
  isDefault: z.boolean().optional().describe('Set as default template for this project'),
});

export type UpdateProjectTemplateInput = z.infer<typeof updateProjectTemplateSchema>;

function transformUserAssignments(
  users?: Array<{ type: 'member' | 'emailUser'; organizationMemberId?: string; emailAddress?: string; name?: string }>
) {
  if (!users) return undefined;
  return users.map(user => {
    if (user.type === 'member') {
      return {
        type: 'member' as const,
        member: { organizationMemberId: user.organizationMemberId! },
      };
    } else {
      return {
        type: 'emailUser' as const,
        emailUser: { emailAddress: user.emailAddress!, name: user.name || '' },
      };
    }
  });
}

export async function updateProjectTemplateHandler(args: UpdateProjectTemplateInput) {
  try {
    await projectsApi.updateProjectTemplate({
      projectId: args.projectId,
      templateId: args.templateId,
      templateName: args.templateName,
      users: args.users ? {
        to: transformUserAssignments(args.users.to),
        cc: transformUserAssignments(args.users.cc),
      } : undefined,
      body: args.body,
      guide: args.guide,
      subject: args.subject,
      dueDate: args.dueDate,
      dueDateFlag: args.dueDateFlag,
      milestoneId: args.milestoneId,
      tagIds: args.tagIds,
      priority: args.priority,
      isDefault: args.isDefault,
    });

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: true,
            message: 'Template updated successfully',
          }, null, 2),
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

export const updateProjectTemplateTool = {
  name: 'update-project-template',
  description: `Update an existing task template in a Dooray project.

**Required Fields**:
- projectId: Project ID where the template belongs
- templateId: Template ID to update
- templateName: Template name (required even for updates)

**Optional Fields**:
- users: Default assignees (to) and CC recipients
- body: Default task body content (markdown or HTML)
- guide: Instructions shown when creating tasks from this template
- subject: Default task subject/title
- dueDate: Default due date (ISO 8601 format)
- dueDateFlag: Whether due date is enabled
- milestoneId: Default milestone
- tagIds: Default tags
- priority: Default priority (highest, high, normal, low, lowest, none)
- isDefault: Set as default template (auto-fills when creating new tasks)

**How to get template IDs**:
Use the \`get-project-template-list\` tool to list all templates and get their IDs.

**Examples**:
- Update name: {"projectId": "123", "templateId": "456", "templateName": "Updated Bug Report"}
- Update body: {"projectId": "123", "templateId": "456", "templateName": "Bug Report", "body": {"mimeType": "text/x-markdown", "content": "## New Format"}}
- Set as default: {"projectId": "123", "templateId": "456", "templateName": "Main Template", "isDefault": true}

Returns success status.`,
  inputSchema: {
    type: 'object',
    properties: {
      projectId: {
        type: 'string',
        description: 'Project ID where the template belongs',
      },
      templateId: {
        type: 'string',
        description: 'Template ID to update',
      },
      templateName: {
        type: 'string',
        description: 'Template name (required)',
      },
      users: {
        type: 'object',
        properties: {
          to: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                type: { type: 'string', enum: ['member', 'emailUser'] },
                organizationMemberId: { type: 'string' },
                emailAddress: { type: 'string' },
                name: { type: 'string' },
              },
              required: ['type'],
            },
            description: 'Default assignees',
          },
          cc: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                type: { type: 'string', enum: ['member', 'emailUser'] },
                organizationMemberId: { type: 'string' },
                emailAddress: { type: 'string' },
                name: { type: 'string' },
              },
              required: ['type'],
            },
            description: 'Default CC recipients',
          },
        },
        description: 'Default users for tasks created from this template',
      },
      body: {
        type: 'object',
        properties: {
          mimeType: { type: 'string', enum: ['text/x-markdown', 'text/html'] },
          content: { type: 'string' },
        },
        required: ['mimeType', 'content'],
        description: 'Default task body content',
      },
      guide: {
        type: 'object',
        properties: {
          mimeType: { type: 'string', enum: ['text/x-markdown', 'text/html'] },
          content: { type: 'string' },
        },
        required: ['mimeType', 'content'],
        description: 'Guide content shown when creating tasks',
      },
      subject: {
        type: 'string',
        description: 'Default task subject',
      },
      dueDate: {
        type: 'string',
        description: 'Default due date (ISO 8601 format)',
      },
      dueDateFlag: {
        type: 'boolean',
        description: 'Enable due date',
      },
      milestoneId: {
        type: 'string',
        description: 'Default milestone ID',
      },
      tagIds: {
        type: 'array',
        items: { type: 'string' },
        description: 'Default tag IDs',
      },
      priority: {
        type: 'string',
        enum: ['highest', 'high', 'normal', 'low', 'lowest', 'none'],
        description: 'Default priority',
      },
      isDefault: {
        type: 'boolean',
        description: 'Set as default template for this project',
      },
    },
    required: ['projectId', 'templateId', 'templateName'],
  },
};
