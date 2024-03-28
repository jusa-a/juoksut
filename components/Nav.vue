<template>
    <nav class="flex sticky top-0 z-99 p-1 h-[var(--nav-height)] divider-b">
        <img src="/logo.svg" alt="JUOKSUT RUN CLUB LEGS LOGO" />

        <div class="navContainer flex flex-wrap justify-between items-end grow">
            <NuxtLink class="home self-center" to="/">
                <h1 id="juoksut" class="pl-[0.15em] pb-[0.07em] mt-[0.2em]">
                    JUOKSUT
                </h1>
            </NuxtLink>

            <div
                class="navLinks flex grow justify-between gap-[2em] justify-self-end text-right pl-[0vw] pr-[0vw]">
                <NuxtLink to="/join">JOIN</NuxtLink>
                <NuxtLink to="/archive">ARCHIVE</NuxtLink>
                <NuxtLink to="/shop">SHOP</NuxtLink>
            </div>
        </div>
    </nav>
</template>

<script setup></script>

<style scoped>
    nav {
        mix-blend-mode: multiply;
        overflow: hidden;
        /* filter: invert(100%); */
    }

    .home:hover {
        transform: none;
        opacity: 70%;
    }

    #juoksut {
        @apply font-serif font-medium;
        font-size: min(17.3vw, 4em);
        line-height: 0.7em;

        /* transition: 0.15s; */
        transform: skewX(-8deg);
    }

    .navLinks {
        max-width: 16.5em;
    }

    .navLinks a {
        line-height: 1em;
    }

    .navLinks a::before {
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
