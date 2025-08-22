<template>
  <Html
    :class="[
      {
        'is-loaded': homeStore.websiteLoaded,
      },
    ]"
  >
    <Body>
      <div class="default-layout">
        <slot />
        <common-window />
        <common-loader />
      </div>
    </Body>
  </Html>
</template>

<script setup>
import { useHomeStore } from "@/store/home";
const homeStore = useHomeStore();

const config = useRuntimeConfig();

useSeoMeta({
  title: "Obsidia - Fitness Club",
  ogTitle: "Obsidia",
  description: "Not a gym a journey",
  ogDescription: "Not a gym a journey",
  ogImage: config.public.siteUrl + "/images/share.png",
  twitterCard: "summary_large_image",
});

onBeforeMount(() => {
  useLenisScroll();
  homeStore.changeWebsiteLoaded(true);
  window.lenis.stop();
});
</script>

<style lang="scss" scoped>
.default-layout {
  width: 100%;
  height: 100%;
}
</style>
