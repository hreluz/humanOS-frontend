# SPEC 05 — Ingredient categories

> **Status:** Approved
> **Depends on:** SPEC 04
> **Date:** 2026-10-19
> **Objective:** Let users pick an optional category when they create a custom ingredient, tag every catalog ingredient with one, and show it on the saved card and in the recipe builder's picker rows.

## Scope

**In:**

- An `IngredientCategory` type with 13 fixed keys: 12 food groups plus `other`.
- An optional `category` on `FoodItem` and `NewFoodInput`.
- A new `app/utils/categories.ts` with the ordered `CATEGORIES` list and `categoryLabel`.
- A `category` for every record in `app/services/mocks/ingredients.ts`.
- An optional "Category" native `<select>` in `AppIngredientForm`, below the "Ingredient name" field. The form is used both in the New ingredient modal and in the recipe builder's create form.
- `buildFood` copies the category to the `FoodItem` when it is set.
- The New ingredient modal's "saved to My foods" card shows the category.
- `/food/recipes/new`, ingredient picker list: each categorized row shows the category label at the start of its meta line.
- Vitest coverage for `categories.ts`, `buildFood` and `useIngredientForm`.
- A Playwright feature spec with screenshots (`tests/e2e/features/ingredient-categories.spec.ts`).

**Out of scope (for future specs):**

- Filtering or grouping any list by category (picker chips, sections, Quick log tabs).
- A category in Quick log search rows, basket lines, recipe ingredient lines or the summary.
- A category on saved recipes (`recipeFood` sets none).
- Editing the category of a custom food after it is saved. No edit flow for custom foods exists.
- User-defined categories or free-text categories.
- More than one category per ingredient.
- A backend endpoint for categories or custom foods.

## Data model

### Types

```ts
// app/types/food.ts
export type IngredientCategory =
  | 'meat' | 'seafood' | 'eggs' | 'plant_protein' | 'dairy' | 'grains'
  | 'legumes' | 'vegetables' | 'fruit' | 'fats' | 'condiments' | 'supplements' | 'other'

export interface FoodItem extends Macros {
  // ...existing fields
  /** Food group. Set on every catalog item. Absent on custom foods saved without one, and on recipes. */
  category?: IngredientCategory
}

export interface NewFoodInput extends Macros {
  // ...existing fields
  /** Absent when the user left the select on "No category". */
  category?: IngredientCategory
}
```

### Labels (`app/utils/categories.ts`, new)

`CATEGORIES: { key: IngredientCategory, label: string }[]`, in this order (the order of the select):

| Key | Label |
| --- | --- |
| `meat` | Meat & poultry |
| `seafood` | Seafood |
| `eggs` | Eggs |
| `plant_protein` | Plant protein |
| `dairy` | Dairy |
| `grains` | Grains & starches |
| `legumes` | Legumes |
| `vegetables` | Vegetables |
| `fruit` | Fruit |
| `fats` | Fats & nuts |
| `condiments` | Condiments & sweeteners |
| `supplements` | Supplements |
| `other` | Other |

`categoryLabel(key: IngredientCategory): string` returns the label from `CATEGORIES`.

### Mock data

Every record in `INGREDIENTS` gets a `category`. The existing group comments stay.

| Category | Ids |
| --- | --- |
| `meat` | `chicken_boiled`, `chicken_grilled`, `chicken_raw`, `tj_chicken`, `chicken_thigh`, `beef_ground`, `sirloin`, `turkey_breast` |
| `seafood` | `salmon_baked`, `tuna_canned`, `shrimp` |
| `plant_protein` | `tofu` |
| `eggs` | `egg_boiled`, `egg_white` |
| `supplements` | `whey` |
| `dairy` | `yogurt_plain`, `fage_yogurt`, `cottage_cheese`, `milk_whole`, `cheddar`, `mozzarella` |
| `grains` | `oats`, `granola`, `rice_cooked`, `brown_rice`, `quinoa`, `barilla_spaghetti`, `dkb_bread`, `tortilla`, `sweet_potato` |
| `legumes` | `black_beans`, `chickpeas`, `lentils` |
| `vegetables` | `broccoli`, `spinach`, `greens`, `bell_pepper`, `tomato`, `onion`, `carrot`, `avocado` |
| `fruit` | `banana`, `apple`, `blueberries` |
| `fats` | `olive_oil`, `butter`, `peanut_butter`, `almonds` |
| `condiments` | `honey`, `soy_sauce` |

