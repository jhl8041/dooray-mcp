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
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
  type CallToolResult,
} from '@modelcontextprotocol/sdk/types.js';
import * as dotenv from 'dotenv';
import { ZodError } from 'zod';
import { initializeClient } from './api/client.js';
import { logger } from './utils/logger.js';

import { tools, toolRegistry } from './tool-registry.js';

// package.json sits next to dist/ in the published package
const packageJson = require('../package.json') as { version: string };

// Load environment variables
dotenv.config();

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
      version: packageJson.version,
    },
    {
      capabilities: {
        tools: {},
        prompts: {},
        resources: {},
      },
    }
  );

  /**
   * Available prompts for common Dooray workflows
   */
  const prompts = [
    {
      name: 'create-task-with-template',
      description: 'Create a new task using a structured template with all necessary fields',
      arguments: [
        {
          name: 'projectId',
          description: 'The project ID where the task will be created',
          required: true,
        },
        {
          name: 'taskType',
          description: 'Type of task: bug, feature, improvement, or general',
          required: false,
        },
      ],
    },
    {
      name: 'weekly-task-summary',
      description: 'Generate a summary of tasks assigned to you for the current week',
      arguments: [
        {
          name: 'projectId',
          description: 'The project ID to summarize tasks from',
          required: true,
        },
      ],
    },
    {
      name: 'project-status-report',
      description: 'Generate a project status report including task counts by workflow status',
      arguments: [
        {
          name: 'projectId',
          description: 'The project ID to generate report for',
          required: true,
        },
      ],
    },
    {
      name: 'task-review-checklist',
      description: 'Create a review checklist for a specific task',
      arguments: [
        {
          name: 'projectId',
          description: 'The project ID',
          required: true,
        },
        {
          name: 'taskId',
          description: 'The task ID to create a review checklist for',
          required: true,
        },
      ],
    },
  ];

  /**
   * Available resources for Dooray context
   */
  const resources = [
    {
      uri: 'dooray://api/info',
      name: 'Dooray API Information',
      description: 'Information about the Dooray API and available endpoints',
      mimeType: 'application/json',
    },
    {
      uri: 'dooray://workflows/reference',
      name: 'Workflow Status Reference',
      description: 'Reference guide for Dooray workflow statuses (backlog, registered, working, closed)',
      mimeType: 'text/markdown',
    },
    {
      uri: 'dooray://priority/reference',
      name: 'Priority Reference',
      description: 'Reference guide for Dooray task priorities',
      mimeType: 'text/markdown',
    },
  ];

  // Handle list tools request
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    logger.debug('Handling list_tools request');
    return {
      tools,
    };
  });

  // Handle list prompts request
  server.setRequestHandler(ListPromptsRequestSchema, async () => {
    logger.debug('Handling list_prompts request');
    return {
      prompts,
    };
  });

  // Handle get prompt request
  server.setRequestHandler(GetPromptRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    logger.info(`Prompt requested: ${name}`);

    const prompt = prompts.find(p => p.name === name);
    if (!prompt) {
      throw new Error(`Unknown prompt: ${name}`);
    }

    let messages: Array<{ role: 'user' | 'assistant'; content: { type: 'text'; text: string } }> = [];

    switch (name) {
      case 'create-task-with-template': {
        const taskType = args?.taskType || 'general';
        const templates: Record<string, string> = {
          bug: `## Bug Report

**Project ID**: ${args?.projectId}

### Description
[Describe the bug clearly]

### Steps to Reproduce
1. 
2. 
3. 

### Expected Behavior
[What should happen]

### Actual Behavior
[What actually happens]

### Environment
- Browser/OS: 
- Version: 

### Priority
- [ ] High (서비스 중단)
- [ ] Normal (기능 장애)
- [ ] Low (개선 필요)`,
          feature: `## Feature Request

**Project ID**: ${args?.projectId}

### Summary
[Brief description of the feature]

### User Story
As a [type of user], I want [goal] so that [benefit].

### Acceptance Criteria
- [ ] 
- [ ] 
- [ ] 

### Technical Notes
[Any technical considerations]`,
          improvement: `## Improvement

**Project ID**: ${args?.projectId}

### Current State
[Describe current behavior]

### Proposed Improvement
[Describe the improvement]

### Benefits
- 
- 

### Implementation Notes
[Technical details if any]`,
          general: `## Task

**Project ID**: ${args?.projectId}

### Subject
[Task title]

### Description
[Detailed description]

### Checklist
- [ ] 
- [ ] 

### Due Date
[If applicable]`,
        };
        messages = [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `Use this template to create a new ${taskType} task in Dooray:\n\n${templates[taskType] || templates.general}`,
            },
          },
        ];
        break;
      }

      case 'weekly-task-summary': {
        messages = [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `Generate a weekly task summary for project ${args?.projectId}.

Please:
1. First call get-my-member-info to get my member ID
2. Then call get-task-list with:
   - projectId: ${args?.projectId}
   - toMemberIds: [my member ID]
   - postWorkflowClasses: ["working", "registered"]
3. Summarize the tasks grouped by status
4. Highlight any overdue tasks`,
            },
          },
        ];
        break;
      }

      case 'project-status-report': {
        messages = [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `Generate a project status report for project ${args?.projectId}.

Please:
1. Call get-project to get project details
2. Call get-project-workflow-list to get all workflow statuses
3. For each workflow class (backlog, registered, working, closed), call get-task-list to count tasks
4. Call get-milestone-list to show milestone progress
5. Generate a summary report with:
   - Project overview
   - Task counts by status
   - Milestone progress
   - Any blocked or overdue items`,
            },
          },
        ];
        break;
      }

      case 'task-review-checklist': {
        messages = [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `Create a review checklist for task ${args?.taskId} in project ${args?.projectId}.

Please:
1. Call get-task to get the task details
2. Call get-task-comment-list to see existing comments
3. Generate a review checklist including:
   - [ ] Task description is clear
   - [ ] Acceptance criteria defined
   - [ ] Assignee is set
   - [ ] Due date is appropriate
   - [ ] Tags/labels are correct
   - [ ] Related tasks are linked
4. Suggest any improvements to the task`,
            },
          },
        ];
        break;
      }
    }

    return {
      description: prompt.description,
      messages,
    };
  });

  // Handle list resources request
  server.setRequestHandler(ListResourcesRequestSchema, async () => {
    logger.debug('Handling list_resources request');
    return {
      resources,
    };
  });

  // Handle read resource request
  server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
    const { uri } = request.params;
    logger.info(`Resource requested: ${uri}`);

    switch (uri) {
      case 'dooray://api/info':
        return {
          contents: [
            {
              uri,
              mimeType: 'application/json',
              text: JSON.stringify({
                name: 'Dooray API',
                version: '1.0',
                baseUrl: process.env.DOORAY_API_BASE_URL || 'https://api.dooray.com',
                documentation: 'https://helpdesk.dooray.com/share/pages/9wWo-xwiR66BO5LGshgVTg',
                availableTools: tools.map(t => ({ name: t.name, description: t.description })),
              }, null, 2),
            },
          ],
        };

      case 'dooray://workflows/reference':
        return {
          contents: [
            {
              uri,
              mimeType: 'text/markdown',
              text: `# Dooray Workflow Status Reference

## Workflow Classes

Dooray tasks follow a workflow with 4 main classes:

| Class | Korean | Description |
|-------|--------|-------------|
| \`backlog\` | 대기 | Tasks waiting to be started |
| \`registered\` | 등록 | Newly registered/acknowledged tasks |
| \`working\` | 진행중 | Tasks currently in progress |
| \`closed\` | 완료 | Completed tasks |

## Using Workflows

### Filtering Tasks by Status
\`\`\`json
{
  "projectId": "your-project-id",
  "postWorkflowClasses": ["working", "registered"]
}
\`\`\`

### Getting All Workflow Statuses
Use \`get-project-workflow-list\` to get all custom workflow statuses for a project.

### Updating Task Status
Use \`update-task\` with \`workflowId\` to change a task's status:
\`\`\`json
{
  "projectId": "your-project-id",
  "taskNumber": 123,
  "workflowId": "workflow-status-id"
}
\`\`\`
`,
            },
          ],
        };

      case 'dooray://priority/reference':
        return {
          contents: [
            {
              uri,
              mimeType: 'text/markdown',
              text: `# Dooray Task Priority Reference

## Priority Levels

| Priority | Value | Korean | Use Case |
|----------|-------|--------|----------|
| Highest | \`highest\` | 가장 높음 | Critical issues requiring immediate attention |
| High | \`high\` | 높음 | Important tasks that should be prioritized |
| Normal | \`normal\` | 보통 | Standard priority (default) |
| Low | \`low\` | 낮음 | Can be addressed when time permits |
| Lowest | \`lowest\` | 가장 낮음 | Nice to have, lowest priority |

## Setting Priority

When creating or updating a task:
\`\`\`json
{
  "projectId": "your-project-id",
  "subject": "Task title",
  "priority": "high"
}
\`\`\`
`,
            },
          ],
        };

      default:
        throw new Error(`Unknown resource: ${uri}`);
    }
  });

  // Handle call tool request
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    logger.info(`Tool called: ${name}`);
    logger.debug(`Tool arguments:`, args);

    const tool = toolRegistry.get(name);
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
      const result = await tool.handler(validatedArgs);
      logger.debug(`Tool ${name} completed successfully`);
      return result as CallToolResult;
    } catch (error) {
      logger.error(`Tool ${name} failed:`, error);

      // Handle Zod validation errors
      if (error instanceof ZodError) {
        const errorMessages = error.issues
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
