import { BACK_MUSCLES, FRONT_MUSCLES } from 'body-muscles'
import type { BodyView, EquipmentKey, MuscleArea, MuscleKey } from '~/types/training'

export const MUSCLE_LABELS: Record<MuscleKey, string> = {
  upperChest: 'Upper chest', lowerChest: 'Mid & lower chest', serratus: 'Serratus',
  frontDelts: 'Front delts', sideDelts: 'Side delts', rearDelts: 'Rear delts',
  biceps: 'Biceps', tricepsLong: 'Triceps (long head)', tricepsLateral: 'Triceps (lateral head)',
  forearmFlexors: 'Forearm flexors', forearmExtensors: 'Forearm extensors',
  upperAbs: 'Upper abs', lowerAbs: 'Lower abs', obliques: 'Obliques',
  upperTraps: 'Upper traps', midTraps: 'Mid traps', lowerTraps: 'Lower traps', lats: 'Lats', lowerBack: 'Lower back',
  gluteMax: 'Glute max', gluteMed: 'Glute med', hipFlexors: 'Hip flexors', adductors: 'Adductors', quads: 'Quads',
  hamstringsInner: 'Inner hamstrings', hamstringsOuter: 'Outer hamstrings',
  gastrocnemius: 'Calves (gastrocnemius)', soleus: 'Soleus', tibialis: 'Tibialis',
}

export const MUSCLE_AREAS: { area: MuscleArea, label: string, muscles: MuscleKey[] }[] = [
  { area: 'chest', label: 'Chest', muscles: ['upperChest', 'lowerChest', 'serratus'] },
  { area: 'shoulders', label: 'Shoulders', muscles: ['frontDelts', 'sideDelts', 'rearDelts'] },
  { area: 'arms', label: 'Arms', muscles: ['biceps', 'tricepsLong', 'tricepsLateral', 'forearmFlexors', 'forearmExtensors'] },
  { area: 'core', label: 'Core', muscles: ['upperAbs', 'lowerAbs', 'obliques'] },
  { area: 'back', label: 'Back', muscles: ['upperTraps', 'midTraps', 'lowerTraps', 'lats', 'lowerBack'] },
  { area: 'legs', label: 'Legs', muscles: ['gluteMax', 'gluteMed', 'hipFlexors', 'adductors', 'quads', 'hamstringsInner', 'hamstringsOuter', 'gastrocnemius', 'soleus', 'tibialis'] },
]

export const EQUIPMENT_LABELS: Record<EquipmentKey, string> = { gym: 'Gym', dumbbell: 'Dumbbell', bodyweight: 'Bodyweight' }
export const EQUIPMENT_KEYS = Object.keys(EQUIPMENT_LABELS) as EquipmentKey[]

/*
 * The figure's artwork is the anatomical path data from body-muscles (Apache-2.0, © Ivan Vulović).
 * Its regions are per side and sometimes finer than a training target (lats come in three parts),
 * so each region id (without -left/-right) maps to the muscle it belongs to.
 */
const LIBRARY_TO_MUSCLE: Record<string, MuscleKey> = {
  'chest-upper': 'upperChest', 'chest-lower': 'lowerChest', 'serratus-anterior': 'serratus',
  'shoulder-front': 'frontDelts', 'shoulder-side': 'sideDelts', 'deltoid-rear': 'rearDelts',
  'biceps': 'biceps', 'triceps-long': 'tricepsLong', 'triceps-lateral': 'tricepsLateral',
  'forearm': 'forearmFlexors', 'forearm-flexors': 'forearmFlexors', 'forearm-extensors': 'forearmExtensors',
  'abs-upper': 'upperAbs', 'abs-lower': 'lowerAbs', 'obliques': 'obliques',
  'traps-upper': 'upperTraps', 'traps-mid': 'midTraps', 'traps-lower': 'lowerTraps',
  'lats-upper': 'lats', 'lats-mid': 'lats', 'lats-lower': 'lats',
  'lower-back-erectors': 'lowerBack', 'lower-back-ql': 'lowerBack',
  'gluteus-maximus': 'gluteMax', 'gluteus-medius': 'gluteMed', 'hip-flexor': 'hipFlexors', 'adductors': 'adductors',
  'quads': 'quads', 'hamstrings-medial': 'hamstringsInner', 'hamstrings-lateral': 'hamstringsOuter',
  'calves-gastroc-medial': 'gastrocnemius', 'calves-gastroc-lateral': 'gastrocnemius', 'calves-soleus': 'soleus',
  'tibialis-anterior': 'tibialis',
}

/** Library regions that aren't trained (head, hands, joints…): drawn as the plain silhouette. */
export const NEUTRAL_REGION_IDS = new Set([
  'head', 'face', 'neck', 'head-back', 'nape', 'spine', 'hand', 'hand-back', 'foot', 'foot-back', 'knee', 'knee-back', 'elbow',
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

/** The view a muscle is drawn on, preferring the front. */
export function muscleView(muscle: MuscleKey): BodyView {
  return isOnView(muscle, 'front') ? 'front' : 'back'
}
