# SPEC 12 — Ingredients API

> **Status:** Draft
> **Depends on:** SPEC 03, SPEC 04, SPEC 05, SPEC 06, SPEC 11
> **Date:** 2026-11-06
> **Objective:** Replace the mocked ingredient catalog and custom foods with the backend's ingredient search, detail and user-ingredient CRUD endpoints, with macros per 100 g, gram portions that can be picked when logging or building a recipe, and credited photos.

## Why this spec exists

Backend SPECs 15–18 serve a real catalog of 219 USDA ingredients, plus each user's own private ingredients. The frontend still runs on 50 mock ingredients in `app/services/mocks/ingredients.ts` and 4 seeded custom foods in `app/services/mocks/myFoods.ts`.

The API's model differs from the mocks in ways the UI can't hide:

| | Backend | Frontend today |
| --- | --- | --- |
| Macros | Per 100 g (`per_100g`), with `fiber` nullable | Per `per` of `unit` (`g`, `ml`, `piece`, `serving`) |
| Portions | 0–10 `{ key, label, grams }` per ingredient | One `pieceName` |
| Category | Required, same 13 keys | Optional on custom foods |
| Brand | None. `is_mine` marks the user's own | `brand`, with `My food` for custom foods |
| Search | `?search=` needs 3–100 characters. There is no browse | Every item, filtered locally |
| User's list | `GET /my-ingredients`, paginated, by name | Every custom food, newest first |
| Prices | None yet (backend SPEC 24 is a Draft) | `price` on catalog and custom foods |
| Photos | 1–3 Wikimedia photos that must be credited | None |

This spec switches every ingredient read and write to the API and adapts the UI to that model. Recipes, the food log and Recent stay mocked, because their backend specs (19, 25) aren't built.

The response (SPEC 04 envelope, bearer token required):

```json
{
  "data": {
    "key": "egg_whole_hard_boiled",
    "name": "Egg, whole, hard-boiled",
    "category": "eggs",
    "is_mine": false,
    "per_100g": { "kcal": 155, "protein": 12.6, "carbs": 1.12, "fat": 10.6, "fiber": 0 },
    "portions": [
      { "key": "large", "label": "1 large egg", "grams": 50 },
      { "key": "cup_chopped", "label": "1 cup, chopped", "grams": 136 }
    ],
    "photos": [
      {
        "url": "https://commons.wikimedia.org/wiki/Special:FilePath/Boiled_Egg_-_Crossection.jpg?width=960",
        "thumbnail_url": "https://commons.wikimedia.org/wiki/Special:FilePath/Boiled_Egg_-_Crossection.jpg?width=330",
        "license": "CC BY-SA 2.0",
        "license_url": "https://creativecommons.org/licenses/by-sa/2.0",
        "author": "Ramesh NG",
        "credit_url": "https://commons.wikimedia.org/wiki/File:Boiled_Egg_-_Crossection.jpg"
      }
    ]
  }
}
```

## Prerequisite: backend branch

Backend SPECs 15–18 are not merged to the backend's `master`. This spec is implemented against the backend's `spec-18-user-ingredients` branch:

- `../humanOS-backend` is checked out on `spec-18-user-ingredients`, with the catalog migrated and seeded.
- `pnpm gen:api` reads `docs/openapi/v1.json` from that checkout.
- `pnpm test:e2e` runs against that backend.

## Scope

**In:**

- `foodService` on the API:
  - `searchIngredients(query)` on `GET /v1/nutrition/ingredients?search=`;
  - `getMyFoods(page)` on `GET /v1/nutrition/my-ingredients`;
  - `getMyFood(key)` on `GET /v1/nutrition/ingredients/{key}`;
  - `createFood`, `updateFood` and `deleteFood` on `POST`, `PATCH` and `DELETE /v1/nutrition/ingredients`.
- A `PATCH` method on `api()`.
- `FoodItem` per 100 g, with `isMine`, `fiber`, `portions` and `photos`. `brand` and `pieceName` are removed.
- Logging and recipe lines take an amount in grams or in one of the ingredient's portions, picked from a `<select>` next to the stepper.
- The New / Edit ingredient form per 100 g, with a required category, optional fiber, an editable portions list and API validation errors.
- Quick log tabs become All, Recent and My foods. Verified is removed. All needs 3 letters.
- The recipe builder's picker searches the API, with the same 3-letter rule.
- The My foods page loads 100 at a time, by name, with `Load more`, plus loading, error and retry states. The `No category` filter is removed.
- Prices move to an in-memory mock store keyed by ingredient key, `app/services/mocks/prices.ts`, per 100 g.
- Thumbnails in the `/log` food results, the recipe picker and My foods rows. Tapping one opens a photo viewer with credit.
- `app/components/app/PhotoGallery.vue`, extracted from `modal/ExercisePhotos.vue` and used by both photo viewers.
- Deleting `app/services/mocks/ingredients.ts` and `app/services/mocks/myFoods.ts`. Seeded recipes keep their own ingredient copies.
- Vitest coverage for the mapping, the portion maths, the form, `useFoodSearch`, `useMyFoods` and the gallery.
- The ingredient-related Playwright feature specs rewritten for real catalog data, with screenshots.

