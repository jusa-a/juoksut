<template>
    <nav
        class="flex justify-between sticky top-0 z-99 border-b p-1 border-pink h-[15vh] bg-white">
        <img src="/logo.svg" alt="JUOKSUT RUN CLUB" />

        <div class="flex flex-col justify-between text-right text-pink">
            <NuxtLink class="" to="">HOME</NuxtLink>
            <NuxtLink to="">JOIN</NuxtLink>
            <NuxtLink to="">ARCHIVE</NuxtLink>
        </div>
    </nav>

    <div class="flex justify-center w-[100vw] sticky top-[15vh] -z-10">
        <video ref="video" class="w-[100%]" autoplay playsinline loop muted>
            <source src="/juoksut.mp4" type="video/mp4" />
        </video>

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

    <div class="border-y border-pink bg-white sticky top-[calc(15vh-1px)] p-3">
        <p class="">
            Lorem ipsum dolor sit amet consectetur. Integer cras mi condimentum
            gravida elementum fermentum sed mattis. Aliquet ipsum eget eleifend
            adipiscing arcu nulla. Aliquet ipsum eget eleifend adipiscing arcu
            nulla.
        </p>
        <br />
        <p class="">
            Lorem ipsum dolor sit amet consectetur. Integer cras mi condimentum
            gravida elementum fermentum sed mattis. Aliquet ipsum eget eleifend
            adipiscing arcu nulla. Aliquet ipsum eget eleifend adipiscing arcu
            nulla.
        </p>
    </div>

    <div class="h-[50vh]"></div>

    <footer class="text-pink bg-white">
        <div class="flex justify-center border-t border-pink bg-white p-5">
            <img src="/img/livingthelightspeedlifestyle.svg" alt="" />
        </div>

        <div class="flex justify-between px-3 border-y border-pink">
            <a href="https://www.strava.com/clubs/juoksut">STRAVA</a>
            <a href="https://www.instagram.com/juoksut/">INSTAGRAM</a>
        </div>

        <div class="flex justify-center">© JUOKSUT RY 2023</div>
    </footer>
</template>

<script setup></script>

<style scoped>
    .values {
        @apply font-serif text-center whitespace-nowrap text-pink uppercase leading-loose absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2;
    }

    .values > div {
        font-size: 6.2vw;
    }

    .values > div > span {
        @apply text-[1.375em];
    }
</style>
