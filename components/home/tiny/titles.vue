<template>
  <ul class="titles-list flex-column">
    <li
      v-for="(title, titleKey) in titles"
      :key="titleKey"
      :class="`title-item flex align-center is-${size}`"
    >
      <div
        v-if="title.hasArrow"
        :class="`arrow flex-center arrow-${title.arrowDirection}`"
      >
        <nuxt-icon name="arrow-down" filled />
      </div>
      <h2 class="title flex-column uppercase">
        {{ title.value }}
      </h2>
    </li>
  </ul>
</template>

<script setup>
const props = defineProps({
  titles: {
    type: Array,
    required: true,
  },
  size: {
    type: String,
    required: true,
  },
});
</script>

<style lang="scss" scoped>
.titles-list {
  width: max-content;

  .title-item {
    &.is-large {
      &:nth-child(2n -1) {
        .title {
          font-size: 172px;
          font-family: var(--font-pingl-bold);
        }
      }
      &:nth-child(2n) {
        .title {
          font-size: 159px;
          font-family: var(--font-parmigiano-light);
        }
      }
    }
    &.is-medium {
      &:nth-child(2n -1) {
        .title {
          font-size: 108px;
          font-family: var(--font-pingl-bold);
        }
      }
      &:nth-child(2n) {
        .title {
          font-size: 102px;
          font-family: var(--font-parmigiano-light);
        }
      }
    }
    &.is-small {
      &:nth-child(2n -1) {
        .title {
          font-size: 68px;
          font-family: var(--font-pingl-bold);
        }
      }
      &:nth-child(2n) {
        .title {
          font-size: 66px;
          font-family: var(--font-parmigiano-light);
        }
      }
    }
  }

  .title {
    margin-top: 10px;
    color: var(--color-white);
    line-height: 1;
    width: max-content;
  }

  :deep(.arrow) {
    margin-right: 80px;
    border-radius: 50%;
    border: 1px solid var(--color-dark-gray);
    @include size(120px);

    &.arrow-up {
      transform: rotate(180deg);
    }

    svg {
      height: 80%;
      width: auto;
      path {
        fill: var(--color-white) !important;
      }
    }
  }
}
</style>
