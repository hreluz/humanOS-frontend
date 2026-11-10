import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'
import { type IngredientBody, type TestUser, createIngredient } from '../api'
import { THEMES, gotoReady, logPage, openQuickLog, setTheme, shot, signInAsNewUser } from '../helpers'

// Every test signs in as its own user, so the foods it creates, edits and deletes never leak into other tests.

const food = (name: string, category: string, kcal: number, over: Partial<IngredientBody> = {}): IngredientBody =>
  ({ name, category, kcal, protein: 5, carbs: 10, fat: 2, ...over })

/** Three foods, created out of name order to show the list sorts by name. */
const SEEDS = [
  food('Salsa verde', 'condiments', 45),
  food('Bakery sourdough', 'grains', 260, { protein: 9, carbs: 51, fat: 2, portions: [{ label: '1 slice', grams: 50 }] }),
  food('Basil pesto', 'condiments', 430, { protein: 5, carbs: 6, fat: 43 }),
]

async function seedFoods(user: TestUser, foods: IngredientBody[]) {
  for (const f of foods) await createIngredient(user, f)
}

/** Opens My foods from /food, the way a user gets there. */
const openMyFoods = async (page: Page) => {
  await gotoReady(page, '/food')
  await page.getByRole('link', { name: 'My foods' }).click()
  await expect(page.getByRole('heading', { name: 'My foods' })).toBeVisible()
}

const rows = (page: Page) => page.getByRole('main').getByRole('listitem')
const row = (page: Page, name: string) => rows(page).filter({ hasText: name })

