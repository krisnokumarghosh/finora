"use client";

import { useState, useMemo, useSyncExternalStore } from "react";
import Link from "next/link";
import {
  Button,
  Input,
  Label,
  TextField,
} from "@heroui/react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Clock,
  XCircle,
  Home,
  Car,
  GraduationCap,
  Briefcase,
  X,
  AlertCircle,
  Lock,
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import {
  useGetAccountsQuery,
  useGetFundRequestsQuery,
  useGetRecentTransfersQuery,
  useGetLoansQuery,
  useApplyLoanMutation,
  type LoanType,
} from "@/lib/redux/api";
import { successToast } from "@/lib/utils/toasts";
import DashboardPageHeader from "@/components/dashboard/DashboardPageHeader";

const formatMoney = (val: number) =>
  `৳${val.toLocaleString("en-BD", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;

interface CustomerDashboardViewProps {
  user: {
    name: string;
    email: string;
  };
}

export default function CustomerDashboardView({
  user,
}: CustomerDashboardViewProps) {
  const isClient = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
  const [isLoanModalOpen, setIsLoanModalOpen] = useState(false);

  const { data: accounts = [] } = useGetAccountsQuery();
  const { data: fundRequests = [] } = useGetFundRequestsQuery();
  const { data: recentTransfers = [] } = useGetRecentTransfersQuery();
  const { data: loans = [] } = useGetLoansQuery();

  const [applyLoan, { isLoading: isApplyingLoan }] = useApplyLoanMutation();

  const [selectedLoanAccountId, setSelectedLoanAccountId] = useState("");
  const [loanType, setLoanType] = useState<LoanType>("home");
  const [loanAmount, setLoanAmount] = useState("");
  const [loanTerm, setLoanTerm] = useState("12");
  const [loanPurpose, setLoanPurpose] = useState("");
  const [loanPin, setLoanPin] = useState("1234");
  const [loanError, setLoanError] = useState("");

  const activeLoanAccountId =
    selectedLoanAccountId ||
    accounts.find((a) => a.status === "active")?.id ||
    accounts[0]?.id ||
    "";

  const selectedLoanAccount = useMemo(() => {
    return accounts.find((a) => a.id === activeLoanAccountId);
  }, [accounts, activeLoanAccountId]);

  const totalMoney = useMemo(() => {
    return accounts.reduce((sum, acc) => {
      return sum + (acc.status === "active" ? acc.balance : 0);
    }, 0);
  }, [accounts]);

  const totalDepositAmount = useMemo(() => {
    return fundRequests
      .filter((req) => req.type === "deposit" && req.status === "approved")
      .reduce((sum, req) => sum + req.amount, 0);
  }, [fundRequests]);

  const totalWithdrawalAmount = useMemo(() => {
    return fundRequests
      .filter((req) => req.type === "withdrawal" && req.status === "approved")
      .reduce((sum, req) => sum + req.amount, 0);
  }, [fundRequests]);

  const allRecentTransactions = useMemo(() => {
    const reqList = fundRequests.map((req) => ({
      id: req.id,
      title: req.description || `${req.type === "deposit" ? "Deposit" : "Withdrawal"} Request`,
      subtitle: req.requestDate || new Date(req.createdAt).toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" }),
      date: new Date(req.createdAt).getTime(),
      amount: req.amount,
      type: req.type,
      status: req.status,
      isCredit: req.type === "deposit",
    }));

    const transferList = recentTransfers.map((tx) => ({
      id: tx.id,
      title: tx.direction === "credit" ? tx.senderName || "Incoming Transfer" : tx.recipientName || "Outgoing Transfer",
      subtitle: new Date(tx.createdAt).toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" }),
      date: new Date(tx.createdAt).getTime(),
      amount: tx.amount,
      type: "transfer",
      status: tx.status === "completed" ? "approved" : tx.status,
      isCredit: tx.direction === "credit",
    }));

    const combined = [...reqList, ...transferList];
    combined.sort((a, b) => b.date - a.date);
    return combined.slice(0, 3);
  }, [fundRequests, recentTransfers]);

  const chartData = useMemo(() => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const now = new Date();
    const currentMonthIdx = now.getMonth();

    type IntervalItem = {
      monthName: string;
      yearMonth: string;
      deposits: number;
      withdrawals: number;
    };
    const pastIntervals: IntervalItem[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getFullYear(), currentMonthIdx - i, 1);
      const mName = months[d.getMonth()];
      pastIntervals.push({
        monthName: mName,
        yearMonth: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
        deposits: 0,
        withdrawals: 0,
      });
    }

    fundRequests.forEach((req) => {
      const dStr = req.createdAt.slice(0, 7);
      const match = pastIntervals.find((p) => p.yearMonth === dStr);
      if (match && req.status === "approved") {
        if (req.type === "deposit") match.deposits += req.amount;
        if (req.type === "withdrawal") match.withdrawals += req.amount;
      }
    });

    recentTransfers.forEach((tx) => {
      const dStr = tx.createdAt.slice(0, 7);
      const match = pastIntervals.find((p) => p.yearMonth === dStr);
      if (match) {
        if (tx.direction === "credit") match.deposits += tx.amount;
        if (tx.direction === "debit") match.withdrawals += tx.amount;
      }
    });

    return pastIntervals.map((item, idx) => {
      const baseDep = [1800, 1100, 1600, 2289, 1400, 2400, 1950][idx] || 1500;
      const baseWith = [1200, 1450, 1750, 1600, 1550, 2050, 1700][idx] || 1200;
      return {
        name: item.monthName,
        deposits: item.deposits > 0 ? item.deposits : baseDep,
        withdrawals: item.withdrawals > 0 ? item.withdrawals : baseWith,
      };
    });
  }, [fundRequests, recentTransfers]);

  const handleLoanSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoanError("");

    if (!selectedLoanAccount) {
      setLoanError("Please select a bank account for disbursal.");
      return;
    }

    if (selectedLoanAccount.status !== "active") {
      setLoanError(
        `Loan applications are only permitted on active accounts. Selected account is "${selectedLoanAccount.status}".`
      );
      return;
    }

    const numAmt = Number(loanAmount);
    if (!numAmt || numAmt <= 0) {
      setLoanError("Please enter a valid loan amount greater than 0.");
      return;
    }

    if (!/^\d{4}$/.test(loanPin)) {
      setLoanError("Please enter your 4-digit bank account PIN.");
      return;
    }

    try {
      await applyLoan({
        accountId: selectedLoanAccount.id,
        type: loanType,
        amount: numAmt,
        termMonths: Number(loanTerm) || 12,
        purpose: loanPurpose.trim(),
        pin: loanPin.trim(),
      }).unwrap();

      successToast(
        "Loan application submitted successfully! It is currently under review."
      );
      setIsLoanModalOpen(false);
      setLoanAmount("");
      setLoanPurpose("");
      setLoanPin("1234");
    } catch (err: unknown) {
      const apiErr = err as { data?: { error?: string } };
      setLoanError(apiErr.data?.error || "Could not submit loan application.");
    }
  };

  const getLoanIcon = (type: string) => {
    switch (type) {
      case "home":
        return <Home size={18} className="text-amber-700" />;
      case "car":
        return <Car size={18} className="text-emerald-700" />;
      case "education":
        return <GraduationCap size={18} className="text-blue-700" />;
      default:
        return <Briefcase size={18} className="text-purple-700" />;
    }
  };

  const getLoanBg = (type: string) => {
    switch (type) {
      case "home":
        return "bg-amber-100/70";
      case "car":
        return "bg-emerald-100/70";
      case "education":
        return "bg-blue-100/70";
      default:
        return "bg-purple-100/70";
    }
  };

  return (
    <div className="space-y-5 sm:space-y-6">
      <DashboardPageHeader
        eyebrow="Overview"
        title={
          <span className="inline-flex items-center gap-2">
            <span>Hello {user.name || "Steward"}</span>
            <span aria-hidden="true">👋</span>
          </span>
        }
        description="Track your income, expenses, savings and loans in one place."
      />

      <div className="grid gap-5 lg:grid-cols-12 lg:gap-6">
        <div className="min-w-0 space-y-5 sm:space-y-6 lg:col-span-7 xl:col-span-8">
          <div className="rounded-2xl bg-white p-4 shadow-sm sm:rounded-3xl sm:p-7">
            <h2 className="text-base font-bold text-black sm:text-lg">
              Financial Record
            </h2>

            <div className="mt-4 grid grid-cols-1 gap-3 sm:mt-5 sm:grid-cols-3 sm:gap-4">
              <div className="relative flex min-w-0 flex-col justify-between overflow-hidden rounded-2xl bg-[#2C2C2C] p-4 text-white shadow-sm sm:p-5">
                <span className="text-xs font-medium text-white/70">
                  Total Money
                </span>

                <div className="my-2.5 h-7 w-full sm:my-3 sm:h-8">
                  <svg
                    viewBox="0 0 100 24"
                    fill="none"
                    className="h-full w-full overflow-visible"
                  >
                    <path
                      d="M0 16 Q 25 18, 45 14 T 75 10 T 100 8"
                      stroke="#E6FB2D"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>

                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="text-xl font-extrabold tracking-tight sm:text-2xl xl:text-3xl">
                    {formatMoney(totalMoney)}
                  </span>
                  <span className="text-[11px] font-semibold text-[#E6FB2D]">
                    ↑ Active
                  </span>
                </div>
              </div>

              <div className="relative flex min-w-0 flex-col justify-between overflow-hidden rounded-2xl bg-[#2C2C2C] p-4 text-white shadow-sm sm:p-5">
                <span className="text-xs font-medium text-white/70">
                  Total Deposit
                </span>

                <div className="my-2.5 h-7 w-full sm:my-3 sm:h-8">
                  <svg
                    viewBox="0 0 100 24"
                    fill="none"
                    className="h-full w-full overflow-visible"
                  >
                    <path
                      d="M0 10 Q 30 8, 55 14 T 85 14 T 100 12"
                      stroke="#E6FB2D"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>

                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="text-xl font-extrabold tracking-tight text-white sm:text-2xl xl:text-3xl">
                    {formatMoney(totalDepositAmount)}
                  </span>
                  <span className="text-[11px] font-semibold text-[#E6FB2D]">
                    Approved
                  </span>
                </div>
              </div>

              <div className="relative flex min-w-0 flex-col justify-between overflow-hidden rounded-2xl bg-[#2C2C2C] p-4 text-white shadow-sm sm:p-5">
                <span className="text-xs font-medium text-white/70">
                  Total Withdrawal
                </span>

                <div className="my-2.5 h-7 w-full sm:my-3 sm:h-8">
                  <svg
                    viewBox="0 0 100 24"
                    fill="none"
                    className="h-full w-full overflow-visible"
                  >
                    <path
                      d="M0 14 Q 25 14, 50 11 T 80 8 T 100 6"
                      stroke="#E6FB2D"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>

                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="text-xl font-extrabold tracking-tight text-white sm:text-2xl xl:text-3xl">
                    {formatMoney(totalWithdrawalAmount)}
                  </span>
                  <span className="text-[11px] font-semibold text-[#E6FB2D]">
                    Approved
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-white p-4 shadow-sm sm:rounded-3xl sm:p-7">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-lg font-bold text-black">Money Flow</h2>

              <div className="flex items-center gap-4 text-xs font-medium">
                <span className="flex items-center gap-1.5 text-black">
                  <span className="size-2 rounded-full bg-[#2C2C2C]" />
                  Total Deposit
                </span>
                <span className="flex items-center gap-1.5 text-black/60">
                  <span className="size-2 rounded-full bg-[#D4E81A]" />
                  Total Withdrawal
                </span>
              </div>
            </div>

            <div className="mt-6 h-70 w-full">
              {isClient && (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={chartData}
                    margin={{ top: 20, right: 10, left: -15, bottom: 0 }}
                  >
                    <CartesianGrid
                      stroke="#F3F3EE"
                      vertical={false}
                      strokeDasharray="0"
                    />
                    <XAxis
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#9CA3AF", fontSize: 12 }}
                      dy={8}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#9CA3AF", fontSize: 11 }}
                      tickFormatter={(val) => `৳${val}`}
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const val = payload[0].value;
                          return (
                            <div className="rounded-xl bg-[#2C2C2C] px-3 py-1.5 text-xs font-bold text-white shadow-lg">
                              ৳{Number(val).toLocaleString("en-BD")}
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="deposits"
                      stroke="#2C2C2C"
                      strokeWidth={2.8}
                      dot={false}
                      activeDot={{
                        r: 6,
                        fill: "#FFFFFF",
                        stroke: "#2C2C2C",
                        strokeWidth: 3,
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="withdrawals"
                      stroke="#C5DA00"
                      strokeWidth={2.2}
                      strokeDasharray="4 4"
                      dot={false}
                      activeDot={{
                        r: 5,
                        fill: "#C5DA00",
                        stroke: "#FFFFFF",
                        strokeWidth: 2,
                      }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6 lg:col-span-5 xl:col-span-4">
          <div className="rounded-3xl bg-white p-6 shadow-sm sm:p-7">
            <div className="flex items-center justify-between border-b border-black/5 pb-4">
              <h2 className="text-lg font-bold text-black">Transactions</h2>
              <Link
                href="/dashboard/customer/transactions"
                className="text-xs font-semibold text-black/50 transition-colors hover:text-black"
              >
                See all
              </Link>
            </div>

            <div className="mt-4 divide-y divide-black/5">
              {allRecentTransactions.length === 0 ? (
                <div className="py-8 text-center text-xs text-black/40">
                  No recent transactions found.
                </div>
              ) : (
                allRecentTransactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between py-3.5"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex size-9 shrink-0 items-center justify-center rounded-xl ${
                          tx.status === "rejected"
                            ? "bg-red-50 text-red-600"
                            : tx.status === "pending"
                            ? "bg-amber-50 text-amber-600"
                            : tx.isCredit
                            ? "bg-emerald-50 text-emerald-600"
                            : "bg-[#F3F3EE] text-black/70"
                        }`}
                      >
                        {tx.status === "rejected" ? (
                          <XCircle size={16} />
                        ) : tx.status === "pending" ? (
                          <Clock size={16} />
                        ) : tx.isCredit ? (
                          <ArrowDownLeft size={16} />
                        ) : (
                          <ArrowUpRight size={16} />
                        )}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <p className="max-w-32.5 truncate text-sm font-semibold text-black sm:max-w-40">
                            {tx.title}
                          </p>
                          <span
                            className={`rounded px-1.5 py-0.2 text-[10px] font-semibold capitalize ${
                              tx.status === "approved" || tx.status === "completed"
                                ? "bg-emerald-50 text-emerald-700"
                                : tx.status === "pending"
                                ? "bg-amber-50 text-amber-700"
                                : "bg-red-50 text-red-700"
                            }`}
                          >
                            {tx.status}
                          </span>
                        </div>
                        <p className="text-xs text-black/40">{tx.subtitle}</p>
                      </div>
                    </div>

                    <span
                      className={`text-sm font-bold ${
                        tx.status === "rejected"
                          ? "line-through text-black/40"
                          : tx.isCredit
                          ? "text-emerald-700"
                          : "text-black"
                      }`}
                    >
                      {tx.isCredit ? "+" : "-"}
                      {formatMoney(tx.amount)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-3xl bg-white p-6 shadow-sm sm:p-7">
            <div className="flex items-center justify-between border-b border-black/5 pb-4">
              <h2 className="text-lg font-bold text-black">Loans</h2>
              <Link
                href="/dashboard/customer/loans"
                className="text-xs font-semibold text-black/50 transition-colors hover:text-black"
              >
                See all
              </Link>
            </div>

            <div className="mt-4 divide-y divide-black/5">
              {loans.length === 0 ? (
                <div className="py-6 text-center text-xs text-black/40">
                  No active loans. Click below to apply for a loan.
                </div>
              ) : (
                loans.slice(0, 2).map((loan) => (
                  <div
                    key={loan.id}
                    className="flex items-center justify-between py-3.5"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex size-9 shrink-0 items-center justify-center rounded-xl ${getLoanBg(
                          loan.type
                        )}`}
                      >
                        {getLoanIcon(loan.type)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-black">
                            {loan.title}
                          </p>
                          <span
                            className={`rounded px-1.5 py-0.2 text-[10px] font-semibold capitalize ${
                              loan.status === "approved"
                                ? "bg-emerald-50 text-emerald-700"
                                : loan.status === "pending"
                                ? "bg-amber-50 text-amber-700"
                                : "bg-red-50 text-red-700"
                            }`}
                          >
                            {loan.status}
                          </span>
                        </div>
                        <p className="text-xs text-black/40">
                          Due {loan.dueDate}
                        </p>
                      </div>
                    </div>

                    <span className="text-sm font-bold text-black">
                      {formatMoney(loan.amount)}
                    </span>
                  </div>
                ))
              )}
            </div>

            <Button
              type="button"
              onClick={() => setIsLoanModalOpen(true)}
              className="mt-6 flex h-12 w-full items-center justify-center rounded-full bg-[#2C2C2C] text-sm font-semibold text-white transition-colors duration-200 hover:bg-[#E6FB2D] hover:text-[#2C2C2C]"
            >
              Apply for loan
            </Button>
          </div>
        </div>
      </div>

      {isLoanModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsLoanModalOpen(false)}
          />
          <div className="relative z-10 flex w-full flex-col bg-white shadow-2xl h-dvh rounded-none sm:h-auto sm:max-w-xl sm:rounded-3xl lg:max-w-2xl">
            <div className="flex shrink-0 items-center justify-between border-b border-black/5 px-5 py-4 sm:px-7 sm:pt-7 sm:pb-4">
              <div>
                <h3 className="text-lg font-bold text-black">Apply for Loan</h3>
                <p className="mt-0.5 text-xs text-black/50">
                  Quick simulated loan approval for your account.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsLoanModalOpen(false)}
                className="rounded-full p-1.5 text-black/40 hover:bg-black/5 hover:text-black"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleLoanSubmit} className="flex-1 overflow-y-auto px-5 py-5 sm:px-7 sm:pb-7">
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-5">
                <div>
                  <label className="mb-2 block text-xs font-semibold text-black/70">
                    Select Disbursal Bank Account
                  </label>
                  {accounts.length === 0 ? (
                    <p className="rounded-xl bg-amber-50 p-3 text-xs text-amber-700">
                      No bank accounts found. Please create an account first.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {accounts.map((acc) => {
                        const isSelected = activeLoanAccountId === acc.id;
                        const isActive = acc.status === "active";
                        return (
                          <label
                            key={acc.id}
                            className={`flex cursor-pointer items-center justify-between rounded-xl border p-3 transition-all select-none ${
                              isSelected
                                ? "border-[#2C2C2C] bg-[#2C2C2C] text-white"
                                : "border-black/10 bg-[#F3F3EE] text-black hover:border-black/20"
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <input
                                type="radio"
                                name="loanAccount"
                                value={acc.id}
                                checked={isSelected}
                                onChange={() => {
                                  setSelectedLoanAccountId(acc.id);
                                  setLoanError("");
                                  setLoanPin("1234");
                                }}
                                className="sr-only"
                              />
                              <span
                                className={`flex size-4 shrink-0 items-center justify-center rounded-full border ${
                                  isSelected
                                    ? "border-[#E6FB2D] bg-[#E6FB2D]"
                                    : "border-black/30 bg-transparent"
                                }`}
                              >
                                {isSelected && (
                                  <span className="size-1.5 rounded-full bg-[#2C2C2C]" />
                                )}
                              </span>
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-xs font-bold capitalize">
                                    {acc.type}
                                  </span>
                                  <span
                                    className={`font-mono text-[11px] ${
                                      isSelected ? "text-white/60" : "text-black/50"
                                    }`}
                                  >
                                    •••• {acc.accountNumber.slice(-4)}
                                  </span>
                                </div>
                                <span
                                  className={`block truncate text-[10px] ${
                                    isSelected ? "text-white/50" : "text-black/40"
                                  }`}
                                >
                                  Bal: {formatMoney(acc.balance)}
                                </span>
                              </div>
                            </div>
                            <span
                              className={`ml-2 shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ${
                                isActive
                                  ? isSelected
                                    ? "bg-emerald-400/20 text-emerald-300"
                                    : "bg-emerald-50 text-emerald-700"
                                  : isSelected
                                  ? "bg-amber-400/20 text-amber-300"
                                  : "bg-amber-50 text-amber-700"
                              }`}
                            >
                              {acc.status}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-4">
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-black/70">
                      Loan Category
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {(["home", "car", "education", "personal", "business"] as LoanType[]).map(
                        (cat) => (
                          <button
                            key={cat}
                            type="button"
                            onClick={() => setLoanType(cat)}
                            className={`rounded-xl border px-2.5 py-2 text-xs font-medium capitalize transition-all ${
                              loanType === cat
                                ? "border-[#2C2C2C] bg-[#2C2C2C] text-white"
                                : "border-black/10 bg-[#F3F3EE] text-black hover:border-black/30"
                            }`}
                          >
                            {cat}
                          </button>
                        )
                      )}
                    </div>
                  </div>

                  <TextField isRequired name="loanAmount">
                    <Label className="mb-1.5 block text-xs font-semibold text-black/70">
                      Desired Amount (BDT)
                    </Label>
                    <div className="relative">
                      <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 font-bold text-black/40">
                        ৳
                      </span>
                      <Input
                        value={loanAmount}
                        onChange={(e) =>
                          setLoanAmount(e.target.value.replace(/[^0-9.]/g, ""))
                        }
                        placeholder="50000"
                        className="h-11 w-full rounded-xl bg-[#F3F3EE] pl-9 pr-4 text-sm font-semibold text-black outline-none focus-visible:ring-2 focus-visible:ring-[#2C2C2C]"
                      />
                    </div>
                  </TextField>

                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-black/70">
                      Repayment Term
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                      {["6", "12", "24", "36"].map((term) => (
                        <button
                          key={term}
                          type="button"
                          onClick={() => setLoanTerm(term)}
                          className={`rounded-xl border py-2 text-xs font-medium transition-all ${
                            loanTerm === term
                              ? "border-[#2C2C2C] bg-[#2C2C2C] text-white"
                              : "border-black/10 bg-[#F3F3EE] text-black hover:border-black/30"
                          }`}
                        >
                          {term} mo
                        </button>
                      ))}
                    </div>
                  </div>

                  <TextField name="purpose">
                    <Label className="mb-1.5 block text-xs font-semibold text-black/70">
                      Purpose / Notes
                    </Label>
                    <Input
                      value={loanPurpose}
                      onChange={(e) => setLoanPurpose(e.target.value)}
                      placeholder="e.g. Home renovation, tuition fees"
                      className="h-11 w-full rounded-xl bg-[#F3F3EE] px-4 text-sm text-black outline-none focus-visible:ring-2 focus-visible:ring-[#2C2C2C]"
                    />
                  </TextField>

                  <div>
                    <div className="flex items-center justify-between">
                      <label className="mb-1.5 block text-xs font-semibold text-black/70">
                        Bank Account PIN Confirmation
                      </label>
                      <span className="text-[11px] text-black/40">4 digits</span>
                    </div>
                    <div className="relative">
                      <input
                        type="password"
                        inputMode="numeric"
                        maxLength={4}
                        value={loanPin}
                        onChange={(e) => {
                          setLoanPin(e.target.value.replace(/\D/g, "").slice(0, 4));
                          setLoanError("");
                        }}
                        placeholder="••••"
                        className="h-11 w-full rounded-xl bg-[#F3F3EE] px-4 font-mono text-base tracking-widest text-black outline-none focus-visible:ring-2 focus-visible:ring-[#2C2C2C]"
                      />
                    </div>
                    <p className="mt-1 flex items-center gap-1 text-[11px] text-black/50">
                      <Lock size={11} className="text-black/40" />
                      PIN is autofilled &amp; masked for account (••••{" "}
                      {selectedLoanAccount?.accountNumber.slice(-4) || "..."}).
                    </p>
                  </div>
                </div>
              </div>

              {loanError && (
                <div className="mt-4 flex items-center gap-2 rounded-xl bg-red-50 p-3 text-xs text-red-600">
                  <AlertCircle size={14} className="shrink-0" />
                  <span>{loanError}</span>
                </div>
              )}
              <Button
                type="submit"
                isDisabled={isApplyingLoan}
                className="mt-4 flex h-12 w-full items-center justify-center rounded-full bg-[#2C2C2C] text-sm font-semibold text-white transition-colors hover:bg-[#E6FB2D] hover:text-[#2C2C2C]"
              >
                {isApplyingLoan ? "Submitting Application..." : "Submit Application"}
              </Button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
