/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Client, WorkoutPlan, WorkoutWeek, WorkoutDay, WorkoutExercise, LogbookEntry, LogbookSet, CoachConfig, AnalisiSettings, DistrettoMuscolare, WorkoutExerciseBlock, Exercise } from '../types';
import { INITIAL_EXERCISES } from '../data/exercises';

// Parser for weights from string (handles "60kg", "24kg+24kg", "20", etc.)
export function parseWeight(str?: string): number {
  if (!str) return 0;
  const clean = str.toLowerCase().replace(/[^0-9.+]/g, '');
  if (clean.includes('+')) {
    return clean.split('+').reduce((sum, val) => sum + (parseFloat(val) || 0), 0);
  }
  return parseFloat(clean) || 0;
}

// TUT (Time Under Tension) parsing helper (e.g. "3-0-1-0" -> 4 seconds per rep)
export function parseTUT(tut?: string): number {
  if (!tut) return 3; // default 3s
  const parts = tut.split('-').map(v => parseInt(v) || 0);
  if (parts.length === 4) {
    return parts.reduce((a, b) => a + b, 0);
  }
  return 3;
}

// Retrieves all exercises from database
export function getDatabaseExercises(): Exercise[] {
  if (typeof window !== 'undefined') {
    try {
      const saved = localStorage.getItem('coach_exercises');
      if (saved) {
        return JSON.parse(saved) as Exercise[];
      }
    } catch (e) {
      // ignore
    }
  }
  return INITIAL_EXERCISES;
}

export interface ResolvedExerciseData {
  distrettoMuscolare: DistrettoMuscolare;
  distrettiSecondari: string[];
  modalitaConteggio: 'entrambi_i_lati' | 'singolo_lato';
}

// Priority resolver for WorkoutExercise metadata
export function resolveWorkoutExerciseData(
  ex: WorkoutExercise,
  dbExercises: Exercise[]
): ResolvedExerciseData {
  // 1. Trova l'Exercise originale tramite exerciseId (preferito) o nome (fallback)
  const dbEx = dbExercises.find(d => d.id === ex.exerciseId) || dbExercises.find(d => d.nome.toLowerCase() === ex.nome.toLowerCase());
  
  // Base values from dbEx or fallbacks if dbEx not found
  const baseDistretto = dbEx ? dbEx.distrettoMuscolare : ex.distrettoMuscolare;
  
  // Distretti Secondari: priority 1: dbEx, priority 2: ex instance override, priority 3: fallback based on name
  let baseSecondaries: string[] | undefined;
  if (dbEx && dbEx.distrettiSecondari !== undefined) {
    baseSecondaries = dbEx.distrettiSecondari;
  } else if (ex && (ex as any).distrettiSecondari !== undefined) {
    const sec = (ex as any).distrettiSecondari;
    if (Array.isArray(sec)) {
      baseSecondaries = sec;
    } else if (typeof sec === 'string') {
      baseSecondaries = sec.split(',').map((s: string) => s.trim()).filter(Boolean);
    }
  }
  
  if (baseSecondaries === undefined) {
    baseSecondaries = getFallbackSecondaries(dbEx ? dbEx.nome : ex.nome, baseDistretto);
  }
  
  // Modalità Conteggio: base from dbEx, override from ex instance, default 'entrambi_i_lati'
  const baseModalita = dbEx?.modalitaConteggio || ex.modalitaConteggio || 'entrambi_i_lati';
  
  // Instance Overrides
  const distrettoMuscolare = ex.distrettoMuscolare || baseDistretto;
  const distrettiSecondari = baseSecondaries;
  const modalitaConteggio = ex.modalitaConteggio || baseModalita;
  
  return {
    distrettoMuscolare,
    distrettiSecondari,
    modalitaConteggio
  };
}

export interface SetInfo {
  reps: number;
  tut: number;
  recupero: number; // in seconds
  carico: number;
  volumeMultiplier: number;
  rir?: number;
}

// Return detailed list of sets for an exercise, supporting both blocks and legacy structures
export function getExerciseSets(ex: WorkoutExercise, dbExercises: Exercise[]): SetInfo[] {
  const tutSecs = parseTUT(ex.tut);
  
  if (ex.blocks && ex.blocks.length > 0) {
    const sets: SetInfo[] = [];
    ex.blocks.forEach(b => {
      const reps = (b.repMin + b.repMax) / 2;
      const blockTut = b.tut ? parseTUT(b.tut) : tutSecs;
      const blockRec = b.recupero !== undefined ? b.recupero : (ex.recupero || 90);
      const blockCarico = parseWeight(b.caricoPrevisto);
      const volMult = b.volumeMultiplier !== undefined ? b.volumeMultiplier : 1;
      
      for (let i = 0; i < b.serie; i++) {
        sets.push({
          reps,
          tut: blockTut,
          recupero: blockRec,
          carico: blockCarico,
          volumeMultiplier: volMult,
          rir: b.rir
        });
      }
    });
    return sets;
  } else {
    const sets: SetInfo[] = [];
    const reps = (ex.repMin + ex.repMax) / 2;
    const rec = ex.recupero || 90;
    const carico = parseWeight(ex.caricoPrevisto);
    for (let i = 0; i < ex.serie; i++) {
      sets.push({
        reps,
        tut: tutSecs,
        recupero: rec,
        carico,
        volumeMultiplier: 1,
        rir: ex.rir
      });
    }
    return sets;
  }
}

// Sum of series of blocks, or fallback to legacy serie field
export function getExerciseSetsCount(ex: WorkoutExercise): number {
  if (ex.blocks && ex.blocks.length > 0) {
    return ex.blocks.reduce((sum, b) => sum + (b.serie || 0), 0);
  }
  return ex.serie || 0;
}

// Reps count taking into account blocks
export function getExerciseRepsCount(ex: WorkoutExercise): number {
  if (ex.blocks && ex.blocks.length > 0) {
    return ex.blocks.reduce((sum, b) => sum + (b.serie * ((b.repMin + b.repMax) / 2)), 0);
  }
  return (ex.serie || 0) * (((ex.repMin || 0) + (ex.repMax || 0)) / 2);
}

// Calculates volume load for a single block/set structure
export function getBlockVolumeLoad(
  b: { serie: number; repMin: number; repMax: number; caricoPrevisto?: string },
  multiplier: number = 1
): number | null {
  if (b.caricoPrevisto === undefined || b.caricoPrevisto === null || b.caricoPrevisto.trim() === '') {
    return null; // indicate volume load not available
  }
  const load = parseWeight(b.caricoPrevisto);
  const avgReps = (b.repMin + b.repMax) / 2;
  return b.serie * avgReps * load * multiplier;
}

// Calculates overall volume load for a WorkoutExercise
export function getExerciseVolumeLoad(ex: WorkoutExercise): number | null {
  if (ex.blocks && ex.blocks.length > 0) {
    let sum = 0;
    for (const b of ex.blocks) {
      const vol = getBlockVolumeLoad(b, b.volumeMultiplier ?? 1);
      if (vol === null) return null; // Missing load on a block renders exercise volume load unavailable
      sum += vol;
    }
    return sum;
  } else {
    return getBlockVolumeLoad({
      serie: ex.serie,
      repMin: ex.repMin,
      repMax: ex.repMax,
      caricoPrevisto: ex.caricoPrevisto
    }, 1);
  }
}

