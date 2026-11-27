import { NextResponse } from "next/server";
import { randomInt } from "crypto";
import { ObjectId } from "mongodb";
import { getUserSession } from "@/lib/core/session";
import { hashPin } from "@/lib/core/pin";
import { db } from "@/lib/db/mongodb";
import type {
  AccountStatus,
  AccountType,
  AdminAccountStatusCounts,
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
  statusReason?: string;
  freezeReason?: string;
  createdAt?: Date | string;
  createdByName?: string;
};

type UserDoc = {
  _id: ObjectId;
  name?: string;
  email?: string;
  role?: string;
};

const ACCOUNT_TYPES: AccountType[] = ["savings", "current", "business"];
const ACCOUNT_STATUSES: AccountStatus[] = [
  "pending",
  "under_review",
  "active",
  "frozen",
  "rejected",
];

const MIN_TRANSACTION_LIMIT = 1000;
const MAX_TRANSACTION_LIMIT = 10000000;

const escapeRegex = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const toIsoString = (value: unknown) => {
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "string") {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) return parsed.toISOString();
  }
  return "";
};

const isAccountType = (value: unknown): value is AccountType =>
  typeof value === "string" && ACCOUNT_TYPES.includes(value as AccountType);

const isAccountStatus = (value: unknown): value is AccountStatus =>
  typeof value === "string" && ACCOUNT_STATUSES.includes(value as AccountStatus);

const bad = (message: string, status = 400) =>
  NextResponse.json({ error: message }, { status });

let indexPromise: Promise<unknown> | null = null;

const ensureIndexes = () => {
  if (!indexPromise) {
    indexPromise = Promise.all([
      db.collection("bankacc").createIndex({ accountNumber: 1 }),
      db.collection("bankacc").createIndex({ status: 1, createdAt: -1 }),
      db.collection("bankacc").createIndex({ userId: 1 }),
    ]);
  }
  return indexPromise;
};

const mapAccount = (
  doc: AccountDoc,
  customer?: UserDoc
): StaffBankAccount => ({
  id: doc._id.toString(),
  userId: doc.userId || "",
  customerName: customer?.name || doc.name || "Customer",
  customerEmail: customer?.email,
  type: isAccountType(doc.type) ? doc.type : "savings",
  name: doc.name || customer?.name || "Customer",
  mobile: doc.mobile || "",
  accountNumber: doc.accountNumber || "",
  balance: Number(doc.balance) || 0,
  status: isAccountStatus(doc.status) ? doc.status : "pending",
  transactionLimit:
    typeof doc.transactionLimit === "number"
      ? doc.transactionLimit
      : undefined,
  statusReason: doc.statusReason,
  freezeReason: doc.freezeReason,
  createdAt: toIsoString(doc.createdAt),
  createdByName: doc.createdByName,
});

const generateAccountNumber = async () => {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const accountNumber = String(randomInt(100000000000, 1000000000000));
    const existing = await db
      .collection("bankacc")
      .findOne({ accountNumber }, { projection: { _id: 1 } });

    if (!existing) return accountNumber;
  }

  return null;
};

const getCustomer = async (userId?: string) => {
  if (!userId || !ObjectId.isValid(userId)) return null;

  return db
    .collection<UserDoc>("user")
    .findOne({ _id: new ObjectId(userId) });
};

const pendingStatusCondition = {
  $or: [
    { status: "pending" },
    { status: { $exists: false } },
    { status: null },
  ],
};

