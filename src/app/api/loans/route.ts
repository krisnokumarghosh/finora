import { NextResponse } from "next/server";
import { randomInt } from "crypto";
import { ObjectId } from "mongodb";
import { getUserSession } from "@/lib/core/session";
import { verifyPin } from "@/lib/core/pin";
import { db } from "@/lib/db/mongodb";
import {
  calculateMonthlyInstallment,
  processDueLoanRepayments,
} from "@/lib/server/loanRepayments";

const bad = (message: string, status = 400) =>
  NextResponse.json({ error: message }, { status });

const LOAN_TITLES: Record<string, string> = {
  home: "Home Loan",
  car: "Car Loan",
  education: "Education Loan",
  personal: "Personal Loan",
  business: "Business Loan",
};

export async function GET(req: Request) {
  const user = await getUserSession();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await processDueLoanRepayments({ userId: user.id }).catch((err: unknown) => {
    console.error("Failed to process due loan repayments:", err);
  });

  const { searchParams } = new URL(req.url);
  const isPaginated =
    searchParams.get("paginated") === "true" || searchParams.has("limit");
  const limitParam = Number(searchParams.get("limit")) || 15;
  const offsetParam = Number(searchParams.get("offset")) || 0;
  const typeParam = searchParams.get("type") || "all";
  const searchParam = (searchParams.get("search") || "").trim();

  const query: Record<string, unknown> = { userId: user.id };

  if (typeParam && typeParam !== "all") {
    query.type = typeParam;
  }

  if (searchParam) {
    query.$or = [
      { accountNumber: { $regex: searchParam, $options: "i" } },
      { loanId: { $regex: searchParam, $options: "i" } },
    ];
  }

  const sortOrder = { createdAt: -1 as const };

  // Internal notes and forwarding metadata belong to bank staff only.
  const customerProjection = {
    internalNotes: 0,
    forwardedAt: 0,
    forwardedBy: 0,
    forwardedByName: 0,
  };

  if (!isPaginated) {
    const rows = await db
      .collection("loans")
      .find(query, { projection: customerProjection })
      .sort(sortOrder)
      .toArray();

    const loans = rows.map(
      ({ _id, createdAt, dueDate, nextPaymentDate, ...rest }) => {
        const amt = Number(rest.amount) || 0;
        const term = Number(rest.termMonths) || 12;
        return {
          id: _id.toString(),
          ...rest,
          monthlyAmount:
            typeof rest.monthlyAmount === "number"
              ? rest.monthlyAmount
              : calculateMonthlyInstallment(amt, term),
          paidInstallments:
            typeof rest.paidInstallments === "number" ? rest.paidInstallments : 0,
          totalRepaid:
            typeof rest.totalRepaid === "number" ? rest.totalRepaid : 0,
          remainingBalance:
            typeof rest.remainingBalance === "number"
              ? rest.remainingBalance
              : amt,
          nextPaymentDate:
            nextPaymentDate instanceof Date
              ? nextPaymentDate.toISOString()
              : typeof nextPaymentDate === "string"
              ? nextPaymentDate
              : undefined,
          dueDate:
            typeof dueDate === "string"
              ? dueDate
              : dueDate instanceof Date
              ? dueDate.toISOString().split("T")[0]
              : new Date().toISOString().split("T")[0],
          createdAt:
            createdAt instanceof Date
              ? createdAt.toISOString()
              : new Date(createdAt).toISOString(),
        };
      }
    );

    return NextResponse.json(loans);
  }

  const limit = Math.max(1, Math.min(100, limitParam));
  const offset = Math.max(0, offsetParam);

  const total = await db.collection("loans").countDocuments(query);
  const rows = await db
    .collection("loans")
    .find(query, { projection: customerProjection })
    .sort(sortOrder)
    .skip(offset)
    .limit(limit)
    .toArray();

  const loans = rows.map(
    ({ _id, createdAt, dueDate, nextPaymentDate, ...rest }) => {
      const amt = Number(rest.amount) || 0;
      const term = Number(rest.termMonths) || 12;
      return {
        id: _id.toString(),
        ...rest,
        monthlyAmount:
          typeof rest.monthlyAmount === "number"
            ? rest.monthlyAmount
            : calculateMonthlyInstallment(amt, term),
        paidInstallments:
          typeof rest.paidInstallments === "number" ? rest.paidInstallments : 0,
        totalRepaid:
          typeof rest.totalRepaid === "number" ? rest.totalRepaid : 0,
        remainingBalance:
          typeof rest.remainingBalance === "number"
            ? rest.remainingBalance
            : amt,
        nextPaymentDate:
          nextPaymentDate instanceof Date
            ? nextPaymentDate.toISOString()
            : typeof nextPaymentDate === "string"
            ? nextPaymentDate
            : undefined,
        dueDate:
          typeof dueDate === "string"
            ? dueDate
            : dueDate instanceof Date
            ? dueDate.toISOString().split("T")[0]
            : new Date().toISOString().split("T")[0],
        createdAt:
          createdAt instanceof Date
            ? createdAt.toISOString()
            : new Date(createdAt).toISOString(),
      };
    }
  );

  return NextResponse.json({
    loans,
    total,
    limit,
    offset,
    hasMore: offset + loans.length < total,
  });
}

