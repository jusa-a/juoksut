<template>
  <div
    class="navContainer flex sticky top-0 z-99 p-[0.15em] h-[var(--nav-height)] divider-b">
    <div class="spin-container self-center min-w-[calc(var(--nav-height)-1em)] mx-[0.2em] overflow-hidden">
      <img
        class="logo py-[0.4em] px-[0.1em]"
        src="/logo.svg"
        alt="JUOKSUT RUN CLUB LOGO" />
    </div>
    <nav class="flex flex-wrap justify-between items-end flex-1">
      <div
        class="home flex self-center pl-[0.6em] pb-[0.28em] pt-[0.9em] translate-x-[0.3em]">
        <NuxtLink to="/">JUOKSUT</NuxtLink>
      </div>

      <div
        class="navLinks flex gap-[4em] flex-1 grow justify-between ml-[auto] text-right pl-[0.5vw] pr-[0.5em]">
        <NuxtLink to="/join">JOIN</NuxtLink>
        <NuxtLink to="/shop">SHOP</NuxtLink>
        <NuxtLink to="">CART</NuxtLink>
      </div>
    </nav>
  </div>
</template>

<script setup></script>

<style scoped>
@keyframes spin {
  0% {
    transform: rotateY(0deg);
  }
  100% {
    transform: rotateY(-360deg);
  }
}

.spin-container {
  perspective: 1000px;
}

.logo {
  animation: spin 5s infinite linear;
  transform-origin: center;
}

.navContainer {
  mix-blend-mode: multiply;
  overflow: hidden;
}

.home {
  line-height: 0;
  overflow: hidden;
}

.home a {
  @apply font-serif font-medium tracking-[-0.03em];
  font-size: min(18.5vw, 4.6em);
  line-height: 0.7em;
  padding-right: 0.1em;

  transition: 0.15s;
  transform: skewX(-8deg);
}

.navLinks {
  max-width: 18em;
}

.navLinks a {
  padding-top: 0.2em;
  line-height: 1em;
}

a::before {
  display: block;
  content: attr(title);
  height: 0;
  overflow: hidden;
  visibility: hidden;
}

.navLinks > .router-link-active {
  transform: skewX(-10deg);
  text-decoration: underline;
}
</style>
