// app/hiit/schema.ts
// Workout schema, compilation, and URL encoding utilities.

export type WarmupBlock = {
  type: 'warmup' | 'cooldown';
  exercises: Array<{ name: string; duration: number }>;
};

export type CircuitBlock = {
  type: 'circuit';
  name: string;
  work: number;
  rest: number;
  rounds: number;
  restBetweenRounds?: number;
  exercises: string[];
};

export type FinisherBlock = {
  type: 'finisher';
  rest: number; // 0 for no rest between exercises
  exercises: Array<{ name: string; duration: number }>;
};

export type CustomBlock = {
  type: 'custom';
  name: string;
  segments: Array<{ name: string; duration: number; kind: 'work' | 'rest' }>;
};

export type Block = WarmupBlock | CircuitBlock | FinisherBlock | CustomBlock;

export type Workout = {
  name: string;
  description?: string;
  blocks: Block[];
};

export type SegmentType = 'prep' | 'warmup' | 'work' | 'rest' | 'break' | 'finisher' | 'cooldown';

export type Segment = {
  type: SegmentType;
  name: string;
  duration: number;
  phase: string;
};

// ─── Compile a Workout into a flat list of timed Segments ─────────────────────

export function compileWorkout(workout: Workout): Segment[] {
  const segs: Segment[] = [];
  segs.push({ type: 'prep', name: 'Get Ready', duration: 10, phase: 'Prep' });

  for (const block of workout.blocks) {
    if (block.type === 'warmup' || block.type === 'cooldown') {
      const phase = block.type === 'warmup' ? 'Warm-up' : 'Cooldown';
      block.exercises.forEach((ex) => {
        segs.push({ type: block.type, name: ex.name, duration: ex.duration, phase });
      });
    } else if (block.type === 'circuit') {
      segs.push({ type: 'break', name: block.name, duration: 30, phase: 'Up Next' });
      for (let r = 1; r <= block.rounds; r++) {
        block.exercises.forEach((name, i) => {
          segs.push({
            type: 'work',
            name,
            duration: block.work,
            phase: `${block.name} — Round ${r}/${block.rounds}`,
          });
          const isLast = r === block.rounds && i === block.exercises.length - 1;
          if (!isLast) {
            segs.push({
              type: 'rest',
              name: 'Rest',
              duration: block.rest,
              phase: `${block.name} — Round ${r}/${block.rounds}`,
            });
          }
        });
        if (r < block.rounds && (block.restBetweenRounds ?? 0) > 0) {
          segs.push({
            type: 'break',
            name: `Round ${r + 1} Coming`,
            duration: block.restBetweenRounds!,
            phase: 'Break',
          });
        }
      }
    } else if (block.type === 'finisher') {
      segs.push({ type: 'break', name: 'Finisher', duration: 30, phase: 'Up Next' });
      block.exercises.forEach((ex, i) => {
        segs.push({ type: 'finisher', name: ex.name, duration: ex.duration, phase: 'Finisher' });
        if (block.rest > 0 && i < block.exercises.length - 1) {
          segs.push({ type: 'rest', name: 'Rest', duration: block.rest, phase: 'Finisher' });
        }
      });
    } else if (block.type === 'custom') {
      block.segments.forEach((seg) => {
        segs.push({
          type: seg.kind === 'rest' ? 'rest' : 'work',
          name: seg.name,
          duration: seg.duration,
          phase: block.name,
        });
      });
    }
  }

  return segs;
}

export function totalDuration(segs: Segment[]): number {
  return segs.reduce((s, x) => s + x.duration, 0);
}

export function summarizeWorkout(w: Workout) {
  const segs = compileWorkout(w);
  const totalSec = totalDuration(segs);
  const exerciseCount = segs.filter(
    (s) =>
      s.type === 'work' || s.type === 'finisher' || s.type === 'warmup' || s.type === 'cooldown'
  ).length;
  return {
    totalSec,
    totalMin: Math.round(totalSec / 60),
    exerciseCount,
    blockCount: w.blocks.length,
  };
}

// ─── URL encoding (URL-safe base64) ───────────────────────────────────────────

export function encodeWorkoutToUrl(workout: Workout): string {
  const json = JSON.stringify(workout);
  // UTF-8 → base64 (URL-safe). Client-only.
  const b64 = window.btoa(unescape(encodeURIComponent(json)));
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function decodeWorkoutFromUrl(s: string): Workout | null {
  if (typeof window === 'undefined') return null;
  try {
    const b64 = s.replace(/-/g, '+').replace(/_/g, '/');
    const padded = b64 + '='.repeat((4 - (b64.length % 4)) % 4);
    const json = decodeURIComponent(escape(window.atob(padded)));
    const parsed = JSON.parse(json);
    return validateWorkout(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

// Quick-circuit URL params: /hiit?ex=Squats,Lunges&work=40&rest=20&rounds=3
export function parseQuickParams(params: URLSearchParams): Workout | null {
  const ex = params.get('ex');
  if (!ex) return null;
  const exercises = ex
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  if (exercises.length === 0) return null;
  const num = (key: string, def: number) => {
    const v = parseInt(params.get(key) || '', 10);
    return Number.isFinite(v) && v > 0 ? v : def;
  };
  return {
    name: params.get('name') || 'Quick HIIT',
    blocks: [
      {
        type: 'circuit',
        name: params.get('circuit') || 'Circuit',
        work: num('work', 40),
        rest: num('rest', 20),
        rounds: num('rounds', 3),
        restBetweenRounds: num('roundRest', 60),
        exercises,
      },
    ],
  };
}

export function validateWorkout(w: unknown): w is Workout {
  if (!w || typeof w !== 'object') return false;
  const o = w as Record<string, unknown>;
  if (typeof o.name !== 'string') return false;
  if (!Array.isArray(o.blocks)) return false;
  for (const b of o.blocks as Array<Record<string, unknown>>) {
    if (!b || typeof b !== 'object') return false;
    if (!['warmup', 'cooldown', 'circuit', 'finisher', 'custom'].includes(b.type as string)) {
      return false;
    }
  }
  return true;
}

export function formatTime(s: number): string {
  const safe = Math.max(0, Math.floor(s));
  const m = Math.floor(safe / 60);
  const sec = safe % 60;
  return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
}

export function formatMinutes(s: number): string {
  const min = Math.round(s / 60);
  return `${min} min`;
}
