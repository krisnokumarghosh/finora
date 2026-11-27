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
  ShieldAlert,
  Eye,
  CalendarDays,
  AlertTriangle,
  User,
  Landmark,
  ChevronDown,
} from "lucide-react";
import {
  useGetAdminTransactionsQuery,
  useUpdateAdminTransactionStatusMutation,
  type StaffTransaction,
} from "@/lib/redux/api";
import { successToast, errorToast } from "@/lib/utils/toasts";
import DashboardPageHeader from "@/components/dashboard/DashboardPageHeader";

const formatMoney = (val: number) =>
  `৳${val.toLocaleString("en-BD", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

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

type AllowedStatus = "pending" | "approved" | "rejected" | "completed";

const STATUS_OPTIONS: { label: string; value: AllowedStatus }[] = [
  { label: "Pending", value: "pending" },
  { label: "Approved", value: "approved" },
  { label: "Rejected", value: "rejected" },
  { label: "Completed", value: "completed" },
];

export default function AdminTransactionsView() {
  const [transactionType, setTransactionType] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("pending");
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [currentLimit, setCurrentLimit] = useState(15);
  const searchInputId = useId();

  const [reviewTarget, setReviewTarget] = useState<StaffTransaction | null>(
    null
  );
  const [changeStatusTarget, setChangeStatusTarget] =
    useState<StaffTransaction | null>(null);
  const [selectedNewStatus, setSelectedNewStatus] =
    useState<AllowedStatus>("approved");
  const [statusError, setStatusError] = useState("");

  const [updateStatus, { isLoading: isUpdating }] =
    useUpdateAdminTransactionStatusMutation();

  const dateRangeInvalid = Boolean(dateFrom && dateTo && dateFrom > dateTo);

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
  const handleResetFilters = () => {
    setTransactionType("all");
    setStatusFilter("pending");
    setSearch("");
    setDateFrom("");
    setDateTo("");
    setCurrentLimit(15);
  };

  const { data, isLoading, isFetching, refetch } =
    useGetAdminTransactionsQuery({
      limit: currentLimit,
      offset: 0,
      type: transactionType,
      status: statusFilter,
      search: search.trim(),
      dateFrom,
      dateTo,
    });

  const transactions = data?.transactions || [];
  const total = data?.total || 0;
  const hasMore = data?.hasMore || false;

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (changeStatusTarget) setChangeStatusTarget(null);
      else setReviewTarget(null);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [changeStatusTarget]);

  useEffect(() => {
    if (!reviewTarget && !changeStatusTarget) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [reviewTarget, changeStatusTarget]);

  const openChangeStatus = (tx: StaffTransaction) => {
    setChangeStatusTarget(tx);
    setSelectedNewStatus(tx.status as AllowedStatus);
    setStatusError("");
  };
  const closeChangeStatus = () => {
    if (isUpdating) return;
    setChangeStatusTarget(null);
    setStatusError("");
  };

  const submitStatusChange = async () => {
    if (!changeStatusTarget) return;
    setStatusError("");
    try {
      const res = await updateStatus({
        transactionId: changeStatusTarget.transactionId,
        status: selectedNewStatus,
      }).unwrap();
      successToast(res.message || "Transaction status updated.");
      setChangeStatusTarget(null);
    } catch (err: unknown) {
      const msg = getApiError(err, "Failed to update transaction status.");
      setStatusError(msg);
      errorToast(msg);
    }
  };

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
    statusFilter !== "pending" ||
    search !== "" ||
    dateFrom !== "" ||
    dateTo !== "";

  return (
    <div className="space-y-5 sm:space-y-6">
      <DashboardPageHeader
        eyebrow="Admin"
        title="All Transactions"
        description="Monitor, search, review, and change the status of transactions across all customer accounts."
        actions={
          <button
            type="button"
            onClick={() => refetch()}
            disabled={isFetching}
            className="inline-flex h-10 items-center gap-2 rounded-full border border-black/10 bg-white px-4 text-xs font-semibold text-black/70 shadow-sm transition-all hover:border-black/20 hover:text-black disabled:opacity-50"
          >
            <RefreshCw
              size={14}
              className={isFetching ? "animate-spin text-black" : ""}
            />
            <span>Refresh</span>
          </button>
        }
      />

      <div className="rounded-2xl bg-white p-4 shadow-sm sm:rounded-3xl sm:p-6">
        <div className="flex flex-col gap-4">
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

          <div className="grid gap-3 border-t border-black/5 pt-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="admin-transactions-date-from"
                className="mb-1.5 flex items-center gap-1.5 text-xs font-bold text-black/50"
              >
                <CalendarDays size={13} />
                From date
              </label>
              <input
                id="admin-transactions-date-from"
                type="date"
                value={dateFrom}
                max={dateTo || undefined}
                onChange={(e) => handleDateFromChange(e.target.value)}
                className="h-11 w-full rounded-2xl bg-[#F3F3EE] px-4 text-sm font-medium text-black outline-none focus-visible:ring-2 focus-visible:ring-[#2C2C2C]"
              />
            </div>
            <div>
              <label
                htmlFor="admin-transactions-date-to"
                className="mb-1.5 flex items-center gap-1.5 text-xs font-bold text-black/50"
              >
                <CalendarDays size={13} />
                To date
              </label>
              <input
                id="admin-transactions-date-to"
                type="date"
                value={dateTo}
                min={dateFrom || undefined}
                onChange={(e) => handleDateToChange(e.target.value)}
                className="h-11 w-full rounded-2xl bg-[#F3F3EE] px-4 text-sm font-medium text-black outline-none focus-visible:ring-2 focus-visible:ring-[#2C2C2C]"
              />
            </div>
          </div>

          {dateRangeInvalid && (
            <p className="flex items-center gap-1.5 text-xs font-medium text-red-600">
              <AlertTriangle size={13} />
              The &ldquo;From&rdquo; date cannot be after the &ldquo;To&rdquo;
              date.
            </p>
          )}
        </div>

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
            {statusFilter !== "pending" && (
              <span className="inline-flex items-center gap-1 rounded-full bg-black/5 px-2.5 py-0.5 font-medium text-black">
                Status: <strong className="capitalize">{statusFilter}</strong>
                <button
                  type="button"
                  onClick={() => handleStatusChange("pending")}
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
            {search && (
              <span className="inline-flex items-center gap-1 rounded-full bg-black/5 px-2.5 py-0.5 font-medium text-black">
                Search: <strong>&ldquo;{search}&rdquo;</strong>
                <button
                  type="button"
                  onClick={() => handleSearchChange("")}
                  aria-label="Remove search filter"
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

      <div className="rounded-3xl bg-white p-5 shadow-sm sm:p-7">
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
              These transactions are awaiting admin review. Use the
              &ldquo;Change Status&rdquo; action to approve, reject, or mark
              them as completed.
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
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-[#F3F3EE] text-black/40">
              <Filter size={24} />
            </div>
            <h3 className="mt-4 text-base font-bold text-black">
              No transactions found
            </h3>
            <p className="mt-1 max-w-sm text-xs text-black/50">
              No transactions match your selected filters. Try changing the
              search or reset the filters.
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
                        className="transition-colors hover:bg-black/[0.02]"
                      >
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
                        <td className="py-4">
                          <div className="flex flex-col items-start gap-1.5">
                            {renderStatusBadge(tx.status)}
                            {renderFlagBadge(tx.flag)}
                          </div>
                        </td>
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
                              onClick={() => openChangeStatus(tx)}
                              aria-label={`Change status of ${tx.transactionId}`}
                              className="inline-flex h-8 items-center gap-1.5 rounded-full bg-[#2C2C2C] px-3 text-[11px] font-semibold text-white transition-colors hover:bg-[#E6FB2D] hover:text-[#2C2C2C]"
                            >
                              <ChevronDown size={13} />
                              Status
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

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
                        onClick={() => openChangeStatus(tx)}
                        className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-full bg-[#2C2C2C] text-xs font-semibold text-white transition-colors hover:bg-[#E6FB2D] hover:text-[#2C2C2C]"
                      >
                        <ChevronDown size={14} />
                        Change Status
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

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

      {reviewTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
          onMouseDown={() => setReviewTarget(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-review-title"
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
                    id="admin-review-title"
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
              {reviewTarget.flag && (
                <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
                  <div className="flex items-center gap-2 text-sm font-bold text-red-700">
                    <ShieldAlert size={16} />
                    Flagged for review
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
                onClick={() => {
                  openChangeStatus(reviewTarget);
                  setReviewTarget(null);
                }}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-[#2C2C2C] px-5 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-[#E6FB2D] hover:text-[#2C2C2C]"
              >
                <ChevronDown size={14} />
                Change Status
              </button>
            </div>
          </div>
        </div>
      )}

      {changeStatusTarget && (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
          onMouseDown={closeChangeStatus}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-status-title"
            onMouseDown={(e) => e.stopPropagation()}
            className="max-h-[92vh] w-full max-w-md overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-black/5 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="flex size-9 items-center justify-center rounded-xl bg-[#F3F3EE] text-black">
                  <ChevronDown size={18} />
                </div>
                <div>
                  <h3
                    id="admin-status-title"
                    className="text-base font-bold text-black"
                  >
                    Change Transaction Status
                  </h3>
                  <p className="font-mono text-[11px] text-black/40">
                    {changeStatusTarget.transactionId}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={closeChangeStatus}
                disabled={isUpdating}
                aria-label="Close status dialog"
                className="rounded-full p-1 text-black/40 hover:bg-black/5 hover:text-black disabled:opacity-50"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-4 space-y-4">
              <div className="rounded-2xl bg-[#F9F9F7] p-4 text-xs text-black/60">
                <p className="font-semibold text-black">Current status</p>
                <div className="mt-1.5">
                  {renderStatusBadge(changeStatusTarget.status)}
                </div>
              </div>

              <div>
                <p className="mb-2 text-xs font-bold text-black/60">
                  Select new status
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {STATUS_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setSelectedNewStatus(opt.value)}
                      className={`flex h-11 items-center justify-center rounded-2xl border text-xs font-semibold transition-all ${
                        selectedNewStatus === opt.value
                          ? "border-[#2C2C2C] bg-[#2C2C2C] text-white"
                          : "border-black/10 bg-white text-black/70 hover:border-black/20 hover:text-black"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <p className="text-xs text-black/50">
                Changing the status will immediately update the record. If you
                approve a deposit or withdrawal, the customer&apos;s account
                balance will be adjusted accordingly.
              </p>
            </div>

            {statusError && (
              <div className="mt-3 rounded-xl bg-red-50 p-2.5 text-xs text-red-600">
                {statusError}
              </div>
            )}

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={closeChangeStatus}
                disabled={isUpdating}
                className="h-10 rounded-full border border-black/10 bg-white px-5 text-xs font-semibold text-black/70 transition-colors hover:border-black/20 hover:text-black disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={submitStatusChange}
                disabled={
                  isUpdating ||
                  selectedNewStatus === changeStatusTarget.status
                }
                className="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-[#2C2C2C] px-5 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-[#E6FB2D] hover:text-[#2C2C2C] disabled:opacity-50"
              >
                {isUpdating ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={14} />
                    <span>Confirm</span>
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
