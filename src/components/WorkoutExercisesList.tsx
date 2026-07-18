import React, { useState } from 'react';
import { 
  WorkoutDay, WorkoutExercise, WorkoutWeek, CoachConfig, 
  ExerciseGroupType, EXERCISE_GROUP_LABELS 
} from '../types';
import { 
  Layers, Video, MoreHorizontal, Settings, FileText, Link, 
  Unlink, ArrowUp, ArrowDown, Copy, Trash2, ChevronLeft, 
  ChevronRight, GripVertical, X, Sparkles
} from 'lucide-react';
import { 
  normalizeExerciseGroupType, 
  normalizeExerciseGroupData, 
  getGroupMemberLabel
} from '../utils/exerciseGroupUtils';

interface WorkoutExercisesListProps {
  day: WorkoutDay;
  activeWeekIndex: number;
  weeks: WorkoutWeek[];
  config: CoachConfig;
  workoutViewMode: 'table' | 'cards';
  globalModifications: boolean;
  groupSelectionDayId: string | null;
  groupSelectionType: ExerciseGroupType | null;
  selectedExerciseIds: string[];
  setSelectedExerciseIds: React.Dispatch<React.SetStateAction<string[]>>;
  activeActionMenuExId: string | null;
  setActiveActionMenuExId: React.Dispatch<React.SetStateAction<string | null>>;
  
  handleUpdateExParam: (dayId: string, exInstId: string, field: keyof WorkoutExercise, value: any) => void;
  handleOpenBlocksManager: (dayId: string, exId: string) => void;
  handleDeleteEx: (dayId: string, exInstId: string) => void;
  handleMoveEx: (dayId: string, exInstId: string, direction: 'up' | 'down') => void;
  handleDuplicateEx: (dayId: string, ex: WorkoutExercise) => void;
  handleGroupWithNext: (dayId: string, exIdx: number) => void;
  
  handleDissolveSuperset: (dayId: string, groupId: string) => void;
  handleOpenSupersetSettings: (dayId: string, groupId: string) => void;
  handleDissolveTriset: (dayId: string, groupId: string) => void;
  handleOpenTrisetSettings: (dayId: string, groupId: string) => void;
  handleDissolveCompoundSet: (dayId: string, groupId: string) => void;
  handleOpenCompoundSetSettings: (dayId: string, groupId: string) => void;
  handleDissolveGiantSet: (dayId: string, groupId: string) => void;
  handleOpenGiantSetSettings: (dayId: string, groupId: string) => void;
  handleDissolveJumpset: (dayId: string, groupId: string) => void;
  handleOpenJumpsetSettings: (dayId: string, groupId: string) => void;
  handleDissolveCircuit: (dayId: string, groupId: string) => void;
  handleOpenCircuitSettings: (dayId: string, groupId: string) => void;
}

