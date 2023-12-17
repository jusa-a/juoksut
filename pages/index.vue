<template>
    <div class="flex justify-center sticky top-[13vh] -z-10">
        <div class="">
            <video
                ref="video"
                class="object-cover object-center w-[100vw] h-[100vh-13vh]"
                autoplay
                playsinline
                loop
                muted>
                <source src="/juoksut.mp4" type="video/mp4" />
            </video>
        </div>

        <!-- prettier-ignore -->
        <div class="values">
            <div class="text-xl">
                <span>U</span>nity in
                <span>R</span>unning
            </div>
            <br />
            <div>
                <span>R</span>espect for the
                <span>I</span>ndividual
            </div>
            <br />
            <div>
                <span>A</span>chievement
            </div>
            <br />
            <div>
                <span>E</span>ternal
                <span>E</span>ndurance
            </div>
            <br />
            <div>
                <span>L</span>ifelong
                <span>W</span>ellness
            </div>
        </div>
    </div>

    <section
        class="border-y border-pink bg-white sticky top-[calc(13vh-1px)] p-3">
        <p>
            Juoksut💖💖 is a running club for everyone, chasing the ultimate
            feeling of being invincible that speed gives us. Running every
            Tuesday and some special Sundays. Join us by showing up and bring
            your friends too💖💖💖
        </p>
    </section>

    <div class="h-[80vh]"></div>
</template>

<script setup></script>

<style scoped>
    .values {
        @apply font-serif text-center whitespace-nowrap text-pink uppercase leading-loose absolute top-[48%] left-1/2 -translate-x-1/2 -translate-y-1/2;
    }

    .values > div {
        font-size: clamp(10px, 6.3vw, 200px);
    }

    .values > div > span {
        @apply text-[1.375em];
    }
</style>
