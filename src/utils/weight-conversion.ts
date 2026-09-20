export const KG_TO_LB_RATIO = 2.2046226218;

/**
 * Converts kilograms to pounds.
 * Rounds to 2 decimal places to avoid floating point drift.
 */
export function kgToLb(kg: number): number {
  if (kg < 0) return 0;
  return Math.round(kg * KG_TO_LB_RATIO * 100) / 100;
}

/**
 * Converts pounds to kilograms.
 * Rounds to 2 decimal places to match database storage resolution numeric(6, 2).
 */
export function lbToKg(lb: number): number {
  if (lb < 0) return 0;
  return Math.round((lb / KG_TO_LB_RATIO) * 100) / 100;
}

/**
 * Parses user input into a valid number, handling potential commas.
 */
export function parseWeightInput(input: string): number {
  const normalized = input.replace(',', '.');
  const parsed = parseFloat(normalized);
  return isNaN(parsed) ? 0 : parsed;
}
