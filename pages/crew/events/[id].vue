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
      <form class="max-w-[46em] mt-[1em]" @submit.prevent="save">
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
          <button type="button" class="btn ghost" :disabled="busy" @click="removeEvent">
            {{ confirmingRemove ? 'Confirm delete event' : 'Delete event' }}
          </button>
        </div>

        <p v-if="message" :class="isError ? 'error' : 'note'">
          {{ message }}
        </p>
      </form>

      <section class="max-w-[46em] box">
        <h2 class="px-[0.75em] py-[0.5em] border-b border-pink text-[0.9em] uppercase">
          Confirmed {{ confirmed.length }}/{{ crewEvent.capacity }}
        </h2>
        <p v-if="!confirmed.length" class="note px-[0.75em]">
          Nobody confirmed yet.
        </p>
        <table v-else class="w-full text-left text-[0.9em]">
          <thead class="text-[0.75em] uppercase">
            <tr class="border-b border-pink">
              <th class="px-[0.75em] py-[0.35em] font-normal">
                Name
              </th>
              <th class="font-normal">
                Email
              </th>
              <th class="font-normal">
                Signed up
              </th>
              <th class="font-normal">
                &nbsp;
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="signup in confirmed" :key="signup.id" class="border-b border-pink last:border-b-0">
              <td class="px-[0.75em] py-[0.4em]">
                {{ signup.name }}
              </td>
              <td class="break-all">
                {{ signup.email }}
              </td>
              <td>
                {{ unixToHelsinki(signup.createdAt).date }} {{ unixToHelsinki(signup.createdAt).time }}
              </td>
              <td class="text-right pr-[0.75em] text-[0.8em] uppercase">
                <button
                  type="button"
                  class="underline"
                  :disabled="removingId === signup.id"
                  @click="removeSignup(signup)"
                >
                  {{ confirmingSignup === signup.id ? 'Confirm remove' : 'Remove' }}
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </section>

      <section class="max-w-[46em] box">
        <h2 class="px-[0.75em] py-[0.5em] border-b border-pink text-[0.9em] uppercase">
          Waitlist {{ waitlist.length }}
        </h2>
        <p v-if="!waitlist.length" class="note px-[0.75em]">
          Nobody waiting.
        </p>
        <table v-else class="w-full text-left text-[0.9em]">
          <thead class="text-[0.75em] uppercase">
            <tr class="border-b border-pink">
              <th class="px-[0.75em] py-[0.35em] font-normal">
                Name
              </th>
              <th class="font-normal">
                Email
              </th>
              <th class="font-normal">
                Signed up
              </th>
              <th class="font-normal">
                &nbsp;
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="signup in waitlist" :key="signup.id" class="border-b border-pink last:border-b-0">
              <td class="px-[0.75em] py-[0.4em]">
                {{ signup.name }}
              </td>
              <td class="break-all">
                {{ signup.email }}
              </td>
              <td>
                {{ unixToHelsinki(signup.createdAt).date }} {{ unixToHelsinki(signup.createdAt).time }}
              </td>
              <td class="text-right pr-[0.75em] text-[0.8em] uppercase">
                <button
                  type="button"
                  class="underline"
                  :disabled="removingId === signup.id"
                  @click="removeSignup(signup)"
                >
                  {{ confirmingSignup === signup.id ? 'Confirm remove' : 'Remove' }}
                </button>
              </td>
            </tr>
          </tbody>
        </table>
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

async function save() {
  busy.value = true
  message.value = ''
  isError.value = false
  try {
    const result = await $fetch(`/api/crew/events/${id}`, { method: 'PATCH', body: { ...form } })
    await refresh()
    message.value = result.promoted
      ? `Saved. ${result.promoted} promoted from the waitlist.`
      : 'Saved'
  }
  catch (error) {
    message.value = messageOf(error)
    isError.value = true
  }
  finally {
    busy.value = false
  }
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
.error {
  margin-top: 0.75em;
  color: #ef4444;
}
</style>
