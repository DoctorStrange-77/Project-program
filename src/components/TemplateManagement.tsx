/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { WorkoutTemplate, CoachConfig, Client } from '../types';
import { 
  Layers, Search, PlusCircle, Copy, Trash2, Edit, UserPlus, X, Info, 
  LayoutGrid, Dumbbell, Calendar, Heart, ArrowUp, ArrowDown, Sparkles, Check
} from 'lucide-react';

interface TemplateManagementProps {
  config: CoachConfig;
  templates: WorkoutTemplate[];
  clients: Client[];
  onAddTemplate: (newTpl: WorkoutTemplate) => void;
  onUpdateTemplate: (updatedTpl: WorkoutTemplate) => void;
  onDeleteTemplate: (id: string) => void;
  onDuplicateTemplate: (tpl: WorkoutTemplate) => void;
  onAssignTemplate: (tpl: WorkoutTemplate, client: Client) => void;
  onStartCreateTemplate: () => void;
  onStartEditTemplate: (tpl: WorkoutTemplate) => void;
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

export default function TemplateManagement({
  config,
  templates,
  clients,
  onAddTemplate,
  onUpdateTemplate,
  onDeleteTemplate,
  onDuplicateTemplate,
  onAssignTemplate,
  onStartCreateTemplate,
  onStartEditTemplate,
  onShowToast,
  onShowConfirm
}: TemplateManagementProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTpl, setSelectedTpl] = useState<WorkoutTemplate | null>(null);
  const [activeViewWeekIndex, setActiveViewWeekIndex] = useState<number>(1);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [tplToAssign, setTplToAssign] = useState<WorkoutTemplate | null>(null);
  const [selectedClientId, setSelectedClientId] = useState('');
  const [clientSearchQuery, setClientSearchQuery] = useState('');

