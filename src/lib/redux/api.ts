import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export type AccountType = "savings" | "current" | "business";

export type Account = {
  id: string;
  type: AccountType;
  name: string;
  mobile: string;
  accountNumber: string;
  balance: number;
  status: "pending" | "active" | "frozen" | "rejected";
  createdAt: string;
};

export type CreateAccountBody = {
  type: AccountType;
  name: string;
  mobile: string;
  nid: string;
  pin: string;
};

export const api = createApi({
  reducerPath: "api",
  baseQuery: fetchBaseQuery({ baseUrl: "/api" }),
  tagTypes: ["Accounts"],
  endpoints: (build) => ({
    getAccounts: build.query<Account[], void>({
      query: () => "/accounts",
      providesTags: ["Accounts"],
    }),
    createAccount: build.mutation<{ id: string }, CreateAccountBody>({
      query: (body) => ({ url: "/accounts", method: "POST", body }),
      invalidatesTags: ["Accounts"], // create hole list nijei refresh hobe
    }),
  }),
});

export const { useGetAccountsQuery, useCreateAccountMutation } = api;