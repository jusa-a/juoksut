<template>
  <div>
    <div class="w-full max-w-[90em] mx-auto">
      <!--
        About + this month. The cover holds still under the nav while the copy
        and the schedule scroll past in the right column.
      -->
      <section class="grid grid-cols-1 w-full px-0 my-0 min-[900px]:mt-[1.5em] min-[900px]:mb-[2.5em] min-[900px]:grid-cols-2 min-[900px]:items-start min-[900px]:gap-x-[2em]">
        <div
          v-if="post"
          class="min-[900px]:sticky min-[900px]:top-[calc(var(--nav-height)+1em)] min-[900px]:self-start"
        >
          <img
            :src="post.cover"
            alt="Cover of this month's schedule"
            class="block w-full h-auto min-[900px]:w-auto min-[900px]:max-h-[calc(100vh-var(--nav-height)-2em)]"
          >
        </div>

        <div
          class="flex flex-col px-[1em] pt-[1.5em] min-[900px]:px-0 min-[900px]:pt-0"
          :class="post ? 'min-[900px]:col-start-2' : 'min-[900px]:col-span-2 min-[900px]:mx-auto min-[900px]:max-w-[36em]'"
        >
          <p class="mt-0">
            JUOKSUT is a Helsinki run club for every pace and distance. All welcome, always.
          </p>
          <p>
            Our weekly runs are free and need no signup, except Fastlane Friday, which opens every Monday. Bring your friends.
          </p>

          <!-- On phones the schedule breaks out of the column padding, edge to edge. -->
          <template v-if="post">
            <img
              :src="post.schedule"
              alt="This month's run schedule"
              loading="lazy"
              class="block w-[calc(100%+2em)] max-w-none h-auto -mx-[1em] mt-[1.5em] min-[900px]:w-full min-[900px]:mx-0"
            >
            <p>
              Changes go up on <a href="https://www.instagram.com/juoksut/">Instagram</a> and <a href="https://www.strava.com/clubs/juoksut">Strava</a>.
            </p>
          </template>
          <p v-else>
            This month's schedule is on our <a href="https://www.instagram.com/juoksut/">Instagram</a>.
          </p>
        </div>
      </section>

      <template v-if="events.length">
        <Divider class="mt-[1.5em]" />

        <!--
          Events: the cards scroll on the left, the copy about them stays put on
          the right until the last card has gone past. Copy first in the DOM so
          phones read an introduction before the cards.
        -->
        <section class="grid grid-cols-1 w-full px-0 my-0 pt-[2em] min-[900px]:grid-cols-2 min-[900px]:items-start min-[900px]:gap-x-[2em]">
          <div class="flex flex-col px-[1em] min-[900px]:px-0 min-[900px]:col-start-2 min-[900px]:row-start-1 min-[900px]:sticky min-[900px]:top-[calc(var(--nav-height)+1em)] min-[900px]:self-start">
            <p class="mt-0">
              Camps, trips, races and the odd party. Each event page has the details, the dates and signup. If an event is full, join the waitlist.
            </p>
          </div>

          <div class="flex flex-col gap-[2em] mt-[1.5em] min-[900px]:mt-0 min-[900px]:col-start-1 min-[900px]:row-start-1">
            <EventCard v-for="event in events" :key="event.slug" :event="event" />
          </div>
        </section>
      </template>

      <Divider class="mt-[2.5em]" />

      <!--
        Safer Space: the values sit in a box on the left, the text runs down the
        right. On phones the heading and intro come first, then the box, then
        the rest — hence the explicit grid rows.
      -->
      <section id="safer-space" class="grid grid-cols-1 w-full px-0 my-0 pt-[2em] min-[900px]:grid-cols-2 min-[900px]:items-start min-[900px]:gap-x-[2em]">
        <div class="flex flex-col px-[1em] min-[900px]:px-0 min-[900px]:col-start-2 min-[900px]:row-start-1">
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

        <div class="px-[1em] mt-[1.5em] min-[900px]:px-0 min-[900px]:mt-0 min-[900px]:col-start-1 min-[900px]:row-start-2 min-[900px]:sticky min-[900px]:top-[calc(var(--nav-height)+1em)] min-[900px]:self-start">
          <div class="text-center text-[0.75em] border-pink border-[1px] pt-[0.5em] pb-[1.5em] px-[1.5em]">
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

        <div class="flex flex-col px-[1em] mt-[1.5em] min-[900px]:px-0 min-[900px]:mt-0 min-[900px]:col-start-2 min-[900px]:row-start-2">
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
    </div>

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
