"use client";

import { useEffect, useState } from "react";
import {
  Eye,
  EyeOff,
  RefreshCw,
  UserPlus,
  X,
} from "lucide-react";
import { useRegisterCustomerMutation } from "@/lib/redux/api";
import { errorToast, successToast } from "@/lib/utils/toasts";
import { getApiError } from "@/components/dashboard/staff/staffUi";

const inputClass =
  "h-12 w-full rounded-2xl bg-[#F3F3EE] px-4 text-sm font-medium text-black outline-none placeholder:text-black/40 focus-visible:ring-2 focus-visible:ring-[#2C2C2C]";
const labelClass = "mb-1.5 block text-xs font-bold text-black/60";

export default function StaffRegisterCustomerModal({
  onClose,
  onRegistered,
}: {
  onClose: () => void;
  onRegistered?: () => void;
}) {
  const [registerCustomer, { isLoading }] = useRegisterCustomerMutation();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  // Close on Escape and lock page scroll while the modal is open.
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

  const handleSubmit = async (event: React.SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    const cleanName = name.trim();
    const cleanEmail = email.trim();

    if (cleanName.length < 2) {
      setError("Enter the customer's full name.");
      return;
    }

    if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(cleanEmail)) {
      setError("Enter a valid email address.");
      return;
    }

    if (password.length < 8) {
      setError("Temporary password must be at least 8 characters.");
      return;
    }

    if (!/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
      setError(
        "Temporary password must contain at least one uppercase letter and one number."
      );
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      const response = await registerCustomer({
        name: cleanName,
        email: cleanEmail,
        password,
      }).unwrap();

      successToast(response.message || "Customer registered successfully.");
      onRegistered?.();
      onClose();
    } catch (err: unknown) {
      const message = getApiError(err, "Failed to register the customer.");
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
        aria-labelledby="register-customer-title"
        onMouseDown={(event) => event.stopPropagation()}
        className="max-h-[92vh] w-full max-w-md overflow-y-auto rounded-3xl bg-white p-5 shadow-2xl sm:p-6"
      >
        <div className="flex items-center justify-between border-b border-black/5 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-xl bg-[#F3F3EE] text-black">
              <UserPlus size={18} />
            </div>
            <div>
              <h2
                id="register-customer-title"
                className="text-base font-bold text-black"
              >
                Register new customer
              </h2>
              <p className="text-[11px] text-black/40">
                Create a customer login for Finora.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            aria-label="Close register customer dialog"
            className="rounded-full p-1 text-black/40 hover:bg-black/5 hover:text-black disabled:opacity-50"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label htmlFor="staff-customer-name" className={labelClass}>
              Full name
            </label>
            <input
              id="staff-customer-name"
              type="text"
              value={name}
              onChange={(event) => {
                setName(event.target.value);
                if (error) setError("");
              }}
              placeholder="e.g. Rahim Ahmed"
              maxLength={60}
              className={inputClass}
              autoComplete="off"
            />
          </div>

          <div>
            <label htmlFor="staff-customer-email" className={labelClass}>
              Email address
            </label>
            <input
              id="staff-customer-email"
              type="email"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                if (error) setError("");
              }}
              placeholder="customer@example.com"
              className={inputClass}
              autoComplete="off"
            />
          </div>

          <div>
            <label htmlFor="staff-customer-password" className={labelClass}>
              Temporary password
            </label>
            <div className="relative">
              <input
                id="staff-customer-password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value);
                  if (error) setError("");
                }}
                placeholder="At least 8 characters"
                className={`${inputClass} pr-12`}
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword((previous) => !previous)}
                aria-label={
                  showPassword ? "Hide temporary password" : "Show temporary password"
                }
                className="absolute right-2 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-full text-black/40 hover:bg-black/5 hover:text-black"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <p className="mt-1 text-[11px] text-black/40">
              Must include 1 uppercase letter and 1 number.
            </p>
          </div>

          <div>
            <label
              htmlFor="staff-customer-confirm-password"
              className={labelClass}
            >
              Confirm temporary password
            </label>
            <input
              id="staff-customer-confirm-password"
              type={showPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(event) => {
                setConfirmPassword(event.target.value);
                if (error) setError("");
              }}
              placeholder="Re-enter the password"
              className={inputClass}
              autoComplete="new-password"
            />
          </div>

          <div className="rounded-2xl bg-[#F9F9F7] p-3.5 text-[11px] leading-relaxed text-black/50">
            The customer can sign in with this email and temporary password.
            Their information is marked unverified until a staff member reviews
            it.
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
              disabled={isLoading}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-[#2C2C2C] px-5 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-[#E6FB2D] hover:text-[#2C2C2C] disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <RefreshCw size={14} className="animate-spin" />
                  Registering...
                </>
              ) : (
                <>
                  <UserPlus size={14} />
                  Register customer
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
