# SPEC 09 — Exercises API on the body map

> **Status:** Approved
> **Depends on:** SPEC 07, SPEC 08
> **Date:** 2026-11-02
> **Objective:** Load the body map's exercises from `GET /v1/training/exercises`, for one muscle and one equipment group at a time, with a `Load more` button, and delete the mocked exercise library.

## Why this spec exists

`/body` already loads its muscles and equipment tabs from the API. Its exercises still come from 138 mocks in `app/services/mocks/exercises.ts`. Backend SPECs 11–14 serve the real catalog of 927 exercises, so this spec removes the mocks and closes the gap SPEC 08 left: `Kettlebell`, `Bands` and `Accessories` finally list exercises.

The real catalog changes two things about the page.

**Lists are paginated.** The endpoint returns 50 items by default and 100 at most. Swapping only the service would silently drop everything after the first page.

**The filter becomes one group at a time.** The flow is now: pick a muscle, pick one tool, see its exercises. This replaces SPEC 08's "every tab on by default". One group keeps lists short:

| Group | Largest list for one muscle | Muscles over 50 exercises |
| --- | --- | --- |
| `gym` | 114 (`glute_max`) | 10 of 30 |
| `accessories` | 54 (`quads`) | 2 of 29 |
| `bodyweight` | 46 (`glute_max`) | 0 of 30 |
| `dumbbell` | 34 (`front_delts`) | 0 of 29 |
| `kettlebell` | 32 (`glute_max`) | 0 of 27 |
| `bands` | 6 (`glute_max`) | 0 of 30 |

Counted from the backend's `database/data/exercises/*.json` on 2026-11-02, leaving out `skipped.json`.

The response (SPEC 04 paginated envelope, bearer token required):

```json
{
  "data": [
    {
      "key": "barbell_bench_press",
      "name": "Barbell Bench Press",
      "category": "strength",
      "level": "beginner",
      "mechanic": "compound",
      "force": "push",
      "cue": "Shoulder blades pinned back, bar to mid-chest.",
      "equipment": "barbell",
      "equipment_group": "gym",
      "primary": ["lower_chest", "upper_chest"],
      "secondary": ["front_delts", "triceps_lateral", "triceps_long"],
      "photos": [
        {
          "url": "https://raw.githubusercontent.com/yuhonas/free-exercise-db/f00c92c7…/exercises/Barbell_Bench_Press_-_Medium_Grip/0.jpg",
          "caption": "Start",
          "source": "free_exercise_db",
          "license": "Unlicense",
          "author": null,
          "credit_url": null
        }
      ]
    }
  ],
  "links": { "first": "…", "last": "…", "prev": null, "next": "…" },
  "meta": { "current_page": 1, "last_page": 3, "per_page": 50, "total": 114 }
}
```

## Prerequisite: backend branch

Backend SPECs 11–14 are not merged to the backend's `master`. This spec is implemented against the backend's `spec-14-exercise-cues` branch:

- `../humanOS-backend` is checked out on `spec-14-exercise-cues`, with the catalog migrated and seeded.
- `pnpm gen:api` reads `docs/openapi/v1.json` from that checkout.
- `pnpm test:e2e` runs against that backend.

## Scope

**In:**

- `trainingService.getExercises(muscle, group, page)`, which calls the API, maps the response to app types and says if more pages exist.
- A `query` option on `api()`.
- One equipment group at a time on `/body`, with none picked at first.
- A `Load more` button, with its loading and error states.
- Loading, error and retry states for the exercise list.
- A nullable `cue`, and photo credits for photos that have an author.
- Deleting `app/services/mocks/exercises.ts`, its tests and the frontend's photo URL builder.
- Vitest coverage for the mapping, the query, the new `useBodyMap` and the page states.
- The body-map Playwright feature spec updated to real catalog data, with screenshots.

**Out of scope (for future specs):**

