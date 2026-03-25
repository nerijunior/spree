import type { Policy } from '@spree/sdk';
import { getClient } from '../config';
import { getLocaleOptions } from '../locale';
import type { SpreeNextOptions } from '../types';

/**
 * List store policies (return policy, privacy policy, terms of service, etc.)
 * Locale/country are auto-read from cookies when not provided.
 */
export async function listPolicies(
  options?: SpreeNextOptions
): Promise<{ data: Policy[] }> {
  const resolved = options ?? await getLocaleOptions();
  return getClient().policies.list(resolved);
}

/**
 * Get a single policy by slug or prefixed ID.
 * @param id - Policy slug (e.g., 'return-policy') or prefixed ID (e.g., 'pol_abc123')
 */
export async function getPolicy(
  id: string,
  options?: SpreeNextOptions
): Promise<Policy> {
  const resolved = options ?? await getLocaleOptions();
  return getClient().policies.get(id, resolved);
}
