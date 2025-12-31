"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { FiUser, FiLock, FiChevronLeft } from "react-icons/fi";
import Link from "next/link";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login(username, password);
    } catch (err: any) {
      setError(err.message || "Login gagal. Periksa username dan password Anda.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#0f172a] text-gray-100 p-6 relative overflow-hidden">

      {/* Background Ambience */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#1e3a5f]/20 rounded-full blur-[100px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#2c5282]/20 rounded-full blur-[100px]" />
      </div>



      {/* Main Content */}
      <div className="w-full max-w-[400px] flex flex-col items-center animate-scale-in relative z-10">

        {/* Logo Icon */}
        <div className="w-16 h-16 rounded-[2rem] bg-gradient-to-tr from-[#1e3a5f] to-[#2c5282] flex items-center justify-center mb-8 shadow-2xl shadow-[#1e3a5f]/30 ring-1 ring-white/10">
          <FiLock className="w-6 h-6 text-white" />
        </div>

        {/* Headings */}
        <h1 className="text-3xl font-bold mb-3 tracking-tight text-center text-white">
          Selamat Datang
        </h1>
        <p className="text-slate-400 text-sm mb-10 text-center">
          Masuk untuk mengelola sistem gadai
        </p>

        {/* Form */}
        <form onSubmit={handleSubmit} className="w-full space-y-4">
          <div className="space-y-4">
            <div className="group">
              <input
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="w-full bg-[#1e293b] border border-[#334155] focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37] rounded-xl px-4 py-3.5 text-sm text-white placeholder-slate-500 transition-all outline-none"
              />
            </div>

            <div className="group">
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-[#1e293b] border border-[#334155] focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37] rounded-xl px-4 py-3.5 text-sm text-white placeholder-slate-500 transition-all outline-none"
              />
            </div>
          </div>

          {error && (
            <div className="text-red-400 text-xs text-center mt-2 bg-red-900/10 py-2 rounded-lg border border-red-900/20">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-white hover:bg-slate-100 text-[#0f172a] font-bold h-12 rounded-full transition-all transform active:scale-[0.98] mt-6 disabled:opacity-70 disabled:cursor-not-allowed shadow-lg"
          >
            {loading ? "Menandatangani..." : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
