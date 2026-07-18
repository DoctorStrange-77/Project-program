/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Client, CoachConfig, Exercise, WorkoutPlan, WorkoutDay, 
  WorkoutExercise, Sesso, LivelloEsperienza, DistrettoMuscolare, 
  WorkoutTemplate, WorkoutWeek, WorkoutPlanStatus, WorkoutExerciseBlock,
  ExerciseGroupType, EXERCISE_GROUP_LABELS
} from '../types';
import { 
  User, Check, ChevronRight, ChevronLeft, Trash2, Copy, ArrowUp, ArrowDown, 
  Plus, Search, Filter, Dumbbell, Award, Calendar, FileText, Info, PlusCircle, 
  LayoutGrid, X, Link, Unlink, Sparkles, Save, CheckSquare, RotateCcw,
  Star, Video, Clipboard, Layers, RefreshCw, AlertCircle, TrendingUp, HelpCircle,
  MoreHorizontal, Settings
} from 'lucide-react';
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Cell
} from 'recharts';
import {
  createExerciseGroupId,
  removeExerciseFromGroup,
  getGroupMemberLabel,
  isGroupedExercise,
  normalizeExerciseGroupType,
  normalizeExerciseGroupData,
  DEFAULT_GROUP_REST_BETWEEN_EXERCISES_SEC,
  DEFAULT_GROUP_REST_AFTER_ROUND_SEC,
  DEFAULT_GROUP_ROUNDS,
  DEFAULT_JUMPSET_REST_BETWEEN_EXERCISES_SEC
} from '../utils/exerciseGroupUtils';

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

const ensureUniqueProgramRowIds = (esercizi: WorkoutExercise[]): WorkoutExercise[] => {
  const seenIds = new Set<string>();
  return esercizi.map(ex => {
    if (!ex.programRowId || seenIds.has(ex.programRowId)) {
      const freshRowId = 'pr_' + Math.random().toString(36).substr(2, 5);
      seenIds.add(freshRowId);
      return { ...ex, programRowId: freshRowId };
    }
    seenIds.add(ex.programRowId);
    return ex;
  });
};

const fixDuplicateProgramRowIdsInWeeks = (prevWeeks: WorkoutWeek[]): WorkoutWeek[] => {
  return prevWeeks.map(w => ({
    ...w,
    giornate: w.giornate.map(d => ({
      ...d,
      esercizi: ensureUniqueProgramRowIds(d.esercizi)
    }))
  }));
};

const migrateWeeks = (inputWeeks: WorkoutWeek[]): WorkoutWeek[] => {
  if (!inputWeeks || inputWeeks.length === 0) return inputWeeks;
  
  // 1. Deep clone to avoid mutating input directly
  const weeksCopy: WorkoutWeek[] = JSON.parse(JSON.stringify(inputWeeks));
  
  // 2. Ensure programDayId is set for all days by index across weeks
  const maxDays = Math.max(...weeksCopy.map(w => w.giornate.length), 0);
  for (let dIdx = 0; dIdx < maxDays; dIdx++) {
    let existingDayId: string | undefined;
    for (const w of weeksCopy) {
      if (w.giornate[dIdx]?.programDayId) {
        existingDayId = w.giornate[dIdx].programDayId;
        break;
      }
    }
    const dayIdToUse = existingDayId || ('pd_' + Math.random().toString(36).substr(2, 5));
    for (const w of weeksCopy) {
      if (w.giornate[dIdx]) {
        w.giornate[dIdx].programDayId = dayIdToUse;
      }
    }
  }

  // Check if any exercise in any week lacks programRowId
  const needsMigration = weeksCopy.some(w => 
    w.giornate.some(d => 
      d.esercizi.some(ex => !ex.programRowId)
    )
  );
  
  if (!needsMigration) {
    return weeksCopy;
  }
  
  // Let's perform the migration using the first week as reference
  const firstWeek = weeksCopy[0];
  
  // Step 1: Assign stable row IDs to all exercises in week 1
  firstWeek.giornate.forEach(day => {
    day.esercizi.forEach((ex) => {
      if (!ex.programRowId) {
        ex.programRowId = 'pr_' + Math.random().toString(36).substr(2, 5);
      }
    });
  });
  
  // Step 2: Match exercises in other weeks
  for (let wIdx = 1; wIdx < weeksCopy.length; wIdx++) {
    const currentWeek = weeksCopy[wIdx];
    
    // For each day in the current week, find matching day in first week
    currentWeek.giornate.forEach((currDay) => {
      const refDay = firstWeek.giornate.find(d => d.programDayId === currDay.programDayId);
      if (!refDay) {
        // If there's no corresponding reference day, just generate new row IDs for all exercises in this day
        currDay.esercizi.forEach(ex => {
          if (!ex.programRowId) {
            ex.programRowId = 'pr_' + Math.random().toString(36).substr(2, 5);
          }
        });
        return;
      }
      
      // We will keep track of which reference exercises from refDay have been mapped/paired with an exercise in currDay
      const pairedRefRowIds = new Set<string>();
      // We also keep track of which currDay exercises got a programRowId during matching
      const pairedCurrIndices = new Set<number>();
      
      // First pass: Match exact same name at exact same index
      currDay.esercizi.forEach((currEx, currExIdx) => {
        if (currEx.programRowId) {
          pairedCurrIndices.add(currExIdx);
          pairedRefRowIds.add(currEx.programRowId);
          return;
        }
        const refEx = refDay.esercizi[currExIdx];
        if (refEx && refEx.nome === currEx.nome && !pairedRefRowIds.has(refEx.programRowId!)) {
          currEx.programRowId = refEx.programRowId;
          pairedRefRowIds.add(refEx.programRowId!);
          pairedCurrIndices.add(currExIdx);
        }
      });
      
      // Second pass: Match same name at any other index
      currDay.esercizi.forEach((currEx, currExIdx) => {
        if (pairedCurrIndices.has(currExIdx)) return;
        
        // Find an unmatched refEx with the same name
        const matchRefEx = refDay.esercizi.find(rEx => 
          rEx.nome === currEx.nome && !pairedRefRowIds.has(rEx.programRowId!)
        );
        if (matchRefEx) {
          currEx.programRowId = matchRefEx.programRowId;
          pairedRefRowIds.add(matchRefEx.programRowId!);
          pairedCurrIndices.add(currExIdx);
        }
      });
      
      // Third pass: Match same original index fallback (even if name is different)
      currDay.esercizi.forEach((currEx, currExIdx) => {
        if (pairedCurrIndices.has(currExIdx)) return;
        
        const refEx = refDay.esercizi[currExIdx];
        if (refEx && !pairedRefRowIds.has(refEx.programRowId!)) {
          currEx.programRowId = refEx.programRowId;
          pairedRefRowIds.add(refEx.programRowId!);
          pairedCurrIndices.add(currExIdx);
        }
      });
      
      // Fourth pass: For any remaining unmatched exercises, assign a fresh programRowId
      currDay.esercizi.forEach((currEx) => {
        if (!currEx.programRowId) {
          currEx.programRowId = 'pr_' + Math.random().toString(36).substr(2, 5);
        }
      });
    });
  }
  
  return weeksCopy;
};

interface WorkoutWizardProps {
  config: CoachConfig;
  clients: Client[];
  exercises: Exercise[];
  onSavePlan: (plan: WorkoutPlan) => void;
  onAddClient: (client: Client) => void;
  preselectedClient?: Client | null;
  editingPlan?: WorkoutPlan | null; // For editing existing
  
  // Template specific props
  isTemplateMode?: boolean;
  editingTemplate?: WorkoutTemplate | null;
  preselectedTemplate?: WorkoutTemplate | null;
  onSaveTemplate?: (tpl: WorkoutTemplate) => void;
  onCancelTemplate?: () => void;

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

export default function WorkoutWizard({
  config,
  clients,
  exercises,
  onSavePlan,
  onAddClient,
  preselectedClient,
  editingPlan,
  isTemplateMode = false,
  editingTemplate,
  preselectedTemplate,
  onSaveTemplate,
  onCancelTemplate,
  onShowToast,
  onShowConfirm
}: WorkoutWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [lastSavedTime, setLastSavedTime] = useState<string>('');

  // STEP 1 state: Client Selection
  const [selectedClientId, setSelectedClientId] = useState('');
  const [clientSearchQuery, setClientSearchQuery] = useState('');
  const [showQuickAddClient, setShowQuickAddClient] = useState(false);
  const [quickNome, setQuickNome] = useState('');
  const [quickCognome, setQuickCognome] = useState('');
  const [quickEta, setQuickEta] = useState<number | ''>('');
  const [quickSesso, setQuickSesso] = useState<Sesso>('Uomo');
  const [quickObiettivo, setQuickObiettivo] = useState('');
  const [quickLivello, setQuickLivello] = useState<LivelloEsperienza>('Intermedio');
  const [quickFrequenza, setQuickFrequenza] = useState(3);

  // STEP 2 state: Plan General Info
  const [planNome, setPlanNome] = useState('');
  const [planObiettivo, setPlanObiettivo] = useState('');
  const [planFrequenza, setPlanFrequenza] = useState(3); // 2 to 6
  const [planDurata, setPlanDurata] = useState(4); // weeks (1 to 12)
  const [planDataInizio, setPlanDataInizio] = useState('');
  const [planNoteGenerali, setPlanNoteGenerali] = useState('');
  const [planStatus, setPlanStatus] = useState<WorkoutPlanStatus>('Bozza');

  // Templates list
  const [templates, setTemplates] = useState<WorkoutTemplate[]>([]);
  const [showTemplateModal, setShowTemplateModal] = useState(false);

  // STEP 3 state: Multi-week structure
  const [weeks, setWeeks] = useState<WorkoutWeek[]>([]);
  const [activeWeekIndex, setActiveWeekIndex] = useState<number>(1); // 1-indexed

  // Group selection states
  const [groupSelectionDayId, setGroupSelectionDayId] = useState<string | null>(null);
  const [groupSelectionType, setGroupSelectionType] = useState<ExerciseGroupType | null>(null);
  const [selectedExerciseIds, setSelectedExerciseIds] = useState<string[]>([]);
  const [activeGroupMenuDayId, setActiveGroupMenuDayId] = useState<string | null>(null);
  const [supersetSettingsGroupType, setSupersetSettingsGroupType] = useState<ExerciseGroupType>('superset');

  // Helper utility for required exercise count per group type
  const getRequiredGroupMemberCount = (type: ExerciseGroupType | null): number => {
    if (type === 'superset') return 2;
    if (type === 'compound_set') return 2;
    if (type === 'jumpset') return 2;
    if (type === 'triset') return 3;
    if (type === 'giant_set') return 4;
    if (type === 'circuit') return 4;
    return 0;
  };

  const resetGroupSelection = () => {
    setGroupSelectionDayId(null);
    setGroupSelectionType(null);
    setSelectedExerciseIds([]);
    setActiveGroupMenuDayId(null);
  };

  useEffect(() => {
    resetGroupSelection();
    setSupersetSettingsModalOpen(false);
    setSupersetSettingsGroupId(null);
    setSupersetSettingsDayId(null);
    setSupersetSettingsHasMismatch(false);
    setTempRestBetweenSec(0);
    setTempRestAfterSec(90);
    setTempRounds(1);
    setValidationErrors({});
  }, [activeWeekIndex]);

  // Superset settings modal state
  const [supersetSettingsModalOpen, setSupersetSettingsModalOpen] = useState(false);
  const [supersetSettingsGroupId, setSupersetSettingsGroupId] = useState<string | null>(null);
  const [supersetSettingsDayId, setSupersetSettingsDayId] = useState<string | null>(null);
  const [supersetSettingsHasMismatch, setSupersetSettingsHasMismatch] = useState(false);

  // Modal temporary values
  const [tempRestBetweenSec, setTempRestBetweenSec] = useState<number | "">(0);
  const [tempRestAfterSec, setTempRestAfterSec] = useState<number | "">(90);
  const [tempRounds, setTempRounds] = useState<number | "">(1);

  // Validation error states
  const [validationErrors, setValidationErrors] = useState<{
    restBetween?: string;
    restAfter?: string;
    rounds?: string;
  }>({});

  // Multi-week extra features
  const [globalModifications, setGlobalModifications] = useState(false);
  const [copyingDayId, setCopyingDayId] = useState<string | null>(null);
  const [copyTargetWeek, setCopyTargetWeek] = useState<number>(1);
  const [copyTargetDayIdx, setCopyTargetDayIdx] = useState<number>(0);
  const [activeActionMenuExId, setActiveActionMenuExId] = useState<string | null>(null);
  
  // Custom delete exercise configuration state
  const [deleteExConfig, setDeleteExConfig] = useState<{
    dayId: string;
    exInstId: string;
    exNome: string;
  } | null>(null);

  // Structured blocks manager configuration state
  const [blocksManagerConfig, setBlocksManagerConfig] = useState<{
    dayId: string;
    exId: string;
  } | null>(null);
  const [activeBlocks, setActiveBlocks] = useState<WorkoutExerciseBlock[]>([]);
  const [blockVolumeInputs, setBlockVolumeInputs] = useState<Record<string, string>>({});
  const [blocksSuccessMsg, setBlocksSuccessMsg] = useState<string | null>(null);

  // Analytics panel state
  const [showAnalytics, setShowAnalytics] = useState(false);

  // Exercise database selection modal search/filters
  const [isExerciseModalOpen, setIsExerciseModalOpen] = useState(false);
  const [targetDayId, setTargetDayId] = useState<string | null>(null);
  const [exSearch, setExSearch] = useState('');
  const [exMuscleFilter, setExMuscleFilter] = useState<DistrettoMuscolare | 'Tutti'>('Tutti');
  const [exEquipmentFilter, setExEquipmentFilter] = useState<string | 'Tutti'>('Tutti');
  const [exPatternFilter, setExPatternFilter] = useState<string | 'Tutti'>('Tutti');

  // Favorites & Recents states
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);
  const [selectedExIds, setSelectedExIds] = useState<string[]>([]);
  const [favorites, setFavorites] = useState<string[]>(() => {
    const saved = localStorage.getItem('pt_favorite_exercises');
    return saved ? JSON.parse(saved) : [];
  });
  const [recentExs, setRecentExs] = useState<string[]>(() => {
    const saved = localStorage.getItem('pt_recent_exercises');
    return saved ? JSON.parse(saved) : [];
  });

  // Back button modal dismiss logic
  useEffect(() => {
    const handlePopState = (e: PopStateEvent) => {
      if (isExerciseModalOpen) {
        setIsExerciseModalOpen(false);
        setTargetDayId(null);
        e.preventDefault();
      }
    };
    if (isExerciseModalOpen) {
      window.history.pushState({ modalOpen: 'exercise_selector' }, '');
      window.addEventListener('popstate', handlePopState);
    }
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [isExerciseModalOpen]);

  useEffect(() => {
    const handlePopState = (e: PopStateEvent) => {
      if (showTemplateModal) {
        setShowTemplateModal(false);
        e.preventDefault();
      }
    };
    if (showTemplateModal) {
      window.history.pushState({ modalOpen: 'templates_library' }, '');
      window.addEventListener('popstate', handlePopState);
    }
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [showTemplateModal]);

  // Automatic data migration for stable identifiers (programDayId & programRowId)
  useEffect(() => {
    if (weeks && weeks.length > 0) {
      const needsMigration = weeks.some(w => 
        w.giornate.some(d => 
          !d.programDayId || d.esercizi.some(ex => !ex.programRowId)
        )
      );
      if (needsMigration) {
        setWeeks(prevWeeks => migrateWeeks(prevWeeks));
      }
    }
  }, [weeks]);

  // Autosave during workout creation
  useEffect(() => {
    if (currentStep > 1 && selectedClientId) {
      const dataToSave = {
        selectedClientId,
        planNome,
        planObiettivo,
        planFrequenza,
        planDurata,
        planDataInizio,
        planNoteGenerali,
        planStatus,
        weeks,
        activeWeekIndex,
        currentStep,
        timestamp: new Date().toISOString()
      };
      localStorage.setItem('pt_wizard_autosave', JSON.stringify(dataToSave));
      
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const seconds = String(now.getSeconds()).padStart(2, '0');
      setLastSavedTime(`${hours}:${minutes}:${seconds}`);
    }
  }, [
    selectedClientId,
    planNome,
    planObiettivo,
    planFrequenza,
    planDurata,
    planDataInizio,
    planNoteGenerali,
    planStatus,
    weeks,
    activeWeekIndex,
    currentStep
  ]);

  // Handle direct resume from sessionStorage trigger on mount
  useEffect(() => {
    const trigger = sessionStorage.getItem('pt_resume_autosave_trigger');
    const autosave = localStorage.getItem('pt_wizard_autosave');
    if (trigger === 'true' && autosave) {
      sessionStorage.removeItem('pt_resume_autosave_trigger');
      try {
        const data = JSON.parse(autosave);
        setSelectedClientId(data.selectedClientId || '');
        setPlanNome(data.planNome || '');
        setPlanObiettivo(data.planObiettivo || '');
        setPlanFrequenza(data.planFrequenza || 3);
        setPlanDurata(data.planDurata || 4);
        setPlanDataInizio(data.planDataInizio || '');
        setPlanNoteGenerali(data.planNoteGenerali || '');
        setPlanStatus(data.planStatus || 'Bozza');
        setWeeks(data.weeks || []);
        setActiveWeekIndex(data.activeWeekIndex || 1);
        setCurrentStep(data.currentStep || 3);
        
        if (onShowToast) {
          onShowToast('Bozza di lavoro ripristinata con successo!', 'info');
        }
      } catch (err) {
        console.error("Errore nel ripristino autosave", err);
      }
    }
  }, []);

  // Auto-scroll active week column into view
  useEffect(() => {
    const headerEl = document.getElementById(`week-col-header-${activeWeekIndex}`);
    if (headerEl) {
      headerEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }, [activeWeekIndex]);

  // Load saved templates
  useEffect(() => {
    const saved = localStorage.getItem('pt_templates');
    if (saved) {
      setTemplates(JSON.parse(saved));
    } else {
      // Fetch initial if seeded elsewhere
      setTemplates([]);
    }
  }, []);

  // Load editing plan, preselected client, template editing/creation, or preselected template
  useEffect(() => {
    if (isTemplateMode) {
      if (editingTemplate) {
        setPlanNome(editingTemplate.nome);
        setPlanObiettivo(editingTemplate.obiettivo);
        setPlanFrequenza(editingTemplate.allenamentiSettimanali);
        setPlanDurata(editingTemplate.durataSettimane);
        setPlanNoteGenerali(editingTemplate.noteGenerali || '');
        setPlanStatus('Bozza');
        
        if (editingTemplate.weeks && editingTemplate.weeks.length > 0) {
          setWeeks(JSON.parse(JSON.stringify(editingTemplate.weeks)));
        } else {
          const initialWeeks: WorkoutWeek[] = [];
          for (let w = 1; w <= editingTemplate.durataSettimane; w++) {
            initialWeeks.push({
              weekIndex: w,
              giornate: JSON.parse(JSON.stringify(editingTemplate.giornate))
            });
          }
          setWeeks(initialWeeks);
        }
        setActiveWeekIndex(1);
        setCurrentStep(3); // Go straight to exercise builder
      } else {
        // Create new template
        setPlanNome('Nuovo Modello d\'Allenamento');
        setPlanObiettivo('Ipertrofia');
        setPlanFrequenza(3);
        setPlanDurata(4);
        setPlanNoteGenerali('');
        setPlanStatus('Bozza');
        setWeeks([]);
        setActiveWeekIndex(1);
        setCurrentStep(2); // Skip Step 1 (Client Selection)!
      }
    } else if (preselectedTemplate) {
      // Load preselected template into a new plan for a client!
      if (preselectedClient) {
        setSelectedClientId(preselectedClient.id);
      } else {
        setSelectedClientId('');
      }
      setPlanNome(`Scheda - ${preselectedTemplate.nome}`);
      setPlanObiettivo(preselectedTemplate.obiettivo);
      setPlanFrequenza(preselectedTemplate.allenamentiSettimanali);
      setPlanDurata(preselectedTemplate.durataSettimane);
      setPlanNoteGenerali(preselectedTemplate.noteGenerali || '');
      setPlanStatus('Bozza');
      const today = new Date().toISOString().split('T')[0];
      setPlanDataInizio(today);
      
      if (preselectedTemplate.weeks && preselectedTemplate.weeks.length > 0) {
        setWeeks(JSON.parse(JSON.stringify(preselectedTemplate.weeks)));
      } else {
        const initialWeeks: WorkoutWeek[] = [];
        for (let w = 1; w <= preselectedTemplate.durataSettimane; w++) {
          initialWeeks.push({
            weekIndex: w,
            giornate: JSON.parse(JSON.stringify(preselectedTemplate.giornate))
          });
        }
        setWeeks(initialWeeks);
      }
      setActiveWeekIndex(1);
      setCurrentStep(3); // Go straight to exercise insertion
    } else if (editingPlan) {
      setSelectedClientId(editingPlan.clienteId);
      setPlanNome(editingPlan.nome);
      setPlanObiettivo(editingPlan.obiettivo);
      setPlanFrequenza(editingPlan.allenamentiSettimanali);
      setPlanDurata(editingPlan.durataSettimane);
      setPlanDataInizio(editingPlan.dataInizio);
      setPlanNoteGenerali(editingPlan.noteGenerali);
      setPlanStatus(editingPlan.status || 'Bozza');
      
      // If editingPlan has weeks structured, use them
      if (editingPlan.weeks && editingPlan.weeks.length > 0) {
        setWeeks(JSON.parse(JSON.stringify(editingPlan.weeks)));
      } else {
        // Initialize weeks from legacy giornate structure
        const initialWeeks: WorkoutWeek[] = [];
        for (let w = 1; w <= editingPlan.durataSettimane; w++) {
          initialWeeks.push({
            weekIndex: w,
            giornate: JSON.parse(JSON.stringify(editingPlan.giornate))
          });
        }
        setWeeks(initialWeeks);
      }
      setActiveWeekIndex(1);
      setCurrentStep(3); // Go straight to exercise insertion
    } else if (preselectedClient) {
      setSelectedClientId(preselectedClient.id);
      setPlanObiettivo(preselectedClient.obiettivo);
      setPlanFrequenza(preselectedClient.allenamentiSettimanali);
      setPlanNome(`Scheda ${preselectedClient.obiettivo}`);
      const today = new Date().toISOString().split('T')[0];
      setPlanDataInizio(today);
      setPlanStatus('Bozza');
      setCurrentStep(2); // Go directly to step 2 with client locked
    } else {
      // Clear out
      setSelectedClientId('');
      setPlanNome('');
      setPlanObiettivo('');
      setPlanFrequenza(3);
      setPlanDurata(4);
      const today = new Date().toISOString().split('T')[0];
      setPlanDataInizio(today);
      setPlanNoteGenerali('');
      setPlanStatus('Bozza');
      setWeeks([]);
      setActiveWeekIndex(1);
      setCurrentStep(1);
    }
  }, [editingPlan, preselectedClient, isTemplateMode, editingTemplate, preselectedTemplate]);

  // Handle client quick add
  const handleQuickAddClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickNome.trim() || !quickCognome.trim() || !quickEta || !quickObiettivo.trim()) {
      alert('Inserisci tutti i campi obbligatori del cliente.');
      return;
    }
    const newClient: Client = {
      id: 'c_quick_' + Date.now(),
      nome: quickNome.trim(),
      cognome: quickCognome.trim(),
      eta: Number(quickEta),
      sesso: quickSesso,
      obiettivo: quickObiettivo.trim(),
      livelloEsperienza: quickLivello,
      allenamentiSettimanali: quickFrequenza,
      noteCoach: 'Aggiunto rapidamente durante la creazione scheda.'
    };
    onAddClient(newClient);
    setSelectedClientId(newClient.id);
    setPlanObiettivo(newClient.obiettivo);
    setPlanFrequenza(newClient.allenamentiSettimanali);
    setPlanNome(`Scheda ${newClient.obiettivo}`);
    setShowQuickAddClient(false);
    
    // Reset quick form
    setQuickNome('');
    setQuickCognome('');
    setQuickEta('');
    setQuickObiettivo('');
  };

  // Load a Template structure
  const handleLoadTemplate = (template: WorkoutTemplate) => {
    setPlanNome(`Scheda ${template.nome}`);
    setPlanObiettivo(template.obiettivo);
    setPlanFrequenza(template.allenamentiSettimanali);
    setPlanDurata(template.durataSettimane);
    setPlanNoteGenerali(template.noteGenerali);

    // Load templates weeks or convert standard giornate
    const initialWeeks: WorkoutWeek[] = [];
    if (template.weeks && template.weeks.length > 0) {
      setWeeks(JSON.parse(JSON.stringify(template.weeks)));
    } else {
      const gCopy = JSON.parse(JSON.stringify(template.giornate));
      for (let w = 1; w <= template.durataSettimane; w++) {
        // regenerate unique IDs for workout exercises in template
        const mappedGiornate = gCopy.map((day: WorkoutDay) => ({
          ...day,
          id: 'day_' + Math.random().toString(36).substr(2, 5),
          esercizi: day.esercizi.map((ex: WorkoutExercise) => ({
            ...ex,
            id: 'we_inst_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5)
          }))
        }));
        initialWeeks.push({
          weekIndex: w,
          giornate: mappedGiornate
        });
      }
      setWeeks(initialWeeks);
    }
    setActiveWeekIndex(1);
    setShowTemplateModal(false);
    setCurrentStep(3); // Go directly to exercises step
  };

  // Generate or adjust days/weeks based on planFrequenza and planDurata
  const handleStep2Submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!planNome.trim() || !planObiettivo.trim() || !planDataInizio) {
      alert('Tutti i campi generali sono obbligatori.');
      return;
    }