`other` has no catalog items. It exists for custom foods.

### `buildFood`

`buildFood` adds `category` to the food only when `input.category` is defined. A custom food saved without a category has no `category` key, as with `price` in SPEC 04.

### `useIngredientForm`

- `emptyFood()` gets `category: ''` (typed as `IngredientCategory | ''`).
- The category never adds to `missing`. Any value saves.
- `parsedFood` includes `category` when it is not `''`, and leaves it out otherwise.

### Display rules

- Form field: a block with the same `fieldCls` wrapper as "Ingredient name". The label reads `Category (optional)`. A native `<select>` spans the full width. Its first option is `No category` (value `''`, selected by default), followed by `CATEGORIES` in order. It uses the same text classes as the other inputs (16px on phones).
- Saved card (`ModalIngredient`): `{serving} · {category label} · {kcal} kcal · $X.XX`. When the food has no category, that part is left out. The price part follows the SPEC 04 rule.
- Picker row (`new.vue` line 149 today): `{My food · }{category label} · {serving} · {kcal} kcal · …`. The category comes after `My food` for custom foods and starts the line for catalog items. Rows without a category are unchanged.

## Implementation plan

1. **Type + labels.** Add `IngredientCategory` and `category?` to `FoodItem` and `NewFoodInput`. Create `app/utils/categories.ts` with `CATEGORIES` and `categoryLabel`. Add `tests/nuxt/categories.test.ts`. It covers:
   - 13 entries with unique keys, ending with `other`;
   - `categoryLabel('fats')` → `Fats & nuts`.

   No UI changes yet.
2. **Mock categories.** Add `category` to every record in `app/services/mocks/ingredients.ts`, following the Mock data table. Extend `tests/nuxt/categories.test.ts` with a check that every `INGREDIENTS` record has a category from `CATEGORIES`.
3. **`buildFood` + `useIngredientForm`.** Make `buildFood` copy `category`. Add `category` to `emptyFood()` and `parsedFood`. Extend `tests/nuxt/logging.test.ts` and `tests/nuxt/useIngredientForm.test.ts`. They cover:
   - `buildFood` with and without a category, checking that no `category` key exists when there is none;
   - the form with no category saves with no `category`;
   - the form with `dairy` gives `category: 'dairy'`;
   - the category never appears in `missing`.
4. **Form UI.** Add the Category select to `app/components/app/IngredientForm.vue`, following the Display rules.
5. **Saved card.** Show the category on the "saved to My foods" card in `app/components/modal/Ingredient.vue`.
6. **Picker rows.** Show the category in the picker meta line in `app/pages/food/recipes/new.vue`.
7. **E2E feature spec.** Add `tests/e2e/features/ingredient-categories.spec.ts` (light and dark, `shot()`). It covers:
   - the form shows `Category (optional)` with `No category` selected;
   - saving from the New ingredient modal with `Dairy` shows `Dairy` on the saved card;
   - saving with `No category` shows no category on the saved card;
   - in `/food/recipes/new`, searching `chicken` shows `Meat & poultry ·` at the start of the catalog row's meta line;
   - creating a categorized ingredient from the recipe builder shows `My food · Dairy ·` in its picker row;
   - a phone-width screenshot of the create form in the recipe builder.
