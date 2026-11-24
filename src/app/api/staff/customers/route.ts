import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { auth } from "@/lib/auth";
import { getUserSession } from "@/lib/core/session";
import { isStaffOrAdmin } from "@/lib/core/authz";
import { db } from "@/lib/db/mongodb";
import type {
  AccountStatus,
  AccountType,
  StaffCustomer,
  StaffCustomerAccount,
} from "@/lib/redux/api";

type SessionRole = { role?: string | null };

type UserDoc = {
  _id: ObjectId;
  name?: string;
  email?: string;
  role?: string;
  createdAt?: Date | string;
};

type AccountDoc = {
  _id: ObjectId;
  userId?: string;
  accountNumber?: string;
  type?: AccountType;
  balance?: number;
  status?: AccountStatus;
  transactionLimit?: number;
  createdAt?: Date | string;
};

type VerificationDoc = {
  userId?: string;
  verifiedAt?: Date | string;
  verifiedByName?: string;
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

// Create the indexes used by the customer list and verification workflow.
const ensureIndexes = () => {
  if (!indexPromise) {
    indexPromise = Promise.all([
      db.collection("user").createIndex({ role: 1, createdAt: -1 }),
      db.collection("bankacc").createIndex({ userId: 1 }),
      db
        .collection("customer_verifications")
        .createIndex({ userId: 1 }, { unique: true }),
    ]);
  }
  return indexPromise;
};

const mapAccount = (doc: AccountDoc): StaffCustomerAccount => ({
  id: doc._id.toString(),
  accountNumber: doc.accountNumber || "",
  type: isAccountType(doc.type) ? doc.type : "savings",
  balance: Number(doc.balance) || 0,
  status: isAccountStatus(doc.status) ? doc.status : "pending",
  transactionLimit:
    typeof doc.transactionLimit === "number"
      ? doc.transactionLimit
      : undefined,
  createdAt: toIsoString(doc.createdAt),
});

export async function GET(req: Request) {
  // 1. Authenticate and authorize: only Bank Staff / Admin can manage customers.
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
      { error: "You do not have permission to view customers." },
      { status: 403 }
    );
  }

  // 2. Read and validate the query parameters.
  const { searchParams } = new URL(req.url);
  const limitParam = Number(searchParams.get("limit")) || 15;
  const offsetParam = Number(searchParams.get("offset")) || 0;
  const searchParam = (searchParams.get("search") || "").trim();

  const limit = Math.max(1, Math.min(100, limitParam));
  const offset = Math.max(0, offsetParam);

  await ensureIndexes().catch((error: unknown) => {
    console.error("Failed to create customer operation indexes:", error);
  });

  // 3. Customers are Better Auth users with the "customer" role.
  // The search allows finding customers by name, email, or user ID.
  const query: Record<string, unknown> = { role: "customer" };

  if (searchParam) {
    const escaped = escapeRegex(searchParam);
    query.$or = [
      { name: { $regex: escaped, $options: "i" } },
      { email: { $regex: escaped, $options: "i" } },
      {
        $expr: {
          $regexMatch: {
            input: { $toString: "$_id" },
            regex: escaped,
            options: "i",
          },
        },
      },
    ];
  }

  const [total, verifiedCount, rows] = await Promise.all([
    db.collection("user").countDocuments(query),
    db.collection("customer_verifications").countDocuments(),
    db
      .collection<UserDoc>("user")
      .find(query, {
        projection: { name: 1, email: 1, role: 1, createdAt: 1 },
      })
      .sort({ createdAt: -1 })
      .skip(offset)
      .limit(limit)
      .toArray(),
  ]);

  const userIds = rows.map((row) => row._id.toString());

  const [accountRows, verificationRows] = await Promise.all([
    userIds.length
      ? db
          .collection<AccountDoc>("bankacc")
          .find(
            { userId: { $in: userIds } },
            { projection: { pinHash: 0, nid: 0 } }
          )
          .sort({ createdAt: -1 })
          .toArray()
      : Promise.resolve([]),
    userIds.length
      ? db
          .collection<VerificationDoc>("customer_verifications")
          .find({ userId: { $in: userIds } })
          .toArray()
      : Promise.resolve([]),
  ]);

  const accountsByUser = new Map<string, StaffCustomerAccount[]>();
  for (const account of accountRows) {
    if (!account.userId) continue;
    const list = accountsByUser.get(account.userId) ?? [];
    list.push(mapAccount(account));
    accountsByUser.set(account.userId, list);
  }

  const verificationByUser = new Map(
    verificationRows
      .filter((row) => row.userId)
      .map((row) => [row.userId as string, row])
  );

  const customers: StaffCustomer[] = rows.map((row) => {
    const id = row._id.toString();
    const accounts = accountsByUser.get(id) ?? [];
    const verification = verificationByUser.get(id);

    return {
      id,
      name: row.name || "Customer",
      email: row.email || "",
      createdAt: toIsoString(row.createdAt) || new Date().toISOString(),
      verified: Boolean(verification),
      verifiedAt: verification ? toIsoString(verification.verifiedAt) : undefined,
      verifiedByName: verification?.verifiedByName,
      accountCount: accounts.length,
      totalBalance: accounts.reduce(
        (sum, account) => sum + account.balance,
        0
      ),
      accounts,
    };
  });

  return NextResponse.json({
    customers,
    total,
    verifiedCount,
    limit,
    offset,
    hasMore: offset + customers.length < total,
  });
}