- Showing instructions, or calling `GET /v1/training/exercises/{key}`.
- Category or level filters, and search.
- Picking single pieces of equipment within a group (`?equipment[]=`).
- Combining equipment groups.
- Remembering the picked group across reloads.
- Persisting today's workout. `getTodayWorkout` and `addExerciseToWorkout` stay mocked.
- Infinite scroll.

## Data model

### Generated types (`app/types/api.generated.ts`)

Run `pnpm gen:api` against the backend branch. It adds `ExerciseResource`, `ExercisePhotoResource` and the `/v1/training/exercises` operations. Nothing is edited by hand.

### Types (`app/types/training.ts`)

```ts
export interface ExercisePhoto {
  src: string
  caption: string
  source: 'free_exercise_db' | 'wger'
  license: string
  /** Set only for wger photos. Must be shown when set. */
  author: string | null
  creditUrl: string | null
}

export interface ExerciseDef {
  key: string
  name: string
  primary: MuscleKey[]
  secondary: MuscleKey[]
  equipmentGroup: EquipmentGroupKey
  cue: string | null
  photos: ExercisePhoto[]
}

/** One page of exercises, and whether another page follows it. */
export interface ExercisePage {
  items: ExerciseDef[]
  hasMore: boolean
}
```

- `ExerciseDef.id` is renamed `key`, matching the API. The name stays free of a numeric-id meaning.
- `source` is the union the generated `PhotoSource` enum defines. If `pnpm gen:api` shows other values, the type uses the generated enum's values.

### `api` (`app/services/api.ts`)

- `ApiOptions` gains `query?: Record<string, string | number | string[]>`, passed on to `$fetch`.

### `trainingService` (`app/services/trainingService.ts`)

```ts
type ExerciseResource = components['schemas']['ExerciseResource']

/** One page of the exercises that train `muscle` with `group`, in the API's order. */
export function getExercises(muscle: MuscleKey, group: EquipmentGroupKey, page = 1): Promise<ExercisePage>
```

- It calls `api('/v1/training/exercises', { query: { muscle, 'equipment_group[]': [group], page, per_page: 50 } })`.
- It keeps the API's order. The client-side sort is deleted.
- `hasMore` is `meta.current_page < meta.last_page`.
- Muscle keys the figure can't draw are dropped from `primary` and `secondary` with `isMuscleKey`, as SPEC 07 does for the catalog.
- Errors (401, 422, 5xx, network) are passed on to the caller.
- `EXERCISE_PHOTO_BASE`, `photoIdLabel`, `toPhotos`, `toExercise` and the `mocks/exercises` import are deleted.
- `addExerciseToWorkout` doesn't change.

### `useBodyMap` (`app/composables/useBodyMap.ts`)

It returns:

```ts
{
  view, selected, select,
  equipmentGroup,   // Ref<EquipmentGroupKey | null>, initially null
  pickEquipment,    // (key: EquipmentGroupKey) => void
  exercises,        // Ref<ExerciseDef[]>
  loading,          // first page in flight
  failed,           // first page failed
  retry,            // () => Promise<void>, loads the first page again
  hasMore,          // Ref<boolean>
  loadingMore,      // next page in flight
  loadMoreFailed,   // next page failed
  loadMore,         // () => Promise<void>, appends the next page
}
```

- `off`, `equipment`, `equipmentReady` and `toggleEquipment` are removed. A group can only be picked once the catalog has loaded, so the page no longer needs `equipmentReady`.
- `pickEquipment(key)` replaces the current group. Picking the current group again changes nothing and sends no request.
- The picked group stays when the muscle changes.
- No request is sent until both a muscle and a group are picked.
- A new muscle or group clears `exercises` and every error, sets `hasMore` to false and loads page 1. The old list is not kept on screen, because its cards would sit under the new muscle's headings.
- `loadMore` asks for the next page and appends it. It does nothing if `loadingMore` is true or `hasMore` is false.
- If `loadMore` fails, the list stays and `hasMore` stays true. The same page is requested on the next try.
- The existing `request` counter covers first pages and next pages, so only the latest muscle and group can change the list.

