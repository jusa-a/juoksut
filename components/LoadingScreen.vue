<template>
  <!--
    Centred on svh, which holds still while iOS Safari's toolbar grows and
    shrinks. On a navigation the nav stays, so the spinner centres in the area
    below it.
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
/* Comes in like the page fades out and leaves in step with the next page's
   fade-in (timings in app.vue). */
.fade-enter-active {
  transition: var(--fade-out);
}

.fade-leave-active {
  transition: var(--fade-in);
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