8. **Checks.** `pnpm lint`, `pnpm typecheck`, `pnpm test` and `pnpm test:e2e` pass. The existing `recipe-custom-ingredient.spec.ts`, `ingredient-prices.spec.ts` and `custom-ingredient-price.spec.ts` still pass.

## Acceptance criteria

- [ ] `AppIngredientForm` shows a `Category (optional)` select below the name field, with `No category` selected by default and the 13 categories in the table order.
- [ ] Saving with `No category` creates a food with no `category` key, and the form saves exactly as before this spec.
- [ ] Saving with `Dairy` selected creates a food with `category: 'dairy'`.
- [ ] The category never blocks saving and never appears in the "Add … to save." sentence.
- [ ] Every record in `INGREDIENTS` has a `category` that matches the Mock data table.
- [ ] The New ingredient modal's saved card shows the category label after the serving for a categorized food, and no category for an uncategorized one.
- [ ] In `/food/recipes/new`, catalog picker rows start their meta line with the category label (e.g. `Meat & poultry · 100g · 150 kcal …`).
- [ ] In `/food/recipes/new`, a categorized custom food's picker row reads `My food · {label} · …`, and an uncategorized one is unchanged.
- [ ] Quick log search rows, recipe ingredient lines and the recipe summary show no category.
- [ ] No component imports `~/services/*` or `~/services/mocks/*` for categories.
- [ ] `pnpm lint`, `pnpm typecheck` and `pnpm test` pass.
- [ ] `pnpm test:e2e` passes, including the new `features/ingredient-categories.spec.ts` and the existing recipe and price specs.

## Decisions

- **Yes:** a finer, fixed set of 12 food groups plus `other`. It is precise enough to drive a filter later. Each catalog item fits exactly one.
- **No:** the 6 coarse groups from the mock comments. They lump meat, fish, eggs and whey together.
- **No:** free-text categories. Typos would split categories, and a filter could not rely on them.
- **Yes:** the category is optional, and blank means no category. This is the same pattern as the SPEC 04 price, so the form gets no extra friction.
- **No:** a required category or a default of `Other`. A default would hide whether the user actually chose one.
- **Yes:** `other` stays in the list even though blank exists. It lets a user say "this fits none of the groups", which differs from "not chosen".
- **Yes:** a native `<select>`. 13 options as chips would take several rows on phones and push the submit button down.
- **Yes:** stable snake_case keys with labels mapped in `app/utils/categories.ts`. Renaming a label does not change stored data.
- **No:** storing the label itself as the value.
- **Yes:** catalog items get a category in this spec, so catalog and custom foods share one model.
- **Yes:** `avocado` stays in `vegetables` and `sweet_potato` in `grains` (starches). They follow the existing mock groups and how a cook thinks of them, not botany.
- **Yes:** the category shows only on the saved card and in recipe-builder picker rows. Quick log and recipe lines are left out, the same scoping as SPEC 03/04.
- **No:** filtering by category. It deserves its own spec.

## Risks

| Risk | Mitigation |
| --- | --- |
| The extra field pushes the submit button below the fold in the recipe builder's create panel on phones. | The feature spec takes a phone-width screenshot of the form. If the button is hidden, the select shares a row with the name field on `sm` and up, and the screenshot is retaken. |
| The longer picker meta line wraps on phones (e.g. `My food · Condiments & sweeteners · 1 tbsp …`). | The meta line already wraps. The phone screenshot covers a long label. |
| A native `<select>` looks different from the custom inputs, especially in dark mode. | It uses the same field wrapper and text classes, and sets `color-scheme` per theme. Light and dark screenshots cover it. |
| Existing e2e specs assert exact picker-row text and break when the category is prepended. | Step 8 runs the existing specs. Assertions are updated only where the row text changed. |

## What is **not** in this spec

- Filtering or grouping by category.
- Categories in the Quick log, recipe ingredient lines or saved recipes.
- Editing a saved food's category.
- Custom, free-text or multiple categories.

Each one of those, if it lands, goes in its own spec.
