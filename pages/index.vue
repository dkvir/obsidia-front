<template>
  <div class="home-page">
    <canvas id="canvas"></canvas>
    <div v-for="(item, index) in content" :key="index" class="couple">
      <div :class="`stop stop-${index}`"></div>
      <div class="separator"></div>
    </div>
    <home-content />
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

  const contentItems = document.querySelectorAll(".home-page .content .item");
  const couples = document.querySelectorAll(".home-page .couple");

  contentItems.forEach((item, index) => {
    const title = item.querySelector(".title");
    const subtitle = item.querySelector(".subtitle");
    const descriptions = item.querySelector(".descriptions");
    let splitDesc = null;

    let splitTitle = SplitText.create(title, {
      type: "lines, chars",
      mask: "lines",
      linesClass: "line",
      charsClass: "char",
    });

    if (descriptions) {
      splitDesc = SplitText.create(item.querySelectorAll(".description"), {
        type: "lines, words",
        mask: "lines",
        linesClass: "line",
        wordClass: "word",
      });

      gsap.set(splitDesc.lines, {
        yPercent: 200,
        rotate: 5,
      });
    }

    if (subtitle) {
      gsap.set(subtitle, {
        opacity: 0,
      });
    }

    gsap.set(splitTitle.chars, {
      yPercent: 100,
    });

    if (index == 0) {
      setTimeout(() => {
        gsap.to(splitTitle.chars, {
          yPercent: 0,
          duration: 0.9,
          ease: "power3.out",
          stagger: { amount: 0.3, from: "start" },
          onComplete: () => {
            ScrollTrigger.create({
              trigger: couples[index],
              start: "top top",
              end: "bottom top",
              scrub: true,
              invalidateOnRefresh: false,
              markers: true,
              toggleActions: "play none none play",
              animation: useTimelines[index](
                splitTitle.chars,
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
        trigger: couples[index],
        start: "top top",
        end: "bottom top",
        scrub: true,
        invalidateOnRefresh: false,
        markers: true,
        toggleActions: "play none none play",
        animation: useTimelines[index](
          splitTitle.chars,
          splitDesc?.lines,
          subtitle,
          item
        ),
      });
    }
  });
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
