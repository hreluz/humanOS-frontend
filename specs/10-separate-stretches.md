# SPEC 10 — Separate stretches from exercises on the body map

> **Status:** Approved
> **Depends on:** SPEC 09
> **Date:** 2026-11-02
> **Objective:** Add an `Exercises` / `Stretches` control to `/body`, so each list shows only its own kind of movement.

## Why this spec exists

SPEC 09 sent no category filter, and accepted that stretches would sit next to lifts until a later spec. That is the problem this spec fixes. For example, `lats` plus `Bodyweight` currently mixes `Child's Pose` with exercises.

The catalog data shapes the design:

| Fact | Count | Effect on this spec |
| --- | --- | --- |
| Stretches in the catalog | 117 of 927 | They are worth their own view. |
| Stretches by equipment | 84 `body_only`, 20 `other`, 9 `foam_roll`, 4 `exercise_ball` | The equipment tabs say little about a stretch, so they are hidden. |
| Largest stretch list for one muscle | 18 (`quads`, `hamstrings_inner`, `hamstrings_outer`) | One muscle's stretches fit on one 50-item page. |
| Muscles with at least one stretch | 28 | Some muscles, such as `serratus`, need an empty state. |
| Stretches with a secondary muscle | 0 | `Also works …` never shows for stretches. |

Counted from the backend's `database/data/exercises/*.json` on 2026-11-02, leaving out `skipped.json`.

The backend already supports this. `GET /v1/training/exercises` takes `category[]`, and `ExerciseCategory` is already in `app/types/api.generated.ts`. This spec needs no backend change and no new `pnpm gen:api` run.

## Scope

**In:**

- An `Exercises` / `Stretches` control on `/body`, with `Exercises` picked at first.
- `trainingService.getExercises` sends every category except `stretching`.
- A new `trainingService.getStretches(muscle, page)`, which sends `category[]=stretching` and no equipment group.
- `useBodyMap` holds the picked kind and loads the matching list.
- Equipment tabs hidden while `Stretches` is picked.
- Stretch wording for the empty, loading and first-page error states.
- Vitest coverage for the queries, `useBodyMap` and the kind switch.
- New cases and screenshots in `tests/e2e/features/body-map.spec.ts`.

**Out of scope (for future specs):**

- A separate `/stretches` route or a navigation entry.
- Chips for single categories, such as `Cardio` or `Plyometrics`.
- Level filters and search.
- Filtering stretches by equipment.
- Remembering the picked kind across reloads.
- Stretch-specific workout entries, such as a hold time instead of reps.
- Persisting today's workout.

## Data model

### Types (`app/types/training.ts`)

```ts
/** Which list the body map shows. Stretches are one API category, and exercises are all the others. */
export type ExerciseKind = 'exercises' | 'stretches'
```

`ExerciseDef` doesn't change. The list a card came from already says what it is.

### `trainingService` (`app/services/trainingService.ts`)

```ts
type ExerciseCategory = components['schemas']['ExerciseCategory']

/** One page of the non-stretching exercises that train `muscle` with `group`. */
export function getExercises(muscle: MuscleKey, group: EquipmentGroupKey, page = 1): Promise<ExercisePage>

/** One page of the stretches for `muscle`, with any equipment. */
export function getStretches(muscle: MuscleKey, page = 1): Promise<ExercisePage>
```

- `getExercises` sends `muscle`, `equipment_group[]`, `category[]`, `page` and `per_page=50`.
- Its `category[]` values are `strength`, `powerlifting`, `olympic_weightlifting`, `strongman`, `plyometrics` and `cardio`.
- That list is the keys of a `Record<Exclude<ExerciseCategory, 'stretching'>, true>`. A new backend category then fails typecheck after `pnpm gen:api`, instead of silently leaving the list.
- `getStretches` sends `muscle`, `category[]=stretching`, `page` and `per_page=50`.
- Both share one private function for the request and the mapping to `ExercisePage`.
- Order, mapping and error handling stay as SPEC 09 defines them.

### `useBodyMap` (`app/composables/useBodyMap.ts`)

It also returns `kind: Ref<ExerciseKind>`, initially `'exercises'`.

| `kind` | Needs before sending a request | Calls |
| --- | --- | --- |
| `exercises` | A muscle and a group | `getExercises(muscle, group)` |
| `stretches` | A muscle | `getStretches(muscle)` |

