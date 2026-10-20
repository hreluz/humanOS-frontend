# SPEC 04 — Price field for custom ingredients

> **Status:** Approved
> **Depends on:** SPEC 03
> **Date:** 2026-10-19
> **Objective:** Let users type an optional USD price when they create a custom ingredient, so it counts in the recipe builder's cost like catalog ingredients do.

## Scope

**In:**

- An optional "Price" input in `AppIngredientForm`, below the Protein / Carbs / Fat row. It is used both in the New ingredient modal and in the recipe builder's create form.
- The price is for the typed "Nutrition per" amount and unit, the same basis as the macros and the catalog prices from SPEC 03.
- `NewFoodInput` gets an optional `price`, and `buildFood` copies it to the `FoodItem` when it is set.
- Validation: blank is valid (no price). A non-blank value must parse to a number greater than 0. It is rounded to cents and capped at $1,000.
- The New ingredient modal's "saved to My foods" card shows the price after the kcal when the food has one.
- In the recipe builder, a priced custom food shows its price, line cost and summary cost through the SPEC 03 code, with no changes to `new.vue`'s display rules.
- Vitest coverage for parsing, `buildFood` and `useIngredientForm`.
- A Playwright feature spec with screenshots (`tests/e2e/features/custom-ingredient-price.spec.ts`).

**Out of scope (for future specs):**

- Editing the price of a custom food after it is saved. No edit flow for custom foods exists.
- Prices in the Quick log (search rows, basket lines) and a daily food-spend total.
- A price on saved recipes (`recipeFood` still sets none).
- A package price + package size input.
- Currencies other than USD.
- A backend endpoint for custom foods.

## Data model

### Types

```ts
// app/types/food.ts. NewFoodInput gets one optional field.
export interface NewFoodInput extends Macros {
  name: string
  per: number
  unit: PortionUnit
  /** USD for `per` of `unit`, rounded to cents. Absent when the user left it blank. */
  price?: number
}
```

`FoodItem.price?: number` already exists from SPEC 03. It is not changed.

### Parsing (`app/utils/logging.ts`)

`parseAmount` gets a `decimals` option. It defaults to `1`, so every current caller behaves the same:

```ts
parseAmount(text, { integer?, max?, decimals? = 1 })
```

The price is parsed with `parseAmount(text, { decimals: 2, max: AMOUNT_LIMITS.price })`. `AMOUNT_LIMITS` gets `price: 1000`. Like the other fields, values above the limit are clamped, not rejected. `"1,5"`, `"1.50"` and `"1.5"` all give `1.5`, and `"1.155"` gives `1.16`.

### `buildFood`

`buildFood` adds `price` to the food only when `input.price` is defined. When there is no price, the food has no `price` key, so custom foods without a price stay exactly as they are today.

### `useIngredientForm`

- `emptyFood()` gets `price: ''`.
- `price = computed(() => parseAmount(newFood.price, { decimals: 2, max: AMOUNT_LIMITS.price }))`.
- `priceInvalid = computed(() => newFood.price.trim() !== '' && !price.value)`.
- `missing` adds `'a valid price'` when `priceInvalid` is true. For example: "Add a valid price to save."
- `parsedFood` includes `price: price.value` when the price is set, and leaves it out when the field is blank.
- The composable returns `priceInvalid`.

### Display rules

- Form field: a label reading `Price (USD, per {formatPortion})`, e.g. `Price (USD, per 100 g)` or `Price (USD, per 1 egg)`. While the "Nutrition per" amount is invalid, it reads `Price (USD)`. A `$` prefix sits before the input. The input uses `inputmode="decimal"`, `placeholder="0.00"`, the same field classes as the macros, and spans the full width.
- Inline error: after blur, if `priceInvalid` is true, show "Enter a price like 1.10." under the field. Use the same style and `aria-invalid` / `aria-describedby` wiring as the "Nutrition per" error.
- Saved card (`ModalIngredient`): `{serving} · {kcal} kcal · $X.XX` using `formatPrice`. When the food has no price, the line is unchanged.

## Implementation plan

1. **Parsing + types.** Add the `decimals` option to `parseAmount` and add `price: 1000` to `AMOUNT_LIMITS`. Add `price?: number` to `NewFoodInput`, and make `buildFood` copy it. Extend `tests/nuxt/logging.test.ts`. It covers:
   - `decimals: 2` for `"1.155"` → `1.16`, `"1,5"` → `1.5` and `"0"` → `null`;
   - the default stays at 1 decimal;
   - `buildFood` with and without a price, checking that no `price` key exists when there is no price.
   No UI changes yet.
