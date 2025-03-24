<template>
  <Transition name="fade">
    <div
      v-if="isVisible"
      class="fixed left-0 top-0 z-[1005] flex flex-col w-full h-[100vh]">
      <div
        :class="{ fullScreen: pageReload }"
        class="h-[calc(var(--nav-height)+1px)]"
      />
      <div class="h-[calc(100vh-var(--nav-height)-1px)] flex justify-center bg-white items-end pb-[48vh]">
        <img src="/logo-circle.svg" alt="loading spinner logo" class="spinner w-[7em]" />
      </div>
      <div class="grow" />
    </div>
  </Transition>
</template>

<script setup>
defineProps({
  isVisible: Boolean,
  pageReload: Boolean,
})
</script>

<style scoped>
.fullScreen {
  background-color: white;
}

.fade-enter-active {
  transition: opacity 0.18s ease-out;
}

.fade-leave-active {
  transition: opacity 0.25s ease-in;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.spinner {
  animation: spin 1.6s linear infinite;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
</style>
