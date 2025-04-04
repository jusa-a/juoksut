<template>
  <section>
    <h2 class="uppercase">Payment Successful!</h2>
    <p>
      Thank you for your order {{ orderDetails ? orderDetails.customer_details.name : '' }} &lt;3
    </p>
    <p>
      You will receive a receipt to {{ orderDetails?.customer_details.email || '' }}.
    </p>

    <div v-if="orderDetails" class="my-[0.5em]">
      <h3 class="uppercase">Order Summary</h3>
      <div v-for="(item, index) in orderDetails.line_items" :key="index">
        <div class="flex py-[0.5em] gap-[0.5em]">
          <div class="flex-1 flex flex-col">
            <div>{{ item.description }}</div>
            <div>Quantity: {{ item.quantity }}</div>
          </div>
          <div class="self-end">€{{ (item.amount_total / 100).toFixed(2) }}</div>
        </div>
      </div>
      <div class="text-right font-[500] mt-[0.5em]">
        Total: €{{ (orderDetails.amount_total / 100).toFixed(2) }}
      </div>
    </div>

    <div class="mb-[1em]">
      <p>
        We will be in touch with you soon about the pickup details.
      </p>
      <p>
        Meanwhile, if you have any questions, feel free to reach out to us <a href="mailto:info@juoksut.run">info@juoksut.run</a>.
      </p>
    </div>

    <NuxtLink to="/" class="mx-auto my-[1em] px-[5em] text-white uppercase bg-pink text-center border border-pink py-[0.6em] hover:bg-white hover:text-pink active:opacity-50">
      Go back home
    </NuxtLink>
  </section>
</template>

<script setup>
import { useCartStore } from '~/stores/cart'

const cart = useCartStore()
cart.clearCart()

const route = useRoute()
const stripeSessionId = route.query.session_id
const orderDetails = ref(null)

const { data } = await useFetch(`/api/order-details?session_id=${stripeSessionId}`)
orderDetails.value = data.value
</script>
