<template>
  <ul
    class="days flex justify-between"
    :style="`--active-index: ${activeTextIndex}; --hover-index: ${hoverIndex}`"
  >
    <li
      v-for="(item, index) in $tm('home.schedule')"
      :class="['day flex-center', { 'is-active': activeTextIndex === index }]"
      :key="index"
      @mouseenter="hoverIndex = index"
      @mouseleave="hoverIndex = activeTextIndex"
      @click="onClick(index)"
    >
      {{ item.day }}
    </li>
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

const onClick = (index) => {
  hoverIndex.value = index;
  emit("changeActiveIndex", index);
};
</script>

<style lang="scss" scoped>
.days {
  position: relative;
  z-index: 1;

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
  }

  .day {
    position: relative;
    font-family: var(--font-lemonmilk-light);
    font-size: 18px;
    color: var(--color-souls);
    padding: 7px 0;
    width: calc(100% / 8);
    z-index: 1;
    cursor: pointer;
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
    }

    &:hover {
      --before-transform: var(--day-index);
      --before-opacity: 1;
    }
  }
}
</style>
