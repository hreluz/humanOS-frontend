import type { BodyView, EquipmentKey, MuscleKey } from '~/types/training'

export const MUSCLE_LABELS: Record<MuscleKey, string> = {
  chest: 'Chest', shoulders: 'Shoulders', biceps: 'Biceps', triceps: 'Triceps', forearms: 'Forearms',
  abs: 'Abs', obliques: 'Obliques', traps: 'Traps', lats: 'Lats', lowerBack: 'Lower back',
  glutes: 'Glutes', quads: 'Quads', hamstrings: 'Hamstrings', calves: 'Calves',
}

export const EQUIPMENT_LABELS: Record<EquipmentKey, string> = { gym: 'Gym', dumbbell: 'Dumbbell', bodyweight: 'Bodyweight' }
export const EQUIPMENT_KEYS = Object.keys(EQUIPMENT_LABELS) as EquipmentKey[]

/*
 * Body figure drawn in a 200×430 box. Every shape is the figure's left half (x ≤ 100);
 * the figure draws it again mirrored across x = 100 for the other side.
 */
export const BODY_VIEWBOX = '0 0 200 430'

export const BODY_SILHOUETTE = [
  'M100,12 C90,12 84,20 84,32 C84,44 91,52 100,52 Z',
  'M100,46 L92,46 L92,60 L100,60 Z',
  'M100,56 L88,58 Q72,62 60,68 Q48,74 50,104 L44,150 Q40,182 42,212 Q42,232 50,234 Q58,232 58,214 Q62,186 66,154 Q70,128 70,106 L72,110 Q70,150 74,186 Q66,210 68,240 Q62,280 70,320 Q66,360 74,400 Q70,414 80,416 L96,414 Q98,360 94,324 Q100,280 100,230 Z',
]

export const BODY_REGIONS: Record<BodyView, { muscle: MuscleKey, d: string }[]> = {
  front: [
    { muscle: 'chest', d: 'M100,72 L74,74 Q66,86 70,104 Q86,114 100,108 Z' },
    { muscle: 'shoulders', d: 'M72,70 Q56,68 52,86 Q52,100 58,106 L68,102 Q64,84 72,74 Z' },
    { muscle: 'biceps', d: 'M56,110 Q50,128 54,150 L66,150 Q70,128 68,106 Z' },
    { muscle: 'forearms', d: 'M52,154 Q44,180 46,210 L58,210 Q64,182 66,154 Z' },
    { muscle: 'abs', d: 'M100,114 L88,114 L86,186 Q93,192 100,192 Z' },
    { muscle: 'obliques', d: 'M84,114 L74,110 Q70,146 76,184 L84,188 Z' },
    { muscle: 'quads', d: 'M72,216 Q64,260 72,304 L94,304 Q100,258 98,216 Q86,206 72,216 Z' },
    { muscle: 'calves', d: 'M74,328 Q68,358 76,394 L84,394 Q82,358 86,328 Z' },
  ],
  back: [
    { muscle: 'traps', d: 'M100,54 L92,58 Q84,66 72,72 L88,82 L100,122 Z' },
    { muscle: 'shoulders', d: 'M72,70 Q56,68 52,86 Q52,100 58,106 L68,102 Q66,84 74,76 Z' },
    { muscle: 'triceps', d: 'M56,110 Q50,128 54,150 L66,150 Q70,128 68,106 Z' },
    { muscle: 'forearms', d: 'M52,154 Q44,180 46,210 L58,210 Q64,182 66,154 Z' },
    { muscle: 'lats', d: 'M86,84 L100,126 L100,150 Q92,162 82,172 Q72,150 72,112 Q72,92 76,80 Z' },
    { muscle: 'lowerBack', d: 'M100,154 L100,190 L76,188 Q72,170 74,156 Q78,168 82,176 Q92,166 100,154 Z' },
    { muscle: 'glutes', d: 'M100,194 L76,192 Q66,208 70,236 Q86,246 100,238 Z' },
    { muscle: 'hamstrings', d: 'M72,242 Q64,272 72,304 L94,304 Q100,272 98,244 Q86,250 72,242 Z' },
    { muscle: 'calves', d: 'M74,326 Q66,354 76,382 L92,382 Q98,354 94,326 Q84,320 74,326 Z' },
  ],
}

/** The view a muscle is drawn on; shoulders, forearms and calves show on both, so they prefer front. */
export function muscleView(muscle: MuscleKey): BodyView {
  return BODY_REGIONS.front.some(r => r.muscle === muscle) ? 'front' : 'back'
}
