import { NextResponse } from "next/server";
import { getUserSession } from "@/lib/core/session";
import { isStaffOrAdmin } from "@/lib/core/authz";
import { db } from "@/lib/db/mongodb";
import type { AccountType, UnifiedTransaction } from "@/lib/redux/api";

type SessionRole = { role?: string | null };

type DateRange = { $gte?: Date; $lt?: Date };

const escapeRegex = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const parseDate = (value: string, addDays = 0) => {
  const parts = value.split("-").map(Number);
  if (parts.length !== 3 || parts.some((part) => Number.isNaN(part))) {
    return null;
  }
  const [year, month, day] = parts;
  const date = new Date(year, month - 1, day + addDays);
  return Number.isNaN(date.getTime()) ? null : date;
};

const parseDateRange = (dateFrom: string, dateTo: string): DateRange | null => {
  const range: DateRange = {};

  if (dateFrom) {
    const from = parseDate(dateFrom);
    if (from) range.$gte = from;
  }

  if (dateTo) {
    const to = parseDate(dateTo, 1);
    if (to) range.$lt = to;
  }

  return Object.keys(range).length > 0 ? range : null;
};

const toIsoString = (value: unknown) => {
  if (value instanceof Date) return value.toISOString();
  const parsed = new Date(value as string | number);
  return Number.isNaN(parsed.getTime())
    ? new Date().toISOString()
    : parsed.toISOString();
};

let flagIndexPromise: Promise<string> | null = null;

const ensureFlagIndex = () => {
  if (!flagIndexPromise) {
    flagIndexPromise = db
      .collection("transaction_flags")
      .createIndex({ transactionId: 1 }, { unique: true });
  }
  return flagIndexPromise;
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
      { error: "You do not have permission to view all transactions." },
      { status: 403 }
    );
  }

  const { searchParams } = new URL(req.url);

  const limitParam = Number(searchParams.get("limit")) || 15;
  const offsetParam = Number(searchParams.get("offset")) || 0;
  const typeParam = searchParams.get("type") || "all";
  const statusParam = searchParams.get("status") || "all";
  const flaggedParam = searchParams.get("flagged") || "all";
  const searchParam = (searchParams.get("search") || "").trim();
  const dateFrom = (searchParams.get("dateFrom") || "").trim();
  const dateTo = (searchParams.get("dateTo") || "").trim();

  const limit = Math.max(1, Math.min(100, limitParam));
  const offset = Math.max(0, offsetParam);
  const dateRange = parseDateRange(dateFrom, dateTo);
  const searchRegex = searchParam
    ? new RegExp(escapeRegex(searchParam), "i")
    : null;

  const includeTransfers = typeParam === "all" || typeParam === "transfer";
  const includeRequests =
    typeParam === "all" ||
    typeParam === "deposit" ||
    typeParam === "withdrawal";

  const transferQuery: Record<string, unknown> = {};
  if (dateRange) transferQuery.createdAt = dateRange;
  if (statusParam !== "all") transferQuery.status = statusParam;
  if (searchRegex) transferQuery.transactionId = searchRegex;

  const requestQuery: Record<string, unknown> = {};
  if (dateRange) requestQuery.createdAt = dateRange;
  if (statusParam !== "all") requestQuery.status = statusParam;
  if (searchRegex) requestQuery.requestId = searchRegex;
  if (typeParam === "deposit" || typeParam === "withdrawal") {
    requestQuery.type = typeParam;
  }

  const [txRows, reqRows] = await Promise.all([
    includeTransfers
      ? db
          .collection("transactions")
          .find(transferQuery)
          .sort({ createdAt: -1 })
          .toArray()
      : Promise.resolve([]),
    includeRequests
      ? db
          .collection("fund_requests")
          .find(requestQuery)
          .sort({ createdAt: -1 })
          .toArray()
      : Promise.resolve([]),
  ]);

  const accountNumbers = new Set<string>();
  for (const tx of txRows) {
    if (tx.accountNumber) accountNumbers.add(tx.accountNumber);
    if (tx.senderAccountNumber) accountNumbers.add(tx.senderAccountNumber);
    if (tx.recipientAccountNumber) accountNumbers.add(tx.recipientAccountNumber);
  }
  for (const req of reqRows) {
    if (req.accountNumber) accountNumbers.add(req.accountNumber);
  }

  const accountRows = accountNumbers.size
    ? await db
        .collection("bankacc")
        .find(
          { accountNumber: { $in: [...accountNumbers] } },
          { projection: { accountNumber: 1, type: 1, name: 1, userId: 1 } }
        )
        .toArray()
    : [];

  const accountInfoMap = new Map<
    string,
    { type: AccountType; name: string; userId: string }
  >();
  for (const acc of accountRows) {
    accountInfoMap.set(acc.accountNumber, {
      type: (acc.type as AccountType) || "savings",
      name: acc.name || "",
      userId: acc.userId || "",
    });
  }

  const uniqueTransferRows = new Map<string, (typeof txRows)[number]>();
  for (const tx of txRows) {
    const key = tx.transactionId || tx._id.toString();
    const existing = uniqueTransferRows.get(key);
    if (
      !existing ||
      (existing.direction === "credit" && tx.direction !== "credit")
    ) {
      uniqueTransferRows.set(key, tx);
    }
  }

  const mappedTransfers = [...uniqueTransferRows.values()].map((tx) => {
    const accInfo = accountInfoMap.get(tx.accountNumber);
    const isCredit = tx.direction === "credit";

    return {
      id: tx._id.toString(),
      transactionId:
        tx.transactionId || `TXN${tx._id.toString().slice(-6).toUpperCase()}`,
      type: "transfer" as const,
      direction: (tx.direction as "debit" | "credit") || "debit",
      accountNumber: tx.accountNumber || "",
      accountType: accInfo?.type || "savings",
      accountName: isCredit ? tx.recipientName : tx.senderName,
      customerUserId: tx.userId || accInfo?.userId,
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
    };
  });

  const mappedRequests = reqRows.map((req) => {
    const accInfo = accountInfoMap.get(req.accountNumber);
    const isDeposit = req.type === "deposit";

    return {
      id: req._id.toString(),
      transactionId:
        req.requestId || `REQ${req._id.toString().slice(-6).toUpperCase()}`,
      type: (req.type === "deposit" ? "deposit" : "withdrawal") as
        | "deposit"
        | "withdrawal",
      direction: isDeposit ? ("credit" as const) : ("debit" as const),
      accountNumber: req.accountNumber || "",
      accountType: accInfo?.type || "savings",
      accountName: req.accountName || accInfo?.name || "",
      customerUserId: req.userId || accInfo?.userId,
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
    };
  });

  const transactionIds = [...mappedTransfers, ...mappedRequests].map(
    (tx) => tx.transactionId
  );

  const flagRows = transactionIds.length
    ? await db
        .collection("transaction_flags")
        .find({ transactionId: { $in: transactionIds } })
        .toArray()
    : [];

  const flagMap = new Map(
    flagRows.map((flag) => [
      flag.transactionId as string,
      {
        reason: flag.reason as string,
        flaggedBy: flag.flaggedBy as string,
        flaggedByName: (flag.flaggedByName as string) || "Bank Staff",
        createdAt: toIsoString(flag.createdAt),
      },
    ])
  );

  let combined = [...mappedTransfers, ...mappedRequests].map((tx) => ({
    ...tx,
    flag: flagMap.get(tx.transactionId) ?? null,
  }));

  if (flaggedParam === "flagged") {
    combined = combined.filter((tx) => tx.flag !== null);
  } else if (flaggedParam === "unflagged") {
    combined = combined.filter((tx) => tx.flag === null);
  }

  combined.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const total = combined.length;
  const paginatedTransactions = combined.slice(offset, offset + limit);

  return NextResponse.json({
    transactions: paginatedTransactions,
    total,
    limit,
    offset,
    hasMore: offset + paginatedTransactions.length < total,
  });
}

