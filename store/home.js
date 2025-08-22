export const useHomeStore = defineStore("home", {
  state: () => ({
    websiteLoaded: false,
    loaderFinished: false,
  }),
  actions: {
    changeWebsiteLoaded(status) {
      this.websiteLoaded = status;
    },
    changeLoaderFinished(status) {
      this.loaderFinished = status;
    },
  },
});
