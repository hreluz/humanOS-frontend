# SPEC 08 — Equipment groups API on the body map

> **Status:** Approved
> **Depends on:** SPEC 07
> **Date:** 2026-10-26
> **Objective:** Load the body map's equipment filter tabs (keys, labels, order) from `GET /v1/training/equipment-groups` instead of `EQUIPMENT_LABELS` / `EQUIPMENT_KEYS` in `app/utils/muscles.ts`, the same way SPEC 07 did for muscles.

## Why this spec exists

Backend SPEC 10 serves two catalogs. SPEC 07 switched the body map to the first one (`/muscle-areas`). The equipment tabs still come from a hard-coded copy:

| | Backend | Frontend today |
| --- | --- | --- |
| Groups | 6: `gym`, `dumbbell`, `bodyweight`, `kettlebell`, `bands`, `accessories` | 3: `gym`, `dumbbell`, `bodyweight` |
| Equipment within a group | 12 pieces (`barbell`, `machine`, `cable`, `ez_bar`, …) | None |
| Labels | `Gym`, `Dumbbell`, `Bodyweight`, `Kettlebell`, `Bands`, `Accessories` | The first three, same text |
| Key format | snake_case | Same keys for the first three |

SPEC 07 left this endpoint out because the mocked exercises only know the first three groups, so the new tabs would match nothing. This spec takes that trade-off on purpose:

- It removes the last hard-coded training catalog on the frontend, so all labels and order come from the API.
- The exercise endpoints (backend SPECs 11–13) return `equipment_group` as a key, and `?equipment_group[]=` filters on it. Once the tabs come from the API, the exercise integration only has to swap the service.
- Until then, the three new tabs show `No exercises for this filter.` when picked on their own. With every tab on, which is the default, the results are the same as today.

The response (SPEC 04 envelope, bearer token required, not paginated):

```json
{
  "data": [
    {
      "key": "gym",
      "label": "Gym",
      "equipment": [
        { "key": "barbell", "label": "Barbell" },
        { "key": "machine", "label": "Machine" }
      ]
    }
  ]
}
```

## Scope

**In:**

- `trainingService.getEquipmentGroups()`, which calls `GET /v1/training/equipment-groups` and maps the response to app types.
- A new composable, `app/composables/useEquipmentCatalog.ts`, that loads the groups once per session and exposes the groups, labels, loading, error and retry.
- `retry()` moves into `useServiceState`, now that two catalogs need it. `useMuscleCatalog` uses it too.
- `EquipmentKey` is replaced by `EquipmentGroupKey` (`string`). `ExerciseDef.equipment` is renamed `equipmentGroup`.
- `EQUIPMENT_LABELS` and `EQUIPMENT_KEYS` are removed. The tabs, exercise cards, the photos modal and workout entries get group labels from the API.
- The equipment filter starts with every API group on, including groups that load after the page renders.
- Loading and error states for the equipment tabs: `Loading equipment…`, then `Couldn't load equipment.` with a `Retry` button.
- Vitest coverage for the service mapping, `useEquipmentCatalog`, `useServiceState.retry` and the updated filter.
- The body-map Playwright feature spec updated (6 tabs, a new tab with no results) with screenshots.

**Out of scope (for future specs):**

- The exercise endpoints (backend SPECs 11–13), and replacing `app/services/mocks/exercises.ts`.
- Tagging mocked exercises with a piece of equipment (`barbell`, `cable`, …) or adding kettlebell, bands or accessories exercises.
- Picking single pieces of equipment within a group (`?equipment[]=`), or showing the pieces in the UI. It gets its own spec once backend SPEC 12 serves the exercise list. See **Decisions**.
- A bundled fallback catalog when the API fails.
- HTTP caching or a persistent cache across reloads.
- Translating labels.

## Data model

### Generated types (`app/types/api.generated.ts`)

`EquipmentGroupResource` and `EquipmentResource` are already there, from SPEC 07's `pnpm gen:api`. If the backend has changed since, run `pnpm gen:api` again. Nothing is edited by hand.

### Types (`app/types/training.ts`)

```ts
/** A group key from the equipment catalog API (`gym`, `kettlebell`, …). Exercises are tagged with one. */
export type EquipmentGroupKey = string

/** A piece of equipment from the catalog API. Not shown yet; kept so exercises can reference it later. */
export interface EquipmentDef {
  key: string
  label: string
}

/** An equipment group from the catalog API: one filter tab on the body map, with its equipment in display order. */
export interface EquipmentGroupDef {
  key: EquipmentGroupKey
  label: string
  equipment: EquipmentDef[]
}
```

