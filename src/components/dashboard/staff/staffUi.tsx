import {
  CheckCircle2,
  Clock,
  ClipboardCheck,
  ShieldAlert,
  ShieldCheck,
  Snowflake,
  XCircle,
} from "lucide-react";
import type { AccountStatus } from "@/lib/redux/api";


export const formatMoney = (value: number) =>
  `৳${value.toLocaleString("en-BD", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

export const formatAccNo = (value?: string) => {
  if (!value) return "—";
  return value.replace(/(\d{4})/g, "$1 ").trim();
};

export const formatDateTime = (iso?: string) => {
  if (!iso) return { date: "—", time: "—" };
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return { date: "—", time: "—" };

  return {
    date: date.toLocaleDateString("en-US", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }),
    time: date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    }),
  };
};

export const capitalise = (value: string) =>
  value.charAt(0).toUpperCase() + value.slice(1);

export const getApiError = (error: unknown, fallback: string) => {
  if (error && typeof error === "object" && "data" in error) {
    const data = (error as { data?: { error?: string } }).data;
    if (data?.error) return data.error;
  }
  return fallback;
};

export const initials = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "C";


export function AccountStatusBadge({ status }: { status: AccountStatus }) {
  switch (status) {
    case "active":
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
          <CheckCircle2 size={12} />
          Active
        </span>
      );
    case "under_review":
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-2.5 py-0.5 text-xs font-semibold text-sky-700">
          <ClipboardCheck size={12} />
          Under Review
        </span>
      );
    case "pending":
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700">
          <Clock size={12} />
          Pending
        </span>
      );
    case "frozen":
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700">
          <Snowflake size={12} />
          Frozen
        </span>
      );
    case "rejected":
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-semibold text-red-700">
          <XCircle size={12} />
          Rejected
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center rounded-full bg-black/5 px-2.5 py-0.5 text-xs font-semibold capitalize text-black/60">
          {status}
        </span>
      );
  }
}

export function VerificationBadge({ verified }: { verified: boolean }) {
  return verified ? (
    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
      <ShieldCheck size={12} />
      Verified
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700">
      <ShieldAlert size={12} />
      Unverified
    </span>
  );
}


export function AccountTypeIcon({ type }: { type: string }) {
  const styles: Record<string, string> = {
    savings: "bg-emerald-50 text-emerald-700",
    current: "bg-sky-50 text-sky-700",
    business: "bg-violet-50 text-violet-700",
  };

  return (
    <div
      className={`flex size-9 shrink-0 items-center justify-center rounded-xl ${
        styles[type] || "bg-[#F3F3EE] text-black/60"
      }`}
    >
      <span className="text-[11px] font-bold uppercase">
        {type.slice(0, 2)}
      </span>
    </div>
  );
}
