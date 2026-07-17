/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Client, CoachConfig, WorkoutPlan, WorkoutExercise, LogbookEntry, LogbookSet } from '../types';
import { 
  Dumbbell, Calendar, Plus, Save, History, Check, X, Clipboard, 
  ChevronDown, ChevronUp, Clock, FileText, Trash2, Award, Zap, Copy
} from 'lucide-react';

interface LogbookTrackerProps {
  client: Client;
  config: CoachConfig;
  onShowToast?: (message: string, type: 'success' | 'error' | 'info' | 'warning') => void;
}

const calculateWeekIndexFromDate = (dateStr: string, plan: WorkoutPlan): number => {
  if (!plan.dataInizio) return 1;
  const start = new Date(plan.dataInizio);
  const current = new Date(dateStr);
  
  // Set both to midnight UTC to avoid timezone DST shifts
  const startMs = Date.UTC(start.getFullYear(), start.getMonth(), start.getDate());
  const currentMs = Date.UTC(current.getFullYear(), current.getMonth(), current.getDate());
  
  const diffTime = currentMs - startMs;
  if (diffTime < 0) {
    return 1;
  }
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  const week = Math.floor(diffDays / 7) + 1;
  const maxWeeks = plan.durataSettimane || 4;
  return Math.min(Math.max(1, week), maxWeeks);
};

const findLastPerformanceLog = (
  item: {
    id: string;
    nome: string;
    targetEx: WorkoutExercise;
  },
  allLogs: LogbookEntry[],
  clientId: string
): LogbookEntry | undefined => {
  const clientLogs = allLogs.filter(l => l.clienteId === clientId);
  const targetProgramRowId = item.targetEx?.programRowId;
  const targetExerciseId = item.id;
  const targetNormName = item.nome.trim().toLowerCase();

  // Sort by date descending
  const sortedLogs = [...clientLogs].sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());

  // Order of priority:
  // 1. programRowId
  if (targetProgramRowId) {
    const matchByRow = sortedLogs.find(l => l.programRowId === targetProgramRowId);
    if (matchByRow) return matchByRow;
  }

  // 2. exerciseId (only if not from a different row/programRowId)
  if (targetExerciseId) {
    const matchByExId = sortedLogs.find(l => {
      if (l.exerciseId !== targetExerciseId) return false;
      if (targetProgramRowId && l.programRowId && l.programRowId !== targetProgramRowId) {
        return false;
      }
      return true;
    });
    if (matchByExId) return matchByExId;
  }

  // 3. normalized name (only if not from a different row/programRowId)
  const matchByName = sortedLogs.find(l => {
    if (!l.exerciseNome) return false;
    if (l.exerciseNome.trim().toLowerCase() !== targetNormName) return false;
    if (targetProgramRowId && l.programRowId && l.programRowId !== targetProgramRowId) {
      return false;
    }
    return true;
  });
  return matchByName;
};

