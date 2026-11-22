import { NextResponse } from "next/server";
import { getUserSession } from "@/lib/core/session";
import { db } from "@/lib/db/mongodb";

export async function GET(req: Request) {
  const user = await getUserSession();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const accountId = searchParams.get("accountId");

  const query: Record<string, unknown> = {
    userId: user.id,
    type: "fund_transfer",
  };

  if (accountId) {
    query.accountId = accountId;
  }

  const transactions = await db
    .collection("transactions")
    .find(query)
    .sort({ createdAt: -1 })
    .limit(10)
    .toArray();

  return NextResponse.json(
    transactions.map(({ _id, ...rest }) => ({
      id: _id.toString(),
      ...rest,
    }))
  );
}
