"use client";

import { useEffect, useState } from "react";
import {
  Landmark,
  RefreshCw,
  Search,
  UserRound,
  X,
} from "lucide-react";
import {
  useCreateAdminAccountMutation,
  useCreateCustomerAccountMutation,
  useGetStaffCustomersQuery,
  type AccountType,
  type StaffCustomer,
} from "@/lib/redux/api";
import { errorToast, successToast } from "@/lib/utils/toasts";
import {
  getApiError,
  initials,
} from "@/components/dashboard/staff/staffUi";

const inputClass =
  "h-12 w-full rounded-2xl bg-[#F3F3EE] px-4 text-sm font-medium text-black outline-none placeholder:text-black/40 focus-visible:ring-2 focus-visible:ring-[#2C2C2C]";
const labelClass = "mb-1.5 block text-xs font-bold text-black/60";

const ACCOUNT_TYPES: { value: AccountType; label: string; desc: string }[] = [
  { value: "savings", label: "Savings", desc: "Personal savings account" },
  { value: "current", label: "Current", desc: "Everyday transactions" },
  { value: "business", label: "Business", desc: "Business operations" },
];

const digitsOnly = (value: string) => value.replace(/\D/g, "");

export default function StaffCreateAccountModal({
  onClose,
  onCreated,
  presetCustomer,
  mode = "staff",
}: {
  onClose: () => void;
  onCreated?: () => void;
  presetCustomer?: StaffCustomer | null;
  mode?: "staff" | "admin";
}) {
  const [createStaffAccount, { isLoading: isCreatingStaff }] =
    useCreateCustomerAccountMutation();
  const [createAdminAccount, { isLoading: isCreatingAdmin }] =
    useCreateAdminAccountMutation();
  const isLoading = mode === "admin" ? isCreatingAdmin : isCreatingStaff;
  const isAdmin = mode === "admin";

  const { data: customerData, isLoading: isLoadingCustomers } =
    useGetStaffCustomersQuery(
      { limit: 100 },
      { skip: Boolean(presetCustomer) }
    );

  const [customerSearch, setCustomerSearch] = useState("");
  const [selectedUserId, setSelectedUserId] = useState(
    presetCustomer?.id || ""
  );
  const [type, setType] = useState<AccountType>("savings");
  const [name, setName] = useState(presetCustomer?.name || "");
  const [mobile, setMobile] = useState("");
  const [nid, setNid] = useState("");
  const [pin, setPin] = useState("");
  const [transactionLimit, setTransactionLimit] = useState("100000");
  const [error, setError] = useState("");

  const customers = customerData?.customers || [];
  const selectedCustomer =
    presetCustomer ||
    customers.find((customer) => customer.id === selectedUserId) ||
    null;

  const filteredCustomers = customers.filter((customer) => {
    const query = customerSearch.trim().toLowerCase();
    if (!query) return true;
    return `${customer.name} ${customer.email} ${customer.id}`
      .toLowerCase()
      .includes(query);
  });

  useEffect(() => {
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
  }, [isLoading, onClose]);

  const selectCustomer = (customer: StaffCustomer) => {
    setSelectedUserId(customer.id);
    setName(customer.name);
    if (error) setError("");
  };

  const handleSubmit = async (event: React.SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    if (!selectedCustomer) {
      setError("Select the customer who will own this account.");
      return;
    }

    const cleanName = name.trim();

    if (cleanName.length < 2) {
      setError("Enter the account holder name.");
      return;
    }

    if (!/^01[3-9]\d{8}$/.test(mobile)) {
      setError("Enter a valid 11 digit mobile number.");
      return;
    }

    if (!/^(\d{10}|\d{13}|\d{17})$/.test(nid)) {
      setError("NID must be 10, 13 or 17 digits.");
      return;
    }

    if (!/^\d{4}$/.test(pin)) {
      setError("Transaction PIN must be 4 digits.");
      return;
    }

    const limitValue = Number(transactionLimit);

    if (
      isAdmin &&
      (!Number.isInteger(limitValue) ||
        limitValue < 1000 ||
        limitValue > 10000000)
    ) {
      setError(
        "Transaction limit must be a whole number between ৳1,000 and ৳10,000,000."
      );
      return;
    }

    try {
      const response = isAdmin
        ? await createAdminAccount({
            userId: selectedCustomer.id,
            type,
            name: cleanName,
            mobile,
            nid,
            pin,
            transactionLimit: limitValue,
          }).unwrap()
        : await createStaffAccount({
            userId: selectedCustomer.id,
            type,
            name: cleanName,
            mobile,
            nid,
            pin,
          }).unwrap();

      successToast(response.message || "Customer bank account created.");
      onCreated?.();
      onClose();
    } catch (err: unknown) {
      const message = getApiError(err, "Failed to create the bank account.");
      setError(message);
      errorToast(message);
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
        aria-labelledby="create-customer-account-title"
        onMouseDown={(event) => event.stopPropagation()}
        className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white p-5 shadow-2xl sm:p-6"
      >
        <div className="flex items-center justify-between border-b border-black/5 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-xl bg-[#F3F3EE] text-black">
              <Landmark size={18} />
            </div>
            <div>
              <h2
                id="create-customer-account-title"
                className="text-base font-bold text-black"
              >
                {isAdmin ? "Create bank account" : "Create customer bank account"}
              </h2>
              <p className="text-[11px] text-black/40">
                {isAdmin
                  ? "Admin-created accounts are activated immediately."
                  : "The account starts as pending and can be moved under review."}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            aria-label="Close create bank account dialog"
            className="rounded-full p-1 text-black/40 hover:bg-black/5 hover:text-black disabled:opacity-50"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-5">
          {/* Customer selection */}
          {selectedCustomer ? (
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <span className={labelClass}>Selected customer</span>
                {!presetCustomer && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedUserId("");
                      setName("");
                      setCustomerSearch("");
                    }}
                    className="text-xs font-semibold text-black/60 hover:text-black hover:underline"
                  >
                    Change customer
                  </button>
                )}
              </div>
              <div className="flex items-center justify-between gap-3 rounded-2xl bg-[#F9F9F7] p-3.5 border border-black/5">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#2C2C2C] text-xs font-bold text-white">
                    {initials(selectedCustomer.name)}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-black">
                      {selectedCustomer.name}
                    </p>
                    <p className="truncate text-xs text-black/50">
                      {selectedCustomer.email}
                    </p>
                    <p className="truncate font-mono text-[10px] text-black/40">
                      ID: {selectedCustomer.id}
                    </p>
                  </div>
                </div>
                {!presetCustomer && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedUserId("");
                      setName("");
                      setCustomerSearch("");
                    }}
                    aria-label="Remove selected customer"
                    className="rounded-full p-1.5 text-black/40 hover:bg-black/5 hover:text-black"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div>
              <label htmlFor="staff-account-customer-search" className={labelClass}>
                Find customer
              </label>

              <div className="relative">
                <Search
                  size={16}
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-black/40"
                />
                <input
                  id="staff-account-customer-search"
                  type="text"
                  value={customerSearch}
                  onChange={(event) => setCustomerSearch(event.target.value)}
                  placeholder="Search customer by name, email or user ID..."
                  autoFocus
                  className="h-11 w-full rounded-2xl bg-[#F3F3EE] pl-10 pr-9 text-sm font-medium text-black outline-none placeholder:text-black/40 focus-visible:ring-2 focus-visible:ring-[#2C2C2C]"
                />
                {customerSearch && (
                  <button
                    type="button"
                    onClick={() => setCustomerSearch("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-black/40 hover:text-black"
                    aria-label="Clear customer search"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* Show matching results ONLY when a search query is typed */}
              {customerSearch.trim() ? (
                <div className="mt-2 max-h-44 overflow-y-auto rounded-2xl border border-black/5">
                  {isLoadingCustomers ? (
                    <div className="space-y-2 p-3">
                      {[1, 2, 3].map((item) => (
                        <div
                          key={item}
                          className="h-11 animate-pulse rounded-xl bg-black/5"
                        />
                      ))}
                    </div>
                  ) : filteredCustomers.length === 0 ? (
                    <div className="flex flex-col items-center justify-center px-4 py-6 text-center">
                      <UserRound size={22} className="text-black/30" />
                      <p className="mt-2 text-xs font-semibold text-black/60">
                        No customers found
                      </p>
                      <p className="mt-0.5 text-[11px] text-black/40">
                        No customer matches &quot;{customerSearch.trim()}&quot;
                      </p>
                    </div>
                  ) : (
                    <ul className="divide-y divide-black/5">
                      {filteredCustomers.map((customer) => (
                        <li key={customer.id}>
                          <button
                            type="button"
                            onClick={() => selectCustomer(customer)}
                            className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-black/5"
                          >
                            <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#2C2C2C] text-[10px] font-bold text-white">
                              {initials(customer.name)}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-xs font-bold text-black">
                                {customer.name}
                              </p>
                              <p className="truncate text-[11px] text-black/50">
                                {customer.email}
                              </p>
                            </div>
                            <span className="max-w-24 truncate font-mono text-[10px] text-black/40">
                              {customer.id}
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ) : (
                <div className="mt-2 rounded-2xl bg-[#F9F9F7] px-4 py-3 text-center border border-black/5">
                  <p className="text-xs text-black/50">
                    Type a customer&apos;s name, email, or user ID above to select.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Account type */}
          <div>
            <p className={labelClass}>Account type</p>
            <div className="grid gap-2 sm:grid-cols-3">
              {ACCOUNT_TYPES.map((option) => {
                const selected = type === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setType(option.value)}
                    aria-pressed={selected}
                    className={`rounded-2xl border-2 p-3 text-left transition-all ${
                      selected
                        ? "border-[#2C2C2C] bg-[#2C2C2C] text-white"
                        : "border-transparent bg-[#F3F3EE] text-black hover:border-black/15"
                    }`}
                  >
                    <span className="block text-sm font-bold">
                      {option.label}
                    </span>
                    <span
                      className={`mt-0.5 block text-[11px] leading-snug ${
                        selected ? "text-white/55" : "text-black/45"
                      }`}
                    >
                      {option.desc}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Account holder details */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="staff-account-name" className={labelClass}>
                Account holder name
              </label>
              <input
                id="staff-account-name"
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="As on the customer's NID"
                maxLength={60}
                className={inputClass}
              />
            </div>

            <div>
              <label htmlFor="staff-account-mobile" className={labelClass}>
                Mobile number
              </label>
              <input
                id="staff-account-mobile"
                type="tel"
                value={mobile}
                onChange={(event) => setMobile(digitsOnly(event.target.value))}
                placeholder="01XXXXXXXXX"
                maxLength={11}
                inputMode="numeric"
                className={inputClass}
              />
            </div>

            <div>
              <label htmlFor="staff-account-nid" className={labelClass}>
                NID number
              </label>
              <input
                id="staff-account-nid"
                type="text"
                value={nid}
                onChange={(event) => setNid(digitsOnly(event.target.value))}
                placeholder="10, 13 or 17 digits"
                maxLength={17}
                inputMode="numeric"
                className={inputClass}
              />
            </div>

            <div>
              <label htmlFor="staff-account-pin" className={labelClass}>
                Transaction PIN (4 digits)
              </label>
              <input
                id="staff-account-pin"
                type="password"
                value={pin}
                onChange={(event) => setPin(digitsOnly(event.target.value))}
                placeholder="••••"
                maxLength={4}
                inputMode="numeric"
                className={inputClass}
              />
            </div>

            {isAdmin && (
              <div>
                <label htmlFor="admin-account-limit" className={labelClass}>
                  Per-transaction limit (৳)
                </label>
                <input
                  id="admin-account-limit"
                  type="text"
                  value={transactionLimit}
                  onChange={(event) =>
                    setTransactionLimit(digitsOnly(event.target.value))
                  }
                  placeholder="100000"
                  maxLength={8}
                  inputMode="numeric"
                  className={inputClass}
                />
                <p className="mt-1 text-[10px] text-black/40">
                  Between ৳1,000 and ৳10,000,000.
                </p>
              </div>
            )}
          </div>

          <div className="rounded-2xl bg-[#F9F9F7] p-3.5 text-[11px] leading-relaxed text-black/50">
            {isAdmin
              ? "The starting balance is ৳0.00. The account is active immediately and can be frozen from the account list."
              : "The starting balance is ৳0.00. The customer cannot transact until the account is approved by the bank."}
          </div>

          {error && (
            <p
              role="alert"
              className="rounded-xl bg-red-50 px-3.5 py-2.5 text-xs text-red-600"
            >
              {error}
            </p>
          )}

          <div className="flex flex-col-reverse gap-3 border-t border-black/5 pt-4 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="h-10 rounded-full border border-black/10 bg-white px-5 text-xs font-semibold text-black/70 transition-colors hover:border-black/20 hover:text-black disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !selectedCustomer}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-[#2C2C2C] px-5 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-[#E6FB2D] hover:text-[#2C2C2C] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <RefreshCw size={14} className="animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Landmark size={14} />
                  Create account
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
