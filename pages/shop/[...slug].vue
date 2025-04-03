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

      <div class="prodInfo flex-1 min-w-[300px] flex flex-col ">
        <div class="flex-1 flex flex-col p-[1.5em] pb-[8em]">
          <div class="flex flex-col">
            <h2>{{ product.title }}</h2>
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
          <div class="flex-1">
            <div class="m-0" v-html="product.description"></div> <!-- Use v-html -->

            <!-- Material -->
            <div v-if="!product.material.length === 0" class="mt-[1em]">
              <h3>Material</h3>
              <ul>
                <li v-for="(material, index) in product.material" :key="index">{{ material }}</li>
              </ul>
            </div>

            <!-- Sizing info -->
            <div v-if="product.sizing" class="mt-[1em] table-auto">
              <h3>Sizing</h3>
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

const route = useRoute()
const productStore = useProductStore()

// Use useAsyncData to fetch the product during SSR and reuse it on the client
// const { data } = await useAsyncData(`product-${route.params.slug[0]}`, async () => productStore.fetchSingleProduct(route.params.slug[0]))

const product = await productStore.fetchSingleProduct(route.params.slug[0])

if (!product) {
  throw createError({
    statusCode: 404,
    statusMessage: `Page not found: /${route.params.slug}`,
  })
}

// Convert stock array to an object for easier access
const stock = Object.fromEntries(
  product.stock.map(({ size, quantity }) => [size, quantity]),
)

// Determine if the product is in stock
const inStock = product.totalStock > 0
const selectedSize = ref(null)
const showSelectSizeMessage = ref(false)
const cart = useCartStore()

function selectSize(size) {
  selectedSize.value = size
}

function addToCart() {
  if (!selectedSize.value) {
    showSelectSizeMessage.value = true

    setTimeout(() => {
      showSelectSizeMessage.value = false
    }, 1000)
    return
  }

  cart.addItem({ ...product, size: selectedSize.value })
}
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
</style>
