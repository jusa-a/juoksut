<template>
  <div>
    <section class="flex flex-wrap">
      <div class="prodImg">
        <NuxtImg
          src="/img/longsleeve.jpeg"
          alt=""
          class="object-cover w-[100%] h-[100%]" />
      </div>

      <div class="prodInfo flex flex-wrap">
        <div class="sticky top-[var(--nav-height)] p-[0.8em]">
          <p class="font-medium">
            Lightspeed Lifestyle {{ $route.params.slug }}
          </p>
          <p class="font-light">35€</p>
          <p class="mt-[2em]">Hand dyed. Hand printed.</p>
          <p>
            The Lightspeed Lifestyle Long Sleeve is a unique piece of
            clothing that is made with love and care. Made from organic
            cotton printed locally in Helsinki and tie dyed by our
            runners.
          </p>
          <p>
            Fits small, so we recommend to size up from your usual size.
          </p>
          <p>
            Fits small, so we recommend to size up from your usual size.
          </p>
        </div>

        <div class="buy self-end m-[0.8em]">
          <button
            type="submit"
            class="w-[100%] text-pink uppercase bg-white text-center border-[1px] border-pink px-[2em] py-[0.3em] hover:bg-pink hover:text-white active:opacity-50">
            Buy
          </button>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup></script>

<style>
.prodImg {
  background-color: pink;
  width: clamp(50vw, 300px, 100vw);
}

.prodInfo {
  width: clamp(15em, 47vw, 100%);
  flex-shrink: 1;
}

.buy {
  width: 100%;
  position: sticky;
  bottom: 0.8em;
}
</style>
