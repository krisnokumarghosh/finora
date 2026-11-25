"use client";

import { useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@heroui/react";
import {
  Copy,
  Check,
  ArrowUpRight,
  Plus,

} from "lucide-react";
import { useGetAccountsQuery, type Account } from "@/lib/redux/api";
import { useAppDispatch } from "@/lib/redux/store";
import { setSelectedAccount } from "@/lib/redux/slices/accountSlice";
import CreateAccountForm from "@/components/dashboard/customer/CreateAccountForm";
import DashboardPageHeader from "@/components/dashboard/DashboardPageHeader";

/* ─── Helpers ─── */
const formatBDT = (amount: number) =>
  `৳${amount.toLocaleString("en-BD", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const formatAccNo = (no: string) =>
  no.replace(/(\d{4})/g, "$1 ").trim();

/* ─── Account Card ─── */
function AccountCard({
  account,
  onSelect,
  onTransfer,
}: {
  account: Account;
  onSelect: () => void;
  onTransfer: () => void;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(account.accountNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isActive = account.status === "active";

  return (
    <div
      onClick={onSelect}
      className="group relative flex flex-col justify-between overflow-hidden rounded-3xl bg-[#2C2C2C] p-6 text-white shadow-md transition-all duration-200 hover:shadow-xl sm:p-7"
    >
      {/* Top row: Type, Contactless Icon, Status */}
      <div>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold capitalize tracking-wide text-white/90">
              {account.type}
            </span>

          </div>

          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium capitalize ${isActive
                ? "bg-emerald-500/20 text-emerald-300"
                : account.status === "pending"
                  ? "bg-amber-500/20 text-amber-300"
                  : account.status === "under_review"
                    ? "bg-sky-500/20 text-sky-300"
                    : "bg-red-500/20 text-red-300"
              }`}
          >
            <span
              className={`size-1.5 rounded-full ${isActive
                  ? "bg-emerald-400"
                  : account.status === "pending"
                    ? "bg-amber-400"
                    : account.status === "under_review"
                      ? "bg-sky-400"
                      : "bg-red-400"
                }`}
            />
            {account.status}
          </span>
        </div>

        {/* Card Chip & Contactless Visual */}


        {/* Account Number with Copy Button */}
        <div className="mt-5 flex items-center justify-between">
          <p className="font-mono text-base tracking-widest text-white/80 sm:text-lg">
            {formatAccNo(account.accountNumber)}
          </p>
          <button
            type="button"
            onClick={handleCopy}
            title="Copy account number"
            className="rounded-lg p-1.5 text-white/40 transition-colors hover:bg-white/10 hover:text-white"
          >
            {copied ? (
              <Check size={16} className="text-[#E6FB2D]" />
            ) : (
              <Copy size={16} />
            )}
          </button>
        </div>

        {/* Balance Section */}
        <div className="mt-6 border-t border-white/10 pt-4">
          <p className="text-xs font-medium uppercase tracking-wider text-white/50">
            Available Balance
          </p>
          <p className="mt-0.5 text-3xl font-extrabold tabular-nums tracking-tight text-white">
            {formatBDT(account.balance)}
          </p>
        </div>
      </div>

      {/* Card Footer: Holder Name, Limit & Quick Action */}
      <div className="mt-6 border-t border-white/10 pt-4">
        <div className="flex items-center justify-between text-xs text-white/60">
          <span className="truncate max-w-37.5 font-medium text-white/80">
            {account.name}
          </span>
          <span>
            Limit: ৳
            {(account.transactionLimit ?? 100000).toLocaleString("en-BD")}
          </span>
        </div>

        {/* Quick Action Button */}
        <div className="mt-4 pt-1">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onTransfer();
            }}
            disabled={!isActive}
            className="flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-white/10 text-xs font-semibold text-white transition-all hover:bg-[#E6FB2D] hover:text-[#2C2C2C] disabled:cursor-not-allowed disabled:opacity-40"
          >
            <span>Transfer Funds</span>
            <ArrowUpRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Add Account Placeholder Card ─── */
