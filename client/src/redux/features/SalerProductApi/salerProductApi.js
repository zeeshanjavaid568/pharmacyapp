
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const SalerProdcutApi = createApi({
  reducerPath: "salerproduct",
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

    createDailyTotalSalerProductPrice: builder.mutation({
      query: (userData) => ({
        url: "/saler/totalsalerproduct",
        method: "POST",
        body: userData,
        headers: {
          Accept: "application/json",
        },
      }),
    }),
    createSalerProduct: builder.mutation({
      query: (userData) => ({
        url: "/saler/product",
        method: "POST",
        body: userData,
        headers: {
          Accept: "application/json",
        },
      }),
    }),
    salerProduct: builder.query({
      query: () => ({
        url: `/saler/products`,
        method: "GET",
      }),
    }),
    deleteSalerProduct: builder.mutation({
      query: (id) => ({
        url: `/saler/product/${id}`,
        method: "DELETE",
      }),
    }),
  }),
});

export const {
  useCreateDailyTotalSalerProductPriceMutation,
  useCreateSalerProductMutation,
  useSalerProductQuery,
  useDeleteSalerProductMutation
} = SalerProdcutApi;