- `EquipmentKey` is removed.
- `ExerciseDef.equipment: EquipmentKey` becomes `ExerciseDef.equipmentGroup: EquipmentGroupKey`. The name leaves `equipment` free for the piece of equipment that backend SPEC 11 returns next to `equipment_group`.
- `EquipmentGroupKey` is a `string`, not a union. Unlike muscles, nothing in the app is drawn per group, so a new group from the API should show without a frontend change.

### Mocks (`app/services/mocks/exercises.ts`)

- `MockExercise.equipment` becomes `equipmentGroup`, typed with a local `MockEquipmentGroup = 'gym' | 'dumbbell' | 'bodyweight'`, so a typo in the mocks still fails typecheck.
- The `ex()` helper's second parameter is renamed. The 138 calls don't change.

### `trainingService` (`app/services/trainingService.ts`)

```ts
type EquipmentGroupResource = components['schemas']['EquipmentGroupResource']

/** The equipment catalog in display order. */
export function getEquipmentGroups(): Promise<EquipmentGroupDef[]>

/** Appends a library exercise to today's workout; `equip` is the label shown on the workout card. */
export async function addExerciseToWorkout(def: ExerciseDef, equip: string): Promise<Workout>
```

- `getEquipmentGroups` calls `api<{ data: EquipmentGroupResource[] }>('/v1/training/equipment-groups')`.
- It keeps the API's order for groups and equipment, and maps a missing `equipment` to `[]`.
- It drops nothing. Groups with no equipment are kept.
- Errors (401, 5xx, network) are passed on to the caller.
- `getExercises(muscle, groups: EquipmentGroupKey[])` filters on `equipmentGroup`. Its ranking doesn't change.
- `addExerciseToWorkout` takes the label from the caller instead of looking it up in `EQUIPMENT_LABELS`.

### `useServiceState` (`app/composables/useServiceState.ts`)

- It returns `retry(): Promise<void>` and `retrying: Ref<boolean>` as well.
- `retry()` calls the loader again. On success it fills `state`. On failure it leaves `state` as `null`, and `error` keeps the last error. It never throws.
- `pending` becomes true while a retry runs.
- Existing callers don't change.

### `useMuscleCatalog` (`app/composables/useMuscleCatalog.ts`)

- It uses `retry`, `retrying` and `pending` from `useServiceState` and drops its own copies. Its public API and behaviour don't change, and `tests/nuxt/useMuscleCatalog.test.ts` passes as it is.

### `useEquipmentCatalog` (`app/composables/useEquipmentCatalog.ts`, new)

- It loads the groups with `useServiceState('equipment-groups', trainingService.getEquipmentGroups)`.
- It returns:
  - `groups: ComputedRef<EquipmentGroupDef[]>`, which is `[]` until loaded;
  - `label(key: EquipmentGroupKey): string`, which returns the API label, or `''` before the catalog loads or for a key the API doesn't know;
  - `pending: ComputedRef<boolean>` and `failed: ComputedRef<boolean>`, with the same rules as `useMuscleCatalog`;
  - `retry(): Promise<void>`.

### `useBodyMap` (`app/composables/useBodyMap.ts`)

- It stores the groups the user has turned **off** (`off: Ref<EquipmentGroupKey[]>`, initially `[]`), not the groups that are on.
- `equipment` becomes `ComputedRef<EquipmentGroupKey[]>`: the API groups, in API order, minus `off`. Every group is on by default, and that stays true when the catalog arrives after the page has rendered.
- `toggleEquipment(key)` adds `key` to `off` or removes it.
- It also returns `equipmentReady: ComputedRef<boolean>`, true once the groups are loaded.
- The exercise watcher doesn't call `getExercises` until `equipmentReady` is true. Before that, `exercises` stays `[]`.
- `select` and the muscle logic don't change.

### `useTraining` (`app/composables/useTraining.ts`)

- `addExercise(def, equip: string)` passes the label on to `addExerciseToWorkout`.

### Display rules

**`/body` (`app/pages/body.vue`):**

