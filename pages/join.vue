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
        <div class="grid grid-cols-1 gap-[1em] min-[640px]:grid-cols-2 min-[1024px]:grid-cols-3">
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

<style scoped>
strong {
  font-weight: 600;
}
</style>
