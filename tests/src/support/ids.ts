/**
 * Shared password for throwaway test accounts. Not a secret - it's synthetic data for
 * accounts the suite creates and discards every run, identical in every environment, so it
 * lives here rather than in .env (which is for things that actually vary per environment or
 * protect access to something real).
 */
export const TEST_USER_PASSWORD = 'Qa-Passw0rd-123';

/** Unique, timestamped test-data names so parallel/repeated runs never collide on shared infra. */
export function uniqueSuffix(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function testName(label: string): string {
  return `qa-${label}-${uniqueSuffix()}`;
}

export function testEmail(label: string): string {
  return `qa.${label}.${uniqueSuffix()}@example.com`;
}
