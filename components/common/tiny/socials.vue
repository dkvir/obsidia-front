<template>
  <ul class="socials flex-center">
    <li v-for="(social, index) in socialsStore.data" class="social">
      <a :href="social.link" target="_blank" class="social-link flex-center">
        <img :src="config.public.backUrl + social.icon.url" class="img" />
        <!-- <nuxt-icon :name="`${social.name}-icon`" class="social-icon" filled /> -->
      </a>
    </li>
  </ul>
</template>

<script setup>
import { useSocialsStore } from "~/store/socials";

const config = useRuntimeConfig();
const socialsStore = useSocialsStore();
socialsStore.fetchSocials();
</script>

<style lang="scss" scoped>
.socials {
  height: 100%;
  pointer-events: all;
  .social {
    opacity: var(--social-opacity, 1);
    @include size(30px);
    @include list-distance("left", 15px);
    @include default-transitions(opacity);
    &:hover {
      --social-opacity: 0.7;
    }
  }
  .social-link {
    @include size(100%);
  }
  .img {
    @include size(100%);
    object-fit: contain;
  }
}
</style>
