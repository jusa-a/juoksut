<template>
  <div>
    <section>
      <h2>ORDER INFO & POLICY</h2>
      <div>
        <h3>1. Products</h3>
        <div>
          We currently offer the following types of products and registrations:
          <ul>
            <li>Merch from our previous batches, available for immediate purchase.</li>
            <li>Preorder merch, which will be made based on the number of orders received during the preorder period.</li>
            <li>Trip registrations for trips organized by Juoksut ry for its members.</li>
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
        <p>
          Trip registrations are subject to the trip terms and conditions listed below.
        </p>

        <h3>5. Disclaimer for Delays</h3>
        <p>
          We try to meet estimated timelines. However, preorders may experience delays due to unforeseen circumstances. If there are any changes to your order status, we will inform you promptly.
        </p>

        <h3>6. Contact</h3>
        <p>
          If you have any questions regarding an item, preorder, pickup, or any other issues, please reach out to us at <a href="mailto:crew@juoksut.run">crew@juoksut.run</a>
        </p>

        <h3>7. Trips & Registrations (Terms & Conditions)</h3>
        <ol>
          <li>
            <strong>Scope of Application.</strong> These terms and conditions apply to trips organized by Juoksut ry (hereinafter referred to as the Association) for its members. The trips are not commercial package tours but activities offered by the Association to its members.
          </li>
          <li>
            <strong>Registration and Binding Nature.</strong> Registration for the trip becomes binding after the registration deadline.
          </li>
          <li>
            <strong>Price and Payment Terms.</strong> The price of the trip will be announced in the trip description. The price includes only those services that are specifically mentioned. The payment schedule and method will be communicated separately. If payment is not made by the due date, the Association reserves the right to cancel the participation.
          </li>
          <li>
            <strong>Cancellation Terms.</strong> A participant may cancel their participation by notifying the Association.
            <ul>
              <li>If the cancellation is made before the specified deadline, the payment will be refunded minus any costs already incurred.</li>
              <li>In the case of later cancellations, the Association has the right to retain part or all of the payment corresponding to the incurred costs.</li>
            </ul>
          </li>
          <li>
            <strong>Association’s Right to Changes and Cancellation of the Trip.</strong> The Association reserves the right to make minor changes to the itinerary. The Association also has the right to cancel the trip due to reasons such as an insufficient number of participants or force majeure. In such cases, all payments made will be refunded in full.
          </li>
          <li>
            <strong>Liability and Insurance.</strong> Participants join the trip at their own risk. The Association is not liable for personal injury, damage to property, or other losses suffered by participants unless the damage results from the Association’s gross negligence. Participants are advised to obtain their own travel insurance.
          </li>
          <li>
            <strong>Participant’s Obligations.</strong> Participants must follow the instructions of the tour leader and observe generally accepted standards of conduct. Disruptive behavior or conduct that endangers safety may result in removal from the trip without any right to a refund.
          </li>
          <li>
            <strong>Disputes.</strong> Any disputes shall primarily be resolved through negotiation between the participant and the Association.
          </li>
        </ol>
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

ol {
  @apply list-decimal list-outside grid grid-cols-1 gap-[0.8em] ms-[1em] mt-[0.7em] pl-[0.8em];

  strong {
    @apply font-[500];
  }
}
</style>
