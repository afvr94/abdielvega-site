// app/hiit/page.tsx
'use client';

import { useEffect, useState } from 'react';
import Builder from './Builder';
import Runner from './Runner';
import type { Workout } from './schema';
import { decodeWorkoutFromUrl, parseQuickParams, validateWorkout } from './schema';
import { PRESETS } from './presets';

const VOICE_PREF_KEY = 'abdielvega:hiit:voice';

export default function HIITPage() {
  const [workout, setWorkout] = useState<Workout | null>(null);
  const [view, setView] = useState<'setup' | 'running'>('setup');
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [hydrated, setHydrated] = useState(false);

  // Hydrate from URL + localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);

    // 1) Try full workout from ?w=
    const w = params.get('w');
    if (w) {
      const decoded = decodeWorkoutFromUrl(w);
      if (decoded && validateWorkout(decoded)) {
        setWorkout(decoded);
        if (params.get('play') === '1') setView('running');
        finishHydrate();
        return;
      }
    }

    // 2) Try quick-circuit params (?ex=...)
    const quick = parseQuickParams(params);
    if (quick) {
      setWorkout(quick);
      if (params.get('play') === '1') setView('running');
      finishHydrate();
      return;
    }

    // 3) Default to first preset
    if (PRESETS[0]) setWorkout(PRESETS[0]);
    finishHydrate();
  }, []);

  function finishHydrate() {
    try {
      const v = localStorage.getItem(VOICE_PREF_KEY);
      if (v !== null) setVoiceEnabled(v === '1');
    } catch {}
    setHydrated(true);
  }

  // Persist voice preference
  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(VOICE_PREF_KEY, voiceEnabled ? '1' : '0');
    } catch {}
  }, [voiceEnabled, hydrated]);

  if (!workout) {
    return <div className="min-h-[100dvh]" style={{ background: '#faf6f0' }} />;
  }

  if (view === 'running') {
    return (
      <Runner
        workout={workout}
        voiceEnabled={voiceEnabled}
        onVoiceToggle={setVoiceEnabled}
        onExit={() => setView('setup')}
      />
    );
  }

  return (
    <Builder
      workout={workout}
      setWorkout={setWorkout}
      onStart={() => setView('running')}
      voiceEnabled={voiceEnabled}
      onVoiceToggle={setVoiceEnabled}
    />
  );
}
