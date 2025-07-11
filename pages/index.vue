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
      const title = element.querySelectorAll(".title");
      const subtitle = element.querySelector(".subtitle");
      const joinButton = element.querySelector(".join");
      const arrow = element.querySelector(".arrow");

      let splitTitles = SplitText.create(title, {
        type: "lines, chars",
        linesClass: "line",
      });

      const tl = gsap.timeline();

      if (index == 0) {
        tl.to(
          arrow,
          {
            opacity: 0,
            duration: 0.2,
            ease: "power1.inOut",
          },
          "<"
        )
          .addLabel("enter")
          .to(
            splitTitles.chars,
            {
              yPercent: 100,
              opacity: 0,
              duration: 0.13,
              ease: "power1.inOut",
              stagger: {
                from: "start",
                ease: "power1.inOut",
                each: 0.003,
              },
            },
            "<"
          );
      } else {
        gsap.set(splitTitles.chars, {
          yPercent: 100,
          opacity: 0,
        });

        if (arrow) {
          gsap.set(arrow, {
            opacity: 0,
          });
        }
        if (subtitle) {
          gsap.set(subtitle, {
            opacity: 0,
          });
        }

        if (subtitle) {
          tl.addLabel("subtitle").from(subtitle, {
            opacity: 0,
            ease: "power4.inOut",
            duration: 0.1,
          });
        }

        tl.addLabel("enter").to(
          splitTitles.chars,
          {
            yPercent: 0,
            opacity: 1,
            duration: 0.3,
            ease: "power1.inOut",
            stagger: {
              from: "start",
              ease: "power1.inOut",
              each: 0.006,
            },
          },
          "<"
        );

        tl.addLabel("hold").to(splitTitles.chars, {
          duration: 0.1,
          ease: "none",
        });

        if (subtitle) {
          tl.addLabel("subtitleExit").to(subtitle, {
            opacity: 0,
            ease: "power1.inOut",
            duration: 0.1,
          });
        }
        tl.addLabel("exitLanes").to(splitTitles.chars, {
          yPercent: 100,
          opacity: 0,
          duration: 0.3,
          ease: "power1.inOut",
          stagger: {
            from: "start",
            ease: "power1.inOut",
            each: 0.003,
          },
        });
      }

      timelines.push(tl);
    });

    stops.value.forEach((element, index) => {
      ScrollTrigger.create({
        trigger: element,
        start: index == 0 ? `top top` : `top-=50% top`,
        end: `bottom-=50% top`,
        scrub: true,
        animation: timelines[index],
        markers: true,
      });
    });
  }, 500);
});

// onMounted(() => {
//   setTimeout(() => {
//     setupSequentialLoading();
//     gsap.registerPlugin(SplitText);

//     content.value.forEach((element, index) => {
//       const subtitle = element.querySelector(".subtitle");
//       const joinButton = element.querySelector(".join");

//       let split = SplitText.create(element.querySelectorAll(".title"), {
//         type: "lines,chars",
//         mask: "lines",
//         lineClass: "line",
//       });

//       let splitDescriptions = SplitText.create(
//         element.querySelectorAll(".description"),
//         {
//           type: "chars",
//         }
//       );

//       gsap.set(splitDescriptions.chars, {
//         opacity: 0,
//       });

//       gsap.set(split.chars, {
//         yPercent: 100,
//         opacity: 0,
//       });

//       const tl = gsap.timeline();

//       if (subtitle) {
//         tl.addLabel("subtitle").from(subtitle, {
//           opacity: 0,
//           ease: "power4.inOut",
//           duration: 0.1,
//         });
//       }

//       tl.addLabel("enter")
//         .to(
//           split.chars,
//           {
//             yPercent: 0,
//             opacity: 1,
//             duration: 0.13,
//             ease: "power1.inOut",
//             stagger: {
//               from: "start",
//               ease: "power1.inOut",
//               each: 0.003,
//             },
//           },
//           "<"
//         )
//         .addLabel("enterDescriptions")
//         .to(
//           splitDescriptions.chars,
//           {
//             opacity: 1,
//             ease: "power1.inOut",
//             stagger: 0.001,
//             duration: 0.1,
//           },
//           "<+=0.1"
//         );

//       if (joinButton) {
//         tl.addLabel("join").from(
//           joinButton,
//           {
//             opacity: 0,
//             ease: "power1.inOut",
//             duration: 0.2,
//           },
//           ">-=0.2"
//         );
//       }

//       tl.addLabel("hold").to(split.chars, {
//         duration: 0.1,
//         ease: "none",
//       });
//       if (subtitle) {
//         tl.addLabel("subtitleExit").to(subtitle, {
//           opacity: 0,
//           ease: "power4.inOut",
//           duration: 0.1,
//         });
//       }
//       tl.addLabel("exit")
//         .to(
//           split.chars,
//           {
//             yPercent: 100,
//             opacity: 0,
//             duration: 0.1,
//             ease: "power1.inOut",
//             stagger: {
//               from: "start",
//               ease: "power1.inOut",
//               each: 0.003,
//             },
//           },
//           "<"
//         )
//         .addLabel("descriptionsExit")
//         .to(
//           splitDescriptions.chars,
//           {
//             opacity: 0,
//             ease: "power1.inOut",
//             stagger: 0.0002,
//             duration: 0.1,
//           },
//           "exit-=0.1"
//         );

//       if (joinButton) {
//         tl.addLabel("joinExit").to(
//           joinButton,
//           {
//             opacity: 0,
//             ease: "power1.inOut",
//             duration: 0.1,
//           },
//           "descriptionsExit-=0.3"
//         );
//       }
//     });
//   }, 500);
// });
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
