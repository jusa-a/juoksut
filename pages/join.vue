<template>
  <div>
    <section>
      <p>
        JUOKSUT is a Helsinki run club for every pace and distance. All welcome, always.
      </p>
      <p>
        Our weekly runs are free and need no signup, except Fastlane Friday, which opens every Monday. Bring your friends.
      </p>
    </section>

    <div v-if="post" class="w-full max-w-[60em] mx-auto flex">
      <img
        :src="post.cover"
        alt="Cover of this month's schedule"
        class="w-1/2 block"
      >
      <img
        :src="post.schedule"
        alt="This month's run schedule"
        class="w-1/2 block"
      >
    </div>
    <section>
      <p v-if="post">
        Changes go up on <a href="https://www.instagram.com/juoksut/">Instagram</a> and <a href="https://www.strava.com/clubs/juoksut">Strava</a>.
      </p>
      <p v-else>
        This month's schedule is on our <a href="https://www.instagram.com/juoksut/">Instagram</a>.
      </p>
    </section>

    <div v-if="events.length" class="flex flex-row flex-wrap justify-center w-full p-[1em] gap-[1em]">
      <EventCard v-for="event in events" :key="event.slug" :event="event" class="min-w-[290px] max-w-[26em]" />
    </div>

    <Divider sticky class="my-[1em]" />

    <section id="safer-space">
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

      <h3>PHOTOS AND VIDEOS</h3>
      <p>
        We take photos and videos at our events, and by taking part you accept that you may appear in them. Secretly filming others, or publishing photos or videos that show someone in a disrespectful or harmful way, is strictly prohibited. Always respect others' boundaries and privacy.
      </p>

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
// Both endpoints fall back to the copy instead of failing the page.
const { data: schedule } = await useFetch('/api/instagram-schedule')
const { data: eventsData } = await useFetch('/api/events')

const post = computed(() => schedule.value?.post ?? null)
const events = computed(() => eventsData.value?.events ?? [])

useSeoMeta({
  title: 'Join',
  description: 'Join JUOKSUT weekly runs in Helsinki. All welcome.',
  ogTitle: 'Join JUOKSUT',
  ogDescription: 'Join JUOKSUT weekly runs in Helsinki. All welcome.',
  ogImage: 'https://cdn.juoksut.run/og-image.jpg',
  ogUrl: 'https://juoksut.run/join',
})

useHead({
  link: [{ rel: 'canonical', href: 'https://juoksut.run/join' }],
})
</script>

<style scoped>
strong {
  font-weight: 600;
}
</style>
