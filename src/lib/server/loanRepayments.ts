import { randomInt } from "crypto";
import { ObjectId } from "mongodb";
import { client, db } from "@/lib/db/mongodb";

export const LOAN_PAYMENT_HISTORY_COLLECTION = "loan-payment-history";

type LoanForRepaymentDoc = {
  _id: ObjectId;
  loanId?: string;
  userId?: string;
  userName?: string;
  accountId?: string;
  accountNumber?: string;
  amount?: number;
  termMonths?: number;
  monthlyAmount?: number;
  paidInstallments?: number;
  totalRepaid?: number;
  remainingBalance?: number;
  nextPaymentDate?: Date | string;
  approvedAt?: Date | string;
  repaymentStatus?: string;
  status?: string;
};

type BankAccountDoc = {
  _id: ObjectId;
  accountNumber?: string;
  name?: string;
  balance?: number;
  status?: string;
  userId?: string;
};

export const roundMoney = (value: number): number =>
  Math.round(value * 100) / 100;

export const calculateMonthlyInstallment = (
  amount: number,
  termMonths: number
): number => {
  const safeAmount = Math.max(0, Number(amount) || 0);
  const safeTerm = Math.max(1, Math.floor(Number(termMonths) || 12));
  return roundMoney(safeAmount / safeTerm);
};

/**
 * Adds one calendar month while clamping to the last day of the target month
 * (e.g. Jan 31 -> Feb 28/29 instead of overflowing into March).
 */
export const addOneMonth = (baseDate: Date): Date => {
  const result = new Date(baseDate.getTime());
  const originalDay = result.getDate();
  result.setDate(1);
  result.setMonth(result.getMonth() + 1);
  const daysInTargetMonth = new Date(
    result.getFullYear(),
    result.getMonth() + 1,
    0
  ).getDate();
  result.setDate(Math.min(originalDay, daysInTargetMonth));
  return result;
};

let historyIndexPromise: Promise<unknown> | null = null;

export const ensureLoanPaymentHistoryIndexes = () => {
  if (!historyIndexPromise) {
    historyIndexPromise = Promise.all([
      db
        .collection(LOAN_PAYMENT_HISTORY_COLLECTION)
        .createIndex({ loanId: 1, installmentNumber: 1 }),
      db
        .collection(LOAN_PAYMENT_HISTORY_COLLECTION)
        .createIndex({ userId: 1, paidAt: -1 }),
    ]);
  }
  return historyIndexPromise;
};

const toValidDate = (value: unknown): Date | null => {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value;
  if (typeof value === "string" || typeof value === "number") {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }
  return null;
};

const findAccountForLoan = async (loan: LoanForRepaymentDoc) => {
  if (loan.accountId && ObjectId.isValid(loan.accountId)) {
    const byId = await db
      .collection<BankAccountDoc>("bankacc")
      .findOne({ _id: new ObjectId(loan.accountId) });
    if (byId) return byId;
  }
  if (loan.accountNumber) {
    return db
      .collection<BankAccountDoc>("bankacc")
      .findOne({ accountNumber: loan.accountNumber });
  }
  return null;
};

