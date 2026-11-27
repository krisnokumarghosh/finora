import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { ObjectId } from "mongodb";
import { getUserSession } from "@/lib/core/session";
import { isStaffOrAdmin } from "@/lib/core/authz";
import { db } from "@/lib/db/mongodb";
import type {
  LoanInternalNote,
  LoanStatus,
  LoanType,
  StaffLoan,
} from "@/lib/redux/api";

const LOAN_TYPES: LoanType[] = [
  "home",
  "car",
  "education",
  "personal",
  "business",
];

const LOAN_STATUSES: LoanStatus[] = [
  "pending",
  "under_review",
  "approved",
  "rejected",
];

const isLoanType = (value: unknown): value is LoanType =>
  typeof value === "string" && LOAN_TYPES.includes(value as LoanType);

const isLoanStatus = (value: unknown): value is LoanStatus =>
  typeof value === "string" && LOAN_STATUSES.includes(value as LoanStatus);

const escapeRegex = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

type LoanNoteDoc = {
  id?: string;
  note?: string;
  addedBy?: string;
  addedByName?: string;
  createdAt?: Date | string;
};

type LoanDoc = {
  _id: ObjectId;
  loanId?: string;
  userId?: string;
  userName?: string;
  accountId?: string;
  accountNumber?: string;
  accountType?: string;
  title?: string;
  type?: LoanType;
  amount?: number;
  termMonths?: number;
  purpose?: string;
  status?: LoanStatus;
  dueDate?: Date | string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
  forwardedAt?: Date | string;
  forwardedByName?: string;
  internalNotes?: LoanNoteDoc[];
};

type AccountDoc = {
  _id: ObjectId;
  name?: string;
  mobile?: string;
  accountNumber?: string;
  type?: string;
  status?: string;
  balance?: number;
};

type UserDoc = {
  _id: ObjectId;
  name?: string;
  email?: string;
};

type SessionRole = { role?: string | null };

const toIsoString = (value: unknown) => {
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "string") {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) return parsed.toISOString();
  }
  return "";
};

const formatDueDate = (value: unknown) => {
  if (typeof value === "string" && value.trim()) return value;
  if (value instanceof Date) return value.toISOString().split("T")[0];
  return "—";
};

let loanIndexPromise: Promise<unknown> | null = null;

const ensureLoanIndexes = () => {
  if (!loanIndexPromise) {
    loanIndexPromise = Promise.all([
      db.collection("loans").createIndex({ accountNumber: 1 }),
      db.collection("loans").createIndex({ status: 1, createdAt: -1 }),
    ]);
  }
  return loanIndexPromise;
};

const mapNote = (note: LoanNoteDoc): LoanInternalNote => ({
  id: note.id || "",
  note: note.note || "",
  addedBy: note.addedBy || "",
  addedByName: note.addedByName || "Bank Staff",
  createdAt: toIsoString(note.createdAt),
});

