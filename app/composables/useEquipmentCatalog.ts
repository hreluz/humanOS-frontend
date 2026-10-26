import type { EquipmentGroupKey } from '~/types/training'
import * as trainingService from '~/services/trainingService'

/** The equipment catalog from the API: groups in display order, with their labels and equipment. Loaded once per session. */
export function useEquipmentCatalog() {
  const { state, pending, error, retry, retrying } = useServiceState('equipment-groups', trainingService.getEquipmentGroups)

  const groups = computed(() => state.value ?? [])
  const labels = computed(() => Object.fromEntries(groups.value.map(g => [g.key, g.label])) as Partial<Record<EquipmentGroupKey, string>>)

  const failed = computed(() => state.value === null && !!error.value && !retrying.value)

  /** The API label, or `''` before the catalog loads or for a key the API doesn't know. */
  const label = (key: EquipmentGroupKey) => labels.value[key] ?? ''

  return { groups, label, pending, failed, retry }
}
