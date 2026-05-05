// app/hiit/presets.ts
import type { Workout } from './schema';
import { summarizeWorkout } from './schema';

export const PRESETS: Workout[] = [
  {
    name: 'Leg Day · 40 min HIIT',
    description: 'Power, posterior chain, finisher. Bodyweight or add dumbbells.',
    blocks: [
      {
        type: 'warmup',
        exercises: [
          { name: 'Easy Jog / Jumping Jacks', duration: 60 },
          { name: 'Bodyweight Squats', duration: 45 },
          { name: 'Walking Lunges', duration: 45 },
          { name: 'Leg Swings', duration: 45 },
          { name: 'Glute Bridges', duration: 45 },
          { name: 'Inchworms', duration: 45 },
        ],
      },
      {
        type: 'circuit',
        name: 'Circuit A · Power',
        work: 40,
        rest: 20,
        rounds: 2,
        restBetweenRounds: 60,
        exercises: [
          'Jump Squats',
          'Reverse Lunges',
          'Lateral Lunges',
          'Skater Jumps',
          'Bulgarian Split Squats',
          'Squat to Calf Raise',
          'Broad Jumps',
          'Wall Sit',
        ],
      },
      {
        type: 'circuit',
        name: 'Circuit B · Posterior',
        work: 40,
        rest: 20,
        rounds: 2,
        restBetweenRounds: 60,
        exercises: [
          'Glute Bridge March',
          'Single-Leg RDL',
          'Curtsy Lunges',
          'Frog Pumps',
          'Step-Ups',
          'Reverse Lunge Knee Drive',
          'Squat Pulses',
          'Hollow Hold',
        ],
      },
      {
        type: 'finisher',
        rest: 0,
        exercises: [
          { name: 'Jump Squats', duration: 30 },
          { name: 'Wall Sit', duration: 30 },
          { name: 'Alternating Lunges', duration: 30 },
          { name: 'Squat Hold', duration: 30 },
          { name: 'Skater Jumps', duration: 30 },
          { name: 'Plank', duration: 30 },
        ],
      },
      {
        type: 'cooldown',
        exercises: [
          { name: 'Quad Stretch', duration: 30 },
          { name: 'Hamstring Stretch', duration: 30 },
          { name: 'Hip Flexor Stretch', duration: 30 },
          { name: 'Calf Stretch', duration: 30 },
          { name: 'Glute Stretch', duration: 30 },
        ],
      },
    ],
  },
  {
    name: 'Quick Tabata · 20 min',
    description: 'Classic 20s on / 10s off. Pick any 4 movements.',
    blocks: [
      {
        type: 'warmup',
        exercises: [
          { name: 'Jumping Jacks', duration: 60 },
          { name: 'Bodyweight Squats', duration: 30 },
          { name: 'Arm Circles', duration: 30 },
        ],
      },
      {
        type: 'circuit',
        name: 'Tabata',
        work: 20,
        rest: 10,
        rounds: 4,
        restBetweenRounds: 30,
        exercises: ['Burpees', 'Mountain Climbers', 'Jump Squats', 'Push-ups'],
      },
      {
        type: 'cooldown',
        exercises: [
          { name: 'Stretch', duration: 60 },
          { name: 'Deep Breathing', duration: 60 },
        ],
      },
    ],
  },
  {
    name: 'Softball Power · 25 min',
    description: 'Explosive lower-body for hitting power.',
    blocks: [
      {
        type: 'warmup',
        exercises: [
          { name: 'Jog in Place', duration: 60 },
          { name: 'Hip Openers', duration: 45 },
          { name: 'Dynamic Lunges', duration: 45 },
        ],
      },
      {
        type: 'circuit',
        name: 'Power Circuit',
        work: 30,
        rest: 30,
        rounds: 3,
        restBetweenRounds: 60,
        exercises: [
          'Broad Jumps',
          'Lateral Bounds',
          'Rotational Med Ball Slams',
          'Split Squat Jumps',
          'Cable / Band Wood Chops',
        ],
      },
      {
        type: 'cooldown',
        exercises: [
          { name: 'Hip Stretch', duration: 45 },
          { name: 'Thoracic Rotation', duration: 45 },
        ],
      },
    ],
  },
];

export const PRESET_SUMMARIES = PRESETS.map((p) => summarizeWorkout(p));
