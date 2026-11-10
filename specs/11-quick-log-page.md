# SPEC 11 — Quick log page

> **Status:** Approved
> **Depends on:** None
> **Date:** 2026-11-06
> **Objective:** Move the Quick log from the `quickLog` modal to a `/log?tab=food|activity|water` page inside the app layout, which asks before leaving with an unlogged basket or activity.

## Why this spec exists

The Quick log is a modal, and `useModal` holds one modal at a time. Anything the Quick log wants to open on top of itself, such as the ingredient photo viewer that SPEC 12 adds, would replace it and lose the basket. A page has no such limit. It also gets a URL that survives a reload, and it gets more room on phones than an 88vh sheet.

This spec only moves the Quick log. Its food, activity and water content, the When picker, the recipe ingredient editor and the pinned bottom bar keep their current behavior and look.

## Scope

**In:**

- A new page, `app/pages/log.vue`, with the content of `app/components/modal/QuickLog.vue`.
- The tab read from and written to `?tab=` (`food`, `activity`, `water`). A missing or unknown value means `food`.
- The page inside the default layout, with the sidebar and the tab bar.
- Leaving the page by X, by `Escape`, or after a successful log goes back in history, or to `/` when the previous page isn't in the app.
- A confirmation before any in-app navigation away from `/log` while the basket has items or an activity is picked.
- The sidebar `Log` button, the tab bar's `+` button, the two Today cards and `+ Log food` on `/food` become `NuxtLink`s.
- Deleting the `quickLog` modal key, `app/components/modal/QuickLog.vue` and `useQuickLogLauncher`.
- E2E helpers and specs updated, with new screenshots.

**Out of scope (for future specs):**

- Any change to what the Quick log does or shows: search, tabs, basket, amounts, the When picker, the activity estimate or water presets.
- Ingredients from the API, portions and photos (SPEC 12).
- A `beforeunload` prompt on reload or when the tab closes.
- Keeping the draft after leaving the page.
- Deep links that preselect a food, an activity or a meal.

## Data model

This feature introduces no new data structures. It changes where existing state lives and how the page is reached.

### Types (`app/types/ui.ts`)

- `ModalKey` loses `'quickLog'`.
- `TabKey` gains `'log'`. `SCREEN_TITLES.log` is `'Log'`. `log` is not added to `NAV_DEFS`.

### `useQuickLog` (`app/composables/useQuickLog.ts`)

- `tab` stops being `useState('quick-log-tab')`. It becomes a computed over `useRoute().query.tab`. Its setter calls `navigateTo({ query: { tab } }, { replace: true })`, so switching tabs doesn't add history entries.
- `QUICK_LOG_TABS` keys are the only valid values. Anything else reads as `food`.
- A new `hasApproved` computed is `basket.length > 0 || activity !== null`. The water amount and a changed time don't count.
- A new `leave()` goes back with `router.back()` when `window.history.state?.back` is set, and otherwise calls `navigateTo('/')`.
- `submit()` calls `leave()` instead of `close()`, after clearing the basket and the activity so the guard doesn't ask.
- `useQuickLogLauncher` and `openQuickLog` are deleted.

### Leave confirmation (`app/pages/log.vue`)

- `onBeforeRouteLeave` checks `hasApproved`. When it is false, the navigation goes ahead.
- When it is true, the navigation stops and a dialog opens. `Discard` repeats the navigation that was stopped, with the guard off. `Keep editing` closes the dialog and stays.
- The dialog is in-page markup, not a `useModal` modal and not a browser dialog:
  - `role="alertdialog"`, `aria-modal="true"`, labelled by its text;
  - the text is `Discard what you haven't logged?`;
  - `Discard` uses the coral accent, and `Keep editing` is the default button and gets focus;
  - `Escape` and a click on the backdrop mean `Keep editing`;
  - focus stays inside the dialog while it is open, and goes back to the control that started the navigation when it closes.

### Display rules

