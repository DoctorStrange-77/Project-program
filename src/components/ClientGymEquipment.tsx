import React, { useState, useEffect, useRef } from 'react';
import { 
  Client, CoachConfig, TrainingEnvironment, GymEquipmentItem, 
  TrainingEnvironmentType, TrainingEnvironmentStatus, GymEquipmentCategory, 
  GymEquipmentAvailability, GymEquipmentResistanceType 
} from '../types';
import { 
  Dumbbell, Plus, Edit2, Trash2, Copy, Eye, Archive, CheckCircle, 
  AlertTriangle, Search, Grid, List, Clock, User, ShieldAlert, Check, X, ArrowLeft
} from 'lucide-react';

interface ClientGymEquipmentProps {
  client: Client;
  config: CoachConfig;
  onUpdateClient: (client: Client) => void;
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

// Centralized labels as constants
export const EQUIPMENT_CATEGORY_LABELS: Record<GymEquipmentCategory, string> = {
  macchine_petto: 'Macchine petto',
  macchine_dorso: 'Macchine dorso',
  macchine_spalle: 'Macchine spalle',
  macchine_braccia: 'Macchine braccia',
  macchine_gambe: 'Macchine gambe',
  cavi: 'Cavi e stazioni',
  bilancieri: 'Bilancieri',
  manubri: 'Manubri',
  dischi: 'Dischi',
  panche: 'Panche',
  rack_supporti: 'Rack e supporti',
  corpo_libero: 'Corpo libero',
  cardio: 'Cardio',
  accessori: 'Accessori',
  riabilitazione: 'Riabilitazione e mobilità',
  altro: 'Altro'
};

export const EQUIPMENT_AVAILABILITY_LABELS: Record<GymEquipmentAvailability, string> = {
  disponibile: 'Disponibile',
  disponibilita_limitata: 'Disponibilità limitata',
  temporaneamente_non_disponibile: 'Temporaneamente non disponibile',
  non_disponibile: 'Non disponibile'
};

export const ENV_TYPE_LABELS: Record<TrainingEnvironmentType, string> = {
  palestra_commerciale: 'Palestra commerciale',
  studio_personal: 'Studio personal',
  home_gym: 'Home gym',
  casa: 'Casa',
  outdoor: 'Outdoor',
  altro: 'Altro'
};

export const ENV_STATUS_LABELS: Record<TrainingEnvironmentStatus, string> = {
  attivo: 'Attivo',
  secondario: 'Secondario',
  archiviato: 'Archiviato'
};

export const RESISTANCE_TYPE_LABELS: Record<GymEquipmentResistanceType, string> = {
  pacco_pesi: 'Pacco pesi',
  caricamento_dischi: 'Caricamento dischi',
  cavi: 'Cavi',
  pneumatica: 'Pneumatica',
  elastici: 'Elastici',
  peso_libero: 'Peso libero',
  corpo_libero: 'Corpo libero',
  altro: 'Altro'
};

export const QUICK_ADD_ITEMS = [
  // MACCHINE E STRUTTURE
  { nome: 'Chest press', categoria: 'macchine_petto', tipoResistenza: 'pacco_pesi' as GymEquipmentResistanceType },
  { nome: 'Pec deck', categoria: 'macchine_petto', tipoResistenza: 'pacco_pesi' as GymEquipmentResistanceType },
  { nome: 'Reverse pec deck', categoria: 'macchine_spalle', tipoResistenza: 'pacco_pesi' as GymEquipmentResistanceType },
  { nome: 'Shoulder press', categoria: 'macchine_spalle', tipoResistenza: 'pacco_pesi' as GymEquipmentResistanceType },
  { nome: 'Lat machine', categoria: 'macchine_dorso', tipoResistenza: 'pacco_pesi' as GymEquipmentResistanceType },
  { nome: 'Pulley', categoria: 'macchine_dorso', tipoResistenza: 'pacco_pesi' as GymEquipmentResistanceType },
  { nome: 'Row machine', categoria: 'macchine_dorso', tipoResistenza: 'pacco_pesi' as GymEquipmentResistanceType },
  { nome: 'T-bar row', categoria: 'macchine_dorso', tipoResistenza: 'caricamento_dischi' as GymEquipmentResistanceType },
  { nome: 'Leg press', categoria: 'macchine_gambe', tipoResistenza: 'caricamento_dischi' as GymEquipmentResistanceType },
  { nome: 'Hack squat', categoria: 'macchine_gambe', tipoResistenza: 'caricamento_dischi' as GymEquipmentResistanceType },
  { nome: 'Pendulum squat', categoria: 'macchine_gambe', tipoResistenza: 'caricamento_dischi' as GymEquipmentResistanceType },
  { nome: 'Leg extension', categoria: 'macchine_gambe', tipoResistenza: 'pacco_pesi' as GymEquipmentResistanceType },
  { nome: 'Leg curl seduto', categoria: 'macchine_gambe', tipoResistenza: 'pacco_pesi' as GymEquipmentResistanceType },
  { nome: 'Leg curl sdraiato', categoria: 'macchine_gambe', tipoResistenza: 'pacco_pesi' as GymEquipmentResistanceType },
  { nome: 'Hip thrust machine', categoria: 'macchine_gambe', tipoResistenza: 'caricamento_dischi' as GymEquipmentResistanceType },
  { nome: 'Calf machine', categoria: 'macchine_gambe', tipoResistenza: 'pacco_pesi' as GymEquipmentResistanceType },
  { nome: 'Abductor machine', categoria: 'macchine_gambe', tipoResistenza: 'pacco_pesi' as GymEquipmentResistanceType },
  { nome: 'Adductor machine', categoria: 'macchine_gambe', tipoResistenza: 'pacco_pesi' as GymEquipmentResistanceType },
  { nome: 'Multipower', categoria: 'rack_supporti', tipoResistenza: 'caricamento_dischi' as GymEquipmentResistanceType },
  { nome: 'Power rack', categoria: 'rack_supporti', tipoResistenza: 'peso_libero' as GymEquipmentResistanceType },
  { nome: 'Half rack', categoria: 'rack_supporti', tipoResistenza: 'peso_libero' as GymEquipmentResistanceType },
  { nome: 'Crossover ai cavi', categoria: 'cavi', tipoResistenza: 'cavi' as GymEquipmentResistanceType },
  { nome: 'Cavo singolo regolabile', categoria: 'cavi', tipoResistenza: 'cavi' as GymEquipmentResistanceType },
  // PESI LIBERI
  { nome: 'Bilanciere olimpico', categoria: 'bilancieri', tipoResistenza: 'peso_libero' as GymEquipmentResistanceType },
  { nome: 'Bilanciere EZ', categoria: 'bilancieri', tipoResistenza: 'peso_libero' as GymEquipmentResistanceType },
  { nome: 'Trap bar', categoria: 'bilancieri', tipoResistenza: 'peso_libero' as GymEquipmentResistanceType },
  { nome: 'Manubri', categoria: 'manubri', tipoResistenza: 'peso_libero' as GymEquipmentResistanceType },
  { nome: 'Dischi olimpici', categoria: 'dischi', tipoResistenza: 'peso_libero' as GymEquipmentResistanceType },
  { nome: 'Kettlebell', categoria: 'corpo_libero', tipoResistenza: 'peso_libero' as GymEquipmentResistanceType },
  { nome: 'Panca piana', categoria: 'panche', tipoResistenza: 'corpo_libero' as GymEquipmentResistanceType },
  { nome: 'Panca inclinabile', categoria: 'panche', tipoResistenza: 'corpo_libero' as GymEquipmentResistanceType },
  // ACCESSORI
  { nome: 'Cavigliere', categoria: 'accessori', tipoResistenza: 'altro' as GymEquipmentResistanceType },
  { nome: 'Corda tricipiti', categoria: 'accessori', tipoResistenza: 'altro' as GymEquipmentResistanceType },
  { nome: 'Maniglia singola', categoria: 'accessori', tipoResistenza: 'altro' as GymEquipmentResistanceType },
  { nome: 'Barra lunga', categoria: 'accessori', tipoResistenza: 'altro' as GymEquipmentResistanceType },
  { nome: 'Barra dritta corta', categoria: 'accessori', tipoResistenza: 'altro' as GymEquipmentResistanceType },
  { nome: 'Barra EZ ai cavi', categoria: 'accessori', tipoResistenza: 'altro' as GymEquipmentResistanceType },
  { nome: 'Triangolo', categoria: 'accessori', tipoResistenza: 'altro' as GymEquipmentResistanceType },
  { nome: 'Elastici', categoria: 'accessori', tipoResistenza: 'elastici' as GymEquipmentResistanceType },
  { nome: 'Belt squat belt', categoria: 'accessori', tipoResistenza: 'altro' as GymEquipmentResistanceType },
  { nome: 'Cintura per sovraccarico', categoria: 'accessori', tipoResistenza: 'altro' as GymEquipmentResistanceType },
  { nome: 'Foam roller', categoria: 'accessori', tipoResistenza: 'altro' as GymEquipmentResistanceType },
  { nome: 'Step', categoria: 'accessori', tipoResistenza: 'altro' as GymEquipmentResistanceType },
  // CARDIO
  { nome: 'Tapis roulant', categoria: 'cardio', tipoResistenza: 'altro' as GymEquipmentResistanceType },
  { nome: 'Bike', categoria: 'cardio', tipoResistenza: 'altro' as GymEquipmentResistanceType },
  { nome: 'Ellittica', categoria: 'cardio', tipoResistenza: 'altro' as GymEquipmentResistanceType },
  { nome: 'Stair climber', categoria: 'cardio', tipoResistenza: 'altro' as GymEquipmentResistanceType },
  { nome: 'Vogatore', categoria: 'cardio', tipoResistenza: 'altro' as GymEquipmentResistanceType },
  { nome: 'Air bike', categoria: 'cardio', tipoResistenza: 'altro' as GymEquipmentResistanceType }
];

const generateId = (): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'id-' + Math.random().toString(36).substring(2, 11) + '-' + Date.now().toString(36);
};

