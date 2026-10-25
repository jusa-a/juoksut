<template>
  <section>
    <h2 class="uppercase">
      Cancel your spot
    </h2>

    <p v-if="loading">
      Loading…
    </p>

    <template v-else-if="prompt">
      <p>{{ prompt }}</p>

      <template v-if="actionable">
        <p>
          Opening this link doesn't cancel anything. Press the button to
          {{ signup.status === 'waitlist' ? 'leave the waitlist.' : 'give up your spot. If someone is on the waitlist, they get your place.' }}
        </p>
        <button type="button" :class="buttonClass" :disabled="sending" @click="cancelSpot">
          {{ sending ? 'Cancelling…' : signup.status === 'waitlist' ? 'Leave waitlist' : 'Cancel my spot' }}
        </button>
      </template>
    </template>

    <p role="status" aria-live="polite" class="m-0">
      {{ message }}
    </p>
  </section>
</template>

<script setup>
const route = useRoute()
const token = typeof route.query.token === 'string' ? route.query.token : null

const buttonClass = 'uppercase text-white bg-pink text-center border border-pink px-[1em] py-[0.7em] min-h-[44px] hover:bg-white hover:text-pink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pink disabled:opacity-60'

const loading = ref(true)
const signup = ref(null)
const loadError = ref('')
const sending = ref(false)
const sendError = ref(false)
const done = ref(false)

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
const formatStart = unix => `${dayFormat.format(new Date(unix * 1000))}, ${timeFormat.format(new Date(unix * 1000))}`

const started = computed(() => !!signup.value && signup.value.startsAt * 1000 <= Date.now())
const actionable = computed(() => !!signup.value
  && (signup.value.status === 'confirmed' || signup.value.status === 'waitlist')
  && !started.value
  && !done.value)

const prompt = computed(() => {
  if (!signup.value || done.value)
    return ''
  if (signup.value.status === 'cancelled')
    return 'This signup is already cancelled.'
  if (started.value)
    return `${signup.value.title} has already started.`
  return signup.value.status === 'waitlist'
    ? `Leave the waitlist for ${signup.value.title} on ${formatStart(signup.value.startsAt)}?`
    : `Cancel your spot for ${signup.value.title} on ${formatStart(signup.value.startsAt)}?`
})

const message = computed(() => {
  if (done.value)
    return 'Done. Thanks for letting us know.'
  if (sendError.value || loadError.value === 'network')
    return 'Couldn\'t reach the server. Try again.'
  if (loadError.value === 'invalid' || !token)
    return 'This link isn\'t valid.'
  return ''
})

async function load() {
  loading.value = true
  loadError.value = ''
  try {
    signup.value = await $fetch('/api/events/signup', { query: { token } })
  }
  catch (err) {
    signup.value = null
    const code = err?.statusCode ?? err?.status
    loadError.value = !code || code >= 500 ? 'network' : 'invalid'
  }
  finally {
    loading.value = false
  }
}

async function cancelSpot() {
  if (sending.value)
    return

  sending.value = true
  sendError.value = false

  try {
    const result = await $fetch('/api/events/cancel', { method: 'POST', body: { token } })
    if (result.cancelled)
      done.value = true
    else
      // Refused (already cancelled or started since the page loaded): re-read it.
      await load()
  }
  catch (err) {
    const code = err?.statusCode ?? err?.status
    if (!code || code >= 500)
      sendError.value = true
    else
      await load()
  }
  finally {
    sending.value = false
  }
}

onMounted(load)

useSeoMeta({ title: 'Cancel your spot', robots: 'noindex' })
</script>
