"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Folder, ArrowRight, Loader2 } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (res.ok) {
        router.push("/");
        router.refresh();
      } else {
        const data = await res.json();
        setError(data.error || "Failed to register.");
      }
    } catch {
      setError("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#F5F5F4]">
      <div className="w-full max-w-sm px-4">
        {/* Logo */}
        <div className="flex items-center gap-2.5 mb-10">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0A0A0A]">
            <Folder className="h-4 w-4 text-white" />
          </div>
          <span className="text-[15px] font-semibold tracking-tight text-[#0A0A0A]">Canvas</span>
        </div>

        {/* Heading */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold tracking-tight text-[#0A0A0A] mb-1.5">Create account</h1>
          <p className="text-sm text-[#737373]">Get started with your workspace today.</p>
        </div>

        {/* Form */}
        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label htmlFor="register-email" className="block text-xs font-medium text-[#404040] mb-1.5">
              Email address
            </label>
            <input
              id="register-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-white border border-[#E7E5E4] rounded-lg px-3 py-2.5 text-sm text-[#0A0A0A] placeholder:text-[#A8A29E] outline-none focus:border-[#0A0A0A] transition-colors"
              placeholder="you@example.com"
              required
            />
          </div>

          <div>
            <label htmlFor="register-password" className="block text-xs font-medium text-[#404040] mb-1.5">
              Password
            </label>
            <input
              id="register-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-white border border-[#E7E5E4] rounded-lg px-3 py-2.5 text-sm text-[#0A0A0A] placeholder:text-[#A8A29E] outline-none focus:border-[#0A0A0A] transition-colors"
              placeholder="Minimum 8 characters"
              required
              minLength={8}
            />
            <p className="mt-1.5 text-[11px] text-[#A8A29E]">Must be at least 8 characters long.</p>
          </div>

          {error && (
            <div className="px-3 py-2.5 bg-white border border-[#E7E5E4] rounded-lg text-sm">
              <span className="text-red-500">{error}</span>
            </div>
          )}

          <button
            type="submit"
            id="register-submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-[#0A0A0A] text-white text-sm font-medium py-2.5 rounded-lg hover:bg-[#404040] transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-2"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <span>Create account</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-[#E7E5E4]">
          <p className="text-sm text-[#737373]">
            Already have an account?{" "}
            <Link href="/login" className="text-[#0A0A0A] font-medium hover:text-[#404040] transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
