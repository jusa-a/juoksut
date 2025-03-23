<template>
  <img class="fixed w-[calc(var(--nav-height)+75vh)] px-[1em] z-50 top-[calc(var(--nav-height)+30vh)] left-1/2 -translate-x-1/2 -translate-y-1/3  mix-blend-plus-lighter blur-[0.5em] opacity-50" src="/logo.svg" alt="transparent blurred logo overlay">

  <div>
    <div class="wrapper tracking-[-0.03em]">
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
        <source
          src="/juoksut.mp4"
          type="video/mp4" />
      </video>
    </div>

    <div
      class="sticky top-[calc(var(--nav-height)-0.08em)] divider-t divider-b bg-white flex px-[0.1em] pb-[0.5em]">
      <section>
        <p>
          JUOKSUT is a running club for everyone chasing the ultimate
          feeling of being invincible.
        </p>
        <p>
          Running every Tuesday and Sunday.
        </p>
        <p>
          Join us by showing up and bring your friends too!
        </p>
      </section>
    </div>

    <div class="h-[calc(100vh-var(--nav-height))]"></div>
  </div>
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
  font-size: 7.2vw;
}

.values > div > span {
  @apply text-[1.375em];
}
</style>
