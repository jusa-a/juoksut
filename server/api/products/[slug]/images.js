import { defineEventHandler } from 'h3'

export default defineEventHandler(async (event) => {
  const { slug } = event.context.params
  const cdnBaseUrl = 'https://cdn.juoksut.run/products'

  try {
    // Fetch available images dynamically and validate them
    const maxImages = 7 // Maximum number of images to check
    const imageFormat = 'png' // Default format, can be 'jpg' or 'png'

    // Build the candidate URLs (images 2..maxImages; image 1 is assumed to exist)
    const candidates = []
    for (let i = 2; i <= maxImages; i++)
      candidates.push(`${cdnBaseUrl}/${slug}/${i}.${imageFormat}`)

    // Probe them in parallel; Promise.all preserves order so the result stays sequential
    const results = await Promise.all(
      candidates.map(async (imageUrl) => {
        try {
          const response = await fetch(imageUrl, { method: 'HEAD' }) // HEAD: check existence only
          return response.ok ? imageUrl : null
        }
        catch {
          console.warn(`Image not found: ${imageUrl}`)
          return null
        }
      }),
    )

    const images = results.filter(Boolean)

    return { images } // Return only the valid image URLs
  }
  catch (error) {
    console.error(`Error fetching images for product with slug ${slug}:`, error)
    throw createError({ statusCode: 500, message: 'Failed to fetch product images' })
  }
})
