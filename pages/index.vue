<template>
  <div class="home-page">
    <canvas id="canvas"></canvas>
    <div v-for="(item, index) in content" :key="index" class="couple">
      <div :class="`stop stop-${index}`">
        <home-content
          v-if="index == 0"
          :item="{
            title: {
              top: 'every body',
              bottom: 'a masterpiece',
              size: 'large',
            },
            descriptions: [],
            position: 'center',
          }"
        />
      </div>
      <div class="separator flex-center flex-column">
        <home-content :item="item" />
      </div>
    </div>
  </div>
</template>

<script setup>
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
const { tm } = useI18n();
const { setupSequentialLoading, activeTextIndex } = useThreeScene("#canvas");

const content = computed(() => tm("home.welcome"));

onMounted(() => {
  gsap.registerPlugin(ScrollTrigger, SplitText);
  ScrollTrigger.config({
    limitCallbacks: true,
    ignoreMobileResize: true,
  });

  setupSequentialLoading();

  setTimeout(() => {
    const contentItems = document.querySelectorAll(".home-page .content");

    contentItems.forEach((item, index) => {
      const title = item.querySelector(".title");
      const subtitle = item.querySelector(".subtitle");
      const descriptions = item.querySelector(".descriptions");
      let splitDesc = null;

      let splitTitle = SplitText.create(title, {
        type: "lines, words",
        mask: "lines",
        linesClass: "line",
        wordClass: "word",
      });

      gsap.set(splitTitle.words, {
        yPercent: 200,
        opacity: 0,
        rotate: -5,
      });

      if (descriptions) {
        splitDesc = SplitText.create(item.querySelectorAll(".description"), {
          type: "lines, words",
          mask: "lines",
          linesClass: "line",
          wordClass: "word",
        });

        gsap.set(descriptions, {
          opacity: 0,
        });
      }
      if (subtitle) {
        gsap.set(subtitle, {
          opacity: 0,
        });
      }

      if (index == 0) {
        setTimeout(() => {
          gsap.to(splitTitle.words, {
            yPercent: 0,
            rotate: 0,
            opacity: 1,
            duration: 0.9,
            ease: "power3.out",
            stagger: { amount: 0.3, from: "start" },
            onComplete: () => {
              ScrollTrigger.create({
                trigger: item.parentElement,
                start: "top top",
                end: "bottom top",
                scrub: true,
                invalidateOnRefresh: false,
                markers: true,
                toggleActions: "play none none play",
                animation: useTimelines[index](
                  splitTitle,
                  splitDesc?.lines,
                  subtitle,
                  item
                ),
              });
            },
          });
        }, 1000);
      } else {
        ScrollTrigger.create({
          trigger: item.parentElement,
          start: "top top",
          end: "bottom top",
          scrub: true,
          invalidateOnRefresh: false,
          markers: true,
          toggleActions: "play none none play",
          animation: useTimelines[index](
            splitTitle,
            splitDesc?.lines,
            subtitle,
            item
          ),
        });
      }
    });
  }, 500);
});
</script>

<style lang="scss" scoped>
.home-page {
  position: relative;
  width: 100vw;
  min-height: 100vh;
  .couple {
    width: 100vw;
    height: 200vh;
  }
  .stop {
    position: relative;
    width: 100vw;
    height: 100vh;
  }
  .marker {
    position: absolute;
    top: 0;
    left: 0;
    width: 100vw;
    height: 200vh;
  }

  .separator {
    position: relative;
    width: 100vw;
    height: 100vh;
  }

  #canvas {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100lvh;
  }

  .text {
    position: absolute;
    top: 50%;
    right: 0;
    transform: translate3d(0, -50%, 0);
    padding: 0 calc(var(--page-offset-padding) * 2);
    width: 40%;
    font-size: 36px;
    font-family: var(--font-parmigiano-light);
    &.is-even {
      right: initial;
      left: 0;
    }
  }
}
</style>
