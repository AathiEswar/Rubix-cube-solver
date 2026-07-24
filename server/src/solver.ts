import Cube from 'cubejs';

/**
 * Shared Kociemba solve pipeline used by the Express server (local) and the
 * Vercel serverless handlers (production).
 */

let solverReady = false;

export function ensureSolverReady(): void {
  if (solverReady) return;
  Cube.initSolver();
  solverReady = true;
}

export function isSolverReady(): boolean {
  return solverReady;
}

const FACES = 'URFDLB';

/** Returns an error message, or null if the facelet string looks structurally valid. */
export function validateFacelets(s: unknown): string | null {
  if (typeof s !== 'string' || s.length !== 54) {
    return 'Facelet string must be exactly 54 characters.';
  }
  if (![...s].every((c) => FACES.includes(c))) {
    return 'Facelet string may only contain the letters U, R, F, D, L, B.';
  }
  for (const f of FACES) {
    const count = [...s].filter((c) => c === f).length;
    if (count !== 9) {
      return `Each colour must appear exactly 9 times (found ${count} for face ${f}). A sticker was probably mis-detected — please rescan.`;
    }
  }
  const centers = [4, 13, 22, 31, 40, 49].map((i) => s[i]).join('');
  if (centers !== 'URFDLB') {
    return 'Face centres are misplaced — check the cube orientation while scanning.';
  }
  return null;
}

export type SolveOk = { moves: string[]; alreadySolved: boolean };
export type SolveErr = { error: string; status: 400 | 422 };

export function solveFacelets(facelets: unknown): SolveOk | SolveErr {
  const validationError = validateFacelets(facelets);
  if (validationError) {
    return { error: validationError, status: 400 };
  }

  ensureSolverReady();

  try {
    const cube = Cube.fromString(facelets as string);

    // cubejs silently coerces impossible sticker combinations while parsing.
    // If re-serialising doesn't reproduce the input, the scan was invalid.
    if (cube.asString() !== facelets) {
      return {
        error:
          'That cube state is impossible — one or more stickers were mis-detected during scanning. Please reset and scan again.',
        status: 422,
      };
    }

    if (cube.isSolved()) {
      return { moves: [], alreadySolved: true };
    }

    const solution = cube.solve();
    const moves = solution.trim().split(/\s+/).filter(Boolean);

    // Safety net: an impossible (mis-scanned) state can yield a bogus
    // "solution". Apply it to a copy — if it doesn't solve, reject.
    const check = Cube.fromString(facelets as string);
    check.move(moves.join(' '));
    if (!check.isSolved()) {
      return {
        error:
          'That cube state is impossible — one or more stickers were mis-detected during scanning. Please reset and scan again.',
        status: 422,
      };
    }

    return { moves, alreadySolved: false };
  } catch {
    return {
      error:
        'That cube state is impossible — one or more stickers were mis-detected during scanning. Please reset and scan again.',
      status: 422,
    };
  }
}
