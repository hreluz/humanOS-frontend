# SPEC 03 — Ingredient prices and recipe cost

> **Status:** Approved
> **Depends on:** —
> **Date:** 2026-10-19
> **Objective:** Give catalog ingredients a mocked USD price and show it in the recipe builder, both per ingredient and as the recipe's cost per serving and in total.

## Scope

**In:**

- An optional `price` (USD) on `FoodItem`. It is the price of `per` `unit`, the same basis as the macros.
- A price for every record in `app/services/mocks/ingredients.ts`.
- Price helpers in a new `app/utils/prices.ts`: scale, sum, and format.
- `/food/recipes/new`, ingredient picker list: each priced catalog row shows its price for the listed serving.
- `/food/recipes/new`, ingredient lines: each priced line shows the cost of its current amount. The cost updates when the stepper changes the amount.
- `/food/recipes/new`, summary: cost per serving and whole-recipe cost, on the desktop card and in the phone pinned bar.
- Unpriced ingredients (custom My foods): their rows and lines show no price. The summary sums the priced ingredients and adds a note such as "Excludes 1 ingredient without a price".
- Vitest unit tests for `app/utils/prices.ts` and the `useRecipe` cost.
- A Playwright feature spec with screenshots (`tests/e2e/features/ingredient-prices.spec.ts`).

**Out of scope (for future specs):**

- A price field in `AppIngredientForm` (custom foods stay unpriced).
- Prices in the Quick log (search rows, basket lines).
- A daily food-spend total.
- A price on saved recipes (My foods recipe items), shown in search or picker rows.
- Linking the grocery list (`app/services/mocks/grocery.ts`) to ingredient prices. The grocery list keeps its own string prices.
- Currencies other than USD, and a currency preference.
- Editing prices of catalog items.
- A backend endpoint for ingredients or prices.

## Data model

### Types

```ts
// app/types/food.ts. FoodItem gets one optional field.
export interface FoodItem extends Macros {
  // ...existing fields
  /** USD for `per` of `unit` (e.g. 1.1 = $1.10 per 100 g). Absent when unknown (custom foods, recipes). */
  price?: number
}
```

```ts
// app/utils/prices.ts (new)
/** Priced total of a list of ingredients, and how many had no price. */
export interface PriceSum {
  total: number
  unpriced: number
}
```

### Mock data

- Every record in `INGREDIENTS` (`app/services/mocks/ingredients.ts`) gets a `price` in dollars, as a plain number (e.g. `price: 1.1`). The price is a realistic US grocery price for that record's `per` + `unit`. Examples: `chicken_boiled` is per 100 g, and `egg_boiled` is per 1 egg.
- `buildFood` (custom foods) and `recipeFood` (saved recipes) set no `price`.
- Recipe ingredients are copied with `{ ...i.item }`, so each line keeps the catalog price it had when added.

### Utilities (`app/utils/prices.ts`)

- `scalePrice(item, amount): number | null`: returns `item.price * amount / item.per`, the same scaling as `scaleFood`. Returns `null` when `item.price` is undefined. The result is not rounded.
- `sumPrice(ingredients: RecipeIngredient[]): PriceSum`: sums the priced lines (unrounded) and counts the unpriced ones.
- `formatPrice(n: number): string`: returns `$1.10`. It rounds to cents and uses `toLocaleString('en-US', { style: 'currency', currency: 'USD' })`.
- `unpricedNote(count: number): string`: returns `''` for 0, `Excludes 1 ingredient without a price` for 1, and `Excludes 2 ingredients without a price` for 2 or more.

### `useRecipe` additions

```ts
// The recipe's cost. null while no ingredient has a price.
const cost = computed<{ total: number, perServing: number, unpriced: number } | null>(...)
```

`perServing = total / servings`. Rounding happens only in `formatPrice`.

### Display rules

- Picker row (line 149 today): `{serving} · {kcal} kcal · {p}g protein · {c}g carbs · $X.XX`. The price is `item.price`, which is already for the listed serving. Rows without a price are unchanged.
- Ingredient line (line 107 today): `{kcal} kcal · {p}g protein · {c}g carbs · $X.XX`, using `scalePrice(ing.item, ing.amount)`.
- Desktop summary card: add a `Cost` row under Carbs with `formatPrice(cost.perServing)`. The "Whole recipe" line becomes `Whole recipe: N kcal · $X.XX` when servings > 1. The unpriced note goes under it.
- Phone pinned bar: the second line becomes `{p}g protein · {c}g carbs · $X.XX`. The unpriced note is not shown there, for space.
- When `cost` is `null`, no cost row, price or note is shown.

## Implementation plan

1. **Type + utils.** Add `price?: number` to `FoodItem`. Create `app/utils/prices.ts` with `scalePrice`, `sumPrice`, `formatPrice` and `unpricedNote`. Add `tests/nuxt/prices.test.ts`. It covers:
   - scaling by `per` (g and piece);
   - `null` for unpriced items;
   - sums with mixed priced and unpriced lines;
   - `formatPrice(2.2)` → `$2.20` and `formatPrice(0.005)` → `$0.01`;
   - the note wording for 0, 1 and 2.

   No UI changes yet.