- **Tabs:** one chip per API group, in API order, with the API `label`, in the `Equipment` group. All six are on by default.
- **Loading** (equipment `pending`): the tab row shows `Loading equipment…` in `inkFaintCls`. If a muscle is picked, the results show `Loading exercises…`.
- **Error** (equipment `failed`): the tab row shows `Couldn't load equipment.` and a `Retry` button that reads `Retrying…` while disabled, the same as the muscle error. If a muscle is picked, the results area shows nothing else. `Pick at least one type of equipment.` and `No exercises for this filter.` are not shown, because neither is true.
- **Every tab off:** `Pick at least one type of equipment.`, as today.
- **Only a new tab on** (`Kettlebell`, `Bands` or `Accessories`): `No exercises for this filter.`
- **Exercise cards:** the equipment label next to the name uses `label(ex.equipmentGroup)`.
- **Add to workout:** `add(def)` passes `label(def.equipmentGroup)` to `addExercise`, so the workout card reads `Gym`, `Dumbbell` or `Bodyweight` as today.
- The muscle chips, the figure and their loading and error states don't change. The two catalogs load and fail on their own.

**Photos modal (`app/components/modal/ExercisePhotos.vue`):** the subtitle reads `{label(exercise.equipmentGroup)} · {cue}`, using `useEquipmentCatalog`.

## Implementation plan

1. **Retry in `useServiceState`.** Add `retry` and `retrying`, and switch `useMuscleCatalog` to them. Add `tests/nuxt/useServiceState.test.ts`. It covers:
   - a failed load followed by a successful `retry()` fills `state`, and `pending` is true while it runs;
   - a failed `retry()` leaves `state` as `null`, keeps `error` and doesn't throw.

   `useMuscleCatalog.test.ts` passes unchanged. No visible change.
2. **Rename.** Replace `EquipmentKey` with `EquipmentGroupKey`, rename `ExerciseDef.equipment` to `equipmentGroup` in the types, mocks, service, page, modal and tests. `EQUIPMENT_LABELS` and `EQUIPMENT_KEYS` stay for now. The app works exactly as before.
3. **Service.** Add `EquipmentDef`, `EquipmentGroupDef` and `trainingService.getEquipmentGroups()`, and change `addExerciseToWorkout` to take the label. Extend `tests/nuxt/trainingService.test.ts`. It covers:
   - it calls `/v1/training/equipment-groups`;
   - it keeps group and equipment order;
   - a group without `equipment` maps to `equipment: []` and is kept;
   - a rejected `api` call rejects `getEquipmentGroups`;
   - `addExerciseToWorkout(def, 'Gym')` appends an entry with `equip: 'Gym'`.
4. **`useEquipmentCatalog`.** Create the composable. Add `tests/nuxt/useEquipmentCatalog.test.ts` with `vi.mock('~/services/trainingService')`. It covers:
   - `pending` before the data arrives, then 6 `groups` and `label('kettlebell') === 'Kettlebell'`;
   - `label('unknown') === ''`;
   - a rejected load sets `failed`, and `retry()` fills `groups` and clears it;
   - a second call reuses the state and doesn't call the service again.
5. **Filter and page on the API.** Switch `useBodyMap` to `off` plus `equipment` from the catalog, and add `equipmentReady`. Switch `body.vue`, `ExercisePhotos.vue` and `useTraining` to the catalog labels, and add the loading and error states. Delete `EQUIPMENT_LABELS` and `EQUIPMENT_KEYS`. Update `tests/nuxt/useBodyMap.test.ts` (with the six groups mocked):
   - it starts with all six groups on, in API order;
   - groups that arrive after the composable was created are all on;
   - toggling `gym` off and on keeps API order;
   - with only `kettlebell` on, a picked muscle gives no exercises;
   - before the groups load, picking a muscle doesn't call `getExercises`.
6. **E2E feature spec.** Update `tests/e2e/features/body-map.spec.ts` (light and dark, `shot()`, against the real backend). It covers:
   - the existing `equipment filter` case unchanged;
   - the `Equipment` group has 6 buttons in order `Gym`, `Dumbbell`, `Bodyweight`, `Kettlebell`, `Bands`, `Accessories`, all pressed (screenshot `body-equipment-tabs`);
   - with `lower_chest` picked, turning off every tab except `Kettlebell` shows `No exercises for this filter.` (screenshot `body-kettlebell-only`);
   - adding an exercise from a `Gym` card shows `Gym` on the Today workout card.
7. **Checks.** `pnpm lint`, `pnpm typecheck`, `pnpm test` and `pnpm test:e2e` pass. `screens.spec.ts` (`/body`) still passes.

## Acceptance criteria

