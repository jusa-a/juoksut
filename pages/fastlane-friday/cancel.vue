<template>
  <section>
    <h2 class="uppercase">
      Cancel your spot
    </h2>

    <template v-if="token && !done">
      <p>
        Opening this link doesn't cancel anything. Press the button to give up your
        Fastlane Friday spot. If someone is on the waitlist, they get your place.
      </p>
      <button type="button" :class="buttonClass" :disabled="sending" @click="cancelSpot">
        {{ sending ? 'Cancelling…' : 'Cancel my spot' }}
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

const buttonClass = 'uppercase text-white bg-pink text-center border border-pink px-[1em] py-[0.7em] min-h-[44px] hover:bg-white hover:text-pink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pink disabled:opacity-60'
const invalidMessage = 'This link has already been used or isn\'t valid.'

const sending = ref(false)
const done = ref(false)
const cancelled = ref(false)

const message = computed(() => {
  if (!token)
    return invalidMessage
  if (!done.value)
    return ''
  return cancelled.value
    ? 'Your spot is cancelled. Thanks for letting us know.'
    : invalidMessage
})

async function cancelSpot() {
  sending.value = true
  try {
    const result = await $fetch('/api/fastlane/cancel', { method: 'POST', body: { token } })
    cancelled.value = result.cancelled === true
  }
  catch {
    cancelled.value = false
  }
  finally {
    sending.value = false
    done.value = true
  }
}

useSeoMeta({ title: 'Cancel your spot', robots: 'noindex' })
</script>
