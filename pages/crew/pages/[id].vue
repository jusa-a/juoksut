<template>
  <div class="h-screen overflow-y-auto px-[1em] pb-[2em]">
    <header class="flex flex-wrap items-center justify-between gap-[1em] py-[0.8em] border-b border-pink">
      <div class="flex items-center gap-[1em]">
        <NuxtLink to="/crew" class="underline text-[0.8em] uppercase">
          Crew
        </NuxtLink>
        <h1 class="text-[1.2em] font-medium uppercase">
          {{ isNew ? 'New page' : 'Event page' }}
        </h1>
      </div>
      <NuxtLink v-if="page?.published" :to="`/events/${form.slug}`" class="underline text-[0.8em] uppercase">
        Public page
      </NuxtLink>
    </header>

    <p v-if="loadError" class="error">
      {{ messageOf(loadError) }}
    </p>
    <p v-else-if="pending" class="note">
      Loading…
    </p>

    <form class="max-w-[46em] mt-[1em]" @submit.prevent="savePage">
      <div class="grid gap-[0.75em] sm:grid-cols-2">
        <label class="field">
          <span>Slug</span>
          <input v-model="form.slug" type="text" required placeholder="fastlane-friday">
        </label>
        <label class="field">
          <span>Title</span>
          <input v-model="form.title" type="text" required>
        </label>
      </div>

      <label class="field">
        <span>Summary</span>
        <input v-model="form.summary" type="text" required>
      </label>

      <label class="field">
        <span>Body</span>
        <textarea v-model="form.body" rows="5" />
      </label>

      <div class="grid gap-[0.75em] sm:grid-cols-2">
        <label class="field">
          <span>Image URL</span>
          <input v-model="form.imageUrl" type="text" placeholder="https://cdn.juoksut.run/…">
        </label>
        <label class="field">
          <span>Capacity</span>
          <input v-model.number="form.capacity" type="number" min="1" step="1" required>
        </label>
      </div>

      <label class="field">
        <span>Venue</span>
        <input v-model="form.venue" type="text">
      </label>

      <label class="field">
        <span>Details (confirmation email)</span>
        <textarea v-model="form.details" rows="3" />
      </label>

      <div class="grid gap-[0.75em] sm:grid-cols-3">
        <label class="field">
          <span>Start time</span>
          <input v-model="form.startTime" type="time" required>
        </label>
        <label class="field">
          <span>Signups open</span>
          <input v-model="form.opensRule" type="text" required placeholder="monday 12:00">
        </label>
        <label class="field">
          <span>Promote until</span>
          <input v-model="form.promoteRule" type="text" required placeholder="same-day 12:00">
        </label>
      </div>

      <label class="flex items-center gap-[0.5em] min-h-[44px] uppercase text-[0.8em]">
        <input v-model="form.published" type="checkbox" class="w-[22px] h-[22px] accent-[#ff639a]">
        Published
      </label>

      <div class="flex flex-wrap gap-[0.75em] mt-[0.5em]">
        <button type="submit" class="btn" :disabled="busy">
          {{ busy ? 'Saving…' : isNew ? 'Create page' : 'Save' }}
        </button>
        <template v-if="!isNew">
          <button
            type="button"
            class="btn ghost"
            :disabled="busy"
            @click="removePage"
          >
            {{ confirmingRemove ? 'Confirm delete page' : 'Delete page' }}
          </button>
        </template>
      </div>

      <p v-if="message" :class="isError ? 'error' : 'note'">
        {{ message }}
      </p>
    </form>

    <section v-if="!isNew" class="max-w-[46em] box">
      <h2 class="px-[0.75em] py-[0.5em] border-b border-pink text-[0.9em] uppercase">
        Add dates
      </h2>

      <div class="p-[0.75em] flex flex-col gap-[0.75em]">
        <div class="flex gap-[1em] text-[0.8em] uppercase">
          <label class="flex items-center gap-[0.4em] min-h-[44px]">
            <input v-model="mode" type="radio" value="single" class="accent-[#ff639a]">
            One date
          </label>
          <label class="flex items-center gap-[0.4em] min-h-[44px]">
            <input v-model="mode" type="radio" value="weekly" class="accent-[#ff639a]">
            Weekly
          </label>
        </div>

        <label v-if="mode === 'single'" class="field">
          <span>Date</span>
          <input v-model="singleDate" type="date">
        </label>

        <template v-else>
          <div class="grid gap-[0.75em] sm:grid-cols-2">
            <label class="field">
              <span>First date</span>
              <input v-model="firstDate" type="date">
            </label>
            <label class="field">
              <span>Last date</span>
              <input v-model="lastDate" type="date">
            </label>
          </div>

          <div class="field">
            <span>Skip dates</span>
            <div class="flex gap-[0.5em] items-center">
              <input v-model="skipInput" type="date" class="flex-1">
              <button type="button" class="btn ghost" @click="addSkipDate">
                Add
              </button>
            </div>
            <ul v-if="skipDates.length" class="mt-[0.5em]">
              <li v-for="date in skipDates" :key="date" class="flex justify-between items-center border-b border-pink py-[0.2em]">
                <span>{{ date }}</span>
                <button type="button" class="underline text-[0.8em] uppercase" @click="removeSkipDate(date)">
                  Remove
                </button>
              </li>
            </ul>
          </div>
        </template>

        <div>
          <button type="button" class="btn" :disabled="addBusy" @click="addDates">
            {{ addBusy ? 'Adding…' : 'Add dates' }}
          </button>
        </div>

        <p v-if="addMessage" class="note">
          {{ addMessage }}
        </p>
      </div>
    </section>

    <section v-if="!isNew" class="max-w-[46em] box">
      <h2 class="px-[0.75em] py-[0.5em] border-b border-pink text-[0.9em] uppercase">
        Events
      </h2>
      <p v-if="!events.length" class="note px-[0.75em]">
        No events yet.
      </p>
      <table v-else class="w-full text-left text-[0.9em]">
        <thead class="text-[0.75em] uppercase">
          <tr class="border-b border-pink">
            <th class="px-[0.75em] py-[0.35em] font-normal">
              Date
            </th>
            <th class="font-normal">
              Time
            </th>
            <th class="font-normal">
              Confirmed
            </th>
            <th class="font-normal">
              Waitlist
            </th>
            <th class="font-normal">
              &nbsp;
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="entry in events" :key="entry.id" class="border-b border-pink last:border-b-0">
            <td class="px-[0.75em] py-[0.4em]">
              {{ unixToHelsinki(entry.startsAt).date }}
            </td>
            <td>{{ unixToHelsinki(entry.startsAt).time }}</td>
            <td>{{ entry.confirmed }}/{{ entry.capacity }}</td>
            <td>{{ entry.waitlist }}</td>
            <td class="text-right pr-[0.75em] text-[0.8em] uppercase">
              <NuxtLink :to="`/crew/events/${entry.id}`" class="underline">
                Open
              </NuxtLink>
            </td>
          </tr>
        </tbody>
      </table>
    </section>
  </div>
