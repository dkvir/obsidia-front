<template>
  <div class="contact flex-center">
    <div class="contact-frame flex">
      <h2 class="title flex-column">
        <span class="span top">{{ $t("home.contact.title.top") }}</span>
        <span class="span bottom">{{ $t("home.contact.title.bottom") }}</span>
      </h2>
      <form class="form">
        <ul class="form-list flex-column">
          <li
            v-for="(item, index) in $tm('home.contact.form')"
            :key="index"
            class="item flex-column"
          >
            <div class="label">{{ item.label }}</div>

            <input
              v-if="item.label == 'mobile'"
              type="tel"
              maxlength="9"
              pattern="[0-9]{3}-[0-9]{3}"
              :name="item.label"
              :id="item.label"
              :placeholder="item.placeholder"
              class="input"
              required
            />
            <input
              v-else
              type="text"
              :name="item.label"
              :id="item.label"
              :placeholder="item.placeholder"
              class="input"
              required
            />
          </li>
        </ul>
        <common-tiny-buttons-send />
      </form>
    </div>
  </div>
</template>

<script setup></script>

<style lang="scss" scoped>
.contact {
  width: 100%;
  height: 100vh;
  padding: 0 calc(var(--page-offset-padding) + 160px);

  .contact-frame {
    width: 100%;
  }

  .title {
    font-size: 120px;
    font-family: var(--font-lemonmilk-light);
    line-height: 1;
    white-space: nowrap;
    .span {
      overflow: hidden;
    }
    .top {
      color: var(--color-white);
    }
    .bottom {
      color: var(--color-ice);
    }
  }

  .form {
    margin-left: 160px;
    width: 100%;
    .form-list {
      display: grid;
      grid-template-columns: 1fr 1fr;
      grid-auto-rows: 1fr 1fr;
      grid-column-gap: 50px;
      grid-row-gap: 35px;

      .item:nth-child(1) {
        grid-column: 1;
      }
      .item:nth-child(2) {
        grid-column: 2;
        grid-row: 1;
      }

      .item:nth-child(3) {
        grid-column: 1 / -1;
      }

      .label {
        font-family: var(--font-lemonmilk-light);
        font-size: 16px;
        color: var(--color-hazy);
      }
      .input {
        margin-top: 15px;
        border: 1px solid var(--color-blackjack);
        font-size: 16px;
        color: var(--color-blackjack);
        padding: 6px 10px 10px;
      }
    }
  }
}
</style>
