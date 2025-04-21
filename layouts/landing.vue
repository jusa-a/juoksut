<template>
  <div class="flex flex-col min-h-screen justify-between">
    <LandingNav />
    <main class="flex-1 flex flex-col">
      <slot />
    </main>
    <FooterVideo />
    <Footer />
  </div>
</template>
