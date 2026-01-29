/**
 * Dooray Wiki API
 * Handles wiki page and comment operations
 */

import { getClient } from './client.js';
import {
  Wiki,
  WikiListParams,
  WikiPage,
  WikiPageListParams,
  WikiPageCreateParams,
  WikiPageCreateResponse,
  WikiPageUpdateParams,
  WikiComment,
  WikiCommentListParams,
  WikiCommentCreateParams,
  WikiCommentCreateResponse,
  WikiCommentUpdateParams,
  PaginatedResponse,
} from '../types/dooray-api.js';

const WIKI_BASE = '/wiki/v1';

// Wiki list
export async function getWikis(params?: WikiListParams): Promise<PaginatedResponse<Wiki>> {
  const client = getClient();
  return client.getPaginated<Wiki>(`${WIKI_BASE}/wikis`, {
    page: params?.page || 0,
    size: params?.size || 20,
  });
}

// Wiki page by page-id only
export async function getWikiPage(pageId: string): Promise<WikiPage> {
  const client = getClient();
  return client.get(`${WIKI_BASE}/pages/${pageId}`);
}

// Wiki pages list (one depth)
export async function getWikiPages(params: WikiPageListParams): Promise<WikiPage[]> {
  const client = getClient();
  const queryParams: Record<string, unknown> = {};
  if (params.parentPageId) {
    queryParams.parentPageId = params.parentPageId;
  }
  return client.get(`${WIKI_BASE}/wikis/${params.wikiId}/pages`, queryParams);
}

// Wiki page by wiki-id and page-id
export async function getWikiPageByWikiId(wikiId: string, pageId: string): Promise<WikiPage> {
  const client = getClient();
  return client.get(`${WIKI_BASE}/wikis/${wikiId}/pages/${pageId}`);
}

// Create wiki page
export async function createWikiPage(params: WikiPageCreateParams): Promise<WikiPageCreateResponse> {
  const client = getClient();
  const requestBody: Record<string, unknown> = {
    subject: params.subject,
    body: params.body,
  };
  if (params.parentPageId) requestBody.parentPageId = params.parentPageId;
  if (params.attachFileIds) requestBody.attachFileIds = params.attachFileIds;
  if (params.referrers) requestBody.referrers = params.referrers;

  return client.post(`${WIKI_BASE}/wikis/${params.wikiId}/pages`, requestBody);
}

// Update wiki page (subject + body + referrers)
export async function updateWikiPage(params: WikiPageUpdateParams): Promise<void> {
  const client = getClient();
  const requestBody: Record<string, unknown> = {};
  if (params.subject !== undefined) requestBody.subject = params.subject;
  if (params.body !== undefined) requestBody.body = params.body;
  if (params.referrers !== undefined) requestBody.referrers = params.referrers;

  await client.put(`${WIKI_BASE}/wikis/${params.wikiId}/pages/${params.pageId}`, requestBody);
}

// Update wiki page title only
export async function updateWikiPageTitle(wikiId: string, pageId: string, subject: string): Promise<void> {
  const client = getClient();
  await client.put(`${WIKI_BASE}/wikis/${wikiId}/pages/${pageId}/title`, { subject });
}

// Update wiki page content only
export async function updateWikiPageContent(wikiId: string, pageId: string, content: string): Promise<void> {
  const client = getClient();
  await client.put(`${WIKI_BASE}/wikis/${wikiId}/pages/${pageId}/content`, {
    body: { mimeType: 'text/x-markdown', content }
  });
}

// Update wiki page referrers
export async function updateWikiPageReferrers(
  wikiId: string,
  pageId: string,
  referrers: Array<{ type: 'member'; member: { organizationMemberId: string } }>
): Promise<void> {
  const client = getClient();
  await client.put(`${WIKI_BASE}/wikis/${wikiId}/pages/${pageId}/referrers`, { referrers });
}

// Get wiki page comments
export async function getWikiPageComments(params: WikiCommentListParams): Promise<PaginatedResponse<WikiComment>> {
  const client = getClient();
  return client.getPaginated<WikiComment>(
    `${WIKI_BASE}/wikis/${params.wikiId}/pages/${params.pageId}/comments`,
    { page: params.page || 0, size: params.size || 20 }
  );
}

// Get single wiki comment
export async function getWikiPageComment(wikiId: string, pageId: string, commentId: string): Promise<WikiComment> {
  const client = getClient();
  return client.get(`${WIKI_BASE}/wikis/${wikiId}/pages/${pageId}/comments/${commentId}`);
}

// Create wiki comment
export async function createWikiPageComment(params: WikiCommentCreateParams): Promise<WikiCommentCreateResponse> {
  const client = getClient();
  return client.post(`${WIKI_BASE}/wikis/${params.wikiId}/pages/${params.pageId}/comments`, {
    body: { content: params.content }
  });
}

// Update wiki comment
export async function updateWikiPageComment(params: WikiCommentUpdateParams): Promise<void> {
  const client = getClient();
  await client.put(
    `${WIKI_BASE}/wikis/${params.wikiId}/pages/${params.pageId}/comments/${params.commentId}`,
    { body: { content: params.content } }
  );
}

// Delete wiki comment
export async function deleteWikiPageComment(wikiId: string, pageId: string, commentId: string): Promise<void> {
  const client = getClient();
  await client.delete(`${WIKI_BASE}/wikis/${wikiId}/pages/${pageId}/comments/${commentId}`);
}
