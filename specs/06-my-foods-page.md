# SPEC 06 — My foods page

> **Status:** Approved
> **Depends on:** SPEC 04, SPEC 05
> **Date:** 2026-10-19
> **Objective:** Add a `/food/my-foods` page that lists the user's custom ingredients, filters them by category, and lets the user edit or delete each one.

## Why this spec exists

SPEC 04 and SPEC 05 both deferred "editing a saved custom food" because no edit flow existed. SPEC 05 also deferred filtering by category. Today a custom food can only be created, never seen as a list, fixed or removed. This spec adds the one place where that happens. It reuses `AppIngredientForm` so that the create and edit forms cannot drift apart.

## Scope

**In:**

- A new route `/food/my-foods` (`app/pages/food/my-foods/index.vue`) that lists custom ingredients (`brand: 'My food'`), newest first.
- A "My foods" link in the `/food` button row, after "New recipe".
- A category filter on that page: a native `<select>` with `All categories`, the 13 SPEC 05 categories, and `No category`.
- A "New ingredient" button on the page. It opens the existing New ingredient modal, and the list reloads when the modal closes.
- An empty state when there are no custom foods, and a separate empty state when the filter matches nothing.
- Inline delete with a confirmation inside the row (no browser dialogs).
- A new edit route `/food/my-foods/[id]` (`app/pages/food/my-foods/[id].vue`) that renders `AppIngredientForm` in edit mode, prefilled, with a "Save changes" button.
- An edit mode for `useIngredientForm` and `AppIngredientForm`.
- New `foodService` functions: `getMyFoods`, `getMyFood`, `updateFood` and `deleteFood`.
- A new mock file, `app/services/mocks/myFoods.ts`, with 4 seeded custom ingredients.
- A new composable file, `app/composables/useMyFoods.ts`, with `useMyFoods` (list, filter, delete) and `useMyFood` (one food for the edit page).
- Vitest coverage for the service functions, `useMyFoods` and the `useIngredientForm` edit mode.
- A Playwright feature spec with screenshots (`tests/e2e/features/my-foods.spec.ts`).

**Out of scope (for future specs):**

- Saved recipes on this page, and editing or deleting recipes.
- Catalog ingredients on this page, and editing catalog items.
- A category filter in the Quick log or in the recipe builder's picker.
- A name search on the My foods page.
- Changing saved recipes or past log entries when a custom food is edited or deleted.
- Undo after delete, and a toast component.
- Bulk select or bulk delete.
- Sorting options other than newest first.
- Persistence across reloads, and a backend endpoint for custom foods.

## Data model

### Types (`app/types/food.ts`)

```ts
/** The My foods page filter: every food, one category, or foods saved without a category. */
export type MyFoodsFilter = 'all' | 'none' | IngredientCategory
```

`FoodItem` and `NewFoodInput` are not changed.

### Seed data (`app/services/mocks/myFoods.ts`, new)

```ts
/** Custom ingredients as the API would return them; `foodService` builds them with `buildFood`. */
export interface MockCustomFood extends NewFoodInput { id: string }
export const MY_FOODS: MockCustomFood[] = [/* … */]
```

| Id | Name | Per | kcal | P / C / F | Price | Category |
| --- | --- | --- | --- | --- | --- | --- |
| `myfood_protein_bar` | Homemade protein bar | 1 piece | 210 | 15 / 22 / 7 | 1.2 | `other` |
| `myfood_sourdough` | Bakery sourdough | 100 g | 260 | 9 / 51 / 2 | 0.8 | `grains` |
| `myfood_salsa_verde` | Salsa verde | 100 g | 45 | 1 / 8 / 1 | — | `condiments` |
| `myfood_pesto` | Basil pesto | 100 g | 430 | 5 / 6 / 43 | — | — |

