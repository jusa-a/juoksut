<template>
  <!--
    Holds the space at Instagram's 3:4 portrait with a faint pink while the
    image loads, then fades it in at its own size.
  -->
  <div :class="loaded ? '' : 'relative aspect-[3/4] bg-pink/10'">
    <img
      ref="img"
      :src="src"
      :alt="alt"
      class="block w-full transition-opacity duration-[350ms] ease-in-out"
      :class="loaded ? 'h-auto opacity-100' : 'absolute inset-0 h-full object-cover opacity-0'"
      @load="loaded = true"
    >
  </div>
</template>

<script setup>
defineProps({
  src: { type: String, required: true },
  alt: { type: String, required: true },
})

const img = ref(null)
const loaded = ref(false)

// A cached image can finish before the app is listening.
onMounted(() => {
  if (img.value?.complete && img.value.naturalWidth)
    loaded.value = true
})
</script>
