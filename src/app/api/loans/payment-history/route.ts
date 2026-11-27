import { NextResponse } from "next/server";
import { getUserSession } from "@/lib/core/session";
import { isStaffOrAdmin } from "@/lib/core/authz";
import { db } from "@/lib/db/mongodb";
import {
  LOAN_PAYMENT_HISTORY_COLLECTION,
  processDueLoanRepayments,
} from "@/lib/server/loanRepayments";

type SessionRole = { role?: string | null };

const toIso = (value: unknown): string => {
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "string") {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) return parsed.toISOString();
  }
  return "";
};

export async function GET(req: Request) {
  const user = await getUserSession();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const loanIdParam = (searchParams.get("loanId") || "").trim();

  const staffOrAdmin = isStaffOrAdmin({
    id: user.id,
    name: user.name,
    role: (user as SessionRole).role,
  });

  await processDueLoanRepayments(
    staffOrAdmin ? undefined : { userId: user.id }
  ).catch((err: unknown) => {
    console.error("Failed to process due loan repayments:", err);
  });

  const query: Record<string, unknown> = {};
  if (!staffOrAdmin) {
    query.userId = user.id;
  }

  if (loanIdParam) {
    query.$or = [{ loanId: loanIdParam }, { loanObjectId: loanIdParam }];
  }

  const rows = await db
    .collection(LOAN_PAYMENT_HISTORY_COLLECTION)
    .find(query)
    .sort({ paidAt: -1, createdAt: -1 })
    .limit(100)
    .toArray();

  const history = rows.map((row) => ({
    id: row._id.toString(),
    paymentId: (row.paymentId as string) || row._id.toString(),
    loanId: (row.loanId as string) || "",
    loanObjectId: (row.loanObjectId as string) || "",
    accountNumber: (row.accountNumber as string) || "",
    installmentNumber: Number(row.installmentNumber) || 1,
    amount: Number(row.amount) || 0,
    balanceBefore:
      typeof row.balanceBefore === "number" ? row.balanceBefore : undefined,
    balanceAfter:
      typeof row.balanceAfter === "number" ? row.balanceAfter : undefined,
    remainingLoanBalance:
      typeof row.remainingLoanBalance === "number"
        ? row.remainingLoanBalance
        : undefined,
    status: (row.status as "paid" | "late" | "pending") || "paid",
    method: (row.method as string) || "Auto Debit",
    reference: (row.reference as string) || undefined,
    dueDate: toIso(row.dueDate),
    paidAt: toIso(row.paidAt) || toIso(row.createdAt),
  }));

  return NextResponse.json({ history });
}
