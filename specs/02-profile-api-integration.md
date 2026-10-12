# SPEC 02 — Profile API integration (profile, weekly weigh-ins, units)

> **Status:** Approved
> **Depends on:** SPEC 01
> **Date:** 2026-10-11
> **Objective:** Replace the locally stored onboarding profile and weigh-ins with the backend Profile API (`GET`/`PUT /v1/profile`, `GET /v1/profile/weight-entries`), with metric or imperial input chosen by the user.

## Why this spec exists

SPEC 01 kept the onboarding profile in the `humanos_profile` cookie because the backend had no profile endpoint. The previous commit added weekly weigh-ins, kept in the `humanos_weighins` cookie.
The backend (`humanOS-backend`, backend SPEC 05 "User profile") now exposes a `Profile` module. Its contract differs from the local model in ways that drive the decisions below:

- It stores `birth_date` + `sex`, not `age`. It returns a computed `age`.
- `activity_level` has 5 values (`sedentary` … `extra_active`), not the UI's 4.
- `target_weight` is always required.
- There is **no goal** (lose / build / maintain / fitness). The UI still needs one.
- There is no standalone weigh-in endpoint. Every `PUT /v1/profile` appends one weight entry and one target weight entry. History is `GET /v1/profile/weight-entries`, with all entries newest first and no activity per entry.
- `unit_system` (`metric` | `imperial`) is both the input unit and the saved display preference. Imperial height is **total inches**.

The backend work is in the backend repo on branch `spec-05-user-profile`. Its OpenAPI is exported in `../humanOS-backend/docs/openapi/v1.json`.

## Scope

**In:**

- `GET /v1/profile` to load the profile (404 → no profile yet).
- `PUT /v1/profile` from onboarding, Edit profile, and the weigh-in modal.
- `GET /v1/profile/weight-entries` for the weekly weigh-in history (home, `/weekly-review`, `/profile`).
- New fields in onboarding and Edit profile: birth date (`<input type="date">`), sex (Male / Female segmented control), and a Metric / Imperial toggle.
- Imperial height entered and shown as feet + inches. Converted to total inches before sending.
- Activity picker with the backend's 5 levels.
- Goal kept locally in a new `humanos_goal` cookie, scoped by user id.
- A "pick your goal" step for users who have a backend profile but no local goal (new browser).
- Weigh-in modal asks only for weight. History grouped by week (Monday start), keeping the latest entry per week.
- Weights, deltas, chart and target shown in the user's `unit_system` (kg or lb).
- 422 errors from `PUT /v1/profile` mapped to form fields.
- Regenerating `app/types/api.generated.ts` (`pnpm gen:api`).
- Removing the `humanos_profile` and `humanos_weighins` cookies and the mocked `saveProfile` / `progressService`.
- Unit tests (vitest) and e2e tests (Playwright against the real backend) updated.

**Out of scope (for future specs):**

- `GET /v1/profile/target-weight-entries`. No screen needs target history yet.
- Storing the goal on the backend (needs a backend "fitness objectives" spec).
- Migrating existing `humanos_profile` / `humanos_weighins` data. Users re-onboard.
- Calorie / protein targets from the profile. `useFoodLog` targets stay mocked.
- Editing, deleting or back-dating weigh-ins.
- Pagination of the weight history.
- Activity per weigh-in.
- Any backend change.

## Data model

### Types

```ts
// app/types/profile.ts (new). Wire types come from api.generated.ts; these are the app (camelCase) types.
export type Sex = 'male' | 'female'
export type UnitSystem = 'metric' | 'imperial'
export type ActivityLevel = 'sedentary' | 'lightly_active' | 'moderately_active' | 'very_active' | 'extra_active'

// ProfileResource. height/weight/targetWeight are in unitSystem units (inches, lb when imperial).
export interface Profile {
  birthDate: string // YYYY-MM-DD
  age: number
  sex: Sex
  activityLevel: ActivityLevel
  unitSystem: UnitSystem
  height: number
  weight: number | null
  targetWeight: number | null
  heightCm: number
  weightKg: number | null
  targetWeightKg: number | null
  updatedAt: string | null
}

// UpdateProfileRequest. height is cm (metric) or total inches (imperial).
export interface ProfilePayload {
  unitSystem: UnitSystem
  birthDate: string
  sex: Sex
  height: number
  weight: number
  targetWeight: number
  activityLevel: ActivityLevel
}

// WeightEntryResource.
export interface WeightEntry { id: number, weight: number, weightKg: number, recordedAt: string }
```

