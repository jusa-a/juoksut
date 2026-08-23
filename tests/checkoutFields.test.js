import { describe, expect, it } from 'vitest'
import { buildRegistrationCustomFields } from '../server/utils/checkoutFields'

const camp = {
  title: 'ALL-STARS CAMP ’26',
  checkoutFields: [{
    key: 'camp_shirt_size',
    label: 'Camp shirt size',
    options: ['XS', 'S', 'M', 'L', 'XL'],
  }],
}

describe('buildRegistrationCustomFields', () => {
  it('creates a required Stripe dropdown for a camp registration', () => {
    expect(buildRegistrationCustomFields([{ product: camp, quantity: 1 }], 1)).toEqual([{
      key: 'camp_shirt_size',
      label: { type: 'custom', custom: 'Camp shirt size' },
      type: 'dropdown',
      dropdown: {
        options: ['XS', 'S', 'M', 'L', 'XL'].map(value => ({ label: value, value })),
      },
    }])
  })

  it('does not add fields for regular merchandise', () => {
    expect(buildRegistrationCustomFields([{ product: { title: 'Tee', checkoutFields: [] }, quantity: 2 }], 1)).toEqual([])
  })

  it('requires a separate checkout for each registration', () => {
    expect(() => buildRegistrationCustomFields([{ product: camp, quantity: 2 }], 1)).toThrow('one registration at a time')
  })

  it('rejects a configuration that exceeds Stripe custom field capacity', () => {
    const fields = Array.from({ length: 3 }, (_, index) => ({
      key: `field_${index}`,
      label: `Field ${index}`,
      options: ['Yes', 'No'],
    }))

    expect(() => buildRegistrationCustomFields([{ product: { title: 'Camp', checkoutFields: fields }, quantity: 1 }], 1)).toThrow('at most 2')
  })
})
