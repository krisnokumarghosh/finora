"use client";

import { useEffect, useState } from "react";
import {
  CalendarDays,
  Check,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  Copy,
  Gauge,
  Landmark,
  Pencil,
  RefreshCw,
  ShieldAlert,
  Snowflake,
  UserRound,
  Wallet,
  X,
  XCircle,
} from "lucide-react";
import {
  useUpdateAdminAccountMutation,
  type AccountStatus,
  type AccountType,
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

const STATUS_OPTIONS: {
  value: AccountStatus;
  label: string;
  icon: typeof CheckCircle2;
}[] = [
  { value: "active", label: "Active", icon: CheckCircle2 },
  { value: "frozen", label: "Frozen", icon: Snowflake },
  { value: "pending", label: "Pending", icon: Clock },
  { value: "under_review", label: "Under review", icon: ClipboardCheck },
  { value: "rejected", label: "Rejected", icon: XCircle },
];

const ACCOUNT_TYPES: { value: AccountType; label: string }[] = [
  { value: "savings", label: "Savings" },
  { value: "current", label: "Current" },
  { value: "business", label: "Business" },
];

const inputClass =
  "h-11 w-full rounded-2xl bg-[#F3F3EE] px-4 text-sm font-medium text-black outline-none placeholder:text-black/40 focus-visible:ring-2 focus-visible:ring-[#2C2C2C]";
const labelClass = "mb-1.5 block text-xs font-bold text-black/60";

const digitsOnly = (value: string) => value.replace(/\D/g, "");

export default function AdminAccountDetailModal({
  account,
  onClose,
  onChanged,
}: {
  account: StaffBankAccount | null;
  onClose: () => void;
  onChanged?: () => void;
}) {
  const [updateAccount, { isLoading }] = useUpdateAdminAccountMutation();
  const [current, setCurrent] = useState<StaffBankAccount | null>(account);
  const [copied, setCopied] = useState(false);
  const [savingAction, setSavingAction] = useState<
    "status" | "details" | "limit" | null
  >(null);

  const [statusValue, setStatusValue] = useState<AccountStatus>(
    account?.status ?? "pending"
  );
  const [statusReason, setStatusReason] = useState("");

  const [name, setName] = useState(account?.name ?? "");
  const [mobile, setMobile] = useState(account?.mobile ?? "");
  const [type, setType] = useState<AccountType>(account?.type ?? "savings");

  const [limit, setLimit] = useState(
    String(account?.transactionLimit ?? 100000)
  );

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

  const saveStatus = async (nextStatus: AccountStatus, reason?: string) => {
    setSavingAction("status");
    try {
      const response = await updateAccount({
        accountId: current.id,
        action: "status",
        status: nextStatus,
        reason: reason?.trim() || undefined,
      }).unwrap();

      successToast(response.message);
      setCurrent(response.account);
      setStatusValue(response.account.status);
      setStatusReason("");
      onChanged?.();
    } catch (err: unknown) {
      errorToast(getApiError(err, "Failed to update the account status."));
    } finally {
      setSavingAction(null);
    }
  };

  const saveDetails = async () => {
    const cleanName = name.trim();

    if (cleanName.length < 2 || cleanName.length > 60) {
      errorToast("Account holder name must be 2 to 60 characters.");
      return;
    }

    if (!/^01[3-9]\d{8}$/.test(mobile)) {
      errorToast("Enter a valid 11 digit mobile number.");
      return;
    }

    setSavingAction("details");
    try {
      const response = await updateAccount({
        accountId: current.id,
        action: "details",
        name: cleanName,
        mobile,
        type,
      }).unwrap();

      successToast(response.message);
      setCurrent(response.account);
      setName(response.account.name);
      setMobile(response.account.mobile);
      setType(response.account.type);
      onChanged?.();
    } catch (err: unknown) {
      errorToast(
        getApiError(err, "Failed to update the account information.")
      );
    } finally {
      setSavingAction(null);
    }
  };

  const saveLimit = async () => {
    const limitValue = Number(limit);

    if (
      !Number.isInteger(limitValue) ||
      limitValue < 1000 ||
      limitValue > 10000000
    ) {
      errorToast(
        "Transaction limit must be a whole number between ৳1,000 and ৳10,000,000."
      );
      return;
    }

    setSavingAction("limit");
    try {
      const response = await updateAccount({
        accountId: current.id,
        action: "limit",
        transactionLimit: limitValue,
      }).unwrap();

      successToast(response.message);
      setCurrent(response.account);
      setLimit(String(response.account.transactionLimit ?? limitValue));
      onChanged?.();
    } catch (err: unknown) {
      errorToast(getApiError(err, "Failed to update the transaction limit."));
    } finally {
      setSavingAction(null);
    }
  };

  const isPendingApproval =
    current.status === "pending" || current.status === "under_review";

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
        aria-labelledby="admin-account-detail-title"
        onMouseDown={(event) => event.stopPropagation()}
        className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white p-5 shadow-2xl sm:p-7"
      >
        <div className="flex items-center justify-between border-b border-black/5 pb-4">
          <div className="flex items-center gap-2.5">
            <AccountTypeIcon type={current.type} />
            <div>
              <h2
                id="admin-account-detail-title"
                className="text-base font-bold capitalize text-black"
              >
                {current.type} account
              </h2>
              <p className="text-[11px] text-black/40">
                Bank account management
              </p>
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
              <p className="font-mono text-base font-bold tracking-wider text-black">
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
            <div className="mt-2 flex flex-wrap items-end justify-between gap-2">
              <div>
                <p className="text-2xl font-extrabold tracking-tight text-black">
                  {formatMoney(current.balance)}
                </p>
                <p className="text-[11px] text-black/40">Available balance</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-black">
                  {formatMoney(current.transactionLimit || 0)}
                </p>
                <p className="text-[11px] text-black/40">Transaction limit</p>
              </div>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-black/5 p-3.5">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-black/40">
                <UserRound size={12} />
                Account holder
              </div>
              <div className="mt-1.5 flex items-center gap-2">
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

            <div className="rounded-2xl border border-black/5 p-3.5">
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
                Mobile number
              </div>
              <p className="mt-1.5 text-sm font-bold text-black">
                {current.mobile || "—"}
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

          {(current.statusReason || current.freezeReason) && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-3.5 text-[11px] leading-relaxed text-amber-800">
              <span className="font-bold">Status note: </span>
              {current.freezeReason || current.statusReason}
            </div>
          )}

          {isPendingApproval && (
            <div className="rounded-2xl border border-sky-200 bg-sky-50/60 p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-2.5">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-sky-100 text-sky-700">
                    <ClipboardCheck size={18} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-black">
                      Awaiting admin approval
                    </p>
                    <p className="mt-0.5 text-[11px] text-black/50">
                      Approve to activate the account, or reject it with a
                      reason.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => saveStatus("rejected", statusReason)}
                    disabled={isLoading}
                    className="inline-flex h-8 items-center gap-1.5 rounded-full border border-red-200 bg-white px-3 text-xs font-semibold text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50"
                  >
                    <XCircle size={13} />
                    Reject
                  </button>
                  <button
                    type="button"
                    onClick={() => saveStatus("active", statusReason)}
                    disabled={isLoading}
                    className="inline-flex h-8 items-center gap-1.5 rounded-full bg-[#2C2C2C] px-3.5 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-[#E6FB2D] hover:text-[#2C2C2C] disabled:opacity-50"
                  >
                    {savingAction === "status" ? (
                      <RefreshCw size={13} className="animate-spin" />
                    ) : (
                      <CheckCircle2 size={13} />
                    )}
                    Approve account
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="rounded-2xl border border-black/5 p-4">
            <div className="flex items-center gap-2">
              <ShieldAlert size={15} className="text-black/50" />
              <h3 className="text-sm font-bold text-black">Account status</h3>
            </div>
            <p className="mt-1 text-[11px] text-black/50">
              Freeze or unfreeze the account, move it back for review, or change
              its status. A reason is optional but recommended.
            </p>

            <div className="mt-3 flex flex-wrap gap-1.5">
              {STATUS_OPTIONS.map((option) => {
                const Icon = option.icon;
                const selected = statusValue === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setStatusValue(option.value)}
                    aria-pressed={selected}
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-all ${
                      selected
                        ? "bg-[#2C2C2C] text-white shadow-sm"
                        : "bg-[#F3F3EE] text-black/60 hover:bg-black/10 hover:text-black"
                    }`}
                  >
                    <Icon size={12} />
                    {option.label}
                  </button>
                );
              })}
            </div>

            <div className="mt-3">
              <label htmlFor="admin-account-status-reason" className={labelClass}>
                Reason (optional)
              </label>
              <input
                id="admin-account-status-reason"
                type="text"
                value={statusReason}
                onChange={(event) => setStatusReason(event.target.value)}
                placeholder="e.g. Suspicious activity, customer request..."
                maxLength={200}
                className={inputClass}
              />
            </div>

            <button
              type="button"
              onClick={() => saveStatus(statusValue)}
              disabled={isLoading || statusValue === current.status}
              className="mt-3 inline-flex h-10 items-center justify-center gap-2 rounded-full bg-[#2C2C2C] px-5 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-[#E6FB2D] hover:text-[#2C2C2C] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {savingAction === "status" ? (
                <RefreshCw size={14} className="animate-spin" />
              ) : (
                <ShieldAlert size={14} />
              )}
              {statusValue === current.status
                ? "Current status"
                : `Set to ${statusValue.replace("_", " ")}`}
            </button>
          </div>

          <div className="rounded-2xl border border-black/5 p-4">
            <div className="flex items-center gap-2">
              <Pencil size={15} className="text-black/50" />
              <h3 className="text-sm font-bold text-black">
                Account information
              </h3>
            </div>
            <p className="mt-1 text-[11px] text-black/50">
              The account number and balance are managed by the bank and cannot
              be edited here.
            </p>

            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor="admin-account-name" className={labelClass}>
                  Account holder name
                </label>
                <input
                  id="admin-account-name"
                  type="text"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  maxLength={60}
                  className={inputClass}
                />
              </div>

              <div>
                <label htmlFor="admin-account-mobile" className={labelClass}>
                  Mobile number
                </label>
                <input
                  id="admin-account-mobile"
                  type="tel"
                  value={mobile}
                  onChange={(event) =>
                    setMobile(digitsOnly(event.target.value))
                  }
                  placeholder="01XXXXXXXXX"
                  maxLength={11}
                  inputMode="numeric"
                  className={inputClass}
                />
              </div>
            </div>

            <div className="mt-3">
              <p className={labelClass}>Account type</p>
              <div className="flex flex-wrap gap-1.5">
                {ACCOUNT_TYPES.map((option) => {
                  const selected = type === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setType(option.value)}
                      aria-pressed={selected}
                      className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-all ${
                        selected
                          ? "bg-[#2C2C2C] text-white shadow-sm"
                          : "bg-[#F3F3EE] text-black/60 hover:bg-black/10 hover:text-black"
                      }`}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              type="button"
              onClick={saveDetails}
              disabled={isLoading}
              className="mt-3 inline-flex h-10 items-center justify-center gap-2 rounded-full bg-[#2C2C2C] px-5 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-[#E6FB2D] hover:text-[#2C2C2C] disabled:opacity-50"
            >
              {savingAction === "details" ? (
                <RefreshCw size={14} className="animate-spin" />
              ) : (
                <Pencil size={14} />
              )}
              Save information
            </button>
          </div>

          <div className="rounded-2xl border border-black/5 p-4">
            <div className="flex items-center gap-2">
              <Gauge size={15} className="text-black/50" />
              <h3 className="text-sm font-bold text-black">
                Transaction limit
              </h3>
            </div>
            <p className="mt-1 text-[11px] text-black/50">
              Maximum amount the customer can transfer per transaction.
            </p>

            <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-end">
              <div className="w-full sm:max-w-xs">
                <label htmlFor="admin-account-limit" className={labelClass}>
                  Limit amount (৳)
                </label>
                <input
                  id="admin-account-limit"
                  type="text"
                  value={limit}
                  onChange={(event) =>
                    setLimit(digitsOnly(event.target.value))
                  }
                  placeholder="100000"
                  maxLength={8}
                  inputMode="numeric"
                  className={inputClass}
                />
              </div>
              <button
                type="button"
                onClick={saveLimit}
                disabled={isLoading}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[#2C2C2C] px-5 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-[#E6FB2D] hover:text-[#2C2C2C] disabled:opacity-50"
              >
                {savingAction === "limit" ? (
                  <RefreshCw size={14} className="animate-spin" />
                ) : (
                  <Gauge size={14} />
                )}
                Save limit
              </button>
            </div>
            <p className="mt-2 text-[10px] text-black/40">
              Allowed range: ৳1,000 to ৳10,000,000.
            </p>
          </div>
        </div>

        <div className="mt-6 flex justify-end border-t border-black/5 pt-4">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="h-10 rounded-full border border-black/10 bg-white px-5 text-xs font-semibold text-black/70 transition-colors hover:border-black/20 hover:text-black disabled:opacity-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
