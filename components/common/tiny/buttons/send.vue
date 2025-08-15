<template>
  <button
    :class="[
      'send align-center',
      {
        'is-submited': submitedForm,
      },
    ]"
    type="submit"
  >
    <span v-if="submitedForm" class="span">Submitted!</span>
    <span v-else class="span">{{ $t("global.buttons.send.label") }}</span>
  </button>
</template>

<script setup>
const props = defineProps({
  submitedForm: {
    type: Boolean,
  },
});
</script>

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
    margin-top: calc(var(--page-offset-padding) * 2);
  }

  &:not(.is-submited) {
    &:hover {
      --send-bg: var(--color-souls);
      --send-color: var(--color-white);
    }
  }

  &.is-submited {
    --send-bg: green;
    --send-color: var(--color-white);
  }
}
</style>