```ts
// app/types/progress.ts: WeighIn loses `activity` and is derived from WeightEntry.
// One point per week: the latest entry recorded in that week (Monday, local time).
export interface WeighIn { week: string, weight: number, recordedAt: string }
```

```ts
// app/types/auth.ts
// - ActivityLevel moves to types/profile.ts (new values).
// - UserProfile is removed.
// - GoalKey and OnboardGoal stay.
export interface User extends AuthUser {
  profile: Profile | null
  goal: GoalKey | null
}
```

**Form state** (onboarding and Edit profile share it, numbers stay strings):

```ts
// app/types/profile.ts
export interface ProfileForm {
  goal: GoalKey
  unitSystem: UnitSystem
  birthDate: string
  sex: Sex | ''
  heightCm: string // metric
  heightFt: string // imperial
  heightIn: string // imperial
  weight: string // kg or lb
  target: string // kg or lb; hidden for maintain/fitness
  activityLevel: ActivityLevel
}
```

### Rules

- For goals `maintain` and `fitness`, the target field stays hidden and `targetWeight = weight` is sent.
- Switching the unit toggle converts the values already typed in the form (kg ↔ lb, cm ↔ ft + in), rounded to 1 decimal (inches to whole numbers). The factors match the backend (1 in = 2.54 cm, 1 lb = 0.45359237 kg).
- Imperial height in the payload is `heightFt * 12 + heightIn`. Imperial height from the API is split back into ft + in for display (`5′ 5″`).
- Every UI weight label and suffix uses `kg` or `lb` from `profile.unitSystem`. The chart and deltas use `WeightEntry.weight`, which is already in that unit.
- Goal fallback is not inferred. A missing goal sends the user to the goal step.

### Shared state

| Key | Value |
| --- | --- |
| `useState('auth-profile')` | `Profile \| null \| undefined`. `undefined` = not loaded yet, `null` = 404. |
| `useState('weight-entries')` | `WeightEntry[] \| null`. `null` = not loaded yet. |

### Cookies

| Name | Value | Options |
| --- | --- | --- |
| `humanos_goal` | `{ userId: number, goal: GoalKey }` | `sameSite: 'lax'`, `maxAge` 1 year |
| `humanos_profile` | **removed** | — |
| `humanos_weighins` | **removed** | — |

A `humanos_goal` whose `userId` differs from the signed-in user is ignored.

### Utilities

- `app/utils/units.ts` (new): `kgToLb`, `lbToKg`, `cmToFtIn`, `ftInToInches`, `inchesToCm`, `weightUnit(unitSystem)` → `'kg' | 'lb'`, `formatHeight(profile)` → `180 cm` / `5′ 11″`.
- `app/utils/onboarding.ts`: `ACTIVITY_LEVELS` becomes `{ value: ActivityLevel, label: string }[]`. Labels: Sedentary, Light, Moderate, Very active, Extra active. `profileStatsValid` validates `ProfileForm`: birth date set, sex set, height > 0, weight > 0, and target > 0 for lose/build.
- `app/utils/progress.ts`: `formatDelta(value, unit)` → `−0.4 kg` / `+0.9 lb`.

### 422 field mapping

`toFieldErrors` maps API keys to form keys: `birth_date` → `birthDate`, `sex` → `sex`, `height` → `heightCm` (metric) or `heightFt` (imperial), `weight` → `weight`, `target_weight` → `target`, `activity_level` → `activityLevel`, `unit_system` → form-level message.

