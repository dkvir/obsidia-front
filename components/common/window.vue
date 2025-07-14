<template>
  <div class="window flex-column justify-between">
    <div class="app-header flex justify-between">
      <div class="logo">
        <nuxt-icon name="logo" class="logo-icon" filled />
      </div>
      <!-- <common-tiny-buttons-book /> -->
    </div>
    <div class="app-footer flex-center justify-between">
      <!-- <div class="copyright uppercase">
        <span class="span">{{ $t("global.footer.copyright") }}</span>
        <span class="amanita" v-html="$t('global.footer.amanita')"></span>
      </div> -->
      <div class="scroll-down uppercase">
        {{ $t("global.footer.discover") }}
      </div>
      <!-- <common-tiny-socials /> -->
    </div>
  </div>
</template>

<script setup></script>

<style lang="scss" scoped>
.window {
  position: fixed;
  inset: 0;
  z-index: 1;
  width: 100vw;
  height: 100vh;
  padding: 40px var(--page-offset-padding);
  pointer-events: none;

  .app-header {
    width: 100%;
    height: var(--app-header-height);

    .logo {
      pointer-events: all;
    }

    :deep(.logo-icon) {
      display: block;
      height: 100%;
      width: auto;
      svg {
        height: 100%;
        width: auto;
      }
    }
  }

  .app-footer {
    position: relative;
    width: 100%;
    height: var(--app-header-height);

    .copyright {
      font-family: var(--font-pingl-medium);
      font-size: 17px;
      pointer-events: all;
      .span {
        color: var(--color-gray);
      }
      .amanita {
        color: var(--color-silver);
      }
    }
    .scroll-down {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      font-family: var(--font-pingl-medium);
      color: var(--color-silver);
    }
  }
}
</style>
