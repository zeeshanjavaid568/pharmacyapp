
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const DuesApi = createApi({
  reducerPath: "givedues",
  baseQuery: fetchBaseQuery({
    baseUrl: "http://localhost:7000",

  }),
  endpoints: (builder) => ({

    createGivenDues: builder.mutation({
      query: (userData) => ({
        url: "/dues/givedues",
        method: "POST",
        body: userData,
        headers: {
          Accept: "application/json",
        },
      }),
    }),
    getAllDues: builder.query({
      query: () => ({
        url: `/dues/givedues`,
        method: "GET",
      }),
    }),
    deleteGivenDues: builder.mutation({
      query: (id) => ({
        url: `/dues/givedues/${id}`,
        method: "DELETE",
      }),
    }),
    singleGetDues: builder.query({
      query: (id) => ({
        url: `/dues/givedues/${id}`,
        method: "GET",
      }),
    }),
    updateDues: builder.mutation({
      query: ({ id, userData }) => ({
        url: `/dues/updatedues/${id}`,
        method: "PUT",
        body: userData,
      }),
    }),
    // ✅ ADDED: Rename Khata mutation
    renameKhata: builder.mutation({
      query: (renameData) => ({
        url: '/dues/rename-khata',
        method: 'PUT',
        body: renameData,
      }),
      invalidatesTags: ['Dues'],
    }),
  }),
});

export const {
  useCreateGivenDuesMutation,
  useGetAllDuesQuery,
  useDeleteGivenDuesMutation,
  useSingleGetDuesQuery,
  useUpdateDuesMutation,
  useRenameKhataMutation
} = DuesApi;
