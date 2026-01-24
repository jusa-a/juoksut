<template>
  <div class="text-center h-[100vh] flex flex-col justify-center items-center">
    <h1 class="text-[4em] leading-[0.9em]">{{ error?.statusCode }}</h1>
    <p>{{ error?.statusMessage }}</p>
    <button
      class="underline active:opacity-50 my-[1em]"
      @click="handleError"
    >
      Go back home
    </button>
  </div>
</template>

<script setup lang="ts">
const error = useError()

const handleError = () => clearError({ redirect: '/' })
</script>
