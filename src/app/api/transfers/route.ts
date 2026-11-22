import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { randomInt } from "crypto";
import { getUserSession } from "@/lib/core/session";
import { verifyPin } from "@/lib/core/pin";
import { client, db } from "@/lib/db/mongodb";

const bad = (message: string, status = 400) =>
  NextResponse.json({ error: message }, { status });

export async function POST(req: Request) {
  // 1. Session verification
  const user = await getUserSession();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 2. Request payload parsing
  const body = (await req.json()) as Record<string, unknown>;
  const { senderAccountId, recipientAccountNumber, amount, description, pin } =
    body;

  // Validate sender account id
  if (
    typeof senderAccountId !== "string" ||
    !ObjectId.isValid(senderAccountId)
  ) {
    return bad("Please select a valid sender account.");
  }

  // Validate recipient account number (12 digits)
  if (
    typeof recipientAccountNumber !== "string" ||
    !/^\d{12}$/.test(recipientAccountNumber.trim())
  ) {
    return bad("Recipient account number must be 12 digits.");
  }

  // Validate amount
  const parsedAmount = Number(amount);
  if (
    typeof amount !== "number" &&
    (typeof amount !== "string" || isNaN(parsedAmount))
  ) {
    return bad("Please enter a valid transfer amount.");
  }

  if (parsedAmount <= 0) {
    return bad("Transfer amount must be greater than 0.");
  }

  // Round to 2 decimal places to prevent floating point inaccuracies
  const transferAmount = Math.round(parsedAmount * 100) / 100;

  // Validate PIN (4 digits)
  if (typeof pin !== "string" || !/^\d{4}$/.test(pin)) {
    return bad("Transaction PIN must be 4 digits.");
  }

  // 3. Retrieve sender account from DB
  const senderAccount = await db.collection("bankacc").findOne({
    _id: new ObjectId(senderAccountId),
    userId: user.id,
  });

  if (!senderAccount) {
    return bad("Sender account not found or does not belong to you.", 404);
  }

  // 4. Validate sender account status (must be active)
  if (senderAccount.status !== "active") {
    return bad(
      `Transactions are only available on active accounts. Your selected account is currently "${senderAccount.status}".`
    );
  }

  // 5. Validate transaction PIN
  const isPinValid = verifyPin(pin, senderAccount.pinHash);
  if (!isPinValid) {
    return bad("Invalid transaction PIN.");
  }

  // 6. Retrieve recipient account from DB
  const cleanRecipientAccountNumber = recipientAccountNumber.trim();
  const recipientAccount = await db.collection("bankacc").findOne({
    accountNumber: cleanRecipientAccountNumber,
  });

  if (!recipientAccount) {
    return bad(
      "Recipient account not found. Please verify the account number.",
      404
    );
  }

  // Prevent transfer to self's exact same account
  if (recipientAccount._id.toString() === senderAccount._id.toString()) {
    return bad("Cannot transfer funds to the same account.");
  }

  // 7. Validate recipient account status (must also be active)
  if (recipientAccount.status !== "active") {
    return bad(
      `Recipient account is currently "${recipientAccount.status}" and cannot receive transfers. Transfers are only available on active accounts.`
    );
  }

  // 8. Validate transaction limits
  const transactionLimit =
    typeof senderAccount.transactionLimit === "number"
      ? senderAccount.transactionLimit
      : 100000;

  if (transferAmount > transactionLimit) {
    return bad(
      `Transfer amount exceeds your per-transaction limit of ৳${transactionLimit.toLocaleString(
        "en-BD"
      )}.`
    );
  }

  // 9. Validate sufficient balance
  if (senderAccount.balance < transferAmount) {
    return bad(
      `Insufficient balance. Your available balance is ৳${senderAccount.balance.toLocaleString(
        "en-BD",
        { minimumFractionDigits: 2 }
      )}.`
    );
  }

  // 10. Generate unique transaction ID
  const timestamp = Date.now().toString(36).toUpperCase();
  const randomSuffix = randomInt(1000, 9999);
  const transactionId = `TXN${timestamp}${randomSuffix}`;

  const cleanDescription =
    typeof description === "string" && description.trim().length > 0
      ? description.trim().slice(0, 200)
      : "Fund Transfer";

  const transactionDate = new Date();

  // 11. Atomic Transfer Execution
  // Try using MongoDB session transaction for full ACID guarantees.
  // If running in a MongoDB environment that does not support transactions, fallback to atomic conditional updates.
  const session = client.startSession();
  let usedTransaction = false;

  try {
    session.startTransaction();
    usedTransaction = true;

    // Deduct sender balance with atomic condition (balance >= transferAmount)
    const debitRes = await db.collection("bankacc").updateOne(
      {
        _id: senderAccount._id,
        balance: { $gte: transferAmount },
        status: "active",
      },
      {
        $inc: { balance: -transferAmount },
        $set: { updatedAt: transactionDate },
      },
      { session }
    );

    if (debitRes.matchedCount === 0) {
      throw new Error(
        "TRANSFER_FAILED_BALANCE: Insufficient balance or account is no longer active."
      );
    }

    // Credit recipient balance
    const creditRes = await db.collection("bankacc").updateOne(
      {
        _id: recipientAccount._id,
        status: "active",
      },
      {
        $inc: { balance: transferAmount },
        $set: { updatedAt: transactionDate },
      },
      { session }
    );

    if (creditRes.matchedCount === 0) {
      throw new Error(
        "TRANSFER_FAILED_RECIPIENT: Recipient account is not active or could not be updated."
      );
    }

    // Insert sender transaction record (debit)
    const senderTxRecord = {
      transactionId,
      userId: user.id,
      accountId: senderAccount._id.toString(),
      accountNumber: senderAccount.accountNumber,
      recipientAccountNumber: recipientAccount.accountNumber,
      recipientName: recipientAccount.name,
      senderName: senderAccount.name,
      type: "fund_transfer",
      direction: "debit",
      amount: transferAmount,
      fee: 0,
      balanceAfter: senderAccount.balance - transferAmount,
      description: cleanDescription,
      status: "completed",
      createdAt: transactionDate,
    };

    // Insert receiver transaction record (credit)
    const receiverTxRecord = {
      transactionId,
      userId: recipientAccount.userId,
      accountId: recipientAccount._id.toString(),
      accountNumber: recipientAccount.accountNumber,
      senderAccountNumber: senderAccount.accountNumber,
      senderName: senderAccount.name,
      recipientName: recipientAccount.name,
      type: "fund_transfer",
      direction: "credit",
      amount: transferAmount,
      fee: 0,
      balanceAfter: recipientAccount.balance + transferAmount,
      description: cleanDescription,
      status: "completed",
      createdAt: transactionDate,
    };

    await db
      .collection("transactions")
      .insertMany([senderTxRecord, receiverTxRecord], { session });

    await session.commitTransaction();
  } catch (err: unknown) {
    if (usedTransaction) {
      await session.abortTransaction();
    }

    const errorMessage =
      err instanceof Error ? err.message : "Transfer processing failed";

    // If transactions are not supported on the mongo cluster (e.g., standalone local dev without replica set)
    if (errorMessage.includes("Transaction numbers are only allowed on a replica set member")) {
      // Fallback: safe atomic sequential operations with rollback
      const debitRes = await db.collection("bankacc").updateOne(
        {
          _id: senderAccount._id,
          balance: { $gte: transferAmount },
          status: "active",
        },
        {
          $inc: { balance: -transferAmount },
          $set: { updatedAt: transactionDate },
        }
      );

      if (debitRes.matchedCount === 0) {
        return bad(
          "Insufficient balance or sender account is no longer active."
        );
      }

      const creditRes = await db.collection("bankacc").updateOne(
        {
          _id: recipientAccount._id,
          status: "active",
        },
        {
          $inc: { balance: transferAmount },
          $set: { updatedAt: transactionDate },
        }
      );

      if (creditRes.matchedCount === 0) {
        // Rollback sender debit
        await db
          .collection("bankacc")
          .updateOne(
            { _id: senderAccount._id },
            { $inc: { balance: transferAmount } }
          );
        return bad("Recipient account is not active. Transfer cancelled.");
      }

      // Record both transactions
      const senderTxRecord = {
        transactionId,
        userId: user.id,
        accountId: senderAccount._id.toString(),
        accountNumber: senderAccount.accountNumber,
        recipientAccountNumber: recipientAccount.accountNumber,
        recipientName: recipientAccount.name,
        senderName: senderAccount.name,
        type: "fund_transfer",
        direction: "debit",
        amount: transferAmount,
        fee: 0,
        balanceAfter: senderAccount.balance - transferAmount,
        description: cleanDescription,
        status: "completed",
        createdAt: transactionDate,
      };

      const receiverTxRecord = {
        transactionId,
        userId: recipientAccount.userId,
        accountId: recipientAccount._id.toString(),
        accountNumber: recipientAccount.accountNumber,
        senderAccountNumber: senderAccount.accountNumber,
        senderName: senderAccount.name,
        recipientName: recipientAccount.name,
        type: "fund_transfer",
        direction: "credit",
        amount: transferAmount,
        fee: 0,
        balanceAfter: recipientAccount.balance + transferAmount,
        description: cleanDescription,
        status: "completed",
        createdAt: transactionDate,
      };

      await db
        .collection("transactions")
        .insertMany([senderTxRecord, receiverTxRecord]);
    } else {
      if (errorMessage.startsWith("TRANSFER_FAILED_BALANCE")) {
        return bad(
          "Insufficient balance or sender account is no longer active."
        );
      }
      if (errorMessage.startsWith("TRANSFER_FAILED_RECIPIENT")) {
        return bad("Recipient account is not active or cannot receive funds.");
      }
      return bad(errorMessage);
    }
  } finally {
    await session.endSession();
  }

  return NextResponse.json(
    {
      success: true,
      transactionId,
      amount: transferAmount,
      fee: 0,
      senderAccountNumber: senderAccount.accountNumber,
      senderName: senderAccount.name,
      recipientAccountNumber: recipientAccount.accountNumber,
      recipientName: recipientAccount.name,
      description: cleanDescription,
      createdAt: transactionDate.toISOString(),
    },
    { status: 200 }
  );
}
