import { NextResponse } from "next/server";
import { getUserSession } from "@/lib/core/session";
import { db } from "@/lib/db/mongodb";

export async function GET(req: Request) {
  const user = await getUserSession();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const accountNumber = searchParams.get("accountNumber")?.trim();

  if (!accountNumber || accountNumber.length !== 12) {
    return NextResponse.json(
      { error: "Account number must be 12 digits" },
      { status: 400 }
    );
  }

  const account = await db.collection("bankacc").findOne(
    { accountNumber },
    {
      projection: {
        _id: 1,
        name: 1,
        accountNumber: 1,
        status: 1,
        type: 1,
        userId: 1,
      },
    }
  );

  if (!account) {
    return NextResponse.json(
      { found: false, message: "Recipient account not found" },
      { status: 404 }
    );
  }

  return NextResponse.json({
    found: true,
    accountNumber: account.accountNumber,
    name: account.name,
    status: account.status,
    type: account.type,
    isSelf: account.userId === user.id,
  });
}
