import languages from "~/locales/languages";

export default defineI18nConfig(() => ({
  legacy: false,
  locale: "en",
  fallbackLocale: "en",
  availableLocales: ["en"],
  messages: languages,
}));
