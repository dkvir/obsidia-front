export const useHomeStore = defineStore("home", {
  state: () => ({
    websiteLoaded: false,
    splittedTitles: [],
  }),
  actions: {
    changeWebsiteLoaded(status) {
      this.websiteLoaded = status;
    },
    addSplittedTitles(newTitle) {
      this.splittedTitles.push(newTitle);
    },
  },
});
