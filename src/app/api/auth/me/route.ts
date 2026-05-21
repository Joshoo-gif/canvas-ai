import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/auth/session";
import { getSupabaseServer } from "@/lib/supabase/server";

export const runtime = "edge";

export async function GET() {
  const userId = await getSessionUserId();
  
  if (!userId) {
    return NextResponse.json({ user: null });
  }

  const db = getSupabaseServer();
  const { data: user } = await db
    .from("users")
    .select("id, email")
    .eq("id", userId)
    .maybeSingle();

  return NextResponse.json({ user: user ?? null });
}
