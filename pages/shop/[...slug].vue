<template>
  <div>
    <section class="productContainer flex flex-row flex-wrap w-full p-0 m-0 mx-auto">
      <div class="prodImages flex-1 min-w-[200px]">
        <NuxtImg
          :src="`/${product.img}`"
          :alt="product.title"
          height="1280"
          width="1024"
        />
        <template
          v-for="(image, n) in product.images"
          :key="n">
          <NuxtImg
            :src="`/${image}`"
            :alt="product.title"
            height="1280"
            width="1024"
          />
        </template>
      </div>

      <div class="prodInfo flex-1 min-w-[300px] flex flex-col ">
        <div class=" flex-1 flex flex-col p-[1.5em] pb-[8em]">
          <div class="flex flex-col">
            <h2 class="">
              {{ product.title }}
            </h2>
            <div class="pt-[1em] pb-[0.7em] uppercase">
              {{ inStock ? `€${product.price}` : 'Out of stock' }}
            </div>

            <!-- Size selector -->
            <div
              v-if="inStock"
              class="flex-1 flex flex-col mx-[1em] mb-[1em]"
            >
              <!-- Stock info -->
              <div class="h-[0.8em] mb-[0.2em] self-end">
                <div v-if="selectedSize" class="text-[0.8em]/[1.3em] px-[1em] opacity-80">
                  <span v-if="stock[selectedSize] > 9">In stock</span>
                  <span v-else-if="stock[selectedSize] > 0">Only {{ stock[selectedSize] }} left</span>
                  <span v-else class="opacity-60">Out of stock</span>
                </div>
              </div>

              <!-- Select size -->
              <div class="flex justify-between">
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
          <div
            class="overflow-y-scroll flex-1">
            <div class="m-0">
              <ContentRenderer :value="product" />
            </div>

            <!-- Material -->
            <div class="mt-[1em]">
              <h3 class="">Material</h3>
              <ul>
                <li v-for="(material, index) in product.material" :key="index">{{ material }}</li>
              </ul>
            </div>

            <!-- Sizing info -->
            <div v-if="product.sizing" class="mt-[1em] table-auto">
              <h3 class="">Sizing</h3>
              {{ product.sizing }}
            </div>
          </div>
        </div>

        <div class="w-full sticky bottom-0 p-[1.5em] z-10">
          <button
            class="w-full text-white uppercase bg-pink text-center border-[1px] border-pink py-[1em] hover:bg-white hover:text-pink"
            :class="{
              'pointer-events-none': cart.isHoverDisabled || stock[selectedSize] === 0 || !inStock,
              '!bg-white !text-pink': stock[selectedSize] === 0 || !inStock,
            }"
            @click="addToCart"
          >
            {{
              !inStock || stock[selectedSize] === 0
                ? 'Out of stock'
                : cart.isLoading
                  ? `Adding... €${product.price}`
                  : (showSelectSizeMessage
                    ? 'Please select a size'
                    : `Add to cart €${product.price}`)
            }}
          </button>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { useRoute } from 'vue-router'
import { useCartStore } from '~/stores/cart'
import { useProductStore } from '~/stores/products'

const cart = useCartStore()
const route = useRoute()
const productStore = useProductStore()

// Fetch product details from nuxt/content
const { data: product } = await useAsyncData(route.path, () => {
  return queryCollection('shop').path(route.path).first()
})

if (!product.value) {
  throw createError({
    statusCode: 404,
    statusMessage: 'Page Not Found',
  })
}

// Fetch stock and price data for the current product
await productStore.fetchSingleProductData(product.value.slug)

// Use stock and price from the store
const stock = ref(productStore.getStock(product.value.slug))
const inStock = ref(!productStore.isOutOfStock(product.value.slug))
product.value.price = product.value.price || productStore.stripePrices[product.value.slug]?.price

const selectedSize = ref(null)

function selectSize(size) {
  selectedSize.value = size
}

const showSelectSizeMessage = ref(false)

function addToCart() {
  if (!selectedSize.value) {
    showSelectSizeMessage.value = true

    setTimeout(() => {
      showSelectSizeMessage.value = false
    }, 1000)
    return
  }
  cart.addItem({ ...product.value, size: selectedSize.value })
}
</script>

<style scoped>
th {
  @apply font-normal;
}
</style>