// Generate the advanced 6-week demo data programmatically
export function generateAdvancedDemoData() {
  const client: Client = {
    id: 'c_demo_analysis',
    nome: 'Alessandro',
    cognome: 'Galli',
    eta: 28,
    sesso: 'Uomo',
    altezza: 178,
    pesoAttuale: 76.5,
    obiettivo: 'Ipertrofia & Forza',
    livelloEsperienza: 'Avanzato',
    allenamentiSettimanali: 4,
    dataInizio: '2026-06-01',
    noteCoach: 'Atleta avanzato con ottima tecnica. Risponde bene ad alta intensità e progressioni di carico.'
  };

  const exercisePool = [
    { id: 'e1', nome: 'Panca Piana Bilanciere', distretto: 'Pettorali' as const, secondari: ['Tricipiti', 'Deltoidi anteriori'] },
    { id: 'e2', nome: 'Lat Machine Presa Prona', distretto: 'Dorso' as const, secondari: ['Bicipiti', 'Deltoidi posteriori'] },
    { id: 'e3', nome: 'Squat con Bilanciere', distretto: 'Quadricipiti' as const, secondari: ['Glutei', 'Femorali'] },
    { id: 'e4', nome: 'Military Press', distretto: 'Deltoidi anteriori' as const, secondari: ['Tricipiti', 'Deltoidi laterali'] },
    { id: 'e5', nome: 'Stacco Rumeno', distretto: 'Femorali' as const, secondari: ['Glutei', 'Polpacci'] },
    { id: 'e6', nome: 'Dip alle Parallele', distretto: 'Pettorali' as const, secondari: ['Tricipiti', 'Deltoidi anteriori'] },
    { id: 'e7', nome: 'Curl con Bilanciere EZ', distretto: 'Bicipiti' as const, secondari: [] },
    { id: 'e8', nome: 'French Press su inclinata', distretto: 'Tricipiti' as const, secondari: [] },
    { id: 'e9', nome: 'Crunch Addominale', distretto: 'Addome' as const, secondari: [] }
  ];

  const weeks: WorkoutWeek[] = [];
  const logbook: LogbookEntry[] = [];

  const daysInfo = [
    { nome: 'Giorno A: Spinta (Push)', exIdxs: [0, 3, 5, 7] },
    { nome: 'Giorno B: Trazione (Pull)', exIdxs: [1, 4, 6, 8] },
    { nome: 'Giorno C: Gambe (Legs)', exIdxs: [2, 4, 8, 7] },
    { nome: 'Giorno D: Focus Braccia & Spalle', exIdxs: [0, 1, 6, 7] }
  ];

  for (let w = 1; w <= 6; w++) {
    const giornate: WorkoutDay[] = [];
    for (let d = 0; d < 4; d++) {
      const dayInfo = daysInfo[d];
      const esercizi: WorkoutExercise[] = dayInfo.exIdxs.map((poolIdx, eIdx) => {
        const ex = exercisePool[poolIdx];
        const baseSeries = 3 + (d % 2); // 3 or 4 series
        const baseRepMin = 6 + (eIdx * 2);
        const baseRepMax = baseRepMin + 4;
        
        // Progressive load over 6 weeks (+2.5% each week)
        const baseLoad = 40 + poolIdx * 10;
        const loadKg = Math.round((baseLoad + (w * 2.5)) * 10) / 10;
        const rir = Math.max(0, 3 - Math.floor(w / 2)); // decreasing RIR -> higher intensity
        
        return {
          id: `we_${w}_${d}_${eIdx}`,
          exerciseId: ex.id,
          nome: ex.nome,
          distrettoMuscolare: ex.distretto,
          serie: baseSeries,
          repMin: baseRepMin,
          repMax: baseRepMax,
          rir,
          recupero: 90 + (poolIdx % 2) * 30,
          tut: '3-0-1-0',
          caricoPrevisto: `${loadKg}kg`,
          tecnicaIntensita: eIdx === 0 ? 'Top set' : eIdx === 2 ? 'Drop set' : 'Nessuna',
          modalitaConteggio: 'entrambi_i_lati'
        };
      });

      giornate.push({
        id: `day_${w}_${d}`,
        nome: dayInfo.nome,
        esercizi
      });

      // Generate logbook sessions for weeks 1 to 5
      if (w <= 5) {
        // Skip d=3 of w=3 to simulate incomplete training
        if (w === 3 && d === 3) continue;

        esercizi.forEach((ex, eIdx) => {
          // Skip last exercise on week 2 day 2 to simulate partial workout
          if (w === 2 && d === 2 && eIdx === 3) return;

          const sets: LogbookSet[] = [];
          for (let s = 1; s <= ex.serie; s++) {
            const plannedLoad = parseWeight(ex.caricoPrevisto);
            // Slightly vary performance
            const actualLoad = plannedLoad + (s === 1 && ex.tecnicaIntensita === 'Top set' ? 5 : 0);
            const actualReps = ex.repMin + (s % 2 === 0 ? 1 : 0);
            const actualRir = Math.max(0, ex.rir + (s === ex.serie ? -1 : 0));

            sets.push({
              serieIndex: s,
              repEffettive: actualReps,
              carico: actualLoad,
              rirEffettivo: actualRir
            });
          }

          const dateObj = new Date('2026-06-01');
          dateObj.setDate(dateObj.getDate() + (w - 1) * 7 + d * 2);
          const dateStr = dateObj.toISOString().split('T')[0];

          logbook.push({
            id: `log_${w}_${d}_${eIdx}`,
            clienteId: 'c_demo_analysis',
            data: dateStr,
            giornataNome: dayInfo.nome,
            exerciseId: ex.id,
            exerciseNome: ex.nome,
            sets
          });
        });
      }
    }
    weeks.push({
      weekIndex: w,
      giornate
    });
  }

  const plan: WorkoutPlan = {
    id: 'p_demo_analysis',
    nome: 'Periodizzazione Avanzata 6 Settimane',
    clienteId: 'c_demo_analysis',
    clienteNomeCompleto: 'Alessandro Galli',
    obiettivo: 'Ipertrofia & Forza',
    allenamentiSettimanali: 4,
    durataSettimane: 6,
    dataInizio: '2026-06-01',
    noteGenerali: 'Piano programmato con progressione di carico settimanale e scarico programmato nella settimana 6.',
    giornate: weeks[0].giornate,
    dataCreazione: '2026-05-28',
    status: 'Attiva',
    weeks
  };

  return { client, plan, logbook, exercisePool };
}

// Fallback secondary muscle groups mapper based on exercise name
export function getFallbackSecondaries(name: string, primary: string): string[] {
  const n = name.toLowerCase();
  const secondaries: string[] = [];
  if (primary === 'Pettorali') {
    secondaries.push('Tricipiti', 'Deltoidi anteriori');
  } else if (primary === 'Dorso') {
    secondaries.push('Bicipiti', 'Deltoidi posteriori');
  } else if (primary === 'Quadricipiti') {
    secondaries.push('Glutei', 'Femorali');
  } else if (primary === 'Spalle' || primary === 'Deltoidi anteriori' || primary === 'Deltoidi laterali') {
    secondaries.push('Tricipiti');
  } else if (n.includes('panca') || n.includes('chest') || n.includes('dip') || n.includes('push')) {
    secondaries.push('Tricipiti', 'Deltoidi anteriori');
  } else if (n.includes('trazioni') || n.includes('row') || n.includes('pulley') || n.includes('lat')) {
    secondaries.push('Bicipiti', 'Deltoidi posteriori');
  } else if (n.includes('squat') || n.includes('press') || n.includes('affondi')) {
    secondaries.push('Glutei', 'Femorali');
  } else if (n.includes('military') || n.includes('shoulder')) {
    secondaries.push('Tricipiti', 'Deltoidi anteriori');
  }
  return secondaries;
}

// Group-aware and block-aware training session duration estimator
export function estimateDayDuration(
  day: WorkoutDay,
  settings: AnalisiSettings,
  dbExercises: Exercise[] = getDatabaseExercises()
): number {
  const transition = settings.tempoTransizione ?? 90;
  if (!day.esercizi || day.esercizi.length === 0) return 0;

  // 1. Group contiguous exercises with same non-empty groupId
  interface ExerciseGroup {
    groupId?: string;
    exercises: WorkoutExercise[];
  }

  const groups: ExerciseGroup[] = [];
  let currentGroup: ExerciseGroup | null = null;

  day.esercizi.forEach(ex => {
    if (ex.groupId) {
      if (currentGroup && currentGroup.groupId === ex.groupId) {
        currentGroup.exercises.push(ex);
      } else {
        currentGroup = {
          groupId: ex.groupId,
          exercises: [ex]
        };
        groups.push(currentGroup);
      }
    } else {
      currentGroup = null;
      groups.push({
        exercises: [ex]
      });
    }
  });

  let totalSeconds = 0;

  // 2. Calculate duration of each contiguous group
  groups.forEach(group => {
    const groupExsSets = group.exercises.map(e => getExerciseSets(e, dbExercises));
    const numRounds = Math.max(...groupExsSets.map(sets => sets.length));

    for (let r = 0; r < numRounds; r++) {
      let activeSetsInRound: SetInfo[] = [];
      
      group.exercises.forEach((ex, eIdx) => {
        const sets = groupExsSets[eIdx];
        if (r < sets.length) {
          activeSetsInRound.push(sets[r]);
        }
      });

      // Sum set durations
      activeSetsInRound.forEach(set => {
        totalSeconds += set.reps * set.tut;
      });

      // Transition time between sequential exercises in the same round inside a group
      if (activeSetsInRound.length > 1) {
        totalSeconds += (activeSetsInRound.length - 1) * transition;
      }

      // Rest/Recovery after round
      if (r < numRounds - 1) {
        const firstEx = group.exercises[0];
        if (group.exercises.length > 1 && firstEx.groupRest !== undefined) {
          totalSeconds += firstEx.groupRest;
        } else {
          const lastSet = activeSetsInRound[activeSetsInRound.length - 1];
          totalSeconds += lastSet ? lastSet.recupero : (firstEx.recupero || 90);
        }
      }
    }
  });

  // 3. Add transition times between different groups/exercises
  if (groups.length > 1) {
    totalSeconds += (groups.length - 1) * transition;
  }

  return Math.round(totalSeconds / 60); // minutes
}

