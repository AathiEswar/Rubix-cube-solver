/**
 * Shared types and constants: the six sticker colours, the six face names,
 * their display hex values and human-readable names.
 */

/** Sticker colours on a standard cube. */
export type Sticker = 'W' | 'Y' | 'R' | 'O' | 'G' | 'B';

/** Face names in standard (Singmaster / Kociemba) notation. */
export type FaceName = 'U' | 'R' | 'F' | 'D' | 'L' | 'B';

/** Order used when tapping a sticker to cycle its colour. */
export const STICKER_CYCLE: Sticker[] = ['W', 'Y', 'R', 'O', 'G', 'B'];

export const STICKER_HEX: Record<Sticker, string> = {
  W: '#f1f5f9',
  Y: '#fbbf24',
  R: '#dc2626',
  O: '#f97316',
  G: '#16a34a',
  B: '#2563eb',
};

export const STICKER_NAME: Record<Sticker, string> = {
  W: 'White',
  Y: 'Yellow',
  R: 'Red',
  O: 'Orange',
  G: 'Green',
  B: 'Blue',
};
