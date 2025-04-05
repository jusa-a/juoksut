<template>
  <div class="flex-1 flex flex-col">
    <section class="flex flex-row flex-wrap justify-around items-center w-full p-[1em] gap-[1em] m-0 mb-auto">
      <template v-for="product in products" :key="product.slug">
        <NuxtLink
          :to="`/shop/${product.slug}`"
          class="min-w-[290px] max-w-[26em] flex-1"
        >
          <div class="shopItem border-[1px] border-transparent hover:border-pink">
            <div class="aspect-[4/5] flex items-center justify-center">
              <NuxtImg
                :src="product.img"
                :alt="product.title"
                height="1875"
                width="1500"
              />
            </div>

            <div class="whitespace-nowrap text-[0.95em] py-[0.5em] px-[0.5em]">
              <div>{{ product.title }}</div>
              <div class="uppercase">
                {{ !product.totalStock > 0
                  ? 'Out of stock'
                  : `€${product.price}` }}
              </div>
            </div>
          </div>
        </NuxtLink>
      </template>
    </section>

    <div class="h-[3em]" />

    <FooterVideo />
  </div>
</template>

<script setup>
import { useProductStore } from '~/stores/products'

const productStore = useProductStore()

await callOnce(async () => {
  await productStore.fetchProducts()
} /* { mode: 'navigation' } */)

// Convert the products object to an array and sort by id in descending order
const products = Object.values(productStore.products).sort((a, b) => b.id - a.id)
</script>

<style scoped>
a {
  cursor: cell;
}
a:hover {
  transition: 0s;
  opacity: 1;
}
</style>
