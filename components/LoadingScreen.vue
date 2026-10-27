<template>
  <!--
    Centred on svh, which holds still while iOS Safari's toolbar grows and
    shrinks. On a navigation the nav stays, so the spinner centres in the area
    below it and waits for the page to fade out first.
  -->
  <Transition name="fade">
    <div
      v-if="isVisible"
      class="loading-screen fixed z-[9999] left-1/2 -translate-x-1/2 -translate-y-1/2"
      :class="belowNav ? 'top-[calc(50svh+var(--nav-height)/2)]' : 'top-[50svh]'"
    >
      <img src="/logo-circle.svg" alt="" class="spinner w-[7em]">
    </div>
  </Transition>
</template>

<script setup>
defineProps({
  isVisible: Boolean,
  belowNav: Boolean,
})
</script>

<style scoped>
/* Waits out the page's own 0.25s fade (app.vue), so it never sits on the old page. */
.fade-enter-active {
  transition: opacity 0.2s ease-out 0.25s;
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
