<template>
  <div>
    <section>
      <h2>ABOUT</h2>
      <p>
        JUOKSUT is a running club in Helsinki for everyone, from beginners to advanced runners, who want to challenge themselves and have a blast at the same time.
      </p>
      <p>
        We run on Tuesdays and Sundays with varying paces and distances.
      </p>
      <p>
        Join us by showing up and bring your friends too! You will be welcomed by our fun, friendly, and fast team.
      </p>
      <p>
        We post details about our weekly runs on our
        <a href="https://www.strava.com/clubs/juoksut">Strava</a> and
        <a href="https://www.instagram.com/juoksut/">Instagram</a>.
      </p>
    </section>

    <Divider sticky class="my-[1em]" />

    <section>
      <h2>WEEKLY RUNS</h2>
      <div class="max-w-[40em] w-full mx-auto font-serif font-medium tracking-[-0.03em] flex flex-col items-center justify-center">
        <div class="flex justify-between items-center w-full py-[0.5em]">
          <div class="flex flex-col">
            <div>Every Tuesday</div>
            <div class="text-[1.8em]">Tuesday Run</div>
          </div>
          <div class="flex flex-col items-end">
            <div>
              18:30 @
              <a href="https://maps.app.goo.gl/vMkCqSCvomdDX1xf9" target="_blank" class="underline">Tokoinranta</a>
            </div>
            <div class="text-[1.2em]">
              Social Run. 3 Pace Groups
            </div>
          </div>
        </div>
        <div class="flex justify-between items-center w-full py-[0.5em]">
          <div class="flex flex-col">
            <div>Every Sunday</div>
            <div class="text-[1.8em]">Long Run</div>
          </div>
          <div class="flex flex-col items-end">
            <div>
              11:00 @ Varying Locations
            </div>
            <div class="text-[1.2em]">
              Varying Dictances and Pace Groups
            </div>
          </div>
        </div>
      </div>
      <p class="text-center text-[0.9em] px-[1em] pt-[0.5em]">
        We also host special events every once in a while. Make sure to follow us on
        <a href="https://www.strava.com/clubs/juoksut">Strava</a> and
        <a href="https://www.instagram.com/juoksut/">Instagram</a>
        to keep updated!
      </p>
    </section>

    <Divider sticky class="my-[1em]" />

    <section>
      <h2>SAFER SPACE</h2>
      <p>
        We're exhilarated by the ever-growing Lightspeed energy you spread each run! Since we are so many, it's crucial to ensure that our runs create a positive, respectful, and safe environment for everyone. Juoksut is for everyone, regardless of your background.
      </p>
      <p>
        We have established the following guidelines to ensure that everyone feels safe. It is absolutely essential that these guidelines are followed!
      </p>
      <div class="max-w-[40em] mx-auto text-center text-[0.75em] border-pink border-[1px] mt-[1em] pb-[1em] px-[1em]">
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
      </div>
      <div class="text-center flex flex-col items-center">
        <h3>
          IF YOU ENCOUNTER UNWANTED BEHAVIOR,
        </h3>
        <p class="pb-[0.5em]">
          please don't hesitate to tell our pacers, or use this anonymous link to inform us.
        </p>

        <a class="mx-auto my-[1em] px-[5em] text-white uppercase bg-pink text-center border-[1px] border-pink py-[0.3em] hover:bg-white hover:text-pink active:opacity-50" href="https://docs.google.com/forms/d/e/1FAIpQLSfEXw0XS7aHmmV5wV9eRk1KxI9RvnP9OgDka_lpDvVyxNJ4Xw/viewform?fbclid=PAZXh0bgNhZW0CMTEAAaZMurDuaAKJinxI0v4NkcB-oQrfGU5lakZB_MOSWFfyVl_LDHu59SVQ8EU_aem_FKp8daadnB7-PR0AWyH7nA" target="_blank">LINK TO THE FORM</a>

        <p class="text-[0.8em]">
          If you have any questions or concerns, please reach out to us. We are here to help and make sure that everyone feels safe and welcome at Juoksut!
        </p>
      </div>
    </section>

    <div class="h-[4em]" />

    <FooterVideo />
  </div>
</template>

<script setup></script>

<style scoped>
strong {
  font-weight: 600;
}
</style>
