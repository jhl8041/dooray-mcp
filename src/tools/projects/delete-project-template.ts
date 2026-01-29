/**
 * Delete Project Template Tool
 * Delete an existing task template from a project
 */

import { z } from 'zod';
import * as projectsApi from '../../api/projects.js';
import { formatError } from '../../utils/errors.js';

export const deleteProjectTemplateSchema = z.object({
  projectId: z.string().describe('Project ID where the template belongs'),
  templateId: z.string().describe('Template ID to delete'),
});

export type DeleteProjectTemplateInput = z.infer<typeof deleteProjectTemplateSchema>;

export async function deleteProjectTemplateHandler(args: DeleteProjectTemplateInput) {
  try {
    await projectsApi.deleteProjectTemplate(args.projectId, args.templateId);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: true,
            message: 'Template deleted successfully',
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

export const deleteProjectTemplateTool = {
  name: 'delete-project-template',
  description: `Delete an existing task template from a Dooray project.

**CAUTION**: This action cannot be undone. Make sure you want to permanently delete the template.

**Required Fields**:
- projectId: Project ID where the template belongs
- templateId: Template ID to delete

**How to get template IDs**:
Use the \`get-project-template-list\` tool to list all templates and get their IDs.

**Example**:
- Delete template: {"projectId": "123456", "templateId": "789012"}

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
        description: 'Template ID to delete',
      },
    },
    required: ['projectId', 'templateId'],
  },
};
