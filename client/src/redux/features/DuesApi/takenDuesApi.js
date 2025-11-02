
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const TakenDuesApi = createApi({
  reducerPath: "takendues",
  baseQuery: fetchBaseQuery({
    baseUrl: "http://localhost:7000",

  }),
  endpoints: (builder) => ({

    createTakenDues: builder.mutation({
      query: (userData) => ({
        url: "/dues/takendues",
        method: "POST",
        body: userData,
        headers: {
          Accept: "application/json",
        },
      }),
    }),
    getAllTakenDues: builder.query({
      query: () => ({
        url: `/dues/takendues`,
        method: "GET",
      }),
    }),
    deleteTakenDues: builder.mutation({
      query: (id) => ({
        url: `/dues/takendues/${id}`,
        method: "DELETE",
      }),
    }),
  }),
});

export const {
  useCreateTakenDuesMutation,
  useGetAllTakenDuesQuery,
  useDeleteTakenDuesMutation
} = TakenDuesApi;
