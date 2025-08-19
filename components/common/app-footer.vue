<template>
  <div class="app-footer flex-center justify-between">
    <div class="left-wrapper flex-center">
      <div class="label uppercase">contact us</div>
      <a :href="`tel:+995${infoStore.data.phone}`" class="link phone"
        >+995{{ infoStore.data.phone }}</a
      >
    </div>
    <div class="center uppercase">home</div>
    <div class="right-wrapper flex-center">
      <div class="label uppercase">follow us</div>
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

  .label {
    font-size: 14px;
    font-family: var(--font-lemonmilk-regular);
    color: var(--color-hazy);
    opacity: 0.5;

    @include mq(max-width 768px) {
      font-size: css-clamp-vw(12px, 14px, 768);
    }
  }

  .center {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate3d(-50%, -50%, 0);
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
