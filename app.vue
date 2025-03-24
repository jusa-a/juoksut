<template>
  <LoadingScreen :is-visible="isVisible" :page-reload="pageReload" />
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>

<script setup lang="ts">
const isVisible = ref(true) // Force visible on reload
const pageReload = ref(true) // // Ref for page reload detection

const { isLoading, start, finish } = useLoadingIndicator({
  throttle: 100,
})

// Loading screen on reload
onMounted(() => {
  setTimeout(() => {
    document.body.style.overflow = 'auto'
    pageReload.value = false
    isVisible.value = false
  }, 600) // Hide after a delay
})

watch(isLoading, (newVal) => {
  if (newVal) {
    isVisible.value = true
    document.body.style.overflow = 'hidden'
  }
  else {
    setTimeout(() => {
      isVisible.value = false
      document.body.style.overflow = 'auto'
    }, 200)
  }
})
</script>

<style>
.page-enter-active,
.page-leave-active {
  transition: all 0.3s;
}
.page-enter-from,
.page-leave-to {
  opacity: 0;
}
</style>