The seed covers priced, unpriced, categorized and uncategorized foods. The names avoid the search terms that existing e2e specs type (`tahini`, `skyr`, `whey`, `oats`, `chicken`, `rice`, `bowl`, `boiled`, `ch`, `cyc`).

### `foodService` (`app/services/foodService.ts`)

- `myFoods` starts as `[...RECIPES.map(recipeToFood), ...MY_FOODS.map(f => buildFood(f, f.id))]`.
- `getMyFoods(): Promise<FoodItem[]>` returns the custom ingredients in `myFoods` (no `recipe`), newest first, as clones.
- `getMyFood(id): Promise<FoodItem | null>` returns that custom ingredient, or `null` when the id is unknown or belongs to a recipe.
- `updateFood(id, input: NewFoodInput): Promise<FoodItem>` replaces the food in place with `buildFood(input, id)`. It keeps the id and the position in `myFoods`. It throws when `getMyFood(id)` would return `null`.
- `deleteFood(id): Promise<void>` removes the custom ingredient from `myFoods` and its id from `recentIds`. It throws for an unknown id or a recipe id.
- Saved recipes and `foodLog` entries are never touched by `updateFood` or `deleteFood`.

### `useIngredientForm` (`app/composables/useIngredientForm.ts`)

- The signature becomes `useIngredientForm(initialName = '', editing?: FoodItem)`. Existing callers do not change.
- When `editing` is set, `newFood` starts from `foodToForm(editing)`:
  - `name`, `unit` and `category` (`''` when it has none) are copied;
  - `per`, `kcal`, `p`, `c` and `f` are copied with `String(n)`;
  - `price` is copied with `price.toFixed(2)`, or `''` when it has none.
- A new `save()` calls `foodService.updateFood(editing.id, parsedFood)` in edit mode and `foodService.createFood(parsedFood)` otherwise. `create` stays as an alias of `save`, so current callers and tests keep working.
- `missing`, `priceInvalid` and `parsedFood` behave the same in both modes. Clearing the price or picking `No category` removes that field from the food, because `buildFood` rebuilds the food from the input.

### `AppIngredientForm` (`app/components/app/IngredientForm.vue`)

- A new optional prop, `food?: FoodItem`. When it is set, the form is in edit mode and passes it to `useIngredientForm`.
- In edit mode it emits `updated: [food: FoodItem]` instead of `created`.
- In edit mode, the name input gets focus on mount.
- The button label still comes from `submitLabel`. While saving it reads `Saving…`, as it does today.

### `useMyFoods` (`app/composables/useMyFoods.ts`, new)

- `useMyFoods()` loads the list through `useServiceState('my-foods', foodService.getMyFoods)` and returns:
  - `foods`, `pending`;
  - `filter: Ref<MyFoodsFilter>`, which defaults to `'all'`;
  - `filtered`: `foods` narrowed by `filter`. `'none'` keeps foods without a `category`;
  - `refresh()`, which reloads `foods` from the service;
  - `remove(id)`, which calls `foodService.deleteFood` and then `refresh()`;
  - `deletingId: Ref<string | null>`, which is set while `remove` runs.
- `useMyFood(id)` loads one food with `foodService.getMyFood` and returns `food: Ref<FoodItem | null>` plus `pending`.
- `updateFood` and `deleteFood` are called only from composables. Components never import `~/services/*`.

### Display rules