const executeSingleInstallmentDeduction = async (params: {
  loan: LoanForRepaymentDoc;
  account: BankAccountDoc;
  installmentNumber: number;
  dueAmount: number;
  nextPaymentDate: Date;
  isFinalInstallment: boolean;
  dueDateForRecord: Date;
  now: Date;
}): Promise<{
  success: boolean;
  reason?: string;
  balanceBefore?: number;
  balanceAfter?: number;
  remainingLoanBalance?: number;
}> => {
  const {
    loan,
    account,
    installmentNumber,
    dueAmount,
    nextPaymentDate,
    isFinalInstallment,
    dueDateForRecord,
    now,
  } = params;

  const loanCode = loan.loanId || loan._id.toString();
  const paymentId = `LPH${Date.now().toString(36).toUpperCase()}${randomInt(1000, 9999)}`;
  const transactionId = `TXN${Date.now().toString(36).toUpperCase()}${randomInt(1000, 9999)}`;

  const currentRemaining =
    typeof loan.remainingBalance === "number"
      ? loan.remainingBalance
      : Number(loan.amount) || 0;
  const newRemaining = isFinalInstallment
    ? 0
    : Math.max(0, roundMoney(currentRemaining - dueAmount));
  const newTotalRepaid = roundMoney((Number(loan.totalRepaid) || 0) + dueAmount);

  const session = client.startSession();
  try {
    session.startTransaction();

    // Atomically deduct from active bank account only if sufficient balance exists.
    const updatedAccount = await db
      .collection<BankAccountDoc>("bankacc")
      .findOneAndUpdate(
        {
          _id: account._id,
          status: "active",
          balance: { $gte: dueAmount },
        },
        {
          $inc: { balance: -dueAmount },
          $set: { updatedAt: now },
        },
        { session, returnDocument: "after" }
      );

    if (!updatedAccount) {
      await session.abortTransaction();
      return { success: false, reason: "insufficient_balance_or_inactive" };
    }

    const balanceAfter = roundMoney(Number(updatedAccount.balance) || 0);
    const balanceBefore = roundMoney(balanceAfter + dueAmount);

    // Atomically update loan repayment progress (guard against concurrent deduction).
    const loanUpdateRes = await db
      .collection<LoanForRepaymentDoc>("loans")
      .updateOne(
        {
          _id: loan._id,
          status: "approved",
          paidInstallments: installmentNumber - 1,
        },
        {
          $set: {
            paidInstallments: installmentNumber,
            totalRepaid: newTotalRepaid,
            remainingBalance: newRemaining,
            nextPaymentDate,
            repaymentStatus: newRemaining <= 0 ? "completed" : "active",
            ...(newRemaining <= 0 ? { completedAt: now } : {}),
            updatedAt: now,
          },
        },
        { session }
      );

    if (loanUpdateRes.modifiedCount === 0) {
      await session.abortTransaction();
      return { success: false, reason: "concurrent_update" };
    }

    await db.collection(LOAN_PAYMENT_HISTORY_COLLECTION).insertOne(
      {
        paymentId,
        loanObjectId: loan._id.toString(),
        loanId: loanCode,
        userId: loan.userId,
        userName: loan.userName || account.name || "Customer",
        accountId: account._id.toString(),
        accountNumber: account.accountNumber || loan.accountNumber,
        installmentNumber,
        amount: dueAmount,
        balanceBefore,
        balanceAfter,
        remainingLoanBalance: newRemaining,
        status: "paid",
        method: "Auto Debit",
        reference: transactionId,
        dueDate: dueDateForRecord,
        paidAt: now,
        createdAt: now,
      },
      { session }
    );

    await db.collection("transactions").insertOne(
      {
        transactionId,
        userId: loan.userId,
        accountId: account._id.toString(),
        accountNumber: account.accountNumber || loan.accountNumber,
        senderAccountNumber: account.accountNumber || loan.accountNumber,
        senderName: account.name || loan.userName || "Customer",
        recipientAccountNumber: "FINORA-LOAN",
        recipientName: `Loan Repayment (${loanCode})`,
        type: "transfer",
        direction: "debit",
        amount: dueAmount,
        fee: 0,
        balanceAfter,
        description: `Monthly Loan Installment #${installmentNumber} (${loanCode})`,
        status: "completed",
        createdAt: now,
      },
      { session }
    );

    await session.commitTransaction();
    return {
      success: true,
      balanceBefore,
      balanceAfter,
      remainingLoanBalance: newRemaining,
    };
  } catch (error) {
    if (session.inTransaction()) {
      await session.abortTransaction().catch(() => {});
    }

    // Fallback for standalone MongoDB instances that do not support replica-set transactions.
    const message = error instanceof Error ? error.message : "";
    const isTxnUnsupported =
      message.includes("Transaction numbers are only allowed") ||
      message.includes("replica set");

    if (!isTxnUnsupported) {
      throw error;
    }

    const updatedAccount = await db
      .collection<BankAccountDoc>("bankacc")
      .findOneAndUpdate(
        {
          _id: account._id,
          status: "active",
          balance: { $gte: dueAmount },
        },
        {
          $inc: { balance: -dueAmount },
          $set: { updatedAt: now },
        },
        { returnDocument: "after" }
      );

    if (!updatedAccount) {
      return { success: false, reason: "insufficient_balance_or_inactive" };
    }

    const balanceAfter = roundMoney(Number(updatedAccount.balance) || 0);
    const balanceBefore = roundMoney(balanceAfter + dueAmount);

    const loanUpdateRes = await db
      .collection<LoanForRepaymentDoc>("loans")
      .updateOne(
        {
          _id: loan._id,
          status: "approved",
          paidInstallments: installmentNumber - 1,
        },
        {
          $set: {
            paidInstallments: installmentNumber,
            totalRepaid: newTotalRepaid,
            remainingBalance: newRemaining,
            nextPaymentDate,
            repaymentStatus: newRemaining <= 0 ? "completed" : "active",
            ...(newRemaining <= 0 ? { completedAt: now } : {}),
            updatedAt: now,
          },
        }
      );

    if (loanUpdateRes.modifiedCount === 0) {
      // Roll back the account debit if the loan was already updated concurrently.
      await db
        .collection<BankAccountDoc>("bankacc")
        .updateOne({ _id: account._id }, { $inc: { balance: dueAmount } });
      return { success: false, reason: "concurrent_update" };
    }

    await db.collection(LOAN_PAYMENT_HISTORY_COLLECTION).insertOne({
      paymentId,
      loanObjectId: loan._id.toString(),
      loanId: loanCode,
      userId: loan.userId,
      userName: loan.userName || account.name || "Customer",
      accountId: account._id.toString(),
      accountNumber: account.accountNumber || loan.accountNumber,
      installmentNumber,
      amount: dueAmount,
      balanceBefore,
      balanceAfter,
      remainingLoanBalance: newRemaining,
      status: "paid",
      method: "Auto Debit",
      reference: transactionId,
      dueDate: dueDateForRecord,
      paidAt: now,
      createdAt: now,
    });

    await db.collection("transactions").insertOne({
      transactionId,
      userId: loan.userId,
      accountId: account._id.toString(),
      accountNumber: account.accountNumber || loan.accountNumber,
      senderAccountNumber: account.accountNumber || loan.accountNumber,
      senderName: account.name || loan.userName || "Customer",
      recipientAccountNumber: "FINORA-LOAN",
      recipientName: `Loan Repayment (${loanCode})`,
      type: "transfer",
      direction: "debit",
      amount: dueAmount,
      fee: 0,
      balanceAfter,
      description: `Monthly Loan Installment #${installmentNumber} (${loanCode})`,
      status: "completed",
      createdAt: now,
    });

    return {
      success: true,
      balanceBefore,
      balanceAfter,
      remainingLoanBalance: newRemaining,
    };
  } finally {
    await session.endSession();
  }
};

