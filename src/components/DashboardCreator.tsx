import React, { useState, useEffect } from "react";
import { 
  Plus, Trash2, Clock, CloudSun, Eye, Link2, 
  Image as ImageIcon, Video as VideoIcon, FileText, 
  Newspaper, HelpCircle, Save, Info, Sparkles, 
  Undo2, Redo2, Copy, Layers, Layout, ChevronUp, 
  ChevronDown, Settings, Tablet, Monitor, Grid, CheckCircle2 
} from "lucide-react";
import { MediaItem, DashboardWidget } from "../types";

interface DashboardCreatorProps {
  media: MediaItem[];
  onSaveDashboard: (name: string, widgets: DashboardWidget[], duration: number) => Promise<void>;
  onCancel: () => void;
}

// Visual layout presets (Templates)
interface LayoutTemplate {
  name: string;
  description: string;
  widgets: Omit<DashboardWidget, "id">[];
}

const LAYOUT_TEMPLATES: LayoutTemplate[] = [
  {
    name: "Modelo Split-Screen Clássico",
    description: "Espaço principal para mídias, barra lateral e informativo corrido no rodapé.",
    widgets: [
      { type: "image", gridX: 1, gridY: 1, gridW: 16, gridH: 6, customContent: "Imagem Principal" },
      { type: "clock", gridX: 17, gridY: 1, gridW: 8, gridH: 2 },
      { type: "weather", gridX: 17, gridY: 3, gridW: 8, gridH: 4, customContent: "São Paulo, SP" },
      { type: "feed", gridX: 1, gridY: 7, gridW: 24, gridH: 2, customContent: "geral" }
    ]
  },
  {
    name: "Bento Grid Corporativo Moderno",
    description: "Visual equilibrado agrupando Relógio, Temperatura, Avisos do RH e Vídeo Promocional.",
    widgets: [
      { type: "clock", gridX: 1, gridY: 1, gridW: 8, gridH: 2 },
      { type: "weather", gridX: 9, gridY: 1, gridW: 8, gridH: 2, customContent: "Rio de Janeiro, RJ" },
      { type: "video", gridX: 1, gridY: 3, gridW: 16, gridH: 6 },
      { type: "feed", gridX: 17, gridY: 1, gridW: 8, gridH: 4, customContent: "tecnologia" },
      { type: "text", gridX: 17, gridY: 5, gridW: 8, gridH: 4, customContent: "Sejam muito bem-vindos ao escritório central! Siga as diretrizes de segurança no trabalho." }
    ]
  },
  {
    name: "Painel Informativo e Noticiário",
    description: "Foco total na veiculação de manchetes mundiais rotativas e avisos de texto com alta visibilidade.",
    widgets: [
      { type: "feed", gridX: 1, gridY: 1, gridW: 24, gridH: 4, customContent: "geral" },
      { type: "text", gridX: 1, gridY: 5, gridW: 12, gridH: 4, customContent: "REUNIÃO GERAL DO RH ÁS 15H NO AUDITÓRIO PRINCIPAL" },
      { type: "clock", gridX: 13, gridY: 5, gridW: 12, gridH: 2 },
      { type: "weather", gridX: 13, gridY: 7, gridW: 12, gridH: 2, customContent: "Belo Horizonte, MG" }
    ]
  },
  {
    name: "Visualização Simples Dupla (Side-by-Side)",
    description: "Dividido exatamente ao meio para duas exibições distintas horizontais.",
    widgets: [
      { type: "image", gridX: 1, gridY: 1, gridW: 12, gridH: 8 },
      { type: "text", gridX: 13, gridY: 1, gridW: 12, gridH: 8, customContent: "Mensagem institucional rotativa. Configure suas diretrizes e campanhas internas." }
    ]
  }
];

