// app/hiit/Runner.tsx
'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, SkipBack, SkipForward, Volume2, VolumeX } from 'lucide-react';
import type { Workout, Segment } from './schema';
import { compileWorkout, totalDuration, formatTime } from './schema';

type Props = {
  workout: Workout;
  voiceEnabled: boolean;
  onVoiceToggle: (v: boolean) => void;
  onExit: () => void;
};

const TYPE_STYLES: Record<
  Segment['type'],
  { dot: string; text: string; label: string; ring: string; glow: string }
> = {
  prep: {
    dot: '#fbbf24',
    text: '#fcd34d',
    ring: '#fbbf24',
    label: 'Prep',
    glow: 'rgba(251,191,36,0.18)',
  },
  warmup: {
    dot: '#fbbf24',
    text: '#fcd34d',
    ring: '#fbbf24',
    label: 'Warm-up',
    glow: 'rgba(251,191,36,0.18)',
  },
  work: {
    dot: '#a3e635',
    text: '#bef264',
    ring: '#a3e635',
    label: 'Work',
    glow: 'rgba(163,230,53,0.22)',
  },
  rest: {
    dot: '#38bdf8',
    text: '#7dd3fc',
    ring: '#38bdf8',
    label: 'Rest',
    glow: 'rgba(56,189,248,0.18)',
  },
  break: {
    dot: '#a1a1aa',
    text: '#d4d4d8',
    ring: '#a1a1aa',
    label: 'Break',
    glow: 'rgba(161,161,170,0.10)',
  },
  finisher: {
    dot: '#f87171',
    text: '#fca5a5',
    ring: '#f87171',
    label: 'Finisher',
    glow: 'rgba(248,113,113,0.22)',
  },
  cooldown: {
    dot: '#a78bfa',
    text: '#c4b5fd',
    ring: '#a78bfa',
    label: 'Cooldown',
    glow: 'rgba(167,139,250,0.18)',
  },
};

