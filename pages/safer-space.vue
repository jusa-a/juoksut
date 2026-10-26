<template>
  <div>
    <section>
      <h2>SAFER SPACE</h2>
      <p>
        Come for a run, stay for the vibes. Running at Juoksut is more than pace or performance. It's a community, and it should be accessible, welcoming and safe for everyone, whatever your background, body or experience.
      </p>
      <p>
        Everyone is a Lightspeeder. We run at lightspeed, but we slow down for each other.
      </p>

      <div class="max-w-[37em] mx-auto text-center text-[0.75em] border-pink border-[1px] my-[2em] pt-[0.5em] pb-[1.5em] px-[1.5em]">
        <p>
          <strong>RESPECT</strong>
          <br>
          We value every runner as they are. We listen, support and lift each other up, and respect the places and nature we run in.
        </p>
        <p>
          <strong>EQUALITY</strong>
          <br>
          Everyone has the same right to take part. First 5k or next marathon, all levels meet as equals.
        </p>
        <p>
          <strong>OPENNESS</strong>
          <br>
          Diversity makes us stronger. We welcome people of every culture, identity and experience.
        </p>
      </div>

      <h3>IF SOMETHING HAPPENS</h3>
      <p>
        No one should face discrimination, bullying, inappropriate comments or any other unwanted behavior at Juoksut. If you do, or see it happen, talk to a pacer on the run, DM us on <a href="https://www.instagram.com/juoksut/">Instagram</a> or use our confidential form.
      </p>
      <p>
        Our safety team handles every report confidentially, and anonymously if you ask. We look at how serious it is, agree on what happens next and get back to you if you want us to.
      </p>
      <div class="text-center">
        <a class="inline-block my-[1.5em] px-[5em] text-white uppercase bg-pink text-center border-[1px] border-pink py-[0.3em] hover:bg-white hover:text-pink active:opacity-50" href="https://docs.google.com/forms/d/e/1FAIpQLSfEXw0XS7aHmmV5wV9eRk1KxI9RvnP9OgDka_lpDvVyxNJ4Xw/viewform" target="_blank">OPEN THE FORM</a>
      </div>
    </section>

    <div class="h-[3em]" />

    <FooterVideo />
  </div>
</template>

<script setup>
useSeoMeta({
  title: 'Safer Space',
  description: 'How we keep JUOKSUT runs safe and welcoming for everyone, and what to do if something happens.',
  ogTitle: 'Safer Space at JUOKSUT',
  ogDescription: 'How we keep JUOKSUT runs safe and welcoming for everyone, and what to do if something happens.',
  ogImage: 'https://cdn.juoksut.run/og-image.jpg',
  ogUrl: 'https://juoksut.run/safer-space',
})

useHead({
  link: [{ rel: 'canonical', href: 'https://juoksut.run/safer-space' }],
})
</script>

<style scoped>
strong {
  font-weight: 600;
}
</style>
