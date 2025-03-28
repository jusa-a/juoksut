import { defineCollection, defineContentConfig, z } from '@nuxt/content'

export default defineContentConfig({
  collections: {
    shop: defineCollection({
      source: 'shop/*.md',
      type: 'page',
      schema: z.object({
        price: z.number(),
        priceId: z.string(), // Stripe price id
        img: z.string(),
        images: z.array(z.string()),
        sizes: z.array(z.string()),
        material: z.array(z.string()),
        sizing: z.array(
          z.object({
            size: z.string(),
            width: z.number(),
            length: z.number(),
          }),
        ),

      }),
    }),
  },
})
