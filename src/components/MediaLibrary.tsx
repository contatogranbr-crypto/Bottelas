import React, { useState, useRef } from "react";
import { Image, Video, Link2, FileText, Plus, Trash2, Globe, ArrowUpRight, UploadCloud, AlertCircle, PlayCircle, Clock, Search, HelpCircle, HardDrive, Newspaper, LayoutGrid, Sparkles, Edit2 } from "lucide-react";
import { MediaItem, DashboardWidget } from "../types";
import { DashboardCreator } from "./DashboardCreator";

interface MediaLibraryProps {
  media: MediaItem[];
  onUploadFile: (name: string, type: 'image' | 'video' | 'pdf', base64Data: string, filename: string) => Promise<void>;
  onAddExternalLink: (name: string, type: 'image' | 'video' | 'pdf' | 'link' | 'html', url: string, duration: number) => Promise<void>;
  onDeleteMedia: (id: string) => Promise<void>;
  onSaveDashboard: (name: string, widgets: DashboardWidget[], duration: number, id?: string) => Promise<void>;
  onSaveFeed: (name: string, category: string, duration: number) => Promise<void>;
  onUpdateMedia?: (id: string, updates: Partial<MediaItem>) => Promise<void>;
}

export function MediaLibrary({ 
  media, 
  onUploadFile, 
  onAddExternalLink, 
  onDeleteMedia,
  onSaveDashboard,
  onSaveFeed,
  onUpdateMedia
}: MediaLibraryProps) {
  // states
  const [activeTypeTab, setActiveTypeTab] = useState<'all' | 'image' | 'video' | 'html' | 'pdf' | 'feed' | 'dashboard'>('all');
  const [searchQuery, setSearchQuery] = useState("");
  
  // upload modal or trigger states
  const [showAddModal, setShowAddModal] = useState(false);
  const [addMode, setAddMode] = useState<'upload' | 'link' | 'feed'>('upload'); // local file upload, link, or feed category RSS
  const [mediaName, setMediaName] = useState("");
  const [mediaType, setMediaType] = useState<'image' | 'video' | 'pdf' | 'html'>('image');
  const [linkUrl, setLinkUrl] = useState("");
  const [customDuration, setCustomDuration] = useState(10);
  const [selectedFeedCategory, setSelectedFeedCategory] = useState("geral");

  // Dashboard creation interactive workflow state
  const [isBuildingDashboard, setIsBuildingDashboard] = useState(false);
  
  // Media editing states
  const [editingMedia, setEditingMedia] = useState<MediaItem | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  
  // File drag states
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      validateAndSetFile(file);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const validateAndSetFile = (file: File) => {
    const typeStr = file.type.toLowerCase();
    let detectedType: 'image' | 'video' | 'pdf' = 'image';

    if (typeStr.includes("image/")) {
      detectedType = 'image';
    } else if (typeStr.includes("video/")) {
      detectedType = 'video';
    } else if (typeStr.includes("pdf")) {
      detectedType = 'pdf';
    } else {
      setErrorMessage("Tipo de arquivo não suportado como mídia corporativa. Por favor escolha Imagens (JPG/PNG), Vídeos (MP4/WebM) ou PDFs estruturados.");
      return;
    }

    if (file.size > 22 * 1024 * 1024) {
      setErrorMessage("O tamanho máximo do arquivo é de 22MB para preservar o buffers de TV.");
      return;
    }

    setSelectedFile(file);
    setMediaType(detectedType as any);
    if (!mediaName) {
      const extensionIdx = file.name.lastIndexOf(".");
      const friendlyName = extensionIdx > 0 ? file.name.substring(0, extensionIdx) : file.name;
      setMediaName(friendlyName);
    }
    setErrorMessage("");
  };

  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mediaName.trim()) {
      setErrorMessage("Insira um nome identificador amigável.");
      return;
    }

    setLoading(true);
    setErrorMessage("");

    try {
      if (addMode === 'upload') {
        if (!selectedFile) {
          setErrorMessage("Você precisa anexar um arquivo PDF, Imagem ou Vídeo.");
          setLoading(false);
          return;
        }
        
        const base64Str = await convertFileToBase64(selectedFile);
        await onUploadFile(mediaName, mediaType as any, base64Str, selectedFile.name);
      } else if (addMode === 'link') {
        // External reference URL link
        if (!linkUrl.trim() || !linkUrl.startsWith("http")) {
          setErrorMessage("Por favor insira um link web completo válido (deve iniciar com http:// ou https://).");
          setLoading(false);
          return;
        }
        
        await onAddExternalLink(mediaName, mediaType, linkUrl, customDuration);
      } else if (addMode === 'feed') {
        // News feed option save
        await onSaveFeed(mediaName, selectedFeedCategory, customDuration);
      }

      // Close modal on complete
      setShowAddModal(false);
      // clean form values
      setMediaName("");
      setSelectedFile(null);
      setLinkUrl("");
      setCustomDuration(10);
      setSelectedFeedCategory("geral");
    } catch (err: any) {
      setErrorMessage(err.message || "Erro ao salvar conteúdo de mídia.");
    } finally {
      setLoading(false);
    }
  };

  const handleStartEdit = (item: MediaItem) => {
    setEditingMedia(item);
    if (item.type === "dashboard") {
      setIsBuildingDashboard(true);
    } else {
      setMediaName(item.name);
      setMediaType(item.type === 'feed' || item.type === 'dashboard' ? 'image' : item.type as any);
      setCustomDuration(item.duration);
      if (item.type === 'feed') {
        setAddMode('feed');
        setSelectedFeedCategory(item.feedCategory || 'geral');
      } else if (item.url && item.url.startsWith("http")) {
        setAddMode('link');
        setLinkUrl(item.url);
      } else {
        setAddMode('upload');
        setSelectedFile(null);
      }
      setErrorMessage("");
      setShowEditModal(true);
    }
  };

  const handleEditSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMedia) return;
    if (!mediaName.trim()) {
      setErrorMessage("Insira um nome identificador amigável.");
      return;
    }

    setLoading(true);
    setErrorMessage("");

    try {
      let updates: Partial<MediaItem> = {
        name: mediaName,
        duration: customDuration,
      };

      if (addMode === 'feed') {
        updates.feedCategory = selectedFeedCategory;
      } else if (addMode === 'link') {
        if (!linkUrl.trim() || !linkUrl.startsWith("http")) {
          setErrorMessage("Por favor insira um link web completo válido (deve iniciar com http:// ou https://).");
          setLoading(false);
          return;
        }
        updates.url = linkUrl;
        updates.type = mediaType as any;
      }

      if (onUpdateMedia) {
        await onUpdateMedia(editingMedia.id, updates);
      }

      setShowEditModal(false);
      setEditingMedia(null);
      setMediaName("");
      setLinkUrl("");
      setCustomDuration(10);
    } catch (err: any) {
      setErrorMessage(err.message || "Erro ao salvar alterações.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Deseja deletar permanentemente a mídia "${name}"? Ela será removida de qualquer playlist ativa.`)) {
      try {
        await onDeleteMedia(id);
      } catch (err) {
        console.error(err);
      }
    }
  };

  // Filter media files based on selected tab and search match
  const filteredMedia = media.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    if (activeTypeTab === "all") return matchesSearch;
    return item.type === activeTypeTab && matchesSearch;
  });

  // Render Dashboard Creator Page rather than typical storage items
  if (isBuildingDashboard) {
    return (
      <DashboardCreator 
        media={media}
        editingMedia={editingMedia || undefined}
        onSaveDashboard={async (name, widgets, duration) => {
          await onSaveDashboard(name, widgets, duration, editingMedia?.id);
          setIsBuildingDashboard(false);
          setEditingMedia(null);
        }}
        onCancel={() => {
          setIsBuildingDashboard(false);
          setEditingMedia(null);
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Upper header action section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Biblioteca de Mídias</h1>
          <p className="text-sm text-slate-500 mt-1">
            Reúna fotos, informativos, vídeos, feeds de notícias automáticos e dashboards customizados "Bento Grid".
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5">
          <button 
            onClick={() => {
              setIsBuildingDashboard(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white text-xs font-bold rounded-lg cursor-pointer transition-all shadow-md shadow-indigo-600/10 shrink-0"
          >
            <LayoutGrid className="w-4 h-4" /> Criar Dashboard Grid
          </button>

          <button 
            onClick={() => {
              setErrorMessage("");
              setSelectedFile(null);
              setMediaName("");
              setMediaType("image");
              setAddMode("upload");
              setLinkUrl("");
              setShowAddModal(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg cursor-pointer transition-colors shadow-xs shrink-0"
          >
            <Plus className="w-4 h-4" /> Enviar Mídia / Notícias Feed
          </button>
        </div>
      </div>

      {/* Grid of contents control and search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Type selector tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          <button 
            onClick={() => setActiveTypeTab("all")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg cursor-pointer transition-colors shrink-0 ${activeTypeTab === "all" ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"}`}
          >
            Tudo ({media.length})
          </button>
          
          <button 
            onClick={() => setActiveTypeTab("image")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg cursor-pointer transition-colors shrink-0 flex items-center gap-1.5 ${activeTypeTab === "image" ? "bg-indigo-600 text-white" : "text-slate-600 hover:bg-slate-100"}`}
          >
            <Image className="w-3.5 h-3.5" /> Imagens
          </button>

          <button 
            onClick={() => setActiveTypeTab("video")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg cursor-pointer transition-colors shrink-0 flex items-center gap-1.5 ${activeTypeTab === "video" ? "bg-blue-600 text-white" : "text-slate-600 hover:bg-slate-100"}`}
          >
            <Video className="w-3.5 h-3.5" /> Vídeos
          </button>

          <button 
            onClick={() => setActiveTypeTab("feed")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg cursor-pointer transition-colors shrink-0 flex items-center gap-1.5 ${activeTypeTab === "feed" ? "bg-red-650 bg-red-600 text-white" : "text-slate-600 hover:bg-slate-100"}`}
          >
            <Newspaper className="w-3.5 h-3.5" /> Canais Feed RSS
          </button>

          <button 
            onClick={() => setActiveTypeTab("dashboard")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg cursor-pointer transition-colors shrink-0 flex items-center gap-1.5 ${activeTypeTab === "dashboard" ? "bg-indigo-750 bg-indigo-700 text-white" : "text-slate-600 hover:bg-slate-100"}`}
          >
            <LayoutGrid className="w-3.5 h-3.5" /> Dashboards
          </button>

          <button 
            onClick={() => setActiveTypeTab("html")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg cursor-pointer transition-colors shrink-0 flex items-center gap-1.5 ${activeTypeTab === "html" ? "bg-amber-600 text-white" : "text-slate-600 hover:bg-slate-100"}`}
          >
            <Globe className="w-3.5 h-3.5" /> Links / HTML
          </button>

          <button 
            onClick={() => setActiveTypeTab("pdf")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg cursor-pointer transition-colors shrink-0 flex items-center gap-1.5 ${activeTypeTab === "pdf" ? "bg-rose-600 text-white" : "text-slate-600 hover:bg-slate-100"}`}
          >
            <FileText className="w-3.5 h-3.5" /> PDFs
          </button>
        </div>

        {/* Searching bar */}
        <div className="relative max-w-xs w-full">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="w-3.5 h-3.5" />
          </span>
          <input 
            type="text"
            placeholder="Filtrar mídias..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 text-slate-800 text-xs rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
          />
        </div>
      </div>

      {/* Main Grid View */}
      {filteredMedia.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl py-16 px-4 text-center">
          <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center mx-auto mb-4 text-slate-400">
            <Search className="w-6 h-6" />
          </div>
          <p className="text-sm font-bold text-slate-800 mb-1">Nenhum item localizado</p>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {searchQuery ? "Nenhuma mídia atende sua pesquisa de filtro ativo. Tente outro termo." : "Não há mídias ou layouts corporativos registrados nesta categoria."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {filteredMedia.map(item => {
            // Icons configurations based on file/media extension type
            let iconMarkup = <FileText className="w-5 h-5 text-rose-500" />;
            let badgeBg = "bg-rose-50 text-rose-650 border-rose-200/60";
            let typeLabel = "PDF";

            if (item.type === "image") {
              iconMarkup = <Image className="w-5 h-5 text-indigo-500" />;
              badgeBg = "bg-indigo-50 text-indigo-650 border-indigo-200/60";
              typeLabel = "Imagem";
            } else if (item.type === "video") {
              iconMarkup = <Video className="w-5 h-5 text-blue-500" />;
              badgeBg = "bg-blue-50 text-blue-650 border-blue-200/60";
              typeLabel = "Vídeo";
            } else if (item.type === "html" || item.type === "link") {
              iconMarkup = <Globe className="w-5 h-5 text-amber-500" />;
              badgeBg = "bg-amber-50 text-amber-650 border-amber-200/60";
              typeLabel = "Web / HTML";
            } else if (item.type === "feed") {
              iconMarkup = <Newspaper className="w-5 h-5 text-red-500" />;
              badgeBg = "bg-red-50 text-red-650 border-red-200/60";
              typeLabel = "Feed RSS";
            } else if (item.type === "dashboard") {
              iconMarkup = <LayoutGrid className="w-5 h-5 text-indigo-655 text-indigo-600" />;
              badgeBg = "bg-indigo-50 text-indigo-655 border-indigo-200/60";
              typeLabel = "Dashboard Grid";
            }

            return (
              <div 
                key={item.id}
                className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs hover:shadow-md transition-all group flex flex-col justify-between"
              >
                {/* Visual Thumbnail representation */}
                <div className="h-32 bg-slate-100 flex items-center justify-center relative overflow-hidden border-b border-slate-100 select-none">
                  {item.type === "image" ? (
                    <img 
                      src={item.url} 
                      alt={item.name} 
                      className="w-full h-full object-cover transition-transform group-hover:scale-105" 
                      loading="lazy"
                    />
                  ) : item.type === "video" ? (
                    <div className="relative w-full h-full bg-slate-900 flex items-center justify-center overflow-hidden">
                      {/* Interactive placeholder video symbol background */}
                      <PlayCircle className="w-10 h-10 text-white/50 z-10 transition-transform group-hover:scale-110" />
                      <video src={item.url} className="absolute inset-0 w-full h-full object-cover opacity-40" muted playsInline />
                    </div>
                  ) : item.type === "feed" ? (
                    <div className="flex flex-col items-center gap-1.5 text-center p-4">
                      <Newspaper className="w-8 h-8 text-red-500 animate-pulse" />
                      <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest">Feed de Notícias Auto</span>
                    </div>
                  ) : item.type === "dashboard" ? (
                    <div className="flex flex-col items-center gap-1 text-center p-4 bg-slate-950 w-full h-full justify-center">
                      <LayoutGrid className="w-7 h-7 text-indigo-400" />
                      <span className="text-[9px] font-mono font-bold text-indigo-300 uppercase tracking-wider block mt-1">Grid Multimídia Ativo</span>
                      <span className="text-[8px] font-mono text-slate-550 block text-slate-500">{(item.dashboardWidgets || []).length} Widgets Bento</span>
                    </div>
                  ) : (
                    /* Default document preview look */
                    <div className="flex flex-col items-center gap-1">
                      <div className="p-2 bg-slate-200/50 rounded-lg">
                        {iconMarkup}
                      </div>
                      <span className="text-[10px] font-mono text-slate-500">Documento / Link</span>
                    </div>
                  )}

                  {/* Absolute Top corner type Tag */}
                  <span className={`absolute top-2.5 left-2.5 border text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${badgeBg}`}>
                    {typeLabel}
                  </span>

                  {/* Absolute Duration display */}
                  <div className="absolute right-2.5 bottom-2.5 bg-black/75 backdrop-blur-xs px-2 py-0.5 rounded text-[9px] font-mono font-bold text-white flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-300" />
                    <span>{item.duration}s</span>
                  </div>
                </div>

                {/* Sub title details text */}
                <div className="p-4 text-left">
                  <h3 className="font-bold text-slate-800 text-xs line-clamp-2 min-h-8 leading-snug" title={item.name}>
                    {item.name}
                  </h3>

                  <div className="flex items-center justify-between mt-3 text-[10px] text-slate-400 font-mono">
                    <span className="flex items-center gap-1 font-semibold text-slate-500">
                      <HardDrive className="w-3 h-3 text-slate-400" />
                      {item.type === "dashboard" ? "Bento Grid" : item.type === "feed" ? "Auto Feed" : item.size || "Local Cache"}
                    </span>
                    <span>
                      {new Date(item.createdAt).toLocaleDateString("pt-BR", { day: '2-digit', month: '2-digit' })}
                    </span>
                  </div>
                </div>

                <div className="px-4 pb-4.5 pt-2 border-t border-slate-100 flex justify-between gap-1 items-center">
                  {item.url && item.url.startsWith("http") ? (
                    <a 
                      href={item.url} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-[10px] text-indigo-655 font-bold hover:underline flex items-center gap-1.5"
                    >
                      Abrir link <ArrowUpRight className="w-3 h-3" />
                    </a>
                  ) : item.type === "dashboard" ? (
                    <span className="bg-indigo-100 text-indigo-700 text-[9px] px-1.5 py-0.5 rounded font-mono font-bold">Grid Custom</span>
                  ) : item.type === "feed" ? (
                    <span className="bg-red-100 text-red-700 text-[9px] px-1.5 py-0.5 rounded font-mono font-bold uppercase tracking-wider">Feed: {item.feedCategory || "geral"}</span>
                  ) : (
                    <span className="text-[10px] text-slate-400 italic font-mono">Local</span>
                  )}
 
                  <div className="flex gap-1 ml-auto">
                    <button 
                      onClick={() => handleStartEdit(item)}
                      className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors cursor-pointer"
                      title="Editar mídia"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button 
                      onClick={() => handleDelete(item.id, item.name)}
                      className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                      title="Remover mídia"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal addition container */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 transition-all">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-slate-900 mb-1">Adicionar Mídia ou Dashboard</h3>
            <p className="text-xs text-slate-400 mb-5 leading-relaxed">
              Carregue arquivos locais para o servidor ou programe boletins de notícias automáticos.
            </p>

            {/* Selection modes */}
            <div className="grid grid-cols-3 gap-2 p-1.5 bg-slate-100 rounded-xl mb-4 text-[11px] font-bold text-center">
              <button 
                type="button"
                onClick={() => { setAddMode("upload"); setErrorMessage(""); }}
                className={`py-1.5 rounded-lg cursor-pointer transition-colors ${addMode === "upload" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}
              >
                Upload Arquivo
              </button>
              <button 
                type="button"
                onClick={() => { setAddMode("link"); setErrorMessage(""); }}
                className={`py-1.5 rounded-lg cursor-pointer transition-colors ${addMode === "link" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}
              >
                Link / Iframe
              </button>
              <button 
                type="button"
                onClick={() => { setAddMode("feed"); setErrorMessage(""); }}
                className={`py-1.5 rounded-lg cursor-pointer transition-colors ${addMode === "feed" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}
              >
                📰 Feed Notícias
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              {/* Media Common Friendly Name */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Nome do slide corporativo</label>
                <input 
                  type="text" 
                  required
                  placeholder={addMode === "feed" ? "Ex. Feed de Notícias Tech" : "Ex. Layout Almoço Quarta-feira ou Slide 1"}
                  value={mediaName}
                  onChange={(e) => setMediaName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 text-slate-900 text-xs rounded-lg px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white font-medium"
                />
              </div>

              {addMode === "upload" ? (
                /* FILE DRAG DROP TARGET */
                <div className="space-y-3.5">
                  <div 
                    onDragEnter={handleDrag}
                    onDragOver={handleDrag}
                    onDragLeave={handleDrag}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
                      dragActive ? "border-indigo-600 bg-indigo-50/10" : "border-slate-300 bg-slate-50 hover:bg-slate-100/50"
                    }`}
                  >
                    <input 
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileSelect}
                      className="hidden"
                      accept="image/*,video/mp4,video/webm,application/pdf"
                    />

                    {selectedFile ? (
                      <div className="space-y-2 text-xs">
                        <UploadCloud className="w-10 h-10 text-emerald-500 mx-auto" />
                        <p className="font-bold text-slate-900">{selectedFile.name}</p>
                        <p className="text-[11px] text-slate-400 font-mono">
                          {(selectedFile.size / (1024 * 1024)).toFixed(1)} MB | Tipo detectado: <span className="uppercase text-indigo-600 font-bold">{mediaType}</span>
                        </p>
                        <span className="text-[10px] text-indigo-600 underline font-medium block pt-1">Clique para substituir o arquivo</span>
                      </div>
                    ) : (
                      <div className="space-y-2 text-xs text-slate-500">
                        <UploadCloud className="w-10 h-10 text-slate-400 mx-auto" />
                        <p className="font-bold text-slate-700">Arraste fotos, vídeos ou PDFs aqui</p>
                        <p className="text-[11px] text-slate-400">Suporta JPEG, PNG, MP4, WebM e PDFs até 22MB.</p>
                        <button 
                          type="button" 
                          className="px-3.5 py-1.5 bg-white border border-slate-200 text-slate-700 rounded-lg font-bold shadow-xs flex items-center gap-1 mx-auto mt-2 text-[10px]"
                        >
                          Procurar nos arquivos
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ) : addMode === "link" ? (
                /* LINK / REFERENCE FOR WEB IFRAMES */
                <div className="space-y-3.5">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Tipo do link</label>
                      <select 
                        className="w-full bg-slate-50 border border-slate-300 text-slate-900 text-xs rounded-lg p-2.5 font-semibold"
                        value={mediaType}
                        onChange={(e: any) => setMediaType(e.target.value)}
                      >
                        <option value="image">URL de Imagem (JPG/PNG)</option>
                        <option value="video">URL de Vídeo Remoto (MP4)</option>
                        <option value="html">Site / Dashboard Integrado</option>
                        <option value="pdf">URL de PDF no Drive</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Duração Padrão (segundos)</label>
                      <input 
                        type="number" 
                        min="3"
                        max="300"
                        value={customDuration}
                        onChange={(e) => setCustomDuration(Number(e.target.value))}
                        className="w-full bg-slate-50 border border-slate-300 text-slate-900 text-xs rounded-lg p-2 font-medium"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Endereço de Link Completo (URL)</label>
                    <input 
                      type="url"
                      required
                      placeholder="https://suaempresa.com.br/dashboard"
                      value={linkUrl}
                      onChange={(e) => setLinkUrl(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 text-slate-900 text-xs rounded-lg px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                    />
                    <span className="text-[10px] text-slate-400 mt-1.5 block leading-relaxed">
                      Lembre-se de usar URLs seguras (iniciando com https://) para evitar restrições de iFrames de navegadores e de TVs mais antigas.
                    </span>
                  </div>
                </div>
              ) : (
                /* NEWS FEEDS ADD WORKFLOW */
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Canal de Notícias</label>
                      <select 
                        className="w-full bg-slate-50 border border-slate-300 text-slate-900 text-xs rounded-lg p-2.5 font-semibold"
                        value={selectedFeedCategory}
                        onChange={(e) => setSelectedFeedCategory(e.target.value)}
                      >
                        <option value="geral">Geral (Manchetes Populares)</option>
                        <option value="tecnologia">Tecnologia & Inovação (IA, etc)</option>
                        <option value="financas">Economia e Finanças Mundiais</option>
                        <option value="corporativo">Recursos Humanos / Avisos Internos</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Duração no Slide (segundos)</label>
                      <input 
                        type="number" 
                        min="5"
                        max="300"
                        value={customDuration}
                        onChange={(e) => setCustomDuration(Number(e.target.value))}
                        className="w-full bg-slate-50 border border-slate-300 text-slate-900 text-xs rounded-lg p-2"
                      />
                    </div>
                  </div>

                  <div className="bg-indigo-50/50 p-4 border border-indigo-200/50 rounded-xl flex gap-2 text-indigo-900 text-xs">
                    <Sparkles className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold">Como funcionam as notícias automáticas?</p>
                      <p className="text-slate-500 text-[11px] mt-1">
                        O sistema carrega e atualiza boletins dinâmicos em tempo real diretamente na TV, sem nenhuma necessidade de intervenção humana secundária.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {errorMessage && (
                <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs p-3.5 rounded-lg flex gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Action buttons */}
              <div className="flex gap-2 justify-end pt-5 border-t border-slate-100">
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
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold rounded-lg text-xs cursor-pointer shadow-xs"
                >
                  {loading ? "Processando upload..." : "Salvar Mídia"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Edit Container */}
      {showEditModal && editingMedia && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 transition-all">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-slate-900 mb-1">Editar Mídia</h3>
            <p className="text-xs text-slate-400 mb-5 leading-relaxed">
              Edite as propriedades desta mídia na biblioteca.
            </p>

            <form onSubmit={handleEditSave} className="space-y-4 font-sans text-left">
              {/* Media Common Friendly Name */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Nome do slide corporativo</label>
                <input 
                  type="text" 
                  required
                  placeholder="Ex. Slide 1"
                  value={mediaName}
                  onChange={(e) => setMediaName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 text-slate-900 text-xs rounded-lg px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white font-medium"
                />
              </div>

              {editingMedia.type === 'feed' ? (
                /* NEWS FEEDS ADD WORKFLOW */
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Canal de Notícias</label>
                      <select 
                        className="w-full bg-slate-50 border border-slate-300 text-slate-900 text-xs rounded-lg p-2.5 font-semibold"
                        value={selectedFeedCategory}
                        onChange={(e) => setSelectedFeedCategory(e.target.value)}
                      >
                        <option value="geral">Geral (Manchetes Populares)</option>
                        <option value="tecnologia">Tecnologia & Inovação (IA, etc)</option>
                        <option value="financas">Economia e Finanças Mundiais</option>
                        <option value="corporativo">Recursos Humanos / Avisos Internos</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Duração no Slide (segundos)</label>
                      <input 
                        type="number" 
                        min="5"
                        max="300"
                        value={customDuration}
                        onChange={(e) => setCustomDuration(Number(e.target.value))}
                        className="w-full bg-slate-50 border border-slate-300 text-slate-900 text-xs rounded-lg p-2"
                      />
                    </div>
                  </div>
                </div>
              ) : (editingMedia.url && editingMedia.url.startsWith("http")) ? (
                /* LINK / REFERENCE FOR WEB IFRAMES */
                <div className="space-y-3.5">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Tipo do link</label>
                      <select 
                        className="w-full bg-slate-50 border border-slate-300 text-slate-900 text-xs rounded-lg p-2.5 font-semibold"
                        value={mediaType}
                        onChange={(e: any) => setMediaType(e.target.value)}
                      >
                        <option value="image">URL de Imagem (JPG/PNG)</option>
                        <option value="video">URL de Vídeo Remoto (MP4)</option>
                        <option value="html">Site / Dashboard Integrado</option>
                        <option value="pdf">URL de PDF no Drive</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Duração Padrão (segundos)</label>
                      <input 
                        type="number" 
                        min="3"
                        max="300"
                        value={customDuration}
                        onChange={(e) => setCustomDuration(Number(e.target.value))}
                        className="w-full bg-slate-50 border border-slate-300 text-slate-900 text-xs rounded-lg p-2 font-medium"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Endereço de Link Completo (URL)</label>
                    <input 
                      type="url"
                      required
                      placeholder="https://suaempresa.com.br/dashboard"
                      value={linkUrl}
                      onChange={(e) => setLinkUrl(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 text-slate-900 text-xs rounded-lg px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                    />
                  </div>
                </div>
              ) : (
                /* LOCAL UPLOADED FILE - ONLY DURATION AND NAME */
                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Duração (segundos)</label>
                    <input 
                      type="number" 
                      min="3"
                      max="300"
                      value={customDuration}
                      onChange={(e) => setCustomDuration(Number(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-300 text-slate-900 text-xs rounded-lg p-2.5 font-medium"
                    />
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-slate-500 text-[11px]">
                    Arquivo: <strong className="text-slate-700">{editingMedia.url}</strong>
                    <br />
                    Para substituir o arquivo físico por outro, envie uma nova mídia usando o botão principal.
                  </div>
                </div>
              )}

              {errorMessage && (
                <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs p-3.5 rounded-lg flex gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Action buttons */}
              <div className="flex gap-2 justify-end pt-5 border-t border-slate-100">
                <button 
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingMedia(null);
                  }}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-lg text-xs cursor-pointer"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold rounded-lg text-xs cursor-pointer shadow-xs"
                >
                  {loading ? "Salvando..." : "Salvar Alterações"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
