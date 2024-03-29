<template>
    <section class="itemsContainer flex flex-col m-auto">
        <div class="my-[1em]">
            <h2 class="font-medium uppercase">Shop under construction...</h2>
            <p>
                Meanwhile, we try to have shirts available to try on and
                purchase every Tuesday during our runs!
            </p>
            <p>
                You can also get your shirt by reaching out to us at
                <a href="mailto:crew@juoksut.run">crew@juoksut.run</a> and we
                can bring you a shirt on on our weekly runs or try to arrange
                delivery to you in another way!
            </p>
        </div>

        <NuxtLink to="" class="shopItem mb-[2em]">
            <div class="thumb">
                <NuxtImg
                    src="/img/longsleeve.jpeg"
                    alt=""
                    class="object-cover w-[100%] h-[100%]" />
            </div>
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
