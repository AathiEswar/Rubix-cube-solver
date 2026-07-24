import type { Sticker } from './types';

/**
 * Translates Singmaster notation (R, U', F2, …) returned by the solver into
 * human-readable instructions for the solution screen: which face, which
 * colour centre, and which direction to turn.
 */

export type TurnDir = 'cw' | 'ccw' | '180';

export interface MoveInfo {
  notation: string;
  faceName: string;
  color: Sticker;
  where: string;
  dir: TurnDir;
  text: string;
  /** What the turn looks like from the solver's fixed front view. */
  frontTip: string;
}

/**
 * "Clockwise" is always judged looking straight AT the face being turned —
 * which is why B, D and L moves are so easy to do backwards. These tips
 * translate every move into what the user actually sees from the front
 * (white up, green front), removing the ambiguity.
 */
const FRONT_VIEW_TIPS: Record<string, Record<TurnDir, string>> = {
  U: {
    cw: 'top layer: front row slides to the LEFT',
    ccw: 'top layer: front row slides to the RIGHT',
    '180': 'top layer: turn twice (either direction)',
  },
  D: {
    cw: 'bottom layer: front row slides to the RIGHT',
    ccw: 'bottom layer: front row slides to the LEFT',
    '180': 'bottom layer: turn twice (either direction)',
  },
  R: {
    cw: 'right layer: front column moves UP',
    ccw: 'right layer: front column moves DOWN',
    '180': 'right layer: turn twice (either direction)',
  },
  L: {
    cw: 'left layer: front column moves DOWN',
    ccw: 'left layer: front column moves UP',
    '180': 'left layer: turn twice (either direction)',
  },
  F: {
    cw: 'front face: its top edge swings to the RIGHT',
    ccw: 'front face: its top edge swings to the LEFT',
    '180': 'front face: turn twice (either direction)',
  },
  B: {
    cw: 'back layer: its top edge swings to the LEFT (looks anti-clockwise from where you stand)',
    ccw: 'back layer: its top edge swings to the RIGHT (looks clockwise from where you stand)',
    '180': 'back layer: turn twice (either direction)',
  },
};

const FACE_INFO: Record<string, { name: string; color: Sticker; where: string }> = {
  U: { name: 'Top', color: 'W', where: 'top face (white centre)' },
  D: { name: 'Bottom', color: 'Y', where: 'bottom face (yellow centre)' },
  F: { name: 'Front', color: 'G', where: 'front face (green centre)' },
  B: { name: 'Back', color: 'B', where: 'back face (blue centre)' },
  R: { name: 'Right', color: 'R', where: 'right face (red centre)' },
  L: { name: 'Left', color: 'O', where: 'left face (orange centre)' },
};

/** Describe a move like "R", "U'" or "F2" in human terms. */
export function moveInfo(move: string): MoveInfo {
  const face = FACE_INFO[move[0]];
  const dir: TurnDir = move.includes("'") ? 'ccw' : move.includes('2') ? '180' : 'cw';
  const dirText =
    dir === 'cw'
      ? 'clockwise 90°'
      : dir === 'ccw'
        ? 'counter-clockwise 90°'
        : '180° (half turn)';
  return {
    notation: move,
    faceName: face.name,
    color: face.color,
    where: face.where,
    dir,
    text: `Turn the ${face.where} ${dirText}, as if you were looking straight at that face.`,
    frontTip: FRONT_VIEW_TIPS[move[0]][dir],
  };
}
