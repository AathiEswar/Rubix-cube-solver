import { useState } from 'react';
import CameraScanner from './components/CameraScanner';
import CubeNet from './components/CubeNet';
import SolutionSteps from './components/SolutionSteps';
import { SCAN_STEPS } from './lib/scanSteps';
import { buildFacelets } from './lib/facelets';
import type { FaceName, Sticker } from './lib/types';
import { STICKER_HEX } from './lib/types';

/**
 * Root component and state machine of the app:
 * welcome → scanning (6 faces) → confirm (check the net) → solving (API call)
 * → solution | error.
 * Owns the scanned face data, the solve request, and the global reset.
 */

type Phase = 'welcome' | 'scanning' | 'confirm' | 'solving' | 'solution' | 'error';

export default function App() {
  const [phase, setPhase] = useState<Phase>('welcome');
  const [scanIdx, setScanIdx] = useState(0);
  const [faces, setFaces] = useState<Partial<Record<FaceName, Sticker[]>>>({});
  const [moves, setMoves] = useState<string[]>([]);
  const [error, setError] = useState('');

  const reset = () => {
    setPhase('welcome');
    setScanIdx(0);
    setFaces({});
    setMoves([]);
    setError('');
  };

  const solve = async (all: Record<FaceName, Sticker[]>) => {
    setPhase('solving');
    const result = buildFacelets(all);
    if ('error' in result) {
      setError(result.error);
      setPhase('error');
      return;
    }
    try {
      const res = await fetch('/api/solve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ facelets: result.facelets }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'The solver failed.');
      setMoves(data.moves as string[]);
      setPhase('solution');
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : 'Could not reach the solver. Please try again in a moment.'
      );
      setPhase('error');
    }
  };

  const onFaceConfirmed = (stickers: Sticker[]) => {
    const face = SCAN_STEPS[scanIdx].face;
    const next = { ...faces, [face]: stickers };
    setFaces(next);
    if (scanIdx === SCAN_STEPS.length - 1) {
      setPhase('confirm'); // review the whole cube before solving
    } else {
      setScanIdx(scanIdx + 1);
    }
  };

  const onNetChange = (face: FaceName, index: number, sticker: Sticker) => {
    const current = faces[face];
    if (!current) return;
    const next = [...current];
    next[index] = sticker;
    setFaces({ ...faces, [face]: next });
  };

  if (phase === 'scanning') {
    return (
      <CameraScanner
        step={SCAN_STEPS[scanIdx]}
        stepIndex={scanIdx}
        faces={faces}
        onConfirm={onFaceConfirmed}
        onRetakeFace={(index) => {
          // Drop this face (and any after it) so the user can rescan from here.
          const next = { ...faces };
          for (let i = index; i < SCAN_STEPS.length; i++) {
            delete next[SCAN_STEPS[i].face];
          }
          setFaces(next);
          setScanIdx(index);
        }}
        onReset={reset}
      />
    );
  }

  if (phase === 'confirm') {
    return (
      <CubeNet
        faces={faces as Record<FaceName, Sticker[]>}
        onChange={onNetChange}
        onSolve={() => void solve(faces as Record<FaceName, Sticker[]>)}
        onRescan={() => {
          setFaces({});
          setScanIdx(0);
          setPhase('scanning');
        }}
      />
    );
  }

  if (phase === 'solving') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-5">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-white/20 border-t-emerald-400" />
        <p className="text-white/70">Computing the solution…</p>
      </div>
    );
  }

  if (phase === 'solution') {
    return <SolutionSteps moves={moves} onReset={reset} />;
  }

  if (phase === 'error') {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <div className="max-w-md rounded-2xl border border-white/10 bg-zinc-900 p-8 text-center">
          <h2 className="text-xl font-bold text-red-400">Something went wrong</h2>
          <p className="mt-3 text-white/70">{error}</p>
          <button
            onClick={reset}
            className="mt-6 rounded-full bg-emerald-500 px-8 py-3 font-bold text-black hover:bg-emerald-400"
          >
            Start over
          </button>
        </div>
      </div>
    );
  }

  // Welcome
  const legend: Sticker[] = ['W', 'Y', 'R', 'O', 'G', 'B'];
  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="max-w-lg text-center">
        <div className="mb-5 flex justify-center gap-1.5">
          {legend.map((c) => (
            <span
              key={c}
              className="h-5 w-5 rounded-md border border-black/40"
              style={{ backgroundColor: STICKER_HEX[c] }}
            />
          ))}
        </div>
        <h1 className="text-4xl font-black tracking-tight">
          Rubik's Cube Solver
        </h1>
        <p className="mt-4 text-white/70">
          Point your camera at each face of the cube. I'll read the colours,
          then walk you through the solution one move at a time.
        </p>
        <ol className="mx-auto mt-6 max-w-md list-inside list-decimal space-y-2 text-left text-sm text-white/60">
          <li>
            Hold the cube with the <b className="text-white">white centre on top</b>{' '}
            and the <b className="text-green-400">green centre facing the camera</b>.
          </li>
          <li>
            Scan all 6 faces — follow the on-screen arrows to rotate the cube
            between scans. Tap any wrongly detected sticker to fix it. Or switch
            to <b className="text-emerald-400">Auto capture</b> and just hold
            each face steady for 2 seconds — it scans itself.
          </li>
          <li>
            Follow the solution steps, pressing <b className="text-white">Next</b>{' '}
            after each turn. Reset any time.
          </li>
        </ol>
        <button
          onClick={() => setPhase('scanning')}
          className="mt-8 rounded-full bg-emerald-500 px-10 py-4 text-lg font-bold text-black shadow-lg shadow-emerald-500/20 transition hover:bg-emerald-400"
        >
          Open camera &amp; start
        </button>
        <p className="mt-3 text-xs text-white/40">
          Your camera stays on this device — frames are only read locally to
          detect colours.
        </p>
      </div>
    </div>
  );
}
