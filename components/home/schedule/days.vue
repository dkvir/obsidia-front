<template>
  <ul
    class="days flex justify-between"
    :style="`--active-index: ${activeTextIndex}; --hover-index: ${hoverIndex}`"
    @mousedown.left="onMouseDown"
  >
    <client-only>
      <vue-horizontal
        responsive
        class="horizontal"
        ref="horizontal"
        snap="none"
        :button="false"
        @scroll="onScroll"
      >
        <li
          v-for="(item, index) in $tm('home.schedule')"
          :class="[
            'day flex-center uppercase',
            { 'is-active': activeTextIndex === index },
          ]"
          :key="index"
          @mouseenter="hoverIndex = index"
          @mouseleave="hoverIndex = activeTextIndex"
          @click="onClick(index)"
        >
          {{ item.day }}
        </li>
      </vue-horizontal>
    </client-only>
  </ul>
</template>

<script setup>
const props = defineProps({
  activeTextIndex: {
    type: Number,
    default: 0,
  },
});

const emit = defineEmits(["changeActiveIndex"]);
const hoverIndex = ref(props.activeTextIndex);

const left = ref(0);
const originX = ref(0);
const originLeft = ref(0);
const horizontal = ref(null);

const onClick = (index) => {
  hoverIndex.value = index;
  emit("changeActiveIndex", index);
};

const onScroll = ({ left: scrollLeft }) => {
  left.value = scrollLeft;
};
const onMouseDown = (e) => {
  originX.value = e.pageX;
  originLeft.value = left.value;

  window.addEventListener("mouseup", onMouseUp);
  window.addEventListener("mousemove", onMouseMove);
};
const onMouseUp = () => {
  window.removeEventListener("mouseup", onMouseUp);
  window.removeEventListener("mousemove", onMouseMove);
};
const onMouseMove = (e) => {
  const offset = e.pageX - originX.value;
  const left = originLeft.value - offset;
  horizontal.value.scrollToLeft(left, "auto");
};
</script>

<style lang="scss" scoped>
.days {
  position: relative;
  z-index: 1;
  user-select: none;

  @include mq(max-width 1024px) {
    top: 0;
    left: 50%;
    width: calc(100% + 2 * var(--page-offset-padding));
    transform: translate3d(-50%, 0, 0);
  }

  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    width: calc(100% / 8);
    height: 100%;
    z-index: -1;
    background-color: var(--color-hazy);
    transform: translate3d(calc(var(--active-index) * 100%), 0, 0);
    @include default-transitions(transform);
    @include mq(max-width 1024px) {
      display: none;
    }
  }

  .horizontal {
    width: 100%;
  }

  .day {
    position: relative;
    font-family: var(--font-lemonmilk-light);
    font-size: css-clamp(16px, 18px);
    color: var(--color-souls);
    padding: 7px 0;
    width: calc(100% / 8);
    z-index: 1;
    cursor: pointer;
    @include mq(max-width 1024px) {
      background-color: var(--day-bg, transparent);
      padding: 7px var(--page-offset-padding);
      width: max-content;
      min-width: calc(100% / 8);
      @include default-transitions(background-color);

      &:first-child {
        margin-left: var(--page-offset-padding);
      }
    }
    @include mq(max-width 768px) {
      font-size: css-clamp-vw(11px, 16px, 768);
    }
    &::before {
      content: "";
      position: absolute;
      bottom: 0;
      left: 50%;
      width: 70%;
      height: 1px;
      z-index: -1;
      background-color: var(--color-hazy);
      opacity: var(--before-opacity, 0);
      transform: translate3d(-50%, 0, 0);
      @include default-transitions(opacity);
      @include mq(max-width 1024px) {
        display: none;
      }
    }

    &.is-active {
      @include mq(max-width 1024px) {
        --day-bg: var(--color-hazy);
      }
    }

    &:hover {
      --before-transform: var(--day-index);
      --before-opacity: 1;
    }
  }
}
</style>
