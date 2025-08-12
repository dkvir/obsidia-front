<template>
  <div class="window flex-column justify-between">
    <div class="app-header flex-center">
      <div class="logo-container">
        <nuxt-icon name="logo" class="logo-icon" filled />
      </div>
    </div>
    <!-- <div class="center flex-center">
      <nuxt-icon name="logo" class="logo-icon" filled />
    </div> -->
    <div class="app-footer flex-center justify-between">
      <div class="scroll-down uppercase">
        {{ $t("global.footer.discover") }}
      </div>
    </div>
  </div>
</template>

<script setup>
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

onMounted(() => {
  gsap.registerPlugin(ScrollTrigger, SplitText);

  const split = new SplitText(".window .scroll-down", { type: "chars" });
  const tl = gsap.timeline();

  setTimeout(() => {
    split.chars.forEach((char, index) => {
      const yOffset =
        index % 2 === 0 ? -50 * Math.random() : 50 * Math.random();

      const xOffset = (Math.random() * 2 - 1) * 30;
      const rotateOffset = (Math.random() * 2 - 1) * 30;
      tl.to(
        char,
        {
          y: yOffset,
          x: xOffset,
          rotate: rotateOffset,
          opacity: 0,
          duration: 0.5,
        },
        0
      );
    });

    tl.to(
      ".logo-container",
      {
        y: 0,
        scale: 1,
      },
      "="
    );

    ScrollTrigger.create({
      trigger: ".welcome",
      start: "top top",
      end: "bottom top",
      scrub: true,
      animation: tl,
    });
  }, 500);
});
</script>

<style lang="scss" scoped>
.window {
  position: fixed;
  inset: 0;
  z-index: 1;
  width: 100vw;
  height: 100vh;
  padding: 40px var(--page-offset-padding);
  pointer-events: none;

  .app-header {
    width: 100%;
    height: var(--app-header-height);

    .logo-container {
      width: min-content;
      height: 100%;
      transform: translate(
          0,
          calc(50vh - var(--page-offset-padding) - var(--app-header-height) / 2)
        )
        scale(6.5);
    }

    :deep(.logo-icon) {
      display: block;
      height: 100%;
      width: auto;

      svg {
        height: 100%;
        width: auto;
      }
    }
  }

  .center {
    :deep(.logo-icon) {
      display: block;
      height: 160px;
      width: auto;
      svg {
        height: 100%;
        width: auto;
      }
    }
  }

  .app-footer {
    position: relative;
    width: 100%;
    height: var(--app-header-height);

    .copyright {
      font-family: var(--font-pingl-medium);
      font-size: 17px;
      pointer-events: all;
      .span {
        color: var(--color-gray);
      }
      .obsidia {
        color: var(--color-silver);
      }
    }
    .scroll-down {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      font-family: var(--font-pingl-medium);
      color: var(--color-silver);
    }
  }
}
</style>
