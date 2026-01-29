#!/usr/bin/env node
/**
 * Dooray MCP Server
 * Main entry point for the Model Context Protocol server
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import * as dotenv from 'dotenv';
import { initializeClient } from './api/client.js';
import { logger } from './utils/logger.js';

// Import all tools
import { getMyMemberInfoTool, getMyMemberInfoHandler, getMyMemberInfoSchema } from './tools/common/get-my-member-info.js';

import { getProjectListTool, getProjectListHandler, getProjectListSchema } from './tools/projects/get-project-list.js';
import { getProjectTool, getProjectHandler, getProjectSchema } from './tools/projects/get-project.js';
import { getTaskListTool, getTaskListHandler, getTaskListSchema } from './tools/projects/get-task-list.js';
import { getTaskTool, getTaskHandler, getTaskSchema } from './tools/projects/get-task.js';
import { createTaskTool, createTaskHandler, createTaskSchema } from './tools/projects/create-task.js';
import { updateTaskTool, updateTaskHandler, updateTaskSchema } from './tools/projects/update-task.js';
import { createTaskCommentTool, createTaskCommentHandler, createTaskCommentSchema } from './tools/projects/create-task-comment.js';
import { getTaskCommentListTool, getTaskCommentListHandler, getTaskCommentListSchema } from './tools/projects/get-task-comment-list.js';
import { updateTaskCommentTool, updateTaskCommentHandler, updateTaskCommentSchema } from './tools/projects/update-task-comment.js';
import { getMilestoneListTool, getMilestoneListHandler, getMilestoneListSchema } from './tools/projects/get-milestone-list.js';
import { getTagListTool, getTagListHandler, getTagListSchema } from './tools/projects/get-tag-list.js';
import { getTagTool, getTagHandler, getTagSchema } from './tools/projects/get-tag.js';
import { createTagTool, createTagHandler, createTagSchema } from './tools/projects/create-tag.js';
import { updateTagGroupTool, updateTagGroupHandler, updateTagGroupSchema } from './tools/projects/update-tag-group.js';
import { getProjectTemplateListTool, getProjectTemplateListHandler, getProjectTemplateListSchema } from './tools/projects/get-project-template-list.js';
import { getProjectTemplateTool, getProjectTemplateHandler, getProjectTemplateSchema } from './tools/projects/get-project-template.js';
import { createProjectTemplateTool, createProjectTemplateHandler, createProjectTemplateSchema } from './tools/projects/create-project-template.js';
import { updateProjectTemplateTool, updateProjectTemplateHandler, updateProjectTemplateSchema } from './tools/projects/update-project-template.js';
import { deleteProjectTemplateTool, deleteProjectTemplateHandler, deleteProjectTemplateSchema } from './tools/projects/delete-project-template.js';
import { getProjectMemberListTool, getProjectMemberListHandler, getProjectMemberListSchema } from './tools/projects/get-project-member-list.js';
import { getProjectMemberGroupListTool, getProjectMemberGroupListHandler, getProjectMemberGroupListSchema } from './tools/projects/get-project-member-group-list.js';
import { getProjectWorkflowListTool, getProjectWorkflowListHandler, getProjectWorkflowListSchema } from './tools/projects/get-project-workflow-list.js';
import { uploadAttachmentTool, uploadAttachmentHandler, uploadAttachmentSchema } from './tools/projects/upload-attachment.js';
import { getAttachmentListTool, getAttachmentListHandler, getAttachmentListSchema } from './tools/projects/get-attachment-list.js';
import { getAttachmentMetadataTool, getAttachmentMetadataHandler, getAttachmentMetadataSchema } from './tools/projects/get-attachment-metadata.js';
import { downloadAttachmentTool, downloadAttachmentHandler, downloadAttachmentSchema } from './tools/projects/download-attachment.js';
import { deleteAttachmentTool, deleteAttachmentHandler, deleteAttachmentSchema } from './tools/projects/delete-attachment.js';

// Wiki tools
import { getWikiListTool, getWikiListHandler, getWikiListSchema } from './tools/wiki/get-wiki-list.js';
import { getWikiPageListTool, getWikiPageListHandler, getWikiPageListSchema } from './tools/wiki/get-wiki-page-list.js';
import { getWikiPageTool, getWikiPageHandler, getWikiPageSchema } from './tools/wiki/get-wiki-page.js';
import { createWikiPageTool, createWikiPageHandler, createWikiPageSchema } from './tools/wiki/create-wiki-page.js';
import { updateWikiPageTool, updateWikiPageHandler, updateWikiPageSchema } from './tools/wiki/update-wiki-page.js';
import { getWikiPageCommentListTool, getWikiPageCommentListHandler, getWikiPageCommentListSchema } from './tools/wiki/get-wiki-comment-list.js';
import { getWikiPageCommentTool, getWikiPageCommentHandler, getWikiPageCommentSchema } from './tools/wiki/get-wiki-comment.js';
import { createWikiPageCommentTool, createWikiPageCommentHandler, createWikiPageCommentSchema } from './tools/wiki/create-wiki-comment.js';
import { updateWikiPageCommentTool, updateWikiPageCommentHandler, updateWikiPageCommentSchema } from './tools/wiki/update-wiki-comment.js';
import { deleteWikiPageCommentTool, deleteWikiPageCommentHandler, deleteWikiPageCommentSchema } from './tools/wiki/delete-wiki-comment.js';

// Load environment variables
dotenv.config();

/**
 * Tool registry mapping tool names to their handlers and schemas
 */