**Out of scope (for future specs):**

- Recipes, the food log and Recent on the API (backend SPECs 19, 25).
- Prices on the API (backend SPEC 24), and pricing catalog ingredients from the UI.
- Photo uploads for the user's own ingredients (backend SPEC 22).
- The detail endpoint's `nutrients` list and `source`, or an ingredient detail screen.
- Spanish names and search (the backend's language spec).
- Copying a catalog ingredient into My foods.
- A category filter in `/log` or the recipe picker.
- Converting an amount when the unit changes.

## Data model

### Generated types (`app/types/api.generated.ts`)

Run `pnpm gen:api` against the backend branch. It adds `IngredientResource`, `IngredientPortionResource`, `IngredientPhotoResource` and the `/v1/nutrition/*` operations. Nothing is edited by hand.

### `api` (`app/services/api.ts`)

- `ApiOptions.method` gains `'PATCH'`.

### Types (`app/types/food.ts`)

```ts
export interface IngredientPortion {
  key: string
  label: string
  grams: number
}

export interface FoodPhoto {
  url: string
  thumbnailUrl: string
  license: string | null
  licenseUrl: string | null
  /** `null` for CC0 and public domain. */
  author: string | null
  creditUrl: string | null
}

/** `g` for ingredients, `serving` for recipes. */
export type PortionUnit = 'g' | 'serving'

export interface FoodItem extends Macros {
  /** The API `key` for ingredients (`egg_whole_hard_boiled`, `u_01jc…`), `recipe_…` for mocked recipes. */
  id: string
  name: string
  serving: string
  /** 100 for ingredients, 1 for recipes. */
  per: number
  unit: PortionUnit
  step: number
  /** True for the user's own ingredients and for recipes. */
  isMine: boolean
  /** Grams per 100 g. `null` means no data, left out of totals. Absent on recipes. */
  fiber?: number | null
  /** `[]` on recipes and on ingredients without portions. */
  portions: IngredientPortion[]
  /** In API order; the first is the thumbnail. `[]` on recipes and user ingredients. */
  photos: FoodPhoto[]
  recipe?: { servings: number, ingredients: RecipeIngredient[] }
  /** USD per 100 g, from the mock price store. Absent when unpriced. */
  price?: number
  /** Set on every ingredient, absent on recipes. */
  category?: IngredientCategory
}

/** `amount` of `item`: a count of `portion` when set, otherwise in the item's unit. */
export interface RecipeIngredient {
  item: FoodItem
  amount: number
  /** A key from `item.portions`. */
  portion?: string
}

export interface FoodLogEntry {
  item: FoodItem
  amount: number
  portion?: string
  ingredients?: RecipeIngredient[]
}

export interface LoggedIngredient {
  ingredientId: string
  name: string
  amount: number
  unit: PortionUnit
  portion?: string
}

/** What the form sends. Macros are per 100 g. */
export interface NewFoodInput {
  name: string
  category: IngredientCategory
  kcal: number
  p: number
  c: number
  f: number
  fiber: number | null
  /** `key` is set on portions that already exist, so an edit keeps them. */
  portions: { key?: string, label: string, grams: number }[]
  /** USD per 100 g. */
  price?: number
}

/** One page of the user's ingredients, and whether another page follows it. */
export interface FoodPage {
  items: FoodItem[]
  hasMore: boolean
}

export type FoodSearchTab = 'all' | 'recent' | 'myfoods'

export type MyFoodsFilter = 'all' | IngredientCategory
```

- `brand` and `pieceName` are removed. Rows use `isMine` and `recipe` instead of `brand`.
- `FoodSearchTab` loses `'verified'`, and `MyFoodsFilter` loses `'none'`.
- `id` keeps its name, because recipes share `FoodItem` and have no API key yet.

### Amounts (`app/utils/logging.ts`, `app/utils/prices.ts`)

- A new `gramsOf(item, amount, portion?)` gives `amount × portion.grams` when the portion is set, and otherwise `amount`, in the item's unit.
- `scaleFood`, `scalePrice` and `entryMacros` go through `gramsOf`, so macros and cost follow the picked portion.
- `formatPortion(item, amount, portion?)`:

| Case | Text |
| --- | --- |
| Grams | `150 g` |
| Portion | `2 × 1 large egg (100 g)`, with the label as written |
| Recipe | `1 serving`, `2 servings` |

- `recipePortion` scales `amount` and keeps `portion`.
- `AMOUNT_LIMITS` keeps `g: 5000`, keeps `ml: 5000` for water, adds `portion: 50`, and drops `piece`. The water stepper keeps using `ml`.
- The stepper steps by 10 in grams and by 1 in portions or servings. A typed amount can have one decimal, so `0.5 × 1 avocado` works.

### Units in the basket and recipe lines

- **Starting amount:** an ingredient with portions starts at `1 ×` its first portion. One without portions starts at `100 g`. Recipes start at 1 serving, as today.
- **Picker:** a native `<select>`, `aria-label="Unit for {name}"`, next to the stepper. It lists `g`, then each portion's label, in API order. It is hidden for recipes and for ingredients without portions.
- **Switching:** picking a portion sets the amount to `1`, and picking `g` sets it to `100`. Nothing is converted.
- **Where:** the `/log` basket and the recipe builder's ingredient lines. The `/log` recipe ingredient editor keeps each ingredient's unit and has no picker.
- **Adding again:** adding an ingredient already in a recipe steps it by one step of its current unit, as today.
- **Logged entry:** `LoggedFood.portion` holds the `formatPortion` text, so the log reads `Egg, whole, hard-boiled · 2 × 1 large egg (100 g)`.

### Price store (`app/services/mocks/prices.ts`, new)

```ts
/** USD per 100 g, by ingredient key. Stands in for backend SPEC 24. Starts empty: catalog ingredients are unpriced. */
export const INITIAL_PRICES: Record<string, number> = {}
```

- `foodService` keeps a module-scoped copy. It reads `price` from it when mapping, writes it on create and update, and removes it when the form's price is blank and on delete.
- Recipe cost and line costs keep working through `scalePrice`. Every catalog line is unpriced until backend SPEC 24.

### `foodService` (`app/services/foodService.ts`)

```ts
type IngredientResource = components['schemas']['IngredientResource']

/** Catalog and own ingredients matching `query` (3–100 characters), in the API's rank order. */
export function searchIngredients(query: string): Promise<FoodItem[]>

/** One page of the user's own ingredients, 100 per page, by name. */
export function getMyFoods(page = 1): Promise<FoodPage>

/** The user's ingredient, or null on 404 or when it isn't theirs. */
export function getMyFood(key: string): Promise<FoodItem | null>

export function createFood(input: NewFoodInput): Promise<FoodItem>
export function updateFood(key: string, input: NewFoodInput): Promise<FoodItem>
export function deleteFood(key: string): Promise<void>

/** The list a Quick log tab shows for `query`. */
export function searchFoods(query: string, tab: FoodSearchTab): Promise<FoodItem[]>
```

- **Mapping:** `toFood(resource)` sets:
  - `id` from `key`, `per: 100`, `unit: 'g'`, `step: 10` and `serving: '100 g'`;
  - `kcal`, `p`, `c` and `f` from `per_100g`, unrounded, with `fiber` as sent;
  - `isMine` from `is_mine`, and `category` as sent;
  - `portions` as sent, and `photos` with `thumbnail_url`, `license_url` and `credit_url` in camelCase;
  - `price` from the store.
- **Search:** `searchIngredients` calls `api('/v1/nutrition/ingredients', { query: { search } })` and keeps the API's order.
- **My foods:** `getMyFoods` sends `page` and `per_page: 100`. `hasMore` is `meta.current_page < meta.last_page`.
- **Detail:** `getMyFood` returns `null` on a 404, and when `is_mine` is false. Other errors are passed on.
- **Create:** `createFood` sends `name`, `category`, `kcal`, `protein`, `carbs`, `fat`, `fiber` and `portions` (`label`, `grams`).
- **Update:** `updateFood` sends every field, with `portions` as the full list and `key` on portions that already exist. The backend then keeps those portions, adds the new ones and removes the rest.
- **Delete:** `deleteFood` sends `DELETE`, then removes the price and any Recent copy.
- **Quick log tabs:**
  - `all`: the mocked recipes whose name matches, then `searchIngredients(query)`. Below 3 characters it is not called;
  - `myfoods`: the mocked recipes, newest first, then page 1 of `getMyFoods`, filtered locally with `matchesQuery`, with no minimum;
  - `recent`: in-memory copies, filtered locally.
- **Recent:** `addFoodsToLog` stores copies of the logged `FoodItem`s, newest first, at most 20. They replace `INITIAL_RECENT_FOOD_IDS`. Recent starts with the seeded recipes `overnight_oats` and `my_bowl`. `updateFood` replaces the user ingredient's copy in Recent.
- **Errors:** 401, 422, 5xx and network errors are passed on to the caller.
- **Removed:** `getIngredientOptions`, the `INGREDIENTS` and `MY_FOODS` imports, `customFoodIndex` and `findCustomFood`.
- **Recipes:** the mocked recipes stay in a module-scoped `recipes` array. `saveRecipe` stores each line's `portion`.

### Seeded recipes (`app/services/mocks/recipes.ts`)

- `MockRecipe.ingredients` becomes `RecipeIngredient[]`, with full `FoodItem` copies instead of `INGREDIENTS` ids.
- Each copy uses a catalog key and the per-100 g values from the backend's `database/data/ingredients/*.json`, with `portions: []` and `photos: []`.
- Amounts are converted to grams. Branded or missing items, such as `Dave's Killer Bread`, use the closest catalog entry.
- Recipe names and servings don't change. Per-serving macros change to whatever the real values give.

### `useFoodSearch` (`app/composables/useFoodSearch.ts`)

- `FOOD_SEARCH_TABS` is `All`, `Recent`, `My Foods`.
- It returns `query`, `tab`, `results`, `loading`, `failed`, `retry` and a new `needsMore`. `needsMore` is true on All while the trimmed query is under 3 characters.
- While `needsMore` is true, no request is sent and `results` is `null`.
- A failed request sets `failed` and keeps `query`. `retry()` runs the same search again.
- The existing request counter and the 200 ms debounce stay.

### `useRecipe` (`app/composables/useRecipe.ts`)

- `catalog`, `refreshCatalog` and `filteredCatalog` are replaced by `useFoodSearch`-style state: `query`, `results`, `loading`, `failed`, `retry` and `needsMore`, calling `foodService.searchIngredients`. Recipes aren't offered as ingredients.
- `addIngredient` uses the starting amount rule. A new `setUnit(index, portion | null)` applies the switching rule.

### `useIngredientForm` (`app/composables/useIngredientForm.ts`)

The form keeps raw text:

```ts
{ name: '', category: '' as IngredientCategory | '', kcal: '', p: '', c: '', f: '', fiber: '', price: '',
  portions: [] as { key?: string, label: string, grams: string }[] }
```

- **Missing sentence:** it asks for `a name`, `a category`, `calories`, `complete portions` (a portion row with no label or no grams) and `a valid price`. For example: `Add a name, a category and calories to save.`
- **Limits:** `kcal` is clamped to 900, and protein, carbs, fat and fiber to 100. Portion grams are clamped to 5000. Blank protein, carbs and fat count as 0, and a blank fiber is `null`.
- **Sum rule:** when protein, carbs and fat add up to more than 100, the form shows `Protein, carbs and fat can't add up to more than 100 g.` under the fat field and can't be saved. Fiber is outside the sum, as in the API.
- **Portions:** `addPortion()` appends an empty row, at most 10. `removePortion(i)` drops a row.
- **Edit mode:** `foodToForm` copies the portions with their `key`, `fiber: null` as `''`, and the price with `toFixed(2)`.
- **Save:** `save()` calls `createFood` or `updateFood`.
  - On a 422, `fieldErrors` gets `toFieldErrors(err, { protein: 'p', carbs: 'c', fat: 'f' })`, and any `portions.*` key goes under `portions`.
  - Any other failure sets `formError` to `toFormMessage(err)`.
  - The typed values stay.
- It returns `newFood`, `missing`, `sumInvalid`, `priceInvalid`, `parsedFood`, `creating`, `fieldErrors`, `formError`, `addPortion`, `removePortion`, `save` and `create`.

### `useMyFoods` (`app/composables/useMyFoods.ts`)

- `useMyFoods()` returns:
  - `foods`, `loading`, `failed` and `retry`;
  - `hasMore`, `loadingMore`, `loadMoreFailed` and `loadMore`;
  - `filter`, `filtered` and `refresh` (page 1 again);
  - `remove(key)` and `deletingId`.
- `loadMore` behaves like SPEC 09: it appends pages, keeps the list when a page fails, requests the same page again on retry, and ignores a call while one is in flight.
- `remove` calls `deleteFood` and drops the row locally, with no refetch.
- `useMyFood(key)` returns `food`, `pending`, `failed` and `retry`. A 404 gives `food: null` with `failed: false`.

### Photos

- **`app/components/app/PhotoGallery.vue` (new):**
  - Props: `photos: { src: string, alt: string }[]` and `v-model` for the index.
  - It holds the image, the arrows, the swipe, the arrow keys and the thumbnail strip, moved from `ExercisePhotos.vue`.
  - A scoped slot, `credit`, gets `{ index }` so each viewer renders its own credit line.
- **`ExercisePhotos.vue`:** uses `PhotoGallery`. Its subtitle, captions and credit line don't change.
- **`useFoodPhotos` and `modal/FoodPhotos.vue` (new):**
  - `ModalKey` gains `'foodPhotos'`. `openPhotos(food)` opens the first photo.
  - The title is the food's name. It has no subtitle and no captions.
  - The credit line follows the current photo: `Photo: {author} · {license} · Source`.
  - The author is left out when `null`. The license links to `licenseUrl` and `Source` links to `creditUrl`, each only when set.
- **Thumbnail:** a 40 px rounded `<button>` with `aria-label="Photos of {name}"` and `<img src="{thumbnailUrl}" alt="" loading="lazy">`. It sits at the left of a row and is a separate tap target from the row's add or edit action. A food with no photos has no thumbnail and no empty space.
- **Where:** `/log` food results, recipe builder picker results and My foods rows. Not in the basket, recipe lines or the log.
- `/log` is a page (SPEC 11), so the modal opens over it and the basket stays.

### Display rules

**Row meta lines:**

| Where | Ingredient | Recipe |
| --- | --- | --- |
| `/log` results | `{My food · }{category} · 100 g · {kcal} kcal` | `Recipe · 1 serving · {kcal} kcal` |
| Recipe picker | `{My food · }{category} · 100 g · {kcal} kcal · {p}g protein · {c}g carbs{ · $X.XX}` | not listed |
| My foods | `{category} · 100 g · {kcal} kcal{ · 1 portion / {n} portions}{ · $X.XX}` | not listed |

- Values per 100 g are shown with `Math.round` for kcal, and 1 decimal for grams.
- `$X.XX` is the price per 100 g, shown only when set.

**`/log` food tab, results area, first matching row wins:**

| State | Shows |
| --- | --- |
| All, fewer than 3 letters | `Type at least 3 letters to search.` |
| Loading | `Searching…` |
| Failed | `Couldn't load foods.` and `Retry` in a `role="alert"` block |
| No results | `No foods match “{query}”`, as today |
| Results | Rows |

- The recipe picker uses the same states and texts. Its `+ Create "{query}"` button stays below them.

**New / Edit ingredient form (`AppIngredientForm`):**

Fields, in order:

- `Name`.
- `Category`, a `<select>` whose first option is `Choose a category`, disabled, then the 13 categories. There is no `No category` option.
- A `Per 100 g` heading, then `Calories`, `Protein (g)`, `Carbs (g)`, `Fat (g)` and `Fiber (g, optional)`.
- `Portions (optional)`. Each row has a label input (`aria-label="Portion {n} name"`, placeholder `1 bar`), a grams input (`aria-label="Portion {n} grams"`) and a `Remove portion {n}` button. `+ Add portion` follows, hidden at 10 rows.
- `Price (USD, per 100 g)`, optional, as today.

Behavior:

- The amount and unit inputs are removed.
- Field errors from the API show under their field in the coral accent. `formError` shows above the button in a `role="alert"` block.

**My foods page (`/food/my-foods`):**

- The list is in the API's order, by name.
- **States:**
  - `Loading your foods…` while the first page loads;
  - `Couldn't load your foods.` with `Retry` when it fails;
  - otherwise SPEC 06's empty states, without `No foods without a category.`
- **`Load more`:** below the list while `hasMore` is true. It reads `Loading…` while a page loads. A failed page shows `Couldn't load more foods.` and `Retry`, and the list stays.
- **Count:** `{n} foods` counts the loaded rows that match the filter.
- **Delete:** the inline confirm from SPEC 06. A failed delete keeps the row and shows `Couldn't delete {name}.` in the row.

**Edit page (`/food/my-foods/[id]`):**

- `[id]` is the ingredient key.
- **States:**
  - `This food doesn't exist anymore.` on a 404, as today;
  - `Couldn't load this food.` with `Retry` for other failures.

## Implementation plan

1. **Types from the backend.** Check out the backend branch, run `pnpm gen:api`, and add `'PATCH'` to `api()`. No visible change.
2. **Portion amounts.** Add `portions`, `photos` and `isMine` to `FoodItem`, with `[]`, `[]` and `brand === 'My food' || !!recipe` in the mocks. Add `portion` to the entry types, then `gramsOf`, and portion support in `scaleFood`, `scalePrice`, `formatPortion` and `recipePortion`. The app works as before. Vitest in `tests/nuxt/logging.test.ts` and `tests/nuxt/prices.test.ts`:
   - `2 × 1 large egg` of a 155 kcal / 100 g item scales to 155 kcal and reads `2 × 1 large egg (100 g)`;
   - `0.5 × 1 avocado` (201 g) gives 100.5 g;
   - grams and servings read as today;
   - `recipePortion` keeps `portion` when it scales.
3. **Price store.** Add `app/services/mocks/prices.ts` and read and write prices through it in `foodService`. Remove `price` from the mock data. Catalog items show no price from here on.
4. **Search on the API.** Add `toFood` and `searchIngredients`. Switch the All tab to the API with `needsMore`, `failed` and `retry`, and remove Verified. Switch the recipe picker to `searchIngredients`. Replace Recent ids with copies. Vitest in `tests/nuxt/foodService.test.ts`, with `api` mocked as in SPEC 09:
   - `search` is sent, and the API's order is kept;
   - the mapping from the egg response above, including camelCase photo fields and `fiber: null` kept;
   - All with a 2-letter query sends no request;
   - a rejected `api` call rejects `searchIngredients`.

   Add `tests/nuxt/useFoodSearch.test.ts` for `needsMore`, `failed`, `retry` and stale responses.
5. **My foods on the API.** Add `getMyFoods`, `getMyFood` and `deleteFood`, and switch `useMyFoods`, `useMyFood`, the My foods tab and the pages. Remove `'none'`. Extend `tests/nuxt/useMyFoods.test.ts`:
   - `page` and `per_page=100` are sent;
   - `loadMore` appends page 2;
   - a failed page keeps the list and retries the same page;
   - a failed first page sets `failed`, and `retry` loads it;
   - `remove` drops the row without a refetch;
   - `getMyFood` returns `null` on 404 and for `is_mine: false`.
6. **Form on the API.** Switch `useIngredientForm` and `AppIngredientForm` to the per-100 g model with category, fiber, portions and API errors. Add `createFood` and `updateFood`. Extend `tests/nuxt/useIngredientForm.test.ts`:
   - the missing sentence with no category;
   - clamping to 900 kcal and 100 g;
   - the sum error at 100.1 g, and no error with fiber 34 on top of 90;
   - an incomplete portion row blocks saving;
   - an edit prefills portions with keys, and `updateFood` gets them back;
   - a 422 on `fat` shows under `f`, and `portions.0.grams` shows under `portions`;
   - a 500 sets `formError`;
   - a blank price removes it from the store.
7. **Delete the mocks.** Delete `app/services/mocks/ingredients.ts` and `app/services/mocks/myFoods.ts`. Rewrite `app/services/mocks/recipes.ts` with ingredient copies. Narrow `PortionUnit` to `'g' | 'serving'`, and remove `brand`, `pieceName` and `getIngredientOptions`. Update `tests/nuxt/useRecipe.test.ts` and `tests/nuxt/categories.test.ts` where they import the mocks.
8. **Unit picker.** Add the starting amount rule, the `<select>` and the switching rule to the `/log` basket and the recipe builder lines, with `setUnit` in `useQuickLog` and `useRecipe`. Vitest:
   - an item with portions starts at `1 ×` the first one;
   - an item without portions starts at 100 g;
   - switching sets 1 or 100;
   - the basket's macros follow the portion;
   - a logged entry stores the `formatPortion` text.
9. **Photo gallery.** Move the gallery out of `ExercisePhotos.vue` into `AppPhotoGallery`. `tests/nuxt/ExercisePhotos.test.ts` passes unchanged.
10. **Food photos.** Add `useFoodPhotos`, `modal/FoodPhotos.vue`, `'foodPhotos'` and the thumbnails. Add `tests/nuxt/FoodPhotos.test.ts`:
    - the credit line with an author and both links;
    - the credit line with a `null` author and a `null` `licenseUrl`;
    - a food with no photos renders no thumbnail button.
11. **E2E feature specs.** Against the backend branch, light and dark, with `shot()`. Tests that create ingredients register their own user through `registerUser` and a new `createIngredient(user, body)` in `tests/e2e/api.ts`, so the shared user stays clean.
    - `quick-log.spec.ts` covers:
      - `eg` shows `Type at least 3 letters to search.`;
      - `egg` lists `Egg, whole, hard-boiled` with a thumbnail (screenshot `log-search`);
      - adding it starts at `1 × 1 large egg (50 g)`;
      - switching to `g` shows 100;
      - `2 × 1 large egg` logs `2 × 1 large egg (100 g)` with 155 kcal on Today;
      - `Beef chuck, braised` starts at 100 g with no unit picker (screenshot `log-basket-portions`).
    - `food-photos.spec.ts` (new) covers tapping the egg thumbnail on `/log`:
      - it shows `Photo: {author} · {license} · Source` for the first photo, with the author and license read from the API in setup, and working links;
      - arrows step through the photos;
      - `Escape` closes the viewer and the basket is unchanged (screenshot `food-photos`).
    - `my-foods.spec.ts` covers:
      - a user with 3 seeded ingredients sees them by name;
      - the category filter;
      - creating `Protein bar, chocolate` with a `1 bar` = 45 g portion, a fiber of 9 and a price of 1.20 (screenshot `ingredient-form-portions`);
      - editing it to rename the portion and add a second one;
      - deleting it;
      - a user with 101 ingredients, seeded through the API, sees `Load more`, and 101 rows after clicking;
      - `/food/my-foods/u_unknown` shows `This food doesn't exist anymore.`
    - `ingredient-categories.spec.ts` covers saving with no category: it shows the missing sentence, and `No category` isn't offered.
    - `custom-ingredient-price.spec.ts` and `ingredient-prices.spec.ts` cover:
      - a custom food priced at 1.20 per 100 g costs `$0.54` for `1 × 1 bar (45 g)` in a recipe;
      - a catalog line adds to the `Excludes {n} ingredients without a price` note.
    - `recipe-custom-ingredient.spec.ts`, `recipe-log-edit.spec.ts` and `recipe-page-mobile.spec.ts` use catalog names (`Banana`, `Avocado`, `Tofu, firm`) and the unit picker.
    - `screens.spec.ts` keeps passing.
12. **Checks.** `pnpm lint`, `pnpm typecheck`, `pnpm test` and `pnpm test:e2e` pass.

## Acceptance criteria

- [ ] `app/services/mocks/ingredients.ts`, `app/services/mocks/myFoods.ts`, `getIngredientOptions`, `FoodItem.brand` and `FoodItem.pieceName` no longer exist.
- [ ] Typing `eg` on the `/log` All tab shows `Type at least 3 letters to search.` and sends no request.
- [ ] Typing `egg` sends one `GET /v1/nutrition/ingredients?search=egg` with the bearer token, and lists `Egg, whole, hard-boiled` as `Eggs · 100 g · 155 kcal`.
- [ ] The Quick log tabs are All, Recent and My Foods, and Verified is gone.
- [ ] My Foods on `/log` lists the user's own ingredients from `GET /v1/nutrition/my-ingredients` and the mocked recipes, filtered with no minimum length.
- [ ] Adding `Egg, whole, hard-boiled` to the basket starts at `1 × 1 large egg`, worth 78 kcal.
- [ ] Its unit select lists `g`, `1 large egg` and `1 cup, chopped`. Picking `g` sets 100, and picking `1 cup, chopped` sets 1.
- [ ] `Beef chuck, braised` starts at 100 g and has no unit select.
- [ ] Logging `2 × 1 large egg` adds an entry reading `2 × 1 large egg (100 g)` with 155 kcal.
- [ ] The recipe builder's picker searches the API with the same 3-letter rule, and its lines have the unit select.
- [ ] The ingredient form has no amount or unit inputs, requires a category, and offers no `No category`.
- [ ] Protein, carbs and fat over 100 g in total shows the sum error and blocks saving. Fiber doesn't count toward it.
- [ ] Creating a food with a `1 bar` = 45 g portion sends `POST /v1/nutrition/ingredients`, and the food shows in My foods with `1 portion` in its meta line.
- [ ] Editing that food keeps the portion's `key` in the `PATCH` body, and a removed portion is left out of it.
- [ ] An API 422 shows its message under the matching field, and other failures show `Something went wrong. Try again.`, with the typed values kept.
- [ ] Deleting a food sends `DELETE` and removes it from My foods, `/log` My Foods and Recent.
- [ ] My foods lists by name, 100 at a time, with `Load more` while more pages exist.
- [ ] A failed first page and a failed next page show their error and `Retry`, and a retry recovers.
- [ ] `/food/my-foods/{unknown key}` shows `This food doesn't exist anymore.`
- [ ] A price typed on the form shows on the food and costs its recipe lines per 100 g. Catalog ingredients show no price.
- [ ] Catalog rows with photos show a 40 px thumbnail in `/log`, the recipe picker and My foods, and rows without photos show none.
- [ ] Tapping a thumbnail on `/log` opens the viewer with the author, the license linked to `licenseUrl` and a `Source` link to `creditUrl`. Closing it leaves the basket unchanged.
- [ ] The exercise photo viewer looks and works as before.
- [ ] Seeded recipes still load in My Foods and Recent, and can be logged.
- [ ] No component imports `~/services/*`.
- [ ] `pnpm lint`, `pnpm typecheck` and `pnpm test` pass.
- [ ] `pnpm test:e2e` passes against the backend's `spec-18-user-ingredients` branch, including the rewritten food feature specs, `features/food-photos.spec.ts` and `screens.spec.ts`.

## Decisions

- **Yes:** every ingredient read and write in one spec. Mixing the mock catalog with API foods would give two key formats and two macro models in one list.
- **No:** recipes, the food log and Recent on the API. Their backend specs aren't built. They keep copies of ingredients, so they work without ingredient ids.
- **Yes:** an in-memory price store keyed by ingredient key, per 100 g. The price field, line costs and recipe cost keep working, and backend SPEC 24 replaces one file.
- **No:** removing prices until SPEC 24. It would take away features that SPECs 03 and 04 shipped.
- **No:** hard-coding prices for 219 catalog keys. It is fake data to maintain. Catalog lines are unpriced until SPEC 24.
- **Yes:** a form per 100 g with a portions list. It maps 1:1 to the API, and portions are what labels list.
- **No:** typing macros for any amount and converting them. It hides the API's model and rounds twice.
- **Yes:** a required category, with no `No category`. The API requires it. SPEC 05's "blank means not chosen" rule and SPEC 06's `No category` filter go with it.
- **Yes:** All, Recent and My Foods tabs, with a 3-letter minimum on All. The API can't browse, and Verified meant "branded", which a USDA catalog doesn't have.
- **Yes:** picking grams or a portion in the basket and recipe lines. The user chose to keep it in this spec, not split it out.
- **Yes:** starting at `1 ×` the first portion. A portion is what people usually eat, and the API lists the common one first.
- **Yes:** resetting to 1 or 100 when the unit changes. It is predictable and avoids amounts like `2.3 × 1 large egg`.
- **No:** converting the amount to keep the grams.
- **Yes:** `2 × 1 large egg (100 g)`. It uses the label as written, without guessing plurals, and shows the grams the macros come from.
- **Yes:** a native `<select>`. It fits on phone rows, works by keyboard and matches the category select.
- **No:** chips. Up to 11 of them wrap onto several rows.
- **Yes:** keep the `id` name on `FoodItem`. Recipes share the type and have no API key yet. **No:** renaming it `key` as SPEC 09 did for exercises, which can wait for the recipes API.
- **Yes:** My foods by name, 100 per page, with `Load more`. It matches the API and SPEC 09. **No:** fetching every page up front.
- **Yes:** thumbnails now, in `/log`, the recipe picker and My foods, with a viewer that credits each photo. The Commons licenses require credit wherever a photo is shown.
- **Yes:** this spec depends on SPEC 11. Once `/log` is a page, the viewer modal opens over it without losing the basket.
- **Yes:** a shared `PhotoGallery` component. Exercises and foods get one gallery, and each viewer keeps its own credit line.
- **No:** a copied food gallery.
- **Yes:** 422 messages under their fields through `toFieldErrors`. The client clamps and checks the sum, but the API is the source of truth.
- **Yes:** E2E tests that write ingredients use their own users. The shared user would collect foods across runs.
- **Yes:** implement against the backend's `spec-18-user-ingredients` branch, as SPEC 09 did. See **Risks**.

## Risks

| Risk | Mitigation |
| --- | --- |
| `spec-18-user-ingredients` has no upstream, so this work depends on commits that exist on one machine. | Push the backend branch before starting. |
| Review of backend SPECs 15–18 changes the contract after this is built. | Run `pnpm gen:api` and `pnpm test:e2e` again once the backend merges. Typecheck catches field changes. |
| A search request on every keystroke after 3 letters. | The 200 ms debounce stays, and the request counter drops stale responses. |
| Recipe copies drift from the real catalog when it is reseeded. | Accepted. They are mocks until the recipes API, and they carry their own macros on purpose. |
| The My foods count and filter only see loaded pages. | Accepted. `Load more` stays visible, and most users have fewer than 100 foods. |
| Commons thumbnails load slowly or go missing. | `loading="lazy"`, and the backend's `ingredients:check-photos` command watches for broken links. A broken image keeps the row usable. |
| Old log entries and recipes keep units the app no longer has (`piece`, `ml`). | The mocks reset on reload, and step 7 rewrites the recipe seeds in grams. |
| Every catalog line is unpriced, so recipe cost mostly shows the unpriced note. | Accepted until backend SPEC 24. The price E2E cases use a custom food. |
| E2E tests depend on real catalog data, such as `Egg, whole, hard-boiled` and its photo credit. | They use stable seeded entries. The credit case reads the first photo's author from the API in setup instead of hard-coding it. |

## What is **not** in this spec

- Recipes, the food log and Recent on the API.
- Prices on the API, and pricing catalog ingredients.
- Photo uploads for the user's own ingredients.
- Micronutrients, the ingredient source, or a detail screen.
- Spanish names and search.
- Copying a catalog ingredient into My foods.
- Category filters in `/log` or the recipe picker.
- Converting amounts when the unit changes.

Each one of those, if it lands, goes in its own spec.