- [ ] `/body` requests `GET /v1/training/equipment-groups` once per session, with the bearer token.
- [ ] The equipment tabs show the API's 6 groups in API order with API labels, all on by default.
- [ ] With every tab on, each muscle lists the same exercises in the same order as before this spec.
- [ ] Picking only `Kettlebell`, `Bands` or `Accessories` shows `No exercises for this filter.`
- [ ] Turning every tab off shows `Pick at least one type of equipment.`
- [ ] Exercise cards, the photos modal and workout entries show the group label from the API.
- [ ] While the groups are loading, the tab row shows `Loading equipment…`.
- [ ] When the request fails, the tab row shows `Couldn't load equipment.` and `Retry`, and no misleading empty state is shown. A successful retry shows the tabs, all on.
- [ ] `EquipmentKey`, `EQUIPMENT_LABELS` and `EQUIPMENT_KEYS` no longer exist. `ExerciseDef` has `equipmentGroup`, not `equipment`.
- [ ] `useMuscleCatalog` uses `useServiceState.retry`, and its tests pass unchanged.
- [ ] No component imports `~/services/*`.
- [ ] `pnpm lint`, `pnpm typecheck` and `pnpm test` pass.
- [ ] `pnpm test:e2e` passes, including the updated `features/body-map.spec.ts` and `screens.spec.ts`.

## Decisions

- **Yes:** show all six API groups, even though three of them match no mocked exercise yet. The API is the only source of truth, and the backend exercise data (927 exercises) does have kettlebell, bands and accessories exercises. The gap closes when the exercise endpoints land.
- **No:** hide groups that have no mocked exercises. That is mock-only logic that would be deleted with the mocks, and it would hide a real bug if the API returned an unexpected group.
- **No:** re-tag the 138 mocks with a piece of equipment (`barbell`, `cable`, …). The mocks get replaced by the exercise API, which tags exercises from free-exercise-db. Doing it by hand now is throwaway work.
- **No:** picking single pieces of equipment within a group in this spec. Only `Gym` (Barbell, Machine, Cable, EZ curl bar) and `Accessories` (Medicine ball, Exercise ball, Foam roll, Other) have more than one piece. The mocked exercises only know their group, so turning off a piece such as `Barbell` couldn't change the results. It gets its own spec once backend SPEC 12 serves `GET /v1/training/exercises?equipment[]=`. That spec's agreed UI is grouped chip rows, like the muscle chips: each group is a labelled row with a chip per piece, and tapping the group label turns the whole group on or off. This spec already loads the pieces (`EquipmentGroupDef.equipment`), so that spec only has to show them and filter on them.
- **Yes:** `EquipmentGroupKey` is a `string`. Muscles stay a union because each one needs a figure region. Groups need nothing per key.
- **Yes:** rename `ExerciseDef.equipment` to `equipmentGroup`. It matches what the field holds, and leaves `equipment` for the piece that backend SPEC 11 adds.
- **Yes:** `useBodyMap` stores the tabs turned off. Storing the tabs turned on would need a watcher to switch on groups that arrive late, and it would get out of sync after a retry.
- **Yes:** `retry` moves into `useServiceState`. SPEC 07 kept it in `useMuscleCatalog` because there was only one caller, and now there are two.
- **Yes:** the workout entry gets its label from the caller. The service stays free of catalog lookups, and the label stays right if the API renames a group.
- **No:** one request for both catalogs. The backend has two endpoints, and the two states fail independently.
- **Yes:** the loading, error and retry states are covered by Vitest only, as in SPEC 07, because the catalog loads during SSR.

## Risks

| Risk | Mitigation |
| --- | --- |
| Users pick `Kettlebell`, `Bands` or `Accessories` and think the library is broken. | The empty state already says `No exercises for this filter.` The default view (all tabs on) is unchanged. The exercise endpoints are the next frontend work. |
| Six chips wrap onto two lines on phones and push the results down. | The tab row already uses `flex-wrap`. The `body-equipment-tabs` screenshots at phone width show it. |
| The rename misses a spot, and the card or workout shows an empty label. | `ExerciseDef.equipmentGroup` and the new `addExerciseToWorkout` signature make typecheck fail on old uses. The e2e case checks `Gym` on the workout card. |
| Moving `retry` into `useServiceState` changes behaviour for the other callers. | It only adds return values. `pending` changes only while a retry runs, and only muscle and equipment catalogs call `retry`. |
| The equipment request fails while the muscle request succeeds, and the page shows a half-working body map. | Each block shows its own error and `Retry`. The results area stays empty instead of showing a wrong message. |

## What is **not** in this spec

- The exercise endpoints, and removing the exercise mocks.
- Kettlebell, bands or accessories exercises in the mocks.
- Picking or showing single pieces of equipment within a group (the next equipment spec, with grouped chip rows).
- A bundled fallback catalog, or caching across reloads.
- Translated labels.

Each one of those, if it lands, goes in its own spec.
