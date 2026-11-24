"use client";

import { useEffect, useId, useState, type ReactNode } from "react";
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
  Flag,
  ShieldAlert,
  Eye,
  CalendarDays,
  AlertTriangle,
  User,
  Landmark,
} from "lucide-react";
import {
  useGetStaffTransactionsQuery,
  useFlagTransactionMutation,
  type StaffTransaction,
} from "@/lib/redux/api";
import { successToast, errorToast } from "@/lib/utils/toasts";

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

const formatDateTime = (iso: string) => {
  const date = new Date(iso);
  return {
    date: date.toLocaleDateString("en-US", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }),
    time: date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    }),
  };
};

const capitalise = (value: string) =>
  value.charAt(0).toUpperCase() + value.slice(1);

const getApiError = (err: unknown, fallback: string) => {
  if (err && typeof err === "object" && "data" in err) {
    const data = (err as { data?: { error?: string } }).data;
    if (data?.error) return data.error;
  }
  return fallback;
};

const getTypeLabel = (tx: StaffTransaction) => {
  if (tx.type === "transfer") {
    return tx.isCredit ? "Incoming Transfer" : "Outgoing Transfer";
  }
  return `${capitalise(tx.type)} Request`;
};

export default function StaffTransactionsView() {
  // Filters & search state
  const [transactionType, setTransactionType] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [flaggedOnly, setFlaggedOnly] = useState(false);
  const [currentLimit, setCurrentLimit] = useState(15);
  const searchInputId = useId();

  // Review / flag modal state
  const [reviewTarget, setReviewTarget] = useState<StaffTransaction | null>(
    null
  );
  const [flagTarget, setFlagTarget] = useState<StaffTransaction | null>(null);
  const [flagReason, setFlagReason] = useState("");
  const [flagError, setFlagError] = useState("");

  const [flagTransaction, { isLoading: isFlagging }] =
    useFlagTransactionMutation();

  const dateRangeInvalid = Boolean(dateFrom && dateTo && dateFrom > dateTo);

  // Reset limit whenever a filter or search changes
  const handleTypeChange = (val: string) => {
    setTransactionType(val);
    setCurrentLimit(15);
  };

  const handleStatusChange = (val: string) => {
    setStatusFilter(val);
    setCurrentLimit(15);
  };

  const handleSearchChange = (val: string) => {
    setSearch(val);
    setCurrentLimit(15);
  };

  const handleDateFromChange = (val: string) => {
    setDateFrom(val);
    setCurrentLimit(15);
  };

  const handleDateToChange = (val: string) => {
    setDateTo(val);
    setCurrentLimit(15);
  };

  const toggleFlaggedOnly = () => {
    setFlaggedOnly((prev) => !prev);
    setCurrentLimit(15);
  };

  const handleResetFilters = () => {
    setTransactionType("all");
    setStatusFilter("all");
    setSearch("");
    setDateFrom("");
    setDateTo("");
    setFlaggedOnly(false);
    setCurrentLimit(15);
  };

  // RTK Query: fetch every customer's transactions with the active filters
  const { data, isLoading, isFetching, refetch } = useGetStaffTransactionsQuery(
    {
      limit: currentLimit,
      offset: 0,
      type: transactionType,
      status: statusFilter,
      search: search.trim(),
      dateFrom,
      dateTo,
      flagged: flaggedOnly ? "flagged" : "all",
    }
  );

  const transactions = data?.transactions || [];
  const total = data?.total || 0;
  const hasMore = data?.hasMore || false;

  // Close modal on Escape and lock page scroll while a modal is open
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (flagTarget) {
        setFlagTarget(null);
      } else {
        setReviewTarget(null);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [flagTarget]);

  useEffect(() => {
    if (!reviewTarget && !flagTarget) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [reviewTarget, flagTarget]);

  const openFlagModal = (tx: StaffTransaction) => {
    setFlagTarget(tx);
    setFlagReason(tx.flag?.reason ?? "");
    setFlagError("");
  };

  const closeFlagModal = () => {
    if (isFlagging) return;
    setFlagTarget(null);
    setFlagError("");
  };

  const submitFlag = async () => {
    if (!flagTarget) return;

    const reason = flagReason.trim();
    if (reason.length < 3) {
      setFlagError("Please write a short reason for flagging this transaction.");
      return;
    }

    setFlagError("");

    try {
      const res = await flagTransaction({
        transactionId: flagTarget.transactionId,
        action: "flag",
        reason,
      }).unwrap();

      successToast(res.message || "Transaction flagged for admin review.");
      setReviewTarget((prev) =>
        prev && prev.transactionId === flagTarget.transactionId
          ? { ...prev, flag: res.flag }
          : prev
      );
      setFlagTarget(null);
    } catch (err: unknown) {
      const message = getApiError(err, "Failed to flag transaction.");
      setFlagError(message);
      errorToast(message);
    }
  };

  const removeFlag = async () => {
    if (!flagTarget) return;

    setFlagError("");

    try {
      const res = await flagTransaction({
        transactionId: flagTarget.transactionId,
        action: "unflag",
      }).unwrap();

      successToast(res.message || "Suspicious transaction flag removed.");
      setReviewTarget((prev) =>
        prev && prev.transactionId === flagTarget.transactionId
          ? { ...prev, flag: null }
          : prev
      );
      setFlagTarget(null);
    } catch (err: unknown) {
      const message = getApiError(err, "Failed to remove the flag.");
      setFlagError(message);
      errorToast(message);
    }
  };

  // Status badge styling helper
  const renderStatusBadge = (status: StaffTransaction["status"]) => {
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

  const renderFlagBadge = (flag: StaffTransaction["flag"]) => {
    if (!flag) return null;
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-semibold text-red-700">
        <ShieldAlert size={12} />
        Flagged
      </span>
    );
  };

  // Transaction type icon
  const renderTypeIcon = (tx: StaffTransaction) => {
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

  const hasActiveFilters =
    transactionType !== "all" ||
    statusFilter !== "all" ||
    search !== "" ||
    dateFrom !== "" ||
    dateTo !== "" ||
    flaggedOnly;

  return (
    <div className="space-y-6">
      {/* ── Page Header ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-black sm:text-4xl">
            All Transactions
          </h1>
          <p className="mt-1 text-sm text-black/60">
            Monitor, search, and review transactions across all customer
            accounts.
          </p>
        </div>

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
          {/* Top row: Search by transaction ID */}
          <div className="relative w-full">
            <Search
              size={18}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-black/40"
            />
            <label htmlFor={searchInputId} className="sr-only">
              Search by transaction ID
            </label>
            <input
              id={searchInputId}
              type="text"
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Search by transaction ID (e.g. TXN...)"
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

          {/* Middle row: Type & Status filters */}
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
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
                    onClick={() => handleTypeChange(item.value)}
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

            <div className="flex flex-wrap items-center gap-1.5">
              <span className="mr-1 text-xs font-bold text-black/50">
                Status:
              </span>
              {(
                [
                  { label: "All Status", value: "all" },
                  { label: "Pending", value: "pending" },
                  { label: "Completed", value: "completed" },
                  { label: "Approved", value: "approved" },
                  { label: "Rejected", value: "rejected" },
                ] as const
              ).map((item) => {
                const isActive = statusFilter === item.value;
                return (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => handleStatusChange(item.value)}
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

          {/* Bottom row: Date range + flagged-only toggle */}
          <div className="grid gap-3 border-t border-black/5 pt-4 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_auto] lg:items-end">
            <div>
              <label
                htmlFor="staff-transactions-date-from"
                className="mb-1.5 flex items-center gap-1.5 text-xs font-bold text-black/50"
              >
                <CalendarDays size={13} />
                From date
              </label>
              <input
                id="staff-transactions-date-from"
                type="date"
                value={dateFrom}
                max={dateTo || undefined}
                onChange={(e) => handleDateFromChange(e.target.value)}
                className="h-11 w-full rounded-2xl bg-[#F3F3EE] px-4 text-sm font-medium text-black outline-none focus-visible:ring-2 focus-visible:ring-[#2C2C2C]"
              />
            </div>

            <div>
              <label
                htmlFor="staff-transactions-date-to"
                className="mb-1.5 flex items-center gap-1.5 text-xs font-bold text-black/50"
              >
                <CalendarDays size={13} />
                To date
              </label>
              <input
                id="staff-transactions-date-to"
                type="date"
                value={dateTo}
                min={dateFrom || undefined}
                onChange={(e) => handleDateToChange(e.target.value)}
                className="h-11 w-full rounded-2xl bg-[#F3F3EE] px-4 text-sm font-medium text-black outline-none focus-visible:ring-2 focus-visible:ring-[#2C2C2C]"
              />
            </div>

            <button
              type="button"
              onClick={toggleFlaggedOnly}
              aria-pressed={flaggedOnly}
              className={`inline-flex h-11 items-center justify-center gap-2 self-end rounded-full px-4 text-xs font-semibold transition-all ${
                flaggedOnly
                  ? "bg-red-600 text-white shadow-sm hover:bg-red-700"
                  : "bg-[#F3F3EE] text-black/70 hover:bg-black/10 hover:text-black"
              }`}
            >
              <ShieldAlert size={14} />
              Flagged only
            </button>
          </div>

          {dateRangeInvalid && (
            <p className="flex items-center gap-1.5 text-xs font-medium text-red-600">
              <AlertTriangle size={13} />
              The &ldquo;From&rdquo; date cannot be after the &ldquo;To&rdquo;
              date.
            </p>
          )}
        </div>

        {/* Active Filters Display & Clear Action */}
        {hasActiveFilters && (
          <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-black/5 pt-3 text-xs">
            <span className="text-black/50">Active filters:</span>
            {transactionType !== "all" && (
              <span className="inline-flex items-center gap-1 rounded-full bg-black/5 px-2.5 py-0.5 font-medium text-black">
                Type: <strong className="capitalize">{transactionType}</strong>
                <button
                  type="button"
                  onClick={() => handleTypeChange("all")}
                  aria-label="Remove transaction type filter"
                  className="hover:text-red-600"
                >
                  <X size={12} />
                </button>
              </span>
            )}
            {statusFilter !== "all" && (
              <span className="inline-flex items-center gap-1 rounded-full bg-black/5 px-2.5 py-0.5 font-medium text-black">
                Status: <strong className="capitalize">{statusFilter}</strong>
                <button
                  type="button"
                  onClick={() => handleStatusChange("all")}
                  aria-label="Remove status filter"
                  className="hover:text-red-600"
                >
                  <X size={12} />
                </button>
              </span>
            )}
            {dateFrom && (
              <span className="inline-flex items-center gap-1 rounded-full bg-black/5 px-2.5 py-0.5 font-medium text-black">
                From: <strong>{dateFrom}</strong>
                <button
                  type="button"
                  onClick={() => handleDateFromChange("")}
                  aria-label="Remove from date filter"
                  className="hover:text-red-600"
                >
                  <X size={12} />
                </button>
              </span>
            )}
            {dateTo && (
              <span className="inline-flex items-center gap-1 rounded-full bg-black/5 px-2.5 py-0.5 font-medium text-black">
                To: <strong>{dateTo}</strong>
                <button
                  type="button"
                  onClick={() => handleDateToChange("")}
                  aria-label="Remove to date filter"
                  className="hover:text-red-600"
                >
                  <X size={12} />
                </button>
              </span>
            )}
            {flaggedOnly && (
              <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-0.5 font-medium text-red-700">
                Flagged only
                <button
                  type="button"
                  onClick={toggleFlaggedOnly}
                  aria-label="Remove flagged filter"
                  className="hover:text-red-900"
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

        {statusFilter === "pending" && (
          <div className="mb-4 flex items-start gap-2 rounded-2xl bg-amber-50 p-3.5 text-xs text-amber-800">
            <AlertTriangle size={15} className="mt-0.5 shrink-0" />
            <span>
              These records are waiting for review. Open a transaction to
              inspect the details and flag anything suspicious for admin
              review.
            </span>
          </div>
        )}

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
          /* Empty state */
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-[#F3F3EE] text-black/40">
              <Filter size={24} />
            </div>
            <h3 className="mt-4 text-base font-bold text-black">
              No transactions found
            </h3>
            <p className="mt-1 max-w-sm text-xs text-black/50">
              No customer transactions match your selected filters or
              transaction ID. Try changing the search or reset the filters.
            </p>
            {hasActiveFilters && (
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
          <div>
            {/* Desktop table view */}
            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-black/5 text-[11px] font-bold uppercase tracking-wider text-black/40">
                    <th className="pb-3 pl-2">Transaction ID & Date</th>
                    <th className="pb-3">Type & Details</th>
                    <th className="pb-3">Customer & Account</th>
                    <th className="pb-3">Counterpart</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3 text-right">Amount</th>
                    <th className="pb-3 pr-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5 text-sm">
                  {transactions.map((tx) => {
                    const when = formatDateTime(tx.createdAt);

                    return (
                      <tr
                        key={`${tx.type}-${tx.id}`}
                        className="transition-colors hover:bg-black/2"
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
                                {when.date} · {when.time}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* 2. Type & Description */}
                        <td className="py-4">
                          <div className="max-w-50">
                            <p className="truncate text-xs font-bold capitalize text-black">
                              {getTypeLabel(tx)}
                            </p>
                            <p className="truncate text-[11px] text-black/50">
                              {tx.description}
                            </p>
                          </div>
                        </td>

                        {/* 3. Customer & Account */}
                        <td className="py-4">
                          <div>
                            <p className="max-w-40 truncate text-xs font-semibold text-black">
                              {tx.accountName || "—"}
                            </p>
                            <p className="font-mono text-[11px] text-black/50">
                              {formatAccNo(tx.accountNumber)}
                            </p>
                            <span className="mt-0.5 inline-block rounded bg-black/5 px-1.5 py-0.2 text-[10px] font-semibold capitalize text-black/60">
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

                        {/* 5. Status & Flag */}
                        <td className="py-4">
                          <div className="flex flex-col items-start gap-1.5">
                            {renderStatusBadge(tx.status)}
                            {renderFlagBadge(tx.flag)}
                          </div>
                        </td>

                        {/* 6. Amount */}
                        <td className="py-4 text-right">
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

                        {/* 7. Actions */}
                        <td className="py-4 pr-2">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => setReviewTarget(tx)}
                              aria-label={`Review transaction ${tx.transactionId}`}
                              className="inline-flex h-8 items-center gap-1.5 rounded-full border border-black/10 bg-white px-3 text-[11px] font-semibold text-black/70 transition-colors hover:border-black/20 hover:text-black"
                            >
                              <Eye size={13} />
                              Review
                            </button>
                            <button
                              type="button"
                              onClick={() => openFlagModal(tx)}
                              aria-label={
                                tx.flag
                                  ? `Remove flag from ${tx.transactionId}`
                                  : `Flag ${tx.transactionId} for admin review`
                              }
                              className={`inline-flex size-8 items-center justify-center rounded-full border transition-colors ${
                                tx.flag
                                  ? "border-red-200 bg-red-50 text-red-600 hover:bg-red-100"
                                  : "border-black/10 bg-white text-black/50 hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                              }`}
                            >
                              <Flag size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile / tablet card view */}
            <div className="space-y-3 lg:hidden">
              {transactions.map((tx) => {
                const when = formatDateTime(tx.createdAt);

                return (
                  <div
                    key={`${tx.type}-${tx.id}`}
                    className="rounded-2xl border border-black/5 bg-[#F9F9F7] p-4 transition-all"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        {renderTypeIcon(tx)}
                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold text-black">
                            {getTypeLabel(tx)}
                          </p>
                          <p className="text-xs text-black/50">
                            {tx.description}
                          </p>
                        </div>
                      </div>

                      <div className="shrink-0 text-right">
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
                      <div className="flex items-center gap-1.5">
                        {renderStatusBadge(tx.status)}
                        {renderFlagBadge(tx.flag)}
                      </div>
                    </div>

                    <p className="mt-1 text-[11px] font-medium text-black/60">
                      {tx.accountName || "—"}
                    </p>

                    <div className="mt-1 flex items-center justify-between text-[11px] text-black/40">
                      <span className="font-mono">{tx.transactionId}</span>
                      <span>
                        {when.date} · {when.time}
                      </span>
                    </div>

                    <div className="mt-3 flex items-center gap-2 border-t border-black/5 pt-3">
                      <button
                        type="button"
                        onClick={() => setReviewTarget(tx)}
                        className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-full border border-black/10 bg-white text-xs font-semibold text-black/70 transition-colors hover:border-black/20 hover:text-black"
                      >
                        <Eye size={14} />
                        Review
                      </button>
                      <button
                        type="button"
                        onClick={() => openFlagModal(tx)}
                        className={`inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-full border text-xs font-semibold transition-colors ${
                          tx.flag
                            ? "border-red-200 bg-red-50 text-red-600 hover:bg-red-100"
                            : "border-black/10 bg-white text-black/60 hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                        }`}
                      >
                        <Flag size={14} />
                        {tx.flag ? "Remove flag" : "Flag"}
                      </button>
                    </div>
                  </div>
                );
              })}
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
                className="inline-flex h-12 min-w-50 items-center justify-center gap-2 rounded-full bg-[#2C2C2C] px-8 text-sm font-semibold text-white shadow-sm transition-colors duration-200 hover:bg-[#E6FB2D] hover:text-[#2C2C2C] disabled:opacity-50"
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

      {/* ── Transaction Review Modal ── */}
      {reviewTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
          onMouseDown={() => setReviewTarget(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="staff-review-title"
            onMouseDown={(e) => e.stopPropagation()}
            className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white p-5 shadow-2xl sm:p-6"
          >
            <div className="flex items-center justify-between border-b border-black/5 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="flex size-9 items-center justify-center rounded-xl bg-[#F3F3EE] text-black">
                  <Receipt size={18} />
                </div>
                <div>
                  <h3
                    id="staff-review-title"
                    className="text-base font-bold text-black"
                  >
                    Transaction Review
                  </h3>
                  <p className="font-mono text-[11px] text-black/40">
                    {reviewTarget.transactionId}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setReviewTarget(null)}
                aria-label="Close transaction review"
                className="rounded-full p-1 text-black/40 hover:bg-black/5 hover:text-black"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-4 space-y-4">
              {reviewTarget.status === "pending" && (
                <div className="flex items-start gap-2 rounded-2xl bg-amber-50 p-3.5 text-xs text-amber-800">
                  <Clock size={15} className="mt-0.5 shrink-0" />
                  <span>
                    This transaction is pending review. Check the customer,
                    account, and amount details carefully. If anything looks
                    suspicious, flag it for admin review.
                  </span>
                </div>
              )}

              {reviewTarget.flag && (
                <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
                  <div className="flex items-center gap-2 text-sm font-bold text-red-700">
                    <ShieldAlert size={16} />
                    Flagged for admin review
                  </div>
                  <p className="mt-2 text-xs text-red-800">
                    {reviewTarget.flag.reason}
                  </p>
                  <p className="mt-2 text-[11px] text-red-700/70">
                    Flagged by {reviewTarget.flag.flaggedByName} ·{" "}
                    {formatDateTime(reviewTarget.flag.createdAt).date}
                  </p>
                </div>
              )}

              <div className="rounded-2xl bg-[#F9F9F7] p-4">
                <div className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
                  <DetailRow
                    icon={<Receipt size={13} />}
                    label="Transaction ID"
                    value={reviewTarget.transactionId}
                    mono
                  />
                  <DetailRow
                    icon={<CalendarDays size={13} />}
                    label="Date & Time"
                    value={`${formatDateTime(reviewTarget.createdAt).date} · ${
                      formatDateTime(reviewTarget.createdAt).time
                    }`}
                  />
                  <DetailRow
                    icon={<ArrowUpRight size={13} />}
                    label="Type"
                    value={getTypeLabel(reviewTarget)}
                  />
                  <DetailRow
                    icon={<Clock size={13} />}
                    label="Status"
                    value={capitalise(reviewTarget.status)}
                  />
                  <DetailRow
                    icon={<User size={13} />}
                    label="Customer"
                    value={reviewTarget.accountName || "—"}
                  />
                  <DetailRow
                    icon={<Landmark size={13} />}
                    label="Account"
                    value={`${formatAccNo(reviewTarget.accountNumber)} (${
                      reviewTarget.accountType
                    })`}
                    mono
                  />
                  <DetailRow
                    icon={<ArrowDownLeft size={13} />}
                    label="Amount"
                    value={`${reviewTarget.isCredit ? "+" : "-"}${formatMoney(
                      reviewTarget.amount
                    )}`}
                  />
                  <DetailRow
                    icon={<Receipt size={13} />}
                    label="Fee"
                    value={formatMoney(reviewTarget.fee || 0)}
                  />
                  {typeof reviewTarget.balanceAfter === "number" && (
                    <DetailRow
                      icon={<Landmark size={13} />}
                      label="Balance After"
                      value={formatMoney(reviewTarget.balanceAfter)}
                    />
                  )}
                  {reviewTarget.counterpartAccountNumber && (
                    <DetailRow
                      icon={<User size={13} />}
                      label="Counterpart"
                      value={`${
                        reviewTarget.counterpartName || "External Account"
                      } · •••• ${reviewTarget.counterpartAccountNumber.slice(
                        -4
                      )}`}
                    />
                  )}
                  <div className="sm:col-span-2">
                    <DetailRow
                      icon={<Receipt size={13} />}
                      label="Description"
                      value={reviewTarget.description}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 flex flex-col-reverse gap-3 border-t border-black/5 pt-4 sm:flex-row sm:items-center sm:justify-end">
              <button
                type="button"
                onClick={() => setReviewTarget(null)}
                className="h-10 rounded-full border border-black/10 bg-white px-5 text-xs font-semibold text-black/70 transition-colors hover:border-black/20 hover:text-black"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => openFlagModal(reviewTarget)}
                className={`inline-flex h-10 items-center justify-center gap-2 rounded-full px-5 text-xs font-semibold shadow-sm transition-colors ${
                  reviewTarget.flag
                    ? "bg-red-600 text-white hover:bg-red-700"
                    : "bg-[#2C2C2C] text-white hover:bg-[#E6FB2D] hover:text-[#2C2C2C]"
                }`}
              >
                <Flag size={14} />
                {reviewTarget.flag
                  ? "Remove flag"
                  : "Flag for admin review"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Flag Suspicious Transaction Modal ── */}
      {flagTarget && (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
          onMouseDown={closeFlagModal}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="staff-flag-title"
            onMouseDown={(e) => e.stopPropagation()}
            className="max-h-[92vh] w-full max-w-md overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-black/5 pb-4">
              <div className="flex items-center gap-2.5">
                <div
                  className={`flex size-9 items-center justify-center rounded-xl ${
                    flagTarget.flag
                      ? "bg-emerald-50 text-emerald-600"
                      : "bg-red-50 text-red-600"
                  }`}
                >
                  {flagTarget.flag ? (
                    <CheckCircle2 size={18} />
                  ) : (
                    <ShieldAlert size={18} />
                  )}
                </div>
                <div>
                  <h3
                    id="staff-flag-title"
                    className="text-base font-bold text-black"
                  >
                    {flagTarget.flag
                      ? "Remove Suspicious Flag"
                      : "Flag Suspicious Transaction"}
                  </h3>
                  <p className="font-mono text-[11px] text-black/40">
                    {flagTarget.transactionId}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={closeFlagModal}
                disabled={isFlagging}
                aria-label="Close flag dialog"
                className="rounded-full p-1 text-black/40 hover:bg-black/5 hover:text-black disabled:opacity-50"
              >
                <X size={18} />
              </button>
            </div>

            {flagTarget.flag ? (
              <div className="mt-4 space-y-3">
                <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-xs text-red-800">
                  <p className="font-semibold">Current flag reason</p>
                  <p className="mt-1">{flagTarget.flag.reason}</p>
                  <p className="mt-2 text-[11px] text-red-700/70">
                    Flagged by {flagTarget.flag.flaggedByName} ·{" "}
                    {formatDateTime(flagTarget.flag.createdAt).date}
                  </p>
                </div>
                <p className="text-xs text-black/50">
                  Removing the flag tells the admin team this transaction no
                  longer needs investigation.
                </p>
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                <p className="text-xs text-black/60">
                  This transaction will be sent to the admin review queue. Add
                  a short reason so the admin understands what looks
                  suspicious.
                </p>

                <div>
                  <label
                    htmlFor="staff-flag-reason"
                    className="mb-1.5 block text-xs font-bold text-black/60"
                  >
                    Reason for flagging
                  </label>
                  <textarea
                    id="staff-flag-reason"
                    value={flagReason}
                    onChange={(e) => {
                      setFlagReason(e.target.value);
                      if (flagError) setFlagError("");
                    }}
                    rows={3}
                    maxLength={250}
                    placeholder="e.g. Unusually large amount for this account"
                    className="w-full resize-none rounded-2xl bg-[#F3F3EE] p-3.5 text-sm text-black outline-none placeholder:text-black/40 focus-visible:ring-2 focus-visible:ring-[#2C2C2C]"
                  />
                  <p className="mt-1 text-right text-[10px] text-black/40">
                    {flagReason.length}/250
                  </p>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {[
                    "Unusually large amount",
                    "Multiple rapid transfers",
                    "Mismatched account details",
                    "Possible fraud",
                  ].map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      onClick={() => {
                        setFlagReason(suggestion);
                        setFlagError("");
                      }}
                      className="rounded-full bg-[#F3F3EE] px-2.5 py-1 text-[11px] font-semibold text-black/60 transition-colors hover:bg-black/10 hover:text-black"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {flagError && (
              <div className="mt-3 rounded-xl bg-red-50 p-2.5 text-xs text-red-600">
                {flagError}
              </div>
            )}

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={closeFlagModal}
                disabled={isFlagging}
                className="h-10 rounded-full border border-black/10 bg-white px-5 text-xs font-semibold text-black/70 transition-colors hover:border-black/20 hover:text-black disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={flagTarget.flag ? removeFlag : submitFlag}
                disabled={isFlagging}
                className={`inline-flex h-10 items-center justify-center gap-2 rounded-full px-5 text-xs font-semibold text-white shadow-sm transition-colors disabled:opacity-50 ${
                  flagTarget.flag
                    ? "bg-emerald-600 hover:bg-emerald-700"
                    : "bg-red-600 hover:bg-red-700"
                }`}
              >
                {isFlagging ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : flagTarget.flag ? (
                  <>
                    <CheckCircle2 size={14} />
                    <span>Remove Flag</span>
                  </>
                ) : (
                  <>
                    <Flag size={14} />
                    <span>Flag Transaction</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Small label/value row used inside the review modal ─── */
function DetailRow({
  icon,
  label,
  value,
  mono = false,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div>
      <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-black/40">
        {icon}
        {label}
      </p>
      <p
        className={`mt-0.5 wrap-break-word text-sm font-semibold text-black ${
          mono ? "font-mono text-xs" : ""
        }`}
      >
        {value}
      </p>
    </div>
  );
}