function AddAccountCard({ onOpen }: { onOpen: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="group flex min-h-85 flex-col items-center justify-center rounded-3xl border-2 border-dashed border-black/15 bg-white/40 p-6 text-center transition-all duration-200 hover:border-black/30 hover:bg-white/80 hover:shadow-sm"
    >
      <div className="flex size-14 items-center justify-center rounded-2xl bg-[#2C2C2C] text-white transition-transform duration-200 group-hover:scale-110 group-hover:bg-[#E6FB2D] group-hover:text-[#2C2C2C]">
        <Plus size={26} />
      </div>
      <h3 className="mt-4 text-base font-bold text-black">
        Open Another Account
      </h3>
      <p className="mt-1 max-w-50 text-xs text-black/50">
        Add a Savings, Current or Business account to your portfolio.
      </p>
      <span className="mt-5 inline-flex items-center gap-1 rounded-full bg-black/5 px-4 py-1.5 text-xs font-semibold text-black/70 group-hover:bg-[#2C2C2C] group-hover:text-white">
        + Create Account
      </span>
    </button>
  );
}

interface AccountsViewProps {
  children?: ReactNode;
}

/* ─── Accounts View Main Component ─── */
export default function AccountsView({ children }: AccountsViewProps) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [showForm, setShowForm] = useState(false);

  const {
    data: accounts = [],
    isLoading,
    isError,
    refetch,
  } = useGetAccountsQuery();

  // Metrics summary




  const handleTransferFrom = (accId: string) => {
    dispatch(setSelectedAccount(accId));
    router.push("/dashboard/customer/transfer");
  };

  return (
    <div className="space-y-5 sm:space-y-6">
      <DashboardPageHeader
        eyebrow="Overview"
        title={children || "My Accounts"}
        description={
          !isLoading && accounts.length > 0
            ? "Manage your accounts and check balances at a glance."
            : undefined
        }
        actions={
          accounts.length > 0 && accounts.length < 3 && !showForm ? (
            <Button
              onPress={() => setShowForm(true)}
              className="h-10 rounded-full bg-[#2C2C2C] px-5 text-xs font-semibold text-white transition-colors duration-200 data-[hovered=true]:bg-[#E6FB2D] data-[hovered=true]:text-[#2C2C2C] hover:bg-[#E6FB2D] hover:text-[#2C2C2C] sm:h-11 sm:px-6 sm:text-sm"
            >
              + Create account
            </Button>
          ) : undefined
        }
      />



      {/* Create Account Form Modal/Inline */}
      {showForm && <CreateAccountForm onClose={() => setShowForm(false)} />}

      {/* Loading Skeletons */}
      {isLoading && (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="h-80 animate-pulse rounded-3xl bg-black/5"
            />
          ))}
        </div>
      )}

      {/* Error state */}
      {isError && (
        <div className="rounded-3xl border border-red-200 bg-red-50 p-8 text-center">
          <p className="text-sm font-medium text-red-600">
            Could not load your accounts.
          </p>
          <Button
            onPress={() => refetch()}
            className="mt-4 h-10 rounded-full bg-[#2C2C2C] px-6 text-sm font-medium text-white hover:bg-[#E6FB2D] hover:text-[#2C2C2C]"
          >
            Try again
          </Button>
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !isError && accounts.length === 0 && !showForm && (
        <div className="rounded-3xl border border-dashed border-black/15 bg-white/60 px-6 py-16 text-center">
          <h2 className="text-lg font-semibold text-black">
            No bank account yet
          </h2>
          <p className="mx-auto mt-2 max-w-sm text-sm text-neutral-500">
            You do not have any bank account. Create one to start sending and
            receiving money.
          </p>
          <Button
            onPress={() => setShowForm(true)}
            className="mt-6 h-11 rounded-full bg-[#2C2C2C] px-7 text-sm font-medium text-white transition-colors duration-200 data-[hovered=true]:bg-[#E6FB2D] data-[hovered=true]:text-[#2C2C2C] hover:bg-[#E6FB2D] hover:text-[#2C2C2C]"
          >
            Create bank account
          </Button>
        </div>
      )}

      {/* Account Cards Grid */}
      {accounts.length > 0 && (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {accounts.map((a) => (
            <AccountCard
              key={a.id}
              account={a}
              onSelect={() => dispatch(setSelectedAccount(a.id))}
              onTransfer={() => handleTransferFrom(a.id)}
            />
          ))}

          {/* Add Account Card placeholder to fill up the grid on desktop */}
          {accounts.length < 3 && !showForm && (
            <AddAccountCard onOpen={() => setShowForm(true)} />
          )}
        </div>
      )}
    </div>
  );
}
