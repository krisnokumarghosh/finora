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

export type UnifiedTransaction = {
  id: string;
  transactionId: string;
  type: "transfer" | "deposit" | "withdrawal";
  direction?: "debit" | "credit";
  accountNumber: string;
  accountType: AccountType;
  accountName?: string;
  counterpartAccountNumber?: string;
  counterpartName?: string;
  amount: number;
  fee?: number;
  balanceAfter?: number;
  description: string;
  status: "completed" | "approved" | "pending" | "rejected";
  isCredit: boolean;
  createdAt: string;
};

export type GetTransactionsParams = {
  limit?: number;
  offset?: number;
  accountType?: string;
  type?: string;
  search?: string;
};

export type TransactionsResponse = {
  transactions: UnifiedTransaction[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
};

export type TransactionFlag = {
  reason: string;
  flaggedBy: string;
  flaggedByName: string;
  createdAt: string;
};

export type StaffTransaction = UnifiedTransaction & {
  customerUserId?: string;
  flag: TransactionFlag | null;
};

export type GetStaffTransactionsParams = {
  limit?: number;
  offset?: number;
  type?: string;
  status?: string;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  flagged?: string;
};

export type StaffTransactionsResponse = {
  transactions: StaffTransaction[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
};

export type FlagTransactionBody = {
  transactionId: string;
  action: "flag" | "unflag";
  reason?: string;
};

export type FlagTransactionResponse = {
  success: boolean;
  message: string;
  flag: TransactionFlag | null;
};

export type FundRequestType = "deposit" | "withdrawal";
export type FundRequestStatus = "pending" | "approved" | "rejected";

export type FundRequest = {
  id: string;
  requestId: string;
  accountNumber: string;
  accountName: string;
  type: FundRequestType;
  amount: number;
  requestDate: string;
  description: string;
  status: FundRequestStatus;
  createdAt: string;
};

export type CreateFundRequestBody = {
  accountNumber: string;
  amount: number;
  type: FundRequestType;
  requestDate?: string;
  description: string;
  pin: string;
};

export type LoanType = "home" | "car" | "education" | "personal" | "business";
export type LoanStatus = "pending" | "approved" | "rejected";

export type Loan = {
  id: string;
  loanId: string;
  accountId?: string;
  accountNumber?: string;
  accountType?: string;
  title: string;
  type: LoanType;
  amount: number;
  termMonths: number;
  purpose: string;
  status: LoanStatus;
  dueDate: string;
  createdAt: string;
};

export type GetLoansParams = {
  limit?: number;
  offset?: number;
  type?: string;
  search?: string;
};

export type LoansResponse = {
  loans: Loan[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
};

export type ApplyLoanBody = {
  accountId: string;
  type: LoanType;
  amount: number;
  termMonths: number;
  purpose: string;
  pin: string;
};

export const api = createApi({
  reducerPath: "api",
  baseQuery: fetchBaseQuery({ baseUrl: "/api" }),
  tagTypes: [
    "Accounts",
    "Transactions",
    "FundRequests",
    "Loans",
    "StaffTransactions",
  ],
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
    getFundRequests: build.query<
      FundRequest[],
      { accountNumber?: string } | void
    >({
      query: (arg) =>
        `/funds${arg?.accountNumber ? `?accountNumber=${arg.accountNumber}` : ""}`,
      providesTags: ["FundRequests"],
    }),
    createFundRequest: build.mutation<
      { success: boolean; message: string; request: FundRequest },
      CreateFundRequestBody
    >({
      query: (body) => ({
        url: "/funds",
        method: "POST",
        body,
      }),
      invalidatesTags: ["FundRequests", "Accounts"],
    }),
    getLoans: build.query<Loan[], void>({
      query: () => "/loans",
      providesTags: ["Loans"],
    }),
    getPaginatedLoans: build.query<
      LoansResponse,
      GetLoansParams | void
    >({
      query: (params) => {
        const queryParams = new URLSearchParams();
        queryParams.set("paginated", "true");
        if (params?.limit) queryParams.set("limit", String(params.limit));
        if (params?.offset !== undefined) queryParams.set("offset", String(params.offset));
        if (params?.type && params.type !== "all") {
          queryParams.set("type", params.type);
        }
        if (params?.search) queryParams.set("search", params.search);
        const qs = queryParams.toString();
        return `/loans?${qs}`;
      },
      providesTags: ["Loans"],
    }),
    deleteLoan: build.mutation<{ success: boolean; message: string }, string>({
      query: (id) => ({
        url: `/loans?id=${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Loans"],
    }),
    applyLoan: build.mutation<{ success: boolean; loan: Loan }, ApplyLoanBody>({
      query: (body) => ({
        url: "/loans",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Loans"],
    }),
    getTransactions: build.query<
      TransactionsResponse,
      GetTransactionsParams | void
    >({
      query: (params) => {
        const queryParams = new URLSearchParams();
        if (params?.limit) queryParams.set("limit", String(params.limit));
        if (params?.offset !== undefined) queryParams.set("offset", String(params.offset));
        if (params?.accountType && params.accountType !== "all") {
          queryParams.set("accountType", params.accountType);
        }
        if (params?.type && params.type !== "all") {
          queryParams.set("type", params.type);
        }
        if (params?.search) queryParams.set("search", params.search);
        const qs = queryParams.toString();
        return `/transactions${qs ? `?${qs}` : ""}`;
      },
      providesTags: ["Transactions", "FundRequests"],
    }),
    getStaffTransactions: build.query<
      StaffTransactionsResponse,
      GetStaffTransactionsParams | void
    >({
      query: (params) => {
        const queryParams = new URLSearchParams();
        if (params?.limit) queryParams.set("limit", String(params.limit));
        if (params?.offset !== undefined) {
          queryParams.set("offset", String(params.offset));
        }
        if (params?.type && params.type !== "all") {
          queryParams.set("type", params.type);
        }
        if (params?.status && params.status !== "all") {
          queryParams.set("status", params.status);
        }
        if (params?.search) queryParams.set("search", params.search);
        if (params?.dateFrom) queryParams.set("dateFrom", params.dateFrom);
        if (params?.dateTo) queryParams.set("dateTo", params.dateTo);
        if (params?.flagged && params.flagged !== "all") {
          queryParams.set("flagged", params.flagged);
        }
        const qs = queryParams.toString();
        return `/staff/transactions${qs ? `?${qs}` : ""}`;
      },
      providesTags: ["StaffTransactions"],
    }),
    flagTransaction: build.mutation<
      FlagTransactionResponse,
      FlagTransactionBody
    >({
      query: (body) => ({
        url: "/staff/transactions",
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["StaffTransactions", "Transactions"],
    }),
  }),
});

export const {
  useGetAccountsQuery,
  useCreateAccountMutation,
  useTransferFundsMutation,
  useLazyLookupAccountQuery,
  useGetRecentTransfersQuery,
  useGetFundRequestsQuery,
  useCreateFundRequestMutation,
  useGetLoansQuery,
  useGetPaginatedLoansQuery,
  useApplyLoanMutation,
  useDeleteLoanMutation,
  useGetTransactionsQuery,
  useGetStaffTransactionsQuery,
  useFlagTransactionMutation,
} = api;
