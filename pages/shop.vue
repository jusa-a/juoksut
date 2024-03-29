<template>
    <section class="itemsContainer flex flex-col m-auto">
        <NuxtLink to="" class="shopItem mb-[2em]">
            <div class="thumb">
                <NuxtImg
                    src="/img/longsleeve.jpeg"
                    alt="long sleeve"
                    class="object-cover w-[100%] h-[100%]" />
            </div>
            <div class="text-center">
                <p class="font-medium">Lightspeed Lifestyle Long Sleeve</p>
                <p class="font-light">35€</p>
            </div>
        </NuxtLink>

        <NuxtLink to="" class="shopItem mb-[2em]">
            <div class="thumb"><img src="" alt="" /></div>
            <div class="text-center">
                <p class="font-medium">Lightspeed Lifestyle Long Sleeve</p>
                <p class="font-light">35€</p>
            </div>
        </NuxtLink>
    </section>

    <section class="divider-t">
        <video
            ref="video"
            class="object-cover object-center w-[100%] h-[12em]"
            autoplay
            playsinline
            loop
            muted>
            <source src="/juoksut.mp4" type="video/mp4" />
        </video>
    </section>
</template>

<script setup></script>

<style scoped>
    .itemsContainer {
        width: clamp(65%, 500px, 100%);
    }

    .shopItem:hover {
        transform: none;
        opacity: 100%;
    }

    .shopItem:hover p {
        opacity: 70%;
    }

    .shopItem .thumb {
        height: 22em;
        background-color: pink;
    }
</style>