export async function GET(req: Request) {
  const user = await getUserSession();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if ((user as SessionRole).role !== "admin") {
    return NextResponse.json(
      { error: "Only admins have permission to manage bank accounts." },
      { status: 403 }
    );
  }

  const { searchParams } = new URL(req.url);
  const limitParam = Number(searchParams.get("limit")) || 15;
  const offsetParam = Number(searchParams.get("offset")) || 0;
  const typeParam = searchParams.get("type") || "all";
  const statusParam = searchParams.get("status") || "all";
  const searchParam = (searchParams.get("search") || "").trim();

  const limit = Math.max(1, Math.min(100, limitParam));
  const offset = Math.max(0, offsetParam);

  await ensureIndexes().catch((error: unknown) => {
    console.error("Failed to create admin bank account indexes:", error);
  });

  const conditions: Record<string, unknown>[] = [];

  if (typeParam !== "all" && isAccountType(typeParam)) {
    conditions.push({ type: typeParam });
  }

  if (statusParam === "needs_approval") {
    conditions.push({
      $or: [
        { status: { $in: ["pending", "under_review"] } },
        { status: { $exists: false } },
        { status: null },
      ],
    });
  } else if (statusParam === "pending") {
    conditions.push(pendingStatusCondition);
  } else if (statusParam !== "all" && isAccountStatus(statusParam)) {
    conditions.push({ status: statusParam });
  }

  if (searchParam) {
    const cleanSearch = searchParam.replace(/\s+/g, "");
    conditions.push({
      accountNumber: new RegExp(escapeRegex(cleanSearch), "i"),
    });
  }

  const query = conditions.length ? { $and: conditions } : {};

  const [total, rows, statusRows] = await Promise.all([
    db.collection("bankacc").countDocuments(query),
    db
      .collection<AccountDoc>("bankacc")
      .find(query, { projection: { pinHash: 0, nid: 0 } })
      .sort({ createdAt: -1 })
      .skip(offset)
      .limit(limit)
      .toArray(),
    db
      .collection("bankacc")
      .aggregate<{ _id: string; count: number }>([
        {
          $group: {
            _id: { $ifNull: ["$status", "pending"] },
            count: { $sum: 1 },
          },
        },
      ])
      .toArray(),
  ]);

  const statusCounts: AdminAccountStatusCounts = {
    all: 0,
    needs_approval: 0,
    pending: 0,
    under_review: 0,
    active: 0,
    frozen: 0,
    rejected: 0,
  };

  for (const row of statusRows) {
    const key = isAccountStatus(row._id) ? row._id : "pending";
    statusCounts[key] += row.count;
    statusCounts.all += row.count;
  }

  statusCounts.needs_approval =
    statusCounts.pending + statusCounts.under_review;

  const userIds = [
    ...new Set(rows.map((row) => row.userId).filter(Boolean)),
  ] as string[];
  const userObjectIds = userIds
    .filter((id) => ObjectId.isValid(id))
    .map((id) => new ObjectId(id));

  const customerRows = userObjectIds.length
    ? await db
        .collection<UserDoc>("user")
        .find(
          { _id: { $in: userObjectIds } },
          { projection: { name: 1, email: 1, role: 1 } }
        )
        .toArray()
    : [];

  const customerById = new Map(
    customerRows.map((row) => [row._id.toString(), row])
  );

  const accounts = rows.map((row) =>
    mapAccount(row, row.userId ? customerById.get(row.userId) : undefined)
  );

  return NextResponse.json({
    accounts,
    total,
    statusCounts,
    limit,
    offset,
    hasMore: offset + accounts.length < total,
  });
}

export async function POST(req: Request) {
  const user = await getUserSession();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if ((user as SessionRole).role !== "admin") {
    return NextResponse.json(
      { error: "Only admins have permission to create bank accounts." },
      { status: 403 }
    );
  }

  const body = (await req.json()) as Record<string, unknown>;
  const userId = typeof body.userId === "string" ? body.userId.trim() : "";
  const type = body.type;
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const mobile = typeof body.mobile === "string" ? body.mobile.trim() : "";
  const nid = typeof body.nid === "string" ? body.nid.trim() : "";
  const pin = typeof body.pin === "string" ? body.pin : "";
  const rawLimit = body.transactionLimit;

  if (!ObjectId.isValid(userId)) {
    return bad("Select a valid customer.");
  }

  if (!isAccountType(type)) {
    return bad("Select a valid account type.");
  }

  if (name.length < 2 || name.length > 60) {
    return bad("Account holder name must be 2 to 60 characters.");
  }

  if (!/^01[3-9]\d{8}$/.test(mobile)) {
    return bad("Enter a valid 11 digit mobile number.");
  }

  if (!/^(\d{10}|\d{13}|\d{17})$/.test(nid)) {
    return bad("NID must be 10, 13 or 17 digits.");
  }

  if (!/^\d{4}$/.test(pin)) {
    return bad("Transaction PIN must be 4 digits.");
  }

  const transactionLimit =
    rawLimit === undefined ? 100000 : Number(rawLimit);

  if (
    !Number.isInteger(transactionLimit) ||
    transactionLimit < MIN_TRANSACTION_LIMIT ||
    transactionLimit > MAX_TRANSACTION_LIMIT
  ) {
    return bad(
      "Transaction limit must be a whole number between ৳1,000 and ৳10,000,000."
    );
  }

  const customer = await db.collection<UserDoc>("user").findOne({
    _id: new ObjectId(userId),
    role: "customer",
  });

  if (!customer) {
    return bad("Customer not found.", 404);
  }

  const [userAccountCount, nidCount, mobileCount] = await Promise.all([
    db.collection("bankacc").countDocuments({ userId }),
    db.collection("bankacc").countDocuments({ nid }),
    db.collection("bankacc").countDocuments({ mobile }),
  ]);

  if (userAccountCount >= 3) {
    return bad("This customer already has the maximum of 3 bank accounts.");
  }

  if (nidCount >= 3) {
    return bad(
      "This NID has already been used for the maximum number of accounts."
    );
  }

  if (mobileCount >= 3) {
    return bad(
      "This mobile number has already been used for the maximum number of accounts."
    );
  }

  const accountNumber = await generateAccountNumber();
  if (!accountNumber) {
    return bad(
      "Could not generate a unique account number. Please try again.",
      500
    );
  }

  const now = new Date();
  const doc = {
    userId,
    type,
    name,
    mobile,
    nid,
    pinHash: hashPin(pin),
    accountNumber,
    balance: 0,
    status: "active" as const,
    transactionLimit,
    createdAt: now,
    updatedAt: now,
    createdBy: user.id,
    createdByName: user.name || "Administrator",
  };

  const result = await db.collection("bankacc").insertOne(doc);

  return NextResponse.json(
    {
      success: true,
      message: "Bank account created and activated successfully.",
      account: mapAccount(
        { ...doc, _id: result.insertedId } as AccountDoc,
        customer
      ),
    },
    { status: 201 }
  );
}

