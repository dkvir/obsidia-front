import SocialMedia from "~/graphql/social-media.gql";

export const useSocialsStore = defineStore("socials", {
  state: () => ({
    data: null,
  }),

  actions: {
    async fetchSocials() {
      const config = useRuntimeConfig();

      try {
        const { data, error } = await useFetch(
          config.public.backUrl + "/graphql",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: { query: SocialMedia },
          }
        );

        if (error.value) throw new Error(error.value);

        this.data = data.value.data.socialMedias;
      } catch (err) {
        console.error("Error fetching video data:", err);
      }
    },
  },
});
