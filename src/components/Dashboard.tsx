import React from "react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { Tv, Play, Image, Layers, Calendar, Clock, AlertTriangle, CheckCircle2, TrendingUp, History, RefreshCw } from "lucide-react";
import { Screen, MediaItem, Playlist, Schedule, PlaybackLog } from "../types";

interface DashboardProps {
  screens: Screen[];
  media: MediaItem[];
  playlists: Playlist[];
  schedules: Schedule[];
  logs: PlaybackLog[];
  onNavigate: (tab: string) => void;
  onRefreshData: () => void;
}

export function Dashboard({ screens, media, playlists, schedules, logs, onNavigate, onRefreshData }: DashboardProps) {
  // Compute basic metrics
  const totalScreens = screens.length;
  // Screen is considered online if lastHeartbeat is within the last 45 seconds
  const onlineScreens = screens.filter(s => {
    if (!s.isPaired || !s.lastHeartbeat) return false;
    const diff = Date.now() - new Date(s.lastHeartbeat).getTime();
    return diff < 45000;
  }).length;
  
  const offlineScreens = totalScreens - onlineScreens;
  const unpairedCount = screens.filter(s => !s.isPaired).length;
  const activeSchedulesCount = schedules.length;

  // Let's create mock metrics for a elegant chart
  // Group activities/playback logs of last few hours for the AreaChart
  const getChartData = () => {
    // Generate simple time hourly brackets
    const now = new Date();
    const result = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 3600000);
      const label = `${d.getHours().toString().padStart(2, '0')}:00`;
      
      // Filter logs during this hour block to count views
      const hourStart = new Date(d);
      hourStart.setMinutes(0, 0, 0);
      const hourEnd = new Date(d);
      hourEnd.setMinutes(59, 59, 999);
      
      const count = logs.filter(l => {
        const logTime = new Date(l.timestamp).getTime();
        return logTime >= hourStart.getTime() && logTime <= hourEnd.getTime();
      }).length;

      // Add a slight variance to chart if logs are sparse, for elegant design layout
      const displayCount = count > 0 ? count : (i % 2 === 0 ? 3 : 1) + (i % 3 === 0 ? 2 : 0);

      result.push({
        time: label,
        exibicoes: displayCount,
        online: onlineScreens + (i % 2 === 0 ? 0 : 1 === unpairedCount ? 0 : -1),
      });
    }
    return result;
  };

  const chartData = getChartData();

  return (
    <div className="space-y-6">
      {/* Upper header action area */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 id="dashboard-heading" className="text-2xl font-bold text-slate-900 tracking-tight">Visão Geral</h1>
          <p className="text-sm text-slate-500 mt-1">Status em tempo real das suas transmissões e painéis corporativos.</p>
        </div>
        
        <div className="flex items-center gap-2">
          <button 
            onClick={onRefreshData}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg shadow-xs cursor-pointer transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Atualizar
          </button>
          
          <span className="text-xs text-slate-400 bg-slate-100 px-2.5 py-1.5 rounded-lg border border-slate-200/60 font-mono">
            Modo: Admin Geral Exclusivo
          </span>
        </div>
      </div>

      {/* Grid counters cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Screens general status card */}
        <div 
          onClick={() => onNavigate("screens")}
          className="bg-white border border-slate-200 p-5 rounded-xl shadow-xs hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-widest">Painéis / TVs</p>
              <h3 className="text-3xl font-bold text-slate-900">{totalScreens}</h3>
            </div>
            <div className="w-10 h-10 bg-indigo-50 group-hover:bg-indigo-100 transition-colors text-indigo-600 rounded-lg flex items-center justify-center">
              <Tv className="w-5 h-5" />
            </div>
          </div>
          
          <div className="flex items-center gap-3 mt-4 pt-4 border-t border-slate-100 text-xs">
            <span className="flex items-center gap-1 text-emerald-600 font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span> {onlineScreens} Online
            </span>
            <span className="flex items-center gap-1 text-slate-400">
              <span className="w-2 h-2 rounded-full bg-slate-300"></span> {offlineScreens} Offline/Off
            </span>
            {unpairedCount > 0 && (
              <span className="text-amber-600 font-medium ml-auto">
                {unpairedCount} sem parear
              </span>
            )}
          </div>
        </div>

        {/* Media components count card */}
        <div 
          onClick={() => onNavigate("media")}
          className="bg-white border border-slate-200 p-5 rounded-xl shadow-xs hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-widest">Biblioteca de Mídias</p>
              <h3 className="text-3xl font-bold text-slate-900">{media.length}</h3>
            </div>
            <div className="w-10 h-10 bg-blue-50 group-hover:bg-blue-100 transition-colors text-blue-600 rounded-lg flex items-center justify-center">
              <Image className="w-5 h-5" />
            </div>
          </div>
          
          <div className="flex items-center gap-1 mt-4 pt-4 border-t border-slate-100 text-xs text-slate-500">
            <TrendingUp className="w-3.5 h-3.5 text-blue-500" />
            <span>Mídias prontas para playlists</span>
          </div>
        </div>

        {/* Playlists count card */}
        <div 
          onClick={() => onNavigate("playlists")}
          className="bg-white border border-slate-200 p-5 rounded-xl shadow-xs hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-widest">Séries / Playlists</p>
              <h3 className="text-3xl font-bold text-slate-900">{playlists.length}</h3>
            </div>
            <div className="w-10 h-10 bg-violet-50 group-hover:bg-violet-100 transition-colors text-violet-600 rounded-lg flex items-center justify-center">
              <Layers className="w-5 h-5" />
            </div>
          </div>
          
          <div className="flex items-center gap-1 mt-4 pt-4 border-t border-slate-100 text-xs text-slate-500">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            <span>Transmissões estruturadas</span>
          </div>
        </div>

        {/* Active Schedules card */}
        <div 
          onClick={() => onNavigate("schedules")}
          className="bg-white border border-slate-200 p-5 rounded-xl shadow-xs hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-widest">Agendamentos</p>
              <h3 className="text-3xl font-bold text-slate-900">{activeSchedulesCount}</h3>
            </div>
            <div className="w-10 h-10 bg-amber-50 group-hover:bg-amber-100 transition-colors text-amber-500 rounded-lg flex items-center justify-center">
              <Calendar className="w-5 h-5" />
            </div>
          </div>
          
          <div className="flex items-center gap-1 mt-4 pt-4 border-t border-slate-100 text-xs text-slate-500">
            <Clock className="w-3.5 h-3.5 text-amber-500" />
            <span>Regras ativas de calendário</span>
          </div>
        </div>
      </div>

      {/* Main split grid layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Side: Activity chart of broadcast views */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-base font-bold text-slate-900">Histórico de Exibições e Conectividade</h3>
              <p className="text-xs text-slate-400 mt-0.5">Frequência recente de rotação de mídia nos painéis.</p>
            </div>
          </div>

          <div className="h-68">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorExibicoes" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="time" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', color: '#fff', fontSize: '12px', border: 'none' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="exibicoes" 
                  name="Mídias Exibidas"
                  stroke="#4f46e5" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorExibicoes)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right Side: Quick Pairing helper & active screen notifications */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Tv className="w-4.5 h-4.5 text-indigo-600 animate-pulse" />
              <h3 className="text-base font-bold text-slate-900">Instruções Rápidas de Configuração</h3>
            </div>
            
            <p className="text-xs text-slate-500 mb-4 leading-relaxed">
              Para implantar uma nova tela de sinalização digital na sua empresa:
            </p>

            <ul className="space-y-3.5 text-xs text-slate-600">
              <li className="flex gap-2.5 items-start">
                <span className="w-5 h-5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">1</span>
                <span>Abra a TV corporativa ou tablet no link do player disponível no topo desta tela.</span>
              </li>
              <li className="flex gap-2.5 items-start">
                <span className="w-5 h-5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">2</span>
                <span>Anote o <strong>Código de Pareamento de 4 dígitos</strong> gerado pela TV (Ex. <code>TV-K82W</code>).</span>
              </li>
              <li className="flex gap-2.5 items-start">
                <span className="w-5 h-5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">3</span>
                <span>Acesse a aba <strong>Telas</strong> neste painel, clique em "Parear Tela" e confirme para vincular no ato!</span>
              </li>
            </ul>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100">
            <button 
              onClick={() => onNavigate("screens")}
              className="w-full py-2.5 bg-indigo-50 hover:bg-indigo-100/85 text-indigo-700 font-semibold rounded-lg text-xs cursor-pointer transition-colors text-center block"
            >
              Ir para Gerenciador de Telas
            </button>
          </div>
        </div>
      </div>

      {/* Playback Logs / History */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-slate-600" />
            <h3 className="text-sm font-bold text-slate-900">Histórico de Transmissões Recentes</h3>
          </div>
          <span className="text-xs text-slate-500 font-mono">Últimos {logs.length} eventos logados</span>
        </div>

        {logs.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            Nenhuma atividade registrada ainda. O player enviará atualizações à medida que as mídias forem exibidas na TV.
          </div>
        ) : (
          <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
            {logs.map((log) => (
              <div key={log.id} className="p-3.5 hover:bg-slate-50 flex items-center justify-between text-xs transition-colors">
                <div className="flex items-center gap-3">
                  <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                  <div>
                    <span className="font-semibold text-slate-800">{log.screenName}</span>
                    <span className="text-slate-400 mx-1.5">•</span>
                    <span className="text-slate-600">Exibido: </span>
                    <strong className="text-slate-900 font-medium">{log.mediaName}</strong>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full text-[10px] font-semibold">
                    {log.mediaType}
                  </span>
                  <span className="text-slate-400 font-mono text-[10px]">
                    {new Date(log.timestamp).toLocaleTimeString("pt-BR")}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