const toolRegistry = {
  // Common tools
  'get-my-member-info': { handler: getMyMemberInfoHandler, schema: getMyMemberInfoSchema },

  // Projects tools
  'get-project-list': { handler: getProjectListHandler, schema: getProjectListSchema },
  'get-project': { handler: getProjectHandler, schema: getProjectSchema },
  'get-task-list': { handler: getTaskListHandler, schema: getTaskListSchema },
  'get-task': { handler: getTaskHandler, schema: getTaskSchema },
  'create-task': { handler: createTaskHandler, schema: createTaskSchema },
  'update-task': { handler: updateTaskHandler, schema: updateTaskSchema },
  'create-task-comment': { handler: createTaskCommentHandler, schema: createTaskCommentSchema },
  'get-task-comment-list': { handler: getTaskCommentListHandler, schema: getTaskCommentListSchema },
  'update-task-comment': { handler: updateTaskCommentHandler, schema: updateTaskCommentSchema },
  'get-milestone-list': { handler: getMilestoneListHandler, schema: getMilestoneListSchema },
  'get-tag-list': { handler: getTagListHandler, schema: getTagListSchema },
  'get-tag': { handler: getTagHandler, schema: getTagSchema },
  'create-tag': { handler: createTagHandler, schema: createTagSchema },
  'update-tag-group': { handler: updateTagGroupHandler, schema: updateTagGroupSchema },
  'get-project-template-list': { handler: getProjectTemplateListHandler, schema: getProjectTemplateListSchema },
  'get-project-template': { handler: getProjectTemplateHandler, schema: getProjectTemplateSchema },
  'create-project-template': { handler: createProjectTemplateHandler, schema: createProjectTemplateSchema },
  'update-project-template': { handler: updateProjectTemplateHandler, schema: updateProjectTemplateSchema },
  'delete-project-template': { handler: deleteProjectTemplateHandler, schema: deleteProjectTemplateSchema },
  'get-project-member-list': { handler: getProjectMemberListHandler, schema: getProjectMemberListSchema },
  'get-project-member-group-list': { handler: getProjectMemberGroupListHandler, schema: getProjectMemberGroupListSchema },
  'get-project-workflow-list': { handler: getProjectWorkflowListHandler, schema: getProjectWorkflowListSchema },
  'upload-attachment': { handler: uploadAttachmentHandler, schema: uploadAttachmentSchema },
  'get-attachment-list': { handler: getAttachmentListHandler, schema: getAttachmentListSchema },
  'get-attachment-metadata': { handler: getAttachmentMetadataHandler, schema: getAttachmentMetadataSchema },
  'download-attachment': { handler: downloadAttachmentHandler, schema: downloadAttachmentSchema },
  'delete-attachment': { handler: deleteAttachmentHandler, schema: deleteAttachmentSchema },

  // Wiki tools
  'get-wiki-list': { handler: getWikiListHandler, schema: getWikiListSchema },
  'get-wiki-page-list': { handler: getWikiPageListHandler, schema: getWikiPageListSchema },
  'get-wiki-page': { handler: getWikiPageHandler, schema: getWikiPageSchema },
  'create-wiki-page': { handler: createWikiPageHandler, schema: createWikiPageSchema },
  'update-wiki-page': { handler: updateWikiPageHandler, schema: updateWikiPageSchema },
  'get-wiki-page-comment-list': { handler: getWikiPageCommentListHandler, schema: getWikiPageCommentListSchema },
  'get-wiki-page-comment': { handler: getWikiPageCommentHandler, schema: getWikiPageCommentSchema },
  'create-wiki-page-comment': { handler: createWikiPageCommentHandler, schema: createWikiPageCommentSchema },
  'update-wiki-page-comment': { handler: updateWikiPageCommentHandler, schema: updateWikiPageCommentSchema },
  'delete-wiki-page-comment': { handler: deleteWikiPageCommentHandler, schema: deleteWikiPageCommentSchema },
};

