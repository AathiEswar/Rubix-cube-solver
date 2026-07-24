import type { Sticker } from './types';

/**
 * Colour recognition: converts a sampled RGB patch (median of pixels around
 * each grid-cell centre) into one of the six sticker colours, using HSV
 * saturation for white and channel ratios for the tricky warm colours.
 */

export function rgbToHsv(
  r: number,
  g: number,
  b: number
): { h: number; s: number; v: number } {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  let h = 0;
  if (d !== 0) {
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
    if (h < 0) h += 360;
  }
  return { h, s: max === 0 ? 0 : d / max, v: max };
}

/**
 * Classify an RGB sample into one of the six cube colours.
 *
 * Red / orange / yellow are separated by the green-to-red channel ratio
 * instead of raw hue: warm indoor lighting shifts every hue towards
 * red/orange, but it scales the R and G channels together, so their ratio
 * stays comparatively stable. The review screen still lets the user tap
 * any sticker to correct it.
 */
export function classifyColor(r: number, g: number, b: number): Sticker {
  const { h, s, v } = rgbToHsv(r, g, b);

  // Low saturation → white. Warm lamps tint white towards yellow, but even
  // then its saturation stays well below a real yellow sticker's.
  if (s < 0.35 && v > 0.35) return 'W';
  if (s < 0.18) return 'W';

  // Warm zone (red / orange / yellow, plus warm-shifted green & white).
  // Split by the green-to-red ratio, which survives warm lighting far
  // better than hue: red ≈ 0.1, orange ≈ 0.45, yellow ≈ 0.85, green > 1.
  if (h < 100 || h >= 335) {
    const gr = g / Math.max(r, 1);
    if (gr > 1.05) return 'G'; // green pushed into the warm zone by the lamp
    if (gr > 0.65) {
      // Yellow sticker, or white with a strong warm cast: saturation decides.
      return s < 0.45 ? 'W' : 'Y';
    }
    if (gr > 0.32) return 'O';
    return 'R';
  }

  if (h < 170) return 'G';
  if (h < 270) return 'B';
  return 'R';
}
