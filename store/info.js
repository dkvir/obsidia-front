import ObsidiaInformation from "~/graphql/obsidiaInfo.gql";

export const useInfoStore = defineStore("info", {
  state: () => ({
    data: null,
  }),

  actions: {
    async fetchInfo() {
      const config = useRuntimeConfig();

      try {
        const { data, error } = await useFetch(
          config.public.strapi.url + "/graphql",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: { query: ObsidiaInformation },
          }
        );

        if (error.value) throw new Error(error.value);

        this.data = data.value.data.obsidiaInformation;
      } catch (err) {
        console.error("Error fetching video data:", err);
      }
    },
  },
});
