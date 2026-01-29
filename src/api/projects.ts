/**
 * Dooray Projects API
 * Handles project and task management operations
 */

import { getClient } from './client.js';
import {
  Project,
  ProjectListParams,
  Task,
  TaskListParams,
  CreateTaskParams,
  DraftTaskResponse,
  UpdateTaskParams,
  CreateTaskCommentParams,
  CreateTaskCommentResponse,
  UpdateTaskCommentParams,
  TaskCommentListParams,
  TaskComment,
  Milestone,
  MilestoneListParams,
  Tag,
  TagListParams,
  CreateTagParams,
  CreateTagResponse,
  UpdateTagGroupParams,
  Workflow,
  WorkflowListParams,
  ProjectTemplate,
  GetProjectTemplateListParams,
  GetProjectTemplateParams,
  CreateTemplateParams,
  CreateTemplateResponse,
  UpdateTemplateParams,
  ProjectMember,
  GetProjectMemberListParams,
  ProjectMemberGroup,
  GetProjectMemberGroupListParams,
  FileUploadResult,
  PaginatedResponse,
  TaskAttachment,
  TaskAttachmentListParams,
} from '../types/dooray-api.js';

const PROJECTS_BASE = '/project/v1';

/**
 * Get list of projects accessible by the user
 */
export async function getProjects(params?: ProjectListParams): Promise<PaginatedResponse<Project>> {
  const client = getClient();
  return client.getPaginated<Project>(`${PROJECTS_BASE}/projects`, {
    member: 'me',
    state: 'active',
    page: params?.page || 0,
    size: params?.size || 20,
  });
}

/**
 * Get details of a specific project
 */
export async function getProjectDetails(projectId: string): Promise<Project> {
  const client = getClient();
  return client.get(`${PROJECTS_BASE}/projects/${projectId}`);
}

/**
 * Get list of tasks based on filters
 */
export async function getTasks(params: TaskListParams): Promise<PaginatedResponse<Task>> {
  const client = getClient();

  const queryParams: Record<string, unknown> = {
    page: params.page || 0,
    size: params.size || 20,
  };

  // Add optional filters
  if (params.fromEmailAddress) queryParams.fromEmailAddress = params.fromEmailAddress;
  if (params.fromMemberIds) queryParams.fromMemberIds = params.fromMemberIds.join(',');
  if (params.toMemberIds) queryParams.toMemberIds = params.toMemberIds.join(',');
  if (params.ccMemberIds) queryParams.ccMemberIds = params.ccMemberIds.join(',');
  if (params.tagIds) queryParams.tagIds = params.tagIds.join(',');
  if (params.parentPostId) queryParams.parentPostId = params.parentPostId;
  if (params.postNumber !== undefined) queryParams.postNumber = params.postNumber;
  if (params.postWorkflowClasses) queryParams.postWorkflowClasses = params.postWorkflowClasses.join(',');
  if (params.postWorkflowIds) queryParams.postWorkflowIds = params.postWorkflowIds.join(',');
  if (params.milestoneIds) queryParams.milestoneIds = params.milestoneIds.join(',');
  if (params.subjects) queryParams.subjects = params.subjects;
  if (params.createdAt) queryParams.createdAt = params.createdAt;
  if (params.updatedAt) queryParams.updatedAt = params.updatedAt;
  if (params.dueAt) queryParams.dueAt = params.dueAt;
  if (params.order) queryParams.order = params.order;

  return client.getPaginated<Task>(`${PROJECTS_BASE}/projects/${params.projectId}/posts`, queryParams);
}

/**
 * Get details of a specific task
 * Can be called with or without projectId
 */
export async function getTaskDetails(taskId: string, projectId?: string): Promise<Task> {
  const client = getClient();

  // If projectId is provided, use the project-scoped endpoint
  // Otherwise, use the global endpoint that works with just taskId
  if (projectId) {
    return client.get(`${PROJECTS_BASE}/projects/${projectId}/posts/${taskId}`);
  } else {
    return client.get(`${PROJECTS_BASE}/posts/${taskId}`);
  }
}

/**
 * Create a new task
 */
export async function createTask(params: CreateTaskParams): Promise<Task> {
  const client = getClient();

  const requestBody: Record<string, unknown> = {
    subject: params.subject,
  };

  if (params.parentPostId) requestBody.parentPostId = params.parentPostId;
  if (params.body) requestBody.body = params.body;
  if (params.users) requestBody.users = params.users;
  if (params.dueDate) {
    requestBody.dueDate = params.dueDate;
    // Set dueDateFlag to true when dueDate is provided (API recommendation)
    requestBody.dueDateFlag = params.dueDateFlag !== undefined ? params.dueDateFlag : true;
  }
  if (params.milestoneId) requestBody.milestoneId = params.milestoneId;
  if (params.tagIds) requestBody.tagIds = params.tagIds;
  if (params.priority) requestBody.priority = params.priority;

  return client.post(`${PROJECTS_BASE}/projects/${params.projectId}/posts`, requestBody);
}

