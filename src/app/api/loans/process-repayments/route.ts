import { NextResponse } from "next/server";
import { getUserSession } from "@/lib/core/session";
import { processDueLoanRepayments } from "@/lib/server/loanRepayments";

type SessionRole = { role?: string | null };

export async function POST(req: Request) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = req.headers.get("authorization");
  const isCronAuthorized =
    Boolean(cronSecret) && authHeader === `Bearer ${cronSecret}`;

  if (!isCronAuthorized) {
    const user = await getUserSession();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if ((user as SessionRole).role !== "admin") {
      return NextResponse.json(
        { error: "Only admins can manually trigger loan repayments." },
        { status: 403 }
      );
    }
  }

  const summary = await processDueLoanRepayments();

  return NextResponse.json({
    success: true,
    ...summary,
    message:
      summary.processedPayments > 0
        ? `Processed ${summary.processedPayments} due monthly installment(s).`
        : "No due loan installments required deduction right now.",
  });
}
