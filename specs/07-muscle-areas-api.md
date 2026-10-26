# SPEC 07 — Muscle areas API and the neck on the body map

> **Status:** Approved
> **Depends on:** SPEC 01
> **Date:** 2026-10-26
> **Objective:** Load the body map's muscle catalog (areas, muscles, labels, side) from `GET /v1/training/muscle-areas` instead of `app/utils/muscles.ts`, switch muscle keys to the backend's snake_case, and draw the new `neck` muscle.

## Why this spec exists

The backend (`humanOS-backend`, backend SPEC 10 "Muscle areas and equipment groups API", branch `spec-10-muscle-equipment-api`) now serves the muscle catalog at `GET /api/v1/training/muscle-areas`. The frontend still uses its own copy in `app/utils/muscles.ts` (`MUSCLE_LABELS`, `MUSCLE_AREAS`). Comparing the two shows:

| | Backend | Frontend today |
| --- | --- | --- |
| Muscles | 30 | 29 |
| `neck` | In `back`, first, `body_view: back` | **Missing** (the `neck` and `nape` figure regions are drawn as plain silhouette) |
| `forearm_extensors` label | `Brachioradialis & forearm extensors` | `Forearm extensors` |
| Key format | `upper_chest` | `upperChest` |
| The other 29 muscles | Same areas, same order, same labels | — |

The exercise endpoints (backend SPECs 11–13) are still `Draft`. They will return muscles as snake_case keys. Adopting those keys now means the exercise integration needs no key mapping. Exercises stay mocked in this spec.

The response (SPEC 04 envelope, bearer token required, not paginated):

```json
{
  "data": [
    {
      "key": "chest",
      "label": "Chest",
      "muscles": [
        { "key": "upper_chest", "label": "Upper chest", "body_view": "front" }
      ]
    }
  ]
}
```

## Scope

**In:**

- `pnpm gen:api` so that `MuscleAreaResource` and `MuscleResource` are in `app/types/api.generated.ts`.
- `trainingService.getMuscleAreas()`, which calls `GET /v1/training/muscle-areas` and maps the response to app types.
- A new composable, `app/composables/useMuscleCatalog.ts`, that loads the catalog once per session and exposes the areas, labels, sides, loading, error and retry.
- `MuscleKey` switches to the backend's snake_case keys, and `neck` is added (30 keys).
- `MUSCLE_LABELS` and `MUSCLE_AREAS` are removed from `app/utils/muscles.ts`. The chips, figure, headings and exercise cards get labels and order from the API.
- The figure's front `neck` region and back `nape` region both map to `neck`.
- Picking a muscle that is not drawn on the current side turns the figure to the muscle's `body_view`.
- API muscles with no figure region (unknown keys) are dropped silently.
- Loading and error states on `/body`: `Loading muscles…`, then `Couldn't load muscles.` with a `Retry` button. While neither has data, the figure is drawn as plain silhouette and can't be tapped.
- The 138 mocked exercises in `app/services/mocks/exercises.ts` are re-keyed to snake_case. No neck exercises are added: picking Neck shows the existing `No exercises for this filter.` state.
- Vitest coverage for the service mapping, `useMuscleCatalog` and the updated muscle map.
- The body-map Playwright feature spec updated (snake_case selectors, the neck, the new label) with screenshots.

**Out of scope (for future specs):**

- `GET /v1/training/equipment-groups`. `EQUIPMENT_LABELS` and `EQUIPMENT_KEYS` stay as they are, because the mocked exercises only know the 3 current tabs.
- The exercise endpoints (backend SPECs 11–13), and replacing `app/services/mocks/exercises.ts`.
- Mocked neck exercises.
- A bundled fallback catalog when the API fails.
- HTTP caching or a persistent cache across reloads.
- Translating labels.
- Changing the `body-muscles` artwork.

## Data model

### Generated types (`app/types/api.generated.ts`)

Regenerated with `pnpm gen:api` from `../humanOS-backend/docs/openapi/v1.json`. It must contain `components['schemas']['MuscleAreaResource']` and `components['schemas']['MuscleResource']`. Nothing is edited by hand.

