import content from "~/graphql/content.gql";

export const UseContentStore = defineStore("content", {
  state: () => ({
    data: null,
  }),

  actions: {
    async fetchContent() {
      const config = useRuntimeConfig();

      try {
        const { data, error } = await useFetch(
          config.public.backUrl + "/graphql",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: { query: content },
          }
        );

        if (error.value) throw new Error(error.value);

        this.data = data.value.data.contents;
      } catch (err) {
        console.error("Error fetching video data:", err);
      }
    },
  },
});
