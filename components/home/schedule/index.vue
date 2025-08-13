<template>
  <div class="schedule">
    <home-schedule-days
      :activeTextIndex="activeTextIndex"
      @changeActiveIndex="changeActiveIndex"
    />
    <home-schedule-list :activeTextIndex="activeTextIndex" />
  </div>
</template>

<script setup>
const activeTextIndex = ref(0);

const changeActiveIndex = (index) => {
  activeTextIndex.value = index;
};
</script>

<style lang="scss" scoped>
.schedule {
  width: 100%;
  height: 100vh;
  padding: calc(var(--page-offset-padding) + css-clamp(40px, 240px));
  padding-bottom: 0;
  @include mq(max-width 1366px) {
    padding: calc(var(--page-offset-padding) + css-clamp(40px, 240px)) 0 0;
  }
  @include mq(max-width 768px) {
    padding: 0;
  }
}
</style>
