<template>
  <div class="home-page">
    <canvas id="canvas"></canvas>
  </div>
</template>

<script setup>
const { initializeScene } = useThreeScene("canvas");
onMounted(() => {
  initializeScene();
});
</script>

<style lang="scss" scoped>
.home-page {
  width: 100%;
  min-height: 500vh;
  position: relative;

  #canvas {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100vh;
  }
}
</style>