2. **Mock prices.** Add `price` to every record in `app/services/mocks/ingredients.ts`. Nothing renders it yet.
3. **`useRecipe` cost.** Add the `cost` computed and return it. Add vitest coverage in `tests/nuxt/useRecipe.test.ts` (create it if it doesn't exist). It covers:
   - `null` with no ingredients;
   - `null` with only a custom ingredient;
   - total and per-serving cost with 2 servings;
   - an `unpriced` count of 1 after adding a custom food.
4. **Recipe builder UI.** In `app/pages/food/recipes/new.vue`, render the picker row price, the line cost, the summary `Cost` row, the whole-recipe cost, the unpriced note, and the price in the phone bar, following the Display rules. Use `tabular-nums` like the existing numbers. The data comes only from `useRecipe` and the utils, never from a service.
5. **E2E feature spec.** Add `tests/e2e/features/ingredient-prices.spec.ts` (light and dark, `shot()`). It covers:
   - the picker shows a price on a catalog row;
   - adding an ingredient shows its line cost, and stepping the amount changes it;
   - the summary shows the per-serving and whole-recipe cost at 2 servings;
   - adding a custom ingredient shows the "Excludes 1 ingredient without a price" note;
   - the phone viewport bar shows the per-serving cost.
6. **Checks.** `pnpm lint`, `pnpm typecheck`, `pnpm test` and `pnpm test:e2e` pass. Existing recipe e2e specs (`recipe-*.spec.ts`) still pass.

## Acceptance criteria

- [ ] `FoodItem` has an optional `price?: number`, and every record in `app/services/mocks/ingredients.ts` has a `price`.
- [ ] Custom foods created through `AppIngredientForm` have no `price`.
- [ ] On `/food/recipes/new`, a catalog row in the ingredient picker shows `$X.XX` after its macros. A My food row shows no price.
- [ ] An added catalog ingredient's line shows the cost of its amount (`price × amount / per`, rounded to cents). One stepper press updates it.
- [ ] With only catalog ingredients and 1 serving, the desktop summary shows a `Cost` row equal to the sum of the line costs.
- [ ] With 2 servings, `Cost` shows half the total, and the "Whole recipe" line shows the full total.
- [ ] Adding one custom ingredient keeps the priced total and shows "Excludes 1 ingredient without a price". Two custom ingredients show "Excludes 2 ingredients without a price".
- [ ] A recipe whose only ingredients are custom shows no cost row, no price and no note.
- [ ] At phone width the pinned bar shows the per-serving cost after carbs.
- [ ] Prices are always formatted as `$` with two decimals (e.g. `$0.40`, not `$0.4`).
- [ ] No component imports `~/services/*` or `~/services/mocks/*` for prices.
- [ ] The Quick log, the grocery list and the food page look the same as before this spec.
- [ ] `pnpm lint`, `pnpm typecheck` and `pnpm test` pass.
- [ ] `pnpm test:e2e` passes, including the new `features/ingredient-prices.spec.ts` and the existing recipe specs.

## Decisions

- **Yes:** the price is per `per` + `unit`, the same basis as the macros. The cost math mirrors `scaleFood`, and no package-size field is needed.
- **No:** package price + package size. It is closer to a receipt, but it adds a field and a conversion. It can come with a grocery-linking spec.
- **Yes:** fixed USD. The grocery list already uses `$`, and no currency preference exists.
- **Yes:** `price?: number` in dollars, not integer cents. Mock values are few and small, and rounding happens once, at display.
- **Yes:** the price lives on `FoodItem` in the ingredients mock. Mocks are kept one file per resource, so it belongs to the ingredients resource the backend will expose later.
- **Yes:** unpriced ingredients give a partial total plus a note. Hiding the total would make every recipe with one custom food lose its cost, and counting them as $0 would hide that the total is low.
- **No:** a price input on the custom ingredient form. Deferred, to keep this spec to read-only prices.
- **No:** prices in the Quick log or a daily spend total. The user scoped this spec to the recipe builder.
- **No:** a stored price on saved recipes. The builder computes the cost live. Showing a recipe's price in My foods is a later spec.
- **Yes:** line costs use the price copied into the line when it was added. A later catalog price change doesn't rewrite a draft, which matches how macros behave.

## Risks

| Risk | Mitigation |
| --- | --- |
| Float rounding shows off-by-a-cent totals (e.g. `2.475` → `$2.47`). | Sum unrounded values and round once in `formatPrice`. The e2e checks use prices whose products are exact in binary-safe cents (e.g. `1.1 × 2`), and the unit tests cover the rounding edge. |
| Invented mock prices look wrong to a reader. | Accepted for a mock. They get replaced by the backend later. |
| The phone pinned bar overflows with the extra `· $X.XX`. | The feature spec takes a phone-width screenshot. If it wraps, the cost moves to the first line next to kcal. |
