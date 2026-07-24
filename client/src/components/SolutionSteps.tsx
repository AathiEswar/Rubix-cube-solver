import { useState } from 'react';
import { moveInfo } from '../lib/moves';
import { STICKER_HEX } from '../lib/types';
import TurnArrow from './TurnArrow';

/**
 * Step-by-step solution viewer: shows one move at a time with a big turn
 * arrow, face-colour badge and plain-English description, a progress bar,
 * the full move strip, and Previous / Next controls.
 */

interface Props {
  moves: string[];
  onReset: () => void;
}

export default function SolutionSteps({ moves, onReset }: Props) {
  const [idx, setIdx] = useState(0);
  const done = idx >= moves.length;
  const info = done ? null : moveInfo(moves[idx]);

  return (
    <div className="flex min-h-screen flex-col items-center gap-6 px-4 py-8">
      <header className="text-center">
        <h1 className="text-2xl font-black">Solution</h1>
        <p className="mt-1 text-sm text-white/60">
          {moves.length === 0
            ? 'Your cube is already solved.'
            : `${moves.length} moves. Hold the cube WHITE on top, GREEN facing you, the whole time.`}
        </p>
        <a
          href="https://ruwix.com/the-rubiks-cube/notation/"
          target="_blank"
          rel="noreferrer"
          className="mt-2 inline-block text-sm text-cyan-300 underline hover:text-cyan-200"
        >
          New to cube notation? Guide to what R, U', F2… mean →
        </a>
      </header>

      {moves.length > 0 && (
        <>
          {/* Progress bar */}
          <div className="h-2 w-full max-w-md overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all"
              style={{ width: `${(Math.min(idx, moves.length) / moves.length) * 100}%` }}
            />
          </div>

          {/* All moves, current highlighted */}
          <div className="flex max-w-xl flex-wrap justify-center gap-1.5">
            {moves.map((m, i) => (
              <span
                key={i}
                className={`rounded-md px-2 py-1 font-mono text-sm ${
                  i < idx
                    ? 'bg-emerald-500/20 text-emerald-300'
                    : i === idx
                      ? 'bg-cyan-400/20 text-cyan-200 ring-1 ring-cyan-300'
                      : 'bg-white/5 text-white/50'
                }`}
              >
                {m}
              </span>
            ))}
          </div>
        </>
      )}

      {done ? (
        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <div className="text-6xl">✓</div>
          <h2 className="mt-3 text-3xl font-black text-emerald-400">Solved!</h2>
          <p className="mt-2 max-w-sm text-white/70">
            {moves.length === 0
              ? 'Nothing to do — the cube was already solved when you scanned it.'
              : 'If you followed every move, your cube should now be solved.'}
          </p>
          <button
            onClick={onReset}
            className="mt-8 rounded-full bg-emerald-500 px-10 py-4 text-lg font-bold text-black hover:bg-emerald-400"
          >
            Solve another cube
          </button>
        </div>
      ) : (
        info && (
          <>
            <div className="w-full max-w-md rounded-3xl border border-white/10 bg-zinc-900 p-8 text-center">
              <p className="text-sm text-white/60">
                Step {idx + 1} of {moves.length}
              </p>
              <div className="mt-4 flex items-center justify-center gap-8">
                <span className="font-mono text-7xl font-black">{info.notation}</span>
                <TurnArrow dir={info.dir} />
              </div>
              <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-white/5 px-4 py-1.5 text-sm">
                <span
                  className="h-4 w-4 rounded-full border border-black/40"
                  style={{ backgroundColor: STICKER_HEX[info.color] }}
                />
                {info.faceName} face
              </div>
              <p className="mt-4 text-white/80">{info.text}</p>
              <p className="mt-3 rounded-xl bg-cyan-400/10 px-4 py-2.5 text-sm font-medium text-cyan-200">
                From where you stand: {info.frontTip}
              </p>
            </div>

            <p className="rounded-full border border-amber-400/30 bg-amber-400/10 px-4 py-1.5 text-xs font-semibold text-amber-300">
              Never rotate the whole cube — WHITE stays up, GREEN stays facing you
            </p>

            <div className="flex w-full max-w-md gap-3">
              <button
                onClick={() => setIdx(idx - 1)}
                disabled={idx === 0}
                className="flex-1 rounded-xl border border-white/20 py-4 font-medium hover:bg-white/10 disabled:opacity-30"
              >
                Previous
              </button>
              <button
                onClick={() => setIdx(idx + 1)}
                className="flex-[2] rounded-xl bg-emerald-500 py-4 text-lg font-bold text-black hover:bg-emerald-400"
              >
                {idx === moves.length - 1 ? 'Finish' : 'Next step'}
              </button>
            </div>
          </>
        )
      )}

      {!done && (
        <p className="max-w-md text-center text-xs text-white/40">
          If the cube stops matching what a step expects, a sticker was probably
          mis-scanned — reset and scan again.
        </p>
      )}
      <button
        onClick={onReset}
        className="text-sm text-white/40 underline hover:text-white/70"
      >
        Start over
      </button>
    </div>
  );
}
