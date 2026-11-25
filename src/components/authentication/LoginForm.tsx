"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Button,
  Description,
  FieldError,
  Input,
  Label,
  TextField,
} from "@heroui/react";
import { Eye, EyeSlash } from "@gravity-ui/icons";
import { LoginPayload } from "@/lib/dataInterface/authentication";
import { authClient } from "@/lib/auth-client";
import { errorToast, successToast } from "@/lib/utils/toasts";

const DASHBOARD_BY_ROLE: Record<string, string> = {
  customer: "/dashboard/customer/status",
  admin: "/dashboard/admin/analytics",
  "bank-staff": "/dashboard/bank-staff/operations",
};

const labelClass = "mb-2 block text-sm text-black/50";
const inputClass =
  "h-[52px] w-full rounded-full bg-white px-5 text-base text-black outline-none placeholder:text-black/40  focus-visible:ring-[#E6FB2D] shadow-none";

export default function LoginForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);

  const handleLogin = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload: LoginPayload = {
        email: email.trim(),
        password: password.trim(),
      };

      const { data, error } = await authClient.signIn.email(payload);

      if (error) {
        errorToast(error.message || "Could not log in.");
        setLoading(false);
        return;
      }

      if (!data) {
        errorToast("Login failed. Please try again.");
        setLoading(false);
        return;
      }

      successToast("Welcome back! You have logged in successfully.");
      setIsRedirecting(true);

      const role = (data.user as { role?: string }).role ?? "customer";
      const destination = DASHBOARD_BY_ROLE[role] ?? DASHBOARD_BY_ROLE.customer;
      
      // router.replace smoothly moves to the dashboard without blocking on current page reload
      router.replace(destination);
    } catch (err) {
      console.error("Login error:", err);

      errorToast(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again.",
      );
      setLoading(false);
      setIsRedirecting(false);
    }
  };

  return (
    <form onSubmit={handleLogin} className="flex flex-col gap-5">
      <div>
        <TextField
          isRequired
          name="email"
          type="email"
          validate={(value) => {
            if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(value)) {
              return "Please enter a valid email address";
            }
            return null;
          }}
        >
          <Label className={labelClass}>Email</Label>
          <Input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClass}
            autoComplete="email"
            placeholder="Enter your email"
          />
          <FieldError />
        </TextField>
      </div>

      <div>
        <TextField
          isRequired
          minLength={8}
          className="relative"
          name="password"
          autoComplete="current-password"
          type={showPassword ? "text" : "password"}
          validate={(value) => {
            if (value.length < 8) {
              return "Password must be at least 8 characters";
            }
            if (!/[A-Z]/.test(value)) {
              return "Password must contain at least one uppercase letter";
            }
            if (!/[0-9]/.test(value)) {
              return "Password must contain at least one number";
            }
            return null;
          }}
        >
          <Label className={labelClass}>Password</Label>

          <Input
            className={`${inputClass} pr-12`}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
          />

          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            aria-pressed={showPassword}
            className="absolute right-2 top-10 flex size-9 items-center justify-center rounded-full text-black/50 transition-colors hover:bg-black/5 hover:text-black focus-visible:outline-2 focus-visible:outline-[#2C2C2C]"
          >
            {showPassword ? <EyeSlash /> : <Eye />}
          </button>

          <Description>
            Must be at least 8 characters with 1 uppercase and 1 number
          </Description>

          <FieldError />
        </TextField>
      </div>

      <Button
        type="submit"
        isDisabled={loading || isRedirecting}
        className="mt-2 h-13 w-full rounded-full bg-[#2C2C2C] px-8 text-base font-medium text-white transition-colors duration-200 data-[hovered=true]:bg-[#E6FB2D] data-[hovered=true]:text-[#2C2C2C] hover:bg-[#E6FB2D] hover:text-[#2C2C2C] disabled:opacity-60"
      >
        {isRedirecting
          ? "Redirecting..."
          : loading
          ? "Please wait..."
          : "Log in"}
      </Button>
    </form>
  );
}
