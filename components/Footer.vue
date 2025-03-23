<template>
  <footer class="bg-white divider-t flex flex-col px-[0.5em] p justify-around pt-[0.6em]">
    <div class="flex justify-between items-center">
      <div class="flex flex-col self-stretch justify-between flex-1">
        <a href="https://www.strava.com/clubs/juoksut">STRAVA</a>
        <a href="https://www.instagram.com/juoksut/">INSTAGRAM</a>
      </div>

      <img
        class="w-[3.5em]"
        src="/logo-outline.svg"
        alt="JUOKSUT OUTLINE LOGO" />

      <div class="flex flex-col items-end self-stretch justify-between flex-1">
        <NuxtLink to="/orders">ORDERING INFO</NuxtLink>
        <NuxtLink to="/archive">ARCHIVE</NuxtLink>
      </div>
    </div>

    <div class="self-center">
      <p class="font-serif font-medium text-[1.3em] tracking-[-0.03em] mt-0">
        Living the Lightspeed Lifestyle
      </p>
    </div>

    <div class="flex justify-between text-[0.5em] font-light">
      <div> © JUOKSUT RY 2025 </div>
      <div><a href="mailto:crew@juoksut.run">crew@juoksut.run</a></div>
    </div>
  </footer>
</template>

<style scoped></style>
