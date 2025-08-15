import { defineRule, configure } from "vee-validate";
import { required, min, max, numeric } from "@vee-validate/rules";

export default defineNuxtPlugin((nuxtApp) => {
  defineRule("required", required);
  defineRule("min", min);
  defineRule("max", max);
  defineRule("numeric", numeric);

  configure({
    generateMessage: (ctx) => {
      const messages = {
        required: `${ctx.field} is required`,
        min: `${ctx.field} is too short`,
        max: `${ctx.field} is too long`,
        numeric: `${ctx.field} must be a number`,
      };
      return messages[ctx.rule?.name] || `${ctx.field} is invalid`;
    },
    validateOnInput: true,
  });
});