export default function LogbookTracker({ client, config, onShowToast }: LogbookTrackerProps) {
  // Local storage logs
  const [logs, setLogs] = useState<LogbookEntry[]>([]);
  const [clientPlans, setClientPlans] = useState<WorkoutPlan[]>([]);
  const [showLogForm, setShowLogForm] = useState(false);

  // Form state
  const [logDate, setLogDate] = useState(new Date().toISOString().substring(0, 10));
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [selectedWeekIndex, setSelectedWeekIndex] = useState<number>(1);
  const [selectedDayId, setSelectedDayId] = useState('');
  const [sessionNotes, setSessionNotes] = useState('');

  // Exercises to log (state-controlled to allow dynamic changes)
  const [logExercises, setLogExercises] = useState<{
    id: string; // exerciseId
    nome: string;
    targetEx: WorkoutExercise;
    sets: { 
      reps: number; 
      weight: number; 
      rir: number;
      blockId?: string;
      blockName?: string;
      targetRepMin?: number;
      targetRepMax?: number;
      targetRir?: number;
      targetCarico?: string;
    }[];
    notes: string;
  }[]>([]);

  // Load client logs and plans from localStorage
  useEffect(() => {
    // Load Logs
    const storedLogs = localStorage.getItem('pt_logbook');
    if (storedLogs) {
      const allLogs: LogbookEntry[] = JSON.parse(storedLogs);
      // Filter for this client only
      setLogs(allLogs.filter(entry => entry.clienteId === client.id));
    } else {
      setLogs([]);
    }

    // Load Plans of this client
    const storedPlans = localStorage.getItem('pt_plans');
    if (storedPlans) {
      const allPlans: WorkoutPlan[] = JSON.parse(storedPlans);
      const filtered = allPlans.filter(p => p.clienteId === client.id);
      setClientPlans(filtered);
      
      // Auto-select the active plan if one is available
      const active = filtered.find(p => p.status === 'Attiva');
      if (active) {
        setSelectedPlanId(active.id);
        const calculated = calculateWeekIndexFromDate(logDate, active);
        setSelectedWeekIndex(calculated);
      }
    } else {
      setClientPlans([]);
    }
  }, [client.id]);

  // Handle plan selection change in form
  const handlePlanChange = (planId: string) => {
    setSelectedPlanId(planId);
    setSelectedDayId('');
    setLogExercises([]);
    
    const plan = clientPlans.find(p => p.id === planId);
    if (plan) {
      const calculatedWeek = calculateWeekIndexFromDate(logDate, plan);
      setSelectedWeekIndex(calculatedWeek);
    } else {
      setSelectedWeekIndex(1);
    }
  };

  // Handle week index change in form
  const handleWeekChange = (weekIndex: number) => {
    setSelectedWeekIndex(weekIndex);
    setSelectedDayId('');
    setLogExercises([]);
  };

  // Handle day selection change in form
  const handleDayChange = (dayId: string) => {
    setSelectedDayId(dayId);
    if (!dayId) {
      setLogExercises([]);
      return;
    }

    const plan = clientPlans.find(p => p.id === selectedPlanId);
    if (!plan) return;

    // FIND THE DAY IN THE SELECTED WEEK OR FALLBACK TO PLAN.GIORNATE (Requirement 4)
    let day;
    if (plan.weeks && plan.weeks.length > 0) {
      const weekObj = plan.weeks.find(w => w.weekIndex === selectedWeekIndex);
      day = weekObj?.giornate.find(d => d.id === dayId || d.programDayId === dayId);
    }
    if (!day) {
      day = plan.giornate.find(d => d.id === dayId);
    }
    if (!day) return;

    // Initialize inputs matching target exercise series (supporting blocks)
    const initialExercises = day.esercizi.map(ex => {
      const hasBlocks = ex.blocks && ex.blocks.length > 0;
      let initialSets;
      if (hasBlocks) {
        initialSets = ex.blocks!.flatMap(b => {
          return Array.from({ length: b.serie }, () => ({
            reps: b.repMax ?? 10,
            weight: 0,
            rir: b.rir ?? 2,
            blockId: b.id,
            blockName: b.nome,
            targetRepMin: b.repMin,
            targetRepMax: b.repMax,
            targetRir: b.rir,
            targetCarico: b.caricoPrevisto ?? ''
          }));
        });
      } else {
        initialSets = Array.from({ length: ex.serie }, () => ({
          reps: ex.repMax ?? 10,
          weight: 0,
          rir: ex.rir ?? 2,
          blockId: undefined,
          blockName: undefined,
          targetRepMin: ex.repMin,
          targetRepMax: ex.repMax,
          targetRir: ex.rir,
          targetCarico: ex.caricoPrevisto ?? ''
        }));
      }

      return {
        id: ex.exerciseId,
        nome: ex.nome,
        targetEx: ex,
        sets: initialSets,
        notes: ''
      };
    });

    setLogExercises(initialExercises);
  };

  // Pre-fill target values (Copia Target)
  const handleCopyTarget = (exIndex: number) => {
    const updated = [...logExercises];
    const item = updated[exIndex];
    
    item.sets = item.sets.map(s => {
      // If it's a block series, use block targets, else exercise targets
      const repMax = s.targetRepMax !== undefined ? s.targetRepMax : (item.targetEx.repMax ?? 10);
      const rir = s.targetRir !== undefined ? s.targetRir : (item.targetEx.rir ?? 2);
      const caricoStr = s.targetCarico !== undefined ? s.targetCarico : (item.targetEx.caricoPrevisto ?? '');
      
      let numericWeight = 0;
      if (caricoStr) {
        const match = caricoStr.match(/\d+(\.\d+)?/);
        if (match) {
          numericWeight = parseFloat(match[0]);
        }
      }
      
      return {
        ...s,
        reps: repMax,
        weight: numericWeight,
        rir: rir
      };
    });

    setLogExercises(updated);
  };

  // Copy last logged performance for this exercise (Copia Ultima Prestazione)
  const handleCopyLastPerformance = (exIndex: number) => {
    const item = logExercises[exIndex];
    
    // Fetch all logs from local storage to search historically
    const storedLogs = localStorage.getItem('pt_logbook');
    if (!storedLogs) {
      if (onShowToast) {
        onShowToast("Nessun allenamento precedente registrato per copiare la prestazione.", "warning");
      } else {
        alert("Nessun allenamento precedente registrato per copiare la prestazione.");
      }
      return;
    }

    const allLogs: LogbookEntry[] = JSON.parse(storedLogs);
    const lastLog = findLastPerformanceLog(item, allLogs, client.id);

    if (!lastLog) {
      if (onShowToast) {
        onShowToast(`Nessuna prestazione passata trovata per l'esercizio "${item.nome}".`, "warning");
      } else {
        alert(`Nessuna prestazione passata trovata per l'esercizio "${item.nome}".`);
      }
      return;
    }

    const updated = [...logExercises];
    
    // Re-fill sets matching the previous log sets count while preserving block targets
    updated[exIndex].sets = lastLog.sets.map((s, idx) => {
      const targetSetInfo = item.sets[idx] || item.sets[item.sets.length - 1] || {};
      return {
        ...targetSetInfo,
        reps: s.repEffettive,
        weight: s.carico,
        rir: s.rirEffettivo
      };
    });

    setLogExercises(updated);
    if (onShowToast) {
      onShowToast(`Copiata l'ultima prestazione per "${item.nome}" (${lastLog.sets.length} set)!`, "success");
    }
  };

  // Update a single cell in the logs spreadsheet grid
  const handleUpdateSetCell = (exIdx: number, setIdx: number, field: 'reps' | 'weight' | 'rir', value: number) => {
    const updated = [...logExercises];
    updated[exIdx].sets[setIdx] = {
      ...updated[exIdx].sets[setIdx],
      [field]: value
    };
    setLogExercises(updated);
  };

  // Delete a logged session from timeline
  const handleDeleteLog = (logId: string) => {
    const confirmed = window.confirm("Sei sicuro di voler eliminare questa sessione d'allenamento dal registro?");
    if (!confirmed) return;

    const storedLogs = localStorage.getItem('pt_logbook');
    if (storedLogs) {
      const allLogs: LogbookEntry[] = JSON.parse(storedLogs);
      const filtered = allLogs.filter(l => l.id !== logId);
      localStorage.setItem('pt_logbook', JSON.stringify(filtered));
      setLogs(filtered.filter(entry => entry.clienteId === client.id));
    }
  };

  // Submit and Save logged session
  const handleSubmitLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlanId || !selectedDayId) {
      alert('Seleziona il programma e la giornata svolta.');
      return;
    }

    const plan = clientPlans.find(p => p.id === selectedPlanId);
    let day;
    if (plan?.weeks && plan.weeks.length > 0) {
      const weekObj = plan.weeks.find(w => w.weekIndex === selectedWeekIndex);
      day = weekObj?.giornate.find(d => d.id === selectedDayId || d.programDayId === selectedDayId);
    }
    if (!day && plan) {
      day = plan.giornate.find(d => d.id === selectedDayId);
    }
    const dayName = day ? day.nome : 'Allenamento';

    // Build the list of LogbookEntry objects (one per exercise in the session)
    const newEntries: LogbookEntry[] = logExercises.map(ex => {
      const sets: LogbookSet[] = ex.sets.map((s, idx) => ({
        serieIndex: idx + 1,
        repEffettive: Number(s.reps),
        carico: Number(s.weight),
        rirEffettivo: Number(s.rir),
        blockId: s.blockId,
        blockName: s.blockName,
        targetRepMin: s.targetRepMin,
        targetRepMax: s.targetRepMax,
        targetRir: s.targetRir,
        targetCarico: s.targetCarico
      }));

      return {
        id: 'log_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
        clienteId: client.id,
        data: logDate,
        giornataNome: dayName,
        exerciseId: ex.id,
        exerciseNome: ex.nome,
        sets,
        note: ex.notes.trim() || undefined,
        programRowId: ex.targetEx?.programRowId,
        weekIndex: selectedWeekIndex,
        programDayId: day?.programDayId
      };
    });

    // Save to localStorage
    const storedLogs = localStorage.getItem('pt_logbook');
    const allLogs: LogbookEntry[] = storedLogs ? JSON.parse(storedLogs) : [];
    
    // Append new entries
    const updatedAllLogs = [...allLogs, ...newEntries];
    localStorage.setItem('pt_logbook', JSON.stringify(updatedAllLogs));

    // Update local state
    setLogs(updatedAllLogs.filter(entry => entry.clienteId === client.id));
    
    // Reset form
    setShowLogForm(false);
    setSelectedPlanId('');
    setSelectedDayId('');
    setLogExercises([]);
    setSessionNotes('');
    
    if (onShowToast) {
      onShowToast('Sessione d\'allenamento salvata con successo nel Registro!', 'success');
    } else {
      alert('Sessione d\'allenamento salvata con successo nel Registro!');
    }
  };

  // Group logbook entries by Date + Day name to show them as unified workout sessions in timeline
  const groupedSessions = (() => {
    const map: { [key: string]: { date: string; dayName: string; entries: LogbookEntry[] } } = {};
    
    logs.forEach(log => {
      const key = `${log.data}_${log.giornataNome}`;
      if (!map[key]) {
        map[key] = {
          date: log.data,
          dayName: log.giornataNome,
          entries: []
        };
      }
      map[key].entries.push(log);
    });

    return Object.values(map).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  })();

  const activePlan = clientPlans.find(p => p.id === selectedPlanId);
  const activeWeekObj = activePlan?.weeks?.find(w => w.weekIndex === selectedWeekIndex);
  const giornateList = activeWeekObj ? activeWeekObj.giornate : (activePlan ? activePlan.giornate : []);
  const isDateBeforeStart = !!(activePlan && activePlan.dataInizio && new Date(logDate) < new Date(activePlan.dataInizio));

  return (
    <div id="logbook-tracker" className="space-y-5 text-left">
      
      {/* Title block */}
      <div className="flex justify-between items-center">
        <span className="text-[10px] uppercase font-black text-white/40 tracking-wider">Registro Allenamenti</span>
        {!showLogForm && clientPlans.length > 0 && (
          <button
            onClick={() => {
              setLogDate(new Date().toISOString().substring(0, 10));
              setShowLogForm(true);
            }}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider text-neutral-950 cursor-pointer shadow"
            style={{ backgroundColor: config.primaryColor }}
          >
            <Plus className="w-3.5 h-3.5" />
            Registra Seduta
          </button>
        )}
      </div>

      {/* ================= SESSION LOGGER FORM ================= */}
      {showLogForm ? (
        <form onSubmit={handleSubmitLog} className="bg-black/40 border border-[#CCFF00]/10 rounded-2xl p-5 space-y-4 relative">
          <button
            type="button"
            onClick={() => setShowLogForm(false)}
            className="absolute top-4 right-4 text-white/30 hover:text-white p-1"
          >
            <X className="w-4 h-4" />
          </button>

          <h3 className="text-xs font-black uppercase tracking-wider text-white/90 flex items-center gap-1.5">
            <Zap className="w-4 h-4 text-[#CCFF00]" style={{ color: config.primaryColor }} />
            Registra Nuova Sessione
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
            <div className="space-y-1">
              <label className="block text-[8px] uppercase tracking-wider text-white/40 font-bold">Data Seduta</label>
              <input
                type="date"
                required
                value={logDate}
                onChange={(e) => {
                  const newDate = e.target.value;
                  setLogDate(newDate);
                  if (activePlan) {
                    const calculated = calculateWeekIndexFromDate(newDate, activePlan);
                    if (calculated !== selectedWeekIndex) {
                      setSelectedWeekIndex(calculated);
                      setSelectedDayId('');
                      setLogExercises([]);
                    }
                  }
                }}
                className="w-full px-2.5 py-1.5 bg-black/60 border border-white/5 rounded-lg text-white text-xs focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-[8px] uppercase tracking-wider text-white/40 font-bold">Programma Attivo</label>
              <select
                required
                value={selectedPlanId}
                onChange={(e) => handlePlanChange(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-black/60 border border-white/5 rounded-lg text-white text-xs focus:outline-none"
              >
                <option value="">-- Seleziona Scheda --</option>
                {clientPlans.map(p => (
                  <option key={p.id} value={p.id}>{p.nome} ({p.status})</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="block text-[8px] uppercase tracking-wider text-white/40 font-bold">Settimana del programma</label>
              <select
                required
                disabled={!selectedPlanId}
                value={selectedWeekIndex}
                onChange={(e) => handleWeekChange(Number(e.target.value))}
                className="w-full px-2.5 py-1.5 bg-black/60 border border-white/5 rounded-lg text-white text-xs focus:outline-none disabled:opacity-40 font-bold"
                style={{ color: selectedPlanId ? config.primaryColor : undefined }}
              >
                {Array.from({ length: activePlan?.durataSettimane || 4 }, (_, i) => i + 1).map(wIdx => (
                  <option key={wIdx} value={wIdx}>Settimana {wIdx}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="block text-[8px] uppercase tracking-wider text-white/40 font-bold">Sessione Svolta</label>
              <select
                required
                disabled={!selectedPlanId}
                value={selectedDayId}
                onChange={(e) => handleDayChange(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-black/60 border border-white/5 rounded-lg text-white text-xs focus:outline-none disabled:opacity-40"
              >
                <option value="">-- Seleziona Giorno --</option>
                {giornateList.map(d => (
                  <option key={d.id} value={d.id}>{d.nome}</option>
                ))}
              </select>
            </div>

            {isDateBeforeStart && (
              <div className="col-span-1 sm:col-span-4 bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 text-amber-200 text-[11px] leading-relaxed">
                ⚠️ La data selezionata ({new Date(logDate).toLocaleDateString('it-IT')}) è precedente alla data di inizio di questa scheda ({activePlan?.dataInizio ? new Date(activePlan.dataInizio).toLocaleDateString('it-IT') : ''}). Impostata automaticamente su Settimana 1.
              </div>
            )}
          </div>

          {/* Log Spreadsheet Grid */}
          {logExercises.length > 0 && (
            <div className="space-y-4 pt-2">
              <div className="border-t border-white/5 pt-3 flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                <span className="text-[9px] uppercase font-black text-[#CCFF00] tracking-wider block" style={{ color: config.primaryColor }}>Registrazione Esercizi</span>
                <button
                  type="button"
                  onClick={() => {
                    let copiedCount = 0;
                    const updated = logExercises.map(ex => {
                      const storedLogs = localStorage.getItem('pt_logbook');
                      if (storedLogs) {
                        const allLogs: LogbookEntry[] = JSON.parse(storedLogs);
                        const lastLog = findLastPerformanceLog(ex, allLogs, client.id);
                        if (lastLog) {
                          copiedCount++;
                          return {
                            ...ex,
                            sets: lastLog.sets.map((s, idx) => {
                              const targetSetInfo = ex.sets[idx] || ex.sets[ex.sets.length - 1] || {};
                              return {
                                ...targetSetInfo,
                                reps: s.repEffettive,
                                weight: s.carico,
                                rir: s.rirEffettivo
                              };
                            })
                          };
                        }
                      }
                      return ex;
                    });
                    setLogExercises(updated);
                    if (onShowToast) {
                      onShowToast(`Copiate le ultime prestazioni per ${copiedCount} esercizi!`, 'success');
                    } else {
                      alert(`Copiate le ultime prestazioni per ${copiedCount} esercizi!`);
                    }
                  }}
                  className="px-2.5 py-1 rounded bg-[#CCFF00]/10 hover:bg-[#CCFF00]/20 text-[#CCFF00] text-[9px] font-black uppercase tracking-wider cursor-pointer self-start sm:self-auto transition-colors"
                  style={{ color: config.primaryColor, backgroundColor: `${config.primaryColor}15` }}
                >
                  Copia tutte le ultime prestazioni
                </button>
              </div>

              <div className="space-y-4">
                {logExercises.map((ex, exIdx) => (
                  <div key={ex.id} className="bg-black/60 p-3 rounded-xl border border-white/5 space-y-2 text-xs">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-extrabold text-white text-xs">{exIdx + 1}. {ex.nome}</p>
                        {ex.targetEx.blocks && ex.targetEx.blocks.length > 0 ? (
                          <p className="text-[10px] text-[#CCFF00]/85 font-black uppercase tracking-wider" style={{ color: config.primaryColor }}>
                            Esercizio strutturato a blocchi ({ex.targetEx.blocks.length} blocchi)
                          </p>
                        ) : (
                          <p className="text-[10px] text-white/40">
                            Target: {ex.targetEx.serie}x{ex.targetEx.repMin}-{ex.targetEx.repMax} • RIR {ex.targetEx.rir} • {ex.targetEx.caricoPrevisto || 'A sensazione'}
                          </p>
                        )}
                      </div>

                      {/* Copia buttons */}
                      <div className="flex gap-1">
                        <button
                          type="button"
                          onClick={() => handleCopyTarget(exIdx)}
                          className="px-2 py-1 rounded bg-neutral-800 text-white hover:bg-neutral-750 text-[9px] font-bold uppercase tracking-wider flex items-center gap-1 cursor-pointer"
                        >
                          <Clipboard className="w-3 h-3" />
                          Target
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCopyLastPerformance(exIdx)}
                          className="px-2 py-1 rounded bg-neutral-800 text-white hover:bg-neutral-750 text-[9px] font-bold uppercase tracking-wider flex items-center gap-1 cursor-pointer"
                        >
                          <History className="w-3 h-3" />
                          Ultimo log
                        </button>
                      </div>
                    </div>

                    {/* Set Rows */}
                    <div className="space-y-1.5">
                      {ex.sets.map((set, sIdx) => (
                        <div key={sIdx} className="grid grid-cols-4 gap-2 items-center text-[11px]">
                          <span className="text-white/40 font-mono">SET {sIdx + 1}</span>
                          <div className="flex items-center gap-1 bg-black/40 px-1.5 py-0.5 rounded border border-white/5">
                            <span className="text-white/30 text-[9px]">Kg:</span>
                            <input
                              type="number"
                              step="0.5"
                              value={set.weight || ''}
                              onChange={(e) => handleUpdateSetCell(exIdx, sIdx, 'weight', Number(e.target.value))}
                              className="w-full bg-transparent text-white text-right text-[11px] focus:outline-none font-bold"
                              placeholder="0"
                            />
                          </div>

                          <div className="flex items-center gap-1 bg-black/40 px-1.5 py-0.5 rounded border border-white/5">
                            <span className="text-white/30 text-[9px]">Reps:</span>
                            <input
                              type="number"
                              value={set.reps || ''}
                              onChange={(e) => handleUpdateSetCell(exIdx, sIdx, 'reps', Number(e.target.value))}
                              className="w-full bg-transparent text-white text-right text-[11px] focus:outline-none font-bold"
                              placeholder="10"
                            />
                          </div>

                          <div className="flex items-center gap-1 bg-black/40 px-1.5 py-0.5 rounded border border-white/5">
                            <span className="text-white/30 text-[9px]">RIR:</span>
                            <input
                              type="number"
                              value={set.rir}
                              onChange={(e) => handleUpdateSetCell(exIdx, sIdx, 'rir', Number(e.target.value))}
                              className="w-full bg-transparent text-white text-right text-[11px] focus:outline-none font-bold"
                              placeholder="2"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-3 border-t border-white/5 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowLogForm(false)}
                  className="px-4 py-2 text-xs font-black uppercase tracking-wider text-white/40 hover:text-white rounded-lg hover:bg-white/5"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-black uppercase text-neutral-950 cursor-pointer transition-all shadow-md"
                  style={{ backgroundColor: config.primaryColor }}
                >
                  <Save className="w-4 h-4" />
                  Salva Registro
                </button>
              </div>
            </div>
          )}
        </form>
      ) : null}

      {/* ================= HISTORICAL LOG TIMELINE ================= */}
      <div className="space-y-3">
        <span className="text-[10px] uppercase font-black text-white/40 tracking-wider">Cronologia Registro</span>

        {groupedSessions.length === 0 ? (
          <div className="text-center p-8 bg-black/20 rounded-2xl border border-white/5 text-white/25 text-xs">
            <Clipboard className="w-8 h-8 text-white/10 mx-auto mb-2" />
            <p>Nessuna sessione registrata.</p>
            <p className="text-[10px] text-white/15 mt-1">Registra la prima seduta per tracciare i progressi storici dei carichi.</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
            {groupedSessions.map((session, sIdx) => {
              // Unique id based on entries
              const repId = session.entries[0]?.id || `s_${sIdx}`;
              
              return (
                <div key={repId} className="bg-black/30 p-4 rounded-xl border border-white/5 space-y-3 text-xs relative text-left">
                  {/* Delete entire session button */}
                  <button
                    onClick={() => {
                      session.entries.forEach(entry => handleDeleteLog(entry.id));
                    }}
                    className="absolute top-4 right-4 p-1 rounded bg-black/40 text-white/20 hover:text-red-400 transition-colors cursor-pointer"
                    title="Elimina seduta"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>

                  <div className="flex items-center gap-2 border-b border-white/5 pb-2">
                    <Calendar className="w-4 h-4 text-white/30" />
                    <div>
                      <p className="font-extrabold text-white">{new Date(session.date).toLocaleDateString('it-IT')}</p>
                      <p className="text-[10px] text-white/40 uppercase tracking-widest">{session.dayName}</p>
                    </div>
                  </div>

                  <div className="space-y-3 divide-y divide-white/5">
                    {session.entries.map((exEntry) => (
                      <div key={exEntry.id} className="pt-2.5 first:pt-0 text-left">
                        <p className="font-bold text-white text-[12px] mb-1.5 flex items-center gap-1.5">
                          <Dumbbell className="w-3.5 h-3.5 text-neutral-500" />
                          {exEntry.exerciseNome}
                        </p>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-black/20 p-2 rounded border border-white/5">
                          {exEntry.sets.map((set) => (
                            <div key={set.serieIndex} className="text-left bg-black/40 p-1.5 rounded text-[10px] space-y-0.5">
                              <span className="block text-white/30 font-bold uppercase text-[7px]">SET {set.serieIndex}</span>
                              <p className="text-white font-extrabold text-[11px]">{set.carico}kg x {set.repEffettive}</p>
                              <span className="text-white/40 text-[9px]">RIR {set.rirEffettivo}</span>
                            </div>
                          ))}
                        </div>

                        {exEntry.note && (
                          <p className="text-[10px] text-white/35 italic mt-1 leading-snug">💡 Note: "{exEntry.note}"</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
