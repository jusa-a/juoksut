<template>
  <div>
    <section>
      <h2>ABOUT</h2>
      <p>
        JUOKSUT is a Helsinki run club for every pace and distance. All welcome, always.
      </p>
      <p>
        Our weekly runs are free and need no signup, except Fastlane Friday, which opens every Monday. Bring your friends.
      </p>
    </section>

    <Divider sticky class="my-[1em]" />

    <section>
      <h2>THIS MONTH</h2>
    </section>
    <div v-if="post" class="w-full max-w-[60em] mx-auto flex gap-[1px] bg-pink">
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

      <div v-for="group in groups" :key="group.title" class="mt-[2em]">
        <h3 class="uppercase text-center">
          {{ group.title }}
        </h3>
        <div class="flex flex-wrap justify-center gap-[1em]">
          <EventCard v-for="event in group.events" :key="event.slug" :event="event" class="w-[calc(50%-0.5em)] max-w-[16em]" />
        </div>
      </div>
    </section>

    <Divider sticky class="my-[1em]" />

    <section>
      <h2>SAFER SPACE</h2>
      <p>
        If something happens, talk to a pacer, DM us on <a href="https://www.instagram.com/juoksut/">Instagram</a> or use our <a href="https://docs.google.com/forms/d/e/1FAIpQLSfEXw0XS7aHmmV5wV9eRk1KxI9RvnP9OgDka_lpDvVyxNJ4Xw/viewform" target="_blank">anonymous form</a>.
      </p>
      <p>
        <NuxtLink to="/safer-space">Read our Safer Space guidelines</NuxtLink>
      </p>
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

const groups = computed(() => [
  { title: 'Now on', events: events.value.filter(event => event.status === 'current') },
  { title: 'Coming up', events: events.value.filter(event => event.status === 'upcoming') },
  { title: 'Archive', events: events.value.filter(event => event.status === 'past') },
].filter(group => group.events.length))

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
