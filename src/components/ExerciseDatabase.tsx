/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Exercise, CoachConfig, DistrettoMuscolare } from '../types';
import { 
  Search, Plus, Filter, Info, Edit2, Trash2, X, Check, Activity, 
  ShieldAlert, Dumbbell, Star, Copy, ExternalLink, Video, ChevronLeft
} from 'lucide-react';

interface ExerciseDatabaseProps {
  config: CoachConfig;
  exercises: Exercise[];
  onAddExercise: (exercise: Exercise) => void;
  onUpdateExercise: (exercise: Exercise) => void;
  onDeleteExercise: (id: string) => void;
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

const MUSCLE_GROUPS: DistrettoMuscolare[] = [
  'Pettorali', 'Dorso', 'Spalle', 'Bicipiti', 'Tricipiti',
  'Quadricipiti', 'Femorali', 'Glutei', 'Polpacci', 'Addome'
];

const EQUIPMENT_OPTIONS = [
  'Bilanciere', 'Manubri', 'Macchinario', 'Cavi', 'Corpo libero', 'Kettlebell', 'Elastico'
];

const LEVELS: ('Principiante' | 'Intermedio' | 'Avanzato')[] = ['Principiante', 'Intermedio', 'Avanzato'];

export default function ExerciseDatabase({
  config,
  exercises,
  onAddExercise,
  onUpdateExercise,
  onDeleteExercise,
  onShowToast,
  onShowConfirm
}: ExerciseDatabaseProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMuscle, setSelectedMuscle] = useState<DistrettoMuscolare | 'Tutti'>('Tutti');
  const [selectedEquipment, setSelectedEquipment] = useState<string | 'Tutti'>('Tutti');
  const [selectedPattern, setSelectedPattern] = useState<string>('Tutti');
  const [selectedLevel, setSelectedLevel] = useState<string>('Tutti');
  const [selectedType, setSelectedType] = useState<'Tutti' | 'Predefiniti' | 'Personalizzati'>('Tutti');
  
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [showMobileDetail, setShowMobileDetail] = useState(false);

  // Custom exercise modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExercise, setEditingExercise] = useState<Exercise | null>(null);

  // Form states
  const [nome, setNome] = useState('');
  const [distrettoMuscolare, setDistrettoMuscolare] = useState<DistrettoMuscolare>('Pettorali');
  const [distrettiSecondari, setDistrettiSecondari] = useState<string>('');
  const [attrezzatura, setAttrezzatura] = useState('Manubri');
  const [patternMovimento, setPatternMovimento] = useState('');
  const [livelloDifficolta, setLivelloDifficolta] = useState<'Principiante' | 'Intermedio' | 'Avanzato'>('Intermedio');
  const [descrizione, setDescrizione] = useState('');
  const [istruzioniEsecuzione, setIstruzioniEsecuzione] = useState('');
  const [erroriComuni, setErroriComuni] = useState('');
  const [linkVideo, setLinkVideo] = useState('');

