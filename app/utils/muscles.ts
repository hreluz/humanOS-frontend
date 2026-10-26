import { BACK_MUSCLES, FRONT_MUSCLES } from 'body-muscles'
import type { BodyView, MuscleKey } from '~/types/training'

/*
 * The figure's artwork is the anatomical path data from body-muscles (Apache-2.0, © Ivan Vulović).
 * Its regions are per side and sometimes finer than a training target (lats come in three parts),
 * so each region id (without -left/-right) maps to the muscle it belongs to.
 */
const LIBRARY_TO_MUSCLE: Record<string, MuscleKey> = {
  'chest-upper': 'upper_chest', 'chest-lower': 'lower_chest', 'serratus-anterior': 'serratus',
  'shoulder-front': 'front_delts', 'shoulder-side': 'side_delts', 'deltoid-rear': 'rear_delts',
  'biceps': 'biceps', 'triceps-long': 'triceps_long', 'triceps-lateral': 'triceps_lateral',
  'forearm': 'forearm_flexors', 'forearm-flexors': 'forearm_flexors', 'forearm-extensors': 'forearm_extensors',
  'abs-upper': 'upper_abs', 'abs-lower': 'lower_abs', 'obliques': 'obliques',
  'traps-upper': 'upper_traps', 'traps-mid': 'mid_traps', 'traps-lower': 'lower_traps',
  'lats-upper': 'lats', 'lats-mid': 'lats', 'lats-lower': 'lats',
  'lower-back-erectors': 'lower_back', 'lower-back-ql': 'lower_back',
  'gluteus-maximus': 'glute_max', 'gluteus-medius': 'glute_med', 'hip-flexor': 'hip_flexors', 'adductors': 'adductors',
  'quads': 'quads', 'hamstrings-medial': 'hamstrings_inner', 'hamstrings-lateral': 'hamstrings_outer',
  'calves-gastroc-medial': 'gastrocnemius', 'calves-gastroc-lateral': 'gastrocnemius', 'calves-soleus': 'soleus',
  'tibialis-anterior': 'tibialis', 'neck': 'neck', 'nape': 'neck',
}

/** Every muscle the figure can draw: the ones the catalog API may return that the app can show. */
export const MUSCLE_KEYS: MuscleKey[] = [...new Set(Object.values(LIBRARY_TO_MUSCLE))]

export const isMuscleKey = (key: string): key is MuscleKey => (MUSCLE_KEYS as string[]).includes(key)

/** Library regions that aren't trained (head, hands, joints…): drawn as the plain silhouette. */
export const NEUTRAL_REGION_IDS = new Set([
  'head', 'face', 'head-back', 'spine', 'hand', 'hand-back', 'foot', 'foot-back', 'knee', 'knee-back', 'elbow',
])

/** A library region id without its side: `chest-upper-left` → `chest-upper`. */
export const regionBase = (id: string) => id.replace(/-(left|right)$/, '')

export const muscleForRegion = (id: string): MuscleKey | undefined => LIBRARY_TO_MUSCLE[regionBase(id)]

export const BODY_VIEWBOX: Record<BodyView, string> = { front: '0 0 35 93', back: '37 0 35 93' }

export interface BodyRegions {
  muscles: { muscle: MuscleKey, paths: string[] }[]
  neutral: string[]
}

function buildRegions(source: { id: string, path: string }[]): BodyRegions {
  const byMuscle = new Map<MuscleKey, string[]>()
  const neutral: string[] = []
  for (const { id, path } of source) {
    const muscle = muscleForRegion(id)
    if (muscle) byMuscle.set(muscle, [...byMuscle.get(muscle) ?? [], path])
    else neutral.push(path)
  }
  return { muscles: [...byMuscle].map(([muscle, paths]) => ({ muscle, paths })), neutral }
}

export const BODY_REGIONS: Record<BodyView, BodyRegions> = {
  front: buildRegions(FRONT_MUSCLES),
  back: buildRegions(BACK_MUSCLES),
}

export const isOnView = (muscle: MuscleKey, view: BodyView) => BODY_REGIONS[view].muscles.some(r => r.muscle === muscle)