### Display rules

**`/body` (`app/pages/body.vue`), results area, first matching row wins:**

| State | Shows |
| --- | --- |
| No muscle picked | `Tap a muscle to see exercises`, as today |
| Equipment catalog failed | Nothing else, as SPEC 08 |
| Equipment catalog loading | `Loading exercises…`, as SPEC 08 |
| No group picked | `Pick a type of equipment.` |
| First page loading | `Loading exercises…` |
| First page failed | `Couldn't load exercises.` and `Retry`, which reads `Retrying…` while disabled, in a `role="alert"` block |
| No results | `No exercises for this filter.` |
| Results | The `Targets …` and `Also works …` sections, then the `Load more` block |

- **Tabs:** one per API group, in API order, none picked at first. They use `role="radiogroup"` with `aria-label="Equipment"`, and each tab uses `role="radio"` and `aria-checked`, like the `Body side` control. They keep today's chip look.
- **Tab without a muscle:** a group can be picked first. The `Tap a muscle` message stays, and no request is sent.
- **`Load more`:** shown under the sections only while `hasMore` is true. It reads `Loading…` while disabled.
- **`Load more` failure:** `Couldn't load more exercises.` and `Retry` take the button's place in a `role="alert"` block. The list stays.
- **Cards:** `ex.id` becomes `ex.key`. The cue paragraph is hidden when `cue` is `null`. A card with no photos has no thumbnail, as today.
- **Sections:** keep splitting on `primary.includes(muscle)`. The API sends primaries first, so appended pages stay in order.
- **`Added`:** `hasExercise` still matches on the name.

**Photos modal (`app/components/modal/ExercisePhotos.vue`):**

- The subtitle reads `{label} · {cue}`, or only `{label}` when `cue` is `null`.
- `:key` and the captions use what the API sends.
- The credit line follows the current photo. A `free_exercise_db` photo shows today's line. A photo with an `author` shows `Photo: {author} ({license})`, with the author linked to `creditUrl` when it is set.

## Implementation plan

1. **Types from the backend.** Check out the backend branch, and run `pnpm gen:api`. No visible change.
2. **`api` query.** Add the `query` option. The E2E spec checks the real request's query, because `$fetch` can't be stubbed in the Nuxt Vitest environment. No visible change.
3. **Rename and nullable fields.** Rename `ExerciseDef.id` to `key`, allow a `null` cue, and add the new photo fields. The mocks' mapping fills them with `free_exercise_db`, `Unlicense` and `null`. Hide the cue when `null` on the card and in the modal. The app works as before.
4. **Credit line.** Make the modal's credit line follow the current photo. Add a component test covering a `free_exercise_db` photo, and a wger photo with an author and a link.
5. **One group at a time.** Switch `useBodyMap` and `body.vue` to `equipmentGroup` and `pickEquipment`, still on the mocks, with `getExercises` taking one group. Add `Pick a type of equipment.` and the radio tabs. Update `tests/nuxt/useBodyMap.test.ts`:
   - it starts with no group picked and sends no request;
   - a muscle alone or a group alone sends no request;
   - a muscle and a group request that pair;
   - picking another group replaces the first;
   - the group stays when the muscle changes;
   - picking the current group again sends no request.
6. **Service on the API.** Replace `getExercises` with the API call, returning `ExercisePage`. `useBodyMap` shows page 1 only for now. Extend `tests/nuxt/trainingService.test.ts`:
   - it sends `muscle`, `equipment_group[]`, `page` and `per_page=50`;
   - it keeps the API's order;
   - it maps `url` to `src`, `equipment_group` to `equipmentGroup`, and `credit_url` to `creditUrl`;
   - it keeps a `null` cue and maps empty `photos` to `[]`;
   - it drops muscle keys the figure can't draw;
   - `hasMore` is true on page 1 of 2 and false on page 2 of 2;
   - a rejected `api` call rejects `getExercises`.
