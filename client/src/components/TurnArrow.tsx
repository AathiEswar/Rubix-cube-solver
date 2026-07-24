import type { TurnDir } from '../lib/moves';

/**
 * Big circular arrow used on the solution screen: clockwise, mirrored for
 * counter-clockwise, with a "×2" overlay for half turns.
 */
export default function TurnArrow({ dir }: { dir: TurnDir }) {
  return (
    <div className="relative inline-flex items-center justify-center">
      <svg
        viewBox="0 0 100 100"
        className={`h-24 w-24 text-cyan-300 ${dir === 'ccw' ? '-scale-x-100' : ''}`}
      >
        <path
          d="M 50 14 A 36 36 0 1 1 14 50"
          fill="none"
          stroke="currentColor"
          strokeWidth="9"
          strokeLinecap="round"
        />
        <polygon points="48,2 48,27 70,14" fill="currentColor" />
      </svg>
      {dir === '180' && (
        <span className="absolute inset-0 flex items-center justify-center text-xl font-black text-cyan-300">
          ×2
        </span>
      )}
    </div>
  );
}
