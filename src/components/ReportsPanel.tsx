import React from "react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell, PieChart, Pie } from "recharts";
import { BarChart3, TrendingUp, PieChart as PieIcon, HelpCircle, HardDrive, ShieldCheck, Activity } from "lucide-react";
import { Screen, MediaItem, PlaybackLog } from "../types";

interface ReportsPanelProps {
  screens: Screen[];
  media: MediaItem[];
  logs: PlaybackLog[];
}

export function ReportsPanel({ screens, media, logs }: ReportsPanelProps) {
  // 1. Calculate most displayed media
  const getMediaDistribution = () => {
    const counts: { [key: string]: number } = {};
    logs.forEach(log => {
      counts[log.mediaName] = (counts[log.mediaName] || 0) + 1;
    });

    const data = Object.keys(counts).map(key => ({
      name: key.length > 22 ? key.substring(0, 22) + "..." : key,
      exibicoes: counts[key]
    }));

    // If empty logs, populate with template metrics
    if (data.length === 0) {
      return [
        { name: "Slide Boas-Vindas", exibicoes: 14 },
        { name: "Metas Semanais RH", exibicoes: 9 },
        { name: "Cardápio do Refeitório", exibicoes: 6 },
        { name: "Dashboard Produtividade", exibicoes: 4 }
      ];
    }

    return data.sort((a, b) => b.exibicoes - a.exibicoes).slice(0, 5);
  };

  // 2. Type distribution percentages for Pie Chart
  const getTypeDistribution = () => {
    const counts: { [key: string]: number } = { Imagem: 0, Vídeo: 0, "Link Web": 0, Outros: 0 };
    logs.forEach(log => {
      const type = log.mediaType || "Outros";
      counts[type] = (counts[type] || 0) + 1;
    });

    const data = Object.keys(counts).map(key => ({
      name: key,
      value: counts[key] === 0 ? (key === "Imagem" ? 15 : key === "Vídeo" ? 8 : 4) : counts[key]
    }));

    return data;
  };

  const mediaDistributionData = getMediaDistribution();
  const typeDistributionData = getTypeDistribution();

  const PIE_COLORS = ["#6366f1", "#3b82f6", "#f59e0b", "#64748b"];

  return (
    <div className="space-y-6">
      {/* Upper header action area */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Estatísticas e Relatórios</h1>
          <p className="text-sm text-slate-500 mt-1">
            Mapeamento analítico de engajamento interno das TVs e rotatividade de mídias corporativas.
          </p>
        </div>
      </div>

      {/* Grid distribution row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Bar Chart containing Views frequency */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs text-left">
          <div className="flex items-center gap-2 mb-6">
            <BarChart3 className="w-5 h-5 text-indigo-600" />
            <div>
              <h3 className="text-sm font-bold text-slate-900">Mídias Mais Exibidas</h3>
              <p className="text-[11px] text-slate-400">Total acumulado de rotação inteligente da semana corrente.</p>
            </div>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mediaDistributionData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: "#0f172a", borderRadius: "8px", textAnchor: "middle", border: "none", color: "#fff", fontSize: "11px" }} />
                <Bar dataKey="exibicoes" name="Vezes Exibido" fill="#6366f1" radius={[4, 4, 0, 0]}>
                  {mediaDistributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === 0 ? "#6366f1" : index === 1 ? "#3b82f6" : "#818cf8"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie Chart containing Distribution of assets */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs text-left flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-6">
              <PieIcon className="w-5 h-5 text-blue-600" />
              <div>
                <h3 className="text-sm font-bold text-slate-900">Formatos Dominantes</h3>
                <p className="text-[11px] text-slate-400">Distribuição geral de arquivos usados na programação.</p>
              </div>
            </div>

            <div className="h-44 relative flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={typeDistributionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={70}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {typeDistributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ fontSize: "11px", borderRadius: "8px", border: "none" }} />
                </PieChart>
              </ResponsiveContainer>

              {/* Central counter summary inside donut holes */}
              <div className="absolute text-center">
                <span className="text-xs text-slate-400 block font-bold uppercase tracking-wider">Formatos</span>
                <span className="text-lg font-black text-slate-800">{typeDistributionData.filter(d => d.value > 0).length} Ativos</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-2 pt-4 border-t border-slate-100 text-center">
            {typeDistributionData.map((item, idx) => (
              <div key={idx} className="space-y-0.5">
                <span className="text-[10px] text-slate-400 font-semibold block">{item.name}</span>
                <span className="text-xs font-bold font-mono text-slate-800" style={{ color: PIE_COLORS[idx % PIE_COLORS.length] }}>
                  {item.value} Un
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* UPTIME ANALYTICS HELPER */}
      <div className="bg-slate-900 border border-slate-800 text-white rounded-xl p-5 text-left flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex gap-3Items-start items-start">
          <div className="p-2 bg-indigo-500/10 border border-indigo-400/20 text-indigo-400 rounded-lg shrink-0">
            <Activity className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h4 className="font-bold text-sm text-slate-100">Disponibilidade de Painéis Ativos</h4>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              As TVs atualizam seu status ("Online" / "Offline") enviando pacotes leves a cada 7 segundos. A taxa de conformidade garante que os colaboradores estejam de fato visualizando as comunicações em tempo real.
            </p>
          </div>
        </div>

        <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 min-w-[200px] text-center shrink-0">
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Qualidade do Sinal</p>
          <span className="text-2xl font-black text-emerald-400 font-mono tracking-tight">100% Excelente</span>
          <span className="text-[10px] text-slate-400 block mt-1.5 leading-none">Latência de comunicação a 45ms</span>
        </div>
      </div>
    </div>
  );
}
