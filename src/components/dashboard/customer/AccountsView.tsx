"use client";

import { useState, type ReactNode } from "react";
import { Button } from "@heroui/react";
import { useGetAccountsQuery } from "@/lib/redux/api";
import { useAppDispatch } from "@/lib/redux/store";
import { setSelectedAccount } from "@/lib/redux/slices/accountSlice";
import CreateAccountForm from "@/components/dashboard/customer/CreateAccountForm";

/* ─── Account Card ─── */
function AccountCard({
  account,
  onSelect,
}: {
  account: {
    id: string;
    type: string;
    status: string;
    name: string;
    accountNumber: string;
    balance: number;
  };
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className="relative w-full overflow-hidden rounded-3xl bg-[#2C2C2C] p-6 text-left transition-all duration-200 hover:bg-[#383838]"
    >
      {/* Top row */}
      <div className="flex items-start justify-between gap-3">
        <span className="text-sm font-semibold capitalize tracking-wide text-white/70">
          {account.type}
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-medium capitalize text-white/80">
          <span className="size-1.5 rounded-full bg-white/60" />
          {account.status}
        </span>
      </div>

      {/* Account number */}
      <p className="mt-5 font-mono text-sm tracking-widest text-white/40">
        {account.accountNumber}
      </p>

      {/* Balance */}
      <div className="mt-5 border-t border-white/10 pt-4">
        <p className="mb-0.5 text-xs font-medium uppercase tracking-wider text-white/40">
          Available balance
        </p>
        <p className="text-2xl font-semibold tabular-nums text-white">
          ৳{account.balance.toLocaleString("en-BD", { minimumFractionDigits: 2 })}
        </p>
      </div>

      {/* Account holder */}
      <p className="mt-3 truncate text-sm text-white/50">{account.name}</p>

      {/* Accent dot */}
      <span className="absolute right-5 top-5 size-2 rounded-full bg-[#E6FB2D]" />
    </button>
  );
}

interface AccountsViewProps {
  children?: ReactNode;
}

/* ─── Accounts View Component ─── */
export default function AccountsView({ children }: AccountsViewProps) {
  const dispatch = useAppDispatch();
  const [showForm, setShowForm] = useState(false);
  const {
    data: accounts = [],
    isLoading,
    isError,
    refetch,
  } = useGetAccountsQuery();

  return (
    <div className="space-y-8">
      {/* Header bar combining Server-rendered title (children) with Client actions */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          {children}
          {!isLoading && accounts.length > 0 && (
            <p className="mt-1.5 text-sm text-neutral-400">
              {accounts.length} of 3 accounts
            </p>
          )}
        </div>

        {accounts.length > 0 && accounts.length < 3 && !showForm && (
          <Button
            onPress={() => setShowForm(true)}
            className="h-11 rounded-full bg-[#2C2C2C] px-6 text-sm font-medium text-white transition-colors duration-200 data-[hovered=true]:bg-[#E6FB2D] data-[hovered=true]:text-[#2C2C2C] hover:bg-[#E6FB2D] hover:text-[#2C2C2C]"
          >
            + Create account
          </Button>
        )}
      </div>

      {/* Separate Create Account Form component */}
      {showForm && <CreateAccountForm onClose={() => setShowForm(false)} />}

      {/* Loading skeletons */}
      {isLoading && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {[1, 2].map((n) => (
            <div
              key={n}
              className="h-52 animate-pulse rounded-3xl bg-black/5"
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
          <h2 className="text-lg font-semibold text-black">No bank account yet</h2>
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

      {/* Account cards grid */}
      {accounts.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {accounts.map((a) => (
            <AccountCard
              key={a.id}
              account={a}
              onSelect={() => dispatch(setSelectedAccount(a.id))}
            />
          ))}
        </div>
      )}
    </div>
  );
}
