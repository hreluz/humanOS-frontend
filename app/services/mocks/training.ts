import type { Workout } from '~/types/training'

export const TODAY_WORKOUT: Workout = {
  title: 'Push Day',
  durationMin: 48,
  volume: '6,240 kg',
  exercises: [
    { name: 'Bench Press', equip: 'Barbell', sets: ['80kg × 8', '80kg × 8', '80kg × 7'] },
    { name: 'Incline DB Press', equip: 'Dumbbell', sets: ['30kg × 10', '30kg × 9'] },
  ],
  cardio: [
    { name: 'Evening walk', detail: '32 min · 2.4 km · 180 kcal', icon: 'M4 17l4-5 3 3 5-7 4 5' },
  ],
}
