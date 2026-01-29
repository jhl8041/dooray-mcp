/**
 * TypeScript type definitions for Dooray API
 * Based on Dooray API v1 specification
 */

// ============================================================================
// Common Types
// ============================================================================

export interface ApiResponse<T> {
  header: {
    isSuccessful: boolean;
    resultCode: number;
    resultMessage: string;
  };
  result: T;
}

export interface Member {
  id: string;
  type: 'member' | 'group' | 'email';
  organizationMemberId?: string;
  name?: string;
  emailAddress?: string;
}

/**
 * Dooray API format for members (used in API requests)
 */
export interface DoorayApiMember {
  type: 'member' | 'email' | 'group';
  member?: {
    organizationMemberId?: string;
    emailAddress?: string;
  };
  organizationGroup?: {
    id: string;
  };
}

export interface MemberInfo {
  id: string;
  name: string;
  emailAddress: string;
  organizationMemberId: string;
  department?: string;
}

export interface MyMemberInfo {
  id: string;
  idProviderType: 'sso' | 'service';
  idProviderUserId: string;
  name: string;
  userCode: string;
  externalEmailAddress: string;
  defaultOrganization: {
    id: string;
  };
  locale: string;
  timezoneName: string;
  englishName: string;
  nativeName: string;
  nickname: string;
  displayMemberId: string;
}

// ============================================================================
// Projects API Types
// ============================================================================

