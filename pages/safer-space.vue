<template>
  <div>
    <section>
      <h2>SAFER SPACE</h2>
      <p>
        Come for a run, stay for the vibes. At Juoksut, running is more than pace or performance. It's a community, and sport should be accessible, welcoming and safe for everyone, whatever your background, body or experience.
      </p>
      <p>
        We're a non-profit, and we want what we do to show other clubs and organizations that a place like this is possible: where people feel safe, express themselves freely and treat each other with respect. Everyone is a Lightspeeder. We run at lightspeed, but we slow down for each other.
      </p>

      <div class="max-w-[37em] mx-auto text-center text-[0.75em] border-pink border-[1px] my-[2em] pt-[0.5em] pb-[1.5em] px-[1.5em]">
        <p class="uppercase">
          <strong>OUR VALUES</strong>
        </p>
        <p>
          <strong>RESPECT</strong>
          <br>
          We value every runner as they are: listening, supporting and lifting each other up, on the track, on the trail and online. That includes the city and the nature we get to run in.
        </p>
        <p>
          <strong>EQUALITY</strong>
          <br>
          Everyone has the same right to take part. Your first 5k or your next marathon, all levels meet here as equals.
        </p>
        <p>
          <strong>OPENNESS</strong>
          <br>
          Diversity makes us stronger. We welcome people of every culture, identity and experience, and we're better for it.
        </p>
      </div>

      <p>
        To keep it that way, we ask everyone to follow these guidelines.
      </p>

      <div class="max-w-[37em] mx-auto text-center text-[0.75em] border-pink border-[1px] my-[2em] pt-[0.5em] pb-[1.5em] px-[1.5em]">
        <p class="uppercase">
          <strong>GUIDELINES</strong>
        </p>
        <p>
          <strong>BE CONSIDERATE AND RESPECTFUL</strong>
          <br>
          We come from various backgrounds and may view things differently. Let's embrace this diversity by treating each other with kindness and understanding.
        </p>
        <p>
          <strong>AVOID MAKING ASSUMPTIONS</strong>
          <br>
          Do not make assumptions about others' gender, sexual orientation, health, background, running abilities, or pace. If unsure, ask.
        </p>
        <p>
          <strong>DISCRIMINATION HAS NO PLACE AT JUOKSUT</strong>
          <br>
          Racism, sexism, or any form of discrimination is not tolerated.
        </p>
        <p>
          <strong>RESPECT PERSONAL BOUNDARIES</strong>
          <br>
          Everyone has the right to feel safe and comfortable. Be mindful of others' personal space and boundaries.
        </p>
        <p>
          <strong>ADDRESS INAPPROPRIATE BEHAVIOR CONSTRUCTIVELY</strong>
          <br>
          If you notice inappropriate behavior, please inform us immediately. If you choose to discuss it privately, do so with care—avoid embarrassing or mocking.
        </p>
        <p>
          <strong>EVERYONE MAKES MISTAKES</strong>
          <br>
          What matters is acknowledging them, apologizing, and learning from the mistakes.
        </p>
        <p>
          <strong>PHOTOS AND VIDEOS</strong>
          <br>
          We photograph and film our runs, and by joining you may appear in them. Filming people in secret, or posting photos or videos that show someone in a disrespectful or harmful way, is not allowed. Respect people's boundaries and privacy.
        </p>
      </div>

      <h3>IF SOMETHING HAPPENS</h3>
      <p>
        No one at Juoksut should face discrimination, bullying, inappropriate comments or any other unwanted behavior. If you experience or see it, you can talk to a pacer on the run, send us a DM on <a href="https://www.instagram.com/juoksut/">Instagram</a>, or use the confidential form below, anonymously if you like.
      </p>
      <p>
        Our safety team handles every report in confidence, and anonymously if you ask. We look at how serious it is, agree on what happens next and, if you want us to and it feels safe, get back to you.
      </p>

      <div class="text-center flex flex-col items-center">
        <a class="mx-auto my-[1.5em] px-[5em] text-white uppercase bg-pink text-center border-[1px] border-pink py-[0.3em] hover:bg-white hover:text-pink active:opacity-50" href="https://docs.google.com/forms/d/e/1FAIpQLSfEXw0XS7aHmmV5wV9eRk1KxI9RvnP9OgDka_lpDvVyxNJ4Xw/viewform" target="_blank">OPEN THE FORM</a>

        <p class="text-[0.8em] m-0">
          Questions or ideas for making Juoksut better for everyone? Message us any time. We're here to make sure everyone feels safe and welcome.
        </p>
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
