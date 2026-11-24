"use server";

import { headers } from "next/headers";
import { auth } from "../auth";

export const getUserSession = async () => {
  const h = await headers(); // try er baire

  try {
    const session = await auth.api.getSession({
      headers: h,
    });

    return session?.user ?? null;
  } catch (error) {
    console.error("Error retrieving user session:", error);
    return null;
  }
};