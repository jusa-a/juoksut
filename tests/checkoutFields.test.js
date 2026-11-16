import { describe, expect, it } from 'vitest'
import { buildRegistrationCustomFields, registrationSubmitMessage } from '../server/utils/checkoutFields'

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

  it('gives options with spaces or punctuation an alphanumeric value', () => {
    const gala = { title: 'Gala', checkoutFields: [{ key: 'diet', label: 'Diet', options: ['Gluten free', 'Just water, thanks!'] }] }
    expect(buildRegistrationCustomFields([{ product: gala, quantity: 1 }], 1)[0].dropdown.options).toEqual([
      { label: 'Gluten free', value: 'Glutenfree' },
      { label: 'Just water, thanks!', value: 'Justwaterthanks' },
    ])
  })

  it('rejects options whose values would collide', () => {
    const fields = [{ key: 'diet', label: 'Diet', options: ['Gluten free', 'Gluten-free'] }]
    expect(() => buildRegistrationCustomFields([{ product: { title: 'Gala', checkoutFields: fields }, quantity: 1 }], 1)).toThrow('Invalid checkout field')
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

  it('creates a required text field', () => {
    const fields = [{ key: 'running_fact', label: 'A niche running fact', type: 'text', help: 'Tell us!' }]
    expect(buildRegistrationCustomFields([{ product: { title: 'Gala', checkoutFields: fields }, quantity: 1 }])).toEqual([{
      key: 'running_fact',
      label: { type: 'custom', custom: 'A niche running fact' },
      type: 'text',
      optional: false,
    }])
  })

  it('rejects a text field with options and a label over 50 characters', () => {
    const build = field => () => buildRegistrationCustomFields([{ product: { title: 'Gala', checkoutFields: [field] }, quantity: 1 }])
    expect(build({ key: 'fact', label: 'Fact', type: 'text', options: ['A', 'B'] })).toThrow('Invalid checkout field')
    expect(build({ key: 'fact', label: 'x'.repeat(51), type: 'text' })).toThrow('Invalid checkout field')
    expect(build({ key: 'fact', label: 'x'.repeat(50), type: 'text' })).not.toThrow()
  })
})

describe('registrationSubmitMessage', () => {
  it('joins the fields\' help, or is null without any', () => {
    const fields = [
      { key: 'diet', label: 'Diet', options: ['None', 'Other'], help: 'Meat free.' },
      { key: 'fact', label: 'Fact', type: 'text', help: 'Tell us!' },
    ]
    expect(registrationSubmitMessage([{ product: { title: 'Gala', checkoutFields: fields }, quantity: 1 }])).toBe('Meat free. Tell us!')
    expect(registrationSubmitMessage([{ product: camp, quantity: 1 }])).toBeNull()
  })

  it('rejects help over Stripe\'s 1200 characters', () => {
    const fields = [{ key: 'fact', label: 'Fact', type: 'text', help: 'x'.repeat(1201) }]
    expect(() => registrationSubmitMessage([{ product: { title: 'Gala', checkoutFields: fields }, quantity: 1 }])).toThrow('1200')
  })
})
