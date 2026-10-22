/**
 * Dooray Common API
 * Handles common/shared operations like member info
 */

import { getClient } from './client.js';
import { MyMemberInfo, MemberDetails, MemberSearchParams, PaginatedResponse } from '../types/dooray-api.js';

const COMMON_BASE = '/common/v1';

/**
 * Get information about the authenticated user
 */
export async function getMyMemberInfo(): Promise<MyMemberInfo> {
  const client = getClient();
  return client.get(`${COMMON_BASE}/members/me`);
}

/**
 * Get detailed information about a specific member
 */
export async function getMemberDetails(memberId: string): Promise<MemberDetails> {
  const client = getClient();
  return client.get(`${COMMON_BASE}/members/${memberId}`);
}

/**
 * Search organization members by name, user code, email or SSO user id
 */
export async function searchMembers(params: MemberSearchParams): Promise<PaginatedResponse<MemberDetails>> {
  const client = getClient();
  const queryParams: Record<string, unknown> = {
    page: params.page ?? 0,
    size: params.size ?? 20,
  };
  if (params.name) queryParams.name = params.name;
  if (params.userCode) queryParams.userCode = params.userCode;
  if (params.userCodeExact) queryParams.userCodeExact = params.userCodeExact;
  if (params.externalEmailAddresses && params.externalEmailAddresses.length > 0) {
    queryParams.externalEmailAddresses = params.externalEmailAddresses.join(',');
  }
  if (params.idProviderUserId) queryParams.idProviderUserId = params.idProviderUserId;

  return client.getPaginated<MemberDetails>(`${COMMON_BASE}/members`, queryParams);
}