export async function PATCH(req: Request) {
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
      { error: "You do not have permission to flag transactions." },
      { status: 403 }
    );
  }

  const body = (await req.json()) as Record<string, unknown>;
  const transactionId =
    typeof body.transactionId === "string" ? body.transactionId.trim() : "";
  const action = body.action;
  const reason = typeof body.reason === "string" ? body.reason.trim() : "";

  if (!transactionId) {
    return NextResponse.json(
      { error: "Transaction ID is required." },
      { status: 400 }
    );
  }

  if (action !== "flag" && action !== "unflag") {
    return NextResponse.json(
      { error: "Action must be either 'flag' or 'unflag'." },
      { status: 400 }
    );
  }

  if (action === "unflag") {
    await db.collection("transaction_flags").deleteOne({ transactionId });
    return NextResponse.json({
      success: true,
      message: "Suspicious transaction flag removed.",
      flag: null,
    });
  }

  const exists =
    (await db.collection("transactions").findOne({ transactionId })) ||
    (await db.collection("fund_requests").findOne({ requestId: transactionId }));

  if (!exists) {
    return NextResponse.json(
      { error: "Transaction not found." },
      { status: 404 }
    );
  }

  if (reason.length < 3) {
    return NextResponse.json(
      { error: "Please provide a reason of at least 3 characters." },
      { status: 400 }
    );
  }

  await ensureFlagIndex().catch((error: unknown) => {
    console.error("Failed to create transaction flag index:", error);
  });

  const now = new Date();
  const cleanReason = reason.slice(0, 250);

  await db.collection("transaction_flags").updateOne(
    { transactionId },
    {
      $set: {
        transactionId,
        reason: cleanReason,
        flaggedBy: user.id,
        flaggedByName: user.name || "Bank Staff",
        updatedAt: now,
        createdAt: now,
      },
    },
    { upsert: true }
  );

  return NextResponse.json({
    success: true,
    message: "Transaction flagged for admin review.",
    flag: {
      reason: cleanReason,
      flaggedBy: user.id,
      flaggedByName: user.name || "Bank Staff",
      createdAt: now.toISOString(),
    },
  });
}
