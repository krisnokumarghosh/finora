"use client";

import { useEffect, useState } from "react";
import {
  CalendarDays,
  Check,
  ClipboardCheck,
  Copy,
  Landmark,
  RefreshCw,
  Undo2,
  UserRound,
  Wallet,
  X,
} from "lucide-react";
import {
  useUpdateStaffAccountStatusMutation,
  type StaffBankAccount,
} from "@/lib/redux/api";
import { errorToast, successToast } from "@/lib/utils/toasts";
import {
  AccountStatusBadge,
  AccountTypeIcon,
  formatAccNo,
  formatDateTime,
  formatMoney,
  getApiError,
  initials,
} from "@/components/dashboard/staff/staffUi";

export default function StaffAccountDetailModal({
  account,
  onClose,
  onChanged,
}: {
  account: StaffBankAccount | null;
  onClose: () => void;
  onChanged?: () => void;
}) {
  const [updateStatus, { isLoading }] = useUpdateStaffAccountStatusMutation();
  const [current, setCurrent] = useState<StaffBankAccount | null>(account);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!account) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isLoading) onClose();
    };

    window.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [account, isLoading, onClose]);

  if (!account || !current) return null;

  const created = formatDateTime(current.createdAt);

  const copyAccountNumber = async () => {
    try {
      await navigator.clipboard.writeText(current.accountNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      errorToast("Could not copy the account number.");
    }
  };

  const markUnderReview = async () => {
    try {
      const response = await updateStatus({
        accountId: current.id,
        status: "under_review",
      }).unwrap();

      successToast(response.message);
      setCurrent(response.account);
      onChanged?.();
    } catch (err: unknown) {
      errorToast(
        getApiError(err, "Failed to move the account under review.")
      );
    }
  };

  const removeUnderReview = async () => {
    try {
      const response = await updateStatus({
        accountId: current.id,
        status: "pending",
      }).unwrap();

      successToast(response.message);
      setCurrent(response.account);
      onChanged?.();
    } catch (err: unknown) {
      errorToast(
        getApiError(err, "Failed to remove the account from under review.")
      );
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
      onMouseDown={() => {
        if (!isLoading) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="staff-account-detail-title"
        onMouseDown={(event) => event.stopPropagation()}
        className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white p-5 shadow-2xl sm:p-6"
      >
        <div className="flex items-center justify-between border-b border-black/5 pb-4">
          <div className="flex items-center gap-2.5">
            <AccountTypeIcon type={current.type} />
            <div>
              <h2
                id="staff-account-detail-title"
                className="text-base font-bold capitalize text-black"
              >
                {current.type} account
              </h2>
              <p className="text-[11px] text-black/40">Bank account details</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            aria-label="Close bank account details"
            className="rounded-full p-1 text-black/40 hover:bg-black/5 hover:text-black disabled:opacity-50"
          >
            <X size={18} />
          </button>
        </div>

        <div className="mt-4 space-y-4">
          <div className="rounded-2xl bg-[#F9F9F7] p-4">
            <div className="flex items-center justify-between gap-2">
              <p className="text-[11px] font-bold uppercase tracking-wider text-black/40">
                Account number
              </p>
              <AccountStatusBadge status={current.status} />
            </div>
            <div className="mt-1 flex items-center justify-between gap-3">
              <p className="min-w-0 break-all font-mono text-sm font-bold tracking-wider text-black sm:text-base">
                {formatAccNo(current.accountNumber)}
              </p>
              <button
                type="button"
                onClick={copyAccountNumber}
                aria-label="Copy account number"
                className="inline-flex size-8 shrink-0 items-center justify-center rounded-full border border-black/10 bg-white text-black/50 transition-colors hover:border-black/20 hover:text-black"
              >
                {copied ? (
                  <Check size={14} className="text-emerald-600" />
                ) : (
                  <Copy size={14} />
                )}
              </button>
            </div>
            <p className="mt-2 text-2xl font-extrabold tracking-tight text-black">
              {formatMoney(current.balance)}
            </p>
            <p className="text-[11px] text-black/40">Available balance</p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="min-w-0 rounded-2xl border border-black/5 p-3.5">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-black/40">
                <UserRound size={12} />
                Account holder
              </div>
              <div className="mt-1.5 flex min-w-0 items-center gap-2">
                <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[#2C2C2C] text-[9px] font-bold text-white">
                  {initials(current.name)}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-xs font-bold text-black">
                    {current.name}
                  </p>
                  <p className="truncate text-[10px] text-black/40">
                    {current.customerEmail || "No email"}
                  </p>
                </div>
              </div>
            </div>

            <div className="min-w-0 rounded-2xl border border-black/5 p-3.5">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-black/40">
                <Landmark size={12} />
                Customer user ID
              </div>
              <p className="mt-2 truncate font-mono text-[11px] font-semibold text-black">
                {current.userId || "—"}
              </p>
            </div>

            <div className="rounded-2xl border border-black/5 p-3.5">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-black/40">
                <Wallet size={12} />
                Transaction limit
              </div>
              <p className="mt-1.5 text-sm font-bold text-black">
                {formatMoney(current.transactionLimit || 0)}
              </p>
            </div>

            <div className="rounded-2xl border border-black/5 p-3.5">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-black/40">
                <CalendarDays size={12} />
                Opened on
              </div>
              <p className="mt-1.5 text-sm font-bold text-black">
                {created.date}
              </p>
              <p className="text-[10px] text-black/40">
                {current.createdByName
                  ? `By ${current.createdByName}`
                  : created.time}
              </p>
            </div>
          </div>

          <div className="rounded-2xl bg-[#F9F9F7] p-3.5 text-[11px] leading-relaxed text-black/50">
            Staff can move a pending account under review or remove it back to
            pending. Activation and other account status changes remain an admin
            responsibility.
          </div>
        </div>

        <div className="mt-6 flex flex-col-reverse gap-3 border-t border-black/5 pt-4 sm:flex-row sm:items-center sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="h-10 rounded-full border border-black/10 bg-white px-5 text-xs font-semibold text-black/70 transition-colors hover:border-black/20 hover:text-black disabled:opacity-50"
          >
            Close
          </button>
          {current.status === "pending" && (
            <button
              type="button"
              onClick={markUnderReview}
              disabled={isLoading}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-[#2C2C2C] px-5 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-[#E6FB2D] hover:text-[#2C2C2C] disabled:opacity-50"
            >
              {isLoading ? (
                <RefreshCw size={14} className="animate-spin" />
              ) : (
                <ClipboardCheck size={14} />
              )}
              Mark under review
            </button>
          )}
          {current.status === "under_review" && (
            <button
              type="button"
              onClick={removeUnderReview}
              disabled={isLoading}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-full border border-black/15 bg-white px-5 text-xs font-semibold text-black/80 transition-colors hover:border-amber-300 hover:bg-amber-50 hover:text-amber-800 disabled:opacity-50"
            >
              {isLoading ? (
                <RefreshCw size={14} className="animate-spin" />
              ) : (
                <Undo2 size={14} />
              )}
              Remove from review
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
