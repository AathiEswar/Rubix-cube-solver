import type { FaceName, Sticker } from './types';
import { STICKER_NAME } from './types';

/**
 * Bridges scanning and solving: turns the six scanned faces (9 colours each)
 * into the 54-character Kociemba facelet string the server expects, mapping
 * colours to face letters via the centre stickers, with sanity checks.
 */

const FACE_ORDER: FaceName[] = ['U', 'R', 'F', 'D', 'L', 'B'];

/**
 * Convert the six scanned faces (arrays of 9 sticker colours) into the
 * 54-character Kociemba facelet string (URFDLB order), mapping colours to
 * face letters via the centre stickers.
 */
export function buildFacelets(
  faces: Record<FaceName, Sticker[]>
): { facelets: string } | { error: string } {
  const colorToFace = new Map<Sticker, FaceName>();
  for (const f of FACE_ORDER) {
    const center = faces[f]?.[4];
    if (!center) return { error: `Missing scan for face ${f}.` };
    if (colorToFace.has(center)) {
      return {
        error: `Two faces were scanned with the same centre colour (${STICKER_NAME[center]}). Please reset and scan again carefully.`,
      };
    }
    colorToFace.set(center, f);
  }

  const counts = new Map<Sticker, number>();
  let out = '';
  for (const f of FACE_ORDER) {
    for (const c of faces[f]) {
      const letter = colorToFace.get(c);
      if (!letter) return { error: 'Unexpected sticker colour mapping error.' };
      counts.set(c, (counts.get(c) ?? 0) + 1);
      out += letter;
    }
  }

  for (const [c, n] of counts) {
    if (n !== 9) {
      return {
        error: `Found ${n} ${STICKER_NAME[c]} stickers, but every colour must appear exactly 9 times. A sticker was probably mis-detected — please reset and rescan (you can tap stickers to fix them during review).`,
      };
    }
  }

  return { facelets: out };
}
