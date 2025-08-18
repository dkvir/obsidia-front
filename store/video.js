export const useVideoStore = defineStore("video", {
  state: () => ({
    data: null,
  }),

  actions: {
    async fetchVideo() {
      try {
        const query = `
          query {
            videoComponent {
              Video {
                url
              }
              Poster {
                url
              }
            }
          }
        `;

        const { data, error } = await useFetch(
          "http://localhost:1337/graphql",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: { query },
          }
        );

        if (error.value) throw new Error(error.value);

        this.data = data.value.data.videoComponent;
        console.log(this.data);
      } catch (err) {
        console.error("Error fetching video data:", err);
      }
    },
  },
});
