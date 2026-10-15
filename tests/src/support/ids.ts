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