export interface Project {
  id: string;
  code: string;
  name: string;
  description?: string;
  scope: 'private' | 'public';
  projectType?: 'default' | 'task' | 'issue';
  state?: 'active' | 'archived';
  organizationId?: string;
  projectCategoryId?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProjectListParams {
  page?: number;
  size?: number;
}

export interface Task {
  id: string;
  number: number;
  subject: string;
  project?: {
    id: string;
    code: string;
  };
  projectId?: string;
  projectCode?: string;
  taskNumber?: string;
  closed?: boolean;
  body?: {
    mimeType: 'text/x-markdown' | 'text/html';
    content: string;
  };
  workflowClass: string;
  workflow?: {
    id: string;
    name: string;
  };
  workflowId?: string;
  priority: 'highest' | 'high' | 'normal' | 'low' | 'lowest' | 'none';
  dueDate?: string;
  dueDateFlag?: boolean;
  createdAt: string;
  updatedAt: string;
  parent?: {
    id: string;
    number: number;
    subject: string;
  };
  users?: {
    from?: Member;
    to?: Member[];
    cc?: Member[];
  };
  milestone?: {
    id: string;
    name: string;
  };
  tags?: Array<{
    id: string;
    name?: string;
  }>;
  files?: Array<{
    id: string;
    name: string;
    size: number;
  }>;
}

export interface TaskListParams {
  projectId: string;
  // Filter conditions
  fromEmailAddress?: string;
  fromMemberIds?: string[];
  toMemberIds?: string[];
  ccMemberIds?: string[];
  tagIds?: string[];
  parentPostId?: string;
  postNumber?: number;
  postWorkflowClasses?: string[];
  postWorkflowIds?: string[];
  milestoneIds?: string[];
  subjects?: string;
  // Date filters (supports patterns like 'today', 'thisweek', 'prev-7d', 'next-7d', or ISO8601 range)
  createdAt?: string;
  updatedAt?: string;
  dueAt?: string;
  // Sorting
  order?: string;
  // Pagination
  page?: number;
  size?: number;
}

export interface CreateTaskParams {
  projectId: string;
  parentPostId?: string;
  subject: string;
  body?: {
    mimeType: 'text/x-markdown' | 'text/html';
    content: string;
  };
  users?: {
    to?: DoorayApiMember[];
    cc?: DoorayApiMember[];
  };
  dueDate?: string;
  dueDateFlag?: boolean;
  milestoneId?: string;
  tagIds?: string[];
  priority?: 'highest' | 'high' | 'normal' | 'low' | 'lowest' | 'none';
}

/**
 * Draft task creation parameters
 * Same structure as CreateTaskParams - draft tasks accept the same fields
 */
export type CreateDraftTaskParams = CreateTaskParams;

/**
 * Draft task creation response
 */
export interface DraftTaskResponse {
  id: string;
  url: string;
}

export interface UpdateTaskParams {
  subject?: string;
  body?: {
    mimeType: 'text/x-markdown' | 'text/html';
    content: string;
  };
  users?: {
    to?: DoorayApiMember[];
    cc?: DoorayApiMember[];
  };
  dueDate?: string;
  dueDateFlag?: boolean;
  milestoneId?: string | null;
  tagIds?: string[];
  priority?: 'highest' | 'high' | 'normal' | 'low' | 'lowest' | 'none';
  workflowId?: string;
}

/**
 * Task Comment (댓글) creation parameters
 */
export interface CreateTaskCommentParams {
  projectId: string;
  taskId: string;
  body: {
    content: string;
    mimeType: 'text/x-markdown' | 'text/html';
  };
  attachFileIds?: string[];
}

export interface CreateTaskCommentResponse {
  id: string;
}

/**
 * Task Comment (댓글) update parameters
 */
export interface UpdateTaskCommentParams {
  projectId: string;
  taskId: string;
  commentId: string;
  body?: {
    content: string;
    mimeType: 'text/x-markdown' | 'text/html';
  };
  attachFileIds?: string[];
}

/**
 * Task Comment (댓글) list parameters
 */
export interface TaskCommentListParams {
  projectId: string;
  taskId: string;
  page?: number;
  size?: number;
  order?: 'createdAt' | '-createdAt';
}

/**
 * Task Comment creator types
 */
export type TaskCommentCreator =
  | {
      type: 'member';
      member: {
        organizationMemberId: string;
      };
    }
  | {
      type: 'emailUser';
      emailUser: {
        emailAddress: string;
        name: string;
      };
    };

/**
 * Task Comment (댓글) object
 */
export interface TaskComment {
  id: string;
  creator: TaskCommentCreator;
  body: {
    mimeType: string;
    content: string;
  };
}

export interface Milestone {
  id: string;
  name: string;
  description?: string;
  startedAt?: string;
  endedAt?: string;
  status: 'open' | 'closed';
  createdAt: string;
}

export interface MilestoneListParams {
  projectId: string;
  status?: 'open' | 'closed';
}

/**
 * Workflow (업무 상태) - represents task status in a project
 */
export interface Workflow {
  id: string;
  name: string;
  order: number;
  names?: Array<{
    locale: string;
    name: string;
  }>;
  class: 'backlog' | 'registered' | 'working' | 'closed';
}

export interface WorkflowListParams {
  projectId: string;
}

export interface Tag {
  id: string;
  name: string;
  color?: string;
  tagGroup?: {
    id: string;
    name: string;
    mandatory?: boolean;
    selectOne?: boolean;
  };
}

export interface TagListParams {
  projectId: string;
  page?: number;
  size?: number;
}

/**
 * Tag creation parameters
 * - Individual tag: { name: "myTag", color: "ffffff" }
 * - Group tag: { name: "groupName:tagName", color: "ffffff" }
 */
export interface CreateTagParams {
  projectId: string;
  name: string;
  color?: string;
}

export interface CreateTagResponse {
  id: string;
}

/**
 * Tag group update parameters
 * - mandatory: true - At least one tag from this group is required when creating tasks
 * - selectOne: true - Exactly one tag must be selected from this group
 * - selectOne: false - One or more tags can be selected from this group
 */
export interface UpdateTagGroupParams {
  projectId: string;
  tagGroupId: string;
  mandatory?: boolean;
  selectOne?: boolean;
}

export interface ProjectMember {
  organizationMemberId: string;
  role: 'admin' | 'member';
}

export interface MemberDetails {
  id: string;
  idProviderType: 'sso' | 'service';
  idProviderUserId: string;
  name: string;
  userCode: string;
  externalEmailAddress: string;
  defaultOrganization: {
    id: string;
  };
  locale: string;
  timezoneName: string;
  englishName: string;
  nativeName: string;
  nickname: string;
  displayMemberId: string;
}

export interface GetProjectMemberListParams {
  projectId: string;
  roles?: ('admin' | 'member')[];
  page?: number;
  size?: number;
}

export interface ProjectMemberGroup {
  id: string;
  code: string;
  project: {
    id: string;
    code: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface GetProjectMemberGroupListParams {
  projectId: string;
  page?: number;
  size?: number;
}

export interface ProjectTemplate {
  id: string;
  templateName: string;
  project: {
    id: string;
    code: string;
  };
  users: {
    to: Array<{ type: string; member?: any; emailuser?: any }>;
    cc: Array<any>;
  };
  body?: {
    mimeType: 'text/x-markdown' | 'text/html';
    content: string;
  };
  guide?: {
    mimeType: 'text/x-markdown' | 'text/html' | 'text/plain';
    content: string;
  };
  subject: string;
  dueDate: string;
  dueDateFlag: boolean;
  milestone: { id: string; name: string } | null;
  tags: Array<{ id: string }>;
  isDefault: boolean;
  priority: string;
}

export interface GetProjectTemplateListParams {
  projectId: string;
  page?: number;
  size?: number;
}

export interface GetProjectTemplateParams {
  projectId: string;
  templateId: string;
}

/**
 * Task Attachment (첨부파일) - returned from file list API
 */
export interface TaskAttachment {
  id: string;
  name: string;
  size: string;
  mimeType: string;
  createdAt: string;
  creator: TaskCommentCreator;
}

export interface TaskAttachmentListParams {
  projectId: string;
  taskId: string;
}

export interface FileUploadResult {
  id: string;
  name: string;
  size: number;
  mimeType: string;
  url: string;
}
// ============================================================================
// Pagination
// ============================================================================

export interface PaginatedResponse<T> {
  totalCount: number;
  data: T[];
}

// ============================================================================
// Wiki API Types
// ============================================================================

export interface Wiki {
  id: string;
  project: { id: string };
  name: string;
  type: 'public' | 'private';
  scope: 'public' | 'private';
  home?: { pageId: string };
}

export interface WikiListParams {
  page?: number;
  size?: number;
}

export interface WikiPage {
  id: string;
  wikiId: string;
  version: string;
  parentPageId?: string;
  subject: string;
  body?: {
    mimeType: 'text/x-markdown';
    content: string;
  };
  root: boolean;
  createdAt?: string;
  updatedAt?: string;
  creator?: {
    type: 'member';
    member: { organizationMemberId: string };
  };
  referrers?: Array<{
    type: 'member';
    member: { organizationMemberId: string };
  }>;
  files?: Array<{ id: string; name: string; size: number; attachFileId?: string }>;
  images?: Array<{ id: string; name: string; size: number; attachFileId?: string }>;
}

export interface WikiPageListParams {
  wikiId: string;
  parentPageId?: string;
}

export interface WikiPageCreateParams {
  wikiId: string;
  parentPageId?: string;
  subject: string;
  body: {
    mimeType: 'text/x-markdown';
    content: string;
  };
  attachFileIds?: string[];
  referrers?: Array<{
    type: 'member';
    member: { organizationMemberId: string };
  }>;
}

export interface WikiPageCreateResponse {
  id: string;
  wikiId: string;
  parentPageId?: string;
  version: number;
}

export interface WikiPageUpdateParams {
  wikiId: string;
  pageId: string;
  subject?: string;
  body?: {
    mimeType: 'text/x-markdown';
    content: string;
  };
  referrers?: Array<{
    type: 'member';
    member: { organizationMemberId: string };
  }> | null;
}

export interface WikiComment {
  id: string;
  page: { id: string };
  createdAt: string;
  modifiedAt: string;
  creator: {
    type: 'member';
    member: {
      organizationMemberId: string;
      name?: string;
    };
  };
  body: {
    mimeType: 'text/x-markdown';
    content: string;
  };
}

export interface WikiCommentListParams {
  wikiId: string;
  pageId: string;
  page?: number;
  size?: number;
}

export interface WikiCommentCreateParams {
  wikiId: string;
  pageId: string;
  content: string;
}

export interface WikiCommentCreateResponse {
  id: string;
}

export interface WikiCommentUpdateParams {
  wikiId: string;
  pageId: string;
  commentId: string;
  content: string;
}
