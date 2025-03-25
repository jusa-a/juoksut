<template>
  <Transition name="cart">
    <div v-show="isCartOpen" class="fixed top-0 w-full z-[802]">
      <div class="navOverlay h-[var(--nav-height)] w-full bg-white" />
      <Divider />

      <div class="cartContainer w-full flex flex-wrap h-[calc(100vh-var(--nav-height)-1px)]">
        <div class="dimOverlay flex-1 min-w-[200px] -z-10 bg-black bg-opacity-20" @click="toggleCart" />

        <div class="cart h-full flex-1 min-w-[300px] flex flex-col bg-white border-pink border-l-[1px]">
          <div class="flex-1 overflow-y-scroll text-[0.8em]/[1.3em]">
            <div
              v-for="(item, index) in cartItems"
              :key="index">
              <div class="flex p-[1.5em]">
                <div class="self-center w-[10em] mx-[0.2em] blur-md">
                  <img
                    src="/logo.svg"
                    alt="JUOKSUT RUN CLUB LOGO" />
                </div>

                <div class="grow">
                  <div>{{ item.name }}</div>
                  <div>Size: {{ item.size }}</div>
                  <div>Quantity: {{ item.quantity }}</div>
                </div>

                <div>
                  <div>€{{ item.price * item.quantity }}</div>
                </div>
              </div>

              <Divider class="opacity-30" />
            </div>
          </div>

          <div>
            <Divider />
            <div class="p-[1.5em] flex flex-col justify-center items-center bg-white">
              <div class="flex justify-between w-full pb-[1.5em] text-[0.8em]/[1.3em]">
                <span>Subtotal</span>
                <span>€{{ cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0) }}</span>
              </div>

              <button class="self-stretch text-white uppercase bg-pink text-center border-[1px] border-pink py-[1em] hover:bg-white hover:text-pink active:opacity-50" @click="handleCheckout">
                Checkout
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup>
defineProps({
  isCartOpen: Boolean,
  toggleCart: Function,
  cartItems: Array,
})

// Wait 1 second
// await new Promise(resolve => setTimeout(resolve, 1000))

// Handle checkout button click (redirect to Stripe Checkout)
async function handleCheckout() {
  const checkoutSession = await createStripeCheckoutSession()
  // Redirect the user to the Stripe Checkout page
  window.location.href = checkoutSession.url
}

// Function to call your server to create a Stripe checkout session
async function createStripeCheckoutSession() {
  const response = await fetch('/api/checkout', {
    method: 'POST',
    body: JSON.stringify({ items: cartItems.value }),
  })
  const session = await response.json()
  return session // This session contains the redirect URL
}
</script>

<style scoped>
.cart-enter-active {
  transition: opacity 0.25s ease-out;
}

.cart-leave-active {
  transition: opacity 0.2s ease-in;
  opacity: 1;
}

.cart-enter-from,
.cart-leave-to {
  opacity: 0;
}
</style>
