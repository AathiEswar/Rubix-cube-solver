import { useCallback, useEffect, useRef, useState } from 'react';
import type { FaceName, Sticker } from '../lib/types';
import { STICKER_CYCLE, STICKER_HEX, STICKER_NAME } from '../lib/types';
import type { ScanStep } from '../lib/scanSteps';
import { SCAN_STEPS } from '../lib/scanSteps';
import { classifyColor } from '../lib/colorDetect';
import RotationHint from './RotationHint';

/**
 * Fullscreen camera view with the 3x3 scan square. Opens the webcam once,
 * samples the video every 250ms, maps the overlay square back into video
 * pixels (inverting the object-cover crop), and classifies the 9 stickers
 * live. The preview is mirrored (selfie-style); sampling uses the same
 * horizontal flip so overlays line up, then each face is un-mirrored before
 * it is handed to the solver (a mirrored cube is chirally invalid).
 * Two capture modes:
 *  - Manual: press "Scan this face", then review and tap-correct stickers.
 *  - Auto: when the correct centre colour is showing and all 9 detected
 *    colours stay identical for 2 seconds, the face is captured
 *    automatically (flash + beep) and the flow advances to the next face.
 * Already-scanned faces can be tapped in the progress dots to retake.
 */

const SAMPLE_MS = 250; // how often we read the video
const STABLE_TARGET_MS = 2000; // hold-still time required in auto mode
const COOLDOWN_MS = 1800; // pause after an auto-capture so the user can rotate

type ScanMode = 'manual' | 'auto';

/**
 * Undo the camera mirror: reverse each row's columns so the facelet string
 * matches the real (non-mirrored) cube the Kociemba solver expects.
 */
function unmirrorFace(a: Sticker[]): Sticker[] {
  return [a[2], a[1], a[0], a[5], a[4], a[3], a[8], a[7], a[6]];
}

interface Props {
  step: ScanStep;
  stepIndex: number;
  faces: Partial<Record<FaceName, Sticker[]>>;
  onConfirm: (stickers: Sticker[]) => void;
  onRetakeFace: (index: number) => void;
  onReset: () => void;
}

/** Short confirmation beep via Web Audio; silently ignored if unavailable. */
function beep() {
  try {
    const Ctx =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    const ctx = new Ctx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
    osc.start();
    osc.stop(ctx.currentTime + 0.22);
    setTimeout(() => void ctx.close(), 400);
  } catch {
    /* audio not available — no problem */
  }
}

