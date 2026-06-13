/**
 * Recommended set/rep scheme tagline for an exercise, e.g. "4 × 10–12".
 * Steady cardio has no set count, so it renders just the value ("20–30 min").
 */
export function formatScheme(
  defaultSets: number | null | undefined,
  defaultReps: string | null | undefined
): string | null {
  if (!defaultReps) return null;
  return defaultSets ? `${defaultSets} × ${defaultReps}` : defaultReps;
}
