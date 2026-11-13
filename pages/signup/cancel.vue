<template>
  <section class="flex flex-col gap-[0.9em] px-[1em] py-[1.4em]">
    <h2 class="uppercase">
      Manage signup
    </h2>

    <p v-if="loading">
      Loading…
    </p>

    <template v-else-if="signup">
      <p>{{ signup.title }} · {{ formatStart(signup.startsAt) }}</p>
      <p>{{ prompt }}</p>
      <p v-if="actionable && signup.status === 'waitlist'">
        We’ll email you if a spot opens before {{ formatStart(signup.promoteUntil) }}.
      </p>
      <button v-if="actionable" type="button" :class="buttonClass" :disabled="sending" @click="cancelSpot">
        {{ sending ? 'Cancelling…' : signup.status === 'waitlist' ? 'Leave waitlist' : 'Cancel my spot' }}
      </button>
    </template>

    <p role="status" aria-live="polite" class="m-0">
      {{ message }}
    </p>
  </section>
</template>

<script setup>
const route = useRoute()
const token = typeof route.query.token === 'string' ? route.query.token : null

const buttonClass = 'uppercase text-white bg-pink text-center border border-pink px-[1em] py-[0.7em] min-h-[44px] self-start hover:bg-white hover:text-pink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pink disabled:opacity-60'

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
// After the promotion cutoff a waitlist place can no longer become a spot: nothing left to manage.
const waitlistClosed = computed(() => !!signup.value
  && signup.value.status === 'waitlist'
  && signup.value.promoteUntil * 1000 <= Date.now())
const actionable = computed(() => !!signup.value
  && (signup.value.status === 'confirmed' || signup.value.status === 'waitlist')
  && !signup.value.sessionCancelled
  && !started.value
  && !waitlistClosed.value
  && !done.value)

const prompt = computed(() => {
  if (!signup.value)
    return ''
  if (signup.value.sessionCancelled)
    return 'This session is cancelled.'
  if (signup.value.status === 'cancelled' || done.value)
    return 'Your signup is cancelled.'
  if (started.value)
    return 'This session has already started.'
  if (signup.value.status === 'confirmed')
    return 'Your spot is confirmed.'
  if (waitlistClosed.value)
    return 'The waitlist is closed.'
  return signup.value.position == null
    ? 'You’re on the waitlist.'
    : `You’re number ${signup.value.position} on the waitlist.`
})

const message = computed(() => {
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

useSeoMeta({ title: 'Manage signup', robots: 'noindex' })
</script>