/**
 * Create a draft task (임시 업무)
 * Returns draft task ID and URL for continued editing in browser
 */
export async function createDraftTask(params: CreateTaskParams): Promise<DraftTaskResponse> {
  const client = getClient();

  const requestBody: Record<string, unknown> = {
    projectId: params.projectId,
    subject: params.subject,
  };

  if (params.parentPostId) requestBody.parentPostId = params.parentPostId;
  if (params.body) requestBody.body = params.body;
  if (params.users) requestBody.users = params.users;
  if (params.dueDate) {
    requestBody.dueDate = params.dueDate;
    requestBody.dueDateFlag = params.dueDateFlag !== undefined ? params.dueDateFlag : true;
  }
  if (params.milestoneId) requestBody.milestoneId = params.milestoneId;
  if (params.tagIds) requestBody.tagIds = params.tagIds;
  if (params.priority) requestBody.priority = params.priority;

  return client.post(`${PROJECTS_BASE}/post-drafts`, requestBody);
}

/**
 * Update an existing task
 */
export async function updateTask(
  projectId: string,
  taskId: string,
  params: UpdateTaskParams
): Promise<Task> {
  const client = getClient();

  const requestBody: Record<string, unknown> = {};

  if (params.subject !== undefined) requestBody.subject = params.subject;
  if (params.body !== undefined) requestBody.body = params.body;
  if (params.users !== undefined) requestBody.users = params.users;
  if (params.dueDate !== undefined) requestBody.dueDate = params.dueDate;
  if (params.dueDateFlag !== undefined) requestBody.dueDateFlag = params.dueDateFlag;
  if (params.milestoneId !== undefined) requestBody.milestoneId = params.milestoneId;
  if (params.tagIds !== undefined) requestBody.tagIds = params.tagIds;
  if (params.priority !== undefined) requestBody.priority = params.priority;
  // workflowId는 별도 API (setTaskWorkflow)를 통해 처리

  return client.put(`${PROJECTS_BASE}/projects/${projectId}/posts/${taskId}`, requestBody);
}

/**
 * Set task workflow (업무 상태 변경)
 * POST /project/v1/projects/{project-id}/posts/{post-id}/set-workflow
 */
export async function setTaskWorkflow(
  projectId: string,
  taskId: string,
  workflowId: string
): Promise<void> {
  const client = getClient();
  await client.post(
    `${PROJECTS_BASE}/projects/${projectId}/posts/${taskId}/set-workflow`,
    { workflowId }
  );
}

/**
 * Create a comment on a task (댓글 생성)
 */
export async function createTaskComment(
  params: CreateTaskCommentParams
): Promise<CreateTaskCommentResponse> {
  const client = getClient();

  const requestBody: Record<string, unknown> = {
    body: {
      content: params.body.content,
      mimeType: params.body.mimeType,
    },
  };

  if (params.attachFileIds && params.attachFileIds.length > 0) {
    requestBody.attachFileIds = params.attachFileIds;
  }

  return client.post<CreateTaskCommentResponse>(
    `${PROJECTS_BASE}/projects/${params.projectId}/posts/${params.taskId}/logs`,
    requestBody
  );
}

/**
 * Get list of comments on a task (댓글 목록 조회)
 */
export async function getTaskComments(
  params: TaskCommentListParams
): Promise<PaginatedResponse<TaskComment>> {
  const client = getClient();

  const queryParams: Record<string, unknown> = {
    page: params.page || 0,
    size: params.size || 20,
  };

  if (params.order) {
    queryParams.order = params.order;
  }

  return client.getPaginated(
    `${PROJECTS_BASE}/projects/${params.projectId}/posts/${params.taskId}/logs`,
    queryParams
  );
}

/**
 * Update a comment on a task (댓글 수정)
 */
export async function updateTaskComment(
  params: UpdateTaskCommentParams
): Promise<void> {
  const client = getClient();

  const requestBody: Record<string, unknown> = {};

  if (params.body) {
    requestBody.body = {
      content: params.body.content,
      mimeType: params.body.mimeType,
    };
  }

  if (params.attachFileIds && params.attachFileIds.length > 0) {
    requestBody.attachFileIds = params.attachFileIds;
  }

  await client.put(
    `${PROJECTS_BASE}/projects/${params.projectId}/posts/${params.taskId}/logs/${params.commentId}`,
    requestBody
  );
}

/**
 * Get milestones for a project
 */
