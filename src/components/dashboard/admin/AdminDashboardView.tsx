"use client";

import { useState, useSyncExternalStore } from "react";
import {
  Users,
  Building2,
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  Receipt,
  Clock,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import {
  useGetAdminAnalyticsQuery,
  type AdminAnalyticsResponse,
} from "@/lib/redux/api";
import { authClient } from "@/lib/auth-client";
import DashboardPageHeader from "@/components/dashboard/DashboardPageHeader";

const formatMoney = (val: number) =>
  `৳${val.toLocaleString("en-BD", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;

const formatCompact = (val: number) => {
  if (val >= 10_000_000) return `৳${(val / 10_000_000).toFixed(1)}Cr`;
  if (val >= 100_000) return `৳${(val / 100_000).toFixed(1)}L`;
  if (val >= 1_000) return `৳${(val / 1_000).toFixed(1)}K`;
  return `৳${val}`;
};



const PIE_COLORS = ["#2C2C2C", "#E6FB2D", "#6B7280"];
const PIE_LABEL_COLORS = ["#ffffff", "#2C2C2C", "#ffffff"];

type TxType = "all" | "deposit" | "withdrawal" | "transfer";

interface AdminDashboardViewProps {
  user?: { name?: string; email?: string };
  analytics?: AdminAnalyticsResponse;
}

export default function AdminDashboardView({
  user,
  analytics: initialAnalytics,
}: AdminDashboardViewProps = {}) {
  const { data: session } = authClient.useSession();
  const userName = user?.name || session?.user?.name || "Admin";

  const { data: queryAnalytics, isLoading } = useGetAdminAnalyticsQuery(
    undefined,
    { skip: Boolean(initialAnalytics) }
  );

  const analytics = initialAnalytics || queryAnalytics;

  const isClient = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  const [period, setPeriod] = useState<"monthly" | "yearly">("monthly");
  const [txType, setTxType] = useState<TxType>("all");

  if (isLoading || !analytics) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="space-y-2">
          <div className="h-4 w-28 rounded bg-black/5" />
          <div className="h-8 w-64 rounded-xl bg-black/5" />
        </div>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 rounded-3xl bg-white p-6 shadow-sm" />
          ))}
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="h-96 rounded-3xl bg-white p-6 shadow-sm lg:col-span-8" />
          <div className="h-96 rounded-3xl bg-white p-6 shadow-sm lg:col-span-4" />
        </div>
      </div>
    );
  }

  const { summary, monthlyChartData, yearlyChartData, accountTypeData } =
    analytics;

  const rawChartData =
    period === "monthly" ? monthlyChartData : yearlyChartData;

  const chartData = rawChartData.map((point) => {
    if (txType === "all") {
      return {
        name: point.name,
        deposit: point.deposit,
        withdrawal: point.withdrawal,
        transfer: point.transfer,
      };
    }
    return {
      name: point.name,
      [txType]: point[txType as keyof typeof point],
    };
  });

  const metricCards = [
    {
      label: "Total Customers",
      value: summary.totalCustomers,
      format: (v: number) => v.toLocaleString("en-BD"),
      badge: "Registered",
      icon: Users,
    },
    {
      label: "Bank Accounts",
      value: summary.totalBankAccounts,
      format: (v: number) => v.toLocaleString("en-BD"),
      badge: "Total",
      icon: Building2,
    },
    {
      label: "Total Balance",
      value: summary.totalBankBalance,
      format: formatMoney,
      badge: "All Accounts",
      icon: Wallet,
    },
    {
      label: "Total Deposits",
      value: summary.totalDeposits,
      format: formatMoney,
      badge: "Approved",
      icon: ArrowDownLeft,
    },
    {
      label: "Total Withdrawals",
      value: summary.totalWithdrawals,
      format: formatMoney,
      badge: "Approved",
      icon: ArrowUpRight,
    },
    {
      label: "Total Transactions",
      value: summary.totalTransactions,
      format: (v: number) => v.toLocaleString("en-BD"),
      badge: "Completed",
      icon: Receipt,
    },
    {
      label: "Pending Loans",
      value: summary.pendingLoans,
      format: (v: number) => v.toLocaleString("en-BD"),
      badge: "Awaiting",
      icon: Clock,
    },
  ];

  const areaKeys =
    txType === "all"
      ? [
          { key: "deposit", label: "Deposits", color: "#2C2C2C" },
          { key: "withdrawal", label: "Withdrawals", color: "#C5DA00", dash: "4 4" },
          { key: "transfer", label: "Transfers", color: "#6B7280", dash: "2 4" },
        ]
      : txType === "deposit"
      ? [{ key: "deposit", label: "Deposits", color: "#2C2C2C" }]
      : txType === "withdrawal"
      ? [{ key: "withdrawal", label: "Withdrawals", color: "#C5DA00" }]
      : [{ key: "transfer", label: "Transfers", color: "#6B7280" }];

  const pieData = accountTypeData.map((item) => ({
    name: item.type.charAt(0).toUpperCase() + item.type.slice(1),
    value: item.count,
    balance: item.totalBalance,
  }));

  return (
    <div className="space-y-5 sm:space-y-6">
      <DashboardPageHeader
        eyebrow="Admin Overview"
        title={
          <span className="inline-flex items-center gap-2">
            <span>Hello {userName}</span>
            <span aria-hidden="true">👋</span>
          </span>
        }
        description="A complete view of the banking system — customers, accounts, and transactions."
      />

      <div className="rounded-2xl bg-white p-4 shadow-sm sm:rounded-3xl sm:p-7">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-base font-bold text-black sm:text-lg">
              Financial & System Record
            </h2>
            <p className="mt-0.5 text-xs text-black/50">
              Overview of key banking indicators and metrics
            </p>
          </div>
          <span className="shrink-0 rounded-full bg-[#F3F3EE] px-3 py-1 text-xs font-semibold text-black/60">
            7 Metrics
          </span>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 sm:mt-6 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
          {metricCards.map((card, idx) => (
            <div
              key={card.label}
              className={`relative flex min-w-0 flex-col justify-between overflow-hidden rounded-2xl bg-[#2C2C2C] p-4 text-white shadow-sm transition-all duration-200 hover:shadow-md sm:p-5 ${
                idx === metricCards.length - 1 ? "col-span-2 sm:col-span-1" : ""
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <span className="truncate text-[11px] font-medium text-white/70 sm:text-xs">
                  {card.label}
                </span>
                <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-white/10">
                  <card.icon size={14} className="text-[#E6FB2D]" />
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-baseline justify-between gap-2 sm:mt-6">
                <span className="text-xl font-extrabold tracking-tight text-white sm:text-2xl xl:text-3xl">
                  {card.format(card.value)}
                </span>
                <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-semibold text-[#E6FB2D] sm:px-2.5 sm:text-[11px]">
                  {card.badge}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-12 lg:gap-6">
        <div className="min-w-0 rounded-2xl bg-white p-4 shadow-sm sm:rounded-3xl sm:p-7 lg:col-span-7 xl:col-span-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-lg font-bold text-black">
                Transaction Volume
              </h2>
              <p className="mt-0.5 text-xs text-black/50">
                {period === "monthly"
                  ? "Last 12 months breakdown"
                  : "Last 5 years breakdown"}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center rounded-xl border border-black/10 bg-[#F3F3EE] p-1">
                {(["monthly", "yearly"] as const).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPeriod(p)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold capitalize transition-all ${
                      period === p
                        ? "bg-[#2C2C2C] text-white"
                        : "text-black/50 hover:text-black"
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>

              <div className="flex items-center rounded-xl border border-black/10 bg-[#F3F3EE] p-1">
                {(
                  [
                    { key: "all" as TxType, label: "All" },
                    { key: "deposit" as TxType, label: "Deposits" },
                    { key: "withdrawal" as TxType, label: "Withdrawals" },
                    { key: "transfer" as TxType, label: "Transfers" },
                  ]
                ).map((opt) => (
                  <button
                    key={opt.key}
                    onClick={() => setTxType(opt.key)}
                    className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-all ${
                      txType === opt.key
                        ? "bg-[#2C2C2C] text-white"
                        : "text-black/50 hover:text-black"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-4 text-xs font-medium">
            {areaKeys.map((k) => (
              <span
                key={k.key}
                className="flex items-center gap-1.5 text-black"
              >
                <span
                  className="size-2 rounded-full"
                  style={{ backgroundColor: k.color }}
                />
                {k.label}
              </span>
            ))}
          </div>

          <div className="mt-5 h-72 w-full">
            {isClient && (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={chartData}
                  margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="gradDeposit" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#E6FB2D" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#E6FB2D" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gradWithdrawal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#E6FB2D" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#E6FB2D" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gradTransfer" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#E6FB2D" stopOpacity={0.18} />
                      <stop offset="95%" stopColor="#E6FB2D" stopOpacity={0} />
                    </linearGradient>
                  </defs>
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
                    tickFormatter={formatCompact}
                  />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="rounded-2xl border border-black/5 bg-white p-3 shadow-lg">
                            <p className="mb-2 text-xs font-bold text-black/60">
                              {label}
                            </p>
                            {payload.map((entry) => (
                              <div
                                key={entry.name}
                                className="flex items-center gap-2 text-xs"
                              >
                                <span
                                  className="size-2 rounded-full"
                                  style={{ backgroundColor: entry.color }}
                                />
                                <span className="font-medium capitalize text-black/70">
                                  {entry.name}:
                                </span>
                                <span className="font-bold text-black">
                                  {formatMoney(Number(entry.value))}
                                </span>
                              </div>
                            ))}
                          </div>
                        );
                      }
                      return null;
                    }}
                  />

                  {(txType === "all" || txType === "deposit") && (
                    <Area
                      type="monotone"
                      dataKey="deposit"
                      name="Deposits"
                      stroke="#2C2C2C"
                      strokeWidth={2.5}
                      fill="url(#gradDeposit)"
                      dot={false}
                      activeDot={{
                        r: 5,
                        fill: "#fff",
                        stroke: "#2C2C2C",
                        strokeWidth: 2,
                      }}
                    />
                  )}

                  {(txType === "all" || txType === "withdrawal") && (
                    <Area
                      type="monotone"
                      dataKey="withdrawal"
                      name="Withdrawals"
                      stroke="#C5DA00"
                      strokeWidth={2.2}
                      strokeDasharray={
                        txType === "withdrawal" ? undefined : "4 4"
                      }
                      fill="url(#gradWithdrawal)"
                      dot={false}
                      activeDot={{
                        r: 5,
                        fill: "#C5DA00",
                        stroke: "#fff",
                        strokeWidth: 2,
                      }}
                    />
                  )}

                  {(txType === "all" || txType === "transfer") && (
                    <Area
                      type="monotone"
                      dataKey="transfer"
                      name="Transfers"
                      stroke="#6B7280"
                      strokeWidth={2}
                      strokeDasharray={
                        txType === "transfer" ? undefined : "2 4"
                      }
                      fill="url(#gradTransfer)"
                      dot={false}
                      activeDot={{
                        r: 5,
                        fill: "#6B7280",
                        stroke: "#fff",
                        strokeWidth: 2,
                      }}
                    />
                  )}
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="rounded-3xl bg-white p-6 shadow-sm sm:p-7 lg:col-span-5 xl:col-span-4">
          <div>
            <h2 className="text-lg font-bold text-black">Account Types</h2>
            <p className="mt-0.5 text-xs text-black/50">
              Distribution by account category
            </p>
          </div>

          <div className="mt-5 h-56 w-full">
            {pieData.length === 0 ? (
              <div className="flex h-full w-full items-center justify-center text-sm text-black/40">
                No account data yet.
              </div>
            ) : isClient ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
                    dataKey="value"
                    labelLine={false}
                    label={({
                      cx,
                      cy,
                      midAngle,
                      innerRadius,
                      outerRadius,
                      index,
                      value,
                    }) => {
                      const RADIAN = Math.PI / 180;
                      const angle = midAngle ?? 0;
                      const radius =
                        innerRadius + (outerRadius - innerRadius) / 2;
                      const x = cx + radius * Math.cos(-angle * RADIAN);
                      const y = cy + radius * Math.sin(-angle * RADIAN);
                      return (
                        <text
                          x={x}
                          y={y}
                          fill={
                            PIE_LABEL_COLORS[index % PIE_LABEL_COLORS.length]
                          }
                          textAnchor="middle"
                          dominantBaseline="central"
                          fontSize={11}
                          fontWeight={700}
                        >
                          {value}
                        </text>
                      );
                    }}
                  >
                    {pieData.map((_entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={PIE_COLORS[index % PIE_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const item = payload[0].payload as {
                          name: string;
                          value: number;
                          balance: number;
                        };
                        return (
                          <div className="rounded-2xl border border-black/5 bg-white p-3 shadow-lg">
                            <p className="text-xs font-bold text-black">
                              {item.name}
                            </p>
                            <p className="mt-1 text-xs text-black/60">
                              Accounts:{" "}
                              <span className="font-semibold text-black">
                                {item.value}
                              </span>
                            </p>
                            <p className="text-xs text-black/60">
                              Balance:{" "}
                              <span className="font-semibold text-black">
                                {formatMoney(item.balance)}
                              </span>
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend
                    iconType="circle"
                    iconSize={8}
                    formatter={(value) => (
                      <span className="text-xs font-medium text-black/70">
                        {value}
                      </span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : null}
          </div>

          <div className="mt-4 divide-y divide-black/5">
            {pieData.map((item, idx) => (
              <div
                key={item.name}
                className="flex items-center justify-between py-3"
              >
                <div className="flex items-center gap-2">
                  <span
                    className="size-2.5 rounded-full"
                    style={{
                      backgroundColor: PIE_COLORS[idx % PIE_COLORS.length],
                    }}
                  />
                  <span className="text-sm font-semibold capitalize text-black">
                    {item.name}
                  </span>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-black">
                    {item.value} accounts
                  </p>
                  <p className="text-[11px] text-black/50">
                    {formatMoney(item.balance)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
