"use client";

import { useEffect, useState } from "react";
import {
  AlertTriangle,
  CalendarDays,
  Check,
  CheckCircle2,
  Copy,
  Landmark,
  Power,
  Receipt,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  ShieldOff,
  UserX,
  Wallet,
  X,
} from "lucide-react";
import {
  useUpdateCustomerStatusMutation,
  useUpdateAdminAccountStatusMutation,
  useVerifyCustomerMutation,
  type AccountStatus,
  type AdminCustomer,
  type StaffCustomerAccount,
  type UserStatus,
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

interface AdminCustomerDetailModalProps {
  customer: AdminCustomer | null;
  onClose: () => void;
  onViewTransactions?: (customer: AdminCustomer) => void;
}

export default function AdminCustomerDetailModal({
  customer,
  onClose,
  onViewTransactions,
}: AdminCustomerDetailModalProps) {
  const [current, setCurrent] = useState<AdminCustomer | null>(customer);
  const [copied, setCopied] = useState(false);
  const [showBlockConfirm, setShowBlockConfirm] = useState(false);
  const [blockReason, setBlockReason] = useState("");
  const [updatingAccount, setUpdatingAccount] = useState<string | null>(null);

  const [updateUserStatus, { isLoading: isUpdatingUser }] =
    useUpdateCustomerStatusMutation();
  const [updateAccountStatus] = useUpdateAdminAccountStatusMutation();
  const [verifyCustomer, { isLoading: isVerifying }] =
    useVerifyCustomerMutation();

  useEffect(() => {
    setCurrent(customer);
  }, [customer]);

  useEffect(() => {
    if (!customer) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isUpdatingUser && !isVerifying) {
        onClose();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [customer, isUpdatingUser, isVerifying, onClose]);

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

  /* ── User Status Management ── */
  const handleSetUserStatus = async (
    newStatus: UserStatus,
    reason?: string
  ) => {
    try {
      const res = await updateUserStatus({
        userId: current.id,
        status: newStatus,
        reason,
      }).unwrap();

      successToast(res.message);
      setCurrent(res.customer);
      setShowBlockConfirm(false);
      setBlockReason("");
    } catch (err: unknown) {
      errorToast(getApiError(err, "Failed to update customer status."));
    }
  };

  /* ── Bank Account Status Management ── */
  const handleSetAccountStatus = async (
    accountId: string,
    newStatus: AccountStatus,
    reason?: string
  ) => {
    setUpdatingAccount(accountId);
    try {
      const res = await updateAccountStatus({
        accountId,
        status: newStatus,
        reason,
      }).unwrap();

      successToast(res.message);
      // Update local account in state
      setCurrent((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          accounts: prev.accounts.map((acc) =>
            acc.id === accountId ? { ...acc, status: newStatus } : acc
          ),
        };
      });
    } catch (err: unknown) {
      errorToast(getApiError(err, "Failed to update bank account status."));
    } finally {
      setUpdatingAccount(null);
    }
  };

  /* ── Verification Toggle ── */
  const toggleVerification = async () => {
    const action = current.verified ? "unverify" : "verify";
    try {
      const res = await verifyCustomer({
        userId: current.id,
        action,
      }).unwrap();

      successToast(res.message);
      setCurrent((prev) =>
        prev
          ? {
              ...prev,
              verified: res.verified,
              verifiedAt: res.verifiedAt,
              verifiedByName: res.verifiedByName,
            }
          : prev
      );
    } catch (err: unknown) {
      errorToast(getApiError(err, "Failed to update verification status."));
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
      onMouseDown={() => {
        if (!isUpdatingUser && !isVerifying) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-customer-detail-title"
        onMouseDown={(event) => event.stopPropagation()}
        className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white p-5 shadow-2xl sm:p-7"
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-black/5 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-[#2C2C2C] text-sm font-bold text-white">
              {initials(current.name)}
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2
                  id="admin-customer-detail-title"
                  className="truncate text-lg font-bold text-black"
                >
                  {current.name}
                </h2>
                {/* User status badge */}
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                    current.status === "active"
                      ? "bg-emerald-50 text-emerald-700"
                      : current.status === "blocked"
                      ? "bg-red-50 text-red-700"
                      : "bg-amber-50 text-amber-700"
                  }`}
                >
                  {current.status === "active" ? (
                    <CheckCircle2 size={12} />
                  ) : current.status === "blocked" ? (
                    <ShieldAlert size={12} />
                  ) : (
                    <UserX size={12} />
                  )}
                  {current.status.charAt(0).toUpperCase() +
                    current.status.slice(1)}
                </span>
              </div>
              <p className="truncate text-xs text-black/50">{current.email}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isUpdatingUser || isVerifying}
            aria-label="Close customer details"
            className="rounded-full p-1 text-black/40 hover:bg-black/5 hover:text-black disabled:opacity-50"
          >
            <X size={18} />
          </button>
        </div>

        <div className="mt-4 space-y-4">
          {/* User ID Card */}
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

          {/* Quick Metrics */}
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
              <p className="text-[11px] text-black/40">Registered accounts</p>
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

          {/* ── User Status & Suspicious Account Controls ── */}
          <div
            className={`rounded-2xl border p-4 ${
              current.status === "blocked"
                ? "border-red-200 bg-red-50/50"
                : current.status === "inactive"
                ? "border-amber-200 bg-amber-50/50"
                : "border-black/5 bg-[#F9F9F7]"
            }`}
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-black">
                    Customer Account Status
                  </h3>
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-bold uppercase ${
                      current.status === "active"
                        ? "bg-emerald-100 text-emerald-800"
                        : current.status === "blocked"
                        ? "bg-red-100 text-red-800"
                        : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {current.status}
                  </span>
                </div>
                <p className="mt-1 text-xs text-black/50">
                  {current.status === "blocked"
                    ? `Account blocked. Reason: ${
                        current.statusReason || "Suspicious account activity"
                      }`
                    : current.status === "inactive"
                    ? "Customer is currently deactivated and cannot access services."
                    : "Customer is active and in good standing."}
                </p>
              </div>

              {/* Status Action Buttons */}
              <div className="flex flex-wrap items-center gap-2">
                {current.status === "active" ? (
                  <>
                    <button
                      type="button"
                      onClick={() => handleSetUserStatus("inactive")}
                      disabled={isUpdatingUser}
                      className="inline-flex h-8 items-center gap-1.5 rounded-full border border-black/15 bg-white px-3 text-xs font-semibold text-black/70 transition-colors hover:border-black/30 hover:text-black disabled:opacity-50"
                    >
                      <Power size={13} />
                      Deactivate
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowBlockConfirm(true)}
                      disabled={isUpdatingUser}
                      className="inline-flex h-8 items-center gap-1.5 rounded-full bg-red-600 px-3.5 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-red-700 disabled:opacity-50"
                    >
                      <ShieldAlert size={13} />
                      Block Suspicious
                    </button>
                  </>
                ) : current.status === "inactive" ? (
                  <>
                    <button
                      type="button"
                      onClick={() => handleSetUserStatus("active")}
                      disabled={isUpdatingUser}
                      className="inline-flex h-8 items-center gap-1.5 rounded-full bg-[#2C2C2C] px-3.5 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-[#E6FB2D] hover:text-[#2C2C2C] disabled:opacity-50"
                    >
                      <CheckCircle2 size={13} />
                      Activate
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowBlockConfirm(true)}
                      disabled={isUpdatingUser}
                      className="inline-flex h-8 items-center gap-1.5 rounded-full bg-red-600 px-3.5 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-red-700 disabled:opacity-50"
                    >
                      <ShieldAlert size={13} />
                      Block Suspicious
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleSetUserStatus("active")}
                    disabled={isUpdatingUser}
                    className="inline-flex h-8 items-center gap-1.5 rounded-full bg-emerald-600 px-3.5 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700 disabled:opacity-50"
                  >
                    <ShieldCheck size={13} />
                    Unblock & Activate
                  </button>
                )}
              </div>
            </div>

            {/* Block Suspicious Confirm Dialog */}
            {showBlockConfirm && (
              <div className="mt-4 rounded-xl border border-red-200 bg-white p-4">
                <div className="flex items-start gap-2.5">
                  <AlertTriangle
                    size={18}
                    className="shrink-0 text-red-600"
                  />
                  <div className="w-full">
                    <p className="text-xs font-bold text-black">
                      Confirm Block Suspicious Account
                    </p>
                    <p className="mt-0.5 text-[11px] text-black/60">
                      Blocking this account will immediately restrict customer
                      access and freeze their active bank accounts.
                    </p>
                    <input
                      type="text"
                      value={blockReason}
                      onChange={(e) => setBlockReason(e.target.value)}
                      placeholder="Reason (e.g., Multiple suspicious transfer attempts)"
                      className="mt-2.5 h-9 w-full rounded-xl border border-black/15 px-3 text-xs text-black outline-none placeholder:text-black/40 focus:border-red-500"
                    />
                    <div className="mt-3 flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setShowBlockConfirm(false);
                          setBlockReason("");
                        }}
                        className="h-7 rounded-full border border-black/10 px-3 text-[11px] font-semibold text-black/60 hover:text-black"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          handleSetUserStatus(
                            "blocked",
                            blockReason.trim() || undefined
                          )
                        }
                        disabled={isUpdatingUser}
                        className="h-7 rounded-full bg-red-600 px-4 text-[11px] font-semibold text-white hover:bg-red-700"
                      >
                        {isUpdatingUser ? "Blocking..." : "Confirm Block"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Verification Card */}
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
                      ? `Verified by ${
                          current.verifiedByName || "Bank Staff"
                        }${
                          current.verifiedAt
                            ? ` on ${formatDateTime(current.verifiedAt).date}`
                            : ""
                        }.`
                      : "Customer documents have not been marked as verified yet."}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={toggleVerification}
                disabled={isVerifying}
                className={`inline-flex h-8 shrink-0 items-center justify-center gap-1.5 rounded-full px-3 text-xs font-semibold transition-colors disabled:opacity-50 ${
                  current.verified
                    ? "border border-black/10 bg-white text-black/70 hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                    : "bg-[#2C2C2C] text-white hover:bg-[#E6FB2D] hover:text-[#2C2C2C]"
                }`}
              >
                {isVerifying ? (
                  <RefreshCw size={12} className="animate-spin" />
                ) : current.verified ? (
                  <ShieldOff size={12} />
                ) : (
                  <ShieldCheck size={12} />
                )}
                {current.verified ? "Remove verification" : "Verify customer"}
              </button>
            </div>
          </div>

          {/* ── Bank Accounts with Activate/Deactivate/Block Controls ── */}
          <div>
            <div className="mb-2.5 flex items-center justify-between">
              <h3 className="text-sm font-bold text-black">
                Bank Accounts ({current.accounts.length})
              </h3>
              <span className="text-[11px] font-semibold text-black/40">
                Manage account activation and freeze controls
              </span>
            </div>

            {current.accounts.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-black/15 bg-white/60 px-4 py-8 text-center">
                <Landmark size={22} className="mx-auto text-black/25" />
                <p className="mt-2 text-xs font-bold text-black/60">
                  No bank accounts registered
                </p>
                <p className="mt-0.5 text-[11px] text-black/40">
                  This customer has not opened any bank accounts yet.
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-black/5 overflow-hidden rounded-2xl border border-black/5">
                {current.accounts.map((account: StaffCustomerAccount) => {
                  const isAccountUpdating = updatingAccount === account.id;

                  return (
                    <li
                      key={account.id}
                      className="flex flex-col gap-3 p-3.5 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <AccountTypeIcon type={account.type} />
                        <div>
                          <p className="font-mono text-xs font-bold text-black">
                            {formatAccNo(account.accountNumber)}
                          </p>
                          <p className="text-[11px] capitalize text-black/45">
                            {account.type} · Balance:{" "}
                            <span className="font-bold text-black">
                              {formatMoney(account.balance)}
                            </span>
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-2.5 sm:justify-end">
                        <AccountStatusBadge status={account.status} />

                        {/* Account status action buttons */}
                        <div className="flex items-center gap-1.5">
                          {account.status === "active" ? (
                            <button
                              type="button"
                              onClick={() =>
                                handleSetAccountStatus(account.id, "frozen")
                              }
                              disabled={isAccountUpdating}
                              title="Deactivate / Freeze bank account"
                              className="inline-flex h-7 items-center gap-1 rounded-full border border-black/10 bg-white px-2.5 text-[11px] font-semibold text-black/70 hover:border-black/20 hover:text-black disabled:opacity-50"
                            >
                              <Power size={11} />
                              Deactivate
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() =>
                                handleSetAccountStatus(account.id, "active")
                              }
                              disabled={isAccountUpdating}
                              title="Activate bank account"
                              className="inline-flex h-7 items-center gap-1 rounded-full bg-[#2C2C2C] px-2.5 text-[11px] font-semibold text-white hover:bg-[#E6FB2D] hover:text-[#2C2C2C] disabled:opacity-50"
                            >
                              <CheckCircle2 size={11} />
                              Activate
                            </button>
                          )}

                          {account.status !== "frozen" && (
                            <button
                              type="button"
                              onClick={() =>
                                handleSetAccountStatus(
                                  account.id,
                                  "frozen",
                                  "Suspicious bank account activity"
                                )
                              }
                              disabled={isAccountUpdating}
                              title="Block suspicious bank account"
                              className="inline-flex h-7 items-center gap-1 rounded-full border border-red-200 bg-red-50 px-2.5 text-[11px] font-semibold text-red-700 hover:bg-red-100 disabled:opacity-50"
                            >
                              <ShieldAlert size={11} />
                              Block
                            </button>
                          )}
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="mt-6 flex flex-col-reverse gap-3 border-t border-black/5 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            onClick={onClose}
            className="h-10 rounded-full border border-black/10 bg-white px-5 text-xs font-semibold text-black/70 transition-colors hover:border-black/20 hover:text-black"
          >
            Close
          </button>

          {onViewTransactions && (
            <button
              type="button"
              onClick={() => onViewTransactions(current)}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-[#2C2C2C] px-5 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-[#E6FB2D] hover:text-[#2C2C2C]"
            >
              <Receipt size={14} />
              View Transactions
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
