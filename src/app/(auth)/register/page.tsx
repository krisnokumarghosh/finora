import RegisterForm from "@/components/authentication/RegisterForm";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Create account | Finora" };

export default function RegisterPage() {
  return (
    <main className={` min-h-svh bg-white p-2 sm:p-4`}>
      <div className="relative flex min-h-[calc(100svh-1rem)] items-center justify-center rounded-[2rem] bg-[#F3F3EE] px-6 py-20 sm:min-h-[calc(100svh-2rem)] sm:rounded-[2.5rem]">
        <Link
          href="/"
          aria-label="Close and go back home"
          className="absolute right-4 top-4 flex size-10 items-center justify-center rounded-full bg-white text-black transition-colors duration-200 hover:bg-[#E6FB2D] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2C2C2C] sm:right-5 sm:top-5"
        >
          <svg
            viewBox="0 0 24 24"
            className="size-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            aria-hidden="true"
          >
            <path d="M6 6l12 12M18 6 6 18" />
          </svg>
        </Link>

        <div className="w-full max-w-104">
          <h1 className="text-4xl font-normal tracking-tight text-black sm:text-5xl">
            Open Your Account
          </h1>
          <p className="mt-3 max-w-88 text-base leading-relaxed text-black">
            Create your Finora account in minutes. No paperwork, no branch
            visits.
          </p>

          <div className="mt-10">
            <RegisterForm />
          </div>

          <p className="mt-6 text-sm text-black/60">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-medium text-black underline decoration-[#E6FB2D] decoration-2 underline-offset-4 hover:decoration-black"
            >
              Log in
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
