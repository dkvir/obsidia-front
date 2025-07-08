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
        <div ref="arrowElement" class="arrow-element flex-center">
          <nuxt-icon name="arrow-down" filled />
        </div>
      </div>
      <h2 class="title uppercase">
        {{ title.value }}
      </h2>
    </li>
  </ul>
</template>

<script setup>
import gsap from "gsap";

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

const arrowElement = ref(null);

onMounted(() => {
  setTimeout(() => {
    createArrowAnimation();
  }, 500);
});

function createArrowAnimation() {
  if (!arrowElement.value) return;

  const arrowClone = arrowElement.value[0].cloneNode(true);
  arrowElement.value[0].parentNode.appendChild(arrowClone);

  gsap.set(arrowClone, {
    yPercent: -100,
  });

  const arrowTimeline = gsap.timeline({
    repeat: -1,
    repeatDelay: 2,
    delay: 1,
  });

  arrowTimeline
    .to(arrowElement.value, {
      yPercent: 100,
      duration: 1.5,
      ease: "power2.inOut",
    })
    .to(
      arrowClone,
      {
        yPercent: 0,
        duration: 1.5,
        ease: "power2.inOut",
      },
      "<"
    );
}
</script>

<style lang="scss" scoped>
.titles-list {
  width: 100%;
  perspective: 1500;
  -webkit-perspective: 1500;

  .title-item {
    transform-style: preserve-3d;
    transform-origin: 0 100%;
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
    position: relative;
    margin-right: 80px;
    border-radius: 50%;
    border: 1px solid var(--color-dark-gray);
    overflow: hidden;
    @include size(120px);

    .arrow-element {
      position: absolute;
      inset: 0;
      @include size(100%);
    }

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
