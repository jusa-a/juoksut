<template>
    <div
        class="navContainer flex sticky top-0 z-99 p-1 h-[var(--nav-height)] divider-b">
        <img src="/logo.svg" alt="JUOKSUT RUN CLUB LEGS LOGO" />

        <nav class="flex flex-wrap justify-between items-end grow">
            <div
                class="home flex self-center pl-[0.6em] pb-[0.28em] pt-[0.9em]">
                <NuxtLink to="/">JUOKSUT</NuxtLink>
            </div>

            <div
                class="navLinks flex grow justify-between gap-[2em] justify-self-end text-right pl-[0.5vw] pr-[0.5vw]">
                <NuxtLink to="/join">JOIN</NuxtLink>
                <NuxtLink to="/archive">ARCHIVE</NuxtLink>
                <NuxtLink to="/shop">SHOP</NuxtLink>
            </div>
        </nav>
    </div>
</template>

<script setup></script>

<style scoped>
    .navContainer {
        mix-blend-mode: multiply;
        overflow: hidden;
    }

    .home {
        line-height: 0;
        overflow: hidden;
    }

    .home a {
        @apply font-serif font-medium;
        font-size: min(17.3vw, 4em);
        line-height: 0.7em;
        padding-right: 0.1em;

        transition: 0.15s;
        transform: skewX(-8deg);
    }

    .navLinks {
        max-width: 16.5em;
    }

    .navLinks a {
        padding-top: 0.4em;
        line-height: 1em;
    }

    a::before {
        display: block;
        content: attr(title);
        height: 0;
        overflow: hidden;
        visibility: hidden;
    }

    .navLinks > .router-link-active {
        transform: skewX(-10deg);
        text-decoration: underline;
    }
</style>
