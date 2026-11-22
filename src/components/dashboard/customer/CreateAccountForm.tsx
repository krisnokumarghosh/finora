"use client";

import { useState } from "react";
import {
  Button,
  FieldError,
  Input,
  Label,
  TextField,
} from "@heroui/react";
import {
  useCreateAccountMutation,
  type AccountType,
} from "@/lib/redux/api";

/* ─── Design tokens ─── */
const labelClass = "mb-2 block text-sm text-black/50";
const inputClass =
  "h-[52px] w-full rounded-full bg-[#F3F3EE] px-5 text-base text-black outline-none placeholder:text-black/40 focus-visible:ring-[#E6FB2D] shadow-none";

/* ─── Account type options ─── */
const ACCOUNT_TYPES: { value: AccountType; label: string; desc: string }[] = [
  {
    value: "savings",
    label: "Savings",
    desc: "Earn interest on deposits",
  },
  {
    value: "current",
    label: "Current",
    desc: "Unlimited daily transactions",
  },
  {
    value: "business",
    label: "Business",
    desc: "Built for business needs",
  },
];

/* ─── Account Type Radio Group ─── */
function AccountTypeRadio({
  value,
  onChange,
}: {
  value: AccountType;
  onChange: (v: AccountType) => void;
}) {
  return (
    <div>
      <p className={labelClass}>Account type</p>

      {/* Mobile: stacked rows | sm+: 3-column cards */}
      <div className="flex flex-col gap-2.5 sm:grid sm:grid-cols-3 sm:gap-3">
        {ACCOUNT_TYPES.map((opt) => {
          const selected = value === opt.value;
          return (
            <label
              key={opt.value}
              className={`relative flex cursor-pointer items-center gap-4 rounded-2xl border-2 p-4 transition-all duration-200 select-none
                sm:flex-col sm:items-start sm:gap-2
                ${
                  selected
                    ? "border-[#2C2C2C] bg-[#2C2C2C]"
                    : "border-transparent bg-[#F3F3EE] hover:border-black/15"
                }`}
            >
              <input
                type="radio"
                name="accountType"
                value={opt.value}
                checked={selected}
                onChange={() => onChange(opt.value)}
                className="sr-only"
              />

              {/* Text block — grows on mobile to push dot right */}
              <div className="flex-1 sm:flex-none">
                <span
                  className={`block text-sm font-semibold ${
                    selected ? "text-white" : "text-black"
                  }`}
                >
                  {opt.label}
                </span>
                <span
                  className={`mt-0.5 block text-xs leading-snug ${
                    selected ? "text-white/55" : "text-black/40"
                  }`}
                >
                  {opt.desc}
                </span>
              </div>

              {/* Radio dot — right side on mobile, top-right on sm+ */}
              <span
                className={`flex size-5 shrink-0 items-center justify-center rounded-full border-2 transition-all
                  sm:absolute sm:right-4 sm:top-4
                  ${
                    selected
                      ? "border-[#E6FB2D] bg-[#E6FB2D]"
                      : "border-black/20 bg-transparent"
                  }`}
              >
                {selected && (
                  <span className="size-2 rounded-full bg-[#2C2C2C]" />
                )}
              </span>
            </label>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Create Account Form Component ─── */
export default function CreateAccountForm({ onClose }: { onClose: () => void }) {
  const [createAccount, { isLoading }] = useCreateAccountMutation();
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    type: "savings" as AccountType,
    name: "",
    mobile: "",
    nid: "",
    pin: "",
  });

  const digitsOnly = (value: string) => value.replace(/\D/g, "");

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    try {
      await createAccount(form).unwrap();
      onClose();
    } catch (err) {
      setError(
        (err as { data?: { error?: string } }).data?.error ??
          "Something went wrong"
      );
    }
  }

  return (
    <div className="rounded-3xl bg-white p-6 shadow-sm sm:p-8">
      {/* Header */}
      <div className="mb-7">
        <h2 className="text-xl font-semibold text-black">
          Create bank account
        </h2>
        <p className="mt-1 text-sm text-black/50">
          Your account stays pending until the bank approves it.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Account type radio */}
        <AccountTypeRadio
          value={form.type}
          onChange={(v) => setForm({ ...form, type: v })}
        />

        {/* Other fields */}
        <div className="grid gap-5 sm:grid-cols-2">
          <TextField isRequired name="name" type="text">
            <Label className={labelClass}>Full name</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className={inputClass}
              placeholder="As on your NID"
              minLength={2}
              maxLength={60}
            />
            <FieldError />
          </TextField>

          <TextField isRequired name="mobile" type="tel">
            <Label className={labelClass}>Mobile number</Label>
            <Input
              value={form.mobile}
              onChange={(e) =>
                setForm({ ...form, mobile: digitsOnly(e.target.value) })
              }
              className={inputClass}
              placeholder="01XXXXXXXXX"
              maxLength={11}
              inputMode="numeric"
            />
            <FieldError />
          </TextField>

          <TextField isRequired name="nid">
            <Label className={labelClass}>NID number</Label>
            <Input
              value={form.nid}
              onChange={(e) =>
                setForm({ ...form, nid: digitsOnly(e.target.value) })
              }
              className={inputClass}
              placeholder="Enter your NID"
              maxLength={17}
              inputMode="numeric"
            />
            <FieldError />
          </TextField>

          <TextField isRequired name="pin" type="password">
            <Label className={labelClass}>Transaction PIN (4 digits)</Label>
            <Input
              value={form.pin}
              onChange={(e) =>
                setForm({ ...form, pin: digitsOnly(e.target.value) })
              }
              className={inputClass}
              placeholder="••••"
              maxLength={4}
              inputMode="numeric"
            />
            <FieldError />
          </TextField>
        </div>

        {/* Error */}
        {error && (
          <p
            role="alert"
            className="rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-600"
          >
            {error}
          </p>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-1">
          <Button
            type="submit"
            isDisabled={isLoading}
            className="h-13 rounded-full bg-[#2C2C2C] px-7 text-base font-medium text-white transition-colors duration-200 data-[hovered=true]:bg-[#E6FB2D] data-[hovered=true]:text-[#2C2C2C] hover:bg-[#E6FB2D] hover:text-[#2C2C2C] disabled:opacity-60"
          >
            {isLoading ? "Creating…" : "Create account"}
          </Button>
          <Button
            type="button"
            onPress={onClose}
            className="h-13 rounded-full border border-black/15 bg-transparent px-7 text-base font-medium text-black/70 transition-colors hover:bg-black/5"
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