### Types (`app/types/training.ts`)

```ts
export type MuscleKey
  = | 'upper_chest' | 'lower_chest' | 'serratus'
    | 'front_delts' | 'side_delts' | 'rear_delts'
    | 'biceps' | 'triceps_long' | 'triceps_lateral' | 'forearm_flexors' | 'forearm_extensors'
    | 'upper_abs' | 'lower_abs' | 'obliques'
    | 'neck' | 'upper_traps' | 'mid_traps' | 'lower_traps' | 'lats' | 'lower_back'
    | 'glute_max' | 'glute_med' | 'hip_flexors' | 'adductors' | 'quads'
    | 'hamstrings_inner' | 'hamstrings_outer' | 'gastrocnemius' | 'soleus' | 'tibialis'

/** A muscle from the catalog API. `view` is the side the figure turns to when the muscle is picked. */
export interface MuscleDef {
  key: MuscleKey
  label: string
  view: BodyView
}

/** A body area from the catalog API, with its muscles in display order. */
export interface MuscleAreaDef {
  key: string
  label: string
  muscles: MuscleDef[]
}
```

- The `MuscleArea` union (`'chest' | … | 'legs'`) is removed. Area keys are `string` because the app only uses them as `v-for` keys and group names, and a new area from the API should still show.
- `ExerciseDef`, `EquipmentKey` and `BodyView` don't change.

### Key mapping (camelCase → snake_case)

| Before | After |
| --- | --- |
| `upperChest`, `lowerChest` | `upper_chest`, `lower_chest` |
| `frontDelts`, `sideDelts`, `rearDelts` | `front_delts`, `side_delts`, `rear_delts` |
| `tricepsLong`, `tricepsLateral` | `triceps_long`, `triceps_lateral` |
| `forearmFlexors`, `forearmExtensors` | `forearm_flexors`, `forearm_extensors` |
| `upperAbs`, `lowerAbs` | `upper_abs`, `lower_abs` |
| `upperTraps`, `midTraps`, `lowerTraps`, `lowerBack` | `upper_traps`, `mid_traps`, `lower_traps`, `lower_back` |
| `gluteMax`, `gluteMed`, `hipFlexors` | `glute_max`, `glute_med`, `hip_flexors` |
| `hamstringsInner`, `hamstringsOuter` | `hamstrings_inner`, `hamstrings_outer` |
| — | `neck` (new) |

The keys `serratus`, `biceps`, `obliques`, `lats`, `adductors`, `quads`, `gastrocnemius`, `soleus` and `tibialis` don't change.

### Figure mapping (`app/utils/muscles.ts`)

- `MUSCLE_LABELS` and `MUSCLE_AREAS` are deleted.
- `LIBRARY_TO_MUSCLE` uses the snake_case keys and gains `'neck': 'neck'` (front view) and `'nape': 'neck'` (back view).
- `NEUTRAL_REGION_IDS` loses `'neck'` and `'nape'`.
- New: `MUSCLE_KEYS: MuscleKey[]`, the distinct values of `LIBRARY_TO_MUSCLE`, and `isMuscleKey(key: string): key is MuscleKey`.
- `muscleView` is removed. The side to turn to now comes from the catalog (see `useBodyMap`).
- `BODY_REGIONS`, `BODY_VIEWBOX`, `regionBase`, `muscleForRegion`, `isOnView`, `EQUIPMENT_LABELS` and `EQUIPMENT_KEYS` stay.

### `trainingService` (`app/services/trainingService.ts`)

```ts
type MuscleAreaResource = components['schemas']['MuscleAreaResource']

/** The muscle catalog in display order. Muscles the figure can't draw are dropped, and so are areas left empty. */
export function getMuscleAreas(): Promise<MuscleAreaDef[]>
```

- It calls `api<{ data: MuscleAreaResource[] }>('/v1/training/muscle-areas')`.
- It maps `body_view` to `view` and keeps the API's order for both areas and muscles.
- It drops muscles where `isMuscleKey(key)` is false, with no warning, and then drops areas with no muscles left.
- Errors (401, 5xx, network) are passed on to the caller.
- `getExercises`, `getTodayWorkout` and `addExerciseToWorkout` stay mocked.

