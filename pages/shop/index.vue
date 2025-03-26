<template>
  <div class="flex-1 flex flex-col">
    <section class="flex flex-row flex-wrap justify-around items-center w-full p-[0.8em] gap-[0.8em] m-0 mb-auto">
      <template v-for="product in products" :key="product.id">
        <NuxtLink
          :to="product.path"
          class="min-w-[290px] max-w-[26em] flex-1">
          <div class="shopItem border-[1px] border-transparent hover:border-pink">
            <div class="aspect-[4/5] flex items-center justify-center">
              <NuxtImg
                :src="`/${product.img}`"
                :alt="product.title"
                height="1280"
                width="1024"
              />
            </div>

            <div class=" whitespace-nowrap text-[0.95em] py-[0.8em] px-[0.5em]">
              <div>{{ product.title }}</div>
              <div>€{{ product.price }}</div>
            </div>
          </div>
        </NuxtLink>
      </template>
    </section>

    <FooterVideo />
  </div>
</template>

<script setup lang="ts">
const { data: products } = await useAsyncData('shop', () => queryCollection('shop').all())
</script>

<style scoped>
a,
a:hover {
  transition: 0s;
  opacity: 1;
}
</style>