7. **List error and retry.** Add `failed` and `retry` to `useBodyMap`, and the `Couldn't load exercises.` block to `body.vue`. Tests:
   - a rejected first page sets `failed`, and leaves `exercises` empty;
   - `retry()` fills the list and clears `failed`;
   - a stale failure from an earlier muscle doesn't set `failed`;
   - a new muscle clears the old list straight away.
8. **`Load more`.** Add `hasMore`, `loadingMore`, `loadMoreFailed` and `loadMore`, and the button and its error block. Tests:
   - it appends page 2 after page 1, in order;
   - the button's state is gone when the last page has loaded;
   - a rejected page keeps the list, sets `loadMoreFailed` and requests the same page on retry;
   - a page that returns after the muscle changed is ignored;
   - a second call while one is in flight sends no request.
9. **Delete the mocks.** Delete `app/services/mocks/exercises.ts`, and the `exercise library` and `exercise photos` blocks in `tests/nuxt/useBodyMap.test.ts`. `muscle map` loses only its `EXERCISES` import if it uses it. Update the comment above today's workout in `trainingService.ts`.
10. **E2E feature spec.** Rewrite the exercise cases in `tests/e2e/features/body-map.spec.ts` (light and dark, `shot()`, against the backend branch). Muscle catalog and figure cases stay. It covers:
    - tabs in API order with none checked, and tapping `lower_chest` shows `Pick a type of equipment.` (screenshot `body-pick-equipment`);
    - `lower_chest` plus `Gym` lists `Barbell Bench Press` under `Targets mid & lower chest`, with its cue (screenshot `body-lower-chest-gym`);
    - switching to `Dumbbell` removes `Barbell Bench Press` and unchecks `Gym`;
    - `lats` plus `Kettlebell` lists exercises, which the mocks couldn't do (screenshot `body-kettlebell`);
    - `serratus` plus `Kettlebell` shows `No exercises for this filter.` (screenshot `body-no-exercises`);
    - `glute_max` plus `Gym` shows 50 cards and `Load more`, then more cards after a click, and no button once every page has loaded (screenshot `body-load-more`);
    - the photo viewer for `Lat Pulldown` steps through its photos and closes on `Escape`;
    - adding `Lat Pulldown` from `Gym` shows `Gym` on the Today workout card.
11. **Checks.** `pnpm lint`, `pnpm typecheck`, `pnpm test` and `pnpm test:e2e` pass.

## Acceptance criteria

- [ ] `app/services/mocks/exercises.ts`, `EXERCISE_PHOTO_BASE`, `toggleEquipment` and `equipmentReady` no longer exist.
- [ ] `/body` shows the equipment tabs in API order with none picked.
- [ ] Only one tab can be picked, and picking another replaces it.
- [ ] A muscle with no group shows `Pick a type of equipment.` and sends no exercise request.
- [ ] A group with no muscle shows `Tap a muscle to see exercises` and sends no exercise request.
- [ ] A muscle and a group send one `GET /v1/training/exercises` with `muscle`, one `equipment_group[]`, `page=1` and `per_page=50`, with the bearer token.
- [ ] The picked group stays picked when the muscle changes.
- [ ] Exercises are listed in the API's order, with `Targets …` above `Also works …`.
- [ ] `lats` plus `Kettlebell` lists exercises.
- [ ] `serratus` plus `Kettlebell` shows `No exercises for this filter.`
- [ ] `glute_max` plus `Gym` shows 50 cards and `Load more`. Clicking until the last page removes the button, and no card appears twice.
- [ ] A failed first page shows `Couldn't load exercises.` and `Retry`. A successful retry shows the list.
- [ ] A failed next page keeps the list and shows `Couldn't load more exercises.` and `Retry`. A successful retry appends the page.
- [ ] A response for an earlier muscle or group never changes the list on screen.
- [ ] An exercise with a `null` cue shows no empty cue line on the card or in the modal.
- [ ] A photo with an `author` shows the author and license in the modal, linked to `creditUrl` when set.
- [ ] Adding an exercise shows the group's API label on the Today workout card.
- [ ] No component imports `~/services/*`.
- [ ] `pnpm lint`, `pnpm typecheck` and `pnpm test` pass.
- [ ] `pnpm test:e2e` passes against the backend's `spec-14-exercise-cues` branch, including `features/body-map.spec.ts` and `screens.spec.ts`.

