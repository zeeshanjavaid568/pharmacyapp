import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const BuyerProdcutApi = createApi({
  reducerPath: "buyerproduct",
  baseQuery: fetchBaseQuery({
    baseUrl: "http://localhost:7000", 
  }),
  tagTypes: ['BuyerProduct'],
  endpoints: (builder) => ({
    createDailyBuyerProductTotalPrice: builder.mutation({
      query: (userData) => ({
        url: "/buyer/totalpriceproduct",
        method: "POST",
        body: userData,
        headers: {
          Accept: "application/json",
        },
      }),
    }),
    buyerDailyProductTotalPrice: builder.query({
      query: () => ({
        url: `/buyer/products/totalprice`,
        method: "GET",
      }),
    }),
    deleteBuyerProductTotalPrice: builder.mutation({
      query: (id) => ({
        url: `/buyer/product/totalprice/${id}`,
        method: "DELETE",
      }),
    }),
    createBuyerProduct: builder.mutation({
      query: (userData) => ({
        url: "/buyer/product",
        method: "POST",
        body: userData,
        headers: {
          Accept: "application/json",
        },
      }),
      invalidatesTags: ['BuyerProduct']
    }),
    buyerProduct: builder.query({
      query: () => ({
        url: `/buyer/products`,
        method: "GET",
      }),
      providesTags: ['BuyerProduct']
    }),
    singleBuyerProduct: builder.query({
      query: (id) => ({
        url: `/buyer/product/${id}`,
        method: "GET",
      }),
    }),
    updateAllBuyerProduct: builder.mutation({
      query: ({ id, userData }) => ({
        url: `/buyer/allproduct/${id}`,
        method: "PUT",
        body: userData,
      }),
      invalidatesTags: ['BuyerProduct']
    }),
    updateBuyerProduct: builder.mutation({
      query: ({ id, userData }) => ({
        url: `/buyer/product/${id}`,
        method: "PUT",
        body: userData,
      }),
      invalidatesTags: ['BuyerProduct']
    }),
    deleteBuyerProduct: builder.mutation({
      query: (id) => ({
        url: `/buyer/product/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ['BuyerProduct']
    }),
  }),
});

export const {
  useCreateDailyBuyerProductTotalPriceMutation,
  useBuyerDailyProductTotalPriceQuery,
  useDeleteBuyerProductTotalPriceMutation,
  useCreateBuyerProductMutation,
  useBuyerProductQuery,
  useSingleBuyerProductQuery,
  useUpdateAllBuyerProductMutation,
  useUpdateBuyerProductMutation,
  useDeleteBuyerProductMutation
} = BuyerProdcutApi;