export default function ClientGymEquipment({
  client,
  config,
  onUpdateClient,
  onShowToast,
  onShowConfirm
}: ClientGymEquipmentProps) {
  const environments = client.trainingEnvironments ?? [];

  // Active Environment Detail View
  const [activeEnvId, setActiveEnvId] = useState<string | null>(null);

  // Modals & Forms
  const [showEnvModal, setShowEnvModal] = useState(false);
  const [editingEnv, setEditingEnv] = useState<TrainingEnvironment | null>(null);
  const [envForm, setEnvForm] = useState<{
    nome: string;
    tipo: TrainingEnvironmentType;
    stato: TrainingEnvironmentStatus;
    nomeStruttura: string;
    localita: string;
    giorniDisponibili: string[];
    fasciaOraria: string;
    limitazioniGenerali: string;
    noteGenerali: string;
  }>({
    nome: '',
    tipo: 'palestra_commerciale',
    stato: 'secondario',
    nomeStruttura: '',
    localita: '',
    giorniDisponibili: [],
    fasciaOraria: '',
    limitazioniGenerali: '',
    noteGenerali: ''
  });
  const [envErrors, setEnvErrors] = useState<Record<string, string>>({});

  const [showEquipModal, setShowEquipModal] = useState(false);
  const [editingEquip, setEditingEquip] = useState<GymEquipmentItem | null>(null);
  const [equipForm, setEquipForm] = useState<{
    nome: string;
    categoria: GymEquipmentCategory;
    disponibilita: GymEquipmentAvailability;
    marca: string;
    modello: string;
    quantita: string;
    tipoResistenza: string;
    caricoMinimoKg: string;
    caricoMassimoKg: string;
    incrementoCaricoKg: string;
    unilaterale: boolean;
    convergente: boolean;
    regolabile: boolean;
    microcaricoDisponibile: boolean;
    rapportoCarrucola: string;
    caratteristiche: string;
    limitazioni: string;
    noteCoach: string;
  }>({
    nome: '',
    categoria: 'macchine_petto',
    disponibilita: 'disponibile',
    marca: '',
    modello: '',
    quantita: '1',
    tipoResistenza: '',
    caricoMinimoKg: '',
    caricoMassimoKg: '',
    incrementoCaricoKg: '',
    unilaterale: false,
    convergente: false,
    regolabile: false,
    microcaricoDisponibile: false,
    rapportoCarrucola: '',
    caratteristiche: '',
    limitazioni: '',
    noteCoach: ''
  });
  const [equipErrors, setEquipErrors] = useState<Record<string, string>>({});

  const [showQuickAddModal, setShowQuickAddModal] = useState(false);
  const [quickAddSearch, setQuickAddSearch] = useState('');
  const [selectedQuickAddNames, setSelectedQuickAddNames] = useState<string[]>([]);

  // Detailed view filters & sorting
  const [equipSearch, setEquipSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterAvailability, setFilterAvailability] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'nome' | 'categoria' | 'aggiornamento'>('nome');
  const [viewMode, setViewMode] = useState<'list' | 'category'>('list');
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});

  // Keyboard accessibility
  const envModalRef = useRef<HTMLDivElement>(null);
  const equipModalRef = useRef<HTMLDivElement>(null);
  const quickAddModalRef = useRef<HTMLDivElement>(null);
  const lastActiveElement = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showEnvModal) {
          setShowEnvModal(false);
          lastActiveElement.current?.focus();
        }
        if (showEquipModal) {
          setShowEquipModal(false);
          lastActiveElement.current?.focus();
        }
        if (showQuickAddModal) {
          setShowQuickAddModal(false);
          lastActiveElement.current?.focus();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showEnvModal, showEquipModal, showQuickAddModal]);

  const openEnvModal = (env: TrainingEnvironment | null = null) => {
    lastActiveElement.current = document.activeElement as HTMLElement;
    setEnvErrors({});
    if (env) {
      setEditingEnv(env);
      setEnvForm({
        nome: env.nome,
        tipo: env.tipo,
        stato: env.stato,
        nomeStruttura: env.nomeStruttura ?? '',
        localita: env.localita ?? '',
        giorniDisponibili: env.giorniDisponibili ?? [],
        fasciaOraria: env.fasciaOraria ?? '',
        limitazioniGenerali: env.limitazioniGenerali ?? '',
        noteGenerali: env.noteGenerali ?? ''
      });
    } else {
      setEditingEnv(null);
      setEnvForm({
        nome: '',
        tipo: 'palestra_commerciale',
        stato: environments.length === 0 ? 'attivo' : 'secondario',
        nomeStruttura: '',
        localita: '',
        giorniDisponibili: [],
        fasciaOraria: '',
        limitazioniGenerali: '',
        noteGenerali: ''
      });
    }
    setShowEnvModal(true);
    setTimeout(() => {
      envModalRef.current?.querySelector('input')?.focus();
    }, 50);
  };

  const openEquipModal = (equip: GymEquipmentItem | null = null) => {
    lastActiveElement.current = document.activeElement as HTMLElement;
    setEquipErrors({});
    if (equip) {
      setEditingEquip(equip);
      setEquipForm({
        nome: equip.nome,
        categoria: equip.categoria,
        disponibilita: equip.disponibilita,
        marca: equip.marca ?? '',
        modello: equip.modello ?? '',
        quantita: equip.quantita ? String(equip.quantita) : '1',
        tipoResistenza: equip.tipoResistenza ?? '',
        caricoMinimoKg: equip.caricoMinimoKg !== undefined ? String(equip.caricoMinimoKg) : '',
        caricoMassimoKg: equip.caricoMassimoKg !== undefined ? String(equip.caricoMassimoKg) : '',
        incrementoCaricoKg: equip.incrementoCaricoKg !== undefined ? String(equip.incrementoCaricoKg) : '',
        unilaterale: !!equip.unilaterale,
        convergente: !!equip.convergente,
        regolabile: !!equip.regolabile,
        microcaricoDisponibile: !!equip.microcaricoDisponibile,
        rapportoCarrucola: equip.rapportoCarrucola ?? '',
        caratteristiche: equip.caratteristiche ?? '',
        limitazioni: equip.limitazioni ?? '',
        noteCoach: equip.noteCoach ?? ''
      });
    } else {
      setEditingEquip(null);
      setEquipForm({
        nome: '',
        categoria: 'macchine_petto',
        disponibilita: 'disponibile',
        marca: '',
        modello: '',
        quantita: '1',
        tipoResistenza: '',
        caricoMinimoKg: '',
        caricoMassimoKg: '',
        incrementoCaricoKg: '',
        unilaterale: false,
        convergente: false,
        regolabile: false,
        microcaricoDisponibile: false,
        rapportoCarrucola: '',
        caratteristiche: '',
        limitazioni: '',
        noteCoach: ''
      });
    }
    setShowEquipModal(true);
    setTimeout(() => {
      equipModalRef.current?.querySelector('input')?.focus();
    }, 50);
  };

  const openQuickAddModal = () => {
    lastActiveElement.current = document.activeElement as HTMLElement;
    setSelectedQuickAddNames([]);
    setQuickAddSearch('');
    setShowQuickAddModal(true);
    setTimeout(() => {
      quickAddModalRef.current?.querySelector('input')?.focus();
    }, 50);
  };

  // Environment operations
  const handleSaveEnvironment = (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};
    if (!envForm.nome.trim()) {
      errors.nome = "Il nome identificativo è obbligatorio.";
    }
    if (Object.keys(errors).length > 0) {
      setEnvErrors(errors);
      return;
    }

    const isoNow = new Date().toISOString();
    let updatedEnvironments = [...environments];

    // Status management: Only one active env
    if (envForm.stato === 'attivo') {
      updatedEnvironments = updatedEnvironments.map(e => ({
        ...e,
        stato: e.stato === 'attivo' ? 'secondario' : e.stato
      }));
    }

    if (editingEnv) {
      updatedEnvironments = updatedEnvironments.map(e => {
        if (e.id === editingEnv.id) {
          return {
            ...e,
            nome: envForm.nome.trim(),
            tipo: envForm.tipo,
            stato: envForm.stato,
            nomeStruttura: envForm.nomeStruttura.trim() || undefined,
            localita: envForm.localita.trim() || undefined,
            giorniDisponibili: envForm.giorniDisponibili,
            fasciaOraria: envForm.fasciaOraria.trim() || undefined,
            limitazioniGenerali: envForm.limitazioniGenerali.trim() || undefined,
            noteGenerali: envForm.noteGenerali.trim() || undefined,
            updatedAt: isoNow
          };
        }
        return e;
      });
      onShowToast?.("Ambiente di allenamento aggiornato con successo.", "success");
    } else {
      const newEnv: TrainingEnvironment = {
        id: generateId(),
        nome: envForm.nome.trim(),
        tipo: envForm.tipo,
        stato: envForm.stato,
        nomeStruttura: envForm.nomeStruttura.trim() || undefined,
        localita: envForm.localita.trim() || undefined,
        giorniDisponibili: envForm.giorniDisponibili,
        fasciaOraria: envForm.fasciaOraria.trim() || undefined,
        equipment: [],
        limitazioniGenerali: envForm.limitazioniGenerali.trim() || undefined,
        noteGenerali: envForm.noteGenerali.trim() || undefined,
        createdAt: isoNow,
        updatedAt: isoNow
      };
      updatedEnvironments.push(newEnv);
      onShowToast?.("Nuovo ambiente registrato.", "success");
    }

    onUpdateClient({
      ...client,
      trainingEnvironments: updatedEnvironments
    });
    setShowEnvModal(false);
    lastActiveElement.current?.focus();
  };

  const handleDuplicateEnvironment = (env: TrainingEnvironment) => {
    const isoNow = new Date().toISOString();
    let updatedEnvironments = [...environments];

    const newEnv: TrainingEnvironment = {
      ...env,
      id: generateId(),
      nome: `${env.nome} (Copia)`,
      stato: 'secondario',
      equipment: env.equipment.map(eq => ({
        ...eq,
        id: generateId(),
        createdAt: isoNow,
        updatedAt: isoNow
      })),
      createdAt: isoNow,
      updatedAt: isoNow
    };

    updatedEnvironments.push(newEnv);
    onUpdateClient({
      ...client,
      trainingEnvironments: updatedEnvironments
    });
    onShowToast?.("Ambiente duplicato con successo.", "success");
  };

  const handleDeleteEnvironment = (env: TrainingEnvironment) => {
    const performDeletion = () => {
      const updatedEnvironments = environments.filter(e => e.id !== env.id);
      onUpdateClient({
        ...client,
        trainingEnvironments: updatedEnvironments
      });
      if (activeEnvId === env.id) {
        setActiveEnvId(null);
      }
      onShowToast?.("Ambiente rimosso con successo.", "success");
    };

    if (onShowConfirm) {
      onShowConfirm({
        title: "Elimina Ambiente",
        message: `Sei sicuro di voler eliminare l'ambiente "${env.nome}" con ${env.equipment.length} attrezzature? L'operazione è irreversibile.`,
        confirmText: "Elimina",
        cancelText: "Annulla",
        isDestructive: true,
        onConfirm: performDeletion
      });
    } else {
      if (window.confirm(`Sei sicuro di voler eliminare l'ambiente "${env.nome}"? Questa azione è irreversibile.`)) {
        performDeletion();
      }
    }
  };

  const handleToggleArchivedEnvironment = (env: TrainingEnvironment) => {
    const nextStato = env.stato === 'archiviato' ? 'secondario' : 'archiviato';
    const isoNow = new Date().toISOString();
    const updatedEnvironments = environments.map(e => {
      if (e.id === env.id) {
        return {
          ...e,
          stato: nextStato,
          updatedAt: isoNow
        } as TrainingEnvironment;
      }
      return e;
    });
    onUpdateClient({
      ...client,
      trainingEnvironments: updatedEnvironments
    });
    onShowToast?.(
      nextStato === 'archiviato' ? "Ambiente archiviato." : "Ambiente riattivato.",
      "success"
    );
  };

  // Equipment operations
  const handleSaveEquipment = (isConfirmedDuplicate = false) => {
    const errors: Record<string, string> = {};
    if (!equipForm.nome.trim()) {
      errors.nome = "Il nome dell'attrezzatura è obbligatorio.";
    }
    if (!equipForm.categoria) {
      errors.categoria = "La categoria è obbligatoria.";
    }

    // Number validation
    const quantitaVal = parseInt(equipForm.quantita, 10);
    if (equipForm.quantita.trim() && (isNaN(quantitaVal) || quantitaVal <= 0)) {
      errors.quantita = "La quantità deve essere un intero maggiore di zero.";
    }

    const minLoadVal = equipForm.caricoMinimoKg.trim() ? parseFloat(equipForm.caricoMinimoKg) : undefined;
    if (minLoadVal !== undefined && (isNaN(minLoadVal) || minLoadVal < 0 || !isFinite(minLoadVal))) {
      errors.caricoMinimoKg = "Il carico minimo deve essere un numero non negativo.";
    }

    const maxLoadVal = equipForm.caricoMassimoKg.trim() ? parseFloat(equipForm.caricoMassimoKg) : undefined;
    if (maxLoadVal !== undefined && (isNaN(maxLoadVal) || maxLoadVal < 0 || !isFinite(maxLoadVal))) {
      errors.caricoMassimoKg = "Il carico massimo deve essere un numero non negativo.";
    }

    if (minLoadVal !== undefined && maxLoadVal !== undefined && maxLoadVal < minLoadVal) {
      errors.caricoMassimoKg = "Il carico massimo non può essere inferiore al carico minimo.";
    }

    const incrementVal = equipForm.incrementoCaricoKg.trim() ? parseFloat(equipForm.incrementoCaricoKg) : undefined;
    if (incrementVal !== undefined && (isNaN(incrementVal) || incrementVal <= 0 || !isFinite(incrementVal))) {
      errors.incrementoCaricoKg = "L'incremento deve essere maggiore di zero.";
    }

    if (Object.keys(errors).length > 0) {
      setEquipErrors(errors);
      return;
    }

    const targetEnv = environments.find(e => e.id === activeEnvId);
    if (!targetEnv) return;

    // Check Duplicate Name (Rule 12)
    const normalizedNewName = equipForm.nome.trim().toLowerCase();
    const isDuplicate = targetEnv.equipment.some(eq => 
      (!editingEquip || eq.id !== editingEquip.id) && 
      eq.nome.trim().toLowerCase() === normalizedNewName
    );

    if (isDuplicate && !isConfirmedDuplicate) {
      const performSave = () => handleSaveEquipment(true);
      if (onShowConfirm) {
        onShowConfirm({
          title: "Attrezzatura Duplicata",
          message: `Un’attrezzatura con il nome "${equipForm.nome.trim()}" è già presente in questo ambiente. Vuoi aggiungerla comunque come duplicato?`,
          confirmText: "Sì, aggiungi",
          cancelText: "Annulla",
          onConfirm: performSave
        });
      } else {
        if (window.confirm(`Un’attrezzatura con il nome "${equipForm.nome.trim()}" è già presente in questo ambiente. Aggiungere comunque?`)) {
          performSave();
        }
      }
      return;
    }

    const isoNow = new Date().toISOString();
    const cleanNum = (str: string) => {
      const parsed = parseFloat(str);
      return isNaN(parsed) ? undefined : parsed;
    };

    let updatedEquipment = [...targetEnv.equipment];
    if (editingEquip) {
      updatedEquipment = updatedEquipment.map(eq => {
        if (eq.id === editingEquip.id) {
          return {
            ...eq,
            nome: equipForm.nome.trim(),
            categoria: equipForm.categoria,
            disponibilita: equipForm.disponibilita,
            marca: equipForm.marca.trim() || undefined,
            modello: equipForm.modello.trim() || undefined,
            quantita: equipForm.quantita.trim() ? parseInt(equipForm.quantita, 10) : undefined,
            tipoResistenza: (equipForm.tipoResistenza as GymEquipmentResistanceType) || undefined,
            caricoMinimoKg: cleanNum(equipForm.caricoMinimoKg),
            caricoMassimoKg: cleanNum(equipForm.caricoMassimoKg),
            incrementoCaricoKg: cleanNum(equipForm.incrementoCaricoKg),
            unilaterale: equipForm.unilaterale || undefined,
            convergente: equipForm.convergente || undefined,
            regolabile: equipForm.regolabile || undefined,
            microcaricoDisponibile: equipForm.microcaricoDisponibile || undefined,
            rapportoCarrucola: equipForm.rapportoCarrucola.trim() || undefined,
            caratteristiche: equipForm.caratteristiche.trim() || undefined,
            limitazioni: (equipForm.disponibilita !== 'disponibile' ? equipForm.limitazioni.trim() : '') || undefined,
            noteCoach: equipForm.noteCoach.trim() || undefined,
            updatedAt: isoNow
          };
        }
        return eq;
      });
      onShowToast?.("Attrezzatura modificata con successo.", "success");
    } else {
      const newEquip: GymEquipmentItem = {
        id: generateId(),
        nome: equipForm.nome.trim(),
        categoria: equipForm.categoria,
        disponibilita: equipForm.disponibilita,
        marca: equipForm.marca.trim() || undefined,
        modello: equipForm.modello.trim() || undefined,
        quantita: equipForm.quantita.trim() ? parseInt(equipForm.quantita, 10) : undefined,
        tipoResistenza: (equipForm.tipoResistenza as GymEquipmentResistanceType) || undefined,
        caricoMinimoKg: cleanNum(equipForm.caricoMinimoKg),
        caricoMassimoKg: cleanNum(equipForm.caricoMassimoKg),
        incrementoCaricoKg: cleanNum(equipForm.incrementoCaricoKg),
        unilaterale: equipForm.unilaterale || undefined,
        convergente: equipForm.convergente || undefined,
        regolabile: equipForm.regolabile || undefined,
        microcaricoDisponibile: equipForm.microcaricoDisponibile || undefined,
        rapportoCarrucola: equipForm.rapportoCarrucola.trim() || undefined,
        caratteristiche: equipForm.caratteristiche.trim() || undefined,
        limitazioni: (equipForm.disponibilita !== 'disponibile' ? equipForm.limitazioni.trim() : '') || undefined,
        noteCoach: equipForm.noteCoach.trim() || undefined,
        createdAt: isoNow,
        updatedAt: isoNow
      };
      updatedEquipment.push(newEquip);
      onShowToast?.("Attrezzatura aggiunta.", "success");
    }

    const updatedEnvironments = environments.map(e => {
      if (e.id === activeEnvId) {
        return {
          ...e,
          equipment: updatedEquipment,
          updatedAt: isoNow
        };
      }
      return e;
    });

    onUpdateClient({
      ...client,
      trainingEnvironments: updatedEnvironments
    });
    setShowEquipModal(false);
    lastActiveElement.current?.focus();
  };

  const handleDuplicateEquipment = (equip: GymEquipmentItem) => {
    const targetEnv = environments.find(e => e.id === activeEnvId);
    if (!targetEnv) return;

    const isoNow = new Date().toISOString();
    const newEquip: GymEquipmentItem = {
      ...equip,
      id: generateId(),
      nome: `${equip.nome} (Copia)`,
      createdAt: isoNow,
      updatedAt: isoNow
    };

    const updatedEnvironments = environments.map(e => {
      if (e.id === activeEnvId) {
        return {
          ...e,
          equipment: [...e.equipment, newEquip],
          updatedAt: isoNow
        };
      }
      return e;
    });

    onUpdateClient({
      ...client,
      trainingEnvironments: updatedEnvironments
    });
    onShowToast?.("Attrezzatura duplicata.", "success");
  };

  const handleDeleteEquipment = (equip: GymEquipmentItem) => {
    const performDeletion = () => {
      const targetEnv = environments.find(e => e.id === activeEnvId);
      if (!targetEnv) return;

      const isoNow = new Date().toISOString();
      const updatedEquipment = targetEnv.equipment.filter(eq => eq.id !== equip.id);
      const updatedEnvironments = environments.map(e => {
        if (e.id === activeEnvId) {
          return {
            ...e,
            equipment: updatedEquipment,
            updatedAt: isoNow
          };
        }
        return e;
      });

      onUpdateClient({
        ...client,
        trainingEnvironments: updatedEnvironments
      });
      onShowToast?.("Attrezzatura rimossa.", "success");
    };

    if (onShowConfirm) {
      onShowConfirm({
        title: "Elimina Attrezzatura",
        message: `Eliminare "${equip.nome}"? Questa operazione non influenza i programmi di allenamento o il logbook esistenti.`,
        confirmText: "Elimina",
        cancelText: "Annulla",
        isDestructive: true,
        onConfirm: performDeletion
      });
    } else {
      if (window.confirm(`Eliminare "${equip.nome}"?`)) {
        performDeletion();
      }
    }
  };

  // Quick Add operations
  const handleConfirmQuickAdd = () => {
    if (selectedQuickAddNames.length === 0) {
      setShowQuickAddModal(false);
      return;
    }

    const targetEnv = environments.find(e => e.id === activeEnvId);
    if (!targetEnv) return;

    const isoNow = new Date().toISOString();
    const newItems: GymEquipmentItem[] = [];

    selectedQuickAddNames.forEach(nome => {
      const template = QUICK_ADD_ITEMS.find(item => item.nome === nome);
      if (!template) return;

      newItems.push({
        id: generateId(),
        nome: template.nome,
        categoria: template.categoria,
        disponibilita: 'disponibile',
        tipoResistenza: template.tipoResistenza,
        quantita: 1,
        createdAt: isoNow,
        updatedAt: isoNow
      });
    });

    const updatedEnvironments = environments.map(e => {
      if (e.id === activeEnvId) {
        return {
          ...e,
          equipment: [...e.equipment, ...newItems],
          updatedAt: isoNow
        };
      }
      return e;
    });

    onUpdateClient({
      ...client,
      trainingEnvironments: updatedEnvironments
    });
    onShowToast?.(`${selectedQuickAddNames.length} attrezzature aggiunte all'inventario.`, "success");
    setShowQuickAddModal(false);
    lastActiveElement.current?.focus();
  };

  const toggleQuickAddSelection = (nome: string) => {
    setSelectedQuickAddNames(prev => 
      prev.includes(nome) ? prev.filter(n => n !== nome) : [...prev, nome]
    );
  };

  // Summary Metrics
  const activeEnv = environments.find(e => e.stato === 'attivo');
  const nonArchivedEnvironments = environments.filter(e => e.stato !== 'archiviato');
  
  const totalEquipmentCount = nonArchivedEnvironments.reduce((sum, env) => {
    return sum + env.equipment.reduce((acc, eq) => acc + (eq.quantita ?? 1), 0);
  }, 0);

  const availableEquipmentCount = nonArchivedEnvironments.reduce((sum, env) => {
    return sum + env.equipment.filter(eq => eq.disponibilita === 'disponibile')
      .reduce((acc, eq) => acc + (eq.quantita ?? 1), 0);
  }, 0);

  const limitedEquipmentCount = nonArchivedEnvironments.reduce((sum, env) => {
    return sum + env.equipment.filter(eq => eq.disponibilita === 'disponibilita_limitata')
      .reduce((acc, eq) => acc + (eq.quantita ?? 1), 0);
  }, 0);

  const lastUpdateStr = (() => {
    if (environments.length === 0) return null;
    const allDates = environments.map(e => new Date(e.updatedAt).getTime());
    const maxDate = Math.max(...allDates);
    return new Date(maxDate).toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' });
  })();

  // Filter and sort items of the active detail environment
  const currentEnv = environments.find(e => e.id === activeEnvId);

  const getFilteredAndSortedEquipment = () => {
    if (!currentEnv) return [];
    let list = [...currentEnv.equipment];

    // Search filter
    if (equipSearch.trim()) {
      const q = equipSearch.toLowerCase();
      list = list.filter(eq => 
        eq.nome.toLowerCase().includes(q) ||
        (eq.marca && eq.marca.toLowerCase().includes(q)) ||
        (eq.modello && eq.modello.toLowerCase().includes(q))
      );
    }

    // Category filter
    if (filterCategory !== 'all') {
      list = list.filter(eq => eq.categoria === filterCategory);
    }

    // Availability filter
    if (filterAvailability !== 'all') {
      list = list.filter(eq => eq.disponibilita === filterAvailability);
    }

    // Sorting
    list.sort((a, b) => {
      if (sortBy === 'nome') {
        return a.nome.localeCompare(b.nome);
      } else if (sortBy === 'categoria') {
        return EQUIPMENT_CATEGORY_LABELS[a.categoria].localeCompare(EQUIPMENT_CATEGORY_LABELS[b.categoria]);
      } else {
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      }
    });

    return list;
  };

  const processedEquipmentList = getFilteredAndSortedEquipment();

  // Extract limitations & bounds (Rule 21)
  const extractProgrammingConstraints = () => {
    if (!currentEnv) return null;
    const constraints: string[] = [];

    if (currentEnv.limitazioniGenerali) {
      constraints.push(`Limitazione generale: ${currentEnv.limitazioniGenerali}`);
    }

    currentEnv.equipment.forEach(eq => {
      if (eq.disponibilita === 'non_disponibile' || eq.disponibilita === 'temporaneamente_non_disponibile') {
        constraints.push(`NON DISPONIBILE: ${eq.nome} (${EQUIPMENT_AVAILABILITY_LABELS[eq.disponibilita]})` + (eq.limitazioni ? ` - Nota: ${eq.limitazioni}` : ''));
      } else if (eq.disponibilita === 'disponibilita_limitata') {
        constraints.push(`DISPONIBILITÀ LIMITATA: ${eq.nome}` + (eq.limitazioni ? ` - Vincolo: ${eq.limitazioni}` : ''));
      }

      if (eq.caricoMassimoKg !== undefined) {
        constraints.push(`Limite carico su ${eq.nome}: massimo ${eq.caricoMassimoKg} kg` + (eq.caricoMinimoKg !== undefined ? ` (min ${eq.caricoMinimoKg} kg)` : ''));
      }

      if (eq.incrementoCaricoKg !== undefined) {
        constraints.push(`Incremento minimo su ${eq.nome}: ${eq.incrementoCaricoKg} kg`);
      }
    });

    return constraints;
  };

  const constraintsList = extractProgrammingConstraints();

  return (
    <div className="space-y-6 text-left">
      {activeEnvId ? (
        // DETAIL VIEW OF ENVIRONMENT
        <div className="space-y-6">
          <div className="flex flex-wrap justify-between items-center gap-4 border-b border-white/5 pb-4">
            <button
              onClick={() => setActiveEnvId(null)}
              className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-white/60 hover:text-white transition-all cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              Torna agli ambienti
            </button>
            <div className="flex gap-2">
              <button
                onClick={() => openEnvModal(currentEnv)}
                className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-white text-xs font-bold transition-all cursor-pointer"
              >
                Modifica Ambiente
              </button>
              <button
                onClick={() => openQuickAddModal()}
                className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-bold transition-all cursor-pointer"
              >
                Aggiunta Rapida
              </button>
              <button
                onClick={() => openEquipModal()}
                className="px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider text-neutral-950 transition-all cursor-pointer shadow-md"
                style={{ backgroundColor: config.primaryColor }}
              >
                + Aggiungi Attrezzatura
              </button>
            </div>
          </div>

          {currentEnv && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Sidebar Info & Constraints */}
              <div className="space-y-4">
                <div className="bg-[#181818] border border-white/5 rounded-2xl p-5 space-y-4">
                  <div>
                    <span className={`text-[9px] px-2.5 py-0.5 rounded font-black uppercase tracking-wider ${
                      currentEnv.stato === 'attivo' ? 'bg-emerald-500/10 text-emerald-400' :
                      currentEnv.stato === 'secondario' ? 'bg-blue-500/10 text-blue-400' : 'bg-neutral-800 text-white/55'
                    }`}>
                      {ENV_STATUS_LABELS[currentEnv.stato]}
                    </span>
                    <h3 className="text-lg font-black text-white uppercase tracking-tight mt-2">{currentEnv.nome}</h3>
                    <p className="text-xs text-white/40 mt-1">{ENV_TYPE_LABELS[currentEnv.tipo]}</p>
                  </div>

                  <div className="space-y-2.5 text-xs border-t border-white/5 pt-3">
                    {currentEnv.nomeStruttura && (
                      <div>
                        <span className="text-white/35 text-[10px] uppercase block">Struttura</span>
                        <span className="text-white font-semibold">{currentEnv.nomeStruttura}</span>
                      </div>
                    )}
                    {currentEnv.localita && (
                      <div>
                        <span className="text-white/35 text-[10px] uppercase block">Località</span>
                        <span className="text-white font-semibold">{currentEnv.localita}</span>
                      </div>
                    )}
                    {currentEnv.giorniDisponibili && currentEnv.giorniDisponibili.length > 0 && (
                      <div>
                        <span className="text-white/35 text-[10px] uppercase block">Giorni disponibili</span>
                        <span className="text-white font-semibold">{currentEnv.giorniDisponibili.join(', ')}</span>
                      </div>
                    )}
                    {currentEnv.fasciaOraria && (
                      <div>
                        <span className="text-white/35 text-[10px] uppercase block">Fascia oraria</span>
                        <span className="text-white font-semibold">{currentEnv.fasciaOraria}</span>
                      </div>
                    )}
                    {currentEnv.noteGenerali && (
                      <div className="bg-black/20 p-2.5 rounded-xl border border-white/5">
                        <span className="text-white/35 text-[10px] uppercase block mb-1">Note Coach</span>
                        <p className="text-white/80 leading-relaxed italic">{currentEnv.noteGenerali}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Constraints Section (Rule 21) */}
                {constraintsList && constraintsList.length > 0 && (
                  <div className="bg-[#181818] border border-amber-500/10 rounded-2xl p-5 space-y-3">
                    <div className="flex items-center gap-2 border-b border-white/5 pb-2">
                      <ShieldAlert className="w-4 h-4 text-amber-400" />
                      <h4 className="text-xs font-black uppercase tracking-wider text-white">Vincoli per la programmazione</h4>
                    </div>
                    <ul className="space-y-2 text-xs leading-relaxed text-white/70">
                      {constraintsList.map((constraint, idx) => (
                        <li key={idx} className="flex gap-1.5 items-start">
                          <span className="text-amber-400 select-none mt-0.5">•</span>
                          <span>{constraint}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Main Equipment Inventory */}
              <div className="lg:col-span-2 space-y-4">
                {/* Search, Filter, Sort and View Toggles */}
                <div className="bg-[#181818] border border-white/5 rounded-2xl p-4 flex flex-col md:flex-row gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-2.5 w-4 h-4 text-white/30" />
                    <input
                      type="text"
                      placeholder="Cerca attrezzatura..."
                      value={equipSearch}
                      onChange={(e) => setEquipSearch(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-black/40 border border-white/5 text-white placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-lime-400"
                    />
                  </div>
                  <div className="grid grid-cols-2 sm:flex gap-2 text-xs">
                    <select
                      value={filterCategory}
                      onChange={(e) => setFilterCategory(e.target.value)}
                      className="px-3 py-2 rounded-xl bg-black/40 border border-white/5 text-white"
                    >
                      <option value="all">Tutte le categorie</option>
                      {Object.entries(EQUIPMENT_CATEGORY_LABELS).map(([cat, label]) => (
                        <option key={cat} value={cat}>{label}</option>
                      ))}
                    </select>
                    <select
                      value={filterAvailability}
                      onChange={(e) => setFilterAvailability(e.target.value)}
                      className="px-3 py-2 rounded-xl bg-black/40 border border-white/5 text-white"
                    >
                      <option value="all">Tutte le disponibilità</option>
                      {Object.entries(EQUIPMENT_AVAILABILITY_LABELS).map(([av, label]) => (
                        <option key={av} value={av}>{label}</option>
                      ))}
                    </select>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as any)}
                      className="px-3 py-2 rounded-xl bg-black/40 border border-white/5 text-white col-span-2 sm:col-span-1"
                    >
                      <option value="nome">A-Z</option>
                      <option value="categoria">Per Categoria</option>
                      <option value="aggiornamento">Ultimo Aggiornamento</option>
                    </select>
                    <div className="flex gap-1 border border-white/5 bg-black/30 p-1 rounded-xl">
                      <button
                        onClick={() => setViewMode('list')}
                        className={`p-1.5 rounded-lg ${viewMode === 'list' ? 'bg-neutral-800 text-white' : 'text-white/40'}`}
                        aria-label="Vista elenco"
                      >
                        <List className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setViewMode('category')}
                        className={`p-1.5 rounded-lg ${viewMode === 'category' ? 'bg-neutral-800 text-white' : 'text-white/40'}`}
                        aria-label="Vista raggruppata per categoria"
                      >
                        <Grid className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Inventory Display */}
                {currentEnv.equipment.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-12 text-center bg-[#181818] border border-white/5 rounded-2xl">
                    <Dumbbell className="w-10 h-10 text-white/20 mb-3 animate-pulse" />
                    <h4 className="text-sm font-bold text-white uppercase">Inventario vuoto</h4>
                    <p className="text-xs text-white/40 mt-1 max-w-sm">Aggiungi attrezzature manualmente o usa l'aggiunta rapida di strumenti comuni per compilare l'elenco.</p>
                  </div>
                ) : processedEquipmentList.length === 0 ? (
                  <div className="text-center py-12 text-xs text-white/45 bg-[#181818] border border-white/5 rounded-2xl">
                    Nessun macchinario soddisfa i criteri di ricerca o filtro.
                  </div>
                ) : viewMode === 'list' ? (
                  // List / Table View
                  <div className="bg-[#181818] border border-white/5 rounded-2xl overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-white/5 bg-black/30 text-white/50 uppercase tracking-wider font-semibold text-[10px]">
                            <th className="p-3">Nome</th>
                            <th className="p-3">Categoria</th>
                            <th className="p-3">Disponibilità</th>
                            <th className="p-3">Specifiche / Carichi</th>
                            <th className="p-3 text-right">Azioni</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {processedEquipmentList.map(eq => (
                            <tr key={eq.id} className="hover:bg-white/[0.02] transition-colors">
                              <td className="p-3">
                                <div className="font-bold text-white">{eq.nome}</div>
                                {(eq.marca || eq.modello) && (
                                  <div className="text-[10px] text-white/40 mt-0.5">
                                    {eq.marca} {eq.modello} {eq.quantita && eq.quantita > 1 && `(x${eq.quantita})`}
                                  </div>
                                )}
                              </td>
                              <td className="p-3 text-white/70">
                                {EQUIPMENT_CATEGORY_LABELS[eq.categoria]}
                              </td>
                              <td className="p-3">
                                <span className={`text-[10px] font-semibold ${
                                  eq.disponibilita === 'disponibile' ? 'text-emerald-400' :
                                  eq.disponibilita === 'disponibilita_limitata' ? 'text-amber-400' : 'text-red-400'
                                }`}>
                                  {EQUIPMENT_AVAILABILITY_LABELS[eq.disponibilita]}
                                </span>
                                {eq.disponibilita !== 'disponibile' && eq.limitazioni && (
                                  <div className="text-[10px] text-white/45 mt-0.5 max-w-[150px] truncate" title={eq.limitazioni}>
                                    {eq.limitazioni}
                                  </div>
                                )}
                              </td>
                              <td className="p-3 space-y-0.5 text-white/75">
                                {eq.caricoMinimoKg !== undefined || eq.caricoMassimoKg !== undefined ? (
                                  <div>
                                    Range: {eq.caricoMinimoKg ?? 0}kg - {eq.caricoMassimoKg ?? '∞'}kg
                                    {eq.incrementoCaricoKg && ` (+${eq.incrementoCaricoKg}kg)`}
                                  </div>
                                ) : null}
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {eq.tipoResistenza && (
                                    <span className="px-1.5 py-0.5 bg-white/5 rounded text-[9px] text-white/60">
                                      {RESISTANCE_TYPE_LABELS[eq.tipoResistenza]}
                                    </span>
                                  )}
                                  {eq.unilaterale && <span className="px-1.5 py-0.5 bg-lime-400/5 text-lime-400 border border-lime-400/10 rounded text-[9px]">Unilaterale</span>}
                                  {eq.convergente && <span className="px-1.5 py-0.5 bg-blue-400/5 text-blue-400 border border-blue-400/10 rounded text-[9px]">Convergente</span>}
                                  {eq.regolabile && <span className="px-1.5 py-0.5 bg-purple-400/5 text-purple-400 border border-purple-400/10 rounded text-[9px]">Regolabile</span>}
                                  {eq.rapportoCarrucola && <span className="px-1.5 py-0.5 bg-white/5 text-white/65 rounded text-[9px]">Carrucola {eq.rapportoCarrucola}</span>}
                                </div>
                              </td>
                              <td className="p-3 text-right">
                                <div className="flex justify-end gap-1.5">
                                  <button
                                    onClick={() => openEquipModal(eq)}
                                    className="p-1 rounded bg-black/40 border border-white/5 text-white/50 hover:text-white transition-all cursor-pointer"
                                    title="Modifica"
                                    aria-label={`Modifica ${eq.nome}`}
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleDuplicateEquipment(eq)}
                                    className="p-1 rounded bg-black/40 border border-white/5 text-white/50 hover:text-white transition-all cursor-pointer"
                                    title="Duplica"
                                    aria-label={`Duplica ${eq.nome}`}
                                  >
                                    <Copy className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteEquipment(eq)}
                                    className="p-1 rounded bg-black/40 border border-white/5 text-white/30 hover:text-red-400 transition-all cursor-pointer"
                                    title="Elimina"
                                    aria-label={`Elimina ${eq.nome}`}
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  // Category grouped collapsible view
                  <div className="space-y-3">
                    {Object.entries(EQUIPMENT_CATEGORY_LABELS).map(([cat, label]) => {
                      const itemsInCat = processedEquipmentList.filter(eq => eq.categoria === cat);
                      if (itemsInCat.length === 0) return null;

                      const isCollapsed = !!collapsedCategories[cat];
                      return (
                        <div key={cat} className="bg-[#181818] border border-white/5 rounded-2xl overflow-hidden">
                          <button
                            onClick={() => setCollapsedCategories(p => ({ ...p, [cat]: !p[cat] }))}
                            className="w-full flex justify-between items-center px-4 py-3 bg-black/20 hover:bg-black/30 transition-colors text-left"
                          >
                            <span className="font-extrabold text-xs uppercase text-white/80 tracking-wider">
                              {label} — {itemsInCat.length}
                            </span>
                            <span className="text-xs text-white/30">{isCollapsed ? 'Espandi ＋' : 'Riduci －'}</span>
                          </button>
                          
                          {!isCollapsed && (
                            <div className="divide-y divide-white/5">
                              {itemsInCat.map(eq => (
                                <div key={eq.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-white/[0.01]">
                                  <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                      <span className="font-bold text-white text-sm">{eq.nome}</span>
                                      <span className={`text-[9px] font-semibold ${
                                        eq.disponibilita === 'disponibile' ? 'text-emerald-400' :
                                        eq.disponibilita === 'disponibilita_limitata' ? 'text-amber-400' : 'text-red-400'
                                      }`}>
                                        ({EQUIPMENT_AVAILABILITY_LABELS[eq.disponibilita]})
                                      </span>
                                    </div>
                                    {(eq.marca || eq.modello) && (
                                      <div className="text-xs text-white/40">
                                        Marca: {eq.marca || 'N/D'} • Modello: {eq.modello || 'N/D'}
                                        {eq.quantita && eq.quantita > 1 && ` • Qta: ${eq.quantita}`}
                                      </div>
                                    )}
                                    <div className="flex flex-wrap gap-1.5 pt-1">
                                      {eq.caricoMinimoKg !== undefined || eq.caricoMassimoKg !== undefined ? (
                                        <span className="px-2 py-0.5 bg-black/30 border border-white/5 rounded-lg text-[10px] text-white/70">
                                          Carico: {eq.caricoMinimoKg ?? 0} - {eq.caricoMassimoKg ?? '∞'} kg
                                        </span>
                                      ) : null}
                                      {eq.unilaterale && <span className="px-1.5 py-0.5 bg-lime-400/5 text-lime-400 border border-lime-400/10 rounded text-[9px]">Unilaterale</span>}
                                      {eq.convergente && <span className="px-1.5 py-0.5 bg-blue-400/5 text-blue-400 border border-blue-400/10 rounded text-[9px]">Convergente</span>}
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-1.5 self-end sm:self-auto">
                                    <button
                                      onClick={() => openEquipModal(eq)}
                                      className="p-1.5 rounded bg-black/40 border border-white/5 text-white/50 hover:text-white transition-all cursor-pointer"
                                      title="Modifica"
                                      aria-label={`Modifica ${eq.nome}`}
                                    >
                                      <Edit2 className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      onClick={() => handleDuplicateEquipment(eq)}
                                      className="p-1.5 rounded bg-black/40 border border-white/5 text-white/50 hover:text-white transition-all cursor-pointer"
                                      title="Duplica"
                                      aria-label={`Duplica ${eq.nome}`}
                                    >
                                      <Copy className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteEquipment(eq)}
                                      className="p-1.5 rounded bg-black/40 border border-white/5 text-white/30 hover:text-red-400 transition-all cursor-pointer"
                                      title="Elimina"
                                      aria-label={`Elimina ${eq.nome}`}
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      ) : (
        // DASHBOARD VIEW (LIST OF ENVIRONMENTS)
        <div className="space-y-6">
          {/* Summary Panels */}
          {environments.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-4">
              <div className="bg-[#181818] border border-white/5 rounded-2xl p-4">
                <span className="text-[9px] text-white/35 uppercase tracking-wider block">Ambienti</span>
                <span className="text-white font-extrabold text-xl mt-1 block">{environments.length}</span>
              </div>
              <div className="bg-[#181818] border border-white/5 rounded-2xl p-4">
                <span className="text-[9px] text-white/35 uppercase tracking-wider block">Ambiente Attivo</span>
                <span className="text-[#CCFF00] font-extrabold text-sm mt-2 block truncate" style={{ color: config.primaryColor }}>
                  {activeEnv ? activeEnv.nome : 'Nessuno'}
                </span>
              </div>
              <div className="bg-[#181818] border border-white/5 rounded-2xl p-4">
                <span className="text-[9px] text-white/35 uppercase tracking-wider block">Attrezzature Totali</span>
                <span className="text-white font-extrabold text-xl mt-1 block">{totalEquipmentCount}</span>
              </div>
              <div className="bg-[#181818] border border-white/5 rounded-2xl p-4">
                <span className="text-[9px] text-white/35 uppercase tracking-wider block">Disponibili</span>
                <span className="text-emerald-400 font-extrabold text-xl mt-1 block">{availableEquipmentCount}</span>
              </div>
              <div className="bg-[#181818] border border-white/5 rounded-2xl p-4 col-span-2 md:col-span-1">
                <span className="text-[9px] text-white/35 uppercase tracking-wider block">Ultimo Aggiornamento</span>
                <span className="text-white/70 font-bold text-xs mt-2 block">{lastUpdateStr ?? '—'}</span>
              </div>
            </div>
          )}

          <div className="flex flex-wrap justify-between items-center gap-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-white">Ambienti e Attrezzature di Allenamento</h3>
            <button
              onClick={() => openEnvModal()}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider text-neutral-950 transition-all cursor-pointer shadow-md"
              style={{ backgroundColor: config.primaryColor }}
            >
              <Plus className="w-4 h-4" />
              Nuovo Ambiente
            </button>
          </div>

          {environments.length === 0 ? (
            // PROFESSIONAL EMPTY STATE (Rule 23)
            <div className="flex flex-col items-center justify-center p-12 text-center bg-[#181818] border border-dashed border-white/5 rounded-2xl">
              <Dumbbell className="w-12 h-12 text-white/10 mb-4 animate-pulse" />
              <h3 className="text-sm font-black uppercase tracking-wider text-white">Nessun ambiente registrato</h3>
              <p className="text-xs text-white/30 max-w-md mt-1.5 mb-5 leading-relaxed">
                L'inventario degli ambienti e delle attrezzature serve a registrare con precisione dove si allena l'atleta. 
                Permette al coach di mappare i macchinari disponibili, i range di carico disponibili, gli accessori e le eventuali limitazioni logistiche da considerare nella programmazione degli allenamenti.
              </p>
              <button
                onClick={() => openEnvModal()}
                className="px-4 py-2.5 rounded-lg text-xs font-black uppercase tracking-wider text-neutral-950 transition-all cursor-pointer shadow-md"
                style={{ backgroundColor: config.primaryColor }}
              >
                Crea il primo ambiente
              </button>
            </div>
          ) : (
            // GRID OF ENVIRONMENTS
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {environments.map(env => {
                const totalInEnv = env.equipment.reduce((acc, eq) => acc + (eq.quantita ?? 1), 0);
                const availInEnv = env.equipment.filter(eq => eq.disponibilita === 'disponibile').reduce((acc, eq) => acc + (eq.quantita ?? 1), 0);
                const limitInEnv = env.equipment.filter(eq => eq.disponibilita === 'disponibilita_limitata').reduce((acc, eq) => acc + (eq.quantita ?? 1), 0);
                const lastUpdatedISO = new Date(env.updatedAt).toLocaleDateString('it-IT');

                return (
                  <div key={env.id} className="bg-[#181818] border border-white/5 rounded-2xl p-5 flex flex-col justify-between space-y-4 hover:border-white/10 transition-all">
                    <div className="space-y-2">
                      <div className="flex justify-between items-start gap-2">
                        <div>
                          <span className={`text-[8px] px-2 py-0.5 rounded font-black uppercase tracking-wider ${
                            env.stato === 'attivo' ? 'bg-emerald-500/10 text-emerald-400' :
                            env.stato === 'secondario' ? 'bg-blue-500/10 text-blue-400' : 'bg-neutral-800 text-white/55'
                          }`}>
                            {ENV_STATUS_LABELS[env.stato]}
                          </span>
                          <h4 className="font-extrabold text-sm text-white mt-1.5">{env.nome}</h4>
                          <span className="text-[10px] text-white/40 block mt-0.5">{ENV_TYPE_LABELS[env.tipo]}</span>
                        </div>
                      </div>

                      {(env.nomeStruttura || env.localita) && (
                        <div className="text-[10px] text-white/50 space-y-0.5">
                          {env.nomeStruttura && <p>Struttura: {env.nomeStruttura}</p>}
                          {env.localita && <p>Località: {env.localita}</p>}
                        </div>
                      )}

                      <div className="grid grid-cols-3 gap-2 bg-black/20 p-2 rounded-xl text-center text-[10px] border border-white/5">
                        <div>
                          <span className="text-white/35 block uppercase tracking-wider text-[8px]">Totali</span>
                          <span className="text-white font-bold mt-0.5 block">{totalInEnv}</span>
                        </div>
                        <div>
                          <span className="text-white/35 block uppercase tracking-wider text-[8px]">Disponibili</span>
                          <span className="text-emerald-400 font-bold mt-0.5 block">{availInEnv}</span>
                        </div>
                        <div>
                          <span className="text-white/35 block uppercase tracking-wider text-[8px]">Limitate</span>
                          <span className="text-amber-400 font-bold mt-0.5 block">{limitInEnv}</span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-white/5 flex flex-wrap gap-2 justify-between items-center">
                      <span className="text-[9px] text-white/30">Aggiornato il {lastUpdatedISO}</span>
                      <div className="flex gap-1">
                        <button
                          onClick={() => setActiveEnvId(env.id)}
                          className="px-2.5 py-1 text-[10px] font-bold rounded-lg bg-white/5 hover:bg-white/10 text-white border border-white/5 transition-all cursor-pointer"
                        >
                          Apri
                        </button>
                        <button
                          onClick={() => openEnvModal(env)}
                          className="p-1 rounded bg-black/40 border border-white/5 text-white/50 hover:text-white transition-all cursor-pointer"
                          title="Modifica"
                          aria-label={`Modifica ambiente ${env.nome}`}
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDuplicateEnvironment(env)}
                          className="p-1 rounded bg-black/40 border border-white/5 text-white/50 hover:text-white transition-all cursor-pointer"
                          title="Duplica"
                          aria-label={`Duplica ambiente ${env.nome}`}
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleToggleArchivedEnvironment(env)}
                          className="p-1 rounded bg-black/40 border border-white/5 text-white/40 hover:text-white transition-all cursor-pointer"
                          title={env.stato === 'archiviato' ? 'Riattiva' : 'Archivia'}
                          aria-label={env.stato === 'archiviato' ? 'Riattiva ambiente' : 'Archivia ambiente'}
                        >
                          <Archive className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteEnvironment(env)}
                          className="p-1 rounded bg-black/40 border border-white/5 text-white/20 hover:text-red-400 transition-all cursor-pointer"
                          title="Elimina"
                          aria-label={`Elimina ambiente ${env.nome}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ENVIRONMENT EDIT/CREATE MODAL */}
      {showEnvModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 overflow-y-auto" role="dialog" aria-modal="true" aria-labelledby="env-modal-title">
          <div ref={envModalRef} className="bg-[#121212] border border-white/10 rounded-2xl w-full max-w-lg p-5 space-y-4 shadow-xl">
            <div className="flex justify-between items-center border-b border-white/5 pb-3">
              <h3 id="env-modal-title" className="text-sm font-black uppercase tracking-wider text-white">
                {editingEnv ? 'Modifica Ambiente di Allenamento' : 'Nuovo Ambiente di Allenamento'}
              </h3>
              <button
                onClick={() => { setShowEnvModal(false); lastActiveElement.current?.focus(); }}
                className="p-1 rounded-lg text-white/40 hover:text-white transition-colors"
                aria-label="Chiudi"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEnvironment} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label htmlFor="env-nome" className="block text-[10px] uppercase font-black tracking-wider text-white/45">Nome Identificativo *</label>
                <input
                  id="env-nome"
                  type="text"
                  placeholder="Esempio: Palestra principale, Home gym..."
                  value={envForm.nome}
                  onChange={(e) => setEnvForm({ ...envForm, nome: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/5 text-white placeholder-white/20 focus:outline-none focus:ring-1 focus:ring-lime-400"
                  aria-describedby={envErrors.nome ? "env-nome-error" : undefined}
                />
                {envErrors.nome && <p id="env-nome-error" className="text-red-400 text-[10px] mt-0.5 font-semibold">{envErrors.nome}</p>}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label htmlFor="env-tipo" className="block text-[10px] uppercase font-black tracking-wider text-white/45">Tipo di ambiente</label>
                  <select
                    id="env-tipo"
                    value={envForm.tipo}
                    onChange={(e) => setEnvForm({ ...envForm, tipo: e.target.value as TrainingEnvironmentType })}
                    className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/5 text-white focus:outline-none focus:ring-1 focus:ring-lime-400"
                  >
                    {Object.entries(ENV_TYPE_LABELS).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label htmlFor="env-stato" className="block text-[10px] uppercase font-black tracking-wider text-white/45">Stato di utilizzo</label>
                  <select
                    id="env-stato"
                    value={envForm.stato}
                    onChange={(e) => setEnvForm({ ...envForm, stato: e.target.value as TrainingEnvironmentStatus })}
                    className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/5 text-white focus:outline-none focus:ring-1 focus:ring-lime-400"
                  >
                    {Object.entries(ENV_STATUS_LABELS).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label htmlFor="env-struttura" className="block text-[10px] uppercase font-black tracking-wider text-white/45">Nome Struttura</label>
                  <input
                    id="env-struttura"
                    type="text"
                    placeholder="Esempio: McFit, Gold's Gym..."
                    value={envForm.nomeStruttura}
                    onChange={(e) => setEnvForm({ ...envForm, nomeStruttura: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/5 text-white placeholder-white/20 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label htmlFor="env-localita" className="block text-[10px] uppercase font-black tracking-wider text-white/45">Località</label>
                  <input
                    id="env-localita"
                    type="text"
                    placeholder="Esempio: Milano, Roma..."
                    value={envForm.localita}
                    onChange={(e) => setEnvForm({ ...envForm, localita: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/5 text-white placeholder-white/20 focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <fieldset>
                  <legend className="block text-[10px] uppercase font-black tracking-wider text-white/45 mb-1.5">Giorni Disponibili</legend>
                  <div className="flex flex-wrap gap-2">
                    {['Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato', 'Domenica'].map(day => {
                      const isChecked = envForm.giorniDisponibili.includes(day);
                      return (
                        <label key={day} className={`flex items-center gap-1 px-2.5 py-1 border rounded-lg cursor-pointer transition-all ${isChecked ? 'bg-lime-400/10 border-lime-400/30 text-lime-400' : 'bg-black/35 border-white/5 text-white/50 hover:text-white'}`}>
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {
                              const nextDays = isChecked 
                                ? envForm.giorniDisponibili.filter(d => d !== day)
                                : [...envForm.giorniDisponibili, day];
                              setEnvForm({ ...envForm, giorniDisponibili: nextDays });
                            }}
                            className="sr-only"
                          />
                          <span>{day.substring(0, 3)}</span>
                        </label>
                      );
                    })}
                  </div>
                </fieldset>
              </div>

              <div className="space-y-1">
                <label htmlFor="env-orario" className="block text-[10px] uppercase font-black tracking-wider text-white/45">Fascia Oraria Preferenziale</label>
                <input
                  id="env-orario"
                  type="text"
                  placeholder="Esempio: Mattina presto (7:00 - 9:00), Pausa pranzo..."
                  value={envForm.fasciaOraria}
                  onChange={(e) => setEnvForm({ ...envForm, fasciaOraria: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/5 text-white placeholder-white/20 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label htmlFor="env-limiti" className="block text-[10px] uppercase font-black tracking-wider text-white/45">Limitazioni Generali</label>
                  <textarea
                    id="env-limiti"
                    placeholder="Esempio: Palestra affollata il lunedì sera, mancano macchine per i polpacci..."
                    value={envForm.limitazioniGenerali}
                    onChange={(e) => setEnvForm({ ...envForm, limitazioniGenerali: e.target.value })}
                    rows={2}
                    className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/5 text-white placeholder-white/20 focus:outline-none resize-none"
                  />
                </div>
                <div className="space-y-1">
                  <label htmlFor="env-note" className="block text-[10px] uppercase font-black tracking-wider text-white/45">Note Generali</label>
                  <textarea
                    id="env-note"
                    placeholder="Note e raccomandazioni generali per la compilazione della scheda..."
                    value={envForm.noteGenerali}
                    onChange={(e) => setEnvForm({ ...envForm, noteGenerali: e.target.value })}
                    rows={2}
                    className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/5 text-white placeholder-white/20 focus:outline-none resize-none"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-white/5 flex justify-end gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => { setShowEnvModal(false); lastActiveElement.current?.focus(); }}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white border border-white/5 transition-all cursor-pointer font-bold"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-neutral-950 font-black uppercase tracking-wider transition-all cursor-pointer shadow-md"
                  style={{ backgroundColor: config.primaryColor }}
                >
                  Salva Ambiente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EQUIPMENT ADD/EDIT MODAL */}
      {showEquipModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 overflow-y-auto" role="dialog" aria-modal="true" aria-labelledby="equip-modal-title">
          <div ref={equipModalRef} className="bg-[#121212] border border-white/10 rounded-2xl w-full max-w-xl p-5 space-y-4 shadow-xl">
            <div className="flex justify-between items-center border-b border-white/5 pb-3">
              <h3 id="equip-modal-title" className="text-sm font-black uppercase tracking-wider text-white">
                {editingEquip ? 'Modifica Attrezzatura' : 'Nuova Attrezzatura'}
              </h3>
              <button
                onClick={() => { setShowEquipModal(false); lastActiveElement.current?.focus(); }}
                className="p-1 rounded-lg text-white/40 hover:text-white transition-colors"
                aria-label="Chiudi"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); handleSaveEquipment(); }} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label htmlFor="eq-nome" className="block text-[10px] uppercase font-black tracking-wider text-white/45">Nome *</label>
                  <input
                    id="eq-nome"
                    type="text"
                    placeholder="Esempio: Chest press, Manubri, Pulley..."
                    value={equipForm.nome}
                    onChange={(e) => setEquipForm({ ...equipForm, nome: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/5 text-white placeholder-white/20 focus:outline-none focus:ring-1 focus:ring-lime-400"
                    aria-describedby={equipErrors.nome ? "eq-nome-error" : undefined}
                  />
                  {equipErrors.nome && <p id="eq-nome-error" className="text-red-400 text-[10px] mt-0.5 font-semibold">{equipErrors.nome}</p>}
                </div>

                <div className="space-y-1">
                  <label htmlFor="eq-categoria" className="block text-[10px] uppercase font-black tracking-wider text-white/45">Categoria *</label>
                  <select
                    id="eq-categoria"
                    value={equipForm.categoria}
                    onChange={(e) => setEquipForm({ ...equipForm, categoria: e.target.value as GymEquipmentCategory })}
                    className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/5 text-white focus:outline-none focus:ring-1 focus:ring-lime-400"
                  >
                    {Object.entries(EQUIPMENT_CATEGORY_LABELS).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label htmlFor="eq-disp" className="block text-[10px] uppercase font-black tracking-wider text-white/45">Disponibilità *</label>
                  <select
                    id="eq-disp"
                    value={equipForm.disponibilita}
                    onChange={(e) => setEquipForm({ ...equipForm, disponibilita: e.target.value as GymEquipmentAvailability })}
                    className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/5 text-white focus:outline-none"
                  >
                    {Object.entries(EQUIPMENT_AVAILABILITY_LABELS).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label htmlFor="eq-marca" className="block text-[10px] uppercase font-black tracking-wider text-white/45">Marca (Opzionale)</label>
                  <input
                    id="eq-marca"
                    type="text"
                    placeholder="Technogym, Matrix..."
                    value={equipForm.marca}
                    onChange={(e) => setEquipForm({ ...equipForm, marca: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/5 text-white placeholder-white/20 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label htmlFor="eq-modello" className="block text-[10px] uppercase font-black tracking-wider text-white/45">Modello (Opzionale)</label>
                  <input
                    id="eq-modello"
                    type="text"
                    placeholder="Selection Line, Pure Strength..."
                    value={equipForm.modello}
                    onChange={(e) => setEquipForm({ ...equipForm, modello: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/5 text-white placeholder-white/20 focus:outline-none"
                  />
                </div>
              </div>

              {equipForm.disponibilita !== 'disponibile' && (
                <div className="space-y-1">
                  <label htmlFor="eq-limitazioni" className="block text-[10px] uppercase font-black tracking-wider text-white/45 text-amber-400">Dettaglio Limitazioni / Note per il Coach</label>
                  <textarea
                    id="eq-limitazioni"
                    placeholder="Esempio: Carrucola lenta, spesso occupato, rom scomodo..."
                    value={equipForm.limitazioni}
                    onChange={(e) => setEquipForm({ ...equipForm, limitazioni: e.target.value })}
                    rows={1}
                    className="w-full px-3 py-2 rounded-xl bg-black/40 border border-amber-500/20 text-white placeholder-white/20 focus:outline-none"
                  />
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-black/10 p-3 rounded-xl border border-white/5">
                <div className="space-y-1">
                  <label htmlFor="eq-quantita" className="block text-[10px] uppercase font-black tracking-wider text-white/45">Quantità</label>
                  <input
                    id="eq-quantita"
                    type="number"
                    min="1"
                    placeholder="1"
                    value={equipForm.quantita}
                    onChange={(e) => setEquipForm({ ...equipForm, quantita: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-xl bg-black/40 border border-white/5 text-white focus:outline-none"
                    aria-describedby={equipErrors.quantita ? "eq-qta-error" : undefined}
                  />
                  {equipErrors.quantita && <p id="eq-qta-error" className="text-red-400 text-[9px] mt-0.5 font-semibold">{equipErrors.quantita}</p>}
                </div>

                <div className="space-y-1">
                  <label htmlFor="eq-res" className="block text-[10px] uppercase font-black tracking-wider text-white/45">Resistenza</label>
                  <select
                    id="eq-res"
                    value={equipForm.tipoResistenza}
                    onChange={(e) => setEquipForm({ ...equipForm, tipoResistenza: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-xl bg-black/40 border border-white/5 text-white focus:outline-none"
                  >
                    <option value="">Nessuno</option>
                    {Object.entries(RESISTANCE_TYPE_LABELS).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] uppercase font-black tracking-wider text-white/45">Rapporto carrucola</label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="1:1"
                      value={equipForm.rapportoCarrucola}
                      onChange={(e) => setEquipForm({ ...equipForm, rapportoCarrucola: e.target.value })}
                      className="w-full px-3 py-1.5 rounded-xl bg-black/40 border border-white/5 text-white focus:outline-none"
                    />
                    <div className="flex gap-1 mt-1">
                      {['1:1', '2:1', '4:1', 'Non noto'].map(val => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => setEquipForm({ ...equipForm, rapportoCarrucola: val })}
                          className="px-1.5 py-0.5 bg-white/5 hover:bg-white/10 rounded text-[9px] text-white/50"
                        >
                          {val}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] uppercase font-black tracking-wider text-white/45">Opzioni hardware</label>
                  <div className="space-y-1 pt-1">
                    <label className="flex items-center gap-1.5 cursor-pointer text-[10px] text-white/70 hover:text-white">
                      <input
                        type="checkbox"
                        checked={equipForm.unilaterale}
                        onChange={(e) => setEquipForm({ ...equipForm, unilaterale: e.target.checked })}
                        className="rounded bg-black border-white/5 text-lime-400 focus:ring-0"
                      />
                      <span>Unilaterale</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer text-[10px] text-white/70 hover:text-white">
                      <input
                        type="checkbox"
                        checked={equipForm.convergente}
                        onChange={(e) => setEquipForm({ ...equipForm, convergente: e.target.checked })}
                        className="rounded bg-black border-white/5 text-lime-400 focus:ring-0"
                      />
                      <span>Convergente</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer text-[10px] text-white/70 hover:text-white">
                      <input
                        type="checkbox"
                        checked={equipForm.regolabile}
                        onChange={(e) => setEquipForm({ ...equipForm, regolabile: e.target.checked })}
                        className="rounded bg-black border-white/5 text-lime-400 focus:ring-0"
                      />
                      <span>Regolabile</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer text-[10px] text-white/70 hover:text-white">
                      <input
                        type="checkbox"
                        checked={equipForm.microcaricoDisponibile}
                        onChange={(e) => setEquipForm({ ...equipForm, microcaricoDisponibile: e.target.checked })}
                        className="rounded bg-black border-white/5 text-lime-400 focus:ring-0"
                      />
                      <span>Microcarichi</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-black/20 p-3 rounded-xl border border-white/5">
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <label htmlFor="eq-cmin" className="block text-[10px] uppercase font-black tracking-wider text-white/45">Carico Minimo</label>
                    <span className="text-[9px] text-white/30">kg</span>
                  </div>
                  <input
                    id="eq-cmin"
                    type="text"
                    placeholder="Es: 2"
                    value={equipForm.caricoMinimoKg}
                    onChange={(e) => setEquipForm({ ...equipForm, caricoMinimoKg: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-xl bg-black/40 border border-white/5 text-white focus:outline-none"
                    aria-describedby={equipErrors.caricoMinimoKg ? "eq-cmin-error" : undefined}
                  />
                  {equipErrors.caricoMinimoKg && <p id="eq-cmin-error" className="text-red-400 text-[9px] mt-0.5 font-semibold">{equipErrors.caricoMinimoKg}</p>}
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <label htmlFor="eq-cmax" className="block text-[10px] uppercase font-black tracking-wider text-white/45">Carico Massimo</label>
                    <span className="text-[9px] text-white/30">kg</span>
                  </div>
                  <input
                    id="eq-cmax"
                    type="text"
                    placeholder="Es: 50"
                    value={equipForm.caricoMassimoKg}
                    onChange={(e) => setEquipForm({ ...equipForm, caricoMassimoKg: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-xl bg-black/40 border border-white/5 text-white focus:outline-none"
                    aria-describedby={equipErrors.caricoMassimoKg ? "eq-cmax-error" : undefined}
                  />
                  {equipErrors.caricoMassimoKg && <p id="eq-cmax-error" className="text-red-400 text-[9px] mt-0.5 font-semibold">{equipErrors.caricoMassimoKg}</p>}
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <label htmlFor="eq-cinc" className="block text-[10px] uppercase font-black tracking-wider text-white/45">Incremento del carico</label>
                    <span className="text-[9px] text-white/30">kg</span>
                  </div>
                  <input
                    id="eq-cinc"
                    type="text"
                    placeholder="Es: 2"
                    value={equipForm.incrementoCaricoKg}
                    onChange={(e) => setEquipForm({ ...equipForm, incrementoCaricoKg: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-xl bg-black/40 border border-white/5 text-white focus:outline-none"
                    aria-describedby={equipErrors.incrementoCaricoKg ? "eq-cinc-error" : undefined}
                  />
                  {equipErrors.incrementoCaricoKg && <p id="eq-cinc-error" className="text-red-400 text-[9px] mt-0.5 font-semibold">{equipErrors.incrementoCaricoKg}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label htmlFor="eq-car" className="block text-[10px] uppercase font-black tracking-wider text-white/45">Caratteristiche fisiche / Note Tecniche</label>
                  <textarea
                    id="eq-car"
                    placeholder="Esempio: Disponibili dischi 1,25 / 2,5 / 5 / 10 / 20 kg, panca fissa..."
                    value={equipForm.caratteristiche}
                    onChange={(e) => setEquipForm({ ...equipForm, caratteristiche: e.target.value })}
                    rows={2}
                    className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/5 text-white placeholder-white/20 focus:outline-none resize-none"
                  />
                </div>
                <div className="space-y-1">
                  <label htmlFor="eq-notes" className="block text-[10px] uppercase font-black tracking-wider text-white/45">Note del Coach</label>
                  <textarea
                    id="eq-notes"
                    placeholder="Note organizzative o raccomandazioni specifiche su come programmare questo attrezzo..."
                    value={equipForm.noteCoach}
                    onChange={(e) => setEquipForm({ ...equipForm, noteCoach: e.target.value })}
                    rows={2}
                    className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/5 text-white placeholder-white/20 focus:outline-none resize-none"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-white/5 flex justify-end gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => { setShowEquipModal(false); lastActiveElement.current?.focus(); }}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white border border-white/5 transition-all cursor-pointer font-bold"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-neutral-950 font-black uppercase tracking-wider transition-all cursor-pointer shadow-md"
                  style={{ backgroundColor: config.primaryColor }}
                >
                  Salva Attrezzatura
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QUICK ADD MODAL */}
      {showQuickAddModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 overflow-y-auto" role="dialog" aria-modal="true" aria-labelledby="quick-modal-title">
          <div ref={quickAddModalRef} className="bg-[#121212] border border-white/10 rounded-2xl w-full max-w-xl p-5 space-y-4 shadow-xl">
            <div className="flex justify-between items-center border-b border-white/5 pb-3">
              <h3 id="quick-modal-title" className="text-sm font-black uppercase tracking-wider text-white">
                Aggiunta Rapida Attrezzature Comuni
              </h3>
              <button
                onClick={() => { setShowQuickAddModal(false); lastActiveElement.current?.focus(); }}
                className="p-1 rounded-lg text-white/40 hover:text-white transition-colors"
                aria-label="Chiudi"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-white/30" />
              <input
                type="text"
                placeholder="Filtra attrezzature comuni..."
                value={quickAddSearch}
                onChange={(e) => setQuickAddSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-black/40 border border-white/5 text-white placeholder-white/35 focus:outline-none"
              />
            </div>

            <div className="max-h-[350px] overflow-y-auto space-y-4 pr-1 scrollbar-thin">
              {(() => {
                const groups = [
                  { title: 'Macchine e Strutture', items: QUICK_ADD_ITEMS.filter(it => !['bilancieri', 'manubri', 'dischi', 'panche', 'accessori', 'cardio'].includes(it.categoria)) },
                  { title: 'Pesi Liberi e Panche', items: QUICK_ADD_ITEMS.filter(it => ['bilancieri', 'manubri', 'dischi', 'panche'].includes(it.categoria)) },
                  { title: 'Accessori', items: QUICK_ADD_ITEMS.filter(it => it.categoria === 'accessori') },
                  { title: 'Cardio', items: QUICK_ADD_ITEMS.filter(it => it.categoria === 'cardio') }
                ];

                const searchFiltered = (items: typeof QUICK_ADD_ITEMS) => {
                  if (!quickAddSearch.trim()) return items;
                  const q = quickAddSearch.toLowerCase();
                  return items.filter(it => 
                    it.nome.toLowerCase().includes(q) ||
                    EQUIPMENT_CATEGORY_LABELS[it.categoria].toLowerCase().includes(q)
                  );
                };

                let hasAny = false;

                return (
                  <>
                    {groups.map(g => {
                      const filtered = searchFiltered(g.items);
                      if (filtered.length === 0) return null;
                      hasAny = true;

                      return (
                        <div key={g.title} className="space-y-2">
                          <h4 className="text-[10px] font-black uppercase text-white/35 tracking-wider border-b border-white/5 pb-1">{g.title}</h4>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                            {filtered.map(item => {
                              const isSelected = selectedQuickAddNames.includes(item.nome);
                              return (
                                <button
                                  key={item.nome}
                                  type="button"
                                  onClick={() => toggleQuickAddSelection(item.nome)}
                                  className={`px-2.5 py-2 rounded-xl text-left text-xs transition-all border flex flex-col justify-between h-[52px] ${
                                    isSelected 
                                      ? 'bg-lime-400/10 border-lime-400/30 text-lime-400' 
                                      : 'bg-black/30 border-white/5 text-white/70 hover:bg-black/40 hover:text-white'
                                  }`}
                                >
                                  <span className="font-extrabold line-clamp-1">{item.nome}</span>
                                  <span className="text-[9px] text-white/30 font-medium">{EQUIPMENT_CATEGORY_LABELS[item.categoria]}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                    {!hasAny && (
                      <div className="text-center py-8 text-xs text-white/30">Nessuna attrezzatura trovata.</div>
                    )}
                  </>
                );
              })()}
            </div>

            <div className="pt-3 border-t border-white/5 flex justify-between items-center text-xs">
              <span className="text-white/40">{selectedQuickAddNames.length} selezionate</span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => { setShowQuickAddModal(false); lastActiveElement.current?.focus(); }}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white border border-white/5 transition-all cursor-pointer font-bold"
                >
                  Annulla
                </button>
                <button
                  type="button"
                  onClick={handleConfirmQuickAdd}
                  className="px-4 py-2 rounded-xl text-neutral-950 font-black uppercase tracking-wider transition-all cursor-pointer shadow-md"
                  style={{ backgroundColor: config.primaryColor }}
                >
                  Conferma e Aggiungi
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