export const WorkoutExercisesList: React.FC<WorkoutExercisesListProps> = ({
  day,
  activeWeekIndex,
  weeks,
  config,
  workoutViewMode,
  globalModifications,
  groupSelectionDayId,
  groupSelectionType,
  selectedExerciseIds,
  setSelectedExerciseIds,
  activeActionMenuExId,
  setActiveActionMenuExId,
  handleUpdateExParam,
  handleOpenBlocksManager,
  handleDeleteEx,
  handleMoveEx,
  handleDuplicateEx,
  handleGroupWithNext,
  handleDissolveSuperset,
  handleOpenSupersetSettings,
  handleDissolveTriset,
  handleOpenTrisetSettings,
  handleDissolveCompoundSet,
  handleOpenCompoundSetSettings,
  handleDissolveGiantSet,
  handleOpenGiantSetSettings,
  handleDissolveJumpset,
  handleOpenJumpsetSettings,
  handleDissolveCircuit,
  handleOpenCircuitSettings,
}) => {
  // Expanded exercises on mobile
  const [expandedExIds, setExpandedExIds] = useState<Record<string, boolean>>({});

  const toggleExpandEx = (exId: string) => {
    setExpandedExIds(prev => ({ ...prev, [exId]: !prev[exId] }));
  };

  // Note/technique editing modal state
  const [textEditModal, setTextEditModal] = useState<{
    field: 'noteTecniche' | 'tecnicaIntensita';
    title: string;
    value: string;
    exId: string;
  } | null>(null);

  // Helper inside component to avoid import dependency issues
  const getRequiredCountHelper = (type: ExerciseGroupType | null): number => {
    if (type === 'superset') return 2;
    if (type === 'compound_set') return 2;
    if (type === 'jumpset') return 2;
    if (type === 'triset') return 3;
    if (type === 'giant_set') return 4;
    if (type === 'circuit') return 4;
    return 0;
  };

  if (day.esercizi.length === 0) {
    return (
      <div className="border border-dashed border-white/5 bg-black/10 p-8 rounded-xl text-center text-white/25 select-none">
        <p className="text-xs">Nessun esercizio inserito per questa giornata. Clicca "Aggiungi esercizio" in alto per iniziare.</p>
      </div>
    );
  }

  // Pre-process groups
  const processedExercises = (() => {
    const uniqueGroupIds: string[] = [];
    day.esercizi.forEach(e => {
      if (e.groupId && typeof e.groupId === 'string' && e.groupId.trim() !== '') {
        const normalizedType = normalizeExerciseGroupType(e.groupType);
        if (normalizedType && !uniqueGroupIds.includes(e.groupId)) {
          uniqueGroupIds.push(e.groupId);
        }
      }
    });

    return day.esercizi.map((ex, exIdx) => {
      const isInGroup = !!ex.groupId;
      const normalizedGroupType = isInGroup ? normalizeExerciseGroupType(ex.groupType) : undefined;
      const groupIndex = ex.groupId ? uniqueGroupIds.indexOf(ex.groupId) : -1;
      const memberLabel = groupIndex !== -1 && ex.groupOrder !== undefined ? getGroupMemberLabel(groupIndex, ex.groupOrder) : '';
      const isGroupLeader = isInGroup && (exIdx === 0 || day.esercizi[exIdx - 1]?.groupId !== ex.groupId);

      let groupSummary = undefined;
      if (isInGroup && ex.groupOrder === 1) {
        const normEx = normalizeExerciseGroupData(ex);
        groupSummary = {
          restBetween: normEx.groupRestBetweenExercisesSec ?? 0,
          restAfter: normEx.groupRestAfterRoundSec ?? 90,
          rounds: normEx.groupRounds ?? 1,
          isJumpsetGroup: normalizedGroupType === 'jumpset',
          isCircuitGroup: normalizedGroupType === 'circuit',
        };
      }

      return {
        ex,
        exIdx,
        isInGroup,
        groupId: ex.groupId,
        normalizedGroupType,
        groupIndex,
        memberLabel,
        isGroupLeader,
        groupSummary
      };
    });
  })();

  const totalSetsForWeekDay = day.esercizi.reduce((sum, e) => {
    const sets = e.blocks && e.blocks.length > 0
      ? e.blocks.reduce((bSum, b) => bSum + Number(b.serie || 0), 0)
      : Number(e.serie || 0);
    return sum + sets;
  }, 0) || 0;

  // Render standard action menu options
  const renderActionMenuContent = (ex: WorkoutExercise, exIdx: number, isInGroup: boolean, normalizedGroupType?: ExerciseGroupType) => {
    return (
      <div className="absolute right-0 mt-1 w-48 bg-neutral-900 border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden py-1 text-left">
        {/* SuperSet Toggle */}
        {exIdx < day.esercizi.length - 1 && !isInGroup && (
          <button
            type="button"
            onClick={() => {
              handleGroupWithNext(day.id, exIdx);
              setActiveActionMenuExId(null);
            }}
            className="w-full px-3 py-2 text-[11px] text-white/70 hover:text-white hover:bg-white/5 flex items-center gap-1.5 cursor-pointer"
          >
            <Link className="w-3.5 h-3.5" style={{ color: config.primaryColor }} />
            <span>Unisci in Super Set</span>
          </button>
        )}
        
        {ex.groupId && normalizedGroupType === 'superset' && (
          <>
            <button
              type="button"
              onClick={() => {
                handleDissolveSuperset(day.id, ex.groupId!);
                setActiveActionMenuExId(null);
              }}
              className="w-full px-3 py-2 text-[11px] text-red-400 hover:bg-white/5 flex items-center gap-1.5 cursor-pointer"
            >
              <Unlink className="w-3.5 h-3.5" />
              <span>Sciogli Superset</span>
            </button>
            <button
              type="button"
              onClick={() => {
                handleOpenSupersetSettings(day.id, ex.groupId!);
                setActiveActionMenuExId(null);
              }}
              className="w-full px-3 py-2 text-[11px] text-white/70 hover:text-white hover:bg-white/5 flex items-center gap-1.5 cursor-pointer"
            >
              <Settings className="w-3.5 h-3.5" style={{ color: config.primaryColor }} />
              <span>Impostazioni Superset</span>
            </button>
          </>
        )}

        {ex.groupId && normalizedGroupType === 'triset' && (
          <>
            <button
              type="button"
              onClick={() => {
                handleDissolveTriset(day.id, ex.groupId!);
                setActiveActionMenuExId(null);
              }}
              className="w-full px-3 py-2 text-[11px] text-red-400 hover:bg-white/5 flex items-center gap-1.5 cursor-pointer"
            >
              <Unlink className="w-3.5 h-3.5" />
              <span>Sciogli Triset</span>
            </button>
            <button
              type="button"
              onClick={() => {
                handleOpenTrisetSettings(day.id, ex.groupId!);
                setActiveActionMenuExId(null);
              }}
              className="w-full px-3 py-2 text-[11px] text-white/70 hover:text-white hover:bg-white/5 flex items-center gap-1.5 cursor-pointer"
            >
              <Settings className="w-3.5 h-3.5" style={{ color: config.primaryColor }} />
              <span>Impostazioni Triset</span>
            </button>
          </>
        )}

        {ex.groupId && normalizedGroupType === 'compound_set' && (
          <>
            <button
              type="button"
              onClick={() => {
                handleDissolveCompoundSet(day.id, ex.groupId!);
                setActiveActionMenuExId(null);
              }}
              className="w-full px-3 py-2 text-[11px] text-red-400 hover:bg-white/5 flex items-center gap-1.5 cursor-pointer"
            >
              <Unlink className="w-3.5 h-3.5" />
              <span>Sciogli Compound Set</span>
            </button>
            <button
              type="button"
              onClick={() => {
                handleOpenCompoundSetSettings(day.id, ex.groupId!);
                setActiveActionMenuExId(null);
              }}
              className="w-full px-3 py-2 text-[11px] text-white/70 hover:text-white hover:bg-white/5 flex items-center gap-1.5 cursor-pointer"
            >
              <Settings className="w-3.5 h-3.5" style={{ color: config.primaryColor }} />
              <span>Impostazioni Compound Set</span>
            </button>
          </>
        )}

        {ex.groupId && normalizedGroupType === 'giant_set' && (
          <>
            <button
              type="button"
              onClick={() => {
                handleDissolveGiantSet(day.id, ex.groupId!);
                setActiveActionMenuExId(null);
              }}
              className="w-full px-3 py-2 text-[11px] text-red-400 hover:bg-white/5 flex items-center gap-1.5 cursor-pointer"
            >
              <Unlink className="w-3.5 h-3.5" />
              <span>Sciogli Giant Set</span>
            </button>
            <button
              type="button"
              onClick={() => {
                handleOpenGiantSetSettings(day.id, ex.groupId!);
                setActiveActionMenuExId(null);
              }}
              className="w-full px-3 py-2 text-[11px] text-white/70 hover:text-white hover:bg-white/5 flex items-center gap-1.5 cursor-pointer"
            >
              <Settings className="w-3.5 h-3.5" style={{ color: config.primaryColor }} />
              <span>Impostazioni Giant Set</span>
            </button>
          </>
        )}

        {ex.groupId && normalizedGroupType === 'jumpset' && (
          <>
            <button
              type="button"
              onClick={() => {
                handleDissolveJumpset(day.id, ex.groupId!);
                setActiveActionMenuExId(null);
              }}
              className="w-full px-3 py-2 text-[11px] text-red-400 hover:bg-white/5 flex items-center gap-1.5 cursor-pointer"
            >
              <Unlink className="w-3.5 h-3.5" />
              <span>Sciogli Jumpset</span>
            </button>
            <button
              type="button"
              onClick={() => {
                handleOpenJumpsetSettings(day.id, ex.groupId!);
                setActiveActionMenuExId(null);
              }}
              className="w-full px-3 py-2 text-[11px] text-white/70 hover:text-white hover:bg-white/5 flex items-center gap-1.5 cursor-pointer"
            >
              <Settings className="w-3.5 h-3.5" style={{ color: config.primaryColor }} />
              <span>Impostazioni Jumpset</span>
            </button>
          </>
        )}

        {ex.groupId && normalizedGroupType === 'circuit' && (
          <>
            <button
              type="button"
              onClick={() => {
                handleDissolveCircuit(day.id, ex.groupId!);
                setActiveActionMenuExId(null);
              }}
              className="w-full px-3 py-2 text-[11px] text-red-400 hover:bg-white/5 flex items-center gap-1.5 cursor-pointer"
            >
              <Unlink className="w-3.5 h-3.5" />
              <span>Sciogli Circuito</span>
            </button>
            <button
              type="button"
              onClick={() => {
                handleOpenCircuitSettings(day.id, ex.groupId!);
                setActiveActionMenuExId(null);
              }}
              className="w-full px-3 py-2 text-[11px] text-white/70 hover:text-white hover:bg-white/5 flex items-center gap-1.5 cursor-pointer"
            >
              <Settings className="w-3.5 h-3.5" style={{ color: config.primaryColor }} />
              <span>Impostazioni Circuito</span>
            </button>
          </>
        )}

        {/* Sposta su / giù */}
        <button
          type="button"
          disabled={exIdx === 0}
          onClick={() => {
            handleMoveEx(day.id, ex.id, 'up');
            setActiveActionMenuExId(null);
          }}
          className="w-full px-3 py-2 text-[11px] text-white/70 hover:text-white hover:bg-white/5 disabled:opacity-30 flex items-center gap-1.5 cursor-pointer"
        >
          <ArrowUp className="w-3.5 h-3.5" />
          <span>Sposta su</span>
        </button>
        <button
          type="button"
          disabled={exIdx === day.esercizi.length - 1}
          onClick={() => {
            handleMoveEx(day.id, ex.id, 'down');
            setActiveActionMenuExId(null);
          }}
          className="w-full px-3 py-2 text-[11px] text-white/70 hover:text-white hover:bg-white/5 disabled:opacity-30 flex items-center gap-1.5 cursor-pointer"
        >
          <ArrowDown className="w-3.5 h-3.5" />
          <span>Sposta giù</span>
        </button>

        {/* Duplica */}
        <button
          type="button"
          onClick={() => {
            handleDuplicateEx(day.id, ex);
            setActiveActionMenuExId(null);
          }}
          className="w-full px-3 py-2 text-[11px] text-white/70 hover:text-white hover:bg-white/5 flex items-center gap-1.5 cursor-pointer"
        >
          <Copy className="w-3.5 h-3.5" />
          <span>Duplica</span>
        </button>

        {/* Elimina */}
        <button
          type="button"
          onClick={() => {
            handleDeleteEx(day.id, ex.id);
            setActiveActionMenuExId(null);
          }}
          className="w-full px-3 py-2 text-[11px] text-red-400 hover:bg-white/5 flex items-center gap-1.5 border-t border-white/5 mt-1 cursor-pointer"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Rimuovi</span>
        </button>
      </div>
    );
  };

  if (workoutViewMode === 'cards') {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {processedExercises.map(({ ex, exIdx, isInGroup, groupId, normalizedGroupType, groupIndex, memberLabel, isGroupLeader, groupSummary }) => {
            return (
              <div 
                key={ex.id}
                className={`bg-neutral-900/40 border rounded-2xl p-4 space-y-4 relative flex flex-col justify-between transition-all duration-200 ${
                  isInGroup ? 'border-[#CCFF00]/15 bg-[#CCFF00]/[0.01]' : 'border-white/5'
                }`}
                style={isInGroup ? { borderColor: `${config.primaryColor}25`, backgroundColor: `${config.primaryColor}03` } : {}}
              >
                {isInGroup && (
                  <span className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl" style={{ backgroundColor: config.primaryColor }} />
                )}
                
                {/* Card Header */}
                <div className="space-y-1 text-left">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-mono font-bold text-white/35">
                      {isInGroup ? memberLabel : `#${exIdx + 1}`}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {isInGroup && (
                        <span className="px-1.5 py-0.5 rounded text-[8px] font-mono font-black text-neutral-950 uppercase shrink-0" style={{ backgroundColor: config.primaryColor }}>
                          {EXERCISE_GROUP_LABELS[normalizedGroupType!]}
                        </span>
                      )}
                      {ex.linkVideo && (
                        <a href={ex.linkVideo} target="_blank" rel="noreferrer" className="text-red-400 hover:text-red-300" aria-label={`Guarda video per ${ex.nome}`}>
                          <Video className="w-3.5 h-3.5" />
                        </a>
                      )}
                      <div className="relative">
                        <button
                          id={`trigger-actions-card-${ex.id}`}
                          type="button"
                          onClick={() => setActiveActionMenuExId(activeActionMenuExId === `ex_${ex.id}` ? null : `ex_${ex.id}`)}
                          className="p-1 rounded hover:bg-white/5 text-white/40 hover:text-white cursor-pointer"
                          aria-label="Menu azioni"
                          aria-haspopup="true"
                          aria-expanded={activeActionMenuExId === `ex_${ex.id}`}
                        >
                          <MoreHorizontal className="w-3.5 h-3.5" />
                        </button>
                        {activeActionMenuExId === `ex_${ex.id}` && renderActionMenuContent(ex, exIdx, isInGroup, normalizedGroupType)}
                      </div>
                    </div>
                  </div>
                  <h4 className="text-sm font-black text-white leading-tight break-words">{ex.nome}</h4>
                  <span className="inline-block text-[10px] font-bold text-white/40 uppercase tracking-wider">{ex.distrettoMuscolare}</span>
                  
                  {groupSummary && (
                    <div className="mt-2 p-2 rounded-lg bg-black/30 border border-[#CCFF00]/10 text-[9px] leading-relaxed">
                      <span className="font-extrabold text-[#CCFF00] block mb-0.5" style={{ color: config.primaryColor }}>
                        {normalizedGroupType === 'jumpset' 
                          ? `${groupSummary.restBetween}s tra ${memberLabel} e ${getGroupMemberLabel(groupIndex, 2)} • ${groupSummary.restAfter}s dopo • ${groupSummary.rounds} ${groupSummary.rounds === 1 ? 'giro' : 'giri'}`
                          : normalizedGroupType === 'circuit'
                            ? `${groupSummary.restBetween}s tra le stazioni • ${groupSummary.restAfter}s dopo il giro • ${groupSummary.rounds} ${groupSummary.rounds === 1 ? 'giro' : 'giri'}`
                            : `${groupSummary.restBetween}s tra esercizi • ${groupSummary.restAfter}s dopo • ${groupSummary.rounds} ${groupSummary.rounds === 1 ? 'giro' : 'giri'}`}
                      </span>
                      {normalizedGroupType === 'jumpset' && (
                        <span className="text-white/35 italic block">Alterna {memberLabel} e {getGroupMemberLabel(groupIndex, 2)} rispettando il recupero.</span>
                      )}
                      {normalizedGroupType === 'circuit' && (
                        <span className="text-white/35 italic block">Esegui le stazioni in sequenza.</span>
                      )}
                    </div>
                  )}
                </div>

                {/* Card Main Inputs Grid */}
                <div className="grid grid-cols-2 gap-2.5 text-left pt-2">
                  <div className="bg-black/20 p-2 rounded-xl border border-white/5 flex flex-col justify-between">
                    <span className="text-[8px] font-bold text-white/30 uppercase tracking-wider block mb-1">Serie</span>
                    <div className="flex items-center justify-between bg-black/40 border border-white/5 rounded-lg px-2 py-0.5 w-full select-none">
                      <button
                        type="button"
                        onClick={() => handleUpdateExParam(day.id, ex.id, 'serie', Math.max(1, ex.serie - 1))}
                        className="text-xs font-bold text-white/40 hover:text-white px-1 cursor-pointer"
                        aria-label="Riduci serie"
                      >
                        -
                      </button>
                      <span className="text-xs font-black text-white font-mono">{ex.serie}</span>
                      <button
                        type="button"
                        onClick={() => handleUpdateExParam(day.id, ex.id, 'serie', ex.serie + 1)}
                        className="text-xs font-bold text-white/40 hover:text-white px-1 cursor-pointer"
                        aria-label="Aumenta serie"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div className="bg-black/20 p-2 rounded-xl border border-white/5 flex flex-col justify-between">
                    <span className="text-[8px] font-bold text-white/30 uppercase tracking-wider block mb-1">Ripetizioni</span>
                    <div className="flex items-center gap-1 bg-black/40 border border-white/5 rounded-lg px-1.5 py-0.5 w-full">
                      <input
                        type="number"
                        min="1"
                        value={ex.repMin || ''}
                        onChange={(e) => handleUpdateExParam(day.id, ex.id, 'repMin', Number(e.target.value))}
                        className="w-full bg-transparent border-none text-center font-bold text-white text-xs focus:outline-none p-0"
                        aria-label="Ripetizioni minime"
                      />
                      <span className="text-white/30 text-xs select-none">-</span>
                      <input
                        type="number"
                        min="1"
                        value={ex.repMax || ''}
                        onChange={(e) => handleUpdateExParam(day.id, ex.id, 'repMax', Number(e.target.value))}
                        className="w-full bg-transparent border-none text-center font-bold text-white text-xs focus:outline-none p-0"
                        aria-label="Ripetizioni massime"
                      />
                    </div>
                  </div>

                  <div className="bg-black/20 p-2 rounded-xl border border-white/5">
                    <span className="text-[8px] font-bold text-white/30 uppercase tracking-wider block mb-1">Carico</span>
                    <input
                      type="text"
                      value={ex.caricoPrevisto || ''}
                      onChange={(e) => handleUpdateExParam(day.id, ex.id, 'caricoPrevisto', e.target.value)}
                      placeholder="—"
                      className="w-full bg-black/40 border border-white/5 rounded-lg px-2 py-1 text-center text-xs font-bold text-white focus:outline-none focus:border-white/20"
                      aria-label="Carico previsto"
                    />
                  </div>

                  <div className="bg-black/20 p-2 rounded-xl border border-white/5">
                    <span className="text-[8px] font-bold text-white/30 uppercase tracking-wider block mb-1">RIR</span>
                    <input
                      type="number"
                      min="0"
                      max="10"
                      value={ex.rir ?? ''}
                      onChange={(e) => handleUpdateExParam(day.id, ex.id, 'rir', e.target.value !== '' ? Number(e.target.value) : undefined)}
                      placeholder="—"
                      className="w-full bg-black/40 border border-white/5 rounded-lg px-2 py-1 text-center text-xs font-mono text-white focus:outline-none focus:border-white/20"
                      aria-label="Reps in reserve (RIR)"
                    />
                  </div>

                  <div className="bg-black/20 p-2 rounded-xl border border-white/5">
                    <span className="text-[8px] font-bold text-white/30 uppercase tracking-wider block mb-1">T.U.T.</span>
                    <input
                      type="text"
                      value={ex.tut || ''}
                      onChange={(e) => handleUpdateExParam(day.id, ex.id, 'tut', e.target.value)}
                      placeholder="—"
                      className="w-full bg-black/40 border border-white/5 rounded-lg px-2 py-1 text-center text-xs font-mono text-white focus:outline-none focus:border-white/20"
                      aria-label="Time under tension"
                    />
                  </div>

                  <div className="bg-black/20 p-2 rounded-xl border border-white/5">
                    <span className="text-[8px] font-bold text-white/30 uppercase tracking-wider block mb-1">Recupero</span>
                    <div className="flex items-center gap-1 bg-black/40 border border-white/5 rounded-lg px-2 py-1 w-full">
                      <input
                        type="number"
                        min="0"
                        step="15"
                        value={ex.recupero ?? ''}
                        onChange={(e) => handleUpdateExParam(day.id, ex.id, 'recupero', Number(e.target.value))}
                        placeholder="—"
                        className="w-full bg-transparent border-none text-center text-xs font-mono text-white focus:outline-none p-0"
                        aria-label="Recupero"
                      />
                      <span className="text-white/40 text-[9px] font-mono select-none">s</span>
                    </div>
                  </div>
                </div>

                {/* Quick actions row */}
                <div className="flex items-center justify-between gap-2 pt-3 border-t border-white/5 mt-2">
                  {/* Blocks Manager Trigger */}
                  <button
                    type="button"
                    onClick={() => handleOpenBlocksManager(day.id, ex.id)}
                    className="flex items-center gap-1 px-2 py-1 rounded bg-white/5 hover:bg-white/10 text-[9px] font-bold text-white/60 hover:text-white transition-all cursor-pointer border border-white/5 shrink-0"
                    aria-label="Gestisci blocchi dell'esercizio"
                  >
                    <Layers className="w-2.5 h-2.5 text-[#CCFF00]" style={{ color: config.primaryColor }} />
                    <span>{ex.blocks && ex.blocks.length > 0 ? `Blocchi (${ex.blocks.length})` : 'Blocchi'}</span>
                  </button>

                  {/* Quick text fields edit */}
                  <div className="flex gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => setTextEditModal({
                        exId: ex.id,
                        field: 'tecnicaIntensita',
                        title: 'Modifica Tecnica di Intensità',
                        value: ex.tecnicaIntensita || ''
                      })}
                      title={`Tecnica: ${ex.tecnicaIntensita || 'Standard'}`}
                      className="p-1 px-1.5 rounded bg-black/30 hover:bg-white/5 text-white/40 hover:text-[#CCFF00] border border-white/5 text-[9px] font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Settings className="w-2.5 h-2.5" />
                      <span className="max-w-[45px] truncate">{ex.tecnicaIntensita || 'Tecnica'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setTextEditModal({
                        exId: ex.id,
                        field: 'noteTecniche',
                        title: 'Modifica Note Tecniche',
                        value: ex.noteTecniche || ''
                      })}
                      title={`Note: ${ex.noteTecniche || '—'}`}
                      className="p-1 px-1.5 rounded bg-black/30 hover:bg-white/5 text-white/40 hover:text-[#CCFF00] border border-white/5 text-[9px] font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <FileText className="w-2.5 h-2.5" />
                      <span>Note</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Note/Technique Modal */}
        {textEditModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
            <div className="bg-[#121212] border border-white/10 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-fadeIn">
              <div className="p-4 border-b border-white/5 flex justify-between items-center bg-black/20">
                <span className="text-xs font-black uppercase text-white/80 tracking-wider">
                  {textEditModal.title}
                </span>
                <button
                  type="button"
                  onClick={() => setTextEditModal(null)}
                  className="p-1.5 rounded-lg bg-black/40 border border-white/5 text-white/40 hover:text-white hover:bg-neutral-900 transition-all cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="p-5 space-y-4 text-left">
                <textarea
                  id="modal-text-edit"
                  value={textEditModal.value}
                  onChange={(e) => setTextEditModal(prev => prev ? { ...prev, value: e.target.value } : null)}
                  rows={4}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-black/40 border border-white/5 text-white focus:outline-none resize-none"
                  placeholder="Scrivi qui..."
                />
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setTextEditModal(null)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-white/60 hover:text-white bg-black/40 hover:bg-neutral-900 transition-all cursor-pointer"
                  >
                    Annulla
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      handleUpdateExParam(
                        day.id,
                        textEditModal.exId,
                        textEditModal.field,
                        textEditModal.value
                      );
                      setTextEditModal(null);
                    }}
                    className="px-4 py-2 rounded-xl text-xs font-black text-neutral-950 transition-all cursor-pointer shadow-md"
                    style={{ backgroundColor: config.primaryColor }}
                  >
                    Salva
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Otherwise, render TABLE view
  return (
    <div className="space-y-4">
      {/* DESKTOP TABLE (sm and larger) */}
      <div className="hidden sm:block overflow-auto w-full max-h-[600px] rounded-xl border border-white/5 bg-black/20 scrollbar-thin">
        <table className="w-full text-left border-collapse table-fixed min-w-[950px]">
          <thead>
            <tr className="bg-neutral-950 border-b border-white/10 select-none">
              {groupSelectionDayId === day.id && (
                <th scope="col" className="sticky top-0 left-0 z-30 bg-neutral-950 border-b border-r border-white/5 p-2 text-center text-[10px] font-black uppercase text-white/40 w-12 shrink-0">Seleziona</th>
              )}
              <th scope="col" className="sticky top-0 z-30 bg-neutral-950 border-b border-r border-white/5 p-2 text-center text-[10px] font-black uppercase text-white/40 w-16 shrink-0" style={groupSelectionDayId === day.id ? {} : { left: '0px' }}>Ordine</th>
              <th scope="col" className="sticky top-0 z-30 bg-neutral-950 border-b border-r border-white/5 p-2 text-left text-[10px] font-black uppercase text-white/40 min-w-[200px]" style={groupSelectionDayId === day.id ? {} : { left: '40px' }}>Esercizio</th>
              <th scope="col" className="sticky top-0 z-30 bg-neutral-950 border-b border-r border-white/5 p-2 text-center text-[10px] font-black uppercase text-white/40 w-24">Serie</th>
              <th scope="col" className="sticky top-0 z-30 bg-neutral-950 border-b border-r border-white/5 p-2 text-center text-[10px] font-black uppercase text-white/40 w-32">Ripetizioni</th>
              <th scope="col" className="sticky top-0 z-30 bg-neutral-950 border-b border-r border-white/5 p-2 text-center text-[10px] font-black uppercase text-white/40 w-24">Carico</th>
              <th scope="col" className="sticky top-0 z-30 bg-neutral-950 border-b border-r border-white/5 p-2 text-center text-[10px] font-black uppercase text-white/40 w-16">RIR</th>
              <th scope="col" className="sticky top-0 z-30 bg-neutral-950 border-b border-r border-white/5 p-2 text-center text-[10px] font-black uppercase text-white/40 w-20">T.U.T.</th>
              <th scope="col" className="sticky top-0 z-30 bg-neutral-950 border-b border-r border-white/5 p-2 text-center text-[10px] font-black uppercase text-white/40 w-24">Recupero</th>
              <th scope="col" className="sticky top-0 z-30 bg-neutral-950 border-b border-r border-white/5 p-2 text-left text-[10px] font-black uppercase text-white/40 w-32">Tecnica</th>
              <th scope="col" className="sticky top-0 z-30 bg-neutral-950 border-b border-r border-white/5 p-2 text-left text-[10px] font-black uppercase text-white/40 w-40">Note</th>
              <th scope="col" className="sticky top-0 z-30 bg-neutral-950 border-b border-r border-white/5 p-2 text-center text-[10px] font-black uppercase text-white/40 w-12">Azioni</th>
            </tr>
          </thead>
          <tbody>
            {processedExercises.map(({ ex, exIdx, isInGroup, groupId, normalizedGroupType, groupIndex, memberLabel, isGroupLeader, groupSummary }) => {
              return (
                <tr 
                  key={ex.id} 
                  className={`border-b border-white/5 hover:bg-white/[0.01] transition-colors ${isInGroup ? 'bg-[#CCFF00]/5' : ''}`}
                  style={isInGroup ? { backgroundColor: `${config.primaryColor}03` } : undefined}
                >
                  {/* 1. Selezione (optional) */}
                  {groupSelectionDayId === day.id && (
                    <td className="p-2 text-center border-r border-white/5 bg-black/10">
                      <input
                        type="checkbox"
                        checked={selectedExerciseIds.includes(ex.id)}
                        disabled={isInGroup || (groupSelectionType === 'compound_set' && selectedExerciseIds.length === 1 && day.esercizi.find(e => e.id === selectedExerciseIds[0])?.distrettoMuscolare !== ex.distrettoMuscolare) || (groupSelectionType === 'jumpset' && selectedExerciseIds.length === 1 && day.esercizi.find(e => e.id === selectedExerciseIds[0])?.distrettoMuscolare === ex.distrettoMuscolare) || (selectedExerciseIds.length >= getRequiredCountHelper(groupSelectionType) && !selectedExerciseIds.includes(ex.id))}
                        onChange={(e) => {
                          const maxCount = getRequiredCountHelper(groupSelectionType);
                          if (e.target.checked) {
                            if (selectedExerciseIds.length < maxCount) {
                              setSelectedExerciseIds(prev => [...prev, ex.id]);
                            }
                          } else {
                            setSelectedExerciseIds(prev => prev.filter(id => id !== ex.id));
                          }
                        }}
                        className="h-4 w-4 rounded border-white/20 bg-black text-[#CCFF00] focus:ring-0 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed mx-auto"
                        style={{ accentColor: config.primaryColor }}
                        aria-label={`Seleziona ${ex.nome}`}
                      />
                    </td>
                  )}

                  {/* 2. Ordine */}
                  <td className="sticky left-0 z-10 bg-neutral-950 border-r border-white/5 p-2 text-center text-xs font-mono font-bold text-white/50 relative">
                    {isInGroup && (
                      <span className="absolute left-0 top-0 bottom-0 w-1" style={{ backgroundColor: config.primaryColor }} />
                    )}
                    <div className="flex items-center justify-center gap-1.5 select-none">
                      <GripVertical className="w-3.5 h-3.5 text-white/20 cursor-grab shrink-0" aria-hidden="true" />
                      <span>{isInGroup ? memberLabel : exIdx + 1}</span>
                    </div>
                  </td>

                  {/* 3. Esercizio */}
                  <td className="p-2 border-r border-white/5 relative">
                    <div className="flex flex-col text-left pl-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-extrabold text-white text-xs leading-tight">{ex.nome}</span>
                        {isInGroup && (
                          <span className="px-1.5 py-0.5 rounded text-[8px] font-mono font-black text-neutral-950 shrink-0 uppercase select-none" style={{ backgroundColor: config.primaryColor }}>
                            {EXERCISE_GROUP_LABELS[normalizedGroupType!]}
                          </span>
                        )}
                        {ex.linkVideo && (
                          <a href={ex.linkVideo} target="_blank" rel="noreferrer" className="text-red-400 hover:text-red-300 shrink-0" aria-label={`Guarda video per ${ex.nome}`}>
                            <Video className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                      <span className="text-[10px] text-white/45 font-bold uppercase tracking-wider mt-0.5">{ex.distrettoMuscolare}</span>

                      {/* Group summary block */}
                      {groupSummary && (() => {
                        const { restBetween, restAfter, rounds, isJumpsetGroup, isCircuitGroup } = groupSummary;
                        let text = '';
                        let subText = '';
                        if (isJumpsetGroup) {
                          text = `${restBetween}s tra ${memberLabel} e ${getGroupMemberLabel(groupIndex, 2)} • ${restAfter}s dopo • ${rounds} ${rounds === 1 ? 'giro' : 'giri'}`;
                          subText = `Alterna ${memberLabel} e ${getGroupMemberLabel(groupIndex, 2)} rispettando il recupero.`;
                        } else if (isCircuitGroup) {
                          text = `${restBetween}s tra le stazioni • ${restAfter}s dopo il giro • ${rounds} ${rounds === 1 ? 'giro' : 'giri'}`;
                          subText = 'Esegui le stazioni in sequenza.';
                        } else {
                          text = `${restBetween}s tra esercizi • ${restAfter}s dopo • ${rounds} ${rounds === 1 ? 'giro' : 'giri'}`;
                        }
                        return (
                          <div className="flex flex-col gap-0.5 mt-1.5 max-w-xs select-none">
                            <span className="text-[9px] text-[#CCFF00]/90 font-black bg-neutral-900 border border-[#CCFF00]/20 px-1.5 py-0.5 rounded-md w-fit" style={{ color: config.primaryColor, borderColor: `${config.primaryColor}30` }}>
                              {text}
                            </span>
                            {subText && (
                              <span className="text-[9px] text-white/40 font-normal italic leading-tight">
                                {subText}
                              </span>
                            )}
                          </div>
                        );
                      })()}

                      {/* Blocks trigger */}
                      <button
                        type="button"
                        onClick={() => handleOpenBlocksManager(day.id, ex.id)}
                        className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-white/5 hover:bg-white/10 text-[9px] font-bold text-white/60 hover:text-white transition-all cursor-pointer border border-white/5 w-fit mt-1.5"
                        aria-label="Gestisci blocchi dell'esercizio"
                      >
                        <Layers className="w-2.5 h-2.5 text-[#CCFF00]" style={{ color: config.primaryColor }} />
                        <span>{ex.blocks && ex.blocks.length > 0 ? `Blocchi (${ex.blocks.length})` : 'Gestisci blocchi'}</span>
                      </button>
                    </div>
                  </td>

                  {/* 4. Serie */}
                  <td className="p-2 border-r border-white/5 text-center">
                    <div className="flex items-center gap-1 bg-black/40 border border-white/5 rounded-lg px-1.5 py-1 justify-center w-fit mx-auto select-none">
                      <button
                        type="button"
                        onClick={() => handleUpdateExParam(day.id, ex.id, 'serie', Math.max(1, ex.serie - 1))}
                        className="text-xs font-bold text-white/40 hover:text-white px-1 cursor-pointer"
                        aria-label="Riduci serie"
                      >
                        -
                      </button>
                      <span className="text-xs font-black text-white px-1 font-mono">{ex.serie}</span>
                      <button
                        type="button"
                        onClick={() => handleUpdateExParam(day.id, ex.id, 'serie', ex.serie + 1)}
                        className="text-xs font-bold text-white/40 hover:text-white px-1 cursor-pointer"
                        aria-label="Aumenta serie"
                      >
                        +
                      </button>
                    </div>
                  </td>

                  {/* 5. Ripetizioni */}
                  <td className="p-2 border-r border-white/5 text-center">
                    <div className="flex items-center gap-1.5 justify-center">
                      <input
                        type="number"
                        min="1"
                        value={ex.repMin || ''}
                        onChange={(e) => handleUpdateExParam(day.id, ex.id, 'repMin', Number(e.target.value))}
                        className="w-11 bg-black/40 border border-white/10 rounded px-1.5 py-1 text-center font-bold text-white text-xs focus:outline-none focus:border-white/30"
                        aria-label="Ripetizioni minime"
                      />
                      <span className="text-white/30 text-xs select-none">-</span>
                      <input
                        type="number"
                        min="1"
                        value={ex.repMax || ''}
                        onChange={(e) => handleUpdateExParam(day.id, ex.id, 'repMax', Number(e.target.value))}
                        className="w-11 bg-black/40 border border-white/10 rounded px-1.5 py-1 text-center font-bold text-white text-xs focus:outline-none focus:border-white/30"
                        aria-label="Ripetizioni massime"
                      />
                    </div>
                  </td>

                  {/* 6. Carico */}
                  <td className="p-2 border-r border-white/5 text-center">
                    <input
                      type="text"
                      value={ex.caricoPrevisto || ''}
                      onChange={(e) => handleUpdateExParam(day.id, ex.id, 'caricoPrevisto', e.target.value)}
                      placeholder="—"
                      className="w-16 bg-black/30 border border-white/10 rounded px-1.5 py-1 text-center text-xs font-bold text-white focus:outline-none focus:border-white/30"
                      aria-label="Carico previsto"
                    />
                  </td>

                  {/* 7. RIR */}
                  <td className="p-2 border-r border-white/5 text-center">
                    <input
                      type="number"
                      min="0"
                      max="10"
                      value={ex.rir ?? ''}
                      onChange={(e) => handleUpdateExParam(day.id, ex.id, 'rir', e.target.value !== '' ? Number(e.target.value) : undefined)}
                      placeholder="—"
                      className="w-10 bg-black/30 border border-white/10 rounded px-1 py-1 text-center text-xs font-mono text-white focus:outline-none focus:border-white/30"
                      aria-label="RIR"
                    />
                  </td>

                  {/* 8. T.U.T. */}
                  <td className="p-2 border-r border-white/5 text-center">
                    <input
                      type="text"
                      value={ex.tut || ''}
                      onChange={(e) => handleUpdateExParam(day.id, ex.id, 'tut', e.target.value)}
                      placeholder="—"
                      className="w-14 bg-black/30 border border-white/10 rounded px-1 py-1 text-center text-xs font-mono text-white focus:outline-none focus:border-white/30"
                      aria-label="T.U.T."
                    />
                  </td>

                  {/* 9. Recupero */}
                  <td className="p-2 border-r border-white/5 text-center">
                    <div className="flex items-center gap-1 justify-center">
                      <input
                        type="number"
                        min="0"
                        step="15"
                        value={ex.recupero ?? ''}
                        onChange={(e) => handleUpdateExParam(day.id, ex.id, 'recupero', Number(e.target.value))}
                        className="w-12 bg-black/30 border border-white/10 rounded px-1.5 py-1 text-center text-xs text-white font-mono focus:outline-none focus:border-white/30"
                        aria-label="Recupero"
                      />
                      <span className="text-white/40 text-[10px] font-mono select-none">s</span>
                    </div>
                  </td>

                  {/* 10. Tecnica */}
                  <td className="p-2 border-r border-white/5">
                    <div className="flex items-center justify-between gap-1">
                      <span className="truncate text-xs text-white/80" title={ex.tecnicaIntensita || 'Standard'}>
                        {ex.tecnicaIntensita || 'Standard'}
                      </span>
                      <button
                        type="button"
                        onClick={() => setTextEditModal({
                          exId: ex.id,
                          field: 'tecnicaIntensita',
                          title: 'Modifica Tecnica di Intensità',
                          value: ex.tecnicaIntensita || ''
                        })}
                        className="p-1 rounded hover:bg-white/10 text-white/40 hover:text-[#CCFF00] cursor-pointer shrink-0"
                        aria-label="Modifica tecnica"
                      >
                        <Settings className="w-3 h-3" />
                      </button>
                    </div>
                  </td>

                  {/* 11. Note */}
                  <td className="p-2 border-r border-white/5">
                    <div className="flex items-center justify-between gap-1">
                      <span className="truncate text-[11px] text-white/50" title={ex.noteTecniche || '—'}>
                        {ex.noteTecniche || '—'}
                      </span>
                      <button
                        type="button"
                        onClick={() => setTextEditModal({
                          exId: ex.id,
                          field: 'noteTecniche',
                          title: 'Modifica Note Tecniche',
                          value: ex.noteTecniche || ''
                        })}
                        className="p-1 rounded hover:bg-white/10 text-white/40 hover:text-[#CCFF00] cursor-pointer shrink-0"
                        aria-label="Modifica note"
                      >
                        <FileText className="w-3 h-3" />
                      </button>
                    </div>
                  </td>

                  {/* 12. Azioni */}
                  <td className="p-2 text-center relative">
                    <button
                      id={`trigger-actions-table-${ex.id}`}
                      type="button"
                      onClick={() => setActiveActionMenuExId(activeActionMenuExId === `ex_${ex.id}` ? null : `ex_${ex.id}`)}
                      className="p-1 rounded hover:bg-white/5 text-white/40 hover:text-white cursor-pointer"
                      aria-label="Menu azioni"
                      aria-haspopup="true"
                      aria-expanded={activeActionMenuExId === `ex_${ex.id}`}
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                    {activeActionMenuExId === `ex_${ex.id}` && renderActionMenuContent(ex, exIdx, isInGroup, normalizedGroupType)}
                  </td>
                </tr>
              );
            })}

            {/* TOTALS FOOTER ROW */}
            <tr className="bg-neutral-950 font-bold border-t border-white/10 select-none">
              <td colSpan={groupSelectionDayId === day.id ? 3 : 2} className="text-right pr-4 py-2.5 text-[10px] font-black uppercase tracking-wider text-white/40">
                TOTALE SERIE GIORNATA
              </td>
              <td className="p-2.5 text-center text-xs font-black" style={{ color: config.primaryColor }}>
                {totalSetsForWeekDay} s
              </td>
              <td colSpan={8}></td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* MOBILE LIST FOR SMALL SCREENS */}
      <div className="block sm:hidden space-y-3">
        {processedExercises.map(({ ex, exIdx, isInGroup, groupId, normalizedGroupType, groupIndex, memberLabel, isGroupLeader, groupSummary }) => {
          const isExpanded = !!expandedExIds[ex.id];
          return (
            <div 
              key={ex.id}
              className="bg-neutral-900/60 border border-white/5 rounded-xl p-3 space-y-3 relative text-left"
            >
              {isInGroup && (
                <span className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl" style={{ backgroundColor: config.primaryColor }} />
              )}
              
              {/* Closed row layout */}
              <div className="flex justify-between items-start gap-2">
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] font-mono font-bold text-white/40 select-none">
                      {isInGroup ? memberLabel : `#${exIdx + 1}`}
                    </span>
                    {isInGroup && (
                      <span className="px-1.5 py-0.5 rounded text-[8px] font-mono font-black text-neutral-950 uppercase select-none" style={{ backgroundColor: config.primaryColor }}>
                        {EXERCISE_GROUP_LABELS[normalizedGroupType!]}
                      </span>
                    )}
                  </div>
                  <h4 className="text-xs font-bold text-white break-words pr-4 leading-tight">{ex.nome}</h4>
                  <div className="flex items-center gap-3 text-[10px] font-mono text-white/60">
                    <span>Serie: <strong>{ex.serie}</strong></span>
                    <span>Reps: <strong>{ex.repMin}{ex.repMax !== ex.repMin ? `–${ex.repMax}` : ''}</strong></span>
                  </div>
                </div>
                
                {/* Actions & expand triggers */}
                <div className="flex items-center gap-1 shrink-0">
                  <div className="relative">
                    <button
                      id={`trigger-actions-mobile-${ex.id}`}
                      type="button"
                      onClick={() => setActiveActionMenuExId(activeActionMenuExId === `ex_${ex.id}` ? null : `ex_${ex.id}`)}
                      className="p-1 rounded hover:bg-white/5 text-white/40 hover:text-white cursor-pointer"
                      aria-label="Menu azioni"
                      aria-haspopup="true"
                      aria-expanded={activeActionMenuExId === `ex_${ex.id}`}
                    >
                      <MoreHorizontal className="w-3.5 h-3.5" />
                    </button>
                    {activeActionMenuExId === `ex_${ex.id}` && renderActionMenuContent(ex, exIdx, isInGroup, normalizedGroupType)}
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleExpandEx(ex.id)}
                    aria-expanded={isExpanded}
                    aria-label={isExpanded ? "Riduci dettagli" : "Mostra dettagli"}
                    className="p-1 rounded hover:bg-white/5 text-white/40 hover:text-white cursor-pointer"
                  >
                    {isExpanded ? (
                      <ChevronLeft className="w-3.5 h-3.5 rotate-90 transition-transform" />
                    ) : (
                      <ChevronRight className="w-3.5 h-3.5 rotate-90 transition-transform" />
                    )}
                  </button>
                </div>
              </div>

              {/* Detail fields */}
              {isExpanded && (
                <div className="space-y-3 pt-3 border-t border-white/5 text-xs animate-fadeIn pl-1">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-black/20 p-2 rounded-lg border border-white/5">
                      <span className="block text-[8px] font-bold text-white/35 uppercase tracking-wider mb-0.5">Carico</span>
                      <input
                        type="text"
                        value={ex.caricoPrevisto || ''}
                        onChange={(e) => handleUpdateExParam(day.id, ex.id, 'caricoPrevisto', e.target.value)}
                        placeholder="—"
                        className="w-full bg-transparent border-b border-white/10 text-white font-semibold text-center focus:outline-none py-0.5"
                      />
                    </div>
                    <div className="bg-black/20 p-2 rounded-lg border border-white/5">
                      <span className="block text-[8px] font-bold text-white/35 uppercase tracking-wider mb-0.5">RIR</span>
                      <input
                        type="number"
                        min="0"
                        max="10"
                        value={ex.rir ?? ''}
                        onChange={(e) => handleUpdateExParam(day.id, ex.id, 'rir', e.target.value !== '' ? Number(e.target.value) : undefined)}
                        placeholder="—"
                        className="w-full bg-transparent border-b border-white/10 text-white font-mono text-center focus:outline-none py-0.5"
                      />
                    </div>
                    <div className="bg-black/20 p-2 rounded-lg border border-white/5">
                      <span className="block text-[8px] font-bold text-white/35 uppercase tracking-wider mb-0.5">T.U.T.</span>
                      <input
                        type="text"
                        value={ex.tut || ''}
                        onChange={(e) => handleUpdateExParam(day.id, ex.id, 'tut', e.target.value)}
                        placeholder="—"
                        className="w-full bg-transparent border-b border-white/10 text-white font-mono text-center focus:outline-none py-0.5"
                      />
                    </div>
                    <div className="bg-black/20 p-2 rounded-lg border border-white/5">
                      <span className="block text-[8px] font-bold text-white/35 uppercase tracking-wider mb-0.5">Recupero (s)</span>
                      <input
                        type="number"
                        min="0"
                        step="15"
                        value={ex.recupero ?? ''}
                        onChange={(e) => handleUpdateExParam(day.id, ex.id, 'recupero', Number(e.target.value))}
                        placeholder="—"
                        className="w-full bg-transparent border-b border-white/10 text-white font-mono text-center focus:outline-none py-0.5"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5 text-[11px]">
                    <div className="flex justify-between items-center bg-black/10 p-1.5 rounded-lg border border-white/5">
                      <span className="text-[9px] font-bold text-white/35 uppercase tracking-wider">Distretto:</span>
                      <span className="font-semibold text-white/70">{ex.distrettoMuscolare}</span>
                    </div>
                    <div className="flex justify-between items-center bg-black/10 p-1.5 rounded-lg border border-white/5">
                      <span className="text-[9px] font-bold text-white/35 uppercase tracking-wider">Tecnica:</span>
                      <div className="flex items-center gap-1">
                        <span className="font-semibold text-white/70 max-w-[150px] truncate">{ex.tecnicaIntensita || 'Standard'}</span>
                        <button
                          type="button"
                          onClick={() => setTextEditModal({
                            exId: ex.id,
                            field: 'tecnicaIntensita',
                            title: 'Modifica Tecnica di Intensità',
                            value: ex.tecnicaIntensita || ''
                          })}
                          className="p-1 rounded hover:bg-white/10 text-white/40 hover:text-white"
                        >
                          <Settings className="w-3.5 h-3.5" style={{ color: config.primaryColor }} />
                        </button>
                      </div>
                    </div>
                    <div className="flex justify-between items-center bg-black/10 p-1.5 rounded-lg border border-white/5">
                      <span className="text-[9px] font-bold text-white/35 uppercase tracking-wider">Note:</span>
                      <div className="flex items-center gap-1">
                        <span className="text-white/50 max-w-[150px] truncate">{ex.noteTecniche || '—'}</span>
                        <button
                          type="button"
                          onClick={() => setTextEditModal({
                            exId: ex.id,
                            field: 'noteTecniche',
                            title: 'Modifica Note Tecniche',
                            value: ex.noteTecniche || ''
                          })}
                          className="p-1 rounded hover:bg-white/10 text-white/40 hover:text-white"
                        >
                          <FileText className="w-3.5 h-3.5" style={{ color: config.primaryColor }} />
                        </button>
                      </div>
                    </div>
                  </div>

                  {groupSummary && (
                    <div className="p-2.5 rounded-lg bg-neutral-900 border border-[#CCFF00]/15 text-[9px] space-y-1 leading-normal">
                      <div className="font-black text-[#CCFF00]" style={{ color: config.primaryColor }}>
                        {normalizedGroupType === 'jumpset' 
                          ? `${groupSummary.restBetween}s tra ${memberLabel} e ${getGroupMemberLabel(groupIndex, 2)} • ${groupSummary.restAfter}s dopo • ${groupSummary.rounds} ${groupSummary.rounds === 1 ? 'giro' : 'giri'}`
                          : normalizedGroupType === 'circuit'
                            ? `${groupSummary.restBetween}s tra le stazioni • ${groupSummary.restAfter}s dopo il giro • ${groupSummary.rounds} ${groupSummary.rounds === 1 ? 'giro' : 'giri'}`
                            : `${groupSummary.restBetween}s tra esercizi • ${groupSummary.restAfter}s dopo • ${groupSummary.rounds} ${groupSummary.rounds === 1 ? 'giro' : 'giri'}`}
                      </div>
                      {normalizedGroupType === 'jumpset' && (
                        <div className="text-white/40 italic">Alterna {memberLabel} e {getGroupMemberLabel(groupIndex, 2)} rispettando il recupero.</div>
                      )}
                      {normalizedGroupType === 'circuit' && (
                        <div className="text-white/40 italic">Esegui le stazioni in sequenza.</div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Note/Technique Modal */}
      {textEditModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <div className="bg-[#121212] border border-white/10 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-fadeIn">
            <div className="p-4 border-b border-white/5 flex justify-between items-center bg-black/20">
              <span className="text-xs font-black uppercase text-white/80 tracking-wider">
                {textEditModal.title}
              </span>
              <button
                type="button"
                onClick={() => setTextEditModal(null)}
                className="p-1.5 rounded-lg bg-black/40 border border-white/5 text-white/40 hover:text-white hover:bg-neutral-900 transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-4 text-left">
              <textarea
                id="modal-text-edit"
                value={textEditModal.value}
                onChange={(e) => setTextEditModal(prev => prev ? { ...prev, value: e.target.value } : null)}
                rows={4}
                className="w-full px-3 py-2 text-xs rounded-xl bg-black/40 border border-white/5 text-white focus:outline-none resize-none"
                placeholder="Scrivi qui..."
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setTextEditModal(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white/60 hover:text-white bg-black/40 hover:bg-neutral-900 transition-all cursor-pointer"
                >
                  Annulla
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleUpdateExParam(
                      day.id,
                      textEditModal.exId,
                      textEditModal.field,
                      textEditModal.value
                    );
                    setTextEditModal(null);
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-black text-neutral-950 transition-all cursor-pointer shadow-md"
                  style={{ backgroundColor: config.primaryColor }}
                >
                  Salva
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
