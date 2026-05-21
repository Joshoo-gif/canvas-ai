import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/server";
import { verifyPassword } from "@/lib/auth/password";
import { createSession } from "@/lib/auth/session";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required." },
        { status: 400 },
      );
    }

    const db = getSupabaseServer();
    const { data: user } = await db
      .from("users")
      .select("id, email, password_hash")
      .eq("email", email)
      .maybeSingle();

    if (!user || !verifyPassword(password, user.password_hash)) {
      return NextResponse.json(
        { error: "Invalid email or password." },
        { status: 401 },
      );
    }

    // Create session
    await createSession(user.id);

    return NextResponse.json(
      { user: { id: user.id, email: user.email } },
      { status: 200 },
    );
  } catch (error) {
    console.error("[login]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
