"use client";

import { useState, useId } from "react";
import {
  Clock,
  CheckCircle2,
  XCircle,
  Search,
  X,
  Filter,
  RefreshCw,
  HandCoins,
  Home,
  Car,
  GraduationCap,
  Briefcase,
  Landmark,
  Trash2,
  AlertTriangle,
  ClipboardCheck,
  History,
} from "lucide-react";
import {
  useGetPaginatedLoansQuery,
  useDeleteLoanMutation,
  useGetLoanPaymentHistoryQuery,
  type Loan,
  type LoanType,
} from "@/lib/redux/api";
import { successToast } from "@/lib/utils/toasts";
import DashboardPageHeader from "@/components/dashboard/DashboardPageHeader";

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

export default function LoansView() {
  // Filters & Search state
  const [loanType, setLoanType] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [currentLimit, setCurrentLimit] = useState(15);
  const searchInputId = useId();

  // Deletion modal state
  const [loanToDelete, setLoanToDelete] = useState<Loan | null>(null);
  const [deleteError, setDeleteError] = useState("");
  const [historyLoan, setHistoryLoan] = useState<Loan | null>(null);

  const [deleteLoan, { isLoading: isDeleting }] = useDeleteLoanMutation();

  const {
    data: historyData,
    isLoading: isHistoryLoading,
    isFetching: isHistoryFetching,
  } = useGetLoanPaymentHistoryQuery(
    { loanId: historyLoan?.loanId || "" },
    { skip: !historyLoan }
  );
  const paymentHistory = historyData?.history || [];

  // Reset limit whenever filter or search changes
  const handleLoanTypeChange = (val: string) => {
    setLoanType(val);
    setCurrentLimit(15);
  };

  const handleStatusFilterChange = (val: string) => {
    setStatusFilter(val);
    setCurrentLimit(15);
  };

  const handleSearchChange = (val: string) => {
    setSearch(val);
    setCurrentLimit(15);
  };

  const handleResetFilters = () => {
    setLoanType("all");
    setStatusFilter("all");
    setSearch("");
    setCurrentLimit(15);
  };

  // RTK Query: fetch loans with current limit & filters
  const { data, isLoading, isFetching, refetch } = useGetPaginatedLoansQuery({
    limit: currentLimit,
    offset: 0,
    type: loanType,
    search: search.trim(),
  });

  const rawLoans = data?.loans || [];
  // Client-side status filter (if user selects a specific status)
  const loans =
    statusFilter === "all"
      ? rawLoans
      : rawLoans.filter((l) => l.status === statusFilter);

  const total =
    statusFilter === "all"
      ? data?.total || 0
      : loans.length;
  const hasMore = statusFilter === "all" ? data?.hasMore || false : false;

  // Handle Delete Confirmation
  const confirmDelete = async () => {
    if (!loanToDelete) return;
    setDeleteError("");
    try {
      const res = await deleteLoan(loanToDelete.id).unwrap();
      successToast(res.message || "Loan application deleted successfully.");
      setLoanToDelete(null);
    } catch (err: unknown) {
      const errorMsg =
        err && typeof err === "object" && "data" in err
          ? (err.data as { error?: string })?.error || "Failed to delete loan."
          : "An error occurred while deleting the loan.";
      setDeleteError(errorMsg);
    }
  };

  // Status badge styling helper
  const renderStatusBadge = (status: Loan["status"]) => {
    switch (status) {
      case "approved":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold capitalize text-emerald-700">
            <CheckCircle2 size={12} />
            {status}
          </span>
        );
      case "under_review":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-2.5 py-0.5 text-xs font-semibold text-sky-700">
            <ClipboardCheck size={12} />
            Under Review
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

  // Loan type icon helper
  const renderTypeIcon = (type: LoanType) => {
    switch (type) {
      case "home":
        return (
          <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <Home size={16} />
          </div>
        );
      case "car":
        return (
          <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
            <Car size={16} />
          </div>
        );
      case "education":
        return (
          <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
            <GraduationCap size={16} />
          </div>
        );
      case "business":
        return (
          <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
            <Briefcase size={16} />
          </div>
        );
      case "personal":
      default:
        return (
          <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#F3F3EE] text-[#2C2C2C]">
            <Landmark size={16} />
          </div>
        );
    }
  };

  return (
    <div className="space-y-5 sm:space-y-6">
      <DashboardPageHeader
        eyebrow="Financing"
        title="All Loans"
        description="View, filter, search, and manage your complete loan applications and repayment status."
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
            {/* Filter 1: Loan Type */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="mr-1 text-xs font-bold text-black/50">
                Loan Type:
              </span>
              {(
                [
                  { label: "All Types", value: "all" },
                  { label: "Home", value: "home" },
                  { label: "Car", value: "car" },
                  { label: "Education", value: "education" },
                  { label: "Personal", value: "personal" },
                  { label: "Business", value: "business" },
                ] as const
              ).map((item) => {
                const isActive = loanType === item.value;
                return (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => handleLoanTypeChange(item.value)}
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

            {/* Filter 2: Loan Status */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="mr-1 text-xs font-bold text-black/50">
                Status:
              </span>
              {(
                [
                  { label: "All Status", value: "all" },
                  { label: "Pending", value: "pending" },
                  { label: "Under Review", value: "under_review" },
                  { label: "Approved", value: "approved" },
                  { label: "Rejected", value: "rejected" },
                ] as const
              ).map((item) => {
                const isActive = statusFilter === item.value;
                return (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => handleStatusFilterChange(item.value)}
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
        {(loanType !== "all" || statusFilter !== "all" || search) && (
          <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-black/5 pt-3 text-xs">
            <span className="text-black/50">Active filters:</span>
            {loanType !== "all" && (
              <span className="inline-flex items-center gap-1 rounded-full bg-black/5 px-2.5 py-0.5 font-medium text-black">
                Type: <strong className="capitalize">{loanType}</strong>
                <button
                  type="button"
                  onClick={() => handleLoanTypeChange("all")}
                  aria-label="Remove loan type filter"
                  className="hover:text-red-600"
                >
                  <X size={12} />
                </button>
              </span>
            )}
            {statusFilter !== "all" && (
              <span className="inline-flex items-center gap-1 rounded-full bg-black/5 px-2.5 py-0.5 font-medium text-black">
                Status:{" "}
                <strong className="capitalize">
                  {statusFilter === "under_review"
                    ? "Under Review"
                    : statusFilter}
                </strong>
                <button
                  type="button"
                  onClick={() => handleStatusFilterChange("all")}
                  aria-label="Remove status filter"
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

      {/* ── Loans List Card ── */}
      <div className="rounded-3xl bg-white p-5 shadow-sm sm:p-7">
        {/* Results summary bar */}
        <div className="mb-4 flex items-center justify-between border-b border-black/5 pb-3">
          <div className="flex items-center gap-2">
            <HandCoins size={18} className="text-black/50" />
            <h2 className="text-base font-bold text-black sm:text-lg">
              Loan Records
            </h2>
          </div>
          <span className="text-xs font-semibold text-black/50">
            {isLoading
              ? "Loading..."
              : `Showing ${loans.length} of ${total}`}
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
        ) : loans.length === 0 ? (
          /* Empty State */
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-[#F3F3EE] text-black/40">
              <Filter size={24} />
            </div>
            <h3 className="mt-4 text-base font-bold text-black">
              No loans found
            </h3>
            <p className="mt-1 max-w-sm text-xs text-black/50">
              No loan records match your selected filters or search
              criteria. Try modifying your search or reset the filters.
            </p>
            {(loanType !== "all" || statusFilter !== "all" || search) && (
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
          /* Responsive Loans Display */
          <div>
            {/* Desktop Table View */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-black/5 text-[11px] font-bold uppercase tracking-wider text-black/40">
                    <th className="pb-3 pl-2">Loan ID & Date</th>
                    <th className="pb-3">Type & Purpose</th>
                    <th className="pb-3">Disbursal Account</th>
                    <th className="pb-3">Term & Due Date</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3 text-right">Amount</th>
                    <th className="pb-3 pr-2 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5 text-sm">
                  {loans.map((loan) => (
                    <tr
                      key={loan.id}
                      className="transition-colors hover:bg-black/1.5"
                    >
                      {/* 1. Loan ID & Application Date */}
                      <td className="py-4 pl-2">
                        <div className="flex items-center gap-3">
                          {renderTypeIcon(loan.type)}
                          <div>
                            <span className="font-mono text-xs font-bold text-black">
                              {loan.loanId}
                            </span>
                            <p className="text-[11px] text-black/40">
                              {new Date(loan.createdAt).toLocaleDateString(
                                "en-US",
                                {
                                  day: "2-digit",
                                  month: "short",
                                  year: "numeric",
                                }
                              )}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* 2. Type & Purpose */}
                      <td className="py-4">
                        <div className="max-w-50">
                          <p className="truncate text-xs font-bold capitalize text-black">
                            {loan.title || `${loan.type} Loan`}
                          </p>
                          <p className="truncate text-[11px] text-black/50">
                            {loan.purpose || "Loan Application"}
                          </p>
                        </div>
                      </td>

                      {/* 3. Account Number & Type */}
                      <td className="py-4">
                        <div>
                          <p className="font-mono text-xs font-medium text-black">
                            {formatAccNo(loan.accountNumber)}
                          </p>
                          {loan.accountType && (
                            <span className="inline-block rounded bg-black/5 px-1.5 py-0.2 text-[10px] font-semibold capitalize text-black/60">
                              {loan.accountType}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* 4. Term & Due Date */}
                      <td className="py-4">
                        <div>
                          <p className="text-xs font-medium text-black">
                            {loan.termMonths} Months
                            {typeof loan.monthlyAmount === "number" &&
                              loan.monthlyAmount > 0 && (
                                <span className="ml-1 text-black/50">
                                  ({formatMoney(loan.monthlyAmount)}/mo)
                                </span>
                              )}
                          </p>
                          <p className="text-[11px] text-black/40">
                            {loan.status === "approved" && loan.nextPaymentDate
                              ? `Next: ${new Date(
                                  loan.nextPaymentDate
                                ).toLocaleDateString("en-US", {
                                  day: "2-digit",
                                  month: "short",
                                  year: "numeric",
                                })}`
                              : `Due: ${loan.dueDate}`}
                          </p>
                        </div>
                      </td>

                      {/* 5. Status Badge */}
                      <td className="py-4">{renderStatusBadge(loan.status)}</td>

                      {/* 6. Amount */}
                      <td className="py-4 text-right">
                        <span className="text-sm font-bold text-black">
                          {formatMoney(loan.amount)}
                        </span>
                        {loan.status === "approved" &&
                          typeof loan.remainingBalance === "number" && (
                            <p className="text-[11px] text-black/45">
                              Rem: {formatMoney(loan.remainingBalance)}
                            </p>
                          )}
                      </td>

                      {/* 7. Action: Payment History & Delete */}
                      <td className="py-4 pr-2 text-right">
                        <div className="inline-flex items-center gap-1">
                          {loan.status === "approved" && (
                            <button
                              type="button"
                              onClick={() => setHistoryLoan(loan)}
                              aria-label={`View payment history for ${loan.loanId}`}
                              title="View monthly payment history"
                              className="inline-flex h-8 items-center gap-1 rounded-xl bg-[#F3F3EE] px-2.5 text-[11px] font-semibold text-black/75 transition-colors hover:bg-[#E6FB2D] hover:text-[#2C2C2C]"
                            >
                              <History size={13} />
                              <span>History</span>
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              setDeleteError("");
                              setLoanToDelete(loan);
                            }}
                            aria-label={`Delete loan ${loan.loanId}`}
                            title="Delete loan application"
                            className="inline-flex size-8 items-center justify-center rounded-xl text-black/40 transition-colors hover:bg-red-50 hover:text-red-600"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile / Tablet Card View */}
            <div className="space-y-3 lg:hidden">
              {loans.map((loan) => (
                <div
                  key={loan.id}
                  className="rounded-2xl border border-black/5 bg-[#F9F9F7] p-4 transition-all"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      {renderTypeIcon(loan.type)}
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-black">
                          {loan.title || `${loan.type} Loan`}
                        </p>
                        <p className="text-xs text-black/50">
                          {loan.purpose}
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-sm font-bold text-black">
                        {formatMoney(loan.amount)}
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-black/5 pt-2.5 text-xs text-black/50">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[11px] font-semibold text-black/70">
                        •••• {loan.accountNumber ? loan.accountNumber.slice(-4) : "—"}
                      </span>
                      {loan.accountType && (
                        <span className="rounded bg-black/5 px-1.5 py-0.2 text-[10px] font-semibold capitalize text-black/60">
                          {loan.accountType}
                        </span>
                      )}
                      <span className="text-[11px] text-black/40">
                        {loan.termMonths} mo · Due {loan.dueDate}
                      </span>
                    </div>
                    <div>{renderStatusBadge(loan.status)}</div>
                  </div>

                  <div className="mt-2.5 flex items-center justify-between text-[11px] text-black/40">
                    <div className="flex items-center gap-2">
                      <span className="font-mono">{loan.loanId}</span>
                      <span>·</span>
                      <span>
                        {new Date(loan.createdAt).toLocaleDateString("en-US", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    </div>

                    {/* Mobile Actions */}
                    <div className="flex items-center gap-1.5">
                      {loan.status === "approved" && (
                        <button
                          type="button"
                          onClick={() => setHistoryLoan(loan)}
                          className="inline-flex items-center gap-1 rounded-lg bg-black/5 px-2 py-1 text-xs font-semibold text-black/70 hover:bg-[#E6FB2D] hover:text-[#2C2C2C]"
                        >
                          <History size={13} />
                          <span>History</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          setDeleteError("");
                          setLoanToDelete(loan);
                        }}
                        className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-red-600 hover:bg-red-50"
                      >
                        <Trash2 size={13} />
                        <span>Delete</span>
                      </button>
                    </div>
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
                Showing {loans.length} of {total} total loans
              </p>
            </div>
          ) : total > 0 ? (
            <p className="text-xs font-semibold text-black/40">
              All {total} loans loaded
            </p>
          ) : null}
        </div>
      </div>

      {/* ── Delete Confirmation Modal ── */}
      {loanToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-black/5 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="flex size-9 items-center justify-center rounded-xl bg-red-50 text-red-600">
                  <AlertTriangle size={18} />
                </div>
                <h3 className="text-base font-bold text-black">
                  Delete Loan Application
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setLoanToDelete(null)}
                disabled={isDeleting}
                className="rounded-full p-1 text-black/40 hover:bg-black/5 hover:text-black"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-4 space-y-3 text-sm text-black/70">
              <p>
                Are you sure you want to delete this loan application?
              </p>
              <div className="rounded-2xl bg-[#F9F9F7] p-3.5 space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-black/50">Loan ID:</span>
                  <span className="font-mono font-bold text-black">
                    {loanToDelete.loanId}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-black/50">Type:</span>
                  <span className="font-semibold capitalize text-black">
                    {loanToDelete.title || loanToDelete.type}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-black/50">Amount:</span>
                  <span className="font-bold text-black">
                    {formatMoney(loanToDelete.amount)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-black/50">Status:</span>
                  <span className="capitalize font-semibold text-black">
                    {loanToDelete.status}
                  </span>
                </div>
              </div>
              <p className="text-xs text-black/40">
                This record will be permanently deleted from your account.
              </p>
            </div>

            {deleteError && (
              <div className="mt-3 rounded-xl bg-red-50 p-2.5 text-xs text-red-600">
                {deleteError}
              </div>
            )}

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setLoanToDelete(null)}
                disabled={isDeleting}
                className="h-10 rounded-full border border-black/10 bg-white px-5 text-xs font-semibold text-black/70 transition-colors hover:border-black/20 hover:text-black"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={isDeleting}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-red-600 px-5 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-red-700 disabled:opacity-50"
              >
                {isDeleting ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 size={14} />
                    <span>Delete Loan</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ── Loan Payment History Modal ── */}
      {historyLoan && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
          onMouseDown={() => setHistoryLoan(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            onMouseDown={(e) => e.stopPropagation()}
            className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-black/5 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="flex size-9 items-center justify-center rounded-xl bg-[#F3F3EE] text-[#2C2C2C]">
                  <History size={18} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-black">
                    Monthly Payment History
                  </h3>
                  <p className="font-mono text-[11px] text-black/45">
                    {historyLoan.loanId} · {formatAccNo(historyLoan.accountNumber)}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setHistoryLoan(null)}
                aria-label="Close payment history"
                className="rounded-full p-1 text-black/40 hover:bg-black/5 hover:text-black"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-2xl bg-[#F9F9F7] p-3">
                <p className="text-[10px] font-bold uppercase tracking-wide text-black/40">
                  Monthly Amount
                </p>
                <p className="mt-0.5 text-sm font-bold text-black">
                  {formatMoney(
                    historyLoan.monthlyAmount ??
                      (historyLoan.termMonths > 0
                        ? historyLoan.amount / historyLoan.termMonths
                        : historyLoan.amount)
                  )}
                </p>
              </div>
              <div className="rounded-2xl bg-[#F9F9F7] p-3">
                <p className="text-[10px] font-bold uppercase tracking-wide text-black/40">
                  Total Repaid
                </p>
                <p className="mt-0.5 text-sm font-bold text-emerald-700">
                  {formatMoney(historyLoan.totalRepaid ?? 0)}
                </p>
              </div>
              <div className="rounded-2xl bg-[#F9F9F7] p-3">
                <p className="text-[10px] font-bold uppercase tracking-wide text-black/40">
                  Remaining
                </p>
                <p className="mt-0.5 text-sm font-bold text-black">
                  {formatMoney(historyLoan.remainingBalance ?? historyLoan.amount)}
                </p>
              </div>
              <div className="rounded-2xl bg-[#F9F9F7] p-3">
                <p className="text-[10px] font-bold uppercase tracking-wide text-black/40">
                  Next Auto Debit
                </p>
                <p className="mt-0.5 text-xs font-bold text-black">
                  {historyLoan.repaymentStatus === "completed"
                    ? "Paid Off"
                    : historyLoan.nextPaymentDate
                    ? new Date(historyLoan.nextPaymentDate).toLocaleDateString(
                        "en-US",
                        { day: "2-digit", month: "short", year: "numeric" }
                      )
                    : "Scheduled"}
                </p>
              </div>
            </div>

            <div className="mt-4">
              {isHistoryLoading || isHistoryFetching ? (
                <div className="flex items-center justify-center py-10 text-xs text-black/50">
                  <RefreshCw size={15} className="mr-2 animate-spin" />
                  Loading payment history...
                </div>
              ) : paymentHistory.length === 0 ? (
                <div className="rounded-2xl bg-[#F9F9F7] p-6 text-center text-xs text-black/50">
                  No monthly installment deductions have occurred yet. The first
                  monthly installment will be automatically deducted from your
                  linked bank account on the next due date.
                </div>
              ) : (
                <div className="max-h-72 overflow-y-auto rounded-2xl border border-black/5">
                  <table className="w-full text-left text-xs">
                    <thead className="border-b border-black/5 bg-[#F9F9F7] text-[10px] font-bold uppercase tracking-wider text-black/40">
                      <tr>
                        <th className="px-3 py-2.5">Installment</th>
                        <th className="px-3 py-2.5">Paid Date</th>
                        <th className="px-3 py-2.5">Method</th>
                        <th className="px-3 py-2.5">Status</th>
                        <th className="px-3 py-2.5 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-black/5">
                      {paymentHistory.map((item) => (
                        <tr key={item.id}>
                          <td className="px-3 py-2.5 font-mono font-semibold text-black">
                            #{item.installmentNumber}
                          </td>
                          <td className="px-3 py-2.5 text-black/60">
                            {new Date(item.paidAt).toLocaleDateString("en-US", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })}
                          </td>
                          <td className="px-3 py-2.5 text-black/60">
                            {item.method}
                          </td>
                          <td className="px-3 py-2.5">
                            <span
                              className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ${
                                item.status === "paid"
                                  ? "bg-emerald-50 text-emerald-700"
                                  : item.status === "late"
                                  ? "bg-red-50 text-red-700"
                                  : "bg-amber-50 text-amber-700"
                              }`}
                            >
                              {item.status}
                            </span>
                          </td>
                          <td className="px-3 py-2.5 text-right font-bold text-black">
                            {formatMoney(item.amount)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={() => setHistoryLoan(null)}
                className="h-10 rounded-full bg-[#2C2C2C] px-6 text-xs font-semibold text-white transition-colors hover:bg-[#E6FB2D] hover:text-[#2C2C2C]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