export interface AnalysisResults {
  weeklyDistrictVolume?: {
    week: string;
    [district: string]: any;
  }[];

  totalWorkoutsScheduled: number;
  totalWorkoutsExecuted: number;
  totalExercisesCount: number;
  totalSetsScheduled: number;
  totalSetsExecuted: number;
  totalRepsScheduled: number;
  totalRepsExecuted: number;
  totalVolumeLoadScheduled: number;
  totalVolumeLoadExecuted: number;
  avgVolumeLoadPerWorkoutScheduled: number;
  avgVolumeLoadPerWorkoutExecuted: number;
  totalDurationScheduled: number;
  totalDurationExecuted: number;
  avgDurationScheduled: number;
  avgDurationExecuted: number;
  avgRecuperoScheduled: number;
  avgRirScheduled: number;
  avgRirExecuted: number;
  aderenzaAllenamenti: number; // percentage
  aderenzaSerie: number; // percentage
  completamentoPercent: number; // percentage
  
  // Chart datasets
  volumePerDistrict: {
    district: string;
    direct: number;
    secondary: number;
    weighted: number;
    scheduled: number;
    executed: number;
  }[];
  
  weeklyTrend: {
    week: string;
    sets: number;
    setsExecuted: number;
    volumeLoad: number;
    volumeLoadExecuted: number;
    reps: number;
    repsExecuted: number;
    avgRir: number;
    avgRirExecuted: number;
    duration: number;
    completion: number;
  }[];

  plannedVsExecuted: {
    name: string; // week, day, or district
    progSets: number;
    realSets: number;
    progVolume: number;
    realVolume: number;
  }[];

  volumeDistribution: {
    district: string;
    sets: number;
    percentage: number;
  }[];

  heatmap: {
    district: string;
    [key: string]: any; // dynamic keys for weeks/days
  }[];

  frequency: {
    district: string;
    sedute: number;
    giorniDistanza: number;
    distanzaMedia: number;
    distanzaMin: number;
    distanzaMax: number;
    daysActive: string[]; // ['A', 'C']
  }[];

  dailyDistribution: {
    dayName: string;
    totalSets: number;
    totalExercises: number;
    duration: number;
    avgRecupero: number;
    [muscleGroup: string]: any; // muscle volumes
  }[];

  rirDistribution: {
    rir: string;
    scheduledSets: number;
    executedSets: number;
  }[];

  repsDistribution: {
    range: string;
    sets: number;
    percentage: number;
    majorDistricts: string[];
    majorExercises: string[];
  }[];

  intensityTechniques: {
    technique: string;
    exercisesCount: number;
    setsCount: number;
    districts: string[];
    percentage: number;
  }[];

  density: {
    dayName: string;
    setsPerMin: number;
    repsPerMin: number;
    volumePerMin: number;
  }[];

  exerciseTable: {
    id: string;
    nome: string;
    distretto: string;
    apparizioni: number;
    weeksActive: number[];
    serieTotali: number;
    repsTotali: number;
    caricoMedio: number;
    caricoMassimo: number;
    volumeLoad: number;
    rirMedio: number;
    frequenza: number;
    ultimaPrestazione: string;
    migliorePrestazione: string;
    history: {
      data: string;
      carico: number;
      reps: number;
      rir: number;
      volume: number;
    }[];
  }[];

  alerts: {
    id: string;
    type: 'warning' | 'info' | 'success';
    title: string;
    description: string;
    threshold?: string;
    ignored: boolean;
    note?: string;
  }[];
}

