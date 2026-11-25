import { NextResponse } from "next/server";
import { randomInt, randomUUID } from "crypto";
import { ObjectId } from "mongodb";
import { getUserSession } from "@/lib/core/session";
import { client, db } from "@/lib/db/mongodb";
import {
  LOAN_PAYMENT_HISTORY_COLLECTION,
  addOneMonth,
  calculateMonthlyInstallment,
  processDueLoanRepayments,
  roundMoney,
} from "@/lib/server/loanRepayments";
import type {
  AdminLoan,
  LoanInternalNote,
  LoanRepayment,
  LoanStatus,
  LoanType,
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

// Escape user input before using it inside a MongoDB regex.
const escapeRegex = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

type LoanNoteDoc = {
  id?: string;
  note?: string;
  addedBy?: string;
  addedByName?: string;
  createdAt?: Date | string;
};

type LoanRepaymentDoc = {
  _id?: ObjectId;
  id?: string;
  loanId?: string;
  installmentNumber?: number;
  amount?: number;
  paidAt?: Date | string;
  createdAt?: Date | string;
  status?: string;
  method?: string;
  reference?: string;
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
  approvedAt?: Date | string;
  approvedByName?: string;
  rejectedAt?: Date | string;
  rejectedByName?: string;
  rejectionReason?: string;
  monthlyAmount?: number;
  paidInstallments?: number;
  totalRepaid?: number;
  remainingBalance?: number;
  nextPaymentDate?: Date | string;
  repaymentStatus?: string;
  disbursedAt?: Date | string;
  internalNotes?: LoanNoteDoc[];
  repayments?: LoanRepaymentDoc[];
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

// Create search/filter indexes once per server process.
const ensureLoanIndexes = () => {
  if (!loanIndexPromise) {
    loanIndexPromise = Promise.all([
      db.collection("loans").createIndex({ accountNumber: 1 }),
      db.collection("loans").createIndex({ status: 1, createdAt: -1 }),
    ]);
  }
  return loanIndexPromise;
};

const requireAdmin = async () => {
  const user = await getUserSession();
  if (!user) {
    return { error: "Unauthorized", status: 401 as const, user: null };
  }

  if ((user as SessionRole).role !== "admin") {
    return {
      error: "Only admins can manage loan applications.",
      status: 403 as const,
      user: null,
    };
  }

  return { error: null, status: 200 as const, user };
};

const mapNote = (note: LoanNoteDoc): LoanInternalNote => ({
  id: note.id || "",
  note: note.note || "",
  addedBy: note.addedBy || "",
  addedByName: note.addedByName || "Bank Staff",
  createdAt: toIsoString(note.createdAt),
});

const mapRepayment = (
  item: LoanRepaymentDoc,
  index: number
): LoanRepayment => {
  const status =
    item.status === "pending" || item.status === "late" ? item.status : "paid";
  return {
    id: item.id || item._id?.toString() || `repayment-${index + 1}`,
    installmentNumber:
      typeof item.installmentNumber === "number"
        ? item.installmentNumber
        : index + 1,
    amount: Number(item.amount) || 0,
    paidAt:
      toIsoString(item.paidAt) ||
      toIsoString(item.createdAt) ||
      new Date().toISOString(),
    status,
    method: item.method || "Account Debit",
    reference: item.reference,
  };
};

// Load customer, account, and repayment details for a set of loans, then map
// each loan document into the shape used by the admin UI.
const mapAdminLoans = async (rows: LoanDoc[]): Promise<AdminLoan[]> => {
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

  const loanLookupKeys = [
    ...new Set(
      rows.flatMap((row) =>
        [row._id.toString(), row.loanId].filter(
          (value): value is string =>
            typeof value === "string" && value.length > 0
        )
      )
    ),
  ];

  const [accountRows, userRows, repaymentRows] = await Promise.all([
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
    loanLookupKeys.length
      ? db
          .collection<LoanRepaymentDoc>(LOAN_PAYMENT_HISTORY_COLLECTION)
          .find({ loanId: { $in: loanLookupKeys } })
          .sort({ paidAt: -1, createdAt: -1 })
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

  const repaymentsByLoanKey = new Map<string, LoanRepaymentDoc[]>();
  for (const repayment of repaymentRows) {
    if (!repayment.loanId) continue;
    const list = repaymentsByLoanKey.get(repayment.loanId) || [];
    list.push(repayment);
    repaymentsByLoanKey.set(repayment.loanId, list);
  }

  return rows.map((doc) => {
    const account =
      accountByNumber.get(doc.accountNumber || "") ||
      (doc.accountId ? accountById.get(doc.accountId) : undefined);
    const userDoc = doc.userId ? userById.get(doc.userId) : undefined;

    const type = isLoanType(doc.type) ? doc.type : "personal";
    const customerName =
      userDoc?.name || doc.userName || account?.name || "Customer";
    const amount = Number(doc.amount) || 0;

    const embeddedRepayments = Array.isArray(doc.repayments)
      ? doc.repayments
      : [];
    const collectionRepayments = [
      ...(repaymentsByLoanKey.get(doc._id.toString()) || []),
      ...(doc.loanId ? repaymentsByLoanKey.get(doc.loanId) || [] : []),
    ];
    const combinedRepayments = (
      embeddedRepayments.length > 0 ? embeddedRepayments : collectionRepayments
    ).map(mapRepayment);

    const totalRepaid = combinedRepayments
      .filter((item) => item.status === "paid")
      .reduce((sum, item) => sum + item.amount, 0);
    const remainingBalance = Math.max(
      0,
      Math.round((amount - totalRepaid) * 100) / 100
    );

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
      amount,
      termMonths: Number(doc.termMonths) || 0,
      purpose: doc.purpose || "Loan Application",
      status: isLoanStatus(doc.status) ? doc.status : "pending",
      dueDate: formatDueDate(doc.dueDate),
      createdAt: toIsoString(doc.createdAt) || new Date().toISOString(),
      updatedAt: toIsoString(doc.updatedAt) || undefined,
      forwardedAt: toIsoString(doc.forwardedAt) || undefined,
      forwardedByName: doc.forwardedByName,
      approvedAt: toIsoString(doc.approvedAt) || undefined,
      approvedByName: doc.approvedByName,
      rejectedAt: toIsoString(doc.rejectedAt) || undefined,
      rejectedByName: doc.rejectedByName,
      rejectionReason: doc.rejectionReason,
      internalNotes: Array.isArray(doc.internalNotes)
        ? doc.internalNotes.map(mapNote)
        : [],
      repayments: combinedRepayments,
      monthlyAmount:
        typeof doc.monthlyAmount === "number"
          ? doc.monthlyAmount
          : calculateMonthlyInstallment(amount, Number(doc.termMonths) || 12),
      paidInstallments:
        typeof doc.paidInstallments === "number"
          ? doc.paidInstallments
          : combinedRepayments.filter((item) => item.status === "paid").length,
      nextPaymentDate: toIsoString(doc.nextPaymentDate) || undefined,
      repaymentStatus: doc.repaymentStatus,
      totalRepaid: Math.round(totalRepaid * 100) / 100,
      remainingBalance,
      customer: {
        name: customerName,
        email: userDoc?.email,
        mobile: account?.mobile,
      },
    };
  });
};

export async function GET(req: Request) {
  const { error, status } = await requireAdmin();
  if (error) {
    return NextResponse.json({ error }, { status });
  }

  const { searchParams } = new URL(req.url);
  const limitParam = Number(searchParams.get("limit")) || 15;
  const offsetParam = Number(searchParams.get("offset")) || 0;
  const typeParam = searchParams.get("type") || "all";
  const statusParam = searchParams.get("status") || "under_review";
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

  // Search is limited to the bank account number, matching the staff loan page.
  if (searchParam) {
    const cleanSearch = searchParam.replace(/\s+/g, "");
    query.accountNumber = new RegExp(escapeRegex(cleanSearch), "i");
  }

  await ensureLoanIndexes().catch((err: unknown) => {
    console.error("Failed to create admin loan indexes:", err);
  });

  await processDueLoanRepayments().catch((err: unknown) => {
    console.error("Failed to process due loan repayments:", err);
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

  const loans = await mapAdminLoans(rows);

  return NextResponse.json({
    loans,
    total,
    limit,
    offset,
    hasMore: offset + loans.length < total,
  });
}

export async function PATCH(req: Request) {
  const { error, status, user } = await requireAdmin();
  if (error || !user) {
    return NextResponse.json({ error }, { status });
  }

  const body = (await req.json()) as Record<string, unknown>;
  const loanId = typeof body.loanId === "string" ? body.loanId.trim() : "";
  const action = body.action;
  const rawNote = typeof body.note === "string" ? body.note.trim() : "";
  const rawReason = typeof body.reason === "string" ? body.reason.trim() : "";

  if (!loanId) {
    return NextResponse.json(
      { error: "Loan ID is required." },
      { status: 400 }
    );
  }

  if (action !== "note" && action !== "approve" && action !== "reject") {
    return NextResponse.json(
      { error: "Action must be 'note', 'approve', or 'reject'." },
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
  const adminName = user.name || "Admin";

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
      addedByName: adminName,
      createdAt: now,
    };

    await db.collection<LoanDoc>("loans").updateOne(loanFilter, {
      $push: { internalNotes: noteDoc },
      $set: { updatedAt: now },
    });

    const updated = await db
      .collection<LoanDoc>("loans")
      .findOne(loanFilter);
    const [loan] = await mapAdminLoans(updated ? [updated] : []);

    return NextResponse.json({
      success: true,
      message: "Internal note added.",
      loan,
    });
  }

  const currentStatus = isLoanStatus(existing.status)
    ? existing.status
    : "pending";

  if (currentStatus === "approved" || currentStatus === "rejected") {
    return NextResponse.json(
      { error: `This loan application has already been ${currentStatus}.` },
      { status: 400 }
    );
  }

  if (action === "approve") {
    const disbursedAmount = roundMoney(Number(existing.amount) || 0);
    if (disbursedAmount <= 0) {
      return NextResponse.json(
        { error: "Invalid loan amount for disbursement." },
        { status: 400 }
      );
    }

    const accountQuery =
      existing.accountId && ObjectId.isValid(existing.accountId)
        ? { _id: new ObjectId(existing.accountId) }
        : existing.accountNumber
        ? { accountNumber: existing.accountNumber }
        : null;

    if (!accountQuery) {
      return NextResponse.json(
        { error: "No linked bank account found for this loan." },
        { status: 400 }
      );
    }

    const targetAccount = await db
      .collection<AccountDoc>("bankacc")
      .findOne(accountQuery, { projection: { pinHash: 0, nid: 0 } });

    if (!targetAccount) {
      return NextResponse.json(
        { error: "The linked bank account could not be found." },
        { status: 404 }
      );
    }

    if (targetAccount.status !== "active") {
      return NextResponse.json(
        {
          error: `Cannot disburse loan because the linked bank account is currently "${targetAccount.status}".`,
        },
        { status: 400 }
      );
    }

    const termMonths = Math.max(
      1,
      Math.floor(Number(existing.termMonths) || 12)
    );
    const monthlyAmount = calculateMonthlyInstallment(
      disbursedAmount,
      termMonths
    );
    const nextPaymentDate = addOneMonth(now);
    const loanCode = existing.loanId || existing._id.toString();
    const transactionId = `TXN${Date.now().toString(36).toUpperCase()}${randomInt(1000, 9999)}`;

    const approvalNote: LoanNoteDoc = {
      id: randomUUID(),
      note: `Loan application approved by ${adminName}. ৳${disbursedAmount.toLocaleString(
        "en-BD",
        { minimumFractionDigits: 2 }
      )} credited to account ${targetAccount.accountNumber || "—"}.`,
      addedBy: user.id,
      addedByName: adminName,
      createdAt: now,
    };

    const loanUpdatePayload = {
      $set: {
        status: "approved" as const,
        approvedAt: now,
        approvedBy: user.id,
        approvedByName: adminName,
        disbursedAt: now,
        disbursedAmount,
        monthlyAmount,
        paidInstallments: 0,
        totalRepaid: 0,
        remainingBalance: disbursedAmount,
        nextPaymentDate,
        repaymentStatus: "active",
        updatedAt: now,
      },
      $push: { internalNotes: approvalNote },
    };

    const session = client.startSession();
    try {
      session.startTransaction();

      const loanResult = await db.collection<LoanDoc>("loans").updateOne(
        {
          _id: existing._id,
          status: { $in: ["pending", "under_review"] },
        },
        loanUpdatePayload,
        { session }
      );

      if (loanResult.modifiedCount === 0) {
        await session.abortTransaction();
        return NextResponse.json(
          { error: "This loan application has already been processed." },
          { status: 409 }
        );
      }

      const updatedAcc = await db
        .collection<AccountDoc>("bankacc")
        .findOneAndUpdate(
          { _id: targetAccount._id, status: "active" },
          {
            $inc: { balance: disbursedAmount },
            $set: { updatedAt: now },
          },
          { session, returnDocument: "after" }
        );

      if (!updatedAcc) {
        await session.abortTransaction();
        return NextResponse.json(
          { error: "Failed to credit the linked bank account." },
          { status: 409 }
        );
      }

      const balanceAfter = roundMoney(Number(updatedAcc.balance) || 0);

      await db.collection("transactions").insertOne(
        {
          transactionId,
          userId: existing.userId,
          accountId: targetAccount._id.toString(),
          accountNumber: targetAccount.accountNumber,
          senderAccountNumber: "FINORA-LOAN",
          senderName: "Finora Loan Disbursement",
          recipientAccountNumber: targetAccount.accountNumber,
          recipientName: targetAccount.name || existing.userName || "Customer",
          type: "transfer",
          direction: "credit",
          amount: disbursedAmount,
          fee: 0,
          balanceAfter,
          description: `Loan Approved & Disbursed (${loanCode})`,
          status: "completed",
          createdAt: now,
        },
        { session }
      );

      await session.commitTransaction();
    } catch (txError) {
      if (session.inTransaction()) {
        await session.abortTransaction().catch(() => {});
      }

      const msg = txError instanceof Error ? txError.message : "";
      const isTxnUnsupported =
        msg.includes("Transaction numbers are only allowed") ||
        msg.includes("replica set");

      if (!isTxnUnsupported) {
        throw txError;
      }

      const loanResult = await db.collection<LoanDoc>("loans").updateOne(
        {
          _id: existing._id,
          status: { $in: ["pending", "under_review"] },
        },
        loanUpdatePayload
      );

      if (loanResult.modifiedCount === 0) {
        return NextResponse.json(
          { error: "This loan application has already been processed." },
          { status: 409 }
        );
      }

      const updatedAcc = await db
        .collection<AccountDoc>("bankacc")
        .findOneAndUpdate(
          { _id: targetAccount._id, status: "active" },
          {
            $inc: { balance: disbursedAmount },
            $set: { updatedAt: now },
          },
          { returnDocument: "after" }
        );

      const balanceAfter = roundMoney(Number(updatedAcc?.balance) || 0);

      await db.collection("transactions").insertOne({
        transactionId,
        userId: existing.userId,
        accountId: targetAccount._id.toString(),
        accountNumber: targetAccount.accountNumber,
        senderAccountNumber: "FINORA-LOAN",
        senderName: "Finora Loan Disbursement",
        recipientAccountNumber: targetAccount.accountNumber,
        recipientName: targetAccount.name || existing.userName || "Customer",
        type: "transfer",
        direction: "credit",
        amount: disbursedAmount,
        fee: 0,
        balanceAfter,
        description: `Loan Approved & Disbursed (${loanCode})`,
        status: "completed",
        createdAt: now,
      });
    } finally {
      await session.endSession();
    }

    const updated = await db
      .collection<LoanDoc>("loans")
      .findOne(loanFilter);
    const [loan] = await mapAdminLoans(updated ? [updated] : []);

    return NextResponse.json({
      success: true,
      message: `Loan approved and ৳${disbursedAmount.toLocaleString("en-BD", {
        minimumFractionDigits: 2,
      })} credited to account ${targetAccount.accountNumber || ""}.`,
      loan,
    });
  }

  // Reject loan application
  const cleanReason = rawReason.slice(0, 300);
  const rejectionNote: LoanNoteDoc = {
    id: randomUUID(),
    note: cleanReason
      ? `Loan application rejected by ${adminName}. Reason: ${cleanReason}`
      : `Loan application rejected by ${adminName}.`,
    addedBy: user.id,
    addedByName: adminName,
    createdAt: now,
  };

  const result = await db.collection<LoanDoc>("loans").updateOne(
    {
      _id: existing._id,
      status: { $in: ["pending", "under_review"] },
    },
    {
      $set: {
        status: "rejected",
        rejectedAt: now,
        rejectedBy: user.id,
        rejectedByName: adminName,
        ...(cleanReason ? { rejectionReason: cleanReason } : {}),
        updatedAt: now,
      },
      $push: { internalNotes: rejectionNote },
    }
  );

  if (result.modifiedCount === 0) {
    return NextResponse.json(
      { error: "This loan application has already been processed." },
      { status: 409 }
    );
  }

  const updated = await db
    .collection<LoanDoc>("loans")
    .findOne(loanFilter);
  const [loan] = await mapAdminLoans(updated ? [updated] : []);

  return NextResponse.json({
    success: true,
    message: "Loan application rejected.",
    loan,
  });
}