## Implementation plan

1. **API types + service.** Run `pnpm gen:api`. Add `app/types/profile.ts`. Add `app/services/profileService.ts` with `getProfile()` (resolves to `null` on 404), `saveProfile(payload)` (`PUT`) and `weightEntries()`, mapping snake_case ↔ camelCase. Allow `PUT` in `ApiOptions.method` in `app/services/api.ts`. Add `app/utils/units.ts` with vitest tests (`tests/nuxt/units.test.ts`: round-trips, ft+in split, 1-decimal rounding). Nothing uses the service yet, so the app still runs on cookies.
2. **`useAuth` profile + goal.** Replace `humanos_profile` with the `auth-profile` state and the `humanos_goal` cookie. Expose `profile`, `goal`, `hasProfile`, `hasGoal`, plus:
   - `fetchProfile()`: sets `null` on 404.
   - `saveProfile(payload)`: PUTs and stores the response.
   - `setGoal(goal)`: writes the cookie.

   `user` becomes `AuthUser & { profile, goal }`. `goalLabel` reads `goal`. `signOut` clears profile and weight-entry state (existing `clearNuxtState`). Update `tests/nuxt/useAuth.test.ts`.
3. **Middleware.** After `fetchMe()`, if signed in and `auth-profile` is `undefined`, await `fetchProfile()`. Routes for signed-in users:
   - No profile → only `/onboarding`.
   - Profile but no goal → only `/onboarding` (goal-only mode).
   - Both → `/onboarding` and auth routes redirect to `/`.

   Update `tests/nuxt/authMiddleware.test.ts`.
4. **Pickers.** `AppActivityPicker` uses the 5 `{ value, label }` levels (grid `grid-cols-2 sm:grid-cols-5`). Add `app/components/app/SexPicker.vue` (Male / Female radiogroup) and `app/components/app/UnitToggle.vue` (Metric / Imperial radiogroup). Add `app/components/app/ProfileFields.vue`, which renders the shared fields for a `ProfileForm`:
   - unit toggle, birth date, sex;
   - height (cm, or ft + in);
   - weight, and target when the goal needs one;
   - activity, with field errors.

   The toggle converts typed values (see Rules).
5. **Onboarding.** `useOnboarding` builds a `ProfileForm`. Step 0: goal. Step 1: `AppProfileFields`. Submit sends `saveProfile(toPayload(form))` and `setGoal(form.goal)`, then navigates to `/`. 422 errors go to fields. In goal-only mode (`hasProfile && !hasGoal`) the page shows only step 0. Its button reads "Continue", calls `setGoal` and navigates to `/` without a PUT. The weigh-in call in onboarding is removed (the PUT already records the first weight).
6. **Edit profile.** `useProfileForm` prefills a `ProfileForm` from `profile` + `goal` (imperial height split into ft + in). Save PUTs the full payload, calls `setGoal`, refreshes weight entries, and closes the modal. 422 errors stay in the modal on the fields. `ModalProfile` uses `AppProfileFields` + `AppGoalPicker`.
7. **Weigh-ins.** Rewrite `useWeighIns`:
   - `entries` derives from the `weight-entries` state, grouped by `weekStart(recordedAt)`, keeping the latest entry per week, oldest first. `load()` fetches it once.
   - `target` comes from `profile.targetWeight` when the goal needs one. `unit` = `weightUnit(profile.unitSystem)`.
   - `logWeighIn(weight)` PUTs the current profile (converted to a payload) with the new weight, stores the returned profile, and refetches the entries.
   - `MAX_WEIGH_INS` and the cookie are removed.

   `ModalWeighIn` drops the activity picker. Labels use `unit`. The "Last weigh-in" line still compares against the previous week. Update `tests/nuxt/useWeighIns.test.ts` (grouping, latest-per-week, unit).