/**
 * List of all available tools
 */
const tools = [
  getMyMemberInfoTool,
  getProjectListTool,
  getProjectTool,
  getTaskListTool,
  getTaskTool,
  createTaskTool,
  updateTaskTool,
  createTaskCommentTool,
  getTaskCommentListTool,
  updateTaskCommentTool,
  getMilestoneListTool,
  getTagListTool,
  getTagTool,
  createTagTool,
  updateTagGroupTool,
  getProjectTemplateListTool,
  getProjectTemplateTool,
  createProjectTemplateTool,
  updateProjectTemplateTool,
  deleteProjectTemplateTool,
  getProjectMemberListTool,
  getProjectMemberGroupListTool,
  getProjectWorkflowListTool,
  uploadAttachmentTool,
  getAttachmentListTool,
  getAttachmentMetadataTool,
  downloadAttachmentTool,
  deleteAttachmentTool,

  // Wiki tools
  getWikiListTool,
  getWikiPageListTool,
  getWikiPageTool,
  createWikiPageTool,
  updateWikiPageTool,
  getWikiPageCommentListTool,
  getWikiPageCommentTool,
  createWikiPageCommentTool,
  updateWikiPageCommentTool,
  deleteWikiPageCommentTool,
];

/**
 * Main server initialization
 */
async function main() {
  logger.info('Starting Dooray MCP Server...');

  // Validate API token
  const apiToken = process.env.DOORAY_API_TOKEN;
  if (!apiToken) {
    logger.error('DOORAY_API_TOKEN environment variable is required');
    process.exit(1);
  }

  // Initialize Dooray API client
  try {
    initializeClient({
      apiToken,
      baseUrl: process.env.DOORAY_API_BASE_URL,
    });
    logger.info('Dooray API client initialized');
  } catch (error) {
    logger.error('Failed to initialize Dooray API client:', error);
    process.exit(1);
  }

  // Create MCP server
  const server = new Server(
    {
      name: 'dooray-mcp',
      version: '0.1.0',
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  // Handle list tools request
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    logger.debug('Handling list_tools request');
    return {
      tools,
    };
  });

  // Handle call tool request
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    logger.info(`Tool called: ${name}`);
    logger.debug(`Tool arguments:`, args);

    const tool = toolRegistry[name as keyof typeof toolRegistry];
    if (!tool) {
      logger.error(`Unknown tool: ${name}`);
      return {
        content: [
          {
            type: 'text',
            text: `Error: Unknown tool '${name}'`,
          },
        ],
        isError: true,
      };
    }

    try {
      // Validate arguments with Zod schema
      const validatedArgs = tool.schema.parse(args || {});

      // Call the tool handler
      const result = await (tool.handler as any)(validatedArgs);
      logger.debug(`Tool ${name} completed successfully`);
      return result;
    } catch (error) {
      logger.error(`Tool ${name} failed:`, error);

      // Handle Zod validation errors
      if (error && typeof error === 'object' && 'errors' in error) {
        const zodError = error as { errors: Array<{ path: string[]; message: string }> };
        const errorMessages = zodError.errors
          .map(e => `${e.path.join('.')}: ${e.message}`)
          .join(', ');
        return {
          content: [
            {
              type: 'text',
              text: `Validation Error: ${errorMessages}`,
            },
          ],
          isError: true,
        };
      }

      return {
        content: [
          {
            type: 'text',
            text: `Error: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  });

  // Start the server with stdio transport
  const transport = new StdioServerTransport();
  await server.connect(transport);

  logger.info(`Dooray MCP Server running with ${tools.length} tools`);
  logger.info('Tools available: ' + tools.map(t => t.name).join(', '));
}

// Error handling
process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Start the server
main().catch((error) => {
  logger.error('Failed to start server:', error);
  process.exit(1);
});
