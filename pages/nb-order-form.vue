<template>
  <div>
    <iframe
      data-tally-src="https://tally.so/embed/w4EX8d??alignLeft=1&hideTitle=1&transparentBackground=1&dynamicHeight=1"
      loading="lazy"
      width="100%"
      height="2834"
      frameborder="0"
      marginheight="0"
      marginwidth="0"
      title="NEW BALANCE ORDER FORM – JUOKSUT STOCKHOLM MARATHON 2025"
    ></iframe>

    <div class="h-[3em]" />
  </div>
</template>

<script lang="ts" setup>
definePageMeta({
  layout: 'landing',
})

useHead({
  title: 'NEW BALANCE ORDER FORM – JUOKSUT STOCKHOLM MARATHON 2025',
  script: [
    {
      src: 'https://tally.so/widgets/embed.js',
      async: true,
    },
  ],
})

useSeoMeta({
  robots: 'noindex, follow',
})

onMounted(() => {
  if (typeof Tally !== 'undefined') {
    Tally.loadEmbeds()
  }
})
</script>

<style>
</style>
