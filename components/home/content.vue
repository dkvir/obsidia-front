<template>
  <div class="content">
    <div class="content-frame">
      <ul class="content-list flex-column">
        <li
          v-for="(item, index) in $tm('home.content')"
          :class="[
            'item  flex align-center',
            { 'is-large': item.title.size == 'large' },
          ]"
        >
          <h2 class="title flex-column">
            <span class="span top">{{ item.title.top }}</span>
            <span class="span bottom">{{ item.title.bottom }}</span>
          </h2>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup>
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

onMounted(() => {
  gsap.registerPlugin(ScrollTrigger, SplitText);
  const titles = document.querySelectorAll(".content .title");
  const mainTl = gsap.timeline();

  titles.forEach((title, index) => {
    const titleTop = new SplitText(title.querySelector(".top"), {
      type: "lines, chars",
    });
    const titleBottom = new SplitText(title.querySelector(".bottom"), {
      type: "lines, chars",
    });

    gsap.set(titleTop.chars, {
      yPercent: 100,
    });
    gsap.set(titleBottom.chars, {
      yPercent: 100,
    });
    const tl = gsap.timeline();

    tl.addLabel("enterTop")
      .to(titleTop.chars, {
        yPercent: 0,
        opacity: 1,
        duration: 0.3,
        ease: "power1.inOut",
        stagger: {
          from: "start",
          ease: "power1.inOut",
          each: 0.009,
        },
      })
      .addLabel("enterBottom")
      .to(
        titleBottom.chars,
        {
          yPercent: 0,
          opacity: 1,
          duration: 0.3,
          ease: "power1.inOut",
          stagger: {
            from: "start",
            ease: "power1.inOut",
            each: 0.009,
          },
        },
        "<+0.1"
      )
      .addLabel("holdTop")
      .to(titleTop.chars, {
        duration: 0.1,
        ease: "none",
      })
      .addLabel("holdBottom")
      .to(
        titleBottom.chars,
        {
          duration: 0.1,
          ease: "none",
        },
        "<"
      )
      .addLabel("exitTop")
      .to(titleTop.chars, {
        yPercent: 100,
        opacity: 0,
        duration: 0.3,
        ease: "power1.inOut",
        stagger: {
          from: "start",
          ease: "power1.inOut",
          each: 0.003,
        },
      })
      .addLabel("exitBottom")
      .to(
        titleBottom.chars,
        {
          yPercent: 100,
          opacity: 0,
          duration: 0.3,
          ease: "power1.inOut",
          stagger: {
            from: "start",
            ease: "power1.inOut",
            each: 0.003,
          },
        },
        "<+0.1"
      );

    mainTl.add(tl);
  });

  setTimeout(() => {
    ScrollTrigger.create({
      trigger: ".sticky-content ",
      start: `top top`,
      end: `bottom top`,
      scrub: true,
      markers: true,
      animation: mainTl,
    });
  }, 500);
});
</script>

<style lang="scss" scoped>
.content {
  position: absolute;
  width: 100%;
  height: calc(100% + 100vh);
  padding: 0 calc(var(--page-offset-padding) + 160px);
  .content-frame {
    position: sticky;
    top: var(--page-offset-padding);
    left: 0;
    height: calc(100vh - var(--page-offset-padding) * 2);
  }
  .content-list {
    position: relative;
    width: 100%;
    height: 100%;
  }

  .item {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    font-size: 94px;
    font-family: var(--font-lemonmilk-light);
    line-height: 1;
    &.is-large {
      justify-content: center;
      font-size: 150px;
    }
  }

  .title {
    .span {
      overflow: hidden;
    }
    .top {
      color: var(--color-white);
    }
    .bottom {
      color: var(--color-ice);
    }
  }
}
</style>