export default function Runner({ workout, voiceEnabled, onVoiceToggle, onExit }: Props) {
  const segments = useMemo(() => compileWorkout(workout), [workout]);
  const total = useMemo(() => totalDuration(segments), [segments]);

  const [elapsed, setElapsed] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);
  const lastBeepKeyRef = useRef<string>('');
  const lastSpokenIdxRef = useRef<number>(-1);

  // ─── Compute current segment ────────────────────────────────────────────────
  const { currentIdx, segElapsed } = useMemo(() => {
    let acc = 0;
    for (let i = 0; i < segments.length; i++) {
      const seg = segments[i]!;
      if (elapsed < acc + seg.duration) {
        return { currentIdx: i, segElapsed: elapsed - acc };
      }
      acc += seg.duration;
    }
    return { currentIdx: segments.length, segElapsed: 0 };
  }, [elapsed, segments]);

  const currentSeg = segments[currentIdx] || null;
  const timeLeft = currentSeg ? currentSeg.duration - segElapsed : 0;

  const nextExercise = useMemo(() => {
    for (let i = currentIdx + 1; i < segments.length; i++) {
      const s = segments[i]!;
      if (s.type !== 'rest' && s.type !== 'break') return s;
    }
    return null;
  }, [currentIdx, segments]);

  // ─── Audio (Web Audio beeps) ────────────────────────────────────────────────
  function ensureAudio() {
    if (!audioCtxRef.current && typeof window !== 'undefined') {
      try {
        const Ctx = (window.AudioContext ||
          (window as any).webkitAudioContext) as typeof AudioContext;
        audioCtxRef.current = new Ctx();
      } catch {}
    }
    return audioCtxRef.current;
  }

  function beep(freq = 800, duration = 0.15, type: OscillatorType = 'sine', volume = 0.35) {
    try {
      const ctx = ensureAudio();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(volume, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch {}
  }

  // ─── Voice (Speech Synthesis) ───────────────────────────────────────────────
  function speak(text: string) {
    if (!voiceEnabled) return;
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.rate = 1.05;
      u.pitch = 1;
      u.volume = 0.95;
      window.speechSynthesis.speak(u);
    } catch {}
  }

  // ─── Wake Lock ──────────────────────────────────────────────────────────────
  useEffect(() => {
    let active = true;

    const acquire = async () => {
      if (!isRunning) return;
      try {
        const nav = navigator as Navigator & {
          wakeLock?: { request: (type: 'screen') => Promise<WakeLockSentinel> };
        };
        if (nav.wakeLock && active) {
          wakeLockRef.current = await nav.wakeLock.request('screen');
        }
      } catch {}
    };

    const release = () => {
      if (wakeLockRef.current) {
        wakeLockRef.current.release().catch(() => {});
        wakeLockRef.current = null;
      }
    };

    if (isRunning) {
      acquire();
    } else {
      release();
    }

    const onVisible = () => {
      if (document.visibilityState === 'visible' && isRunning) acquire();
    };
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      active = false;
      document.removeEventListener('visibilitychange', onVisible);
      release();
    };
  }, [isRunning]);

  // ─── Completion ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (currentIdx >= segments.length && !isComplete) {
      setIsComplete(true);
      setIsRunning(false);
      beep(880, 0.2);
      setTimeout(() => beep(1100, 0.25), 180);
      setTimeout(() => beep(1320, 0.4), 380);
      setTimeout(() => speak('Workout complete. Nice work.'), 600);
    }
  }, [currentIdx, segments.length, isComplete]);

  // ─── Tick ───────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(interval);
  }, [isRunning]);

  // ─── Audio + Voice cues ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!isRunning || !currentSeg) return;
    const key = `${currentIdx}-${segElapsed}`;
    if (lastBeepKeyRef.current === key) return;
    lastBeepKeyRef.current = key;

    // Start of new segment
    if (segElapsed === 0 && elapsed > 0) {
      if (currentSeg.type === 'work' || currentSeg.type === 'finisher') {
        beep(880, 0.3, 'square', 0.4);
      } else if (currentSeg.type === 'rest') {
        beep(440, 0.18, 'sine', 0.3);
      } else if (currentSeg.type === 'warmup' || currentSeg.type === 'cooldown') {
        beep(660, 0.18, 'sine', 0.3);
      } else if (currentSeg.type === 'break') {
        beep(330, 0.25, 'sine', 0.3);
      }

      // Speak the upcoming exercise/state once per segment transition
      if (lastSpokenIdxRef.current !== currentIdx) {
        lastSpokenIdxRef.current = currentIdx;
        if (currentSeg.type === 'rest') {
          speak('Rest');
        } else {
          speak(currentSeg.name);
        }
      }
    }

    // 3-2-1 countdown beeps
    if (timeLeft <= 3 && timeLeft > 0) {
      beep(660, 0.07, 'sine', 0.3);
    }
  }, [currentIdx, segElapsed, isRunning, currentSeg, elapsed, timeLeft]);

  // Speak the very first segment on start
  useEffect(() => {
    if (isRunning && elapsed === 0 && currentSeg && lastSpokenIdxRef.current !== 0) {
      lastSpokenIdxRef.current = 0;
      speak(currentSeg.name);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRunning]);

  // ─── Handlers ───────────────────────────────────────────────────────────────
  const handleStart = () => {
    const ctx = ensureAudio();
    if (ctx && ctx.state === 'suspended') ctx.resume();
    if (!isRunning) {
      // Clear dedup so a countdown beep fires after resume even if the
      // (currentIdx, segElapsed) pair matches the second the user paused on.
      lastBeepKeyRef.current = '';
      if (elapsed === 0) {
        beep(440, 0.05, 'sine', 0.15);
        // Prime speech synthesis on user gesture (iOS quirk)
        if (voiceEnabled && typeof window !== 'undefined' && 'speechSynthesis' in window) {
          const u = new SpeechSynthesisUtterance(' ');
          u.volume = 0;
          try {
            window.speechSynthesis.speak(u);
          } catch {}
        }
      }
    }
    setIsRunning((r) => !r);
  };

  const handleReset = () => {
    setIsRunning(false);
    setElapsed(0);
    setIsComplete(false);
    lastSpokenIdxRef.current = -1;
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {}
    }
  };

  const handleSkip = () => {
    if (!currentSeg) return;
    let acc = 0;
    for (let i = 0; i <= currentIdx; i++) acc += segments[i]!.duration;
    setElapsed(acc);
  };

  const handleBack = () => {
    if (currentIdx === 0 && segElapsed === 0) return;
    let acc = 0;
    if (segElapsed > 1) {
      for (let i = 0; i < currentIdx; i++) acc += segments[i]!.duration;
    } else {
      for (let i = 0; i < Math.max(0, currentIdx - 1); i++) acc += segments[i]!.duration;
    }
    setElapsed(acc);
    lastSpokenIdxRef.current = -1;
  };

  // ─── Complete screen ────────────────────────────────────────────────────────
  if (isComplete) {
    return (
      <div
        className="flex min-h-[100dvh] w-full flex-col items-center justify-center px-6 text-stone-50"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(163,230,53,0.18) 0%, #0a0a0a 60%)',
        }}
      >
        <div className="text-center">
          <div
            className="mb-5 text-[0.7rem] font-bold tracking-[0.45em]"
            style={{
              color: '#bef264',
              fontFamily: 'var(--font-instrument, "Instrument Sans", sans-serif)',
            }}
          >
            WORKOUT COMPLETE
          </div>
          <h1
            className="mb-6 italic leading-[0.9]"
            style={{
              fontFamily: 'var(--font-fraunces, "Fraunces", serif)',
              fontSize: 'clamp(4rem, 18vw, 8rem)',
              fontWeight: 500,
            }}
          >
            Nice
            <br />
            work.
          </h1>
          <div className="mb-10 text-sm text-stone-400">Legs cooked. Recover well.</div>
          <div className="flex justify-center gap-3">
            <button
              onClick={handleReset}
              className="rounded-full px-6 py-3 text-xs font-bold tracking-[0.25em] transition active:scale-95"
              style={{
                background: '#a3e635',
                color: '#0a0a0a',
                boxShadow: '0 0 32px rgba(163,230,53,0.4)',
              }}
            >
              GO AGAIN
            </button>
            <button
              onClick={onExit}
              className="rounded-full border border-stone-700 px-6 py-3 text-xs font-bold tracking-[0.25em] text-stone-300 transition active:scale-95"
            >
              DONE
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── Active runner screen ───────────────────────────────────────────────────
  const style = currentSeg ? TYPE_STYLES[currentSeg.type] : TYPE_STYLES.prep;
  const overallProgress = Math.min(100, (elapsed / total) * 100);
  const segProgress = currentSeg ? Math.min(1, segElapsed / currentSeg.duration) : 0;
  const isCountdown =
    timeLeft <= 3 &&
    timeLeft > 0 &&
    currentSeg &&
    (currentSeg.type === 'work' || currentSeg.type === 'finisher');
  const isHot = currentSeg && (currentSeg.type === 'work' || currentSeg.type === 'finisher');

  // Circular progress ring math
  const RADIUS = 130;
  const CIRC = 2 * Math.PI * RADIUS;
  const offset = CIRC * (1 - segProgress);

  return (
    <div
      className="flex min-h-[100dvh] w-full select-none flex-col text-stone-50"
      style={{
        background: `radial-gradient(ellipse 80% 50% at 50% 100%, ${style.glow} 0%, transparent 70%), #0a0a0a`,
        fontFamily: 'var(--font-instrument, "Instrument Sans", system-ui, sans-serif)',
        transition: 'background 0.6s ease',
      }}
    >
      {/* Top bar */}
      <div className="px-5 pb-3 pt-5">
        <div className="mb-3 flex items-center justify-between">
          <button
            onClick={onExit}
            className="flex items-center gap-1.5 text-[0.65rem] font-bold tracking-[0.3em] text-stone-500 active:text-stone-300"
            aria-label="Exit"
          >
            <ArrowLeft size={12} strokeWidth={2.5} />
            EXIT
          </button>
          <div className="text-[0.65rem] font-bold tracking-[0.3em] text-stone-500">
            {workout.name.toUpperCase()}
          </div>
          <button
            onClick={() => onVoiceToggle(!voiceEnabled)}
            className="flex items-center gap-1.5 text-[0.65rem] font-bold tracking-[0.3em]"
            style={{ color: voiceEnabled ? '#bef264' : '#71717a' }}
            aria-label="Toggle voice"
          >
            {voiceEnabled ? (
              <Volume2 size={14} strokeWidth={2.2} />
            ) : (
              <VolumeX size={14} strokeWidth={2.2} />
            )}
          </button>
        </div>
        <div className="h-[3px] overflow-hidden rounded-full bg-stone-900">
          <div
            className="h-full transition-all duration-1000 ease-linear"
            style={{
              width: `${overallProgress}%`,
              background: 'linear-gradient(90deg, #fbbf24 0%, #a3e635 50%, #f87171 100%)',
            }}
          />
        </div>
        <div className="mt-2 flex justify-between text-[0.6rem] font-bold tabular-nums tracking-[0.25em] text-stone-600">
          <span>{formatTime(elapsed)}</span>
          <span>{formatTime(total - elapsed)} LEFT</span>
        </div>
      </div>

      {/* Phase label */}
      <div className="mt-3 px-5 text-center">
        <div
          className="text-[0.7rem] font-bold uppercase tracking-[0.3em]"
          style={{ color: style.text }}
        >
          {currentSeg ? currentSeg.phase : '—'}
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-1 flex-col items-center justify-center px-5">
        {/* Exercise name */}
        <div className="mb-4 flex min-h-[4.5rem] items-center justify-center px-4 text-center">
          <h1
            className="italic leading-[1] tracking-tight"
            style={{
              fontFamily: 'var(--font-fraunces, "Fraunces", serif)',
              fontSize: 'clamp(2rem, 7.5vw, 3.75rem)',
              fontWeight: 400,
            }}
          >
            {currentSeg ? currentSeg.name : ''}
          </h1>
        </div>

        {/* Circular progress ring with timer */}
        <div className="relative" style={{ width: 280, height: 280 }}>
          <svg width="280" height="280" viewBox="0 0 280 280" className="-rotate-90">
            <circle
              cx="140"
              cy="140"
              r={RADIUS}
              fill="none"
              stroke="rgb(39, 39, 42)"
              strokeWidth="4"
            />
            <circle
              cx="140"
              cy="140"
              r={RADIUS}
              fill="none"
              stroke={style.ring}
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray={CIRC}
              strokeDashoffset={offset}
              style={{
                transition: 'stroke-dashoffset 1s linear, stroke 0.4s ease',
                filter: isHot ? `drop-shadow(0 0 12px ${style.ring})` : 'none',
              }}
            />
          </svg>
          <div
            className="absolute inset-0 flex flex-col items-center justify-center leading-none"
            style={{
              fontFamily: 'var(--font-jetbrains, "JetBrains Mono", monospace)',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            <div
              style={{
                fontSize: 'clamp(4rem, 16vw, 6rem)',
                fontWeight: 700,
                color: isCountdown ? '#fb7185' : '#fafafa',
                transition: 'color 0.2s ease',
              }}
            >
              {formatTime(timeLeft)}
            </div>
          </div>
        </div>

        {/* State badge */}
        <div className="mt-6 flex items-center gap-3">
          <span
            className="h-2.5 w-2.5 rounded-full"
            style={{
              background: style.dot,
              boxShadow: isRunning ? `0 0 12px ${style.dot}` : 'none',
              animation: isRunning ? 'hiit-pulse 1.4s ease-in-out infinite' : 'none',
            }}
          />
          <span
            className="text-xs font-bold uppercase tracking-[0.4em]"
            style={{ color: style.text }}
          >
            {style.label}
          </span>
        </div>

        {/* Next up */}
        <div className="mt-8 min-h-[3rem] text-center">
          {nextExercise ? (
            <>
              <div className="mb-1.5 text-[0.6rem] font-bold tracking-[0.35em] text-stone-600">
                NEXT UP
              </div>
              <div className="text-sm text-stone-400">
                {nextExercise.name}
                <span className="text-stone-600"> · {nextExercise.duration}s</span>
              </div>
            </>
          ) : (
            <div className="text-sm italic text-stone-500">last one — finish strong</div>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="px-5 pb-8 pt-4">
        <div className="mx-auto flex max-w-sm items-center justify-between gap-3">
          <button
            onClick={handleBack}
            className="flex h-14 w-14 items-center justify-center rounded-full border border-stone-800 bg-stone-900 text-stone-400 transition-colors active:bg-stone-800"
            aria-label="Back"
          >
            <SkipBack size={22} strokeWidth={2.2} fill="currentColor" />
          </button>
          <button
            onClick={handleStart}
            className="h-16 flex-1 rounded-full text-base font-bold tracking-[0.3em] transition-all active:scale-[0.97]"
            style={{
              background: isRunning ? '#fafafa' : '#a3e635',
              color: '#0a0a0a',
              boxShadow: isRunning ? 'none' : '0 0 32px rgba(163,230,53,0.35)',
            }}
          >
            {isRunning ? 'PAUSE' : elapsed === 0 ? 'START' : 'RESUME'}
          </button>
          <button
            onClick={handleSkip}
            className="flex h-14 w-14 items-center justify-center rounded-full border border-stone-800 bg-stone-900 text-stone-400 transition-colors active:bg-stone-800"
            aria-label="Skip"
          >
            <SkipForward size={22} strokeWidth={2.2} fill="currentColor" />
          </button>
        </div>
        <div className="mt-4 flex justify-center">
          <button
            onClick={handleReset}
            className="px-4 py-2 text-[0.65rem] font-bold tracking-[0.4em] text-stone-600 active:text-stone-400"
          >
            RESET
          </button>
        </div>
      </div>

      <style
        dangerouslySetInnerHTML={{
          __html: `
        @keyframes hiit-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.4); }
        }
      `,
        }}
      />
    </div>
  );
}
