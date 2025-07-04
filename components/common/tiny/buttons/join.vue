<template>
  <button class="join">
    <span class="span uppercase">
      {{ $t("global.buttons.join.label") }}
    </span>
  </button>
</template>

<script setup></script>

<style lang="scss" scoped>
.join {
  margin-top: 50px;
  padding: 12px 34px;
  background-color: var(--color-neon);
  width: max-content;
  border-radius: 40px;
  color: var(--color-white);
  margin-left: var(--page-offset-padding);
  cursor: pointer;
}
</style>
