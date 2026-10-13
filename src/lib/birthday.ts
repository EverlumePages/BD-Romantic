/** The birthday shown in the calendar chapter. */
export const BIRTH_MONTH = 9; // October (0-based)
export const BIRTH_DAY = 13;

/** Calendar grid for October of the given year: leading blanks + days. */
export function octoberGrid(year: number): { blanks: number; days: number } {
  // Monday-first week
  const first = new Date(Date.UTC(year, BIRTH_MONTH, 1)).getUTCDay(); // 0 = Sunday
  const blanks = (first + 6) % 7;
  return { blanks, days: 31 };
}
