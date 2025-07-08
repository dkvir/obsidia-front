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
      const subtitle = element.querySelector(".subtitle");
      const joinButton = element.querySelector(".join");

      let split = SplitText.create(element.querySelectorAll(".title"), {
        type: "lines,chars",
        mask: "lines",
        lineClass: "line",
      });

      let splitDescriptions = SplitText.create(
        element.querySelectorAll(".description"),
        {
          type: "chars",
        }
      );

      gsap.set(splitDescriptions.chars, {
        opacity: 0,
      });

      gsap.set(split.chars, {
        yPercent: 100,
        opacity: 0,
      });

      const tl = gsap.timeline();

      if (subtitle) {
        tl.addLabel("subtitle").from(subtitle, {
          opacity: 0,
          ease: "power4.inOut",
          duration: 0.1,
        });
      }

      tl.addLabel("enter")
        .to(
          split.chars,
          {
            yPercent: 0,
            opacity: 1,
            duration: 0.13,
            ease: "power1.inOut",
            stagger: {
              from: "start",
              ease: "power1.inOut",
              each: 0.003,
            },
          },
          "<"
        )
        .addLabel("enterDescriptions")
        .to(
          splitDescriptions.chars,
          {
            opacity: 1,
            ease: "power1.inOut",
            stagger: 0.001,
            duration: 0.1,
          },
          "<+=0.1"
        );

      if (joinButton) {
        tl.addLabel("join").from(
          joinButton,
          {
            opacity: 0,
            ease: "power1.inOut",
            duration: 0.2,
          },
          ">-=0.2"
        );
      }

      tl.addLabel("hold").to(split.chars, {
        duration: 0.1,
        ease: "none",
      });
      if (subtitle) {
        tl.addLabel("subtitleExit").to(subtitle, {
          opacity: 0,
          ease: "power4.inOut",
          duration: 0.1,
        });
      }
      tl.addLabel("exit")
        .to(
          split.chars,
          {
            yPercent: 100,
            opacity: 0,
            duration: 0.1,
            ease: "power1.inOut",
            stagger: {
              from: "start",
              ease: "power1.inOut",
              each: 0.003,
            },
          },
          "<"
        )
        .addLabel("descriptionsExit")
        .to(
          splitDescriptions.chars,
          {
            opacity: 0,
            ease: "power1.inOut",
            stagger: 0.0002,
            duration: 0.1,
          },
          "exit-=0.1"
        );

      if (joinButton) {
        tl.addLabel("joinExit").to(
          joinButton,
          {
            opacity: 0,
            ease: "power1.inOut",
            duration: 0.1,
          },
          "descriptionsExit-=0.3"
        );
      }

      ScrollTrigger.create({
        trigger: element,
        start: `top-=50% top`,
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