- **Layout:** the default layout, with `definePageMeta({ tab: 'log' })`. The content is a centered column with `md:max-w-[560px]`. The pinned bottom bar for amounts and `Log` stays pinned. On phones it sits above the tab bar.
- **Header:** the `Log` title and an X button, `aria-label="Close"`, which calls `leave()`. The Food / Activity / Water radio tabs follow, as today.
- **`Escape`:** inside the recipe ingredient editor it goes back to the basket, as today. Elsewhere it calls `leave()`. It does nothing while the dialog is open, because the dialog handles it.
- **Active state:** on `/log`, the tab bar's `+` button and the sidebar's `Log` link get `aria-current="page"`.
- **Entry points:**

| Where | Link to |
| --- | --- |
| Sidebar `Log` | `/log` |
| Tab bar `+` (`Log food, activity or water`) | `/log` |
| Today, food summary card | `/log?tab=food` |
| Today, `+ Log` | `/log` |
| `/food`, `+ Log food` | `/log?tab=food` |

- The links keep their current classes and accessible names. `/log` alone opens the food tab.

## Implementation plan

1. **Route-backed tab.** Add `'log'` to `TabKey` and `SCREEN_TITLES`. Make `tab` in `useQuickLog` read and write `?tab=`. The modal still works: opening it with no query shows food. Vitest in `tests/nuxt/useQuickLog.test.ts`:
   - no `tab` query, and `?tab=nope`, read as `food`;
   - `?tab=water` reads as `water`;
   - setting `tab` replaces the query and doesn't push history.
2. **`/log` page.** Create `app/pages/log.vue` with the QuickLog content, without `ModalShell`, in the column layout, with the header X. Add `leave()` and use it in `submit()` and the X button. The modal stays for now, so both work.
3. **Entry points.** Turn the five entry points into `NuxtLink`s from the table. Add `aria-current` on `/log`. Remove `<ModalQuickLog>` from `app/layouts/default.vue`, and delete `app/components/modal/QuickLog.vue`, `'quickLog'`, and `useQuickLogLauncher`.
4. **Leave guard.** Add `hasApproved`, `onBeforeRouteLeave` and the dialog. Vitest:
   - `hasApproved` is false at first, true with one basket item, true with a picked activity, and false with only water changed;
   - a successful `submit()` clears the draft before it leaves.
5. **E2E.** Change `openQuickLog` in `tests/e2e/helpers.ts` to click the visible `Log` link, or `Log food, activity or water` on phones, and wait for `/log`. Update `quick-log.spec.ts`, `my-foods.spec.ts` and `screens.spec.ts` where they wait for or close the dialog. Add `tests/e2e/features/log-page.spec.ts` (light and dark, `shot()`). It covers:
   - each entry point opens `/log`, and `+ Log food` and the food card open the food tab;
   - `/log?tab=water` opens Water, and switching tabs updates the URL without adding history;
   - reloading `/log?tab=activity` stays on Activity;
   - X with an empty basket goes back to the page it came from, and `/log` opened directly goes to `/`;
   - with a basket item, clicking `Stats` in the sidebar shows the dialog (screenshot `log-discard`), `Keep editing` keeps the basket, and `Discard` opens `/stats`;
   - browser Back with a basket item shows the dialog;
   - logging a food goes back to Today with no dialog, and the totals include it;
   - phone screenshots of the food tab with a basket item, with the pinned bar above the tab bar (screenshot `log-phone`).
6. **Checks.** `pnpm lint`, `pnpm typecheck`, `pnpm test` and `pnpm test:e2e` pass.

## Acceptance criteria

