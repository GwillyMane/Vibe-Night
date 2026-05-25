import { NextResponse } from "next/server";
import { dbAvailable, ensureTables } from "@/lib/db";
import { getCurrentUserFromRequest } from "@/lib/session";

export const runtime = "nodejs";

export async function GET(request: Request) {
  if (!dbAvailable()) {
    return NextResponse.json({ user: null, db: false });
  }
  try {
    await ensureTables();
  } catch {
    return NextResponse.json({ user: null, db: false });
  }
  const user = await getCurrentUserFromRequest(request);
  return NextResponse.json({ user, db: true });
}
