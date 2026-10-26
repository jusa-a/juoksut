<template>
  <NuxtLink
    :to="`/events/${event.slug}`"
    class="block border-[1px] border-transparent hover:border-pink"
  >
    <div class="aspect-[4/5] flex items-center justify-center overflow-hidden">
      <NuxtImg
        v-if="event.imageUrl"
        :src="event.imageUrl"
        :alt="event.title"
        height="1875"
        width="1500"
        class="w-full h-full object-cover"
      />
      <div v-else class="w-full h-full flex items-center justify-center border-[1px] border-pink p-[1em] text-center">
        <span class="font-serif font-medium text-[1.5em] tracking-[-0.03em]">{{ event.title }}</span>
      </div>
    </div>

    <div class="py-[0.5em] px-[0.5em]">
      <div class="font-serif font-medium text-[1.2em] tracking-[-0.03em]">{{ event.title }}</div>
      <div class="text-[0.8em] uppercase">
        {{ date }}
      </div>
      <div class="text-[0.8em] uppercase">
        {{ status }}
      </div>
    </div>
  </NuxtLink>
</template>

<script setup>
const props = defineProps({
  event: { type: Object, required: true },
})

// Finnish style, e.g. "16.10."
const dateFormat = new Intl.DateTimeFormat('fi-FI', {
  day: 'numeric',
  month: 'numeric',
  timeZone: 'Europe/Helsinki',
})

const format = unix => dateFormat.format(new Date(unix * 1000))

const date = computed(() => {
  const first = format(props.event.firstStartsAt)
  const last = format(props.event.lastStartsAt)
  return first === last ? first : `${first}–${last}`
})

const status = computed(() => ({ current: 'Now on', upcoming: 'Coming up', past: 'Past' })[props.event.status])
</script>