export async function POST(req: Request) {
  const user = await getUserSession();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json()) as Record<string, unknown>;
  const { accountId, type, amount, termMonths, purpose, pin } = body;

  // 1. Validate Account ID
  if (typeof accountId !== "string" || !ObjectId.isValid(accountId)) {
    return bad("Please select a valid bank account for this loan application.");
  }

  // 2. Find and verify Account ownership
  const account = await db.collection("bankacc").findOne({
    _id: new ObjectId(accountId),
    userId: user.id,
  });

  if (!account) {
    return bad(
      "The selected bank account was not found or does not belong to you.",
      404
    );
  }

  // 3. Verify Account Status: Must be active
  if (account.status !== "active") {
    return bad(
      `Loan applications are only permitted on active bank accounts. Your selected account is currently "${account.status}".`
    );
  }

  // 4. Validate PIN
  if (typeof pin !== "string" || !/^\d{4}$/.test(pin)) {
    return bad("Bank account PIN must be 4 digits.");
  }

  // 5. Verify PIN specifically against the selected account
  const isPinValid = verifyPin(pin, account.pinHash);
  if (!isPinValid) {
    return bad(`Invalid PIN for account ${account.accountNumber}.`);
  }

  // 6. Validate Loan Type
  const validTypes = ["home", "car", "education", "personal", "business"];
  if (typeof type !== "string" || !validTypes.includes(type)) {
    return bad("Please select a valid loan category.");
  }

  // 7. Validate Amount
  const parsedAmount = Number(amount);
  if (isNaN(parsedAmount) || parsedAmount <= 0) {
    return bad("Loan amount must be greater than 0.");
  }

  // 8. Validate Term
  const parsedTerm = Number(termMonths) || 12;
  if (parsedTerm < 1 || parsedTerm > 360) {
    return bad("Loan repayment term must be between 1 and 360 months.");
  }

  const cleanPurpose =
    typeof purpose === "string" && purpose.trim().length > 0
      ? purpose.trim().slice(0, 300)
      : `${LOAN_TITLES[type] || "Loan"} Application`;

  const timestamp = Date.now().toString(36).toUpperCase();
  const randomSuffix = randomInt(1000, 9999);
  const loanId = `LN${timestamp}${randomSuffix}`;

  const now = new Date();
  const dueDate = new Date(now);
  dueDate.setMonth(dueDate.getMonth() + parsedTerm);

  const doc = {
    loanId,
    userId: user.id,
    userName: user.name,
    accountId: account._id.toString(),
    accountNumber: account.accountNumber,
    accountType: account.type,
    title: LOAN_TITLES[type] || "Personal Loan",
    type,
    amount: Math.round(parsedAmount * 100) / 100,
    termMonths: parsedTerm,
    purpose: cleanPurpose,
    status: "pending", // Initially Pending
    dueDate: dueDate.toLocaleDateString("en-US", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }),
    createdAt: now,
    updatedAt: now,
  };

  const res = await db.collection("loans").insertOne(doc);

  return NextResponse.json(
    {
      success: true,
      loan: {
        id: res.insertedId.toString(),
        ...doc,
        createdAt: now.toISOString(),
      },
    },
    { status: 201 }
  );
}

export async function DELETE(req: Request) {
  const user = await getUserSession();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  let id = searchParams.get("id");

  if (!id) {
    try {
      const body = (await req.json()) as Record<string, unknown>;
      if (typeof body.id === "string") id = body.id;
      else if (typeof body.loanId === "string") id = body.loanId;
    } catch {
      // Body not provided or invalid JSON
    }
  }

  if (!id) {
    return bad("Loan ID is required for deletion.", 400);
  }

  // Find loan belonging to this user
  const filter: Record<string, unknown> = { userId: user.id };
  if (ObjectId.isValid(id)) {
    filter.$or = [{ _id: new ObjectId(id) }, { loanId: id }];
  } else {
    filter.loanId = id;
  }

  const existing = await db.collection("loans").findOne(filter);
  if (!existing) {
    return bad(
      "Loan record not found or you do not have permission to delete it.",
      404
    );
  }

  await db.collection("loans").deleteOne({ _id: existing._id });

  return NextResponse.json({
    success: true,
    message: "Loan application deleted successfully.",
  });
}
