<template>
  <Transition name="cart">
    <div v-show="isCartOpen">
      <div class="cartContainer flex flex-col bg-white border-pink border-l-[1px]">
        <div class="flex flex-col grow overflow-y-auto text-[0.8em]/[1.3em]">
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

      <div class="navOverlay h-[var(--nav-height)] bg-white"></div>

      <div class="dimOverlay" @click="toggleCart"></div>
    </div>
  </Transition>
</template>

<script setup>
defineProps({
  isCartOpen: Boolean,
  toggleCart: Function,
})

const cartItems = ref([
  { name: 'Product 1', price: 25, quantity: 1, size: 'M' },
  { name: 'Product 2', price: 30, quantity: 2, size: 'L' },
  { name: 'Product 3', price: 25, quantity: 1, size: 'S' },
  { name: 'Product 4', price: 30, quantity: 3, size: 'M' },
  { name: 'Product 5', price: 30, quantity: 1, size: 'L' },
  { name: 'Product 6', price: 30, quantity: 2, size: 'S' },
  { name: 'Product 7', price: 30, quantity: 1, size: 'M' },
  { name: 'Product 8', price: 30, quantity: 1, size: 'L' },
  { name: 'Product 9', price: 30, quantity: 2, size: 'S' },
])

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
.cart-enter-active,
.cart-leave-active {
  transition: opacity 0s ease;
  opacity: 1;
}

.cart-enter-from,
.cart-leave-to {
  opacity: 0;
}

.cartContainer {
  position: fixed;
  z-index: 1000;
  right: 0;
  top: var(--nav-height);
  width: clamp(50%, 500px, 100%);
  height: calc(100% - var(--nav-height));
}

.navOverlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: var(--nav-height);
  background-color: white;
  z-index: 999;
}

.dimOverlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.2); /* Dim background */
  z-index: 995;
}
</style>
