<template>
    <div class="wrapper">
        <div class="values">
            <div><span>U</span>nity in <span>R</span>unning</div>
            <br />
            <div><span>R</span>espect for the <span>I</span>ndividual</div>
            <br />
            <div><span>A</span>chievement</div>
            <br />
            <div><span>E</span>ternal <span>E</span>ndurance</div>
            <br />
            <div><span>L</span>ifelong <span>W</span>ellness</div>
        </div>
    </div>

    <div
        class="sticky top-[var(--nav-height)] -z-10 h-[calc(100vh-var(--nav-height))]">
        <video
            ref="video"
            class="object-cover object-center w-[100%] h-[100%] absolute"
            autoplay
            playsinline
            loop
            muted>
            <source src="/juoksut.mp4" type="video/mp4" />
        </video>
    </div>

    <section
        class="sticky top-[calc(var(--nav-height)-0.1em)] divider-t divider-b p-3 pb-5 flex bg-white">
        <div class="sectionContent">
            <p>
                Juoksut💖💖 is a running club for everyone chasing the ultimate
                feeling of being invincible that speed gives us.
            </p>
            <p>Running every Tuesday and some special Sundays.</p>
            <p>Join us by showing up and bring your friends too💖💖💖</p>
        </div>
    </section>

    <div class="h-[calc(100vh-var(--nav-height))]"></div>
</template>

<script setup></script>

<style scoped>
    .wrapper {
        position: sticky;
        top: calc(45vh - 50vw);
        width: 100%;
        z-index: -1;
        float: left;
        /* display: flex;
        align-items: center;
        justify-content: center; */
        /* shape-outside: linear-gradient(transparent, transparent); */
    }
    .values {
        @apply font-serif font-[500] text-center whitespace-nowrap uppercase leading-loose;
    }

    .values > div {
        font-size: 7vw;
    }

    .values > div > span {
        @apply text-[1.375em];
    }
</style>
