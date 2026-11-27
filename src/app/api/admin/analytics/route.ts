import { NextResponse } from "next/server";
import { getUserSession } from "@/lib/core/session";
import { db } from "@/lib/db/mongodb";

type SessionRole = { role?: string | null };

const bad = (message: string, status = 400) =>
  NextResponse.json({ error: message }, { status });

export async function GET() {
  const user = await getUserSession();
  if (!user) return bad("Unauthorized", 401);

  if ((user as SessionRole).role !== "admin") {
    return bad("You do not have permission to view admin analytics.", 403);
  }

  const [
    totalCustomers,
    totalBankAccounts,
    totalBalanceAgg,
    totalDepositAgg,
    totalWithdrawalAgg,
    totalTransactions,
    pendingLoans,
    monthlyTransactions,
    accountTypeDistribution,
    yearlyTransactions,
  ] = await Promise.all([
    db.collection("user").countDocuments({ role: "customer" }),

    db.collection("bankacc").countDocuments({}),

    db
      .collection("bankacc")
      .aggregate<{ total: number }>([
        { $group: { _id: null, total: { $sum: "$balance" } } },
      ])
      .toArray(),

    db
      .collection("fund_requests")
      .aggregate<{ total: number }>([
        { $match: { type: "deposit", status: "approved" } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ])
      .toArray(),

    db
      .collection("fund_requests")
      .aggregate<{ total: number }>([
        { $match: { type: "withdrawal", status: "approved" } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ])
      .toArray(),

    (async () => {
      const [transfers, fundReqs] = await Promise.all([
        db.collection("transactions").countDocuments({ status: "completed" }),
        db
          .collection("fund_requests")
          .countDocuments({ status: "approved" }),
      ]);
      return transfers + fundReqs;
    })(),

    db.collection("loans").countDocuments({ status: "pending" }),

    (async () => {
      const now = new Date();
      const twelveMonthsAgo = new Date(
        now.getFullYear(),
        now.getMonth() - 11,
        1
      );

      const [transferData, fundData] = await Promise.all([
        db
          .collection("transactions")
          .aggregate<{
            _id: { year: number; month: number; type: string };
            count: number;
            total: number;
          }>([
            {
              $match: {
                createdAt: { $gte: twelveMonthsAgo },
                status: "completed",
                direction: "debit",
              },
            },
            {
              $group: {
                _id: {
                  year: { $year: "$createdAt" },
                  month: { $month: "$createdAt" },
                  type: "transfer",
                },
                count: { $sum: 1 },
                total: { $sum: "$amount" },
              },
            },
          ])
          .toArray(),

        db
          .collection("fund_requests")
          .aggregate<{
            _id: { year: number; month: number; type: string };
            count: number;
            total: number;
          }>([
            {
              $match: {
                createdAt: { $gte: twelveMonthsAgo },
                status: "approved",
              },
            },
            {
              $group: {
                _id: {
                  year: { $year: "$createdAt" },
                  month: { $month: "$createdAt" },
                  type: "$type",
                },
                count: { $sum: 1 },
                total: { $sum: "$amount" },
              },
            },
          ])
          .toArray(),
      ]);

      return [...transferData, ...fundData];
    })(),

    db
      .collection("bankacc")
      .aggregate<{ _id: string; count: number; totalBalance: number }>([
        {
          $group: {
            _id: "$type",
            count: { $sum: 1 },
            totalBalance: { $sum: "$balance" },
          },
        },
      ])
      .toArray(),

    (async () => {
      const now = new Date();
      const fiveYearsAgo = new Date(now.getFullYear() - 4, 0, 1);

      const [transferData, fundData] = await Promise.all([
        db
          .collection("transactions")
          .aggregate<{
            _id: { year: number; type: string };
            count: number;
            total: number;
          }>([
            {
              $match: {
                createdAt: { $gte: fiveYearsAgo },
                status: "completed",
                direction: "debit",
              },
            },
            {
              $group: {
                _id: {
                  year: { $year: "$createdAt" },
                  type: "transfer",
                },
                count: { $sum: 1 },
                total: { $sum: "$amount" },
              },
            },
          ])
          .toArray(),

        db
          .collection("fund_requests")
          .aggregate<{
            _id: { year: number; type: string };
            count: number;
            total: number;
          }>([
            {
              $match: {
                createdAt: { $gte: fiveYearsAgo },
                status: "approved",
              },
            },
            {
              $group: {
                _id: {
                  year: { $year: "$createdAt" },
                  type: "$type",
                },
                count: { $sum: 1 },
                total: { $sum: "$amount" },
              },
            },
          ])
          .toArray(),
      ]);

      return [...transferData, ...fundData];
    })(),
  ]);

  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];
  const now = new Date();

  const monthlyChartData = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 11 + i, 1);
    const year = d.getFullYear();
    const month = d.getMonth() + 1;
    return { name: months[d.getMonth()], year, month, deposit: 0, withdrawal: 0, transfer: 0 };
  });

  for (const row of monthlyTransactions) {
    const slot = monthlyChartData.find(
      (s) => s.year === row._id.year && s.month === row._id.month
    );
    if (!slot) continue;
    const type = row._id.type as "deposit" | "withdrawal" | "transfer";
    if (type === "deposit") slot.deposit += row.total;
    else if (type === "withdrawal") slot.withdrawal += row.total;
    else if (type === "transfer") slot.transfer += row.total;
  }

  const yearlyChartData = Array.from({ length: 5 }, (_, i) => {
    const year = now.getFullYear() - 4 + i;
    return { name: String(year), year, deposit: 0, withdrawal: 0, transfer: 0 };
  });

  for (const row of yearlyTransactions) {
    const slot = yearlyChartData.find((s) => s.year === row._id.year);
    if (!slot) continue;
    const type = row._id.type as "deposit" | "withdrawal" | "transfer";
    if (type === "deposit") slot.deposit += row.total;
    else if (type === "withdrawal") slot.withdrawal += row.total;
    else if (type === "transfer") slot.transfer += row.total;
  }

  const accountTypeData = accountTypeDistribution.map((row) => ({
    type: row._id || "savings",
    count: row.count,
    totalBalance: row.totalBalance,
  }));

  return NextResponse.json({
    summary: {
      totalCustomers,
      totalBankAccounts,
      totalBankBalance: totalBalanceAgg[0]?.total ?? 0,
      totalDeposits: totalDepositAgg[0]?.total ?? 0,
      totalWithdrawals: totalWithdrawalAgg[0]?.total ?? 0,
      totalTransactions,
      pendingLoans,
    },
    monthlyChartData,
    yearlyChartData,
    accountTypeData,
  });
}
