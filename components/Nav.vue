<template>
    <nav
        class="flex justify-between sticky top-0 z-99 p-1 h-[var(--nav-height)] divider-b mix-blend-exclusion">
        <img src="/logo.svg" alt="JUOKSUT RUN CLUB" />

        <div class="flex flex-col justify-between text-right">
            <NuxtLink to="/">HOME</NuxtLink>
            <NuxtLink to="/join">JOIN</NuxtLink>
            <NuxtLink to="/archive">ARCHIVE</NuxtLink>
        </div>
    </nav>
</template>

<script setup></script>

<style scoped>
    .router-link-active {
        transform: skewX(-10deg);
        text-decoration: underline;
    }
</style>
