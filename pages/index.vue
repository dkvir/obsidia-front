<template>
  <div class="home-page">
    <home-welcome />
    <div class="sticky-content">
      <div class="component">
        <span class="span">1</span>
        <span class="span">2</span>
        <span class="span">3</span>
        <span class="span">4</span>
        <span class="span">5</span>
      </div>
    </div>
    <div class="scrolling-content"></div>
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
  min-height: 100vh;
  padding: 40px var(--page-offset-padding);

  .sticky-content {
    position: relative;
    width: 100%;
    height: 400vh;
    background-color: var(--color-gray);
  }

  .scrolling-content {
    width: 100%;
    height: 400vh;
    background-color: var(--color-white);
  }

  .component {
    position: sticky;
    top: var(--page-offset-padding);
    left: 0;
    width: 100%;
    height: calc(100vh - var(--page-offset-padding) * 2);
    background-color: green;
  }

  .span {
    position: absolute;
    top: 0;
    left: 0;
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
