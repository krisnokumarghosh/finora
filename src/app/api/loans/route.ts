import { NextResponse } from "next/server";
import { randomInt } from "crypto";
import { ObjectId } from "mongodb";
import { getUserSession } from "@/lib/core/session";
import { verifyPin } from "@/lib/core/pin";
import { db } from "@/lib/db/mongodb";

const bad = (message: string, status = 400) =>
  NextResponse.json({ error: message }, { status });

const LOAN_TITLES: Record<string, string> = {
  home: "Home Loan",
  car: "Car Loan",
  education: "Education Loan",
  personal: "Personal Loan",
  business: "Business Loan",
};

export async function GET() {
  const user = await getUserSession();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rows = await db
    .collection("loans")
    .find({ userId: user.id })
    .sort({ createdAt: -1 })
    .toArray();

  const loans = rows.map(({ _id, createdAt, dueDate, ...rest }) => ({
    id: _id.toString(),
    ...rest,
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
  }));

  return NextResponse.json(loans);
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
