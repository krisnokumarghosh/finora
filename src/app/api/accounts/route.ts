import { NextResponse } from "next/server";
import { randomInt } from "crypto";
import { getUserSession } from "@/lib/core/session";
import { hashPin } from "@/lib/core/pin";
import { db } from "@/lib/db/mongodb";
import { processDueLoanRepayments } from "@/lib/server/loanRepayments";

const ACCOUNT_TYPES = ["savings", "current", "business"];
const bad = (message: string) => NextResponse.json({ error: message }, { status: 400 });

export async function GET() {
  const user = await getUserSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await processDueLoanRepayments({ userId: user.id }).catch((err: unknown) => {
    console.error("Failed to process due loan repayments:", err);
  });

  // pinHash ar nid kokhono frontend-e pathabo na
  const rows = await db
    .collection("bankacc")
    .find({ userId: user.id }, { projection: { pinHash: 0, nid: 0 } })
    .sort({ createdAt: -1 })
    .toArray();

  return NextResponse.json(rows.map(({ _id, ...rest }) => ({ id: _id.toString(), ...rest })));
}

export async function POST(req: Request) {
  const user = await getUserSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.role !== "customer") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { type, name, mobile, nid, pin } = (await req.json()) as Record<string, unknown>;

  if (typeof type !== "string" || !ACCOUNT_TYPES.includes(type)) return bad("Select a valid account type");
  if (typeof name !== "string" || name.trim().length < 2 || name.trim().length > 60) {
    return bad("Name must be 2 to 60 characters");
  }
  if (typeof mobile !== "string" || !/^01[3-9]\d{8}$/.test(mobile)) {
    return bad("Enter a valid 11 digit mobile number");
  }
  if (typeof nid !== "string" || !/^(\d{10}|\d{13}|\d{17})$/.test(nid)) {
    return bad("NID must be 10, 13 or 17 digits");
  }
  if (typeof pin !== "string" || !/^\d{4}$/.test(pin)) return bad("PIN must be 4 digits");

  // Max 3 accounts per user
  const userAccountCount = await db
    .collection("bankacc")
    .countDocuments({ userId: user.id });
  if (userAccountCount >= 3) {
    return bad("You can open a maximum of 3 bank accounts.");
  }

  // NID can only be used for 3 accounts across all users
  const nidCount = await db
    .collection("bankacc")
    .countDocuments({ nid });
  if (nidCount >= 3) {
    return bad("This NID has already been used for the maximum number of accounts.");
  }

  // Mobile can only be used for 3 accounts across all users
  const mobileCount = await db
    .collection("bankacc")
    .countDocuments({ mobile });
  if (mobileCount >= 3) {
    return bad("This mobile number has already been used for the maximum number of accounts.");
  }

  const doc = {
    userId: user.id,
    type,
    name: name.trim(),
    mobile,
    nid,
    pinHash: hashPin(pin),
    accountNumber: String(randomInt(1e11, 1e12)), // 12 digit
    balance: 0,
    status: "pending",
    transactionLimit: 100000,
    createdAt: new Date(),
  };

  const res = await db.collection("bankacc").insertOne(doc);
  return NextResponse.json({ id: res.insertedId.toString() }, { status: 201 });
}