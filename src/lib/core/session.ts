"use server";

import { headers } from "next/headers";
import { auth } from "../auth";
import { ensureDbConnected } from "../db/mongodb";

export const getUserSession = async () => {
  const h = await headers();

  try {
    await ensureDbConnected();
    const session = await auth.api.getSession({
      headers: h,
    });

    return session?.user ?? null;
  } catch (error) {
    console.error("Error retrieving user session:", error);
    return null;
  }
};