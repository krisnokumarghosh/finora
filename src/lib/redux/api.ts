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
  transactionLimit?: number;
  createdAt: string;
};

export type CreateAccountBody = {
  type: AccountType;
  name: string;
  mobile: string;
  nid: string;
  pin: string;
};

export type TransferRequestBody = {
  senderAccountId: string;
  recipientAccountNumber: string;
  amount: number;
  description?: string;
  pin: string;
};

export type TransferResponse = {
  success: boolean;
  transactionId: string;
  amount: number;
  fee: number;
  senderAccountNumber: string;
  senderName: string;
  recipientAccountNumber: string;
  recipientName: string;
  description: string;
  createdAt: string;
};

export type AccountLookupResponse = {
  found: boolean;
  accountNumber?: string;
  name?: string;
  status?: string;
  type?: string;
  isSelf?: boolean;
  message?: string;
};

export type TransactionItem = {
  id: string;
  transactionId: string;
  accountNumber: string;
  recipientAccountNumber?: string;
  recipientName?: string;
  senderAccountNumber?: string;
  senderName?: string;
  type: string;
  direction: "debit" | "credit";
  amount: number;
  fee: number;
  balanceAfter: number;
  description: string;
  status: string;
  createdAt: string;
};

export const api = createApi({
  reducerPath: "api",
  baseQuery: fetchBaseQuery({ baseUrl: "/api" }),
  tagTypes: ["Accounts", "Transactions"],
  refetchOnMountOrArgChange: true, // Always refetch fresh financial data when switching pages / mounting
  refetchOnFocus: true, // Auto refetch when tab is refocused
  refetchOnReconnect: true, // Auto refetch when network reconnects
  endpoints: (build) => ({
    getAccounts: build.query<Account[], void>({
      query: () => "/accounts",
      providesTags: ["Accounts"],
    }),
    createAccount: build.mutation<{ id: string }, CreateAccountBody>({
      query: (body) => ({ url: "/accounts", method: "POST", body }),
      invalidatesTags: ["Accounts"],
    }),
    transferFunds: build.mutation<TransferResponse, TransferRequestBody>({
      query: (body) => ({
        url: "/transfers",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Accounts", "Transactions"],
    }),
    lookupAccount: build.query<AccountLookupResponse, string>({
      query: (accountNumber) => `/accounts/lookup?accountNumber=${accountNumber}`,
    }),
    getRecentTransfers: build.query<
      TransactionItem[],
      { accountId?: string } | void
    >({
      query: (arg) =>
        `/transfers/recent${arg?.accountId ? `?accountId=${arg.accountId}` : ""}`,
      providesTags: ["Transactions"],
    }),
  }),
});

export const {
  useGetAccountsQuery,
  useCreateAccountMutation,
  useTransferFundsMutation,
  useLazyLookupAccountQuery,
  useGetRecentTransfersQuery,
} = api;
