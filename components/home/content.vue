<template>
  <div
    :class="[
      `content flex-column`,
      {
        'is-relative': relative,
        'is-center': item.position === 'center',
      },
    ]"
  >
    <h3 v-if="item.position !== 'center'" class="subtitle uppercase">
      0{{ index }} /
    </h3>
    <home-tiny-titles :titles="item.title.list" :size="item.title.size" />
    <div class="descriptions flex-center justify-end">
      <ul v-if="item.descriptions.length" class="list flex-column">
        <li v-for="(description, key) in item.descriptions" class="description">
          {{ description }}
        </li>
        <nuxt-icon v-if="relative" name="fitness-club" filled />
      </ul>
    </div>
    <common-tiny-buttons-join v-if="index == 1" />
  </div>
</template>

<script setup>
const props = defineProps({
  item: {
    type: Object,
    required: true,
  },
  index: {
    type: Number,
    required: true,
  },
  relative: {
    type: Boolean,
    default: false,
  },
});
</script>

<style lang="scss" scoped>
.content {
  position: sticky;
  top: 30%;
  height: min-content;
  &.is-relative {
    position: relative;
    top: 0;
  }
  &.is-center {
    align-items: center;
  }

  .subtitle {
    font-size: 14px;
    font-family: var(--font-pingl-bold);
    color: var(--color-gray);
  }

  .descriptions {
    width: 100%;
    @include parent-state(".is-center") {
      .list {
        width: 30%;
      }
    }
    @include parent-state(":not(.is-center)") {
      .list {
        width: 100%;
        padding-left: var(--page-offset-padding);
      }
    }
  }
  .list {
    margin-top: 30px;
    font-size: 21px;
    font-family: var(--font-pingl-light);

    .description {
      @include list-distance(top, 20px);
      color: var(--color-silver);
    }
    :deep(.nuxt-icon) {
      margin-top: 30px;
      svg {
        height: 12px;
        width: auto;
      }
    }
  }
}
</style>