export async function PATCH(req: Request) {
  const user = await getUserSession();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if ((user as SessionRole).role !== "admin") {
    return NextResponse.json(
      { error: "Only admins have permission to update bank accounts." },
      { status: 403 }
    );
  }

  const body = (await req.json()) as Record<string, unknown>;
  const accountId =
    typeof body.accountId === "string" ? body.accountId.trim() : "";
  const action = body.action ?? (body.status ? "status" : undefined);

  if (!ObjectId.isValid(accountId)) {
    return bad("A valid bank account ID is required.");
  }

  const account = await db
    .collection<AccountDoc>("bankacc")
    .findOne({ _id: new ObjectId(accountId) });

  if (!account) {
    return bad("Bank account not found.", 404);
  }

  const customer = await getCustomer(account.userId);
  const now = new Date();
  const updatedByName = user.name || "Administrator";

  if (action === "status") {
    const status = body.status;
    const reason = typeof body.reason === "string" ? body.reason.trim() : "";

    if (!isAccountStatus(status)) {
      return bad("A valid account status is required.");
    }

    if (reason.length > 200) {
      return bad("Status reason must be 200 characters or fewer.");
    }

    if (account.status === status) {
      return NextResponse.json({
        success: true,
        message: `Bank account is already "${status.replace("_", " ")}".`,
        account: mapAccount(account, customer ?? undefined),
      });
    }

    const update: Record<string, unknown> = {
      status,
      statusReason:
        reason ||
        (status === "active"
          ? "Approved and activated by administrator"
          : status === "frozen"
          ? "Frozen by administrator"
          : status === "rejected"
          ? "Rejected by administrator"
          : `Status changed to ${status.replace("_", " ")} by administrator`),
      statusUpdatedBy: user.id,
      statusUpdatedByName: updatedByName,
      updatedAt: now,
    };

    const unset: Record<string, ""> = {};

    if (status === "frozen") {
      update.freezeReason = reason || "Frozen by administrator";
    } else if (status === "active") {
      unset.freezeReason = "";
    }

    const result = await db.collection<AccountDoc>("bankacc").updateOne(
      account.status
        ? { _id: account._id, status: account.status }
        : { _id: account._id, status: { $exists: false } },
      Object.keys(unset).length
        ? { $set: update, $unset: unset }
        : { $set: update }
    );

    if (result.modifiedCount === 0) {
      return bad(
        "This account was already updated. Refresh the list and try again.",
        409
      );
    }

    const updated = await db
      .collection<AccountDoc>("bankacc")
      .findOne({ _id: account._id });

    return NextResponse.json({
      success: true,
      message: `Account status updated to "${status.replace("_", " ")}".`,
      account: mapAccount(updated ?? account, customer ?? undefined),
    });
  }

  if (action === "details") {
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const mobile = typeof body.mobile === "string" ? body.mobile.trim() : "";
    const type = body.type;

    if (name.length < 2 || name.length > 60) {
      return bad("Account holder name must be 2 to 60 characters.");
    }

    if (!/^01[3-9]\d{8}$/.test(mobile)) {
      return bad("Enter a valid 11 digit mobile number.");
    }

    if (!isAccountType(type)) {
      return bad("Select a valid account type.");
    }

    await db.collection<AccountDoc>("bankacc").updateOne(
      { _id: account._id },
      {
        $set: {
          name,
          mobile,
          type,
          updatedAt: now,
          updatedByName,
        },
      }
    );

    const updated = await db
      .collection<AccountDoc>("bankacc")
      .findOne({ _id: account._id });

    return NextResponse.json({
      success: true,
      message: "Bank account information updated.",
      account: mapAccount(updated ?? account, customer ?? undefined),
    });
  }

  if (action === "limit") {
    const transactionLimit = Number(body.transactionLimit);

    if (
      !Number.isInteger(transactionLimit) ||
      transactionLimit < MIN_TRANSACTION_LIMIT ||
      transactionLimit > MAX_TRANSACTION_LIMIT
    ) {
      return bad(
        "Transaction limit must be a whole number between ৳1,000 and ৳10,000,000."
      );
    }

    await db.collection<AccountDoc>("bankacc").updateOne(
      { _id: account._id },
      {
        $set: {
          transactionLimit,
          updatedAt: now,
          updatedByName,
        },
      }
    );

    const updated = await db
      .collection<AccountDoc>("bankacc")
      .findOne({ _id: account._id });

    return NextResponse.json({
      success: true,
      message: `Transaction limit set to ৳${transactionLimit.toLocaleString(
        "en-BD"
      )}.`,
      account: mapAccount(updated ?? account, customer ?? undefined),
    });
  }

  return bad("Select a valid update action.");
}
