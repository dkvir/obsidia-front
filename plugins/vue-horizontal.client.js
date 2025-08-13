import { defineNuxtPlugin } from "#app";
import VueHorizontal from "vue-horizontal";

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.component("VueHorizontal", VueHorizontal);
});
