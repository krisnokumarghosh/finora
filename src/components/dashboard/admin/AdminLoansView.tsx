"use client";

import { useEffect, useId, useState, type ReactNode } from "react";
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
  Eye,
  ClipboardCheck,
  MessageSquare,
  User,
  Mail,
  Phone,
  CalendarDays,
  AlertTriangle,
  FileText,
  History,
  ShieldCheck,
  Ban,
} from "lucide-react";
import {
  useGetAdminLoansQuery,
  useUpdateAdminLoanMutation,
  useProcessDueLoanRepaymentsMutation,
  type AdminLoan,
  type LoanType,
} from "@/lib/redux/api";
import { successToast } from "@/lib/utils/toasts";

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

const formatDateTime = (iso?: string): { date: string; time: string } => {
  const empty = { date: "—", time: "—" };
  if (!iso) return empty;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return empty;
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

export default function AdminLoansView() {
  // Filters & search state: initially show loans needing admin approval ("under_review")
  const [loanType, setLoanType] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("under_review");
  const [search, setSearch] = useState("");
  const [currentLimit, setCurrentLimit] = useState(15);
  const searchInputId = useId();

  // Review / approve / reject modal state
  const [reviewTarget, setReviewTarget] = useState<AdminLoan | null>(null);
  const [decisionTarget, setDecisionTarget] = useState<{
    loan: AdminLoan;
    action: "approve" | "reject";
  } | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [decisionError, setDecisionError] = useState("");
  const [noteText, setNoteText] = useState("");
  const [noteError, setNoteError] = useState("");

  const [updateAdminLoan, { isLoading: isSaving }] =
    useUpdateAdminLoanMutation();
  const [processDueRepayments, { isLoading: isProcessingRepayments }] =
    useProcessDueLoanRepaymentsMutation();

  const handleProcessDueRepayments = async () => {
    try {
      const res = await processDueRepayments().unwrap();
      successToast(res.message);
      refetch();
    } catch (err: unknown) {
      setDecisionError(
        getApiError(err, "Failed to process due monthly repayments.")
      );
    }
  };

  // Reset limit whenever a filter or search changes
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
    setStatusFilter("under_review");
    setSearch("");
    setCurrentLimit(15);
  };

  // RTK Query: fetch customer loan applications with active filters
  const { data, isLoading, isFetching, refetch } = useGetAdminLoansQuery({
    limit: currentLimit,
    offset: 0,
    type: loanType,
    status: statusFilter,
    search: search.trim(),
  });

  const loans = data?.loans || [];
  const total = data?.total || 0;
  const hasMore = data?.hasMore || false;

  // Close modal on Escape and lock page scroll while a modal is open
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || isSaving) return;
      if (decisionTarget) {
        setDecisionTarget(null);
      } else {
        setReviewTarget(null);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [decisionTarget, isSaving]);

  useEffect(() => {
    if (!reviewTarget && !decisionTarget) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [reviewTarget, decisionTarget]);

  const openReview = (loan: AdminLoan) => {
    setReviewTarget(loan);
    setNoteText("");
    setNoteError("");
  };

  const closeReview = () => {
    if (isSaving) return;
    setReviewTarget(null);
    setNoteText("");
    setNoteError("");
  };

  const openDecisionModal = (loan: AdminLoan, action: "approve" | "reject") => {
    setDecisionTarget({ loan, action });
    setRejectReason("");
    setDecisionError("");
  };

  const closeDecisionModal = () => {
    if (isSaving) return;
    setDecisionTarget(null);
    setRejectReason("");
    setDecisionError("");
  };

  const addNote = async () => {
    if (!reviewTarget) return;

    const note = noteText.trim();
    if (note.length < 3) {
      setNoteError("Please write a note of at least 3 characters.");
      return;
    }

    setNoteError("");

    try {
      const res = await updateAdminLoan({
        loanId: reviewTarget.id,
        action: "note",
        note,
      }).unwrap();

      successToast(res.message || "Internal note added.");
      setReviewTarget(res.loan);
      setNoteText("");
    } catch (err: unknown) {
      setNoteError(getApiError(err, "Failed to add the internal note."));
    }
  };

  const submitDecision = async () => {
    if (!decisionTarget) return;

    setDecisionError("");

    try {
      const res =
        decisionTarget.action === "approve"
          ? await updateAdminLoan({
              loanId: decisionTarget.loan.id,
              action: "approve",
            }).unwrap()
          : await updateAdminLoan({
              loanId: decisionTarget.loan.id,
              action: "reject",
              reason: rejectReason.trim() || undefined,
            }).unwrap();

      successToast(
        res.message ||
          (decisionTarget.action === "approve"
            ? "Loan application approved."
            : "Loan application rejected.")
      );
      setReviewTarget(res.loan);
      setDecisionTarget(null);
      setRejectReason("");
    } catch (err: unknown) {
      setDecisionError(
        getApiError(
          err,
          `Failed to ${decisionTarget.action} the loan application.`
        )
      );
    }
  };

  // Status badge styling helper
  const renderStatusBadge = (status: AdminLoan["status"]) => {
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

  const hasActiveFilters =
    loanType !== "all" || statusFilter !== "under_review" || search !== "";

  const monthlyInstallment =
    reviewTarget && reviewTarget.termMonths > 0
      ? reviewTarget.amount / reviewTarget.termMonths
      : reviewTarget?.amount || 0;

  return (
    <div className="space-y-6">
      {/* ── Page Header ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-black sm:text-4xl">
            Loan Management
          </h1>
          <p className="mt-1 text-sm text-black/60">
            Review loan applications needing approval, approve or reject
            requests, and inspect loan repayment history.
          </p>
        </div>

        {/* Quick actions */}
        <div className="flex flex-wrap items-center gap-2 self-start sm:self-center">
          <button
            type="button"
            onClick={handleProcessDueRepayments}
            disabled={isProcessingRepayments}
            className="inline-flex h-10 items-center gap-2 rounded-full bg-[#2C2C2C] px-4 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-[#E6FB2D] hover:text-[#2C2C2C] disabled:opacity-50"
          >
            <History
              size={14}
              className={isProcessingRepayments ? "animate-spin" : ""}
            />
            <span>
              {isProcessingRepayments
                ? "Processing..."
                : "Process Due Repayments"}
            </span>
          </button>
          <button
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
        </div>
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
        {hasActiveFilters && (
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
            {statusFilter !== "under_review" && (
              <span className="inline-flex items-center gap-1 rounded-full bg-black/5 px-2.5 py-0.5 font-medium text-black">
                Status:{" "}
                <strong className="capitalize">
                  {statusFilter === "all"
                    ? "All Status"
                    : statusFilter === "under_review"
                    ? "Under Review"
                    : statusFilter}
                </strong>
                <button
                  type="button"
                  onClick={() => handleStatusFilterChange("under_review")}
                  aria-label="Reset status filter to under review"
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
              Loan Applications
            </h2>
          </div>
          <span className="text-xs font-semibold text-black/50">
            {isLoading ? "Loading..." : `Showing ${loans.length} of ${total}`}
          </span>
        </div>

        {statusFilter === "under_review" && (
          <div className="mb-4 flex items-start gap-2 rounded-2xl bg-sky-50 p-3.5 text-xs text-sky-800">
            <ClipboardCheck size={15} className="mt-0.5 shrink-0" />
            <span>
              These applications have been forwarded by bank staff and are
              waiting for your final approval or rejection.
            </span>
          </div>
        )}

        {statusFilter === "pending" && (
          <div className="mb-4 flex items-start gap-2 rounded-2xl bg-amber-50 p-3.5 text-xs text-amber-800">
            <AlertTriangle size={15} className="mt-0.5 shrink-0" />
            <span>
              These applications are pending initial staff review. You can still
              open an application to inspect details, approve, or reject it.
            </span>
          </div>
        )}

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
              No loan applications found
            </h3>
            <p className="mt-1 max-w-sm text-xs text-black/50">
              {statusFilter === "under_review" &&
              loanType === "all" &&
              !search
                ? "There are no loan applications currently waiting for admin approval. Try viewing all statuses."
                : "No customer loan applications match your selected filters or account number. Try changing the search or reset the filters."}
            </p>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
              {statusFilter === "under_review" && (
                <button
                  type="button"
                  onClick={() => handleStatusFilterChange("all")}
                  className="rounded-full bg-[#2C2C2C] px-5 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#E6FB2D] hover:text-[#2C2C2C]"
                >
                  View all loans
                </button>
              )}
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="rounded-full border border-black/10 bg-white px-5 py-2 text-xs font-semibold text-black/70 transition-colors hover:border-black/20 hover:text-black"
                >
                  Reset filters
                </button>
              )}
            </div>
          </div>
        ) : (
          /* Responsive Loans Display */
          <div>
            {/* Desktop Table View */}
            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-black/5 text-[11px] font-bold uppercase tracking-wider text-black/40">
                    <th className="pb-3 pl-2">Loan ID & Date</th>
                    <th className="pb-3">Customer & Account</th>
                    <th className="pb-3">Type & Purpose</th>
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
                      className="transition-colors hover:bg-black/2"
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
                              {formatDateTime(loan.createdAt).date}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* 2. Customer & Account */}
                      <td className="py-4">
                        <div className="max-w-44">
                          <p className="truncate text-xs font-semibold text-black">
                            {loan.customer.name}
                          </p>
                          <p className="truncate text-[11px] text-black/50">
                            {loan.customer.email || loan.customer.mobile || "—"}
                          </p>
                          <p className="font-mono text-[11px] text-black/50">
                            {formatAccNo(loan.accountNumber)}
                          </p>
                          {loan.accountType && (
                            <span className="mt-0.5 inline-block rounded bg-black/5 px-1.5 py-0.2 text-[10px] font-semibold capitalize text-black/60">
                              {loan.accountType}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* 3. Type & Purpose */}
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

                      {/* 4. Term & Due Date */}
                      <td className="py-4">
                        <div>
                          <p className="text-xs font-medium text-black">
                            {loan.termMonths} Months
                          </p>
                          <p className="text-[11px] text-black/40">
                            Due: {loan.dueDate}
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
                      </td>

                      {/* 7. Action: Review */}
                      <td className="py-4 pr-2 text-right">
                        <button
                          type="button"
                          onClick={() => openReview(loan)}
                          aria-label={`Review loan application ${loan.loanId}`}
                          className="inline-flex h-8 items-center gap-1.5 rounded-full border border-black/10 bg-white px-3 text-[11px] font-semibold text-black/70 transition-colors hover:border-black/20 hover:text-black"
                        >
                          <Eye size={13} />
                          Review
                        </button>
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
                        <p className="truncate text-xs text-black/50">
                          {loan.customer.name}
                        </p>
                      </div>
                    </div>

                    <div className="shrink-0 text-right">
                      <span className="text-sm font-bold text-black">
                        {formatMoney(loan.amount)}
                      </span>
                    </div>
                  </div>

                  <p className="mt-2 truncate text-[11px] font-medium text-black/60">
                    {loan.purpose}
                  </p>

                  <div className="mt-2 flex flex-wrap items-center justify-between gap-2 border-t border-black/5 pt-2.5 text-xs text-black/50">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[11px] font-semibold text-black/70">
                        ••••{" "}
                        {loan.accountNumber
                          ? loan.accountNumber.slice(-4)
                          : "—"}
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

                  <div className="mt-2 flex items-center justify-between text-[11px] text-black/40">
                    <div className="flex items-center gap-2">
                      <span className="font-mono">{loan.loanId}</span>
                      <span>·</span>
                      <span>{formatDateTime(loan.createdAt).date}</span>
                    </div>
                    {loan.customer.mobile && (
                      <span>{loan.customer.mobile}</span>
                    )}
                  </div>

                  <div className="mt-3 border-t border-black/5 pt-3">
                    <button
                      type="button"
                      onClick={() => openReview(loan)}
                      className="inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-full border border-black/10 bg-white text-xs font-semibold text-black/70 transition-colors hover:border-black/20 hover:text-black"
                    >
                      <Eye size={14} />
                      Review application
                    </button>
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
                Showing {loans.length} of {total} total applications
              </p>
            </div>
          ) : total > 0 ? (
            <p className="text-xs font-semibold text-black/40">
              All {total} applications loaded
            </p>
          ) : null}
        </div>
      </div>

      {/* ── Loan Review Modal ── */}
      {reviewTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
          onMouseDown={closeReview}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-loan-review-title"
            onMouseDown={(e) => e.stopPropagation()}
            className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-white p-5 shadow-2xl sm:p-6"
          >
            <div className="flex items-center justify-between border-b border-black/5 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="flex size-9 items-center justify-center rounded-xl bg-[#F3F3EE] text-black">
                  <HandCoins size={18} />
                </div>
                <div>
                  <h3
                    id="admin-loan-review-title"
                    className="text-base font-bold text-black"
                  >
                    Loan Application Review
                  </h3>
                  <p className="font-mono text-[11px] text-black/40">
                    {reviewTarget.loanId}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={closeReview}
                disabled={isSaving}
                aria-label="Close loan review"
                className="rounded-full p-1 text-black/40 hover:bg-black/5 hover:text-black disabled:opacity-50"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-4 space-y-4">
              {reviewTarget.status === "under_review" && (
                <div className="flex items-start gap-2 rounded-2xl bg-sky-50 p-3.5 text-xs text-sky-800">
                  <ClipboardCheck size={15} className="mt-0.5 shrink-0" />
                  <span>
                    This application was forwarded for admin approval
                    {reviewTarget.forwardedAt
                      ? ` on ${formatDateTime(reviewTarget.forwardedAt).date}`
                      : ""}
                    {reviewTarget.forwardedByName
                      ? ` by ${reviewTarget.forwardedByName}`
                      : ""}
                    . Review the details below to approve or reject it.
                  </span>
                </div>
              )}

              {reviewTarget.status === "pending" && (
                <div className="flex items-start gap-2 rounded-2xl bg-amber-50 p-3.5 text-xs text-amber-800">
                  <Clock size={15} className="mt-0.5 shrink-0" />
                  <span>
                    This application is still pending initial staff review. As
                    admin, you can review the details and approve or reject it
                    directly.
                  </span>
                </div>
              )}

              {reviewTarget.status === "approved" && (
                <div className="flex items-start gap-2 rounded-2xl bg-emerald-50 p-3.5 text-xs text-emerald-800">
                  <CheckCircle2 size={15} className="mt-0.5 shrink-0" />
                  <span>
                    This loan application was approved
                    {reviewTarget.approvedAt
                      ? ` on ${formatDateTime(reviewTarget.approvedAt).date}`
                      : ""}
                    {reviewTarget.approvedByName
                      ? ` by ${reviewTarget.approvedByName}`
                      : ""}
                    .
                  </span>
                </div>
              )}

              {reviewTarget.status === "rejected" && (
                <div className="flex items-start gap-2 rounded-2xl bg-red-50 p-3.5 text-xs text-red-800">
                  <XCircle size={15} className="mt-0.5 shrink-0" />
                  <span>
                    This loan application was rejected
                    {reviewTarget.rejectedAt
                      ? ` on ${formatDateTime(reviewTarget.rejectedAt).date}`
                      : ""}
                    {reviewTarget.rejectedByName
                      ? ` by ${reviewTarget.rejectedByName}`
                      : ""}
                    .
                    {reviewTarget.rejectionReason
                      ? ` Reason: ${reviewTarget.rejectionReason}`
                      : ""}
                  </span>
                </div>
              )}

              <div className="grid gap-4 md:grid-cols-2">
                {/* Customer information */}
                <div className="rounded-2xl bg-[#F9F9F7] p-4">
                  <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-black/50">
                    <User size={13} />
                    Customer Information
                  </h4>
                  <div className="mt-3 grid gap-x-4 gap-y-3 sm:grid-cols-2">
                    <DetailRow
                      icon={<User size={13} />}
                      label="Customer"
                      value={reviewTarget.customer.name}
                    />
                    <DetailRow
                      icon={<Mail size={13} />}
                      label="Email"
                      value={reviewTarget.customer.email || "—"}
                    />
                    <DetailRow
                      icon={<Phone size={13} />}
                      label="Mobile"
                      value={reviewTarget.customer.mobile || "—"}
                    />
                    <DetailRow
                      icon={<Landmark size={13} />}
                      label="Account"
                      value={formatAccNo(reviewTarget.accountNumber)}
                      mono
                    />
                    <DetailRow
                      icon={<Landmark size={13} />}
                      label="Account Type"
                      value={capitalise(reviewTarget.accountType || "—")}
                    />
                    <DetailRow
                      icon={<CheckCircle2 size={13} />}
                      label="Account Status"
                      value={capitalise(reviewTarget.accountStatus || "—")}
                    />
                    {typeof reviewTarget.balance === "number" && (
                      <div className="sm:col-span-2">
                        <DetailRow
                          icon={<Landmark size={13} />}
                          label="Current Balance"
                          value={formatMoney(reviewTarget.balance)}
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Loan details */}
                <div className="rounded-2xl bg-[#F9F9F7] p-4">
                  <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-black/50">
                    <FileText size={13} />
                    Loan Details
                  </h4>
                  <div className="mt-3 grid gap-x-4 gap-y-3 sm:grid-cols-2">
                    <DetailRow
                      icon={<FileText size={13} />}
                      label="Loan ID"
                      value={reviewTarget.loanId}
                      mono
                    />
                    <DetailRow
                      icon={<Landmark size={13} />}
                      label="Loan Type"
                      value={reviewTarget.title || `${reviewTarget.type} Loan`}
                    />
                    <DetailRow
                      icon={<HandCoins size={13} />}
                      label="Amount"
                      value={formatMoney(reviewTarget.amount)}
                    />
                    <DetailRow
                      icon={<CalendarDays size={13} />}
                      label="Term"
                      value={`${reviewTarget.termMonths} Months`}
                    />
                    <DetailRow
                      icon={<CalendarDays size={13} />}
                      label="Applied On"
                      value={formatDateTime(reviewTarget.createdAt).date}
                    />
                    <DetailRow
                      icon={<CalendarDays size={13} />}
                      label="Due Date"
                      value={reviewTarget.dueDate}
                    />
                    <DetailRow
                      icon={<Clock size={13} />}
                      label="Status"
                      value={
                        reviewTarget.status === "under_review"
                          ? "Under Review"
                          : capitalise(reviewTarget.status)
                      }
                    />
                    <div className="sm:col-span-2">
                      <DetailRow
                        icon={<MessageSquare size={13} />}
                        label="Purpose"
                        value={reviewTarget.purpose}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Loan Repayment History */}
              <div className="rounded-2xl border border-black/5 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-black/50">
                    <History size={13} />
                    Loan Repayment History
                  </h4>
                  <span className="text-[11px] font-semibold text-black/50">
                    {reviewTarget.repayments.length}{" "}
                    {reviewTarget.repayments.length === 1
                      ? "payment"
                      : "payments"}{" "}
                    recorded
                  </span>
                </div>

                {/* Repayment summary metrics */}
                <div className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-3">
                  <div className="rounded-2xl bg-[#F9F9F7] p-3">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-black/40">
                      Est. Monthly Installment
                    </p>
                    <p className="mt-0.5 text-sm font-bold text-black">
                      {formatMoney(monthlyInstallment)}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-[#F9F9F7] p-3">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-black/40">
                      Total Repaid
                    </p>
                    <p className="mt-0.5 text-sm font-bold text-emerald-700">
                      {formatMoney(reviewTarget.totalRepaid)}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-[#F9F9F7] p-3">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-black/40">
                      Remaining Balance
                    </p>
                    <p className="mt-0.5 text-sm font-bold text-black">
                      {formatMoney(reviewTarget.remainingBalance)}
                    </p>
                  </div>
                </div>

                {reviewTarget.repayments.length > 0 ? (
                  <div className="mt-3 max-h-56 overflow-y-auto rounded-2xl border border-black/5">
                    <table className="w-full text-left text-xs">
                      <thead className="border-b border-black/5 bg-[#F9F9F7] text-[10px] font-bold uppercase tracking-wider text-black/40">
                        <tr>
                          <th className="px-3 py-2.5">Installment</th>
                          <th className="px-3 py-2.5">Date</th>
                          <th className="px-3 py-2.5">Method</th>
                          <th className="px-3 py-2.5">Status</th>
                          <th className="px-3 py-2.5 text-right">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-black/5">
                        {reviewTarget.repayments.map((item) => (
                          <tr key={item.id}>
                            <td className="px-3 py-2.5 font-mono font-semibold text-black">
                              #{item.installmentNumber || "—"}
                            </td>
                            <td className="px-3 py-2.5 text-black/60">
                              {formatDateTime(item.paidAt).date}
                            </td>
                            <td className="px-3 py-2.5 text-black/60">
                              {item.method || "Account Debit"}
                              {item.reference ? ` · ${item.reference}` : ""}
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
                ) : (
                  <p className="mt-3 rounded-2xl bg-[#F9F9F7] p-3 text-xs text-black/50">
                    {reviewTarget.status === "approved"
                      ? "No repayments have been recorded for this loan yet."
                      : "Repayment history will appear here once this loan application is approved and payments are made."}
                  </p>
                )}
              </div>

              {/* Internal notes */}
              <div className="rounded-2xl border border-black/5 p-4">
                <div className="flex items-center justify-between">
                  <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-black/50">
                    <MessageSquare size={13} />
                    Internal Notes
                  </h4>
                  <span className="text-[10px] font-semibold text-black/40">
                    Visible to staff & admin only
                  </span>
                </div>

                {reviewTarget.internalNotes.length > 0 ? (
                  <div className="mt-3 max-h-52 space-y-2 overflow-y-auto pr-1">
                    {reviewTarget.internalNotes
                      .slice()
                      .reverse()
                      .map((note, index) => (
                        <div
                          key={`${note.id}-${index}`}
                          className="rounded-2xl bg-[#F9F9F7] p-3"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-[11px] font-bold text-black">
                              {note.addedByName}
                            </p>
                            <p className="text-[10px] text-black/40">
                              {formatDateTime(note.createdAt).date} ·{" "}
                              {formatDateTime(note.createdAt).time}
                            </p>
                          </div>
                          <p className="mt-1 whitespace-pre-wrap text-xs text-black/70">
                            {note.note}
                          </p>
                        </div>
                      ))}
                  </div>
                ) : (
                  <p className="mt-3 rounded-2xl bg-[#F9F9F7] p-3 text-xs text-black/50">
                    No internal notes yet.
                  </p>
                )}

                <div className="mt-3">
                  <label
                    htmlFor="admin-loan-note"
                    className="mb-1.5 block text-xs font-bold text-black/60"
                  >
                    Add an internal note
                  </label>
                  <textarea
                    id="admin-loan-note"
                    value={noteText}
                    onChange={(e) => {
                      setNoteText(e.target.value);
                      if (noteError) setNoteError("");
                    }}
                    rows={3}
                    maxLength={500}
                    placeholder="e.g. Verified credit history and approved terms."
                    className="w-full resize-none rounded-2xl bg-[#F3F3EE] p-3.5 text-sm text-black outline-none placeholder:text-black/40 focus-visible:ring-2 focus-visible:ring-[#2C2C2C]"
                  />
                  <div className="mt-1 flex items-center justify-between">
                    <p className="text-[10px] text-black/40">
                      {noteText.length}/500
                    </p>
                    <button
                      type="button"
                      onClick={addNote}
                      disabled={isSaving || noteText.trim().length < 3}
                      className="inline-flex h-9 items-center justify-center gap-1.5 rounded-full bg-[#2C2C2C] px-4 text-xs font-semibold text-white transition-colors hover:bg-[#E6FB2D] hover:text-[#2C2C2C] disabled:opacity-50"
                    >
                      {isSaving ? (
                        <>
                          <RefreshCw size={13} className="animate-spin" />
                          <span>Saving...</span>
                        </>
                      ) : (
                        <>
                          <MessageSquare size={13} />
                          <span>Add note</span>
                        </>
                      )}
                    </button>
                  </div>
                  {noteError && (
                    <div className="mt-2 rounded-xl bg-red-50 p-2.5 text-xs text-red-600">
                      {noteError}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-6 flex flex-col-reverse gap-3 border-t border-black/5 pt-4 sm:flex-row sm:items-center sm:justify-end">
              <button
                type="button"
                onClick={closeReview}
                disabled={isSaving}
                className="h-10 rounded-full border border-black/10 bg-white px-5 text-xs font-semibold text-black/70 transition-colors hover:border-black/20 hover:text-black disabled:opacity-50"
              >
                Close
              </button>

              {reviewTarget.status === "pending" ||
              reviewTarget.status === "under_review" ? (
                <>
                  <button
                    type="button"
                    onClick={() => openDecisionModal(reviewTarget, "reject")}
                    disabled={isSaving}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-full border border-red-200 bg-red-50 px-5 text-xs font-semibold text-red-700 transition-colors hover:bg-red-100 disabled:opacity-50"
                  >
                    <Ban size={14} />
                    Reject Loan
                  </button>
                  <button
                    type="button"
                    onClick={() => openDecisionModal(reviewTarget, "approve")}
                    disabled={isSaving}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-[#2C2C2C] px-5 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-[#E6FB2D] hover:text-[#2C2C2C] disabled:opacity-50"
                  >
                    <ShieldCheck size={14} />
                    Approve Loan
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  disabled
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-[#F3F3EE] px-5 text-xs font-semibold text-black/50"
                >
                  {reviewTarget.status === "approved" ? (
                    <>
                      <CheckCircle2 size={14} />
                      Application Approved
                    </>
                  ) : (
                    <>
                      <XCircle size={14} />
                      Application Rejected
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Approve / Reject Confirmation Modal ── */}
      {decisionTarget && (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
          onMouseDown={closeDecisionModal}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-loan-decision-title"
            onMouseDown={(e) => e.stopPropagation()}
            className="max-h-[92vh] w-full max-w-md overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-black/5 pb-4">
              <div className="flex items-center gap-2.5">
                <div
                  className={`flex size-9 items-center justify-center rounded-xl ${
                    decisionTarget.action === "approve"
                      ? "bg-emerald-50 text-emerald-600"
                      : "bg-red-50 text-red-600"
                  }`}
                >
                  {decisionTarget.action === "approve" ? (
                    <ShieldCheck size={18} />
                  ) : (
                    <Ban size={18} />
                  )}
                </div>
                <div>
                  <h3
                    id="admin-loan-decision-title"
                    className="text-base font-bold text-black"
                  >
                    {decisionTarget.action === "approve"
                      ? "Approve Loan Application"
                      : "Reject Loan Application"}
                  </h3>
                  <p className="font-mono text-[11px] text-black/40">
                    {decisionTarget.loan.loanId}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={closeDecisionModal}
                disabled={isSaving}
                aria-label="Close confirmation dialog"
                className="rounded-full p-1 text-black/40 hover:bg-black/5 hover:text-black disabled:opacity-50"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-4 space-y-3 text-sm text-black/70">
              <p>
                {decisionTarget.action === "approve" ? (
                  <>
                    Are you sure you want to approve this loan application? The
                    loan amount will be{" "}
                    <strong className="text-black">
                      credited to the customer&apos;s bank account
                    </strong>{" "}
                    and monthly installments will be auto-debited every month.
                  </>
                ) : (
                  <>
                    Are you sure you want to reject this loan application? Its
                    status will change to{" "}
                    <strong className="text-black">Rejected</strong>.
                  </>
                )}
              </p>

              <div className="space-y-1.5 rounded-2xl bg-[#F9F9F7] p-3.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-black/50">Customer:</span>
                  <span className="max-w-48 truncate font-semibold text-black">
                    {decisionTarget.loan.customer.name}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-black/50">Account:</span>
                  <span className="font-mono font-semibold text-black">
                    {formatAccNo(decisionTarget.loan.accountNumber)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-black/50">Type:</span>
                  <span className="font-semibold capitalize text-black">
                    {decisionTarget.loan.title || decisionTarget.loan.type}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-black/50">Amount:</span>
                  <span className="font-bold text-black">
                    {formatMoney(decisionTarget.loan.amount)}
                  </span>
                </div>
              </div>

              {decisionTarget.action === "reject" && (
                <div>
                  <label
                    htmlFor="admin-loan-reject-reason"
                    className="mb-1.5 block text-xs font-bold text-black/60"
                  >
                    Rejection reason (optional)
                  </label>
                  <textarea
                    id="admin-loan-reject-reason"
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    rows={2}
                    maxLength={300}
                    placeholder="e.g. Insufficient income verification."
                    className="w-full resize-none rounded-2xl bg-[#F3F3EE] p-3 text-xs text-black outline-none placeholder:text-black/40 focus-visible:ring-2 focus-visible:ring-[#2C2C2C]"
                  />
                </div>
              )}
            </div>

            {decisionError && (
              <div className="mt-3 rounded-xl bg-red-50 p-2.5 text-xs text-red-600">
                {decisionError}
              </div>
            )}

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={closeDecisionModal}
                disabled={isSaving}
                className="h-10 rounded-full border border-black/10 bg-white px-5 text-xs font-semibold text-black/70 transition-colors hover:border-black/20 hover:text-black disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={submitDecision}
                disabled={isSaving}
                className={`inline-flex h-10 items-center justify-center gap-2 rounded-full px-5 text-xs font-semibold shadow-sm transition-colors disabled:opacity-50 ${
                  decisionTarget.action === "approve"
                    ? "bg-[#2C2C2C] text-white hover:bg-[#E6FB2D] hover:text-[#2C2C2C]"
                    : "bg-red-600 text-white hover:bg-red-700"
                }`}
              >
                {isSaving ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    <span>
                      {decisionTarget.action === "approve"
                        ? "Approving..."
                        : "Rejecting..."}
                    </span>
                  </>
                ) : decisionTarget.action === "approve" ? (
                  <>
                    <ShieldCheck size={14} />
                    <span>Confirm Approval</span>
                  </>
                ) : (
                  <>
                    <Ban size={14} />
                    <span>Confirm Rejection</span>
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