- **`/food` button row:** a `My foods` `NuxtLink` to `/food/my-foods`, after `New recipe`, styled with `btnCls`.
- **Page header:** a `← Food` back link to `/food`, the title `My foods`, and a `New ingredient` button that calls `open('ingredient')`. When the modal closes (`current` becomes `null`), the page calls `refresh()`.
- **Filter:** a block with the SPEC 05 field wrapper, labeled `Category`. It holds a native `<select>` with `All categories` (`'all'`), the 13 `CATEGORIES` in order, then `No category` (`'none'`). Next to it, a count reads `{n} foods` (or `1 food`) for `filtered`.
- **Row:** the name on the first line. The meta line is `{serving}{ · category label} · {kcal} kcal{ · $X.XX}`, the same format as the SPEC 05 saved card. On the right sit an `Edit` link to `/food/my-foods/{id}` and a `Delete` button. Their accessible names are `Edit {name}` and `Delete {name}`.
- **Inline delete confirm:** pressing `Delete` swaps that row's actions for the text `Delete {name}?`, a `Delete` button in the coral accent, and a `Cancel` button. Focus moves to `Cancel`. Only one row can be confirming at a time. While deleting, the button reads `Deleting…` and is disabled. `Cancel` or `Esc` restores the row and puts focus back on its `Delete` button. After a delete, focus moves to the next row's `Delete`, else the previous row's, else the filter select.
- **Empty states:**
  - No custom foods: `No custom foods yet.` with a `New ingredient` button.
  - The filter matches nothing: `No foods in {label}.` (or `No foods without a category.`) with a `Show all` button that sets the filter to `'all'`.
- **Edit page:** a `← My foods` back link, the title `Edit {name}`, and `AppIngredientForm` with `:food` and `submit-label="Save changes"`. On `updated`, it navigates to `/food/my-foods`. While loading, the form is not rendered. If `getMyFood` returns `null`, the page shows `This food doesn't exist anymore.` with a link back to `/food/my-foods`.
- Both new pages use `definePageMeta({ tab: 'food' })`.

## Implementation plan

1. **Seed + service.** Add `MyFoodsFilter` to `app/types/food.ts`. Create `app/services/mocks/myFoods.ts` with the seed table. Add `getMyFoods`, `getMyFood`, `updateFood` and `deleteFood` to `foodService`, and seed `myFoods` from `MY_FOODS`. Add `tests/nuxt/foodService.test.ts`. It covers:
   - `getMyFoods` returns the 4 seeds, newest first, and no recipes;
   - `getMyFood` returns `null` for a recipe id and an unknown id;
   - `updateFood` keeps the id and position, and drops `price` / `category` when the input has none;
   - `deleteFood` removes the food from `getMyFoods`, `searchFoods(…, 'myfoods')`, `searchFoods(…, 'recent')` and `getIngredientOptions`;
   - `updateFood` and `deleteFood` throw for a recipe id.

   No UI changes yet. The seeds already show up in the Quick log "My foods" tab and the recipe picker.
2. **Form edit mode (composable).** Add `editing`, `foodToForm` and `save` to `useIngredientForm`, and keep `create` as an alias. Extend `tests/nuxt/useIngredientForm.test.ts`. It covers:
   - prefilled text for `myfood_protein_bar` (`price: '1.20'`, `category: 'other'`, `unit: 'piece'`);
   - an uncategorized, unpriced food prefills `''` for both;
   - `save()` in edit mode calls `updateFood` with the id, and `create()` without `editing` still calls `createFood`.
3. **`useMyFoods` + `useMyFood`.** Create `app/composables/useMyFoods.ts`. Add `tests/nuxt/useMyFoods.test.ts`. It covers:
   - each filter value: `'all'` → 4, `'grains'` → 1, `'none'` → 1 (`Basil pesto`), `'fruit'` → 0;
   - `remove` drops the food from `foods`, and `deletingId` is set while the call runs.
