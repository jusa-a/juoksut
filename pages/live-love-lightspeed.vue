<template>
    <nav
        class="flex justify-center sticky top-0 z-99 py-[0.5em] mix-blend-multiply">
        <img
            src="/img/live-love-lightspeed.svg"
            alt="JUOKSUT RUN CLUB"
            width="100%" />
    </nav>

    <section>
        <div class="sectionContent">
            <h1 class="pt-[1.5em]">
                Join JUOKSUT for SRC x Marski breakfast run!
            </h1>
            <p>
                Juoksut will be joining the epic SRC x Marski by Scandic
                breakfast run for Valentine’s Day morning.
            </p>

            <p>
                Start at 7:00 at Marski, with multiple pace groups to choose
                from, and an epic breakfast at Marski afterward. Shower and bag
                drop available.
            </p>

            <p>
                Come by yourself, bring a friend or your true love. Let’s enjoy
                the Lightspeed together with SRC x Marski.
            </p>

            <iframe
                id="hiddenConfirm"
                name="hiddenConfirm"
                class="hidden"
                @load="loadFrame">
            </iframe>

            <div
                class="mt-[1.5em] px-[1.8em] py-[1.6em] border-[0.08em] border-pink text-center">
                <form
                    v-show="showForm"
                    action="https://docs.google.com/forms/d/e/1FAIpQLSc_4wHttF9L8HoPGSzlVitJI0sRdwqkMnjtqbQ3BrsxqNMYtw/formResponse"
                    target="hiddenConfirm"
                    method="POST">
                    <h3 class="pb-[1.3em] uppercase">
                        Fill your details below to sign up!
                    </h3>

                    <div class="mb-10">
                        <label for="entry.2137368180" class="">Name: </label>
                        <input
                            v-model="name"
                            type="text"
                            name="entry.2137368180"
                            placeholder="Your full name"
                            class="w-[75%] border-pink border-[0.08em] px-[0.4em] placeholder-pink placeholder-opacity-75" />
                    </div>

                    <div class="mb-10 pb-[0.5em]">
                        <label for="entry.610705567" class="">Email: </label>
                        <input
                            v-model="email"
                            type="email"
                            name="entry.610705567"
                            placeholder="Your email address"
                            class="w-[75%] border-pink border-[0.08em] px-[0.4em] placeholder-pink placeholder-opacity-75" />
                    </div>

                    <div
                        v-show="showError"
                        class="bg-pink text-white mb-[1.3em]">
                        <h3>!!! name or email missing !!!</h3>
                    </div>

                    <button
                        type="submit"
                        class="text-pink uppercase bg-white text-center border-[0.08em] border-pink px-[2em] py-[0.3em] hover:bg-pink hover:text-white active:opacity-50">
                        Sign up!
                    </button>
                </form>

                <div v-show="!showForm">
                    <h1 class="pb-[0.5em] uppercase">
                        Thank you {{ name }} for signing up!
                    </h1>
                    <h3>
                        Keep an eye on your inbox, we’ll send a confirmation
                        through email since we have limited spots.
                    </h3>
                </div>
            </div>
        </div>
    </section>

    <section class="divider-t mt-[3em]">
        <video
            ref="video"
            class="object-cover object-center w-[100%] h-[20em]"
            autoplay
            playsinline
            loop
            muted>
            <source src="/juoksut.mp4" type="video/mp4" />
        </video>
    </section>
</template>

<script setup>
    definePageMeta({
        layout: 'landing'
    })

    const name = ref('')
    const email = ref('')

    const showForm = ref(true)
    const showError = ref(false)

    function loadFrame() {
        if (!email.value || !name.value) {
            console.log('form values missing')
            showError.value = true
        } else {
            console.log('form sent')
            showForm.value = !showForm
        }
    }

    /* function onSubmit(event) {
        $fetch(
            'https://docs.google.com/forms/d/e/1FAIpQLSc_4wHttF9L8HoPGSzlVitJI0sRdwqkMnjtqbQ3BrsxqNMYtw/formResponse',
            {
                method: 'POST',
                body: new FormData(event.target)
            }
        )
            .then(response => {
                if (response.ok) {
                    response.json().then(json => {
                        console.log(json)
                    })
                }
            })
            .then(data => {
                console.log('OK:', data)
            })
            .catch(e => {
                console.log(e.response)
            })

        //console.log('error', error)

        //console.log('form submitted')
        //console.log('data')
        //console.log(response.data, response.error)
        //console.log('error')
        //console.log(response.error)

        //showForm.value = false

        //console.log(new FormData(event.target))
    } */
</script>

<style></style>
