<template>
  <div class="flex-1 flex flex-col">
    <!--
      The heading and copy pinned on the left, shop-style cards on the right.
      Same order on phones, so the copy is read before the cards.
    -->
    <section class="flex flex-row flex-wrap w-full p-0 m-0 mb-auto">
      <div class="flex flex-col flex-1 min-w-[300px] px-[1em] py-[1.4em] min-[900px]:px-[4em] min-[900px]:sticky min-[900px]:top-[calc(var(--nav-height)+1px)] min-[900px]:self-start">
        <h2 class="mt-0">
          EVENTS
        </h2>
        <p>
          Sessions and events with limited spots. Sign up as fast as you can, and if it's full, join the waitlist.
        </p>
        <p v-if="!events.length">
          No events open for signup yet. Check back soon.
        </p>
      </div>

      <div v-if="events.length" class="w-full min-[900px]:w-auto min-[900px]:flex-1 flex flex-row flex-wrap justify-around items-center p-[1em] gap-[1em]">
        <EventCard v-for="event in events" :key="event.slug" :event="event" />
      </div>
    </section>

    <div class="h-[3em]" />

    <FooterVideo />
  </div>
</template>

<script setup>
// falls back to the empty line instead of failing the page
const { data: eventsData } = await useFetch('/api/events')

const events = computed(() => eventsData.value?.events ?? [])

useSeoMeta({
  title: 'Events',
  description: 'JUOKSUT sessions and events with limited spots. Sign up as fast as you can, and if it\'s full, join the waitlist.',
  ogTitle: 'Events · JUOKSUT',
  ogDescription: 'JUOKSUT sessions and events with limited spots. Sign up as fast as you can, and if it\'s full, join the waitlist.',
  ogImage: 'https://cdn.juoksut.run/og-image.jpg',
  ogUrl: 'https://juoksut.run/events',
})

useHead({
  link: [{ rel: 'canonical', href: 'https://juoksut.run/events' }],
})
</script>