8. **Pages.**
   - `index.vue` and `weekly-review.vue` call `useWeighIns().load()`. They use `unit` in labels and `formatDelta(value, unit)`. The history row no longer shows activity.
   - `profile.vue` "About you" shows: Goal; Age (from the API); Sex; Weight + "Logged <week>"; Target weight (lose/build); Height (`formatHeight`); Activity label; Units.
9. **Cleanup.** Delete `app/services/progressService.ts`, `saveProfile` from `authService.ts`, `UserProfile`, and every reference to `humanos_profile` / `humanos_weighins`. `pnpm lint` and `pnpm typecheck` pass.
10. **E2E.**
    - `tests/e2e/api.ts` gets `saveProfile(user, body)`, which PUTs `/v1/profile`.
    - `global-setup.ts` gives the shared user a metric profile (born `1994-04-15`, male, 180 cm, 82.1 kg, target 76, `moderately_active`).
    - `helpers.signIn` sets `humanos_token` and `humanos_goal` (`lose`). `setProfile` and `DEMO_WEIGH_INS` are removed.
    - `auth.spec.ts`:
      - signup → onboarding (metric) → home shows the weight;
      - signup → onboarding in imperial (5 ft 11 in, 180 lb) → `/profile` shows `5′ 11″` and `180 lb`;
      - onboarding with an empty birth date keeps the submit disabled;
      - a user with an API profile but no `humanos_goal` cookie lands on the goal step, then on `/`;
      - logging a weigh-in on `/weekly-review` updates the latest weight;
      - Edit profile changes the activity level and it persists after reload.
    - `screens.spec.ts` keeps its screens and adds `onboarding-goal`.

## Acceptance criteria

- [ ] `pnpm gen:api` has been run and `app/types/api.generated.ts` contains `ProfileResource`, `UpdateProfileRequest` and `WeightEntryResource`.
- [ ] Completing onboarding sends one `PUT /v1/profile`. After that, `GET /v1/profile` returns 200 and the user lands on `/`.
- [ ] A signed-in user whose `GET /v1/profile` returns 404 is redirected to `/onboarding` from any route, including on SSR reload.
- [ ] A signed-in user with an API profile and no `humanos_goal` cookie sees only the goal step on `/onboarding`. Picking a goal lands on `/` without sending a `PUT`.
- [ ] Onboarding and Edit profile have a birth date input, a Male / Female control, a Metric / Imperial toggle and 5 activity levels.
- [ ] In imperial mode, height is two inputs (ft, in). Entering 5 ft 11 in sends `height: 71` and `unit_system: "imperial"`.
- [ ] Switching the toggle from metric to imperial with 82 kg / 180 cm typed changes the fields to 180.8 lb / 5 ft 11 in.
- [ ] For goal `maintain` or `fitness`, the target field is hidden and the PUT sends `target_weight` equal to `weight`.
- [ ] A 422 from `PUT /v1/profile` (e.g. a birth date under 13 years) shows the API message under the matching field and keeps the form open.
- [ ] `/profile` shows the API's `age`, sex, height (`180 cm` or `5′ 11″`), weight and target in the saved unit, and the activity label.
- [ ] The weigh-in modal has only a weight field. Saving it sends one `PUT /v1/profile` with the new weight and the unchanged other fields, and the new weight appears on home, `/weekly-review` and `/profile` without a reload.
- [ ] Two weigh-ins logged in the same week show as one point (the later one) on the `/weekly-review` chart and history.
- [ ] With an imperial profile, weights, deltas and the target line on `/weekly-review` are in lb.
- [ ] Reloading `/weekly-review` shows the same history (it comes from `GET /v1/profile/weight-entries`, not a cookie).
- [ ] The strings `humanos_profile`, `humanos_weighins`, `UserProfile` and `progressService` no longer appear in `app/` or `tests/`.
- [ ] No component imports `~/services/*` directly.
- [ ] `pnpm lint`, `pnpm typecheck` and `pnpm test` pass.
- [ ] `pnpm test:e2e` passes with the backend (on `spec-05-user-profile` or later) and Mailpit running.

