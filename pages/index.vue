<template>
  <div class="home-page">
    <canvas id="canvas"></canvas>
    <div
      v-for="(item, index) in 6"
      :key="index"
      :class="`stop-${index} stop flex-center couple`"
    ></div>
    <ul class="content-list">
      <!-- <div class="header flex-center">
        <home-content :item="$tm('home.welcome')" :index="0" relative />
      </div> -->
      <li
        v-for="(couple, index) in $tm('home.content')"
        ref="content"
        :key="index"
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
const stops = ref(null);

onMounted(() => {
  setTimeout(() => {
    stops.value = document.querySelectorAll(".home-page .stop");
    setupSequentialLoading();
    gsap.registerPlugin(SplitText);
    const timelines = [];

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

      if (index !== 0) {
        gsap.set(title, {
          x: 1.467,
          y: 10,
          z: -9.8894,
          rotate: 8.5307,
          rotateY: 8.5307,
          rotateX: -90,
          opacity: 0,
        });
      }
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
          yPercent: -20,
          opacity: 0,
          duration: 0.5,
          stagger: 0.1,
        });

      timelines.push(tl);
    });

    stops.value.forEach((element, index) => {
      ScrollTrigger.create({
        trigger: element,
        start: `top-=50% top`,
        end: `bottom-=50% top`,
        scrub: true,
        markers: true,
        animation: timelines[index],
        markers: true,
      });
    });
  }, 500);
});
</script>

<style lang="scss" scoped>
.home-page {
  position: relative;
  width: 100vw;
  min-height: 100vh;
  padding: 40px var(--page-offset-padding);

  .stop {
    width: 100%;
    height: 200vh;
  }

  .separator {
    width: 100%;
    height: 100vh;
  }

  .content-list {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;

    .header {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
    }

    :deep(.content-frame) {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      padding: 40px var(--page-offset-padding);
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
