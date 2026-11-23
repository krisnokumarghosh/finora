"use client";

import { useState, useId } from "react";
import Link from "next/link";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Clock,
  CheckCircle2,
  XCircle,
  Search,
  X,
  Filter,
  RefreshCw,
  Receipt,
  Landmark,
  ArrowLeft,
  CreditCard,
} from "lucide-react";
import {
  useGetTransactionsQuery,
  type AccountType,
  type UnifiedTransaction,
} from "@/lib/redux/api";

/* ─── Format Money Helper (BDT) ─── */
const formatMoney = (val: number) =>
  `৳${val.toLocaleString("en-BD", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

/* ─── Format Account Number Helper ─── */
const formatAccNo = (no?: string) => {
  if (!no) return "—";
  return no.replace(/(\d{4})/g, "$1 ").trim();
};

export default function TransactionsView() {
  // Filters & Search state
  const [accountType, setAccountType] = useState<string>("all");
  const [transactionType, setTransactionType] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [currentLimit, setCurrentLimit] = useState(15);
  const searchInputId = useId();

  // Reset limit whenever filter or search changes
  const handleAccountTypeChange = (val: string) => {
    setAccountType(val);
    setCurrentLimit(15);
  };

  const handleTransactionTypeChange = (val: string) => {
    setTransactionType(val);
    setCurrentLimit(15);
  };

  const handleSearchChange = (val: string) => {
    setSearch(val);
    setCurrentLimit(15);
  };

  const handleResetFilters = () => {
    setAccountType("all");
    setTransactionType("all");
    setSearch("");
    setCurrentLimit(15);
  };

  // RTK Query: fetch transactions with current limit & filters
  const { data, isLoading, isFetching, refetch } = useGetTransactionsQuery({
    limit: currentLimit,
    offset: 0,
    accountType,
    type: transactionType,
    search: search.trim(),
  });

  const transactions = data?.transactions || [];
  const total = data?.total || 0;
  const hasMore = data?.hasMore || false;

  // Status badge styling helper
  const renderStatusBadge = (status: UnifiedTransaction["status"]) => {
    switch (status) {
      case "approved":
      case "completed":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold capitalize text-emerald-700">
            <CheckCircle2 size={12} />
            {status}
          </span>
        );
      case "pending":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold capitalize text-amber-700">
            <Clock size={12} />
            {status}
          </span>
        );
      case "rejected":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-semibold capitalize text-red-700">
            <XCircle size={12} />
            {status}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center rounded-full bg-black/5 px-2.5 py-0.5 text-xs font-semibold capitalize text-black/60">
            {status}
          </span>
        );
    }
  };

  // Transaction type icon & badge
  const renderTypeIcon = (tx: UnifiedTransaction) => {
    if (tx.status === "rejected") {
      return (
        <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600">
          <XCircle size={16} />
        </div>
      );
    }
    if (tx.status === "pending") {
      return (
        <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
          <Clock size={16} />
        </div>
      );
    }
    if (tx.type === "deposit" || tx.isCredit) {
      return (
        <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
          <ArrowDownLeft size={16} />
        </div>
      );
    }
    return (
      <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#F3F3EE] text-black/70">
        <ArrowUpRight size={16} />
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* ── Page Header ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
          </div>
          <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-black sm:text-4xl">
            All Transactions
          </h1>
          <p className="mt-1 text-sm text-black/60">
            View, filter, and search your complete transaction and fund request history.
          </p>
        </div>

        {/* Quick action: Refresh */}
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="inline-flex h-10 items-center gap-2 self-start rounded-full border border-black/10 bg-white px-4 text-xs font-semibold text-black/70 shadow-sm transition-all hover:border-black/20 hover:text-black disabled:opacity-50 sm:self-center"
        >
          <RefreshCw
            size={14}
            className={isFetching ? "animate-spin text-black" : ""}
          />
          <span>Refresh</span>
        </button>
      </div>

      {/* ── Filters & Search Bar Card ── */}
      <div className="rounded-3xl bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4">
          {/* Top row: Search by Account Number */}
          <div className="relative w-full">
            <Search
              size={18}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-black/40"
            />
            <label htmlFor={searchInputId} className="sr-only">
              Search by account number
            </label>
            <input
              id={searchInputId}
              type="text"
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Search by account number (e.g. 2026...)"
              className="h-12 w-full rounded-2xl bg-[#F3F3EE] pl-11 pr-10 text-sm font-medium text-black outline-none placeholder:text-black/40 focus-visible:ring-2 focus-visible:ring-[#2C2C2C]"
            />
            {search && (
              <button
                type="button"
                onClick={() => handleSearchChange("")}
                aria-label="Clear search input"
                className="absolute right-3.5 top-1/2 -translate-y-1/2 rounded-full p-1 text-black/40 hover:bg-black/5 hover:text-black"
              >
                <X size={16} />
              </button>
            )}
          </div>

          {/* Bottom row: Filter selectors */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            {/* Filter 1: Account Type */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="mr-1 text-xs font-bold text-black/50">
                Account:
              </span>
              {(
                [
                  { label: "All Accounts", value: "all" },
                  { label: "Savings", value: "savings" },
                  { label: "Current", value: "current" },
                  { label: "Business", value: "business" },
                ] as const
              ).map((item) => {
                const isActive = accountType === item.value;
                return (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => handleAccountTypeChange(item.value)}
                    className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-all ${
                      isActive
                        ? "bg-[#2C2C2C] text-white shadow-sm"
                        : "bg-[#F3F3EE] text-black/70 hover:bg-black/10 hover:text-black"
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>

            {/* Filter 2: Transaction Type */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="mr-1 text-xs font-bold text-black/50">
                Type:
              </span>
              {(
                [
                  { label: "All Types", value: "all" },
                  { label: "Transfers", value: "transfer" },
                  { label: "Deposits", value: "deposit" },
                  { label: "Withdrawals", value: "withdrawal" },
                ] as const
              ).map((item) => {
                const isActive = transactionType === item.value;
                return (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => handleTransactionTypeChange(item.value)}
                    className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-all ${
                      isActive
                        ? "bg-[#2C2C2C] text-white shadow-sm"
                        : "bg-[#F3F3EE] text-black/70 hover:bg-black/10 hover:text-black"
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Active Filters Display & Clear Action */}
        {(accountType !== "all" || transactionType !== "all" || search) && (
          <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-black/5 pt-3 text-xs">
            <span className="text-black/50">Active filters:</span>
            {accountType !== "all" && (
              <span className="inline-flex items-center gap-1 rounded-full bg-black/5 px-2.5 py-0.5 font-medium text-black">
                Account: <strong className="capitalize">{accountType}</strong>
                <button
                  type="button"
                  onClick={() => handleAccountTypeChange("all")}
                  aria-label="Remove account type filter"
                  className="hover:text-red-600"
                >
                  <X size={12} />
                </button>
              </span>
            )}
            {transactionType !== "all" && (
              <span className="inline-flex items-center gap-1 rounded-full bg-black/5 px-2.5 py-0.5 font-medium text-black">
                Type: <strong className="capitalize">{transactionType}</strong>
                <button
                  type="button"
                  onClick={() => handleTransactionTypeChange("all")}
                  aria-label="Remove transaction type filter"
                  className="hover:text-red-600"
                >
                  <X size={12} />
                </button>
              </span>
            )}
            {search && (
              <span className="inline-flex items-center gap-1 rounded-full bg-black/5 px-2.5 py-0.5 font-medium text-black">
                Search: <strong>&ldquo;{search}&rdquo;</strong>
                <button
                  type="button"
                  onClick={() => handleSearchChange("")}
                  aria-label="Remove search query filter"
                  className="hover:text-red-600"
                >
                  <X size={12} />
                </button>
              </span>
            )}
            <button
              type="button"
              onClick={handleResetFilters}
              className="ml-auto text-xs font-semibold text-black/60 underline hover:text-black"
            >
              Reset all
            </button>
          </div>
        )}
      </div>

      {/* ── Transactions List Card ── */}
      <div className="rounded-3xl bg-white p-5 shadow-sm sm:p-7">
        {/* Results summary bar */}
        <div className="mb-4 flex items-center justify-between border-b border-black/5 pb-3">
          <div className="flex items-center gap-2">
            <Receipt size={18} className="text-black/50" />
            <h2 className="text-base font-bold text-black sm:text-lg">
              Transaction Records
            </h2>
          </div>
          <span className="text-xs font-semibold text-black/50">
            {isLoading
              ? "Loading..."
              : `Showing ${transactions.length} of ${total}`}
          </span>
        </div>

        {/* Loading Skeleton */}
        {isLoading ? (
          <div className="divide-y divide-black/5">
            {[1, 2, 3, 4, 5].map((idx) => (
              <div
                key={idx}
                className="flex animate-pulse items-center justify-between py-4"
              >
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-xl bg-black/5" />
                  <div className="space-y-1.5">
                    <div className="h-4 w-32 rounded bg-black/5" />
                    <div className="h-3 w-48 rounded bg-black/5" />
                  </div>
                </div>
                <div className="h-5 w-20 rounded bg-black/5" />
              </div>
            ))}
          </div>
        ) : transactions.length === 0 ? (
          /* Empty State */
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-[#F3F3EE] text-black/40">
              <Filter size={24} />
            </div>
            <h3 className="mt-4 text-base font-bold text-black">
              No transactions found
            </h3>
            <p className="mt-1 max-w-sm text-xs text-black/50">
              No transaction records match your selected filters or search
              criteria. Try modifying your search or reset the filters.
            </p>
            {(accountType !== "all" ||
              transactionType !== "all" ||
              search) && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="mt-4 rounded-full bg-[#2C2C2C] px-5 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#E6FB2D] hover:text-[#2C2C2C]"
              >
                Clear all filters
              </button>
            )}
          </div>
        ) : (
          /* Responsive Transactions Display */
          <div>
            {/* Desktop Table View */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-black/5 text-[11px] font-bold uppercase tracking-wider text-black/40">
                    <th className="pb-3 pl-2">Transaction ID & Date</th>
                    <th className="pb-3">Type & Details</th>
                    <th className="pb-3">Account Number</th>
                    <th className="pb-3">Counterpart</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3 pr-2 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5 text-sm">
                  {transactions.map((tx) => (
                    <tr
                      key={tx.id}
                      className="transition-colors hover:bg-black/[0.015]"
                    >
                      {/* 1. Transaction ID & Date */}
                      <td className="py-4 pl-2">
                        <div className="flex items-center gap-3">
                          {renderTypeIcon(tx)}
                          <div>
                            <span className="font-mono text-xs font-bold text-black">
                              {tx.transactionId}
                            </span>
                            <p className="text-[11px] text-black/40">
                              {new Date(tx.createdAt).toLocaleDateString(
                                "en-US",
                                {
                                  day: "2-digit",
                                  month: "short",
                                  year: "numeric",
                                }
                              )}{" "}
                              ·{" "}
                              {new Date(tx.createdAt).toLocaleTimeString(
                                "en-US",
                                {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                }
                              )}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* 2. Type & Description */}
                      <td className="py-4">
                        <div className="max-w-[200px]">
                          <p className="truncate text-xs font-bold capitalize text-black">
                            {tx.type === "transfer"
                              ? tx.isCredit
                                ? "Incoming Transfer"
                                : "Outgoing Transfer"
                              : `${tx.type} Request`}
                          </p>
                          <p className="truncate text-[11px] text-black/50">
                            {tx.description}
                          </p>
                        </div>
                      </td>

                      {/* 3. Account Number & Type */}
                      <td className="py-4">
                        <div>
                          <p className="font-mono text-xs font-medium text-black">
                            {formatAccNo(tx.accountNumber)}
                          </p>
                          <span className="inline-block rounded bg-black/5 px-1.5 py-0.2 text-[10px] font-semibold capitalize text-black/60">
                            {tx.accountType}
                          </span>
                        </div>
                      </td>

                      {/* 4. Counterpart */}
                      <td className="py-4">
                        {tx.counterpartAccountNumber ? (
                          <div>
                            <p className="text-xs font-medium text-black">
                              {tx.counterpartName || "External Account"}
                            </p>
                            <p className="font-mono text-[11px] text-black/40">
                              •••• {tx.counterpartAccountNumber.slice(-4)}
                            </p>
                          </div>
                        ) : (
                          <span className="text-xs text-black/30">—</span>
                        )}
                      </td>

                      {/* 5. Status Badge */}
                      <td className="py-4">{renderStatusBadge(tx.status)}</td>

                      {/* 6. Amount */}
                      <td className="py-4 pr-2 text-right">
                        <span
                          className={`text-sm font-bold ${
                            tx.status === "rejected"
                              ? "text-black/30 line-through"
                              : tx.isCredit
                              ? "text-emerald-700"
                              : "text-black"
                          }`}
                        >
                          {tx.isCredit ? "+" : "-"}
                          {formatMoney(tx.amount)}
                        </span>
                        {typeof tx.balanceAfter === "number" && (
                          <p className="text-[10px] text-black/40">
                            Bal: {formatMoney(tx.balanceAfter)}
                          </p>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile / Tablet Card View */}
            <div className="space-y-3 lg:hidden">
              {transactions.map((tx) => (
                <div
                  key={tx.id}
                  className="rounded-2xl border border-black/5 bg-[#F9F9F7] p-4 transition-all"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      {renderTypeIcon(tx)}
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="truncate text-sm font-bold text-black">
                            {tx.type === "transfer"
                              ? tx.isCredit
                                ? "Incoming Transfer"
                                : "Outgoing Transfer"
                              : `${tx.type} Request`}
                          </p>
                        </div>
                        <p className="text-xs text-black/50">
                          {tx.description}
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span
                        className={`text-sm font-bold ${
                          tx.status === "rejected"
                            ? "text-black/30 line-through"
                            : tx.isCredit
                            ? "text-emerald-700"
                            : "text-black"
                        }`}
                      >
                        {tx.isCredit ? "+" : "-"}
                        {formatMoney(tx.amount)}
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-black/5 pt-2.5 text-xs text-black/50">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[11px] font-semibold text-black/70">
                        •••• {tx.accountNumber.slice(-4)}
                      </span>
                      <span className="rounded bg-black/5 px-1.5 py-0.2 text-[10px] font-semibold capitalize text-black/60">
                        {tx.accountType}
                      </span>
                      {tx.counterpartAccountNumber && (
                        <span className="text-[11px] text-black/40">
                          {tx.isCredit ? "From" : "To"}:{" "}
                          {tx.counterpartName || "Account"}
                        </span>
                      )}
                    </div>
                    <div>{renderStatusBadge(tx.status)}</div>
                  </div>

                  <div className="mt-1 flex items-center justify-between text-[11px] text-black/40">
                    <span className="font-mono">{tx.transactionId}</span>
                    <span>
                      {new Date(tx.createdAt).toLocaleDateString("en-US", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Load More Section ── */}
        <div className="mt-8 flex flex-col items-center justify-center border-t border-black/5 pt-6 text-center">
          {hasMore ? (
            <div className="flex flex-col items-center gap-2">
              <button
                type="button"
                onClick={() => setCurrentLimit((prev) => prev + 15)}
                disabled={isFetching}
                className="inline-flex h-12 min-w-[200px] items-center justify-center gap-2 rounded-full bg-[#2C2C2C] px-8 text-sm font-semibold text-white shadow-sm transition-colors duration-200 hover:bg-[#E6FB2D] hover:text-[#2C2C2C] disabled:opacity-50"
              >
                {isFetching ? (
                  <>
                    <RefreshCw size={16} className="animate-spin" />
                    <span>Loading more...</span>
                  </>
                ) : (
                  <span>Load More (15 more)</span>
                )}
              </button>
              <p className="text-xs text-black/40">
                Showing {transactions.length} of {total} total transactions
              </p>
            </div>
          ) : total > 0 ? (
            <p className="text-xs font-semibold text-black/40">
              All {total} transactions loaded
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