## Decisions

- **Yes:** one equipment group at a time, none picked at first. It is the flow the user asked for, muscle then tool, and it keeps lists short. This replaces SPEC 08's "all on by default", and its `off` list goes with it.
- **No:** combining groups. Combined lists are longer, and someone at the gym or at home picks one setting.
- **Yes:** the picked group stays when the muscle changes. Someone at the gym is still at the gym after picking another muscle.
- **Yes:** tapping another tab replaces the group, and there is no way back to none. Nothing is useful about that state once a group is picked.
- **Yes:** `Load more`, 50 at a time. `Gym` still passes 50 for 10 of 30 muscles, and exercises after the cut-off must stay reachable. Most lists never show the button.
- **No:** requesting 100 once with no button. `glute_max` plus `Gym` has 114, and the rest would disappear with no sign.
- **No:** infinite scroll. It needs an observer, and it keeps pushing the `See today's workout` link down the page.
- **No:** fetching every page up front. It costs several requests per tap for exercises most people never reach.
- **Yes:** all categories, with no `category[]` filter. Nothing is hidden and the frontend hard-codes no list. Stretches can mix in with lifts until category chips get their own spec.
- **No:** instructions in this spec. They need the detail endpoint and new modal states, and they get their own spec.
- **Yes:** implement against the backend's `spec-14-exercise-cues` branch instead of waiting for the merge. It starts the work sooner. See **Risks** for the cost.
- **Yes:** clear the list when the muscle or group changes. Real requests are slower than the mocks, and the old cards would show under the new headings.
- **Yes:** rename `id` to `key`. The API calls it `key`, and SPEC 08 made the same call for `equipmentGroup`.
- **Yes:** show `author` and `credit_url` when set. The backend contract requires it for wger photos.
- **Yes:** exercise cards keep showing the group label, not the piece of equipment. Pieces come with their own spec.
- **Accepted:** similar-machine photo variants go away unless the API sends them. Photos and captions now come only from the API.
- **Superseded:** SPEC 08's planned UI for single pieces, where tapping a group label turns the whole group on or off. That spec has to be redesigned for one group at a time.

## Risks

| Risk | Mitigation |
| --- | --- |
| Review of backend SPECs 11–14 changes the contract after this is built. | Run `pnpm gen:api` and `pnpm test:e2e` again once the backend merges. Typecheck catches field changes. |
| `spec-14-exercise-cues` has no upstream, so this work depends on commits that exist on one machine. | Push the backend branch before starting. |
| The extra tap makes `/body` look empty after picking a muscle. | `Pick a type of equipment.` says what to do, and the tabs are next to the heading. |
| On phones, the results heading scrolls into view and the tabs are close to it, but the message can sit below the fold. | The `body-pick-equipment` phone screenshots show it. |
| Duplicate cards if the catalog changes between page requests. | The catalog is seeded and read-only, and the order ends on `key`. The `no card appears twice` check covers the normal case. |
| Exercises with the same name both show `Added`, because `hasExercise` matches on the name. | Accepted until workouts are persisted. |
| Stretches sit next to lifts in the list. | Accepted. Category chips get their own spec. |
| E2E tests depend on real catalog data, such as `Barbell Bench Press` and `Lat Pulldown`. | They use curated exercises, which are stable, and read `Load more` from the button instead of hard-coding totals beyond the first 50. |

## What is **not** in this spec

- Instructions and the exercise detail endpoint.
- Category or level filters, and search.
- Picking single pieces of equipment, or combining groups.
- Remembering the picked group across reloads.
- Persisting today's workout.
- Infinite scroll.

Each one of those, if it lands, goes in its own spec.
