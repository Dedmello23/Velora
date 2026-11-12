import { NextResponse } from "next/server";

export const runtime = "nodejs";

/** GET /api/health  -> shows which settings are missing (never shows the values). */
export async function GET() {
  // GROQ_MODEL is optional (it has a default), so it is not checked here.
  const names = ["GROQ_API_KEY", "SUPABASE_URL", "SUPABASE_SECRET_KEY", "APP_PASSCODE"];
  const settings = Object.fromEntries(names.map((n) => [n, Boolean(process.env[n]?.trim())]));
  return NextResponse.json({ ok: Object.values(settings).every(Boolean), settings });
}
