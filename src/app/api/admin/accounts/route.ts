import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getUserSession } from "@/lib/core/session";
import { db } from "@/lib/db/mongodb";
import type {
  AccountStatus,
  AccountType,
  StaffBankAccount,
} from "@/lib/redux/api";

type SessionRole = { role?: string | null };

type AccountDoc = {
  _id: ObjectId;
  userId?: string;
  type?: AccountType;
  name?: string;
  mobile?: string;
  accountNumber?: string;
  balance?: number;
  status?: AccountStatus;
  transactionLimit?: number;
  createdAt?: Date | string;
  createdByName?: string;
};

type UserDoc = {
  _id: ObjectId;
  name?: string;
  email?: string;
  role?: string;
};

const ACCOUNT_STATUSES: AccountStatus[] = [
  "pending",
  "under_review",
  "active",
  "frozen",
  "rejected",
];

const toIsoString = (value: unknown) => {
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "string") {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) return parsed.toISOString();
  }
  return "";
};

const isAccountStatus = (value: unknown): value is AccountStatus =>
  typeof value === "string" && ACCOUNT_STATUSES.includes(value as AccountStatus);

const bad = (message: string, status = 400) =>
  NextResponse.json({ error: message }, { status });

const mapAccount = (
  doc: AccountDoc,
  customer?: UserDoc
): StaffBankAccount => ({
  id: doc._id.toString(),
  userId: doc.userId || "",
  customerName: customer?.name || doc.name || "Customer",
  customerEmail: customer?.email,
  type: doc.type || "savings",
  name: doc.name || customer?.name || "Customer",
  mobile: doc.mobile || "",
  accountNumber: doc.accountNumber || "",
  balance: Number(doc.balance) || 0,
  status: isAccountStatus(doc.status) ? doc.status : "pending",
  transactionLimit:
    typeof doc.transactionLimit === "number"
      ? doc.transactionLimit
      : undefined,
  createdAt: toIsoString(doc.createdAt),
  createdByName: doc.createdByName,
});

export async function PATCH(req: Request) {
  // 1. Authorize: Only Admin can update bank account status through this route
  const user = await getUserSession();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if ((user as SessionRole).role !== "admin") {
    return NextResponse.json(
      { error: "Only admins have permission to update bank account status." },
      { status: 403 }
    );
  }

  // 2. Validate payload
  const body = (await req.json()) as Record<string, unknown>;
  const accountId =
    typeof body.accountId === "string" ? body.accountId.trim() : "";
  const status = body.status;
  const reason = typeof body.reason === "string" ? body.reason.trim() : "";

  if (!ObjectId.isValid(accountId)) {
    return bad("A valid bank account ID is required.");
  }

  if (!isAccountStatus(status)) {
    return bad("A valid account status is required.");
  }

  // 3. Find target account
  const account = await db
    .collection<AccountDoc>("bankacc")
    .findOne({ _id: new ObjectId(accountId) });

  if (!account) {
    return bad("Bank account not found.", 404);
  }

  const now = new Date();
  await db.collection<AccountDoc>("bankacc").updateOne(
    { _id: new ObjectId(accountId) },
    {
      $set: {
        status,
        updatedAt: now,
        statusReason: reason || undefined,
        statusUpdatedBy: user.id,
      },
    }
  );

  const updated = await db
    .collection<AccountDoc>("bankacc")
    .findOne({ _id: new ObjectId(accountId) });

  const customer = account.userId
    ? await db.collection<UserDoc>("user").findOne({
        _id: ObjectId.isValid(account.userId)
          ? new ObjectId(account.userId)
          : undefined,
      })
    : null;

  return NextResponse.json({
    success: true,
    message: `Account status updated to ${status}.`,
    account: mapAccount(updated ?? account, customer ?? undefined),
  });
}
