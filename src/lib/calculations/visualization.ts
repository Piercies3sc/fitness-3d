import { MuscleTrainingExposure } from './exposure';

/**
 * Continuous warm color scale for Training Exposure visualization.
 * Colors are interpolated linearly between adjacent stops, not bucketed.
 *
 * Stops:
 *   0.00  #505054  No exposure
 *   0.25  #C7A36A  Low relative exposure
 *   0.50  #E58A47  Moderate relative exposure
 *   0.75  #F15F3B  High relative exposure
 *   1.00  #FF3B30  Highest relative exposure
 */
export const EXPOSURE_COLOR_STOPS: { t: number; hex: string; label: string }[] = [
  { t: 0.00, hex: '#505054', label: 'Yok' },
  { t: 0.25, hex: '#C7A36A', label: 'Düşük' },
  { t: 0.50, hex: '#E58A47', label: 'Orta' },
  { t: 0.75, hex: '#F15F3B', label: 'Yüksek' },
  { t: 1.00, hex: '#FF3B30', label: 'En yüksek' },
];

/**
 * Parse a hex color string (#RRGGBB) into [r, g, b] where each channel is 0–255.
 */
function hexToRgb(hex: string): [number, number, number] {
  const h = hex.startsWith('#') ? hex.slice(1) : hex;
  return [
    parseInt(h.substring(0, 2), 16),
    parseInt(h.substring(2, 4), 16),
    parseInt(h.substring(4, 6), 16),
  ];
}

/**
 * Convert [r, g, b] (0–255 each) back to a #RRGGBB hex string.
 */
function rgbToHex(r: number, g: number, b: number): string {
  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
  return (
    '#' +
    clamp(r).toString(16).padStart(2, '0').toUpperCase() +
    clamp(g).toString(16).padStart(2, '0').toUpperCase() +
    clamp(b).toString(16).padStart(2, '0').toUpperCase()
  );
}

/**
 * Deterministically maps a normalized exposure intensity [0, 1] to a hex color
 * by interpolating linearly between adjacent stops in EXPOSURE_COLOR_STOPS.
 *
 * Values are clamped to [0, 1]. NaN maps to #505054.
 */
export function getExposureColor(normalizedValue: number): string {
  if (typeof normalizedValue !== 'number' || Number.isNaN(normalizedValue)) {
    return EXPOSURE_COLOR_STOPS[0].hex;
  }
  const clamped = Math.max(0, Math.min(1, normalizedValue));

  const stops = EXPOSURE_COLOR_STOPS;

  // Find the two surrounding stops
  for (let i = 0; i < stops.length - 1; i++) {
    const lo = stops[i];
    const hi = stops[i + 1];
    if (clamped >= lo.t && clamped <= hi.t) {
      const segmentLength = hi.t - lo.t;
      // Exact hit on a stop boundary
      if (segmentLength === 0) return lo.hex;
      const f = (clamped - lo.t) / segmentLength;

      const [r1, g1, b1] = hexToRgb(lo.hex);
      const [r2, g2, b2] = hexToRgb(hi.hex);

      return rgbToHex(
        r1 + (r2 - r1) * f,
        g1 + (g2 - g1) * f,
        b1 + (b2 - b1) * f,
      );
    }
  }

  // Fallback (should not reach here after clamping)
  return stops[stops.length - 1].hex;
}

/**
 * Normalizes training exposure for visualization.
 * Returns a value between 0 and 1 relative to the maximum exposure in the dataset.
 * Clamps all values to [0, 1].
 */
export function normalizeExposure(
  exposures: MuscleTrainingExposure[]
): Record<string, number> {
  if (!exposures || exposures.length === 0) return {};

  let maxExposure = 0;
  for (const exp of exposures) {
    if (exp.exposure > maxExposure) {
      maxExposure = exp.exposure;
    }
  }

  const result: Record<string, number> = {};
  for (const exp of exposures) {
    const rawVal = maxExposure > 0 ? exp.exposure / maxExposure : 0;
    result[exp.muscleSlug] = Math.max(0, Math.min(1, rawVal));
  }

  return result;
}

/**
 * Builds a reverse mapping from mesh identifier to its logical muscle slug.
 */
export function buildReverseMeshMapping(
  muscleMeshes: Record<string, string[]>
): Record<string, string> {
  const reverseMapping: Record<string, string> = {};
  for (const [slug, meshes] of Object.entries(muscleMeshes)) {
    for (const mesh of meshes) {
      reverseMapping[mesh] = slug;
    }
  }
  return reverseMapping;
}
