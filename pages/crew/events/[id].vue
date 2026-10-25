<template>
  <div class="h-screen overflow-y-auto px-[1em] pb-[2em]">
    <header class="flex flex-wrap items-center justify-between gap-[1em] py-[0.8em] border-b border-pink">
      <div class="flex items-center gap-[1em]">
        <NuxtLink to="/crew" class="underline text-[0.8em] uppercase">
          Crew
        </NuxtLink>
        <h1 class="text-[1.2em] font-medium uppercase">
          {{ crewEvent ? `${crewEvent.pageTitle} · ${startDate}` : 'Event' }}
        </h1>
      </div>
      <NuxtLink
        v-if="crewEvent"
        :to="`/crew/pages/${crewEvent.pageId}`"
        class="underline text-[0.8em] uppercase"
      >
        Event page
      </NuxtLink>
    </header>

    <p v-if="loadError" class="error">
      {{ messageOf(loadError) }}
    </p>
    <p v-else-if="pending" class="note">
      Loading…
    </p>

    <template v-if="crewEvent">
      <p class="note">
        {{ opensLine }}
      </p>

      <form class="max-w-[46em] mt-[1em]" @submit.prevent="save()">
        <div class="grid gap-[0.75em] sm:grid-cols-2">
          <label class="field">
            <span>Start date</span>
            <input v-model="form.startsAtDate" type="date" required>
          </label>
          <label class="field">
            <span>Start time</span>
            <input v-model="form.startsAtTime" type="time" required>
          </label>
          <label class="field">
            <span>Signups open date</span>
            <input v-model="form.opensAtDate" type="date" required>
          </label>
          <label class="field">
            <span>Signups open time</span>
            <input v-model="form.opensAtTime" type="time" required>
          </label>
          <label class="field">
            <span>Promote until date</span>
            <input v-model="form.promoteUntilDate" type="date" required>
          </label>
          <label class="field">
            <span>Promote until time</span>
            <input v-model="form.promoteUntilTime" type="time" required>
          </label>
        </div>

        <div class="grid gap-[0.75em] sm:grid-cols-2">
          <label class="field">
            <span>Capacity</span>
            <input v-model.number="form.capacity" type="number" min="1" step="1" required>
          </label>
          <label class="field">
            <span>Venue</span>
            <input v-model="form.venue" type="text">
          </label>
        </div>

        <label class="field">
          <span>Details (confirmation email)</span>
          <textarea v-model="form.details" rows="3" />
        </label>

        <div class="flex flex-wrap gap-[0.75em] mt-[0.75em]">
          <button type="submit" class="btn" :disabled="busy">
            {{ busy ? 'Saving…' : 'Save' }}
          </button>
          <button v-if="canOpenNow" type="button" class="btn ghost" :disabled="busy" @click="openNow">
            Open signups now
          </button>
          <button type="button" class="btn ghost" :disabled="busy" @click="removeEvent">
            {{ confirmingRemove ? 'Confirm delete event' : 'Delete event' }}
          </button>
        </div>

        <p v-if="message" :class="isError ? 'error' : 'note'">
          {{ message }}
        </p>
      </form>

      <section v-for="group in groups" :key="group.key" class="max-w-[46em] box">
        <h2 class="px-[0.75em] py-[0.5em] border-b border-pink text-[0.9em] uppercase">
          {{ group.title }}
        </h2>
        <p v-if="!group.rows.length" class="note px-[0.75em]">
          {{ group.empty }}
        </p>
        <ul v-else class="text-[0.9em]">
          <li
            v-for="(signup, index) in group.rows"
            :key="signup.id"
            class="px-[0.75em] py-[0.4em] border-b border-pink last:border-b-0"
          >
            <div class="flex items-center justify-between gap-[0.75em]">
              <span>
                <template v-if="group.numbered">{{ index + 1 }}.</template>
                {{ signup.name }}
              </span>
              <button
                type="button"
                class="underline text-[0.8em] uppercase shrink-0 min-h-[44px]"
                :disabled="removingId === signup.id"
                @click="removeSignup(signup)"
              >
                {{ confirmingSignup === signup.id ? 'Confirm remove' : 'Remove' }}
              </button>
            </div>
            <div class="text-[0.8em]">
              <span class="email">{{ signup.email }}</span>
              · {{ unixToHelsinki(signup.createdAt).date }} {{ unixToHelsinki(signup.createdAt).time }}
            </div>
          </li>
        </ul>
      </section>
    </template>
  </div>
</template>

<script setup>
import { unixToHelsinki } from '~/server/utils/helsinkiTime'

definePageMeta({
  layout: false,
})

useHead({
  title: 'Crew · Event',
})

useSeoMeta({
  robots: 'noindex',
})

const route = useRoute()
const router = useRouter()
const id = String(route.params.id)

const { data, pending, error: loadError, refresh } = await useFetch(`/api/crew/events/${id}/signups`)

const crewEvent = computed(() => data.value?.event || null)
const signups = computed(() => data.value?.signups || [])
const confirmed = computed(() => signups.value.filter(entry => entry.status === 'confirmed'))
const waitlist = computed(() => signups.value.filter(entry => entry.status === 'waitlist'))
const startDate = computed(() => crewEvent.value ? unixToHelsinki(crewEvent.value.startsAt).date : '')

