/**
 * Tool registry
 * Single list of all tools. ListTools response and CallTool dispatch are both derived from it.
 */

import { z } from 'zod';

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
import { getDriveListTool, getDriveListHandler, getDriveListSchema } from './tools/drive/get-drive-list.js';
import { getDriveFileListTool, getDriveFileListHandler, getDriveFileListSchema } from './tools/drive/get-drive-file-list.js';
import { getDriveFileMetaTool, getDriveFileMetaHandler, getDriveFileMetaSchema } from './tools/drive/get-drive-file-meta.js';
import { createDriveFolderTool, createDriveFolderHandler, createDriveFolderSchema } from './tools/drive/create-drive-folder.js';
import { renameDriveFileTool, renameDriveFileHandler, renameDriveFileSchema } from './tools/drive/rename-drive-file.js';
import { moveDriveFileTool, moveDriveFileHandler, moveDriveFileSchema } from './tools/drive/move-drive-file.js';
import { copyDriveFileTool, copyDriveFileHandler, copyDriveFileSchema } from './tools/drive/copy-drive-file.js';
import { deleteDriveFileTool, deleteDriveFileHandler, deleteDriveFileSchema } from './tools/drive/delete-drive-file.js';
import { uploadDriveFileTool, uploadDriveFileHandler, uploadDriveFileSchema } from './tools/drive/upload-drive-file.js';
import { downloadDriveFileTool, downloadDriveFileHandler, downloadDriveFileSchema } from './tools/drive/download-drive-file.js';
import { updateDriveFileTool, updateDriveFileHandler, updateDriveFileSchema } from './tools/drive/update-drive-file.js';
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
import { uploadWikiPageFileTool, uploadWikiPageFileHandler, uploadWikiPageFileSchema } from './tools/wiki/upload-wiki-page-file.js';
import { downloadWikiPageFileTool, downloadWikiPageFileHandler, downloadWikiPageFileSchema } from './tools/wiki/download-wiki-page-file.js';
import { deleteWikiPageFileTool, deleteWikiPageFileHandler, deleteWikiPageFileSchema } from './tools/wiki/delete-wiki-page-file.js';
import { uploadWikiFileTool, uploadWikiFileHandler, uploadWikiFileSchema } from './tools/wiki/upload-wiki-file.js';
import { downloadWikiAttachFileTool, downloadWikiAttachFileHandler, downloadWikiAttachFileSchema } from './tools/wiki/download-wiki-attach-file.js';

interface ToolAnnotations {
  readOnlyHint?: boolean;
  destructiveHint?: boolean;
  idempotentHint?: boolean;
  openWorldHint?: boolean;
}

export interface ToolDefinition {
  tool: { name: string; description: string; inputSchema: Record<string, unknown> };
  handler: (args: any) => Promise<unknown>;
  schema: z.ZodTypeAny;
}