4. **List page.** Create `app/pages/food/my-foods/index.vue` with the header, rows (Edit links not wired yet) and the "no custom foods" empty state. Add the `My foods` link to `app/pages/food/index.vue`. The `New ingredient` button opens the modal, and the list refreshes when the modal closes.
5. **Filter.** Add the Category select, the count and the "filter matches nothing" empty state.
6. **Inline delete.** Add the row confirm, the focus handling and `Esc`, following the Display rules.
7. **Edit page.** Add the `food` prop, the `updated` emit and the edit-mode focus to `AppIngredientForm`. Create `app/pages/food/my-foods/[id].vue` with the loading, not-found and form states. Wire the rows' `Edit` links.
8. **E2E feature spec.** Add `tests/e2e/features/my-foods.spec.ts` (light and dark, `shot()`). It covers:
   - `/food` → `My foods` opens `/food/my-foods`, which lists the 4 seeds with `Bakery sourdough` showing `100 g · Grains & starches · 260 kcal · $0.80`;
   - the filter on `Grains & starches` shows 1 food, on `No category` shows `Basil pesto`, and on `Fruit` shows `No foods in Fruit.`, where `Show all` restores 4;
   - editing `Salsa verde` (kcal `50`, category `Vegetables`) returns to the list with the new meta line, and the Quick log "My foods" tab shows `50 kcal`;
   - clearing the price of `Homemade protein bar` removes `$1.20` from its row;
   - `Delete` → `Cancel` keeps the row, and `Delete` → `Delete` removes it from the list and from the recipe builder's picker;
   - a food created through the page's `New ingredient` button appears at the top of the list after `Done`;
   - `/food/my-foods/unknown` shows `This food doesn't exist anymore.`;
   - phone-width screenshots of the list (with a row confirming delete) and of the edit page.
9. **Checks.** `pnpm lint`, `pnpm typecheck`, `pnpm test` and `pnpm test:e2e` pass. The existing `quick-log.spec.ts`, `recipe-custom-ingredient.spec.ts`, `custom-ingredient-price.spec.ts`, `ingredient-categories.spec.ts` and `screens.spec.ts` still pass.

## Acceptance criteria

- [ ] `/food` shows a `My foods` link after `New recipe` that opens `/food/my-foods`.
- [ ] `/food/my-foods` lists only custom ingredients (no recipes, no catalog items), newest first, and lists the 4 seeds on a fresh load.
- [ ] Each row shows `{serving}{ · category} · {kcal} kcal{ · $X.XX}`, plus `Edit {name}` and `Delete {name}` controls.
- [ ] The Category select offers `All categories`, the 13 categories in SPEC 05 order, and `No category`. Each choice narrows the list and updates the `{n} foods` count.
- [ ] A filter with no matches shows `No foods in {label}.` (or `No foods without a category.`), and `Show all` resets the filter to `All categories`.
- [ ] With no custom foods, the page shows `No custom foods yet.` and a `New ingredient` button.
- [ ] A food created from the page's `New ingredient` modal is in the list once the modal closes.
- [ ] `Delete` asks `Delete {name}?` inside the row. `Cancel` and `Esc` keep the food, and confirming removes it. No browser dialog opens.
- [ ] A deleted food no longer appears in the list, the Quick log (All, Recent and My foods tabs) or the recipe builder's picker.
- [ ] `/food/my-foods/{id}` shows the form prefilled with the food's name, amount, unit, macros, price (`1.20` format) and category, and a `Save changes` button.
- [ ] Saving an edit returns to `/food/my-foods` with the updated row, and the Quick log and recipe picker show the new values.
- [ ] Clearing the price or choosing `No category` while editing saves the food with no `price` / `category` key.
- [ ] The edit form blocks saving with the same `missing` sentence and price error as the create form.
- [ ] `/food/my-foods/{unknown or recipe id}` shows `This food doesn't exist anymore.` with a link back to the list.
- [ ] Saved recipes and today's log entries are unchanged after a custom food they use is edited or deleted.
- [ ] The New ingredient modal and the recipe builder's create form work exactly as before this spec.
- [ ] No component imports `~/services/*` or `~/services/mocks/*`.
- [ ] `pnpm lint`, `pnpm typecheck` and `pnpm test` pass.
- [ ] `pnpm test:e2e` passes, including the new `features/my-foods.spec.ts` and the existing quick-log, recipe, price, category and screens specs.

## Decisions

