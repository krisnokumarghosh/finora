import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export type AccountType = "savings" | "current" | "business";
export type AccountStatus =
  | "pending"
  | "under_review"
  | "active"
  | "frozen"
  | "rejected";

export type Account = {
  id: string;
  type: AccountType;
  name: string;
  mobile: string;
  accountNumber: string;
  balance: number;
  status: AccountStatus;
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

/* ─── Staff customer operations ─── */

export type StaffCustomerAccount = {
  id: string;
  accountNumber: string;
  type: AccountType;
  balance: number;
  status: AccountStatus;
  transactionLimit?: number;
  createdAt: string;
};

export type StaffCustomer = {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  verified: boolean;
  verifiedAt?: string;
  verifiedByName?: string;
  accountCount: number;
  totalBalance: number;
  accounts: StaffCustomerAccount[];
};

export type GetStaffCustomersParams = {
  limit?: number;
  offset?: number;
  search?: string;
};

export type StaffCustomersResponse = {
  customers: StaffCustomer[];
  total: number;
  verifiedCount: number;
  limit: number;
  offset: number;
  hasMore: boolean;
};

export type RegisterCustomerBody = {
  name: string;
  email: string;
  password: string;
};

export type RegisterCustomerResponse = {
  success: boolean;
  message: string;
  customer: StaffCustomer;
};

export type VerifyCustomerBody = {
  userId: string;
  action: "verify" | "unverify";
};

export type VerifyCustomerResponse = {
  success: boolean;
  message: string;
  verified: boolean;
  verifiedAt?: string;
  verifiedByName?: string;
};

export type StaffBankAccount = {
  id: string;
  userId: string;
  customerName: string;
  customerEmail?: string;
  type: AccountType;
  name: string;
  mobile: string;
  accountNumber: string;
  balance: number;
  status: AccountStatus;
  transactionLimit?: number;
  createdAt: string;
  createdByName?: string;
};

export type GetStaffAccountsParams = {
  limit?: number;
  offset?: number;
  type?: string;
  status?: string;
  search?: string;
};

export type StaffAccountStatusCounts = {
  pending: number;
  under_review: number;
  active: number;
  frozen: number;
  rejected: number;
};

export type StaffAccountsResponse = {
  accounts: StaffBankAccount[];
  total: number;
  statusCounts: StaffAccountStatusCounts;
  limit: number;
  offset: number;
  hasMore: boolean;
};

export type CreateCustomerAccountBody = {
  userId: string;
  type: AccountType;
  name: string;
  mobile: string;
  nid: string;
  pin: string;
};

export type CreateCustomerAccountResponse = {
  success: boolean;
  message: string;
  account: StaffBankAccount;
};

export type UpdateStaffAccountStatusBody = {
  accountId: string;
  status: "under_review" | "pending";
};

export type UpdateStaffAccountStatusResponse = {
  success: boolean;
  message: string;
  account: StaffBankAccount;
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
export type LoanStatus = "pending" | "under_review" | "approved" | "rejected";

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

export type LoanInternalNote = {
  id: string;
  note: string;
  addedBy: string;
  addedByName: string;
  createdAt: string;
};

export type StaffLoan = Loan & {
  userId?: string;
  userName?: string;
  accountStatus?: string;
  balance?: number;
  customer: {
    name: string;
    email?: string;
    mobile?: string;
  };
  internalNotes: LoanInternalNote[];
  forwardedAt?: string;
  forwardedByName?: string;
  updatedAt?: string;
};

export type GetStaffLoansParams = {
  limit?: number;
  offset?: number;
  type?: string;
  status?: string;
  search?: string;
};

export type StaffLoansResponse = {
  loans: StaffLoan[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
};

export type UpdateStaffLoanBody =
  | { loanId: string; action: "note"; note: string }
  | { loanId: string; action: "forward" };

export type UpdateStaffLoanResponse = {
  success: boolean;
  message: string;
  loan: StaffLoan;
};

/* ─── Admin Analytics ─── */

export type AdminSummary = {
  totalCustomers: number;
  totalBankAccounts: number;
  totalBankBalance: number;
  totalDeposits: number;
  totalWithdrawals: number;
  totalTransactions: number;
  pendingLoans: number;
};

export type TransactionChartPoint = {
  name: string;
  year: number;
  month?: number;
  deposit: number;
  withdrawal: number;
  transfer: number;
};

export type AccountTypeDataPoint = {
  type: string;
  count: number;
  totalBalance: number;
};

export type AdminAnalyticsResponse = {
  summary: AdminSummary;
  monthlyChartData: TransactionChartPoint[];
  yearlyChartData: TransactionChartPoint[];
  accountTypeData: AccountTypeDataPoint[];
};

/* ─── Admin Customer Management ─── */

export type UserStatus = "active" | "inactive" | "blocked";

export type AdminCustomer = StaffCustomer & {
  status: UserStatus;
  statusReason?: string;
  statusUpdatedAt?: string;
};

export type AdminCustomerStatusCounts = {
  all: number;
  active: number;
  inactive: number;
  blocked: number;
};

export type AdminCustomersResponse = {
  customers: AdminCustomer[];
  total: number;
  statusCounts: AdminCustomerStatusCounts;
  verifiedCount: number;
  limit: number;
  offset: number;
  hasMore: boolean;
};

export type GetAdminCustomersParams = {
  limit?: number;
  offset?: number;
  status?: string;
  search?: string;
};

export type UpdateCustomerStatusBody = {
  userId: string;
  status: UserStatus;
  reason?: string;
};

export type UpdateCustomerStatusResponse = {
  success: boolean;
  message: string;
  customer: AdminCustomer;
};

export type UpdateAdminAccountStatusBody = {
  accountId: string;
  status: AccountStatus;
  reason?: string;
};

export type UpdateAdminAccountStatusResponse = {
  success: boolean;
  message: string;
  account: StaffBankAccount;
};

export type GetCustomerTransactionsParams = {
  userId: string;
  limit?: number;
  offset?: number;
  type?: string;
};

export const api = createApi({
  reducerPath: "api",
  baseQuery: fetchBaseQuery({ baseUrl: "/api" }),
  tagTypes: [
    "Accounts",
    "Transactions",
    "FundRequests",
    "Loans",
    "StaffLoans",
    "StaffTransactions",
    "StaffCustomers",
    "StaffAccounts",
    "AdminAnalytics",
    "AdminCustomers",
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
    getStaffLoans: build.query<
      StaffLoansResponse,
      GetStaffLoansParams | void
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
        const qs = queryParams.toString();
        return `/staff/loans${qs ? `?${qs}` : ""}`;
      },
      providesTags: ["StaffLoans"],
    }),
    updateStaffLoan: build.mutation<
      UpdateStaffLoanResponse,
      UpdateStaffLoanBody
    >({
      query: (body) => ({
        url: "/staff/loans",
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["StaffLoans"],
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
    getStaffCustomers: build.query<
      StaffCustomersResponse,
      GetStaffCustomersParams | void
    >({
      query: (params) => {
        const queryParams = new URLSearchParams();
        if (params?.limit) queryParams.set("limit", String(params.limit));
        if (params?.offset !== undefined) {
          queryParams.set("offset", String(params.offset));
        }
        if (params?.search) queryParams.set("search", params.search);
        const qs = queryParams.toString();
        return `/staff/customers${qs ? `?${qs}` : ""}`;
      },
      providesTags: ["StaffCustomers"],
    }),
    registerCustomer: build.mutation<
      RegisterCustomerResponse,
      RegisterCustomerBody
    >({
      query: (body) => ({
        url: "/staff/customers",
        method: "POST",
        body,
      }),
      invalidatesTags: ["StaffCustomers"],
    }),
    verifyCustomer: build.mutation<
      VerifyCustomerResponse,
      VerifyCustomerBody
    >({
      query: (body) => ({
        url: "/staff/customers",
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["StaffCustomers"],
    }),
    getStaffAccounts: build.query<
      StaffAccountsResponse,
      GetStaffAccountsParams | void
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
        const qs = queryParams.toString();
        return `/staff/accounts${qs ? `?${qs}` : ""}`;
      },
      providesTags: ["StaffAccounts"],
    }),
    createCustomerAccount: build.mutation<
      CreateCustomerAccountResponse,
      CreateCustomerAccountBody
    >({
      query: (body) => ({
        url: "/staff/accounts",
        method: "POST",
        body,
      }),
      invalidatesTags: ["StaffAccounts", "StaffCustomers", "Accounts"],
    }),
    updateStaffAccountStatus: build.mutation<
      UpdateStaffAccountStatusResponse,
      UpdateStaffAccountStatusBody
    >({
      query: (body) => ({
        url: "/staff/accounts",
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["StaffAccounts", "StaffCustomers", "Accounts"],
    }),
    getAdminAnalytics: build.query<AdminAnalyticsResponse, void>({
      query: () => "/admin/analytics",
      providesTags: ["AdminAnalytics"],
    }),
    getAdminCustomers: build.query<AdminCustomersResponse, GetAdminCustomersParams>({
      query: (params) => {
        const query = new URLSearchParams();
        if (params.limit !== undefined) query.set("limit", String(params.limit));
        if (params.offset !== undefined) query.set("offset", String(params.offset));
        if (params.status && params.status !== "all") query.set("status", params.status);
        if (params.search) query.set("search", params.search);
        const qs = query.toString();
        return `/admin/customers${qs ? `?${qs}` : ""}`;
      },
      providesTags: ["AdminCustomers", "StaffCustomers"],
    }),
    updateCustomerStatus: build.mutation<
      UpdateCustomerStatusResponse,
      UpdateCustomerStatusBody
    >({
      query: (body) => ({
        url: "/admin/customers",
        method: "PATCH",
        body,
      }),
      invalidatesTags: [
        "AdminCustomers",
        "StaffCustomers",
        "StaffAccounts",
        "Accounts",
        "AdminAnalytics",
      ],
    }),
    updateAdminAccountStatus: build.mutation<
      UpdateAdminAccountStatusResponse,
      UpdateAdminAccountStatusBody
    >({
      query: (body) => ({
        url: "/admin/accounts",
        method: "PATCH",
        body,
      }),
      invalidatesTags: [
        "AdminCustomers",
        "StaffCustomers",
        "StaffAccounts",
        "Accounts",
        "AdminAnalytics",
      ],
    }),
    getCustomerTransactions: build.query<
      StaffTransactionsResponse,
      GetCustomerTransactionsParams
    >({
      query: ({ userId, limit = 20, offset = 0, type = "all" }) => {
        const query = new URLSearchParams();
        query.set("userId", userId);
        if (limit) query.set("limit", String(limit));
        if (offset) query.set("offset", String(offset));
        if (type && type !== "all") query.set("type", type);
        return `/admin/customers/transactions?${query.toString()}`;
      },
      providesTags: ["Transactions", "StaffTransactions"],
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
  useGetStaffLoansQuery,
  useUpdateStaffLoanMutation,
  useGetTransactionsQuery,
  useGetStaffTransactionsQuery,
  useFlagTransactionMutation,
  useGetStaffCustomersQuery,
  useRegisterCustomerMutation,
  useVerifyCustomerMutation,
  useGetStaffAccountsQuery,
  useCreateCustomerAccountMutation,
  useUpdateStaffAccountStatusMutation,
  useGetAdminAnalyticsQuery,
  useGetAdminCustomersQuery,
  useUpdateCustomerStatusMutation,
  useUpdateAdminAccountStatusMutation,
  useGetCustomerTransactionsQuery,
} = api;
