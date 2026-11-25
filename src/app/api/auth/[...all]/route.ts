import { auth } from "@/lib/auth"; // path to your auth file
import { ensureDbConnected } from "@/lib/db/mongodb";
import { toNextJsHandler } from "better-auth/next-js";

const handler = toNextJsHandler(auth);

export async function GET(req: Request) {
  await ensureDbConnected();
  return handler.GET(req);
}

export async function POST(req: Request) {
  await ensureDbConnected();
  return handler.POST(req);
}