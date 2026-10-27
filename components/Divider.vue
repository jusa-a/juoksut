<template>
  <div
    class="w-full bg-pink h-[1px] z-[801]"
    :class="{ 'sticky top-[calc(var(--nav-height))] mix-blend-multiply': sticky }">
  </div>
</template>

<script setup>
defineProps({
  sticky: Boolean,
})
</script>
