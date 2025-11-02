<template>
  <div>
    <Transition name="tt">
      <div v-show="showWidget" class="fixed top-0 w-full h-full z-[802]">
        <div class="navOverlay h-[var(--nav-height)] w-full bg-white" />
        <Divider />

        <div class="w-full flex flex-wrap h-[calc(100%-var(--nav-height)-1px)]">
          <div
            class="dimOverlay flex-1 min-w-[200px] bg-black bg-opacity-25 border-pink border-r-[1px]"
          />
          <div
            class="h-full flex-1 min-w-[300px] flex flex-col bg-white relative"
            role="dialog"
            aria-modal="true"
            aria-label="Ticket checkout"
          >
            <!-- Floating close button -->
            <button
              ref="closeBtn"
              class="appearance-none text-[3em] font-extralight cursor-pointer absolute top-[0.3em] right-[0.3em] z-[5]"
              type="button"
              aria-label="Close ticket widget"
              title="Close"
              @click="closeWidget"
            >
              ×
            </button>

            <div class="flex-1 overflow-y-scroll text-[0.8em]/[1.3em] flex flex-col">
              <ClientOnly>
                <!-- Inline widget (outer wrapper removed) -->
                <div
                  ref="ttInline"
                  class="tt-widget"
                  :aria-busy="loading"
                >
                  <div v-if="loading" class="tt-loading">Loading tickets…</div>
                  <div v-if="showFallback" class="tt-widget-fallback">
                    <p>
                      <a
                        :href="ticketUrl"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Click here to buy tickets
                      </a>
                    </p>
                  </div>
                </div>

                <noscript>
                  <p>
                  <a href="https://www.tickettailor.com/all-tickets/juoksut/rtne/1/?ref=website_widget&show_search_filter=true&show_date_filter=true&show_sort=true" target="_blank" rel="noopener">
                  Click here to buy tickets
                  </a>
                  <br />
                  <small>
                  <a href="https://www.tickettailor.com?rf=wdg_273546" class="tt-widget-powered">
                  Sell tickets online with Ticket Tailor
                  </a>
                  </small>
                  </p>
                </noscript>
              </ClientOnly>
            </div>
          </div>
        </div>
      </div>
    </Transition>

    <section class="flex flex-row flex-wrap w-full p-0 m-0 mx-auto">
      <div class="flex-1 min-w-[200px]">
        <NuxtImg
          class="mx-auto"
          src="https://cdn.juoksut.run/fastlane-friday.jpg"
          alt="FASTLANE FRIDAY"
          height="1875"
          width="1500"
        />
      </div>

      <div class="flex-1 min-w-[300px] flex flex-col">
        <div class="mb-auto flex flex-col px-[1em] py-[1.4em] pb-[2em] min-[500px]:sticky min-[500px]:top-[calc(var(--nav-height)+1px)] min-[500px]:pb-[6.5em]">
          <div class="flex flex-col">
            <h2 class="text-[2em]">FASTLANE FRIDAY</h2>
          </div>

          <!-- Event Info -->
          <div class="flex-1 flex flex-col gap-[0.4em]">
            <div class="m-0">
              <p class="text-[0.9em]">
                powered by New Balance🪽
              </p>
              <p>
                Every Friday at the Olympic Stadium’s tunnel. 
              </p>

              <p>
                <ul>
                    <li>🔥 16:15 warmup </li>
                    <li>🔃 17:00 track</li>
                    <li>🍕 18:00 afters (optional)</li>
                </ul>
              </p>

              <p>
                All welcome.<br>
                Be faaaaast⚡️⚡️⚡️⚡️⚡️
              </p>
            
            </div>
          </div>
        </div>

        <div class="w-full sticky bottom-0 pb-[1.4em] pt-[1em] px-[1em] z-10">
          <button
            class="w-full text-white uppercase bg-pink text-center border-[1px] border-pink py-[1em] hover:bg-white hover:text-pink"
            @click="openTicketInline"
          >
            Sign Up!
          </button>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue'

const ticketUrl = 'https://www.tickettailor.com/all-tickets/juoksut/rtne/1/?ref=website_widget&show_search_filter=true&show_date_filter=true&show_sort=true'

const showWidget = ref(false)
const ttInline = ref(null)
const closeBtn = ref(null)
let widgetLoaded = false

// control loading state and fallback visibility
const loading = ref(false)
const showFallback = ref(false)
let fallbackTimer

function openWidget() {
  showWidget.value = true
  document.body.style.overflow = 'hidden'
}

function closeWidget() {
  showWidget.value = false
  document.body.style.overflow = 'auto'
}

async function openTicketInline() {
  openWidget()
  loading.value = true
  showFallback.value = false
  await nextTick()
  // Focus the close button for accessibility
  closeBtn.value?.focus()
  if (!ttInline.value)
    return

  if (widgetLoaded) {
    loading.value = false
    return
  }

  // Clean up any previous widget script (e.g., during HMR)
  ttInline.value.querySelectorAll('script[src*="tickettailor"]').forEach(s => s.remove())

  // Show fallback if widget hasn't initialized within 5s
  clearTimeout(fallbackTimer)
  fallbackTimer = window.setTimeout(() => {
    if (!widgetLoaded) {
      loading.value = false
      showFallback.value = true
    }
  }, 5000)

  const script = document.createElement('script')
  script.setAttribute('src', 'https://cdn.tickettailor.com/js/widgets/min/widget.js')
  script.setAttribute('data-url', ticketUrl)
  script.setAttribute('data-type', 'inline')
  script.setAttribute('data-inline-minimal', 'true')
  script.setAttribute('data-inline-show-logo', 'false')
  script.setAttribute('data-inline-bg-fill', 'false')
  script.setAttribute('data-inline-inherit-ref-from-url-param', '')
  script.setAttribute('data-inline-ref', 'website_widget')
  script.async = true
  script.onload = () => {
    widgetLoaded = true
    loading.value = false
    clearTimeout(fallbackTimer)
  }
  script.onerror = (e) => {
    console.error('[TicketTailor] failed to load widget.js', e)
    loading.value = false
    clearTimeout(fallbackTimer)
    showFallback.value = true
  }

  ttInline.value.appendChild(script)
}

// Close on Escape key
function onKeydown(e) {
  if (e.key === 'Escape' && showWidget.value) {
    e.preventDefault()
    closeWidget()
  }
}

onMounted(() => {
  window.addEventListener('keydown', onKeydown)
})

onBeforeUnmount(() => {
  clearTimeout(fallbackTimer)
  window.removeEventListener('keydown', onKeydown)
  document.body.style.overflow = 'auto'
})

useHead({
  title: 'FASTLANE FRIDAY',
})
</script>

<style>
.tt-loading {
  padding: 0.75rem 0;
  font-size: 0.95rem;
}

.tt-enter-active {
  transition: opacity 0.35s ease-out;
}

.tt-leave-active {
  transition: opacity 0.25s ease-in;
  opacity: 1;
}

.tt-enter-from,
.tt-leave-to {
  opacity: 0;
}
</style>
