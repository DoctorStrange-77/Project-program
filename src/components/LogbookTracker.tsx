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

export default function LogbookTracker({ client, config, onShowToast }: LogbookTrackerProps) {
  // Local storage logs
  const [logs, setLogs] = useState<LogbookEntry[]>([]);
  const [clientPlans, setClientPlans] = useState<WorkoutPlan[]>([]);
  const [showLogForm, setShowLogForm] = useState(false);

  // Form state
  const [logDate, setLogDate] = useState(new Date().toISOString().substring(0, 10));
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [selectedDayId, setSelectedDayId] = useState('');
  const [sessionNotes, setSessionNotes] = useState('');

  // Exercises to log (state-controlled to allow dynamic changes)
  const [logExercises, setLogExercises] = useState<{
    id: string; // exerciseId
    nome: string;
    targetEx: WorkoutExercise;
    sets: { reps: number; weight: number; rir: number }[];
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

    // Use week 1 or standard giornate as template structure
    const day = plan.giornate.find(d => d.id === dayId);
    if (!day) return;

    // Initialize inputs matching target exercise series
    const initialExercises = day.esercizi.map(ex => {
      const sets = Array.from({ length: ex.serie }, () => ({
        reps: ex.repMax || 10,
        weight: 0,
        rir: ex.rir || 2
      }));

      return {
        id: ex.exerciseId,
        nome: ex.nome,
        targetEx: ex,
        sets,
        notes: ''
      };
    });

    setLogExercises(initialExercises);
  };

  // Pre-fill target values (Copia Target)
  const handleCopyTarget = (exIndex: number) => {
    const updated = [...logExercises];
    const item = updated[exIndex];
    
    // Parse weight from caricoPrevisto if it looks like a number, else default 0
    let numericWeight = 0;
    if (item.targetEx.caricoPrevisto) {
      const match = item.targetEx.caricoPrevisto.match(/\d+(\.\d+)?/);
      if (match) {
        numericWeight = parseFloat(match[0]);
      }
    }

    item.sets = item.sets.map(s => ({
      reps: item.targetEx.repMax || 10,
      weight: numericWeight,
      rir: item.targetEx.rir || 2
    }));

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
    // Find the most recent entry for this client and this exercise
    const sortedExerciseLogs = allLogs
      .filter(l => l.clienteId === client.id && (l.exerciseId === item.id || l.exerciseNome.toLowerCase() === item.nome.toLowerCase()))
      .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());

    if (sortedExerciseLogs.length === 0) {
      if (onShowToast) {
        onShowToast(`Nessuna prestazione passata trovata per l'esercizio "${item.nome}".`, "warning");
      } else {
        alert(`Nessuna prestazione passata trovata per l'esercizio "${item.nome}".`);
      }
      return;
    }

    const lastLog = sortedExerciseLogs[0];
    const updated = [...logExercises];
    
    // Re-fill sets matching the previous log sets count
    updated[exIndex].sets = lastLog.sets.map(s => ({
      reps: s.repEffettive,
      weight: s.carico,
      rir: s.rirEffettivo
    }));

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
    const day = plan?.giornate.find(d => d.id === selectedDayId);
    const dayName = day ? day.nome : 'Allenamento';

    // Build the list of LogbookEntry objects (one per exercise in the session)
    const newEntries: LogbookEntry[] = logExercises.map(ex => {
      const sets: LogbookSet[] = ex.sets.map((s, idx) => ({
        serieIndex: idx + 1,
        repEffettive: Number(s.reps),
        carico: Number(s.weight),
        rirEffettivo: Number(s.rir)
      }));

      return {
        id: 'log_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
        clienteId: client.id,
        data: logDate,
        giornataNome: dayName,
        exerciseId: ex.id,
        exerciseNome: ex.nome,
        sets,
        note: ex.notes.trim() || undefined
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

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="space-y-1">
              <label className="block text-[8px] uppercase tracking-wider text-white/40 font-bold">Data Seduta</label>
              <input
                type="date"
                required
                value={logDate}
                onChange={(e) => setLogDate(e.target.value)}
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
              <label className="block text-[8px] uppercase tracking-wider text-white/40 font-bold">Sessione Svolta</label>
              <select
                required
                disabled={!selectedPlanId}
                value={selectedDayId}
                onChange={(e) => handleDayChange(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-black/60 border border-white/5 rounded-lg text-white text-xs focus:outline-none disabled:opacity-40"
              >
                <option value="">-- Seleziona Giorno --</option>
                {activePlan?.giornate.map(d => (
                  <option key={d.id} value={d.id}>{d.nome}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Log Spreadsheet Grid */}
          {logExercises.length > 0 && (
            <div className="space-y-4 pt-2">
              <div className="border-t border-white/5 pt-3 flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                <span className="text-[9px] uppercase font-black text-[#CCFF00] tracking-wider block">Registrazione Esercizi</span>
                <button
                  type="button"
                  onClick={() => {
                    let copiedCount = 0;
                    const updated = logExercises.map(ex => {
                      const storedLogs = localStorage.getItem('pt_logbook');
                      if (storedLogs) {
                        const allLogs: LogbookEntry[] = JSON.parse(storedLogs);
                        const sorted = allLogs
                          .filter(l => l.clienteId === client.id && (l.exerciseId === ex.id || l.exerciseNome.toLowerCase() === ex.nome.toLowerCase()))
                          .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
                        if (sorted.length > 0) {
                          copiedCount++;
                          return {
                            ...ex,
                            sets: sorted[0].sets.map(s => ({
                              reps: s.repEffettive,
                              weight: s.carico,
                              rir: s.rirEffettivo
                            }))
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
                        <p className="text-[10px] text-white/40">Target: {ex.targetEx.serie}x{ex.targetEx.repMin}-{ex.targetEx.repMax} • RIR {ex.targetEx.rir} • {ex.targetEx.caricoPrevisto || 'A sensazione'}</p>
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
