
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const DailyProfitApi = createApi({
  reducerPath: "dailyprofit",
  baseQuery: fetchBaseQuery({
    baseUrl: "http://localhost:7000",

  }),
  endpoints: (builder) => ({

    createDailyProfit: builder.mutation({
      query: (userData) => ({
        url: "/daily-profit/product",
        method: "POST",
        body: userData,
        headers: {
          Accept: "application/json",
        },
      }),
    }),
    dailyProfit: builder.query({
      query: () => ({
        url: `/daily-profit/products`,
        method: "GET",
      }),
    }),
    deleteDailyProfit: builder.mutation({
      query: (id) => ({
        url: `/daily-profit/product/${id}`,
        method: "DELETE",
      }),
    }),
  }),
});

export const {
  useCreateDailyProfitMutation,
  useDailyProfitQuery,
  useDeleteDailyProfitMutation
} = DailyProfitApi;
