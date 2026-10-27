<template>
  <!-- Centred on svh, which holds still while iOS Safari's toolbar grows and shrinks. -->
  <Transition name="fade">
    <div
      v-if="isVisible"
      class="loading-screen fixed z-[9999] left-1/2 top-[50svh] -translate-x-1/2 -translate-y-1/2"
    >
      <img src="/logo-circle.svg" alt="" class="spinner w-[7em]">
    </div>
  </Transition>
</template>

<script setup>
defineProps({
  isVisible: Boolean,
})
</script>

<style scoped>
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
