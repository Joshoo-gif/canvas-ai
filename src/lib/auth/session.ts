import { cookies } from "next/headers";
import { getSupabaseServer } from "@/lib/supabase/server";

const SESSION_COOKIE_NAME = "canvas_session";

/**
 * We use the Web Crypto API to hash the session token so this code
 * can run in Next.js Edge Middleware without Node.js dependencies.
 */
async function hashToken(token: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function createSession(userId: string): Promise<void> {
  // Generate a random 32-byte opaque token (64 hex chars)
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  const token = Array.from(array)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  const tokenHash = await hashToken(token);
  // Session expires in 30 days
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30);

  const db = getSupabaseServer();
  const { error } = await db.from("sessions").insert({
    user_id: userId,
    token_hash: tokenHash,
    expires_at: expiresAt.toISOString(),
  });

  if (error) {
    throw new Error(`Failed to create session: ${error.message}`);
  }

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    expires: expiresAt,
    path: "/",
  });
}

export async function clearSession(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (token) {
    const tokenHash = await hashToken(token);
    const db = getSupabaseServer();
    await db.from("sessions").delete().eq("token_hash", tokenHash);
  }

  cookieStore.delete(SESSION_COOKIE_NAME);
}

export async function getSessionUserId(): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;

  const tokenHash = await hashToken(token);
  const db = getSupabaseServer();
  const { data, error } = await db
    .from("sessions")
    .select("user_id, expires_at")
    .eq("token_hash", tokenHash)
    .single();

  if (error || !data) return null;

  if (new Date(data.expires_at) < new Date()) {
    // Expired
    await db.from("sessions").delete().eq("token_hash", tokenHash);
    return null;
  }

  return data.user_id;
}
