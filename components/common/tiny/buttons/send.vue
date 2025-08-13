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
  @include mq(max-width 768px) {
    margin-top: var(--page-offset-padding);
  }
  &:hover {
    --send-bg: var(--color-tube);
    --send-color: var(--color-hazy);
  }
}
</style>
