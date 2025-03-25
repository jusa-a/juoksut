<template>
  <div
    class="navContainer flex flex-col sticky top-0 mix-blend-multiply z-[1001] h-[var(--nav-height)]"
    v-on="isCartOpen ? { click: toggleCart } : {}">
    <div class=" flex p-[0.15em] overflow-hidden h-full">
      <div class="spin-container self-center min-w-[calc(var(--nav-height)-1em)] mx-[0.2em] overflow-hidden">
        <img
          class="logo py-[0.4em] px-[0.1em]"
          src="/logo.svg"
          alt="JUOKSUT RUN CLUB LOGO" />
      </div>
      <nav class="flex flex-wrap justify-between items-end flex-1">
        <h1
          class="home flex self-center pl-[0.6em] pb-[0.28em] pt-[0.9em] translate-x-[0.3em]">
          <NuxtLink to="/">JUOKSUT</NuxtLink>
        </h1>

        <div
          class="navLinks flex gap-[4em] flex-1 grow justify-between ml-[auto] text-right pl-[0.5vw] pr-[0.5em]">
          <NuxtLink to="/join">JOIN</NuxtLink>
          <NuxtLink to="/shop">SHOP</NuxtLink>
          <button :class="{ cartActive: isCartOpen }" @click="toggleCart">
            CART({{ cartItems.length }})
          </button>
        </div>
      </nav>
    </div>
  </div>
  <Divider sticky class="mix-blend-multiply z-[800]" />
</template>

<script setup>
defineProps({
  isCartOpen: Boolean,
  toggleCart: Function,
  cartItems: Array,
})
</script>

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

.home {
  font-size: inherit;
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

.navLinks a,
.navLinks button {
  padding-top: 0.2em;
  line-height: 1em;
}

a::before,
button::before {
  display: block;
  content: attr(title);
  height: 0;
  overflow: hidden;
  visibility: hidden;
}

.navLinks > .router-link-active,
.cartActive {
  transform: skewX(-10deg);
  text-decoration: underline;
}

@media (hover: hover) {
  .navLinks a:hover,
  button:hover {
    transform: skewX(-10deg);
    opacity: 70%;
  }
}
</style>
