<template>
  <Transition name="cart">
    <div v-show="cart.isCartOpen" class="fixed top-0 w-full h-full z-[802]">
      <div class="navOverlay h-[var(--nav-height)] w-full bg-white" />
      <Divider />

      <div class="cartContainer w-full flex flex-wrap h-[calc(100%-var(--nav-height)-1px)]">
        <div
          class="dimOverlay flex-1 min-w-[200px] bg-black bg-opacity-25 border-pink border-r-[1px]"
          @click="cart.toggleCart"
        />

        <div class="cart h-full flex-1 min-w-[300px] flex flex-col bg-white">
          <div class="flex-1 overflow-y-scroll text-[0.8em]/[1.3em] flex flex-col">
            <ClientOnly fallback-tag="p" fallback="Loading cart...">
              <template v-if="cart.totalItems === 0">
                <p class="m-auto">Your cart is empty.</p>
              </template>

              <template v-else>
                <div
                  v-for="(item, index) in cart.items"
                  :key="index">
                  <div class="flex p-[1.3em] gap-[0.6em]">
                    <NuxtLink :to="`/shop/${item.slug}`" class="self-center w-[10em]">
                      <NuxtImg
                        :src="item.img"
                        :alt="item.title"
                        height="250"
                        width="200"
                      />
                    </NuxtLink>

                    <div class="flex-1 flex flex-col">
                      <div>{{ item.title }}</div>
                      <div>Size: {{ item.size }}</div>
                      <div>Quantity: {{ item.quantity }}</div>
                      <button class="opacity-70 pt-[0.5em] mt-auto mr-auto hover:underline" @click="cart.removeItem(item.slug, item.size)">
                        Remove
                      </button>
                    </div>

                    <div>
                      <div>€{{ item.price * item.quantity }}</div>
                    </div>
                  </div>

                  <Divider class="opacity-30" />
                </div>
              </template>
            </ClientOnly>
          </div>

          <div>
            <div v-if="checkoutError" class="text-red-500 text-[0.8em]/[1.3em] p-[0.5em] border border-t-red-500 flex justify-between items-center">
              {{ checkoutError }}
              <div class="text-center">
                <button
                  class="text-white bg-red-500 px-2 py-1 hover:bg-red-600"
                  @click="clearCartAndReload"
                >
                  Refresh Cart
                </button>
              </div>
            </div>

            <Divider />
            <div class="px-[1em] py-[1.4em] flex flex-col justify-center items-center bg-white">
              <div class="flex justify-between w-full pb-[1.6em] text-[0.8em]/[1.3em]">
                <span>Subtotal</span>
                <ClientOnly fallback-tag="span" fallback="Loading...">
                  <span>€{{ cart.totalPrice }}</span>
                </ClientOnly>
              </div>

              <ClientOnly fallback-tag="span" fallback="Loading...">
                <template v-if="cart.totalItems === 0">
                  <NuxtLink
                    to="/shop"
                    class="self-stretch text-pink uppercase bg-white text-center border-[1px] border-pink py-[1em] hover:bg-pink hover:text-white active:opacity-50"
                  >
                    Shop
                  </NuxtLink>
                </template>
                <template v-else>
                  <button
                    class="self-stretch text-white uppercase bg-pink text-center border-[1px] border-pink py-[1em] hover:bg-white hover:text-pink active:opacity-50"
                    :class="{ 'pointer-events-none': cart.isHoverDisabled }"
                    @click="handleCheckout"
                  >
                    {{ cart.isLoading ? 'Updating...' : 'Checkout' }}
                  </button>
                </template>
              </ClientOnly>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { useCartStore } from '~/stores/cart'

const cart = useCartStore()
const checkoutError = ref('') // State to store the error message

// Handle checkout --> redirect to Stripe Checkout
// Call server to create a Stripe checkout session
async function handleCheckout() {
  try {
    checkoutError.value = '' // Clear any previous error
    const { data, error } = await useFetch('/api/checkout', {
      method: 'POST',
      body: JSON.stringify({ items: cart.items }),
    })

    if (error.value) {
      console.error('Error during checkout:', error.value)
      checkoutError.value = error.value.data.message || 'An error occurred during checkout'
      return
    }

    if (data.value?.url) {
      window.location.href = data.value.url // Redirect to Stripe Checkout
    }
    else {
      console.error('Failed to create Stripe session')
      checkoutError.value = 'Failed to create checkout session'
    }
  }
  catch (error) {
    console.error('Unexpected error:', error)
    checkoutError.value = 'Unexpected error occurred during checkout'
  }
}

// Clear the cart and reload the page
function clearCartAndReload() {
  cart.clearCart()
  window.location.reload()
}
</script>

<style scoped>
.cart-enter-active {
  transition: opacity 0.35s ease-out;
}

.cart-leave-active {
  transition: opacity 0.25s ease-in;
  opacity: 1;
}

.cart-enter-from,
.cart-leave-to {
  opacity: 0;
}
</style>
