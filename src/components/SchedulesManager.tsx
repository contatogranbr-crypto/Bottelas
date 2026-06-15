import React, { useState } from "react";
import { Calendar, Plus, Trash2, Edit2, Play, AlertCircle, Check, Hourglass, Clock, ArrowRight, UserCheck } from "lucide-react";
import { Schedule, Playlist, Screen } from "../types";

interface SchedulesManagerProps {
  schedules: Schedule[];
  playlists: Playlist[];
  screens: Screen[];
  onCreateSchedule: (data: Omit<Schedule, 'id' | 'createdAt'>) => Promise<void>;
  onUpdateSchedule: (id: string, updates: Partial<Schedule>) => Promise<void>;
  onDeleteSchedule: (id: string) => Promise<void>;
}

export function SchedulesManager({ schedules, playlists, screens, onCreateSchedule, onUpdateSchedule, onDeleteSchedule }: SchedulesManagerProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);

  // Form parameters
  const [name, setName] = useState("");
  const [playlistId, setPlaylistId] = useState("");
  const [activeType, setActiveType] = useState<'always' | 'scheduled'>('always');
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>([]);
  const [startTime, setStartTime] = useState("08:00");
  const [endTime, setEndTime] = useState("18:00");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedScreens, setSelectedScreens] = useState<string[]>([]);

  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleOpenAdd = () => {
    setName("");
    setPlaylistId(playlists[0]?.id || "");
    setActiveType("always");
    setDaysOfWeek([]);
    setStartTime("08:00");
    setEndTime("18:00");
    setStartDate("");
    setEndDate("");
    setSelectedScreens([]);
    setErrorMessage("");
    setShowAddModal(true);
  };

  const handleStartEdit = (sch: Schedule) => {
    setEditingSchedule(sch);
    setName(sch.name);
    setPlaylistId(sch.playlistId);
    setActiveType(sch.activeType || "always");
    setDaysOfWeek(sch.daysOfWeek || []);
    setStartTime(sch.startTime || "08:00");
    setEndTime(sch.endTime || "18:00");
    setStartDate(sch.startDate || "");
    setEndDate(sch.endDate || "");
    setSelectedScreens(sch.screens || []);
    setErrorMessage("");
  };

  const toggleDayOfWeek = (day: number) => {
    if (daysOfWeek.includes(day)) {
      setDaysOfWeek(prev => prev.filter(d => d !== day));
    } else {
      setDaysOfWeek(prev => [...prev, day]);
    }
  };

  const toggleScreenSelection = (screenId: string) => {
    if (selectedScreens.includes(screenId)) {
      setSelectedScreens(prev => prev.filter(id => id !== screenId));
    } else {
      setSelectedScreens(prev => [...prev, screenId]);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    if (!playlistId) {
      setErrorMessage("Por favor, escolha uma Playlist associada.");
      return;
    }
    if (selectedScreens.length === 0) {
      setErrorMessage("Você precisa selecionar pelo menos 1 Tela para esta programação.");
      return;
    }

    setLoading(true);
    try {
      const schedulePayload = {
        name,
        playlistId,
        activeType,
        daysOfWeek,
        startTime: activeType === "scheduled" ? startTime : undefined,
        endTime: activeType === "scheduled" ? endTime : undefined,
        startDate: activeType === "scheduled" && startDate ? startDate : undefined,
        endDate: activeType === "scheduled" && endDate ? endDate : undefined,
        screens: selectedScreens
      };

      if (editingSchedule) {
        await onUpdateSchedule(editingSchedule.id, schedulePayload);
        setEditingSchedule(null);
      } else {
        await onCreateSchedule(schedulePayload);
        setShowAddModal(false);
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Erro ao salvar agendamento.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, schName: string) => {
    if (confirm(`Deseja realmente apagar o agendamento de "${schName}"?`)) {
      try {
        await onDeleteSchedule(id);
      } catch (err) {
        console.error(err);
      }
    }
  };

  const daysLabel = ["D", "S", "T", "Q", "Q", "S", "S"];
  const daysFull = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

  return (
    <div className="space-y-6">
      {/* Upper header action area */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Grade de Exibição / Agendamentos</h1>
          <p className="text-sm text-slate-500 mt-1">
            Programe playlists específicas para horários rotativos, eventos marcados ou fusos comerciais da sua empresa.
          </p>
        </div>

        <button 
          onClick={handleOpenAdd}
          disabled={playlists.length === 0 || screens.length === 0}
          className="flex items-center gap-1.5 px-3.5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold rounded-lg cursor-pointer transition-colors shadow-xs shrink-0 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> Novo Agendamento Temporal
        </button>
      </div>

      {playlists.length === 0 || screens.length === 0 ? (
        <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-xl p-6 text-sm text-left max-w-2xl mx-auto">
          <div className="flex gap-3">
            <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
            <div>
              <h4 className="font-bold">Aviso pré-requisito</h4>
              <p className="text-xs text-amber-800 mt-1 leading-relaxed">
                Antes de estipular agendamentos automáticos por dias e horários, você precisa ter:
              </p>
              <ul className="list-disc pl-4 text-xs mt-2 space-y-1 text-amber-800">
                <li>Pelo menos uma <strong>Tela corporativa cadastrada</strong> (aba Telas).</li>
                <li>Pelo menos uma <strong>Playlist com mídias</strong> (aba Playlists).</li>
              </ul>
            </div>
          </div>
        </div>
      ) : schedules.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl py-16 px-4 text-center max-w-lg mx-auto">
          <div className="w-12 h-12 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center justify-center mx-auto mb-4 text-indigo-600">
            <Calendar className="w-6 h-6" />
          </div>
          <p className="text-sm font-bold text-slate-800 mb-1">Grade vazia no momento</p>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mb-5">
            Crie agendas para controlar transmissões automáticas (Ex: Cardápio do Chef somente das 11h às 14h de segunda a sexta).
          </p>
          <button 
            onClick={handleOpenAdd}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg text-xs cursor-pointer"
          >
            Configurar Grade
          </button>
        </div>
      ) : (
        /* List of active schedules */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {schedules.map(sch => {
            const bindPlaylist = playlists.find(p => p.id === sch.playlistId);
            
            return (
              <div 
                key={sch.id}
                className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between text-left"
              >
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <div className="space-y-0.5">
                      <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${sch.activeType === "always" ? "bg-indigo-50 text-indigo-600 border border-indigo-100" : "bg-cyan-50 text-cyan-600 border border-cyan-100"}`}>
                        {sch.activeType === "always" ? "Sempre Ativo" : "Programação Restrita"}
                      </span>
                      <h3 className="font-bold text-slate-900 text-sm pt-1">{sch.name}</h3>
                    </div>

                    <div className="flex gap-1">
                      <button 
                        onClick={() => handleStartEdit(sch)}
                        className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-slate-50 rounded transition-colors"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button 
                        onClick={() => handleDelete(sch.id, sch.name)}
                        className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Programmatic rules details */}
                  <div className="space-y-2 mt-4 py-3.5 border-t border-b border-dashed border-slate-100 text-xs">
                    <div className="flex justify-between text-slate-600">
                      <span>Playlist:</span>
                      <strong className="text-slate-800 font-semibold">{bindPlaylist?.name || "Playlist Removida"}</strong>
                    </div>

                    {sch.activeType === "scheduled" && (
                      <>
                        <div className="flex justify-between text-slate-600">
                          <span>Horário de Atividade:</span>
                          <span className="font-bold text-slate-900">{sch.startTime} às {sch.endTime}</span>
                        </div>

                        {sch.daysOfWeek && sch.daysOfWeek.length > 0 && (
                          <div className="flex justify-between text-slate-600">
                            <span>Dias da Semana:</span>
                            <span className="font-bold text-slate-900">
                              {sch.daysOfWeek.map(d => daysLabel[d]).join(", ")}
                            </span>
                          </div>
                        )}

                        {sch.startDate && sch.endDate && (
                          <div className="flex justify-between text-slate-600">
                            <span>Vigência:</span>
                            <span className="font-light text-slate-500 font-mono text-[10px]">
                              {sch.startDate} - {sch.endDate}
                            </span>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>

                <div className="mt-4 text-xs">
                  <span className="text-[10px] text-slate-400 block mb-1">Telas vinculadas a esta regra</span>
                  <div className="flex flex-wrap gap-1">
                    {sch.screens.map((scrId, idx) => {
                      const scrObj = screens.find(s => s.id === scrId);
                      if (!scrObj) return null;
                      return (
                        <span 
                          key={scrId}
                          className="bg-slate-100 text-slate-600 border border-slate-200/60 font-medium px-2 py-0.5 rounded text-[10px]"
                        >
                          {scrObj.name}
                        </span>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* FULL SCREEN MODAL / FOR ADD & EDIT SCHEDULES */}
      {(showAddModal || editingSchedule) && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 transition-all">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-slate-900 mb-1">
              {editingSchedule ? `Editar Programação: ${editingSchedule.name}` : "Nova Programação de Tela"}
            </h3>
            <p className="text-xs text-slate-400 mb-5 leading-relaxed">
              Associe playlists a uma ou mais TVs com critérios inteligentes de rotas de horários comerciais.
            </p>

            <form onSubmit={handleSave} className="space-y-4 text-left">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Identificador do Agendamento</label>
                <input 
                  type="text" 
                  required
                  placeholder="Ex. Menu do Almoço Executivo"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 text-slate-900 text-xs rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Playlist Corporativa</label>
                  <select 
                    required
                    className="w-full bg-slate-50 border border-slate-300 text-slate-900 text-xs rounded-lg p-2.5"
                    value={playlistId}
                    onChange={(e) => setPlaylistId(e.target.value)}
                  >
                    <option value="">Selecione a playlist...</option>
                    {playlists.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Modo de Vigência</label>
                  <select 
                    className="w-full bg-slate-50 border border-slate-300 text-slate-900 text-xs rounded-lg p-2.5"
                    value={activeType}
                    onChange={(e: any) => setActiveType(e.target.value)}
                  >
                    <option value="always">Ininterrupto (24 horas / Sempre ativo)</option>
                    <option value="scheduled">Personalizado (Dias / Horas)</option>
                  </select>
                </div>
              </div>

              {activeType === "scheduled" && (
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 space-y-4">
                  {/* Hours block */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-indigo-500" /> Início
                      </label>
                      <input 
                        type="time" 
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                        className="w-full bg-white border border-slate-200 text-slate-900 text-xs rounded-lg px-3 py-2"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-indigo-500" /> Fim
                      </label>
                      <input 
                        type="time" 
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                        className="w-full bg-white border border-slate-200 text-slate-900 text-xs rounded-lg px-3 py-2"
                      />
                    </div>
                  </div>

                  {/* Calendar bracket */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Data de Estreia</label>
                      <input 
                        type="date" 
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-full bg-white border border-slate-200 text-slate-900 text-xs rounded-lg px-3 py-2"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Data de Término</label>
                      <input 
                        type="date" 
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="w-full bg-white border border-slate-200 text-slate-900 text-xs rounded-lg px-3 py-2"
                      />
                    </div>
                  </div>

                  {/* Days checker */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Dias da semana ativos</label>
                    <div className="flex gap-2">
                      {daysFull.map((dayName, idx) => {
                        const isChecked = daysOfWeek.includes(idx);
                        return (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => toggleDayOfWeek(idx)}
                            className={`w-9 h-9 rounded-full border text-xs font-bold transition-all cursor-pointer ${isChecked ? "bg-indigo-600 border-indigo-600 text-white shadow-sm" : "bg-white border-slate-200 text-slate-500 hover:bg-slate-100"}`}
                            title={dayName}
                          >
                            {daysLabel[idx]}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* Screens multiselection check */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-1">
                  <UserCheck className="w-3.5 h-3.5" /> Vincular a quais Telas?
                </label>
                <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 max-h-36 overflow-y-auto space-y-1.5">
                  {screens.map(scr => {
                    const isSelected = selectedScreens.includes(scr.id);
                    return (
                      <button
                        key={scr.id}
                        type="button"
                        onClick={() => toggleScreenSelection(scr.id)}
                        className={`w-full p-2.5 rounded-lg text-left text-xs font-semibold flex items-center justify-between border cursor-pointer ${isSelected ? "bg-white border-indigo-600/60 text-indigo-900 shadow-xs" : "bg-transparent border-transparent text-slate-600 hover:bg-slate-200/40"}`}
                      >
                        <span className="truncate">{scr.name} ({scr.location || "Principal"})</span>
                        {isSelected ? (
                          <span className="w-4 h-4 bg-indigo-600 rounded-full flex items-center justify-center text-white text-[9px]">✓</span>
                        ) : (
                          <span className="w-4 h-4 rounded-full border border-slate-300"></span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {errorMessage && (
                <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs p-3.5 rounded-lg flex gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Bottom modal actions */}
              <div className="border-t border-slate-100 pt-5 flex justify-between gap-1 mt-4">
                <button 
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingSchedule(null);
                  }}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-lg text-xs cursor-pointer"
                >
                  Voltar
                </button>
                <button 
                  type="submit"
                  disabled={loading}
                  className="px-4.5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold rounded-lg text-xs cursor-pointer shadow-xs flex items-center gap-1.5"
                >
                  {loading ? "Gravando grade..." : (editingSchedule ? "Atualizar Regra" : "Salvar Agendamento")} <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
