"use client";

import { useEffect, useState } from "react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Clock,
  Landmark,
  Receipt,
  RefreshCw,
  X,
  Filter,
} from "lucide-react";
import {
  useGetCustomerTransactionsQuery,
  type AdminCustomer,
  type StaffTransaction,
} from "@/lib/redux/api";
import {
  formatAccNo,
  formatDateTime,
  formatMoney,
  initials,
} from "@/components/dashboard/staff/staffUi";

interface AdminCustomerTransactionsModalProps {
  customer: AdminCustomer | null;
  onClose: () => void;
}

export default function AdminCustomerTransactionsModal({
  customer,
  onClose,
}: AdminCustomerTransactionsModalProps) {
  const [txType, setTxType] = useState<string>("all");

  const { data, isLoading, isFetching, refetch } =
    useGetCustomerTransactionsQuery(
      {
        userId: customer?.id ?? "",
        type: txType,
        limit: 50,
      },
      { skip: !customer }
    );

  useEffect(() => {
    if (!customer) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", onKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [customer, onClose]);

  if (!customer) return null;

  const transactions = data?.transactions || [];
  const total = data?.total || 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
      onMouseDown={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="customer-transactions-modal-title"
        onMouseDown={(event) => event.stopPropagation()}
        className="flex max-h-[92vh] w-full max-w-3xl flex-col rounded-3xl bg-white shadow-2xl"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-black/5 p-5 sm:p-6">
          <div className="flex items-center gap-3">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-[#2C2C2C] text-xs font-bold text-white">
              {initials(customer.name)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2
                  id="customer-transactions-modal-title"
                  className="text-base font-bold text-black sm:text-lg"
                >
                  Transaction History
                </h2>
                <span className="rounded-full bg-black/5 px-2.5 py-0.5 text-[11px] font-semibold text-black/60">
                  {customer.name}
                </span>
              </div>
              <p className="text-xs text-black/50">
                {customer.email} · User ID: {customer.id}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => refetch()}
              disabled={isFetching}
              aria-label="Refresh transactions"
              className="inline-flex size-9 items-center justify-center rounded-full border border-black/10 bg-white text-black/60 transition-colors hover:border-black/20 hover:text-black disabled:opacity-50"
            >
              <RefreshCw
                size={14}
                className={isFetching ? "animate-spin" : ""}
              />
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close transactions modal"
              className="rounded-full p-1 text-black/40 hover:bg-black/5 hover:text-black"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Filter bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-black/5 bg-[#F9F9F7] px-5 py-3 sm:px-6">
          <div className="flex flex-wrap items-center gap-1.5 text-xs font-medium">
            <span className="mr-1 text-[11px] font-bold uppercase tracking-wider text-black/40">
              Type:
            </span>
            {(
              [
                { label: "All", value: "all" },
                { label: "Transfers", value: "transfer" },
                { label: "Deposits", value: "deposit" },
                { label: "Withdrawals", value: "withdrawal" },
              ] as const
            ).map((tab) => (
              <button
                key={tab.value}
                type="button"
                onClick={() => setTxType(tab.value)}
                className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                  txType === tab.value
                    ? "bg-[#2C2C2C] text-white"
                    : "bg-white text-black/60 hover:bg-black/5 hover:text-black"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <span className="text-xs font-semibold text-black/50">
            {isLoading
              ? "Loading..."
              : `Total: ${total} record${total === 1 ? "" : "s"}`}
          </span>
        </div>

        {/* Transactions list */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="flex animate-pulse items-center justify-between rounded-2xl border border-black/5 p-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="size-10 rounded-full bg-black/5" />
                    <div className="space-y-1.5">
                      <div className="h-4 w-32 rounded bg-black/5" />
                      <div className="h-3 w-48 rounded bg-black/5" />
                    </div>
                  </div>
                  <div className="h-5 w-20 rounded bg-black/5" />
                </div>
              ))}
            </div>
          ) : transactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="flex size-14 items-center justify-center rounded-2xl bg-[#F3F3EE] text-black/40">
                <Receipt size={24} />
              </div>
              <h3 className="mt-4 text-sm font-bold text-black">
                No transactions found
              </h3>
              <p className="mt-1 max-w-xs text-xs text-black/50">
                {txType === "all"
                  ? "This customer has not performed any transactions or fund requests yet."
                  : `No ${txType} records found for this customer.`}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-black/5 overflow-hidden rounded-2xl border border-black/5">
              {transactions.map((tx: StaffTransaction) => {
                const dt = formatDateTime(tx.createdAt);
                const isCredit = tx.isCredit;

                return (
                  <div
                    key={tx.id}
                    className="flex flex-col gap-3 p-4 transition-colors hover:bg-black/[0.015] sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex size-10 shrink-0 items-center justify-center rounded-2xl ${
                          isCredit
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-[#2C2C2C]/5 text-black"
                        }`}
                      >
                        {isCredit ? (
                          <ArrowDownLeft size={18} />
                        ) : (
                          <ArrowUpRight size={18} />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-bold text-black">
                            {tx.type === "transfer"
                              ? isCredit
                                ? "Received Transfer"
                                : "Sent Transfer"
                              : `${tx.type.charAt(0).toUpperCase() + tx.type.slice(1)} Request`}
                          </p>
                          <span className="font-mono text-[10px] text-black/40">
                            {tx.transactionId}
                          </span>
                        </div>
                        <p className="text-[11px] text-black/50">
                          {tx.description || "Banking transaction"}
                          {tx.counterpartAccountNumber && (
                            <span className="ml-1 text-black/40">
                              (Acc: {formatAccNo(tx.counterpartAccountNumber)})
                            </span>
                          )}
                        </p>
                        <p className="text-[10px] text-black/40">
                          {dt.date} · {dt.time} · Acc: {formatAccNo(tx.accountNumber)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-3 sm:flex-col sm:items-end">
                      <span
                        className={`text-sm font-bold ${
                          isCredit ? "text-emerald-700" : "text-black"
                        }`}
                      >
                        {isCredit ? "+" : "-"}
                        {formatMoney(tx.amount)}
                      </span>
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ${
                          tx.status === "completed" || tx.status === "approved"
                            ? "bg-emerald-50 text-emerald-700"
                            : tx.status === "pending"
                            ? "bg-amber-50 text-amber-700"
                            : "bg-red-50 text-red-700"
                        }`}
                      >
                        {tx.status}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end border-t border-black/5 p-4 sm:px-6">
          <button
            type="button"
            onClick={onClose}
            className="h-9 rounded-full border border-black/10 bg-white px-5 text-xs font-semibold text-black/70 transition-colors hover:border-black/20 hover:text-black"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
