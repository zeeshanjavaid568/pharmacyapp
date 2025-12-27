
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const SalerProdcutApi = createApi({
  reducerPath: "salerproduct",
  baseQuery: fetchBaseQuery({
    baseUrl: "http://localhost:7000",

  }),
  endpoints: (builder) => ({

    createDailyTotalSalerProductPrice: builder.mutation({
      query: (userData) => ({
        url: "/saler/salertotalprice",
        method: "POST",
        body: userData,
        headers: {
          Accept: "application/json",
        },
      }),
    }),
    salerProductsTotalPrice: builder.query({
      query: () => ({
        url: `/saler/products/totalprice`,
        method: "GET",
      }),
    }),
    deleteSalerProductTotalPrice: builder.mutation({
      query: (id) => ({
        url: `/saler/salertotalprice/${id}`,
        method: "DELETE",
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
    singleSalerProduct: builder.query({
      query: (id) => ({
        url: `saler/product/${id}`,
        method: "GET",
      }),
    }),
    updateSalerProduct: builder.mutation({
      query: ({ id, userData }) => ({
        url: `/saler/product/${id}`,
        method: "PUT",
        body: userData,
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
  useSalerProductsTotalPriceQuery,
  useDeleteSalerProductTotalPriceMutation,
  useCreateSalerProductMutation,
  useSalerProductQuery,
  useSingleSalerProductQuery,
  useUpdateSalerProductMutation,
  useDeleteSalerProductMutation
} = SalerProdcutApi;
