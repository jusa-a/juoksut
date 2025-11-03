<template>
  <Transition name="fade">
    <div v-if="isVisible">
      <div
        class="fix"
        :class="{ fullScreen: pageReload }"
      >
      </div>

      <Divider class="fixed top-0 mt-[var(--nav-height)] z-[803]" />

      <div class="fixed z-[9999] top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex items-center justify-center">
        <img src="/logo-circle.svg" alt="loading spinner logo" class="spinner w-[7em]" />
      </div>
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
.fix {
  position: fixed;
  inset: 0;
  background: rgba(255, 255, 255, 0.998) !important;
  z-index: 803;
}

.fullScreen {
  z-index: 1005;
}

.fade-enter-active {
  transition: opacity 0.2s ease-out;
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
