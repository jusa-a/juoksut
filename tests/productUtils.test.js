import { describe, expect, it } from 'vitest'
import { transformProductData } from '../server/utils/productUtils'

describe('transformProductData', () => {
  const raw = {
    id: 1,
    slug: 'test-tee',
    title: 'Test Tee',
    material: '["100% cotton"]',
    sizing: '["fits true"]',
    size_chart: '[]',
    description: 'Line one\\nLine two', // literal backslash-n, as stored in D1
    price: 1999,
    stock: '[{"size":"M","quantity":5}]',
    stripe_product_id: null,
    stripe_price_id: null,
  }

  it('converts price from cents to euros', () => {
    expect(transformProductData(raw).price).toBe(19.99)
  })

  it('parses JSON columns into arrays', () => {
    const p = transformProductData(raw)
    expect(p.material).toEqual(['100% cotton'])
    expect(p.sizing).toEqual(['fits true'])
    expect(p.stock).toEqual([{ size: 'M', quantity: 5 }])
  })

  it('builds the primary CDN image url from the slug', () => {
    expect(transformProductData(raw).img).toBe('https://cdn.juoksut.run/products/test-tee/1.png')
  })

  it('drops the phantom { size: null } row for a product with no stock rows', () => {
    const noStock = { ...raw, stock: '[{"size":null,"quantity":null}]' }
    expect(transformProductData(noStock).stock).toEqual([])
  })

  it('splits the description on literal \\n into <p> paragraphs', () => {
    expect(transformProductData(raw).description).toBe('<p>Line one</p><p>Line two</p>')
  })
})
