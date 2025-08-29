import ScheduleComponents from "~/graphql/schedule.gql";

export const useScheduleStore = defineStore("schedule", {
  state: () => ({
    data: [],
  }),

  actions: {
    async fetchSchedule() {
      const config = useRuntimeConfig();

      try {
        const { data, error } = await useFetch(
          config.public.backUrl + "/graphql",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: { query: ScheduleComponents },
          }
        );

        if (error.value) throw new Error(error.value);

        this.data = data.value.data.scheduleComponents;
      } catch (err) {
        console.error("Error fetching video data:", err);
      }
    },
  },
});
