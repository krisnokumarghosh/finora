import { NextResponse } from "next/server";
import { randomInt } from "crypto";
import { ObjectId } from "mongodb";
import { getUserSession } from "@/lib/core/session";
import { isStaffOrAdmin } from "@/lib/core/authz";
import { hashPin } from "@/lib/core/pin";
import { db } from "@/lib/db/mongodb";
import type {
  AccountStatus,
  AccountType,
  StaffAccountStatusCounts,
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

const ACCOUNT_TYPES: AccountType[] = ["savings", "current", "business"];
const ACCOUNT_STATUSES: AccountStatus[] = [
  "pending",
  "under_review",
  "active",
  "frozen",
  "rejected",
];

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
  createdAt: toIsoString(doc.createdAt),
  createdByName: doc.createdByName,
});

// A random 12 digit account number, checked against the database so two
// customers can never receive the same account number.
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

export async function GET(req: Request) {
  // 1. Authenticate and authorize: only Bank Staff / Admin can manage accounts.
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
      { error: "You do not have permission to view bank accounts." },
      { status: 403 }
    );
  }

  // 2. Read and validate the query parameters.
  const { searchParams } = new URL(req.url);
  const limitParam = Number(searchParams.get("limit")) || 15;
  const offsetParam = Number(searchParams.get("offset")) || 0;
  const typeParam = searchParams.get("type") || "all";
  const statusParam = searchParams.get("status") || "all";
  const searchParam = (searchParams.get("search") || "").trim();

  const limit = Math.max(1, Math.min(100, limitParam));
  const offset = Math.max(0, offsetParam);

  await ensureIndexes().catch((error: unknown) => {
    console.error("Failed to create bank account indexes:", error);
  });

  // 3. Build the filters. Search matches either the account number or user ID.
  const query: Record<string, unknown> = {};

  if (typeParam !== "all" && isAccountType(typeParam)) {
    query.type = typeParam;
  }

  if (statusParam !== "all" && isAccountStatus(statusParam)) {
    query.status = statusParam;
  }

  if (searchParam) {
    const cleanSearch = searchParam.replace(/\s+/g, "");
    const searchRegex = new RegExp(escapeRegex(cleanSearch), "i");
    query.$or = [
      { accountNumber: searchRegex },
      { userId: searchRegex },
    ];
  }

  // 4. Fetch the page, total, and overall status counts.
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
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ])
      .toArray(),
  ]);

  // 5. Load the customer names/emails for the accounts on this page.
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

  const statusCounts: StaffAccountStatusCounts = {
    pending: 0,
    under_review: 0,
    active: 0,
    frozen: 0,
    rejected: 0,
  };

  for (const row of statusRows) {
    if (isAccountStatus(row._id)) {
      statusCounts[row._id] = row.count;
    }
  }

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
  // 1. Authenticate and authorize.
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
      { error: "You do not have permission to create bank accounts." },
      { status: 403 }
    );
  }

  // 2. Validate the request body.
  const body = (await req.json()) as Record<string, unknown>;
  const userId = typeof body.userId === "string" ? body.userId.trim() : "";
  const type = body.type;
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const mobile = typeof body.mobile === "string" ? body.mobile.trim() : "";
  const nid = typeof body.nid === "string" ? body.nid.trim() : "";
  const pin = typeof body.pin === "string" ? body.pin : "";

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

  // 3. The account must belong to an existing customer.
  const customer = await db.collection<UserDoc>("user").findOne({
    _id: new ObjectId(userId),
    role: "customer",
  });

  if (!customer) {
    return bad("Customer not found.", 404);
  }

  // 4. Reuse the same banking limits as customer self-service account creation.
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
    return bad("Could not generate a unique account number. Please try again.", 500);
  }

  // 5. New staff-created accounts start as pending and are reviewed afterwards.
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
    status: "pending" as const,
    transactionLimit: 100000,
    createdAt: now,
    updatedAt: now,
    createdBy: user.id,
    createdByName: user.name || "Bank Staff",
  };

  const result = await db.collection("bankacc").insertOne(doc);

  return NextResponse.json(
    {
      success: true,
      message: "Customer bank account created successfully.",
      account: mapAccount(
        { ...doc, _id: result.insertedId } as AccountDoc,
        customer
      ),
    },
    { status: 201 }
  );
}

export async function PATCH(req: Request) {
  // 1. Authenticate and authorize.
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
      { error: "You do not have permission to update bank accounts." },
      { status: 403 }
    );
  }

  // 2. Validate the request body.
  const body = (await req.json()) as Record<string, unknown>;
  const accountId =
    typeof body.accountId === "string" ? body.accountId.trim() : "";
  const status = body.status;

  if (!ObjectId.isValid(accountId)) {
    return bad("A valid bank account ID is required.");
  }

  if (status !== "under_review" && status !== "pending") {
    return bad("Staff can only move an account to under review or back to pending.");
  }

  // 3. Find the account.
  const existing = await db
    .collection<AccountDoc>("bankacc")
    .findOne({ _id: new ObjectId(accountId) });

  if (!existing) {
    return bad("Bank account not found.", 404);
  }

  const customer = existing.userId
    ? await db.collection<UserDoc>("user").findOne({
        _id: ObjectId.isValid(existing.userId)
          ? new ObjectId(existing.userId)
          : undefined,
      })
    : null;

  // 4a. Move pending account to under review
  if (status === "under_review") {
    if (existing.status === "under_review") {
      return NextResponse.json({
        success: true,
        message: "Bank account is already under review.",
        account: mapAccount(existing, customer ?? undefined),
      });
    }

    if (existing.status !== "pending") {
      return bad(
        `Only pending accounts can be moved to under review. This account is currently "${existing.status}".`
      );
    }

    const now = new Date();
    const result = await db.collection<AccountDoc>("bankacc").updateOne(
      { _id: existing._id, status: "pending" },
      {
        $set: {
          status: "under_review",
          reviewedBy: user.id,
          reviewedByName: user.name || "Bank Staff",
          updatedAt: now,
        },
      }
    );

    if (result.modifiedCount === 0) {
      return bad(
        "This account was already updated. Refresh the list and try again.",
        409
      );
    }

    const updated = await db
      .collection<AccountDoc>("bankacc")
      .findOne({ _id: existing._id });

    return NextResponse.json({
      success: true,
      message: "Bank account moved to under review.",
      account: mapAccount(updated ?? existing, customer ?? undefined),
    });
  }

  // 4b. Remove account from under review (revert to pending)
  if (status === "pending") {
    if (existing.status === "pending") {
      return NextResponse.json({
        success: true,
        message: "Bank account is already pending review.",
        account: mapAccount(existing, customer ?? undefined),
      });
    }

    if (existing.status !== "under_review") {
      return bad(
        `Only accounts under review can be removed from review. This account is currently "${existing.status}".`
      );
    }

    const now = new Date();
    const result = await db.collection<AccountDoc>("bankacc").updateOne(
      { _id: existing._id, status: "under_review" },
      {
        $set: {
          status: "pending",
          updatedAt: now,
        },
        $unset: {
          reviewedBy: "",
          reviewedByName: "",
        },
      }
    );

    if (result.modifiedCount === 0) {
      return bad(
        "This account was already updated. Refresh the list and try again.",
        409
      );
    }

    const updated = await db
      .collection<AccountDoc>("bankacc")
      .findOne({ _id: existing._id });

    return NextResponse.json({
      success: true,
      message: "Bank account removed from under review.",
      account: mapAccount(updated ?? existing, customer ?? undefined),
    });
  }
}