for (const theme of THEMES) {
  test.describe(`my foods (${theme})`, () => {
    test.beforeEach(async ({ context, baseURL }) => {
      await setTheme(context, theme, baseURL!)
    })

    test('lists the user\'s foods by name', async ({ page, context, baseURL }, testInfo) => {
      await seedFoods(await signInAsNewUser(context, baseURL!, 'myfoods-list'), SEEDS)
      await gotoReady(page, '/food')
      await shot(page, testInfo, 'my-foods-link', theme)
      await page.getByRole('link', { name: 'My foods' }).click()
      await expect(page).toHaveURL('/food/my-foods')
      await expect(rows(page)).toHaveText([/^Bakery sourdough/, /^Basil pesto/, /^Salsa verde/])
      await expect(row(page, 'Bakery sourdough')).toContainText('Grains & starches · 100 g · 260 kcal · 1 portion')
      await expect(page.getByText('3 foods')).toBeVisible()
      await expect(page.getByRole('button', { name: 'Load more' })).toHaveCount(0)
      await shot(page, testInfo, 'my-foods-list', theme)
    })

    test('filters by category', async ({ page, context, baseURL }, testInfo) => {
      await seedFoods(await signInAsNewUser(context, baseURL!, 'myfoods-filter'), SEEDS)
      await openMyFoods(page)
      const category = page.getByLabel('Category')
      await expect(category.locator('option')).toHaveCount(14)
      await expect(category.locator('option', { hasText: 'No category' })).toHaveCount(0)

      await category.selectOption({ label: 'Condiments & sweeteners' })
      await expect(rows(page)).toHaveCount(2)
      await expect(page.getByText('2 foods')).toBeVisible()

      await category.selectOption({ label: 'Fruit' })
      await expect(page.getByText('No foods in Fruit.')).toBeVisible()
      await shot(page, testInfo, 'my-foods-filter-empty', theme)
      await page.getByRole('button', { name: 'Show all' }).click()
      await expect(rows(page)).toHaveCount(3)
      await expect(category.locator('option:checked')).toHaveText('All categories')
    })

    test('creates, edits and deletes a food with portions', async ({ page, context, baseURL }, testInfo) => {
      await signInAsNewUser(context, baseURL!, 'myfoods-crud')
      await openMyFoods(page)
      await expect(page.getByText('No custom foods yet.')).toBeVisible()

      // Create, with a portion, fiber and a price.
      await page.getByRole('button', { name: 'New ingredient' }).first().click()
      const dialog = page.getByRole('dialog')
      await dialog.getByLabel('Name', { exact: true }).fill('Protein bar, chocolate')
      await dialog.getByLabel('Category').selectOption({ label: 'Supplements' })
      await dialog.getByLabel('Calories', { exact: true }).fill('380')
      await dialog.getByLabel('Protein (g)').fill('33')
      await dialog.getByLabel('Carbs (g)').fill('38')
      await dialog.getByLabel('Fat (g)').fill('11')
      await dialog.getByLabel('Fiber (g, optional)').fill('9')
      await dialog.getByRole('button', { name: '+ Add portion' }).click()
      await dialog.getByLabel('Portion 1 name').fill('1 bar')
      await dialog.getByLabel('Portion 1 grams').fill('45')
      await dialog.getByLabel('Price (USD, per 100 g)').fill('1.20')
      await shot(page, testInfo, 'ingredient-form-portions', theme)
      const created = page.waitForRequest(r => r.url().endsWith('/v1/nutrition/ingredients') && r.method() === 'POST')
      await dialog.getByRole('button', { name: 'Save ingredient' }).click()
      expect((await created).postDataJSON()).toMatchObject({ name: 'Protein bar, chocolate', fiber: 9, portions: [{ label: '1 bar', grams: 45 }] })
      await expect(dialog.getByText('Protein bar, chocolate saved to My foods.')).toBeVisible()
      await dialog.getByRole('button', { name: 'Done' }).click()
      await expect(row(page, 'Protein bar, chocolate')).toContainText('Supplements · 100 g · 380 kcal · 1 portion · $1.20')

      // Edit: rename the portion and add a second one. The first keeps its key.
      await page.getByRole('link', { name: 'Edit Protein bar, chocolate' }).click()
      await expect(page.getByRole('heading', { name: 'Edit Protein bar, chocolate' })).toBeVisible()
      await expect(page.getByLabel('Fiber (g, optional)')).toHaveValue('9')
      await expect(page.getByLabel('Price (USD, per 100 g)')).toHaveValue('1.20')
      await page.getByLabel('Portion 1 name').fill('1 small bar')
      await page.getByRole('button', { name: '+ Add portion' }).click()
      await page.getByLabel('Portion 2 name').fill('1 big bar')
      await page.getByLabel('Portion 2 grams').fill('60')
      await shot(page, testInfo, 'my-foods-edit', theme)
      const patched = page.waitForRequest(r => r.method() === 'PATCH')
      await page.getByRole('button', { name: 'Save changes' }).click()
      const body = (await patched).postDataJSON() as { portions: { key?: string, label: string, grams: number }[] }
      expect(body.portions).toEqual([{ key: expect.stringMatching(/^p_/), label: '1 small bar', grams: 45 }, { label: '1 big bar', grams: 60 }])
      await expect(page).toHaveURL('/food/my-foods')
      await expect(row(page, 'Protein bar, chocolate')).toContainText('2 portions')

      // The quick log's My Foods lists it with the recipes.
      await openQuickLog(page)
      await logPage(page).getByRole('button', { name: 'My Foods' }).click()
      await expect(logPage(page).getByText('My food · Supplements · 100 g · 380 kcal')).toBeVisible()
      await logPage(page).getByRole('button', { name: 'Close' }).click()

      // Delete, after confirming in the row.
      await page.getByRole('button', { name: 'Delete Protein bar, chocolate' }).click()
      const confirm = page.getByRole('group', { name: 'Delete Protein bar, chocolate?' })
      await expect(confirm.getByRole('button', { name: 'Cancel' })).toBeFocused()
      await shot(page, testInfo, 'my-foods-confirm-delete', theme)
      const deleted = page.waitForRequest(r => r.method() === 'DELETE')
      await confirm.getByRole('button', { name: 'Delete' }).click()
      await deleted
      await expect(page.getByText('No custom foods yet.')).toBeVisible()
    })

    test('loads 100 at a time', async ({ page, context, baseURL }) => {
      test.skip(theme === 'dark', 'pagination doesn\'t depend on the theme')
      const user = await signInAsNewUser(context, baseURL!, 'myfoods-many')
      const names = Array.from({ length: 101 }, (_, i) => `Food ${String(i + 1).padStart(3, '0')}`)
      await Promise.all(names.map(name => createIngredient(user, food(name, 'other', 100))))
      await openMyFoods(page)
      await expect(rows(page)).toHaveCount(100)
      await page.getByRole('button', { name: 'Load more' }).click()
      await expect(rows(page)).toHaveCount(101)
      await expect(rows(page).last()).toContainText('Food 101')
      await expect(page.getByRole('button', { name: 'Load more' })).toHaveCount(0)
    })

    test('an unknown food shows a not-found message', async ({ page, context, baseURL }, testInfo) => {
      await signInAsNewUser(context, baseURL!, 'myfoods-unknown')
      await gotoReady(page, '/food/my-foods/u_unknown')
      await expect(page.getByText('This food doesn\'t exist anymore.')).toBeVisible()
      await shot(page, testInfo, 'my-foods-not-found', theme)
    })
  })
}
