<template>
  <div>
    <section>
      <h2>ABOUT</h2>
      <p>
        JUOKSUT is a run club in Helsinki for every pace and distance. We run to feel good, fast and a little invincible. First-timer or a pro, we'll get there together.
      </p>
      <p>
        Come whenever you like. Our weekly runs are free and you don't need to commit. Only Fastlane Friday needs a signup, and those open every Monday. Bring your friends.
      </p>
    </section>

    <Divider sticky class="my-[1em]" />

    <section>
      <h2>THIS MONTH</h2>
      <div v-if="post" class="w-full max-w-[60em] mx-auto flex flex-col min-[640px]:flex-row gap-[1px] bg-pink">
        <img
          :src="post.cover"
          alt="Cover of this month's schedule"
          class="w-full min-[640px]:w-1/2 block"
        >
        <img
          :src="post.schedule"
          alt="This month's run schedule"
          class="w-full min-[640px]:w-1/2 block"
        >
      </div>
      <p v-if="post">
        Runs, places and pacers for the month, straight from our Instagram. Plans change sometimes, so follow us on <a href="https://www.instagram.com/juoksut/">Instagram</a> and <a href="https://www.strava.com/clubs/juoksut">Strava</a> for the latest.
      </p>
      <p v-else>
        We run on Tuesdays, Fridays and Sundays. This month's schedule is on our <a href="https://www.instagram.com/juoksut/">Instagram</a>, and the runs are on <a href="https://www.strava.com/clubs/juoksut">Strava</a>.
      </p>
    </section>

    <Divider sticky class="my-[1em]" />

    <section>
      <h2>EVENTS</h2>
      <p>
        Camps, trips, races and the odd party. What's on now, what's coming, and everything we've done so far.
      </p>
      <div v-for="group in groups" :key="group.title" class="mt-[1em]">
        <h3 class="uppercase">{{ group.title }}</h3>
        <div class="grid grid-cols-2 gap-[1em]">
          <EventCard v-for="event in group.events" :key="event.slug" :event="event" />
        </div>
      </div>
      <p v-if="!events.length">
        Nothing on the calendar yet. Watch our Instagram.
      </p>
    </section>

    <Divider sticky class="my-[1em]" />

    <section>
      <h2>SAFER SPACE</h2>
      <p>
        All welcome, always. Respect each other and each other's boundaries, and don't assume anything about anyone's background, body or pace. If something happens, talk to a pacer, send us a DM on <a href="https://www.instagram.com/juoksut/">Instagram</a> or use our <a href="https://docs.google.com/forms/d/e/1FAIpQLSfEXw0XS7aHmmV5wV9eRk1KxI9RvnP9OgDka_lpDvVyxNJ4Xw/viewform" target="_blank">anonymous form</a>.
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