### `useMuscleCatalog` (`app/composables/useMuscleCatalog.ts`, new)

- It loads the catalog with `useServiceState('muscle-areas', trainingService.getMuscleAreas)`, so the catalog is fetched once per session and is hydrated from SSR.
- It returns:
  - `areas: ComputedRef<MuscleAreaDef[]>`, which is `[]` until loaded;
  - `labels: ComputedRef<Partial<Record<MuscleKey, string>>>`;
  - `label(key: MuscleKey): string`, which returns the API label, or `''` before the catalog loads;
  - `viewOf(key: MuscleKey): BodyView | undefined`;
  - `pending: ComputedRef<boolean>`, which is true while there is no data and no error, or while a retry is running;
  - `failed: ComputedRef<boolean>`, which is true when the load or the last retry failed and there is still no data;
  - `retry(): Promise<void>`, which calls `trainingService.getMuscleAreas()` again and fills the shared state on success.
- Components never import `~/services/*`.

### `useBodyMap` (`app/composables/useBodyMap.ts`)

- `select(muscle)` keeps the current side when `isOnView(muscle, view)` is true. Otherwise it turns the figure to `viewOf(muscle)`. If the muscle isn't drawn on that side either, it turns to whichever side does draw it.
- Neck is drawn on both sides, so picking it never turns the figure.
- The rest doesn't change.

### `AppBodyFigure` (`app/components/app/BodyFigure.vue`)

- A new prop, `labels: Partial<Record<MuscleKey, string>>`.
- A muscle region with a label is a button, as today, with `aria-label` set to its label and `data-muscle` set to its snake_case key.
- A muscle region without a label (catalog loading, failed, or the muscle was dropped) is drawn with the neutral silhouette fill. It has no `role`, no `tabindex` and no handlers.

### Display rules (`app/pages/body.vue`)

- **Chips:** one group per API area, in API order, headed by the area's `label`, with one chip per muscle using the API `label`. The Back group starts with `Neck`. The forearm extensors chip reads `Brachioradialis & forearm extensors`.
- **Loading** (`pending`): the chip block shows `Loading muscles…` in `inkFaintCls`, and the figure is all silhouette.
- **Error** (`failed`): the chip block shows `Couldn't load muscles.` and a `Retry` button that calls `retry()` and reads `Retrying…` while it is disabled. The figure is all silhouette. The rest of the page (equipment chips, the `Tap a muscle to see exercises` empty state) renders as usual.
- **Headings and cards:** the results heading, the `Targets {label}` and `Also works {label}` section titles, and each exercise card's `Works:` line use `label(key)`. The lowercase rule for section titles doesn't change.
- **Neck picked:** the heading reads `Neck`, and the results show `No exercises for this filter.` because no mocked exercise trains the neck.

## Implementation plan

1. **Regenerate types.** Check out the backend's `spec-10-muscle-equipment-api` branch (or `master` once it's merged) next to this repo and run `pnpm gen:api`. `pnpm typecheck` passes. No other change.
2. **Snake_case keys.** Rename the `MuscleKey` union and add `neck`. Update `LIBRARY_TO_MUSCLE` with the new keys plus `neck`/`nape` → `neck`, and remove both from `NEUTRAL_REGION_IDS`. Re-key `MUSCLE_LABELS`, `MUSCLE_AREAS` (adding `neck: 'Neck'` first in `back` for now), the 138 mocks in `app/services/mocks/exercises.ts` (including the `HAMSTRINGS` and `TRICEPS` shorthands), and `tests/nuxt/useBodyMap.test.ts`. Update the e2e `tapMuscle` and `data-muscle` selectors. In the "has an exercise that targets every muscle" test, `neck` is the only allowed exception. The app works exactly as before, plus a tappable neck.
3. **Service.** Add `MuscleDef`, `MuscleAreaDef`, `MUSCLE_KEYS`, `isMuscleKey` and `trainingService.getMuscleAreas()`. Add `tests/nuxt/trainingService.test.ts` with `vi.mock('~/services/api')`. It covers:
   - it calls `/v1/training/muscle-areas`;
   - it maps `body_view` → `view` and keeps area and muscle order;
   - an unknown muscle key (`'rotator_cuff'`) is dropped, and an area that only has unknown keys is dropped;
   - a rejected `api` call rejects `getMuscleAreas`.
