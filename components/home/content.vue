<template>
  <div
    :class="[
      `content flex align-center`,
      {
        'justify-center': item.position == 'center',
        'justify-end': item.position == 'right',
      },
    ]"
  >
    <div
      :class="[
        `frame flex-column is-${item.title.size}`,
        { 'align-center': item.position == 'center' },
      ]"
    >
      <h3 v-if="item.subtitle" class="subtitle uppercase">
        {{ item.subtitle }}
      </h3>
      <h2 class="title flex-column uppercase">
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
    </div>
  </div>
</template>

<script setup>
import gsap from "gsap";

const props = defineProps({
  item: {
    type: Object,
    required: true,
  },
});

onMounted(() => {});
</script>

<style lang="scss" scoped>
.content {
  width: 100%;
  height: 100%;
  padding: var(--page-offset-padding);
  font-size: 36px;
  font-family: var(--font-parmigiano-light);

  .frame {
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
    &.is-large {
      width: max-content;

      .title {
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
    }
  }

  .subtitle {
    font-size: 14px;
    font-family: var(--font-pingl-bold);
    color: var(--color-gray);
    width: max-content;
  }

  .title {
    margin-top: 10px;
    color: var(--color-white);
    line-height: 1;

    .line-mask {
      overflow: hidden;
    }
  }

  .descriptions {
    margin-top: 30px;
    font-size: 21px;
    font-family: var(--font-pingl-light);
    color: var(--color-silver);
    .line-mask {
      overflow: hidden;
    }
    .description {
      @include list-distance(top, 20px);
    }
  }
}
</style>
