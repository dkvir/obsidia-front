<template>
  <div class="video flex-center">
    <video class="video-player" controls>
      <source src="/videos/video.mp4" type="video/mp4" />
    </video>
  </div>
</template>

<script setup></script>

<style lang="scss" scoped>
.video {
  width: 100%;
  height: 100vh;

  .video-player {
    width: 100%;
    height: auto;
  }
}
</style>
