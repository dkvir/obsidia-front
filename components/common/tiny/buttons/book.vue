<template>
  <button ref="bookButton" class="book flex-center">
    <div class="arrow">
      <div ref="arrowIcon" class="arrow-icon flex-center">
        <nuxt-icon name="book-arrow" class="book-arrow original" filled />
      </div>
    </div>
    <div class="labels">
      <h1 ref="label" class="label uppercase">
        {{ $t("global.buttons.join.label") }}
      </h1>
    </div>
  </button>
</template>

<script setup>
import gsap from "gsap";
const bookButton = ref(null);
const label = ref(null);
const arrowIcon = ref(null);

onMounted(() => {
  setTimeout(() => {
    const magneticButton = new useMagneticButton({
      target: bookButton.value,
      textElement: label.value,
      targetArrow: arrowIcon.value,
    });
  }, 500);
});
</script>

<style lang="scss" scoped>
.book {
  height: max-content;
  pointer-events: all;
  padding: 0 30px 30px 30px;
  cursor: pointer;

  .arrow {
    position: relative;
    @include size(var(--app-header-height));
    border-radius: 50%;
    border: 1px solid var(--color-dark-gray);
    overflow: hidden;

    .arrow-icon {
      position: absolute;
      top: 0;
      left: 0;
      @include size(100%);
    }

    :deep(.book-arrow) {
      svg {
        height: 50%;
        width: auto;
      }
    }
  }

  .labels {
    margin-left: 15px;
    margin-bottom: -10px;
    .label {
      font-family: var(--font-pingl-medium);
      font-size: 17px;
      line-height: 0.5;
      color: var(--color-silver);
      perspective: 600px;
    }
  }
}
</style>