- The first-page watcher also watches `kind`. Changing it clears the list and every error, as a new muscle or group does.
- `loadMore` asks for the next page of the current kind.
- The muscle and the picked group stay when the kind changes.
- The `request` counter covers `kind`, so a response for the earlier kind never changes the list.
- `retry` loads the first page of the current kind.

### Display rules

**Kind control (`app/pages/body.vue`):**

- It sits under the results heading, above the equipment tabs.
- It uses `role="radiogroup"` with `aria-label="Exercise type"`, and each option uses `role="radio"` and `aria-checked`.
- It uses `useRadioGroup` for the keyboard, and the segmented look of the `Body side` control.
- It shows at all times, even before the equipment and muscle catalogs load.

**Equipment tabs:** the tabs, `Loading equipment…` and `Couldn't load equipment.` show only while `kind` is `exercises`.

**Results area, first matching row wins:**

| State | `Exercises` shows | `Stretches` shows |
| --- | --- | --- |
| No muscle picked | `Tap a muscle to see exercises`, with today's second line | `Tap a muscle to see stretches`, with `Add stretches to today's workout.` |
| Equipment catalog failed | Nothing else, as SPEC 08 | Not applicable |
| Equipment catalog loading | `Loading exercises…` | Not applicable |
| No group picked | `Pick a type of equipment.` | Not applicable |
| First page failed | `Couldn't load exercises.` and `Retry` | `Couldn't load stretches.` and `Retry` |
| First page loading | `Loading exercises…` | `Loading stretches…` |
| No results | `No exercises for this filter.` | `No stretches for this muscle.` |
| Results | The sections, then the `Load more` block | The same |

- **Cards:** stretch cards are the same as exercise cards, including photos, the group label, `+ Add` and `Added`.
- **Headings:** a stretch list uses the same `Targets …` heading.
- **`Load more`:** the shared code stays, and its wording doesn't change. Stretch lists don't reach a second page today.

## Implementation plan

1. **Exercises without stretches.** Add the category list to `getExercises`, and move the request into the private function. Extend `tests/nuxt/trainingService.test.ts`:
   - `getExercises` sends the six `category[]` values, and not `stretching`.
2. **`getStretches`.** Add `ExerciseKind` and `getStretches`. Extend `tests/nuxt/trainingService.test.ts`:
   - it sends `muscle`, `category[]` with only `stretching`, `page` and `per_page=50`;
   - it sends no `equipment_group[]`;
   - it maps the response and `hasMore` as `getExercises` does;
   - a rejected `api` call rejects `getStretches`.
3. **Kind in `useBodyMap`.** Add `kind`, and choose the service call from it. Nothing on the page sets it yet, so nothing visible changes. Extend `tests/nuxt/useBodyMap.test.ts`:
   - it starts on `exercises`, and sends no request;
   - `stretches` with a muscle and no group calls `getStretches`, and never `getExercises`;
   - `stretches` with no muscle sends no request;
   - switching kind clears the old list straight away;
   - the muscle and the group stay after switching there and back;
   - switching back with a group requests `getExercises` for that pair;
   - switching back with no group sends no request;
   - a late response for the earlier kind is ignored;
   - `retry` and `loadMore` use the current kind.
4. **Control and tabs on the page.** Add the control to `body.vue`, and hide the equipment block while `Stretches` is picked. Make the results conditions skip the equipment rows for stretches. Add the stretch wording.
5. **E2E feature spec.** Extend `tests/e2e/features/body-map.spec.ts` (light and dark, `shot()`, against the real backend). Existing cases stay. It covers:
   - `Exercises` is checked at first, and the tabs show (screenshot `body-kind-control`);
   - `lats` plus `Bodyweight` lists exercises without `Child's Pose`;
   - `Stretches` hides the tabs, and with `lats` lists `Child's Pose` without any tool picked (screenshot `body-stretches`);
   - the stretch request has `category[]=stretching` and no `equipment_group[]`;
   - `Stretches` with no muscle shows `Tap a muscle to see stretches`, and sends no exercise request;
   - `serratus` plus `Stretches` shows `No stretches for this muscle.` (screenshot `body-no-stretches`);
   - switching back to `Exercises` shows the tabs with the earlier group still checked, and lists its exercises;
   - a failed stretch request shows `Couldn't load stretches.`, and `Retry` lists them;
   - adding `Child's Pose` shows it on the Today workout card.
