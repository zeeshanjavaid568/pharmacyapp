
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const MonthlyProfitApi = createApi({
  reducerPath: "monthlyprofit",
  baseQuery: fetchBaseQuery({
    baseUrl: "http://localhost:7000",

    // prepareHeaders: (headers, { getState }) => {
    //     const apiToken = getState().storeAuth.apiToken;
    //     if (apiToken) {
    //       headers.set('Authorization', `Bearer ${apiToken}`);
    //     }
    //     return headers;
    //   },

  }),
  endpoints: (builder) => ({

    createMonthlyProfit: builder.mutation({
      query: (userData) => ({
        url: "/monthly-profit/product",
        method: "POST",
        body: userData,
        headers: {
          Accept: "application/json",
        },
      }),
    }),
    monthlyProfit: builder.query({
      query: () => ({
        url: `/monthly-profit/product`,
        method: "GET",
      }),
    }),
    deleteMonthlyProfit: builder.mutation({
      query: (id) => ({
        url: `/monthly-profit/product/${id}`,
        method: "DELETE",
      }),
    }),
  }),
});

export const {
  useCreateMonthlyProfitMutation,
  useMonthlyProfitQuery,
  useDeleteMonthlyProfitMutation
} = MonthlyProfitApi;
