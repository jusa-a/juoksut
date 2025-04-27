import { defineEventHandler } from 'h3'
import fetch from 'node-fetch'

export default defineEventHandler(async (event) => {
  const { slug } = event.context.params
  const cdnBaseUrl = 'https://cdn.juoksut.run/products'

  try {
    // Fetch available images dynamically and validate them
    const maxImages = 6 // Maximum number of images to check
    const imageFormat = 'png' // Default format, can be 'jpg' or 'png'
    const images = []

    for (let i = 2; i <= maxImages; i++) {
      const imageUrl = `${cdnBaseUrl}/${slug}/${i}.${imageFormat}`
      try {
        const response = await fetch(imageUrl, { method: 'HEAD' }) // Use HEAD request to check if the image exists
        if (response.ok) {
          images.push(imageUrl) // Add the image URL if it exists
        }
      }
      catch (error) {
        console.warn(`Image not found: ${imageUrl}`)
      }
    }

    return { images } // Return only the valid image URLs
  }
  catch (error) {
    console.error(`Error fetching images for product with slug ${slug}:`, error)
    throw createError({ statusCode: 500, message: 'Failed to fetch product images' })
  }
})
