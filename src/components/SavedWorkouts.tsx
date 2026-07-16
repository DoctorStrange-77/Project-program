/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { WorkoutPlan, CoachConfig, WorkoutPlanStatus, WorkoutExercise, DistrettoMuscolare } from '../types';
import { 
  FileText, Calendar, Dumbbell, Clock, Edit2, Copy, Trash2, Printer, 
  Eye, X, Award, ChevronRight, MessageSquare, LayoutGrid, Sliders, Check, Sparkles, Download,
  AlertCircle, CheckSquare
} from 'lucide-react';
import { 
  ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, 
  BarChart, Bar, XAxis, YAxis, Tooltip, Cell, CartesianGrid
} from 'recharts';

const DISTRICT_COLORS: { [key: string]: string } = {
  'Pettorali': '#f97316',          // Arancione vivace
  'Dorso': '#3b82f6',              // Blu elettrico
  'Deltoidi anteriori': '#ec4899', // Rosa
  'Deltoidi laterali': '#a855f7',  // Viola
  'Deltoidi posteriori': '#eab308',// Giallo
  'Spalle': '#f59e0b',             // Ambra
  'Bicipiti': '#10b981',           // Smeraldo
  'Tricipiti': '#14b8a6',           // Teal
  'Quadricipiti': '#06b6d4',       // Ciano
  'Femorali': '#0ea5e9',           // Sky
  'Glutei': '#d946ef',             // Fucsia
  'Adduttori': '#84cc16',          // Lime
  'Abduttori': '#fb7185',          // Rosa antico
  'Polpacci': '#22c55e',           // Verde mela
  'Addome': '#6366f1',             // Indaco
};

interface SavedWorkoutsProps {
  config: CoachConfig;
  plans: WorkoutPlan[];
  onEditPlan: (plan: WorkoutPlan) => void;
  onDuplicatePlan: (plan: WorkoutPlan) => void;
  onDeletePlan: (id: string) => void;
  onPrintPlan: (plan: WorkoutPlan) => void;
  onUpdatePlanStatus?: (planId: string, newStatus: WorkoutPlanStatus) => void;
  onShowToast?: (message: string, type: 'success' | 'error' | 'info' | 'warning') => void;
  onShowConfirm?: (config: {
    title: string;
    message: string;
    confirmText: string;
    cancelText?: string;
    isDestructive?: boolean;
    onConfirm: () => void;
  }) => void;
}