## Decisions

- **Yes:** goal stays local in `humanos_goal`, scoped by user id. The backend has no goal, and this spec is only about the Profile API.
- **No:** inferring the goal from target vs weight on a new browser. The user chose to be asked once instead.
- **No:** a fixed `maintain` fallback. It would silently change the delta colours and the target line.
- **Yes:** goal-only mode on `/onboarding` instead of a new page. It reuses step 0 and the existing middleware gate.
- **Yes:** birth date input + Male / Female control. It matches the API. Typing an age and deriving a date would be wrong for most users.
- **Yes:** adopt the backend's 5 activity levels. One enum end to end, no lossy mapping.
- **Yes:** `target_weight = weight` for maintain/fitness. The API requires it, and the UI already ignores target for those goals.
- **No:** always showing the target field. It is meaningless for maintain/fitness.
- **Yes:** a weigh-in is a `PUT /v1/profile` with the new weight. The backend has no standalone weight endpoint, and every PUT appends an entry.
- **Yes:** history grouped by week, keeping the latest entry per week. This keeps the weekly UX ("Update this week's weight"), and the backend keeps every raw entry.
- **No:** activity in the weigh-in modal. The API does not store activity per entry. Activity is edited in Edit profile.
- **Yes:** every Edit profile save is a PUT, even if the weight did not change. That adds a weight entry, which is the backend's intended behaviour (plateau data). Grouping per week hides the duplicates.
- **Yes:** refetch `weight-entries` after a PUT. `PUT` returns the profile, not the new entry, and the list is small (unpaginated).
- **Yes:** metric + imperial toggle in this spec, at the user's request. `unit_system` is also the display preference, so every weight label follows it.
- **Yes:** imperial height as ft + in inputs. People don't know their height in total inches.
- **Yes:** the toggle converts typed values. Retyping everything after switching units would be friction.
- **Yes:** the profile is loaded in the global middleware after `/me` (SSR too). The onboarding gate needs it on first paint. Weight entries load lazily on the pages that use them.
- **Yes:** drop old local data without migration. The app is pre-release, and `age` can't become a `birth_date`.
- **No:** `GET /v1/profile/target-weight-entries` in this spec. No screen needs it. Its service function comes with the first screen that does.
- **Yes:** client validation only checks required / positive values. Range and age bounds come from the API's 422 messages, so there is one source of truth.

## Risks

| Risk | Mitigation |
| --- | --- |
| The backend Profile module is uncommitted on `spec-05-user-profile`. Its contract could still change. | Wire types come from `pnpm gen:api`. A contract change breaks `pnpm typecheck` instead of failing at runtime. Re-run `gen:api` before starting. |
| No back-dating: e2e and screenshots can only create entries "now", so `/weekly-review` screenshots show a single point. | Accepted. The chart already handles one point. A multi-week fixture needs a backend seeding endpoint (out of scope). |
| Right after onboarding, this week already has a weigh-in, so the home "Log this week's weight" card is hidden for new users. | Accepted. The onboarding weight is this week's weigh-in. The previous implementation had the same behaviour. |
| Unit round-trips drift by 0.1 (154.3 lb → 70.0 kg → 154.3 lb). | Display uses the API's value in the user's unit. The frontend converts only on the toggle. |
| An extra `GET /v1/profile` on every first SSR render adds latency. | It is awaited only once per session (state is `undefined` until loaded). |
| Unbounded history grows the `weight-entries` payload. | Small rows. Pagination is a backend follow-up. |

## What is **not** in this spec

- `GET /v1/profile/target-weight-entries` and any target history UI.
- Goal on the backend.
- Migrating old cookie data.
- Calorie / protein targets from the profile.
- Editing, deleting, back-dating or paginating weigh-ins.
- Activity per weigh-in.
- Backend changes.

Each one of those, if it lands, goes in its own spec.
