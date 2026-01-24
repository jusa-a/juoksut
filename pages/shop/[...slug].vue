<template>
  <div>
    <section class="productContainer flex flex-row flex-wrap w-full p-0 m-0 mx-auto">
      <div class="prodImages flex-1 min-w-[200px]">
        <NuxtImg
          class="mx-auto"
          :src="product.img"
          :alt="product.title"
          height="1875"
          width="1500"
        />
        <template v-for="(image, n) in product.images" :key="n">
          <NuxtImg
            class="mx-auto"
            :src="image"
            :alt="product.title"
            height="1875"
            width="1500"
          />
        </template>
      </div>

      <div class="prodInfo flex-1 min-w-[300px] flex flex-col">
        <div class="mb-auto flex flex-col px-[1em] py-[1.4em] pb-[2em] min-[500px]:sticky min-[500px]:top-[calc(var(--nav-height)+1px)] min-[500px]:pb-[6.5em]">
          <div class="flex flex-col">
            <h2>{{ product.title }}</h2>
            <div class="pt-[1em] pb-[0.7em] uppercase">
              {{
                product.totalStock < 0 ? 'Coming soon...'
                : (inStock ? `€${product.price.toFixed(2)}` : 'Out of stock')
              }}
            </div>

            <!-- Size selector -->
            <div
              v-if="inStock"
              class="flex-1 flex flex-col mx-[1em] mb-[1em]"
            >
              <!-- Stock info -->
              <div class="h-[0.8em] mb-[0.2em] self-end">
                <div v-if="selectedStock !== null" class="text-[0.8em]/[1.3em] px-[1em] opacity-80">
                  <span v-if="selectedStock > 100">preorder</span>
                  <span v-else-if="selectedStock > 9">in stock</span>
                  <span v-else-if="selectedStock > 0">only {{ selectedStock }} left</span>
                  <span v-else class="opacity-60">out of stock</span>
                </div>
              </div>

              <!-- Select size -->
              <div
                :class="{
                  'flex justify-center': Object.keys(stock).length === 1,
                  'flex justify-between': Object.keys(stock).length > 1,
                }"
              >
                <button
                  v-for="(size, index) in Object.keys(stock)"
                  :key="index"
                  class="px-[1em] uppercase"
                  :class="[{ underline: selectedSize === size }]"
                  @click="selectSize(size)"
                >
                  {{ size }}
                </button>
              </div>
            </div>
          </div>

          <!-- Product Info -->
          <div class="flex-1 flex flex-col gap-[0.4em]">
            <div class="m-0" v-html="product.description"></div>

            <div>
              <NuxtLink to="/orders" class="text-[0.8em] opacity-70 hover:underline">Ordering Info</NuxtLink>
            </div>

            <!-- Material -->
            <div v-if="product.material.length > 0">
              <h3 class="uppercase">Material</h3>
              <ul>
                <li v-for="(material, index) in product.material" :key="index">{{ material }}</li>
              </ul>
            </div>

            <!-- Sizing info -->
            <div v-if="product.sizing.length > 0">
              <h3 class="uppercase">Sizing</h3>
              <ul>
                <li v-for="(line, index) in product.sizing" :key="index">{{ line }}</li>
              </ul>

              <div v-if="product.sizeChart.length > 0" class=" text-[0.8em]">
                <!-- Toggle Button -->
                <button
                  class="opacity-70 hover:underline"
                  @click="isSizingTableVisible = !isSizingTableVisible"
                >
                  {{ isSizingTableVisible ? 'Hide Size Chart' : 'Size Chart' }}
                </button>

                <!-- Collapsible Size Chart -->
                <div v-if="isSizingTableVisible" class="text-[0.8em]">
                  <table class="table-fixed w-full text-left">
                    <thead class="bg-pink text-white">
                      <tr>
                        <th>SIZE</th>
                        <th>CHEST (cm)</th>
                        <th>LENGHT (cm)</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr
                        v-for="(size, index) in product.sizeChart"
                        :key="index"
                        class="border-b-[1px] border-pink border-opacity-50"
                      >
                        <td>{{ size.size }}</td>
                        <td>{{ size.width }}</td>
                        <td>{{ size.length }}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="w-full sticky bottom-0 pb-[1.4em] pt-[1em] px-[1em] z-10">
          <button
            class="w-full text-white uppercase bg-pink text-center border-[1px] border-pink py-[1em] hover:bg-white hover:text-pink"
            :class="{
              'pointer-events-none': cart.isHoverDisabled || selectedStock === 0 || !inStock,
              '!bg-white !text-pink': selectedStock === 0 || !inStock,
            }"
            :disabled="!inStock || selectedStock === 0"
            @click="addToCart"
          >
            {{
              !inStock || selectedStock === 0
                ? 'Out of stock'
                : cart.isLoading
                  ? `Adding... €${product.price.toFixed(2)}`
                  : (showSelectSizeMessage
                    ? 'Please select a size'
                    : `Add to cart €${product.price.toFixed(2)}`)
            }}
          </button>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { useCartStore } from '~/stores/cart'
import { useProductStore } from '~/stores/products'

const route = useRoute()
const productStore = useProductStore()
const cart = useCartStore()

const isSizingTableVisible = ref(false)
const selectedSize = ref<string | null>(null)
const showSelectSizeMessage = ref(false)

// Get slug from route params
const slug = Array.isArray(route.params.slug) ? route.params.slug[0] : route.params.slug

if (!slug) {
  throw createError({
    statusCode: 404,
    statusMessage: 'Product not found',
  })
}

// Fetch the product
const product = await productStore.fetchSingleProduct(slug)

if (!product) {
  throw createError({
    statusCode: 404,
    statusMessage: `Page not found: /${route.params.slug}`,
  })
}

// Convert stock array to an object for easier access
const stock: Record<string, number> = Object.fromEntries(
  product.stock.map(({ size, quantity }) => [size, quantity]),
)

// Determine if the product is in stock
const inStock = product.totalStock > 0

// Computed property for selected size stock
const selectedStock = computed(() => {
  if (!selectedSize.value || !(selectedSize.value in stock))
    return null
  return stock[selectedSize.value]
})

function selectSize(size: string): void {
  selectedSize.value = size
}

function addToCart(): void {
  if (!selectedSize.value) {
    showSelectSizeMessage.value = true

    setTimeout(() => {
      showSelectSizeMessage.value = false
    }, 1000)
    return
  }

  cart.addItem({
    slug: product.slug,
    size: selectedSize.value,
    price: product.price,
    title: product.title,
    img: product.img,
  })
}

// SEO: Set per-product meta tags
const runtimeConfig = useRuntimeConfig()
const siteUrl = String((runtimeConfig.public && runtimeConfig.public.siteUrl) || 'https://juoksut.run')
const pageUrl = new URL(route.fullPath || '/', siteUrl).toString()

function stripHtml(html: string): string {
  return html?.replace(/<[^>]*>/g, '')?.replace(/\s+/g, ' ').trim() || ''
}

const description = stripHtml(product.description).slice(0, 180)
const ogImage = product.img || `${siteUrl}/logo.svg`

useSeoMeta({
  title: `${product.title} · Shop`,
  description,
  ogTitle: `${product.title} · Shop`,
  ogDescription: description,
  ogImage,
  ogUrl: pageUrl,
  twitterCard: 'summary_large_image',
})
</script>

<style scoped>
th {
  @apply font-normal;
}

br {
  content: ' ';
  margin: 2em;
  display: block;
}

th,
td {
  @apply px-[1em];
}
</style>
