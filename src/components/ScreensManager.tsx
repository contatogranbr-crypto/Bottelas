import React, { useState } from "react";
import { Tv, Check, RefreshCw, Plus, Trash2, Edit2, AlertCircle, Wifi, Play, Layers, ShieldAlert, PlusCircle, ArrowRight, Save } from "lucide-react";
import { Screen, Playlist, MediaItem } from "../types";

interface ScreensManagerProps {
  screens: Screen[];
  playlists: Playlist[];
  media: MediaItem[];
  onAddScreen: (name: string, location: string, notes: string, currentPlaylistId?: string) => Promise<void>;
  onUpdateScreen: (id: string, updates: Partial<Screen>) => Promise<void>;
  onDeleteScreen: (id: string) => Promise<void>;
  onPairWithCode: (code: string, name: string, location: string, notes: string, currentPlaylistId?: string) => Promise<boolean>;
}

export function ScreensManager({ screens, playlists, media, onAddScreen, onUpdateScreen, onDeleteScreen, onPairWithCode }: ScreensManagerProps) {
  const dashboards = media ? media.filter(m => m.type === "dashboard") : [];
  // UI states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPairModal, setShowPairModal] = useState(false);
  const [editingScreenId, setEditingScreenId] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");
  const [currentPlaylistId, setCurrentPlaylistId] = useState("");
  const [pairingCode, setPairingCode] = useState("");

  // Edit states
  const [editName, setEditName] = useState("");
  const [editLocation, setEditLocation] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [editPlaylistId, setEditPlaylistId] = useState("");

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const handleOpenAdd = () => {
    setName("");
    setLocation("");
    setNotes("");
    setCurrentPlaylistId("");
    setErrorMessage("");
    setSuccessMsg("");
    setShowAddModal(true);
  };

  const handleOpenPair = () => {
    setPairingCode("");
    setName("");
    setLocation("");
    setNotes("");
    setCurrentPlaylistId("");
    setErrorMessage("");
    setSuccessMsg("");
    setShowPairModal(true);
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    setErrorMessage("");
    try {
      await onAddScreen(name, location, notes, currentPlaylistId || undefined);
      setSuccessMsg("Código de pareamento gerando com sucesso!");
      setTimeout(() => {
        setShowAddModal(false);
      }, 1000);
    } catch (err: any) {
      setErrorMessage(err.message || "Erro ao adicionar tela.");
    } finally {
      setLoading(false);
    }
  };

  const handlePairSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pairingCode.trim()) {
      setErrorMessage("Você precisa inserir o código de 6 caracteres.");
      return;
    }

    setLoading(true);
    setErrorMessage("");
    try {
      const success = await onPairWithCode(
        pairingCode,
        name,
        location,
        notes,
        currentPlaylistId || undefined
      );

      if (success) {
        setSuccessMsg("Dispositivo pareado com absoluto sucesso!");
        setTimeout(() => {
          setShowPairModal(false);
        }, 1200);
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Código inválido ou expirado.");
    } finally {
      setLoading(false);
    }
  };

  const handleStartEdit = (screen: Screen) => {
    setEditingScreenId(screen.id);
    setEditName(screen.name);
    setEditLocation(screen.location || "");
    setEditNotes(screen.notes || "");
    setEditPlaylistId(screen.currentPlaylistId || "");
  };

  const handleSaveEdit = async (screenId: string) => {
    if (!editName.trim()) return;
    try {
      await onUpdateScreen(screenId, {
        name: editName,
        location: editLocation,
        notes: editNotes,
        currentPlaylistId: editPlaylistId || null
      });
      setEditingScreenId(null);
    } catch (err) {
      console.error("Failed to edit screen settings", err);
    }
  };

  const handleDelete = async (screenId: string) => {
    if (confirm("Deseja realmente remover esta TV do gerenciador? A TV exibirá a tela de código novamente.")) {
      try {
        await onDeleteScreen(screenId);
      } catch (err) {
        console.error(err);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Upper header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight text-sans">Gerenciador de Telas (TVs-Players)</h1>
          <p className="text-sm text-slate-500 mt-1">
            Cadastre layouts, configure pareamentos físicos e atribua séries de mídias para cada TV.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Action 1: Register Screen Code Placeholders */}
          <button 
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-lg cursor-pointer transition-colors"
          >
            <Plus className="w-4 h-4 text-slate-500" /> Cadastrar Pré-Requisitos
          </button>

          {/* Action 2: Input Pairing Code directly */}
          <button 
            onClick={handleOpenPair}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg cursor-pointer transition-colors shadow-sm"
          >
            <Wifi className="w-4 h-4" /> Parear Código da TV
          </button>
        </div>
      </div>

      {/* Screens list grid */}
      {screens.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center max-w-2xl mx-auto">
          <div className="w-14 h-14 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-5 text-indigo-600">
            <Tv className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-1">Nenhum monitor pareado</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed mb-6">
            Inicie abrindo o link do player em uma TV ou monitor para obter um código exclusivo. Em seguida, clique em "Parear Código da TV" para registrar a tela de exibição neste painel.
          </p>
          <div className="flex gap-3 justify-center">
            <button 
              onClick={handleOpenPair}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg text-xs cursor-pointer transition-colors"
            >
              Parear Código Conectado
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
          {screens.map(screen => {
            const isEditing = editingScreenId === screen.id;
            // Screen is considered online if heartbeat is fresher than 45 seconds
            const isOnline = screen.isPaired && screen.lastHeartbeat && 
              (Date.now() - new Date(screen.lastHeartbeat).getTime()) < 45000;

            const matchedPlaylist = playlists.find(p => p.id === screen.currentPlaylistId);
            const matchedDashboard = !matchedPlaylist ? dashboards.find(d => d.id === screen.currentPlaylistId) : null;

            return (
              <div 
                key={screen.id}
                className={`bg-white border text-left p-5 rounded-2xl shadow-xs transition-all relative overflow-hidden flex flex-col justify-between ${
                  isOnline ? "border-emerald-200/60 shadow-emerald-500/[0.01]" : "border-slate-200"
                }`}
              >
                {/* Horizontal Top Section of card */}
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex gap-3 items-start">
                      <div className={`p-2.5 rounded-xl border ${
                        isOnline ? "bg-emerald-50 border-emerald-100 text-emerald-600" : "bg-slate-50 border-slate-200 text-slate-400"
                      }`}>
                        <Tv className="w-6 h-6" />
                      </div>
                      
                      <div className="space-y-1">
                        {isEditing ? (
                          <input 
                            type="text" 
                            className="bg-slate-50 border border-slate-300 text-slate-900 text-xs rounded-md px-2 py-1 max-w-[200px]" 
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                          />
                        ) : (
                          <h3 className="font-bold text-slate-900 text-sm select-all">{screen.name}</h3>
                        )}

                        <div className="flex items-center gap-2">
                          <span className="text-[10px] bg-slate-950 font-mono text-slate-100 px-1.5 py-0.5 rounded font-medium select-all">
                            {screen.code}
                          </span>

                          <span className={`w-2 h-2 rounded-full ${isOnline ? "bg-emerald-500" : "bg-slate-400"}`}></span>
                          
                          <span className="text-[10px] text-slate-500 font-medium font-mono">
                            {screen.isPaired 
                              ? (isOnline ? "Online" : "Desconectado (Off)")
                              : "Código Não Vinculado"
                            }
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Action controls button */}
                    <div className="flex items-center gap-1.5">
                      {isEditing ? (
                        <>
                          <button 
                            onClick={() => handleSaveEdit(screen.id)}
                            className="p-1 px-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-[10px] font-bold cursor-pointer flex items-center gap-1"
                          >
                            <Save className="w-3 h-3" /> Salvar
                          </button>
                          <button 
                            onClick={() => setEditingScreenId(null)}
                            className="p-1 px-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded text-[10px] font-bold cursor-pointer"
                          >
                            Cancelar
                          </button>
                        </>
                      ) : (
                        <>
                          <button 
                            onClick={() => handleStartEdit(screen)}
                            className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded transition-colors cursor-pointer"
                            title="Editar Tela"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button 
                            onClick={() => handleDelete(screen.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                            title="Deletar Tela"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 my-4 py-4 border-y border-slate-100 text-xs">
                    <div>
                      <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider mb-1">Localização</p>
                      {isEditing ? (
                        <input 
                          type="text" 
                          className="w-full bg-slate-50 border border-slate-300 text-slate-900 text-xs rounded-md px-2 py-1" 
                          value={editLocation}
                          onChange={(e) => setEditLocation(e.target.value)}
                        />
                      ) : (
                        <span className="text-slate-700 font-medium block truncate">
                          {screen.location || "Sem localização registrada"}
                        </span>
                      )}
                    </div>

                    <div>
                      <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider mb-1">Notas do Monitor</p>
                      {isEditing ? (
                        <input 
                          type="text" 
                          className="w-full bg-slate-50 border border-slate-300 text-slate-900 text-xs rounded-md px-2 py-1" 
                          value={editNotes}
                          onChange={(e) => setEditNotes(e.target.value)}
                        />
                      ) : (
                        <span className="text-slate-500 block truncate">
                          {screen.notes || "Nenhum detalhe técnico"}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Footer Section: Playlist binding assignment */}
                <div className="flex items-center justify-between mt-1 text-xs">
                  <div className="flex-1 mr-4">
                    <span className="text-[10px] text-slate-400 block mb-1">Playlist Atribuída Direta</span>
                    {isEditing ? (
                      <select
                        className="bg-slate-50 border border-slate-300 text-slate-900 text-xs rounded-md p-1 w-full"
                        value={editPlaylistId}
                        onChange={(e) => setEditPlaylistId(e.target.value)}
                      >
                        <option value="">Nenhum playlist/dashboard (Tela Padrão ou Ociosa)</option>
                        {playlists.length > 0 && (
                          <optgroup label="Playlists de Transmissão">
                            {playlists.map(p => (
                              <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                          </optgroup>
                        )}
                        {dashboards.length > 0 && (
                          <optgroup label="Dashboards Bento Grid">
                            {dashboards.map(d => (
                              <option key={d.id} value={d.id}>{d.name}</option>
                            ))}
                          </optgroup>
                        )}
                      </select>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-indigo-500" />
                        <span className={(matchedPlaylist || matchedDashboard) ? "font-semibold text-slate-800" : "text-amber-600 font-medium italic"}>
                          {matchedPlaylist ? matchedPlaylist.name : matchedDashboard ? `${matchedDashboard.name} (Dashboard)` : "Nenhuma playlist/dashboard ativo"}
                        </span>
                      </div>
                    )}
                  </div>

                  {screen.lastHeartbeat && (
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block mb-1">Atividade</span>
                      <span className="font-mono text-[10px] text-slate-500">
                        {new Date(screen.lastHeartbeat).toLocaleTimeString("pt-BR")}
                      </span>
                    </div>
                  )}
                </div>

                {/* Streaming url action footer bar */}
                <div className="mt-3.5 pt-3.5 border-t border-slate-100 flex flex-col gap-2">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-550 text-slate-500 font-bold font-sans">Sinal de Transmissão Direta</span>
                    <span className="bg-emerald-50 text-emerald-700 text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">Pronta</span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        const streamUrl = `${window.location.origin}/?mode=player&screenId=${screen.id}`;
                        navigator.clipboard.writeText(streamUrl);
                        alert("URL de transmissão da Tela copiado para a Área de Transferência!\n\nCole este link no navegador de qualquer TV ou monitor para transmitir em tempo real.");
                      }}
                      className="flex-1 py-1 px-2 pb-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-lg text-[10px] text-center cursor-pointer transition-colors"
                    >
                      🔗 Copiar URL de Transmissão (TV)
                    </button>
                    <a
                      href={`/?mode=player&screenId=${screen.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="py-1 px-3 bg-slate-900 hover:bg-slate-850 text-white font-bold rounded-lg text-[10px] text-center cursor-pointer transition-colors flex items-center justify-center"
                    >
                      Abrir Player ↗
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal 1: ADD PRESET PLACEHOLDER SCREEN */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 transition-all">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
            <h3 className="text-lg font-bold text-slate-900 mb-2">Cadastrar Pré-Requisito de Sinalização</h3>
            <p className="text-xs text-slate-500 mb-5 leading-relaxed">
              Crie uma vaga reservada para TV antes de parear. O sistema pré-gerará um código de pareamento que a TV física poderá usar para se sincronizar imediatamente.
            </p>

            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Nome Identificador da Tela</label>
                <input 
                  type="text" 
                  required
                  placeholder="Ex. TV Hall Principal"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 text-slate-900 text-xs rounded-lg px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Espaço / Localização</label>
                <input 
                  type="text" 
                  placeholder="Ex. Recepção - Bloco B"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 text-slate-900 text-xs rounded-lg px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Anotações Internas</label>
                <input 
                  type="text" 
                  placeholder="Sore a TV: Modelo, tipo de fixador ou observações"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 text-slate-900 text-xs rounded-lg px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Autodesignar Playlist</label>
                <select
                  className="w-full bg-slate-50 border border-slate-300 text-slate-900 text-xs rounded-lg p-2.5"
                  value={currentPlaylistId}
                  onChange={(e) => setCurrentPlaylistId(e.target.value)}
                >
                  <option value="">Sem playlist/dashboard fixo inicialmente</option>
                  {playlists.length > 0 && (
                    <optgroup label="Playlists de Transmissão">
                      {playlists.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </optgroup>
                  )}
                  {dashboards.length > 0 && (
                    <optgroup label="Dashboards Bento Grid">
                      {dashboards.map(d => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </optgroup>
                  )}
                </select>
              </div>

              {errorMessage && (
                <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs p-3 rounded-lg flex gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {successMsg && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs p-3 rounded-lg flex gap-2">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>{successMsg}</span>
                </div>
              )}

              <div className="flex gap-2 justify-end pt-4 border-t border-slate-100">
                <button 
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-lg text-xs cursor-pointer"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold rounded-lg text-xs cursor-pointer"
                >
                  {loading ? "Processando..." : "Gerar e Sincronizar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: ACTIVE PAIR FROM PHYSICAL TV CODE */}
      {showPairModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 transition-all">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
            <h3 className="text-lg font-bold text-slate-900 mb-2">Vincular Código Ativo de TV</h3>
            <p className="text-xs text-slate-500 mb-5 leading-relaxed">
              Insira o código de pareamento que está aparecendo na TV física neste momento. O sistema assumirá o controle do visor instantaneamente.
            </p>

            <form onSubmit={handlePairSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Código de Ativação (4 Dígitos)</label>
                <input 
                  type="text" 
                  required
                  placeholder="Ex: TV-ABCD"
                  value={pairingCode}
                  onChange={(e) => setPairingCode(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 text-slate-900 font-mono text-center tracking-widest text-lg font-bold rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Apelido do Painel / Nome</label>
                <input 
                  type="text" 
                  placeholder="Ex. TV Showroom"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 text-slate-900 text-xs rounded-lg px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Localização Interna</label>
                <input 
                  type="text" 
                  placeholder="Ex. Refeitório Principal"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 text-slate-900 text-xs rounded-lg px-3.5 py-2.5"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Notas Opcionais</label>
                <input 
                  type="text" 
                  placeholder="Anotações internas sobre a TV"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 text-slate-900 text-xs rounded-lg px-3.5 py-2.5"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Definir Playlist Fixa Inicial</label>
                <select
                  className="w-full bg-slate-50 border border-slate-300 text-slate-900 text-xs rounded-lg p-2.5"
                  value={currentPlaylistId}
                  onChange={(e) => setCurrentPlaylistId(e.target.value)}
                >
                  <option value="">Sem playlist/dashboard fixo inicialmente</option>
                  {playlists.length > 0 && (
                    <optgroup label="Playlists de Transmissão">
                      {playlists.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </optgroup>
                  )}
                  {dashboards.length > 0 && (
                    <optgroup label="Dashboards Bento Grid">
                      {dashboards.map(d => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </optgroup>
                  )}
                </select>
              </div>

              {errorMessage && (
                <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs p-3 rounded-lg flex gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {successMsg && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs p-3 rounded-lg flex gap-2">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>{successMsg}</span>
                </div>
              )}

              <div className="flex gap-2 justify-end pt-4 border-t border-slate-100">
                <button 
                  type="button"
                  onClick={() => setShowPairModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-lg text-xs cursor-pointer"
                >
                  Voltar
                </button>
                <button 
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg text-xs cursor-pointer flex items-center gap-1.5"
                >
                  {loading ? "Validando..." : "Parear e Ligar"} <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