    // Initialize multi-week arrays
    const updatedWeeks: WorkoutWeek[] = [];
    
    for (let w = 1; w <= planDurata; w++) {
      const existingWeek = weeks.find(item => item.weekIndex === w);
      
      const weekGiornate: WorkoutDay[] = [];
      for (let i = 1; i <= planFrequenza; i++) {
        // See if day i already exists in this week
        const existingDay = existingWeek?.giornate[i - 1];
        if (existingDay) {
          weekGiornate.push(existingDay);
        } else {
          weekGiornate.push({
            id: 'day_' + i + '_' + w + '_' + Date.now(),
            nome: `Giorno ${i}`,
            esercizi: []
          });
        }
      }
      
      updatedWeeks.push({
        weekIndex: w,
        giornate: weekGiornate
      });
    }

    setWeeks(updatedWeeks);
    setActiveWeekIndex(1);
    setCurrentStep(3);
  };

  // Active week's giornate helper
  const activeWeek = weeks.find(w => w.weekIndex === activeWeekIndex) || weeks[0] || { weekIndex: 1, giornate: [] };
  const giornate = activeWeek.giornate;

  // Set giornate for active week
  const setGiornate = (updater: WorkoutDay[] | ((prev: WorkoutDay[]) => WorkoutDay[])) => {
    setWeeks(prevWeeks => prevWeeks.map(w => {
      if (w.weekIndex === activeWeekIndex) {
        const nextGiornate = typeof updater === 'function' ? updater(w.giornate) : updater;
        return {
          ...w,
          giornate: nextGiornate
        };
      }
      return w;
    }));
  };

  // Step 3 actions: Rename a day
  const handleRenameDay = (dayId: string, newName: string) => {
    setGiornate(prev => prev.map(day => day.id === dayId ? { ...day, nome: newName } : day));
  };

  // Step 3 actions: Duplicate a day
  const handleDuplicateDay = (dayId: string) => {
    const targetDay = giornate.find(d => d.id === dayId);
    if (!targetDay) return;
    const clonedDay: WorkoutDay = {
      ...targetDay,
      id: 'day_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
      programDayId: 'pd_' + Math.random().toString(36).substr(2, 5),
      nome: `${targetDay.nome} (Copia)`,
      esercizi: targetDay.esercizi.map(ex => ({
        ...ex,
        id: 'we_inst_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
        programRowId: 'pr_' + Math.random().toString(36).substr(2, 5)
      }))
    };
    setGiornate(prev => [...prev, clonedDay]);
    if (onShowToast) {
      onShowToast(`Giornata "${targetDay.nome}" duplicata con successo!`, 'success');
    }
  };

  // Update parameters of an exercise inside a day for a specific week
  const handleUpdateExParamAtWeek = (weekIdx: number, dayId: string, exInstId: string, field: keyof WorkoutExercise, value: any) => {
    setWeeks(prevWeeks => prevWeeks.map(w => {
      if (w.weekIndex === weekIdx) {
        return {
          ...w,
          giornate: w.giornate.map(day => {
            if (day.id === dayId) {
              return {
                ...day,
                esercizi: day.esercizi.map(ex => ex.id === exInstId ? { ...ex, [field]: value } : ex)
              };
            }
            return day;
          })
        };
      }
      return w;
    }));

    if (globalModifications) {
      const targetWeekObj = weeks.find(w => w.weekIndex === weekIdx);
      const currentDay = targetWeekObj?.giornate.find(d => d.id === dayId);
      const currentEx = currentDay?.esercizi.find(ex => ex.id === exInstId);

      if (currentDay && currentEx) {
        setWeeks(prevWeeks => prevWeeks.map(w => {
          if (w.weekIndex === weekIdx) return w;
          
          return {
            ...w,
            giornate: w.giornate.map(d => {
              if (d.programDayId === currentDay.programDayId) {
                return {
                  ...d,
                  esercizi: d.esercizi.map(ex => {
                    if (ex.programRowId === currentEx.programRowId) {
                      return { ...ex, [field]: value };
                    }
                    return ex;
                  })
                };
              }
              return d;
            })
          };
        }));
      }
    }
  };

  // Step 3: Open exercise picker for a specific day
  const openExercisePicker = (dayId: string) => {
    setTargetDayId(dayId);
    setExSearch('');
    setExMuscleFilter('Tutti');
    setExEquipmentFilter('Tutti');
    setIsExerciseModalOpen(true);
  };

  // Step 3: Select and insert exercise
  const handleSelectExercise = (ex: Exercise) => {
    if (!targetDayId) return;

    const rowId = 'pr_' + Math.random().toString(36).substr(2, 5);

    const createWorkoutEx = (customId?: string): WorkoutExercise => ({
      id: customId || ('we_inst_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5)),
      exerciseId: ex.id,
      nome: ex.nome,
      distrettoMuscolare: ex.distrettoMuscolare,
      serie: 3,
      repMin: 8,
      repMax: 12,
      rir: 2,
      recupero: 90,
      tut: '3-0-1-0',
      noteTecniche: '',
      tecnicaIntensita: 'Nessuna',
      caricoPrevisto: '',
      programRowId: rowId
    });

    const newWorkoutEx = createWorkoutEx();

    // 1. Add to current week
    setWeeks(prevWeeks => prevWeeks.map(w => {
      if (w.weekIndex === activeWeekIndex) {
        return {
          ...w,
          giornate: w.giornate.map(day => {
            if (day.id === targetDayId) {
              return {
                ...day,
                esercizi: [...day.esercizi, newWorkoutEx]
              };
            }
            return day;
          })
        };
      }
      return w;
    }));

    // 2. Propagate to other weeks if globalModifications is active
    if (globalModifications) {
      const activeWeekObj = weeks.find(w => w.weekIndex === activeWeekIndex);
      const activeDay = activeWeekObj?.giornate.find(d => d.id === targetDayId);
      if (activeDay) {
        setWeeks(prevWeeks => prevWeeks.map(w => {
          if (w.weekIndex === activeWeekIndex) return w;
          return {
            ...w,
            giornate: w.giornate.map(day => {
              if (day.programDayId === activeDay.programDayId) {
                // Generate a unique instance ID, but keep the same programRowId!
                const specificEx = createWorkoutEx('we_inst_' + Date.now() + '_' + w.weekIndex + '_' + Math.random().toString(36).substr(2, 5));
                return {
                  ...day,
                  esercizi: [...day.esercizi, specificEx]
                };
              }
              return day;
            })
          };
        }));
      }
    }

    setIsExerciseModalOpen(false);
    setTargetDayId(null);
  };

  // Update parameters of an exercise inside a day
  const handleUpdateExParam = (dayId: string, exInstId: string, field: keyof WorkoutExercise, value: any) => {
    // 1. Update the exercise in the current week
    setWeeks(prevWeeks => prevWeeks.map(w => {
      if (w.weekIndex === activeWeekIndex) {
        return {
          ...w,
          giornate: w.giornate.map(day => {
            if (day.id === dayId) {
              return {
                ...day,
                esercizi: day.esercizi.map(ex => ex.id === exInstId ? { ...ex, [field]: value } : ex)
              };
            }
            return day;
          })
        };
      }
      return w;
    }));

    // 2. If global modifications is active, propagate to all other weeks!
    if (globalModifications) {
      const currentWeekObj = weeks.find(w => w.weekIndex === activeWeekIndex);
      const currentDay = currentWeekObj?.giornate.find(d => d.id === dayId);
      const currentEx = currentDay?.esercizi.find(ex => ex.id === exInstId);

      if (currentDay && currentEx) {
        setWeeks(prevWeeks => prevWeeks.map(w => {
          if (w.weekIndex === activeWeekIndex) return w; // Already updated above
          
          return {
            ...w,
            giornate: w.giornate.map(d => {
              if (d.programDayId === currentDay.programDayId) {
                return {
                  ...d,
                  esercizi: d.esercizi.map(ex => {
                    if (ex.programRowId === currentEx.programRowId) {
                      return { ...ex, [field]: value };
                    }
                    return ex;
                  })
                };
              }
              return d;
            })
          };
        }));
      }
    }
  };

  // Delete exercise from day (triggers custom popup confirmation)
  const handleDeleteEx = (dayId: string, exInstId: string) => {
    const currentWeekObj = weeks.find(w => w.weekIndex === activeWeekIndex);
    const day = currentWeekObj?.giornate.find(d => d.id === dayId);
    const ex = day?.esercizi.find(e => e.id === exInstId);
    if (!day || !ex) return;

    setDeleteExConfig({
      dayId,
      exInstId,
      exNome: ex.nome
    });
  };

  const handleOpenBlocksManager = (dayId: string, exId: string) => {
    const currentWeekObj = weeks.find(w => w.weekIndex === activeWeekIndex);
    const dayObj = currentWeekObj?.giornate.find(d => d.id === dayId);
    const exObj = dayObj?.esercizi.find(ex => ex.id === exId);
    if (!exObj) return;

    setBlocksManagerConfig({ dayId, exId });
    if (exObj.blocks && exObj.blocks.length > 0) {
      setActiveBlocks(JSON.parse(JSON.stringify(exObj.blocks)));
      const inputs: Record<string, string> = {};
      exObj.blocks.forEach(b => {
        inputs[b.id] = b.volumeMultiplier !== undefined ? String(b.volumeMultiplier) : '1';
      });
      setBlockVolumeInputs(inputs);
    } else {
      setActiveBlocks([]);
      setBlockVolumeInputs({});
    }
  };

  const handleConvertToBlocks = () => {
    if (!blocksManagerConfig) return;
    const { dayId, exId } = blocksManagerConfig;
    const currentWeekObj = weeks.find(w => w.weekIndex === activeWeekIndex);
    const dayObj = currentWeekObj?.giornate.find(d => d.id === dayId);
    const exObj = dayObj?.esercizi.find(ex => ex.id === exId);
    if (!exObj) return;

    const initialBlock: WorkoutExerciseBlock = {
      id: 'b_' + Math.random().toString(36).substr(2, 5),
      nome: 'Blocco 1',
      serie: exObj.serie || 3,
      repMin: exObj.repMin || 8,
      repMax: exObj.repMax || 12,
      rir: exObj.rir !== undefined ? exObj.rir : 2,
      recupero: exObj.recupero || 90,
      tut: exObj.tut || '3-0-1-0',
      tecnicaIntensita: exObj.tecnicaIntensita || 'Nessuna',
      note: exObj.noteTecniche || '',
      volumeMultiplier: 1
    };
    setActiveBlocks([initialBlock]);
    setBlockVolumeInputs({ [initialBlock.id]: '1' });
  };

  const handleCreateEmptyBlock = () => {
    const initialBlock: WorkoutExerciseBlock = {
      id: 'b_' + Math.random().toString(36).substr(2, 5),
      nome: 'Blocco 1',
      serie: 3,
      repMin: 8,
      repMax: 12,
      rir: 2,
      recupero: 90,
      tut: '3-0-1-0',
      tecnicaIntensita: 'Nessuna',
      note: '',
      volumeMultiplier: 1
    };
    setActiveBlocks([initialBlock]);
    setBlockVolumeInputs({ [initialBlock.id]: '1' });
  };

  const handleAddBlock = () => {
    const newBlock: WorkoutExerciseBlock = {
      id: 'b_' + Math.random().toString(36).substr(2, 5),
      nome: `Blocco ${activeBlocks.length + 1}`,
      serie: 3,
      repMin: 8,
      repMax: 12,
      rir: 2,
      recupero: 90,
      tut: '3-0-1-0',
      tecnicaIntensita: 'Nessuna',
      note: '',
      volumeMultiplier: 1
    };
    setActiveBlocks([...activeBlocks, newBlock]);
    setBlockVolumeInputs(prev => ({ ...prev, [newBlock.id]: '1' }));
  };

  const handleUpdateBlockField = (blockId: string, field: keyof WorkoutExerciseBlock, value: any) => {
    setActiveBlocks(prev => prev.map(b => b.id === blockId ? { ...b, [field]: value } : b));
  };

  const handleDuplicateBlock = (block: WorkoutExerciseBlock) => {
    const dup: WorkoutExerciseBlock = {
      ...block,
      id: 'b_' + Math.random().toString(36).substr(2, 5),
      nome: `${block.nome} (Copia)`
    };
    const idx = activeBlocks.findIndex(b => b.id === block.id);
    if (idx !== -1) {
      const updated = [...activeBlocks];
      updated.splice(idx + 1, 0, dup);
      setActiveBlocks(updated);
    } else {
      setActiveBlocks([...activeBlocks, dup]);
    }
    const sourceVal = blockVolumeInputs[block.id] !== undefined ? blockVolumeInputs[block.id] : (block.volumeMultiplier !== undefined ? String(block.volumeMultiplier) : '1');
    setBlockVolumeInputs(prev => ({ ...prev, [dup.id]: sourceVal }));
  };

  const handleMoveBlock = (idx: number, direction: 'up' | 'down') => {
    if (direction === 'up' && idx === 0) return;
    if (direction === 'down' && idx === activeBlocks.length - 1) return;
    const updated = [...activeBlocks];
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    const temp = updated[idx];
    updated[idx] = updated[targetIdx];
    updated[targetIdx] = temp;
    setActiveBlocks(updated);
  };

  const handleDeleteBlock = (blockId: string) => {
    setActiveBlocks(prev => prev.filter(b => b.id !== blockId));
    setBlockVolumeInputs(prev => {
      const copy = { ...prev };
      delete copy[blockId];
      return copy;
    });
  };

  const getNormalizedActiveBlocks = (): WorkoutExerciseBlock[] => {
    return activeBlocks.map(b => {
      let valStr = blockVolumeInputs[b.id];
      let valNum = b.volumeMultiplier !== undefined ? b.volumeMultiplier : 1;
      if (valStr !== undefined) {
        valStr = valStr.trim().replace(',', '.');
        if (valStr === '') {
          valNum = 1;
        } else {
          const parsed = parseFloat(valStr);
          valNum = isNaN(parsed) ? 1 : parsed;
        }
      }
      return {
        ...b,
        volumeMultiplier: valNum
      };
    });
  };

  const handleCopyBlocksToNextWeek = () => {
    if (!blocksManagerConfig) return;
    const { dayId, exId } = blocksManagerConfig;
    const currentWeekObj = weeks.find(w => w.weekIndex === activeWeekIndex);
    const dayObj = currentWeekObj?.giornate.find(d => d.id === dayId);
    const exObj = dayObj?.esercizi.find(ex => ex.id === exId);
    if (!exObj) return;

    const nextWeekIdx = activeWeekIndex + 1;
    const nextWeekObj = weeks.find(w => w.weekIndex === nextWeekIdx);
    if (!nextWeekObj) {
      alert(`La settimana ${nextWeekIdx} non esiste.`);
      return;
    }

    const normalized = getNormalizedActiveBlocks();

    setWeeks(prevWeeks => prevWeeks.map(w => {
      if (w.weekIndex === nextWeekIdx) {
        return {
          ...w,
          giornate: w.giornate.map(d => ({
            ...d,
            esercizi: d.esercizi.map(e => {
              if (e.programRowId === exObj.programRowId) {
                const totalSets = normalized.reduce((sum, b) => sum + Number(b.serie || 0), 0);
                return {
                  ...e,
                  blocks: JSON.parse(JSON.stringify(normalized)),
                  serie: totalSets
                };
              }
              return e;
            })
          }))
        };
      }
      return w;
    }));

    setBlocksSuccessMsg(`Blocchi copiati nella Settimana ${nextWeekIdx}!`);
    setTimeout(() => setBlocksSuccessMsg(null), 3000);
  };

  const handleApplyBlocksToAllWeeks = () => {
    if (!blocksManagerConfig) return;
    const { dayId, exId } = blocksManagerConfig;
    const currentWeekObj = weeks.find(w => w.weekIndex === activeWeekIndex);
    const dayObj = currentWeekObj?.giornate.find(d => d.id === dayId);
    const exObj = dayObj?.esercizi.find(ex => ex.id === exId);
    if (!exObj) return;

    const normalized = getNormalizedActiveBlocks();

    setWeeks(prevWeeks => prevWeeks.map(w => {
      return {
        ...w,
        giornate: w.giornate.map(d => ({
          ...d,
          esercizi: d.esercizi.map(e => {
            if (e.programRowId === exObj.programRowId) {
              const totalSets = normalized.reduce((sum, b) => sum + Number(b.serie || 0), 0);
              return {
                ...e,
                blocks: JSON.parse(JSON.stringify(normalized)),
                serie: totalSets
              };
            }
            return e;
          })
        }))
      };
    }));

    setBlocksSuccessMsg("Blocchi applicati a tutte le settimane del programma!");
    setTimeout(() => setBlocksSuccessMsg(null), 3000);
  };

  const handleSaveBlocks = () => {
    if (!blocksManagerConfig) return;
    const { dayId, exId } = blocksManagerConfig;

    const normalized = getNormalizedActiveBlocks();

    setWeeks(prevWeeks => prevWeeks.map(w => {
      if (w.weekIndex === activeWeekIndex) {
        return {
          ...w,
          giornate: w.giornate.map(d => {
            if (d.id === dayId) {
              return {
                ...d,
                esercizi: d.esercizi.map(e => {
                  if (e.id === exId) {
                    const totalSets = normalized.reduce((sum, b) => sum + Number(b.serie || 0), 0);
                    return {
                      ...e,
                      blocks: normalized.length > 0 ? normalized : undefined,
                      serie: normalized.length > 0 ? totalSets : e.serie
                    };
                  }
                  return e;
                })
              };
            }
            return d;
          })
        };
      }
      return w;
    }));

    setBlocksManagerConfig(null);
  };

  const performDeleteExThisWeekOnly = () => {
    if (!deleteExConfig) return;
    const { dayId, exInstId } = deleteExConfig;
    setWeeks(prevWeeks => prevWeeks.map(w => {
      if (w.weekIndex === activeWeekIndex) {
        return {
          ...w,
          giornate: w.giornate.map(day => {
            if (day.id === dayId) {
              return {
                ...day,
                esercizi: day.esercizi.filter(ex => ex.id !== exInstId)
              };
            }
            return day;
          })
        };
      }
      return w;
    }));
    setDeleteExConfig(null);
  };

  const performDeleteExAllWeeks = () => {
    if (!deleteExConfig) return;
    const { dayId, exInstId } = deleteExConfig;
    
    // Find the programRowId first
    const currentWeekObj = weeks.find(w => w.weekIndex === activeWeekIndex);
    const dayObj = currentWeekObj?.giornate.find(d => d.id === dayId);
    const exObj = dayObj?.esercizi.find(ex => ex.id === exInstId);
    if (!dayObj || !exObj) {
      setDeleteExConfig(null);
      return;
    }
    const rowId = exObj.programRowId;
    const pDayId = dayObj.programDayId;

    setWeeks(prevWeeks => prevWeeks.map(w => {
      return {
        ...w,
        giornate: w.giornate.map(d => {
          if (d.id === dayId || d.programDayId === pDayId) {
            return {
              ...d,
              esercizi: d.esercizi.filter(ex => ex.programRowId !== rowId)
            };
          }
          return d;
        })
      };
    }));
    setDeleteExConfig(null);
  };

  // Duplicate exercise inside same day
  const handleDuplicateEx = (dayId: string, ex: WorkoutExercise) => {
    const newRowId = 'pr_' + Math.random().toString(36).substr(2, 5);
    const duplicated: WorkoutExercise = {
      ...ex,
      id: 'we_inst_dup_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
      programRowId: newRowId
    };

    // 1. Update in active week
    setWeeks(prevWeeks => prevWeeks.map(w => {
      if (w.weekIndex === activeWeekIndex) {
        return {
          ...w,
          giornate: w.giornate.map(day => {
            if (day.id === dayId) {
              const idx = day.esercizi.findIndex(item => item.id === ex.id);
              const copyList = [...day.esercizi];
              copyList.splice(idx + 1, 0, duplicated);
              return {
                ...day,
                esercizi: copyList
              };
            }
            return day;
          })
        };
      }
      return w;
    }));

    // 2. Propagate to all weeks if globalModifications is active
    if (globalModifications) {
      const activeWeekObj = weeks.find(w => w.weekIndex === activeWeekIndex);
      const activeDay = activeWeekObj?.giornate.find(d => d.id === dayId);
      if (activeDay) {
        setWeeks(prevWeeks => prevWeeks.map(w => {
          if (w.weekIndex === activeWeekIndex) return w;
          return {
            ...w,
            giornate: w.giornate.map(day => {
              if (day.programDayId === activeDay.programDayId) {
                // Find where the reference exercise (ex.programRowId) is in this week
                const idx = day.esercizi.findIndex(item => item.programRowId === ex.programRowId);
                if (idx !== -1) {
                  const specificDup: WorkoutExercise = {
                    ...day.esercizi[idx],
                    id: 'we_inst_dup_' + Date.now() + '_' + w.weekIndex + '_' + Math.random().toString(36).substr(2, 5),
                    programRowId: newRowId
                  };
                  const copyList = [...day.esercizi];
                  copyList.splice(idx + 1, 0, specificDup);
                  return {
                    ...day,
                    esercizi: copyList
                  };
                }
              }
              return day;
            })
          };
        }));
      }
    }
  };

  // Move exercise up or down in the same day (moves the logical row across all weeks)
  const handleMoveEx = (dayId: string, exInstId: string, direction: 'up' | 'down') => {
    const currentWeekObj = weeks.find(w => w.weekIndex === activeWeekIndex);
    const currentDay = currentWeekObj?.giornate.find(d => d.id === dayId);
    const currentEx = currentDay?.esercizi.find(ex => ex.id === exInstId);
    
    if (!currentDay || !currentEx) return;
    const rowId = currentEx.programRowId;

    setWeeks(prevWeeks => prevWeeks.map(w => {
      const targetDay = w.giornate.find(d => d.id === dayId || d.programDayId === currentDay.programDayId);
      if (!targetDay) return w;

      const idx = targetDay.esercizi.findIndex(ex => ex.programRowId === rowId);
      if (idx === -1) return w;
      if (direction === 'up' && idx === 0) return w;
      if (direction === 'down' && idx === targetDay.esercizi.length - 1) return w;

      const updated = [...targetDay.esercizi];
      const swapTarget = direction === 'up' ? idx - 1 : idx + 1;
      const temp = updated[idx];
      updated[idx] = updated[swapTarget];
      updated[swapTarget] = temp;

      return {
        ...w,
        giornate: w.giornate.map(d => d.id === targetDay.id ? { ...d, esercizi: updated } : d)
      };
    }));
  };

  // Superset / Grouping action: Group with subsequent exercise
  const handleGroupWithNext = (dayId: string, exIdx: number) => {
    const day = giornate.find(d => d.id === dayId);
    if (!day || day.esercizi.length <= exIdx + 1) return;

    const currentEx = day.esercizi[exIdx];
    const nextEx = day.esercizi[exIdx + 1];

    // Create a shared groupId
    const gid = currentEx.groupId || 'g_' + Math.random().toString(36).substr(2, 5);
    const type = currentEx.groupType || 'Superset';

    setGiornate(prev => prev.map(d => {
      if (d.id === dayId) {
        return {
          ...d,
          esercizi: d.esercizi.map((ex, idx) => {
            if (idx === exIdx || idx === exIdx + 1) {
              return {
                ...ex,
                groupId: gid,
                groupType: type,
                groupRest: ex.groupRest || 90
              };
            }
            return ex;
          })
        };
      }
      return d;
    }));
  };

  // Confirm and create exercise group (Superset or Triset or Compound Set)
  const handleConfirmExerciseGroup = (dayId: string) => {
    if (!groupSelectionType) return;
    const requiredCount = getRequiredGroupMemberCount(groupSelectionType);
    if (selectedExerciseIds.length !== requiredCount) return;

    const day = giornate.find(d => d.id === dayId);
    if (!day) return;

    // Filter exercises that are selected, but preserve their relative order in the day
    const selectedIndexes = day.esercizi
      .map((ex, idx) => ({ ex, idx }))
      .filter(item => selectedExerciseIds.includes(item.ex.id))
      .sort((a, b) => a.idx - b.idx);

    if (selectedIndexes.length !== requiredCount) return;

    // Specific validation for Compound Set
    if (groupSelectionType === 'compound_set') {
      const firstEx = selectedIndexes[0].ex;
      const secondEx = selectedIndexes[1].ex;

      const isFirstGrouped = !!(firstEx.groupId && normalizeExerciseGroupType(firstEx.groupType));
      const isSecondGrouped = !!(secondEx.groupId && normalizeExerciseGroupType(secondEx.groupType));

      if (firstEx.distrettoMuscolare !== secondEx.distrettoMuscolare || isFirstGrouped || isSecondGrouped) {
        if (onShowToast) {
          onShowToast('Seleziona due esercizi dello stesso distretto muscolare.', 'error');
        }
        return;
      }
    }

    // Specific validation for Jumpset
    if (groupSelectionType === 'jumpset') {
      const firstEx = selectedIndexes[0].ex;
      const secondEx = selectedIndexes[1].ex;

      const isFirstGrouped = !!(firstEx.groupId && normalizeExerciseGroupType(firstEx.groupType));
      const isSecondGrouped = !!(secondEx.groupId && normalizeExerciseGroupType(secondEx.groupType));

      if (firstEx.distrettoMuscolare === secondEx.distrettoMuscolare || isFirstGrouped || isSecondGrouped) {
        if (onShowToast) {
          onShowToast('Seleziona due esercizi appartenenti a distretti muscolari differenti.', 'error');
        }
        return;
      }
    }

    const newGroupId = createExerciseGroupId();

    setGiornate(prev => prev.map(d => {
      if (d.id === dayId) {
        return {
          ...d,
          esercizi: d.esercizi.map((ex) => {
            const indexInSelected = selectedIndexes.findIndex(item => item.ex.id === ex.id);
            if (indexInSelected !== -1) {
              const restBetween = groupSelectionType === 'jumpset'
                ? DEFAULT_JUMPSET_REST_BETWEEN_EXERCISES_SEC
                : DEFAULT_GROUP_REST_BETWEEN_EXERCISES_SEC;

              return {
                ...ex,
                groupId: newGroupId,
                groupType: groupSelectionType,
                groupOrder: indexInSelected + 1,
                groupRestBetweenExercisesSec: restBetween,
                groupRestAfterRoundSec: DEFAULT_GROUP_REST_AFTER_ROUND_SEC,
                groupRounds: DEFAULT_GROUP_ROUNDS
              };
            }
            return ex;
          })
        };
      }
      return d;
    }));

    const label = EXERCISE_GROUP_LABELS[groupSelectionType] || 'Gruppo';
    resetGroupSelection();
    if (onShowToast) {
      onShowToast(`${label} creato con successo.`, 'success');
    }
  };

  const handleDissolveSuperset = (dayId: string, groupId: string) => {
    setGiornate(prev => prev.map(d => {
      if (d.id === dayId) {
        return {
          ...d,
          esercizi: d.esercizi.map(ex => {
            if (ex.groupId === groupId) {
              return removeExerciseFromGroup(ex);
            }
            return ex;
          })
        };
      }
      return d;
    }));
    if (onShowToast) {
      onShowToast('Superset rimosso.', 'success');
    }
  };

  const handleDissolveTriset = (dayId: string, groupId: string) => {
    setGiornate(prev => prev.map(d => {
      if (d.id === dayId) {
        return {
          ...d,
          esercizi: d.esercizi.map(ex => {
            if (ex.groupId === groupId && normalizeExerciseGroupType(ex.groupType) === 'triset') {
              return removeExerciseFromGroup(ex);
            }
            return ex;
          })
        };
      }
      return d;
    }));
    if (onShowToast) {
      onShowToast('Triset rimosso.', 'success');
    }
  };

  const handleDissolveCompoundSet = (dayId: string, groupId: string) => {
    setGiornate(prev => prev.map(d => {
      if (d.id === dayId) {
        return {
          ...d,
          esercizi: d.esercizi.map(ex => {
            if (ex.groupId === groupId && normalizeExerciseGroupType(ex.groupType) === 'compound_set') {
              return removeExerciseFromGroup(ex);
            }
            return ex;
          })
        };
      }
      return d;
    }));
    if (onShowToast) {
      onShowToast('Compound Set rimosso.', 'success');
    }
  };

  const handleDissolveGiantSet = (dayId: string, groupId: string) => {
    setGiornate(prev => prev.map(d => {
      if (d.id === dayId) {
        return {
          ...d,
          esercizi: d.esercizi.map(ex => {
            if (ex.groupId === groupId && normalizeExerciseGroupType(ex.groupType) === 'giant_set') {
              return removeExerciseFromGroup(ex);
            }
            return ex;
          })
        };
      }
      return d;
    }));
    if (onShowToast) {
      onShowToast('Giant Set rimosso.', 'success');
    }
  };

  const handleDissolveJumpset = (dayId: string, groupId: string) => {
    setGiornate(prev => prev.map(d => {
      if (d.id === dayId) {
        return {
          ...d,
          esercizi: d.esercizi.map(ex => {
            if (ex.groupId === groupId && normalizeExerciseGroupType(ex.groupType) === 'jumpset') {
              return removeExerciseFromGroup(ex);
            }
            return ex;
          })
        };
      }
      return d;
    }));
    if (onShowToast) {
      onShowToast('Jumpset rimosso.', 'success');
    }
  };

  const handleDissolveCircuit = (dayId: string, groupId: string) => {
    setGiornate(prev => prev.map(d => {
      if (d.id === dayId) {
        return {
          ...d,
          esercizi: d.esercizi.map(ex => {
            if (ex.groupId === groupId && normalizeExerciseGroupType(ex.groupType) === 'circuit') {
              return removeExerciseFromGroup(ex);
            }
            return ex;
          })
        };
      }
      return d;
    }));
    if (onShowToast) {
      onShowToast('Circuito rimosso.', 'success');
    }
  };

  const resetSupersetSettingsState = () => {
    setSupersetSettingsModalOpen(false);
    setSupersetSettingsGroupId(null);
    setSupersetSettingsDayId(null);
    setSupersetSettingsHasMismatch(false);
    setTempRestBetweenSec(0);
    setTempRestAfterSec(90);
    setTempRounds(1);
    setValidationErrors({});
  };

  const handleOpenSupersetSettings = (dayId: string, groupId: string) => {
    const day = giornate.find(d => d.id === dayId);
    if (!day) return;

    const members = day.esercizi.filter(ex => 
      ex.groupId === groupId && 
      normalizeExerciseGroupType(ex.groupType) === "superset"
    );
    if (members.length < 2) {
      if (onShowToast) {
        onShowToast("Un superset deve contenere almeno 2 esercizi per essere modificato.", "error");
      }
      return;
    }

    // Find leader (groupOrder === 1) or fallback to first member
    const sortedMembers = [...members].sort((a, b) => (a.groupOrder ?? Infinity) - (b.groupOrder ?? Infinity));
    const leader = sortedMembers.find(m => m.groupOrder === 1) || sortedMembers[0];

    const normalizedLeader = normalizeExerciseGroupData(leader);

    // Check if they have different settings
    let hasMismatch = false;
    const firstNormalized = normalizeExerciseGroupData(sortedMembers[0]);
    for (let i = 1; i < sortedMembers.length; i++) {
      const norm = normalizeExerciseGroupData(sortedMembers[i]);
      if (
        norm.groupRestBetweenExercisesSec !== firstNormalized.groupRestBetweenExercisesSec ||
        norm.groupRestAfterRoundSec !== firstNormalized.groupRestAfterRoundSec ||
        norm.groupRounds !== firstNormalized.groupRounds
      ) {
        hasMismatch = true;
        break;
      }
    }

    // Set states
    setSupersetSettingsGroupType('superset');
    setSupersetSettingsGroupId(groupId);
    setSupersetSettingsDayId(dayId);
    setTempRestBetweenSec(normalizedLeader.groupRestBetweenExercisesSec ?? 0);
    setTempRestAfterSec(normalizedLeader.groupRestAfterRoundSec ?? 90);
    setTempRounds(normalizedLeader.groupRounds ?? 1);
    setSupersetSettingsHasMismatch(hasMismatch);
    setValidationErrors({});
    setSupersetSettingsModalOpen(true);
  };

  const handleOpenTrisetSettings = (dayId: string, groupId: string) => {
    const day = giornate.find(d => d.id === dayId);
    if (!day) return;

    const members = day.esercizi.filter(ex => 
      ex.groupId === groupId && 
      normalizeExerciseGroupType(ex.groupType) === "triset"
    );
    if (members.length !== 3) {
      // Se l'apertura fallisce, non aprire e non mostrare messaggi (evita toast o alert).
      return;
    }

    // Find leader (groupOrder === 1) or fallback to first member
    const sortedMembers = [...members].sort((a, b) => (a.groupOrder ?? Infinity) - (b.groupOrder ?? Infinity));
    const leader = sortedMembers.find(m => m.groupOrder === 1) || sortedMembers[0];

    const normalizedLeader = normalizeExerciseGroupData(leader);

    // Check if they have different settings
    let hasMismatch = false;
    const firstNormalized = normalizeExerciseGroupData(sortedMembers[0]);
    for (let i = 1; i < sortedMembers.length; i++) {
      const norm = normalizeExerciseGroupData(sortedMembers[i]);
      if (
        norm.groupRestBetweenExercisesSec !== firstNormalized.groupRestBetweenExercisesSec ||
        norm.groupRestAfterRoundSec !== firstNormalized.groupRestAfterRoundSec ||
        norm.groupRounds !== firstNormalized.groupRounds
      ) {
        hasMismatch = true;
        break;
      }
    }

    // Set states
    setSupersetSettingsGroupType('triset');
    setSupersetSettingsGroupId(groupId);
    setSupersetSettingsDayId(dayId);
    setTempRestBetweenSec(normalizedLeader.groupRestBetweenExercisesSec ?? 0);
    setTempRestAfterSec(normalizedLeader.groupRestAfterRoundSec ?? 90);
    setTempRounds(normalizedLeader.groupRounds ?? 1);
    setSupersetSettingsHasMismatch(hasMismatch);
    setValidationErrors({});
    setSupersetSettingsModalOpen(true);
  };

  const handleOpenCompoundSetSettings = (dayId: string, groupId: string) => {
    const day = giornate.find(d => d.id === dayId);
    if (!day) return;

    const members = day.esercizi.filter(ex => 
      ex.groupId === groupId && 
      normalizeExerciseGroupType(ex.groupType) === "compound_set"
    );
    if (members.length !== 2) {
      return;
    }

    if (members[0].distrettoMuscolare !== members[1].distrettoMuscolare) {
      return;
    }

    // Find leader (groupOrder === 1) or fallback to first member
    const sortedMembers = [...members].sort((a, b) => (a.groupOrder ?? Infinity) - (b.groupOrder ?? Infinity));
    const leader = sortedMembers.find(m => m.groupOrder === 1) || sortedMembers[0];

    const normalizedLeader = normalizeExerciseGroupData(leader);

    // Check if they have different settings
    let hasMismatch = false;
    const firstNormalized = normalizeExerciseGroupData(sortedMembers[0]);
    for (let i = 1; i < sortedMembers.length; i++) {
      const norm = normalizeExerciseGroupData(sortedMembers[i]);
      if (
        norm.groupRestBetweenExercisesSec !== firstNormalized.groupRestBetweenExercisesSec ||
        norm.groupRestAfterRoundSec !== firstNormalized.groupRestAfterRoundSec ||
        norm.groupRounds !== firstNormalized.groupRounds
      ) {
        hasMismatch = true;
        break;
      }
    }

    // Set states
    setSupersetSettingsGroupType('compound_set');
    setSupersetSettingsGroupId(groupId);
    setSupersetSettingsDayId(dayId);
    setTempRestBetweenSec(normalizedLeader.groupRestBetweenExercisesSec ?? 0);
    setTempRestAfterSec(normalizedLeader.groupRestAfterRoundSec ?? 90);
    setTempRounds(normalizedLeader.groupRounds ?? 1);
    setSupersetSettingsHasMismatch(hasMismatch);
    setValidationErrors({});
    setSupersetSettingsModalOpen(true);
  };

  const handleOpenGiantSetSettings = (dayId: string, groupId: string) => {
    const day = giornate.find(d => d.id === dayId);
    if (!day) return;

    const members = day.esercizi.filter(ex => 
      ex.groupId === groupId && 
      normalizeExerciseGroupType(ex.groupType) === "giant_set"
    );
    if (members.length < 4) {
      return;
    }

    // Find leader (groupOrder === 1) or fallback to first member
    const sortedMembers = [...members].sort((a, b) => (a.groupOrder ?? Infinity) - (b.groupOrder ?? Infinity));
    const leader = sortedMembers.find(m => m.groupOrder === 1) || sortedMembers[0];

    const normalizedLeader = normalizeExerciseGroupData(leader);

    // Check if they have different settings
    let hasMismatch = false;
    const firstNormalized = normalizeExerciseGroupData(sortedMembers[0]);
    for (let i = 1; i < sortedMembers.length; i++) {
      const norm = normalizeExerciseGroupData(sortedMembers[i]);
      if (
        norm.groupRestBetweenExercisesSec !== firstNormalized.groupRestBetweenExercisesSec ||
        norm.groupRestAfterRoundSec !== firstNormalized.groupRestAfterRoundSec ||
        norm.groupRounds !== firstNormalized.groupRounds
      ) {
        hasMismatch = true;
        break;
      }
    }

    // Set states
    setSupersetSettingsGroupType('giant_set');
    setSupersetSettingsGroupId(groupId);
    setSupersetSettingsDayId(dayId);
    setTempRestBetweenSec(normalizedLeader.groupRestBetweenExercisesSec ?? 0);
    setTempRestAfterSec(normalizedLeader.groupRestAfterRoundSec ?? 90);
    setTempRounds(normalizedLeader.groupRounds ?? 1);
    setSupersetSettingsHasMismatch(hasMismatch);
    setValidationErrors({});
    setSupersetSettingsModalOpen(true);
  };

  const handleOpenJumpsetSettings = (dayId: string, groupId: string) => {
    const day = giornate.find(d => d.id === dayId);
    if (!day) return;

    const members = day.esercizi.filter(ex => 
      ex.groupId === groupId && 
      normalizeExerciseGroupType(ex.groupType) === "jumpset"
    );
    if (members.length !== 2) {
      return;
    }

    if (members[0].distrettoMuscolare === members[1].distrettoMuscolare) {
      return;
    }

    // Find leader (groupOrder === 1) or fallback to first member
    const sortedMembers = [...members].sort((a, b) => (a.groupOrder ?? Infinity) - (b.groupOrder ?? Infinity));
    const leader = sortedMembers.find(m => m.groupOrder === 1) || sortedMembers[0];

    const normalizedLeader = normalizeExerciseGroupData(leader);

    // Check if they have different settings
    let hasMismatch = false;
    const firstNormalized = normalizeExerciseGroupData(sortedMembers[0]);
    for (let i = 1; i < sortedMembers.length; i++) {
      const norm = normalizeExerciseGroupData(sortedMembers[i]);
      if (
        norm.groupRestBetweenExercisesSec !== firstNormalized.groupRestBetweenExercisesSec ||
        norm.groupRestAfterRoundSec !== firstNormalized.groupRestAfterRoundSec ||
        norm.groupRounds !== firstNormalized.groupRounds
      ) {
        hasMismatch = true;
        break;
      }
    }

    // Set states
    setSupersetSettingsGroupType('jumpset');
    setSupersetSettingsGroupId(groupId);
    setSupersetSettingsDayId(dayId);
    setTempRestBetweenSec(normalizedLeader.groupRestBetweenExercisesSec ?? DEFAULT_JUMPSET_REST_BETWEEN_EXERCISES_SEC);
    setTempRestAfterSec(normalizedLeader.groupRestAfterRoundSec ?? 90);
    setTempRounds(normalizedLeader.groupRounds ?? 1);
    setSupersetSettingsHasMismatch(hasMismatch);
    setValidationErrors({});
    setSupersetSettingsModalOpen(true);
  };

  const handleOpenCircuitSettings = (dayId: string, groupId: string) => {
    const day = giornate.find(d => d.id === dayId);
    if (!day) return;

    const members = day.esercizi.filter(ex => 
      ex.groupId === groupId && 
      normalizeExerciseGroupType(ex.groupType) === "circuit"
    );
    if (members.length < 4) {
      return;
    }

    // Find leader (groupOrder === 1) or fallback to first member
    const sortedMembers = [...members].sort((a, b) => (a.groupOrder ?? Infinity) - (b.groupOrder ?? Infinity));
    const leader = sortedMembers.find(m => m.groupOrder === 1) || sortedMembers[0];

    const normalizedLeader = normalizeExerciseGroupData(leader);

    // Check if they have different settings
    let hasMismatch = false;
    const firstNormalized = normalizeExerciseGroupData(sortedMembers[0]);
    for (let i = 1; i < sortedMembers.length; i++) {
      const norm = normalizeExerciseGroupData(sortedMembers[i]);
      if (
        norm.groupRestBetweenExercisesSec !== firstNormalized.groupRestBetweenExercisesSec ||
        norm.groupRestAfterRoundSec !== firstNormalized.groupRestAfterRoundSec ||
        norm.groupRounds !== firstNormalized.groupRounds
      ) {
        hasMismatch = true;
        break;
      }
    }

    // Set states
    setSupersetSettingsGroupType('circuit');
    setSupersetSettingsGroupId(groupId);
    setSupersetSettingsDayId(dayId);
    setTempRestBetweenSec(normalizedLeader.groupRestBetweenExercisesSec ?? 0);
    setTempRestAfterSec(normalizedLeader.groupRestAfterRoundSec ?? 90);
    setTempRounds(normalizedLeader.groupRounds ?? 1);
    setSupersetSettingsHasMismatch(hasMismatch);
    setValidationErrors({});
    setSupersetSettingsModalOpen(true);
  };

  const handleSaveSupersetSettings = () => {
    if (!supersetSettingsDayId || !supersetSettingsGroupId) return;

    const isTriset = supersetSettingsGroupType === 'triset';
    const isCompoundSet = supersetSettingsGroupType === 'compound_set';
    const isGiantSet = supersetSettingsGroupType === 'giant_set';
    const isJumpset = supersetSettingsGroupType === 'jumpset';
    const isCircuit = supersetSettingsGroupType === 'circuit';
    
    const groupName = isCircuit ? 'Circuito' : isJumpset ? 'Jumpset' : isGiantSet ? 'Giant Set' : isCompoundSet ? 'Compound Set' : isTriset ? 'Triset' : 'Superset';
    const requiredType = supersetSettingsGroupType;

    // Retrieve the day and members from the current state to verify validity
    const currentDay = giornate.find(d => d.id === supersetSettingsDayId);
    if (!currentDay) {
      if (onShowToast) {
        onShowToast(`Il ${groupName} non è più disponibile o non è valido.`, "error");
      }
      resetSupersetSettingsState();
      return;
    }

    const currentMembers = currentDay.esercizi.filter(ex => 
      ex.groupId === supersetSettingsGroupId && 
      normalizeExerciseGroupType(ex.groupType) === requiredType
    );

    const isInvalid = isTriset 
      ? currentMembers.length !== 3 
      : isCompoundSet 
        ? (currentMembers.length !== 2 || currentMembers[0].distrettoMuscolare !== currentMembers[1].distrettoMuscolare)
        : isGiantSet
          ? currentMembers.length < 4
          : isJumpset
            ? (currentMembers.length !== 2 || currentMembers[0].distrettoMuscolare === currentMembers[1].distrettoMuscolare)
            : isCircuit
              ? currentMembers.length < 4
              : currentMembers.length < 2;

    if (isInvalid) {
      if (onShowToast) {
        onShowToast(`Il ${groupName} non è più disponibile o non è valido.`, "error");
      }
      resetSupersetSettingsState();
      return;
    }

    // Form inputs validation
    const errors: { restBetween?: string; restAfter?: string; rounds?: string } = {};

    const valBetween = tempRestBetweenSec === "" ? NaN : Number(tempRestBetweenSec);
    const valAfter = tempRestAfterSec === "" ? NaN : Number(tempRestAfterSec);
    const valRounds = tempRounds === "" ? NaN : Number(tempRounds);

    if (isJumpset) {
      if (Number.isNaN(valBetween) || !Number.isInteger(valBetween) || valBetween < 1 || valBetween > 600) {
        errors.restBetween = "Il Jumpset richiede almeno 1 secondo di recupero tra gli esercizi.";
      }
    } else {
      if (Number.isNaN(valBetween) || !Number.isInteger(valBetween) || valBetween < 0 || valBetween > 600) {
        errors.restBetween = "Deve essere un intero tra 0 e 600 secondi.";
      }
    }

    if (Number.isNaN(valAfter) || !Number.isInteger(valAfter) || valAfter < 0 || valAfter > 900) {
      errors.restAfter = "Deve essere un intero tra 0 e 900 secondi.";
    }

    if (Number.isNaN(valRounds) || !Number.isInteger(valRounds) || valRounds < 1 || valRounds > 20) {
      errors.rounds = "Deve essere un intero tra 1 e 20.";
    }

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    // Update only the members with the same groupId and groupType valid
    setGiornate(prev => prev.map(d => {
      if (d.id === supersetSettingsDayId) {
        return {
          ...d,
          esercizi: d.esercizi.map(ex => {
            if (ex.groupId === supersetSettingsGroupId && normalizeExerciseGroupType(ex.groupType) === requiredType) {
              return {
                ...ex,
                groupRestBetweenExercisesSec: valBetween,
                groupRestAfterRoundSec: valAfter,
                groupRounds: valRounds
              };
            }
            return ex;
          })
        };
      }
      return d;
    }));

    // Reset state & close
    resetSupersetSettingsState();
    if (onShowToast) {
      onShowToast(`Impostazioni ${groupName} aggiornate.`, "success");
    }
  };

  // Confirm copy day structure to other week/day slot
  const handleConfirmCopyDay = (sourceDayId: string) => {
    const sourceWeekObj = weeks.find(w => w.weekIndex === activeWeekIndex);
    const sourceDayObj = sourceWeekObj?.giornate.find(d => d.id === sourceDayId);
    if (!sourceDayObj || sourceDayObj.esercizi.length === 0) {
      if (onShowToast) {
        onShowToast('Nessun esercizio da copiare in questa giornata.', 'warning');
      }
      return;
    }

    const destWeekObj = weeks.find(w => w.weekIndex === copyTargetWeek);
    const targetDayObj = destWeekObj?.giornate[copyTargetDayIdx];

    const isSameLogicalDay = !!(
      sourceDayObj.programDayId && 
      targetDayObj?.programDayId && 
      sourceDayObj.programDayId === targetDayObj.programDayId
    );

    // Clone exercises and regenerate instance IDs to keep them completely unique and isolated
    const clonedExercises = sourceDayObj.esercizi.map(ex => {
      const newId = 'we_inst_copied_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
      const newRowId = isSameLogicalDay ? ex.programRowId : ('pr_' + Math.random().toString(36).substr(2, 5));
      return {
        ...ex,
        id: newId,
        programRowId: newRowId
      };
    });

    setWeeks(prevWeeks => prevWeeks.map(w => {
      if (w.weekIndex === copyTargetWeek) {
        return {
          ...w,
          giornate: w.giornate.map((d, idx) => {
            if (idx === copyTargetDayIdx) {
              return {
                ...d,
                esercizi: isSameLogicalDay ? clonedExercises : [...d.esercizi, ...clonedExercises]
              };
            }
            return d;
          })
        };
      }
      return w;
    }));

    setCopyingDayId(null);
    if (onShowToast) {
      onShowToast(`Giornata copiata con successo nella Settimana ${copyTargetWeek} - Giorno ${copyTargetDayIdx + 1}!`, 'success');
    }
  };

  // Copy whole day exercises to another day
  const handleCopyDayExercises = (sourceDayId: string) => {
    const sourceDay = giornate.find(d => d.id === sourceDayId);
    if (!sourceDay || sourceDay.esercizi.length === 0) {
      if (onShowToast) {
        onShowToast('Questa giornata non ha esercizi da copiare.', 'warning');
      } else {
        alert('Questa giornata non ha esercizi da copiare.');
      }
      return;
    }

    const availableDaysToPaste = giornate.filter(d => d.id !== sourceDayId);
    if (availableDaysToPaste.length === 0) return;

    const dayNames = availableDaysToPaste.map((d, index) => `${index + 1}. ${d.nome}`).join('\n');
    const input = window.prompt(
      `Copia gli esercizi di "${sourceDay.nome}" in quale giornata?\n\nInserisci il NUMERO corrispondente:\n${dayNames}`
    );

    if (!input) return;
    const num = parseInt(input.trim(), 10);
    if (isNaN(num) || num < 1 || num > availableDaysToPaste.length) {
      if (onShowToast) {
        onShowToast('Selezione non valida.', 'error');
      } else {
        alert('Selezione non valida.');
      }
      return;
    }

    const targetDay = availableDaysToPaste[num - 1];
    
    const performCopy = () => {
      const clonedExercises = sourceDay.esercizi.map(ex => ({
        ...ex,
        id: 'we_inst_copied_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
        programRowId: 'pr_' + Math.random().toString(36).substr(2, 5)
      }));

      setGiornate(prev => prev.map(day => {
        if (day.id === targetDay.id) {
          return {
            ...day,
            esercizi: [...day.esercizi, ...clonedExercises]
          };
        }
        return day;
      }));
      
      if (onShowToast) {
        onShowToast('Esercizi copiati con successo!', 'success');
      }
    };

    if (onShowConfirm) {
      onShowConfirm({
        title: 'Copiare gli esercizi?',
        message: `Vuoi aggiungere gli esercizi di "${sourceDay.nome}" in fondo alla giornata "${targetDay.nome}"?`,
        confirmText: 'Sì, copia',
        onConfirm: performCopy
      });
    } else {
      const confirmOverwrite = window.confirm(`Vuoi aggiungere gli esercizi di "${sourceDay.nome}" in fondo alla giornata "${targetDay.nome}"?`);
      if (confirmOverwrite) {
        performCopy();
      }
    }
  };

  // Clear all exercises of a day
  const handleClearDayExercises = (dayId: string) => {
    const day = giornate.find(d => d.id === dayId);
    if (!day || day.esercizi.length === 0) return;

    const performClear = () => {
      setGiornate(prev => prev.map(d => d.id === dayId ? { ...d, esercizi: [] } : d));
      if (onShowToast) {
        onShowToast('Giornata svuotata con successo.', 'info');
      }
    };

    if (onShowConfirm) {
      onShowConfirm({
        title: 'Svuotare giornata?',
        message: `Sei sicuro di voler svuotare tutti gli esercizi della giornata "${day.nome}"?`,
        confirmText: 'Sì, svuota',
        isDestructive: true,
        onConfirm: performClear
      });
    } else {
      const confirmed = window.confirm(`Sei sicuro di voler svuotare tutti gli esercizi della giornata "${day.nome}"?`);
      if (confirmed) {
        performClear();
      }
    }
  };

  // Copy entire active week's plan parameters to another week
  const handleCopyWeekToOther = (targetWeekIdx: number) => {
    if (targetWeekIdx === activeWeekIndex) return;

    const performWeekCopy = () => {
      const activeWeekGiornateCopy = JSON.parse(JSON.stringify(giornate));
      // Regenerate unique IDs for exercises in pasted week to prevent state collision
      const sanitizedGiornate = activeWeekGiornateCopy.map((day: WorkoutDay) => ({
        ...day,
        id: 'day_' + Math.random().toString(36).substr(2, 5),
        esercizi: day.esercizi.map((ex: WorkoutExercise) => ({
          ...ex,
          id: 'we_inst_weekcp_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5)
        }))
      }));

      setWeeks(prev => prev.map(w => {
        if (w.weekIndex === targetWeekIdx) {
          return {
            ...w,
            giornate: sanitizedGiornate
          };
        }
        return w;
      }));
      
      if (onShowToast) {
        onShowToast(`Copiato con successo nella Settimana ${targetWeekIdx}!`, 'success');
      } else {
        alert(`Copiato con successo nella Settimana ${targetWeekIdx}!`);
      }
    };

    if (onShowConfirm) {
      onShowConfirm({
        title: 'Copiare struttura settimana?',
        message: `Vuoi copiare tutti gli esercizi e le giornate della Settimana ${activeWeekIndex} nella Settimana ${targetWeekIdx}? Questo sovrascriverà eventuali esercizi preesistenti.`,
        confirmText: 'Sì, copia',
        onConfirm: performWeekCopy
      });
    } else {
      const confirmed = window.confirm(`Vuoi copiare tutti gli esercizi e le giornate della Settimana ${activeWeekIndex} nella Settimana ${targetWeekIdx}? Questo sovrascriverà eventuali esercizi preesistenti.`);
      if (confirmed) {
        performWeekCopy();
      }
    }
  };

  // Duplicate the entire previous week's layout and exercises into the active week
  const handleDuplicatePreviousWeek = () => {
    if (activeWeekIndex === 1) return;
    const prevWeekIdx = activeWeekIndex - 1;
    const prevWeekObj = weeks.find(w => w.weekIndex === prevWeekIdx);
    if (!prevWeekObj) return;

    const performWeekDuplication = () => {
      const clonedGiornate = JSON.parse(JSON.stringify(prevWeekObj.giornate)).map((day: WorkoutDay) => ({
        ...day,
        id: 'day_' + Math.random().toString(36).substr(2, 5),
        esercizi: day.esercizi.map((ex: WorkoutExercise) => ({
          ...ex,
          id: 'we_inst_prevwk_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5)
        }))
      }));

      setWeeks(prev => prev.map(w => {
        if (w.weekIndex === activeWeekIndex) {
          return {
            ...w,
            giornate: clonedGiornate
          };
        }
        return w;
      }));

      if (onShowToast) {
        onShowToast(`Settimana ${prevWeekIdx} duplicata con successo nella Settimana ${activeWeekIndex}!`, 'success');
      }
    };

    if (onShowConfirm) {
      onShowConfirm({
        title: 'Duplicare settimana precedente?',
        message: `Vuoi duplicare l'intera struttura della Settimana ${prevWeekIdx} nella Settimana ${activeWeekIndex}? Tutti gli esercizi correnti di questa settimana verranno sostituiti.`,
        confirmText: 'Sì, duplica',
        onConfirm: performWeekDuplication
      });
    } else {
      const confirmed = window.confirm(`Vuoi duplicare l'intera struttura della Settimana ${prevWeekIdx} nella Settimana ${activeWeekIndex}? Tutti gli esercizi correnti di questa settimana verranno sostituiti.`);
      if (confirmed) {
        performWeekDuplication();
      }
    }
  };

  // Volume Summary Calculations (Recap)
  const clientObj = clients.find(c => c.id === selectedClientId);
  const clientName = clientObj ? `${clientObj.nome} ${clientObj.cognome}` : 'Nessuno';

  // Calculate total series in current active week
  const totalSets = giornate.reduce((acc, day) => {
    return acc + day.esercizi.reduce((sum, ex) => sum + Number(ex.serie || 0), 0);
  }, 0);

  // Series per muscle group
  const muscleSets: { [key in DistrettoMuscolare]?: number } = {};
  giornate.forEach(day => {
    day.esercizi.forEach(ex => {
      const muscle = ex.distrettoMuscolare;
      const sets = Number(ex.serie || 0);
      muscleSets[muscle] = (muscleSets[muscle] || 0) + sets;
    });
  });

  // Handle Save
  const handleSave = () => {
    if (!planNome.trim()) {
      alert('Fornisci un nome al programma o modello.');
      return;
    }

    const sanitizedWeeks = fixDuplicateProgramRowIdsInWeeks(weeks);

    // Default legacy support (giornate points to week 1 layout)
    const week1Giornate = sanitizedWeeks.find(w => w.weekIndex === 1)?.giornate || giornate;

    if (isTemplateMode) {
      const templateToSave: WorkoutTemplate = {
        id: editingTemplate ? editingTemplate.id : 'template_' + Date.now(),
        nome: planNome.trim(),
        obiettivo: planObiettivo,
        livello: editingTemplate?.livello || 'Intermedio',
        allenamentiSettimanali: planFrequenza,
        durataSettimane: planDurata,
        noteGenerali: planNoteGenerali.trim(),
        giornate: week1Giornate,
        weeks: sanitizedWeeks
      };
      if (onSaveTemplate) {
        onSaveTemplate(templateToSave);
      }
    } else {
      if (!selectedClientId) {
        alert('Seleziona un cliente.');
        return;
      }
      const newPlan: WorkoutPlan = {
        id: editingPlan ? editingPlan.id : 'plan_' + Date.now(),
        nome: planNome.trim(),
        clienteId: selectedClientId,
        clienteNomeCompleto: clientName,
        obiettivo: planObiettivo,
        allenamentiSettimanali: planFrequenza,
        durataSettimane: planDurata,
        dataInizio: planDataInizio,
        noteGenerali: planNoteGenerali.trim(),
        giornate: week1Giornate,
        dataCreazione: editingPlan ? editingPlan.dataCreazione : new Date().toISOString().split('T')[0],
        status: planStatus,
        weeks: sanitizedWeeks
      };
      onSavePlan(newPlan);
    }
  };

  // Handle Save as Reusable Template
  const handleSaveAsTemplate = () => {
    if (!planNome.trim() || !planObiettivo.trim()) {
      alert('Nome del programma e Obiettivo sono necessari per salvare un modello.');
      return;
    }

    const templateName = window.prompt("Salva modello con questo nome:", planNome);
    if (!templateName) return;

    const sanitizedWeeks = fixDuplicateProgramRowIdsInWeeks(weeks);
    const week1Giornate = sanitizedWeeks.find(w => w.weekIndex === 1)?.giornate || giornate;

    const newTemplate: WorkoutTemplate = {
      id: 'template_' + Date.now(),
      nome: templateName.trim(),
      obiettivo: planObiettivo.trim(),
      livello: 'Intermedio',
      allenamentiSettimanali: planFrequenza,
      durataSettimane: planDurata,
      noteGenerali: planNoteGenerali.trim(),
      giornate: week1Giornate,
      weeks: sanitizedWeeks
    };

    const updatedTemplates = [...templates, newTemplate];
    setTemplates(updatedTemplates);
    localStorage.setItem('pt_templates', JSON.stringify(updatedTemplates));
    alert('Modello salvato nella libreria e disponibile per caricarlo in futuro!');
  };

  // Filter Exercises for the Modal
  const modalFilteredExercises = exercises.filter(ex => {
    const matchesSearch = ex.nome.toLowerCase().includes(exSearch.toLowerCase());
    const matchesMuscle = exMuscleFilter === 'Tutti' || ex.distrettoMuscolare === exMuscleFilter;
    const matchesEquipment = exEquipmentFilter === 'Tutti' || ex.attrezzatura === exEquipmentFilter;
    return matchesSearch && matchesMuscle && matchesEquipment;
  });

  const selectedClientDetails = clients.find(c => c.id === selectedClientId);

  const blocksEx = (() => {
    if (!blocksManagerConfig) return null;
    const { dayId, exId } = blocksManagerConfig;
    const currentWeekObj = weeks.find(w => w.weekIndex === activeWeekIndex);
    const dayObj = currentWeekObj?.giornate.find(d => d.id === dayId);
    return dayObj?.esercizi.find(ex => ex.id === exId) || null;
  })();

  return (
    <div id="workout-wizard-view" className="space-y-6">
      {/* Title */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-black uppercase tracking-tighter italic text-white">
            {editingPlan ? `Modifica Scheda: ${editingPlan.nome}` : "Nuova Programmazione"}
          </h1>
          <p className="text-xs text-white/40 font-medium">Crea un piano di allenamento su misura con progressione multi-settimanale e superset.</p>
        </div>

        {currentStep === 2 && templates.length > 0 && (
          <button
            onClick={() => setShowTemplateModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-neutral-900 border border-white/5 hover:border-white/10 text-xs font-black uppercase tracking-wider text-[#CCFF00] cursor-pointer"
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            Libreria Modelli
          </button>
        )}
      </div>

      {/* Steps Indicator */}
      <div id="wizard-steps-header" className="flex items-center justify-between bg-[#121212] border border-white/5 rounded-xl p-4 text-xs font-semibold overflow-x-auto">
        {[
          { step: 1, label: '1. Cliente' },
          { step: 2, label: '2. Programma' },
          { step: 3, label: '3. Esercizi' },
          { step: 4, label: '4. Riepilogo' }
        ].map((s) => (
          <div 
            key={s.step} 
            className="flex items-center gap-2 shrink-0 px-2"
            style={{ color: currentStep === s.step ? config.primaryColor : currentStep > s.step ? '#10b981' : '#737373' }}
          >
            <div 
              className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border transition-colors ${
                currentStep === s.step 
                  ? 'bg-neutral-950' 
                  : currentStep > s.step 
                    ? 'bg-emerald-500 text-neutral-950 border-emerald-500' 
                    : 'bg-neutral-950 border-white/5'
              }`}
              style={{ borderColor: currentStep === s.step ? config.primaryColor : undefined }}
            >
              {currentStep > s.step ? <Check className="w-3 h-3" /> : s.step}
            </div>
            <span className={currentStep === s.step ? 'font-bold' : ''}>{s.label}</span>
            {s.step < 4 && <ChevronRight className="w-4 h-4 text-white/10" />}
          </div>
        ))}
      </div>

      {/* ================= STEP 1: CLIENT SELECTION ================= */}
      {currentStep === 1 && (
        <div id="wizard-step-1" className="space-y-6">
          {localStorage.getItem('pt_wizard_autosave') && (
            <div className="bg-[#1a1c12] border border-[#CCFF00]/20 rounded-2xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-2 text-left">
              <div>
                <p className="text-xs text-white font-extrabold uppercase tracking-wide flex items-center gap-2">
                  <RotateCcw className="w-4 h-4 text-[#CCFF00]" style={{ color: config.primaryColor }} />
                  Trovata una bozza precedente
                </p>
                <p className="text-[11px] text-white/50 font-medium mt-1">C'è una scheda d'allenamento non completata salvata localmente nel browser. Vuoi recuperarla?</p>
              </div>
              <div className="flex gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => {
                    const autosave = localStorage.getItem('pt_wizard_autosave');
                    if (autosave) {
                      try {
                        const data = JSON.parse(autosave);
                        setSelectedClientId(data.selectedClientId || '');
                        setPlanNome(data.planNome || '');
                        setPlanObiettivo(data.planObiettivo || '');
                        setPlanFrequenza(data.planFrequenza || 3);
                        setPlanDurata(data.planDurata || 4);
                        setPlanDataInizio(data.planDataInizio || '');
                        setPlanNoteGenerali(data.planNoteGenerali || '');
                        setPlanStatus(data.planStatus || 'Bozza');
                        setWeeks(data.weeks || []);
                        setActiveWeekIndex(data.activeWeekIndex || 1);
                        setCurrentStep(data.currentStep || 3);
                        if (onShowToast) onShowToast('Bozza ripristinata con successo!', 'success');
                      } catch (err) {
                        console.error(err);
                      }
                    }
                  }}
                  className="flex-1 sm:flex-initial px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider text-neutral-950 hover:bg-white/90 cursor-pointer transition-colors"
                  style={{ backgroundColor: config.primaryColor }}
                >
                  Ripristina
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (onShowConfirm) {
                      onShowConfirm({
                        title: 'Eliminare la bozza?',
                        message: 'Sei sicuro di voler eliminare la bozza salvata? Questa azione è irreversibile.',
                        confirmText: 'Sì, elimina',
                        isDestructive: true,
                        onConfirm: () => {
                          localStorage.removeItem('pt_wizard_autosave');
                          setCurrentStep(1); // Force state sync
                          if (onShowToast) onShowToast('Bozza eliminata.', 'info');
                        }
                      });
                    } else {
                      const ans = window.confirm('Sei sicuro di voler eliminare la bozza salvata? Questa azione è irreversibile.');
                      if (ans) {
                        localStorage.removeItem('pt_wizard_autosave');
                        setCurrentStep(1);
                      }
                    }
                  }}
                  className="flex-1 sm:flex-initial px-4 py-2 rounded-xl text-[10px] bg-neutral-900 hover:bg-neutral-800 border border-white/5 text-white/60 font-black uppercase tracking-wider cursor-pointer transition-colors"
                >
                  Elimina bozza
                </button>
              </div>
            </div>
          )}
          <div className="bg-[#121212] border border-white/5 rounded-2xl p-6 space-y-4 text-left">
            <h2 className="text-sm font-black uppercase tracking-wider text-white/40">Seleziona Atleta</h2>
            
            <div className="space-y-3">
              <label className="block text-xs font-bold text-white/60 uppercase tracking-wide">Scegli un cliente esistente dall'archivio:</label>
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
              
              <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1 custom-scrollbar">
                {(() => {
                  const filteredClients = clients.filter(c => 
                    `${c.nome} ${c.cognome}`.toLowerCase().includes(clientSearchQuery.toLowerCase()) ||
                    c.obiettivo.toLowerCase().includes(clientSearchQuery.toLowerCase())
                  );
                  
                  if (clients.length === 0) {
                    return (
                      <p className="text-[11px] text-amber-400 font-semibold py-2">
                        ⚠️ Nessun atleta registrato nell'archivio. Registra un atleta nella sezione "Clienti" prima di creare una scheda.
                      </p>
                    );
                  }
                  
                  if (filteredClients.length === 0) {
                    return (
                      <p className="text-[11px] text-white/30 italic text-center py-4">Nessun atleta corrisponde alla ricerca.</p>
                    );
                  }
                  
                  return filteredClients.map(c => {
                    const isSelected = selectedClientId === c.id;
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => {
                          setSelectedClientId(c.id);
                          setPlanObiettivo(c.obiettivo);
                          setPlanFrequenza(c.allenamentiSettimanali);
                          setPlanNome(`Scheda ${c.obiettivo}`);
                        }}
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

            {selectedClientDetails && (
              <div className="bg-black/40 border border-white/5 p-4 rounded-xl flex items-start gap-4">
                <div 
                  className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-neutral-950 text-xs shrink-0"
                  style={{ backgroundColor: config.primaryColor }}
                >
                  {selectedClientDetails.nome.charAt(0)}{selectedClientDetails.cognome.charAt(0)}
                </div>
                <div className="space-y-1 text-xs text-white/50">
                  <p className="font-bold text-white text-sm">{selectedClientDetails.nome} {selectedClientDetails.cognome}</p>
                  <p><span className="font-medium text-white/30">Obiettivo:</span> {selectedClientDetails.obiettivo}</p>
                  <p><span className="font-medium text-white/30">Livello di Esperienza:</span> {selectedClientDetails.livelloEsperienza}</p>
                  <p><span className="font-medium text-white/30">Sedute raccomandate:</span> {selectedClientDetails.allenamentiSettimanali} sedute/settimana</p>
                </div>
              </div>
            )}

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setShowQuickAddClient(!showQuickAddClient)}
                className="text-xs font-bold flex items-center gap-1.5 hover:underline cursor-pointer"
                style={{ color: config.primaryColor }}
              >
                <PlusCircle className="w-4 h-4" />
                Oppure inserisci rapidamente un nuovo cliente...
              </button>
            </div>
          </div>

          {showQuickAddClient && (
            <form onSubmit={handleQuickAddClient} className="bg-[#121212] border border-white/5 rounded-2xl p-6 space-y-4">
              <h3 className="text-xs font-black uppercase tracking-wider text-white/40">Inserimento Rapido Cliente</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-[10px] uppercase font-bold text-white/40 tracking-wider">Nome <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    required
                    placeholder="Nome"
                    value={quickNome}
                    onChange={(e) => setQuickNome(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-black/40 border border-white/5 text-white placeholder-white/20 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] uppercase font-bold text-white/40 tracking-wider">Cognome <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    required
                    placeholder="Cognome"
                    value={quickCognome}
                    onChange={(e) => setQuickCognome(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-black/40 border border-white/5 text-white placeholder-white/20 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] uppercase font-bold text-white/40 tracking-wider">Età <span className="text-red-500">*</span></label>
                  <input
                    type="number"
                    required
                    placeholder="Età"
                    value={quickEta}
                    onChange={(e) => setQuickEta(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-black/40 border border-white/5 text-white placeholder-white/20 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] uppercase font-bold text-white/40 tracking-wider">Sesso</label>
                  <select
                    value={quickSesso}
                    onChange={(e) => setQuickSesso(e.target.value as Sesso)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-black/40 border border-white/5 text-white focus:outline-none"
                  >
                    <option value="Uomo">Uomo</option>
                    <option value="Donna">Donna</option>
                    <option value="Altro">Altro</option>
                  </select>
                </div>
                <div className="space-y-1 col-span-2">
                  <label className="block text-[10px] uppercase font-bold text-white/40 tracking-wider">Obiettivo <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    required
                    placeholder="es. Sviluppo massa muscolare"
                    value={quickObiettivo}
                    onChange={(e) => setQuickObiettivo(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-black/40 border border-white/5 text-white placeholder-white/20 focus:outline-none"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="w-full py-2.5 rounded-xl text-xs font-black uppercase text-neutral-950 cursor-pointer"
                style={{ backgroundColor: config.primaryColor }}
              >
                Aggiungi ed Elabora
              </button>
            </form>
          )}

          <div className="flex justify-end pt-4">
            <button
              id="wizard-step1-next"
              disabled={!selectedClientId}
              onClick={() => setCurrentStep(2)}
              className="flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-black uppercase tracking-wider text-neutral-950 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer shadow"
              style={{ backgroundColor: selectedClientId ? config.primaryColor : undefined }}
            >
              Avanti
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ================= STEP 2: PROGRAM GENERAL INFO ================= */}
      {currentStep === 2 && (
        <form id="wizard-step-2" onSubmit={handleStep2Submit} className="space-y-6">
          <div className="bg-[#121212] border border-white/5 rounded-2xl p-6 space-y-4">
            <h2 className="text-sm font-black uppercase tracking-wider text-white/40">Parametri del Programma</h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-white/40">Nome della Scheda <span className="text-red-500">*</span></label>
                <input
                  id="wizard-plan-name"
                  type="text"
                  required
                  placeholder="es. Ipertrofia Push/Pull/Legs"
                  value={planNome}
                  onChange={(e) => setPlanNome(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-black/40 border border-white/5 text-white focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-white/40">Obiettivo Scheda <span className="text-red-500">*</span></label>
                <input
                  id="wizard-plan-goal"
                  type="text"
                  required
                  placeholder="es. Ricomposizione Corporea, Ipertrofia"
                  value={planObiettivo}
                  onChange={(e) => setPlanObiettivo(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-black/40 border border-white/5 text-white focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-white/40">Allenamenti Settimanali</label>
                <select
                  id="wizard-plan-sessions"
                  value={planFrequenza}
                  onChange={(e) => setPlanFrequenza(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-black/40 border border-white/5 text-white focus:outline-none"
                >
                  {[2, 3, 4, 5, 6].map(num => (
                    <option key={num} value={num}>{num} giornate / settimana</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-white/40">Durata Programma <span className="text-white/30">(Da 1 a 12 settimane)</span></label>
                <select
                  id="wizard-plan-weeks"
                  value={planDurata}
                  onChange={(e) => setPlanDurata(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-black/40 border border-white/5 text-white focus:outline-none"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(num => (
                    <option key={num} value={num}>
                      {num} {num === 1 ? 'Settimana' : 'Settimane'} {num === 1 ? '(Base)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-white/40">Stato Iniziale</label>
                <select
                  value={planStatus}
                  onChange={(e) => setPlanStatus(e.target.value as WorkoutPlanStatus)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-black/40 border border-white/5 text-white focus:outline-none"
                >
                  <option value="Bozza">Bozza</option>
                  <option value="Attiva">Attiva</option>
                  <option value="Completata">Completata</option>
                  <option value="Archiviata">Archiviata</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-white/40">Data di Inizio <span className="text-red-500">*</span></label>
                <input
                  id="wizard-plan-startdate"
                  type="date"
                  required
                  value={planDataInizio}
                  onChange={(e) => setPlanDataInizio(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-black/40 border border-white/5 text-white focus:outline-none"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-white/40">Note Generali Programma <span className="text-white/30">(Facoltativo)</span></label>
              <textarea
                id="wizard-plan-notes"
                placeholder="Riscaldamento consigliato, cardio post-allenamento, indicazioni di scarico o nutrizione..."
                value={planNoteGenerali}
                onChange={(e) => setPlanNoteGenerali(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 text-xs rounded-xl bg-black/40 border border-white/5 text-white focus:outline-none resize-none"
              />
            </div>
          </div>

          <div className="flex justify-between pt-4">
            <button
              type="button"
              onClick={() => setCurrentStep(1)}
              className="flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-bold uppercase tracking-wider text-white/50 border border-white/5 hover:bg-white/5 transition-all cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              Indietro
            </button>
            <button
              id="wizard-step2-next"
              type="submit"
              className="flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-black uppercase tracking-wider text-neutral-950 transition-all cursor-pointer shadow-md"
              style={{ backgroundColor: config.primaryColor }}
            >
              Crea Giornate
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      )}

      {/* ================= STEP 3: EXERCISE INSERTION (WITH MULTI-WEEK TABS & SUPERSETS) ================= */}
      {currentStep === 3 && (
        <div id="wizard-step-3" className="space-y-6">
          
          {/* Multi-Week Navigation & Management Header */}
          <div className="flex flex-col gap-4 p-5 bg-[#121212] border border-white/5 rounded-2xl shadow-xl">
            <div className="flex justify-between items-center flex-wrap gap-2 pb-2 border-b border-white/5">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-white/60" />
                <span className="text-xs font-black uppercase text-white/60 tracking-wider">Pianificazione Multi-Settimanale</span>
              </div>
              
              {/* Autosave timestamp */}
              {lastSavedTime && (
                <span className="text-[10px] font-mono text-white/40 flex items-center gap-1.5 bg-black/40 border border-white/5 px-2.5 py-1 rounded-lg">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Bozza salvata: {lastSavedTime}
                </span>
              )}
            </div>

            {/* Quick visualization of weeks */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-[11px] text-white/40">
                <span>Passa rapidamente a una settimana:</span>
                <span className="font-bold text-white/60">{activeWeekIndex} di {planDurata}</span>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-6 lg:grid-cols-12 gap-2">
                {weeks.map((w) => {
                  const weekExsCount = w.giornate.reduce((sum, d) => sum + d.esercizi.length, 0);
                  const weekSetsCount = w.giornate.reduce((sum, d) => sum + d.esercizi.reduce((acc, ex) => {
                    const sets = ex.blocks && ex.blocks.length > 0
                      ? ex.blocks.reduce((bSum, b) => bSum + Number(b.serie || 0), 0)
                      : Number(ex.serie || 0);
                    return acc + sets;
                  }, 0), 0);
                  const isActive = activeWeekIndex === w.weekIndex;
                  return (
                    <button
                      key={w.weekIndex}
                      type="button"
                      onClick={() => setActiveWeekIndex(w.weekIndex)}
                      className={`relative flex flex-col items-center justify-center p-2 rounded-xl border text-center transition-all cursor-pointer ${
                        isActive
                          ? 'bg-neutral-800 text-white border-white/20'
                          : 'bg-black/40 text-white/40 border-white/5 hover:bg-neutral-900 hover:text-white/80'
                      }`}
                      style={{ borderBottomColor: isActive ? config.primaryColor : undefined, borderBottomWidth: isActive ? '3px' : '1px' }}
                    >
                      <span className="text-[10px] font-black uppercase tracking-wider">S{w.weekIndex}</span>
                      <span className="text-[9px] font-mono mt-1 text-white/30">
                        {weekExsCount} es | {weekSetsCount} s
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Previous / Next and Duplicate buttons */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pt-1">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  disabled={activeWeekIndex === 1}
                  onClick={() => setActiveWeekIndex(prev => Math.max(1, prev - 1))}
                  className="flex-1 sm:flex-initial flex items-center justify-center gap-1 px-3 py-2 rounded-xl bg-black/40 border border-white/5 text-white/60 hover:text-white hover:bg-neutral-900 disabled:opacity-20 disabled:hover:bg-transparent transition-all cursor-pointer text-xs"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Sett. prec.</span>
                </button>

                {/* Selettore della settimana */}
                <select
                  value={activeWeekIndex}
                  onChange={(e) => setActiveWeekIndex(Number(e.target.value))}
                  className="px-3 py-2 bg-black/40 border border-white/5 text-white rounded-xl text-xs font-black focus:outline-none cursor-pointer hover:bg-neutral-900 transition-all text-center"
                >
                  {Array.from({ length: planDurata }).map((_, i) => (
                    <option key={i + 1} value={i + 1} className="bg-neutral-950 text-white font-bold">
                      Settimana {i + 1}
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  disabled={activeWeekIndex === planDurata}
                  onClick={() => setActiveWeekIndex(prev => Math.min(planDurata, prev + 1))}
                  className="flex-1 sm:flex-initial flex items-center justify-center gap-1 px-3 py-2 rounded-xl bg-black/40 border border-white/5 text-white/60 hover:text-white hover:bg-neutral-900 disabled:opacity-20 disabled:hover:bg-transparent transition-all cursor-pointer text-xs"
                >
                  <span>Sett. succ.</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto justify-end">
                {activeWeekIndex > 1 && (
                  <button
                    type="button"
                    onClick={handleDuplicatePreviousWeek}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#CCFF00]/10 border border-[#CCFF00]/20 text-[#CCFF00] hover:bg-[#CCFF00]/20 text-xs font-bold transition-all cursor-pointer"
                    style={{ color: config.primaryColor, borderColor: config.primaryColor + '40', backgroundColor: config.primaryColor + '10' }}
                  >
                    <RefreshCw className="w-3.5 h-3.5 animate-spin-slow" />
                    <span>Duplica Settimana {activeWeekIndex - 1} qui</span>
                  </button>
                )}

                {weeks.length > 1 && (
                  <div className="flex gap-1.5 items-center bg-black/40 border border-white/5 px-3 py-1.5 rounded-xl">
                    <span className="text-[10px] font-bold text-white/40 uppercase">Copia questa S{activeWeekIndex} su:</span>
                    <select
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val) handleCopyWeekToOther(Number(val));
                        e.target.value = '';
                      }}
                      className="px-2 py-0.5 bg-black/60 border border-white/5 text-white rounded text-[10px] focus:outline-none"
                    >
                      <option value="">Scegli S...</option>
                      {weeks.map(w => w.weekIndex !== activeWeekIndex && (
                        <option key={w.weekIndex} value={w.weekIndex}>S{w.weekIndex}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>

            {/* Global modifications toggle */}
            <div className="flex items-center justify-between p-3 bg-black/30 border border-white/5 rounded-xl">
              <div className="flex flex-col text-left">
                <span className="text-xs font-black text-white/80">Applica modifiche a tutte le settimane</span>
                <span className="text-[10px] text-white/30">Se attivo, qualsiasi modifica a carichi, serie, ripetizioni o note si applicherà a tutte le settimane</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer select-none">
                <input 
                  type="checkbox" 
                  checked={globalModifications}
                  onChange={(e) => setGlobalModifications(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-neutral-800 rounded-full peer peer-focus:ring-0 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#CCFF00]" style={{ backgroundColor: globalModifications ? config.primaryColor : undefined }}></div>
              </label>
            </div>
          </div>

          {/* Dynamic Plan Analytics Panel */}
          <div className="bg-[#121212] border border-white/5 rounded-2xl overflow-hidden shadow-lg">
            <button
              type="button"
              onClick={() => setShowAnalytics(!showAnalytics)}
              className="w-full flex justify-between items-center px-5 py-3.5 text-xs font-extrabold uppercase tracking-wider text-white/60 hover:text-white transition-colors"
            >
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                <span>Analisi Volume & Frequenza (Settimana {activeWeekIndex})</span>
              </div>
              <span className="text-[10px] px-2.5 py-1 rounded bg-black/50 border border-white/5">
                {showAnalytics ? 'Nascondi' : 'Mostra Analisi'}
              </span>
            </button>

            {showAnalytics && (
              <div className="px-5 pb-5 pt-1 space-y-4 border-t border-white/5 bg-black/10">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
                  <div className="p-3 bg-black/30 border border-white/5 rounded-xl space-y-1">
                    <span className="text-[9px] uppercase tracking-wider text-white/30 font-bold block">Volume Totale</span>
                    <span className="text-xl font-black text-white">{totalSets} <span className="text-[11px] text-white/40 font-normal">serie totali</span></span>
                    <p className="text-[9px] text-white/30 leading-snug">Raccomandato: 40-90 serie a settimana a seconda dell'anzianità.</p>
                  </div>

                  <div className="p-3 bg-black/30 border border-white/5 rounded-xl space-y-1">
                    <span className="text-[9px] uppercase tracking-wider text-white/30 font-bold block">Frequenza Stimolo</span>
                    <span className="text-xl font-black text-white">{planFrequenza} <span className="text-[11px] text-white/40 font-normal">allenamenti/sett.</span></span>
                    <p className="text-[9px] text-white/30 leading-snug">Ripartiti in {weeks.find(w => w.weekIndex === activeWeekIndex)?.giornate.filter(g => g.esercizi.length > 0).length || 0} giornate attive.</p>
                  </div>

                  <div className="p-3 bg-black/30 border border-white/5 rounded-xl space-y-1">
                    <span className="text-[9px] uppercase tracking-wider text-white/30 font-bold block">Consistenza Giornate</span>
                    {giornate.some(g => g.esercizi.length === 0) ? (
                      <div className="flex items-center gap-1.5 text-amber-400 text-[11px] font-bold">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>Ci sono giornate vuote!</span>
                      </div>
                    ) : (
                      <div className="text-emerald-400 text-[11px] font-bold flex items-center gap-1.5">
                        <CheckSquare className="w-4 h-4 shrink-0" />
                        <span>Tutte le sedute compilate</span>
                      </div>
                    )}
                    <p className="text-[9px] text-white/30 leading-snug">Assicurati che ogni giorno programmato contenga almeno un esercizio.</p>
                  </div>
                </div>

                <div className="space-y-2 text-left">
                  <span className="text-[9px] uppercase tracking-wider text-white/30 font-bold block">Distribuzione Serie per Distretto Muscolare:</span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {Object.keys(muscleSets).length === 0 ? (
                      <span className="text-[10px] text-white/20 italic col-span-full">Inserisci esercizi per visualizzare i grafici di distribuzione.</span>
                    ) : (
                      Object.entries(muscleSets).map(([muscle, count]) => {
                        const countNum = Number(count);
                        const percentage = totalSets > 0 ? Math.round((countNum / totalSets) * 100) : 0;
                        return (
                          <div key={muscle} className="p-2.5 bg-black/40 border border-white/5 rounded-lg space-y-1">
                            <div className="flex justify-between items-center text-[10px]">
                              <span className="font-extrabold text-white/80 uppercase truncate">{muscle}</span>
                              <span className="font-bold font-mono text-white/50">{countNum} s</span>
                            </div>
                            <div className="w-full bg-neutral-800 rounded-full h-1 overflow-hidden">
                              <div className="h-full rounded-full" style={{ width: `${percentage}%`, backgroundColor: DISTRICT_COLORS[muscle] || config.primaryColor }} />
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {Object.keys(muscleSets).length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-white/5">
                    {/* Radar Chart */}
                    <div className="bg-black/30 p-4 rounded-xl border border-white/5 flex flex-col items-center">
                      <span className="text-[10px] uppercase tracking-wider text-white/40 font-bold mb-2">Profilo Volumi (Radar)</span>
                      <div className="h-64 w-full flex items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                          <RadarChart cx="50%" cy="50%" outerRadius="70%" data={
                            Object.entries(muscleSets).map(([muscle, count]) => ({
                              subject: muscle,
                              value: Number(count) || 0
                            }))
                          }>
                            <PolarGrid stroke="#222" />
                            <PolarAngleAxis dataKey="subject" tick={{ fill: '#aaa', fontSize: 9, fontWeight: 'bold' }} />
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
                      <div className="h-64 w-full">
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
                )}
              </div>
            )}
          </div>

          <p className="text-xs text-white/40 italic leading-relaxed text-left">
            Stai modificando la <strong>Settimana {activeWeekIndex}</strong>. Puoi inserire progressioni, intensificare i carichi e unire gli esercizi in <strong>Super Set / Jump Set</strong> cliccando l'apposito pulsante "Super Set".
          </p>

          {giornate.map((day, dIdx) => (
            <div 
              key={day.id} 
              className="bg-[#121212] border border-white/5 rounded-2xl overflow-hidden p-6 space-y-6"
            >
              {/* Day Header */}
              <div className="flex flex-col gap-4 pb-4 border-b border-white/5">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  
                  {/* Name and stats */}
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="text-xs font-bold text-white/35 font-mono">#{dIdx + 1}</span>
                    <input
                      type="text"
                      value={day.nome}
                      onChange={(e) => handleRenameDay(day.id, e.target.value)}
                      className="font-black text-white text-base bg-transparent border-b border-dashed border-white/20 focus:border-solid focus:outline-none focus:border-white/50 py-0.5"
                      placeholder={`Giorno ${dIdx + 1}`}
                    />
                    <div className="flex items-center gap-1.5 px-2 py-1 bg-black/40 border border-white/5 rounded-lg text-[10px] font-mono text-white/50">
                      <span>{day.esercizi.length} es.</span>
                      <span className="text-white/20">•</span>
                      <span>{Math.round(Math.max(30, day.esercizi.reduce((sum, ex) => {
                        const exTime = ex.blocks && ex.blocks.length > 0
                          ? ex.blocks.reduce((bSum, b) => bSum + (b.serie * (b.recupero || 90) + b.serie * 30), 0)
                          : (ex.serie * (ex.recupero || 90) + ex.serie * 30);
                        return sum + exTime / 60;
                      }, 0)))} min stimati</span>
                    </div>
                  </div>

                  {/* Actions buttons */}
                  <div className="flex flex-wrap items-center gap-2">
                    {groupSelectionDayId === day.id ? (
                      <>
                        <span className="text-xs text-white/60 font-medium animate-pulse">
                          {groupSelectionType === 'jumpset' 
                            ? 'Seleziona 2 esercizi da alternare' 
                            : groupSelectionType === 'circuit'
                              ? 'Seleziona 4 esercizi per il Circuito'
                              : `Seleziona ${getRequiredGroupMemberCount(groupSelectionType)} esercizi`}
                        </span>

                        {/* SWITCHER PER CAMBIARE TIPO DI GRUPPO IN CORSO */}
                        <div className="flex items-center gap-1 bg-black/20 p-1 rounded-xl border border-white/5">
                          <button
                            type="button"
                            onClick={() => {
                              setGroupSelectionType('superset');
                              setSelectedExerciseIds([]);
                            }}
                            className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${groupSelectionType === 'superset' ? 'text-neutral-950 font-extrabold' : 'text-white/60 hover:text-white hover:bg-white/5'}`}
                            style={groupSelectionType === 'superset' ? { backgroundColor: config.primaryColor } : {}}
                          >
                            Superset
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setGroupSelectionType('compound_set');
                              setSelectedExerciseIds([]);
                            }}
                            className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${groupSelectionType === 'compound_set' ? 'text-neutral-950 font-extrabold' : 'text-white/60 hover:text-white hover:bg-white/5'}`}
                            style={groupSelectionType === 'compound_set' ? { backgroundColor: config.primaryColor } : {}}
                          >
                            Compound Set
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setGroupSelectionType('jumpset');
                              setSelectedExerciseIds([]);
                            }}
                            className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${groupSelectionType === 'jumpset' ? 'text-neutral-950 font-extrabold' : 'text-white/60 hover:text-white hover:bg-white/5'}`}
                            style={groupSelectionType === 'jumpset' ? { backgroundColor: config.primaryColor } : {}}
                          >
                            {EXERCISE_GROUP_LABELS['jumpset']}
                          </button>
                          {day.esercizi.length >= 3 && (
                            <button
                              type="button"
                              onClick={() => {
                                setGroupSelectionType('triset');
                                setSelectedExerciseIds([]);
                              }}
                              className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${groupSelectionType === 'triset' ? 'text-neutral-950 font-extrabold' : 'text-white/60 hover:text-white hover:bg-white/5'}`}
                              style={groupSelectionType === 'triset' ? { backgroundColor: config.primaryColor } : {}}
                            >
                              Triset
                            </button>
                          )}
                          {day.esercizi.length >= 4 && (
                            <>
                              <button
                                type="button"
                                onClick={() => {
                                  setGroupSelectionType('giant_set');
                                  setSelectedExerciseIds([]);
                                }}
                                className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${groupSelectionType === 'giant_set' ? 'text-neutral-950 font-extrabold' : 'text-white/60 hover:text-white hover:bg-white/5'}`}
                                style={groupSelectionType === 'giant_set' ? { backgroundColor: config.primaryColor } : {}}
                              >
                                Giant Set
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setGroupSelectionType('circuit');
                                  setSelectedExerciseIds([]);
                                }}
                                className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${groupSelectionType === 'circuit' ? 'text-neutral-950 font-extrabold' : 'text-white/60 hover:text-white hover:bg-white/5'}`}
                                style={groupSelectionType === 'circuit' ? { backgroundColor: config.primaryColor } : {}}
                              >
                                {EXERCISE_GROUP_LABELS['circuit']}
                              </button>
                            </>
                          )}
                        </div>

                        {selectedExerciseIds.length === getRequiredGroupMemberCount(groupSelectionType) && (
                          <button
                            type="button"
                            onClick={() => handleConfirmExerciseGroup(day.id)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm text-neutral-950 bg-green-500 hover:bg-green-400"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Conferma {groupSelectionType ? EXERCISE_GROUP_LABELS[groupSelectionType] : ''}</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={resetGroupSelection}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/40 border border-white/5 text-white/60 hover:text-white hover:bg-neutral-900 transition-all text-xs cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>Annulla</span>
                        </button>
                      </>
                    ) : (
                      <>
                        {/* Only show "Crea gruppo" if we are not in selection mode and day has >= 2 exercises */}
                        {groupSelectionDayId === null && day.esercizi.length >= 2 && (
                          <div className="relative animate-fadeIn">
                            <button
                              type="button"
                              onClick={() => setActiveGroupMenuDayId(activeGroupMenuDayId === day.id ? null : day.id)}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-800 border border-white/10 text-white/80 hover:text-white hover:bg-neutral-700 transition-all text-xs cursor-pointer"
                            >
                              <Link className="w-3.5 h-3.5" style={{ color: config.primaryColor }} />
                              <span>Crea gruppo</span>
                            </button>
                            {activeGroupMenuDayId === day.id && (
                              <div className="absolute left-0 mt-2 w-40 bg-neutral-900 border border-white/10 rounded-xl shadow-2xl z-30 overflow-hidden py-1 text-left">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setGroupSelectionDayId(day.id);
                                    setGroupSelectionType('superset');
                                    setSelectedExerciseIds([]);
                                    setActiveGroupMenuDayId(null);
                                  }}
                                  className="w-full px-4 py-2 text-xs text-white/70 hover:text-white hover:bg-white/5 flex items-center gap-2"
                                >
                                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: config.primaryColor }} />
                                  <span>Superset</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setGroupSelectionDayId(day.id);
                                    setGroupSelectionType('compound_set');
                                    setSelectedExerciseIds([]);
                                    setActiveGroupMenuDayId(null);
                                  }}
                                  className="w-full px-4 py-2 text-xs text-white/70 hover:text-white hover:bg-white/5 flex items-center gap-2"
                                >
                                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: config.primaryColor }} />
                                  <span>Compound Set</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setGroupSelectionDayId(day.id);
                                    setGroupSelectionType('jumpset');
                                    setSelectedExerciseIds([]);
                                    setActiveGroupMenuDayId(null);
                                  }}
                                  className="w-full px-4 py-2 text-xs text-white/70 hover:text-white hover:bg-white/5 flex items-center gap-2"
                                >
                                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: config.primaryColor }} />
                                  <span>{EXERCISE_GROUP_LABELS['jumpset']}</span>
                                </button>
                                {day.esercizi.length >= 3 && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setGroupSelectionDayId(day.id);
                                      setGroupSelectionType('triset');
                                      setSelectedExerciseIds([]);
                                      setActiveGroupMenuDayId(null);
                                    }}
                                    className="w-full px-4 py-2 text-xs text-white/70 hover:text-white hover:bg-white/5 flex items-center gap-2"
                                  >
                                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: config.primaryColor }} />
                                    <span>Triset</span>
                                  </button>
                                )}
                                {day.esercizi.length >= 4 && (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setGroupSelectionDayId(day.id);
                                        setGroupSelectionType('giant_set');
                                        setSelectedExerciseIds([]);
                                        setActiveGroupMenuDayId(null);
                                      }}
                                      className="w-full px-4 py-2 text-xs text-white/70 hover:text-white hover:bg-white/5 flex items-center gap-2"
                                    >
                                      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: config.primaryColor }} />
                                      <span>Giant Set</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setGroupSelectionDayId(day.id);
                                        setGroupSelectionType('circuit');
                                        setSelectedExerciseIds([]);
                                        setActiveGroupMenuDayId(null);
                                      }}
                                      className="w-full px-4 py-2 text-xs text-white/70 hover:text-white hover:bg-white/5 flex items-center gap-2"
                                    >
                                      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: config.primaryColor }} />
                                      <span>{EXERCISE_GROUP_LABELS['circuit']}</span>
                                    </button>
                                  </>
                                )}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Aggiungi esercizio */}
                        {groupSelectionDayId === null && (
                          <button
                            type="button"
                            onClick={() => openExercisePicker(day.id)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm text-neutral-950 hover:opacity-90"
                            style={{ backgroundColor: config.primaryColor }}
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Aggiungi esercizio</span>
                          </button>
                        )}

                        {/* Duplica */}
                        {groupSelectionDayId === null && (
                          <button
                            type="button"
                            onClick={() => handleDuplicateDay(day.id)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/40 border border-white/5 text-white/60 hover:text-white hover:bg-neutral-900 transition-all text-xs cursor-pointer"
                          >
                            <Copy className="w-3.5 h-3.5" />
                            <span>Duplica</span>
                          </button>
                        )}

                        {/* Copia */}
                        {groupSelectionDayId === null && (
                          <button
                            type="button"
                            onClick={() => {
                              if (copyingDayId === day.id) {
                                setCopyingDayId(null);
                              } else {
                                setCopyingDayId(day.id);
                                setCopyTargetWeek(activeWeekIndex);
                                setCopyTargetDayIdx(dIdx);
                              }
                            }}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/40 border border-white/5 text-white/60 hover:text-white hover:bg-neutral-900 transition-all text-xs cursor-pointer"
                          >
                            <Layers className="w-3.5 h-3.5" />
                            <span>{copyingDayId === day.id ? 'Annulla Copia' : 'Copia'}</span>
                          </button>
                        )}

                        {/* Altre azioni dropdown */}
                        {groupSelectionDayId === null && (
                          <div className="relative">
                            <button
                              type="button"
                              onClick={() => setActiveActionMenuExId(activeActionMenuExId === `day_${day.id}` ? null : `day_${day.id}`)}
                              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-black/40 border border-white/5 text-white/60 hover:text-white hover:bg-neutral-900 transition-all text-xs cursor-pointer"
                            >
                              <MoreHorizontal className="w-3.5 h-3.5" />
                              <span>Altre azioni</span>
                            </button>
                            {activeActionMenuExId === `day_${day.id}` && (
                              <div className="absolute right-0 mt-2 w-48 bg-neutral-900 border border-white/10 rounded-xl shadow-2xl z-30 overflow-hidden py-1 text-left">
                                <button
                                  type="button"
                                  onClick={() => {
                                    handleClearDayExercises(day.id);
                                    setActiveActionMenuExId(null);
                                  }}
                                  className="w-full px-4 py-2 text-xs text-white/70 hover:text-red-400 hover:bg-white/5 flex items-center gap-2"
                                >
                                  <Trash2 className="w-3.5 h-3.5 text-red-500/60" />
                                  <span>Svuota giornata</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (window.confirm('Sei sicuro di voler eliminare questa giornata?')) {
                                      setGiornate(prev => prev.filter(d => d.id !== day.id));
                                    }
                                    setActiveActionMenuExId(null);
                                  }}
                                  className="w-full px-4 py-2 text-xs text-red-400 hover:bg-white/5 flex items-center gap-2"
                                >
                                  <Trash2 className="w-3.5 h-3.5 text-red-500" />
                                  <span>Elimina giornata</span>
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {/* Inline Cross-Week Day Copying Selector */}
                {copyingDayId === day.id && (
                  <div className="p-4 bg-black/40 border border-white/5 rounded-xl space-y-2.5 animate-fadeIn text-left mt-2">
                    <div className="flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" style={{ color: config.primaryColor }} />
                      <span className="text-[10px] font-black uppercase tracking-wider text-white/80">Copia questa giornata in un'altra sessione:</span>
                    </div>
                    <div className="flex flex-col sm:flex-row flex-wrap gap-3 items-stretch sm:items-center">
                      <div className="flex items-center gap-1.5 text-xs flex-1">
                        <span className="text-white/40 shrink-0">Settimana target:</span>
                        <select
                          value={copyTargetWeek}
                          onChange={(e) => setCopyTargetWeek(Number(e.target.value))}
                          className="w-full sm:w-auto px-2 py-1 bg-[#121212] border border-white/10 rounded text-white text-xs focus:outline-none"
                        >
                          {weeks.map(w => (
                            <option key={w.weekIndex} value={w.weekIndex}>Settimana {w.weekIndex} {w.weekIndex === activeWeekIndex ? '(Attuale)' : ''}</option>
                          ))}
                        </select>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs flex-1">
                        <span className="text-white/40 shrink-0">Giorno target:</span>
                        <select
                          value={copyTargetDayIdx}
                          onChange={(e) => setCopyTargetDayIdx(Number(e.target.value))}
                          className="w-full sm:w-auto px-2 py-1 bg-[#121212] border border-white/10 rounded text-white text-xs focus:outline-none"
                        >
                          {giornate.map((d, idx) => (
                            <option key={idx} value={idx}>Giorno {idx + 1} ({d.nome})</option>
                          ))}
                        </select>
                      </div>
                      <div className="flex gap-1.5 shrink-0 justify-end mt-2 sm:mt-0">
                        <button
                          type="button"
                          onClick={() => setCopyingDayId(null)}
                          className="px-3 py-1.5 text-xs font-bold rounded bg-neutral-800 text-white/60 hover:text-white cursor-pointer"
                        >
                          Annulla
                        </button>
                        <button
                          type="button"
                          onClick={() => handleConfirmCopyDay(day.id)}
                          className="px-3 py-1.5 text-xs font-black rounded text-neutral-950 cursor-pointer"
                          style={{ backgroundColor: config.primaryColor }}
                        >
                          Conferma Copia
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Added Exercises Table / Content */}
              {day.esercizi.length === 0 ? (
                <div className="border border-dashed border-white/5 bg-black/10 p-8 rounded-xl text-center text-white/25">
                  <p className="text-xs">Nessun esercizio inserito per questa giornata. Clicca "Aggiungi esercizio" in alto per iniziare.</p>
                </div>
              ) : (
                <div className="overflow-auto w-full max-h-[600px] rounded-xl border border-white/5 bg-black/20 scrollbar-thin">
                  <table 
                    className="w-full text-left border-collapse table-fixed"
                    style={{ minWidth: `${784 + weeks.length * 110}px` }}
                  >
                    <thead>
                      <tr>
                        {/* Main Headers */}
                        <th className="sticky top-0 left-0 z-30 bg-neutral-950 border-b border-r border-white/5 p-1.5 text-center text-[10px] font-black uppercase text-white/40 w-10 shrink-0" style={{ left: '0px', width: '40px', minWidth: '40px' }}>#</th>
                        <th className="sticky top-0 z-30 bg-neutral-950 border-b border-r border-white/5 p-1.5 text-left text-[10px] font-black uppercase text-white/40 shrink-0" style={{ left: '40px', width: '60px', minWidth: '60px' }}>Tipo</th>
                        <th className="sticky top-0 z-30 bg-neutral-950 border-b border-r border-white/5 p-1.5 text-left text-[10px] font-black uppercase text-white/40 shrink-0" style={{ left: '100px', width: '85px', minWidth: '85px' }}>Distretto</th>
                        <th className="sticky top-0 z-30 bg-neutral-950 border-b border-r border-white/5 p-1.5 text-left text-[10px] font-black uppercase text-white/40 shrink-0" style={{ left: '185px', width: '100px', minWidth: '100px' }}>Progressione</th>
                        <th className="sticky top-0 z-30 bg-neutral-950 border-b border-r border-white/5 p-1.5 text-left text-[10px] font-black uppercase text-white/40 shrink-0" style={{ left: '285px', width: '175px', minWidth: '175px' }}>Esercizio</th>
                        <th className="sticky top-0 z-30 bg-neutral-950 border-b border-r border-white/5 p-1.5 text-center text-[10px] font-black uppercase text-white/40 shrink-0" style={{ left: '460px', width: '60px', minWidth: '60px' }}>T.U.T.</th>
                        
                        {weeks.map((w) => {
                          const isSelected = w.weekIndex === activeWeekIndex;
                          return (
                            <th 
                              id={`week-col-header-${w.weekIndex}`}
                              key={w.weekIndex} 
                              colSpan={3} 
                              className={`sticky top-0 border-b border-r border-white/5 p-1 text-center text-[10px] uppercase tracking-wider font-extrabold transition-all duration-350 ${isSelected ? 'z-20' : 'z-10'}`}
                              style={{ 
                                borderColor: isSelected ? config.primaryColor : undefined,
                                color: isSelected ? config.primaryColor : undefined,
                                backgroundColor: isSelected ? `${config.primaryColor}15` : '#0a0a0a'
                              }}
                            >
                              W{w.weekIndex}
                            </th>
                          );
                        })}
                        
                        <th className="sticky top-0 z-10 bg-neutral-950 border-b border-r border-white/5 p-1.5 text-center text-[10px] font-black uppercase text-white/40 w-20">Recupero</th>
                        <th className="sticky top-0 z-10 bg-neutral-950 border-b border-r border-white/5 p-1.5 text-left text-[10px] font-black uppercase text-white/40 w-36">Note</th>
                        <th className="sticky top-0 z-10 bg-neutral-950 border-b border-white/5 p-1.5 text-center text-[10px] font-black uppercase text-white/40 w-10"></th>
                      </tr>
                      <tr>
                        {/* Subelement alignment placeholders */}
                        <th className="sticky top-[32px] left-0 z-30 bg-neutral-950 border-b border-r border-white/5 p-1 w-10" style={{ left: '0px', width: '40px', minWidth: '40px' }}></th>
                        <th className="sticky top-[32px] z-30 bg-neutral-950 border-b border-r border-white/5 p-1 w-[60px]" style={{ left: '40px', width: '60px', minWidth: '60px' }}></th>
                        <th className="sticky top-[32px] z-30 bg-neutral-950 border-b border-r border-white/5 p-1 w-[85px]" style={{ left: '100px', width: '85px', minWidth: '85px' }}></th>
                        <th className="sticky top-[32px] z-30 bg-neutral-950 border-b border-r border-white/5 p-1 w-[100px]" style={{ left: '185px', width: '100px', minWidth: '100px' }}></th>
                        <th className="sticky top-[32px] z-30 bg-neutral-950 border-b border-r border-white/5 p-1 w-[175px]" style={{ left: '285px', width: '175px', minWidth: '175px' }}></th>
                        <th className="sticky top-[32px] z-30 bg-neutral-950 border-b border-r border-white/5 p-1 w-[60px]" style={{ left: '460px', width: '60px', minWidth: '60px' }}></th>
                        
                        {weeks.map((w) => {
                          const isSelected = w.weekIndex === activeWeekIndex;
                          const baseClass = isSelected ? 'bg-neutral-900 text-white/90' : 'bg-neutral-950/20 text-white/40';
                          return (
                            <React.Fragment key={w.weekIndex}>
                              <th 
                                className={`sticky top-[32px] border-b border-r border-white/5 p-0.5 text-center text-[8px] font-black uppercase ${baseClass}`}
                                style={{ 
                                  backgroundColor: isSelected ? `${config.primaryColor}10` : undefined,
                                  color: isSelected ? config.primaryColor : undefined
                                }}
                              >
                                SET
                              </th>
                              <th 
                                className={`sticky top-[32px] border-b border-r border-white/5 p-0.5 text-center text-[8px] font-black uppercase ${baseClass}`}
                                style={{ 
                                  backgroundColor: isSelected ? `${config.primaryColor}10` : undefined,
                                  color: isSelected ? config.primaryColor : undefined
                                }}
                              >
                                REPS
                              </th>
                              <th 
                                className={`sticky top-[32px] border-b border-r border-white/5 p-0.5 text-center text-[8px] font-black uppercase ${baseClass}`}
                                style={{ 
                                  backgroundColor: isSelected ? `${config.primaryColor}10` : undefined,
                                  color: isSelected ? config.primaryColor : undefined
                                }}
                              >
                                INFO
                              </th>
                            </React.Fragment>
                          );
                        })}
                        
                        <th className="sticky top-[32px] z-10 bg-neutral-950 border-b border-r border-white/5 p-1 w-20"></th>
                        <th className="sticky top-[32px] z-10 bg-neutral-950 border-b border-r border-white/5 p-1 w-36"></th>
                        <th className="sticky top-[32px] z-10 bg-neutral-950 border-b border-white/5 p-1 w-10"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {(() => {
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
                          const isGroupLeader = isInGroup && (exIdx === 0 || day.esercizi[exIdx - 1]?.groupId !== ex.groupId);
                          
                          const groupIndex = ex.groupId ? uniqueGroupIds.indexOf(ex.groupId) : -1;
                          const memberLabel = groupIndex !== -1 && ex.groupOrder !== undefined ? getGroupMemberLabel(groupIndex, ex.groupOrder) : '';

                          return (
                            <tr 
                              key={ex.id} 
                              className={`border-b border-white/5 hover:bg-white/[0.02] transition-colors ${isInGroup ? 'bg-[#CCFF00]/5' : ''}`}
                              style={{ backgroundColor: isInGroup ? `${config.primaryColor}05` : undefined }}
                            >
                              {/* Number Col */}
                              <td 
                                className="sticky left-0 z-10 bg-neutral-950 border-r border-white/5 py-1 px-1.5 text-center text-xs font-mono font-bold text-white/50 relative"
                                style={{ left: '0px', width: '40px', minWidth: '40px' }}
                              >
                                {isInGroup && (
                                  <span className="absolute left-0 top-0 bottom-0 w-1" style={{ backgroundColor: config.primaryColor }} />
                                )}
                                {exIdx + 1}
                              </td>

                              {/* Tipo Col */}
                              <td 
                                className="sticky z-10 bg-neutral-950 border-r border-white/5 py-1 px-1"
                                style={{ left: '40px', width: '60px', minWidth: '60px' }}
                              >
                                <div className="bg-black/40 px-1 py-0 rounded border border-white/5 hover:border-white/25 transition-all">
                                  <select 
                                    value={ex.indicazioniEsecuzione || 'Base'} 
                                    onChange={(e) => handleUpdateExParam(day.id, ex.id, 'indicazioniEsecuzione', e.target.value)}
                                    className="bg-transparent text-[9px] font-black text-white/80 uppercase focus:outline-none cursor-pointer w-full text-center h-5"
                                  >
                                    <option value="Base" className="bg-neutral-950 text-white font-bold">Base</option>
                                    <option value="Compl." className="bg-neutral-950 text-white font-bold">Compl.</option>
                                    <option value="Isol." className="bg-neutral-950 text-white font-bold">Isol.</option>
                                  </select>
                                </div>
                              </td>

                              {/* Distretto Col */}
                              <td 
                                className="sticky z-10 bg-neutral-950 border-r border-white/5 py-1 px-1"
                                style={{ left: '100px', width: '85px', minWidth: '85px' }}
                              >
                                <div className="bg-black/40 px-1 py-0 rounded border border-white/5 hover:border-white/25 transition-all">
                                  <select 
                                    value={ex.distrettoMuscolare} 
                                    onChange={(e) => handleUpdateExParam(day.id, ex.id, 'distrettoMuscolare', e.target.value)}
                                    className="bg-transparent text-[9px] font-bold text-white/60 focus:outline-none cursor-pointer w-full text-center h-5"
                                  >
                                    <option value="Pettorali" className="bg-neutral-950 text-white">Pettorali</option>
                                    <option value="Dorso" className="bg-neutral-950 text-white">Dorso</option>
                                    <option value="Spalle" className="bg-neutral-950 text-white">Spalle</option>
                                    <option value="Deltoidi anteriori" className="bg-neutral-950 text-white">D. ant.</option>
                                    <option value="Deltoidi laterali" className="bg-neutral-950 text-white">D. lat.</option>
                                    <option value="Deltoidi posteriori" className="bg-neutral-950 text-white">D. post.</option>
                                    <option value="Bicipiti" className="bg-neutral-950 text-white">Bicipiti</option>
                                    <option value="Tricipiti" className="bg-neutral-950 text-white">Tricipiti</option>
                                    <option value="Quadricipiti" className="bg-neutral-950 text-white">Quadricipiti</option>
                                    <option value="Femorali" className="bg-neutral-950 text-white">Femorali</option>
                                    <option value="Glutei" className="bg-neutral-950 text-white">Glutei</option>
                                    <option value="Adduttori" className="bg-neutral-950 text-white">Adduttori</option>
                                    <option value="Abduttori" className="bg-neutral-950 text-white">Abduttori</option>
                                    <option value="Polpacci" className="bg-neutral-950 text-white">Polpacci</option>
                                    <option value="Addome" className="bg-neutral-950 text-white">Addome</option>
                                  </select>
                                </div>
                              </td>

                              {/* Progressione Col */}
                              <td 
                                className="sticky z-10 bg-neutral-950 border-r border-white/5 py-1 px-1"
                                style={{ left: '185px', width: '100px', minWidth: '100px' }}
                              >
                                <div className="bg-black/40 px-1 py-0 rounded border border-white/5 hover:border-white/25 transition-all">
                                  <select
                                    value={ex.tecnicaIntensita || 'Nessuna'}
                                    onChange={(e) => handleUpdateExParam(day.id, ex.id, 'tecnicaIntensita', e.target.value)}
                                    className="bg-transparent text-[9px] font-bold text-white/80 focus:outline-none cursor-pointer w-full text-center h-5"
                                  >
                                    <option value="Nessuna" className="bg-neutral-950 text-white">Standard</option>
                                    <option value="Top set" className="bg-neutral-950 text-white">Top set</option>
                                    <option value="Back-off" className="bg-neutral-950 text-white">Back-off</option>
                                    <option value="Drop set" className="bg-neutral-950 text-white">Drop set</option>
                                    <option value="Rest pause" className="bg-neutral-950 text-white">Rest pause</option>
                                    <option value="Myo-reps" className="bg-neutral-950 text-white">Myo-reps</option>
                                    <option value="Cluster set" className="bg-neutral-950 text-white">Cluster set</option>
                                  </select>
                                </div>
                              </td>

                              {/* Esercizio Col */}
                              <td 
                                className="sticky z-10 bg-neutral-950 border-r border-white/5 py-1 px-2"
                                style={{ left: '285px', width: '175px', minWidth: '175px' }}
                              >
                                <div className="flex flex-col gap-1">
                                  {groupSelectionDayId === day.id && (() => {
                                    const isCompoundSetDisabled = (() => {
                                      if (groupSelectionType !== 'compound_set') return false;
                                      if (selectedExerciseIds.length !== 1) return false;
                                      const firstSelectedEx = day.esercizi.find(e => e.id === selectedExerciseIds[0]);
                                      if (!firstSelectedEx) return false;
                                      return ex.distrettoMuscolare !== firstSelectedEx.distrettoMuscolare;
                                    })();

                                    const isJumpsetDisabled = (() => {
                                      if (groupSelectionType !== 'jumpset') return false;
                                      if (selectedExerciseIds.length !== 1) return false;
                                      const firstSelectedEx = day.esercizi.find(e => e.id === selectedExerciseIds[0]);
                                      if (!firstSelectedEx) return false;
                                      return ex.distrettoMuscolare === firstSelectedEx.distrettoMuscolare;
                                    })();

                                    return (
                                      <div className="flex items-center gap-2 mb-1 animate-fadeIn">
                                        <input
                                          type="checkbox"
                                          checked={selectedExerciseIds.includes(ex.id)}
                                          disabled={isInGroup || isCompoundSetDisabled || isJumpsetDisabled || (selectedExerciseIds.length >= getRequiredGroupMemberCount(groupSelectionType) && !selectedExerciseIds.includes(ex.id))}
                                          onChange={(e) => {
                                            const maxCount = getRequiredGroupMemberCount(groupSelectionType);
                                            if (e.target.checked) {
                                              if (selectedExerciseIds.length < maxCount) {
                                                setSelectedExerciseIds(prev => [...prev, ex.id]);
                                              }
                                            } else {
                                              setSelectedExerciseIds(prev => prev.filter(id => id !== ex.id));
                                            }
                                          }}
                                          className="h-3.5 w-3.5 rounded border-white/20 bg-black text-[#CCFF00] focus:ring-0 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                          style={{ accentColor: config.primaryColor }}
                                          aria-label={`Seleziona ${ex.nome} per ${groupSelectionType ? EXERCISE_GROUP_LABELS[groupSelectionType] : ''}`}
                                        />
                                        {isInGroup && (
                                          <span className="text-[10px] text-red-400 font-medium">
                                            Questo esercizio appartiene già a un gruppo.
                                          </span>
                                        )}
                                        {isCompoundSetDisabled && (
                                          <span className="text-[10px] text-red-400 font-medium leading-tight">
                                            Il Compound Set richiede esercizi dello stesso distretto muscolare.
                                          </span>
                                        )}
                                        {isJumpsetDisabled && (
                                          <span className="text-[10px] text-red-400 font-medium leading-tight">
                                            Il Jumpset richiede due distretti muscolari differenti.
                                          </span>
                                        )}
                                      </div>
                                    );
                                  })()}

                                  <div className="flex items-center gap-1 font-extrabold text-white text-xs" title={ex.nome}>
                                    {groupIndex !== -1 && (
                                      <div className="flex flex-wrap items-center gap-1 mr-1 shrink-0">
                                        <span className="px-1 py-0.5 rounded text-[9px] font-mono font-black text-neutral-950" style={{ backgroundColor: config.primaryColor }}>
                                          {memberLabel}
                                        </span>
                                        <span className="px-1 py-0.5 rounded text-[8px] font-black uppercase text-white/90 border" style={{ borderColor: `${config.primaryColor}50`, backgroundColor: `${config.primaryColor}15` }}>
                                          {normalizeExerciseGroupType(ex.groupType) === 'triset' 
                                            ? 'Triset' 
                                            : normalizeExerciseGroupType(ex.groupType) === 'compound_set' 
                                              ? 'Compound Set' 
                                              : normalizeExerciseGroupType(ex.groupType) === 'giant_set'
                                                ? 'Giant Set'
                                                : normalizeExerciseGroupType(ex.groupType) === 'jumpset'
                                                  ? 'Jumpset'
                                                  : normalizeExerciseGroupType(ex.groupType) === 'circuit'
                                                    ? 'Circuito'
                                                    : 'Superset'}
                                        </span>
                                        {(normalizeExerciseGroupType(ex.groupType) === 'superset' || normalizeExerciseGroupType(ex.groupType) === 'triset' || normalizeExerciseGroupType(ex.groupType) === 'compound_set' || normalizeExerciseGroupType(ex.groupType) === 'giant_set' || normalizeExerciseGroupType(ex.groupType) === 'jumpset' || normalizeExerciseGroupType(ex.groupType) === 'circuit') && ex.groupOrder === 1 && (() => {
                                          const normEx = normalizeExerciseGroupData(ex);
                                          const restBetween = normEx.groupRestBetweenExercisesSec ?? 0;
                                          const restAfter = normEx.groupRestAfterRoundSec ?? 90;
                                          const rounds = normEx.groupRounds ?? 1;
                                          const isJumpsetGroup = normalizeExerciseGroupType(ex.groupType) === 'jumpset';
                                          const isCircuitGroup = normalizeExerciseGroupType(ex.groupType) === 'circuit';
                                          const nextLabel = getGroupMemberLabel(groupIndex, 2);
                                          return (
                                            <div className="flex flex-col gap-0.5 max-w-[200px] sm:max-w-xs">
                                              <span className="text-[9px] text-[#CCFF00]/90 font-bold bg-neutral-900 border border-[#CCFF00]/25 px-1.5 py-0.5 rounded-md w-fit" style={{ color: config.primaryColor, borderColor: `${config.primaryColor}40` }}>
                                                {isJumpsetGroup 
                                                  ? `${restBetween}s tra ${memberLabel} e ${nextLabel} • ${restAfter}s dopo • ${rounds} ${rounds === 1 ? 'giro' : 'giri'}`
                                                  : isCircuitGroup
                                                    ? `${restBetween}s tra le stazioni • ${restAfter}s dopo il giro • ${rounds} ${rounds === 1 ? 'giro' : 'giri'}`
                                                    : `${restBetween}s tra esercizi • ${restAfter}s dopo • ${rounds} ${rounds === 1 ? 'giro' : 'giri'}`}
                                              </span>
                                              {isJumpsetGroup && (
                                                <span className="text-[9px] text-white/50 font-normal italic leading-snug">
                                                  Alterna {memberLabel} e {nextLabel} rispettando il recupero indicato.
                                                </span>
                                              )}
                                              {isCircuitGroup && (
                                                <span className="text-[9px] text-white/50 font-normal italic leading-snug">
                                                  Esegui le stazioni in sequenza.
                                                </span>
                                              )}
                                            </div>
                                          );
                                        })()}
                                      </div>
                                    )}
                                    <span className="line-clamp-2 leading-tight break-words">{ex.nome}</span>
                                    {ex.linkVideo && (
                                      <a href={ex.linkVideo} target="_blank" rel="noreferrer" className="text-red-400 hover:text-red-300 ml-0.5 shrink-0">
                                        <Video className="w-3 h-3" />
                                      </a>
                                    )}
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => handleOpenBlocksManager(day.id, ex.id)}
                                    className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-white/5 hover:bg-white/10 text-[9px] font-bold text-white/60 hover:text-white transition-all cursor-pointer border border-white/5 w-fit"
                                  >
                                    <Layers className="w-2.5 h-2.5 text-[#CCFF00]" style={{ color: config.primaryColor }} />
                                    <span>{ex.blocks && ex.blocks.length > 0 ? `Blocchi (${ex.blocks.length})` : 'Gestisci blocchi'}</span>
                                  </button>
                                </div>
                              </td>

                            {/* TUT Col */}
                            <td 
                              className="sticky z-10 bg-neutral-950 border-r border-white/5 py-1 px-1 text-center"
                              style={{ left: '460px', width: '60px', minWidth: '60px' }}
                            >
                              <input
                                type="text"
                                value={ex.tut || ''}
                                onChange={(e) => handleUpdateExParam(day.id, ex.id, 'tut', e.target.value)}
                                className="w-12 bg-transparent border-b border-white/10 text-white font-mono text-[10px] text-center focus:outline-none focus:border-white"
                                placeholder="3-0-1-0"
                              />
                            </td>

                            {/* Weeks Columns */}
                            {weeks.map((w) => {
                              const isSelected = w.weekIndex === activeWeekIndex;
                              const targetWeekObj = weeks.find(wk => wk.weekIndex === w.weekIndex);
                              const targetDayObj = day.programDayId 
                                ? targetWeekObj?.giornate.find(d => d.programDayId === day.programDayId)
                                : targetWeekObj?.giornate[dIdx];
                              const targetEx = ex.programRowId
                                ? targetDayObj?.esercizi.find(e => e.programRowId === ex.programRowId)
                                : (exIdx !== undefined ? targetDayObj?.esercizi[exIdx] : undefined);

                              const bgStyle = isSelected 
                                ? { backgroundColor: `${config.primaryColor}06` } 
                                : undefined;

                              if (!targetEx) {
                                return (
                                  <React.Fragment key={w.weekIndex}>
                                    <td style={bgStyle} className="border-r border-white/5 p-1 text-center text-xs text-white/10">-</td>
                                    <td style={bgStyle} className="border-r border-white/5 p-1 text-center text-xs text-white/10">-</td>
                                    <td style={bgStyle} className="border-r border-white/5 p-1 text-center text-xs text-white/10">-</td>
                                  </React.Fragment>
                                );
                              }

                              const hasBlocks = targetEx.blocks && targetEx.blocks.length > 0;

                              if (hasBlocks) {
                                return (
                                  <React.Fragment key={w.weekIndex}>
                                    {/* SET Sub-cell with blocks */}
                                    <td style={bgStyle} className="border-r border-white/5 p-1 text-center">
                                      <div className="flex flex-col justify-center items-center gap-1">
                                        {targetEx.blocks!.map((b, idx) => (
                                          <div key={b.id || idx} className="h-6 flex items-center justify-center font-mono text-[11px] font-black text-white/85">
                                            {b.serie}s
                                          </div>
                                        ))}
                                      </div>
                                    </td>

                                    {/* REPS Sub-cell with blocks */}
                                    <td style={bgStyle} className="border-r border-white/5 p-1">
                                      <div className="flex flex-col justify-center items-center gap-1">
                                        {targetEx.blocks!.map((b, idx) => (
                                          <div key={b.id || idx} className="h-6 flex items-center justify-center gap-0.5 text-[10px] font-mono font-bold text-white">
                                            {b.repMin === b.repMax ? b.repMin : `${b.repMin}–${b.repMax}`}
                                          </div>
                                        ))}
                                      </div>
                                    </td>

                                    {/* INFO Sub-cell with blocks */}
                                    <td style={bgStyle} className="border-r border-white/5 p-1">
                                      <div className="flex flex-col justify-center items-center gap-1">
                                        {targetEx.blocks!.map((b, idx) => {
                                          const rirText = b.rir !== undefined ? `RIR ${b.rir}` : '';
                                          const label = b.nome || `Blocco ${idx + 1}`;
                                          const infoStr = [label, rirText].filter(Boolean).join(' · ');
                                          return (
                                            <div key={b.id || idx} className="h-6 flex items-center justify-center text-[9px] font-mono text-white/85 w-full px-0.5 truncate text-center" title={infoStr}>
                                              {infoStr}
                                            </div>
                                          );
                                        })}
                                      </div>
                                    </td>
                                  </React.Fragment>
                                );
                              }

                              const numSets = targetEx.serie || 1;
                              const infoText = targetEx.noteSpecificheSettimana || '';
                              const infoLines = infoText.split('\n');
                              while (infoLines.length < numSets) {
                                infoLines.push(targetEx.rir !== undefined ? `RIR ${targetEx.rir}` : '');
                              }

                              const handleUpdateInfoLine = (idx: number, newVal: string) => {
                                const updatedLines = [...infoLines];
                                updatedLines[idx] = newVal;
                                const combined = updatedLines.slice(0, numSets).join('\n');
                                handleUpdateExParamAtWeek(w.weekIndex, targetDayObj.id, targetEx.id, 'noteSpecificheSettimana', combined);
                              };

                              return (
                                <React.Fragment key={w.weekIndex}>
                                  {/* SET Sub-cell */}
                                  <td style={bgStyle} className="border-r border-white/5 p-1 text-center">
                                    <div className="flex flex-col justify-center items-center gap-1">
                                      {Array.from({ length: numSets }).map((_, idx) => (
                                        <div key={idx} className="h-6 flex items-center justify-center font-mono text-[11px] font-black text-white/85">
                                          {idx + 1}
                                        </div>
                                      ))}
                                      {/* Tiny control to add/reduce sets */}
                                      <div className="flex items-center gap-1 mt-1 shrink-0 bg-black/40 border border-white/5 rounded px-1 py-0.5 select-none">
                                        <button
                                          type="button"
                                          onClick={() => handleUpdateExParamAtWeek(w.weekIndex, targetDayObj.id, targetEx.id, 'serie', Math.max(1, targetEx.serie - 1))}
                                          className="text-[9px] font-bold text-white/40 hover:text-white px-0.5 cursor-pointer"
                                        >
                                          -
                                        </button>
                                        <span className="text-[9px] font-bold text-white/80 px-0.5">{targetEx.serie}s</span>
                                        <button
                                          type="button"
                                          onClick={() => handleUpdateExParamAtWeek(w.weekIndex, targetDayObj.id, targetEx.id, 'serie', targetEx.serie + 1)}
                                          className="text-[9px] font-bold text-white/40 hover:text-white px-0.5 cursor-pointer"
                                        >
                                          +
                                        </button>
                                      </div>
                                    </div>
                                  </td>

                                  {/* REPS Sub-cell */}
                                  <td style={bgStyle} className="border-r border-white/5 p-1">
                                    <div className="flex flex-col justify-center items-center gap-1">
                                      {Array.from({ length: numSets }).map((_, idx) => (
                                        <div key={idx} className="h-6 flex items-center justify-center gap-0.5 text-[10px]">
                                          <input
                                            type="number"
                                            min="1"
                                            value={targetEx.repMin}
                                            onChange={(e) => handleUpdateExParamAtWeek(w.weekIndex, targetDayObj.id, targetEx.id, 'repMin', Number(e.target.value))}
                                            className="w-5 bg-transparent text-center border-b border-white/10 font-bold text-white focus:outline-none"
                                          />
                                          <span className="text-white/20">-</span>
                                          <input
                                            type="number"
                                            min="1"
                                            value={targetEx.repMax}
                                            onChange={(e) => handleUpdateExParamAtWeek(w.weekIndex, targetDayObj.id, targetEx.id, 'repMax', Number(e.target.value))}
                                            className="w-5 bg-transparent text-center border-b border-white/10 font-bold text-white focus:outline-none"
                                          />
                                        </div>
                                      ))}
                                    </div>
                                  </td>

                                  {/* INFO Sub-cell */}
                                  <td style={bgStyle} className="border-r border-white/5 p-1">
                                    <div className="flex flex-col justify-center items-center gap-1">
                                      {Array.from({ length: numSets }).map((_, idx) => (
                                        <div key={idx} className="h-6 flex items-center justify-center text-[10px] w-full px-0.5">
                                          <input
                                            type="text"
                                            value={infoLines[idx]}
                                            onChange={(e) => handleUpdateInfoLine(idx, e.target.value)}
                                            className="w-full bg-transparent text-center border-b border-white/10 text-white/85 focus:outline-none text-[9px] font-mono"
                                            placeholder={`Set ${idx + 1}`}
                                          />
                                        </div>
                                      ))}
                                    </div>
                                  </td>
                                </React.Fragment>
                              );
                            })}

                            {/* Recupero Col */}
                            <td className="border-r border-white/5 p-1.5 text-center">
                              <div className="flex items-center justify-center gap-0.5 text-xs">
                                <input
                                  type="number"
                                  min="0"
                                  step="15"
                                  value={ex.recupero}
                                  onChange={(e) => handleUpdateExParam(day.id, ex.id, 'recupero', Number(e.target.value))}
                                  className="w-8 bg-transparent text-center border-b border-white/10 text-white font-mono text-[11px] focus:outline-none"
                                />
                                <span className="text-white/30 text-[9px] font-mono">s</span>
                              </div>
                            </td>

                            {/* Note Col */}
                            <td className="border-r border-white/5 p-1.5">
                              <input
                                type="text"
                                placeholder="Note tecniche..."
                                value={ex.noteTecniche || ''}
                                onChange={(e) => handleUpdateExParam(day.id, ex.id, 'noteTecniche', e.target.value)}
                                className="w-full bg-transparent border-b border-white/10 text-white text-[10px] placeholder-white/20 focus:outline-none py-0.5 truncate"
                              />
                            </td>

                            {/* Actions Col */}
                            <td className="p-1.5 text-center relative">
                              <button
                                type="button"
                                onClick={() => setActiveActionMenuExId(activeActionMenuExId === `ex_${ex.id}` ? null : `ex_${ex.id}`)}
                                className="p-1 rounded hover:bg-white/5 text-white/40 hover:text-white cursor-pointer"
                              >
                                <MoreHorizontal className="w-4 h-4" />
                              </button>
                              
                              {activeActionMenuExId === `ex_${ex.id}` && (
                                <div className="absolute right-0 mt-1 w-44 bg-neutral-900 border border-white/10 rounded-xl shadow-2xl z-35 overflow-hidden py-1 text-left">
                                  {/* SuperSet Toggle */}
                                  {exIdx < day.esercizi.length - 1 && !isInGroup && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        handleGroupWithNext(day.id, exIdx);
                                        setActiveActionMenuExId(null);
                                      }}
                                      className="w-full px-3 py-1.5 text-[11px] text-white/70 hover:text-white hover:bg-white/5 flex items-center gap-1.5"
                                    >
                                      <Link className="w-3.5 h-3.5" style={{ color: config.primaryColor }} />
                                      <span>Unisci in Super Set</span>
                                    </button>
                                  )}
                                  {ex.groupId && normalizeExerciseGroupType(ex.groupType) === 'superset' && (
                                    <>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          handleDissolveSuperset(day.id, ex.groupId!);
                                          setActiveActionMenuExId(null);
                                        }}
                                        className="w-full px-3 py-1.5 text-[11px] text-white/70 hover:text-red-400 hover:bg-white/5 flex items-center gap-1.5"
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
                                        className="w-full px-3 py-1.5 text-[11px] text-white/70 hover:text-white hover:bg-white/5 flex items-center gap-1.5"
                                      >
                                        <Settings className="w-3.5 h-3.5" style={{ color: config.primaryColor }} />
                                        <span>Impostazioni Superset</span>
                                      </button>
                                    </>
                                  )}

                                  {ex.groupId && normalizeExerciseGroupType(ex.groupType) === 'triset' && (
                                    <>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          handleDissolveTriset(day.id, ex.groupId!);
                                          setActiveActionMenuExId(null);
                                        }}
                                        className="w-full px-3 py-1.5 text-[11px] text-white/70 hover:text-red-400 hover:bg-white/5 flex items-center gap-1.5"
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
                                        className="w-full px-3 py-1.5 text-[11px] text-white/70 hover:text-white hover:bg-white/5 flex items-center gap-1.5"
                                      >
                                        <Settings className="w-3.5 h-3.5" style={{ color: config.primaryColor }} />
                                        <span>Impostazioni Triset</span>
                                      </button>
                                    </>
                                  )}

                                  {ex.groupId && normalizeExerciseGroupType(ex.groupType) === 'compound_set' && (
                                    <>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          handleDissolveCompoundSet(day.id, ex.groupId!);
                                          setActiveActionMenuExId(null);
                                        }}
                                        className="w-full px-3 py-1.5 text-[11px] text-white/70 hover:text-red-400 hover:bg-white/5 flex items-center gap-1.5"
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
                                        className="w-full px-3 py-1.5 text-[11px] text-white/70 hover:text-white hover:bg-white/5 flex items-center gap-1.5"
                                      >
                                        <Settings className="w-3.5 h-3.5" style={{ color: config.primaryColor }} />
                                        <span>Impostazioni Compound Set</span>
                                      </button>
                                    </>
                                  )}

                                  {ex.groupId && normalizeExerciseGroupType(ex.groupType) === 'giant_set' && (
                                    <>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          handleDissolveGiantSet(day.id, ex.groupId!);
                                          setActiveActionMenuExId(null);
                                        }}
                                        className="w-full px-3 py-1.5 text-[11px] text-white/70 hover:text-red-400 hover:bg-white/5 flex items-center gap-1.5"
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
                                        className="w-full px-3 py-1.5 text-[11px] text-white/70 hover:text-white hover:bg-white/5 flex items-center gap-1.5"
                                      >
                                        <Settings className="w-3.5 h-3.5" style={{ color: config.primaryColor }} />
                                        <span>Impostazioni Giant Set</span>
                                      </button>
                                    </>
                                  )}

                                  {ex.groupId && normalizeExerciseGroupType(ex.groupType) === 'jumpset' && (
                                    <>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          handleDissolveJumpset(day.id, ex.groupId!);
                                          setActiveActionMenuExId(null);
                                        }}
                                        className="w-full px-3 py-1.5 text-[11px] text-white/70 hover:text-red-400 hover:bg-white/5 flex items-center gap-1.5"
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
                                        className="w-full px-3 py-1.5 text-[11px] text-white/70 hover:text-white hover:bg-white/5 flex items-center gap-1.5"
                                      >
                                        <Settings className="w-3.5 h-3.5" style={{ color: config.primaryColor }} />
                                        <span>Impostazioni Jumpset</span>
                                      </button>
                                    </>
                                  )}

                                  {ex.groupId && normalizeExerciseGroupType(ex.groupType) === 'circuit' && (
                                    <>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          handleDissolveCircuit(day.id, ex.groupId!);
                                          setActiveActionMenuExId(null);
                                        }}
                                        className="w-full px-3 py-1.5 text-[11px] text-white/70 hover:text-red-400 hover:bg-white/5 flex items-center gap-1.5"
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
                                        className="w-full px-3 py-1.5 text-[11px] text-white/70 hover:text-white hover:bg-white/5 flex items-center gap-1.5"
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
                                    className="w-full px-3 py-1.5 text-[11px] text-white/70 hover:text-white hover:bg-white/5 disabled:opacity-30 flex items-center gap-1.5"
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
                                    className="w-full px-3 py-1.5 text-[11px] text-white/70 hover:text-white hover:bg-white/5 disabled:opacity-30 flex items-center gap-1.5"
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
                                    className="w-full px-3 py-1.5 text-[11px] text-white/70 hover:text-white hover:bg-white/5 flex items-center gap-1.5"
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
                                    className="w-full px-3 py-1.5 text-[11px] text-red-400 hover:bg-white/5 flex items-center gap-1.5 border-t border-white/5 mt-1"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    <span>Rimuovi</span>
                                  </button>
                                </div>
                              )}
                            </td>

                          </tr>
                        );
                      });
                    })()}
                      
                      {/* --- RIGHE FINALI: TOTALE SERIE --- */}
                      <tr className="bg-neutral-950 font-bold border-t border-white/10">
                        <td 
                          colSpan={6} 
                          className="sticky left-0 bg-neutral-950 z-10 text-right pr-4 py-2 text-[10px] font-black uppercase text-white/40 border-r border-white/5"
                          style={{ left: '0px', width: '520px', minWidth: '520px' }}
                        >
                          TOTALE SERIE
                        </td>
                        {weeks.map((w) => {
                          const targetWeekObj = weeks.find(wk => wk.weekIndex === w.weekIndex);
                          const totalSetsForWeekDay = targetWeekObj?.giornate[dIdx]?.esercizi.reduce((sum, e) => {
                            const sets = e.blocks && e.blocks.length > 0
                              ? e.blocks.reduce((bSum, b) => bSum + Number(b.serie || 0), 0)
                              : Number(e.serie || 0);
                            return sum + sets;
                          }, 0) || 0;
                          const isSelected = w.weekIndex === activeWeekIndex;
                          const bgStyle = isSelected 
                            ? { backgroundColor: `${config.primaryColor}06` } 
                            : undefined;
                          return (
                            <td 
                              key={w.weekIndex} 
                              colSpan={3} 
                              style={bgStyle}
                              className="text-center font-black text-xs text-white py-2 border-r border-white/5"
                            >
                              <span style={{ color: isSelected ? config.primaryColor : undefined }}>
                                {totalSetsForWeekDay} s
                              </span>
                            </td>
                          );
                        })}
                        <td colSpan={3} className="border-r border-white/5"></td>
                      </tr>

                      {/* --- RIGHE FINALI: SETTIMANA DI RIFERIMENTO --- */}
                      <tr className="bg-neutral-950 text-[10px] border-t border-white/5">
                        <td 
                          colSpan={6} 
                          className="sticky left-0 bg-neutral-950 z-10 text-right pr-4 py-2 text-[9px] font-bold uppercase text-white/30 border-r border-white/5"
                          style={{ left: '0px', width: '520px', minWidth: '520px' }}
                        >
                          SETTIMANA DI RIFERIMENTO
                        </td>
                        {weeks.map((w) => {
                          const isSelected = w.weekIndex === activeWeekIndex;
                          const bgStyle = isSelected 
                            ? { backgroundColor: `${config.primaryColor}04` } 
                            : undefined;
                          
                          // Calculate dates
                          let dateRangeStr = `Sett ${w.weekIndex}`;
                          if (planDataInizio) {
                            const startDate = new Date(planDataInizio);
                            if (!isNaN(startDate.getTime())) {
                              const wStart = new Date(startDate);
                              wStart.setDate(startDate.getDate() + (w.weekIndex - 1) * 7);
                              const wEnd = new Date(wStart);
                              wEnd.setDate(wStart.getDate() + 6);
                              const formatDigit = (n: number) => n.toString().padStart(2, '0');
                              dateRangeStr = `${formatDigit(wStart.getDate())}/${formatDigit(wStart.getMonth() + 1)}–${formatDigit(wEnd.getDate())}/${formatDigit(wEnd.getMonth() + 1)}`;
                            }
                          }

                          return (
                            <td 
                              key={w.weekIndex} 
                              colSpan={3} 
                              style={bgStyle}
                              className="text-center font-bold text-[9px] font-mono text-white/40 py-2 border-r border-white/5"
                            >
                              <span className={isSelected ? 'text-white/60 font-black' : ''}>
                                {dateRangeStr}
                              </span>
                            </td>
                          );
                        })}
                        <td colSpan={3} className="border-r border-white/5"></td>
                      </tr>

                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ))}

          <div className="flex justify-between pt-4">
            <button
              type="button"
              onClick={() => setCurrentStep(2)}
              className="flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-bold uppercase tracking-wider text-white/50 border border-white/5 hover:bg-white/5 transition-all cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              Indietro
            </button>
            <button
              id="wizard-step3-next"
              onClick={() => {
                const hasEx = weeks.some(w => w.giornate.some(g => g.esercizi.length > 0));
                if (!hasEx) {
                  const ignore = window.confirm('Non hai inserito alcun esercizio. Vuoi procedere lo stesso?');
                  if (!ignore) return;
                }
                setCurrentStep(4);
              }}
              className="flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-black uppercase tracking-wider text-neutral-950 transition-all cursor-pointer shadow-md"
              style={{ backgroundColor: config.primaryColor }}
            >
              Avanti (Riepilogo)
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ================= STEP 4: SUMMARY / RECAP ================= */}
      {currentStep === 4 && (
        <div id="wizard-step-4" className="space-y-6">
          <div className="bg-[#121212] border border-white/5 rounded-2xl p-6 space-y-6">
            <div className="border-b border-white/5 pb-4">
              <h2 className="text-base font-extrabold text-white tracking-tight flex items-center gap-2">
                <FileText className="w-5 h-5" style={{ color: config.primaryColor }} />
                Riepilogo Programma d'Allenamento
              </h2>
              <p className="text-xs text-white/40 mt-1">Verifica i parametri finali della programmazione e salva o archivia.</p>
            </div>

            {/* Program Info Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="bg-black/40 p-4 rounded-xl border border-white/5 space-y-1">
                <p className="text-white/30 font-bold uppercase tracking-wider text-[8px]">Atleta Assegnato</p>
                <p className="font-extrabold text-white text-sm">{clientName}</p>
                {selectedClientDetails && (
                  <p className="text-white/40 text-[10px]">{selectedClientDetails.livelloEsperienza} • {selectedClientDetails.eta} anni</p>
                )}
              </div>

              <div className="bg-black/40 p-4 rounded-xl border border-white/5 space-y-1">
                <p className="text-white/30 font-bold uppercase tracking-wider text-[8px]">Nome Programma</p>
                <p className="font-extrabold text-white text-sm">{planNome}</p>
                <p className="text-white/40 text-[10px]">Obiettivo: {planObiettivo}</p>
              </div>

              <div className="bg-black/40 p-4 rounded-xl border border-white/5 space-y-1">
                <p className="text-white/30 font-bold uppercase tracking-wider text-[8px]">Struttura & Stato</p>
                <p className="font-extrabold text-white text-sm">{planDurata} Settimane • {planFrequenza} Sedute/Sett</p>
                <p className="text-[#CCFF00] text-[10px] font-black uppercase tracking-wider">{planStatus}</p>
              </div>
            </div>

            {/* Note generali recap if exists */}
            {planNoteGenerali.trim() && (
              <div className="bg-black/40 p-4 rounded-xl border border-white/5 text-xs space-y-1">
                <p className="text-white/30 font-bold uppercase tracking-wider text-[8px]">Note Generali del Coach</p>
                <p className="text-white/70 leading-relaxed italic">"{planNoteGenerali}"</p>
              </div>
            )}

            {/* Volume Analytics Block */}
            <div className="space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="font-black text-white/50 uppercase tracking-wider text-[9px]">Distribuzione Volumi (Settimana {activeWeekIndex})</span>
                <span className="text-white/40 text-[10px]">Totale: <strong style={{ color: config.primaryColor }}>{totalSets} serie</strong></span>
              </div>

              {totalSets === 0 ? (
                <p className="text-xs text-white/35">Nessuna serie pianificata.</p>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-black/40 p-4 rounded-xl border border-white/5">
                    {Object.entries(muscleSets).map(([muscle, count]) => {
                      const percentage = totalSets > 0 ? ((count || 0) / totalSets) * 100 : 0;
                      return (
                        <div key={muscle} className="space-y-1 text-xs">
                          <div className="flex justify-between font-medium">
                            <span className="text-white/75 font-semibold text-[11px]">{muscle}</span>
                            <span className="text-white/40 text-[10px]">{count} serie ({Math.round(percentage)}%)</span>
                          </div>
                          <div className="w-full bg-black/40 h-1.5 rounded-full overflow-hidden border border-white/5">
                            <div 
                              className="h-full rounded-full transition-all" 
                              style={{ 
                                width: `${percentage}%`,
                                backgroundColor: DISTRICT_COLORS[muscle] || config.primaryColor 
                              }} 
                            />
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
              )}
            </div>

            {/* Complete Plan Preview */}
            <div className="space-y-3 pt-2">
              <h3 className="font-black text-white/50 uppercase tracking-wider text-[9px]">Anteprima Settimana 1</h3>
              
              <div className="space-y-3">
                {((weeks.find(w => w.weekIndex === 1) || activeWeek).giornate).map((day, idx) => (
                  <div key={day.id} className="bg-black/40 p-4 rounded-xl border border-white/5 text-xs space-y-2 text-left">
                    <p className="font-bold text-white border-b border-white/5 pb-1.5 flex justify-between">
                      <span>{day.nome}</span>
                      <span className="text-white/30 font-medium">{day.esercizi.length} esercizi</span>
                    </p>

                    {day.esercizi.length === 0 ? (
                      <p className="text-[11px] text-white/30 italic">Nessun esercizio pianificato.</p>
                    ) : (
                      <div className="divide-y divide-white/5 space-y-2">
                        {day.esercizi.map((ex, exIdx) => {
                          const hasBlocks = ex.blocks && ex.blocks.length > 0;
                          return (
                            <div key={ex.id} className="pt-2 first:pt-0 flex justify-between items-start text-left">
                              <div className="space-y-1.5 flex-1 pr-4">
                                <p className="font-bold text-white text-[12px]">
                                  {exIdx + 1}. {ex.nome} 
                                  {ex.groupId ? <span className="text-[9px] uppercase font-black text-[#CCFF00] ml-1">({ex.groupType})</span> : ''}
                                  {hasBlocks ? (
                                    <span className="text-[10px] text-white/45 ml-2 font-semibold">
                                      (Totale: {ex.serie} serie in {ex.blocks!.length} blocchi)
                                    </span>
                                  ) : ''}
                                </p>
                                
                                {hasBlocks ? (
                                  <div className="space-y-1.5 pl-3 border-l border-white/10 mt-1">
                                    {ex.blocks!.map((b, bIdx) => (
                                      <div key={b.id || bIdx} className="text-[11px] text-white/50 leading-relaxed bg-white/5 p-1.5 rounded-lg border border-white/5">
                                        <div className="flex items-center justify-between">
                                          <span className="font-bold text-white/80">{b.nome}</span>
                                          {b.tecnicaIntensita && b.tecnicaIntensita !== 'Nessuna' ? (
                                            <span className="text-[9px] uppercase font-black px-1.5 py-0.5 rounded bg-[#CCFF00]/10 text-[#CCFF00]" style={{ color: config.primaryColor, backgroundColor: `${config.primaryColor}15` }}>
                                              {b.tecnicaIntensita}
                                            </span>
                                          ) : null}
                                        </div>
                                        <p className="mt-0.5 text-white/60">
                                          {b.serie} {b.serie === 1 ? 'serie' : 'serie'} x {b.repMin}-{b.repMax} rep • RIR {b.rir} • Rec. {b.recupero}s
                                          {b.caricoPrevisto ? ` • Carico: ${b.caricoPrevisto}` : ''}
                                          {b.volumeMultiplier !== undefined && b.volumeMultiplier !== 1 ? ` • Molt. Vol: x${b.volumeMultiplier}` : ''}
                                        </p>
                                        {b.note?.trim() && (
                                          <p className="text-[10px] text-white/35 italic mt-0.5">📝 {b.note}</p>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="text-[11px] text-white/50 leading-relaxed">
                                    {ex.serie} serie x {ex.repMin}-{ex.repMax} rep • RIR {ex.rir} • Rec. {ex.recupero}s 
                                    {ex.tecnicaIntensita && ex.tecnicaIntensita !== 'Nessuna' ? ` • ${ex.tecnicaIntensita}` : ''}
                                    {ex.caricoPrevisto ? ` • Carico: ${ex.caricoPrevisto}` : ''}
                                  </p>
                                )}
                                
                                {ex.noteTecniche && ex.noteTecniche.trim() && (
                                  <p className="text-[10px] text-white/30 italic mt-0.5">💡 {ex.noteTecniche}</p>
                                )}
                              </div>
                              <span className="text-[9px] px-1.5 py-0.5 rounded bg-black/60 border border-white/5 text-white/40 shrink-0 text-center">
                                {ex.distrettoMuscolare}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 pt-4">
            <button
              type="button"
              onClick={() => setCurrentStep(3)}
              className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-xs font-bold uppercase tracking-wider text-white/50 border border-white/5 hover:bg-white/5 transition-all cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              Modifica Esercizi
            </button>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={handleSaveAsTemplate}
                className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-xs font-bold uppercase tracking-wider text-white/80 border border-white/5 hover:bg-white/5 transition-all cursor-pointer"
              >
                <Save className="w-4 h-4" />
                Salva come Modello
              </button>

              <button
                id="btn-save-workout-plan"
                type="button"
                onClick={handleSave}
                className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-xs font-black uppercase tracking-wider text-neutral-950 transition-all cursor-pointer shadow-lg"
                style={{
                  backgroundColor: config.primaryColor,
                  boxShadow: `0 4px 12px ${config.primaryColor}33`
                }}
              >
                <Check className="w-4 h-4" />
                Salva Programma
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= EXERCISE SELECTOR MODAL (FOR STEP 3) ================= */}
      {isExerciseModalOpen && (
        <div id="wizard-exercise-selector-modal" className="fixed inset-0 z-50 bg-neutral-950/90 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-[#121212] border border-white/10 rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
            
            {/* Header */}
            <div className="p-5 border-b border-white/10 flex justify-between items-center shrink-0">
              <h3 className="font-black text-white text-sm uppercase tracking-wider flex items-center gap-2">
                <Dumbbell className="w-4.5 h-4.5" style={{ color: config.primaryColor }} />
                Scegli esercizio da aggiungere
              </h3>
              <button 
                onClick={() => {
                  setIsExerciseModalOpen(false);
                  setTargetDayId(null);
                }}
                className="text-white/40 hover:text-white p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Filters */}
            <div className="p-4 bg-black/20 border-b border-white/5 grid grid-cols-1 sm:grid-cols-3 gap-3 shrink-0 text-xs">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-white/30" />
                <input
                  type="text"
                  placeholder="Cerca per nome..."
                  value={exSearch}
                  onChange={(e) => setExSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-black/40 border border-white/5 rounded-xl text-white placeholder-white/20 focus:outline-none"
                />
              </div>

              <div>
                <select
                  value={exMuscleFilter}
                  onChange={(e) => setExMuscleFilter(e.target.value as DistrettoMuscolare | 'Tutti')}
                  className="w-full px-3 py-2 bg-black/40 border border-white/5 rounded-xl text-white focus:outline-none"
                >
                  <option value="Tutti">Tutti i muscoli</option>
                  <option value="Pettorali">Pettorali</option>
                  <option value="Dorso">Dorso</option>
                  <option value="Spalle">Spalle</option>
                  <option value="Bicipiti">Bicipiti</option>
                  <option value="Tricipiti">Tricipiti</option>
                  <option value="Quadricipiti">Quadricipiti</option>
                  <option value="Femorali">Femorali</option>
                  <option value="Glutei">Glutei</option>
                  <option value="Polpacci">Polpacci</option>
                  <option value="Addome">Addome</option>
                </select>
              </div>

              <div>
                <select
                  value={exEquipmentFilter}
                  onChange={(e) => setExEquipmentFilter(e.target.value)}
                  className="w-full px-3 py-2 bg-black/40 border border-white/5 rounded-xl text-white focus:outline-none"
                >
                  <option value="Tutti">Tutte le attrezzature</option>
                  <option value="Bilanciere">Bilanciere</option>
                  <option value="Manubri">Manubri</option>
                  <option value="Cavi">Cavi</option>
                  <option value="Macchine">Macchine / Isotoniche</option>
                  <option value="Corpo Libero">Corpo Libero / Calisthenics</option>
                </select>
              </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {modalFilteredExercises.length === 0 ? (
                <div className="p-8 text-center text-white/20">
                  Nessun esercizio corrisponde ai filtri.
                </div>
              ) : (
                modalFilteredExercises.map((ex) => (
                  <div
                    key={ex.id}
                    onClick={() => handleSelectExercise(ex)}
                    className="p-3 bg-black/40 border border-white/5 hover:border-white/15 rounded-xl cursor-pointer flex justify-between items-center transition-colors group"
                  >
                    <div>
                      <p className="font-bold text-white text-xs sm:text-sm group-hover:text-[#CCFF00] transition-colors">{ex.nome}</p>
                      <p className="text-[10px] text-white/30 uppercase tracking-widest mt-0.5">{ex.distrettoMuscolare} • {ex.attrezzatura}</p>
                    </div>
                    <Plus className="w-4 h-4 text-white/30 group-hover:text-white group-hover:scale-110 transition-all" />
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ================= LIBRARY TEMPLATE MODAL ================= */}
      {showTemplateModal && (
        <div className="fixed inset-0 z-50 bg-neutral-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-[#121212] border border-white/10 rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[80vh]">
            <div className="p-5 border-b border-white/10 flex justify-between items-center">
              <h3 className="font-black text-white text-sm uppercase tracking-wider flex items-center gap-2">
                <LayoutGrid className="w-4.5 h-4.5 text-[#CCFF00]" />
                Libreria Modelli d'Allenamento
              </h3>
              <button 
                onClick={() => setShowTemplateModal(false)}
                className="text-white/40 hover:text-white p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-3">
              {templates.length === 0 ? (
                <div className="p-6 text-center text-white/35 text-xs">
                  Nessun modello salvato. Crea una scheda e salvala come modello al passaggio finale per vederla qui.
                </div>
              ) : (
                templates.map((tpl) => (
                  <div
                    key={tpl.id}
                    className="p-4 bg-black/40 border border-white/5 rounded-xl flex justify-between items-start hover:border-[#CCFF00]/30 transition-colors"
                  >
                    <div className="space-y-1 text-left min-w-0 pr-4">
                      <p className="font-extrabold text-white text-xs sm:text-sm truncate">{tpl.nome}</p>
                      <p className="text-[10px] text-[#CCFF00] font-bold uppercase tracking-wider">Obiettivo: {tpl.obiettivo}</p>
                      <p className="text-[10px] text-white/40">{tpl.allenamentiSettimanali} sedute/sett • {tpl.durataSettimane} settimane</p>
                      {tpl.noteGenerali && (
                        <p className="text-[10px] text-white/40 italic leading-snug truncate">"{tpl.noteGenerali}"</p>
                      )}
                    </div>
                    <button
                      onClick={() => handleLoadTemplate(tpl)}
                      className="px-3.5 py-1.5 rounded-lg bg-white hover:bg-neutral-200 text-neutral-950 text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer shadow"
                    >
                      Carica
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ================= DELETE EXERCISE CONFIRMATION MODAL ================= */}
      {deleteExConfig && (
        <div id="delete-exercise-confirm-modal" className="fixed inset-0 z-50 bg-neutral-950/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#121212] border border-white/10 rounded-2xl overflow-hidden shadow-2xl p-6 flex flex-col gap-4 text-center">
            <div className="flex justify-center">
              <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center text-red-500">
                <Trash2 className="w-6 h-6" />
              </div>
            </div>
            
            <div className="space-y-2">
              <h3 className="font-extrabold text-white text-base">Rimuovere l'esercizio?</h3>
              <p className="text-xs text-white/60 leading-relaxed">
                Stai per rimuovere l'esercizio <span className="font-bold text-white">"{deleteExConfig.exNome}"</span>. Scegli se eliminarlo solo da questa settimana o da tutte le settimane del programma.
              </p>
            </div>

            <div className="flex flex-col gap-2 mt-2">
              <button
                type="button"
                onClick={performDeleteExThisWeekOnly}
                className="w-full py-2.5 px-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 text-white font-bold text-xs transition-all cursor-pointer"
              >
                Solo dalla settimana selezionata (W{activeWeekIndex})
              </button>
              
              <button
                type="button"
                onClick={performDeleteExAllWeeks}
                className="w-full py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs transition-all cursor-pointer shadow-lg shadow-red-900/10"
              >
                Da tutte le settimane
              </button>
              
              <button
                type="button"
                onClick={() => setDeleteExConfig(null)}
                className="w-full py-2 px-4 rounded-xl text-white/40 hover:text-white text-xs transition-all cursor-pointer mt-1"
              >
                Annulla
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= SUPERSET SETTINGS MODAL ================= */}
      {supersetSettingsModalOpen && (
        <div id="superset-settings-modal" className="fixed inset-0 z-50 bg-neutral-950/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#121212] border border-white/10 rounded-2xl overflow-hidden shadow-2xl p-6 flex flex-col gap-4 text-left">
            <div className="flex items-center gap-2 border-b border-white/5 pb-3">
              <Settings className="w-5 h-5 text-[#CCFF00]" style={{ color: config.primaryColor }} />
              <h3 className="font-extrabold text-white text-base">
                {supersetSettingsGroupType === 'triset' 
                  ? 'Impostazioni Triset' 
                  : supersetSettingsGroupType === 'compound_set' 
                    ? 'Impostazioni Compound Set' 
                    : supersetSettingsGroupType === 'giant_set'
                      ? 'Impostazioni Giant Set'
                      : supersetSettingsGroupType === 'jumpset'
                        ? 'Impostazioni Jumpset'
                        : supersetSettingsGroupType === 'circuit'
                          ? 'Impostazioni Circuito'
                          : 'Impostazioni Superset'}
              </h3>
            </div>

            {supersetSettingsHasMismatch && (
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 flex items-start gap-2 text-amber-400">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <p className="text-[11px] leading-relaxed font-medium">
                  Le impostazioni del gruppo non erano uniformi. Il salvataggio applicherà gli stessi valori a tutti i membri.
                </p>
              </div>
            )}

            <div className="space-y-4 py-2">
              {/* Recupero tra gli esercizi */}
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-white/60 uppercase tracking-wider">
                  {supersetSettingsGroupType === 'jumpset' 
                    ? 'Recupero tra A1 e A2 (secondi)' 
                    : supersetSettingsGroupType === 'circuit'
                      ? 'Recupero tra le stazioni (secondi)'
                      : 'Recupero tra gli esercizi (secondi)'}
                </label>
                <input
                  type="number"
                  min={supersetSettingsGroupType === 'jumpset' ? "1" : "0"}
                  max="600"
                  step="1"
                  value={tempRestBetweenSec}
                  onChange={(e) => {
                    const val = e.target.value === "" ? "" : Number(e.target.value);
                    setTempRestBetweenSec(val);
                  }}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white font-mono text-sm focus:outline-none focus:border-[#CCFF00]/50 transition-all"
                  style={{ focusBorderColor: config.primaryColor }}
                />
                {validationErrors.restBetween && (
                  <p className="text-[10px] text-red-400 font-bold mt-1">
                    {validationErrors.restBetween}
                  </p>
                )}
              </div>

              {/* Recupero dopo il completamento del Superset */}
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-white/60 uppercase tracking-wider">
                  Recupero dopo il giro (secondi)
                </label>
                <input
                  type="number"
                  min="0"
                  max="900"
                  step="1"
                  value={tempRestAfterSec}
                  onChange={(e) => {
                    const val = e.target.value === "" ? "" : Number(e.target.value);
                    setTempRestAfterSec(val);
                  }}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white font-mono text-sm focus:outline-none focus:border-[#CCFF00]/50 transition-all"
                  style={{ focusBorderColor: config.primaryColor }}
                />
                {validationErrors.restAfter && (
                  <p className="text-[10px] text-red-400 font-bold mt-1">
                    {validationErrors.restAfter}
                  </p>
                )}
              </div>

              {/* Numero di giri */}
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-white/60 uppercase tracking-wider">
                  Numero di giri
                </label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  step="1"
                  value={tempRounds}
                  onChange={(e) => {
                    const val = e.target.value === "" ? "" : Number(e.target.value);
                    setTempRounds(val);
                  }}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white font-mono text-sm focus:outline-none focus:border-[#CCFF00]/50 transition-all"
                  style={{ focusBorderColor: config.primaryColor }}
                />
                {validationErrors.rounds && (
                  <p className="text-[10px] text-red-400 font-bold mt-1">
                    {validationErrors.rounds}
                  </p>
                )}
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center gap-2 mt-2 pt-3 border-t border-white/5">
              <button
                type="button"
                onClick={resetSupersetSettingsState}
                className="flex-1 py-2.5 px-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 text-white font-bold text-xs transition-all cursor-pointer text-center"
              >
                Annulla
              </button>
              
              <button
                type="button"
                onClick={handleSaveSupersetSettings}
                className="flex-1 py-2.5 px-4 rounded-xl font-bold text-xs transition-all cursor-pointer text-center text-neutral-950 hover:opacity-90"
                style={{ backgroundColor: config.primaryColor }}
              >
                Salva
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= STRUCTURED BLOCKS MANAGER MODAL ================= */}
      {blocksManagerConfig && blocksEx && (
        <div id="blocks-manager-modal" className="fixed inset-0 z-50 bg-neutral-950/85 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-2xl bg-[#121212] border border-white/10 rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="px-6 py-4 border-b border-white/5 flex justify-between items-center bg-neutral-900 shrink-0">
              <div className="space-y-0.5">
                <h3 className="font-extrabold text-white text-base flex items-center gap-2">
                  <Layers className="w-4 h-4 text-[#CCFF00]" style={{ color: config.primaryColor }} />
                  <span>Gestisci blocchi strutturati</span>
                </h3>
                <p className="text-xs text-white/50 font-bold truncate max-w-md">{blocksEx.nome}</p>
              </div>
              <button
                type="button"
                onClick={() => setBlocksManagerConfig(null)}
                className="w-8 h-8 rounded-full hover:bg-white/5 flex items-center justify-center text-white/50 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Success message / Notification banner */}
            {blocksSuccessMsg && (
              <div className="bg-emerald-950/40 border-y border-emerald-800/30 px-6 py-2 flex items-center gap-2 text-emerald-400 text-xs font-bold shrink-0">
                <Check className="w-3.5 h-3.5 shrink-0" />
                <span>{blocksSuccessMsg}</span>
              </div>
            )}

            {/* Scrollable Content Area */}
            <div className="p-6 overflow-y-auto space-y-4 flex-1">
              {activeBlocks.length === 0 ? (
                /* Proposal to convert current values if empty */
                <div className="bg-neutral-900 border border-white/5 rounded-xl p-6 text-center space-y-4">
                  <div className="w-12 h-12 rounded-full bg-[#CCFF00]/10 flex items-center justify-center text-[#CCFF00] mx-auto" style={{ backgroundColor: `${config.primaryColor}15`, color: config.primaryColor }}>
                    <Layers className="w-6 h-6" />
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-extrabold text-white text-sm">Nessun blocco strutturato</h4>
                    <p className="text-xs text-white/60 leading-relaxed max-w-md mx-auto">
                      Questo esercizio non possiede ancora blocchi strutturati per questa settimana.
                      Vuoi convertire i parametri attuali dell'esercizio come primo blocco, oppure iniziare da zero?
                    </p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-sm mx-auto pt-2">
                    <button
                      type="button"
                      onClick={handleConvertToBlocks}
                      className="py-2 px-3 rounded-xl bg-[#CCFF00] hover:opacity-90 text-neutral-950 font-bold text-xs transition-all cursor-pointer shadow-md"
                      style={{ backgroundColor: config.primaryColor }}
                    >
                      Sì, converti i valori attuali
                    </button>
                    <button
                      type="button"
                      onClick={handleCreateEmptyBlock}
                      className="py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 text-white font-bold text-xs transition-all cursor-pointer"
                    >
                      No, inizia da zero
                    </button>
                  </div>
                </div>
              ) : (
                /* Block Editor Cards Stack */
                <div className="space-y-4">
                  {activeBlocks.map((b, idx) => (
                    <div key={b.id} className="bg-neutral-900 border border-white/5 rounded-xl p-4 space-y-3 relative">
                      {/* Block card header */}
                      <div className="flex justify-between items-center border-b border-white/5 pb-2">
                        <div className="flex items-center gap-2 flex-1">
                          <span className="w-5 h-5 rounded-full bg-white/5 text-white/50 text-[10px] font-black flex items-center justify-center">
                            {idx + 1}
                          </span>
                          <input
                            type="text"
                            value={b.nome}
                            onChange={(e) => handleUpdateBlockField(b.id, 'nome', e.target.value)}
                            placeholder={`es. Blocco ${idx + 1}`}
                            className="bg-transparent font-extrabold text-white text-xs focus:outline-none border-b border-transparent focus:border-white/30 pb-0.5 w-40"
                          />
                        </div>
                        
                        <div className="flex items-center gap-1">
                          {/* Sposta su */}
                          <button
                            type="button"
                            disabled={idx === 0}
                            onClick={() => handleMoveBlock(idx, 'up')}
                            className="w-7 h-7 rounded hover:bg-white/5 flex items-center justify-center text-white/40 hover:text-white disabled:opacity-20 disabled:pointer-events-none transition-all cursor-pointer"
                            title="Sposta su"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          {/* Sposta giù */}
                          <button
                            type="button"
                            disabled={idx === activeBlocks.length - 1}
                            onClick={() => handleMoveBlock(idx, 'down')}
                            className="w-7 h-7 rounded hover:bg-white/5 flex items-center justify-center text-white/40 hover:text-white disabled:opacity-20 disabled:pointer-events-none transition-all cursor-pointer"
                            title="Sposta giù"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                          {/* Duplica */}
                          <button
                            type="button"
                            onClick={() => handleDuplicateBlock(b)}
                            className="w-7 h-7 rounded hover:bg-white/5 flex items-center justify-center text-white/40 hover:text-white transition-all cursor-pointer"
                            title="Duplica blocco"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          {/* Elimina */}
                          <button
                            type="button"
                            onClick={() => handleDeleteBlock(b.id)}
                            className="w-7 h-7 rounded hover:bg-red-500/10 flex items-center justify-center text-white/40 hover:text-red-400 transition-all cursor-pointer"
                            title="Elimina blocco"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Input fields grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-left">
                        {/* Serie */}
                        <div className="space-y-1">
                          <label className="block text-[9px] uppercase font-bold text-white/40">Serie</label>
                          <input
                            type="number"
                            min="1"
                            value={b.serie}
                            onChange={(e) => handleUpdateBlockField(b.id, 'serie', Number(e.target.value))}
                            className="w-full px-2 py-1.5 rounded-lg bg-black/40 border border-white/5 text-xs text-white font-mono focus:outline-none"
                          />
                        </div>

                        {/* RepMin & RepMax */}
                        <div className="space-y-1 col-span-1">
                          <label className="block text-[9px] uppercase font-bold text-white/40">Ripetizioni (Min-Max)</label>
                          <div className="flex items-center gap-1 bg-black/40 border border-white/5 rounded-lg px-2 py-1">
                            <input
                              type="number"
                              min="1"
                              value={b.repMin}
                              onChange={(e) => handleUpdateBlockField(b.id, 'repMin', Number(e.target.value))}
                              className="w-full bg-transparent text-center text-xs text-white font-mono focus:outline-none"
                            />
                            <span className="text-white/20">-</span>
                            <input
                              type="number"
                              min="1"
                              value={b.repMax}
                              onChange={(e) => handleUpdateBlockField(b.id, 'repMax', Number(e.target.value))}
                              className="w-full bg-transparent text-center text-xs text-white font-mono focus:outline-none"
                            />
                          </div>
                        </div>

                        {/* RIR */}
                        <div className="space-y-1">
                          <label className="block text-[9px] uppercase font-bold text-white/40">RIR</label>
                          <input
                            type="number"
                            min="0"
                            max="10"
                            value={b.rir}
                            onChange={(e) => handleUpdateBlockField(b.id, 'rir', Number(e.target.value))}
                            className="w-full px-2 py-1.5 rounded-lg bg-black/40 border border-white/5 text-xs text-white font-mono focus:outline-none"
                          />
                        </div>

                        {/* Recupero */}
                        <div className="space-y-1">
                          <label className="block text-[9px] uppercase font-bold text-white/40">Recupero (sec)</label>
                          <input
                            type="number"
                            min="0"
                            step="15"
                            value={b.recupero}
                            onChange={(e) => handleUpdateBlockField(b.id, 'recupero', Number(e.target.value))}
                            className="w-full px-2 py-1.5 rounded-lg bg-black/40 border border-white/5 text-xs text-white font-mono focus:outline-none"
                          />
                        </div>

                        {/* TUT */}
                        <div className="space-y-1">
                          <label className="block text-[9px] uppercase font-bold text-white/40">T.U.T.</label>
                          <input
                            type="text"
                            value={b.tut || ''}
                            onChange={(e) => handleUpdateBlockField(b.id, 'tut', e.target.value)}
                            placeholder="3-0-1-0"
                            className="w-full px-2 py-1.5 rounded-lg bg-black/40 border border-white/5 text-xs text-white font-mono focus:outline-none"
                          />
                        </div>

                        {/* Carico previsto */}
                        <div className="space-y-1">
                          <label className="block text-[9px] uppercase font-bold text-white/40">Carico previsto</label>
                          <input
                            type="text"
                            value={b.caricoPrevisto || ''}
                            onChange={(e) => handleUpdateBlockField(b.id, 'caricoPrevisto', e.target.value)}
                            placeholder="es. 80 kg"
                            className="w-full px-2 py-1.5 rounded-lg bg-black/40 border border-white/5 text-xs text-white placeholder-white/20 focus:outline-none"
                          />
                        </div>

                        {/* Tecnica di intensita */}
                        <div className="space-y-1 col-span-1">
                          <label className="block text-[9px] uppercase font-bold text-white/40">Tecnica di Intensità</label>
                          <select
                            value={b.tecnicaIntensita || 'Nessuna'}
                            onChange={(e) => handleUpdateBlockField(b.id, 'tecnicaIntensita', e.target.value)}
                            className="w-full px-2 py-1.5 rounded-lg bg-black/40 border border-white/5 text-xs text-white focus:outline-none cursor-pointer"
                          >
                            <option value="Nessuna">Standard</option>
                            <option value="Top set">Top set</option>
                            <option value="Back-off">Back-off</option>
                            <option value="Drop set">Drop set</option>
                            <option value="Rest pause">Rest pause</option>
                            <option value="Myo-reps">Myo-reps</option>
                            <option value="Cluster set">Cluster set</option>
                          </select>
                        </div>

                        {/* Volume Multiplier */}
                        <div className="space-y-1 col-span-1">
                          <label className="block text-[9px] uppercase font-bold text-[#CCFF00]" style={{ color: config.primaryColor }}>Moltiplicatore volume</label>
                          <input
                            type="text"
                            value={blockVolumeInputs[b.id] !== undefined ? blockVolumeInputs[b.id] : (b.volumeMultiplier !== undefined ? String(b.volumeMultiplier) : '1')}
                            onChange={(e) => {
                              const valStr = e.target.value;
                              setBlockVolumeInputs(prev => ({ ...prev, [b.id]: valStr }));
                            }}
                            onBlur={() => {
                              let valStr = blockVolumeInputs[b.id];
                              let valNum = 1;
                              if (valStr !== undefined) {
                                valStr = valStr.trim();
                                if (valStr === '') {
                                  valNum = 1;
                                  setBlockVolumeInputs(prev => ({ ...prev, [b.id]: '1' }));
                                } else {
                                  valStr = valStr.replace(',', '.');
                                  const parsed = parseFloat(valStr);
                                  valNum = isNaN(parsed) ? 1 : parsed;
                                  setBlockVolumeInputs(prev => ({ ...prev, [b.id]: String(valNum) }));
                                }
                              }
                              handleUpdateBlockField(b.id, 'volumeMultiplier', valNum);
                            }}
                            className="w-full px-2 py-1.5 rounded-lg bg-black/40 border border-white/5 text-xs text-white font-mono focus:outline-none"
                            title="Coefficiente personalizzabile utilizzato nelle stime del volume. Il valore standard è 1."
                          />
                          <p className="text-[8px] text-white/35 leading-tight">
                            Coefficiente personalizzabile utilizzato nelle stime del volume. Il valore standard è 1.
                          </p>
                        </div>
                      </div>

                      {/* Note text field */}
                      <div className="space-y-1 text-left">
                        <label className="block text-[9px] uppercase font-bold text-white/40">Note specifiche blocco</label>
                        <input
                          type="text"
                          value={b.note || ''}
                          onChange={(e) => handleUpdateBlockField(b.id, 'note', e.target.value)}
                          placeholder="Note specifiche per questo blocco..."
                          className="w-full px-3 py-1.5 rounded-lg bg-black/40 border border-white/5 text-xs text-white placeholder-white/20 focus:outline-none"
                        />
                      </div>
                    </div>
                  ))}

                  {/* Add Block card button */}
                  <button
                    type="button"
                    onClick={handleAddBlock}
                    className="w-full py-4 border border-dashed border-white/10 hover:border-white/25 rounded-xl text-xs font-bold text-white/50 hover:text-white bg-white/[0.01] hover:bg-white/[0.03] transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Aggiungi un altro blocco</span>
                  </button>
                </div>
              )}
            </div>

            {/* Action Footer */}
            <div className="px-6 py-4 border-t border-white/5 bg-neutral-900 shrink-0 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
              {/* Copy / Propagate operations */}
              <div className="flex items-center gap-2">
                {activeBlocks.length > 0 && (
                  <>
                    <button
                      type="button"
                      disabled={activeWeekIndex >= planDurata}
                      onClick={handleCopyBlocksToNextWeek}
                      className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 text-[10px] font-bold uppercase tracking-wider text-white/80 hover:text-white disabled:opacity-25 disabled:pointer-events-none transition-all cursor-pointer"
                      title="Copia i blocchi correnti nella settimana successiva"
                    >
                      Copia in W{activeWeekIndex + 1}
                    </button>
                    <button
                      type="button"
                      onClick={handleApplyBlocksToAllWeeks}
                      className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 text-[10px] font-bold uppercase tracking-wider text-white/80 hover:text-white transition-all cursor-pointer"
                      title="Applica i blocchi correnti a tutte le settimane per questo esercizio"
                    >
                      Applica a tutte le settimane
                    </button>
                  </>
                )}
              </div>

              {/* Close / Save */}
              <div className="flex items-center justify-end gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setBlocksManagerConfig(null)}
                  className="px-4 py-2 rounded-xl text-white/40 hover:text-white font-semibold text-xs transition-colors cursor-pointer"
                >
                  Annulla
                </button>
                <button
                  type="button"
                  onClick={handleSaveBlocks}
                  className="px-5 py-2 rounded-xl bg-white text-neutral-950 font-black uppercase tracking-wider text-xs transition-all cursor-pointer shadow-lg hover:bg-neutral-200"
                  style={activeBlocks.length > 0 ? { backgroundColor: config.primaryColor, color: '#0a0a0a' } : undefined}
                >
                  Salva e Chiudi
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