4. **`useMuscleCatalog`.** Create the composable. Add `tests/nuxt/useMuscleCatalog.test.ts` with `vi.mock('~/services/trainingService')`. It covers:
   - `pending` before the data arrives, then `areas`, `label('neck') === 'Neck'` and `viewOf('neck') === 'back'`;
   - a rejected load sets `failed`, and `label` returns `''`;
   - `retry()` after a failure fills `areas` and clears `failed`, and `pending` is true while it runs;
   - a second `useMuscleCatalog()` call reuses the state and doesn't call the service again.
5. **Figure and page on the API.** Add the `labels` prop and the silhouette fallback to `AppBodyFigure`. Switch `body.vue` to `useMuscleCatalog`: chips from `areas`, `label()` for headings, sections and cards, and the loading and error states. Update `useBodyMap.select` to use `viewOf`. Delete `MUSCLE_LABELS`, `MUSCLE_AREAS` and `muscleView`. Extend `tests/nuxt/useBodyMap.test.ts`:
   - every key in `BACKEND_MUSCLE_KEYS`, a fixture of the 30 keys copied from the backend's `MuscleSeeder`, satisfies `isMuscleKey` and is drawn on at least one side;
   - `neck` is drawn on both sides;
   - on the front view, `select('rear_delts')` turns to `back`;
   - on the back view, `select('neck')` stays on `back`.
6. **E2E feature spec.** Update `tests/e2e/features/body-map.spec.ts` (light and dark, `shot()`, against the real backend). It covers:
   - the existing cases with snake_case keys;
   - the Back group's first chip is `Neck`, and there are 30 muscle chips in total;
   - tapping the neck on the back view marks `[data-muscle="neck"]` as pressed, the heading reads `Neck`, and the list reads `No exercises for this filter.` (screenshot `body-neck`);
   - the front view also has a tappable `[data-muscle="neck"]`;
   - the forearm extensors chip reads `Brachioradialis & forearm extensors`.
7. **Checks.** `pnpm lint`, `pnpm typecheck`, `pnpm test` and `pnpm test:e2e` pass. `screens.spec.ts` (`/body`) still passes.

## Acceptance criteria

- [ ] `app/types/api.generated.ts` contains `MuscleAreaResource` and `MuscleResource`, generated by `pnpm gen:api`.
- [ ] `/body` requests `GET /v1/training/muscle-areas` once per session, with the bearer token.
- [ ] The chip list shows the API's 6 areas and 30 muscles in API order, with API labels.
- [ ] `Neck` is the first chip under Back. It can be tapped on the front figure and on the back figure.
- [ ] Picking `Neck` shows the heading `Neck` and `No exercises for this filter.`
- [ ] The forearm extensors chip, heading and `Works:` mentions read `Brachioradialis & forearm extensors`.
- [ ] Picking a chip for a muscle that isn't drawn on the current side turns the figure to that muscle's `body_view`.
- [ ] `MuscleKey` values are snake_case everywhere (types, mocks, `data-muscle`). No camelCase muscle key is left in `app/` or `tests/`.
- [ ] `MUSCLE_LABELS`, `MUSCLE_AREAS` and `muscleView` no longer exist.
- [ ] A muscle key the figure can't draw is left out of the chips and the figure, with no error shown.
- [ ] While the catalog is loading, the page shows `Loading muscles…` and the figure is silhouette-only with no tappable regions.
- [ ] When the request fails, the page shows `Couldn't load muscles.` and `Retry`. A successful retry shows the chips and makes the figure tappable.
- [ ] Every exercise that was listed for a muscle before this spec is still listed for that muscle, in the same order.
- [ ] Equipment chips and filtering work exactly as before this spec.
- [ ] No component imports `~/services/*`.
- [ ] `pnpm lint`, `pnpm typecheck` and `pnpm test` pass.
- [ ] `pnpm test:e2e` passes, including the updated `features/body-map.spec.ts` and `screens.spec.ts`.