- **Yes:** category filtering lives in this spec, but only on the My foods page. It is a small select over a list this spec builds anyway.
- **No:** category filters in the Quick log or the recipe picker. They change two existing, busy screens and deserve their own spec.
- **Yes:** a route, `/food/my-foods`. It uses the "My foods" name the UI already shows (saved card, Quick log tab), and it gets a stable URL.
- **No:** `/food/ingredients`. That name suggests the catalog is listed too.
- **No:** a My foods modal. The edit form would have to fit inside the modal, and `useModal` cannot pass a food id.
- **Yes:** custom ingredients only. Recipes live in `myFoods` too, but editing one means the recipe builder.
- **No:** listing recipes with delete only. A half-supported item type on the page would confuse users.
- **Yes:** editing on its own route, `/food/my-foods/[id]`, that reuses `AppIngredientForm`. Create and edit share one form and one set of validation rules. The route also avoids adding parameters to `useModal`.
- **No:** inline row editing. The full form does not fit in a list row on phones.
- **Yes:** `useIngredientForm` gains an optional `editing` argument and a `save()`, and keeps `create` as an alias. Existing callers and tests do not change.
- **Yes:** edits and deletes leave saved recipes and past log entries untouched. Recipes already store copies of their ingredients, and logs store macros. History should not change after the fact.
- **No:** updating saved recipes on edit, or blocking delete while a recipe uses the food. It means a reference model that recipes do not have today.
- **Yes:** an inline confirm inside the row. It avoids browser dialogs, works by keyboard, and needs no new component.
- **No:** delete with an Undo notice. The app has no toast component yet.
- **No:** a confirmation modal. Same `useModal` id problem as editing in a modal.
- **Yes:** 4 seeded custom foods in `app/services/mocks/myFoods.ts`, following the one-mock-file-per-endpoint convention. Without them the page starts empty on every load. The seeds cover each price and category combination for tests and screenshots.
- **Yes:** a native `<select>` with `All categories`, the 13 categories and `No category`. It matches the SPEC 05 form field and stays on one row on phones. `No category` mirrors the "blank means not chosen" rule from SPEC 05.
- **No:** chips for the categories in use. They wrap onto several rows and shift when a food is deleted.
- **No:** a name search on the page. The list is short, and the Quick log already searches.
- **Yes:** `deleteFood` also removes the id from `recentIds`. The Recent tab already skips missing ids, but leaving a dead id behind would be misleading state.

## Risks

| Risk | Mitigation |
| --- | --- |
| The seeded foods change the results of existing e2e specs (Quick log tabs, recipe picker counts). | The seed names avoid every search term those specs type. Step 9 runs them, and assertions are updated only where a count or list legitimately grew. |
| A fifth button in the `/food` row breaks the 2-column phone grid (one button alone on a row). | The phone screenshot covers `/food`. If the row looks unbalanced, `+ Log food` spans both columns on phones. |
| The list does not refresh after the modal creates a food, because the list state comes from `useServiceState` and is loaded once. | The page calls `refresh()` when the modal closes. An e2e case covers it. |
| The edit page loads a stale food if the list state is shared and was changed elsewhere. | `useMyFood` always fetches from the service. It does not read from the `my-foods` state. |
| The row's actions plus the inline confirm text overflow on phones for long names. | The name truncates, and the confirm row wraps under the name on phones. A phone screenshot covers a row that is confirming delete. |
| State lives in memory, so edits and deletes are lost on reload. | Accepted. This is the same as every other mock in the app until a backend exists. It is listed as out of scope. |

## What is **not** in this spec

- Recipes or catalog items on the My foods page.
- Category filters in the Quick log or the recipe picker.
- A name search on the My foods page.
- Updating saved recipes or past logs after an edit or delete.
- Undo, toasts, bulk actions or extra sort orders.
- Persistence across reloads, or a backend for custom foods.

Each one of those, if it lands, goes in its own spec.