</template>

<script setup>
import { unixToHelsinki } from '~/server/utils/helsinkiTime'

definePageMeta({
  layout: false,
})

useHead({
  title: 'Crew · Event page',
})

useSeoMeta({
  robots: 'noindex',
})

const route = useRoute()
const router = useRouter()

const id = computed(() => String(route.params.id))
const isNew = computed(() => id.value === 'new')

const form = reactive({
  slug: '',
  title: '',
  body: '',
  imageUrl: '',
  summary: '',
  venue: '',
  details: '',
  capacity: 40,
  startTime: '16:30',
  opensRule: 'monday 12:00',
  promoteRule: 'same-day 12:00',
  published: false,
})

const { data, pending, error: loadError, refresh: refreshPages } = await useFetch('/api/crew/pages')
const { data: eventData, refresh: refreshEvents } = await useFetch('/api/crew/events')

const pages = computed(() => data.value?.pages || [])
const page = computed(() => pages.value.find(entry => String(entry.id) === id.value))
const events = computed(() => (eventData.value?.events || []).filter(entry => String(entry.pageId) === id.value))

if (page.value)
  Object.assign(form, page.value)

const busy = ref(false)
const confirmingRemove = ref(false)
const message = ref('')
const isError = ref(false)

const mode = ref('single')
const singleDate = ref('')
const firstDate = ref('')
const lastDate = ref('')
const skipInput = ref('')
const skipDates = ref([])
const addBusy = ref(false)
const addMessage = ref('')

function messageOf(error) {
  return error?.data?.message || error?.data?.statusMessage || error?.message || 'Something went wrong'
}

function showMessage(error) {
  message.value = messageOf(error)
  isError.value = Boolean(error)
}

async function savePage() {
  const creating = isNew.value
  busy.value = true
  showMessage(null)
  try {
    const saved = creating
      ? await $fetch('/api/crew/pages', { method: 'POST', body: { ...form } })
      : await $fetch(`/api/crew/pages/${id.value}`, { method: 'PATCH', body: { ...form } })
    Object.assign(form, saved)
    if (creating) {
      await refreshPages()
      await router.push(`/crew/pages/${saved.id}`)
    }
    showMessage(null)
    message.value = 'Saved'
  }
  catch (error) {
    showMessage(error)
  }
  finally {
    busy.value = false
  }
}

async function removePage() {
  if (!confirmingRemove.value) {
    confirmingRemove.value = true
    return
  }

  busy.value = true
  showMessage(null)
  try {
    await $fetch(`/api/crew/pages/${id.value}`, { method: 'DELETE' })
    await router.push('/crew')
  }
  catch (error) {
    confirmingRemove.value = false
    showMessage(error)
  }
  finally {
    busy.value = false
  }
}

function addSkipDate() {
  const date = skipInput.value
  if (date && !skipDates.value.includes(date))
    skipDates.value.push(date)
  skipInput.value = ''
}

function removeSkipDate(date) {
  skipDates.value = skipDates.value.filter(entry => entry !== date)
}

async function addDates() {
  addBusy.value = true
  addMessage.value = ''
  try {
    const body = { pageId: Number(id.value), skipDates: mode.value === 'weekly' ? skipDates.value : [] }
    if (mode.value === 'single') {
      body.date = singleDate.value
    }
    else {
      body.firstDate = firstDate.value
      body.lastDate = lastDate.value
    }

    const result = await $fetch('/api/crew/events', { method: 'POST', body })
    const parts = []
    if (result.created.length)
      parts.push(`Created ${result.created.join(', ')}`)
    if (result.existing.length)
      parts.push(`Already there ${result.existing.join(', ')}`)
    addMessage.value = parts.join('. ') || 'No dates to create'
    await refreshEvents()
  }
  catch (error) {
    addMessage.value = messageOf(error)
  }
  finally {
    addBusy.value = false
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
