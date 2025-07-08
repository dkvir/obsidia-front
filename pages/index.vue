<template>
  <div class="home-page">
    <canvas id="canvas"></canvas>
    <div class="stop stop-0">
      <div class="header flex-center">
        <home-content :item="$tm('home.welcome')" :index="0" relative />
      </div>
    </div>
    <ul class="stops">
      <li
        v-for="(couple, index) in $tm('home.content')"
        :key="index"
        :class="`stop-${index + 1} stop flex-center couple`"
      >
        <div
          ref="content"
          :class="[
            'content-frame flex justify-start',
            {
              'is-center': couple.position === 'center',
              'is-right': couple.position === 'right',
              'is-left': couple.position === 'left',
            },
          ]"
        >
          <home-content :item="couple" :index="index + 1" />
        </div>
        <div :class="`stop-${index + 1} stop flex-center`"></div>
      </li>
    </ul>
    <div class="separator"></div>
  </div>
</template>

<script setup>
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
const { setupSequentialLoading, activeTextIndex } = useThreeScene("#canvas");

const content = ref(null);

onMounted(() => {
  setTimeout(() => {
    setupSequentialLoading();
    gsap.registerPlugin(SplitText);

    content.value.forEach((element, index) => {
      const title = element.querySelectorAll(".title-item");
      const subtitle = element.querySelector(".subtitle");
      const joinButton = element.querySelector(".join");
      const arrow = element.querySelector(".arrow");

      let splitDescriptions = SplitText.create(
        element.querySelectorAll(".description"),
        {
          type: "lines",
          lineClass: "line",
        }
      );

      gsap.set(splitDescriptions.lines, {
        x: 1.467,
        y: 10,
        z: -9.8894,
        rotate: 8.5307,
        rotateY: 8.5307,
        rotateX: -90,
        opacity: 0,
      });

      gsap.set(title, {
        x: 1.467,
        y: 10,
        z: -9.8894,
        rotate: 8.5307,
        rotateY: 8.5307,
        rotateX: -90,
        opacity: 0,
      });

      if (subtitle) {
        gsap.set(subtitle, {
          opacity: 0,
        });
      }
      if (joinButton) {
        gsap.set(joinButton, {
          opacity: 0,
        });
      }
      if (arrow) {
        gsap.set(arrow, {
          opacity: 0,
        });
      }

      const tl = gsap.timeline();

      tl.to(title, {
        x: 0,
        y: 0,
        z: 0,
        rotate: 0,
        rotateY: 0,
        rotateX: 0,
        opacity: 1,
        duration: 1,
        ease: "power1.out",
      })

        .to(
          title,
          {
            x: 0,
            y: 0,
            z: 0,
            rotate: 0,
            rotateY: 0,
            rotateX: 0,
            opacity: 1,
            duration: 0.5,
          },
          ">"
        )
        .to(title, {
          x: 0,
          y: -20,
          opacity: 0,
          duration: 0.5,
          stagger: 0.1,
        });

      ScrollTrigger.create({
        trigger: element,
        start: `top top`,
        end: `bottom top`,
        scrub: true,
        markers: true,
        animation: tl,
        markers: true,
      });
    });
  }, 500);
});
</script>

<style lang="scss" scoped>
.home-page {
  width: 100vw;
  min-height: 100vh;
  padding: 40px var(--page-offset-padding);

  .stop {
    position: relative;
    width: 100%;
    height: 200vh;
  }

  .separator {
    position: relative;
    width: 100%;
    height: 100vh;
  }
  .header {
    width: 100%;
    height: 100vh;
  }

  :deep(.content-frame) {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    &::before {
      content: "";
      position: absolute;
      inset: 0;
      // background-color: var(--color-white);
      // opacity: 0.1;
      z-index: -1;
    }

    &.is-center {
      justify-content: center;
      .content {
        width: max-content;
      }
    }
    &.is-right {
      justify-content: flex-end;
      .content {
        width: min-content;
      }
    }
    &.is-left {
      justify-content: flex-start;
      .content {
        width: min-content;
      }
    }
  }

  #canvas {
    position: fixed;
    top: 0;
    left: 0;
    z-index: -1;
    width: 100vw;
    height: 100lvh;
  }
}
</style>
