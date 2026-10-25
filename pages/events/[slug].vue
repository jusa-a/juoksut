<template>
  <div v-if="page">
    <section class="flex flex-row flex-wrap w-full p-0 m-0 mx-auto">
      <div v-if="page.imageUrl" class="flex-1 min-w-[200px]">
        <NuxtImg
          class="mx-auto"
          :src="page.imageUrl"
          :alt="page.title"
          height="1875"
          width="1500"
        />
      </div>

      <div class="flex-1 min-w-[300px] flex flex-col">
        <div class="mb-auto flex flex-col px-[1em] py-[1.4em] pb-[2em] min-[500px]:sticky min-[500px]:top-[calc(var(--nav-height)+1px)]">
          <div class="flex flex-col">
            <h2 class="text-[2em]">{{ page.title }}</h2>
          </div>

          <!-- Event Info -->
          <div class="flex-1 flex flex-col gap-[0.4em]">
            <div class="m-0">
              <p v-for="(paragraph, index) in paragraphs" :key="index" class="whitespace-pre-line">
                {{ paragraph }}
              </p>
            </div>
          </div>
        </div>

        <!-- Signup -->
        <div class="w-full pb-[1.4em] pt-[1em] px-[1em]">
          <p v-if="!page.events.length">
            No sessions open for signup yet. Check back soon.
          </p>
          <ul v-else class="flex flex-col gap-[0.6em]">
            <li v-for="event in page.events" :key="event.id" class="border border-pink">
              <div class="flex flex-wrap items-center justify-between gap-[0.5em] p-[0.7em]">
                <div class="m-0 text-[1em]">
                  <p class="m-0">{{ formatStart(event.startsAt) }}</p>
                  <p class="m-0 text-[0.8em]">{{ event.venue }}</p>
                </div>
                <div class="flex flex-wrap items-center gap-[0.7em]">
                  <span class="text-[0.8em]">
                    <template v-if="event.state === 'open'">
                      {{ spotsLeft(event) }}
                    </template>
                    <template v-else-if="event.state === 'full'">
                      Full · {{ event.waitlist }} on waitlist
                    </template>
                    <template v-else>
                      Signup opens {{ formatOpens(event.opensAt) }}
                    </template>
                  </span>
                  <button
                    v-if="event.state !== 'not_open'"
                    type="button"
                    :class="buttonClass"
                    :aria-expanded="openId === event.id"
                    :aria-controls="`signup-${event.id}`"
                    @click="toggle(event.id)"
                  >
                    {{ event.state === 'full' ? 'Join waitlist' : 'Sign up' }}
                  </button>
                </div>
              </div>

              <form
                v-if="openId === event.id"
                :id="`signup-${event.id}`"
                class="flex flex-col gap-[0.6em] border-t border-pink p-[0.7em]"
                @submit.prevent="submit(event.id)"
              >
                <div class="flex flex-col">
                  <label :for="`name-${event.id}`" class="text-[0.8em] uppercase">Name</label>
                  <input
                    :id="`name-${event.id}`"
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
                  <label :for="`email-${event.id}`" class="text-[0.8em] uppercase">Email</label>
                  <input
                    :id="`email-${event.id}`"
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
                  <label :for="`website-${event.id}`">Website</label>
                  <input
                    :id="`website-${event.id}`"
                    v-model="website"
                    type="text"
                    name="website"
                    tabindex="-1"
                    autocomplete="off"
                  >
                </div>

                <div v-if="page.turnstileSiteKey" ref="turnstileEl" />

                <p class="m-0 text-[0.75em] leading-[1.4]">
                  We store your name and email to run the session and delete them a week after. See our <NuxtLink to="/privacy-policy" class="underline">privacy policy</NuxtLink>.
                </p>

                <button
                  type="submit"
                  :class="buttonClass"
                  :disabled="pending || (!!page.turnstileSiteKey && !turnstileToken)"
                >
                  {{ pending ? 'Sending…' : event.state === 'full' ? 'Join waitlist' : 'Sign up' }}
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

  <p v-else class="px-[1em] py-[1.4em]">
    Something went wrong. Try again or email crew@juoksut.run.
  </p>
