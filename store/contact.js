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

      // Reset states
      this.loading = true;
      this.error = null;
      this.success = false;

      console.log(config.public.backUrl);

      try {
        const { data, error } = await $fetch(
          config.public.backUrl + "/graphql",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              query: CreateContact,
              variables: {
                data: contactData,
              },
            }),
          }
        );

        if (error) {
          throw new Error(error.message || "Failed to create contact");
        }

        // Check for GraphQL errors
        if (data?.errors) {
          throw new Error(data.errors[0]?.message || "GraphQL error occurred");
        }

        this.success = true;
        return data;
      } catch (err) {
        this.error = err.message;
        console.error("Error creating contact:", err);
        throw err;
      } finally {
        this.loading = false;
      }
    },

    resetState() {
      this.loading = false;
      this.error = null;
      this.success = false;
    },

    changeSuccess(status) {
      this.success = status;
    },
  },

  getters: {
    isLoading: (state) => state.loading,
    hasError: (state) => !!state.error,
    isSuccess: (state) => state.success,
  },
});
