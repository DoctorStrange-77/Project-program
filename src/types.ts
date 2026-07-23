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

export type MeasurementContext =
  | 'presenza'
  | 'online'
  | 'autonoma';

export type BodyCompositionMethod =
  | 'manuale'
  | 'plicometria'
  | 'bioimpedenza'
  | 'dexa'
  | 'altro';

export interface CircumferenceMeasurements {
  collo?: number;
  spalle?: number;
  torace?: number;
  vita?: number;
  addome?: number;
  fianchi?: number;

  braccioSinistroRilassato?: number;
  braccioDestroRilassato?: number;
  braccioSinistroFlesso?: number;
  braccioDestroFlesso?: number;

  avambraccioSinistro?: number;
  avambraccioDestro?: number;

  cosciaSinistraProssimale?: number;
  cosciaDestraProssimale?: number;
  cosciaSinistraMediale?: number;
  cosciaDestraMediale?: number;

  polpaccioSinistro?: number;
  polpaccioDestro?: number;
}

export type SkinfoldSite =
  | 'pettorale'
  | 'addominale'
  | 'coscia'
  | 'tricipitale'
  | 'bicipitale'
  | 'sottoscapolare'
  | 'sovrailiaca'
  | 'ascellareMedia'
  | 'polpaccio'
  | 'lombare';

export interface SkinfoldReading {
  site: SkinfoldSite;
  readings: number[];
  selectedValue?: number;
}

export interface SkinfoldMeasurements {
  protocolName?: string;
  caliperName?: string;
  readings?: SkinfoldReading[];
  notes?: string;
}

export type SkinfoldFormulaId =
  | 'jackson_pollock_3_male'
  | 'jackson_pollock_3_female'
  | 'jackson_pollock_7_male'
  | 'jackson_pollock_7_female'
  | 'durnin_womersley_4';

export type BodyDensityConversionId =
  | 'siri_1961'
  | 'brozek_1963';

export type BodyCompositionCalculationStatus =
  | 'valid'
  | 'warning'
  | 'invalid';

export interface BodyCompositionCalculationInput {
  formulaId: SkinfoldFormulaId;
  conversionId: BodyDensityConversionId;
  sesso: Sesso;
  eta: number;
  pesoKg: number;
  skinfoldValuesMm: Partial<Record<SkinfoldSite, number>>;
}

export interface BodyCompositionCalculationResult {
  status: BodyCompositionCalculationStatus;

  formulaId: SkinfoldFormulaId;
  formulaLabel: string;
  formulaVersion: string;

  conversionId: BodyDensityConversionId;
  conversionLabel: string;

  sessoUtilizzato: Sesso;
  etaUtilizzata: number;
  pesoUtilizzatoKg: number;

  sitesRequired: SkinfoldSite[];
  siteValuesMm: Partial<Record<SkinfoldSite, number>>;
  skinfoldSumMm: number;

  bodyDensity?: number;
  bodyFatPercent?: number;
  fatMassKg?: number;
  leanMassKg?: number;

  errors: string[];
  warnings: string[];

  calculatedAt: string;
}

export interface SavedBodyCompositionCalculation
  extends BodyCompositionCalculationResult {
  id: string;
  inputSignature: string;
}

export interface BodyCompositionData {
  method?: BodyCompositionMethod;

  bodyFatPercent?: number;
  fatMassKg?: number;
  leanMassKg?: number;

  skeletalMuscleMassKg?: number;
  totalBodyWaterPercent?: number;
  visceralFatIndex?: number;

  deviceName?: string;
  manuallyEntered?: boolean;

  calculationMode?: 'manuale' | 'formula';
  savedCalculation?: SavedBodyCompositionCalculation;
  calculationOutdated?: boolean;
}

export interface MeasurementConditions {
  time?: string;
  fastingHours?: number;
  hydrationNotes?: string;
  lastTrainingHours?: number;
  operatorName?: string;
  clothingNotes?: string;
  measurementLocation?: string;
}

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
  
  context?: MeasurementContext;
  altezza?: number;
  circonferenze?: CircumferenceMeasurements;
  pliche?: SkinfoldMeasurements;
  composizioneCorporea?: BodyCompositionData;
  condizioni?: MeasurementConditions;
  createdAt?: string;
  updatedAt?: string;
}

