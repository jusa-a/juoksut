<template>
  <div>
    <section>
      <h2>PRIVACY POLICY</h2>
      <p class="font-[500]">Last updated: 25.10.2026</p>

      <h3>INTRODUCTION</h3>
      <p>This Privacy Policy explains how Juoksut ry (“Juoksut”, “we”, “our”, or “us”) processes personal data when you use <a href="https://juoksut.run">juoksut.run</a>, buy from our webshop, or register for an event through a service linked from the site.</p>

      <h3>WHO IS RESPONSIBLE FOR YOUR DATA</h3>
      <p>Juoksut ry is the controller for the personal data we use to run the club, webshop, and registrations. You can contact us at <a href="mailto:crew@juoksut.run">crew@juoksut.run</a>.</p>

      <h3>WHAT WE PROCESS</h3>
      <ul>
        <li><strong>Website use:</strong> Cloudflare hosts and protects the site and may process technical request data, such as IP address, device/browser information, and security logs, to deliver and secure the service. Cloudflare Web Analytics counts page views without cookies and without following you across other sites.</li>
        <li><strong>Shopping cart:</strong> The cart stores selected products, sizes, and quantities in your browser’s LocalStorage. When you start checkout, those selections are sent to our checkout endpoint so we can create the payment session.</li>
        <li><strong>Webshop purchases and first-party registrations:</strong> Stripe Checkout collects your name, email address, phone number, payment and billing information where required, the purchased items, and any information you provide in an optional order note or required registration field (for example, camp shirt size). Stripe also creates a Stripe Customer for the purchase.</li>
        <li><strong>Order fulfilment:</strong> Juoksut can access the order, registration, name, email address, and phone number in the Stripe Dashboard to arrange registrations, deliveries, pickups, refunds, and customer support. Apart from the free event signups described below, our own D1 database stores product, stock, and technical webhook records only; it is not used as a customer database.</li>
        <li><strong>Checkout confirmation:</strong> After checkout, the site retrieves a limited order summary from Stripe to show the confirmation page. This includes the name, email address, items, amount, currency, and payment status for that checkout session.</li>
        <li><strong>Free event signups:</strong> When you sign up for a free event on this site, we store your name, email address and signup status in our own database and email you about your signup. Only Juoksut crew can see the signup list. We use this only to run that event. A Cloudflare Turnstile check stops automated signups (see Cloudflare's <a href="https://www.cloudflare.com/turnstile-privacy-policy/">Turnstile Privacy Addendum</a>).</li>
        <li><strong>Third-party forms:</strong> Some pages link to or embed Google Forms or Tally. Information you submit there is processed by that provider and according to the form. We may receive the information needed to run the event or respond to the form.</li>
      </ul>

      <h3>WHY WE USE THIS DATA</h3>
      <p>We use the data described above to provide the website, process purchases and registrations, communicate about them, prevent abuse, resolve support requests, and meet legal obligations such as accounting. Depending on the situation, the legal basis is performance of a contract or steps taken at your request, our legitimate interests in operating and securing the service, or a legal obligation.</p>

      <h3>SERVICE PROVIDERS</h3>
      <p>We use service providers to operate the site and payments. Their processing is governed by their own terms and privacy information:</p>
      <ul>
        <li><a href="https://stripe.com/privacy">Stripe</a> for payment processing, Checkout, and customer/order records.</li>
        <li><a href="https://www.cloudflare.com/privacypolicy/">Cloudflare</a> for hosting, security, delivery of the website and public media, the signup database, and the Turnstile bot check.</li>
        <li><a href="https://policies.google.com/privacy">Google</a> (Google Workspace) for sending event signup emails from our club email address.</li>
        <li><a href="https://policies.google.com/privacy">Google Forms</a> and <a href="https://tally.so/help/privacy-policy">Tally</a> where you choose to use their forms.</li>
        <li><a href="https://privacycenter.instagram.com/policy/">Instagram/Meta</a>: the videos on the home page and in the archive load from Instagram's servers, which see your IP address and browser details.</li>
      </ul>
      <p>These providers may process data outside Finland or the European Economic Area. Where required, they use the transfer mechanisms and safeguards described in their own privacy documentation.</p>

      <h3>RETENTION</h3>
      <p>Apart from free event signups, we do not keep customer records in the website database. Event signups are deleted automatically a week after the event; copies of the emails we sent you stay in the club's email account. Stripe retains payment and customer records under its service and retention settings; Juoksut keeps access to information only for as long as needed to manage the purchase or registration, provide support, and meet legal obligations. Third-party form providers retain submissions under their own settings.</p>

      <h3>COOKIES AND LOCALSTORAGE</h3>
      <ul>
        <li>We do not use analytics, advertising or tracking cookies. Our page view counts come from Cloudflare Web Analytics, which uses no cookies.</li>
        <li>Our shopping cart uses LocalStorage as described above.</li>
        <li>Cloudflare and third-party forms, payment, or social-media services may use cookies or similar technology necessary for their own services. Their policies explain those technologies.</li>
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
