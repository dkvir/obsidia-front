export const useHomeStore = defineStore("home", {
  state: () => ({
    websiteLoaded: false,
  }),
  actions: {
    changeWebsiteLoaded(status) {
      this.websiteLoaded = status;
    },
  },
});
