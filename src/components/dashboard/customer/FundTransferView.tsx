"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import {
  Button,
  Input,
  Label,
  TextField,
} from "@heroui/react";
import {
  ArrowRight,
  Copy,
  Check,
  AlertCircle,
  Eye,
  EyeOff,
  ShieldAlert,
} from "lucide-react";
import {
  useGetAccountsQuery,
  useTransferFundsMutation,
  type Account,
} from "@/lib/redux/api";
import { useAppDispatch, useAppSelector } from "@/lib/redux/store";
import { setSelectedAccount } from "@/lib/redux/slices/accountSlice";
import { successToast } from "@/lib/utils/toasts";

/* ─── Design Tokens ─── */
const labelClass = "mb-2 block text-sm font-medium text-black/60";
const inputClass =
  "h-[52px] w-full rounded-2xl bg-[#F3F3EE] px-5 text-base text-black outline-none placeholder:text-black/40 focus-visible:ring-[#E6FB2D] shadow-none";

/* ─── Helper for formatting money ─── */
const formatMoney = (val: number) =>
  `৳${val.toLocaleString("en-BD", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

export default function FundTransferView() {
  const dispatch = useAppDispatch();
  const reduxSelectedAccountId = useAppSelector(
    (state) => state.account.selectedAccountId
  );

  // RTK Queries & Mutations
  const {
    data: accounts = [],
    isLoading: isAccountsLoading,
    isError: isAccountsError,
  } = useGetAccountsQuery();

  const [transferFunds, { isLoading: isTransferring }] =
    useTransferFundsMutation();

  // 1. Sort accounts chronologically by creation date: First created account comes first!
  const sortedAccounts = useMemo(() => {
    return [...accounts].sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
  }, [accounts]);

  // 2. Active sender account selection (defaults to users first created account)
  const activeAccount: Account | undefined = useMemo(() => {
    if (sortedAccounts.length === 0) return undefined;
    if (reduxSelectedAccountId) {
      const found = sortedAccounts.find(
        (acc) => acc.id === reduxSelectedAccountId
      );
      if (found) return found;
    }
    return sortedAccounts[0]; // Initially show first created account
  }, [sortedAccounts, reduxSelectedAccountId]);

  // Sync initial selection to Redux if not already set
  useEffect(() => {
    if (sortedAccounts.length > 0 && !reduxSelectedAccountId) {
      dispatch(setSelectedAccount(sortedAccounts[0].id));
    }
  }, [sortedAccounts, reduxSelectedAccountId, dispatch]);

  // Form State
  const [recipientNumber, setRecipientNumber] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [pin, setPin] = useState("");
  const [showPin, setShowPin] = useState(false);
  const [formError, setFormError] = useState("");

  const [copiedAcc, setCopiedAcc] = useState(false);

  // Handle Account Switch
  const handleSwitchAccount = (accId: string) => {
    dispatch(setSelectedAccount(accId));
    setFormError("");
    setPin(""); // Reset PIN when switching to another account
  };

  // Quick Amount preset handler
  const handleQuickAmount = (val: number) => {
    setAmount(String(val));
    setFormError("");
  };

  // Copy account number to clipboard
  const handleCopyAccNumber = (num: string) => {
    navigator.clipboard.writeText(num);
    setCopiedAcc(true);
    setTimeout(() => setCopiedAcc(false), 2000);
  };

  // Derived validation checks
  const isSenderActive = activeAccount?.status === "active";
  const numAmount = Number(amount) || 0;
  const currentLimit = activeAccount?.transactionLimit ?? 100000;
  const isAmountOverBalance =
    activeAccount ? numAmount > activeAccount.balance : false;
  const isAmountOverLimit = numAmount > currentLimit;

  // Form submit handler
  const handleTransferSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError("");

    if (!activeAccount) {
      setFormError("Please select a sender bank account.");
      return;
    }

    if (activeAccount.status !== "active") {
      setFormError(
        `Fund transfers are only available on active accounts. Your selected account is currently "${activeAccount.status}".`
      );
      return;
    }

    const cleanRecipient = recipientNumber.replace(/\D/g, "");
    if (cleanRecipient.length !== 12) {
      setFormError("Recipient account number must be 12 digits.");
      return;
    }

    if (cleanRecipient === activeAccount.accountNumber) {
      setFormError("Cannot transfer funds to the same account.");
      return;
    }

    if (!numAmount || numAmount <= 0) {
      setFormError("Please enter a valid transfer amount.");
      return;
    }

    if (isAmountOverBalance) {
      setFormError(
        `Insufficient balance. Available balance is ${formatMoney(
          activeAccount.balance
        )}.`
      );
      return;
    }

    if (isAmountOverLimit) {
      setFormError(
        `Amount exceeds per-transaction limit of ${formatMoney(currentLimit)}.`
      );
      return;
    }

    if (!/^\d{4}$/.test(pin)) {
      setFormError("Please enter your 4-digit transaction PIN.");
      return;
    }

    try {
      const response = await transferFunds({
        senderAccountId: activeAccount.id,
        recipientAccountNumber: cleanRecipient,
        amount: numAmount,
        description: description.trim(),
        pin: pin.trim(),
      }).unwrap();

      // Show toast notification & reset form
      successToast(
        `Fund transfer successful! ৳${numAmount.toLocaleString("en-BD", {
          minimumFractionDigits: 2,
        })} transferred to ${response.recipientName || cleanRecipient}.`
      );
      setRecipientNumber("");
      setAmount("");
      setDescription("");
      setPin("");
    } catch (err: unknown) {
      const apiErr = err as { data?: { error?: string } };
      setFormError(
        apiErr.data?.error ||
        "Transfer could not be processed. Please verify your details."
      );
    }
  };

  /* ─── Loading State ─── */
  if (isAccountsLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 animate-pulse rounded-full bg-black/10" />
        <div className="grid gap-6 lg:grid-cols-12">
          <div className="h-64 animate-pulse rounded-3xl bg-white/60 lg:col-span-5" />
          <div className="h-96 animate-pulse rounded-3xl bg-white lg:col-span-7" />
        </div>
      </div>
    );
  }

  /* ─── Error State ─── */
  if (isAccountsError) {
    return (
      <div className="rounded-3xl border border-red-200 bg-red-50 p-8 text-center">
        <p className="text-base font-semibold text-red-600">
          Could not load your accounts.
        </p>
        <p className="mt-1 text-sm text-red-500">
          Please check your connection and refresh the page.
        </p>
      </div>
    );
  }

  /* ─── Empty State: No Accounts ─── */
  if (sortedAccounts.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-black/15 bg-white/80 p-10 text-center">
        <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-black/5 text-black/60">
          <AlertCircle size={28} />
        </div>
        <h2 className="mt-4 text-xl font-bold text-black">
          No bank accounts found
        </h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-black/60">
          You need an active bank account to transfer funds. Create your first
          account to start sending money securely.
        </p>
        <Link
          href="/dashboard/customer/accounts"
          className="mt-6 inline-flex h-12 items-center justify-center rounded-full bg-[#2C2C2C] px-8 text-sm font-medium text-white transition-colors duration-200 hover:bg-[#E6FB2D] hover:text-[#2C2C2C]"
        >
          Create Bank Account
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-neutral-400">
          Payments & Transfers
        </p>
        <h1 className="text-3xl font-bold tracking-tight text-black">
          Fund Transfer
        </h1>
        <p className="mt-1 text-sm text-black/50">
          Transfer money instantly between your accounts or to any bank
          recipient.
        </p>
      </div>

      {/* Main Grid: Account Selector & Info (Left) + Transfer Form (Right) */}
      <div className="grid gap-8 lg:grid-cols-12">
        {/* ── Left Column: Sender Account Switcher & Details ── */}
        <div className="space-y-6 lg:col-span-5">
          {/* Account Switcher Bar (when user has multiple accounts) */}
          {sortedAccounts.length > 1 && (
            <div className="rounded-2xl bg-white p-4 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-black/50">
                  Switch Account
                </span>
                <span className="text-xs text-neutral-400">
                  {sortedAccounts.length} accounts available
                </span>
              </div>
              <div className="flex flex-col gap-2">
                {sortedAccounts.map((acc, index) => {
                  const isSelected = activeAccount?.id === acc.id;
                  const isActive = acc.status === "active";
                  return (
                    <button
                      key={acc.id}
                      type="button"
                      onClick={() => handleSwitchAccount(acc.id)}
                      className={`flex items-center justify-between rounded-xl px-4 py-3 text-left transition-all ${isSelected
                          ? "bg-[#2C2C2C] text-white shadow-sm"
                          : "bg-[#F3F3EE] text-black hover:bg-black/5"
                        }`}
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={`size-2 rounded-full ${isActive
                              ? "bg-emerald-400"
                              : acc.status === "pending"
                                ? "bg-amber-400"
                                : "bg-red-400"
                            }`}
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold capitalize">
                              {acc.type}
                            </span>
                            {index === 0 && (
                              <span
                                className={`rounded px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider ${isSelected
                                    ? "bg-white/20 text-white"
                                    : "bg-black/10 text-black/60"
                                  }`}
                              >
                                Primary
                              </span>
                            )}
                          </div>
                          <span
                            className={`font-mono text-xs ${isSelected ? "text-white/60" : "text-black/40"
                              }`}
                          >
                            •••• {acc.accountNumber.slice(-4)}
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        <p
                          className={`text-sm font-semibold ${isSelected ? "text-white" : "text-black"
                            }`}
                        >
                          {formatMoney(acc.balance)}
                        </p>
                        <span
                          className={`text-[11px] capitalize ${isActive
                              ? isSelected
                                ? "text-emerald-300"
                                : "text-emerald-600"
                              : isSelected
                                ? "text-amber-300"
                                : "text-amber-600"
                            }`}
                        >
                          {acc.status}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Active Account Info Card */}
          {activeAccount && (
            <div className="relative overflow-hidden rounded-3xl bg-[#2C2C2C] p-6 text-white shadow-md sm:p-7">
              {/* Card Header */}
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-white/50">
                    From Account
                  </span>
                  <h3 className="text-lg font-bold capitalize text-white">
                    {activeAccount.type} Account
                  </h3>
                </div>
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium capitalize ${isSenderActive
                      ? "bg-emerald-500/20 text-emerald-300"
                      : "bg-amber-500/20 text-amber-300"
                    }`}
                >
                  <span
                    className={`size-1.5 rounded-full ${isSenderActive ? "bg-emerald-400" : "bg-amber-400"
                      }`}
                  />
                  {activeAccount.status}
                </span>
              </div>

              {/* Account Number with Copy */}
              <div className="mt-6 flex items-center justify-between rounded-xl bg-white/5 px-4 py-2.5">
                <div>
                  <p className="text-[11px] uppercase tracking-wider text-white/40">
                    Account Number
                  </p>
                  <p className="font-mono text-base tracking-widest text-white">
                    {activeAccount.accountNumber}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopyAccNumber(activeAccount.accountNumber)}
                  className="rounded-lg p-2 text-white/50 transition-colors hover:bg-white/10 hover:text-white"
                  title="Copy account number"
                >
                  {copiedAcc ? (
                    <Check size={16} className="text-[#E6FB2D]" />
                  ) : (
                    <Copy size={16} />
                  )}
                </button>
              </div>

              {/* Available Balance */}
              <div className="mt-6 border-t border-white/10 pt-4">
                <p className="text-xs font-medium uppercase tracking-wider text-white/50">
                  Available Balance
                </p>
                <p className="text-3xl font-extrabold tabular-nums tracking-tight text-white">
                  {formatMoney(activeAccount.balance)}
                </p>
              </div>

              {/* Account Holder & Limit Footer */}
              <div className="mt-5 flex items-center justify-between border-t border-white/10 pt-4 text-xs text-white/60">
                <span className="truncate max-w-40">
                  Holder: {activeAccount.name}
                </span>
                <span>
                  Limit: {formatMoney(currentLimit)}
                </span>
              </div>

              {/* Decorative Accent Dot */}
              <span className="absolute right-6 top-6 size-2.5 rounded-full bg-[#E6FB2D]" />
            </div>
          )}

          {/* Warning Banner if Account is NOT active */}
          {!isSenderActive && activeAccount && (
            <div className="flex items-start gap-3 rounded-2xl border border-amber-300/40 bg-amber-50 p-4 text-amber-900">
              <ShieldAlert className="size-5 shrink-0 text-amber-600" />
              <div className="text-xs leading-relaxed">
                <strong className="block font-semibold">
                  Transfers restricted on this account
                </strong>
                This account is currently{" "}
                <span className="font-bold capitalize">
                  {activeAccount.status}
                </span>
                . Fund transfers can only be processed from{" "}
                <span className="font-bold">Active</span> accounts. Please
                switch to an active account above or wait for staff approval.
              </div>
            </div>
          )}
        </div>

        {/* ── Right Column: Fund Transfer Form ── */}
        <div className="lg:col-span-7">
          <div className="rounded-3xl bg-white p-6 shadow-sm sm:p-8">
            <div className="mb-6 flex items-center justify-between border-b border-black/5 pb-4">
              <div>
                <h2 className="text-xl font-bold text-black">
                  Transfer Details
                </h2>
                <p className="mt-0.5 text-xs text-black/50">
                  Please specify recipient account and transfer amount.
                </p>
              </div>
              <span className="inline-flex size-9 items-center justify-center rounded-full bg-[#F3F3EE] text-[#2C2C2C]">
                <ArrowRight size={18} />
              </span>
            </div>

            <form onSubmit={handleTransferSubmit} className="space-y-6">
              {/* Field 1: Recipient Account Number */}
              <TextField isRequired name="recipientAccountNumber">
                <Label className={labelClass}>
                  Recipient Account Number (12 digits)
                </Label>
                <Input
                  value={recipientNumber}
                  onChange={(e) =>
                    setRecipientNumber(e.target.value.replace(/\D/g, ""))
                  }
                  className={`${inputClass} font-mono`}
                  placeholder="e.g. 102938475612"
                  maxLength={12}
                  inputMode="numeric"
                  disabled={!isSenderActive}
                />
              </TextField>

              {/* Field 2: Transfer Amount */}
              <div>
                <TextField isRequired name="amount">
                  <Label className={labelClass}>Transfer Amount (BDT)</Label>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-lg font-bold text-black/50">
                      ৳
                    </span>
                    <Input
                      value={amount}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9.]/g, "");
                        setAmount(val);
                      }}
                      className={`${inputClass} pl-10 text-lg font-bold`}
                      placeholder="0.00"
                      inputMode="decimal"
                      disabled={!isSenderActive}
                    />
                  </div>
                </TextField>

                {/* Quick amount chips */}
                <div className="mt-2.5 flex flex-wrap gap-2">
                  {[500, 1000, 5000, 10000].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      disabled={!isSenderActive}
                      onClick={() => handleQuickAmount(preset)}
                      className="rounded-full border border-black/10 bg-[#F3F3EE] px-3 py-1 text-xs font-medium text-black/70 transition-colors hover:bg-[#E6FB2D] hover:text-[#2C2C2C] disabled:opacity-50"
                    >
                      +৳{preset.toLocaleString()}
                    </button>
                  ))}
                  {activeAccount && activeAccount.balance > 0 && (
                    <button
                      type="button"
                      disabled={!isSenderActive}
                      onClick={() =>
                        handleQuickAmount(
                          Math.min(activeAccount.balance, currentLimit)
                        )
                      }
                      className="rounded-full border border-black/10 bg-[#F3F3EE] px-3 py-1 text-xs font-medium text-black/70 transition-colors hover:bg-[#E6FB2D] hover:text-[#2C2C2C] disabled:opacity-50"
                    >
                      Max Available
                    </button>
                  )}
                </div>

                {/* Amount validation hints */}
                <div className="mt-2 flex items-center justify-between text-xs">
                  <span
                    className={
                      isAmountOverBalance ? "font-bold text-red-600" : "text-black/50"
                    }
                  >
                    Available: {activeAccount ? formatMoney(activeAccount.balance) : "৳0.00"}
                  </span>
                  <span
                    className={
                      isAmountOverLimit ? "font-bold text-red-600" : "text-black/50"
                    }
                  >
                    Max limit: {formatMoney(currentLimit)}
                  </span>
                </div>
              </div>

              {/* Field 3: Description */}
              <TextField name="description">
                <Label className={labelClass}>Description / Purpose</Label>
                <Input
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className={inputClass}
                  placeholder="e.g. Monthly rent, dinner split, bill payment"
                  maxLength={100}
                  disabled={!isSenderActive}
                />
              </TextField>

              {/* Field 4: Transaction PIN */}
              <TextField isRequired name="pin" type={showPin ? "text" : "password"}>
                <Label className={labelClass}>
                  Transaction PIN ({activeAccount ? `${activeAccount.type} •••• ${activeAccount.accountNumber.slice(-4)}` : "4 digits"})
                </Label>
                <div className="relative">
                  <Input
                    value={pin}
                    onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
                    className={`${inputClass} font-mono tracking-widest`}
                    placeholder="••••"
                    maxLength={4}
                    inputMode="numeric"
                    disabled={!isSenderActive}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPin(!showPin)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-black/40 hover:text-black"
                  >
                    {showPin ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                <p className="mt-1.5 text-xs text-black/40">
                  Enter the 4-digit security PIN set for this specific account.
                </p>
              </TextField>

              {/* Form Error Alert */}
              {formError && (
                <div className="flex items-start gap-2.5 rounded-2xl bg-red-50 p-4 text-xs font-medium text-red-700">
                  <AlertCircle className="size-4 shrink-0 text-red-600" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                isDisabled={
                  !isSenderActive ||
                  isTransferring ||
                  isAmountOverBalance ||
                  isAmountOverLimit ||
                  recipientNumber.length !== 12 ||
                  pin.length !== 4
                }
                className="h-13 w-full rounded-full bg-[#2C2C2C] text-base font-semibold text-white transition-colors duration-200 data-[hovered=true]:bg-[#E6FB2D] data-[hovered=true]:text-[#2C2C2C] hover:bg-[#E6FB2D] hover:text-[#2C2C2C] disabled:opacity-40"
              >
                {isTransferring ? (
                  <span className="flex items-center gap-2">
                    <span className="size-4 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                    Processing Transfer...
                  </span>
                ) : !isSenderActive ? (
                  "Sender Account Inactive"
                ) : (
                  `Transfer ${numAmount > 0 ? formatMoney(numAmount) : "Funds"}`
                )}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
