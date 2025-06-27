<template>
  <ul class="content">
    <li
      v-for="(item, index) in $tm('home.welcome')"
      :class="[
        `item flex-column justify-center`,
        {
          'is-active': activeTextIndex == index,
          'align-center': item.position == 'center',
          'align-end': item.position == 'right',
        },
      ]"
    >
      <h3 v-if="item.subtitle" class="subtitle uppercase">
        {{ item.subtitle }}
      </h3>
      <h2 :class="`title flex-column uppercase is-${item.title.size}`">
        <span class="top span"> {{ item.title.top }}</span>
        <span class="bottom span">
          {{ item.title.bottom }}
        </span>
      </h2>
      <ul v-if="item.descriptions.length" class="descriptions flex-column">
        <li v-for="(description, key) in item.descriptions" class="description">
          {{ description }}
        </li>
      </ul>
    </li>
  </ul>
</template>

<script setup>
const props = defineProps({
  activeTextIndex: {
    type: Number,
  },
});
</script>

<style lang="scss" scoped>
.content {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;

  .item {
    position: absolute;
    width: 100%;
    height: 100%;
    padding: var(--page-offset-padding);
    font-size: 36px;
    font-family: var(--font-parmigiano-light);
    opacity: var(--item-opacity, 0);
    @include default-transitions(opacity);
    &.is-active {
      --item-opacity: 1;
    }
    &.position-center {
      top: 50%;
      left: 50%;
      transform: translate3d(-50%, -50%, 0);
    }

    &.position-left {
      top: 50%;
      left: 0;
      transform: translate3d(0%, -50%, 0);
    }
    &.position-right {
      top: 50%;
      right: 0;
      transform: translate3d(0%, -50%, 0);
    }
  }

  .subtitle {
    font-size: 14px;
    font-family: var(--font-pingl-bold);
    color: var(--color-gray);
  }

  .title {
    margin-top: 10px;
    color: var(--color-white);
    line-height: 1;

    &.is-large {
      text-align: center;
      .top {
        font-size: 114px;
        font-family: var(--font-pingl-bold);
      }
      .bottom {
        font-size: 108px;
        font-family: var(--font-parmigiano-light);
      }
    }
    &.is-small {
      width: 35%;
      .top {
        font-size: 66px;
        font-family: var(--font-pingl-bold);
      }
      .bottom {
        font-size: 63px;
        font-family: var(--font-parmigiano-light);
      }
    }
  }

  .descriptions {
    margin-top: 30px;
    width: 35%;
    font-size: 21px;
    font-family: var(--font-pingl-light);
    color: var(--color-silver);
    .description {
      @include list-distance(top, 20px);
    }
  }
}
</style>
