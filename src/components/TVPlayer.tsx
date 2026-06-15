import React, { useState, useEffect, useRef } from "react";
import { Tv, Wifi, WifiOff, RefreshCw, Layers, ArrowLeft, AlertCircle, Play, Pause, ChevronRight, Clock as ClockIcon, CloudSun, Megaphone, Maximize, Minimize } from "lucide-react";
import { PlaylistItem, MediaItem } from "../types";

// Constant live corporate feed categories and headline samples
const sampleNews: Record<string, string[]> = {
  geral: [
    "Nova filial inaugurada com estrutura tecnológica de ponta.",
    "Resultados corporativos do trimestre ganham destaque na mídia nacional.",
    "Programa de certificação ambiental avança com metas superadas.",
    "Dicas de bem-estar: Beba pelo menos 2 litros de água e faça alongamentos."
  ],
  tecnologia: [
    "Equipe de TI conclui migração para servidores de alto desempenho.",
    "Inovações em Inteligência Artificial agilizam atendimento de chamados.",
    "Nova política de senhas corporativas entra em vigor nesta sexta-feira.",
    "Estudo aponta alta de 40% na produtividade com novas ferramentas de nuvem."
  ],
  financas: [
    "Investimentos em automação industrial mostram retorno acima do esperado.",
    "Controladoria apresenta balanço positivo com redução de custos em 12%.",
    "Novos rumos do mercado: Planejamento estratégico foca em expansão sustentável.",
    "Taxas de câmbio favoráveis impulsionam importações de equipamentos médicos."
  ],
  corporativo: [
    "Mural de avisos: Treinamento obrigatório de segurança do trabalho inicia às 14h.",
    "RH Informa: Benefícios de saúde corporativa ganham reajustes positivos.",
    "Campanha de reciclagem no escritório: Colabore descartando resíduos corretamente.",
    "Café com Diretores: Encontro mensal presencial agendado para o próximo dia 20."
  ]
};

interface TVPlayerProps {
  onBackToAdmin: () => void;
  presetCode?: string;
}

