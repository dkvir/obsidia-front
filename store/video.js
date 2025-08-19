import videoComponent from "~/graphql/video.gql";

export const useVideoStore = defineStore("video", {
  state: () => ({
    data: null,
  }),

  actions: {
    async fetchVideo() {
      const config = useRuntimeConfig();

      try {
        const { data, error } = await useFetch(
          config.public.strapi.url + "/graphql",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: { query: videoComponent },
          }
        );

        if (error.value) throw new Error(error.value);

        this.data = data.value.data.videoComponent;
      } catch (err) {
        console.error("Error fetching video data:", err);
      }
    },
  },
});
