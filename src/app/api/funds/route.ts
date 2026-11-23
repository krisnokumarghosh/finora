import { NextResponse } from "next/server";
import { randomInt } from "crypto";
import { getUserSession } from "@/lib/core/session";
import { verifyPin } from "@/lib/core/pin";
import { db } from "@/lib/db/mongodb";

const bad = (message: string, status = 400) =>
  NextResponse.json({ error: message }, { status });

// GET: Fetch fund requests for the logged-in customer
export async function GET(req: Request) {
  const user = await getUserSession();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const accountNumber = searchParams.get("accountNumber");

  const query: Record<string, unknown> = { userId: user.id };
  if (accountNumber && /^\d{12}$/.test(accountNumber.trim())) {
    query.accountNumber = accountNumber.trim();
  }

  const rows = await db
    .collection("fund_requests")
    .find(query)
    .sort({ createdAt: -1 })
    .toArray();

  const requests = rows.map(({ _id, createdAt, ...rest }) => ({
    id: _id.toString(),
    ...rest,
    createdAt:
      createdAt instanceof Date
        ? createdAt.toISOString()
        : new Date(createdAt).toISOString(),
  }));

  return NextResponse.json(requests);
}

// POST: Create a new deposit or withdrawal request
export async function POST(req: Request) {
  // 1. Session verification
  const user = await getUserSession();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 2. Request payload parsing
  const body = (await req.json()) as Record<string, unknown>;
  const { accountNumber, amount, type, description, pin } = body;

  // Validate type
  if (type !== "deposit" && type !== "withdrawal") {
    return bad("Request type must be either 'Deposit' or 'Withdrawal'.");
  }

  // Validate account number (12 digits)
  if (
    typeof accountNumber !== "string" ||
    !/^\d{12}$/.test(accountNumber.trim())
  ) {
    return bad("Account number must be a valid 12-digit number.");
  }
  const cleanAccountNumber = accountNumber.trim();

  // Validate amount
  const parsedAmount = Number(amount);
  if (
    typeof amount !== "number" &&
    (typeof amount !== "string" || isNaN(parsedAmount))
  ) {
    return bad("Please enter a valid amount.");
  }

  if (parsedAmount <= 0) {
    return bad("Amount must be greater than 0.");
  }

  // Round to 2 decimal places to prevent floating point issues
  const validAmount = Math.round(parsedAmount * 100) / 100;

  // Request date is automatically generated on the server
  const now = new Date();
  const cleanRequestDate = now.toISOString().split("T")[0];

  // Validate description
  const cleanDescription =
    typeof description === "string" && description.trim().length > 0
      ? description.trim().slice(0, 250)
      : type === "deposit"
      ? "Deposit Request"
      : "Withdrawal Request";

  // Validate PIN (4 digits)
  if (typeof pin !== "string" || !/^\d{4}$/.test(pin)) {
    return bad("Transaction PIN must be 4 digits.");
  }

  // 3. Find bank account by account number AND user ID (Ensures ownership)
  const bankAccount = await db.collection("bankacc").findOne({
    accountNumber: cleanAccountNumber,
    userId: user.id,
  });

  if (!bankAccount) {
    return bad(
      "Bank account not found or does not belong to your account.",
      404
    );
  }

  // 4. Validate account status: Transactions only work on ACTIVE accounts
  if (bankAccount.status !== "active") {
    return bad(
      `Transactions are only allowed on active bank accounts. Your account (${cleanAccountNumber}) is currently "${bankAccount.status}".`
    );
  }

  // 5. Verify Bank Account PIN: Checked specifically against the account given in the account number field
  const isPinValid = verifyPin(pin, bankAccount.pinHash);
  if (!isPinValid) {
    return bad(`Invalid bank account PIN for account ${cleanAccountNumber}.`);
  }

  // 6. For withdrawal, check available balance
  if (type === "withdrawal" && bankAccount.balance < validAmount) {
    return bad(
      `Insufficient balance. Available balance in this account is ৳${bankAccount.balance.toLocaleString(
        "en-BD",
        { minimumFractionDigits: 2 }
      )}.`
    );
  }

  // 7. Generate unique request ID
  const timestamp = Date.now().toString(36).toUpperCase();
  const randomSuffix = randomInt(1000, 9999);
  const requestId = `REQ${timestamp}${randomSuffix}`;

  // 8. Construct new fund request (Initially "pending")
  const doc = {
    requestId,
    userId: user.id,
    accountId: bankAccount._id.toString(),
    accountNumber: bankAccount.accountNumber,
    accountName: bankAccount.name,
    type,
    amount: validAmount,
    requestDate: cleanRequestDate,
    description: cleanDescription,
    status: "pending", // Initially Pending
    createdAt: now,
    updatedAt: now,
  };

  const insertResult = await db.collection("fund_requests").insertOne(doc);

  return NextResponse.json(
    {
      success: true,
      message: `${
        type === "deposit" ? "Deposit" : "Withdrawal"
      } request submitted successfully and is currently pending review.`,
      request: {
        id: insertResult.insertedId.toString(),
        ...doc,
        createdAt: now.toISOString(),
      },
    },
    { status: 201 }
  );
}
