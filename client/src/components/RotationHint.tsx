import type { RotationKind } from '../lib/scanSteps';

/**
 * Small glanceable icons shown in the scan banner that tell the user how to
 * rotate or tilt the whole cube before scanning the next face.
 */

const CurvedArrow = ({ rotate = 0, label }: { rotate?: number; label?: string }) => (
  <span className="inline-flex items-center gap-1">
    <svg
      viewBox="0 0 40 40"
      className="h-8 w-8 shrink-0 text-cyan-300"
      style={{ transform: `rotate(${rotate}deg)` }}
    >
      <path
        d="M32 26 A 14 14 0 1 0 14 31"
        fill="none"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <polygon points="8,25 20,27 12,37" fill="currentColor" />
    </svg>
    {label && <span className="text-xs font-bold text-cyan-300">{label}</span>}
  </span>
);

const HoldIcon = () => (
  <svg viewBox="0 0 40 40" className="h-8 w-8 shrink-0 text-cyan-300">
    <rect x="8" y="8" width="24" height="24" rx="4" fill="none" stroke="currentColor" strokeWidth="3" />
    <line x1="16" y1="8" x2="16" y2="32" stroke="currentColor" strokeWidth="2" />
    <line x1="24" y1="8" x2="24" y2="32" stroke="currentColor" strokeWidth="2" />
    <line x1="8" y1="16" x2="32" y2="16" stroke="currentColor" strokeWidth="2" />
    <line x1="8" y1="24" x2="32" y2="24" stroke="currentColor" strokeWidth="2" />
  </svg>
);

/** Small glanceable icon showing how to move the cube before this scan. */
export default function RotationHint({ rotation }: { rotation: RotationKind }) {
  switch (rotation) {
    case 'start':
      return <HoldIcon />;
    case 'rotate-left':
      return <CurvedArrow rotate={0} />;
    case 'rotate-left-tilt-down':
      return (
        <span className="inline-flex items-center gap-1">
          <CurvedArrow rotate={0} />
          <CurvedArrow rotate={90} />
        </span>
      );
    case 'tilt-up-twice':
      return <CurvedArrow rotate={-90} label="x2" />;
  }
}
