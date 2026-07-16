/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Client, WorkoutPlan, WorkoutWeek, WorkoutDay, WorkoutExercise, LogbookEntry, LogbookSet, CoachConfig, AnalisiSettings } from '../types';

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

// Calculate duration for a single day based on exercise specifics and transition times
export function estimateDayDuration(day: WorkoutDay, settings: AnalisiSettings): number {
  const transition = settings.tempoTransizione ?? 90;
  let totalSeconds = 0;
  if (!day.esercizi || day.esercizi.length === 0) return 0;

  // Track sets and rests
  day.esercizi.forEach((ex) => {
    const s = ex.serie || 0;
    const reps = (ex.repMin + ex.repMax) / 2 || 10;
    const tutSecs = parseTUT(ex.tut);
    const setDuration = reps * tutSecs;
    const exerciseRest = ex.recupero || 90;

    // Time for sets + rests inside this exercise
    const exerciseTime = (s * setDuration) + (Math.max(0, s - 1) * exerciseRest);
    totalSeconds += exerciseTime;
  });

  // Add transition times between exercises
  totalSeconds += (day.esercizi.length - 1) * transition;

  return Math.round(totalSeconds / 60); // return in minutes
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
        // Apply muscle filter
        const isMainMuscle = filters.muscle === 'all' || ex.distrettoMuscolare === filters.muscle;
        const secondaries = getFallbackSecondaries(ex.nome, ex.distrettoMuscolare);
        const isSecondaryMuscle = filters.muscle !== 'all' && secondaries.includes(filters.muscle);
        
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

    // Apply muscle and exercise filter by looking at the specific log item
    if (filters.exerciseName !== 'all' && l.exerciseNome.toLowerCase() !== filters.exerciseName.toLowerCase()) {
      return;
    }

    // Secondary muscles lookup
    const mockMain = l.sets[0] ? 'Pettorali' : 'Pettorali'; // placeholder or fallback
    const matchedEx = planInScope!.giornate.flatMap(g => g.esercizi).find(e => e.nome.toLowerCase() === l.exerciseNome.toLowerCase());
    const distretto = matchedEx ? matchedEx.distrettoMuscolare : 'Pettorali';
    const secondaries = matchedEx ? getFallbackSecondaries(matchedEx.nome, matchedEx.distrettoMuscolare) : [];

    const isMainMuscle = filters.muscle === 'all' || distretto === filters.muscle;
    const isSecMuscle = filters.muscle !== 'all' && secondaries.includes(filters.muscle);

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
  res.totalSetsScheduled = schExercises.reduce((sum, s) => sum + s.exercise.serie, 0);
  res.totalRepsScheduled = schExercises.reduce((sum, s) => sum + (s.exercise.serie * ((s.exercise.repMin + s.exercise.repMax) / 2)), 0);
  
  // Calculate Volume Load Scheduled
  let totalVolSched = 0;
  let countVolSched = 0;
  schExercises.forEach(s => {
    const wVal = parseWeight(s.exercise.caricoPrevisto);
    if (wVal > 0) {
      const avgReps = (s.exercise.repMin + s.exercise.repMax) / 2;
      totalVolSched += s.exercise.serie * avgReps * wVal;
      countVolSched++;
    }
  });
  res.totalVolumeLoadScheduled = totalVolSched;

  // Calculate Duration Scheduled
  // Estimate day by day in scope
  const uniqueWeekDays = Array.from(new Set(schExercises.map(s => `${s.weekIndex}-${s.dayId}`)));
  let durationSchedSum = 0;
  uniqueWeekDays.forEach(wd => {
    const [wIdxStr, dId] = wd.split('-');
    const wIdx = parseInt(wIdxStr);
    const weekObj = weeksList.find(wk => wk.weekIndex === wIdx);
    const dayObj = (weekObj ? weekObj.giornate : planInScope!.giornate || []).find(d => d.id === dId || d.nome === dId);
    if (dayObj) {
      durationSchedSum += estimateDayDuration(dayObj, settings);
    }
  });
  res.totalDurationScheduled = durationSchedSum;
  res.avgDurationScheduled = res.totalWorkoutsScheduled > 0 ? Math.round(durationSchedSum / res.totalWorkoutsScheduled) : 0;

  // Average recovery & Planned RIR
  const recSum = schExercises.reduce((sum, s) => sum + (s.exercise.recupero || 90), 0);
  res.avgRecuperoScheduled = schExercises.length > 0 ? Math.round(recSum / schExercises.length) : 0;
  const rirSum = schExercises.reduce((sum, s) => sum + (s.exercise.rir || 0), 0);
  res.avgRirScheduled = schExercises.length > 0 ? Math.round((rirSum / schExercises.length) * 10) / 10 : 0;

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
  // Since we don't track clock-in clock-out, we estimate executed duration based on logged exercises
  // Group logbook entries by date
  const logsByDate: Record<string, LogbookEntry[]> = {};
  logEntries.forEach(l => {
    if (!logsByDate[l.data]) logsByDate[l.data] = [];
    logsByDate[l.data].push(l);
  });

  let durationExecSum = 0;
  Object.keys(logsByDate).forEach(date => {
    const dailyLogs = logsByDate[date];
    let dailySecs = 0;
    dailyLogs.forEach(l => {
      const setsCount = l.sets.length;
      const matchedEx = planInScope!.giornate.flatMap(g => g.esercizi).find(e => e.nome.toLowerCase() === l.exerciseNome.toLowerCase());
      const tutSecs = matchedEx ? parseTUT(matchedEx.tut) : 3;
      const recovery = matchedEx ? matchedEx.recupero : 90;
      
      l.sets.forEach(s => {
        dailySecs += (s.repEffettive * tutSecs);
      });
      dailySecs += Math.max(0, setsCount - 1) * recovery;
    });
    // Transitions
    const transition = settings.tempoTransizione ?? 90;
    dailySecs += (dailyLogs.length - 1) * transition;
    durationExecSum += Math.round(dailySecs / 60);
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
  // Completion index balances workout execution and set completions
  res.completamentoPercent = Math.min(100, Math.round((res.aderenzaAllenamenti * 0.4) + (res.aderenzaSerie * 0.6)));

  // List of all 14 muscle groups
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
      const secs = getFallbackSecondaries(ex.nome, ex.distrettoMuscolare);
      
      if (ex.distrettoMuscolare === dist) {
        direct += ex.serie;
        scheduledSets += ex.serie;
      } else if (secs.includes(dist)) {
        secondary += ex.serie * coeff;
      }
    });

    // Executed matching
    logEntries.forEach(l => {
      const matchedEx = planInScope!.giornate.flatMap(g => g.esercizi).find(e => e.nome.toLowerCase() === l.exerciseNome.toLowerCase());
      const distretto = matchedEx ? matchedEx.distrettoMuscolare : 'Pettorali';
      const secs = matchedEx ? getFallbackSecondaries(matchedEx.nome, matchedEx.distrettoMuscolare) : [];

      if (distretto === dist) {
        executedSets += l.sets.length;
      } else if (secs.includes(dist)) {
        // secondary weighted sets executed
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
    // Filter scheduled for this week only
    const weekSch = schExercisesAllWeeks.filter(s => s.weekIndex === w);
    const weekLogs = logEntriesAllWeeks.filter(l => {
      const planStart = new Date(planInScope!.dataInizio || '2026-06-01');
      const logDate = new Date(l.data);
      const diffTime = Math.abs(logDate.getTime() - planStart.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      const calculatedWeek = Math.max(1, Math.ceil(diffDays / 7));
      return calculatedWeek === w;
    });

    const sets = weekSch.reduce((sum, s) => sum + s.exercise.serie, 0);
    const setsExecuted = weekLogs.reduce((sum, l) => sum + l.sets.length, 0);
    
    let vol = 0;
    weekSch.forEach(s => {
      vol += s.exercise.serie * ((s.exercise.repMin + s.exercise.repMax) / 2) * parseWeight(s.exercise.caricoPrevisto);
    });

    let volExecuted = 0;
    weekLogs.forEach(l => {
      l.sets.forEach(s => {
        volExecuted += s.repEffettive * s.carico;
      });
    });

    const reps = weekSch.reduce((sum, s) => sum + s.exercise.serie * ((s.exercise.repMin + s.exercise.repMax) / 2), 0);
    const repsExecuted = weekLogs.reduce((sum, l) => sum + l.sets.reduce((sSum, s) => sSum + s.repEffettive, 0), 0);

    const rSum = weekSch.reduce((sum, s) => sum + s.exercise.rir, 0);
    const avgRir = weekSch.length > 0 ? rSum / weekSch.length : 0;

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

    // Completion percentage for this week
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
      duration: Math.round(vol / 1000), // scaled dummy or estimate
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
        if (s.exercise.distrettoMuscolare === dist) {
          sets += s.exercise.serie || 0;
        }
      });
      row[dist] = sets;
    });
    weeklyDistrictVolume.push(row);
  }
  res.weeklyDistrictVolume = weeklyDistrictVolume;

  // 4. Planned vs Executed Chart
  // Fill weekly
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

  // 6. Heatmap Grid (Districts vs Days/Weeks)
  res.heatmap = DISTRICTS.map(dist => {
    const row: any = { district: dist };
    // Days breakdown
    const dayNames = ['A: Spinta', 'B: Trazione', 'C: Gambe', 'D: Focus'];
    dayNames.forEach(dName => {
      const matchKey = dName.split(':')[0];
      let seriesCount = 0;
      schExercises.forEach(s => {
        if (s.exercise.distrettoMuscolare === dist && s.dayName.includes(matchKey)) {
          seriesCount += s.exercise.serie;
        }
      });
      row[dName] = seriesCount;
    });
    return row;
  }).filter(r => Object.values(r).some(v => typeof v === 'number' && v > 0));

  // 7. Training Frequency
  res.frequency = DISTRICTS.map(dist => {
    // Days active
    const activeDays = Array.from(new Set(
      schExercises.filter(s => s.exercise.distrettoMuscolare === dist).map(s => s.dayName.split(':')[0].trim())
    ));
    const sedute = activeDays.length;
    
    // Distances calculation
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
      totalSets: daySch.reduce((sum, s) => sum + s.exercise.serie, 0),
      totalExercises: daySch.length,
      duration: estimateDayDuration({ id: 'any', nome: dName, esercizi: daySch.map(s => s.exercise) }, settings),
      avgRecupero: daySch.length > 0 ? Math.round(daySch.reduce((sum, s) => sum + (s.exercise.recupero || 90), 0) / daySch.length) : 0
    };

    // Muscle breakdown
    DISTRICTS.forEach(dist => {
      const match = daySch.filter(s => s.exercise.distrettoMuscolare === dist);
      if (match.length > 0) {
        dayObj[dist] = match.reduce((sum, s) => sum + s.exercise.serie, 0);
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
      const r = s.exercise.rir;
      if (bin === 'RIR 0' && r === 0) scheduledSets += s.exercise.serie;
      else if (bin === 'RIR 1' && r === 1) scheduledSets += s.exercise.serie;
      else if (bin === 'RIR 2' && r === 2) scheduledSets += s.exercise.serie;
      else if (bin === 'RIR 3' && r === 3) scheduledSets += s.exercise.serie;
      else if (bin === 'RIR 4' && r === 4) scheduledSets += s.exercise.serie;
      else if (bin === 'RIR 5+' && r >= 5) scheduledSets += s.exercise.serie;
      else if (bin === 'Non indicato' && r === undefined) scheduledSets += s.exercise.serie;
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

  const totalSetsRepSum = schExercises.reduce((sum, s) => sum + s.exercise.serie, 0);
  res.repsDistribution = repBins.map(bin => {
    const matchingSch = schExercises.filter(s => {
      const avg = (s.exercise.repMin + s.exercise.repMax) / 2;
      if (bin.min === 0 && avg === 0) return true;
      return avg >= bin.min && avg <= bin.max;
    });

    const sets = matchingSch.reduce((sum, s) => sum + s.exercise.serie, 0);
    const districts = Array.from(new Set(matchingSch.map(s => s.exercise.distrettoMuscolare))).slice(0, 3);
    const exercises = Array.from(new Set(matchingSch.map(s => s.exercise.nome))).slice(0, 3);

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
  res.intensityTechniques = techList.map(tech => {
    const matches = schExercises.filter(s => s.exercise.tecnicaIntensita?.toLowerCase() === tech.toLowerCase());
    const exercisesCount = matches.length;
    const setsCount = matches.reduce((sum, s) => sum + s.exercise.serie, 0);
    const districts = Array.from(new Set(matches.map(s => s.exercise.distrettoMuscolare)));

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
    const sets = sch.reduce((sum, s) => sum + s.exercise.serie, 0);
    const reps = sch.reduce((sum, s) => sum + (s.exercise.serie * ((s.exercise.repMin + s.exercise.repMax) / 2)), 0);
    
    let vol = 0;
    sch.forEach(s => {
      vol += s.exercise.serie * ((s.exercise.repMin + s.exercise.repMax) / 2) * parseWeight(s.exercise.caricoPrevisto);
    });

    const duration = estimateDayDuration({ id: 'any', nome: dName, esercizi: sch.map(s => s.exercise) }, settings) || 45;

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
    const distretto = sample ? sample.distrettoMuscolare : 'Pettorali';
    const app = matchingSch.length;
    const activeWks = Array.from(new Set(matchingSch.map(s => s.weekIndex))).sort();

    const scheduledSetsCount = matchingSch.reduce((sum, s) => sum + s.exercise.serie, 0);
    const scheduledRepsCount = matchingSch.reduce((sum, s) => sum + s.exercise.serie * ((s.exercise.repMin + s.exercise.repMax) / 2), 0);

    // Carichi / RIR actual history
    let maxLoad = 0;
    let loadSum = 0;
    let rirSumAct = 0;
    let actualSetsCount = 0;
    let volLoadTot = 0;

    const history = matchingLogs.map(l => {
      let lVol = 0;
      let lLoadMax = 0;
      let lRepsTot = 0;
      let lRirAvg = 0;

      l.sets.forEach(s => {
        lVol += s.repEffettive * s.carico;
        lRepsTot += s.repEffettive;
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

    // Ultima / Migliore
    const lastP = history[history.length - 1] ? `${history[history.length - 1].carico}${unit} x ${history[history.length - 1].reps}` : 'Nessuno';
    const bestSet = matchingLogs.flatMap(l => l.sets).sort((a, b) => b.carico - a.carico)[0];
    const bestP = bestSet ? `${bestSet.carico}${unit} x ${bestSet.repEffettive}` : 'Nessuno';

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
      volumeLoad: Math.round(volLoadTot),
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
  const missingLoadCount = schExercises.filter(s => !s.exercise.caricoPrevisto).length;
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
  const weeksList = plan.weeks || [];
  const weekObjA = weeksList.find(w => w.weekIndex === weekA);
  const weekObjB = weeksList.find(w => w.weekIndex === weekB);

  const daysA = weekObjA ? weekObjA.giornate : plan.giornate || [];
  const daysB = weekObjB ? weekObjB.giornate : plan.giornate || [];

  const exsA = daysA.flatMap(d => d.esercizi);
  const exsB = daysB.flatMap(d => d.esercizi);

  const setsA = exsA.reduce((sum, e) => sum + e.serie, 0);
  const setsB = exsB.reduce((sum, e) => sum + e.serie, 0);

  const repsA = exsA.reduce((sum, e) => sum + e.serie * ((e.repMin + e.repMax) / 2), 0);
  const repsB = exsB.reduce((sum, e) => sum + e.serie * ((e.repMin + e.repMax) / 2), 0);

  let volA = 0;
  exsA.forEach(e => { volA += e.serie * ((e.repMin + e.repMax) / 2) * parseWeight(e.caricoPrevisto); });
  let volB = 0;
  exsB.forEach(e => { volB += e.serie * ((e.repMin + e.repMax) / 2) * parseWeight(e.caricoPrevisto); });

  const rirA = exsA.length > 0 ? exsA.reduce((sum, e) => sum + e.rir, 0) / exsA.length : 0;
  const rirB = exsB.length > 0 ? exsB.reduce((sum, e) => sum + e.rir, 0) / exsB.length : 0;

  const durationA = daysA.reduce((sum, d) => sum + estimateDayDuration(d, settings), 0);
  const durationB = daysB.reduce((sum, d) => sum + estimateDayDuration(d, settings), 0);

  const namesA = exsA.map(e => e.nome);
  const namesB = exsB.map(e => e.nome);

  const added = namesB.filter(n => !namesA.includes(n));
  const removed = namesA.filter(n => !namesB.includes(n));

  // simple check for replacements: if we remove A and add B on the same day and sequence, count as replacement
  const replaced: { oldEx: string; newEx: string }[] = [];
  if (removed.length > 0 && added.length > 0) {
    removed.forEach((oldEx, idx) => {
      if (added[idx]) {
        replaced.push({ oldEx, newEx: added[idx] });
      }
    });
  }

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
    addedExercises: added.filter(a => !replaced.map(r => r.newEx).includes(a)),
    removedExercises: removed.filter(r => !replaced.map(rp => rp.oldEx).includes(r)),
    replacedExercises: replaced
  };
}

export function comparePlansData(
  planA: WorkoutPlan,
  planB: WorkoutPlan,
  settings: AnalisiSettings
): ComparisonReport {
  const daysA = planA.giornate || [];
  const daysB = planB.giornate || [];

  const exsA = daysA.flatMap(d => d.esercizi);
  const exsB = daysB.flatMap(d => d.esercizi);

  const setsA = exsA.reduce((sum, e) => sum + e.serie, 0);
  const setsB = exsB.reduce((sum, e) => sum + e.serie, 0);

  const repsA = exsA.reduce((sum, e) => sum + e.serie * ((e.repMin + e.repMax) / 2), 0);
  const repsB = exsB.reduce((sum, e) => sum + e.serie * ((e.repMin + e.repMax) / 2), 0);

  const durationA = daysA.reduce((sum, d) => sum + estimateDayDuration(d, settings), 0);
  const durationB = daysB.reduce((sum, d) => sum + estimateDayDuration(d, settings), 0);

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

