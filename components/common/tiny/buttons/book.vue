<template>
  <button class="book flex-center">
    <div class="arrow flex-center">
      <nuxt-icon name="book-arrow" class="book-arrow" filled />
    </div>
    <div class="label uppercase">{{ $t("global.buttons.book.label") }}</div>
  </button>
</template>

<script setup></script>

<style lang="scss" scoped>
.book {
  height: 100%;
  pointer-events: all;

  .arrow {
    @include size(var(--app-header-height));
    border-radius: 50%;
    border: 1px solid var(--color-dark-gray);

    :deep(.book-arrow) {
      svg {
        height: 50%;
        width: auto;
      }
    }
  }

  .label {
    font-family: var(--font-pingl-medium);
    font-size: 17px;
    color: var(--color-silver);
    margin-left: 15px;
  }
}
</style>