export function DashboardCreator({ media, onSaveDashboard, onCancel }: DashboardCreatorProps) {
  const [dashboardName, setDashboardName] = useState("Mural Multi-Zona Novo");
  const [duration, setDuration] = useState(25);
  const [orientation, setOrientation] = useState<"landscape" | "portrait">("landscape");
  const [activeTab, setActiveTab] = useState<"properties" | "templates">("properties");
  
  // Widgets list
  const [widgets, setWidgets] = useState<DashboardWidget[]>([]);
  
  // History stack for Undo and Redo operations
  const [history, setHistory] = useState<DashboardWidget[][]>([[]]);
  const [historyIndex, setHistoryIndex] = useState(0);

  // Active Selected widget ID
  const [selectedWidgetId, setSelectedWidgetId] = useState<string | null>(null);

  // Error and submission reporting states
  const [errorMessage, setErrorMessage] = useState("");
  const [successToast, setSuccessToast] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Available library items
  const imageMediaOptions = media.filter(m => m.type === "image");
  const videoMediaOptions = media.filter(m => m.type === "video");

  // Undo / Redo implementation helper hook
  const pushToHistory = (newWidgets: DashboardWidget[]) => {
    const freshHistory = history.slice(0, historyIndex + 1);
    setHistory([...freshHistory, newWidgets]);
    setHistoryIndex(freshHistory.length);
    setWidgets(newWidgets);
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setWidgets(history[historyIndex - 1]);
      setSelectedWidgetId(null);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setWidgets(history[historyIndex + 1]);
      setSelectedWidgetId(null);
    }
  };

  // Safe widget modification wrappers
  const updateWidgetField = (id: string, field: keyof DashboardWidget, value: any) => {
    const updated = widgets.map(w => {
      if (w.id === id) {
        return { ...w, [field]: value };
      }
      return w;
    });
    pushToHistory(updated);
  };

  // Add default new widget
  const handleAddDefaultWidget = () => {
    // Find non-overlapping spot or default sequentially
    const randomTypes: ('image' | 'video' | 'link' | 'feed' | 'weather' | 'clock' | 'text')[] = 
      ['clock', 'weather', 'feed', 'text', 'image'];
    const chosenType = randomTypes[widgets.length % randomTypes.length];
    
    // Choose coordinates that are clean
    let candidateX = 1;
    let candidateY = 1;
    let candidateW = 8;
    let candidateH = 4;

    if (widgets.length > 0) {
      const last = widgets[widgets.length - 1];
      if (last.gridX + last.gridW <= 16) {
        candidateX = last.gridX + last.gridW;
        candidateY = last.gridY;
      } else {
        candidateX = 1;
        candidateY = Math.min(5, last.gridY + last.gridH);
      }
    }

    const defaultImgId = imageMediaOptions[0]?.id || "";
    const defaultVidId = videoMediaOptions[0]?.id || "";

    const newWidget: DashboardWidget = {
      id: "zone-" + Math.random().toString(36).substring(2, 9),
      type: chosenType,
      gridX: candidateX,
      gridY: candidateY,
      gridW: candidateW,
      gridH: candidateH,
      mediaId: chosenType === "image" ? defaultImgId : chosenType === "video" ? defaultVidId : undefined,
      customContent: chosenType === "weather" ? "São Paulo, SP" : 
                     chosenType === "feed" ? "geral" : 
                     chosenType === "text" ? "Digite seu aviso corporativo aqui..." : undefined
    };

    const newWidgetsList = [...widgets, newWidget];
    pushToHistory(newWidgetsList);
    setSelectedWidgetId(newWidget.id);
    setErrorMessage("");
  };

  const handleRemoveWidget = (id: string) => {
    const remaining = widgets.filter(w => w.id !== id);
    pushToHistory(remaining);
    if (selectedWidgetId === id) {
      setSelectedWidgetId(null);
    }
  };

  const handleDuplicateWidget = (w: DashboardWidget) => {
    let nextX = w.gridX + w.gridW > 24 ? 1 : w.gridX + 1;
    let nextY = w.gridY + w.gridH > 8 ? 1 : w.gridY;

    const dup: DashboardWidget = {
      ...w,
      id: "zone-" + Math.random().toString(36).substring(2, 9),
      gridX: nextX,
      gridY: nextY
    };

    const updated = [...widgets, dup];
    pushToHistory(updated);
    setSelectedWidgetId(dup.id);
  };

  // Layout template trigger injector
  const applyTemplate = (template: LayoutTemplate) => {
    if (confirm("Deseja aplicar este modelo pré-organizado? Isso substituirá suas zonas atuais neste dashboard.")) {
      const defaultImgId = imageMediaOptions[0]?.id || "";
      const defaultVidId = videoMediaOptions[0]?.id || "";

      const mappedWidgets: DashboardWidget[] = template.widgets.map((tw, idx) => ({
        id: `zone-template-${idx}-${Math.random().toString(36).substring(2, 6)}`,
        type: tw.type,
        gridX: tw.gridX,
        gridY: tw.gridY,
        gridW: tw.gridW,
        gridH: tw.gridH,
        mediaId: tw.type === "image" ? defaultImgId : tw.type === "video" ? defaultVidId : undefined,
        customContent: tw.customContent
      }));

      pushToHistory(mappedWidgets);
      setSelectedWidgetId(mappedWidgets[0]?.id || null);
      setSuccessToast(`Modelo "${template.name}" aplicado!`);
      setTimeout(() => setSuccessToast(""), 3000);
    }
  };

  const handleSaveAll = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!dashboardName.trim()) {
      setErrorMessage("Por favor, digite o nome do Dashboard.");
      return;
    }

    if (widgets.length === 0) {
      setErrorMessage("Adicione pelo menos 1 Zona/Widget ao seu layout antes de gravar.");
      return;
    }

    // Coordinates validity pass
    let errorFound = false;
    widgets.forEach(w => {
      if (w.gridX + w.gridW - 1 > 24) {
        setErrorMessage(`A zona "${getWidgetTypeName(w.type)}" ultrapassa o limite de 24 colunas.`);
        errorFound = true;
      }
      if (w.gridY + w.gridH - 1 > 8) {
        setErrorMessage(`A zona "${getWidgetTypeName(w.type)}" ultrapassa o limite de 8 linhas.`);
        errorFound = true;
      }
    });

    if (errorFound) return;

    setIsSubmitting(true);
    try {
      await onSaveDashboard(dashboardName, widgets, duration);
    } catch (err: any) {
      setErrorMessage(err.message || "Erro de rede ao salvar dashboard.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper definitions for typography / color pairings
  const getWidgetTypeName = (type: string) => {
    switch (type) {
      case "clock": return "Relógio Digital";
      case "weather": return "Previsão do Clima";
      case "feed": return "Feed de Notícias";
      case "image": return "Mídia: Imagem";
      case "video": return "Mídia: Vídeo Loop";
      case "link": return "Iframe Externo";
      case "text": return "Texto customizado";
      default: return type;
    }
  };

  const getWidgetColor = (type: string) => {
    switch (type) {
      case "clock": return "bg-teal-500/10 border-teal-500/30 text-teal-400";
      case "weather": return "bg-amber-500/10 border-amber-500/30 text-amber-400";
      case "feed": return "bg-red-500/10 border-red-500/30 text-red-400";
      case "image": return "bg-indigo-500/10 border-indigo-500/30 text-indigo-400";
      case "video": return "bg-sky-500/10 border-sky-500/30 text-sky-400";
      case "link": return "bg-orange-500/10 border-orange-500/30 text-orange-400";
      case "text": return "bg-purple-500/10 border-purple-500/30 text-purple-400";
      default: return "bg-slate-500/10 border-slate-500/30 text-slate-400";
    }
  };

  const getWidgetSolidColor = (type: string) => {
    switch (type) {
      case "clock": return "bg-teal-500 text-slate-950";
      case "weather": return "bg-amber-500 text-slate-950";
      case "feed": return "bg-red-500 text-white";
      case "image": return "bg-indigo-500 text-white";
      case "video": return "bg-sky-500 text-slate-950";
      case "link": return "bg-orange-500 text-slate-950";
      case "text": return "bg-purple-500 text-white";
      default: return "bg-slate-500 text-white";
    }
  };

  // Find currently selected widget object
  const activeWidget = widgets.find(w => w.id === selectedWidgetId);

  return (
    <div className="bg-slate-950 text-slate-100 rounded-3xl p-6 shadow-2xl relative border border-slate-850">
      
      {/* Toast alert system for easy feedbacks */}
      {successToast && (
        <div className="fixed top-8 right-8 bg-emerald-600 text-white px-5 py-3 rounded-2xl flex items-center gap-2.5 shadow-2xl border border-emerald-500/30 animate-bounce z-50 text-sm font-bold">
          <CheckCircle2 className="w-5 h-5 text-white" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Primary Header Title bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-slate-900 pb-5 mb-6 gap-4">
        <div>
          <span className="bg-gradient-to-r from-emerald-500/10 to-indigo-500/10 text-emerald-400 text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full border border-emerald-500/20 flex items-center gap-1.5 w-fit mb-2">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" /> MULTI-ZONE LAYOUT CREATOR • BENTO WORKSPACE
          </span>
          <h2 className="text-2xl font-bold tracking-tight text-white mb-0.5">Criador de Tela Dividida (Split Screen)</h2>
          <p className="text-xs text-slate-440 text-slate-400 max-w-2xl leading-relaxed">
            Organize várias mídias em uma única tela dividida em zonas de proporções customizáveis. Perfeito para manter informativos da TV, clima de cidades, feeds de notícias e vídeos rodando simultaneamente.
          </p>
        </div>
        
        <button 
          onClick={onCancel}
          className="text-xs font-semibold px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl cursor-pointer transition-colors border border-slate-800"
        >
          Voltar para Mídias
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        
        {/* SIDEBAR BLOCK (COLSPAN 4): PROPERTIES & PRESETS */}
        <div className="xl:col-span-4 flex flex-col space-y-5">
          
          {/* Subheader Selectors for Mode / Properties */}
          <div className="grid grid-cols-2 p-1 bg-slate-900 rounded-xl border border-slate-850">
            <button
              onClick={() => setActiveTab("properties")}
              className={`py-2 text-xs font-bold rounded-lg cursor-pointer transition-all flex items-center justify-center gap-1.5 ${activeTab === "properties" ? "bg-slate-800 text-white shadow-xs" : "text-slate-500 hover:text-slate-300"}`}
            >
              <Settings className="w-3.5 h-3.5" /> Propriedades
            </button>
            <button
              onClick={() => setActiveTab("templates")}
              className={`py-2 text-xs font-bold rounded-lg cursor-pointer transition-all flex items-center justify-center gap-1.5 ${activeTab === "templates" ? "bg-slate-800 text-white shadow-xs" : "text-slate-500 hover:text-slate-300"}`}
            >
              <Layout className="w-3.5 h-3.5" /> Modelos Prontos
            </button>
          </div>

          {/* MAIN PROPERTIES EDITING TAB */}
          {activeTab === "properties" ? (
            <div className="space-y-4">
              
              {/* Dashboard Global controls */}
              <div className="bg-slate-900 p-4 rounded-2xl border border-slate-850 space-y-4">
                <span className="block text-[10px] font-bold text-slate-450 text-slate-400 uppercase tracking-widest border-b border-slate-850/80 pb-2">Configurações do Mural</span>
                
                <div className="space-y-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Nome do Layout</label>
                    <input 
                      type="text"
                      className="w-full bg-slate-950 border border-slate-800 text-slate-100 text-xs rounded-xl px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium"
                      placeholder="Identificador da TV"
                      value={dashboardName}
                      onChange={(e) => setDashboardName(e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Duração (Seg) (1 slide)</label>
                      <input 
                        type="number"
                        min="5" 
                        max="900"
                        className="w-full bg-slate-950 border border-slate-800 text-slate-100 text-xs rounded-xl p-2.5 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        value={duration}
                        onChange={(e) => setDuration(Number(e.target.value))}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Orientação Física</label>
                      <select
                        className="w-full bg-slate-950 border border-slate-800 text-slate-100 text-xs rounded-xl p-2.5 focus:outline-none"
                        value={orientation}
                        onChange={(e: any) => setOrientation(e.target.value)}
                      >
                        <option value="landscape">Horizontal (Vantagem)</option>
                        <option value="portrait">Vertical (Mural TV)</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Selected zone parameters */}
              <div className="bg-slate-900 p-4 rounded-2xl border border-slate-850 space-y-4">
                <span className="block text-[10px] font-bold text-slate-450 text-slate-400 uppercase tracking-widest border-b border-slate-850/80 pb-2 flex justify-between items-center">
                  <span>Informações da Zona Ativa</span>
                  {activeWidget && (
                    <span className="bg-emerald-500/10 text-emerald-400 text-[9px] px-2 py-0.5 rounded border border-emerald-500/20 font-mono font-bold">SELECIONADA</span>
                  )}
                </span>

                {activeWidget ? (
                  <div className="space-y-4">
                    
                    {/* Widget Type setting */}
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 font-sans">Tipo de Conteúdo</label>
                      <select 
                        className="w-full bg-slate-950 border border-slate-800 text-slate-100 text-xs rounded-xl p-2.5 focus:outline-none font-semibold text-emerald-400"
                        value={activeWidget.type}
                        onChange={(e) => updateWidgetField(activeWidget.id, "type", e.target.value)}
                      >
                        <option value="clock">🕰️ Relógio Digital em Tempo Real</option>
                        <option value="weather">☀️ Clima e Climatologia Local</option>
                        <option value="feed">📰 Notícias / Comunicações Feed</option>
                        <option value="image">🖼️ Bibliotecas: Imagem Estática</option>
                        <option value="video">🎥 Bibliotecas: Vídeo em Loop</option>
                        <option value="link">🌐 Link Externo (Iframe)</option>
                        <option value="text">✍️ Painel Informativo (Texto Estático)</option>
                      </select>
                    </div>

                    {/* Widget content parameters depending on selected type */}
                    {activeWidget.type === "image" && (
                      <div>
                        <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider mb-1.5">Mídia de Imagem</label>
                        {imageMediaOptions.length === 0 ? (
                          <p className="text-[10px] text-amber-500 italic">Cadastre imagens normais no menu principal para selecionar aqui.</p>
                        ) : (
                          <select 
                            className="w-full bg-slate-950 border border-slate-800 text-slate-100 text-xs rounded-xl p-2.5 font-medium"
                            value={activeWidget.mediaId || ""}
                            onChange={(e) => updateWidgetField(activeWidget.id, "mediaId", e.target.value)}
                          >
                            <option value="">-- Selecione a imagem corporativa --</option>
                            {imageMediaOptions.map(m => (
                              <option key={m.id} value={m.id}>{m.name}</option>
                            ))}
                          </select>
                        )}
                      </div>
                    )}

                    {activeWidget.type === "video" && (
                      <div>
                        <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider mb-1.5">Mídia de Vídeo Loop</label>
                        {videoMediaOptions.length === 0 ? (
                          <p className="text-[10px] text-amber-500 italic">Cadastre vídeos normais no menu principal para selecionar aqui.</p>
                        ) : (
                          <select 
                            className="w-full bg-slate-950 border border-slate-800 text-slate-100 text-xs rounded-xl p-2.5 font-medium"
                            value={activeWidget.mediaId || ""}
                            onChange={(e) => updateWidgetField(activeWidget.id, "mediaId", e.target.value)}
                          >
                            <option value="">-- Selecione o vídeo da biblioteca --</option>
                            {videoMediaOptions.map(m => (
                              <option key={m.id} value={m.id}>{m.name}</option>
                            ))}
                          </select>
                        )}
                      </div>
                    )}

                    {activeWidget.type === "weather" && (
                      <div>
                        <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider mb-1.5">Cidade para Previsão</label>
                        <input 
                          type="text" 
                          className="w-full bg-slate-950 border border-slate-800 text-slate-100 text-xs rounded-xl px-3 py-2.5 focus:outline-none"
                          placeholder="Ex. Rio de Janeiro, RJ"
                          value={activeWidget.customContent || ""}
                          onChange={(e) => updateWidgetField(activeWidget.id, "customContent", e.target.value)}
                        />
                      </div>
                    )}

                    {activeWidget.type === "feed" && (
                      <div>
                        <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider mb-1.5 font-sans">Categoria do Feed de Notícias</label>
                        <select 
                          className="w-full bg-slate-950 border border-slate-800 text-slate-100 text-xs rounded-xl p-2.5 focus:outline-none font-medium"
                          value={activeWidget.customContent || "geral"}
                          onChange={(e) => updateWidgetField(activeWidget.id, "customContent", e.target.value)}
                        >
                          <option value="geral">Geral (Notícias Mundiais)</option>
                          <option value="tecnologia">Inovações de Tecnologia e IA</option>
                          <option value="financas">Tendências de Economia e Finanças</option>
                          <option value="corporativo">Avisos Corporativos Oficiais (RH)</option>
                        </select>
                      </div>
                    )}

                    {activeWidget.type === "link" && (
                      <div>
                        <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider mb-1.5">URL de Link Externo</label>
                        <input 
                          type="url" 
                          className="w-full bg-slate-950 border border-slate-800 text-slate-100 text-xs rounded-xl px-3 py-2 focus:outline-none font-mono"
                          placeholder="https://g1.globo.com"
                          value={activeWidget.customContent || ""}
                          onChange={(e) => updateWidgetField(activeWidget.id, "customContent", e.target.value)}
                        />
                        <span className="text-[9px] text-slate-500 mt-1 block">A TV carregará como iframe. Use sites que permitam incorporação.</span>
                      </div>
                    )}

                    {activeWidget.type === "text" && (
                      <div>
                        <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider mb-1.5">Texto do Painel Informativo</label>
                        <textarea 
                          rows={3}
                          className="w-full bg-slate-950 border border-slate-800 text-slate-100 text-xs rounded-xl p-2.5 focus:outline-none"
                          placeholder="Bem-vindo ao Mural Corporativo. Escreva seu texto de avisos..."
                          value={activeWidget.customContent || ""}
                          onChange={(e) => updateWidgetField(activeWidget.id, "customContent", e.target.value)}
                        />
                      </div>
                    )}

                    {/* Coordinates input selectors */}
                    <div className="border-t border-slate-850/80 pt-3.5 space-y-3.5">
                      <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider font-sans">Dimensões da Zona (Grid 24x8)</span>
                      
                      <div className="grid grid-cols-2 gap-3.5">
                        <div>
                          <label className="block text-[9px] text-slate-400 font-bold mb-1 font-mono">X (Coluna Inic):</label>
                          <select 
                            value={activeWidget.gridX} 
                            onChange={(e) => updateWidgetField(activeWidget.id, "gridX", Number(e.target.value))}
                            className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs p-2 rounded-lg"
                          >
                            {Array.from({ length: 24 }, (_, i) => i + 1).map(n => <option key={n} value={n}>{n}</option>)}
                          </select>
                        </div>

                        <div>
                          <label className="block text-[9px] text-slate-400 font-bold mb-1 font-mono">LARGURA (Cols):</label>
                          <select 
                            value={activeWidget.gridW} 
                            onChange={(e) => {
                              const value = Number(e.target.value);
                              updateWidgetField(activeWidget.id, "gridW", value);
                            }}
                            className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs p-2 rounded-lg"
                          >
                            {Array.from({ length: 24 }, (_, i) => i + 1).map(n => <option key={n} value={n}>{n} col{(n > 1) ? 's' : ''}</option>)}
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3.5">
                        <div>
                          <label className="block text-[9px] text-slate-400 font-bold mb-1 font-mono">Y (Linha Inic):</label>
                          <select 
                            value={activeWidget.gridY} 
                            onChange={(e) => updateWidgetField(activeWidget.id, "gridY", Number(e.target.value))}
                            className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs p-2 rounded-lg"
                          >
                            {Array.from({ length: 8 }, (_, i) => i + 1).map(n => <option key={n} value={n}>{n}</option>)}
                          </select>
                        </div>

                        <div>
                          <label className="block text-[9px] text-slate-400 font-bold mb-1 font-mono">ALTURA (Linhas):</label>
                          <select 
                            value={activeWidget.gridH} 
                            onChange={(e) => {
                              const value = Number(e.target.value);
                              updateWidgetField(activeWidget.id, "gridH", value);
                            }}
                            className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs p-2 rounded-lg"
                          >
                            {Array.from({ length: 8 }, (_, i) => i + 1).map(n => <option key={n} value={n}>{n} {n > 1 ? 'linhas' : 'linha'}</option>)}
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Quick remove widget in props */}
                    <button
                      type="button"
                      onClick={() => handleRemoveWidget(activeWidget.id)}
                      className="w-full py-2 bg-rose-950/40 hover:bg-rose-900/30 text-rose-300 font-bold rounded-xl text-xs transition-colors border border-rose-900/30 flex items-center justify-center gap-1.5 cursor-pointer mt-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Deletar Zona Ativa
                    </button>

                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-500 text-xs select-none p-4">
                    <p className="font-semibold text-slate-450 text-slate-400 text-center mb-1">Nenhuma Zona Selecionada</p>
                    <p className="max-w-xs mx-auto text-[11px] text-slate-500 leading-relaxed text-center">
                      Clique em um bloco colorido no preview lateral ou adicione uma nova zona para inspecionar seus parâmetros.
                    </p>
                  </div>
                )}
              </div>

              {/* Grid element tree listing at sidebar footer */}
              <div className="bg-slate-900 p-4 rounded-2xl border border-slate-850 space-y-3">
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-850/80 pb-2">Lista Geral de Zonas ({widgets.length})</span>
                {widgets.length === 0 ? (
                  <p className="text-[11px] text-slate-500 italic p-1">Nenhuma zona no mural.</p>
                ) : (
                  <div className="max-h-[160px] overflow-y-auto space-y-1.5 pr-1">
                    {widgets.map((w, idx) => {
                      const isSel = w.id === selectedWidgetId;
                      const widgetColor = getWidgetSolidColor(w.type);
                      return (
                        <div 
                          key={w.id}
                          onClick={() => setSelectedWidgetId(w.id)}
                          className={`p-2 rounded-xl border flex items-center justify-between text-xs cursor-pointer transition-all ${
                            isSel ? "border-emerald-500 bg-slate-950" : "border-slate-800 bg-slate-950/40 hover:border-slate-700"
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span className={`w-2.5 h-2.5 rounded-full ${widgetColor} shrink-0`} />
                            <div className="truncate text-left leading-tight">
                              <p className={`font-bold truncate ${isSel ? "text-emerald-400" : "text-slate-200"}`}>
                                Zona {idx + 1}: {getWidgetTypeName(w.type)}
                              </p>
                              <p className="text-[9px] font-mono text-slate-500">Col {w.gridX}-{w.gridX + w.gridW - 1} • Row {w.gridY}-{w.gridY + w.gridH - 1}</p>
                            </div>
                          </div>
                          
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveWidget(w.id);
                            }}
                            className="p-1 hover:bg-slate-800 text-slate-400 hover:text-rose-450 rounded shrink-0 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

            </div>
          ) : (
            /* PRECONFIGURED LAYOUT TEMPLATES GRID */
            <div className="space-y-4">
              <div className="bg-slate-900 p-4 rounded-2xl border border-slate-850 space-y-3">
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-850/80 pb-2">Autocomposição Instantânea</span>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Deseja economizar tempo? Escolha um de nossos modelos populares criados especificamente para obter o visual bento grid sem precisar calcular posições.
                </p>
              </div>

              <div className="space-y-3">
                {LAYOUT_TEMPLATES.map((tpl, i) => (
                  <div 
                    key={i}
                    onClick={() => applyTemplate(tpl)}
                    className="p-4 bg-slate-900 hover:bg-slate-850 border border-slate-850 hover:border-slate-750 transition-all rounded-2xl cursor-pointer text-left space-y-1.5 group"
                  >
                    <div className="flex justify-between items-center">
                      <h4 className="text-xs font-bold text-white group-hover:text-emerald-400 transition-colors uppercase tracking-tight">{tpl.name}</h4>
                      <span className="bg-emerald-650 bg-emerald-600/10 text-emerald-400 border border-emerald-500/20 text-[9px] px-2 py-0.5 rounded-full font-bold font-mono">
                        {tpl.widgets.length} Zonas
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">{tpl.description}</p>
                    
                    {/* Visual micro grid dots preview layout representation */}
                    <div className="pt-2 flex gap-1 items-center">
                      {tpl.widgets.map((tw, idx) => {
                        const widgetColor = getWidgetSolidColor(tw.type);
                        return (
                          <span 
                            key={idx} 
                            className={`w-3.5 h-1.5 rounded-sm ${widgetColor} opacity-70`} 
                            title={getWidgetTypeName(tw.type)}
                          />
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {errorMessage && (
            <div className="p-3 bg-red-950/40 border border-red-900/30 text-red-200 rounded-xl text-xs font-medium text-left">
              {errorMessage}
            </div>
          )}

          {/* Action triggers bottom save block */}
          <div className="pt-4 border-t border-slate-900 flex items-center gap-3">
            <button 
              type="button"
              onClick={onCancel}
              className="flex-1 py-3 bg-slate-900 hover:bg-slate-800 text-slate-300 font-bold rounded-xl text-xs transition-colors border border-slate-800 text-center cursor-pointer"
            >
              Cancelar
            </button>
            <button 
              type="button"
              disabled={isSubmitting}
              onClick={handleSaveAll}
              className="flex-[1.5] py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 disabled:opacity-50 text-white font-bold rounded-xl text-xs transition-colors shadow-lg shadow-emerald-950/20 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              {isSubmitting ? "Gravando mural..." : "Salvar Dashboard"}
            </button>
          </div>

        </div>

        {/* WORKSPACE & GRAPHICS EDITOR PREVIEW TAB (COLSPAN 8) */}
        <div className="xl:col-span-8 flex flex-col space-y-4">
          
          {/* Top layout tool status bar */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-3 bg-slate-900 rounded-2xl border border-slate-850 gap-3">
            
            {/* Left buttons: Add Zone, Undo, Redo */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleAddDefaultWidget}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl cursor-pointer transition-colors shadow-md"
              >
                <Plus className="w-4 h-4" /> + Adicionar Zona
              </button>

              <div className="h-6 w-px bg-slate-800 mx-1" />

              <button
                type="button"
                onClick={handleUndo}
                disabled={historyIndex <= 0}
                className="p-2 bg-slate-950 border border-slate-800 hover:border-slate-700 disabled:opacity-30 rounded-xl transition-all cursor-pointer text-slate-300"
                title="Desfazer alteração"
              >
                <Undo2 className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={handleRedo}
                disabled={historyIndex >= history.length - 1}
                className="p-2 bg-slate-950 border border-slate-800 hover:border-slate-700 disabled:opacity-30 rounded-xl transition-all cursor-pointer text-slate-300"
                title="Refazer alteração"
              >
                <Redo2 className="w-4 h-4" />
              </button>
            </div>

            {/* Right: Aspect state info and clear trigger */}
            <div className="flex items-center gap-3">
              <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-slate-500">
                PROVADOR DE TELA: <span className="text-emerald-400">{orientation === "landscape" ? "HORIZONTAL 16:9" : "VERTICAL 9:16"}</span>
              </span>
              
              <button 
                type="button"
                onClick={() => {
                  if (confirm("Deseja apagar todas as mídias e limpar este dashboard?")) {
                    pushToHistory([]);
                    setSelectedWidgetId(null);
                  }
                }}
                className="text-[10px] font-bold text-rose-400 hover:text-rose-350 bg-rose-500/15 border border-rose-500/20 px-2.5 py-1 rounded-lg cursor-pointer"
              >
                Limpar Tudo
              </button>
            </div>

          </div>

          {/* ACTIVE GRAPHICS CANVAS AREA */}
          <div className="flex flex-col items-center justify-center p-4 bg-slate-950 border-2 border-slate-900 rounded-3xl relative">
            
            {/* Visual canvas aspect proportion wrap */}
            <div 
              className={`w-full bg-slate-900 border-4 border-slate-800 rounded-2xl relative overflow-hidden p-3 shadow-2xl transition-all duration-300 flex flex-col justify-between ${
                orientation === "landscape" ? "aspect-video max-w-4xl" : "aspect-[9/16] max-w-sm"
              }`}
            >
              
              {/* Backgrid column guides lines for visual feedback */}
              <div 
                className="absolute inset-3 grid gap-2.5 opacity-2 pointer-events-none"
                style={{
                  gridTemplateColumns: "repeat(24, minmax(0, 1fr))",
                  gridTemplateRows: "repeat(8, minmax(0, 1fr))",
                }}
              >
                {Array.from({ length: 192 }).map((_, i) => (
                  <div key={i} className="border border-white/40 rounded-sm" />
                ))}
              </div>

              {/* Central stage showing placed widgets */}
              <div 
                className="relative w-full h-full grid gap-2.5 z-10"
                style={{
                  gridTemplateColumns: "repeat(24, minmax(0, 1fr))",
                  gridTemplateRows: "repeat(8, minmax(0, 1fr))",
                }}
              >
                {widgets.length === 0 ? (
                  <div className="col-span-full row-span-full flex flex-col items-center justify-center text-center p-6 select-none text-slate-500">
                    <span className="text-4xl mb-3">🖥️</span>
                    <h4 className="font-extrabold text-sm text-slate-350 text-slate-300">Nenhuma zona de layout ativa</h4>
                    <p className="text-[10px] text-slate-500 max-w-xs mt-1 leading-relaxed">
                      Seu bento grid está zerado. Clique no botão <strong className="text-emerald-400">+ Adicionar Zona</strong> acima para montar as sessões ou escolha uma composição pronta na esquerda.
                    </p>
                  </div>
                ) : (
                  widgets.map((w, idx) => {
                    const isSelected = w.id === selectedWidgetId;
                    const colorClasses = getWidgetColor(w.type);
                    const boundMedia = media.find(m => m.id === w.mediaId);

                    return (
                      <div
                        key={w.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedWidgetId(w.id);
                        }}
                        className={`group relative border-2 rounded-2xl p-4 flex flex-col justify-between overflow-hidden shadow-md cursor-pointer transition-all ${
                          isSelected ? "border-emerald-400 ring-2 ring-emerald-500/20 z-30 scale-[1.01]" : "hover:border-slate-600 scale-[1.0]"
                        } ${colorClasses}`}
                        style={{
                          gridColumnStart: w.gridX,
                          gridColumnEnd: w.gridX + w.gridW,
                          gridRowStart: w.gridY,
                          gridRowEnd: w.gridY + w.gridH,
                        }}
                      >
                        
                        {/* Selected overlay handle nodes - strictly replicating the image blue handle dots */}
                        {isSelected && (
                          <>
                            {/* Blue corners handles */}
                            <div className="absolute top-0 left-0 w-2 h-2 bg-emerald-400 rounded-xs -translate-x-[4px] -translate-y-[4px] border border-white" />
                            <div className="absolute top-0 right-0 w-2 h-2 bg-emerald-400 rounded-xs translate-x-[4px] -translate-y-[4px] border border-white" />
                            <div className="absolute bottom-0 left-0 w-2 h-2 bg-emerald-400 rounded-xs -translate-x-[4px] translate-y-[4px] border border-white" />
                            <div className="absolute bottom-0 right-0 w-2 h-2 bg-emerald-400 rounded-xs translate-x-[4px] translate-y-[4px] border border-white" />
                            {/* Intermediate middle nodes */}
                            <div className="absolute top-1/2 left-0 w-2 h-2 bg-emerald-400 rounded-xs -translate-x-[4px] -translate-y-1/2 border border-white" />
                            <div className="absolute top-1/2 right-0 w-2 h-2 bg-emerald-400 rounded-xs translate-x-[4px] -translate-y-1/2 border border-white" />
                            <div className="absolute top-0 left-1/2 w-2 h-2 bg-emerald-400 rounded-xs -translate-x-1/2 -translate-y-[4px] border border-white" />
                            <div className="absolute bottom-0 left-1/2 w-2 h-2 bg-emerald-400 rounded-xs -translate-x-1/2 translate-y-[4px] border border-white" />
                            
                            {/* Floating quick control box at the top in the screenshot */}
                            <div className="absolute top-1 left-1/2 -translate-x-1/2 bg-slate-900 border border-slate-700 px-2 py-0.5 rounded-md flex items-center gap-1.5 shadow-2xl z-40 text-[9px] text-white select-none whitespace-nowrap">
                              <span className="font-bold text-emerald-400 uppercase tracking-widest font-mono">ZONA {idx + 1}</span>
                              <div className="h-2.5 w-px bg-slate-700" />
                              <button 
                                type="button"
                                title="Duplicar zona"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDuplicateWidget(w);
                                }}
                                className="hover:text-emerald-400"
                              >
                                <Copy className="w-2.5 h-2.5" />
                              </button>
                              <button 
                                type="button"
                                title="Excluir"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRemoveWidget(w.id);
                                }}
                                className="hover:text-rose-450 text-rose-400"
                              >
                                <Trash2 className="w-2.5 h-2.5" />
                              </button>
                            </div>
                          </>
                        )}

                        {/* Visual details within each zone */}
                        <div className="flex justify-between items-center z-10">
                          <span className="text-[10px] font-extrabold uppercase tracking-widest font-mono flex items-center gap-1.5">
                            {w.type === "clock" && "🕰️ " + getWidgetTypeName(w.type)}
                            {w.type === "weather" && "☀️ " + getWidgetTypeName(w.type)}
                            {w.type === "feed" && "📰 " + getWidgetTypeName(w.type)}
                            {w.type === "image" && "🖼️ " + getWidgetTypeName(w.type)}
                            {w.type === "video" && "🎥 " + getWidgetTypeName(w.type)}
                            {w.type === "link" && "🌐 " + getWidgetTypeName(w.type)}
                            {w.type === "text" && "✍️ " + getWidgetTypeName(w.type)}
                          </span>
                          
                          <span className="text-[9px] text-slate-500 font-mono font-semibold bg-slate-950/70 px-1.5 py-0.5 rounded">
                            {idx + 1}
                          </span>
                        </div>

                        {/* Interactive simulation placeholders */}
                        <div className="flex-1 flex flex-col justify-center items-center text-center py-2.5 overflow-hidden z-10 font-sans">
                          {w.type === "clock" && (
                            <div className="drop-shadow-md">
                              <span className="font-mono text-xl md:text-2xl font-black text-white leading-none block">11:32:15</span>
                              <span className="text-[8px] text-slate-400 uppercase tracking-widest font-mono block mt-1">Horário de Brasília</span>
                            </div>
                          )}

                          {w.type === "weather" && (
                            <div className="flex items-center gap-2 text-left">
                              <CloudSun className="w-7 h-7 text-amber-400 shrink-0" />
                              <div className="leading-tight min-w-0">
                                <span className="text-sm font-black text-white block">26°C</span>
                                <span className="text-[9px] text-slate-350 truncate block font-medium">
                                  {w.customContent || "São Paulo, SP"}
                                </span>
                              </div>
                            </div>
                          )}

                          {w.type === "feed" && (
                            <div className="w-full text-slate-300 leading-snug px-1 text-left min-w-0">
                              <span className="text-[8px] font-mono font-bold text-red-500 uppercase tracking-wide block mb-0.5">Feed Ativo</span>
                              <p className="text-[10px] italic font-serif line-clamp-2 leading-tight">
                                {w.customContent === "tecnologia" ? "Revoluções das novas ferramentas de segurança de IA..." : 
                                 w.customContent === "financas" ? "Mercado opera em alta expressiva na data de hoje..." : 
                                 w.customContent === "corporativo" ? "Aviso importante: Treinamento geral agendado nas filiais." : 
                                 "Mural de Notícias integrado e atualizado automaticamente na TV."}
                              </p>
                            </div>
                          )}

                          {w.type === "image" && (
                            <div className="w-full h-full relative flex items-center justify-center p-1 bg-black/40 rounded-lg">
                              {boundMedia ? (
                                <img src={boundMedia.url} alt="" className="absolute inset-0 w-full h-full object-cover rounded opacity-70 pointer-events-none" />
                              ) : (
                                <span className="text-[9px] text-slate-500">Mídia: JPG/PNG</span>
                              )}
                              <span className="absolute bottom-1 right-1 bg-black/80 px-1 py-0.5 rounded text-[8px] font-mono text-slate-300 max-w-[85%] truncate">
                                {boundMedia?.name || "Foto"}
                              </span>
                            </div>
                          )}

                          {w.type === "video" && (
                            <div className="w-full h-full relative bg-black/40 rounded-lg flex items-center justify-center p-1">
                              {boundMedia ? (
                                <video src={boundMedia.url} className="absolute inset-0 w-full h-full object-cover rounded opacity-40" muted playsInline />
                              ) : (
                                <span className="text-[9px] text-slate-500">Vídeo silencioso</span>
                              )}
                              <span className="absolute bottom-1 right-1 bg-black/80 px-1 py-0.5 rounded text-[8px] font-mono text-slate-300 max-w-[85%] truncate">
                                {boundMedia?.name || "Loop de Vídeo"}
                              </span>
                            </div>
                          )}

                          {w.type === "link" && (
                            <div className="text-center p-1 leading-normal">
                              <span className="text-[9px] font-mono text-orange-400 break-all font-semibold line-clamp-1">{w.customContent || "https://link-corporativo.com"}</span>
                              <span className="text-[8px] text-slate-500 block mt-0.5">Website incorporado</span>
                            </div>
                          )}

                          {w.type === "text" && (
                            <p className="text-[10px] text-slate-200 line-clamp-2 px-1 leading-snug italic font-mono">
                              "{w.customContent || "Nenhuma frase colocada..."}"
                            </p>
                          )}
                        </div>

                        {/* Widget coordinate tags */}
                        <div className="z-10 flex justify-between items-center text-[8px] font-mono text-slate-500 font-bold border-t border-slate-800/40 pt-1">
                          <span>GRID BRASIL</span>
                          <span>Col {w.gridX} ({w.gridW}cols) × H: {w.gridH}</span>
                        </div>

                      </div>
                    );
                  })
                )}
              </div>

            </div>

            {/* Explanation box under preview */}
            <div className="mt-4 w-full max-w-4xl bg-slate-900 border border-slate-850 p-4 rounded-2xl flex gap-3 text-slate-400 text-xs text-left leading-relaxed">
              <Info className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-slate-300 text-xs">Orientação da TV & Grid de Proporções</p>
                <p className="mt-1 text-slate-400">
                  Qualquer TV ou display vinculado se adaptará perfeitamente a estas dimensões 24x8. Escolha e componha livremente. Você pode alternar o tipo de visualização acima para emular displays verticais de elevadores e totens.
                </p>
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
