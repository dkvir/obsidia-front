<template>
  <div class="app-footer flex-center justify-between">
    <div class="left-wrapper flex-center">
      <div class="label uppercase">Call us</div>
      <a :href="`tel:+995${infoStore.data.phone}`" class="link phone">{{
        giveNumberSpaces(infoStore.data.phone)
      }}</a>
    </div>
    <div @click="scrollToTop" class="center uppercase">
      <nuxt-icon name="logo-o" class="footer-logo" />
    </div>
    <div class="right-wrapper flex-center">
      <ul class="list flex-center">
        <li class="item">
          <a
            :href="infoStore.data.instagram"
            target="_blank"
            class="link instagram uppercase"
          >
            instagram
          </a>
        </li>
        <li class="item">
          <a
            :href="infoStore.data.facebook"
            class="link instagfacebookram uppercase"
            target="_blank"
          >
            facebook
          </a>
        </li>
        <li class="item">
          <a
            :href="infoStore.data.youtube"
            target="_blank"
            class="link youtube uppercase"
          >
            youtube
          </a>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup>
import { useInfoStore } from "~/store/info";

const infoStore = useInfoStore();
infoStore.fetchInfo();

const giveNumberSpaces = (num) => {
  const str = num.toString();

  return str.replace(/^(\d{3})(\d{2})(\d{2})(\d{2})$/, "$1 $2 $3 $4");
};

const scrollToTop = () => {
  window.lenis.scrollTo(".welcome", {
    duration: 1.5,
  });
};
</script>

<style lang="scss" scoped>
.app-footer {
  position: relative;
  width: 100%;
  border-top: 1px solid var(--color-blackjack);
  padding: var(--page-offset-padding)
    calc(var(--page-offset-padding) + css-clamp(40px, 160px));
  @include mq(max-width 1366px) {
    padding: var(--page-offset-padding);
  }
  @include mq(max-width 1024px) {
    flex-direction: column;
    align-items: flex-start;
  }

  .left-wrapper,
  .right-wrapper,
  .list {
    @include mq(max-width 1024px) {
      flex-direction: column;
      align-items: flex-start;
    }
  }
  .right-wrapper {
    @include mq(max-width 1024px) {
      margin-top: calc(var(--page-offset-padding) * 2);
    }
  }

  .center {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate3d(-50%, -50%, 0);
    height: var(--app-header-height);
    cursor: pointer;
    :deep(.footer-logo) {
      @include size(100%);
      display: block;
      svg {
        height: 100%;
        width: auto;
      }
    }
    @include mq(max-width 1024px) {
      top: initial;
      left: initial;
      right: var(--page-offset-padding);
      bottom: var(--page-offset-padding);
      transform: none;
    }
  }

  .list {
    @include mq(min-width 1025px) {
      margin-left: var(--page-offset-padding);
    }
    .item {
      position: relative;
      cursor: pointer;
      margin-left: var(--page-offset-padding);
      @include mq(min-width 1025px) {
        padding: 5px 0;
        &:hover {
          --line-width: 100%;
        }

        &:before {
          position: absolute;
          content: "";
          left: 0;
          bottom: 0;
          right: 0;
          margin: 0 auto;
          width: var(--line-width, 0);
          height: 1.5px;
          background-color: var(--color-hazy);
          transition: 0.3s ease;
        }
      }
      @include mq(max-width 1024px) {
        margin-left: 0;
        margin-top: calc(var(--page-offset-padding) / 2);
      }
    }
  }

  .link {
    font-size: 16px;
    font-family: var(--font-lemonmilk-light);
    color: var(--color-hazy);
    &.phone {
      position: relative;

      @include mq(max-width 1024px) {
        margin-top: calc(var(--page-offset-padding) / 2);
      }
      @include mq(min-width 1025px) {
        margin-left: var(--page-offset-padding);
        padding: 5px 0;
        &:hover {
          --line-width: 100%;
        }

        &:before {
          position: absolute;
          content: "";
          left: 0;
          bottom: 0;
          right: 0;
          margin: 0 auto;
          width: var(--line-width, 0);
          height: 1.5px;
          background-color: var(--color-hazy);
          transition: 0.3s ease;
        }
      }
    }

    @include mq(max-width 768px) {
      font-size: css-clamp-vw(14px, 16px, 768);
    }
  }
}
</style>
