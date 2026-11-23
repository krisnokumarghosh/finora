import { NextResponse } from "next/server";
import { getUserSession } from "@/lib/core/session";
import { db } from "@/lib/db/mongodb";
import type { AccountType } from "@/lib/redux/api";

export async function GET(req: Request) {
  // 1. Authenticate user
  const user = await getUserSession();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 2. Parse query parameters
  const { searchParams } = new URL(req.url);
  const limitParam = Number(searchParams.get("limit")) || 15;
  const offsetParam = Number(searchParams.get("offset")) || 0;
  const accountTypeParam = searchParams.get("accountType") || "all";
  const typeParam = searchParams.get("type") || "all";
  const searchParam = (searchParams.get("search") || "").trim();

  const limit = Math.max(1, Math.min(100, limitParam));
  const offset = Math.max(0, offsetParam);

  // 3. Fetch user's bank accounts to map account types
  const userAccounts = await db
    .collection("bankacc")
    .find({ userId: user.id })
    .toArray();

  const accountInfoMap = new Map<
    string,
    { type: AccountType; name: string }
  >();
  for (const acc of userAccounts) {
    accountInfoMap.set(acc.accountNumber, {
      type: (acc.type as AccountType) || "savings",
      name: acc.name || "",
    });
  }

  // Determine filtered account numbers if accountType filter is active
  let matchingAccountNumbers: string[] | null = null;
  if (accountTypeParam !== "all") {
    matchingAccountNumbers = userAccounts
      .filter((acc) => acc.type === accountTypeParam)
      .map((acc) => acc.accountNumber);

    // If user has no accounts of this type, return 0 results immediately
    if (matchingAccountNumbers.length === 0) {
      return NextResponse.json({
        transactions: [],
        total: 0,
        limit,
        offset,
        hasMore: false,
      });
    }
  }

  // 4. Fetch fund transfers from 'transactions' collection
  let mappedTransfers: Array<{
    id: string;
    transactionId: string;
    type: "transfer" | "deposit" | "withdrawal";
    direction: "debit" | "credit";
    accountNumber: string;
    accountType: AccountType;
    accountName?: string;
    counterpartAccountNumber?: string;
    counterpartName?: string;
    amount: number;
    fee: number;
    balanceAfter?: number;
    description: string;
    status: "completed" | "approved" | "pending" | "rejected";
    isCredit: boolean;
    createdAt: string;
  }> = [];

  if (typeParam === "all" || typeParam === "transfer") {
    const txQuery: Record<string, unknown> = { userId: user.id };

    if (matchingAccountNumbers) {
      txQuery.accountNumber = { $in: matchingAccountNumbers };
    }

    if (searchParam) {
      txQuery.$or = [
        { accountNumber: { $regex: searchParam, $options: "i" } },
        { senderAccountNumber: { $regex: searchParam, $options: "i" } },
        { recipientAccountNumber: { $regex: searchParam, $options: "i" } },
      ];
    }

    const txRows = await db
      .collection("transactions")
      .find(txQuery)
      .sort({ createdAt: -1 })
      .toArray();

    mappedTransfers = txRows.map((tx) => {
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
          : tx.status || "completed") as
          | "completed"
          | "approved"
          | "pending"
          | "rejected",
        isCredit,
        createdAt:
          tx.createdAt instanceof Date
            ? tx.createdAt.toISOString()
            : new Date(tx.createdAt).toISOString(),
      };
    });
  }

  // 5. Fetch deposit / withdrawal requests from 'fund_requests' collection
  let mappedRequests: Array<{
    id: string;
    transactionId: string;
    type: "transfer" | "deposit" | "withdrawal";
    direction: "debit" | "credit";
    accountNumber: string;
    accountType: AccountType;
    accountName?: string;
    counterpartAccountNumber?: string;
    counterpartName?: string;
    amount: number;
    fee: number;
    balanceAfter?: number;
    description: string;
    status: "completed" | "approved" | "pending" | "rejected";
    isCredit: boolean;
    createdAt: string;
  }> = [];

  if (
    typeParam === "all" ||
    typeParam === "deposit" ||
    typeParam === "withdrawal"
  ) {
    const reqQuery: Record<string, unknown> = { userId: user.id };

    if (typeParam === "deposit" || typeParam === "withdrawal") {
      reqQuery.type = typeParam;
    }

    if (matchingAccountNumbers) {
      reqQuery.accountNumber = { $in: matchingAccountNumbers };
    }

    if (searchParam) {
      reqQuery.accountNumber = { $regex: searchParam, $options: "i" };
    }

    const reqRows = await db
      .collection("fund_requests")
      .find(reqQuery)
      .sort({ createdAt: -1 })
      .toArray();

    mappedRequests = reqRows.map((req) => {
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
        counterpartAccountNumber: undefined,
        counterpartName: undefined,
        amount: Number(req.amount) || 0,
        fee: 0,
        description:
          req.description ||
          (isDeposit ? "Deposit Request" : "Withdrawal Request"),
        status: (req.status || "pending") as
          | "completed"
          | "approved"
          | "pending"
          | "rejected",
        isCredit: isDeposit,
        createdAt:
          req.createdAt instanceof Date
            ? req.createdAt.toISOString()
            : new Date(req.createdAt).toISOString(),
      };
    });
  }

  // 6. Merge, sort chronologically (newest first), and slice
  const combined = [...mappedTransfers, ...mappedRequests];
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
