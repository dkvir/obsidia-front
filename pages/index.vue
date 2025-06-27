<template>
  <div class="home-page">
    <canvas id="canvas"></canvas>
    <div class="header stop">
      <div class="marker"></div>
    </div>
    <div class="separator"></div>
    <div class="stop-1 stop">
      <div class="marker"></div>
    </div>
    <div class="separator"></div>
    <div class="stop-2 stop">
      <div class="marker"></div>
    </div>
    <div class="separator"></div>
    <div class="footer stop">
      <div class="marker"></div>
    </div>
    <div class="separator"></div>
    <div class="separator"></div>
    <home-content :activeTextIndex="activeTextIndex" />
  </div>
</template>

<script setup>
const { setupSequentialLoading, triggerProgress } = useThreeScene("#canvas");

onMounted(() => {
  setupSequentialLoading();
});
</script>

<style lang="scss" scoped>
.home-page {
  position: relative;
  width: 100vw;
  min-height: 100vh;
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