const mapLoans = async (rows: LoanDoc[]): Promise<StaffLoan[]> => {
  if (rows.length === 0) return [];

  const accountIds = [
    ...new Set(
      rows
        .map((row) => row.accountId)
        .filter(
          (value): value is string =>
            typeof value === "string" && ObjectId.isValid(value)
        )
    ),
  ].map((value) => new ObjectId(value));

  const accountNumbers = [
    ...new Set(
      rows
        .map((row) => row.accountNumber)
        .filter(
          (value): value is string =>
            typeof value === "string" && value.length > 0
        )
    ),
  ];

  const accountFilters: Record<string, unknown>[] = [];
  if (accountIds.length) accountFilters.push({ _id: { $in: accountIds } });
  if (accountNumbers.length) {
    accountFilters.push({ accountNumber: { $in: accountNumbers } });
  }

  const userIds = [
    ...new Set(
      rows
        .map((row) => row.userId)
        .filter(
          (value): value is string =>
            typeof value === "string" && value.length > 0
        )
    ),
  ];
  const userObjectIds = userIds
    .filter((value) => ObjectId.isValid(value))
    .map((value) => new ObjectId(value));

  const [accountRows, userRows] = await Promise.all([
    accountFilters.length
      ? db
          .collection<AccountDoc>("bankacc")
          .find(
            { $or: accountFilters },
            { projection: { pinHash: 0, nid: 0 } }
          )
          .toArray()
      : Promise.resolve([]),
    userObjectIds.length
      ? db
          .collection<UserDoc>("user")
          .find(
            { _id: { $in: userObjectIds } },
            { projection: { name: 1, email: 1 } }
          )
          .toArray()
      : Promise.resolve([]),
  ]);

  const accountById = new Map(
    accountRows.map((account) => [account._id.toString(), account])
  );
  const accountByNumber = new Map(
    accountRows
      .filter((account) => account.accountNumber)
      .map((account) => [account.accountNumber as string, account])
  );
  const userById = new Map(
    userRows.map((userDoc) => [userDoc._id.toString(), userDoc])
  );

  return rows.map((doc) => {
    const account =
      accountByNumber.get(doc.accountNumber || "") ||
      (doc.accountId ? accountById.get(doc.accountId) : undefined);
    const userDoc = doc.userId ? userById.get(doc.userId) : undefined;

    const type = isLoanType(doc.type) ? doc.type : "personal";
    const customerName =
      userDoc?.name || doc.userName || account?.name || "Customer";

    return {
      id: doc._id.toString(),
      loanId: doc.loanId || doc._id.toString().slice(-8).toUpperCase(),
      userId: doc.userId,
      userName: customerName,
      accountId: doc.accountId,
      accountNumber: doc.accountNumber || account?.accountNumber,
      accountType: account?.type || doc.accountType,
      accountStatus: account?.status,
      balance: typeof account?.balance === "number" ? account.balance : undefined,
      title: doc.title || `${type.charAt(0).toUpperCase()}${type.slice(1)} Loan`,
      type,
      amount: Number(doc.amount) || 0,
      termMonths: Number(doc.termMonths) || 0,
      purpose: doc.purpose || "Loan Application",
      status: isLoanStatus(doc.status) ? doc.status : "pending",
      dueDate: formatDueDate(doc.dueDate),
      createdAt: toIsoString(doc.createdAt) || new Date().toISOString(),
      updatedAt: toIsoString(doc.updatedAt) || undefined,
      forwardedAt: toIsoString(doc.forwardedAt) || undefined,
      forwardedByName: doc.forwardedByName,
      internalNotes: Array.isArray(doc.internalNotes)
        ? doc.internalNotes.map(mapNote)
        : [],
      customer: {
        name: customerName,
        email: userDoc?.email,
        mobile: account?.mobile,
      },
    };
  });
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
      { error: "You do not have permission to view loan applications." },
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

  const query: Record<string, unknown> = {};

  if (typeParam !== "all" && isLoanType(typeParam)) {
    query.type = typeParam;
  }

  if (statusParam !== "all" && isLoanStatus(statusParam)) {
    query.status = statusParam;
  }

  if (searchParam) {
    const cleanSearch = searchParam.replace(/\s+/g, "");
    query.accountNumber = new RegExp(escapeRegex(cleanSearch), "i");
  }

  await ensureLoanIndexes().catch((error: unknown) => {
    console.error("Failed to create loan indexes:", error);
  });

  const [total, rows] = await Promise.all([
    db.collection("loans").countDocuments(query),
    db
      .collection<LoanDoc>("loans")
      .find(query)
      .sort({ createdAt: -1 })
      .skip(offset)
      .limit(limit)
      .toArray(),
  ]);

  const loans = await mapLoans(rows);

  return NextResponse.json({
    loans,
    total,
    limit,
    offset,
    hasMore: offset + loans.length < total,
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
      { error: "You do not have permission to update loan applications." },
      { status: 403 }
    );
  }

  const body = (await req.json()) as Record<string, unknown>;
  const loanId = typeof body.loanId === "string" ? body.loanId.trim() : "";
  const action = body.action;
  const rawNote = typeof body.note === "string" ? body.note.trim() : "";

  if (!loanId) {
    return NextResponse.json(
      { error: "Loan ID is required." },
      { status: 400 }
    );
  }

  if (action !== "note" && action !== "forward") {
    return NextResponse.json(
      { error: "Action must be either 'note' or 'forward'." },
      { status: 400 }
    );
  }

  const filter: Record<string, unknown> = ObjectId.isValid(loanId)
    ? { $or: [{ _id: new ObjectId(loanId) }, { loanId }] }
    : { loanId };

  const existing = await db
    .collection<LoanDoc>("loans")
    .findOne(filter);

  if (!existing) {
    return NextResponse.json({ error: "Loan not found." }, { status: 404 });
  }

  const loanFilter = { _id: existing._id };
  const now = new Date();
  const authorName = user.name || "Bank Staff";

  if (action === "note") {
    if (rawNote.length < 3) {
      return NextResponse.json(
        { error: "Please write a note of at least 3 characters." },
        { status: 400 }
      );
    }

    const noteDoc: LoanNoteDoc = {
      id: randomUUID(),
      note: rawNote.slice(0, 500),
      addedBy: user.id,
      addedByName: authorName,
      createdAt: now,
    };

    await db.collection<LoanDoc>("loans").updateOne(loanFilter, {
      $push: { internalNotes: noteDoc },
      $set: { updatedAt: now },
    });

    const updated = await db
      .collection<LoanDoc>("loans")
      .findOne(loanFilter);
    const [loan] = await mapLoans(updated ? [updated] : []);

    return NextResponse.json({
      success: true,
      message: "Internal note added.",
      loan,
    });
  }

  const currentStatus = isLoanStatus(existing.status)
    ? existing.status
    : "pending";

  if (currentStatus === "under_review") {
    return NextResponse.json(
      { error: "This application has already been forwarded for approval." },
      { status: 400 }
    );
  }

  if (currentStatus !== "pending") {
    return NextResponse.json(
      {
        error: `Only pending applications can be forwarded. This loan is already ${currentStatus}.`,
      },
      { status: 400 }
    );
  }

  const forwardNote: LoanNoteDoc = {
    id: randomUUID(),
    note: `Forwarded to admin for approval by ${authorName}.`,
    addedBy: user.id,
    addedByName: authorName,
    createdAt: now,
  };

  const result = await db.collection<LoanDoc>("loans").updateOne(
    { _id: existing._id, status: "pending" },
    {
      $set: {
        status: "under_review",
        forwardedAt: now,
        forwardedByName: authorName,
        updatedAt: now,
      },
      $push: { internalNotes: forwardNote },
    }
  );

  if (result.modifiedCount === 0) {
    return NextResponse.json(
      { error: "This application has already been forwarded for approval." },
      { status: 409 }
    );
  }

  const updated = await db.collection<LoanDoc>("loans").findOne(loanFilter);
  const [loan] = await mapLoans(updated ? [updated] : []);

  return NextResponse.json({
    success: true,
    message: "Application forwarded to admin for approval.",
    loan,
  });
}
