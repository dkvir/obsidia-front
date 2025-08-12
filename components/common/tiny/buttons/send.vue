<template>
  <div class="send align-center">
    {{ $t("global.buttons.send.label") }}
  </div>
</template>

<script setup></script>

<style lang="scss" scoped>
.send {
  margin-top: 35px;
  width: 100%;
  padding: 6px 0 10px 0;
  background-color: var(--send-bg, var(--color-hazy));
  color: var(--send-color, var(--color-tube));
  @include default-transitions(background-color, color);
  text-align: center;
  font-size: 18px;
  font-family: var(--font-lemonmilk-light);
  cursor: pointer;
  &:hover {
    --send-bg: var(--color-tube);
    --send-color: var(--color-hazy);
  }
}
</style>
