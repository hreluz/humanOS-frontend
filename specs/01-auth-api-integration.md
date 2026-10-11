# SPEC 01 — Auth API integration (register, login, password reset, session)

> **Status:** Approved
> **Depends on:** —
> **Date:** 2026-10-11
> **Objective:** Replace the mocked auth service with the real backend auth API (register, login, logout, me, forgot password, reset password) using a bearer token stored in a cookie.

## Why this spec exists

Auth today is a mock: any credentials succeed and the whole `User` (account + onboarding profile) lives in the `humanos_user` cookie.
The backend (`humanOS-backend`, OpenAPI at `http://localhost:8000/docs/api.json`) now exposes real auth under `/api/v1/auth/*` with Sanctum personal access tokens.
Two non-obvious consequences drive the decisions below:

- The API has **no endpoint for the onboarding profile** (goal, age, height, weight, target, activity). `UserResource` only has `id`, `name`, `email`, `role`, `email_verified_at`, `created_at`.
- The reset email links to the frontend at `{FRONTEND_URL}/reset-password?token=…&email=…`. That page does not exist yet.

## Scope

**In:**

- `POST /v1/auth/register` from the signup form.
- `POST /v1/auth/login` from the login form.
- `POST /v1/auth/logout` from "Sign out".
- `GET /v1/auth/me` to restore the user from the token (SSR and client).
- `POST /v1/auth/forgot-password` from the forgot-password form.
- `POST /v1/auth/reset-password` from a new `/reset-password` page.
- Bearer token stored in the `humanos_token` cookie.
- Onboarding profile stored locally in the `humanos_profile` cookie, scoped to the user id.
- Mapping 422 validation errors to form fields, and 429 / network errors to a form-level message.
- Playwright e2e tests running against the real backend (`localhost:8000`) and Mailpit (`localhost:8025`).

**Out of scope (for future specs):**

- Email verification: `GET /v1/auth/email/verify/{id}/{hash}`, `POST /v1/auth/email/verification-notification`, and the `/verify-email` page the backend already links to.
- Token / device management: `GET /v1/auth/tokens`, `DELETE /v1/auth/tokens`, `DELETE /v1/auth/tokens/{id}`.
- A backend profile endpoint and syncing the onboarding profile to the server.
- Blocking unverified users (the backend does not enforce `verified` either).
- Any non-auth service (food, training, stats, goals, coach, grocery) stays mocked.

## Data model

```ts
// app/types/auth.ts

// Account as returned by the API (UserResource), mapped to camelCase in the service.
export interface AuthUser {
  id: number
  name: string
  email: string
  role: string
  emailVerifiedAt: string | null
  createdAt: string | null
}

// Onboarding profile, unchanged shape. Numeric fields stay strings (form inputs).
export interface UserProfile { goal: GoalKey, age: string, height: string, weight: string, target: string, activity: ActivityLevel }

// What the UI consumes: account + profile (profile is null until onboarding is done).
export interface User extends AuthUser { profile: UserProfile | null }

export interface RegisterPayload { name: string, email: string, password: string, passwordConfirmation: string }
export interface ResetPasswordPayload { token: string, email: string, password: string, passwordConfirmation: string }

// Field → first message, built from a 422 `{ message, errors: { field: string[] } }`.
export type FieldErrors = Record<string, string | undefined>
```

`SignupDraft` is removed. The account now exists right after signup, so onboarding no longer needs a draft.

**Cookies**

| Name              | Value                                   | Options                                       |
| ----------------- | --------------------------------------- | --------------------------------------------- |
| `humanos_token`   | Sanctum token string (`1\|xR8n…`)       | `sameSite: 'lax'`, `maxAge` 30 days           |
| `humanos_profile` | `{ userId: number, profile: UserProfile }` | `sameSite: 'lax'`, `maxAge` 1 year            |
| `humanos_user`    | **removed**                              | —                                             |

30 days matches the backend `SANCTUM_EXPIRATION=43200` (minutes).
A `humanos_profile` whose `userId` differs from the signed-in user is ignored.

**Runtime config**

```ts
// nuxt.config.ts
runtimeConfig: { public: { apiBase: 'http://localhost:8000/api' } } // overridable via NUXT_PUBLIC_API_BASE
```

**Shared state**

- `useState('auth-user')` holds `AuthUser | null`, filled from login/register responses or `/me`.
- The profile is read from the `humanos_profile` cookie and combined in `useAuth` into the `User` the UI consumes.

## Implementation plan

