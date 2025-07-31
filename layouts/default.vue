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
      </div>
    </Body>
  </Html>
</template>

<script setup>
import { useHomeStore } from "@/store/home";
const homeStore = useHomeStore();

useSeoMeta({
  title: "Obsidia - Fitness Club",
  ogTitle: "Obsidia",
  description: "Not a gym a journey",
  ogDescription: "Not a gym a journey",
  ogImage: "/images/share.png",
  twitterCard: "summary_large_image",
});

onBeforeMount(() => {
  useLenisScroll();
  homeStore.changeWebsiteLoaded(true);
});
</script>

<style lang="scss" scoped>
.default-layout {
  width: 100%;
  height: 100%;
}
</style>
