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
  </div>
</template>

<script setup>
onMounted(() => {
  const canvas = document.getElementById("canvas");
  const { setupSequentialLoading } = useThreeScene(canvas);
  setupSequentialLoading();
});
</script>

<style lang="scss" scoped>
.home-page {
  width: 100%;
  min-height: 100vh;
  position: relative;
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
    width: 100%;
    height: 100lvh;
  }
}
</style>
