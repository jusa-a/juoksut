<template>
  <div>
    <section class="flex flex-row flex-wrap w-full p-0 m-0 mx-auto">
      <div class="flex-1 min-w-[200px]">
        <NuxtImg
          class="mx-auto"
          src="https://cdn.juoksut.run/fastlane-friday.jpg"
          alt="FASTLANE FRIDAY"
          height="1875"
          width="1500"
        />
      </div>

      <div class="flex-1 min-w-[300px] flex flex-col">
        <div class="mb-auto flex flex-col px-[1em] py-[1.4em] pb-[2em] min-[500px]:sticky min-[500px]:top-[calc(var(--nav-height)+1px)]">
          <div class="flex flex-col">
            <h2 class="text-[2em]">FASTLANE FRIDAY</h2>
          </div>

          <!-- Event Info -->
          <div class="flex-1 flex flex-col gap-[0.4em]">
            <div class="m-0">
              <p>
                Fastlane Friday heads outdoors for spring to Eläintarha Sports Field.
              </p>

              <p></p>

              <ul>
                <li>🔥 16:30 warmup & drills</li>
                <li>🔃 17:00 track session</li>
                <li>🍕 18:00 afters (optional)</li>
              </ul>

              <p>
                Limited spots. All welcome.<br>
                Be faaaaast⚡️⚡️⚡️⚡️⚡️
              </p>
            </div>
          </div>
        </div>

        <!-- Signup -->
        <div class="w-full pb-[1.4em] pt-[1em] px-[1em]">
          <p v-if="status === 'pending' || status === 'idle'">
            Loading sessions…
          </p>
          <p v-else-if="error || status === 'error'">
            Something went wrong. Try again or email crew@juoksut.run.
          </p>
          <p v-else-if="!sessions?.length">
            No sessions open for signup yet. Check back soon.
          </p>
          <ul v-else class="flex flex-col gap-[0.6em]">
            <li v-for="session in sessions" :key="session.id" class="border border-pink">
              <div class="flex flex-wrap items-center justify-between gap-[0.5em] p-[0.7em]">
                <p class="m-0 text-[1em]">
                  {{ formatDay(session.date) }}
                </p>
                <div class="flex flex-wrap items-center gap-[0.7em]">
                  <span class="text-[0.8em]">
                    <template v-if="session.state === 'open'">
                      {{ session.capacity - session.confirmed }} spots left
                    </template>
                    <template v-else-if="session.state === 'full'">
                      Full · {{ session.waitlist }} on waitlist
                    </template>
                    <template v-else>
                      Signup opens {{ formatOpens(session.opensAt) }}
                    </template>
                  </span>
                  <button
                    v-if="session.state !== 'not_open'"
                    type="button"
                    :class="buttonClass"
                    :aria-expanded="openId === session.id"
                    :aria-controls="`signup-${session.id}`"
                    @click="toggle(session.id)"
                  >
                    {{ session.state === 'full' ? 'Join waitlist' : 'Sign up' }}
                  </button>
                </div>
              </div>

              <form
                v-if="openId === session.id"
                :id="`signup-${session.id}`"
                class="flex flex-col gap-[0.6em] border-t border-pink p-[0.7em]"
                @submit.prevent="submit(session.id)"
              >
                <div class="flex flex-col">
                  <label :for="`name-${session.id}`" class="text-[0.8em] uppercase">Name</label>
                  <input
                    :id="`name-${session.id}`"
                    v-model="name"
                    type="text"
                    name="name"
                    autocomplete="name"
                    maxlength="80"
                    required
                    :class="inputClass"
                  >
                </div>

                <div class="flex flex-col">
                  <label :for="`email-${session.id}`" class="text-[0.8em] uppercase">Email</label>
                  <input
                    :id="`email-${session.id}`"
                    v-model="email"
                    type="email"
                    name="email"
                    autocomplete="email"
                    maxlength="254"
                    required
                    :class="inputClass"
                  >
                </div>

                <!-- Honeypot: off-screen, never filled by a real browser -->
                <div class="absolute -left-[9999px]" aria-hidden="true">
                  <label for="website">Website</label>
                  <input
                    id="website"
                    v-model="website"
                    type="text"
                    name="website"
                    tabindex="-1"
                    autocomplete="off"
                  >
                </div>

                <p class="m-0 text-[0.75em]">
                  We store your name and email to run the session and delete them a week after. See our <NuxtLink to="/privacy-policy" class="underline">privacy policy</NuxtLink>.
                </p>

                <button type="submit" :class="buttonClass" :disabled="pending">
                  {{ pending ? 'Sending…' : session.state === 'full' ? 'Join waitlist' : 'Sign up' }}
                </button>
              </form>
            </li>
          </ul>

          <p role="status" aria-live="polite" class="m-0 pt-[0.3em] text-[0.9em]">
            {{ message }}
          </p>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
const { data: sessions, status, error, refresh } = useFetch('/api/fastlane/sessions')

const buttonClass = 'uppercase text-white bg-pink text-center border border-pink px-[1em] py-[0.7em] min-h-[44px] hover:bg-white hover:text-pink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pink disabled:opacity-60'
const inputClass = 'border border-pink bg-white px-[0.6em] py-[0.5em] min-h-[44px] w-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pink'

const dayFormat = new Intl.DateTimeFormat('en-GB', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  timeZone: 'Europe/Helsinki',
})
const timeFormat = new Intl.DateTimeFormat('en-GB', {
  hour: '2-digit',
  minute: '2-digit',
  timeZone: 'Europe/Helsinki',
})

const formatDay = date => dayFormat.format(new Date(`${date}T12:00:00Z`))
const formatOpens = unix => `${dayFormat.format(new Date(unix * 1000))}, ${timeFormat.format(new Date(unix * 1000))} Helsinki`

const openId = ref(null)
const name = ref('')
const email = ref('')
const website = ref('')
const pending = ref(false)
const message = ref('')

function toggle(id) {
  openId.value = openId.value === id ? null : id
  message.value = ''
}

async function submit(sessionId) {
  if (pending.value)
    return

  pending.value = true
  message.value = ''

  try {
    const result = await $fetch('/api/fastlane/signup', {
      method: 'POST',
      body: { sessionId, name: name.value, email: email.value, website: website.value },
    })

    message.value = result.status === 'waitlist'
      ? `You're number ${result.position} on the waitlist. We'll email you if a spot opens.`
      : 'You\'re in! Check your email for the details.'

    openId.value = null
    name.value = ''
    email.value = ''
    website.value = ''
    // A failed list refresh must not turn a completed signup into an error.
    await refresh().catch(() => {})
  }
  catch (err) {
    const code = err?.statusCode ?? err?.status
    message.value = code === 409
      ? 'You\'re already signed up for this session.'
      : code === 403
        ? 'Signup isn\'t open yet.'
        : code === 400
          ? 'Check your name and email.'
          : 'Something went wrong. Try again or email crew@juoksut.run.'
  }
  finally {
    pending.value = false
  }
}

useSeoMeta({
  title: 'Fastlane Friday',
  description: 'Weekly speed session. Warmup, drills, track. All welcome.',
  ogTitle: 'Fastlane Friday · JUOKSUT',
  ogDescription: 'Weekly speed session. Warmup, drills, track. All welcome.',
  ogImage: 'https://cdn.juoksut.run/fastlane-friday.jpg',
  ogUrl: 'https://juoksut.run/fastlane-friday',
})

useHead({
  link: [{ rel: 'canonical', href: 'https://juoksut.run/fastlane-friday' }],
})
</script>
