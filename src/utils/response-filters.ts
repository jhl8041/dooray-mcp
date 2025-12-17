/**
 * Response Filtering Utilities
 * Functions to filter API responses to return only essential fields
 * This reduces token usage when returning list responses to LLMs
 */

import { Task, Project, Milestone, Tag, Workflow, ProjectTemplate, ProjectMemberGroup, TaskComment, PaginatedResponse } from '../types/dooray-api.js';

/**
 * Filter Task object to return only essential fields for list display
 */
export function filterTaskForList(task: Task) {
  return {
    id: task.id,
    number: task.number,
    subject: task.subject,
    workflowClass: task.workflowClass,
    priority: task.priority,
    milestone: task.milestone,
    tags: task.tags,
    createdAt: task.createdAt,
    updatedAt: task.updatedAt,
  };
}

/**
 * Filter Project object to return only essential fields for list display
 */
export function filterProjectForList(project: Project) {
  return {
    id: project.id,
    name: project.code,  // 'code' field is actually the project name
  };
}

/**
 * Filter Milestone object to return only essential fields for list display
 */
export function filterMilestoneForList(milestone: Milestone) {
  return {
    id: milestone.id,
    name: milestone.name,
    status: milestone.status,
  };
}

/**
 * Group tags by their tagGroup for more organized display
 * Returns tagGroups with their associated tags nested inside
 * Tags without a tagGroup are placed in an "Ungrouped" category
 */
export function groupTagsByTagGroup(tags: Tag[]) {
  // Group tags by tagGroup.id
  const groupMap = new Map<string, {
    id: string | null;
    name: string;
    mandatory: boolean;
    selectOne: boolean;
    tags: Array<{ id: string; name: string }>;
  }>();

  for (const tag of tags) {
    if (tag.tagGroup) {
      const groupId = tag.tagGroup.id;
      
      if (!groupMap.has(groupId)) {
        groupMap.set(groupId, {
          id: groupId,
          name: tag.tagGroup.name,
          mandatory: tag.tagGroup.mandatory || false,
          selectOne: tag.tagGroup.selectOne || false,
          tags: [],
        });
      }
      
      groupMap.get(groupId)!.tags.push({
        id: tag.id,
        name: tag.name,
      });
    } else {
      // Handle tags without tagGroup
      const ungroupedKey = '__ungrouped__';
      
      if (!groupMap.has(ungroupedKey)) {
        groupMap.set(ungroupedKey, {
          id: null,
          name: 'Ungrouped',
          mandatory: false,
          selectOne: false,
          tags: [],
        });
      }
      
      groupMap.get(ungroupedKey)!.tags.push({
        id: tag.id,
        name: tag.name,
      });
    }
  }

  return {
    tagGroups: Array.from(groupMap.values()),
  };
}

/**
 * Filter Workflow object to return only essential fields for list display
 * Returns: id, name, order, class
 * Excludes: names array (localized names), projectId
 */
export function filterWorkflowForList(workflow: Workflow) {
  return {
    id: workflow.id,
    name: workflow.name,
    order: workflow.order,
    class: workflow.class,
  };
}

/**
 * Filter ProjectTemplate object to return only essential fields for list display
 */
export function filterTemplateForList(template: ProjectTemplate) {
  return {
    id: template.id,
    templateName: template.templateName,
  };
}

/**
 * Filter ProjectMemberGroup object to return only essential fields for list display
 */
export function filterMemberGroupForList(group: ProjectMemberGroup) {
  return {
    id: group.id,
    name: group.code,
  };
}

/**
 * Filter TaskComment object to return only essential fields
 * Returns: id, creator, body
 * Excludes: type, subtype, createdAt, modifiedAt, mailUsers, post
 */
export function filterTaskCommentForList(comment: TaskComment) {
  return {
    id: comment.id,
    creator: comment.creator,
    body: comment.body,
  };
}

/**
 * Filter paginated response by applying a filter function to each item in data array
 * Preserves pagination metadata (totalCount)
 */
export function filterPaginatedResponse<T, F>(
  response: PaginatedResponse<T>,
  filterFn: (item: T) => F
): { totalCount: number; data: F[] } {
  return {
    totalCount: response.totalCount,
    data: (response.data || []).map(filterFn),
  };
}