export async function POST(req: Request) {
  // 1. Authenticate and authorize: only Bank Staff / Admin can register customers.
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
      { error: "You do not have permission to register customers." },
      { status: 403 }
    );
  }

  // 2. Validate the customer details.
  const body = (await req.json()) as Record<string, unknown>;
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const email =
    typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";

  if (name.length < 2 || name.length > 60) {
    return bad("Customer name must be 2 to 60 characters.");
  }

  if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(email)) {
    return bad("Enter a valid email address.");
  }

  if (password.length < 8) {
    return bad("Temporary password must be at least 8 characters.");
  }

  if (!/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
    return bad(
      "Temporary password must contain at least one uppercase letter and one number."
    );
  }

  // 3. Give a clear message if the email is already registered.
  const existing = await db.collection("user").findOne({
    email: new RegExp(`^${escapeRegex(email)}$`, "i"),
  });

  if (existing) {
    return bad("A user with this email already exists.", 409);
  }

  // 4. Let Better Auth create the account so the password is hashed correctly.
  // New sign-ups receive the default "customer" role.
  try {
    const created = await auth.api.signUpEmail({
      body: { name, email, password },
    });

    if (!created?.user) {
      return bad("Could not register the customer. Please try again.", 500);
    }

    // Keep the customer role explicit even if the auth defaults change later.
    if (ObjectId.isValid(created.user.id)) {
      await db
        .collection("user")
        .updateOne(
          { _id: new ObjectId(created.user.id) },
          { $set: { role: "customer" } }
        );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Customer registered successfully.",
        customer: {
          id: created.user.id,
          name: created.user.name || name,
          email: created.user.email || email,
          createdAt: toIsoString(created.user.createdAt) || new Date().toISOString(),
          verified: false,
          accountCount: 0,
          totalBalance: 0,
          accounts: [],
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Failed to register customer:", error);
    const message =
      error instanceof Error ? error.message : "Failed to register customer.";

    if (/exist/i.test(message)) {
      return bad("A user with this email already exists.", 409);
    }

    return bad("Could not register the customer. Please try again.", 500);
  }
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
      { error: "You do not have permission to verify customers." },
      { status: 403 }
    );
  }

  // 2. Validate the request body.
  const body = (await req.json()) as Record<string, unknown>;
  const userId = typeof body.userId === "string" ? body.userId.trim() : "";
  const action = body.action;

  if (!ObjectId.isValid(userId)) {
    return bad("A valid customer user ID is required.");
  }

  if (action !== "verify" && action !== "unverify") {
    return bad("Action must be either 'verify' or 'unverify'.");
  }

  // 3. Make sure the target user is a customer, not staff or admin.
  const customer = await db.collection("user").findOne({
    _id: new ObjectId(userId),
    role: "customer",
  });

  if (!customer) {
    return bad("Customer not found.", 404);
  }

  const now = new Date();
  const verifierName = user.name || "Bank Staff";

  // 4. Store verification separately from Better Auth data.
  if (action === "verify") {
    await ensureIndexes().catch((error: unknown) => {
      console.error("Failed to create verification index:", error);
    });

    await db.collection("customer_verifications").updateOne(
      { userId },
      {
        $set: {
          userId,
          verifiedBy: user.id,
          verifiedByName: verifierName,
          verifiedAt: now,
          updatedAt: now,
        },
      },
      { upsert: true }
    );

    return NextResponse.json({
      success: true,
      message: "Customer information verified successfully.",
      verified: true,
      verifiedAt: now.toISOString(),
      verifiedByName: verifierName,
    });
  }

  await db.collection("customer_verifications").deleteOne({ userId });

  return NextResponse.json({
    success: true,
    message: "Customer verification removed.",
    verified: false,
  });
}