## Decisions

- **Yes:** only `/muscle-areas` in this spec. The body map can't draw the neck without it.
- **No:** `/equipment-groups` too. It returns 6 groups and 12 pieces of equipment, but the mocked exercises only know `gym`, `dumbbell` and `bodyweight`, so the new groups would filter to nothing. It moves together with the exercise endpoints.
- **Yes:** adopt the backend's snake_case keys in `MuscleKey`. The exercise APIs return those keys, so the coming integration needs no mapping, and there is one key format across the stack.
- **No:** keep camelCase and convert at the service boundary. That is a map that has to stay in sync forever, for no benefit.
- **Yes:** the neck can be tapped on both sides (front `neck`, back `nape`), like the forearm flexors. `body_view: back` decides which side the figure turns to when the neck is picked from a chip, and since it is on both sides the figure never needs to turn.
- **No:** only the back `nape` region. It leaves a visible, untappable neck on the front view.
- **Yes:** the API is the only source of labels and order, with loading and error states. There is one source of truth, and the labels can't go stale.
- **No:** a bundled fallback catalog. It would keep a second copy of the catalog that drifts, which is exactly what this spec removes. The cost: `/body` can't pick muscles while the API is down, and the error state with `Retry` covers that.
- **Yes:** the `MuscleKey` union stays static. The figure regions are static artwork, so the set of muscles the app can draw is known at build time. The API decides labels, order, area and side.
- **Yes:** muscles the figure can't draw are dropped silently. This matches backend SPEC 10's risk note ("clients ignore muscles they have no region for"). A unit test with the backend's 30 keys catches a gap in the catalog this repo ships with.
- **No:** listing undrawable muscles as chips only. Selecting them couldn't highlight anything or turn the figure.
- **Yes:** no mocked neck exercises. Neck shows `No exercises for this filter.` until the exercise endpoints land, and the "every muscle has an exercise" unit test allows only `neck` as an exception.
- **Yes:** the loading, error and retry states are covered by Vitest only. The catalog loads during SSR, where Playwright can't intercept the request. The e2e suite runs only the happy path against the real backend.
- **Yes:** `useMuscleCatalog` gets its own `retry()` instead of a change to `useServiceState`. No other caller needs retry yet.

## Risks

| Risk | Mitigation |
| --- | --- |
| Backend SPEC 10 isn't merged yet (it is staged on `spec-10-muscle-equipment-api`). `pnpm gen:api` and the e2e suite need it. | Step 1 says to generate from that branch. Merge the backend first, or run the e2e suite with that branch checked out and seeded. |
| The key rename misses a mock or test, and exercise lists silently lose entries. | `MuscleKey` is a union, so typecheck fails on a leftover camelCase key in the mocks. An acceptance criterion requires the same exercises in the same order. Step 2 lands the rename before any API work, while the e2e cases are unchanged. |
| The longer `Brachioradialis & forearm extensors` label wraps badly in the chip list, the heading or the `Targets …` title on phones. | The phone-width screenshots in the body-map spec cover the Arms chips. Chips already wrap (`flex-wrap`). |
| A slow API leaves the figure untappable on client-side navigation to `/body`. | The catalog loads once per session and is SSR-hydrated, so only the first visit waits. `Loading muscles…` shows meanwhile. |
| The backend adds a muscle the artwork can't draw (as happened with `neck`). | It is dropped silently, as backend SPEC 10 expects. Drawing it is a follow-up frontend spec. |
| The front `neck` region overlaps the upper traps visually, and taps hit the wrong muscle. | The e2e case taps `[data-muscle="neck"]` on both views and asserts the pressed state. The light and dark screenshots show the region. |

## What is **not** in this spec

- The equipment-groups endpoint, and new equipment tabs.
- The exercise endpoints, and removing the exercise mocks.
- Mocked or real neck exercises.
- A bundled fallback catalog, or caching across reloads.
- Translated labels, or changes to the body artwork.

Each one of those, if it lands, goes in its own spec.