export async function getMilestones(params: MilestoneListParams): Promise<Milestone[]> {
  const client = getClient();

  const queryParams: Record<string, unknown> = {};
  if (params.status) queryParams.status = params.status;

  return client.get(`${PROJECTS_BASE}/projects/${params.projectId}/milestones`, queryParams);
}

/**
 * Get tags for a project
 */
export async function getTags(params: TagListParams): Promise<PaginatedResponse<Tag>> {
  const client = getClient();
  
  const queryParams: Record<string, unknown> = {
    page: params.page || 0,
    size: params.size || 100, // Default to max size to get all tags
  };
  
  return client.getPaginated<Tag>(`${PROJECTS_BASE}/projects/${params.projectId}/tags`, queryParams);
}

/**
 * Get details of a specific tag
 */
export async function getTagDetails(projectId: string, tagId: string): Promise<Tag> {
  const client = getClient();
  return client.get(`${PROJECTS_BASE}/projects/${projectId}/tags/${tagId}`);
}

/**
 * Create a new tag in a project
 * - Individual tag: { name: "myTag", color: "ffffff" }
 * - Group tag: { name: "groupName:tagName", color: "ffffff" }
 */
export async function createTag(params: CreateTagParams): Promise<CreateTagResponse> {
  const client = getClient();

  const requestBody: Record<string, unknown> = {
    name: params.name,
  };

  if (params.color) {
    requestBody.color = params.color;
  }

  return client.post<CreateTagResponse>(
    `${PROJECTS_BASE}/projects/${params.projectId}/tags`,
    requestBody
  );
}

/**
 * Update tag group settings
 * - mandatory: true - At least one tag from this group is required when creating tasks
 * - selectOne: true - Exactly one tag must be selected from this group
 * - selectOne: false - One or more tags can be selected from this group
 */
export async function updateTagGroup(params: UpdateTagGroupParams): Promise<void> {
  const client = getClient();

  const requestBody: Record<string, unknown> = {};

  if (params.mandatory !== undefined) {
    requestBody.mandatory = params.mandatory;
  }
  if (params.selectOne !== undefined) {
    requestBody.selectOne = params.selectOne;
  }

  await client.put(
    `${PROJECTS_BASE}/projects/${params.projectId}/tag-groups/${params.tagGroupId}`,
    requestBody
  );
}

/**
 * Get workflows (업무 상태) for a project
 */
export async function getProjectWorkflows(
  params: WorkflowListParams
): Promise<Workflow[]> {
  const client = getClient();

  return client.get<Workflow[]>(
    `${PROJECTS_BASE}/projects/${params.projectId}/workflows`
  );
}

/**
 * Get project templates
 */
export async function getProjectTemplates(
  params: GetProjectTemplateListParams
): Promise<PaginatedResponse<ProjectTemplate>> {
  const client = getClient();
  const queryParams: Record<string, unknown> = {
    page: params.page ?? 0,
    size: params.size ?? 20,
  };

  return client.getPaginated<ProjectTemplate>(
    `${PROJECTS_BASE}/projects/${params.projectId}/templates`,
    queryParams
  );
}

/**
 * Get details of a specific project template
 */
export async function getProjectTemplate(
  params: GetProjectTemplateParams
): Promise<ProjectTemplate> {
  const client = getClient();

  // No query params needed - interpolation defaults to false
  return client.get(
    `${PROJECTS_BASE}/projects/${params.projectId}/templates/${params.templateId}`
  );
}

/**
 * Create a new project template
 */
export async function createProjectTemplate(
  params: CreateTemplateParams
): Promise<CreateTemplateResponse> {
  const client = getClient();

  const requestBody: Record<string, unknown> = {
    templateName: params.templateName,
  };

  if (params.users) requestBody.users = params.users;
  if (params.body) requestBody.body = params.body;
  if (params.guide) requestBody.guide = params.guide;
  if (params.subject) requestBody.subject = params.subject;
  if (params.dueDate) requestBody.dueDate = params.dueDate;
  if (params.dueDateFlag !== undefined) requestBody.dueDateFlag = params.dueDateFlag;
  if (params.milestoneId) requestBody.milestoneId = params.milestoneId;
  if (params.tagIds) requestBody.tagIds = params.tagIds;
  if (params.priority) requestBody.priority = params.priority;
  if (params.isDefault !== undefined) requestBody.isDefault = params.isDefault;

  return client.post<CreateTemplateResponse>(
    `${PROJECTS_BASE}/projects/${params.projectId}/templates`,
    requestBody
  );
}

/**
 * Update an existing project template
 */
