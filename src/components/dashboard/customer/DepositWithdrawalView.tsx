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
  ArrowDownLeft,
  ArrowUpRight,
  AlertCircle,
  Landmark,
  CreditCard,
  Lock,
  Clock,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import {
  useGetAccountsQuery,
  useCreateFundRequestMutation,
  type Account,
  type FundRequestType,
} from "@/lib/redux/api";
import { useAppDispatch, useAppSelector } from "@/lib/redux/store";
import { setSelectedAccount } from "@/lib/redux/slices/accountSlice";
import { successToast } from "@/lib/utils/toasts";
import DashboardPageHeader from "@/components/dashboard/DashboardPageHeader";

/* ─── Design Tokens (Identical to FundTransferView) ─── */
const labelClass = "mb-2 block text-sm font-medium text-black/60";
const inputClass =
  "h-[52px] w-full rounded-2xl bg-[#F3F3EE] px-5 text-base text-black outline-none placeholder:text-black/40 focus-visible:ring-[#E6FB2D] shadow-none";

/* ─── Helper for formatting money ─── */
const formatMoney = (val: number) =>
  `৳${val.toLocaleString("en-BD", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

export default function DepositWithdrawalView() {
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

  const [createFundRequest, { isLoading: isSubmitting }] =
    useCreateFundRequestMutation();

  // Sort accounts chronologically by creation time
  const sortedAccounts = useMemo(() => {
    return [...accounts].sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
  }, [accounts]);

  // Active bank account
  const activeAccount: Account | undefined = useMemo(() => {
    if (sortedAccounts.length === 0) return undefined;
    if (reduxSelectedAccountId) {
      const found = sortedAccounts.find(
        (acc) => acc.id === reduxSelectedAccountId
      );
      if (found) return found;
    }
    return sortedAccounts[0];
  }, [sortedAccounts, reduxSelectedAccountId]);

  // Sync selection to Redux
  useEffect(() => {
    if (sortedAccounts.length > 0 && !reduxSelectedAccountId) {
      dispatch(setSelectedAccount(sortedAccounts[0].id));
    }
  }, [sortedAccounts, reduxSelectedAccountId, dispatch]);

  // Form State
  const [requestType, setRequestType] = useState<FundRequestType>("deposit");
  const [typedAccountNumber, setTypedAccountNumber] = useState<string | null>(
    null
  );
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [pin, setPin] = useState("1234");
  const [formError, setFormError] = useState("");

  // Account number derives from user typing or defaults to the active account number
  const accountNumber =
    typedAccountNumber !== null
      ? typedAccountNumber
      : activeAccount?.accountNumber ?? "";

  // Handle switching account
  const handleSelectAccount = (acc: Account) => {
    dispatch(setSelectedAccount(acc.id));
    setTypedAccountNumber(acc.accountNumber);
    setFormError("");
    setPin("1234");
  };

  // Find the account matching the current typed/selected account number
  const selectedAccountInfo = useMemo(() => {
    const clean = accountNumber.replace(/\D/g, "");
    return sortedAccounts.find((acc) => acc.accountNumber === clean);
  }, [sortedAccounts, accountNumber]);

  const isAccountActive = selectedAccountInfo?.status === "active";
  const numAmount = Number(amount) || 0;
  const isWithdrawalOverBalance =
    requestType === "withdrawal" && selectedAccountInfo
      ? numAmount > selectedAccountInfo.balance
      : false;

  // Handle Form Submission
  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError("");

    const cleanAccNo = accountNumber.replace(/\D/g, "");
    if (cleanAccNo.length !== 12) {
      setFormError("Account number must be a valid 12-digit number.");
      return;
    }

    if (!selectedAccountInfo) {
      setFormError(
        "The entered account number does not match any of your registered bank accounts."
      );
      return;
    }

    if (selectedAccountInfo.status !== "active") {
      setFormError(
        `Transactions are only allowed when the bank account is active. This account is currently "${selectedAccountInfo.status}".`
      );
      return;
    }

    if (!numAmount || numAmount <= 0) {
      setFormError("Please enter a valid amount greater than 0.");
      return;
    }

    if (isWithdrawalOverBalance) {
      setFormError(
        `Insufficient balance for withdrawal. Available balance in this account is ${formatMoney(
          selectedAccountInfo.balance
        )}.`
      );
      return;
    }

    if (!/^\d{4}$/.test(pin)) {
      setFormError("Please enter your 4-digit bank account PIN.");
      return;
    }

    try {
      const res = await createFundRequest({
        accountNumber: cleanAccNo,
        amount: numAmount,
        type: requestType,
        description: description.trim(),
        pin: pin.trim(),
      }).unwrap();

      successToast(
        res.message ||
          `${
            requestType === "deposit" ? "Deposit" : "Withdrawal"
          } request submitted! Status is currently Pending.`
      );

      // Reset fields
      setTypedAccountNumber(null);
      setAmount("");
      setDescription("");
      setPin("1234");
    } catch (err: unknown) {
      const apiErr = err as { data?: { error?: string } };
      setFormError(
        apiErr.data?.error ||
          "Could not submit request. Please verify your details."
      );
    }
  };

  // Loading state
  if (isAccountsLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-60 animate-pulse rounded-full bg-black/10" />
        <div className="mx-auto max-w-2xl h-96 animate-pulse rounded-3xl bg-white" />
      </div>
    );
  }

  // Error state
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

  // Empty state if user has no bank accounts
  if (sortedAccounts.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-black/15 bg-white p-10 text-center">
        <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-black/5 text-black/60">
          <AlertCircle size={28} />
        </div>
        <h2 className="mt-4 text-xl font-bold text-black">
          No bank accounts found
        </h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-black/60">
          You need an active bank account to request deposits or withdrawals.
          Create your account to start managing your funds.
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
    <div className="space-y-5 sm:space-y-6">
      <DashboardPageHeader
        eyebrow="Banking Operations"
        title="Deposit & Withdrawal"
        description="Submit deposit or withdrawal requests for your active bank accounts. All requests are reviewed with pending status initially."
      />

      {/* Main Grid: Form (Left) + Status Definitions (Right) */}
      <div className="grid gap-6 lg:grid-cols-12 lg:gap-8">
        {/* Left: Form Card */}
        <div className="lg:col-span-7">
        <div className="rounded-3xl bg-white p-5 shadow-sm sm:p-8">
          <div className="mb-6 flex items-center justify-between border-b border-black/5 pb-4">
            <div>
              <h2 className="text-xl font-bold text-black">
                Request Details
              </h2>
              <p className="mt-0.5 text-xs text-black/50">
                Choose transaction type and provide account credentials.
              </p>
            </div>
            <span className="inline-flex size-9 items-center justify-center rounded-full bg-[#F3F3EE] text-[#2C2C2C]">
              <Landmark size={18} />
            </span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Field: Radio Buttons for Deposit & Withdrawal */}
            <div>
              <Label className={labelClass}>Transaction Type</Label>
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 sm:gap-3">
                {/* Deposit Radio */}
                <label
                  className={`relative flex cursor-pointer items-center justify-between rounded-2xl border-2 p-3.5 sm:p-4 transition-all duration-200 select-none ${
                    requestType === "deposit"
                      ? "border-[#2C2C2C] bg-[#2C2C2C] text-white shadow-sm"
                      : "border-transparent bg-[#F3F3EE] text-black hover:border-black/15"
                  }`}
                >
                  <input
                    type="radio"
                    name="requestType"
                    value="deposit"
                    checked={requestType === "deposit"}
                    onChange={() => {
                      setRequestType("deposit");
                      setFormError("");
                    }}
                    className="sr-only"
                  />
                  <div className="flex min-w-0 items-center gap-3">
                    <div
                      className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${
                        requestType === "deposit"
                          ? "bg-emerald-400/20 text-emerald-300"
                          : "bg-black/5 text-emerald-600"
                      }`}
                    >
                      <ArrowDownLeft size={20} />
                    </div>
                    <div className="min-w-0">
                      <span className="block text-sm font-semibold">
                        Deposit
                      </span>
                      <span
                        className={`block text-xs truncate ${
                          requestType === "deposit"
                            ? "text-white/60"
                            : "text-black/40"
                        }`}
                      >
                        Add funds into account
                      </span>
                    </div>
                  </div>
                  <span
                    className={`ml-2 flex size-5 shrink-0 items-center justify-center rounded-full border-2 transition-all ${
                      requestType === "deposit"
                        ? "border-[#E6FB2D] bg-[#E6FB2D]"
                        : "border-black/20 bg-transparent"
                    }`}
                  >
                    {requestType === "deposit" && (
                      <span className="size-2 rounded-full bg-[#2C2C2C]" />
                    )}
                  </span>
                </label>

                {/* Withdrawal Radio */}
                <label
                  className={`relative flex cursor-pointer items-center justify-between rounded-2xl border-2 p-3.5 sm:p-4 transition-all duration-200 select-none ${
                    requestType === "withdrawal"
                      ? "border-[#2C2C2C] bg-[#2C2C2C] text-white shadow-sm"
                      : "border-transparent bg-[#F3F3EE] text-black hover:border-black/15"
                  }`}
                >
                  <input
                    type="radio"
                    name="requestType"
                    value="withdrawal"
                    checked={requestType === "withdrawal"}
                    onChange={() => {
                      setRequestType("withdrawal");
                      setFormError("");
                    }}
                    className="sr-only"
                  />
                  <div className="flex min-w-0 items-center gap-3">
                    <div
                      className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${
                        requestType === "withdrawal"
                          ? "bg-amber-400/20 text-amber-300"
                          : "bg-black/5 text-amber-600"
                      }`}
                    >
                      <ArrowUpRight size={20} />
                    </div>
                    <div className="min-w-0">
                      <span className="block text-sm font-semibold">
                        Withdrawal
                      </span>
                      <span
                        className={`block text-xs truncate ${
                          requestType === "withdrawal"
                            ? "text-white/60"
                            : "text-black/40"
                        }`}
                      >
                        Withdraw money out
                      </span>
                    </div>
                  </div>
                  <span
                    className={`ml-2 flex size-5 shrink-0 items-center justify-center rounded-full border-2 transition-all ${
                      requestType === "withdrawal"
                        ? "border-[#E6FB2D] bg-[#E6FB2D]"
                        : "border-black/20 bg-transparent"
                    }`}
                  >
                    {requestType === "withdrawal" && (
                      <span className="size-2 rounded-full bg-[#2C2C2C]" />
                    )}
                  </span>
                </label>
              </div>
            </div>

            {/* Field 1: Account Number */}
            <div>
              <TextField isRequired name="accountNumber">
                <div className="flex items-center justify-between">
                  <Label className={labelClass}>
                    Account Number (12 digits)
                  </Label>
                  {selectedAccountInfo && (
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${
                        selectedAccountInfo.status === "active"
                          ? "bg-emerald-50 text-emerald-700"
                          : selectedAccountInfo.status === "pending"
                          ? "bg-amber-50 text-amber-700"
                          : "bg-red-50 text-red-700"
                      }`}
                    >
                      <span
                        className={`size-1.5 rounded-full ${
                          selectedAccountInfo.status === "active"
                            ? "bg-emerald-500"
                            : selectedAccountInfo.status === "pending"
                            ? "bg-amber-500"
                            : "bg-red-500"
                        }`}
                      />
                      {selectedAccountInfo.status}
                    </span>
                  )}
                </div>

                {/* Quick Account Switcher Pills */}
                {sortedAccounts.length > 1 && (
                  <div className="mb-2.5 flex flex-wrap gap-2">
                    {sortedAccounts.map((acc) => {
                      const isSelected =
                        accountNumber.replace(/\D/g, "") === acc.accountNumber;
                      return (
                        <button
                          key={acc.id}
                          type="button"
                          onClick={() => handleSelectAccount(acc)}
                          className={`flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-medium transition-all ${
                            isSelected
                              ? "bg-[#2C2C2C] text-[#E6FB2D]"
                              : "bg-[#F3F3EE] text-black/70 hover:bg-black/10"
                          }`}
                        >
                          <CreditCard size={14} />
                          <span className="capitalize">{acc.type}</span>
                          <span className="font-mono text-black/40">
                            • {acc.accountNumber.slice(-4)}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}

                <Input
                  value={accountNumber}
                  onChange={(e) => {
                    setTypedAccountNumber(e.target.value.replace(/\D/g, ""));
                    setFormError("");
                  }}
                  className={`${inputClass} font-mono`}
                  placeholder="e.g. 102938475612"
                  maxLength={12}
                  inputMode="numeric"
                />
              </TextField>

              {/* Inactive notice if selected account is not active */}
              {selectedAccountInfo && !isAccountActive && (
                <div className="mt-2.5 flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
                  <AlertCircle size={16} className="shrink-0 text-amber-600" />
                  <span>
                    Transactions are only allowed when the bank account is{" "}
                    <strong>active</strong>. This account is currently{" "}
                    <strong>{selectedAccountInfo.status}</strong>.
                  </span>
                </div>
              )}
            </div>

            {/* Field 2: Amount */}
            <div>
              <TextField isRequired name="amount">
                <div className="flex items-center justify-between">
                  <Label className={labelClass}>Amount (BDT)</Label>
                  {selectedAccountInfo && (
                    <span className="text-xs text-black/50">
                      Balance:{" "}
                      <strong className="text-black">
                        {formatMoney(selectedAccountInfo.balance)}
                      </strong>
                    </span>
                  )}
                </div>

                <div className="relative">
                  <span className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-lg font-bold text-black/50">
                    ৳
                  </span>
                  <Input
                    value={amount}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^0-9.]/g, "");
                      setAmount(val);
                      setFormError("");
                    }}
                    className={`${inputClass} pl-10 text-lg font-bold`}
                    placeholder="0.00"
                    inputMode="decimal"
                  />
                </div>
              </TextField>

              {/* Quick preset amount chips */}
              <div className="mt-2.5 flex flex-wrap gap-2">
                {[500, 1000, 5000, 10000, 20000].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => {
                      setAmount(String(preset));
                      setFormError("");
                    }}
                    className="rounded-full border border-black/10 bg-[#F3F3EE] px-3 py-1 text-xs font-medium text-black/70 transition-colors hover:bg-[#E6FB2D] hover:text-[#2C2C2C]"
                  >
                    +৳{preset.toLocaleString()}
                  </button>
                ))}
                {selectedAccountInfo &&
                  requestType === "withdrawal" &&
                  selectedAccountInfo.balance > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        setAmount(String(selectedAccountInfo.balance));
                        setFormError("");
                      }}
                      className="rounded-full border border-black/10 bg-[#F3F3EE] px-3 py-1 text-xs font-medium text-black/70 transition-colors hover:bg-[#E6FB2D] hover:text-[#2C2C2C]"
                    >
                      Max Available
                    </button>
                  )}
              </div>

              {/* Over-balance warning for withdrawal */}
              {isWithdrawalOverBalance && selectedAccountInfo && (
                <p className="mt-1.5 text-xs font-medium text-red-600">
                  Withdrawal amount exceeds available balance of{" "}
                  {formatMoney(selectedAccountInfo.balance)}.
                </p>
              )}
            </div>

            {/* Field 3: Description */}
            <TextField name="description">
              <Label className={labelClass}>Description / Purpose</Label>
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className={inputClass}
                placeholder={
                  requestType === "deposit"
                    ? "e.g. Salary deposit, cash savings"
                    : "e.g. Monthly rent, utility bill, cash withdrawal"
                }
                maxLength={150}
              />
            </TextField>

            {/* Field 4: Bank Account PIN */}
            <TextField
              isRequired
              name="pin"
              type="password"
            >
              <Label className={labelClass}>
                Bank Account PIN{" "}
                {selectedAccountInfo
                  ? `(for •••• ${selectedAccountInfo.accountNumber.slice(-4)})`
                  : "(4 digits)"}
              </Label>
              <div className="relative">
                <Input
                  value={pin}
                  onChange={(e) => {
                    setPin(e.target.value.replace(/\D/g, ""));
                    setFormError("");
                  }}
                  className={`${inputClass} font-mono tracking-widest`}
                  placeholder="••••"
                  maxLength={4}
                  inputMode="numeric"
                />
              </div>
              <p className="mt-1.5 flex items-center gap-1.5 text-xs text-black/40">
                <Lock size={12} className="text-black/40" />
                PIN is autofilled &amp; masked for account{" "}
                <strong>{accountNumber || "specified"}</strong>.
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
                isSubmitting ||
                (selectedAccountInfo && !isAccountActive) ||
                numAmount <= 0 ||
                pin.length !== 4 ||
                isWithdrawalOverBalance
              }
              className="h-13 w-full rounded-full bg-[#2C2C2C] text-base font-semibold text-white transition-colors duration-200 data-[hovered=true]:bg-[#E6FB2D] data-[hovered=true]:text-[#2C2C2C] hover:bg-[#E6FB2D] hover:text-[#2C2C2C] disabled:opacity-40"
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <span className="size-4 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                  Submitting Request...
                </span>
              ) : selectedAccountInfo && !isAccountActive ? (
                "Selected Account Inactive"
              ) : (
                `Submit ${
                  requestType === "deposit" ? "Deposit" : "Withdrawal"
                } Request`
              )}
            </Button>
          </form>
        </div>
        </div>

        {/* Right: Status Definitions */}
        <div className="lg:col-span-5">
          <div className="rounded-3xl border border-black/10 bg-[#FAFAFA] p-6">
            <h3 className="text-sm font-bold text-black">
              Request Status Lifecycle
            </h3>
            <p className="mt-1 text-xs text-black/50">
              How your deposit and withdrawal requests are processed:
            </p>

            <div className="mt-4 space-y-3.5">
              {/* Pending */}
              <div className="flex items-start gap-3 rounded-2xl border border-black/5 bg-white p-3.5">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                  <Clock size={16} />
                </div>
                <div>
                  <p className="text-xs font-bold text-amber-900">
                    1. Pending
                  </p>
                  <p className="mt-0.5 text-xs leading-relaxed text-black/60">
                    Immediately after submission, your request is marked as{" "}
                    <strong>pending</strong> and awaits review by bank staff or
                    admin.
                  </p>
                </div>
              </div>

              {/* Approved */}
              <div className="flex items-start gap-3 rounded-2xl border border-black/5 bg-white p-3.5">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                  <CheckCircle2 size={16} />
                </div>
                <div>
                  <p className="text-xs font-bold text-emerald-900">
                    2. Approved
                  </p>
                  <p className="mt-0.5 text-xs leading-relaxed text-black/60">
                    Upon approval, the requested deposit or withdrawal amount is
                    applied to your bank account balance.
                  </p>
                </div>
              </div>

              {/* Rejected */}
              <div className="flex items-start gap-3 rounded-2xl border border-black/5 bg-white p-3.5">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600">
                  <XCircle size={16} />
                </div>
                <div>
                  <p className="text-xs font-bold text-red-900">
                    3. Rejected
                  </p>
                  <p className="mt-0.5 text-xs leading-relaxed text-black/60">
                    If account parameters, verification, or compliance criteria
                    are not met, the request will be declined with no changes to
                    your balance.
                  </p>
                </div>
              </div>
            </div>

            {/* Note */}
            <div className="mt-4 rounded-2xl border border-black/5 bg-white p-3.5">
              <p className="text-xs text-black/50">
                <strong className="text-black">Note:</strong> Only{" "}
                <strong>active</strong> bank accounts can submit deposit or
                withdrawal requests. Accounts in <em>pending</em>,{" "}
                <em>frozen</em>, or <em>rejected</em> state are ineligible. Your
                correct 4-digit account PIN is required to authenticate the
                request.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
