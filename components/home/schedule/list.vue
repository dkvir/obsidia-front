<template>
  <ul class="list flex-column">
    <li
      v-for="(item, index) in scheduleStore.data"
      :key="index"
      :class="['item', { 'is-active': activeTextIndex === index }]"
    >
      <ul class="schedules-list flex-column">
        <li
          v-for="(schedule, key) in item.scheduleList"
          :key="index"
          class="schedule-item flex align-center uppercase"
        >
          <div class="time flex">
            <span class="start span">{{
              formatStrapiTime(schedule.startTime)
            }}</span>
            <span class="divider">-</span>
            <span class="end span">{{
              formatStrapiTime(schedule.endTime)
            }}</span>
          </div>
          <div class="type">{{ schedule.type }}</div>
          <div class="sensei">{{ schedule.costructor }}</div>
        </li>
      </ul>
    </li>
  </ul>
</template>

<script setup>
import { useScheduleStore } from "~/store/schedule";

const props = defineProps({
  activeTextIndex: {
    type: Number,
    default: 0,
  },
});

const scheduleStore = useScheduleStore();

const formatStrapiTime = (timeString) => {
  if (!timeString) return null;
  return timeString.split(".")[0].substring(0, 5);
};
</script>

<style lang="scss" scoped>
.list {
  position: relative;
  @include size(100%);
  margin-top: 100px;

  @include mq(max-width 1024px) {
    margin-top: css-clamp-vw(40px, 100px, 1024);
  }

  .item {
    position: absolute;
    top: 0;
    left: 0;
    @include size(100%);
    opacity: var(--item-opacity, 0);
    @include default-transitions(opacity);
    font-size: css-clamp(16px, 18px);
    @include mq(max-width 768px) {
      font-size: css-clamp-vw(11px, 16px, 768);
    }
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
    width: 150px;
    @include mq(max-width 768px) {
      width: 100px;
    }
    .divider {
      margin: 0 10px;
      @include mq(max-width 768px) {
        margin: 0 5px;
      }
    }
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
