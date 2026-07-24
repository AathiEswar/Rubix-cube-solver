import type { FaceName, Sticker } from './types';

/**
 * The guided scan protocol: which face to show the camera in which order,
 * with the exact cube rotation to perform between scans so every face is
 * presented already in the orientation the facelet string expects.
 */

export type RotationKind = 'start' | 'rotate-left' | 'rotate-left-tilt-down' | 'tilt-up-twice';

export interface ScanStep {
  face: FaceName;
  expectedCenter: Sticker;
  title: string;
  instruction: string;
  rotation: RotationKind;
}

/**
 * Scan order chosen so every face is presented to the camera already in the
 * orientation the Kociemba facelet string expects (read left→right,
 * top→bottom on the real cube). The preview is mirrored for UX; stickers
 * are un-mirrored before solving — so follow the TARGET CENTRE COLOUR, not
 * left/right as they look on screen.
 *
 * Reference orientation: WHITE up, GREEN facing the camera.
 */
export const SCAN_STEPS: ScanStep[] = [
  {
    face: 'F',
    expectedCenter: 'G',
    title: 'Green face (Front)',
    instruction:
      'Hold the cube with WHITE on top and the GREEN centre facing the lens. Fill the square with that face.',
    rotation: 'start',
  },
  {
    face: 'R',
    expectedCenter: 'R',
    title: 'Red face (Right)',
    instruction:
      'Keeping WHITE on top, turn the cube until the RED centre faces the lens.',
    rotation: 'rotate-left',
  },
  {
    face: 'B',
    expectedCenter: 'B',
    title: 'Blue face (Back)',
    instruction:
      'Keeping WHITE on top, turn the cube until the BLUE centre faces the lens.',
    rotation: 'rotate-left',
  },
  {
    face: 'L',
    expectedCenter: 'O',
    title: 'Orange face (Left)',
    instruction:
      'Keeping WHITE on top, turn the cube until the ORANGE centre faces the lens.',
    rotation: 'rotate-left',
  },
  {
    face: 'U',
    expectedCenter: 'W',
    title: 'White face (Top)',
    instruction:
      'Turn until GREEN faces the lens again, then tilt the top of the cube toward you. WHITE faces the lens, with BLUE along the top edge.',
    rotation: 'rotate-left-tilt-down',
  },
  {
    face: 'D',
    expectedCenter: 'Y',
    title: 'Yellow face (Bottom)',
    instruction:
      'Tilt the cube away from you twice. YELLOW faces the lens, with GREEN along the top edge.',
    rotation: 'tilt-up-twice',
  },
];
