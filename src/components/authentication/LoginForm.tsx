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

const labelClass = "mb-2 block text-sm text-black/50";
const inputClass =
  "h-[52px] w-full rounded-full bg-white px-5 text-base text-black outline-none placeholder:text-black/40  focus-visible:ring-[#E6FB2D] shadow-none";

export default function LoginForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const form = new FormData(e.currentTarget);
    const email = String(form.get("email"));
    const password = String(form.get("password"));

    try {
      // TODO: connect your auth here, e.g. with Better Auth:
      // const { error } = await authClient.signIn.email({ email, password });
      // if (error) throw new Error(error.message);
      void email;
      void password;

      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not log in.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5">
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

      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}

      <Button
        type="submit"
        isDisabled={loading}
        className="mt-2 h-13 w-full rounded-full bg-[#2C2C2C] px-8 text-base font-medium text-white transition-colors duration-200 data-[hovered=true]:bg-[#E6FB2D] data-[hovered=true]:text-[#2C2C2C] hover:bg-[#E6FB2D] hover:text-[#2C2C2C] disabled:opacity-60"
      >
        {loading ? "Please wait..." : "Log in"}
      </Button>
    </form>
  );
}
