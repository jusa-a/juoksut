<template>
  <div>
    <section>
      <h2>ORDER INFO & POLICY</h2>
      <div>
        <h3>1. Products</h3>
        <div>
          We currently offer two types of products:
          <ul>
            <li>Merch from our previous batches, available for immediate purchase.</li>
            <li>Preorder merch, which will be made based on the number of orders received during the preorder period.</li>
          </ul>
        </div>

        <h3>2. Preorder Process</h3>
        <p>
          Preorders allow us to make the exact number of products needed. Once the preorder period ends, we will finalize the production schedule. Details about the timeline will be updated to the customers as they are confirmed.
        </p>

        <h3>3. Delivery & Pickup</h3>
        <p>
          We do not offer shipping at the moment. We will contact customers to arrange pickup details. We will reach out to customers about possible pickup locations and times. If you are unable to pick up your order, please let us know in advance.
        </p>
        <p>
          For local customers, we may also try to arrange deliveries ourselves.
        </p>

        <h3>4. Returns & Refunds</h3>
        <p>
          Preorders are non-refundable once processing begins. If your product arrives damaged or is lost during local delivery, please contact us at <a href="mailto:crew@juoksut.run">crew@juoksut.run</a> within 14 days from delivery or pickup.
        </p>

        <h3>5. Disclaimer for Delays</h3>
        <p>
          We try to meet estimated timelines. However, preorders may experience delays due to unforeseen circumstances. If there are any changes to your order status, we will inform you promptly.
        </p>

        <h3>6. Contact</h3>
        <p>
          If you have any questions regarding an item, preorder, pickup, or any other issues, please reach out to us at <a href="mailto:crew@juoksut.run">crew@juoksut.run</a>
        </p>
      </div>
    </section>

    <div class="h-[4em]" />

    <FooterVideo />
  </div>
</template>

<script setup></script>

<style scoped>
h3 {
  @apply text-[1.1em] font-[500] mt-[0.7em] uppercase;
}

ul {
  @apply list-disc list-outside grid grid-cols-1 gap-[0.4em] ms-[1em] mt-[0.7em];
}
</style>
