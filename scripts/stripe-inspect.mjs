import process from 'node:process'
import Stripe from 'stripe'

const key = process.env.STRIPE_MANAGEMENT_KEY
if (!key)
  throw new Error('STRIPE_MANAGEMENT_KEY is required; use scripts/stripe-management.sh')

const [command, id] = process.argv.slice(2)
const stripe = new Stripe(key)

let result
switch (command) {
  case 'catalog':
    result = await Promise.all([
      stripe.products.list({ active: true, limit: 100 }),
      stripe.prices.list({ active: true, limit: 100 }),
    ])
    break
  case 'product':
    if (!id)
      throw new Error('Usage: product <prod_...>')
    result = await stripe.products.retrieve(id)
    break
  case 'price':
    if (!id)
      throw new Error('Usage: price <price_...>')
    result = await stripe.prices.retrieve(id)
    break
  case 'webhooks':
    result = await stripe.webhookEndpoints.list({ limit: 100 })
    break
  default:
    throw new Error('Usage: catalog | product <prod_...> | price <price_...> | webhooks')
}

console.log(JSON.stringify(result, null, 2))