export function TVPlayer({ onBackToAdmin, presetCode }: TVPlayerProps) {
  // Check if we are streaming via direct screenId or playlistId query param
  const [liveScreenId] = useState<string | null>(() => {
    const query = new URLSearchParams(window.location.search);
    return query.get("screenId");
  });
  
  const [livePlaylistId] = useState<string | null>(() => {
    const query = new URLSearchParams(window.location.search);
    return query.get("playlistId");
  });

  const [code, setCode] = useState<string>(() => {
    if (presetCode) return presetCode;
    const stored = localStorage.getItem("ds_player_code");
    if (stored) return stored;
    
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let generated = "";
    for (let i = 0; i < 4; i++) {
        generated += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    const finalCode = `TV-${generated}`;
    localStorage.setItem("ds_player_code", finalCode);
    return finalCode;
  });

  const [screenInfo, setScreenInfo] = useState<any>(null);
  const [playlist, setPlaylist] = useState<any>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [currentItemIdx, setCurrentItemIdx] = useState<number>(0);
  const [progress, setProgress] = useState<number>(0); // percentile progress
  const [isOfflineSimulated, setIsOfflineSimulated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorCount, setErrorCount] = useState<number>(0);

  // Fullscreen and Mouse Idle states
  const [showControls, setShowControls] = useState<boolean>(true);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const controlsTimeoutRef = useRef<any>(null);

  // Clock ticks updated inside components for Dashboards
  const [currentDateTime, setCurrentDateTime] = useState<Date>(new Date());

  // Timer refs
  const progressTimerRef = useRef<any>(null);
  const pollingTimerRef = useRef<any>(null);
  const currentItemDurationRef = useRef<number>(10);

  // Mouse idle visibility tracker
  const resetControlsTimeout = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = setTimeout(() => {
      setShowControls(false);
    }, 3000);
  };

  useEffect(() => {
    resetControlsTimeout();

    const handleMouseMove = () => {
      resetControlsTimeout();
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("touchstart", handleMouseMove);

    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("touchstart", handleMouseMove);
    };
  }, []);

  // Fullscreen event listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => {
        setIsFullscreen(true);
      }).catch(err => {
        console.error("Error attempting to enable full-screen mode:", err);
      });
    } else {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false);
      }).catch(err => {
        console.error("Error attempting to exit full-screen mode:", err);
      });
    }
  };

  useEffect(() => {
    const clockTimer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);
    return () => clearInterval(clockTimer);
  }, []);

  // Load from local storage cache initially if using code
  useEffect(() => {
    if (liveScreenId || livePlaylistId) return; // No cache lookup needed for direct screen/playlist stream urls
    const cachedData = localStorage.getItem(`ds_cache_player_${code}`);
    if (cachedData) {
      try {
        const parsed = JSON.parse(cachedData);
        setScreenInfo(parsed.screen);
        setPlaylist(parsed.activePlaylist);
      } catch (e) {
        console.error("Failed to parse cached player state", e);
      }
    }
  }, [code, liveScreenId, livePlaylistId]);

  // Polling server for updates
  useEffect(() => {
    const fetchStatus = async () => {
      if (isOfflineSimulated) return;

      try {
        let fetchUrl = `/api/player-state/code/${code}`;
        if (livePlaylistId) {
          fetchUrl = `/api/player-state/playlist/${livePlaylistId}`;
        } else if (liveScreenId) {
          fetchUrl = `/api/player-state/screen/${liveScreenId}`;
        }

        const res = await fetch(fetchUrl);
        if (!res.ok) throw new Error("Server error");
        const data = await res.json();
        
        setScreenInfo(data.screen);
        setPlaylist(data.activePlaylist);
        setErrorCount(0);

        if (!liveScreenId && !livePlaylistId) {
          // Cache only code-based setups
          localStorage.setItem(`ds_cache_player_${code}`, JSON.stringify(data));
        }
      } catch (err) {
        console.warn("Polling error (simulated or real offline):", err);
        setErrorCount(prev => prev + 1);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStatus(); // First execution
    pollingTimerRef.current = setInterval(fetchStatus, 7000);

    return () => {
      if (pollingTimerRef.current) clearInterval(pollingTimerRef.current);
    };
  }, [code, liveScreenId, livePlaylistId, isOfflineSimulated]);

  // Trigger Playback Log back to API
  const logPlayback = async (mediaItem: MediaItem) => {
    if (isOfflineSimulated) return;
    try {
      await fetch("/api/player-state/track-play", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: livePlaylistId ? "STREAM-PLAYLIST" : liveScreenId ? "STREAM-SCREEN" : code,
          screenId: screenInfo?.id,
          mediaName: mediaItem.name,
          mediaType: mediaItem.type === "image" ? "Imagem" : mediaItem.type === "video" ? "Vídeo" : mediaItem.type === "html" ? "Link Web" : mediaItem.type === "feed" ? "Notícias Feed" : mediaItem.type === "dashboard" ? "Dashboard Bento Grid" : "Documento"
        })
      });
    } catch (e) {
      console.warn("Could not log playback event (offline):", e);
    }
  };

  // Playback Loop Progress
  useEffect(() => {
    if (progressTimerRef.current) clearInterval(progressTimerRef.current);
    setProgress(0);

    const items = playlist?.items || [];
    if (items.length === 0 || !isPlaying) return;

    const currentItem = items[currentItemIdx];
    if (!currentItem || !currentItem.media) return;

    // Track when a new media item starts playing
    logPlayback(currentItem.media);

    const duration = currentItem.duration || currentItem.media.duration || 10;
    currentItemDurationRef.current = duration;

    const tickIntervalMs = 100;
    const totalTicks = (duration * 1000) / tickIntervalMs;
    let ticksElapsed = 0;

    progressTimerRef.current = setInterval(() => {
      ticksElapsed++;
      const currentProgress = (ticksElapsed / totalTicks) * 100;
      setProgress(currentProgress);

      if (ticksElapsed >= totalTicks) {
        clearInterval(progressTimerRef.current);
        // Advance to next or loop back
        setCurrentItemIdx(prev => (prev + 1) % items.length);
      }
    }, tickIntervalMs);

    return () => {
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
    };
  }, [currentItemIdx, playlist, isPlaying, isOfflineSimulated]);

  // Reset index if playlist items count change
  useEffect(() => {
    setCurrentItemIdx(0);
    setProgress(0);
  }, [playlist?.items?.length]);

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  const nextSlide = () => {
    const items = playlist?.items || [];
    if (items.length > 0) {
      setCurrentItemIdx(prev => (prev + 1) % items.length);
    }
  };

  const prevSlide = () => {
    const items = playlist?.items || [];
    if (items.length > 0) {
      setCurrentItemIdx(prev => (prev - 1 + items.length) % items.length);
    }
  };

  const activeItem = playlist?.items?.[currentItemIdx];
  const isOnline = !isOfflineSimulated && errorCount < 2;

  // Render direct values for customizable simulated weather
  const getSimulatedTempAndVibe = (city: string) => {
    const seed = city.length || 10;
    const temp = 18 + (seed % 15); // ranges from 18 to 33
    const vibes = ["Ensolarado", "Parcialmente Nublado", "Nublado", "Chuva Leve", "Tempo Limpo"];
    const vibe = vibes[seed % vibes.length];
    return { temp, vibe };
  };

  return (
    <div 
      className={`fixed inset-0 bg-black text-white flex flex-col z-50 overflow-hidden select-none ${
        showControls ? "cursor-default" : "cursor-none"
      }`}
      onMouseMove={resetControlsTimeout}
      onTouchStart={resetControlsTimeout}
    >
      {/* Simulation Control Overlay Header - Only visible on hover/mouse move */}
      <div className={`absolute top-0 inset-x-0 bg-gradient-to-b from-black/90 to-transparent p-4 flex justify-between items-center transition-all duration-300 z-50 ${
        showControls ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
      }`}>
        <div className="flex items-center gap-3">
          <button 
            onClick={onBackToAdmin}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-medium cursor-pointer transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Voltar ao Painel
          </button>
          <div className="h-4 w-px bg-slate-700"></div>
          <div className="flex items-center gap-1.5 text-xs text-slate-300">
            <Tv className="w-4 h-4 text-indigo-400" />
            <span>
              {livePlaylistId ? "Transmissão Direta: Playlist" : liveScreenId ? "Transmissão Direta: Tela" : "TV Player Mode"}
              {" — "}
            </span>
            <span className="font-mono bg-slate-900 px-1.5 py-0.5 rounded text-white font-semibold">
              {livePlaylistId ? "STREAMING" : liveScreenId ? "URL-SCREEN" : code}
            </span>
          </div>
        </div>

        {/* Simuladores de Status */}
        <div className="flex items-center gap-3">
          {/* Status Badge */}
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${isOnline ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"}`}>
            {isOnline ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
            <span>{isOnline ? "Conectado" : "Offline / Cache Local"}</span>
          </div>

          <button 
            onClick={toggleFullscreen}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold cursor-pointer transition-colors"
            title="Colocar o player em tela cheia"
          >
            {isFullscreen ? <Minimize className="w-3.5 h-3.5" /> : <Maximize className="w-3.5 h-3.5" />}
            <span>{isFullscreen ? "Sair de Tela Cheia" : "Tela Cheia"}</span>
          </button>

          <button 
            onClick={() => setIsOfflineSimulated(!isOfflineSimulated)}
            className={`px-3 py-1 rounded text-xs font-semibold cursor-pointer transition-colors ${isOfflineSimulated ? "bg-amber-600 hover:bg-amber-500 text-white" : "bg-slate-700 hover:bg-slate-600 text-slate-200"}`}
            title="Simular queda de internet da TV para testar reprodução persistente offline"
          >
            {isOfflineSimulated ? "Restaurar Internet" : "Simular Sem Internet"}
          </button>
        </div>
      </div>

      {/* Main Screen Stage */}
      <div className="flex-1 w-full h-full relative flex items-center justify-center bg-slate-950">
        {!screenInfo ? (
          /* LOADING OR INITIALIZATION PHASE */
          <div className="text-center p-8">
            <RefreshCw className="w-10 h-10 text-indigo-500 animate-spin mx-auto mb-4" />
            <p className="text-slate-400 text-sm">Carregando canal remoto...</p>
          </div>
        ) : (!screenInfo.isPaired && !livePlaylistId && !liveScreenId) ? (
          /* PAIRING CODE DISPLAY SCREEN */
          <div className="max-w-2xl px-6 text-center flex flex-col items-center">
            <div className="w-20 h-20 bg-indigo-600/10 border border-indigo-500/20 rounded-3xl flex items-center justify-center mb-8 animate-pulse text-indigo-400">
              <Tv className="w-10 h-10" />
            </div>
            
            <h1 className="text-4xl font-extrabold tracking-tight mb-2 text-white">
              Vincular Nova Tela Corporativa
            </h1>
            <p className="text-slate-400 text-lg mb-8 max-w-lg">
              Abra o painel no seu computador, vá para a seção <strong className="text-slate-300">Telas</strong> e insira o seguinte código de ativação:
            </p>

            <div className="bg-slate-900 border-2 border-slate-700 rounded-3xl p-8 mb-6 shadow-2xl tracking-widest flex flex-col items-center justify-center min-w-[320px]">
              <span className="text-xs font-semibold text-indigo-400 uppercase tracking-widest mb-2 font-mono">Código de Pareamento</span>
              <span className="text-6xl font-black text-white font-mono drop-shadow-xl">{code}</span>
            </div>

            <div className="flex items-center gap-2 text-sm text-slate-500 font-mono mt-4">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-ping"></span>
              Aguardando pareamento com servidor remoto...
            </div>
          </div>
        ) : !playlist || !playlist.items || playlist.items.length === 0 ? (
          /* NO PLAYLIST ASSIGNED STATE */
          <div className="text-center p-8 max-w-md">
            <div className="w-16 h-16 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6 text-amber-500">
              <Layers className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Sem playlist agendada</h2>
            <p className="text-slate-400 text-sm mb-4">
              Esta TV está ativa com sucesso como <span className="text-indigo-400 font-semibold">{screenInfo.name}</span>, mas não há nenhuma mídia ou playlist programada para este horário.
            </p>
            <p className="text-slate-500 text-xs italic">
              Designe uma playlist ou crie um agendamento para esta tela no painel corporativo do Administrador.
            </p>
          </div>
        ) : (
          /* ACTIVE PLAYLIST SLIDESHOW LAYER */
          <div className="absolute inset-0 w-full h-full flex flex-col items-center justify-center">
            {/* Visual Screen Cache indicator on bottom corner */}
            {isOfflineSimulated && (
              <div className="absolute bottom-6 left-6 bg-amber-600/90 backdrop-blur-md px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 shadow-lg z-50 border border-amber-500/40 animate-pulse text-white">
                <WifiOff className="w-3.5 h-3.5" />
                <span>Exibindo de Cache Offline Local</span>
              </div>
            )}

            {/* Content view resolved based on media type */}
            <div className="w-full h-full flex items-center justify-center relative">
              
              {activeItem?.media?.type === "image" ? (
                <img 
                  src={activeItem.media.url} 
                  alt={activeItem.media.name} 
                  className="w-full h-full object-contain pointer-events-none transition-all duration-700 ease-in-out"
                />
              ) : activeItem?.media?.type === "video" ? (
                <video 
                  src={activeItem.media.url} 
                  className="w-full h-full object-contain" 
                  autoPlay 
                  id={`video-${activeItem.media.id}`}
                  muted 
                  playsInline
                  loop
                />
              ) : activeItem?.media?.type === "feed" ? (
                /* 📰 FULL-VIEW NEWS FEED BROADCAST SLIDE */
                <div className="w-full h-full bg-slate-900 border border-slate-800 p-12 flex flex-col justify-between text-left relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-48 h-48 bg-red-600/5 rounded-full blur-3xl" />
                  
                  {/* Broadcast bar */}
                  <div className="flex justify-between items-center border-b border-slate-800 pb-5">
                    <span className="text-lg font-bold tracking-wider uppercase font-sans text-red-500 flex items-center gap-2">
                      <span className="w-3 h-3 bg-red-600 rounded-full animate-ping"></span>
                      MURAL CORPORATIVO • NOTÍCIAS
                    </span>
                    <span className="text-xs font-mono font-bold text-slate-400 bg-slate-950 px-3 py-1 rounded border border-slate-800/60">
                      {currentDateTime.toLocaleDateString("pt-BR", { day: '2-digit', month: 'long', year: 'numeric' })}
                    </span>
                  </div>

                  {/* Bullet contents */}
                  <div className="my-auto space-y-6 max-w-4xl">
                    <div className="flex gap-4 items-start">
                      <div className="p-3 bg-red-600/10 border border-red-500/25 rounded-2xl text-red-400 shrink-0">
                        <Megaphone className="w-7 h-7" />
                      </div>
                      <div className="space-y-2">
                        <span className="text-[10px] font-mono font-bold text-slate-450 uppercase tracking-widest block">EM DESTAQUE</span>
                        <h2 className="text-4xl font-extrabold tracking-tight leading-snug text-white">
                          {(sampleNews[activeItem.media.feedCategory || "geral"] || sampleNews.geral)[0]}
                        </h2>
                      </div>
                    </div>

                    <div className="h-px bg-slate-800/80 my-4" />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-slate-300">
                      <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-800/60 text-sm">
                        <span className="text-[9px] font-mono text-slate-500 font-bold block mb-1">BOLETIM EXTRA</span>
                        <p className="font-semibold line-clamp-2">{(sampleNews[activeItem.media.feedCategory || "geral"] || sampleNews.geral)[1]}</p>
                      </div>
                      <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-800/60 text-sm">
                        <span className="text-[9px] font-mono text-slate-500 font-bold block mb-1">COMUNICADO ADICIONAL</span>
                        <p className="font-semibold line-clamp-2">{(sampleNews[activeItem.media.feedCategory || "geral"] || sampleNews.geral)[2]}</p>
                      </div>
                    </div>
                  </div>

                  {/* Scrolling footer ticker */}
                  <div className="bg-slate-950 -mx-12 -mb-12 p-4 text-xs font-mono border-t border-slate-800 flex overflow-hidden whitespace-nowrap gap-8">
                    <span className="text-yellow-500 font-bold uppercase tracking-wider shrink-0">BOLETIM DE HOJE:</span>
                    <div className="flex gap-12 animate-[marquee_20s_linear_infinite] shrink-0 text-slate-300 font-medium">
                      {(sampleNews[activeItem.media.feedCategory || "geral"] || sampleNews.geral).map((headline, idx) => (
                        <span key={idx}>• {headline}</span>
                      ))}
                    </div>
                  </div>
                </div>
              ) : activeItem?.media?.type === "dashboard" ? (
                /* 📊 FULLY CUSTOMIZABLE BENTO GRID DASHBOARD WORKSPACE */
                <div className="w-full h-full bg-slate-950 p-6 flex flex-col justify-between">
                  <div 
                    className="w-full h-full grid gap-4"
                    style={{
                      gridTemplateColumns: "repeat(24, minmax(0, 1fr))",
                      gridTemplateRows: "repeat(8, minmax(0, 1fr))",
                    }}
                  >
                    
                    {(activeItem.media.dashboardWidgets || []).map((w: any) => {
                      const { temp, vibe } = getSimulatedTempAndVibe(w.customContent || "São Paulo, SP");
                      
                      return (
                        <div 
                          key={w.id}
                          className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between overflow-hidden shadow-2xl relative"
                          style={{
                            gridColumnStart: w.gridX,
                            gridColumnEnd: w.gridX + w.gridW,
                            gridRowStart: w.gridY,
                            gridRowEnd: w.gridY + w.gridH,
                          }}
                        >
                          {/* Widget background layer for media formats */}
                          {w.type === "image" && w.resolvedMedia && (
                            <img src={w.resolvedMedia.url} className="absolute inset-0 w-full h-full object-cover opacity-60 pointer-events-none" alt="" />
                          )}
                          {w.type === "video" && w.resolvedMedia && (
                            <video src={w.resolvedMedia.url} className="absolute inset-0 w-full h-full object-cover opacity-35" autoPlay muted playsInline loop />
                          )}

                          {/* Widget Header Title / Icon decoration */}
                          <div className="flex justify-between items-center z-10">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">
                              {w.type === "clock" && "🕰️ Hora Certa"}
                              {w.type === "weather" && "☀️ Clima Local"}
                              {w.type === "feed" && "📰 Notícias Recentes"}
                              {w.type === "image" && "🖼️ Imagem d'Arquivo"}
                              {w.type === "video" && "🎥 Promo Vídeo"}
                              {w.type === "link" && "🌐 Website Integrado"}
                              {w.type === "text" && "✍️ Informativo"}
                            </span>
                            <span className="w-2 h-3 uppercase text-[8px] font-mono text-slate-500 font-bold">●</span>
                          </div>

                          {/* Complex inner state widgets contents */}
                          <div className="flex-1 flex flex-col justify-center items-center text-center py-2 z-10 overflow-hidden text-white">
                            {w.type === "clock" && (
                              <div className="font-sans">
                                <span className="font-mono text-4xl lg:text-5xl font-black tracking-tight text-white block drop-shadow-md">
                                  {currentDateTime.toLocaleTimeString("pt-BR", { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                </span>
                                <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest font-mono block mt-1">
                                  {currentDateTime.toLocaleDateString("pt-BR", { weekday: 'long', day: '2-digit', month: 'long' })}
                                </span>
                              </div>
                            )}

                            {w.type === "weather" && (
                              <div className="flex items-center gap-4">
                                <CloudSun className="w-12 h-12 text-amber-400" />
                                <div className="text-left font-sans leading-none">
                                  <span className="text-3xl lg:text-4xl font-black text-white block">{temp}°C</span>
                                  <span className="text-xs font-bold text-slate-350 block mt-1">{vibe}</span>
                                  <span className="text-[10px] text-slate-500 font-mono block mt-0.5">{w.customContent || "São Paulo, SP"}</span>
                                </div>
                              </div>
                            )}

                            {w.type === "feed" && (
                              <div className="w-full text-left px-2 leading-relaxed">
                                <span className="text-[9px] font-mono font-bold text-red-500 uppercase tracking-wider block mb-1">DESTAQUE DO CANAL</span>
                                <p className="text-sm italic font-serif text-slate-200 font-medium">
                                  {(sampleNews[w.customContent || "geral"] || sampleNews.geral)[0]}
                                </p>
                              </div>
                            )}

                            {w.type === "image" && !w.resolvedMedia && (
                              <span className="text-xs text-slate-500">Mídia de Imagem Indefinida</span>
                            )}

                            {w.type === "video" && !w.resolvedMedia && (
                              <span className="text-xs text-slate-500">Mídia de Vídeo Indefinida</span>
                            )}

                            {w.type === "link" && (
                              <iframe 
                                src={w.customContent} 
                                className="w-full h-full border-none rounded bg-white scale-95 origin-center"
                                sandbox="allow-scripts allow-same-origin"
                                title=""
                              />
                            )}

                            {w.type === "text" && (
                              <p className="text-sm text-slate-100 italic leading-snug max-w-lg font-mono">
                                "{w.customContent || "Nenhuma mensagem inserida."}"
                              </p>
                            )}
                          </div>

                          {/* Footer details inside specific widget */}
                          <div className="z-10 flex justify-between items-center text-[9px] font-mono text-slate-500 border-t border-slate-800/40 pt-1.5">
                            <span>MURAL INTERATIVO</span>
                            <span>{w.resolvedMedia?.name || "RESOLVED"}</span>
                          </div>
                        </div>
                      );
                    })}

                  </div>
                </div>
              ) : activeItem?.media?.type === "html" ? (
                <div className="w-full h-full bg-white flex flex-col">
                  <iframe 
                    src={activeItem.media.url} 
                    title={activeItem.media.name}
                    className="w-full h-full border-none"
                    sandbox="allow-scripts allow-same-origin"
                  />
                </div>
              ) : (
                /* PDF/Fallback Doc presentation styling */
                <div className="w-full h-full max-w-5xl p-12 flex flex-col justify-center items-center bg-slate-900 border border-slate-800 rounded-3xl m-8">
                  <div className="text-center space-y-4">
                    <p className="text-indigo-400 font-semibold tracking-wider uppercase text-sm">Visualização de Documento</p>
                    <h3 className="text-3xl font-bold">{activeItem?.media?.name}</h3>
                    <div className="w-[80vw] h-[50vh] min-h-[300px] border border-slate-700 rounded-xl overflow-hidden bg-white/5 p-6 flex flex-col justify-center items-center text-slate-300">
                      <p className="text-sm max-w-sm leading-relaxed mb-4 text-center">
                        Simulação de Documento / PDF Incorporado. Para melhor visualização em TVs corporativas, use imagens formato JPG/PNG ou Links dinâmicos.
                      </p>
                      <span className="text-slate-500 text-xs font-mono select-all bg-slate-950 px-3 py-1.5 rounded">{activeItem?.media?.url}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Toast notifier for slide change */}
              <div className={`absolute right-6 bottom-6 bg-slate-950/85 backdrop-blur-md px-4 py-2.5 rounded-xl border border-slate-800/80 max-w-sm flex items-center gap-3 shadow-2xl z-40 transition-all duration-300 ${
                showControls ? "opacity-100" : "opacity-0 pointer-events-none"
              }`}>
                <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-ping"></div>
                <div>
                  <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Reproduzindo atual</p>
                  <p className="text-xs font-bold text-white line-clamp-1">{activeItem?.media?.name}</p>
                </div>
                <div className="h-6 w-px bg-slate-800 ml-1"></div>
                <span className="text-[10px] font-mono text-slate-300 font-semibold bg-slate-900 px-1 rounded">
                  {currentItemIdx + 1}/{playlist.items.length}
                </span>
              </div>
            </div>

            {/* Slide advance timeline tracker on bottom */}
            <div className={`absolute bottom-0 inset-x-0 h-1.5 bg-slate-900 z-50 transition-opacity duration-300 ${
              showControls ? "opacity-100" : "opacity-0 pointer-events-none"
            }`}>
              <div 
                className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 transition-all duration-100 ease-linear"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Manual playback buttons panel triggered on mouse hover at the bottom center too */}
      {playlist?.items?.length > 0 && screenInfo?.isPaired && (
        <div className={`absolute bottom-16 left-1/2 -translate-x-1/2 bg-slate-900/90 backdrop-blur-xl border border-slate-800 px-5 py-2.5 rounded-full flex items-center gap-4 transition-all duration-300 shadow-2xl z-50 ${
          showControls ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}>
          <button 
            onClick={prevSlide}
            className="p-1.5 hover:bg-slate-800 rounded-full transition-colors cursor-pointer"
            title="Slide Anterior"
          >
            <ChevronRight className="w-4 h-4 rotate-180" />
          </button>
          
          <button 
            onClick={togglePlay}
            className="p-2 bg-indigo-600 hover:bg-indigo-500 rounded-full text-white transition-colors cursor-pointer"
            title={isPlaying ? "Pausar" : "Iniciar"}
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>

          <button 
            onClick={nextSlide}
            className="p-1.5 hover:bg-slate-800 rounded-full transition-colors cursor-pointer"
            title="Próximo Slide"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
