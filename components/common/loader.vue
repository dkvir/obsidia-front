<template>
  <div
    :class="[
      'loader',
      {
        'is-finished': isFinished,
      },
    ]"
  >
    <div class="loader-logo flex-center">
      <nuxt-icon name="logo-o" class="logo-o-icon" filled />
    </div>
  </div>
</template>

<script setup>
import { useHomeStore } from "~/store/home";
import gsap from "gsap";

const homeStore = useHomeStore();

let isFinished = ref(false);
let stopAt = ref(0);
let normalVelocity = ref(1200);
let rotateCD = ref(null);

watch(
  () => homeStore.loaderFinished,
  (curr, old) => {
    if (curr) {
      rotateCD.value.kill();

      let currentRotation = gsap.getProperty(".logo-o-icon", "rotation");

      let naturalEndTween = gsap.to(".logo-o-icon", {
        rotation: currentRotation,
        duration: 0,
        onComplete: function () {
          let currentVelocity =
            normalVelocity.value *
            (rotateCD.value ? rotateCD.value.timeScale() : 1);
          let decelerationDistance =
            (currentVelocity * currentVelocity) / (2 * 400);
          let naturalEnd = currentRotation + decelerationDistance;

          let targetRotation =
            Math.floor(naturalEnd / 360) * 360 + stopAt.value;
          if (targetRotation <= naturalEnd) {
            targetRotation += 360;
          }

          rotateCD.value = gsap.to(".logo-o-icon", {
            rotation: targetRotation,
            duration: Math.sqrt((2 * (targetRotation - currentRotation)) / 400),
            ease: "power2.out",
            onComplete: () => {
              gsap.to(".logo-o-icon", {
                xPercent: -319,
                duration: 1.5,
                rotate: targetRotation - 360,
                ease: "power2.inOut",
                onComplete: () => {
                  isFinished.value = true;
                  gsap.to(".logo-icon .logo-group", {
                    opacity: 1,
                    stagger: 0.13,
                    duration: 1,
                    ease: "power2.in",
                    onStart: () => {
                      window.lenis.start();
                    },
                  });
                },
              });
            },
          });
        },
      });

      naturalEndTween.progress(1);
    }
  }
);

onMounted(() => {
  rotateCD.value = gsap.to(".logo-o-icon", {
    rotation: "+=" + normalVelocity.value * 1000,
    duration: 1000,
    repeat: -1,
    ease: "none",
    paused: true,
    force3D: false,
  });

  rotateCD.value.play();
  gsap.fromTo(
    rotateCD.value,
    { timeScale: 0 },
    { timeScale: 1, ease: "power1.in", duration: 3 }
  );

  gsap.set(".logo-icon .logo-group", {
    opacity: 0,
  });
});
</script>

<style lang="scss" scoped>
.loader {
  position: fixed;
  inset: 0;
  width: 100vw;
  height: 100vh;
  background-color: var(--color-black);
  z-index: 3;
  padding: 40px var(--page-offset-padding);
  opacity: var(--loader-opacity, 1);
  transition: opacity 0.6s ease-in;
  &.is-finished {
    --loader-opacity: 0;

    pointer-events: none;
  }
  .loader-logo {
    --logo-container-scale: 6.5;

    width: auto;
    height: var(--app-header-height);
    transform: translate(
        0,
        calc(
          50svh - var(--page-offset-padding) * 3 - var(--app-header-height) / 2
        )
      )
      scale(var(--logo-container-scale));
    @include mq(max-width 1440px) {
      --logo-container-scale: 5.5;
    }

    @include mq(max-width 1366px) {
      --logo-container-scale: 4.5;
    }

    @include mq(max-width 768px) {
      --logo-container-scale: 3.5;
    }

    @include mq(max-width 600px) {
      --logo-container-scale: 2.5;
    }
  }

  :deep(.logo-o-icon) {
    display: block;
    height: 100%;
    width: auto;
    // 319%

    svg {
      height: 100%;
      width: auto;
    }
  }
}
</style>
