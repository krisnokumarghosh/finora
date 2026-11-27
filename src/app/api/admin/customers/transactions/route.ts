import { NextResponse } from "next/server";
import { getUserSession } from "@/lib/core/session";
import { isStaffOrAdmin } from "@/lib/core/authz";
import { db } from "@/lib/db/mongodb";
import type { AccountType, StaffTransaction, UnifiedTransaction } from "@/lib/redux/api";

type SessionRole = { role?: string | null };

const toIsoString = (value: unknown) => {
  if (value instanceof Date) return value.toISOString();
  const parsed = new Date(value as string | number);
  return Number.isNaN(parsed.getTime())
    ? new Date().toISOString()
    : parsed.toISOString();
};

export async function GET(req: Request) {
  const user = await getUserSession();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (
    !isStaffOrAdmin({
      id: user.id,
      name: user.name,
      role: (user as SessionRole).role,
    })
  ) {
    return NextResponse.json(
      { error: "You do not have permission to view customer transactions." },
      { status: 403 }
    );
  }

  const { searchParams } = new URL(req.url);
  const userId = (searchParams.get("userId") || "").trim();
  const limitParam = Number(searchParams.get("limit")) || 20;
  const offsetParam = Number(searchParams.get("offset")) || 0;
  const typeParam = searchParams.get("type") || "all";

  if (!userId) {
    return NextResponse.json(
      { error: "A valid customer user ID is required." },
      { status: 400 }
    );
  }

  const limit = Math.max(1, Math.min(100, limitParam));
  const offset = Math.max(0, offsetParam);

  const customerAccounts = await db
    .collection("bankacc")
    .find({ userId }, { projection: { accountNumber: 1, type: 1, name: 1 } })
    .toArray();

  const accountNumbers = customerAccounts
    .map((acc) => acc.accountNumber)
    .filter(Boolean) as string[];

  const accountInfoMap = new Map<
    string,
    { type: AccountType; name: string }
  >();
  for (const acc of customerAccounts) {
    if (acc.accountNumber) {
      accountInfoMap.set(acc.accountNumber, {
        type: (acc.type as AccountType) || "savings",
        name: acc.name || "",
      });
    }
  }

  const includeTransfers = typeParam === "all" || typeParam === "transfer";
  const includeRequests =
    typeParam === "all" ||
    typeParam === "deposit" ||
    typeParam === "withdrawal";

  const transferFilter: Record<string, unknown> = {
    $or: [
      { userId },
      { accountNumber: { $in: accountNumbers } },
      { senderAccountNumber: { $in: accountNumbers } },
      { recipientAccountNumber: { $in: accountNumbers } },
    ],
  };

  const requestFilter: Record<string, unknown> = {
    $or: [{ userId }, { accountNumber: { $in: accountNumbers } }],
  };

  if (typeParam === "deposit" || typeParam === "withdrawal") {
    requestFilter.type = typeParam;
  }

  const [txRows, reqRows] = await Promise.all([
    includeTransfers && (accountNumbers.length > 0 || userId)
      ? db
          .collection("transactions")
          .find(transferFilter)
          .sort({ createdAt: -1 })
          .toArray()
      : Promise.resolve([]),
    includeRequests && (accountNumbers.length > 0 || userId)
      ? db
          .collection("fund_requests")
          .find(requestFilter)
          .sort({ createdAt: -1 })
          .toArray()
      : Promise.resolve([]),
  ]);

  const txIds = txRows.map((t) => t.transactionId).filter(Boolean);
  const flags = txIds.length
    ? await db
        .collection("transaction_flags")
        .find({ transactionId: { $in: txIds } })
        .toArray()
    : [];

  const flagMap = new Map(flags.map((f) => [f.transactionId, f]));

  const mappedTransfers: StaffTransaction[] = txRows.map((tx) => {
    const isCredit =
      tx.direction === "credit" ||
      (accountNumbers.includes(tx.recipientAccountNumber) &&
        !accountNumbers.includes(tx.senderAccountNumber));

    const accInfo = accountInfoMap.get(tx.accountNumber);
    const flag = flagMap.get(tx.transactionId);

    return {
      id: tx._id.toString(),
      transactionId:
        tx.transactionId || `TXN${tx._id.toString().slice(-6).toUpperCase()}`,
      type: "transfer",
      direction: isCredit ? "credit" : "debit",
      accountNumber: tx.accountNumber || (isCredit ? tx.recipientAccountNumber : tx.senderAccountNumber) || "",
      accountType: accInfo?.type || "savings",
      accountName: isCredit ? tx.recipientName : tx.senderName,
      customerUserId: userId,
      counterpartAccountNumber: isCredit
        ? tx.senderAccountNumber
        : tx.recipientAccountNumber,
      counterpartName: isCredit ? tx.senderName : tx.recipientName,
      amount: Number(tx.amount) || 0,
      fee: Number(tx.fee) || 0,
      balanceAfter:
        typeof tx.balanceAfter === "number" ? tx.balanceAfter : undefined,
      description:
        tx.description ||
        (isCredit ? "Incoming Transfer" : "Outgoing Transfer"),
      status: (tx.status === "completed"
        ? "completed"
        : tx.status || "completed") as UnifiedTransaction["status"],
      isCredit,
      createdAt: toIsoString(tx.createdAt),
      flag: flag
        ? {
            reason: flag.reason || "Flagged for review",
            flaggedBy: flag.flaggedBy,
            flaggedByName: flag.flaggedByName || "Staff",
            createdAt: toIsoString(flag.createdAt),
          }
        : null,
    };
  });

  const mappedRequests: StaffTransaction[] = reqRows.map((req) => {
    const isDeposit = req.type === "deposit";
    const accInfo = accountInfoMap.get(req.accountNumber);

    return {
      id: req._id.toString(),
      transactionId:
        req.requestId || `REQ${req._id.toString().slice(-6).toUpperCase()}`,
      type: isDeposit ? "deposit" : "withdrawal",
      direction: isDeposit ? "credit" : "debit",
      accountNumber: req.accountNumber || "",
      accountType: accInfo?.type || "savings",
      accountName: req.accountName || accInfo?.name || "",
      customerUserId: userId,
      counterpartAccountNumber: undefined,
      counterpartName: undefined,
      amount: Number(req.amount) || 0,
      fee: 0,
      balanceAfter: undefined,
      description:
        req.description ||
        (isDeposit ? "Deposit Request" : "Withdrawal Request"),
      status: (req.status || "pending") as UnifiedTransaction["status"],
      isCredit: isDeposit,
      createdAt: toIsoString(req.createdAt),
      flag: null,
    };
  });

  const all = [...mappedTransfers, ...mappedRequests].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const total = all.length;
  const paged = all.slice(offset, offset + limit);

  return NextResponse.json({
    transactions: paged,
    total,
    limit,
    offset,
    hasMore: offset + paged.length < total,
  });
}