  // Back button dismiss listeners for mobile
  useEffect(() => {
    const handlePopState = (e: PopStateEvent) => {
      if (isModalOpen) {
        setIsModalOpen(false);
        e.preventDefault();
      }
    };
    if (isModalOpen) {
      window.history.pushState({ modalOpen: 'ex_form' }, '');
      window.addEventListener('popstate', handlePopState);
    }
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [isModalOpen]);

  useEffect(() => {
    const handlePopState = (e: PopStateEvent) => {
      if (showMobileDetail) {
        setShowMobileDetail(false);
        e.preventDefault();
      }
    };
    if (showMobileDetail) {
      window.history.pushState({ modalOpen: 'ex_detail' }, '');
      window.addEventListener('popstate', handlePopState);
    }
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [showMobileDetail]);
  
  const selectExercise = (ex: Exercise) => {
    setSelectedExercise(ex);
    setShowMobileDetail(true);
  };

  // Extract all available pattern options for the filter
  const allPatterns = Array.from(new Set(exercises.map(ex => ex.patternMovimento).filter(Boolean)));

  const openAddModal = () => {
    setEditingExercise(null);
    setNome('');
    setDistrettoMuscolare('Pettorali');
    setDistrettiSecondari('');
    setAttrezzatura('Manubri');
    setPatternMovimento('');
    setLivelloDifficolta('Intermedio');
    setDescrizione('');
    setIstruzioniEsecuzione('');
    setErroriComuni('');
    setLinkVideo('');
    setIsModalOpen(true);
  };

  const openEditModal = (ex: Exercise, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingExercise(ex);
    setNome(ex.nome);
    setDistrettoMuscolare(ex.distrettoMuscolare);
    setDistrettiSecondari(ex.distrettiSecondari.join(', '));
    setAttrezzatura(ex.attrezzatura);
    setPatternMovimento(ex.patternMovimento);
    setLivelloDifficolta(ex.livelloDifficolta);
    setDescrizione(ex.descrizione);
    setIstruzioniEsecuzione(ex.istruzioniEsecuzione || '');
    setErroriComuni(ex.erroriComuni || '');
    setLinkVideo(ex.linkVideo || '');
    setIsModalOpen(true);
  };

  const handleDuplicate = (ex: Exercise, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingExercise(null); // It's a new exercise
    setNome(`${ex.nome} (Variante)`);
    setDistrettoMuscolare(ex.distrettoMuscolare);
    setDistrettiSecondari(ex.distrettiSecondari.join(', '));
    setAttrezzatura(ex.attrezzatura);
    setPatternMovimento(ex.patternMovimento);
    setLivelloDifficolta(ex.livelloDifficolta);
    setDescrizione(ex.descrizione);
    setIstruzioniEsecuzione(ex.istruzioniEsecuzione || '');
    setErroriComuni(ex.erroriComuni || '');
    setLinkVideo(ex.linkVideo || '');
    setIsModalOpen(true);
  };

  const handleToggleFavorite = (ex: Exercise, e: React.MouseEvent) => {
    e.stopPropagation();
    onUpdateExercise({
      ...ex,
      isFavorite: !ex.isFavorite
    });
    if (selectedExercise?.id === ex.id) {
      setSelectedExercise({
        ...selectedExercise,
        isFavorite: !ex.isFavorite
      });
    }
  };

  const handleDelete = (id: string, name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    const performDelete = () => {
      onDeleteExercise(id);
      if (selectedExercise?.id === id) {
        setSelectedExercise(null);
      }
      if (onShowToast) {
        onShowToast(`Esercizio "${name}" eliminato con successo.`, 'success');
      }
    };

    if (onShowConfirm) {
      onShowConfirm({
        title: 'Eliminare esercizio?',
        message: `Sei sicuro di voler eliminare l'esercizio "${name}"? Questa azione lo rimuoverà permanentemente dal database.`,
        confirmText: 'Sì, elimina',
        isDestructive: true,
        onConfirm: performDelete
      });
    } else {
      const confirmed = window.confirm(`Sei sicuro di voler eliminare l'esercizio "${name}"? Questa azione lo rimuoverà permanentemente dal database.`);
      if (confirmed) {
        performDelete();
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim() || !patternMovimento.trim() || !descrizione.trim()) {
      if (onShowToast) {
        onShowToast('Tutti i campi obbligatori devono essere compilati.', 'warning');
      } else {
        alert('Tutti i campi obbligatori devono essere compilati.');
      }
      return;
    }

    const secArr = distrettiSecondari
      ? distrettiSecondari.split(',').map(s => s.trim()).filter(s => s.length > 0)
      : [];

    const exerciseData: Exercise = {
      id: editingExercise ? editingExercise.id : 'ex_custom_' + Date.now(),
      nome: nome.trim(),
      distrettoMuscolare,
      distrettiSecondari: secArr,
      attrezzatura,
      patternMovimento: patternMovimento.trim(),
      livelloDifficolta,
      descrizione: descrizione.trim(),
      istruzioniEsecuzione: istruzioniEsecuzione.trim(),
      erroriComuni: erroriComuni.trim(),
      linkVideo: linkVideo.trim(),
      isCustom: true,
      isFavorite: editingExercise ? editingExercise.isFavorite : false
    };

    if (editingExercise) {
      onUpdateExercise(exerciseData);
      if (selectedExercise?.id === exerciseData.id) {
        setSelectedExercise(exerciseData);
      }
    } else {
      onAddExercise(exerciseData);
    }
    setIsModalOpen(false);
  };

  // Filter exercises based on all options
  const filteredExercises = exercises.filter(ex => {
    const matchesSearch = ex.nome.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesMuscle = selectedMuscle === 'Tutti' || ex.distrettoMuscolare === selectedMuscle;
    const matchesEquipment = selectedEquipment === 'Tutti' || ex.attrezzatura === selectedEquipment;
    const matchesPattern = selectedPattern === 'Tutti' || ex.patternMovimento === selectedPattern;
    const matchesLevel = selectedLevel === 'Tutti' || ex.livelloDifficolta === selectedLevel;
    
    let matchesType = true;
    if (selectedType === 'Predefiniti') {
      matchesType = !ex.isCustom;
    } else if (selectedType === 'Personalizzati') {
      matchesType = !!ex.isCustom;
    }

    return matchesSearch && matchesMuscle && matchesEquipment && matchesPattern && matchesLevel && matchesType;
  });

  return (
    <div id="exercise-database-view" className="space-y-6">
      {/* Header and Add Button */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black uppercase tracking-tighter italic text-white">Database Esercizi</h1>
          <p className="text-xs text-white/40 font-medium">Esplora gli esercizi della libreria o aggiungi i tuoi personalizzati.</p>
        </div>
        <button
          id="add-custom-exercise-btn"
          onClick={openAddModal}
          className="flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-black uppercase tracking-wider text-neutral-950 transition-all cursor-pointer shadow-lg"
          style={{ backgroundColor: config.primaryColor }}
        >
          <Plus className="w-4 h-4" />
          Aggiungi Esercizio
        </button>
      </div>

      {/* Filters section */}
      <div id="exercise-filters" className={`bg-[#121212] p-5 rounded-2xl border border-white/5 space-y-4 ${showMobileDetail ? 'hidden lg:block' : 'block'}`}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Text Search */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-white/40" />
            <input
              id="ex-search-input"
              type="text"
              placeholder="Cerca per nome..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-3 py-2 text-xs rounded-xl bg-black/40 border border-white/5 text-white placeholder-white/30 focus:outline-none focus:ring-1 focus:border-transparent"
              style={{ '--tw-ring-color': config.primaryColor } as React.CSSProperties}
            />
          </div>

          {/* Muscle Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-white/40 shrink-0" />
            <select
              id="ex-filter-muscle"
              value={selectedMuscle}
              onChange={(e) => setSelectedMuscle(e.target.value as any)}
              className="w-full px-3 py-2 text-xs rounded-xl bg-black/40 border border-white/5 text-white focus:outline-none focus:ring-1 focus:border-transparent"
            >
              <option value="Tutti">Tutti i distretti muscolari</option>
              {MUSCLE_GROUPS.map(muscle => (
                <option key={muscle} value={muscle}>{muscle}</option>
              ))}
            </select>
          </div>

          {/* Equipment Filter */}
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-white/40 shrink-0" />
            <select
              id="ex-filter-equipment"
              value={selectedEquipment}
              onChange={(e) => setSelectedEquipment(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl bg-black/40 border border-white/5 text-white focus:outline-none focus:ring-1 focus:border-transparent"
            >
              <option value="Tutti">Tutte le attrezzature</option>
              {EQUIPMENT_OPTIONS.map(eq => (
                <option key={eq} value={eq}>{eq}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Extended Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1 border-t border-white/5">
          {/* Pattern Filter */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-white/40 uppercase tracking-wider font-black shrink-0">Pattern:</span>
            <select
              value={selectedPattern}
              onChange={(e) => setSelectedPattern(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl bg-black/40 border border-white/5 text-white focus:outline-none focus:ring-1 focus:border-transparent"
            >
              <option value="Tutti">Tutti i pattern</option>
              {allPatterns.map(pattern => (
                <option key={pattern} value={pattern}>{pattern}</option>
              ))}
            </select>
          </div>

          {/* Level Filter */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-white/40 uppercase tracking-wider font-black shrink-0">Livello:</span>
            <select
              value={selectedLevel}
              onChange={(e) => setSelectedLevel(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl bg-black/40 border border-white/5 text-white focus:outline-none focus:ring-1 focus:border-transparent"
            >
              <option value="Tutti">Tutti i livelli</option>
              {LEVELS.map(lvl => (
                <option key={lvl} value={lvl}>{lvl}</option>
              ))}
            </select>
          </div>

          {/* Predefiniti vs Personalizzati */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-white/40 uppercase tracking-wider font-black shrink-0">Tipo:</span>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value as any)}
              className="w-full px-3 py-2 text-xs rounded-xl bg-black/40 border border-white/5 text-white focus:outline-none focus:ring-1 focus:border-transparent"
            >
              <option value="Tutti">Predefiniti & Personalizzati</option>
              <option value="Predefiniti">Solo Predefiniti</option>
              <option value="Personalizzati">Solo Personalizzati</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Grid: List of exercises and Details Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Exercises List */}
        <div id="exercises-list-wrapper" className={`lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[600px] overflow-y-auto pr-1 ${showMobileDetail ? 'hidden lg:grid' : 'grid'}`}>
          {filteredExercises.length === 0 ? (
            <div className="col-span-full bg-[#121212] border border-white/5 rounded-2xl p-8 text-center text-white/40">
              <Dumbbell className="w-10 h-10 text-white/10 mx-auto mb-2 animate-pulse" />
              <p className="text-sm font-bold uppercase tracking-wider">Nessun esercizio trovato</p>
              <p className="text-xs text-white/30 mt-1">Prova ad allargare i filtri di ricerca o crea un nuovo esercizio.</p>
            </div>
          ) : (
            filteredExercises.map((ex) => {
              const isSelected = selectedExercise?.id === ex.id;
              const hasVideo = !!ex.linkVideo;
              return (
                <div
                  key={ex.id}
                  id={`ex-item-${ex.id}`}
                  onClick={() => selectExercise(ex)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer flex justify-between items-start text-left bg-[#121212] ${
                    isSelected 
                      ? 'border-transparent shadow-md' 
                      : 'border-white/5 hover:border-white/10'
                  }`}
                  style={{ 
                    borderColor: isSelected ? config.primaryColor : undefined,
                    boxShadow: isSelected ? `0 0 10px ${config.primaryColor}15` : undefined
                  }}
                >
                  <div className="space-y-1.5 mr-2 min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span 
                        className="px-2 py-0.5 rounded text-[9px] font-black uppercase text-neutral-950 shrink-0"
                        style={{ backgroundColor: config.primaryColor }}
                      >
                        {ex.distrettoMuscolare}
                      </span>
                      {ex.isCustom ? (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-black/40 text-white/40 border border-white/5 shrink-0">
                          Custom
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-white/5 text-white/40 border border-white/5 shrink-0">
                          Predefinito
                        </span>
                      )}
                      {hasVideo && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-[#CCFF00]/10 text-[#CCFF00] border border-[#CCFF00]/20 shrink-0 flex items-center gap-1">
                          <Video className="w-2.5 h-2.5" /> Video
                        </span>
                      )}
                    </div>
                    <h3 className="font-bold text-white text-xs sm:text-sm tracking-tight truncate">{ex.nome}</h3>
                    <p className="text-white/40 text-[10px] uppercase tracking-wider">{ex.attrezzatura} • {ex.patternMovimento}</p>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {/* Favorite Button */}
                    <button
                      onClick={(e) => handleToggleFavorite(ex, e)}
                      className={`p-1.5 rounded transition-colors cursor-pointer ${
                        ex.isFavorite 
                          ? 'text-[#FFD700] hover:text-[#FFC000]' 
                          : 'text-white/20 hover:text-white/60'
                      }`}
                      title={ex.isFavorite ? "Rimuovi dai preferiti" : "Aggiungi ai preferiti"}
                    >
                      <Star className="w-3.5 h-3.5 fill-current" />
                    </button>

                    {/* Duplicate Button (Variante) */}
                    <button
                      onClick={(e) => handleDuplicate(ex, e)}
                      className="p-1.5 rounded bg-black/30 border border-white/5 hover:bg-white/5 text-white/50 hover:text-white transition-all cursor-pointer"
                      title="Duplica come variante"
                    >
                      <Copy className="w-3 h-3" />
                    </button>

                    {ex.isCustom && (
                      <>
                        <button
                          onClick={(e) => openEditModal(ex, e)}
                          className="p-1.5 rounded bg-black/30 border border-white/5 hover:bg-white/5 text-white/50 hover:text-white transition-all cursor-pointer"
                          title="Modifica"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                        <button
                          onClick={(e) => handleDelete(ex.id, ex.nome, e)}
                          className="p-1.5 rounded bg-black/30 border border-white/5 hover:bg-white/5 text-white/30 hover:text-red-400 transition-all cursor-pointer"
                          title="Elimina"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </>
                    )}
                    <Info className="w-4 h-4 text-white/30 ml-1 shrink-0" />
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Exercise Details Card */}
        <div id="exercise-detail-panel" className={`lg:col-span-1 ${showMobileDetail ? 'block' : 'hidden lg:block'}`}>
          {selectedExercise ? (
            <div className="bg-[#121212] border border-white/5 rounded-2xl p-6 space-y-4 sticky top-6">
              {/* Mobile Back Button */}
              <div className="flex lg:hidden justify-between items-center pb-2 border-b border-white/5">
                <button 
                  onClick={() => setShowMobileDetail(false)}
                  className="flex items-center gap-1.5 text-xs font-bold text-white/60 hover:text-white"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Torna all'elenco
                </button>
                <span className="text-[10px] font-black uppercase text-[#CCFF00] tracking-wider" style={{ color: config.primaryColor }}>Info Esercizio</span>
              </div>

              <div className="flex justify-between items-start">
                <div className="space-y-1.5">
                  <span 
                    className="px-2.5 py-0.5 rounded text-[10px] font-black uppercase text-neutral-950"
                    style={{ backgroundColor: config.primaryColor }}
                  >
                    {selectedExercise.distrettoMuscolare}
                  </span>
                  <h2 className="font-black text-white text-lg tracking-tighter uppercase italic leading-none mt-1">{selectedExercise.nome}</h2>
                </div>
                <button 
                  onClick={() => {
                    setSelectedExercise(null);
                    setShowMobileDetail(false);
                  }}
                  className="text-white/40 hover:text-white p-1 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Specs */}
              <div className="space-y-2.5 bg-black/30 p-4 rounded-xl border border-white/5 text-xs">
                <div className="flex justify-between py-1 border-b border-white/5">
                  <span className="text-white/40">Attrezzatura:</span>
                  <span className="font-bold text-white">{selectedExercise.attrezzatura}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-white/5">
                  <span className="text-white/40">Pattern di movimento:</span>
                  <span className="font-bold text-white">{selectedExercise.patternMovimento}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-white/5">
                  <span className="text-white/40">Difficoltà:</span>
                  <span className="font-bold text-white">{selectedExercise.livelloDifficolta}</span>
                </div>
                {selectedExercise.distrettiSecondari.length > 0 && (
                  <div className="flex justify-between py-1 border-b border-white/5">
                    <span className="text-white/40">Muscoli secondari:</span>
                    <span className="font-bold text-white text-right">{selectedExercise.distrettiSecondari.join(', ')}</span>
                  </div>
                )}
                <div className="flex justify-between py-1">
                  <span className="text-white/40">Tipo esercizio:</span>
                  <span className="font-bold text-white">{selectedExercise.isCustom ? 'Personalizzato' : 'Predefinito'}</span>
                </div>
              </div>

              {/* Technical Description */}
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-black text-white/40 tracking-wider">Descrizione Tecnica</span>
                <p className="text-xs text-white/70 leading-relaxed bg-black/20 p-3 rounded-xl border border-white/5">
                  {selectedExercise.descrizione}
                </p>
              </div>

              {/* Instructions of execution */}
              {selectedExercise.istruzioniEsecuzione && (
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-black text-white/40 tracking-wider">Istruzioni di Esecuzione</span>
                  <p className="text-xs text-white/70 leading-relaxed bg-black/20 p-3 rounded-xl border border-white/5">
                    {selectedExercise.istruzioniEsecuzione}
                  </p>
                </div>
              )}

              {/* Common mistakes */}
              {selectedExercise.erroriComuni && (
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-black text-red-400/80 tracking-wider">Errori Comuni da Evitare</span>
                  <p className="text-xs text-red-300/80 leading-relaxed bg-red-950/10 p-3 rounded-xl border border-red-900/20">
                    {selectedExercise.erroriComuni}
                  </p>
                </div>
              )}

              {/* Video Link */}
              {selectedExercise.linkVideo && (
                <div className="pt-2">
                  <a 
                    href={selectedExercise.linkVideo} 
                    target="_blank" 
                    referrerPolicy="no-referrer"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-xs font-black uppercase tracking-wider bg-red-600 hover:bg-red-700 text-white transition-all text-center cursor-pointer shadow"
                  >
                    <Video className="w-4 h-4" />
                    Guarda Video Esercizio
                  </a>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-[#121212] border border-white/5 rounded-2xl p-8 text-center text-white/40 sticky top-6">
              <Dumbbell className="w-12 h-12 text-white/10 mx-auto mb-3 animate-bounce" />
              <p className="text-xs font-black uppercase tracking-wider">Dettaglio Esercizio</p>
              <p className="text-[11px] text-white/30 mt-1 leading-relaxed">
                Seleziona un esercizio dall'archivio per consultare la guida di esecuzione, i muscoli target principali e secondari, gli errori comuni e l'eventuale video dimostrativo.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Modal: Add/Edit Custom Exercise */}
      {isModalOpen && (
        <div id="exercise-form-modal" className="fixed inset-0 z-50 bg-neutral-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-lg bg-[#121212] border border-white/10 rounded-2xl overflow-hidden shadow-2xl relative my-8">
            <div className="p-6 border-b border-white/10 flex justify-between items-center">
              <h3 className="font-black text-white text-sm uppercase tracking-wider">
                {editingExercise ? 'Modifica Esercizio Personalizzato' : 'Crea Nuovo Esercizio / Variante'}
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-white/40 hover:text-white p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="space-y-1">
                <label className="block text-[10px] font-black uppercase tracking-wider text-white/40">Nome Esercizio <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  required
                  placeholder="es. Lat Pulldown unilaterale"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-black/40 border border-white/5 text-white placeholder-white/20 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-[10px] font-black uppercase tracking-wider text-white/40">Distretto Principale</label>
                  <select
                    value={distrettoMuscolare}
                    onChange={(e) => setDistrettoMuscolare(e.target.value as DistrettoMuscolare)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-black/40 border border-white/5 text-white focus:outline-none"
                  >
                    {MUSCLE_GROUPS.map(muscle => (
                      <option key={muscle} value={muscle}>{muscle}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] font-black uppercase tracking-wider text-white/40">Attrezzatura</label>
                  <select
                    value={attrezzatura}
                    onChange={(e) => setAttrezzatura(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-black/40 border border-white/5 text-white focus:outline-none"
                  >
                    {EQUIPMENT_OPTIONS.map(eq => (
                      <option key={eq} value={eq}>{eq}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-[10px] font-black uppercase tracking-wider text-white/40">Pattern di Movimento <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    required
                    placeholder="es. Tirata verticale, Spinta orizzontale"
                    value={patternMovimento}
                    onChange={(e) => setPatternMovimento(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-black/40 border border-white/5 text-white placeholder-white/20 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] font-black uppercase tracking-wider text-white/40">Difficoltà</label>
                  <select
                    value={livelloDifficolta}
                    onChange={(e) => setLivelloDifficolta(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-black/40 border border-white/5 text-white focus:outline-none"
                  >
                    <option value="Principiante">Principiante</option>
                    <option value="Intermedio">Intermedio</option>
                    <option value="Avanzato">Avanzato</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-black uppercase tracking-wider text-white/40">Distretti Secondari <span className="text-white/25">(Separa con virgola)</span></label>
                <input
                  type="text"
                  placeholder="es. Bicipiti, Brachiale, Addome"
                  value={distrettiSecondari}
                  onChange={(e) => setDistrettiSecondari(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-black/40 border border-white/5 text-white placeholder-white/20 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-black uppercase tracking-wider text-white/40">Descrizione Breve <span className="text-red-500">*</span></label>
                <textarea
                  required
                  placeholder="Fornisci una sintesi dell'esercizio e della sua utilità..."
                  value={descrizione}
                  onChange={(e) => setDescrizione(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-black/40 border border-white/5 text-white placeholder-white/20 focus:outline-none resize-none"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-black uppercase tracking-wider text-white/40">Istruzioni di Esecuzione (Facoltativo)</label>
                <textarea
                  placeholder="Istruzioni passo-passo per il corretto setup e l'allineamento motorio..."
                  value={istruzioniEsecuzione}
                  onChange={(e) => setIstruzioniEsecuzione(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-black/40 border border-white/5 text-white placeholder-white/20 focus:outline-none resize-none"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-black uppercase tracking-wider text-white/40">Errori Comuni (Facoltativo)</label>
                <input
                  type="text"
                  placeholder="es. slanci con la schiena, rimbalzo al petto"
                  value={erroriComuni}
                  onChange={(e) => setErroriComuni(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-black/40 border border-white/5 text-white placeholder-white/20 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-black uppercase tracking-wider text-white/40">Link Video Youtube / Vimeo (Facoltativo)</label>
                <input
                  type="url"
                  placeholder="https://www.youtube.com/watch?v=..."
                  value={linkVideo}
                  onChange={(e) => setLinkVideo(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-black/40 border border-white/5 text-white placeholder-white/20 focus:outline-none"
                />
              </div>

              <div className="pt-4 border-t border-white/10 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-black uppercase tracking-wider rounded-xl border border-white/5 hover:bg-white/5 transition-colors text-white/40 hover:text-white"
                >
                  Annulla
                </button>
                <button
                  id="ex-form-submit"
                  type="submit"
                  className="px-5 py-2 text-xs font-black uppercase tracking-wider text-neutral-950 rounded-xl transition-all shadow-md cursor-pointer"
                  style={{ backgroundColor: config.primaryColor }}
                >
                  {editingExercise ? 'Salva Modifiche' : 'Aggiungi Esercizio'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
