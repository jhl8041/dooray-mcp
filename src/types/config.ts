/**
 * Configuration types for Dooray MCP Server
 */

export interface DoorayConfig {
  /** Dooray API authentication token */
  apiToken: string;
  /** Token for write requests (POST, PUT, PATCH, DELETE). Writes are recorded under this token's account */
  writeApiToken?: string;
  /** Base URL for Dooray API (default: https://api.dooray.com) */
  baseUrl?: string;
}

export interface DoorayHeaders {
  /** Organization Member ID */
  'X-Om-Id'?: string;
  /** Tenant ID */
  'X-Tnt-Id'?: string;
  /** Organization ID */
  'X-Org-Id'?: string;
}
