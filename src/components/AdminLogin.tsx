import React, { useState } from "react";
import { Lock, User, Terminal, CheckCircle2, AlertCircle } from "lucide-react";
import { motion } from "motion/react";

interface AdminLoginProps {
  onLoginSuccess: (token: string, user: { username: string; role: string }) => void;
}

export function AdminLogin({ onLoginSuccess }: AdminLoginProps) {
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("admin123");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    setErrorMessage("");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Algo deu errado durante o login.");
      }

      setStatus("success");
      // Let success transition animate slightly before callback
      setTimeout(() => {
        onLoginSuccess(data.token, data.user);
      }, 700);
    } catch (err: any) {
      console.error(err);
      setStatus("error");
      setErrorMessage(err.message || "Senha ou usuário incorreto.");
    }
  };

  return (
    <div id="login-container" className="min-h-screen bg-slate-900 flex flex-col justify-center items-center px-4 relative overflow-hidden">
      {/* Decorative backdrop elements */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-violet-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md bg-slate-950/80 backdrop-blur-xl border border-slate-800 rounded-2xl p-8 shadow-2xl z-10"
      >
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20 mb-4 ring-4 ring-slate-900/50">
            <Terminal className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Sinalização Corporativa</h1>
          <p className="text-sm text-slate-400 mt-1">Acesso único de Administrador Geral</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-medium text-slate-300 uppercase tracking-wider mb-2">Usuário</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                <User className="w-4 h-4" />
              </span>
              <input
                id="login-username"
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-900 border border-slate-700 text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-sm placeholder:text-slate-500"
                placeholder="Ex. admin"
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-xs font-medium text-slate-300 uppercase tracking-wider">Senha do Sistema</label>
            </div>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                <Lock className="w-4 h-4" />
              </span>
              <input
                id="login-password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-900 border border-slate-700 text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-sm placeholder:text-slate-500"
                placeholder="******"
              />
            </div>
          </div>

          {status === "error" && (
            <div className="bg-rose-950/40 border border-rose-800 text-rose-200 text-xs rounded-lg p-3.5 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {status === "success" && (
            <div className="bg-emerald-950/40 border border-emerald-800 text-emerald-200 text-xs rounded-lg p-3.5 flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>Sucesso! Carregando painel de gerenciamento...</span>
            </div>
          )}

          <button
            id="login-submit-btn"
            type="submit"
            disabled={status === "loading" || status === "success"}
            className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed text-white font-medium text-sm rounded-lg shadow-lg hover:shadow-indigo-500/20 transition-all flex justify-center items-center"
          >
            {status === "loading" ? (
              <div className="w-5 h-5 border-2 border-slate-300 border-t-white rounded-full animate-spin"></div>
            ) : status === "success" ? (
              "Bem-vindo!"
            ) : (
              "Entrar no Painel"
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-800 text-center">
          <p className="text-[11px] text-slate-500 leading-relaxed font-mono">
            Ambiente Demonstrativo Seguro <br />
            <span className="text-slate-400">Usuário do Admin: admin</span> | <span className="text-slate-400">Senha: admin123</span>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
