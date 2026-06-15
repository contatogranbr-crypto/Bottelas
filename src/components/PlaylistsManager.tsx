import React, { useState } from "react";
import { Layers, Plus, Trash2, Edit2, Play, AlertCircle, Check, Clock, ListOrdered, Image, Video, Globe, FileText, ArrowRight, Save } from "lucide-react";
import { Playlist, MediaItem, PlaylistItem } from "../types";

interface PlaylistsManagerProps {
  playlists: Playlist[];
  media: MediaItem[];
  onCreatePlaylist: (name: string, description: string, items: PlaylistItem[]) => Promise<void>;
  onUpdatePlaylist: (id: string, updates: Partial<Playlist>) => Promise<void>;
  onDeletePlaylist: (id: string) => Promise<void>;
}

export function PlaylistsManager({ playlists, media, onCreatePlaylist, onUpdatePlaylist, onDeleteMedia, onDeletePlaylist }: any) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingPlaylist, setEditingPlaylist] = useState<Playlist | null>(null);

  // Form parameters
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [playlistItems, setPlaylistItems] = useState<PlaylistItem[]>([]);
  
  // validation / auxiliary states
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleOpenAdd = () => {
    setName("");
    setDescription("");
    setPlaylistItems([]);
    setErrorMessage("");
    setShowAddModal(true);
  };

  const handleStartEdit = (playlist: Playlist) => {
    setEditingPlaylist(playlist);
    setName(playlist.name);
    setDescription(playlist.description || "");
    setPlaylistItems([...playlist.items]);
    setErrorMessage("");
  };

  const handleAppendMediaItem = (mediaId: string) => {
    const matchedMedia = media.find(m => m.id === mediaId);
    if (!matchedMedia) return;

    const newItem: PlaylistItem = {
      mediaId,
      duration: matchedMedia.duration || 10
    };
    setPlaylistItems(prev => [...prev, newItem]);
  };

  const handleRemovePlaylistItem = (index: number) => {
    setPlaylistItems(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleUpdateItemDuration = (index: number, duration: number) => {
    setPlaylistItems(prev => prev.map((item, idx) => {
      if (idx === index) {
        return { ...item, duration: Number(duration) || 10 };
      }
      return item;
    }));
  };

  const handleSavePlaylist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMessage("Por favor insira um nome amigável para a playlist.");
      return;
    }

    if (playlistItems.length === 0) {
      setErrorMessage("Uma playlist corporativa válida necessita ter pelo menos 1 mídia anexada.");
      return;
    }

    setLoading(true);
    try {
      if (editingPlaylist) {
        // Edit flow
        await onUpdatePlaylist(editingPlaylist.id, {
          name,
          description,
          items: playlistItems
        });
        setEditingPlaylist(null);
      } else {
        // Create flow
        await onCreatePlaylist(name, description, playlistItems);
        setShowAddModal(false);
      }

      // Cleanup
      setName("");
      setDescription("");
      setPlaylistItems([]);
      setErrorMessage("");
    } catch (err: any) {
      setErrorMessage(err.message || "Erro ao salvar playlist.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, plName: string) => {
    if (confirm(`Deseja realmente remover permanentemente a playlist "${plName}"?`)) {
      try {
        await onDeletePlaylist(id);
      } catch (err) {
        console.error(err);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Upper header controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Listas de Transmissão (Playlists)</h1>
          <p className="text-sm text-slate-500 mt-1">
            Reúna várias mídias e determine a ordem de exibição e o tempo de duração individual de cada transição de slide.
          </p>
        </div>

        <button 
          onClick={handleOpenAdd}
          className="flex items-center gap-1.5 px-3.5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg cursor-pointer transition-colors shadow-xs shrink-0 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> Nova Playlist
        </button>
      </div>

      {playlists.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl py-16 px-4 text-center max-w-lg mx-auto">
          <div className="w-12 h-12 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center justify-center mx-auto mb-4 text-indigo-600">
            <Layers className="w-6 h-6" />
          </div>
          <p className="text-sm font-bold text-slate-800 mb-1">Nenhuma playlist cadastrada</p>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mb-5">
            Crie listas personalizadas contendo imagens informativas corporativas, canais de RH ou vídeos motivacionais de recepção.
          </p>
          <button 
            onClick={handleOpenAdd}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg text-xs cursor-pointer"
          >
            Começar a Criar
          </button>
        </div>
      ) : (
        /* Grid of local playlists */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {playlists.map(pl => {
            const totalDuration = pl.items.reduce((acc, curr) => acc + (curr.duration || 10), 0);
            
            return (
              <div 
                key={pl.id}
                className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div className="p-5 text-left">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-slate-900 text-sm">{pl.name}</h3>
                    <div className="flex gap-1 shrink-0 ml-1">
                      <button 
                        onClick={() => handleStartEdit(pl)}
                        className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors cursor-pointer"
                        title="Modificar playlist"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button 
                        onClick={() => handleDelete(pl.id, pl.name)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                        title="Remover playlist"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-slate-500 line-clamp-2 min-h-8 mb-4">
                    {pl.description || "Nenhuma descrição técnica informada."}
                  </p>

                  <div className="bg-slate-50 border border-slate-100 rounded-lg p-3 space-y-2 text-xs">
                    <div className="flex justify-between items-center text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                      <span>Mídias Vinculadas</span>
                      <span>Duração</span>
                    </div>

                    <div className="divide-y divide-slate-100 max-h-36 overflow-y-auto pr-1">
                      {pl.items.map((item, idx) => {
                        const mObj = media.find(m => m.id === item.mediaId);
                        if (!mObj) return null;

                        return (
                          <div key={idx} className="py-2 flex justify-between items-center text-slate-700">
                            <span className="truncate font-medium pr-2 max-w-[150px]" title={mObj.name}>
                              {idx + 1}. {mObj.name}
                            </span>
                            <span className="font-mono text-[10px] text-slate-400 font-bold shrink-0">
                              {item.duration || mObj.duration || 10}s
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50/50 px-5 py-3.5 border-t border-slate-100 flex justify-between items-center text-xs font-mono">
                  <div className="flex items-center gap-1 text-slate-500">
                    <Clock className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Duração: <strong>{totalDuration}s</strong></span>
                  </div>
                  <span className="bg-indigo-50 border border-indigo-200/50 text-indigo-700 font-bold px-2 py-0.5 rounded-full text-[10px]">
                    {pl.items.length} Slides
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* FULL SCREEN MODAL / TOGGLE FOR ADD & EDIT PLAYLISTS */}
      {(showAddModal || editingPlaylist) && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 transition-all">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-4xl w-full p-6 shadow-2xl relative max-h-[90vh] flex flex-col justify-between">
            {/* Modal Title */}
            <div className="border-b border-slate-100 pb-3 mb-4">
              <h3 className="text-lg font-bold text-slate-900">
                {editingPlaylist ? `Editar Playlist: ${editingPlaylist.name}` : "Construir Nova Playlist"}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Monte a cronologia corporativa anexando e ordenando mídias ao carrossel físico.
              </p>
            </div>

            {/* Split layout inside modal */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 overflow-y-auto flex-1 pr-1 pb-4">
              {/* Form and details (6/12) */}
              <form onSubmit={handleSavePlaylist} className="lg:col-span-4 space-y-4 text-left">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Título da Playlist</label>
                  <input 
                    type="text" 
                    required
                    placeholder="Ex. Recepção - Geral"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 text-slate-900 text-xs rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Descrição Interna</label>
                  <textarea 
                    placeholder="Para qual recepção serve, contexto técnico..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={2}
                    className="w-full bg-slate-50 border border-slate-300 text-slate-900 text-xs rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {errorMessage && (
                  <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs p-3.5 rounded-lg flex gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                <div className="pt-4 border-t border-slate-100 hidden lg:block">
                  <h4 className="text-[10px] font-bold uppercase text-slate-400 mb-2">Resumo da Playlist</h4>
                  <div className="bg-slate-50 border border-slate-100 rounded-lg p-3 space-y-1.5 text-xs text-slate-600 font-mono">
                    <div className="flex justify-between">
                      <span>Total de Itens:</span>
                      <strong className="text-slate-900">{playlistItems.length}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Tempo Ativo:</span>
                      <strong className="text-slate-900">
                        {playlistItems.reduce((acc, curr) => acc + (curr.duration || 10), 0)}s
                      </strong>
                    </div>
                  </div>
                </div>
              </form>

              {/* Added Sequence ordering area (8/12) */}
              <div className="lg:col-span-8 flex flex-col md:flex-row gap-4 border-t lg:border-t-0 lg:border-l border-slate-100 pt-4 lg:pt-0 lg:pl-5 overflow-hidden">
                
                {/* Visualizer list in current playlist sequence order */}
                <div className="flex-1 flex flex-col justify-between overflow-hidden bg-slate-50 border border-slate-200/60 rounded-xl p-4">
                  <div>
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1">
                      <ListOrdered className="w-3.5 h-3.5" /> Ordem de Reprodução ({playlistItems.length})
                    </h4>

                    {playlistItems.length === 0 ? (
                      <div className="py-12 text-center text-slate-400 text-xs">
                        Adicione mídias clicando nos botões à direita. Elas aparecerão aqui na ordem de exibição do player.
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-68 overflow-y-auto pr-1">
                        {playlistItems.map((item, idx) => {
                          const mInfo = media.find(m => m.id === item.mediaId);
                          if (!mInfo) return null;

                          return (
                            <div 
                              key={idx}
                              className="bg-white border border-slate-200/80 rounded-lg p-2 flex items-center justify-between text-xs transition-hover hover:border-slate-300"
                            >
                              <div className="flex items-center gap-2 truncate">
                                <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold flex items-center justify-center shrink-0">
                                  {idx + 1}
                                </span>
                                
                                <span className="font-semibold text-slate-800 truncate" title={mInfo.name}>
                                  {mInfo.name}
                                </span>
                              </div>

                              <div className="flex items-center gap-2 shrink-0">
                                <div className="flex items-center gap-1 border border-slate-200 rounded px-1.5 py-0.5 bg-slate-50">
                                  <Clock className="w-3 h-3 text-slate-400" />
                                  <input 
                                    type="number" 
                                    min="3"
                                    max="300"
                                    value={item.duration}
                                    title="Duração deste slide"
                                    onChange={(e) => handleUpdateItemDuration(idx, Number(e.target.value))}
                                    className="w-8 text-[10px] font-bold bg-transparent text-center focus:outline-none"
                                  />
                                  <span className="text-[9px] text-slate-400 font-mono">s</span>
                                </div>

                                <button 
                                  type="button"
                                  onClick={() => handleRemovePlaylistItem(idx)}
                                  className="p-1 hover:bg-rose-50 text-slate-400 hover:text-rose-500 rounded transition-colors"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* Media assets selection list */}
                <div className="w-full md:w-56 flex flex-col justify-between overflow-hidden bg-white border border-slate-100 p-3 rounded-xl">
                  <div>
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">
                      Suas Mídias
                    </h4>
                    
                    {media.length === 0 ? (
                      <div className="text-center py-6 text-[11px] text-slate-400">
                        Nenhuma mídia na biblioteca. Vá para aba Biblioteca de mídias para fazer upload.
                      </div>
                    ) : (
                      <div className="space-y-1.5 max-h-68 overflow-y-auto pr-1">
                        {media.map(m => (
                          <div 
                            key={m.id}
                            className="p-2 border border-slate-100 rounded-lg text-xs hover:border-slate-300 transition-colors flex items-center justify-between"
                          >
                            <span className="truncate font-semibold text-slate-700 pr-1 max-w-[120px]" title={m.name}>
                              {m.name}
                            </span>
                            
                            <button 
                              type="button"
                              onClick={() => handleAppendMediaItem(m.id)}
                              className="p-1 px-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[10px] font-bold rounded cursor-pointer transition-colors shrink-0"
                            >
                              Anexar
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

              </div>
            </div>

            {/* Bottom action controls */}
            <div className="border-t border-slate-100 pt-4 flex justify-between gap-1 mt-4">
              <button 
                type="button"
                onClick={() => {
                  setShowAddModal(false);
                  setEditingPlaylist(null);
                }}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-lg text-xs cursor-pointer"
              >
                Voltar
              </button>

              <button 
                type="button"
                onClick={handleSavePlaylist}
                disabled={loading}
                className="px-4.5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold rounded-lg text-xs cursor-pointer shadow-xs flex items-center gap-1.5"
              >
                {loading ? "Gravando dados..." : (editingPlaylist ? "Atualizar Carrossel" : "Cadastrar Playlist")} <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
