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
            <div class="pt-[1em] pb-[0.7em]">
              €{{ product.price }}
            </div>

            <!-- Size selector -->
            <div class="mx-[1em] flex-1 flex justify-around">
              <button
                v-for="(size, index) in product.sizes"
                :key="index"
                class="py-[1em] uppercase"
                :class="[{ underline: selectedSize === size }]"
                @click="selectedSize = size"
              >
                {{ size }}
              </button>
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
            <div class="mt-[1em] table-auto">
              <h3 class="">Sizing</h3>
              <table>
                <thead>
                  <tr>
                    <th>Size</th>
                    <th>Width (cm)</th>
                    <th>Length (cm)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(sizeInfo, index) in product.sizing" :key="index">
                    <td>{{ sizeInfo.size }}</td>
                    <td>{{ sizeInfo.width }}</td>
                    <td>{{ sizeInfo.length }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div class="w-full sticky bottom-0 p-[1.5em] z-10">
          <button
            class="w-full text-white uppercase bg-pink text-center border-[1px] border-pink py-[1em] hover:bg-white hover:text-pink"
            :class="{ 'pointer-events-none': cart.isHoverDisabled }"
            @click="addToCart"
          >
            {{ cart.isLoading ? `Adding... €${product.price}` : (showSelectSizeMessage ? 'Please select a size' : `Add to cart €${product.price}`) }}
          </button>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { useCartStore } from '~/stores/cart'

const cart = useCartStore()
const route = useRoute()

const { data: product } = await useAsyncData(route.path, () => {
  return queryCollection('shop').path(route.path).first()
})

const selectedSize = ref('')
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