export type ProcessRepaymentsSummary = {
  processedPayments: number;
  failedPayments: number;
  loansChecked: number;
};

/**
 * Checks approved loans whose nextPaymentDate has arrived and deducts
 * the monthly installment from the customer's bank account, recording each
 * payment in the `loan-payment-history` collection.
 */
export async function processDueLoanRepayments(options?: {
  userId?: string;
  loanId?: string;
}): Promise<ProcessRepaymentsSummary> {
  await ensureLoanPaymentHistoryIndexes().catch((err: unknown) => {
    console.error("Failed to create loan-payment-history indexes:", err);
  });

  const now = new Date();
  const query: Record<string, unknown> = {
    status: "approved",
    repaymentStatus: { $ne: "completed" },
    nextPaymentDate: { $lte: now },
  };

  if (options?.userId) {
    query.userId = options.userId;
  }

  if (options?.loanId) {
    if (ObjectId.isValid(options.loanId)) {
      query.$or = [
        { _id: new ObjectId(options.loanId) },
        { loanId: options.loanId },
      ];
    } else {
      query.loanId = options.loanId;
    }
  }

  const dueLoans = await db
    .collection<LoanForRepaymentDoc>("loans")
    .find(query)
    .toArray();

  let processedPayments = 0;
  let failedPayments = 0;

  for (const loan of dueLoans) {
    const account = await findAccountForLoan(loan);
    if (!account) continue;

    const totalAmount = roundMoney(Number(loan.amount) || 0);
    const termMonths = Math.max(1, Math.floor(Number(loan.termMonths) || 12));
    const monthlyAmount =
      typeof loan.monthlyAmount === "number" && loan.monthlyAmount > 0
        ? roundMoney(loan.monthlyAmount)
        : calculateMonthlyInstallment(totalAmount, termMonths);

    let paidInstallments = Math.max(0, Number(loan.paidInstallments) || 0);
    let totalRepaid = roundMoney(Number(loan.totalRepaid) || 0);
    let remainingBalance =
      typeof loan.remainingBalance === "number"
        ? roundMoney(loan.remainingBalance)
        : Math.max(0, roundMoney(totalAmount - totalRepaid));

    let currentDueDate =
      toValidDate(loan.nextPaymentDate) ||
      addOneMonth(toValidDate(loan.approvedAt) || now);

    // Safety cap prevents runaway loops on malformed termMonths.
    let guard = 0;
    while (
      currentDueDate.getTime() <= now.getTime() &&
      remainingBalance > 0 &&
      paidInstallments < termMonths &&
      guard < 360
    ) {
      guard += 1;
      const nextInstallmentNumber = paidInstallments + 1;
      const isFinalInstallment =
        nextInstallmentNumber >= termMonths ||
        remainingBalance <= monthlyAmount;
      const dueAmount = isFinalInstallment
        ? remainingBalance
        : Math.min(monthlyAmount, remainingBalance);

      if (dueAmount <= 0) break;

      const nextCycleDate = addOneMonth(currentDueDate);

      const outcome = await executeSingleInstallmentDeduction({
        loan: {
          ...loan,
          paidInstallments,
          totalRepaid,
          remainingBalance,
        },
        account,
        installmentNumber: nextInstallmentNumber,
        dueAmount,
        nextPaymentDate: nextCycleDate,
        isFinalInstallment,
        dueDateForRecord: currentDueDate,
        now,
      });

      if (!outcome.success) {
        if (outcome.reason === "insufficient_balance_or_inactive") {
          failedPayments += 1;
          const loanCode = loan.loanId || loan._id.toString();
          const existingLate = await db
            .collection(LOAN_PAYMENT_HISTORY_COLLECTION)
            .findOne({
              loanId: loanCode,
              installmentNumber: nextInstallmentNumber,
              status: "late",
            });

          if (!existingLate) {
            await db.collection(LOAN_PAYMENT_HISTORY_COLLECTION).insertOne({
              paymentId: `LPH${Date.now().toString(36).toUpperCase()}${randomInt(1000, 9999)}`,
              loanObjectId: loan._id.toString(),
              loanId: loanCode,
              userId: loan.userId,
              userName: loan.userName || account.name || "Customer",
              accountId: account._id.toString(),
              accountNumber: account.accountNumber || loan.accountNumber,
              installmentNumber: nextInstallmentNumber,
              amount: dueAmount,
              remainingLoanBalance: remainingBalance,
              status: "late",
              method: "Auto Debit Failed (Insufficient Balance / Inactive Account)",
              dueDate: currentDueDate,
              paidAt: now,
              createdAt: now,
            });
          }
        }
        // Stop further monthly deductions for this loan until balance is available.
        break;
      }

      processedPayments += 1;
      paidInstallments = nextInstallmentNumber;
      totalRepaid = roundMoney(totalRepaid + dueAmount);
      remainingBalance = outcome.remainingLoanBalance ?? 0;
      currentDueDate = nextCycleDate;
    }
  }

  return {
    processedPayments,
    failedPayments,
    loansChecked: dueLoans.length,
  };
}