const groups = computed(() => [
  {
    key: 'confirmed',
    title: `Confirmed ${confirmed.value.length}/${crewEvent.value.capacity}`,
    empty: 'Nobody confirmed yet.',
    numbered: false,
    rows: confirmed.value,
  },
  {
    key: 'waitlist',
    title: `Waitlist ${waitlist.value.length}`,
    empty: 'Nobody waiting.',
    numbered: true,
    rows: waitlist.value,
  },
])

const opensLine = computed(() => {
  if (!crewEvent.value)
    return ''
  const { date, time } = unixToHelsinki(crewEvent.value.opensAt)
  return crewEvent.value.opensAt * 1000 > Date.now()
    ? `Signups open ${date} ${time}`
    : 'Signups are open'
})

const canOpenNow = computed(() => {
  if (!crewEvent.value)
    return false
  const now = Date.now() / 1000
  return crewEvent.value.opensAt > now && crewEvent.value.startsAt > now
})

const form = reactive({
  startsAtDate: '',
  startsAtTime: '',
  opensAtDate: '',
  opensAtTime: '',
  promoteUntilDate: '',
  promoteUntilTime: '',
  capacity: 1,
  venue: '',
  details: '',
})

const busy = ref(false)
const confirmingRemove = ref(false)
const confirmingSignup = ref(null)
const removingId = ref(null)
const message = ref('')
const isError = ref(false)

function fill(entry) {
  if (!entry)
    return
  const starts = unixToHelsinki(entry.startsAt)
  const opens = unixToHelsinki(entry.opensAt)
  const promote = unixToHelsinki(entry.promoteUntil)
  Object.assign(form, {
    startsAtDate: starts.date,
    startsAtTime: starts.time,
    opensAtDate: opens.date,
    opensAtTime: opens.time,
    promoteUntilDate: promote.date,
    promoteUntilTime: promote.time,
    capacity: entry.capacity,
    venue: entry.venue,
    details: entry.details,
  })
}

fill(crewEvent.value)

function messageOf(error) {
  return error?.data?.message || error?.data?.statusMessage || error?.message || 'Something went wrong'
}

async function save(overrides = {}, done = 'Saved') {
  busy.value = true
  message.value = ''
  isError.value = false
  try {
    const result = await $fetch(`/api/crew/events/${id}`, { method: 'PATCH', body: { ...form, ...overrides } })
    await refresh()
    fill(crewEvent.value)
    message.value = result.promoted
      ? `Saved. ${result.promoted} promoted from the waitlist.`
      : done
  }
  catch (error) {
    message.value = messageOf(error)
    isError.value = true
  }
  finally {
    busy.value = false
  }
}

function openNow() {
  const now = unixToHelsinki(Math.floor(Date.now() / 1000))
  return save({ opensAtDate: now.date, opensAtTime: now.time }, 'Signups are open')
}

async function removeEvent() {
  if (!confirmingRemove.value) {
    confirmingRemove.value = true
    return
  }

  busy.value = true
  message.value = ''
  isError.value = false
  try {
    await $fetch(`/api/crew/events/${id}`, { method: 'DELETE' })
    await router.push('/crew')
  }
  catch (error) {
    confirmingRemove.value = false
    message.value = messageOf(error)
    isError.value = true
  }
  finally {
    busy.value = false
  }
}

async function removeSignup(signup) {
  if (confirmingSignup.value !== signup.id) {
    confirmingSignup.value = signup.id
    return
  }

  removingId.value = signup.id
  message.value = ''
  isError.value = false
  try {
    const result = await $fetch(`/api/crew/signups/${signup.id}`, { method: 'DELETE' })
    await refresh()
    message.value = result.cancelled
      ? `Removed ${signup.name}.${result.promoted ? ` ${result.promoted} promoted from the waitlist.` : ''}`
      : 'The event has started, so signups can no longer be removed.'
  }
  catch (error) {
    message.value = messageOf(error)
    isError.value = true
  }
  finally {
    confirmingSignup.value = null
    removingId.value = null
  }
}
</script>

<style scoped>
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 44px;
  padding: 0 1em;
  text-transform: uppercase;
  font-size: 0.8em;
  background: #ff639a;
  color: #fff;
  border: 1px solid #ff639a;
}
.btn:hover {
  background: #fff;
  color: #ff639a;
}
.btn:disabled {
  opacity: 0.5;
}
.ghost {
  background: #fff;
  color: #ff639a;
}
.ghost:hover {
  background: #ff639a;
  color: #fff;
}
.field {
  display: flex;
  flex-direction: column;
  gap: 0.2em;
  margin-top: 0.75em;
}
.field span {
  text-transform: uppercase;
  font-size: 0.8em;
}
.field input,
.field textarea {
  width: 100%;
  min-height: 44px;
  padding: 0.4em 0.5em;
  border: 1px solid #ff639a;
  background: #fff;
  outline-color: #ff639a;
}
.box {
  border: 1px solid #ff639a;
  margin-top: 1.5em;
}
.note {
  margin-top: 0.75em;
  font-size: 0.85em;
  text-transform: uppercase;
}
.email {
  overflow-wrap: anywhere;
}
.error {
  margin-top: 0.75em;
  color: #ef4444;
}
</style>
