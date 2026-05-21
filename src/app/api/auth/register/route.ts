import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/server";
import { hashPassword } from "@/lib/auth/password";
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

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters long." },
        { status: 400 },
      );
    }

    const hashedPassword = hashPassword(password);
    const db = getSupabaseServer();

    // Check if user exists
    const { data: existing } = await db
      .from("users")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        { error: "A user with this email already exists." },
        { status: 400 },
      );
    }

    // Insert user
    const { data: user, error: insertError } = await db
      .from("users")
      .insert({ email, password_hash: hashedPassword })
      .select("id, email")
      .single();

    if (insertError || !user) {
      throw new Error(`Failed to create user: ${insertError?.message}`);
    }

    // Create session
    await createSession(user.id);

    return NextResponse.json({ user }, { status: 201 });
  } catch (error) {
    console.error("[register]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
