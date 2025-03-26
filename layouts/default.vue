<template>
  <div class="flex flex-col min-h-screen justify-between">
    <Nav />
    <Cart />
    <main class="flex-1 flex flex-col">
      <slot />
    </main>
    <Footer />
  </div>
</template>