1. **API client.** Add `runtimeConfig.public.apiBase` to `nuxt.config.ts`. Create `app/services/api.ts` exporting an `api` `$fetch` instance with `baseURL` = `apiBase`, `Accept: application/json`, and `Authorization: Bearer <humanos_token>` when the cookie is set. Create `app/utils/apiErrors.ts` with `toFieldErrors(err)` (422 → first message per field, snake_case keys mapped to the form's keys) and `toFormMessage(err)` (429 → API `message`; network/5xx → "Something went wrong. Try again."). App still runs on mocks after this step.
2. **Types + service.** Update `app/types/auth.ts` per the data model. Rewrite `app/services/authService.ts` with `register`, `login`, `logout`, `me`, `forgotPassword` and `resetPassword` calling `/v1/auth/*`, mapping `UserResource` → `AuthUser`. Keep `saveProfile(profile)` as a mock (`delay()`), since there is no API for it. Delete `app/services/mocks/auth.ts` (`DEMO_PROFILE`).
3. **`useAuth`.** Replace the `humanos_user` cookie with `humanos_token` + `humanos_profile`. Expose `user` (`User | null`), `isAuthenticated`, `hasProfile`, plus `login`, `register`, `fetchMe`, `saveProfile` and `signOut`. Keep `userName`, `firstName`, `initial` and `goalLabel` (`goalLabel` reads `user.profile?.goal`). `signOut` calls `logout`, ignores a 401, then clears the token and state and navigates to `/login`. `fetchMe` clears the token on a 401.
4. **Middleware.** `app/middleware/auth.global.ts` becomes async. If a token exists and `auth-user` is empty, it awaits `fetchMe()`. Routes:
   - Signed out → only `/login`, `/signup`, `/forgot-password`, `/reset-password`. Anything else → `/login`.
   - Signed in without a profile → `/onboarding` only.
   - Signed in with a profile → auth routes and `/onboarding` redirect to `/`.
5. **Login.** `useLoginForm` calls `login`. 422 errors go to the fields (wrong credentials arrive on `email`). 429 shows a form-level message. On success it navigates to `/` (the middleware sends profile-less users to `/onboarding`). `login.vue` shows "Password updated — sign in with your new password." when `?reset=1` is present.
6. **Signup + onboarding.** `useSignupForm` calls `register` with `password_confirmation`, maps 422 errors to fields (e.g. "The email has already been taken." on `email`), stores the token and user, and navigates to `/onboarding`. `useOnboarding` reads `firstName` from `useAuth`, not from the draft, and calls `saveProfile`. That writes `humanos_profile` and navigates to `/`. Remove `useSignupDraft`.
7. **Forgot password.** `useForgotPassword` calls `forgotPassword`. 422 → field error, 429 → form message. The "Check your email" state is unchanged.
8. **Reset password page.** Add `app/composables/useResetPassword.ts` and `app/pages/reset-password.vue` (auth layout, same components as signup). It reads `token` and `email` from the query and shows email as read-only, plus password and confirm fields with the toggle. If `token` or `email` is missing, it shows "This reset link is invalid" with a link to `/forgot-password`. Client validation matches signup (≥ 8 chars, confirm matches). Server 422 messages (including an invalid/expired token, returned on `email`) appear on the fields. On success it navigates to `/login?reset=1`.
9. **E2E infrastructure.** Add `tests/e2e/api.ts` with `registerUser()` (unique `e2e+<project>-<timestamp>-<rand>@example.com`, password `e2e-password-123`) and `latestResetLink(email)`. `latestResetLink` polls the Mailpit API `http://localhost:8025/api/v1/search?query=to:<email>`, reads the message, and returns the `/reset-password?…` path and query. `global-setup.ts` checks that `E2E_API_BASE` (default `http://localhost:8000/api`) and `MAILPIT_URL` (default `http://localhost:8025`) respond. If not, it fails with a clear message. It then registers one user for the screenshot tests and exports its token in `E2E_TOKEN`. `helpers.signIn` sets the `humanos_token` cookie and a `humanos_profile` cookie for that user (current `DEMO_USER` profile values). `playwright.config.ts` passes `NUXT_PUBLIC_API_BASE` to the web server.
10. **E2E tests.** Update `tests/e2e/auth.spec.ts`:
    - Signup → onboarding → home, with a unique email.
    - Signup with an already-registered email shows the API error on the email field.
    - Login with wrong password shows the API error.
    - Sign in, then sign out (user registered via API in the test). After sign-out, `/` redirects to `/login`.
    - Forgot password → "Check your email".
    - Full reset: register via API → request reset in the UI → open the link from Mailpit → set a new password → `/login?reset=1` notice → log in with the new password → home.
    - `/reset-password` without a token shows the invalid-link state.
    - Signed-out visitors are sent to `/login`.

    Screenshot tests (`screens.spec.ts`, auth screenshots) keep their current screens and add `reset-password`.

## Acceptance criteria

- [ ] With the backend running, registering on `/signup` creates a user in the backend DB and lands on `/onboarding`.
- [ ] Registering with an existing email shows the API's message under the Email field and stays on `/signup`.
- [ ] Completing onboarding lands on `/` and the greeting uses the registered name.
- [ ] Logging in with valid credentials lands on `/` (or `/onboarding` if this browser has no profile for that user).
- [ ] Logging in with a wrong password shows the API's error under Email and no `humanos_token` cookie is set.
- [ ] A sixth failed login within a minute shows the API's 429 message instead of a field error.
- [ ] Reloading any protected page while signed in renders it server-side without redirecting to `/login` (token → `/me`).
- [ ] An invalid or expired `humanos_token` cookie redirects to `/login` and the cookie is cleared.
- [ ] "Sign out" sends `POST /v1/auth/logout`, clears `humanos_token`, and lands on `/login`. Visiting `/` afterwards redirects to `/login`.
- [ ] Submitting `/forgot-password` with any well-formed email shows "Check your email", and Mailpit receives a mail for registered emails.
- [ ] Opening the link from that email shows `/reset-password` with the email prefilled.
- [ ] Setting a new password there redirects to `/login?reset=1` with the success notice, and the new password logs in.
- [ ] Reusing the same reset link shows the API's invalid-token error.
- [ ] `/reset-password` without `token` or `email` shows the invalid-link state with a link to `/forgot-password`.
- [ ] No component imports `~/services/*` or `~/services/mocks/*` directly.
- [ ] The `humanos_user` cookie and `useSignupDraft` no longer exist in the codebase.
- [ ] `pnpm typecheck` passes.
- [ ] `pnpm test:e2e` passes with the backend and Mailpit running, and fails fast with a clear message when they are not.

## Decisions

- **Yes:** logout + me in this spec. A real token session needs revocation on sign-out and restoring the user on reload.
- **No:** email verification in this spec. It needs a new `/verify-email` page and a "resend" UX. It goes in its own spec.
- **No:** token / device management. There is no UI for it today. It goes in its own spec.
- **Yes:** token in a `useCookie` cookie (`humanos_token`). SSR can read it, so the global middleware and `/me` work on first paint. Same pattern as the old `humanos_user` cookie.
- **No:** localStorage for the token. It is client-only, so protected pages would flash signed-out on SSR.
- **No:** httpOnly cookie via a Nuxt server proxy. It is more secure against XSS, but adds a server layer this app does not have yet. Worth revisiting before production.
- **Yes:** register at the signup step. Server errors (email taken, weak password) show on the form where the user typed them.
- **No:** register at the end of onboarding. "Email taken" would surface only after the user filled in their stats.
- **Yes:** onboarding profile kept locally in `humanos_profile`, scoped by `userId`, behind a mocked `saveProfile` service. That keeps the component → hook → service layering, so a future profile API only changes the service.
- **Yes:** a signed-in user without a local profile is sent to `/onboarding`. This covers logging in on a new browser until a profile API exists.
- **Yes:** API responses mapped to camelCase in the service. The rest of the frontend is camelCase.
- **Yes:** `device_name` is not sent. The backend falls back to the User-Agent.
- **Yes:** after a reset, go to `/login?reset=1` with a notice. The API revokes all tokens and issues none, and auto sign-in would spend a throttled login attempt.
- **Yes:** e2e against the real backend, with a unique user per test/run registered via the API. That avoids the 5/min login throttle and collisions between desktop/mobile projects.
- **No:** Playwright `page.route` stubs or a mock-mode flag. The user chose to test against the real backend.
- **Yes:** full reset flow in e2e via the Mailpit API. Mailpit is already in the backend `docker-compose.yml`.

## Risks

| Risk | Mitigation |
| --- | --- |
| CORS: the frontend runs on `:3000` / `:3100` and the API on `:8000`. The backend has no `config/cors.php` (Laravel defaults). | Laravel's default allows `api/*` from any origin with bearer tokens (no credentials). If requests fail, add `config/cors.php` in the backend. That is a backend change and outside this spec. |
| The reset email links to `FRONTEND_URL` (`:3000`), but e2e runs on `:3100`. | `latestResetLink` returns only the path and query. The test opens it against Playwright's `baseURL`. |
| Login throttle (5/min per email+IP) makes tests flaky. | Every test that logs in uses its own freshly registered email. |
| E2E leaves many `e2e+…@example.com` users in the DB. | Accepted for now. Cleanup can come with a backend test endpoint or DB reset later. |
| Mailpit delivery is async, so the email may not be there yet. | `latestResetLink` polls for up to 10 s before failing. |
| Token in a JS-readable cookie is exposed to XSS. | Accepted for now (see Decisions). Revisit with an httpOnly proxy before production. |
| Local profile is lost when cookies are cleared or on a new browser. | The user is re-sent to `/onboarding`. A profile API spec fixes it permanently. |

## What is **not** in this spec

- Email verification page and resend (`/verify-email`, `email/verify`, `email/verification-notification`).
- Token / device management (`/v1/auth/tokens*`).
- A backend profile endpoint or server-side storage of onboarding data.
- Backend changes (CORS, test endpoints, DB cleanup).
- Any non-auth service moving off mocks.

Each one of those, if it lands, goes in its own spec.
