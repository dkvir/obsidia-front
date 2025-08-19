import CreateContact from "~/graphql/mutations/contact.gql";

export const useContactStore = defineStore("contact", {
  state: () => ({
    loading: false,
    error: null,
    success: false,
  }),

  actions: {
    async createContact(contactData) {
      const config = useRuntimeConfig();

      try {
        const { data, error } = await useFetch(
          config.public.strapi.url + "/graphql",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: {
              query: CreateContact,
              variables: {
                data: contactData,
              },
            },
          }
        );

        if (error.value) throw new Error(error.value);

        this.success = true;
      } catch (err) {
        this.error = err.message;
        console.error("Error creating contact:", err);
        throw err;
      }
    },
    changeSuccess(status) {
      this.success = status;
    },
  },
});