export const toolDefinitions: ToolDefinition[] = [
  // Common tools
  { tool: getMyMemberInfoTool, handler: getMyMemberInfoHandler, schema: getMyMemberInfoSchema },

  // Projects tools
  { tool: getProjectListTool, handler: getProjectListHandler, schema: getProjectListSchema },
  { tool: getProjectTool, handler: getProjectHandler, schema: getProjectSchema },
  { tool: getTaskListTool, handler: getTaskListHandler, schema: getTaskListSchema },
  { tool: getTaskTool, handler: getTaskHandler, schema: getTaskSchema },
  { tool: createTaskTool, handler: createTaskHandler, schema: createTaskSchema },
  { tool: updateTaskTool, handler: updateTaskHandler, schema: updateTaskSchema },
  { tool: createTaskCommentTool, handler: createTaskCommentHandler, schema: createTaskCommentSchema },
  { tool: getTaskCommentListTool, handler: getTaskCommentListHandler, schema: getTaskCommentListSchema },
  { tool: updateTaskCommentTool, handler: updateTaskCommentHandler, schema: updateTaskCommentSchema },
  { tool: getMilestoneListTool, handler: getMilestoneListHandler, schema: getMilestoneListSchema },
  { tool: getTagListTool, handler: getTagListHandler, schema: getTagListSchema },
  { tool: getTagTool, handler: getTagHandler, schema: getTagSchema },
  { tool: createTagTool, handler: createTagHandler, schema: createTagSchema },
  { tool: updateTagGroupTool, handler: updateTagGroupHandler, schema: updateTagGroupSchema },
  { tool: getProjectTemplateListTool, handler: getProjectTemplateListHandler, schema: getProjectTemplateListSchema },
  { tool: getProjectTemplateTool, handler: getProjectTemplateHandler, schema: getProjectTemplateSchema },
  { tool: createProjectTemplateTool, handler: createProjectTemplateHandler, schema: createProjectTemplateSchema },
  { tool: updateProjectTemplateTool, handler: updateProjectTemplateHandler, schema: updateProjectTemplateSchema },
  { tool: deleteProjectTemplateTool, handler: deleteProjectTemplateHandler, schema: deleteProjectTemplateSchema },
  { tool: getProjectMemberListTool, handler: getProjectMemberListHandler, schema: getProjectMemberListSchema },
  { tool: getProjectMemberGroupListTool, handler: getProjectMemberGroupListHandler, schema: getProjectMemberGroupListSchema },
  { tool: getProjectWorkflowListTool, handler: getProjectWorkflowListHandler, schema: getProjectWorkflowListSchema },
  { tool: uploadAttachmentTool, handler: uploadAttachmentHandler, schema: uploadAttachmentSchema },
  { tool: getAttachmentListTool, handler: getAttachmentListHandler, schema: getAttachmentListSchema },
  { tool: getAttachmentMetadataTool, handler: getAttachmentMetadataHandler, schema: getAttachmentMetadataSchema },
  { tool: downloadAttachmentTool, handler: downloadAttachmentHandler, schema: downloadAttachmentSchema },
  { tool: deleteAttachmentTool, handler: deleteAttachmentHandler, schema: deleteAttachmentSchema },

  // Drive tools
  { tool: getDriveListTool, handler: getDriveListHandler, schema: getDriveListSchema },
  { tool: getDriveFileListTool, handler: getDriveFileListHandler, schema: getDriveFileListSchema },
  { tool: getDriveFileMetaTool, handler: getDriveFileMetaHandler, schema: getDriveFileMetaSchema },
  { tool: createDriveFolderTool, handler: createDriveFolderHandler, schema: createDriveFolderSchema },
  { tool: renameDriveFileTool, handler: renameDriveFileHandler, schema: renameDriveFileSchema },
  { tool: moveDriveFileTool, handler: moveDriveFileHandler, schema: moveDriveFileSchema },
  { tool: copyDriveFileTool, handler: copyDriveFileHandler, schema: copyDriveFileSchema },
  { tool: deleteDriveFileTool, handler: deleteDriveFileHandler, schema: deleteDriveFileSchema },
  { tool: uploadDriveFileTool, handler: uploadDriveFileHandler, schema: uploadDriveFileSchema },
  { tool: downloadDriveFileTool, handler: downloadDriveFileHandler, schema: downloadDriveFileSchema },
  { tool: updateDriveFileTool, handler: updateDriveFileHandler, schema: updateDriveFileSchema },

  // Wiki tools
  { tool: getWikiListTool, handler: getWikiListHandler, schema: getWikiListSchema },
  { tool: getWikiPageListTool, handler: getWikiPageListHandler, schema: getWikiPageListSchema },
  { tool: getWikiPageTool, handler: getWikiPageHandler, schema: getWikiPageSchema },
  { tool: createWikiPageTool, handler: createWikiPageHandler, schema: createWikiPageSchema },
  { tool: updateWikiPageTool, handler: updateWikiPageHandler, schema: updateWikiPageSchema },
  { tool: getWikiPageCommentListTool, handler: getWikiPageCommentListHandler, schema: getWikiPageCommentListSchema },
  { tool: getWikiPageCommentTool, handler: getWikiPageCommentHandler, schema: getWikiPageCommentSchema },
  { tool: createWikiPageCommentTool, handler: createWikiPageCommentHandler, schema: createWikiPageCommentSchema },
  { tool: updateWikiPageCommentTool, handler: updateWikiPageCommentHandler, schema: updateWikiPageCommentSchema },
  { tool: deleteWikiPageCommentTool, handler: deleteWikiPageCommentHandler, schema: deleteWikiPageCommentSchema },

  // Wiki file tools
  { tool: uploadWikiPageFileTool, handler: uploadWikiPageFileHandler, schema: uploadWikiPageFileSchema },
  { tool: downloadWikiPageFileTool, handler: downloadWikiPageFileHandler, schema: downloadWikiPageFileSchema },
  { tool: deleteWikiPageFileTool, handler: deleteWikiPageFileHandler, schema: deleteWikiPageFileSchema },
  { tool: uploadWikiFileTool, handler: uploadWikiFileHandler, schema: uploadWikiFileSchema },
  { tool: downloadWikiAttachFileTool, handler: downloadWikiAttachFileHandler, schema: downloadWikiAttachFileSchema },
];

/**
 * Derive MCP tool annotations from the tool name prefix
 * - get-*: read only
 * - delete-*, update-*, rename-*, move-*: may overwrite or remove existing data
 */
export function getToolAnnotations(name: string): ToolAnnotations {
  if (name.startsWith('get-')) {
    return { readOnlyHint: true, idempotentHint: true, openWorldHint: true };
  }
  const destructive = ['delete-', 'update-', 'rename-', 'move-'].some(prefix => name.startsWith(prefix));
  return { readOnlyHint: false, destructiveHint: destructive, openWorldHint: true };
}

/**
 * Tools exposed in the ListTools response
 */
export const tools = toolDefinitions.map(({ tool }) => ({
  ...tool,
  annotations: getToolAnnotations(tool.name),
}));

/**
 * Tool lookup by name for CallTool dispatch
 */
export const toolRegistry = new Map(toolDefinitions.map(definition => [definition.tool.name, definition]));