export async function updateProjectTemplate(
  params: UpdateTemplateParams
): Promise<void> {
  const client = getClient();

  const requestBody: Record<string, unknown> = {
    templateName: params.templateName,
  };

  if (params.users) requestBody.users = params.users;
  if (params.body) requestBody.body = params.body;
  if (params.guide) requestBody.guide = params.guide;
  if (params.subject) requestBody.subject = params.subject;
  if (params.dueDate) requestBody.dueDate = params.dueDate;
  if (params.dueDateFlag !== undefined) requestBody.dueDateFlag = params.dueDateFlag;
  if (params.milestoneId) requestBody.milestoneId = params.milestoneId;
  if (params.tagIds) requestBody.tagIds = params.tagIds;
  if (params.priority) requestBody.priority = params.priority;
  if (params.isDefault !== undefined) requestBody.isDefault = params.isDefault;

  await client.put(
    `${PROJECTS_BASE}/projects/${params.projectId}/templates/${params.templateId}`,
    requestBody
  );
}

/**
 * Delete a project template
 */
export async function deleteProjectTemplate(
  projectId: string,
  templateId: string
): Promise<void> {
  const client = getClient();

  await client.delete(
    `${PROJECTS_BASE}/projects/${projectId}/templates/${templateId}`
  );
}

/**
 * Get project members
 */
export async function getProjectMembers(
  params: GetProjectMemberListParams
): Promise<PaginatedResponse<ProjectMember>> {
  const client = getClient();
  const queryParams: Record<string, unknown> = {
    page: params.page ?? 0,
    size: params.size ?? 20,
  };

  if (params.roles && params.roles.length > 0) {
    queryParams.roles = params.roles.join(',');
  }

  return client.getPaginated<ProjectMember>(
    `${PROJECTS_BASE}/projects/${params.projectId}/members`,
    queryParams
  );
}

/**
 * Get project member groups
 */
export async function getProjectMemberGroups(
  params: GetProjectMemberGroupListParams
): Promise<PaginatedResponse<ProjectMemberGroup>> {
  const client = getClient();
  const queryParams: Record<string, unknown> = {
    page: params.page ?? 0,
    size: params.size ?? 20,
  };

  const result = await client.getPaginated<ProjectMemberGroup>(
    `${PROJECTS_BASE}/projects/${params.projectId}/member-groups`,
    queryParams
  );

  // API returns double-nested array: result.data[0] contains the actual array
  // Flatten it to get the correct structure
  if (Array.isArray(result.data) && result.data.length > 0 && Array.isArray(result.data[0])) {
    result.data = result.data[0] as ProjectMemberGroup[];
  }

  return result;
}

/**
 * Upload a file to a task
 */
export async function uploadFileToTask(
  projectId: string,
  taskNumber: number,
  file: { name: string; data: Buffer | Blob; mimeType?: string }
): Promise<FileUploadResult> {
  const client = getClient();

  const formData = new FormData();
  const blob = file.data instanceof Buffer
    ? new Blob([file.data], { type: file.mimeType || 'application/octet-stream' })
    : file.data;

  formData.append('file', blob, file.name);

  return client.uploadFile(
    `${PROJECTS_BASE}/projects/${projectId}/posts/${taskNumber}/files`,
    formData
  );
}

/**
 * Get list of attachments for a task (general type files only)
 */
export async function getTaskAttachments(
  params: TaskAttachmentListParams
): Promise<PaginatedResponse<TaskAttachment>> {
  const client = getClient();

  return client.getPaginated<TaskAttachment>(
    `${PROJECTS_BASE}/projects/${params.projectId}/posts/${params.taskId}/files`
  );
}

/**
 * Get metadata of a specific attachment
 */
export async function getTaskAttachmentMetadata(
  projectId: string,
  taskId: string,
  fileId: string
): Promise<TaskAttachment> {
  const client = getClient();

  return client.get<TaskAttachment>(
    `${PROJECTS_BASE}/projects/${projectId}/posts/${taskId}/files/${fileId}`,
    { media: 'meta' }
  );
}

/**
 * Download attachment file as binary data
 */
export async function downloadTaskAttachment(
  projectId: string,
  taskId: string,
  fileId: string
): Promise<{
  data: ArrayBuffer;
  contentType: string;
  contentDisposition?: string;
  contentLength?: number;
}> {
  const client = getClient();

  return client.downloadFile(
    `${PROJECTS_BASE}/projects/${projectId}/posts/${taskId}/files/${fileId}`,
    { media: 'raw' }
  );
}

/**
 * Delete attachment file from a task
 */
export async function deleteTaskAttachment(
  projectId: string,
  taskId: string,
  fileId: string
): Promise<void> {
  const client = getClient();

  await client.delete(
    `${PROJECTS_BASE}/projects/${projectId}/posts/${taskId}/files/${fileId}`
  );
}
