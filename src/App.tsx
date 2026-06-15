import React, { useState, useEffect } from "react";
import { AdminLogin } from "./components/AdminLogin";
import { Dashboard } from "./components/Dashboard";
import { ScreensManager } from "./components/ScreensManager";
import { MediaLibrary } from "./components/MediaLibrary";
import { PlaylistsManager } from "./components/PlaylistsManager";
import { SchedulesManager } from "./components/SchedulesManager";
import { ReportsPanel } from "./components/ReportsPanel";
import { TVPlayer } from "./components/TVPlayer";
import { Screen, MediaItem, Playlist, Schedule, PlaybackLog, DashboardWidget } from "./types";
import { 
  Tv, Layers, Calendar, Image, BarChart3, LogOut, Terminal, ShieldAlert,
  Server, HelpCircle, ArrowRight, BookOpen, AlertCircle, RefreshCw
} from "lucide-react";

export default function App() {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("ds_admin_token"));
  const [currentTab, setCurrentTab] = useState<string>("dashboard");
  const [isPlayerActive, setIsPlayerActive] = useState<boolean>(false);

  // Core system database states
  const [screens, setScreens] = useState<Screen[]>([]);
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [logs, setLogs] = useState<PlaybackLog[]>([]);

  // Page level error states
  const [sessionError, setSessionError] = useState<string | null>(null);

  useEffect(() => {
    // If we have "player=1" or similar in URL query params, start as simulated player instantly!
    const query = new URLSearchParams(window.location.search);
    if (query.get("player") === "1" || query.get("mode") === "player") {
      setIsPlayerActive(true);
    }
  }, []);

  // Fetch all db variables from server APIs
  const refreshDatabase = async () => {
    if (!token) return;

    try {
      const headers = { "Authorization": `Bearer ${token}` };
      
      const [screensRes, mediaRes, playlistsRes, schedulesRes, logsRes] = await Promise.all([
        fetch("/api/screens", { headers }),
        fetch("/api/media", { headers }),
        fetch("/api/playlists", { headers }),
        fetch("/api/schedules", { headers }),
        fetch("/api/logs", { headers })
      ]);

      // If session is expired or token invalid, flush session
      if (screensRes.status === 401 || screensRes.status === 403) {
        handleLogout();
        setSessionError("Sua sessão administrativa expirou. Logue novamente.");
        return;
      }

      const screensData = await screensRes.json();
      const mediaData = await mediaRes.json();
      const playlistsData = await playlistsRes.json();
      const schedulesData = await schedulesRes.json();
      const logsData = await logsRes.json();

      setScreens(Array.isArray(screensData) ? screensData : []);
      setMedia(Array.isArray(mediaData) ? mediaData : []);
      setPlaylists(Array.isArray(playlistsData) ? playlistsData : []);
      setSchedules(Array.isArray(schedulesData) ? schedulesData : []);
      setLogs(Array.isArray(logsData) ? logsData : []);

    } catch (err) {
      console.error("Critical error sync with server API", err);
    }
  };

  useEffect(() => {
    if (token) {
      refreshDatabase();
      // Periodically refresh monitors lists in background for online/offline heartbeats (every 10s)
      const interval = setInterval(refreshDatabase, 10000);
      return () => clearInterval(interval);
    }
  }, [token]);

  const handleLoginSuccess = (receivedToken: string, user: any) => {
    localStorage.setItem("ds_admin_token", receivedToken);
    setToken(receivedToken);
    setSessionError(null);
  };

  const handleLogout = () => {
    localStorage.removeItem("ds_admin_token");
    setToken(null);
    setScreens([]);
    setMedia([]);
    setPlaylists([]);
    setSchedules([]);
    setLogs([]);
  };

  /**
   * SCREEN CONTROLLERS
   */
  const handleAddScreen = async (name: string, location: string, notes: string, currentPlaylistId?: string) => {
    const response = await fetch("/api/screens", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ name, location, notes, currentPlaylistId })
    });
    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || "Erro ao adicionar tela.");
    }
    refreshDatabase();
  };

  const handleUpdateScreen = async (id: string, updates: Partial<Screen>) => {
    const response = await fetch(`/api/screens/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify(updates)
    });
    if (!response.ok) throw new Error("Erro ao modificar parâmetros da TV.");
    refreshDatabase();
  };

  const handlePairWithCode = async (code: string, name: string, location: string, notes: string, currentPlaylistId?: string) => {
    const response = await fetch("/api/screens/pair-with-code", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ code, name, location, notes, currentPlaylistId })
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "Pareamento mal-sucedido.");
    }
    refreshDatabase();
    return true;
  };

  const handleDeleteScreen = async (id: string) => {
    const response = await fetch(`/api/screens/${id}`, {
      method: "DELETE",
      headers: { "Authorization": `Bearer ${token}` }
    });
    if (!response.ok) throw new Error("Não foi possível excluir a TV.");
    refreshDatabase();
  };

  /**
   * MEDIA CONTROLLERS
   */
  const handleUploadFile = async (name: string, type: 'image' | 'video' | 'pdf', base64Data: string, filename: string) => {
    const response = await fetch("/api/media/upload", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ name, type, base64Data, filename })
    });
    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || "Upload falhou.");
    }
    refreshDatabase();
  };

  const handleAddExternalLink = async (name: string, type: 'image' | 'video' | 'pdf' | 'link' | 'html', url: string, duration: number) => {
    const response = await fetch("/api/media", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ name, type, url, duration })
    });
    if (!response.ok) throw new Error("Erro ao salvar referência externa de link.");
    refreshDatabase();
  };

  const handleSaveDashboard = async (name: string, widgets: DashboardWidget[], duration: number) => {
    const response = await fetch("/api/media", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({
        name,
        type: "dashboard",
        url: "dashboard-layout",
        duration,
        dashboardWidgets: widgets
      })
    });
    if (!response.ok) throw new Error("Erro ao salvar dashboard customizado.");
    refreshDatabase();
  };

  const handleSaveFeed = async (name: string, category: string, duration: number) => {
    const response = await fetch("/api/media", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({
        name,
        type: "feed",
        url: "feed-layout",
        duration,
        feedCategory: category
      })
    });
    if (!response.ok) throw new Error("Erro ao salvar feed de notícias.");
    refreshDatabase();
  };

  const handleDeleteMedia = async (id: string) => {
    const response = await fetch(`/api/media/${id}`, {
      method: "DELETE",
      headers: { "Authorization": `Bearer ${token}` }
    });
    if (!response.ok) throw new Error("Não foi possível remover o arquivo de mídia.");
    refreshDatabase();
  };

  /**
   * PLAYLIST CONTROLLERS
   */
  const handleCreatePlaylist = async (name: string, description: string, items: any[]) => {
    const response = await fetch("/api/playlists", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ name, description, items })
    });
    if (!response.ok) throw new Error("Erro ao criar playlist.");
    refreshDatabase();
  };

  const handleUpdatePlaylist = async (id: string, updates: Partial<Playlist>) => {
    const response = await fetch(`/api/playlists/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify(updates)
    });
    if (!response.ok) throw new Error("Erro ao salvar alterações da playlist.");
    refreshDatabase();
  };

  const handleDeletePlaylist = async (id: string) => {
    const response = await fetch(`/api/playlists/${id}`, {
      method: "DELETE",
      headers: { "Authorization": `Bearer ${token}` }
    });
    if (!response.ok) throw new Error("Remoção de playlist negada pelo servidor.");
    refreshDatabase();
  };

  /**
   * SCHEDULER CONTROLLERS
   */
  const handleCreateSchedule = async (data: any) => {
    const response = await fetch("/api/schedules", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error("Falha ao registrar agendamento.");
    refreshDatabase();
  };

  const handleUpdateSchedule = async (id: string, updates: Partial<Schedule>) => {
    const response = await fetch(`/api/schedules/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify(updates)
    });
    if (!response.ok) throw new Error("Falha ao atualizar parâmetros de agendamento.");
    refreshDatabase();
  };

  const handleDeleteSchedule = async (id: string) => {
    const response = await fetch(`/api/schedules/${id}`, {
      method: "DELETE",
      headers: { "Authorization": `Bearer ${token}` }
    });
    if (!response.ok) throw new Error("Não foi possível apagar esta regra da grade.");
    refreshDatabase();
  };

  // If Simulated TV player mode is selected/triggered
  if (isPlayerActive) {
    return (
      <TVPlayer 
        onBackToAdmin={() => {
          setIsPlayerActive(false);
          // Strip "player" parameters from URL nicely
          window.history.pushState({}, "", "/");
        }} 
      />
    );
  }

  // Not logged in -> admin login page
  if (!token) {
    return (
      <div className="min-h-screen flex flex-col justify-between">
        <AdminLogin onLoginSuccess={handleLoginSuccess} />
        {sessionError && (
          <div className="fixed bottom-4 right-4 bg-amber-600 text-white px-4 py-2 text-xs rounded-lg shadow-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            <span>{sessionError}</span>
          </div>
        )}
      </div>
    );
  }

  // Main system layouts routing panel
  const renderTabContent = () => {
    switch (currentTab) {
      case "dashboard":
        return (
          <Dashboard 
            screens={screens} 
            media={media} 
            playlists={playlists} 
            schedules={schedules} 
            logs={logs}
            onNavigate={(tab) => setCurrentTab(tab)}
            onRefreshData={refreshDatabase}
          />
        );
      case "screens":
        return (
          <ScreensManager 
            screens={screens} 
            playlists={playlists}
            media={media}
            onAddScreen={handleAddScreen}
            onUpdateScreen={handleUpdateScreen}
            onDeleteScreen={handleDeleteScreen}
            onPairWithCode={handlePairWithCode}
          />
        );
      case "media":
        return (
          <MediaLibrary 
            media={media} 
            onUploadFile={handleUploadFile}
            onAddExternalLink={handleAddExternalLink}
            onDeleteMedia={handleDeleteMedia}
            onSaveDashboard={handleSaveDashboard}
            onSaveFeed={handleSaveFeed}
          />
        );
      case "playlists":
        return (
          <PlaylistsManager 
            playlists={playlists} 
            media={media} 
            onCreatePlaylist={handleCreatePlaylist}
            onUpdatePlaylist={handleUpdatePlaylist}
            onDeletePlaylist={handleDeletePlaylist}
          />
        );
      case "schedules":
        return (
          <SchedulesManager 
            schedules={schedules} 
            playlists={playlists} 
            screens={screens}
            media={media}
            onCreateSchedule={handleCreateSchedule}
            onUpdateSchedule={handleUpdateSchedule}
            onDeleteSchedule={handleDeleteSchedule}
          />
        );
      case "reports":
        return <ReportsPanel screens={screens} media={media} logs={logs} />;
      default:
        return <div className="text-left py-12 text-slate-400 text-xs">Exibição de aba inválida.</div>;
    }
  };

  const navItems = [
    { id: "dashboard", label: "Visão Geral", icon: BarChart3 },
    { id: "screens", label: "Telas & Pareamento", icon: Tv },
    { id: "media", label: "Biblioteca de Mídia", icon: Image },
    { id: "playlists", label: "Listas (Playlists)", icon: Layers },
    { id: "schedules", label: "Grade Agendada", icon: Calendar },
    { id: "reports", label: "Relatórios", icon: BarChart3 }
  ];

  return (
    <div className="min-h-screen bg-slate-900 border-none flex flex-col font-sans">
      
      {/* Top Main Navigation Header Bar */}
      <header className="bg-slate-950/80 backdrop-blur-xl border-b border-slate-800 text-white py-4 px-6 sticky top-0 z-40 transition-all flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 bg-gradient-to-tr from-indigo-600 to-indigo-500 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-600/15">
            <Terminal className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-sm font-black tracking-tight flex items-center gap-1.5 uppercase">
              Digital Signage Core <span className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 text-[9px] font-bold px-1.5 py-0.5 rounded font-mono">Admin</span>
            </h2>
            <p className="text-[10px] text-slate-400 font-mono tracking-relaxed text-left">ESTAÇÃO DE SINALIZAÇÃO INTERNA E MULTIMÍDIA</p>
          </div>
        </div>

        {/* Global actions bar */}
        <div className="flex items-center gap-3">
          
          {/* Action to trigger simulated smart TV player */}
          <button 
            onClick={() => {
              // open player simulation in this tab instantly!
              setIsPlayerActive(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg text-xs cursor-pointer transition-all shadow-md shadow-indigo-600/10"
            title="Abre o player para simular uma TV física que pode ser vinculada de imediato"
          >
            <Tv className="w-3.5 h-3.5" /> Abrir Simulador de TV (Player)
          </button>

          <div className="h-5 w-px bg-slate-800"></div>

          {/* User badge */}
          <div className="hidden lg:flex flex-col text-right">
            <span className="text-[11px] font-bold text-slate-300">Administrador Geral</span>
            <span className="text-[9px] font-mono text-emerald-400">Acesso único liberado</span>
          </div>

          <button 
            onClick={handleLogout}
            className="p-1.5 hover:bg-slate-800 border-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer"
            title="Sair do painel de administração"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main split dashboard wrapper */}
      <div className="flex-1 flex flex-col md:flex-row relative">
        {/* Left Responsive Navigation Sidebar */}
        <aside className="w-full md:w-64 bg-slate-950/45 md:bg-slate-950/60 md:border-r border-slate-100/10 p-5 shrink-0 flex flex-col justify-between py-6">
          <div className="space-y-6">
            <div>
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block mb-3 font-mono">Painel Administrativo</span>
              <nav className="space-y-1">
                {navItems.map(item => {
                  const Icon = item.icon;
                  const isActive = currentTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setCurrentTab(item.id)}
                      className={`w-full p-2.5 rounded-lg text-left text-xs font-semibold flex items-center gap-2.5 cursor-pointer transition-colors ${
                        isActive 
                        ? "bg-slate-800/80 text-white border border-slate-700/60 font-bold shadow-inner" 
                        : "text-slate-400 hover:text-slate-100 hover:bg-slate-900/60 border border-transparent"
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${isActive ? "text-indigo-400" : "text-slate-500"}`} />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Quick references guidelines */}
            <div className="hidden md:block pt-5 border-t border-slate-800/80">
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block mb-2 font-mono">Suporte ao Admin</span>
              <div className="bg-slate-900/80 border border-slate-800/40 rounded-xl p-3 text-left space-y-2">
                <span className="text-[10px] font-mono text-slate-400 block leading-normal">
                  Este sistema implementa controle remoto em tempo real. As TVs que exibem o player em sua rede mudam de mídia de acordo com seus agendamentos automaticamente.
                </span>
                <span className="text-[9px] font-bold text-indigo-400 uppercase tracking-wider block">Estável • Sem Limite de Telas</span>
              </div>
            </div>
          </div>

          <div className="hidden md:block pt-4 border-t border-slate-800 text-[10px] text-slate-500 font-mono text-left">
            <p>Servidor Oficial Ativo</p>
            <p className="text-slate-600 mt-1">Sinalização Digital v1.2.0</p>
          </div>
        </aside>

        {/* Central main content pane wrapper */}
        <main className="flex-1 bg-slate-50 p-6 md:p-8 overflow-y-auto">
          {renderTabContent()}
        </main>
      </div>
    </div>
  );
}
