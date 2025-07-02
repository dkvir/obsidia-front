<template>
  <div class="home-page">
    <canvas id="canvas"></canvas>
    <div class="header stop stop-0 flex-center">
      <home-content :item="$tm('home.welcome')" :index="0" relative />
    </div>
    <ul class="couples">
      <li
        v-for="(couple, index) in $tm('home.content')"
        :key="index"
        class="couple"
      >
        <div class="separator">
          <div
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
        </div>
        <div :class="`stop-${index + 1} stop flex-center`"></div>
      </li>
    </ul>
    <div class="separator"></div>
  </div>
</template>

<script setup>
import gsap from "gsap";
const { setupSequentialLoading, activeTextIndex } = useThreeScene("#canvas");

onMounted(() => {
  gsap.registerPlugin(SplitText);

  // let split = SplitText.create(".home-page .texts .text", {
  //   type: "lines",
  //   mask: "line-mask",
  // });

  setupSequentialLoading();
});
</script>

<style lang="scss" scoped>
.home-page {
  width: 100vw;
  min-height: 100vh;
  padding: 40px var(--page-offset-padding);

  .couples {
    width: 100%;
    height: max-content;
  }
  .couple {
    width: 100%;
    height: 200vh;
  }

  .stop {
    width: 100vw;
    height: 100vh;
  }

  .separator {
    position: relative;
    width: 100%;
    height: 100vh;
  }

  :deep(.content-frame) {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 150vh;
    background-color: antiquewhite;
    opacity: 0.3;

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