export function runFullAnalysis(
  clients: Client[],
  plans: WorkoutPlan[],
  logbook: LogbookEntry[],
  filters: {
    clientId: string;
    planId: string;
    statusFilter: string;
    weekIndex: string; // "all" or "1", "2" etc.
    dayId: string; // "all" or specific Giorno Name
    muscle: string; // "all" or specific
    exerciseName: string; // "all" or specific
    compareWeek1?: string;
    compareWeek2?: string;
  },
  settings: AnalisiSettings
): AnalysisResults {
  const coeff = settings.coeffMuscoliSecondari ?? 0.5;
  const numDec = settings.numeroDecimali ?? 1;
  const unit = settings.unitaCarico ?? 'kg';

  // 1. Resolve Scope
  const client = clients.find(c => c.id === filters.clientId);
  const activePlans = plans.filter(p => p.clienteId === filters.clientId && (filters.statusFilter === 'all' || p.status === filters.statusFilter));
  
  // Filter active plans in scope
  let planInScope = activePlans.find(p => p.id === filters.planId);
  if (!planInScope && activePlans.length > 0) {
    planInScope = activePlans[0];
  }

  // Get matching logs for this client
  const clientLogs = logbook.filter(l => l.clienteId === filters.clientId);

  // Initialize output
  const res: AnalysisResults = {
    totalWorkoutsScheduled: 0,
    totalWorkoutsExecuted: 0,
    totalExercisesCount: 0,
    totalSetsScheduled: 0,
    totalSetsExecuted: 0,
    totalRepsScheduled: 0,
    totalRepsExecuted: 0,
    totalVolumeLoadScheduled: 0,
    totalVolumeLoadExecuted: 0,
    avgVolumeLoadPerWorkoutScheduled: 0,
    avgVolumeLoadPerWorkoutExecuted: 0,
    totalDurationScheduled: 0,
    totalDurationExecuted: 0,
    avgDurationScheduled: 0,
    avgDurationExecuted: 0,
    avgRecuperoScheduled: 0,
    avgRirScheduled: 0,
    avgRirExecuted: 0,
    aderenzaAllenamenti: 0,
    aderenzaSerie: 0,
    completamentoPercent: 0,
    weeklyDistrictVolume: [],
    volumePerDistrict: [],
    weeklyTrend: [],
    plannedVsExecuted: [],
    volumeDistribution: [],
    heatmap: [],
    frequency: [],
    dailyDistribution: [],
    rirDistribution: [],
    repsDistribution: [],
    intensityTechniques: [],
    density: [],
    exerciseTable: [],
    alerts: []
  };

  if (!planInScope) {
    return res;
  }

  const dbExercises = getDatabaseExercises();

  // Flatten scheduled exercises and logbook entries based on Week and Day filters
  interface ScheduledItem {
    weekIndex: number;
    dayName: string;
    dayId: string;
    exercise: WorkoutExercise;
  }

  const schExercises: ScheduledItem[] = [];
  const schExercisesAllWeeks: ScheduledItem[] = [];
  const logEntries: LogbookEntry[] = [];
  const logEntriesAllWeeks: LogbookEntry[] = [];

  // Determine active weeks in plan
  const planWeeksCount = planInScope.durataSettimane || 1;
  const weeksList = planInScope.weeks || [];

  for (let w = 1; w <= planWeeksCount; w++) {
    const weekObj = weeksList.find(wk => wk.weekIndex === w);
    const days = weekObj ? weekObj.giornate : planInScope.giornate || [];

    days.forEach(d => {
      // Apply day filter
      if (filters.dayId !== 'all' && d.nome !== filters.dayId && d.id !== filters.dayId) {
        return;
      }

      d.esercizi.forEach(ex => {
        const resolved = resolveWorkoutExerciseData(ex, dbExercises);
        
        // Apply muscle filter
        const isMainMuscle = filters.muscle === 'all' || resolved.distrettoMuscolare === filters.muscle;
        const isSecondaryMuscle = filters.muscle !== 'all' && resolved.distrettiSecondari.includes(filters.muscle);
        
        if (filters.muscle !== 'all' && !isMainMuscle && !isSecondaryMuscle) {
          return;
        }

        // Apply exercise filter
        if (filters.exerciseName !== 'all' && ex.nome.toLowerCase() !== filters.exerciseName.toLowerCase()) {
          return;
        }

        const item: ScheduledItem = {
          weekIndex: w,
          dayName: d.nome,
          dayId: d.id,
          exercise: ex
        };

        schExercisesAllWeeks.push(item);
        if (filters.weekIndex === 'all' || filters.weekIndex === String(w)) {
          schExercises.push(item);
        }
      });
    });
  }

  // Filter logbook logs matching the filtered days / exercises
  clientLogs.forEach(l => {
    // Resolve week index from logbook date relative to plan start date
    const planStart = new Date(planInScope!.dataInizio || '2026-06-01');
    const logDate = new Date(l.data);
    const diffTime = Math.abs(logDate.getTime() - planStart.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const calculatedWeek = Math.max(1, Math.ceil(diffDays / 7));

    // Apply day filter
    if (filters.dayId !== 'all' && l.giornataNome !== filters.dayId) {
      return;
    }

    // Apply exercise filter
    if (filters.exerciseName !== 'all' && l.exerciseNome.toLowerCase() !== filters.exerciseName.toLowerCase()) {
      return;
    }

    // Secondary muscles lookup
    const matchedEx = planInScope!.giornate.flatMap(g => g.esercizi).find(e => e.nome.toLowerCase() === l.exerciseNome.toLowerCase());
    const resolved = matchedEx ? resolveWorkoutExerciseData(matchedEx, dbExercises) : {
      distrettoMuscolare: 'Pettorali' as DistrettoMuscolare,
      distrettiSecondari: getFallbackSecondaries(l.exerciseNome, 'Pettorali'),
      modalitaConteggio: 'entrambi_i_lati' as const
    };

    const isMainMuscle = filters.muscle === 'all' || resolved.distrettoMuscolare === filters.muscle;
    const isSecMuscle = filters.muscle !== 'all' && resolved.distrettiSecondari.includes(filters.muscle);

    if (filters.muscle !== 'all' && !isMainMuscle && !isSecMuscle) {
      return;
    }

    logEntriesAllWeeks.push(l);
    if (filters.weekIndex === 'all' || filters.weekIndex === String(calculatedWeek)) {
      logEntries.push(l);
    }
  });

  // Calculate high-level scheduled metrics
  res.totalWorkoutsScheduled = Array.from(new Set(schExercises.map(s => `${s.weekIndex}-${s.dayName}`))).length;
  res.totalExercisesCount = Array.from(new Set(schExercises.map(s => s.exercise.nome))).length;
  res.totalSetsScheduled = schExercises.reduce((sum, s) => sum + getExerciseSetsCount(s.exercise), 0);
  res.totalRepsScheduled = schExercises.reduce((sum, s) => sum + getExerciseRepsCount(s.exercise), 0);
  
  // Calculate Volume Load Scheduled
  let totalVolSched = 0;
  schExercises.forEach(s => {
    const vol = getExerciseVolumeLoad(s.exercise);
    if (vol !== null) {
      totalVolSched += vol;
    }
  });
  res.totalVolumeLoadScheduled = totalVolSched;

  // Calculate Duration Scheduled
  const uniqueWeekDays = Array.from(new Set(schExercises.map(s => `${s.weekIndex}-${s.dayId}`)));
  let durationSchedSum = 0;
  uniqueWeekDays.forEach(wd => {
    const [wIdxStr, dId] = wd.split('-');
    const wIdx = parseInt(wIdxStr);
    const weekObj = weeksList.find(wk => wk.weekIndex === wIdx);
    const dayObj = (weekObj ? weekObj.giornate : planInScope!.giornate || []).find(d => d.id === dId || d.nome === dId);
    if (dayObj) {
      durationSchedSum += estimateDayDuration(dayObj, settings, dbExercises);
    }
  });
  res.totalDurationScheduled = durationSchedSum;
  res.avgDurationScheduled = res.totalWorkoutsScheduled > 0 ? Math.round(durationSchedSum / res.totalWorkoutsScheduled) : 0;

  // Average recovery & Planned RIR
  let totalRecSum = 0;
  let recCount = 0;
  schExercises.forEach(s => {
    const sets = getExerciseSets(s.exercise, dbExercises);
    sets.forEach(set => {
      totalRecSum += set.recupero;
      recCount++;
    });
  });
  res.avgRecuperoScheduled = recCount > 0 ? Math.round(totalRecSum / recCount) : 0;

  let rirSchSum = 0;
  let rirSchCount = 0;
  schExercises.forEach(s => {
    const sets = getExerciseSets(s.exercise, dbExercises);
    sets.forEach(set => {
      if (set.rir !== undefined) {
        rirSchSum += set.rir;
        rirSchCount++;
      }
    });
  });
  res.avgRirScheduled = rirSchCount > 0 ? Math.round((rirSchSum / rirSchCount) * 10) / 10 : 0;

  // High level EXECUTED metrics from Logbook
  const uniqueLogDates = Array.from(new Set(logEntries.map(l => l.data)));
  res.totalWorkoutsExecuted = uniqueLogDates.length;
  res.totalSetsExecuted = logEntries.reduce((sum, l) => sum + l.sets.length, 0);
  res.totalRepsExecuted = logEntries.reduce((sum, l) => sum + l.sets.reduce((sSum, s) => sSum + s.repEffettive, 0), 0);
  
  let totalVolExec = 0;
  logEntries.forEach(l => {
    l.sets.forEach(s => {
      totalVolExec += s.repEffettive * s.carico;
    });
  });
  res.totalVolumeLoadExecuted = totalVolExec;

  // Duration executed calculation:
  // Group logbook entries by date
  const logsByDate: Record<string, LogbookEntry[]> = {};
  logEntries.forEach(l => {
    if (!logsByDate[l.data]) logsByDate[l.data] = [];
    logsByDate[l.data].push(l);
  });

  let durationExecSum = 0;
  Object.keys(logsByDate).forEach(date => {
    const dailyLogs = logsByDate[date];
    const resolvedExs: WorkoutExercise[] = [];
    dailyLogs.forEach(l => {
      const matchedEx = planInScope!.giornate
        .flatMap(g => g.esercizi)
        .find(e => e.nome.toLowerCase() === l.exerciseNome.toLowerCase());
      if (matchedEx) {
        const logSetsCount = l.sets.length;
        const tempEx: WorkoutExercise = {
          ...matchedEx,
          serie: logSetsCount,
          blocks: matchedEx.blocks && matchedEx.blocks.length > 0 ? matchedEx.blocks.map(b => ({
            ...b,
            serie: Math.min(b.serie, logSetsCount)
          })) : undefined
        };
        resolvedExs.push(tempEx);
      } else {
        resolvedExs.push({
          id: 'dummy',
          exerciseId: '',
          nome: l.exerciseNome,
          distrettoMuscolare: 'Pettorali',
          serie: l.sets.length,
          repMin: 8,
          repMax: 12,
          rir: 2,
          recupero: 90,
          tut: '3-0-1-0'
        });
      }
    });

    durationExecSum += estimateDayDuration({ id: 'any', nome: 'Executed', esercizi: resolvedExs }, settings, dbExercises);
  });

  res.totalDurationExecuted = durationExecSum;
  res.avgDurationExecuted = res.totalWorkoutsExecuted > 0 ? Math.round(durationExecSum / res.totalWorkoutsExecuted) : 0;

  // Average actual RIR
  let rirExecSum = 0;
  let rirExecCount = 0;
  logEntries.forEach(l => {
    l.sets.forEach(s => {
      if (s.rirEffettivo !== undefined) {
        rirExecSum += s.rirEffettivo;
        rirExecCount++;
      }
    });
  });
  res.avgRirExecuted = rirExecCount > 0 ? Math.round((rirExecSum / rirExecCount) * 10) / 10 : 0;

  // Average Volume Load per Workout
  res.avgVolumeLoadPerWorkoutScheduled = res.totalWorkoutsScheduled > 0 ? Math.round(res.totalVolumeLoadScheduled / res.totalWorkoutsScheduled) : 0;
  res.avgVolumeLoadPerWorkoutExecuted = res.totalWorkoutsExecuted > 0 ? Math.round(res.totalVolumeLoadExecuted / res.totalWorkoutsExecuted) : 0;

  // Adherences & Completion Rate
  res.aderenzaAllenamenti = res.totalWorkoutsScheduled > 0 ? Math.round((res.totalWorkoutsExecuted / res.totalWorkoutsScheduled) * 100) : 0;
  res.aderenzaSerie = res.totalSetsScheduled > 0 ? Math.round((res.totalSetsExecuted / res.totalSetsScheduled) * 100) : 0;
  res.completamentoPercent = Math.min(100, Math.round((res.aderenzaAllenamenti * 0.4) + (res.aderenzaSerie * 0.6)));

  const DISTRICTS: string[] = [
    'Pettorali', 'Dorso', 'Deltoidi anteriori', 'Deltoidi laterali', 'Deltoidi posteriori',
    'Spalle', 'Bicipiti', 'Tricipiti', 'Quadricipiti', 'Femorali', 'Glutei', 'Adduttori', 'Abduttori', 'Polpacci', 'Addome'
  ];

  // 2. Volume per District
  res.volumePerDistrict = DISTRICTS.map(dist => {
    let direct = 0;
    let secondary = 0;
    let scheduledSets = 0;
    let executedSets = 0;

    // Scheduled matching
    schExercises.forEach(s => {
      const ex = s.exercise;
      const resolved = resolveWorkoutExerciseData(ex, dbExercises);
      const exSets = getExerciseSetsCount(ex);
      
      if (resolved.distrettoMuscolare === dist) {
        direct += exSets;
        scheduledSets += exSets;
      } else if (resolved.distrettiSecondari.includes(dist)) {
        secondary += exSets * coeff;
      }
    });

    // Executed matching
    logEntries.forEach(l => {
      const matchedEx = planInScope!.giornate.flatMap(g => g.esercizi).find(e => e.nome.toLowerCase() === l.exerciseNome.toLowerCase());
      const resolved = matchedEx ? resolveWorkoutExerciseData(matchedEx, dbExercises) : {
        distrettoMuscolare: 'Pettorali' as DistrettoMuscolare,
        distrettiSecondari: getFallbackSecondaries(l.exerciseNome, 'Pettorali'),
        modalitaConteggio: 'entrambi_i_lati' as const
      };

      if (resolved.distrettoMuscolare === dist) {
        executedSets += l.sets.length;
      }
    });

    return {
      district: dist,
      direct: Math.round(direct * 10) / 10,
      secondary: Math.round(secondary * 10) / 10,
      weighted: Math.round((direct + secondary) * 10) / 10,
      scheduled: scheduledSets,
      executed: executedSets
    };
  }).filter(v => v.direct > 0 || v.secondary > 0 || v.executed > 0);

  // 3. Weekly Trend (Week 1 to durations)
  for (let w = 1; w <= planWeeksCount; w++) {
    const weekSch = schExercisesAllWeeks.filter(s => s.weekIndex === w);
    const weekLogs = logEntriesAllWeeks.filter(l => {
      const planStart = new Date(planInScope!.dataInizio || '2026-06-01');
      const logDate = new Date(l.data);
      const diffTime = Math.abs(logDate.getTime() - planStart.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      const calculatedWeek = Math.max(1, Math.ceil(diffDays / 7));
      return calculatedWeek === w;
    });

    const sets = weekSch.reduce((sum, s) => sum + getExerciseSetsCount(s.exercise), 0);
    const setsExecuted = weekLogs.reduce((sum, l) => sum + l.sets.length, 0);
    
    let vol = 0;
    weekSch.forEach(s => {
      const exVol = getExerciseVolumeLoad(s.exercise);
      if (exVol !== null) {
        vol += exVol;
      }
    });

    let volExecuted = 0;
    weekLogs.forEach(l => {
      l.sets.forEach(s => {
        volExecuted += s.repEffettive * s.carico;
      });
    });

    const reps = weekSch.reduce((sum, s) => sum + getExerciseRepsCount(s.exercise), 0);
    const repsExecuted = weekLogs.reduce((sum, l) => sum + l.sets.reduce((sSum, s) => sSum + s.repEffettive, 0), 0);

    let rSchSumWeek = 0;
    let rSchCountWeek = 0;
    weekSch.forEach(s => {
      const sets = getExerciseSets(s.exercise, dbExercises);
      sets.forEach(set => {
        if (set.rir !== undefined) {
          rSchSumWeek += set.rir;
          rSchCountWeek++;
        }
      });
    });
    const avgRir = rSchCountWeek > 0 ? rSchSumWeek / rSchCountWeek : 0;

    let reRirSum = 0;
    let reRirCount = 0;
    weekLogs.forEach(l => {
      l.sets.forEach(s => {
        if (s.rirEffettivo !== undefined) {
          reRirSum += s.rirEffettivo;
          reRirCount++;
        }
      });
    });
    const avgRirExecuted = reRirCount > 0 ? reRirSum / reRirCount : 0;

    const uniqueSchDays = Array.from(new Set(weekSch.map(s => s.dayId))).length;
    const uniqueExecDays = Array.from(new Set(weekLogs.map(l => l.data))).length;
    const wkAdherence = uniqueSchDays > 0 ? (uniqueExecDays / uniqueSchDays) * 100 : 0;
    const setsAdherence = sets > 0 ? (setsExecuted / sets) * 100 : 0;
    const completion = uniqueSchDays > 0 ? Math.min(100, Math.round((wkAdherence * 0.4) + (setsAdherence * 0.6))) : 0;

    res.weeklyTrend.push({
      week: `Settimana ${w}`,
      sets,
      setsExecuted,
      volumeLoad: Math.round(vol),
      volumeLoadExecuted: Math.round(volExecuted),
      reps,
      repsExecuted,
      avgRir: Math.round(avgRir * 10) / 10,
      avgRirExecuted: Math.round(avgRirExecuted * 10) / 10,
      duration: Math.round(vol / 1000), // scaled estimate
      completion
    });
  }

  // 3b. Weekly Volume per District (Sets progression)
  const weeklyDistrictVolume: any[] = [];
  for (let w = 1; w <= planWeeksCount; w++) {
    const weekSch = schExercisesAllWeeks.filter(s => s.weekIndex === w);
    const row: any = { week: `W${w}` };
    DISTRICTS.forEach(dist => {
      let sets = 0;
      weekSch.forEach(s => {
        const resolved = resolveWorkoutExerciseData(s.exercise, dbExercises);
        if (resolved.distrettoMuscolare === dist) {
          sets += getExerciseSetsCount(s.exercise);
        }
      });
      row[dist] = sets;
    });
    weeklyDistrictVolume.push(row);
  }
  res.weeklyDistrictVolume = weeklyDistrictVolume;

  // 4. Planned vs Executed Chart
  res.plannedVsExecuted = res.weeklyTrend.map(wt => ({
    name: wt.week,
    progSets: wt.sets,
    realSets: wt.setsExecuted,
    progVolume: wt.volumeLoad,
    realVolume: wt.volumeLoadExecuted
  }));

  // 5. Volume Distribution Percentage
  const totalSetsSum = res.volumePerDistrict.reduce((sum, v) => sum + v.weighted, 0);
  res.volumeDistribution = res.volumePerDistrict.map(v => ({
    district: v.district,
    sets: v.weighted,
    percentage: totalSetsSum > 0 ? Math.round((v.weighted / totalSetsSum) * 100) : 0
  })).sort((a, b) => b.sets - a.sets);

  // 6. Heatmap Grid
  const dayNamesInPlan = Array.from(new Set(planInScope.giornate.map(d => d.nome)));
  res.heatmap = DISTRICTS.map(dist => {
    const row: any = { district: dist };
    dayNamesInPlan.forEach(dName => {
      let seriesCount = 0;
      schExercises.forEach(s => {
        const resolved = resolveWorkoutExerciseData(s.exercise, dbExercises);
        if (resolved.distrettoMuscolare === dist && s.dayName === dName) {
          seriesCount += getExerciseSetsCount(s.exercise);
        }
      });
      row[dName] = seriesCount;
    });
    return row;
  }).filter(r => Object.values(r).some(v => typeof v === 'number' && v > 0));

  // 7. Training Frequency
  res.frequency = DISTRICTS.map(dist => {
    const activeDays = Array.from(new Set(
      schExercises.filter(s => {
        const resolved = resolveWorkoutExerciseData(s.exercise, dbExercises);
        return resolved.distrettoMuscolare === dist;
      }).map(s => s.dayName.split(':')[0].trim())
    ));
    const sedute = activeDays.length;
    
    let distanzaMedia = 0;
    let distanzaMin = 0;
    let distanzaMax = 0;
    if (sedute > 1) {
      distanzaMin = 2;
      distanzaMax = 3;
      distanzaMedia = 2.5;
    } else if (sedute === 1) {
      distanzaMin = 7;
      distanzaMax = 7;
      distanzaMedia = 7;
    }

    return {
      district: dist,
      sedute,
      giorniDistanza: sedute > 0 ? Math.round(7 / sedute) : 0,
      distanzaMedia,
      distanzaMin,
      distanzaMax,
      daysActive: activeDays
    };
  }).filter(f => f.sedute > 0);

  // 8. Daily Distribution
  const uniqueDaysList = Array.from(new Set(schExercises.map(s => s.dayName)));
  res.dailyDistribution = uniqueDaysList.map(dName => {
    const daySch = schExercises.filter(s => s.dayName === dName);
    const dayObj: any = {
      dayName: dName,
      totalSets: daySch.reduce((sum, s) => sum + getExerciseSetsCount(s.exercise), 0),
      totalExercises: daySch.length,
      duration: estimateDayDuration({ id: 'any', nome: dName, esercizi: daySch.map(s => s.exercise) }, settings, dbExercises),
      avgRecupero: daySch.length > 0 ? Math.round(daySch.reduce((sum, s) => {
        const sets = getExerciseSets(s.exercise, dbExercises);
        const recSum = sets.reduce((rSum, set) => rSum + set.recupero, 0);
        return sum + (sets.length > 0 ? recSum / sets.length : 90);
      }, 0) / daySch.length) : 0
    };

    DISTRICTS.forEach(dist => {
      const match = daySch.filter(s => {
        const resolved = resolveWorkoutExerciseData(s.exercise, dbExercises);
        return resolved.distrettoMuscolare === dist;
      });
      if (match.length > 0) {
        dayObj[dist] = match.reduce((sum, s) => sum + getExerciseSetsCount(s.exercise), 0);
      }
    });

    return dayObj;
  });

  // 9. RIR Distribution
  const rirBins = ['RIR 0', 'RIR 1', 'RIR 2', 'RIR 3', 'RIR 4', 'RIR 5+', 'Non indicato'];
  res.rirDistribution = rirBins.map(bin => {
    let scheduledSets = 0;
    let executedSets = 0;

    schExercises.forEach(s => {
      const sets = getExerciseSets(s.exercise, dbExercises);
      sets.forEach(set => {
        const r = set.rir;
        if (bin === 'RIR 0' && r === 0) scheduledSets++;
        else if (bin === 'RIR 1' && r === 1) scheduledSets++;
        else if (bin === 'RIR 2' && r === 2) scheduledSets++;
        else if (bin === 'RIR 3' && r === 3) scheduledSets++;
        else if (bin === 'RIR 4' && r === 4) scheduledSets++;
        else if (bin === 'RIR 5+' && r >= 5) scheduledSets++;
        else if (bin === 'Non indicato' && r === undefined) scheduledSets++;
      });
    });

    logEntries.forEach(l => {
      l.sets.forEach(s => {
        const r = s.rirEffettivo;
        if (bin === 'RIR 0' && r === 0) executedSets++;
        else if (bin === 'RIR 1' && r === 1) executedSets++;
        else if (bin === 'RIR 2' && r === 2) executedSets++;
        else if (bin === 'RIR 3' && r === 3) executedSets++;
        else if (bin === 'RIR 4' && r === 4) executedSets++;
        else if (bin === 'RIR 5+' && r >= 5) executedSets++;
        else if (bin === 'Non indicato' && r === undefined) executedSets++;
      });
    });

    return { rir: bin, scheduledSets, executedSets };
  });

  // 10. Reps Distribution
  const repBins = [
    { label: '1–5', min: 1, max: 5 },
    { label: '6–8', min: 6, max: 8 },
    { label: '9–12', min: 9, max: 12 },
    { label: '13–15', min: 13, max: 15 },
    { label: '16–20', min: 16, max: 20 },
    { label: 'Oltre 20', min: 21, max: 999 },
    { label: 'Isometrico', min: 0, max: 0 }
  ];

  let totalSetsRepSum = 0;
  const binSetsMap = new Map<string, number>();
  const binDistrictsMap = new Map<string, string[]>();
  const binExercisesMap = new Map<string, string[]>();

  repBins.forEach(bin => {
    binSetsMap.set(bin.label, 0);
    binDistrictsMap.set(bin.label, []);
    binExercisesMap.set(bin.label, []);
  });

  schExercises.forEach(s => {
    const resolved = resolveWorkoutExerciseData(s.exercise, dbExercises);
    const sets = getExerciseSets(s.exercise, dbExercises);
    sets.forEach(set => {
      totalSetsRepSum++;
      const avg = set.reps;
      
      repBins.forEach(bin => {
        const matchesBin = (bin.min === 0 && avg === 0) || (avg >= bin.min && avg <= bin.max);
        if (matchesBin) {
          binSetsMap.set(bin.label, binSetsMap.get(bin.label)! + 1);
          
          const districts = binDistrictsMap.get(bin.label)!;
          if (!districts.includes(resolved.distrettoMuscolare)) {
            districts.push(resolved.distrettoMuscolare);
          }
          
          const exercises = binExercisesMap.get(bin.label)!;
          if (!exercises.includes(s.exercise.nome)) {
            exercises.push(s.exercise.nome);
          }
        }
      });
    });
  });

  res.repsDistribution = repBins.map(bin => {
    const sets = binSetsMap.get(bin.label) || 0;
    const districts = (binDistrictsMap.get(bin.label) || []).slice(0, 3);
    const exercises = (binExercisesMap.get(bin.label) || []).slice(0, 3);

    return {
      range: bin.label,
      sets,
      percentage: totalSetsRepSum > 0 ? Math.round((sets / totalSetsRepSum) * 100) : 0,
      majorDistricts: districts,
      majorExercises: exercises
    };
  }).filter(r => r.sets > 0);

  // 11. Intensity Techniques Analysis
  const techList = [
    'Top set', 'Back-off', 'Drop set', 'Rest pause', 'Myo-reps', 'Cluster set', 'Superset', 'Triset', 'Giant set', 'Jumpset', 'Circuito', 'Cedimento'
  ];
  const totalExs = schExercises.length;
  
  const techExercisesCount = new Map<string, number>();
  const techSetsCount = new Map<string, number>();
  const techDistricts = new Map<string, string[]>();

  techList.forEach(t => {
    techExercisesCount.set(t.toLowerCase(), 0);
    techSetsCount.set(t.toLowerCase(), 0);
    techDistricts.set(t.toLowerCase(), []);
  });

  schExercises.forEach(s => {
    const resolved = resolveWorkoutExerciseData(s.exercise, dbExercises);
    const exTech = s.exercise.tecnicaIntensita?.toLowerCase();
    
    if (s.exercise.blocks && s.exercise.blocks.length > 0) {
      s.exercise.blocks.forEach(b => {
        const bTech = b.tecnicaIntensita?.toLowerCase();
        if (bTech) {
          techList.forEach(tech => {
            if (bTech === tech.toLowerCase()) {
              techSetsCount.set(tech.toLowerCase(), techSetsCount.get(tech.toLowerCase())! + b.serie);
              
              const dists = techDistricts.get(tech.toLowerCase())!;
              if (!dists.includes(resolved.distrettoMuscolare)) {
                dists.push(resolved.distrettoMuscolare);
              }
            }
          });
        }
      });
      
      if (exTech) {
        techList.forEach(tech => {
          if (exTech === tech.toLowerCase()) {
            techExercisesCount.set(tech.toLowerCase(), techExercisesCount.get(tech.toLowerCase())! + 1);
          }
        });
      }
    } else {
      if (exTech) {
        techList.forEach(tech => {
          if (exTech === tech.toLowerCase()) {
            techExercisesCount.set(tech.toLowerCase(), techExercisesCount.get(tech.toLowerCase())! + 1);
            techSetsCount.set(tech.toLowerCase(), techSetsCount.get(tech.toLowerCase())! + s.exercise.serie);
            
            const dists = techDistricts.get(tech.toLowerCase())!;
            if (!dists.includes(resolved.distrettoMuscolare)) {
              dists.push(resolved.distrettoMuscolare);
            }
          }
        });
      }
    }
  });

  res.intensityTechniques = techList.map(tech => {
    const lower = tech.toLowerCase();
    let exercisesCount = techExercisesCount.get(lower) || 0;
    const setsCount = techSetsCount.get(lower) || 0;
    const districts = techDistricts.get(lower) || [];
    
    if (exercisesCount === 0 && setsCount > 0) {
      exercisesCount = 1;
    }

    return {
      technique: tech,
      exercisesCount,
      setsCount,
      districts,
      percentage: totalExs > 0 ? Math.round((exercisesCount / totalExs) * 100) : 0
    };
  }).filter(t => t.exercisesCount > 0);

  // 12. Workout Density
  res.density = uniqueDaysList.map(dName => {
    const sch = schExercises.filter(s => s.dayName === dName);
    const sets = sch.reduce((sum, s) => sum + getExerciseSetsCount(s.exercise), 0);
    const reps = sch.reduce((sum, s) => sum + getExerciseRepsCount(s.exercise), 0);
    
    let vol = 0;
    sch.forEach(s => {
      const exVol = getExerciseVolumeLoad(s.exercise);
      if (exVol !== null) {
        vol += exVol;
      }
    });

    const duration = estimateDayDuration({ id: 'any', nome: dName, esercizi: sch.map(s => s.exercise) }, settings, dbExercises) || 45;

    return {
      dayName: dName,
      setsPerMin: Math.round((sets / duration) * 100) / 100,
      repsPerMin: Math.round((reps / duration) * 10) / 10,
      volumePerMin: Math.round(vol / duration)
    };
  });

  // 13. Exercise Analysis Table
  const uniqueExerciseNames = Array.from(new Set(schExercises.map(s => s.exercise.nome)));
  res.exerciseTable = uniqueExerciseNames.map(exName => {
    const matchingSch = schExercises.filter(s => s.exercise.nome === exName);
    const matchingLogs = logEntries.filter(l => l.exerciseNome.toLowerCase() === exName.toLowerCase());

    const sample = matchingSch[0]?.exercise;
    const resolved = sample ? resolveWorkoutExerciseData(sample, dbExercises) : {
      distrettoMuscolare: 'Pettorali' as DistrettoMuscolare,
      distrettiSecondari: [] as string[],
      modalitaConteggio: 'entrambi_i_lati' as const
    };
    
    const distretto = resolved.distrettoMuscolare;
    const app = matchingSch.length;
    const activeWks = Array.from(new Set(matchingSch.map(s => s.weekIndex))).sort();

    const scheduledSetsCount = matchingSch.reduce((sum, s) => sum + getExerciseSetsCount(s.exercise), 0);
    const scheduledRepsCount = matchingSch.reduce((sum, s) => sum + getExerciseRepsCount(s.exercise), 0);

    // Carichi / RIR actual history
    let maxLoad = 0;
    let loadSum = 0;
    let rirSumAct = 0;
    let actualSetsCount = 0;
    let volLoadTot = 0;

    const history = matchingLogs.map(l => {
      let lVol = 0;
      let lLoadMax = 0;

      l.sets.forEach(s => {
        lVol += s.repEffettive * s.carico;
        rirSumAct += s.rirEffettivo;
        actualSetsCount++;
        loadSum += s.carico;
        if (s.carico > lLoadMax) lLoadMax = s.carico;
        if (s.carico > maxLoad) maxLoad = s.carico;
      });

      volLoadTot += lVol;

      return {
        data: l.data,
        carico: lLoadMax,
        reps: l.sets[0] ? l.sets[0].repEffettive : 0,
        rir: l.sets[0] ? l.sets[0].rirEffettivo : 0,
        volume: lVol
      };
    }).sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime());

    const avgLoad = actualSetsCount > 0 ? loadSum / actualSetsCount : 0;
    const rirMedio = actualSetsCount > 0 ? rirSumAct / actualSetsCount : 0;

    const lastP = history[history.length - 1] ? `${history[history.length - 1].carico}${unit} x ${history[history.length - 1].reps}` : 'Nessuno';
    const bestSet = matchingLogs.flatMap(l => l.sets).sort((a, b) => b.carico - a.carico)[0];
    const bestP = bestSet ? `${bestSet.carico}${unit} x ${bestSet.repEffettive}` : 'Nessuno';

    let exVolSch = 0;
    let hasSchVol = true;
    matchingSch.forEach(s => {
      const v = getExerciseVolumeLoad(s.exercise);
      if (v !== null) exVolSch += v;
      else hasSchVol = false;
    });

    return {
      id: sample ? sample.id : exName,
      nome: exName,
      distretto,
      apparizioni: app,
      weeksActive: activeWks,
      serieTotali: scheduledSetsCount,
      repsTotali: scheduledRepsCount,
      caricoMedio: Math.round(avgLoad * 10) / 10,
      caricoMassimo: maxLoad,
      volumeLoad: hasSchVol ? Math.round(exVolSch) : -1,
      rirMedio: Math.round(rirMedio * 10) / 10,
      frequenza: app / planWeeksCount,
      ultimaPrestazione: lastP,
      migliorePrestazione: bestP,
      history
    };
  });

  // 14. Configurable Warnings and Alerts Panel
  const avv = settings.avvisiAttivi ?? {
    distrettoNonAllenato: true,
    singoloStimolo: true,
    volumeEccessivoGiornata: true,
    durataElevata: true,
    carichiMancanti: true
  };

  const isIgnored = (id: string) => {
    const saved = localStorage.getItem(`alert_ignore_${planInScope!.id}_${id}`);
    return saved === 'true';
  };

  const savedNote = (id: string) => {
    return localStorage.getItem(`alert_note_${planInScope!.id}_${id}`) || '';
  };

  DISTRICTS.forEach(dist => {
    const match = res.volumePerDistrict.find(v => v.district === dist);
    if (avv.distrettoNonAllenato && (!match || match.weighted === 0)) {
      res.alerts.push({
        id: `unworked_${dist}`,
        type: 'warning',
        title: `Distretto non allenato: ${dist}`,
        description: `Nessuna serie pianificata per il distretto "${dist}" in questo programma.`,
        ignored: isIgnored(`unworked_${dist}`),
        note: savedNote(`unworked_${dist}`)
      });
    } else if (avv.singoloStimolo && match && match.weighted > 0 && match.weighted <= 3) {
      res.alerts.push({
        id: `low_volume_${dist}`,
        type: 'info',
        title: `Volume stimolo ridotto: ${dist}`,
        description: `Il distretto "${dist}" ha solamente ${match.weighted} serie settimanali. Valuta se incrementare lo stimolo.`,
        ignored: isIgnored(`low_volume_${dist}`),
        note: savedNote(`low_volume_${dist}`)
      });
    }
  });

  res.dailyDistribution.forEach(day => {
    const maxDaySets = settings.limiteSerieGiornata ?? 20;
    if (avv.volumeEccessivoGiornata && day.totalSets > maxDaySets) {
      res.alerts.push({
        id: `heavy_day_${day.dayName}`,
        type: 'warning',
        title: `Volume elevato: ${day.dayName}`,
        description: `La giornata "${day.dayName}" presenta ${day.totalSets} serie totali pianificate (limite consigliato: ${maxDaySets}).`,
        threshold: `${maxDaySets} serie`,
        ignored: isIgnored(`heavy_day_${day.dayName}`),
        note: savedNote(`heavy_day_${day.dayName}`)
      });
    }

    if (avv.durataElevata && day.duration > 90) {
      res.alerts.push({
        id: `long_day_${day.dayName}`,
        type: 'info',
        title: `Durata stimata elevata: ${day.dayName}`,
        description: `L'allenamento "${day.dayName}" ha una durata stimata di ${day.duration} minuti. Valuta di ottimizzare i tempi o le serie.`,
        threshold: `90 minuti`,
        ignored: isIgnored(`long_day_${day.dayName}`),
        note: savedNote(`long_day_${day.dayName}`)
      });
    }
  });

  // Check missing load warning
  const missingLoadCount = schExercises.filter(s => !s.exercise.caricoPrevisto && (!s.exercise.blocks || s.exercise.blocks.some(b => !b.caricoPrevisto))).length;
  if (avv.carichiMancanti && missingLoadCount > 0) {
    res.alerts.push({
      id: 'missing_loads',
      type: 'info',
      title: 'Carichi programmati mancanti',
      description: `Ci sono ${missingLoadCount} esercizi in cui il carico consigliato non è stato compilato.`,
      ignored: isIgnored('missing_loads'),
      note: savedNote('missing_loads')
    });
  }

  return res;
}

export interface ComparisonReport {
  title: string;
  metrics: {
    label: string;
    valA: string | number;
    valB: string | number;
    diff: string | number;
    percentDiff: string;
  }[];
  addedExercises: string[];
  removedExercises: string[];
  replacedExercises: { oldEx: string; newEx: string }[];
}

export function compareWeeksData(
  plan: WorkoutPlan,
  weekA: number,
  weekB: number,
  settings: AnalisiSettings
): ComparisonReport {
  const dbExercises = getDatabaseExercises();
  const weeksList = plan.weeks || [];
  const weekObjA = weeksList.find(w => w.weekIndex === weekA);
  const weekObjB = weeksList.find(w => w.weekIndex === weekB);

  const daysA = weekObjA ? weekObjA.giornate : plan.giornate || [];
  const daysB = weekObjB ? weekObjB.giornate : plan.giornate || [];

  const exsA = daysA.flatMap(d => d.esercizi);
  const exsB = daysB.flatMap(d => d.esercizi);

  const setsA = exsA.reduce((sum, e) => sum + getExerciseSetsCount(e), 0);
  const setsB = exsB.reduce((sum, e) => sum + getExerciseSetsCount(e), 0);

  const repsA = exsA.reduce((sum, e) => sum + getExerciseRepsCount(e), 0);
  const repsB = exsB.reduce((sum, e) => sum + getExerciseRepsCount(e), 0);

  let volA = 0;
  exsA.forEach(e => {
    const v = getExerciseVolumeLoad(e);
    if (v !== null) volA += v;
  });
  let volB = 0;
  exsB.forEach(e => {
    const v = getExerciseVolumeLoad(e);
    if (v !== null) volB += v;
  });

  const getWeekAvgRir = (exs: WorkoutExercise[]) => {
    let rirSum = 0;
    let rirCount = 0;
    exs.forEach(e => {
      const sets = getExerciseSets(e, dbExercises);
      sets.forEach(set => {
        if (set.rir !== undefined) {
          rirSum += set.rir;
          rirCount++;
        }
      });
    });
    return rirCount > 0 ? rirSum / rirCount : 0;
  };

  const rirA = getWeekAvgRir(exsA);
  const rirB = getWeekAvgRir(exsB);

  const durationA = daysA.reduce((sum, d) => sum + estimateDayDuration(d, settings, dbExercises), 0);
  const durationB = daysB.reduce((sum, d) => sum + estimateDayDuration(d, settings, dbExercises), 0);

  // Precise row-matching based on programRowId and programDayId
  const added: string[] = [];
  const removed: string[] = [];
  const replaced: { oldEx: string; newEx: string }[] = [];

  const mapA = new Map<string, WorkoutExercise>();
  exsA.forEach(ex => {
    if (ex.programRowId) {
      mapA.set(ex.programRowId, ex);
    }
  });

  const mapB = new Map<string, WorkoutExercise>();
  exsB.forEach(ex => {
    if (ex.programRowId) {
      mapB.set(ex.programRowId, ex);
    }
  });

  // Check B against A (to find added or replaced)
  exsB.forEach(exB => {
    if (exB.programRowId) {
      const exA = mapA.get(exB.programRowId);
      if (!exA) {
        added.push(exB.nome);
      } else {
        if (exA.nome.toLowerCase() !== exB.nome.toLowerCase()) {
          replaced.push({ oldEx: exA.nome, newEx: exB.nome });
        }
      }
    } else {
      const existsInA = exsA.some(exA => exA.nome.toLowerCase() === exB.nome.toLowerCase());
      if (!existsInA) {
        added.push(exB.nome);
      }
    }
  });

  // Check A against B (to find removed)
  exsA.forEach(exA => {
    if (exA.programRowId) {
      if (!mapB.has(exA.programRowId)) {
        removed.push(exA.nome);
      }
    } else {
      const existsInB = exsB.some(exB => exB.nome.toLowerCase() === exA.nome.toLowerCase());
      if (!existsInB) {
        removed.push(exA.nome);
      }
    }
  });

  const getPercentDiff = (valA: number, valB: number) => {
    if (valA === 0) return valB === 0 ? '0%' : '+100%';
    const pct = ((valB - valA) / valA) * 100;
    return `${pct >= 0 ? '+' : ''}${pct.toFixed(1)}%`;
  };

  return {
    title: `Confronto Settimana ${weekA} vs Settimana ${weekB}`,
    metrics: [
      { label: 'Serie totali', valA: setsA, valB: setsB, diff: setsB - setsA, percentDiff: getPercentDiff(setsA, setsB) },
      { label: 'Ripetizioni totali', valA: Math.round(repsA), valB: Math.round(repsB), diff: Math.round(repsB - repsA), percentDiff: getPercentDiff(repsA, repsB) },
      { label: 'Volume Load totale', valA: `${Math.round(volA)}kg`, valB: `${Math.round(volB)}kg`, diff: `${Math.round(volB - volA)}kg`, percentDiff: getPercentDiff(volA, volB) },
      { label: 'RIR medio', valA: rirA.toFixed(1), valB: rirB.toFixed(1), diff: (rirB - rirA).toFixed(1), percentDiff: getPercentDiff(rirA, rirB) },
      { label: 'Durata totale stimata', valA: `${durationA} min`, valB: `${durationB} min`, diff: `${durationB - durationA} min`, percentDiff: getPercentDiff(durationA, durationB) }
    ],
    addedExercises: added,
    removedExercises: removed,
    replacedExercises: replaced
  };
}

export function comparePlansData(
  planA: WorkoutPlan,
  planB: WorkoutPlan,
  settings: AnalisiSettings
): ComparisonReport {
  const dbExercises = getDatabaseExercises();
  const daysA = planA.giornate || [];
  const daysB = planB.giornate || [];

  const exsA = daysA.flatMap(d => d.esercizi);
  const exsB = daysB.flatMap(d => d.esercizi);

  const setsA = exsA.reduce((sum, e) => sum + getExerciseSetsCount(e), 0);
  const setsB = exsB.reduce((sum, e) => sum + getExerciseSetsCount(e), 0);

  const repsA = exsA.reduce((sum, e) => sum + getExerciseRepsCount(e), 0);
  const repsB = exsB.reduce((sum, e) => sum + getExerciseRepsCount(e), 0);

  const durationA = daysA.reduce((sum, d) => sum + estimateDayDuration(d, settings, dbExercises), 0);
  const durationB = daysB.reduce((sum, d) => sum + estimateDayDuration(d, settings, dbExercises), 0);

  const getPercentDiff = (valA: number, valB: number) => {
    if (valA === 0) return valB === 0 ? '0%' : '+100%';
    const pct = ((valB - valA) / valA) * 100;
    return `${pct >= 0 ? '+' : ''}${pct.toFixed(1)}%`;
  };

  return {
    title: `Confronto Programma: ${planA.nome} vs ${planB.nome}`,
    metrics: [
      { label: 'Numero Giornate', valA: daysA.length, valB: daysB.length, diff: daysB.length - daysA.length, percentDiff: getPercentDiff(daysA.length, daysB.length) },
      { label: 'Serie totali medie', valA: setsA, valB: setsB, diff: setsB - setsA, percentDiff: getPercentDiff(setsA, setsB) },
      { label: 'Ripetizioni medie', valA: Math.round(repsA), valB: Math.round(repsB), diff: Math.round(repsB - repsA), percentDiff: getPercentDiff(repsA, repsB) },
      { label: 'Durata media stimata', valA: `${durationA} min`, valB: `${durationB} min`, diff: `${durationB - durationA} min`, percentDiff: getPercentDiff(durationA, durationB) }
    ],
    addedExercises: [],
    removedExercises: [],
    replacedExercises: []
  };
}

