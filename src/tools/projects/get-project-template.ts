/**
 * Get Project Template Tool
 * Get detailed information about a specific project template
 */

import { z } from 'zod';
import * as projectsApi from '../../api/projects.js';
import { formatError } from '../../utils/errors.js';

export const getProjectTemplateSchema = z.object({
  projectId: z.string().describe('Project ID where the template belongs'),
  templateId: z.string().describe('Template ID to retrieve'),
});

export type GetProjectTemplateInput = z.infer<typeof getProjectTemplateSchema>;

export async function getProjectTemplateHandler(args: GetProjectTemplateInput) {
  try {
    const result = await projectsApi.getProjectTemplate({
      projectId: args.projectId,
      templateId: args.templateId,
    });

    // Return FULL template (no filtering) - needed for task creation
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result),
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

export const getProjectTemplateTool = {
  name: 'get-project-template',
  description: `Get detailed information about a specific project template.

This tool retrieves complete template details including body, guide, subject, users, tags, and milestone. The returned data is intended for creating new tasks from templates.

**IMPORTANT - Full Details Returned**:
This tool returns ALL template fields (not filtered) because:
- Template data will be used for creating new tasks
- Need body, guide, subject, users, tags, milestone for task creation
- This is a detail view, not a list view

**Template Macros**:
Template macros like \${year}, \${month}, etc. are returned as-is (not interpolated). These can be processed when creating tasks if needed.

**URL Pattern Recognition**:
When given a Dooray URL like "https://nhnent.dooray.com/task/PROJECT_ID", extract the PROJECT_ID (the first numeric ID after "/task/") and use it as the projectId parameter.

**How to get template IDs**:
Use the \`get-project-template-list\` tool to list all templates in a project and get their IDs.

Examples:
- Get template details: {"projectId": "123456", "templateId": "789012"}
- "Show me details of template 789012 in project 123456"

Returns complete template information including:
- **id**: Template ID
- **templateName**: Template name
- **project**: Project info (id, code)
- **body**: Template body with mimeType and content (markdown or HTML)
- **guide**: Template guide/instructions with mimeType and content
- **subject**: Default task subject
- **users**: Default assignees (to) and CC
- **tags**: Default tag IDs
- **milestone**: Default milestone (id, name)
- **priority**: Default priority level
- **dueDate**, **dueDateFlag**: Default due date settings
- **isDefault**: Whether this is the default template

Use this tool to get full template details before creating a new task from the template.`,
  inputSchema: {
    type: 'object',
    properties: {
      projectId: {
        type: 'string',
        description: 'Project ID where the template belongs',
      },
      templateId: {
        type: 'string',
        description: 'Template ID to retrieve',
      },
    },
    required: ['projectId', 'templateId'],
  },
};