</template>

<script setup>
import { eventParagraphs } from '~/utils/eventBody'

const route = useRoute()
const slug = String(route.params.slug)
const { data: page, error, refresh } = await useFetch(`/api/events/${slug}`)

if (error.value?.statusCode === 404)
  throw createError({ statusCode: 404, statusMessage: 'Page not found', fatal: true })

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

const paragraphs = computed(() => eventParagraphs(page.value?.body))
const formatStart = unix => `${dayFormat.format(new Date(unix * 1000))}, ${timeFormat.format(new Date(unix * 1000))}`
const formatOpens = unix => `${formatStart(unix)} Helsinki`

function spotsLeft({ capacity, confirmed }) {
  const left = capacity - confirmed
  return `${left} ${left === 1 ? 'spot' : 'spots'} left`
}

const openId = ref(null)
const name = ref('')
const email = ref('')
const website = ref('')
const pending = ref(false)
const message = ref('')

// Turnstile: one widget in whichever form is open. The token is single-use,
// so every submit attempt gets a fresh one.
const turnstileEl = ref(null)
const turnstileToken = ref('')
const turnstileScript = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'
let widgetId = null

function renderTurnstile() {
  const sitekey = page.value?.turnstileSiteKey
  if (!sitekey || !window.turnstile || !turnstileEl.value)
    return
  widgetId = window.turnstile.render(turnstileEl.value, {
    sitekey,
    callback: (token) => { turnstileToken.value = token },
  })
}

function resetTurnstile() {
  turnstileToken.value = ''
  if (widgetId !== null && window.turnstile)
    window.turnstile.reset(widgetId)
}

onMounted(() => {
  if (!page.value?.turnstileSiteKey)
    return
  if (window.turnstile) {
    if (openId.value !== null)
      renderTurnstile()
    return
  }

  const script = document.createElement('script')
  script.src = turnstileScript
  script.async = true
  script.onload = () => {
    if (openId.value !== null)
      renderTurnstile()
  }
  document.head.appendChild(script)
})

watch(openId, async (id) => {
  turnstileToken.value = ''
  if (widgetId !== null) {
    window.turnstile?.remove(widgetId)
    widgetId = null
  }
  if (id !== null) {
    await nextTick()
    renderTurnstile()
  }
})

function toggle(id) {
  openId.value = openId.value === id ? null : id
  message.value = ''
}

async function submit(eventId) {
  if (pending.value)
    return

  pending.value = true
  message.value = ''

  try {
    const result = await $fetch('/api/events/signup', {
      method: 'POST',
      body: {
        eventId,
        name: name.value,
        email: email.value,
        website: website.value,
        turnstileToken: turnstileToken.value || undefined,
      },
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
    if (code === 409) {
      message.value = 'You\'re already signed up for this session.'
    }
    else if (code === 403) {
      message.value = err?.data?.message === 'Bot check failed'
        ? 'Couldn\'t verify you\'re human. Try again.'
        : 'Signup isn\'t open yet.'
    }
    else if (code === 400) {
      message.value = 'Check your name and email.'
    }
    else {
      message.value = 'Something went wrong. Try again or email crew@juoksut.run.'
    }
  }
  finally {
    pending.value = false
    if (openId.value !== null)
      resetTurnstile()
  }
}

useSeoMeta({
  title: page.value?.title,
  description: page.value?.summary,
  ogTitle: page.value ? `${page.value.title} · JUOKSUT` : undefined,
  ogDescription: page.value?.summary,
  ogImage: page.value?.imageUrl || undefined,
  ogUrl: `https://juoksut.run/events/${slug}`,
})

useHead({
  link: [{ rel: 'canonical', href: `https://juoksut.run/events/${slug}` }],
})
</script>