export default function CameraScanner({
  step,
  stepIndex,
  faces,
  onConfirm,
  onRetakeFace,
  onReset,
}: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const [live, setLive] = useState<Sticker[] | null>(null);
  const [captured, setCaptured] = useState<Sticker[] | null>(null);
  const [camError, setCamError] = useState('');

  // Auto-capture state
  const [mode, setMode] = useState<ScanMode>('auto');
  const [stableMs, setStableMs] = useState(0);
  const [flash, setFlash] = useState(false);
  const [toast, setToast] = useState('');
  const lastKeyRef = useRef('');
  const stableMsRef = useRef(0);
  const cooldownUntilRef = useRef(0);

  // Open the camera once; keep the stream across all six scans.
  useEffect(() => {
    let stream: MediaStream | null = null;
    let cancelled = false;
    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'environment',
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        });
        if (cancelled || !videoRef.current) return;
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      } catch {
        setCamError(
          'Camera access was denied or no camera was found. Allow camera access in your browser and try again.'
        );
      }
    })();
    return () => {
      cancelled = true;
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  // New face → reset the hold-still timer and give a short grace period.
  useEffect(() => {
    lastKeyRef.current = '';
    stableMsRef.current = 0;
    setStableMs(0);
    setCaptured(null);
    cooldownUntilRef.current = Math.max(
      cooldownUntilRef.current,
      Date.now() + 600
    );
  }, [stepIndex]);

  /** Sample the 9 cell centres of the overlay square from the video frame. */
  const sample = useCallback((): Sticker[] | null => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const grid = gridRef.current;
    if (!video || !canvas || !grid || video.videoWidth === 0) return null;

    const vw = video.videoWidth;
    const vh = video.videoHeight;
    canvas.width = vw;
    canvas.height = vh;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return null;
    // Draw mirrored to match the CSS-flipped <video>, so grid cells sample
    // the colours the user sees. getImageData reads the bitmap, not the
    // transform — restore immediately after drawing.
    ctx.save();
    ctx.translate(vw, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0);
    ctx.restore();

    // The video fills the viewport with object-cover; invert that mapping.
    const cw = window.innerWidth;
    const ch = window.innerHeight;
    const scale = Math.max(cw / vw, ch / vh);
    const offX = (cw - vw * scale) / 2;
    const offY = (ch - vh * scale) / 2;

    const rect = grid.getBoundingClientRect();
    const patch = Math.max(
      6,
      Math.round(((rect.width / 3) * 0.4) / scale) // ~40% of a cell
    );

    const colors: Sticker[] = [];
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        const dx = rect.left + ((col + 0.5) * rect.width) / 3;
        const dy = rect.top + ((row + 0.5) * rect.height) / 3;
        const nx = (dx - offX) / scale;
        const ny = (dy - offY) / scale;
        const x0 = Math.max(0, Math.min(vw - patch, Math.round(nx - patch / 2)));
        const y0 = Math.max(0, Math.min(vh - patch, Math.round(ny - patch / 2)));
        const data = ctx.getImageData(x0, y0, patch, patch).data;
        // Median per channel — robust against glare highlights and shadows.
        const rs: number[] = [];
        const gs: number[] = [];
        const bs: number[] = [];
        for (let i = 0; i < data.length; i += 4) {
          rs.push(data[i]);
          gs.push(data[i + 1]);
          bs.push(data[i + 2]);
        }
        const asc = (a: number, b: number) => a - b;
        rs.sort(asc);
        gs.sort(asc);
        bs.sort(asc);
        const mid = rs.length >> 1;
        colors.push(classifyColor(rs[mid], gs[mid], bs[mid]));
      }
    }
    return colors;
  }, []);

  /** Auto-capture: flash + beep, then confirm and pause briefly. */
  const autoCapture = useCallback(
    (colors: Sticker[]) => {
      cooldownUntilRef.current = Date.now() + COOLDOWN_MS;
      lastKeyRef.current = '';
      stableMsRef.current = 0;
      setStableMs(0);
      setFlash(true);
      setTimeout(() => setFlash(false), 220);
      beep();
      try {
        navigator.vibrate?.(80);
      } catch {
        /* not supported */
      }
      const remainingAfter =
        SCAN_STEPS.filter((s) => s.face !== step.face && !faces[s.face]).length;
      setToast(
        remainingAfter === 0
          ? 'All faces captured!'
          : 'Captured! Rotate to the next face…'
      );
      setTimeout(() => setToast(''), 1600);
      onConfirm(unmirrorFace(colors));
    },
    [onConfirm, step.face, faces]
  );

  // Main sampling loop.
  useEffect(() => {
    const id = setInterval(() => {
      if (captured) return; // paused while the manual review modal is open
      const colors = sample();
      if (!colors) return;
      setLive(colors);

      if (mode !== 'auto') return;
      if (Date.now() < cooldownUntilRef.current) return;

      const key = colors.join('');
      const centerOk = colors[4] === step.expectedCenter;
      if (centerOk && key === lastKeyRef.current) {
        const next = stableMsRef.current + SAMPLE_MS;
        stableMsRef.current = next;
        setStableMs(next);
        if (next >= STABLE_TARGET_MS) autoCapture(colors);
      } else {
        lastKeyRef.current = key;
        stableMsRef.current = 0;
        setStableMs(0);
      }
    }, SAMPLE_MS);
    return () => clearInterval(id);
  }, [captured, sample, mode, step.expectedCenter, autoCapture]);

  const cycleSticker = (i: number) => {
    if (!captured) return;
    const next = [...captured];
    next[i] = STICKER_CYCLE[(STICKER_CYCLE.indexOf(next[i]) + 1) % STICKER_CYCLE.length];
    setCaptured(next);
  };

  if (camError) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-zinc-950 p-6">
        <div className="max-w-sm rounded-2xl border border-white/10 bg-zinc-900 p-6 text-center">
          <h2 className="text-lg font-semibold text-red-400">Camera unavailable</h2>
          <p className="mt-2 text-sm text-white/70">{camError}</p>
          <button
            onClick={onReset}
            className="mt-5 rounded-xl bg-white/10 px-6 py-3 font-medium hover:bg-white/20"
          >
            Back to start
          </button>
        </div>
      </div>
    );
  }

  const centerOk = live?.[4] === step.expectedCenter;
  const holdProgress = Math.min(stableMs / STABLE_TARGET_MS, 1);
  const scannedCount = SCAN_STEPS.filter((s) => faces[s.face]).length;

  return (
    <div className="fixed inset-0 bg-black">
      <video
        ref={videoRef}
        playsInline
        muted
        className="absolute inset-0 h-full w-full -scale-x-100 object-cover"
      />
      <canvas ref={canvasRef} className="hidden" />

      {/* Scan square with live-detected colours */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div
          ref={gridRef}
          className={`grid aspect-square w-[min(62vw,52vh)] grid-cols-3 overflow-hidden rounded-xl border-2 shadow-[0_0_0_9999px_rgba(0,0,0,0.35)] transition-colors ${
            mode === 'auto' && stableMs > 0
              ? 'border-emerald-400'
              : 'border-white/80'
          }`}
        >
          {Array.from({ length: 9 }, (_, i) => (
            <div
              key={i}
              className="relative border border-white/40"
              style={{
                backgroundColor: live ? `${STICKER_HEX[live[i]]}55` : 'transparent',
              }}
            >
              {live && (
                <span
                  className="absolute bottom-1 right-1 flex h-5 w-5 items-center justify-center rounded-full border border-black/50 text-[10px] font-black text-black/80"
                  style={{ backgroundColor: STICKER_HEX[live[i]] }}
                >
                  {live[i]}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Capture flash */}
      {flash && <div className="absolute inset-0 z-30 bg-white/70" />}

      {/* Captured toast */}
      {toast && (
        <div className="pointer-events-none absolute inset-x-0 top-1/2 z-30 flex -translate-y-1/2 justify-center">
          <div className="rounded-full bg-emerald-500 px-6 py-3 text-lg font-bold text-black shadow-xl">
            {toast}
          </div>
        </div>
      )}

      {/* Top-right floating controls: mode toggle + reset */}
      <div className="absolute right-4 top-4 z-20 flex flex-col items-end gap-2">
        <div className="flex overflow-hidden rounded-full border border-white/20 bg-black/60 text-xs font-semibold backdrop-blur">
          <button
            onClick={() => setMode('manual')}
            className={`px-4 py-1.5 transition ${
              mode === 'manual'
                ? 'bg-white text-black'
                : 'text-white/70 hover:bg-white/10'
            }`}
          >
            Manual
          </button>
          <button
            onClick={() => setMode('auto')}
            className={`px-4 py-1.5 transition ${
              mode === 'auto'
                ? 'bg-emerald-500 text-black'
                : 'text-white/70 hover:bg-white/10'
            }`}
          >
            Auto
          </button>
        </div>
        <button
          onClick={onReset}
          className="rounded-lg border border-white/20 bg-black/50 px-3 py-1 text-xs font-medium text-white/80 backdrop-blur hover:bg-white/10"
        >
          Start over
        </button>
      </div>

      {/* Top banner: progress + instruction */}
      <div className="absolute inset-x-0 top-0 bg-gradient-to-b from-black/80 to-transparent p-4 pb-10">
        <div className="mx-auto mt-20 max-w-xl rounded-2xl border border-white/10 bg-black/60 px-5 py-4 backdrop-blur md:mt-0">
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-xs uppercase tracking-widest text-white/60">
              {scannedCount} of 6 scanned
            </p>
            <div className="flex items-center gap-1.5">
              {SCAN_STEPS.map((s, i) => {
                const done = Boolean(faces[s.face]);
                const current = i === stepIndex;
                const canRetake = done && !current;
                return (
                  <button
                    key={s.face}
                    type="button"
                    disabled={!canRetake}
                    title={
                      canRetake
                        ? `Retake ${s.title}`
                        : current
                          ? `Scanning ${s.title}`
                          : s.title
                    }
                    onClick={() => onRetakeFace(i)}
                    className={`h-6 w-6 rounded-full border transition ${
                      current
                        ? 'border-cyan-300 ring-2 ring-cyan-300/40'
                        : canRetake
                          ? 'border-white/50 hover:scale-110 hover:ring-2 hover:ring-white/30'
                          : 'border-white/30'
                    } ${canRetake ? 'cursor-pointer' : 'cursor-default'}`}
                    style={{
                      backgroundColor: done
                        ? STICKER_HEX[s.expectedCenter]
                        : current
                          ? `${STICKER_HEX[s.expectedCenter]}88`
                          : 'transparent',
                    }}
                  />
                );
              })}
            </div>
          </div>
          {scannedCount > 0 && (
            <p className="mt-1.5 text-[11px] text-white/45">
              Tap a filled colour to retake that face
            </p>
          )}
          <h2 className="mt-2 text-lg font-semibold">{step.title}</h2>
          <div className="mt-1 flex items-start gap-3 text-sm text-white/85">
            <RotationHint rotation={step.rotation} />
            <p>{step.instruction}</p>
          </div>
          {mode === 'auto' && (
            <p className="mt-2 text-[11px] text-white/50">
              Auto capture on — hold each face steady for 2s and it scans itself.
            </p>
          )}
        </div>
      </div>

      {/* Bottom controls */}
      <div className="absolute inset-x-0 bottom-0 flex flex-col items-center gap-2 bg-gradient-to-t from-black/80 to-transparent p-6 pt-12">
        {mode === 'manual' ? (
          <>
            <button
              onClick={() => live && setCaptured([...live])}
              disabled={!live}
              className="rounded-full bg-emerald-500 px-10 py-4 text-lg font-bold text-black shadow-lg transition hover:bg-emerald-400 disabled:opacity-40"
            >
              Scan this face
            </button>
            <p className="text-xs text-white/50">
              Fill the square with the cube face — even lighting helps detection.
            </p>
          </>
        ) : (
          <>
            {/* Auto-capture status */}
            <div className="w-64">
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-white/15">
                <div
                  className="h-full rounded-full bg-emerald-400 transition-[width] duration-200"
                  style={{ width: `${holdProgress * 100}%` }}
                />
              </div>
            </div>
            <p className="text-sm font-medium text-white/90">
              {!live
                ? 'Starting camera…'
                : !centerOk
                  ? `Show the face with the ${STICKER_NAME[step.expectedCenter].toUpperCase()} centre`
                  : stableMs > 0
                    ? `Hold still… ${Math.max(
                        0,
                        (STABLE_TARGET_MS - stableMs) / 1000
                      ).toFixed(1)}s`
                    : 'Steady now — keep the cube still'}
            </p>
            <button
              onClick={() => live && setCaptured([...live])}
              disabled={!live}
              className="text-xs text-white/50 underline hover:text-white/80"
            >
              or scan manually
            </button>
          </>
        )}
      </div>

      {/* Review captured face (manual mode, or manual override in auto) */}
      {captured && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/80 p-6 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-zinc-900 p-6">
            <h3 className="text-lg font-semibold">Check the colours</h3>
            <p className="mt-1 text-sm text-white/60">
              Tap any sticker that looks wrong to cycle its colour.
            </p>
            <div className="mx-auto mt-4 grid w-56 grid-cols-3 gap-1.5">
              {captured.map((c, i) => (
                <button
                  key={i}
                  onClick={() => cycleSticker(i)}
                  aria-label={`Sticker ${i + 1}: ${STICKER_NAME[c]}`}
                  className="aspect-square rounded-md border-2 border-black/60 transition active:scale-95"
                  style={{ backgroundColor: STICKER_HEX[c] }}
                />
              ))}
            </div>
            {captured[4] !== step.expectedCenter && (
              <p className="mt-3 text-sm text-amber-400">
                The centre looks {STICKER_NAME[captured[4]]}, but this face should
                have a {STICKER_NAME[step.expectedCenter]} centre. Check the cube
                orientation, or tap the centre to fix it.
              </p>
            )}
            <div className="mt-5 flex gap-3">
              <button
                onClick={() => setCaptured(null)}
                className="flex-1 rounded-xl border border-white/20 py-3 font-medium hover:bg-white/10"
              >
                Retake
              </button>
              <button
                onClick={() => {
                  const stickers = captured;
                  setCaptured(null);
                  onConfirm(unmirrorFace(stickers));
                }}
                className="flex-1 rounded-xl bg-emerald-500 py-3 font-bold text-black hover:bg-emerald-400"
              >
                Looks right
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
