let sequence = 0;

/**
 * Small, dependency-free ID generator. The sequence keeps IDs unique even when
 * several records are created within the same millisecond.
 */
export function createId(prefix: string): string {
  sequence = (sequence + 1) % 1_000_000;
  const time = Date.now().toString(36);
  const random = Math.random().toString(36).slice(2, 8);
  return `${prefix}_${time}_${sequence.toString(36)}${random}`;
}

export function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}