- [ ] `app/components/modal/QuickLog.vue`, the `quickLog` modal key and `useQuickLogLauncher` no longer exist.
- [ ] `/log` shows the Quick log inside the app layout, with the sidebar on desktop and the tab bar on phones.
- [ ] `/log` and `/log?tab=unknown` open Food, and `/log?tab=activity` and `/log?tab=water` open those tabs.
- [ ] Switching tabs changes `?tab=` and doesn't add a history entry.
- [ ] Reloading `/log?tab=water` stays on Water.
- [ ] The sidebar `Log`, the tab bar `+`, both Today entry points and `+ Log food` are links to the URLs in the table.
- [ ] On `/log`, the `+` button and the sidebar `Log` have `aria-current="page"`.
- [ ] X and `Escape` with no draft go back to the previous in-app page, or to `/` when there is none.
- [ ] Leaving with a basket item or a picked activity shows `Discard what you haven't logged?`, and with only water changed it doesn't.
- [ ] `Keep editing`, `Escape` and a backdrop click keep the draft and stay on `/log`. `Discard` completes the navigation that was stopped.
- [ ] Browser Back and sidebar links go through the same check.
- [ ] A successful log goes back with no dialog, and the new entry shows on Today.
- [ ] The recipe ingredient editor, the When picker, the activity estimate and water work exactly as before.
- [ ] No browser dialog opens.
- [ ] `pnpm lint`, `pnpm typecheck` and `pnpm test` pass.
- [ ] `pnpm test:e2e` passes, including the new `features/log-page.spec.ts` and the updated `quick-log.spec.ts`, `my-foods.spec.ts` and `screens.spec.ts`.

## Decisions

- **Yes:** a page instead of a modal. SPEC 12 opens a photo viewer from Quick log rows, and `useModal` can't stack modals. A page also gets a URL and more room on phones.
- **No:** a second modal layer or stacked modals. It changes `useModal` for every caller to solve one screen's problem.
- **Yes:** `/log?tab=…`, one page. The tabs share the When picker and the pinned bar, and the query survives reloads and links.
- **No:** `/log/food`, `/log/activity` and `/log/water`. They split one component into three routes for no gain.
- **Yes:** `replace` when switching tabs. Back should leave the page, not step through tabs.
- **Yes:** inside the app layout. The rest of the app stays one tap away, and the tab bar's `+` shows where you are.
- **No:** full screen with no navigation. It feels like the modal again, without a way out besides X.
- **Yes:** going back to where the user came from. It is what closing the modal did. `/` is the fallback for a direct visit.
- **Yes:** ask before leaving with a basket item or a picked activity. Leaving a page is easier to do by accident than closing a modal.
- **No:** counting water or a changed time as a draft. Water always has a value, so the dialog would show every time.
- **No:** keeping the draft in `useState` across pages. The user chose to be asked instead, which keeps one clear rule: what isn't logged is discarded.
- **Yes:** an in-page dialog. The app never opens browser dialogs.
- **No:** `beforeunload`. It can only show the browser's native dialog. A reload loses the draft, as it does today.
- **Yes:** real `NuxtLink`s for the entry points. They support middle-click and open-in-new-tab, and `useQuickLogLauncher` goes away.
- **No:** keeping `openQuickLog()` as a wrapper around `navigateTo`. It keeps buttons where links belong.

## Risks

| Risk | Mitigation |
| --- | --- |
| On phones, the pinned bottom bar and the tab bar stack and take too much height. | The pinned bar sits above the tab bar, and the `log-phone` screenshot checks it. If it's too tall, the bar's goal impact row collapses on phones in a follow-up. |
| The route guard also fires on the page's own `?tab=` changes and blocks tab switches. | The guard ignores navigations that stay on `/log`. A Vitest case and the E2E tab-switch case cover it. |
| `history.state.back` is missing after a reload, so X sends the user to `/` instead of where they were. | Accepted. `/` is a safe fallback, and the case is in the E2E spec. |
| Existing E2E specs assume a `dialog` named `Log`. | Step 5 changes `openQuickLog` and every assertion on that dialog in one place. |

## What is **not** in this spec

- Changes to what the Quick log does or shows.
- Ingredients from the API, portions and photos (SPEC 12).
- A prompt on reload or tab close.
- Keeping the draft after leaving.
- Deep links that preselect a food, an activity or a meal.

Each one of those, if it lands, goes in its own spec.
