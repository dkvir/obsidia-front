<template>
  <div class="home-page">
    <canvas id="canvas"></canvas>
    <div class="header stop"></div>
    <div class="separator"></div>
    <div class="stop-1 stop"></div>
    <div class="separator"></div>
    <div class="stop-2 stop"></div>
    <div class="separator"></div>
    <div class="footer stop"></div>
    <div class="separator"></div>
    <home-content :activeTextIndex="activeTextIndex" />
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
  position: relative;
  width: 100vw;
  min-height: 100vh;
  .stop {
    width: 100vw;
    height: 100vh;
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
}
</style>
