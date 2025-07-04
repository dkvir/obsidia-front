<template>
  <ul class="socials flex-center">
    <li v-for="(social, index) in $tm('global.socials')" class="social">
      <a :href="social.url" target="_blank" class="social-link">
        <nuxt-icon :name="`${social.name}-icon`" class="social-icon" filled />
      </a>
    </li>
  </ul>
</template>

<script setup></script>

<style lang="scss" scoped>
.socials {
  height: 100%;
  pointer-events: all;
  .social {
    opacity: var(--social-opacity, 1);
    @include list-distance("left", 15px);
    @include default-transitions(opacity);
    &:hover {
      --social-opacity: 0.7;
    }
  }
  :deep(.social-icon) {
    display: block;
    width: auto;
    height: 20px;
    svg {
      height: 100%;
      width: auto;
    }
  }
}
</style>
