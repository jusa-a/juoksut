<template>
  <div
    class="w-full bg-pink h-[1px]"
    :class="{ 'sticky top-[calc(var(--nav-height))]': sticky }">
  </div>
</template>

<script setup>
defineProps({
  sticky: Boolean,
})
</script>
