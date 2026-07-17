/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface AnalisiSettings {
  coeffMuscoliSecondari: number;
  tempoTransizione: number; // in seconds
  sogliaVariazioneVolume: number; // %
  limiteSerieGiornata: number;
  intervalliRipetizioni?: string[]; // e.g. ["1–5", "6–8", "9–12", "13–15", "16–20", "oltre 20", "isometrico"]
  modalitaCalcoloVolumeLoad?: 'completo' | 'solo_principale';
  defaultVisualizzazioneSerie?: 'dirette' | 'ponderate';
  avvisiAttivi?: Record<string, boolean>;
  numeroDecimali?: number;
  unitaCarico?: 'kg' | 'lb';
}

export interface CoachConfig {
  nomeProgramma: string;
  nomeCoach: string;
  teamName?: string;
  slogan?: string;
  primaryColor: string; // Hex color or Tailwind arbitrary value
  logoUrl?: string; // Base64 data URL or external URL
  isConfigured: boolean;
  
  // Customizations added
  theme?: 'dark' | 'light';
  secondaryColor?: string;
  logoShape?: 'round' | 'square';
  compactView?: boolean;
  printDicitura?: string;
  coachContact?: string;
  analisiSettings?: AnalisiSettings;
}

export type Sesso = 'Uomo' | 'Donna' | 'Altro';
export type LivelloEsperienza = 'Principiante' | 'Intermedio' | 'Avanzato';

export interface ClientMeasurement {
  id: string;
  data: string; // YYYY-MM-DD
  peso: number; // kg
  vita: number; // cm
  torace: number; // cm
  braccio: number; // cm
  coscia: number; // cm
  massaGrassa?: number; // %
  noteControllo?: string;
}

export interface Client {
  id: string;
  nome: string;
  cognome: string;
  eta: number;
  sesso: Sesso;
  obiettivo: string;
  livelloEsperienza: LivelloEsperienza;
  allenamentiSettimanali: number;
  note?: string; // note del coach
  
  // Custom profile fields
  altezza?: number; // cm
  pesoAttuale?: number; // kg
  dataInizio?: string; // YYYY-MM-DD
  limitazioniFisiche?: string;
  noteCoach?: string;
  prossimoControllo?: string; // YYYY-MM-DD (Date of next check-in)
  rilevazioni?: ClientMeasurement[];
}

export type DistrettoMuscolare = 
  | 'Pettorali'
  | 'Dorso'
  | 'Spalle'
  | 'Deltoidi anteriori'
  | 'Deltoidi laterali'
  | 'Deltoidi posteriori'
  | 'Bicipiti'
  | 'Tricipiti'
  | 'Quadricipiti'
  | 'Femorali'
  | 'Glutei'
  | 'Adduttori'
  | 'Abduttori'
  | 'Polpacci'
  | 'Addome';

export interface Exercise {
  id: string;
  nome: string;
  distrettoMuscolare: DistrettoMuscolare;
  distrettiSecondari: string[];
  attrezzatura: string;
  patternMovimento: string;
  livelloDifficolta: 'Principiante' | 'Intermedio' | 'Avanzato';
  descrizione: string;
  isCustom?: boolean;
  
  // Enhanced fields
  istruzioniEsecuzione?: string;
  erroriComuni?: string;
  linkVideo?: string;
  isFavorite?: boolean;
  modalitaConteggio?: 'entrambi_i_lati' | 'singolo_lato';
}

export interface WorkoutExerciseBlock {
  id: string;
  nome: string; // nome o etichetta
  serie: number;
  repMin: number;
  repMax: number;
  rir: number; // RIR
  caricoPrevisto?: string;
  tut?: string; // T.U.T.
  recupero: number; // in seconds
  tecnicaIntensita?: string; // tecnica di intensita
  note?: string; // note
  volumeMultiplier?: number; // volumeMultiplier facoltativo
}

export interface WorkoutExercise {
  id: string; // Unique instance ID in the workout plan
  exerciseId: string; // Reference to original exercise
  nome: string;
  distrettoMuscolare: DistrettoMuscolare;
  serie: number;
  repMin: number;
  repMax: number;
  rir: number; // Reps in Reserve
  recupero: number; // in seconds
  tut: string; // Time Under Tension (e.g. "3-0-1-0")
  noteTecniche?: string;
  
  // Multi-week and Grouping additions
  caricoPrevisto?: string;
  tecnicaIntensita?: string; // Nessuna, Top set, Back-off, Drop set, etc.
  indicazioniEsecuzione?: string;
  linkVideo?: string;
  noteSpecificheSettimana?: string;
  modalitaConteggio?: 'entrambi_i_lati' | 'singolo_lato';
  
  groupId?: string;
  groupType?: 'Superset' | 'Triset' | 'Giant set' | 'Jumpset' | 'Circuito';
  groupRest?: number; // common rest after group
  
  // Stable ID across weeks for the same logical row
  programRowId?: string;

  // Structured blocks for custom sets (e.g. top set, back-off)
  blocks?: WorkoutExerciseBlock[];
}

export interface WorkoutDay {
  id: string;
  nome: string;
  esercizi: WorkoutExercise[];
  // Stable ID across weeks for the same logical day
  programDayId?: string;
}

export interface WorkoutWeek {
  weekIndex: number; // 1-indexed (e.g. week 1, week 2, etc.)
  giornate: WorkoutDay[];
}

export type WorkoutPlanStatus = 'Bozza' | 'Attiva' | 'Completata' | 'Archiviata';

export interface WorkoutPlan {
  id: string;
  nome: string;
  clienteId: string;
  clienteNomeCompleto: string;
  obiettivo: string;
  allenamentiSettimanali: number;
  durataSettimane: number;
  dataInizio: string;
  noteGenerali: string;
  giornate: WorkoutDay[]; // Used as a fallback/draft layout (or default for week 1)
  dataCreazione: string;
  status: WorkoutPlanStatus;
  
  weeks?: WorkoutWeek[]; // Multi-week data
}

export interface WorkoutTemplate {
  id: string;
  nome: string;
  obiettivo: string;
  livello: LivelloEsperienza;
  allenamentiSettimanali: number;
  durataSettimane: number;
  noteGenerali: string;
  giornate: WorkoutDay[];
  weeks?: WorkoutWeek[];
}

export interface LogbookSet {
  serieIndex: number;
  repEffettive: number;
  carico: number;
  rirEffettivo: number;
  blockId?: string;
  blockName?: string;
  targetRepMin?: number;
  targetRepMax?: number;
  targetRir?: number;
  targetCarico?: string;
}

export interface LogbookEntry {
  id: string;
  clienteId: string;
  planId?: string;
  data: string; // YYYY-MM-DD
  giornataNome: string;
  exerciseId: string;
  exerciseNome: string;
  sets: LogbookSet[];
  note?: string;
  programRowId?: string;
  weekIndex?: number;
  programDayId?: string;
}
