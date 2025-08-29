// https://nuxt.com/docs/api/configuration/nuxt-config
import favicon from "./config/favicon";

export default defineNuxtConfig({
  compatibilityDate: "2025-05-15",
  devtools: { enabled: false },
  modules: [
    "nuxt-icons",
    "@pinia/nuxt",
    "@nuxtjs/robots",
    "@nuxtjs/sitemap",
    "@nuxtjs/device",
    "@nuxtjs/i18n",
    "@nuxtjs/strapi",
  ],
  app: {
    head: {
      meta: [
        { charset: "utf-8" },
        {
          name: "viewport",
          content:
            "width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no",
        },
        { name: "pinterest", content: "nopin" },
        { name: "google", content: "notranslate" },
        // ...favicon.meta,
      ],
      link: [...favicon.links],
      script: [{ src: "/js/SplitText.min.js" }],
    },
  },
  strapi: {
    url: process.env.STRAPI_URL || "http://localhost:1337",
    token: process.env.STRAPI_TOKEN || undefined,
    prefix: "/api",
    admin: "/admin",
    version: "v5",
    cookie: {
      maxAge: 60 * 60 * 24 * 30, // 30 days
    },
    cookieName: "strapi_jwt",
  },
  runtimeConfig: {
    public: {
      siteUrl: process.env.PUBLIC_SITE_URL,
      backUrl: process.env.STRAPI_URL,
    },
  },

  i18n: {
    strategy: "no_prefix",
    detectBrowserLanguage: {
      alwaysRedirect: true,
      useCookie: true,
      cookieKey: "i18n_redirected",
      redirectOn: "root",
    },
    locales: [
      {
        code: "en",
        iso: "en-US",
      },
    ],
    baseUrl: process.env.PUBLIC_SITE_URL,
    vueI18n: "~/i18n.config.js",
  },
  css: ["@/assets/sass/style.scss"],
  vite: {
    css: {
      preprocessorOptions: {
        scss: {
          quietDeps: true,
          api: "modern-compiler",
          silenceDeprecations: [
            "legacy-js-api",
            "mixed-decls",
            "color-functions",
            "global-builtin",
            "import",
          ],
          additionalData: '@import "@/assets/sass/app.scss";',
        },
      },
    },
    plugins: [
      {
        name: "graphql-loader",
        transform(code, id) {
          if (id.endsWith(".graphql") || id.endsWith(".gql")) {
            return {
              code: `export default ${JSON.stringify(code)};`,
              map: null,
            };
          }
        },
      },
    ],
  },
  build: {
    transpile: ["three"],
  },
});
