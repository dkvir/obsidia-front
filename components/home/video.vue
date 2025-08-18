<template>
  <div class="video flex-center">
    <video
      v-if="videoStore?.data"
      class="video-player"
      preload="metadata"
      :poster="config.public.strapi.url + videoStore.data.poster.url"
      controls
    >
      <source
        :src="config.public.strapi.url + videoStore.data.video.url"
        type="video/mp4"
      />
    </video>
    <video
      v-else
      class="video-player"
      preload="metadata"
      poster="/images/share.png"
      controls
    >
      <source src="/videos/video.mp4" type="video/mp4" />
    </video>
  </div>
</template>

<script setup>
import { useVideoStore } from "~/store/video";
const videoStore = useVideoStore();
const config = useRuntimeConfig();

await videoStore.fetchVideo();
</script>

<style lang="scss" scoped>
.video {
  width: 100%;
  height: 100svh;

  .video-player {
    width: 100%;
    height: auto;
  }
}
</style>