2. **`useIngredientForm`.** Add the `price` field, `priceInvalid`, the `missing` wording and `parsedFood.price`. Extend `tests/nuxt/useIngredientForm.test.ts`. It covers:
   - a blank price saves with no price;
   - `"2.5"` gives `price: 2.5`;
   - `"abc"` and `"0"` block saving and add "a valid price" to `missing`.
3. **Form UI.** Add the Price field and its inline error to `app/components/app/IngredientForm.vue`, following the Display rules.
4. **Saved card.** Show the price on the "saved to My foods" card in `app/components/modal/Ingredient.vue`.
5. **E2E feature spec.** Add `tests/e2e/features/custom-ingredient-price.spec.ts` (light and dark, `shot()`). It covers:
   - the form shows `Price (USD, per 100 g)`, and the label follows a unit change to `piece`;
   - typing `abc` and blurring shows the error and disables the save button;
   - saving from the New ingredient modal with `$2.50` shows `$2.50` on the saved card;
   - creating a priced ingredient from the recipe builder shows its line cost, and the summary has no "Excludes" note;
   - a custom ingredient saved with a blank price still shows the "Excludes 1 ingredient without a price" note.
6. **Checks.** `pnpm lint`, `pnpm typecheck`, `pnpm test` and `pnpm test:e2e` pass. The existing `recipe-custom-ingredient.spec.ts` and `ingredient-prices.spec.ts` still pass.

## Acceptance criteria

- [ ] `AppIngredientForm` shows an optional Price field below the macros, with a `$` prefix and a label that names the "Nutrition per" amount and unit.
- [ ] Saving with the Price field blank creates a food with no `price` key, and the form saves exactly as before this spec.
- [ ] Saving with `2.5` creates a food with `price: 2.5`. `1,5` is accepted as `1.5`.
- [ ] `0`, `abc` or `-1` shows "Enter a price like 1.10." after blur, disables the save button, and adds "a valid price" to the missing sentence.
- [ ] `1.155` is saved as `1.16`, and `5000` is saved as `1000`.
- [ ] Every existing `parseAmount` caller still rounds to 1 decimal. The existing logging tests pass unchanged.
- [ ] The New ingredient modal's saved card shows `· $X.XX` after the kcal for a priced food and shows no price for an unpriced one.
- [ ] In `/food/recipes/new`, a priced custom ingredient shows a price in the picker row, a line cost and a cost in the summary, and is not counted in the "Excludes N ingredients" note.
- [ ] `app/pages/food/recipes/new.vue` has no changes.
- [ ] No component imports `~/services/*` or `~/services/mocks/*` for prices.
- [ ] `pnpm lint`, `pnpm typecheck` and `pnpm test` pass.
- [ ] `pnpm test:e2e` passes, including the new `features/custom-ingredient-price.spec.ts` and the existing recipe and ingredient-price specs.

## Decisions

- **Yes:** the price is optional. Users who don't know it can still save, and SPEC 03's "Excludes N ingredients without a price" note already handles unpriced foods.
- **No:** a required price. It adds friction to a form whose job is logging nutrition.
- **Yes:** the price is for the "Nutrition per" amount and unit. It has the same basis as the catalog prices and the macros, so SPEC 03's `scalePrice` works unchanged.
- **No:** package price + package size. Same reason as in SPEC 03. It adds a field and a conversion.
- **Yes:** the price must be greater than 0, and a valid price is capped at $1,000 and rounded to cents. A $0 price would hide a forgotten value, and blank already means "unknown".
- **Yes:** reuse `parseAmount` with a new `decimals` option instead of writing a separate `parsePrice`. It keeps the decimal-comma and thousands-separator handling in one place. The default of 1 keeps current callers unchanged.
- **Yes:** an invalid non-blank price blocks saving instead of being dropped silently. Otherwise a typo would save the food with no price and nobody would notice.
- **Yes:** the price is shown on the saved card in the New ingredient modal, so the user can confirm what was stored.
- **No:** prices in the Quick log. SPEC 03 kept prices out of the Quick log, and adding them deserves its own spec.
- **No:** editing a saved custom food's price. No edit flow exists yet.

## Risks

| Risk | Mitigation |
| --- | --- |
| Changing `parseAmount` changes rounding for macros, amounts or weights. | `decimals` defaults to `1`. The existing `logging.test.ts` cases must pass unchanged (acceptance criterion). |
| The extra field pushes the submit button below the fold in the recipe builder's create panel on phones. | The feature spec takes a phone-width screenshot of the form. If the button is hidden, the field shares a row with the Calories field. |
| The dynamic label is long for piece units (e.g. `Price (USD, per 2 slices)`) and wraps. | The field spans the full width, and the screenshot covers a piece unit. |
