<template>
  <div class="h-screen overflow-y-auto px-[1em] pb-[2em]">
    <header class="flex flex-wrap items-center justify-between gap-[1em] py-[0.8em] border-b border-pink">
      <div>
        <h1 class="text-[1.3em] font-medium uppercase">
          JUOKSUT Crew
        </h1>
        <p class="text-[0.8em] uppercase">
          Event pages and signups
        </p>
      </div>
      <NuxtLink to="/crew/pages/new" class="btn">
        New page
      </NuxtLink>
    </header>

    <p v-if="loadError" class="error">
      {{ messageOf(loadError) }}
    </p>
    <p v-else-if="pending" class="note">
      Loading…
    </p>
    <p v-else-if="!pages.length" class="note">
      No event pages yet.
    </p>

    <section v-for="page in pages" :key="page.id" class="box">
      <div class="flex flex-wrap items-center justify-between gap-[0.5em] px-[0.75em] py-[0.6em] border-b border-pink">
        <div>
          <NuxtLink :to="`/crew/pages/${page.id}`" class="text-[1.05em] font-medium">
            {{ page.title }}
          </NuxtLink>
          <div class="text-[0.8em] uppercase">
            /{{ page.slug }} · {{ page.published ? 'published' : 'not published' }}
          </div>
        </div>
        <div class="flex items-center gap-[1em] text-[0.8em] uppercase">
          <NuxtLink v-if="page.published" :to="`/events/${page.slug}`" class="underline">
            Public page
          </NuxtLink>
          <NuxtLink :to="`/crew/pages/${page.id}`" class="underline">
            Edit
          </NuxtLink>
        </div>
      </div>

      <p v-if="!eventsOf(page.id).length" class="note px-[0.75em]">
        No events in the last week or ahead.
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
          <tr v-for="entry in eventsOf(page.id)" :key="entry.id" class="border-b border-pink last:border-b-0">
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
  title: 'Crew',
})

useSeoMeta({
  robots: 'noindex',
})

const { data, pending, error: pagesError } = await useFetch('/api/crew/pages')
const { data: eventData, error: eventsError } = await useFetch('/api/crew/events')

const pages = computed(() => data.value?.pages || [])
const events = computed(() => eventData.value?.events || [])

function eventsOf(pageId) {
  return events.value.filter(entry => entry.pageId === pageId)
}

function messageOf(error) {
  return error?.data?.message || error?.data?.statusMessage || error?.message || 'Something went wrong'
}

// Pages load even when their events do not; show whichever error the API gave.
const loadError = computed(() => pagesError.value || eventsError.value)
</script>

<style scoped>
.btn {
  display: inline-flex;
  align-items: center;
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
.box {
  border: 1px solid #ff639a;
  margin-top: 1.5em;
}
.note {
  margin-top: 1em;
  font-size: 0.85em;
  text-transform: uppercase;
}
.error {
  margin-top: 1em;
  color: #ef4444;
}
</style>