export type TrainingEnvironmentType =
  | 'palestra_commerciale'
  | 'studio_personal'
  | 'home_gym'
  | 'casa'
  | 'outdoor'
  | 'altro';

export type TrainingEnvironmentStatus =
  | 'attivo'
  | 'secondario'
  | 'archiviato';

export type GymEquipmentCategory =
  | 'macchine_petto'
  | 'macchine_dorso'
  | 'macchine_spalle'
  | 'macchine_braccia'
  | 'macchine_gambe'
  | 'cavi'
  | 'bilancieri'
  | 'manubri'
  | 'dischi'
  | 'panche'
  | 'rack_supporti'
  | 'corpo_libero'
  | 'cardio'
  | 'accessori'
  | 'riabilitazione'
  | 'altro';

export type GymEquipmentAvailability =
  | 'disponibile'
  | 'disponibilita_limitata'
  | 'temporaneamente_non_disponibile'
  | 'non_disponibile';

export type GymEquipmentResistanceType =
  | 'pacco_pesi'
  | 'caricamento_dischi'
  | 'cavi'
  | 'pneumatica'
  | 'elastici'
  | 'peso_libero'
  | 'corpo_libero'
  | 'altro';

export interface GymEquipmentItem {
  id: string;

  nome: string;
  categoria: GymEquipmentCategory;
  disponibilita: GymEquipmentAvailability;

  marca?: string;
  modello?: string;
  quantita?: number;

  tipoResistenza?: GymEquipmentResistanceType;

  caricoMinimoKg?: number;
  caricoMassimoKg?: number;
  incrementoCaricoKg?: number;

  unilaterale?: boolean;
  convergente?: boolean;
  regolabile?: boolean;
  microcaricoDisponibile?: boolean;

  rapportoCarrucola?: string;

  caratteristiche?: string;
  limitazioni?: string;
  noteCoach?: string;

  createdAt: string;
  updatedAt: string;
}

export interface TrainingEnvironment {
  id: string;

  nome: string;
  tipo: TrainingEnvironmentType;
  stato: TrainingEnvironmentStatus;

  nomeStruttura?: string;
  localita?: string;

  giorniDisponibili?: string[];
  fasciaOraria?: string;

  equipment: GymEquipmentItem[];

  limitazioniGenerali?: string;
  noteGenerali?: string;

  createdAt: string;
  updatedAt: string;
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
  checkIns?: ClientCheckIn[];
  trainingEnvironments?: TrainingEnvironment[];
}

export type ClientCheckType =
  | 'presenza'
  | 'online';

export type ClientCheckStatus =
  | 'bozza'
  | 'da_inviare'
  | 'inviato'
  | 'ricevuto'
  | 'revisionato';

export interface ClientCheckIn {
  id: string;
  data: string;
  tipo: ClientCheckType;
  stato: ClientCheckStatus;

  measurementId?: string;

  aderenzaAllenamento?: number;
  aderenzaNutrizione?: number;

  energia?: number;
  sonnoQualita?: number;
  sonnoOre?: number;
  stress?: number;
  fame?: number;
  digestione?: number;
  recupero?: number;

  passiMedi?: number;
  cardioSessioni?: number;
  cardioMinuti?: number;

  allenamentiPrevisti?: number;
  allenamentiCompletati?: number;

  feedbackCliente?: string;
  difficoltaRiscontrate?: string;
  eventiRilevanti?: string;

  valutazioneCoach?: string;
  modificheAllenamento?: string;
  modificheNutrizione?: string;
  azioniConcordate?: string;

  prossimoControllo?: string;

  createdAt: string;
  updatedAt: string;
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

export type ExerciseGroupType =
  | 'superset'
  | 'compound_set'
  | 'triset'
  | 'giant_set'
  | 'jumpset'
  | 'circuit';

export const EXERCISE_GROUP_LABELS: Record<ExerciseGroupType, string> = {
  superset: 'Superset',
  compound_set: 'Compound Set',
  triset: 'Triset',
  giant_set: 'Giant Set',
  jumpset: 'Jumpset',
  circuit: 'Circuito',
};

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
  groupType?: ExerciseGroupType;
  groupRest?: number; // common rest after group
  groupOrder?: number;
  groupRestBetweenExercisesSec?: number;
  groupRestAfterRoundSec?: number;
  groupRounds?: number;
  
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
