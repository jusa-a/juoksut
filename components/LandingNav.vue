<template>
  <div
    class="navContainer flex flex-col sticky top-0 mix-blend-multiply z-[1001] h-[5em]">
    <div class=" flex p-[0.15em] overflow-hidden h-full">
      <div class="spin-container self-center min-w-[4.5em] mx-[0.2em] overflow-hidden">
        <img
          class="logo py-[0.4em] px-[0.1em]"
          src="/logo.svg"
          alt="JUOKSUT RUN CLUB LOGO" />
      </div>
      <nav class="flex flex-wrap justify-between items-end flex-1">
        <h1
          class="home flex self-center pl-[0.6em] pb-[0.28em] pt-[0.7em] translate-x-[0.3em]">
          <NuxtLink to="/">JUOKSUT</NuxtLink>
        </h1>
      </nav>
    </div>
  </div>
  <Divider class="mix-blend-multiply z-[800] sticky top-[5em]" />
</template>

<script setup>

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
  @apply font-serif font-medium tracking-[-0.04em];
  font-size: min(18.5vw, 4.6em);
  line-height: 0.7em;
  padding-right: 0.1em;

  transition: 0.15s;
  transform: skewX(-8deg);

  -webkit-text-stroke-width: 0.01em;
  -webkit-text-stroke-color: #ff639a;
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