  const filteredTemplates = templates.filter(tpl => 
    tpl.nome.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tpl.obiettivo.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDelete = (id: string, name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    const performDelete = () => {
      onDeleteTemplate(id);
      if (selectedTpl?.id === id) {
        setSelectedTpl(null);
      }
      if (onShowToast) {
        onShowToast(`Modello "${name}" eliminato con successo.`, 'success');
      }
    };

    if (onShowConfirm) {
      onShowConfirm({
        title: 'Eliminare modello?',
        message: `Sei sicuro di voler eliminare definitivamente il modello "${name}"? Questa operazione è irreversibile.`,
        confirmText: 'Sì, elimina',
        isDestructive: true,
        onConfirm: performDelete
      });
    } else {
      const confirmed = window.confirm(`Sei sicuro di voler eliminare definitivamente il modello "${name}"? Questa operazione è irreversibile.`);
      if (confirmed) {
        performDelete();
      }
    }
  };

  const handleDuplicate = (tpl: WorkoutTemplate, e: React.MouseEvent) => {
    e.stopPropagation();
    onDuplicateTemplate(tpl);
  };

  const handleEdit = (tpl: WorkoutTemplate, e: React.MouseEvent) => {
    e.stopPropagation();
    onStartEditTemplate(tpl);
  };

  const handleOpenAssignModal = (tpl: WorkoutTemplate, e: React.MouseEvent) => {
    e.stopPropagation();
    setTplToAssign(tpl);
    setIsAssignModalOpen(true);
    setSelectedClientId('');
    setClientSearchQuery('');
  };

  const handleConfirmAssign = () => {
    if (!tplToAssign || !selectedClientId) return;
    const client = clients.find(c => c.id === selectedClientId);
    if (client) {
      onAssignTemplate(tplToAssign, client);
      setIsAssignModalOpen(false);
      setTplToAssign(null);
    }
  };

  return (
    <div id="template-management-root" className="flex-1 max-w-7xl mx-auto px-4 py-6 md:px-8 md:py-10 space-y-6">
      
      {/* Upper header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/5 pb-6">
        <div>
          <h1 className="text-2xl font-black uppercase tracking-tight text-white flex items-center gap-2.5">
            <Layers className="w-6 h-6" style={{ color: config.primaryColor }} />
            Modelli d'Allenamento
          </h1>
          <p className="text-xs text-white/50 mt-1">
            Gestisci, duplica e assegna template d'allenamento veloci o personalizzati ai tuoi atleti.
          </p>
        </div>
        <button
          onClick={onStartCreateTemplate}
          className="flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-black uppercase tracking-wider text-neutral-950 transition-all cursor-pointer shadow-lg hover:scale-[1.02] active:scale-[0.98]"
          style={{ backgroundColor: config.primaryColor }}
        >
          <PlusCircle className="w-4 h-4" />
          Nuovo Modello
        </button>
      </div>

      {/* Filter and Search controls */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-white/30" />
          <input
            type="text"
            placeholder="Cerca modello per nome o obiettivo..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-neutral-900 border border-white/5 rounded-xl text-white placeholder-white/20 focus:outline-none focus:border-white/10 text-xs sm:text-sm"
          />
        </div>
      </div>

      {/* Grid List of Templates */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTemplates.map((tpl) => {
          // Compute metadata
          const numWeeks = tpl.durataSettimane || 4;
          const numDays = tpl.giornate?.length || tpl.weeks?.[0]?.giornate?.length || 0;
          const totalExCount = tpl.giornate?.reduce((sum, d) => sum + (d.esercizi?.length || 0), 0) || 0;

          return (
            <div
              key={tpl.id}
              onClick={() => {
                setSelectedTpl(tpl);
                setActiveViewWeekIndex(1);
              }}
              className="bg-neutral-900/60 hover:bg-neutral-900 border border-white/5 hover:border-white/10 rounded-2xl p-5 space-y-4 cursor-pointer transition-all flex flex-col justify-between group"
            >
              <div className="space-y-2">
                <div className="flex justify-between items-start gap-2">
                  <div className="min-w-0">
                    <h3 className="font-extrabold text-white text-sm sm:text-base group-hover:text-[#CCFF00] transition-colors truncate" style={{ groupHoverColor: config.primaryColor }}>
                      {tpl.nome}
                    </h3>
                    <p className="text-[10px] uppercase font-bold tracking-wider text-white/40 mt-0.5">
                      {tpl.obiettivo}
                    </p>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[8px] font-bold text-neutral-950 uppercase" style={{ backgroundColor: config.primaryColor }}>
                    {tpl.livello || 'Intermedio'}
                  </span>
                </div>

                <p className="text-xs text-white/50 line-clamp-2 leading-relaxed">
                  {tpl.noteGenerali || 'Nessuna nota descrittiva inserita.'}
                </p>

                {/* Micro metrics */}
                <div className="grid grid-cols-3 gap-2 pt-2 text-[10px] font-mono text-white/40">
                  <div className="bg-black/30 px-2 py-1.5 rounded-lg border border-white/5">
                    <p className="text-[8px] uppercase font-bold text-white/20">Durata</p>
                    <p className="text-white text-xs font-bold mt-0.5">{numWeeks} sett.</p>
                  </div>
                  <div className="bg-black/30 px-2 py-1.5 rounded-lg border border-white/5">
                    <p className="text-[8px] uppercase font-bold text-white/20">Frequenza</p>
                    <p className="text-white text-xs font-bold mt-0.5">{tpl.allenamentiSettimanali} sedute</p>
                  </div>
                  <div className="bg-black/30 px-2 py-1.5 rounded-lg border border-white/5">
                    <p className="text-[8px] uppercase font-bold text-white/20">Esercizi</p>
                    <p className="text-white text-xs font-bold mt-0.5">{totalExCount} tot.</p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-4 border-t border-white/5 mt-2 gap-2">
                <button
                  type="button"
                  onClick={(e) => handleOpenAssignModal(tpl, e)}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-neutral-800 hover:bg-neutral-700 text-white font-bold text-[10px] uppercase tracking-wider rounded-lg transition-colors cursor-pointer"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Assegna</span>
                </button>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={(e) => handleEdit(tpl, e)}
                    className="p-2 bg-neutral-800/40 border border-white/5 hover:bg-neutral-800 hover:text-[#CCFF00] rounded-lg text-white/50 transition-all cursor-pointer"
                    title="Modifica"
                  >
                    <Edit className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => handleDuplicate(tpl, e)}
                    className="p-2 bg-neutral-800/40 border border-white/5 hover:bg-neutral-800 rounded-lg text-white/50 hover:text-white transition-all cursor-pointer"
                    title="Duplica"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => handleDelete(tpl.id, tpl.nome, e)}
                    className="p-2 bg-neutral-800/40 border border-white/5 hover:bg-neutral-800 text-white/30 hover:text-red-400 rounded-lg transition-all cursor-pointer"
                    title="Elimina"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {filteredTemplates.length === 0 && (
          <div className="col-span-full bg-neutral-900/20 border border-dashed border-white/10 p-12 rounded-2xl text-center text-white/30 text-xs">
            <LayoutGrid className="w-8 h-8 mx-auto mb-3 text-white/20" />
            <p>Nessun modello trovato o corrispondente alla ricerca.</p>
          </div>
        )}
      </div>

      {/* ================= MODAL: DETAILED PREVIEW OF THE SELECTED TEMPLATE ================= */}
      {selectedTpl && (
        <div className="fixed inset-0 z-45 bg-neutral-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-3xl bg-[#0e0e0e] border border-white/10 rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
            
            {/* Modal Header */}
            <div className="p-5 border-b border-white/10 flex justify-between items-center bg-neutral-900">
              <div>
                <h3 className="font-extrabold text-white text-sm sm:text-base uppercase tracking-wider flex items-center gap-2">
                  <LayoutGrid className="w-4.5 h-4.5" style={{ color: config.primaryColor }} />
                  {selectedTpl.nome}
                </h3>
                <p className="text-[10px] text-white/40 uppercase font-mono tracking-widest mt-0.5">
                  Obiettivo: {selectedTpl.obiettivo} • Livello: {selectedTpl.livello || 'Intermedio'}
                </p>
              </div>
              <button
                onClick={() => setSelectedTpl(null)}
                className="text-white/40 hover:text-white p-1 rounded-lg hover:bg-white/5 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5 text-xs text-left">
              
              {selectedTpl.noteGenerali && (
                <div className="bg-neutral-900 p-4 rounded-xl border border-white/5 space-y-1">
                  <h4 className="text-[10px] font-bold text-white/30 uppercase tracking-wider">Note Generali del Modello</h4>
                  <p className="text-white/80 leading-relaxed italic">"{selectedTpl.noteGenerali}"</p>
                </div>
              )}

              {/* Multi-Week selector inside preview */}
              {selectedTpl.weeks && selectedTpl.weeks.length > 0 && (
                <div className="space-y-2">
                  <p className="text-[10px] font-bold text-white/30 uppercase tracking-wider">Progressione Settimanale</p>
                  <div className="flex gap-1.5 overflow-x-auto pb-1">
                    {selectedTpl.weeks.map((w) => (
                      <button
                        key={w.weekIndex}
                        onClick={() => setActiveViewWeekIndex(w.weekIndex)}
                        className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-lg cursor-pointer transition-all shrink-0 ${
                          activeViewWeekIndex === w.weekIndex
                            ? 'bg-neutral-800 text-white shadow'
                            : 'bg-black/30 text-white/30 hover:text-white/60 hover:bg-neutral-900 border border-white/5'
                        }`}
                      >
                        Settimana {w.weekIndex}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Day workouts content of preview */}
              <div className="space-y-4">
                <p className="text-[10px] font-bold text-white/30 uppercase tracking-wider">
                  Programma Allenamento (Settimana {activeViewWeekIndex})
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(
                    selectedTpl.weeks && selectedTpl.weeks.length > 0
                      ? selectedTpl.weeks.find(w => w.weekIndex === activeViewWeekIndex)?.giornate
                      : selectedTpl.giornate
                  )?.map((day, idx) => (
                    <div key={day.id} className="bg-neutral-900/60 p-4 rounded-xl border border-white/5 space-y-3">
                      <p className="font-extrabold text-white text-xs border-b border-white/5 pb-2 flex justify-between">
                        <span>{day.nome}</span>
                        <span className="text-white/30 font-bold">{day.esercizi?.length || 0} esercizi</span>
                      </p>

                      {(!day.esercizi || day.esercizi.length === 0) ? (
                        <p className="text-[11px] text-white/30 italic">Nessun esercizio inserito in questa giornata.</p>
                      ) : (
                        <div className="space-y-2.5 divide-y divide-white/5">
                          {day.esercizi.map((ex, exIdx) => (
                            <div key={ex.id} className="pt-2 first:pt-0 flex justify-between items-start">
                              <div className="space-y-0.5 pr-2">
                                <p className="font-bold text-white text-[11px]">
                                  {exIdx + 1}. {ex.nome} 
                                  {ex.groupId ? <span className="text-[8px] uppercase font-black text-[#CCFF00] ml-1">({ex.groupType})</span> : ''}
                                </p>
                                <p className="text-[10px] text-white/50">
                                  {ex.serie}s x {ex.repMin}-{ex.repMax}r • RIR {ex.rir} • Rec. {ex.recupero}s
                                  {ex.tecnicaIntensita && ex.tecnicaIntensita !== 'Nessuna' ? ` • ${ex.tecnicaIntensita}` : ''}
                                </p>
                                {ex.caricoPrevisto && (
                                  <p className="text-[10px] text-white/40">Carico: <strong className="text-white/60">{ex.caricoPrevisto}</strong></p>
                                )}
                              </div>
                              <span className="px-1 py-0.5 text-[8px] font-bold text-white/40 bg-black/40 border border-white/5 rounded uppercase tracking-wide shrink-0">
                                {ex.distrettoMuscolare}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-white/10 bg-neutral-900 flex justify-end gap-2.5 shrink-0">
              <button
                onClick={() => setSelectedTpl(null)}
                className="px-4 py-2 text-[10px] font-black uppercase bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg transition-colors cursor-pointer"
              >
                Chiudi
              </button>
              <button
                onClick={(e) => {
                  const t = selectedTpl;
                  setSelectedTpl(null);
                  handleOpenAssignModal(t, e);
                }}
                className="px-4 py-2 text-[10px] font-black uppercase text-neutral-950 rounded-lg transition-all cursor-pointer shadow"
                style={{ backgroundColor: config.primaryColor }}
              >
                Assegna ad Atleta
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: SELECT ATHLETE TO ASSIGN TEMPLATE ================= */}
      {isAssignModalOpen && tplToAssign && (
        <div className="fixed inset-0 z-50 bg-neutral-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-neutral-900 border border-white/10 rounded-2xl overflow-hidden shadow-2xl p-6 space-y-4 text-left">
            <div className="flex justify-between items-center">
              <h3 className="font-black text-white text-sm uppercase tracking-wider flex items-center gap-2">
                <UserPlus className="w-4.5 h-4.5 text-[#CCFF00]" style={{ color: config.primaryColor }} />
                Assegna ad Atleta
              </h3>
              <button
                onClick={() => {
                  setIsAssignModalOpen(false);
                  setTplToAssign(null);
                }}
                className="text-white/40 hover:text-white p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="p-3 bg-black/40 rounded-xl border border-white/5 text-xs text-white/60">
                Vuoi assegnare il modello <strong>"{tplToAssign.nome}"</strong> a quale atleta? 
                Questo caricherà tutti i parametri del modello in una nuova scheda d'allenamento per l'atleta selezionato.
              </div>

              <div className="space-y-2">
                <label className="block text-[10px] font-bold text-white/40 uppercase tracking-wider">Seleziona Atleta:</label>
                {clients.length > 0 && (
                  <div className="relative mb-2">
                    <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-white/30" />
                    <input
                      type="text"
                      placeholder="Cerca atleta..."
                      value={clientSearchQuery}
                      onChange={(e) => setClientSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-neutral-950 border border-white/5 rounded-xl text-white placeholder-white/20 focus:outline-none text-xs"
                    />
                  </div>
                )}
                <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1 custom-scrollbar">
                  {(() => {
                    const filteredClients = clients.filter(c => 
                      `${c.nome} ${c.cognome}`.toLowerCase().includes(clientSearchQuery.toLowerCase()) ||
                      c.obiettivo.toLowerCase().includes(clientSearchQuery.toLowerCase())
                    );
                    
                    if (clients.length === 0) {
                      return (
                        <p className="text-[10px] text-amber-400 font-semibold py-2">
                          ⚠️ Nessun atleta presente in archivio. Vai nella sezione "Clienti" per registrarne uno.
                        </p>
                      );
                    }
                    
                    if (filteredClients.length === 0) {
                      return (
                        <p className="text-[10px] text-white/30 italic text-center py-4">Nessun atleta corrisponde alla ricerca.</p>
                      );
                    }
                    
                    return filteredClients.map(c => {
                      const isSelected = selectedClientId === c.id;
                      return (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => setSelectedClientId(c.id)}
                          className={`w-full flex items-center justify-between p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                            isSelected 
                              ? 'bg-neutral-800 border-white/10 text-white' 
                              : 'bg-black/20 border-white/5 text-white/70 hover:bg-neutral-800/60 hover:text-white'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div 
                              className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0 ${
                                isSelected ? 'text-neutral-950 font-black' : 'text-white/60 bg-neutral-800/40 border border-white/5'
                              }`}
                              style={{ backgroundColor: isSelected ? config.primaryColor : undefined }}
                            >
                              {c.nome.charAt(0).toUpperCase()}{c.cognome.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-xs truncate text-white">{c.nome} {c.cognome}</p>
                              <p className="text-[9px] text-white/40 truncate mt-0.5">{c.obiettivo}</p>
                            </div>
                          </div>
                          {isSelected && (
                            <Check className="w-3.5 h-3.5 shrink-0" style={{ color: config.primaryColor }} />
                          )}
                        </button>
                      );
                    });
                  })()}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 text-xs">
              <button
                onClick={() => {
                  setIsAssignModalOpen(false);
                  setTplToAssign(null);
                }}
                className="px-4 py-2 rounded-lg bg-neutral-800 text-white font-bold cursor-pointer"
              >
                Annulla
              </button>
              <button
                onClick={handleConfirmAssign}
                disabled={!selectedClientId}
                className="px-5 py-2 rounded-lg text-neutral-950 font-black uppercase tracking-wider transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                style={{ backgroundColor: selectedClientId ? config.primaryColor : undefined }}
              >
                Conferma e Crea
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
