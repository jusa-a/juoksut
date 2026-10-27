<template>
  <div>
    <!--
      About + this month: product-page split. Cover fills the left half from the
      nav down at its own ratio; the right half runs the copy, then the schedule.
    -->
    <section class="flex flex-row flex-wrap w-full p-0 m-0 mx-auto">
      <!--
        The cover holds under the nav while the right column scrolls, and only
        lets go when that column's last line reaches the bottom of the screen.
        Sized by its own width, never by the screen height.
      -->
      <div
        v-if="post"
        class="flex-1 min-w-[200px] min-[900px]:self-start min-[900px]:sticky min-[900px]:top-[calc(var(--nav-height)+1px)]"
      >
        <img
          :src="post.cover"
          alt="Cover of this month's schedule"
          class="block w-full h-auto"
        >
      </div>

      <div
        class="flex-1 min-w-[300px] flex flex-col"
        :class="{ 'mx-auto max-w-[36em]': !post }"
      >
        <!-- Copy keeps a reading measure; the schedule below runs the full column. -->
        <div class="px-[1em] pt-[1.4em] pb-[1.5em] min-[900px]:px-[4em]">
          <p class="mt-0">
            JUOKSUT is a run club in Helsinki for everyone, from first-timers to marathoners, who want to run together, push themselves and have a blast doing it.
          </p>
          <p>
            We run on Tuesdays, Fridays and Sundays, at every pace and distance. Come whenever you like, bring your friends, and meet a fun, friendly and fast crew.
          </p>
          <p>
            We post the details for every run on <a href="https://www.strava.com/clubs/juoksut">Strava</a> and <a href="https://www.instagram.com/juoksut/">Instagram</a>. Follow us there to stay in the loop.
          </p>
        </div>

        <img
          v-if="post"
          :src="post.schedule"
          alt="This month's run schedule"
          loading="lazy"
          class="block w-full h-auto"
        >
      </div>
    </section>

    <template v-if="events.length">
      <Divider sticky />

      <!--
        Events: the heading and copy pinned on the left, shop-style cards on the
        right. Same order on phones, so the copy is read before the cards.
      -->
      <section class="flex flex-row flex-wrap w-full p-0 m-0">
        <div class="flex flex-col flex-1 min-w-[300px] px-[1em] py-[1.4em] min-[900px]:px-[4em] min-[900px]:sticky min-[900px]:top-[calc(var(--nav-height)+1px)] min-[900px]:self-start">
          <h2 class="mt-0">
            EVENTS
          </h2>
          <p>
            Sessions and events with limited spots. Sign up as fast as you can, and if it's full, join the waitlist.
          </p>
        </div>

        <div class="w-full min-[900px]:w-auto min-[900px]:flex-1 flex flex-row flex-wrap justify-around items-center p-[1em] gap-[1em]">
          <EventCard v-for="event in events" :key="event.slug" :event="event" />
        </div>
      </section>
    </template>

    <Divider sticky />

    <!--
      Safer Space: the text on the left, the values in a card on the right. On
      phones the heading and intro come first, then the values, then the rest —
      hence the explicit grid rows.
    -->
    <section id="safer-space" class="grid grid-cols-1 w-full p-0 m-0 pt-[1.4em] pb-[1em] min-[900px]:grid-cols-2 min-[900px]:items-start">
      <div class="flex flex-col px-[1em] min-[900px]:px-[4em] min-[900px]:col-start-1 min-[900px]:row-start-1">
        <h2 class="mt-0">
          SAFER SPACE
        </h2>
        <p>
          Come for a run, stay for the vibes. Running at Juoksut is more than pace or performance. It's a community, and it should be accessible, welcoming and safe for everyone, whatever your background, body or experience.
        </p>
        <p>
          Everyone is a Lightspeeder. We run at lightspeed, but we slow down for each other.
        </p>
      </div>

      <div class="p-[1em] mt-[0.5em] min-[900px]:mt-0 min-[900px]:col-start-2 min-[900px]:row-start-2 min-[900px]:sticky min-[900px]:top-[calc(var(--nav-height)+1px)] min-[900px]:self-start flex flex-row flex-wrap justify-around items-center">
        <div class="min-w-[290px] max-w-[26em] text-center text-[0.75em] border-pink border-[1px] pt-[0.5em] pb-[1.5em] px-[1.5em]">
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
      </div>

      <div class="flex flex-col px-[1em] mt-[1.5em] min-[900px]:px-[4em] min-[900px]:mt-0 min-[900px]:col-start-1 min-[900px]:row-start-2">
        <h3>
          PHOTOS AND VIDEOS
        </h3>
        <p>
          We take photos and videos at our events, and by taking part you accept that you may appear in them. Secretly filming others, or publishing photos or videos that show someone in a disrespectful or harmful way, is strictly prohibited. Always respect others' boundaries and privacy.
        </p>

        <h3>
          IF SOMETHING HAPPENS
        </h3>
        <p>
          No one should face discrimination, bullying, inappropriate comments or any other unwanted behavior at Juoksut. If you do, or see it happen, talk to a pacer on the run, DM us on <a href="https://www.instagram.com/juoksut/">Instagram</a> or use our confidential form.
        </p>
        <p>
          Our safety team handles every report confidentially, and anonymously if you ask. We look at how serious it is, agree on what happens next and get back to you if you want us to.
        </p>
        <div>
          <a class="inline-block my-[1.5em] px-[5em] text-white uppercase bg-pink text-center border-[1px] border-pink py-[0.3em] hover:bg-white hover:text-pink active:opacity-50" href="https://docs.google.com/forms/d/e/1FAIpQLSfEXw0XS7aHmmV5wV9eRk1KxI9RvnP9OgDka_lpDvVyxNJ4Xw/viewform" target="_blank">OPEN THE FORM</a>
        </div>
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
  description: 'Join JUOKSUT weekly runs in Helsinki. Every pace and distance, all welcome.',
  ogTitle: 'Join JUOKSUT',
  ogDescription: 'Join JUOKSUT weekly runs in Helsinki. Every pace and distance, all welcome.',
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
