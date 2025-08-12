<template>
  <ul class="list flex-column">
    <li
      v-for="(item, index) in $tm('home.schedule')"
      :key="index"
      :class="['item', { 'is-active': activeTextIndex === index }]"
    >
      <ul class="schedules-list flex-column">
        <li
          v-for="(schedule, key) in item.list"
          :key="index"
          class="schedule-item flex align-center"
        >
          <div class="time">{{ schedule.time }}</div>
          <div class="type">{{ schedule.title }}</div>
          <div class="sensei">{{ schedule.sensei }}</div>
        </li>
      </ul>
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
</script>

<style lang="scss" scoped>
.list {
  position: relative;
  @include size(100%);
  margin-top: 100px;

  .item {
    position: absolute;
    top: 0;
    left: 0;
    @include size(100%);
    opacity: var(--item-opacity, 0);
    @include default-transitions(opacity);
    font-size: 18px;
    &.is-active {
      --item-opacity: 1;
    }
  }

  .schedule-item {
    padding: 18px 0;
    &:not(:last-child) {
      border-bottom: 1px solid var(--color-souls);
    }
  }

  .time {
    font-family: var(--font-lemonmilk-light);
  }
  .type {
    margin-left: get-vw(160px);
    font-family: var(--font-lemonmilk-medium);
  }

  .sensei {
    margin-left: auto;
    font-family: var(--font-lemonmilk-light);
  }
}
</style>