export default function SavedWorkouts({
  config,
  plans,
  onEditPlan,
  onDuplicatePlan,
  onDeletePlan,
  onPrintPlan,
  onUpdatePlanStatus,
  onShowToast,
  onShowConfirm
}: SavedWorkoutsProps) {
  const [selectedPlan, setSelectedPlan] = useState<WorkoutPlan | null>(null);
  const [activeViewWeekIndex, setActiveViewWeekIndex] = useState<number>(1);
  const [statusFilter, setStatusFilter] = useState<string>('Tutte');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Back button popstate modal dismissal for mobile
  useEffect(() => {
    const handlePopState = (e: PopStateEvent) => {
      if (selectedPlan) {
        setSelectedPlan(null);
        e.preventDefault();
      }
    };
    if (selectedPlan) {
      window.history.pushState({ modalOpen: 'plan_details' }, '');
      window.addEventListener('popstate', handlePopState);
    }
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [selectedPlan]);

  const handleDelete = (id: string, name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    const performDelete = () => {
      onDeletePlan(id);
      if (selectedPlan?.id === id) {
        setSelectedPlan(null);
      }
      if (onShowToast) {
        onShowToast(`Scheda "${name}" eliminata con successo.`, 'success');
      }
    };

    if (onShowConfirm) {
      onShowConfirm({
        title: 'Eliminare scheda?',
        message: `Sei sicuro di voler eliminare definitivamente la scheda "${name}"? Questa operazione è irreversibile.`,
        confirmText: 'Sì, elimina',
        isDestructive: true,
        onConfirm: performDelete
      });
    } else {
      const confirmed = window.confirm(`Sei sicuro di voler eliminare definitivamente la scheda "${name}"? Questa operazione è irreversibile.`);
      if (confirmed) {
        performDelete();
      }
    }
  };

  const handleDuplicate = (plan: WorkoutPlan, e: React.MouseEvent) => {
    e.stopPropagation();
    onDuplicatePlan(plan);
  };

  const handleEdit = (plan: WorkoutPlan, e: React.MouseEvent) => {
    e.stopPropagation();
    onEditPlan(plan);
  };

  const handlePrint = (plan: WorkoutPlan, e: React.MouseEvent) => {
    e.stopPropagation();
    onPrintPlan(plan);
  };

  const handleExportPlan = (plan: WorkoutPlan, e: React.MouseEvent) => {
    e.stopPropagation();
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify({ type: 'pt_single_plan', plan }, null, 2))}`;
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', jsonString);
    downloadAnchor.setAttribute('download', `scheda_${plan.nome.toLowerCase().replace(/[^a-z0-9]/g, '_')}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    if (onShowToast) {
      onShowToast(`Scheda "${plan.nome}" esportata con successo!`, 'success');
    }
  };

  const handleStatusChange = (planId: string, nextStatus: WorkoutPlanStatus, e: React.MouseEvent | React.ChangeEvent) => {
    if ('stopPropagation' in e) {
      e.stopPropagation();
    }
    if (onUpdatePlanStatus) {
      onUpdatePlanStatus(planId, nextStatus);
    }
  };

  // Status badge styling helper
  const getStatusBadgeStyle = (status: WorkoutPlanStatus) => {
    switch (status) {
      case 'Attiva':
        return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
      case 'Bozza':
        return 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
      case 'Completata':
        return 'bg-blue-500/10 text-blue-400 border border-blue-500/20';
      case 'Archiviata':
        return 'bg-neutral-500/10 text-neutral-400 border border-neutral-500/20';
      default:
        return 'bg-neutral-500/10 text-neutral-400';
    }
  };

  // Filter and search plans
  const filteredPlans = plans.filter(p => {
    const matchesStatus = statusFilter === 'Tutte' || p.status === statusFilter;
    const matchesSearch = p.nome.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.clienteNomeCompleto.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.obiettivo.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <div id="saved-workouts-view" className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black uppercase tracking-tighter italic text-white">Programmi d'Allenamento</h1>
          <p className="text-xs text-white/40 font-medium">Gestisci, duplica, stampa o modifica i piani di allenamento dei tuoi atleti.</p>
        </div>

        {/* Filters bar */}
        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
          <input
            type="text"
            placeholder="Cerca per atleta o scheda..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="px-3 py-1.5 bg-neutral-900 border border-white/5 rounded-xl text-xs text-white placeholder-white/20 focus:outline-none w-full sm:w-48"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 bg-neutral-900 border border-white/5 rounded-xl text-xs text-white focus:outline-none w-full sm:w-auto"
          >
            <option value="Tutte">Tutti gli stati</option>
            <option value="Attiva">Attivi</option>
            <option value="Bozza">Bozza</option>
            <option value="Completata">Completati</option>
            <option value="Archiviata">Archiviati</option>
          </select>
        </div>
      </div>

      {filteredPlans.length === 0 ? (
        <div className="bg-[#121212] border border-white/5 rounded-2xl p-10 text-center text-white/30">
          <FileText className="w-12 h-12 text-white/10 mx-auto mb-3" />
          <p className="text-sm font-bold">Nessun programma trovato</p>
          <p className="text-xs text-white/20 mt-1">Modifica i filtri di ricerca o crea una nuova scheda per iniziare.</p>
        </div>
      ) : (
        <div id="workouts-grid" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPlans.map((plan) => {
            // Count total exercises
            const totalExercises = plan.giornate.reduce((sum, day) => sum + day.esercizi.length, 0);

            return (
              <div
                key={plan.id}
                id={`plan-card-${plan.id}`}
                onClick={() => {
                  setSelectedPlan(plan);
                  setActiveViewWeekIndex(1);
                }}
                className="bg-[#121212] border border-white/5 hover:border-white/15 p-5 rounded-2xl transition-all cursor-pointer flex flex-col justify-between group hover:shadow-xl relative overflow-hidden"
              >
                {/* Accent glow on hover */}
                <div 
                  className="absolute top-0 left-0 w-1.5 h-full opacity-0 group-hover:opacity-100 transition-opacity" 
                  style={{ backgroundColor: config.primaryColor }}
                />

                <div className="space-y-3">
                  <div className="flex justify-between items-start gap-2">
                    <div className="min-w-0">
                      <h3 className="font-extrabold text-white text-sm sm:text-base group-hover:text-[#CCFF00] transition-colors truncate">{plan.nome}</h3>
                      <p className="text-xs font-semibold text-white/50 mt-0.5">
                        Atleta: <span style={{ color: config.primaryColor }}>{plan.clienteNomeCompleto}</span>
                      </p>
                    </div>

                    {/* Quick status dropdown */}
                    <select
                      value={plan.status || 'Bozza'}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => handleStatusChange(plan.id, e.target.value as WorkoutPlanStatus, e)}
                      className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider focus:outline-none cursor-pointer ${getStatusBadgeStyle(plan.status || 'Bozza')}`}
                    >
                      <option value="Bozza">Bozza</option>
                      <option value="Attiva">Attiva</option>
                      <option value="Completata">Completata</option>
                      <option value="Archiviata">Archiviata</option>
                    </select>
                  </div>

                  {/* Badges/Parameters */}
                  <div className="grid grid-cols-2 gap-2 bg-black/40 p-3 rounded-xl border border-white/5 text-[11px] text-white/40">
                    <p className="flex items-center gap-1.5 font-medium truncate">
                      <Award className="w-3.5 h-3.5 text-white/20 shrink-0" />
                      {plan.obiettivo}
                    </p>
                    <p className="flex items-center gap-1.5 font-medium truncate">
                      <Clock className="w-3.5 h-3.5 text-white/20 shrink-0" />
                      {plan.durataSettimane} settimane
                    </p>
                    <p className="flex items-center gap-1.5 font-medium truncate col-span-2">
                      <Dumbbell className="w-3.5 h-3.5 text-white/20 shrink-0" />
                      {plan.giornate.length} sedute ({totalExercises} es.)
                    </p>
                  </div>
                </div>

                {/* Card footer actions */}
                <div className="flex justify-between items-center mt-5 pt-3 border-t border-white/5">
                  <span className="text-[10px] text-white/35 flex items-center gap-1 font-mono">
                    <Calendar className="w-3 h-3 text-white/20" />
                    {plan.dataCreazione ? new Date(plan.dataCreazione).toLocaleDateString('it-IT') : ''}
                  </span>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={(e) => handlePrint(plan, e)}
                      className="p-1.5 rounded-lg bg-black/40 border border-white/5 hover:bg-neutral-800 text-white/40 hover:text-white transition-colors cursor-pointer"
                      title="Stampa scheda"
                    >
                      <Printer className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => handleExportPlan(plan, e)}
                      className="p-1.5 rounded-lg bg-black/40 border border-white/5 hover:bg-neutral-800 text-white/40 hover:text-white transition-colors cursor-pointer"
                      title="Esporta JSON scheda"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => handleDuplicate(plan, e)}
                      className="p-1.5 rounded-lg bg-black/40 border border-white/5 hover:bg-neutral-800 text-white/40 hover:text-white transition-colors cursor-pointer"
                      title="Duplica scheda"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => handleEdit(plan, e)}
                      className="p-1.5 rounded-lg bg-black/40 border border-white/5 hover:bg-neutral-800 text-white/40 hover:text-white transition-colors cursor-pointer"
                      title="Modifica programma"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => handleDelete(plan.id, plan.nome, e)}
                      className="p-1.5 rounded-lg bg-black/40 border border-white/5 hover:bg-neutral-800 text-white/20 hover:text-red-400 transition-colors cursor-pointer"
                      title="Elimina"
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

      {/* Detail Overlay Drawer/Modal */}
      {selectedPlan && (
        <div id="plan-viewer-modal" className="fixed inset-0 z-50 bg-neutral-950/90 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-3xl bg-[#121212] border border-white/10 rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="p-6 border-b border-white/10 flex justify-between items-center shrink-0">
              <div className="text-left">
                <h3 className="font-extrabold text-white text-base sm:text-lg tracking-tight">{selectedPlan.nome}</h3>
                <p className="text-xs text-white/40 mt-0.5">Assegnata a: <strong style={{ color: config.primaryColor }}>{selectedPlan.clienteNomeCompleto}</strong></p>
              </div>
              <button 
                onClick={() => setSelectedPlan(null)}
                className="text-white/40 hover:text-white p-1.5 bg-neutral-900 border border-white/5 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 text-left">
              
              {/* Program parameters summary cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs text-left">
                <div className="bg-black/40 p-4 rounded-xl border border-white/5">
                  <span className="text-white/30 font-semibold uppercase tracking-wider text-[9px] block mb-1">Obiettivo</span>
                  <span className="font-bold text-white">{selectedPlan.obiettivo}</span>
                </div>
                <div className="bg-black/40 p-4 rounded-xl border border-white/5">
                  <span className="text-white/30 font-semibold uppercase tracking-wider text-[9px] block mb-1">Frequenza</span>
                  <span className="font-bold text-white">{selectedPlan.giornate.length} Sedute / sett</span>
                </div>
                <div className="bg-black/40 p-4 rounded-xl border border-white/5">
                  <span className="text-white/30 font-semibold uppercase tracking-wider text-[9px] block mb-1">Durata totale</span>
                  <span className="font-bold text-white">{selectedPlan.durataSettimane} settimane</span>
                </div>
                <div className="bg-black/40 p-4 rounded-xl border border-white/5">
                  <span className="text-white/30 font-semibold uppercase tracking-wider text-[9px] block mb-1">Inizio</span>
                  <span className="font-bold text-white">{selectedPlan.dataInizio ? new Date(selectedPlan.dataInizio).toLocaleDateString('it-IT') : 'Da definire'}</span>
                </div>
              </div>

              {/* Weekly Tabs Selector if plan has multi-week structures */}
              {selectedPlan.weeks && selectedPlan.weeks.length > 0 && (
                <div className="space-y-3">
                  <span className="text-[10px] font-black uppercase text-white/35 tracking-wider">Visualizzazione Programmazione per Settimana</span>
                  <div className="flex gap-1.5 overflow-x-auto pb-1">
                    {selectedPlan.weeks.map(w => (
                      <button
                        key={w.weekIndex}
                        onClick={() => setActiveViewWeekIndex(w.weekIndex)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                          activeViewWeekIndex === w.weekIndex
                            ? 'bg-white text-neutral-950 font-bold'
                            : 'bg-black/40 text-white/30 hover:text-white/60 border border-white/5'
                        }`}
                      >
                        Settimana {w.weekIndex}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Coach notes if they exist */}
              {selectedPlan.noteGenerali && (
                <div className="bg-black/40 p-4 rounded-xl border border-white/5 text-xs text-left">
                  <span className="text-white/35 font-semibold uppercase tracking-wider text-[9px] block mb-1">Note del Coach</span>
                  <p className="text-white/80 leading-relaxed italic">"{selectedPlan.noteGenerali}"</p>
                </div>
              )}

              {/* Muscle Distribution and Volume Analysis Charts */}
              {(() => {
                const targetWeek = selectedPlan.weeks?.find(w => w.weekIndex === activeViewWeekIndex);
                const giornateToRender = targetWeek ? targetWeek.giornate : selectedPlan.giornate;

                const muscleSets: { [key in DistrettoMuscolare]?: number } = {};
                let totalSets = 0;

                giornateToRender.forEach(day => {
                  day.esercizi.forEach(ex => {
                    const sets = Number(ex.serie) || 0;
                    const muscle = ex.distrettoMuscolare;
                    if (muscle && sets > 0) {
                      muscleSets[muscle] = (muscleSets[muscle] || 0) + sets;
                      totalSets += sets;
                    }
                  });
                });

                if (Object.keys(muscleSets).length === 0) return null;

                return (
                  <div className="space-y-4 pt-4 border-t border-white/5">
                    <span className="text-[10px] font-black uppercase text-white/35 tracking-wider block">Analisi Volumi Settimanali</span>
                    
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {Object.entries(muscleSets).map(([muscle, count]) => {
                        const countNum = Number(count);
                        const percentage = totalSets > 0 ? Math.round((countNum / totalSets) * 100) : 0;
                        return (
                          <div key={muscle} className="p-2.5 bg-black/40 border border-white/5 rounded-lg space-y-1 text-left">
                            <div className="flex justify-between items-center text-[10px]">
                              <span className="font-extrabold text-white/80 uppercase truncate">{muscle}</span>
                              <span className="font-bold font-mono text-white/50">{countNum} s</span>
                            </div>
                            <div className="w-full bg-neutral-800 rounded-full h-1 overflow-hidden">
                              <div className="h-full rounded-full" style={{ width: `${percentage}%`, backgroundColor: DISTRICT_COLORS[muscle] || config.primaryColor }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Radar Chart */}
                      <div className="bg-black/30 p-4 rounded-xl border border-white/5 flex flex-col items-center">
                        <span className="text-[10px] uppercase tracking-wider text-white/40 font-bold mb-2">Profilo Volumi (Radar)</span>
                        <div className="h-60 w-full flex items-center justify-center">
                          <ResponsiveContainer width="100%" height="100%">
                            <RadarChart cx="50%" cy="50%" outerRadius="70%" data={
                              Object.entries(muscleSets).map(([muscle, count]) => ({
                                subject: muscle,
                                value: Number(count) || 0
                              }))
                            }>
                              <PolarGrid stroke="#222" />
                              <PolarAngleAxis dataKey="subject" tick={{ fill: '#aaa', fontSize: 8, fontWeight: 'bold' }} />
                              <PolarRadiusAxis angle={30} domain={[0, 'auto']} tick={{ fill: '#444', fontSize: 8 }} />
                              <Radar name="Serie" dataKey="value" stroke={config.primaryColor} fill={config.primaryColor} fillOpacity={0.25} />
                              <Tooltip contentStyle={{ backgroundColor: '#111', borderColor: '#333', borderRadius: '12px', color: '#fff' }} />
                            </RadarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>

                      {/* Bar Chart */}
                      <div className="bg-black/30 p-4 rounded-xl border border-white/5 flex flex-col items-center">
                        <span className="text-[10px] uppercase tracking-wider text-white/40 font-bold mb-2">Volume per Distretto (Serie)</span>
                        <div className="h-60 w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={
                              Object.entries(muscleSets).map(([muscle, count]) => ({
                                muscle,
                                serie: Number(count) || 0
                              }))
                            } margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                              <XAxis dataKey="muscle" stroke="#666" tick={{ fill: '#999', fontSize: 8, fontWeight: 'bold' }} />
                              <YAxis stroke="#666" tick={{ fill: '#999', fontSize: 9 }} allowDecimals={false} />
                              <Tooltip contentStyle={{ backgroundColor: '#111', borderColor: '#333', borderRadius: '12px', color: '#fff' }} />
                              <Bar dataKey="serie" radius={[4, 4, 0, 0]}>
                                {
                                  Object.entries(muscleSets).map(([muscle]) => (
                                    <Cell key={muscle} fill={DISTRICT_COLORS[muscle] || config.primaryColor} />
                                  ))
                                }
                              </Bar>
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Workout Days Detail Accordion */}
              <div className="space-y-4 text-left">
                <h4 className="font-bold text-white/50 uppercase tracking-wider text-[10px] border-b border-white/5 pb-2">Programma delle Sessioni</h4>
                
                {(() => {
                  const targetWeek = selectedPlan.weeks?.find(w => w.weekIndex === activeViewWeekIndex);
                  const giornateToRender = targetWeek ? targetWeek.giornate : selectedPlan.giornate;

                  return giornateToRender.map((day, dIdx) => (
                    <div key={day.id} className="bg-black/40 p-4 rounded-xl border border-white/5 text-xs space-y-3 text-left">
                      <div className="flex justify-between items-center border-b border-white/5 pb-2 font-bold text-white">
                        <span>{day.nome}</span>
                        <span className="text-[11px] font-normal text-white/30">{day.esercizi.length} esercizi</span>
                      </div>

                      {day.esercizi.length === 0 ? (
                        <p className="text-white/20 italic">Nessun esercizio inserito per questa giornata.</p>
                      ) : (
                        <div className="space-y-3">
                          {day.esercizi.map((ex, exIdx) => {
                            const isInGroup = !!ex.groupId;
                            const isGroupLeader = isInGroup && (exIdx === 0 || day.esercizi[exIdx - 1]?.groupId !== ex.groupId);

                            return (
                              <div 
                                key={ex.id} 
                                className={`transition-all ${
                                  isInGroup 
                                    ? 'border-l-4 pl-3 py-1.5 border-l-[#CCFF00] bg-black/10 my-1' 
                                    : 'pt-2 first:pt-0 border-t border-neutral-900/50 flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2'
                                }`}
                                style={{ borderLeftColor: isInGroup ? config.primaryColor : undefined }}
                              >
                                {isGroupLeader && (
                                  <div className="text-[10px] font-black uppercase text-[#CCFF00] tracking-wider mb-1 flex items-center gap-1" style={{ color: config.primaryColor }}>
                                    <Sparkles className="w-3.5 h-3.5" />
                                    <span>{ex.groupType} (Recupero: {ex.groupRest}s)</span>
                                  </div>
                                )}

                                <div className="space-y-1 text-left">
                                  <p className="font-bold text-white text-sm">
                                    <span className="text-white/30 mr-1.5 font-mono text-xs">{exIdx + 1}.</span> 
                                    {ex.nome}
                                  </p>
                                  
                                  {/* Exercise Details Line */}
                                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-white/40">
                                    <span className="font-semibold text-white/80">{ex.serie} serie</span>
                                    <span className="text-white/20">•</span>
                                    <span>{ex.repMin}-{ex.repMax} rep</span>
                                    <span className="text-white/20">•</span>
                                    <span>RIR {ex.rir}</span>
                                    <span className="text-white/20">•</span>
                                    <span>Recupero: {ex.recupero}s</span>
                                    {ex.tut && (
                                      <>
                                        <span className="text-white/20">•</span>
                                        <span>TUT: {ex.tut}</span>
                                      </>
                                    )}
                                    {ex.tecnicaIntensita && ex.tecnicaIntensita !== 'Nessuna' && (
                                      <>
                                        <span className="text-white/20">•</span>
                                        <span className="font-bold uppercase text-[#CCFF00]" style={{ color: config.primaryColor }}>{ex.tecnicaIntensita}</span>
                                      </>
                                    )}
                                    {ex.caricoPrevisto && (
                                      <>
                                        <span className="text-white/20">•</span>
                                        <span className="text-white/80 font-bold">Carico: {ex.caricoPrevisto}</span>
                                      </>
                                    )}
                                  </div>

                                  {ex.noteSpecificheSettimana && (
                                    <p className="text-[10px] text-[#CCFF00]/60 italic font-medium pt-0.5">
                                      🎯 Focus Settimanale: {ex.noteSpecificheSettimana}
                                    </p>
                                  )}

                                  {ex.noteTecniche.trim() && (
                                    <p className="text-[10px] text-white/30 italic font-medium pt-0.5">
                                      💡 Note: {ex.noteTecniche}
                                    </p>
                                  )}
                                </div>

                                <span 
                                  className="px-2 py-0.5 rounded text-[9px] font-bold text-neutral-950 uppercase sm:self-start self-start mt-1 sm:mt-0 shrink-0"
                                  style={{ backgroundColor: config.primaryColor }}
                                >
                                  {ex.distrettoMuscolare}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ));
                })()}
              </div>
            </div>

            {/* Footer with modal actions */}
            <div className="p-6 border-t border-white/10 shrink-0 bg-neutral-950/30 flex justify-end gap-3 text-xs font-semibold">
              <button
                onClick={(e) => {
                  handlePrint(selectedPlan, e);
                  setSelectedPlan(null);
                }}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-white/5 hover:bg-neutral-800 text-white/80 transition-colors cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                Stampa
              </button>

              <button
                onClick={(e) => {
                  handleExportPlan(selectedPlan, e);
                  setSelectedPlan(null);
                }}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-white/5 hover:bg-neutral-800 text-white/80 transition-colors cursor-pointer"
              >
                <Download className="w-4 h-4" />
                Esporta
              </button>

              <button
                onClick={(e) => {
                  handleEdit(selectedPlan, e);
                  setSelectedPlan(null);
                }}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-white/5 hover:bg-neutral-800 text-white/80 transition-colors cursor-pointer"
              >
                <Edit2 className="w-4 h-4" />
                Modifica
              </button>

              <button
                onClick={() => setSelectedPlan(null)}
                className="px-5 py-2.5 rounded-xl text-neutral-950 cursor-pointer transition-all font-black uppercase tracking-wider"
                style={{ backgroundColor: config.primaryColor }}
              >
                Chiudi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
