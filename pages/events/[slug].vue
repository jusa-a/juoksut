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
        <div class="flex flex-col px-[1em] py-[1.4em] pb-[2em] min-[500px]:sticky min-[500px]:top-[calc(var(--nav-height)+1px)]">
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
        <!-- Rules run edge to edge of the column, so rows carry their own side padding. -->
        <div class="w-full pb-[1.4em]">
          <p v-if="!page.events.length" class="px-[1em]">
            No sessions open for signup yet. Check back soon.
          </p>
          <ul v-else class="flex flex-col border-t border-pink">
            <li v-for="event in page.events" :key="event.id" class="border-b border-pink">
              <div class="grid grid-cols-[4.5em_minmax(0,1fr)_auto] items-center gap-x-[1em] gap-y-[0.7em] px-[1em] py-[0.9em] min-[500px]:grid-cols-[4.5em_minmax(0,1fr)_auto_auto]">
                <div>
                  <p class="m-0 text-[0.75em] uppercase leading-none">{{ formatWeekday(event.startsAt) }}</p>
                  <p class="m-0 font-serif font-medium text-[2em] tracking-[-0.03em] leading-[0.9]">{{ formatDate(event.startsAt) }}</p>
                </div>

                <div class="min-w-0">
                  <p class="m-0 font-medium">{{ formatTime(event.startsAt) }}</p>
                  <p class="m-0 text-[0.8em]">{{ event.venue }}</p>
                </div>

                <span class="text-[0.8em] text-right" :class="{ 'min-[500px]:col-span-2': event.state === 'not_open' }">
                  <template v-if="event.state === 'not_open'">{{ formatOpens(event.opensAt) }}</template>
                  <template v-else-if="event.state === 'full'">Full</template>
                  <template v-else-if="typeof event.spotsLeft === 'number'">{{ spotsLeft(event.spotsLeft) }}</template>
                </span>

                <div v-if="event.state !== 'not_open'" class="col-span-3 min-[500px]:col-span-1">
                  <button
                    type="button"
                    class="w-full min-[500px]:w-auto"
                    :class="event.state === 'full' ? buttonSecondaryClass : buttonClass"
                    :aria-expanded="openId === event.id"
                    :aria-controls="`signup-${event.id}`"
                    @click="toggle(event.id)"
                  >
                    {{ openId === event.id ? 'Close' : event.state === 'full' ? 'Join waitlist' : 'Sign up' }}
                  </button>
                </div>
              </div>

              <form
                v-if="openId === event.id"
                :id="`signup-${event.id}`"
                class="flex flex-col gap-[0.8em] px-[1em] pb-[1.2em]"
                @submit.prevent="submit(event.id)"
              >
                <div class="grid grid-cols-1 gap-[0.6em] min-[640px]:grid-cols-2">
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

                <div class="flex flex-col gap-[0.8em] min-[640px]:flex-row min-[640px]:items-center min-[640px]:justify-end">
                  <p v-if="formError" role="alert" class="m-0 font-medium text-red-500 min-[640px]:mr-auto">
                    {{ formError }}
                  </p>
                  <button
                    type="submit"
                    class="w-full min-[640px]:w-auto"
                    :class="buttonClass"
                    :disabled="pending || (!!page.turnstileSiteKey && !turnstileToken)"
                  >
                    {{ pending ? 'Sending…' : event.state === 'full' ? 'Join waitlist' : 'Sign up' }}
                  </button>
                </div>
              </form>

              <p v-if="done?.eventId === event.id" role="status" class="m-0 mx-[1em] mb-[0.9em] px-[1em] py-[0.8em] bg-pink text-white">
                {{ done.text }}
              </p>
            </li>
          </ul>
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

const buttonBase = 'uppercase text-center border border-pink px-[1em] py-[0.7em] min-h-[44px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pink disabled:opacity-60'
const buttonClass = `${buttonBase} text-white bg-pink hover:bg-white hover:text-pink`
const buttonSecondaryClass = `${buttonBase} text-pink bg-white hover:bg-pink hover:text-white`
const inputClass = 'border border-pink bg-white px-[0.6em] py-[0.5em] min-h-[44px] w-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pink'

const weekdayFormat = new Intl.DateTimeFormat('en-GB', {
  weekday: 'short',
  timeZone: 'Europe/Helsinki',
})
// Finnish style, e.g. "6.11."
const dateFormat = new Intl.DateTimeFormat('fi-FI', {
  day: 'numeric',
  month: 'numeric',
  timeZone: 'Europe/Helsinki',
})
const timeFormat = new Intl.DateTimeFormat('en-GB', {
  hour: '2-digit',
  minute: '2-digit',
  timeZone: 'Europe/Helsinki',
})

const paragraphs = computed(() => eventParagraphs(page.value?.body))
const formatWeekday = unix => weekdayFormat.format(new Date(unix * 1000))
const formatDate = unix => dateFormat.format(new Date(unix * 1000))
const formatTime = unix => timeFormat.format(new Date(unix * 1000))
const formatOpens = unix => `Opens ${formatWeekday(unix)} ${formatDate(unix)} ${formatTime(unix)}`
const spotsLeft = left => `${left} ${left === 1 ? 'spot' : 'spots'} left`

const openId = ref(null)
const name = ref('')
const email = ref('')
const website = ref('')
const pending = ref(false)
const formError = ref('')
const done = ref(null)

// Turnstile: one widget in whichever form is open. The token is single-use,
// so every submit attempt gets a fresh one. The container sits inside the
// v-for, so Vue fills this ref with an array.
const turnstileEl = ref([])
const turnstileToken = ref('')
const turnstileScript = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'
let widgetId = null

function renderTurnstile() {
  const sitekey = page.value?.turnstileSiteKey
  const el = turnstileEl.value[0]
  if (!sitekey || !window.turnstile || !el)
    return
  widgetId = window.turnstile.render(el, {
    sitekey,
    appearance: 'interaction-only',
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
  formError.value = ''
  done.value = null
}

async function submit(eventId) {
  if (pending.value)
    return

  pending.value = true
  formError.value = ''
  done.value = null

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

    done.value = {
      eventId,
      text: result.status === 'waitlist'
        ? `You're number ${result.position} on the waitlist. We'll email you if a spot opens.`
        : 'You\'re in! Check your email for the details.',
    }

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
      formError.value = 'You\'re already signed up for this session.'
    }
    else if (code === 403) {
      formError.value = err?.data?.message === 'Bot check failed'
        ? 'Couldn\'t verify you\'re human. Try again.'
        : 'Signup isn\'t open yet.'
    }
    else if (code === 400) {
      formError.value = 'Check your name and email.'
    }
    else {
      formError.value = 'Something went wrong. Try again or email crew@juoksut.run.'
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
