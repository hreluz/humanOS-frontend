import { mountSuspended } from '@nuxt/test-utils/runtime'
import { beforeEach, describe, expect, it } from 'vitest'
import FoodThumb from '~/components/app/FoodThumb.vue'
import FoodPhotos from '~/components/modal/FoodPhotos.vue'
import type { FoodItem, FoodPhoto } from '~/types/food'

const photo = (over: Partial<FoodPhoto> = {}): FoodPhoto => ({
  url: 'https://example.com/egg.jpg?width=960',
  thumbnailUrl: 'https://example.com/egg.jpg?width=330',
  license: 'CC BY-SA 2.0',
  licenseUrl: 'https://creativecommons.org/licenses/by-sa/2.0',
  author: 'Ramesh NG',
  creditUrl: 'https://commons.wikimedia.org/wiki/File:Boiled_Egg.jpg',
  ...over,
})
const food = (photos: FoodPhoto[]): FoodItem => ({
  id: 'egg_whole_hard_boiled', name: 'Egg, whole, hard-boiled', serving: '100 g', per: 100, unit: 'g', step: 10, isMine: false,
  kcal: 155, p: 12.6, c: 1.12, f: 10.6, portions: [], photos, category: 'eggs',
})

async function mountWith(item: FoodItem) {
  useFoodPhotos().openPhotos(item)
  return mountSuspended(FoodPhotos)
}

const creditText = (text: string) => text.replace(/\s+/g, ' ').trim()

beforeEach(() => {
  clearNuxtState()
})

describe('FoodPhotos', () => {
  it('credits the author, links the license and the source', async () => {
    const wrapper = await mountWith(food([photo()]))
    const credit = wrapper.find('[data-testid="photo-credit"]')
    expect(creditText(credit.text())).toBe('Photo: Ramesh NG · CC BY-SA 2.0 · Source')
    expect(credit.find('a[href="https://creativecommons.org/licenses/by-sa/2.0"]').text()).toBe('CC BY-SA 2.0')
    expect(credit.find('a[href="https://commons.wikimedia.org/wiki/File:Boiled_Egg.jpg"]').text()).toBe('Source')
    expect(wrapper.text()).toContain('Egg, whole, hard-boiled')
  })

  it('leaves out a null author and an unlinked license', async () => {
    const wrapper = await mountWith(food([photo({ author: null, license: 'CC0', licenseUrl: null })]))
    const credit = wrapper.find('[data-testid="photo-credit"]')
    expect(creditText(credit.text())).toBe('Photo: CC0 · Source')
    expect(credit.findAll('a').map(a => a.text())).toEqual(['Source'])
  })

  it('shows the photo the arrows step to', async () => {
    const wrapper = await mountWith(food([photo(), photo({ url: 'https://example.com/two.jpg', author: 'Ana' })]))
    await wrapper.find('button[aria-label="Next photo"]').trigger('click')
    expect(creditText(wrapper.find('[data-testid="photo-credit"]').text())).toContain('Photo: Ana ·')
  })
})

describe('FoodThumb', () => {
  it('renders a 40 px button for a food with photos', async () => {
    const wrapper = await mountSuspended(FoodThumb, { props: { food: food([photo()]) } })
    const button = wrapper.find('button[aria-label="Photos of Egg, whole, hard-boiled"]')
    expect(button.exists()).toBe(true)
    expect(button.find('img').attributes()).toMatchObject({ src: 'https://example.com/egg.jpg?width=330', alt: '', loading: 'lazy' })
  })

  it('renders no button for a food with no photos', async () => {
    const wrapper = await mountSuspended(FoodThumb, { props: { food: food([]) } })
    expect(wrapper.find('button').exists()).toBe(false)
  })
})
