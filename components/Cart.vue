<template>
  <Transition name="cart">
    <div v-show="cart.isCartOpen" class="fixed top-0 w-full h-full z-[802]">
      <div class="navOverlay h-[var(--nav-height)] w-full bg-white" />
      <Divider />

      <div class="cartContainer w-full flex flex-wrap h-[calc(100%-var(--nav-height)-1px)]">
        <div
          class="dimOverlay flex-1 min-w-[200px] bg-black bg-opacity-25"
          @click="cart.toggleCart"
        />

        <div class="cart h-full flex-1 min-w-[300px] flex flex-col bg-white border-pink border-l-[1px]">
          <div class="flex-1 overflow-y-scroll text-[0.8em]/[1.3em] flex flex-col">
            <template v-if="cart.items.length === 0">
              <p class="m-auto">Your cart is empty.</p>
            </template>

            <template v-else>
              <div
                v-for="(item, index) in cart.items"
                :key="index">
                <div class="flex p-[1.5em] gap-[0.5em]">
                  <div class="self-center w-[10em] mx-[0.2em]">
                    <NuxtLink :to="item.path">
                      <NuxtImg
                        :src="`/${item.img}`"
                        :alt="item.title"
                        height="250"
                        width="200"
                      />
                    </NuxtLink>
                  </div>

                  <div class="flex-1 flex flex-col">
                    <div>{{ item.title }}</div>
                    <div>Size: {{ item.size }}</div>
                    <div>Quantity: {{ item.quantity }}</div>
                    <button class="opacity-70 pt-[0.5em] mt-auto mr-auto hover:underline" @click="cart.removeItem(item.id, item.size)">Remove</button>
                  </div>

                  <div>
                    <div>€{{ item.price * item.quantity }}</div>
                  </div>
                </div>

                <Divider class="opacity-30" />
              </div>
            </template>
          </div>

          <div>
            <Divider />
            <div class="p-[1.5em] flex flex-col justify-center items-center bg-white">
              <div class="flex justify-between w-full pb-[1.5em] text-[0.8em]/[1.3em]">
                <span>Subtotal</span>
                <span>€{{ cart.totalPrice }}</span>
              </div>

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

// Handle checkout --> redirect to Stripe Checkout
// Call server to create a Stripe checkout session
async function handleCheckout() {
  try {
    const { data, error } = await useFetch('/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: cart.items.map(item => ({
          priceId: item.priceId,
          quantity: item.quantity,
          size: item.size,
        })),
      }),
    })

    if (error.value) {
      console.error('Error during checkout:', error.value)
      return
    }

    if (data.value?.url) {
      window.location.href = data.value.url // Redirect to Stripe Checkout
    }
    else {
      console.error('Failed to create Stripe session')
    }
  }
  catch (error) {
    console.error('Unexpected error:', error)
  }
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
