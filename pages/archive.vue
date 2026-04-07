<template>
  <div class="flex-1 flex flex-col">
    <div class="p-[1em] pt-0">
      <div v-if="status === 'pending' || !rows.length" class="mt-6 space-y-3">
        <div v-for="n in 4" :key="n" class="flex gap-3">
          <div class="aspect-[9/16] bg-gray-100 animate-pulse" :style="n % 2 === 0 ? 'width:60%' : 'width:40%'" />
          <div v-if="n % 3 !== 0" class="aspect-[9/16] bg-gray-100 animate-pulse flex-1" />
        </div>
      </div>
      <div v-else-if="error" class="mt-6 text-sm opacity-50">
        Could not load archive.
      </div>
      <template v-else>
        <div
          v-for="(row, ri) in rows"
          :key="ri"
          class="grid gap-3 py-[6px]"
          :style="`grid-template-columns: ${row.cols}`"
        >
          <div
            v-for="(cell, ci) in row.cells"
            :key="ci"
            class="min-w-0"
            :class="cell.align === 'end' ? 'flex justify-end items-start' : cell.align === 'start' ? 'flex justify-start items-start' : ''"
          >
            <a
              v-if="cell.video"
              :href="cell.video.permalink"
              target="_blank"
              rel="noopener"
              class="block bg-gray-100 hover:opacity-90 transition-opacity"
              :style="`width: ${cell.size === 'sm' ? '75%' : cell.size === 'md' ? '79%' : '83%'}`"
            >
              <video
                :src="cell.video.media_url"
                :poster="cell.video.thumbnail_url"
                autoplay
                muted
                loop
                playsinline
                class="w-full block"
              />
            </a>
          </div>
        </div>
      </template>
      <div ref="sentinel" class="h-4" />
      <div v-if="loadingMore" class="mt-3 space-y-3">
        <div v-for="n in 2" :key="n" class="flex gap-3">
          <div class="aspect-[9/16] bg-gray-100 animate-pulse" :style="n % 2 === 0 ? 'width:60%' : 'width:40%'" />
          <div class="aspect-[9/16] bg-gray-100 animate-pulse flex-1" />
        </div>
      </div>
    </div>
    <div class="h-[3em]" />
    <FooterVideo />
  </div>
</template>

<script setup>
const { data, status, error } = await useFetch('/api/instagram')

const rowConfigs = [
  { cols: '1fr 1.75fr 1fr', cells: [null, { size: 'sm' }, null] },
  { cols: '1fr 1fr 1fr', cells: [{ size: 'sm', align: 'start' }, null, null] },
  { cols: '1fr 1fr 1fr', cells: [null, null, { size: 'sm', align: 'end' }] },
  { cols: '1fr 0.25fr 1fr', cells: [{ size: 'lg' }, null, { size: 'md' }] },
  { cols: '2fr 1fr 1fr', cells: [{ size: 'lg' }, null, { size: 'sm' }] },
  { cols: '1fr 1fr 2fr', cells: [{ size: 'sm' }, null, { size: 'lg' }] },
  { cols: '1fr 1fr 1fr', cells: [null, { size: 'lg' }, { size: 'sm' }] },
  { cols: '1fr 1fr 1fr', cells: [{ size: 'sm' }, { size: 'lg' }, null] },
  { cols: '0.2fr 1fr 0.2fr', cells: [null, { size: 'sm' }, null] },
  { cols: '1fr 1fr 0.5fr', cells: [null, { size: 'lg' }, { size: 'sm' }] },
]

const mobileConfigs = [
  { cols: '1fr', cells: [{ size: 'lg' }] },
  { cols: '1fr', cells: [{ size: 'md', align: 'start' }] },
  { cols: '1fr', cells: [{ size: 'md', align: 'end' }] },
  { cols: '1fr 1fr', cells: [{ size: 'lg' }, { size: 'md' }] },
  { cols: '1fr 1fr', cells: [{ size: 'md' }, { size: 'lg' }] },
]

function buildRows(videos) {
  const configs = isMobile.value ? mobileConfigs : rowConfigs
  const pool = [...videos]
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]]
  }
  const result = []
  let lastConfig = null
  while (pool.length > 0) {
    let config
    let attempts = 0
    do {
      config = configs[Math.floor(Math.random() * configs.length)]
      attempts++
    } while (config === lastConfig && attempts < 10)
    const slots = config.cells.filter(c => c !== null).length
    if (pool.length < slots)
      config = configs[0]
    lastConfig = config
    const cells = config.cells.map((cellDef) => {
      if (!cellDef || pool.length === 0)
        return {}
      return { ...cellDef, video: pool.shift() }
    })
    result.push({ cols: config.cols, cells })
  }
  return result
}

const isMobile = ref(false)
const rows = ref([])
const sentinel = ref(null)
const loadingMore = ref(false)
const nextCursor = ref(null)
const hasMore = ref(false)

onMounted(() => {
  if (!data.value?.media?.length)
    return
  isMobile.value = window.innerWidth < 640
  rows.value = buildRows(data.value.media)
  nextCursor.value = data.value.nextCursor
  hasMore.value = data.value.hasMore

  const observer = new IntersectionObserver(async ([entry]) => {
    if (!entry.isIntersecting || loadingMore.value || !hasMore.value)
      return
    loadingMore.value = true
    try {
      const more = await $fetch(`/api/instagram?cursor=${nextCursor.value}`)
      if (more.media?.length) {
        rows.value.push(...buildRows(more.media))
        nextCursor.value = more.nextCursor
        hasMore.value = more.hasMore
      }
    }
    finally {
      loadingMore.value = false
    }
  }, { rootMargin: '200px' })

  if (sentinel.value)
    observer.observe(sentinel.value)
  onUnmounted(() => observer.disconnect())
})

useSeoMeta({
  title: 'Archive',
  description: 'JUOKSUT video archive.',
  ogTitle: 'Archive · JUOKSUT',
  ogDescription: 'JUOKSUT video archive.',
  ogUrl: 'https://juoksut.run/archive',
})
useHead({
  link: [{ rel: 'canonical', href: 'https://juoksut.run/archive' }],
})
</script>
