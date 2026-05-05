// app/hiit/Builder.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import { Play, Trash2, Volume2, VolumeX } from 'lucide-react';
import type { Workout } from './schema';
import { encodeWorkoutToUrl, formatMinutes, summarizeWorkout, validateWorkout } from './schema';
import { PRESETS, PRESET_SUMMARIES } from './presets';

const STORAGE_KEY = 'abdielvega:hiit:saved';

type SavedWorkout = {
  id: string;
  workout: Workout;
  savedAt: string;
};

type Props = {
  workout: Workout;
  setWorkout: (w: Workout) => void;
  onStart: () => void;
  voiceEnabled: boolean;
  onVoiceToggle: (v: boolean) => void;
};

export default function Builder({
  workout,
  setWorkout,
  onStart,
  voiceEnabled,
  onVoiceToggle,
}: Props) {
  const [saved, setSaved] = useState<SavedWorkout[]>([]);
  const [editorText, setEditorText] = useState(() => JSON.stringify(workout, null, 2));
  const [editorError, setEditorError] = useState<string | null>(null);
  const [editorDirty, setEditorDirty] = useState(false);
  const [showSchema, setShowSchema] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);

  const summary = useMemo(() => summarizeWorkout(workout), [workout]);

  // Load saved workouts from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setSaved(parsed);
      }
    } catch {}
  }, []);

  // Re-sync editor text when workout changes externally (preset selection)
  useEffect(() => {
    if (!editorDirty) {
      setEditorText(JSON.stringify(workout, null, 2));
      setEditorError(null);
    }
  }, [workout, editorDirty]);

  function persistSaved(next: SavedWorkout[]) {
    setSaved(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {}
  }

  function handleEditorChange(text: string) {
    setEditorText(text);
    setEditorDirty(true);
    try {
      const parsed = JSON.parse(text);
      if (validateWorkout(parsed)) {
        setEditorError(null);
      } else {
        setEditorError('Schema invalid — check block types and required fields');
      }
    } catch (e) {
      setEditorError('Invalid JSON');
    }
  }

  function handleApplyEditor() {
    try {
      const parsed = JSON.parse(editorText);
      if (validateWorkout(parsed)) {
        setWorkout(parsed);
        setEditorDirty(false);
        setEditorError(null);
      } else {
        setEditorError('Schema invalid — check block types and required fields');
      }
    } catch {
      setEditorError('Invalid JSON');
    }
  }

  function handleFormatJson() {
    try {
      const parsed = JSON.parse(editorText);
      setEditorText(JSON.stringify(parsed, null, 2));
      setEditorError(null);
    } catch {
      setEditorError('Invalid JSON');
    }
  }

  function handleSaveCurrent() {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const next: SavedWorkout = {
      id,
      workout,
      savedAt: new Date().toISOString(),
    };
    persistSaved([next, ...saved]);
  }

  function handleDeleteSaved(id: string) {
    persistSaved(saved.filter((s) => s.id !== id));
  }

  async function handleShare() {
    try {
      const encoded = encodeWorkoutToUrl(workout);
      const url = `${window.location.origin}${window.location.pathname}?w=${encoded}`;
      await navigator.clipboard.writeText(url);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2000);
    } catch {}
  }

  function selectPreset(p: Workout) {
    setWorkout(p);
    setEditorDirty(false);
  }

  function selectSaved(s: SavedWorkout) {
    setWorkout(s.workout);
    setEditorDirty(false);
  }

  return (
    <div
      className="min-h-[100dvh] w-full"
      style={{
        background: '#faf6f0',
        color: '#1a1a1a',
        fontFamily: 'var(--font-instrument, "Instrument Sans", system-ui, sans-serif)',
      }}
    >
      <div className="mx-auto max-w-2xl px-5 py-10 sm:px-8 sm:py-14">
        {/* Header */}
        <header className="mb-10">
          <div className="mb-6 flex items-center justify-between">
            <div className="text-[0.7rem] font-bold tracking-[0.35em] text-stone-500">
              ABDIELVEGA · TRAINING
            </div>
            <button
              onClick={() => onVoiceToggle(!voiceEnabled)}
              className="flex items-center gap-1.5 text-[0.65rem] font-bold tracking-[0.3em] transition-colors"
              style={{ color: voiceEnabled ? '#65a30d' : '#a8a29e' }}
            >
              {voiceEnabled ? (
                <Volume2 size={14} strokeWidth={2.2} />
              ) : (
                <VolumeX size={14} strokeWidth={2.2} />
              )}
              VOICE {voiceEnabled ? 'ON' : 'OFF'}
            </button>
          </div>
          <h1
            className="mb-3 leading-[0.95]"
            style={{
              fontFamily: 'var(--font-fraunces, "Fraunces", serif)',
              fontSize: 'clamp(3rem, 9vw, 5.5rem)',
              fontWeight: 400,
              letterSpacing: '-0.02em',
            }}
          >
            HIIT{' '}
            <span className="italic" style={{ fontWeight: 300 }}>
              Timer.
            </span>
          </h1>
          <p className="max-w-md text-base text-stone-600 sm:text-lg">
            Build, save, and run interval workouts. Voice cues, screen wake, no nonsense.
          </p>
        </header>

        {/* Current workout card */}
        <section className="mb-10">
          <div className="mb-3 text-[0.65rem] font-bold tracking-[0.35em] text-stone-500">
            CURRENT WORKOUT
          </div>
          <div
            className="mb-4 rounded-2xl p-6 sm:p-8"
            style={{ background: '#1a1a1a', color: '#fafafa' }}
          >
            <div
              className="mb-2 leading-[1.05]"
              style={{
                fontFamily: 'var(--font-fraunces, "Fraunces", serif)',
                fontSize: 'clamp(1.75rem, 5vw, 2.5rem)',
                fontWeight: 400,
              }}
            >
              {workout.name}
            </div>
            {workout.description && (
              <div className="mb-5 text-sm text-stone-400">{workout.description}</div>
            )}
            <div className="mb-6 flex items-center gap-4 text-xs tracking-wider text-stone-400">
              <Stat label="DURATION" value={formatMinutes(summary.totalSec)} />
              <Divider />
              <Stat label="EXERCISES" value={`${summary.exerciseCount}`} />
              <Divider />
              <Stat label="BLOCKS" value={`${summary.blockCount}`} />
            </div>
            <div className="flex gap-3">
              <button
                onClick={onStart}
                className="flex h-14 flex-1 items-center justify-center gap-2 rounded-full text-sm font-bold tracking-[0.3em] transition-transform active:scale-[0.97]"
                style={{
                  background: '#a3e635',
                  color: '#0a0a0a',
                  boxShadow: '0 0 24px rgba(163,230,53,0.25)',
                }}
              >
                <Play size={14} fill="currentColor" />
                START
              </button>
              <button
                onClick={handleShare}
                className="h-14 rounded-full border border-stone-700 px-5 text-xs font-bold tracking-[0.25em] text-stone-300 transition-transform active:scale-[0.97]"
              >
                {shareCopied ? 'COPIED ✓' : 'SHARE'}
              </button>
              <button
                onClick={handleSaveCurrent}
                className="h-14 rounded-full border border-stone-700 px-5 text-xs font-bold tracking-[0.25em] text-stone-300 transition-transform active:scale-[0.97]"
              >
                SAVE
              </button>
            </div>
          </div>
        </section>

        {/* Presets */}
        <section className="mb-10">
          <div className="mb-3 flex items-baseline justify-between">
            <div className="text-[0.65rem] font-bold tracking-[0.35em] text-stone-500">PRESETS</div>
            <div className="text-xs text-stone-500">{PRESETS.length} built-in</div>
          </div>
          <div className="grid gap-3">
            {PRESETS.map((p, i) => {
              const s = PRESET_SUMMARIES[i]!;
              const active = p.name === workout.name;
              return (
                <button
                  key={i}
                  onClick={() => selectPreset(p)}
                  className="rounded-xl border p-5 text-left transition-all active:scale-[0.99]"
                  style={{
                    borderColor: active ? '#1a1a1a' : '#e7e2da',
                    background: active ? '#1a1a1a' : '#fffdf8',
                    color: active ? '#fafafa' : '#1a1a1a',
                  }}
                >
                  <div className="flex items-baseline justify-between gap-3">
                    <div
                      style={{
                        fontFamily: 'var(--font-fraunces, "Fraunces", serif)',
                        fontSize: '1.25rem',
                        fontWeight: 400,
                      }}
                    >
                      {p.name}
                    </div>
                    <div
                      className="shrink-0 text-[0.65rem] font-bold tracking-[0.25em]"
                      style={{ color: active ? '#bef264' : '#a8a29e' }}
                    >
                      {formatMinutes(s.totalSec).toUpperCase()}
                    </div>
                  </div>
                  {p.description && (
                    <div className="mt-1 text-sm" style={{ color: active ? '#a8a29e' : '#78716c' }}>
                      {p.description}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </section>

        {/* Saved */}
        {saved.length > 0 && (
          <section className="mb-10">
            <div className="mb-3 flex items-baseline justify-between">
              <div className="text-[0.65rem] font-bold tracking-[0.35em] text-stone-500">SAVED</div>
              <div className="text-xs text-stone-500">{saved.length} saved</div>
            </div>
            <div className="grid gap-3">
              {saved.map((s) => {
                const sum = summarizeWorkout(s.workout);
                return (
                  <div
                    key={s.id}
                    className="flex items-center gap-3 rounded-xl border p-5"
                    style={{ borderColor: '#e7e2da', background: '#fffdf8' }}
                  >
                    <button onClick={() => selectSaved(s)} className="min-w-0 flex-1 text-left">
                      <div
                        className="truncate"
                        style={{
                          fontFamily: 'var(--font-fraunces, "Fraunces", serif)',
                          fontSize: '1.1rem',
                        }}
                      >
                        {s.workout.name}
                      </div>
                      <div className="mt-0.5 text-xs text-stone-500">
                        {formatMinutes(sum.totalSec)} · {sum.exerciseCount} exercises ·{' '}
                        {new Date(s.savedAt).toLocaleDateString()}
                      </div>
                    </button>
                    <button
                      onClick={() => handleDeleteSaved(s.id)}
                      className="p-2 text-stone-400 transition-colors active:text-red-600"
                      aria-label="Delete"
                    >
                      <Trash2 size={16} strokeWidth={2} />
                    </button>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* JSON Editor */}
        <section className="mb-10">
          <div className="mb-3 flex items-baseline justify-between">
            <div className="text-[0.65rem] font-bold tracking-[0.35em] text-stone-500">EDITOR</div>
            <button
              onClick={() => setShowSchema((v) => !v)}
              className="text-xs text-stone-500 underline underline-offset-2 active:text-stone-700"
            >
              {showSchema ? 'hide schema' : 'show schema'}
            </button>
          </div>

          {showSchema && <SchemaReference />}

          <textarea
            value={editorText}
            onChange={(e) => handleEditorChange(e.target.value)}
            spellCheck={false}
            className="w-full rounded-xl border p-4 text-xs leading-relaxed outline-none focus:ring-2 focus:ring-lime-400/30"
            style={{
              fontFamily: 'var(--font-jetbrains, "JetBrains Mono", monospace)',
              minHeight: 320,
              borderColor: editorError ? '#dc2626' : '#e7e2da',
              background: '#fffdf8',
              color: '#1a1a1a',
            }}
          />
          <div className="mt-3 flex items-center justify-between gap-3">
            <div className="text-xs" style={{ color: editorError ? '#dc2626' : '#65a30d' }}>
              {editorError ? `× ${editorError}` : editorDirty ? '● unsaved changes' : '✓ valid'}
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleFormatJson}
                className="h-10 rounded-full border border-stone-300 px-4 text-xs font-bold tracking-[0.2em] text-stone-600 transition active:bg-stone-100"
              >
                FORMAT
              </button>
              <button
                onClick={handleApplyEditor}
                disabled={!!editorError}
                className="h-10 rounded-full px-5 text-xs font-bold tracking-[0.2em] transition active:scale-95 disabled:opacity-40"
                style={{ background: '#1a1a1a', color: '#fafafa' }}
              >
                APPLY
              </button>
            </div>
          </div>
        </section>

        {/* How to use */}
        <section className="mb-8">
          <div className="mb-3 text-[0.65rem] font-bold tracking-[0.35em] text-stone-500">
            HOW TO USE
          </div>
          <div
            className="space-y-3 rounded-xl p-5 text-sm text-stone-700"
            style={{ background: '#fffdf8', border: '1px solid #e7e2da' }}
          >
            <p>
              <span className="font-bold">Ask Claude</span> for a workout, paste the JSON into the
              editor, hit <em>Apply</em>, then <em>Start</em>.
            </p>
            <p>
              <span className="font-bold">Quick links</span>:{' '}
              <code className="rounded bg-stone-100 px-1.5 py-0.5 text-xs">
                /hiit?ex=Squats,Lunges&work=40&rest=20&rounds=3
              </code>
            </p>
            <p>
              <span className="font-bold">Share</span> any workout — the URL embeds the full schema.
            </p>
            <p className="border-t border-stone-200 pt-2 text-xs text-stone-500">
              Voice and screen-wake use browser APIs. iOS may need volume up to unlock audio. Wake
              lock requires HTTPS.
            </p>
          </div>
        </section>

        <footer className="pt-4 text-center text-xs text-stone-400">abdielvega.com</footer>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="mb-0.5 text-[0.55rem] font-bold tracking-[0.3em] text-stone-500">{label}</div>
      <div className="text-base" style={{ fontFamily: 'var(--font-fraunces, "Fraunces", serif)' }}>
        {value}
      </div>
    </div>
  );
}

function Divider() {
  return <div className="h-8 w-px bg-stone-700" />;
}

function SchemaReference() {
  const example = `{
  "name": "Leg Day",
  "description": "Optional",
  "blocks": [
    { "type": "warmup",
      "exercises": [
        { "name": "Jog", "duration": 60 }
      ]
    },
    { "type": "circuit",
      "name": "Circuit A",
      "work": 40,
      "rest": 20,
      "rounds": 2,
      "restBetweenRounds": 60,
      "exercises": ["Jump Squats", "Lunges"]
    },
    { "type": "finisher",
      "rest": 0,
      "exercises": [
        { "name": "Plank", "duration": 30 }
      ]
    },
    { "type": "cooldown",
      "exercises": [
        { "name": "Quad Stretch", "duration": 30 }
      ]
    }
  ]
}`;
  return (
    <div
      className="mb-4 rounded-xl p-4 text-xs"
      style={{ background: '#1a1a1a', color: '#fafafa' }}
    >
      <div className="mb-2 text-[0.6rem] font-bold tracking-[0.3em] text-stone-400">SCHEMA</div>
      <pre
        className="overflow-x-auto whitespace-pre"
        style={{ fontFamily: 'var(--font-jetbrains, "JetBrains Mono", monospace)' }}
      >
        {example}
      </pre>
      <div className="mt-3 leading-relaxed text-stone-400">
        Block types: <code className="text-lime-300">warmup</code>,{' '}
        <code className="text-lime-300">cooldown</code>,{' '}
        <code className="text-lime-300">circuit</code>,{' '}
        <code className="text-lime-300">finisher</code>,{' '}
        <code className="text-lime-300">custom</code>. Durations in seconds.
      </div>
    </div>
  );
}
