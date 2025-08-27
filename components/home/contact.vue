<template>
  <div class="contact flex-center">
    <div class="contact-frame flex">
      <h2 class="title flex-column">
        <span class="span top">{{ $t("home.contact.title.top") }}</span>
        <span class="span bottom">{{ $t("home.contact.title.bottom") }}</span>
      </h2>

      <Form class="form" @submit="onSubmit" v-slot="{ resetForm }">
        <ul class="form-list flex-column">
          <!-- Name -->
          <li class="item flex-column">
            <div class="label">Name</div>
            <Field
              name="Name"
              rules="required|min:2"
              v-slot="{ field, meta, errors }"
            >
              <input
                v-bind="field"
                placeholder="John"
                :class="[
                  'input',
                  { 'is-invalid': errors.length && meta.touched },
                  { 'is-valid': meta.valid && meta.touched },
                ]"
              />
            </Field>
            <ErrorMessage name="Name" class="error-messagse" />
          </li>

          <!-- Last Name -->
          <li class="item flex-column">
            <div class="label">Last Name</div>
            <Field
              name="LastName"
              rules="required|min:2"
              v-slot="{ field, meta, errors }"
            >
              <input
                v-bind="field"
                placeholder="Doe"
                :class="[
                  'input',
                  { 'is-invalid': errors.length && meta.touched },
                  { 'is-valid': meta.valid && meta.touched },
                ]"
              />
            </Field>
            <ErrorMessage name="LastName" class="error-messagse" />
          </li>

          <!-- Phone -->
          <li class="item flex-column">
            <div class="label">Phone</div>
            <Field
              name="Phone"
              rules="required|numeric|min:9"
              v-slot="{ field, meta, errors }"
            >
              <input
                v-bind="field"
                type="tel"
                placeholder="123 456 789"
                :class="[
                  'input',
                  { 'is-invalid': errors.length && meta.touched },
                  { 'is-valid': meta.valid && meta.touched },
                ]"
              />
            </Field>
            <ErrorMessage name="Phone" class="error-messagse" />
          </li>
        </ul>

        <!-- Send button -->
        <common-tiny-buttons-send :submitedForm="submitedForm" />
      </Form>
    </div>
  </div>
</template>

<script setup>
import { Form, Field, ErrorMessage } from "vee-validate";
import { useContactStore } from "~/store/contact";

const contactStore = useContactStore();
const submitedForm = ref(null);

const onSubmit = async (values, { resetForm }) => {
  try {
    await contactStore.createContact({
      firstName: values.Name,
      lastName: values.LastName, // Fixed: was values.Lastname
      phone: values.Phone,
    });

    submitedForm.value = true;

    resetForm();

    setTimeout(() => {
      submitedForm.value = null;
    }, 1500);
  } catch (err) {
    console.error("Error submitting form:", err);
  }
};
</script>

<style lang="scss" scoped>
.contact {
  width: 100%;
  height: 100svh;
  padding: 0 calc(var(--page-offset-padding) + css-clamp(40px, 160px));

  @include mq(max-width 1366px) {
    padding: 0;
  }

  .contact-frame {
    width: 100%;
    @include mq(max-width 768px) {
      flex-direction: column;
    }
  }

  .title {
    font-size: css-clamp(48px, 120px);
    font-family: var(--font-lemonmilk-light);
    line-height: 1;
    white-space: nowrap;
    @include mq(max-width 768px) {
      font-size: css-clamp-vw(34px, 48px, 768);
    }
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
    margin-left: get-vw(160px);
    width: 100%;
    @include mq(max-width 768px) {
      margin-left: 0;
      margin-top: var(--page-offset-padding);
    }
    .form-list {
      display: grid;
      grid-template-columns: 1fr 1fr;
      grid-auto-rows: 1fr 1fr;
      grid-column-gap: 50px;
      grid-row-gap: 35px;

      @include mq(max-width 768px) {
        grid-template-columns: 1fr;
        grid-auto-rows: auto;
        grid-column-gap: 0;
        grid-row-gap: calc(var(--page-offset-padding) * 2);
      }
      .item {
        position: relative;
      }

      .item:nth-child(1) {
        grid-column: 1;
        @include mq(max-width 768px) {
          grid-column: 1 / -1;
        }
      }
      .item:nth-child(2) {
        grid-column: 2;
        grid-row: 1;
        @include mq(max-width 768px) {
          grid-column: 1 / -1;
          grid-row: 2;
        }
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
        border: 1px solid var(--border-color, var(--color-blackjack));
        font-size: 16px;
        color: var(--color-blackjack);
        padding: 6px 10px 10px;
        @include default-transitions(border);
        &.is-invalid {
          --border-color: red;
        }
        &.is-valid {
          --border-color: green;
        }
      }
      .error-messagse {
        position: absolute;
        bottom: 0;
        left: 0;
        transform: translate3d(0, 100%, 0);
        color: red;
        font-size: 12px;
        padding-top: 5px;
      }
    }
  }
}
</style>
