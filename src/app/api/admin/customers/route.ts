import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getUserSession } from "@/lib/core/session";
import { db } from "@/lib/db/mongodb";
import type {
  AccountStatus,
  AccountType,
  AdminCustomer,
  StaffCustomerAccount,
  UserStatus,
} from "@/lib/redux/api";

type SessionRole = { role?: string | null };

type UserDoc = {
  _id: ObjectId;
  name?: string;
  email?: string;
  role?: string;
  status?: UserStatus;
  statusReason?: string;
  statusUpdatedAt?: Date | string;
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
  // 1. Authorize: Only Admin can access this endpoint
  const user = await getUserSession();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if ((user as SessionRole).role !== "admin") {
    return NextResponse.json(
      { error: "Only admins have permission to manage customers." },
      { status: 403 }
    );
  }

  // 2. Read query parameters
  const { searchParams } = new URL(req.url);
  const limitParam = Number(searchParams.get("limit")) || 15;
  const offsetParam = Number(searchParams.get("offset")) || 0;
  const statusParam = (searchParams.get("status") || "all").toLowerCase();
  const searchParam = (searchParams.get("search") || "").trim();

  const limit = Math.max(1, Math.min(100, limitParam));
  const offset = Math.max(0, offsetParam);

  // 3. Build query for customers
  const query: Record<string, unknown> = { role: "customer" };

  if (statusParam === "active") {
    query.$or = [
      { status: "active" },
      { status: { $exists: false } },
      { status: null },
    ];
  } else if (statusParam === "inactive") {
    query.status = "inactive";
  } else if (statusParam === "blocked") {
    query.status = "blocked";
  }

  if (searchParam) {
    const escaped = escapeRegex(searchParam);
    const searchConditions = [
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

    if (query.$or) {
      // Both status condition and search condition exist
      query.$and = [{ $or: query.$or }, { $or: searchConditions }];
      delete query.$or;
    } else {
      query.$or = searchConditions;
    }
  }

  // 4. Fetch status counts across all customers
  const [
    total,
    activeCount,
    inactiveCount,
    blockedCount,
    verifiedCount,
    rows,
  ] = await Promise.all([
    db.collection("user").countDocuments(query),
    db.collection("user").countDocuments({
      role: "customer",
      $or: [
        { status: "active" },
        { status: { $exists: false } },
        { status: null },
      ],
    }),
    db.collection("user").countDocuments({
      role: "customer",
      status: "inactive",
    }),
    db.collection("user").countDocuments({
      role: "customer",
      status: "blocked",
    }),
    db.collection("customer_verifications").countDocuments(),
    db
      .collection<UserDoc>("user")
      .find(query, {
        projection: {
          name: 1,
          email: 1,
          role: 1,
          status: 1,
          statusReason: 1,
          statusUpdatedAt: 1,
          createdAt: 1,
        },
      })
      .sort({ createdAt: -1 })
      .skip(offset)
      .limit(limit)
      .toArray(),
  ]);

  const userIds = rows.map((row) => row._id.toString());

  // 5. Load bank accounts and verification for this page's customers
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

  const customers: AdminCustomer[] = rows.map((row) => {
    const id = row._id.toString();
    const accounts = accountsByUser.get(id) ?? [];
    const verification = verificationByUser.get(id);

    const rawStatus = row.status;
    const status: UserStatus =
      rawStatus === "inactive"
        ? "inactive"
        : rawStatus === "blocked"
        ? "blocked"
        : "active";

    return {
      id,
      name: row.name || "Customer",
      email: row.email || "",
      status,
      statusReason: row.statusReason,
      statusUpdatedAt: toIsoString(row.statusUpdatedAt),
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
    statusCounts: {
      all: activeCount + inactiveCount + blockedCount,
      active: activeCount,
      inactive: inactiveCount,
      blocked: blockedCount,
    },
    verifiedCount,
    limit,
    offset,
    hasMore: offset + customers.length < total,
  });
}

export async function PATCH(req: Request) {
  // 1. Authorize: Only Admin can update customer status
  const user = await getUserSession();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if ((user as SessionRole).role !== "admin") {
    return NextResponse.json(
      { error: "Only admins have permission to update customer status." },
      { status: 403 }
    );
  }

  // 2. Validate payload
  const body = (await req.json()) as Record<string, unknown>;
  const userId = typeof body.userId === "string" ? body.userId.trim() : "";
  const status = body.status;
  const reason = typeof body.reason === "string" ? body.reason.trim() : "";

  if (!ObjectId.isValid(userId)) {
    return bad("A valid customer user ID is required.");
  }

  if (status !== "active" && status !== "inactive" && status !== "blocked") {
    return bad("Invalid status. Must be 'active', 'inactive', or 'blocked'.");
  }

  // 3. Find customer
  const customer = await db.collection<UserDoc>("user").findOne({
    _id: new ObjectId(userId),
    role: "customer",
  });

  if (!customer) {
    return bad("Customer not found.", 404);
  }

  const now = new Date();
  const effectiveReason =
    reason ||
    (status === "blocked"
      ? "Blocked for suspicious account activity"
      : status === "inactive"
      ? "Account deactivated by administrator"
      : "Account activated by administrator");

  // 4. Update user status in database
  await db.collection<UserDoc>("user").updateOne(
    { _id: new ObjectId(userId) },
    {
      $set: {
        status,
        statusReason: effectiveReason,
        statusUpdatedAt: now,
      },
    }
  );

  // If customer is blocked for suspicious activity, freeze all their bank accounts to protect funds
  if (status === "blocked") {
    await db.collection("bankacc").updateMany(
      { userId, status: { $in: ["active", "pending", "under_review"] } },
      {
        $set: {
          status: "frozen",
          updatedAt: now,
          freezeReason: effectiveReason,
        },
      }
    );
  } else if (status === "active") {
    // If reactivating customer, we can unfreeze accounts that were frozen due to user blocking
    await db.collection("bankacc").updateMany(
      { userId, freezeReason: /suspicious|blocked/i },
      {
        $set: {
          status: "active",
          updatedAt: now,
        },
        $unset: {
          freezeReason: "",
        },
      }
    );
  }

  // 5. Fetch updated customer details to return
  const [updatedUser, accounts, verification] = await Promise.all([
    db.collection<UserDoc>("user").findOne({ _id: new ObjectId(userId) }),
    db
      .collection<AccountDoc>("bankacc")
      .find({ userId }, { projection: { pinHash: 0, nid: 0 } })
      .sort({ createdAt: -1 })
      .toArray(),
    db.collection<VerificationDoc>("customer_verifications").findOne({ userId }),
  ]);

  const mappedAccounts = accounts.map(mapAccount);

  const updatedCustomer: AdminCustomer = {
    id: userId,
    name: updatedUser?.name || customer.name || "Customer",
    email: updatedUser?.email || customer.email || "",
    status,
    statusReason: effectiveReason,
    statusUpdatedAt: toIsoString(now),
    createdAt: toIsoString(customer.createdAt) || now.toISOString(),
    verified: Boolean(verification),
    verifiedAt: verification ? toIsoString(verification.verifiedAt) : undefined,
    verifiedByName: verification?.verifiedByName,
    accountCount: mappedAccounts.length,
    totalBalance: mappedAccounts.reduce((sum, a) => sum + a.balance, 0),
    accounts: mappedAccounts,
  };

  const actionLabel =
    status === "blocked"
      ? "blocked for suspicious activity"
      : status === "active"
      ? "activated"
      : "deactivated";

  return NextResponse.json({
    success: true,
    message: `Customer "${updatedCustomer.name}" has been ${actionLabel} successfully.`,
    customer: updatedCustomer,
  });
}
