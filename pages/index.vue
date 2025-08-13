<template>
  <div class="home-page">
    <home-welcome />
    <div class="sticky-content">
      <home-content />
    </div>
    <div class="scrolling-content">
      <home-video />
      <home-schedule />
      <home-contact />
    </div>
    <canvas id="canvas"></canvas>
  </div>
</template>

<script setup>
const { setupSequentialLoading, activeTextIndex } = useThreeScene("#canvas");

onMounted(() => {
  setupSequentialLoading();
});
</script>

<style lang="scss" scoped>
.home-page {
  width: 100vw;
  min-height: 100svh;
  padding: 40px var(--page-offset-padding);
  padding-bottom: 0;

  .sticky-content {
    position: relative;
    width: 100%;
    height: 800svh;
    margin-bottom: 100svh;
  }

  .scrolling-content {
    width: 100%;
    height: 300svh;
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