6. **Checks.** `pnpm lint`, `pnpm typecheck`, `pnpm test` and `pnpm test:e2e` pass.

## Acceptance criteria

- [ ] `/body` shows an `Exercises` / `Stretches` control with `Exercises` checked at first.
- [ ] The control works with arrow keys, `Home` and `End`.
- [ ] Every exercise request sends the six non-stretching `category[]` values.
- [ ] No exercise list contains an exercise with the `stretching` category.
- [ ] `lats` plus `Bodyweight` doesn't list `Child's Pose`.
- [ ] Picking `Stretches` hides the equipment tabs.
- [ ] `Stretches` plus `lats` lists `Child's Pose` with no equipment picked.
- [ ] A stretch request sends `muscle`, `category[]=stretching`, `page=1` and `per_page=50`, sends no `equipment_group[]`, and has the bearer token.
- [ ] `Stretches` with no muscle shows `Tap a muscle to see stretches`, and sends no exercise request.
- [ ] `serratus` plus `Stretches` shows `No stretches for this muscle.`
- [ ] A failed stretch request shows `Couldn't load stretches.` and `Retry`. A successful retry shows the list.
- [ ] Failed equipment catalog loading doesn't block the stretch list.
- [ ] Changing kind clears the old list immediately, and a late response for the earlier kind never changes the list.
- [ ] The muscle and the picked group stay when switching kind and back.
- [ ] Adding a stretch shows it on the Today workout card.
- [ ] No component imports `~/services/*`.
- [ ] `pnpm lint`, `pnpm typecheck` and `pnpm test` pass.
- [ ] `pnpm test:e2e` passes, including `features/body-map.spec.ts` and `screens.spec.ts`.

## Decisions

- **Yes:** a two-option control on `/body`. Only one list shows, so each loads and pages on its own, and it reuses the `Body side` look.
- **No:** two sections in one list. It needs two requests and two `Load more` buttons, and long gym lists push stretches far down.
- **No:** a separate `/stretches` page. It repeats the body map, and adds an entry to the mobile tab bar.
- **Yes:** `Exercises` is the default. It keeps the flow SPEC 09 set up.
- **Yes:** hide the equipment tabs for stretches, and list every stretch for the muscle. Most stretches need no equipment, and `Gym`, `Dumbbell`, `Kettlebell` and `Bands` would have almost no results.
- **Yes:** `Exercises` means every category but `stretching`. Plyometrics and cardio stay reachable. This changes SPEC 09's "no `category[]` filter", which it left for a later spec.
- **No:** one chip per category. That is a second filter row, and only this one split is needed.
- **No:** a strength-only `Exercises` list. The 75 plyometrics and cardio exercises would become unreachable.
- **Yes:** the frontend names the six categories, typed from the generated enum. The API has no way to exclude a category.
- **Yes:** stretches use the same `+ Add`. They can be planned into a session with no change to the workout model.
- **Yes:** two service functions, not one with optional arguments. A stretch request can't carry a group by accident, and existing `getExercises` callers don't change.
- **Yes:** the equipment catalog's state doesn't affect `Stretches`. The stretch list doesn't depend on a picked group.
- **Yes:** keep `Targets …` on stretch lists, and the `Load more` wording. Only states people can reach today get new wording.

## Risks

| Risk | Mitigation |
| --- | --- |
| A stretch added to today's workout gets the default `10 reps` × 3, which reads oddly for a hold. | Accepted until stretch-specific entries get their own spec. |
| If the equipment catalog failed, a stretch card shows no group label, and an added stretch has an empty `equip`. | Accepted. The card still works, and the failure is rare. |
| A new backend category silently leaves the `Exercises` list. | The `Record` keyed on the generated enum fails typecheck after `pnpm gen:api`. |
| Someone picks `Stretches`, reloads and is back on `Exercises`. | Accepted. Remembering it is out of scope, as it is for the group. |
| E2E tests depend on catalog data, such as `Child's Pose` and `serratus` having no stretches. | The seeded catalog is read-only. A data change fails these cases visibly. |

## What is **not** in this spec

- A `/stretches` route or a navigation entry.
- Single-category chips, level filters and search.
- Filtering stretches by equipment.
- Remembering the picked kind across reloads.
- Stretch-specific workout entries.
- Persisting today's workout.

Each one of those, if it lands, goes in its own spec.
