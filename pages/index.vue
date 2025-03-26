<template>
  <div>
    <img class="fixed selectDisable w-[calc(var(--nav-height)+75vh)] px-[1em] z-50 top-[calc(var(--nav-height)+30vh)] left-1/2 -translate-x-1/2 -translate-y-1/3  mix-blend-plus-lighter blur-[0.5em] opacity-50" src="/logo.svg" alt="transparent blurred logo overlay">

    <div>
      <div class="wrapper selectDisable">
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
        class="sticky selectDisable top-[calc(var(--nav-height)+1px)] -z-10 h-[calc(100vh-var(--nav-height))]">
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
        class="sticky z-[0] top-[calc(var(--nav-height))] bg-white flex flex-col w-full">
        <Divider />
        <section>
          <p class="m-0">
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
        <Divider />
      </div>

      <div class="h-[calc(100vh-var(--nav-height))]"></div>
    </div>
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
  @apply font-serif font-medium text-center whitespace-nowrap uppercase leading-loose tracking-[-0.04em];

  -webkit-text-stroke-width: 0.01em;
  -webkit-text-stroke-color: #ff639a;
}

.values > div {
  font-size: 7.2vw;
}

.values > div > span {
  @apply text-[1.375em];
}

.selectDisable {
  -webkit-user-select: none;
  -khtml-user-select: none;
  -moz-user-select: none;
  -o-user-select: none;
  user-select: none;
}
</style>
