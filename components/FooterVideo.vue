<template>
  <div class="mt-auto">
    <Divider />
    <video
      ref="video"
      class="object-cover object-center w-[100%] h-[12em]"
      autoplay
      playsinline
      loop
      muted>
      <source
        src="/juoksut.mp4"
        type="video/mp4" />
    </video>
  </div>
</template>

<script setup></script>

<style scoped>
</style>
