<template>
  <div>
    <section>
      <h2>PRIVACY POLICY</h2>
      <p class="font-[500]">Last updated: 23.08.2026</p>

      <h3>INTRODUCTION</h3>
      <p>This Privacy Policy explains how Juoksut ry (“Juoksut”, “we”, “our”, or “us”) processes personal data when you use <a href="https://juoksut.run">juoksut.run</a>, buy from our webshop, or register for an event through a service linked from the site.</p>

      <h3>WHO IS RESPONSIBLE FOR YOUR DATA</h3>
      <p>Juoksut ry is the controller for the personal data we use to run the club, webshop, and registrations. You can contact us at <a href="mailto:crew@juoksut.run">crew@juoksut.run</a>.</p>

      <h3>WHAT WE PROCESS</h3>
      <ul>
        <li><strong>Website use:</strong> Cloudflare hosts and protects the site and may process technical request data, such as IP address, device/browser information, and security logs, to deliver and secure the service.</li>
        <li><strong>Shopping cart:</strong> The cart stores selected products, sizes, and quantities in your browser’s LocalStorage. When you start checkout, those selections are sent to our checkout endpoint so we can create the payment session.</li>
        <li><strong>Webshop purchases and first-party registrations:</strong> Stripe Checkout collects your name, email address, phone number, payment and billing information where required, the purchased items, and any information you provide in an optional order note or required registration field (for example, camp shirt size). Stripe also creates a Stripe Customer for the purchase.</li>
        <li><strong>Order fulfilment:</strong> Juoksut can access the order, registration, name, email address, and phone number in the Stripe Dashboard to arrange registrations, deliveries, pickups, refunds, and customer support. Our own D1 database stores product, stock, and technical webhook records only; it is not used as a customer database.</li>
        <li><strong>Checkout confirmation:</strong> After checkout, the site retrieves a limited order summary from Stripe to show the confirmation page. This includes the name, email address, items, amount, currency, and payment status for that checkout session.</li>
        <li><strong>Third-party event forms and ticketing:</strong> Some pages link to or embed Ticket Tailor, Tally, or Google Forms. Information you submit there is processed by that provider and according to the form or ticketing flow. We may receive the information needed to run the event or respond to the form.</li>
      </ul>

      <h3>WHY WE USE THIS DATA</h3>
      <p>We use the data described above to provide the website, process purchases and registrations, communicate about them, prevent abuse, resolve support requests, and meet legal obligations such as accounting. Depending on the situation, the legal basis is performance of a contract or steps taken at your request, our legitimate interests in operating and securing the service, or a legal obligation.</p>

      <h3>SERVICE PROVIDERS</h3>
      <p>We use service providers to operate the site and payments. Their processing is governed by their own terms and privacy information:</p>
      <ul>
        <li><a href="https://stripe.com/privacy">Stripe</a> for payment processing, Checkout, and customer/order records.</li>
        <li><a href="https://www.cloudflare.com/privacypolicy/">Cloudflare</a> for hosting, security, and delivery of the website and public media.</li>
        <li><a href="https://www.tickettailor.com/legal/privacy/">Ticket Tailor</a>, <a href="https://tally.so/help/privacy">Tally</a>, and <a href="https://policies.google.com/privacy">Google Forms</a> where you choose to use their ticketing or forms.</li>
        <li><a href="https://privacycenter.instagram.com/policy/">Instagram/Meta</a> when you visit our Instagram profile or load Instagram-hosted media in the site archive.</li>
      </ul>
      <p>These providers may process data outside Finland or the European Economic Area. Where required, they use the transfer mechanisms and safeguards described in their own privacy documentation.</p>

      <h3>RETENTION</h3>
      <p>We do not keep customer records in the website database. Stripe retains payment and customer records under its service and retention settings; Juoksut keeps access to information only for as long as needed to manage the purchase or registration, provide support, and meet legal obligations. Third-party form and ticketing providers retain submissions under their own settings.</p>

      <h3>COOKIES AND LOCALSTORAGE</h3>
      <ul>
        <li>We do not intentionally use analytics or advertising cookies on this site.</li>
        <li>Our shopping cart uses LocalStorage as described above.</li>
        <li>Cloudflare and third-party forms, ticketing, payment, or social-media services may use cookies or similar technology necessary for their own services. Their policies explain those technologies.</li>
      </ul>

      <h3>YOUR RIGHTS</h3>
      <p>Subject to applicable law, you can ask for access to, correction of, deletion of, or restriction of the personal data we control. You may also object to certain processing and request portability where applicable. To make a request, email <a href="mailto:crew@juoksut.run">crew@juoksut.run</a>. You may also lodge a complaint with the Finnish Data Protection Ombudsman.</p>

      <h3>WHAT WE DO NOT DO</h3>
      <p>We do not sell personal data, use it for behavioural advertising, or make automated decisions with legal or similarly significant effects.</p>

      <h3>CHANGES TO THIS POLICY</h3>
      <p>We may update this policy, with changes posted on this page.</p>

      <h3>CONTACT US</h3>
      <p>If you have questions or concerns about this policy, contact us at <a href="mailto:crew@juoksut.run">crew@juoksut.run</a>.</p>
    </section>

    <div class="h-[4em]" />
  </div>
</template>

<script lang="ts" setup>
useSeoMeta({
  title: 'Privacy Policy',
  ogTitle: 'Privacy Policy · JUOKSUT',
  robots: 'noindex',
})
useHead({
  link: [{ rel: 'canonical', href: 'https://juoksut.run/privacy-policy' }],
})
</script>

<style scoped>
h3 {
  @apply text-[1.1em] font-[500] mt-[0.7em];
}

ul {
  @apply list-disc list-outside grid grid-cols-1 gap-[0.4em] ms-[1em] mt-[0.7em];
}
</style>
