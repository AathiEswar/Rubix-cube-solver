import type { FaceName, Sticker } from '../lib/types';
import { STICKER_CYCLE, STICKER_HEX, STICKER_NAME } from '../lib/types';

/**
 * Confirmation screen shown after all six faces are scanned and before
 * solving: renders the whole cube as an unfolded net so the user can compare
 * all 54 stickers against the real cube and tap-fix any mistake. This is the
 * last line of defence against "valid but wrong" scans, which the server
 * cannot detect (it would happily solve a different cube).
 */

interface Props {
  faces: Record<FaceName, Sticker[]>;
  onChange: (face: FaceName, index: number, sticker: Sticker) => void;
  onSolve: () => void;
  onRescan: () => void;
}

const FACE_LABEL: Record<FaceName, string> = {
  U: 'Top',
  L: 'Left',
  F: 'Front',
  R: 'Right',
  B: 'Back',
  D: 'Bottom',
};

function FaceGrid({
  face,
  stickers,
  onChange,
}: {
  face: FaceName;
  stickers: Sticker[];
  onChange: (index: number, sticker: Sticker) => void;
}) {
  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-[10px] uppercase tracking-wider text-white/50">
        {FACE_LABEL[face]}
      </span>
      <div className="grid grid-cols-3 gap-0.5 rounded-md bg-black/40 p-1">
        {stickers.map((c, i) => (
          <button
            key={i}
            disabled={i === 4}
            onClick={() =>
              onChange(
                i,
                STICKER_CYCLE[(STICKER_CYCLE.indexOf(c) + 1) % STICKER_CYCLE.length]
              )
            }
            aria-label={`${FACE_LABEL[face]} sticker ${i + 1}: ${STICKER_NAME[c]}`}
            className={`h-7 w-7 rounded-sm border sm:h-8 sm:w-8 ${
              i === 4
                ? 'cursor-default border-white/60'
                : 'border-black/60 transition hover:scale-105 active:scale-95'
            }`}
            style={{ backgroundColor: STICKER_HEX[c] }}
          />
        ))}
      </div>
    </div>
  );
}

export default function CubeNet({ faces, onChange, onSolve, onRescan }: Props) {
  // Every colour must appear exactly 9 times for the cube to be plausible.
  const counts = new Map<Sticker, number>();
  for (const f of Object.values(faces)) {
    for (const c of f) counts.set(c, (counts.get(c) ?? 0) + 1);
  }
  const badCounts = STICKER_CYCLE.filter((c) => (counts.get(c) ?? 0) !== 9);

  const grid = (f: FaceName) => (
    <FaceGrid face={f} stickers={faces[f]} onChange={(i, s) => onChange(f, i, s)} />
  );

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-4 py-8">
      <header className="text-center">
        <h1 className="text-2xl font-black">Is this your cube?</h1>
        <p className="mt-1 max-w-md text-sm text-white/60">
          Compare every face with the real cube (find each face by its centre
          colour). Tap any wrong sticker to fix it — one wrong sticker means a
          solution for a different cube.
        </p>
      </header>

      {/* Unfolded cube net */}
      <div className="flex flex-col items-center gap-2">
        <div>{grid('U')}</div>
        <div className="flex items-start gap-2">
          {grid('L')}
          {grid('F')}
          {grid('R')}
          {grid('B')}
        </div>
        <div>{grid('D')}</div>
      </div>

      {badCounts.length > 0 && (
        <p className="max-w-md text-center text-sm text-amber-400">
          {badCounts
            .map((c) => `${STICKER_NAME[c]}: ${counts.get(c) ?? 0}/9`)
            .join(' · ')}{' '}
          — every colour must appear exactly 9 times. Tap stickers above to fix
          the miscounts.
        </p>
      )}

      <div className="flex w-full max-w-md gap-3">
        <button
          onClick={onRescan}
          className="flex-1 rounded-xl border border-white/20 py-4 font-medium hover:bg-white/10"
        >
          Rescan
        </button>
        <button
          onClick={onSolve}
          disabled={badCounts.length > 0}
          className="flex-[2] rounded-xl bg-emerald-500 py-4 text-lg font-bold text-black hover:bg-emerald-400 disabled:opacity-40"
        >
          Looks right — solve it
        </button>
      </div>
    </div>
  );
}
