"use client";

import { useEffect, useState } from "react";
import {
  CalendarDays,
  Check,
  Copy,
  Landmark,
  Plus,
  RefreshCw,
  ShieldCheck,
  ShieldOff,
  Wallet,
  X,
} from "lucide-react";
import {
  useVerifyCustomerMutation,
  type StaffCustomer,
} from "@/lib/redux/api";
import { errorToast, successToast } from "@/lib/utils/toasts";
import {
  AccountStatusBadge,
  AccountTypeIcon,
  VerificationBadge,
  formatAccNo,
  formatDateTime,
  formatMoney,
  getApiError,
  initials,
} from "@/components/dashboard/staff/staffUi";

export default function StaffCustomerDetailModal({
  customer,
  onClose,
  onCreateAccount,
}: {
  customer: StaffCustomer | null;
  onClose: () => void;
  onCreateAccount?: (customer: StaffCustomer) => void;
}) {
  const [verifyCustomer, { isLoading: isVerifying }] =
    useVerifyCustomerMutation();
  const [current, setCurrent] = useState<StaffCustomer | null>(customer);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!customer) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isVerifying) onClose();
    };

    window.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [customer, isVerifying, onClose]);

  if (!customer || !current) return null;

  const joined = formatDateTime(current.createdAt);

  const copyUserId = async () => {
    try {
      await navigator.clipboard.writeText(current.id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      errorToast("Could not copy the user ID.");
    }
  };

  const toggleVerification = async () => {
    const action = current.verified ? "unverify" : "verify";

    try {
      const response = await verifyCustomer({
        userId: current.id,
        action,
      }).unwrap();

      successToast(response.message);
      setCurrent((previous) =>
        previous
          ? {
              ...previous,
              verified: response.verified,
              verifiedAt: response.verifiedAt,
              verifiedByName: response.verifiedByName,
            }
          : previous
      );
    } catch (err: unknown) {
      errorToast(
        getApiError(
          err,
          action === "verify"
            ? "Failed to verify the customer."
            : "Failed to remove verification."
        )
      );
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
      onMouseDown={() => {
        if (!isVerifying) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="staff-customer-detail-title"
        onMouseDown={(event) => event.stopPropagation()}
        className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white p-5 shadow-2xl sm:p-6"
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-black/5 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-[#2C2C2C] text-sm font-bold text-white">
              {initials(current.name)}
            </div>
            <div className="min-w-0">
              <h2
                id="staff-customer-detail-title"
                className="truncate text-lg font-bold text-black"
              >
                {current.name}
              </h2>
              <p className="truncate text-xs text-black/50">{current.email}</p>
              <div className="mt-1 flex items-center gap-1.5">
                <VerificationBadge verified={current.verified} />
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isVerifying}
            aria-label="Close customer details"
            className="rounded-full p-1 text-black/40 hover:bg-black/5 hover:text-black disabled:opacity-50"
          >
            <X size={18} />
          </button>
        </div>

        <div className="mt-4 space-y-4">
          {/* User ID */}
          <div className="rounded-2xl bg-[#F9F9F7] p-4">
            <p className="text-[11px] font-bold uppercase tracking-wider text-black/40">
              User ID
            </p>
            <div className="mt-1 flex items-center justify-between gap-3">
              <p className="truncate font-mono text-xs font-semibold text-black">
                {current.id}
              </p>
              <button
                type="button"
                onClick={copyUserId}
                aria-label="Copy user ID"
                className="inline-flex size-8 shrink-0 items-center justify-center rounded-full border border-black/10 bg-white text-black/50 transition-colors hover:border-black/20 hover:text-black"
              >
                {copied ? (
                  <Check size={14} className="text-emerald-600" />
                ) : (
                  <Copy size={14} />
                )}
              </button>
            </div>
          </div>

          {/* Summary */}
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-black/5 p-3.5">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-black/40">
                <CalendarDays size={12} />
                Joined
              </div>
              <p className="mt-1 text-sm font-bold text-black">{joined.date}</p>
              <p className="text-[11px] text-black/40">{joined.time}</p>
            </div>
            <div className="rounded-2xl border border-black/5 p-3.5">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-black/40">
                <Landmark size={12} />
                Bank accounts
              </div>
              <p className="mt-1 text-sm font-bold text-black">
                {current.accountCount}
              </p>
              <p className="text-[11px] text-black/40">Maximum 3 accounts</p>
            </div>
            <div className="rounded-2xl border border-black/5 p-3.5">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-black/40">
                <Wallet size={12} />
                Total balance
              </div>
              <p className="mt-1 text-sm font-bold text-black">
                {formatMoney(current.totalBalance)}
              </p>
              <p className="text-[11px] text-black/40">Across all accounts</p>
            </div>
          </div>

          {/* Verification */}
          <div
            className={`rounded-2xl border p-4 ${
              current.verified
                ? "border-emerald-200 bg-emerald-50/60"
                : "border-amber-200 bg-amber-50/60"
            }`}
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-2.5">
                <div
                  className={`flex size-9 shrink-0 items-center justify-center rounded-xl ${
                    current.verified
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-amber-100 text-amber-700"
                  }`}
                >
                  {current.verified ? (
                    <ShieldCheck size={18} />
                  ) : (
                    <ShieldOff size={18} />
                  )}
                </div>
                <div>
                  <p className="text-sm font-bold text-black">
                    {current.verified
                      ? "Customer information verified"
                      : "Customer information not verified"}
                  </p>
                  <p className="mt-0.5 text-[11px] text-black/50">
                    {current.verified
                      ? `Verified by ${current.verifiedByName || "Bank Staff"}${
                          current.verifiedAt
                            ? ` on ${formatDateTime(current.verifiedAt).date}`
                            : ""
                        }.`
                      : "Review the customer details and mark them verified when everything matches."}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={toggleVerification}
                disabled={isVerifying}
                className={`inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-full px-4 text-xs font-semibold transition-colors disabled:opacity-50 ${
                  current.verified
                    ? "border border-black/10 bg-white text-black/70 hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                    : "bg-[#2C2C2C] text-white hover:bg-[#E6FB2D] hover:text-[#2C2C2C]"
                }`}
              >
                {isVerifying ? (
                  <RefreshCw size={13} className="animate-spin" />
                ) : current.verified ? (
                  <ShieldOff size={13} />
                ) : (
                  <ShieldCheck size={13} />
                )}
                {current.verified ? "Remove verification" : "Verify customer"}
              </button>
            </div>
          </div>

          {/* Accounts */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-sm font-bold text-black">Bank accounts</h3>
              <span className="text-[11px] font-semibold text-black/40">
                {current.accountCount} account
                {current.accountCount === 1 ? "" : "s"}
              </span>
            </div>

            {current.accounts.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-black/15 bg-white/60 px-4 py-8 text-center">
                <Landmark size={22} className="mx-auto text-black/25" />
                <p className="mt-2 text-xs font-bold text-black/60">
                  No bank account yet
                </p>
                <p className="mt-0.5 text-[11px] text-black/40">
                  Create the customer&apos;s first bank account.
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-black/5 overflow-hidden rounded-2xl border border-black/5">
                {current.accounts.map((account) => {
                  const created = formatDateTime(account.createdAt);
                  return (
                    <li
                      key={account.id}
                      className="flex flex-col gap-2 p-3.5 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <AccountTypeIcon type={account.type} />
                        <div>
                          <p className="font-mono text-xs font-bold text-black">
                            {formatAccNo(account.accountNumber)}
                          </p>
                          <p className="text-[11px] capitalize text-black/45">
                            {account.type} · opened {created.date}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between gap-3 sm:justify-end">
                        <div className="text-left sm:text-right">
                          <p className="text-sm font-bold text-black">
                            {formatMoney(account.balance)}
                          </p>
                          <p className="text-[10px] text-black/40">
                            Limit {formatMoney(account.transactionLimit || 0)}
                          </p>
                        </div>
                        <AccountStatusBadge status={account.status} />
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 flex flex-col-reverse gap-3 border-t border-black/5 pt-4 sm:flex-row sm:items-center sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={isVerifying}
            className="h-10 rounded-full border border-black/10 bg-white px-5 text-xs font-semibold text-black/70 transition-colors hover:border-black/20 hover:text-black disabled:opacity-50"
          >
            Close
          </button>
          {onCreateAccount && (
            <button
              type="button"
              onClick={() => onCreateAccount(current)}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-[#2C2C2C] px-5 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-[#E6FB2D] hover:text-[#2C2C2C]"
            >
              <Plus size={14} />
              Create bank account
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
