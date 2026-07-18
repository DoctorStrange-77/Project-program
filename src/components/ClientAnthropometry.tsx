import React, { useState, useEffect, useRef } from 'react';
import { 
  Client, 
  CoachConfig, 
  ClientMeasurement, 
  CircumferenceMeasurements, 
  SkinfoldMeasurements, 
  SkinfoldReading, 
  SkinfoldSite, 
  BodyCompositionData, 
  BodyCompositionMethod, 
  MeasurementContext, 
  MeasurementConditions,
  SkinfoldFormulaId,
  BodyDensityConversionId,
  BodyCompositionCalculationInput,
  BodyCompositionCalculationResult,
  Sesso,
  SavedBodyCompositionCalculation
} from '../types';
import { 
  Scale, Ruler, TrendingUp, Info, Activity, Edit2, Trash2, Plus, 
  ChevronLeft, Eye, X, AlertTriangle, Copy, Calendar, Sparkles, Check, CheckCircle, Flame
} from 'lucide-react';
import {
  BODY_COMPOSITION_FORMULAS,
  calculateBodyComposition,
  validateBodyCompositionInput,
  createBodyCompositionInputSignature,
  isSavedCalculationOutdated,
  getRequiredSites
} from '../utils/bodyCompositionCalculations';

interface ClientAnthropometryProps {
  client: Client;
  config: CoachConfig;
  onUpdateClient: (updatedClient: Client) => void;
  onShowToast?: (message: string, type: 'success' | 'error' | 'info' | 'warning') => void;
  onShowConfirm?: (config: {
    title: string;
    message: string;
    confirmText: string;
    cancelText?: string;
    isDestructive?: boolean;
    onConfirm: () => void;
  }) => void;
  selectedMeasurementId?: string | null;
  onClearSelectedMeasurementId?: () => void;
}

const SKIN_FOLD_SITES: { site: SkinfoldSite; label: string }[] = [
  { site: 'pettorale', label: 'Pettorale' },
  { site: 'addominale', label: 'Addominale' },
  { site: 'coscia', label: 'Coscia' },
  { site: 'tricipitale', label: 'Tricipitale' },
  { site: 'bicipitale', label: 'Bicipitale' },
  { site: 'sottoscapolare', label: 'Sottoscapolare' },
  { site: 'sovrailiaca', label: 'Sovrailiaca' },
  { site: 'ascellareMedia', label: 'Ascellare Media' },
  { site: 'polpaccio', label: 'Polpaccio' },
  { site: 'lombare', label: 'Lombare' }
];

export function calculateSkinfoldSelectedValue(readings: number[]): { selectedValue?: number; diff?: number; count: number } {
  const valid = readings.filter(r => r !== undefined && r !== null && !isNaN(r) && r > 0);
  if (valid.length === 0) return { count: 0 };
  
  let selectedValue = 0;
  if (valid.length === 1) {
    selectedValue = valid[0];
  } else if (valid.length === 2) {
    selectedValue = (valid[0] + valid[1]) / 2;
  } else {
    const sorted = [...valid].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    if (sorted.length % 2 !== 0) {
      selectedValue = sorted[mid];
    } else {
      selectedValue = (sorted[mid - 1] + sorted[mid]) / 2;
    }
  }
  
  const max = Math.max(...valid);
  const min = Math.min(...valid);
  const diff = max - min;
  
  return {
    selectedValue: Number(selectedValue.toFixed(1)),
    diff: Number(diff.toFixed(1)),
    count: valid.length
  };
}

export function getNormalizedMeasurement(r: ClientMeasurement | undefined): any {
  if (!r) return null;
  
  const vita = r.circonferenze?.vita ?? r.vita;
  const torace = r.circonferenze?.torace ?? r.torace;
  
  const braccioDestroFlesso = r.circonferenze?.braccioDestroFlesso ?? r.braccio;
  const braccioDestroRilassato = r.circonferenze?.braccioDestroRilassato;
  const braccioSinistroFlesso = r.circonferenze?.braccioSinistroFlesso;
  const braccioSinistroRilassato = r.circonferenze?.braccioSinistroRilassato;
  
  const cosciaDestraMediale = r.circonferenze?.cosciaDestraMediale ?? r.coscia;
  const cosciaSinistraMediale = r.circonferenze?.cosciaSinistraMediale;
  const cosciaDestraProssimale = r.circonferenze?.cosciaDestraProssimale;
  const cosciaSinistraProssimale = r.circonferenze?.cosciaSinistraProssimale;
  
  const bodyFatPercent = r.composizioneCorporea?.bodyFatPercent ?? r.massaGrassa;
  
  let derivedFatMass: number | undefined = undefined;
  let derivedLeanMass: number | undefined = undefined;
  if (r.peso && bodyFatPercent !== undefined) {
    derivedFatMass = Number((r.peso * bodyFatPercent / 100).toFixed(2));
    derivedLeanMass = Number((r.peso - derivedFatMass).toFixed(2));
  }
  
  const fatMassKg = r.composizioneCorporea?.fatMassKg ?? derivedFatMass;
  const leanMassKg = r.composizioneCorporea?.leanMassKg ?? derivedLeanMass;

  const readingsList = r.pliche?.readings ?? [];
  const plicheSum = readingsList.reduce((sum, site) => {
    if (site.selectedValue !== undefined) {
      return sum + site.selectedValue;
    }
    return sum;
  }, 0);

  return {
    ...r,
    altezza: r.altezza,
    circonferenze: {
      collo: r.circonferenze?.collo,
      spalle: r.circonferenze?.spalle,
      torace,
      vita,
      addome: r.circonferenze?.addome,
      fianchi: r.circonferenze?.fianchi,
      braccioSinistroRilassato: r.circonferenze?.braccioSinistroRilassato ?? braccioSinistroRilassato,
      braccioDestroRilassato: r.circonferenze?.braccioDestroRilassato ?? braccioDestroRilassato,
      braccioSinistroFlesso: r.circonferenze?.braccioSinistroFlesso ?? braccioSinistroFlesso,
      braccioDestroFlesso,
      avambraccioSinistro: r.circonferenze?.avambraccioSinistro,
      avambraccioDestro: r.circonferenze?.avambraccioDestro,
      cosciaSinistraProssimale: r.circonferenze?.cosciaSinistraProssimale ?? cosciaSinistraProssimale,
      cosciaDestraProssimale: r.circonferenze?.cosciaDestraProssimale ?? cosciaDestraProssimale,
      cosciaSinistraMediale: r.circonferenze?.cosciaSinistraMediale ?? cosciaSinistraMediale,
      cosciaDestraMediale,
      polpaccioSinistro: r.circonferenze?.polpaccioSinistro,
      polpaccioDestro: r.circonferenze?.polpaccioDestro,
    },
    pliche: {
      protocolName: r.pliche?.protocolName ?? 'Personalizzato',
      caliperName: r.pliche?.caliperName,
      readings: readingsList,
      notes: r.pliche?.notes
    },
    composizioneCorporea: {
      method: r.composizioneCorporea?.method ?? 'manuale',
      bodyFatPercent,
      fatMassKg,
      leanMassKg,
      skeletalMuscleMassKg: r.composizioneCorporea?.skeletalMuscleMassKg,
      totalBodyWaterPercent: r.composizioneCorporea?.totalBodyWaterPercent,
      visceralFatIndex: r.composizioneCorporea?.visceralFatIndex,
      deviceName: r.composizioneCorporea?.deviceName,
      manuallyEntered: r.composizioneCorporea?.manuallyEntered
    },
    condizioni: {
      time: r.condizioni?.time,
      fastingHours: r.condizioni?.fastingHours,
      hydrationNotes: r.condizioni?.hydrationNotes,
      lastTrainingHours: r.condizioni?.lastTrainingHours,
      operatorName: r.condizioni?.operatorName,
      clothingNotes: r.condizioni?.clothingNotes,
      measurementLocation: r.condizioni?.measurementLocation,
    },
    plicheSum: readingsList.length > 0 ? Number(plicheSum.toFixed(1)) : undefined,
    plicheCount: readingsList.filter(s => s.selectedValue !== undefined).length
  };
}

export default function ClientAnthropometry({
  client,
  config,
  onUpdateClient,
  onShowToast,
  onShowConfirm,
  selectedMeasurementId,
  onClearSelectedMeasurementId
}: ClientAnthropometryProps) {
  const [anthropometryView, setAnthropometryView] = useState<'panoramica' | 'storico' | 'confronta' | 'nuova'>('panoramica');
  const [chartMetric, setChartMetric] = useState<'peso' | 'bodyFatPercent' | 'leanMassKg' | 'torace' | 'vita' | 'fianchi' | 'plicheSum'>('peso');
  
  // Modals & Detail states
  const [detailedMeasurement, setDetailedMeasurement] = useState<any>(null);
  const [editingMeasurement, setEditingMeasurement] = useState<any>(null);
  const [isDuplicateMode, setIsDuplicateMode] = useState(false);

  // Compare dropdowns
  const [compareStartId, setCompareStartId] = useState('');
  const [compareEndId, setCompareEndId] = useState('');

  // Sections collapse
  const [collapseSections, setCollapseSections] = useState({
    generali: true,
    circonferenze: true,
    plicometria: true,
    composizione: true,
    condizioni: false
  });

  // Form fields
  const [data, setData] = useState('');
  const [context, setContext] = useState<MeasurementContext>('presenza');
  const [peso, setPeso] = useState<number | ''>('');
  const [altezza, setAltezza] = useState<number | ''>('');
  const [noteControllo, setNoteControllo] = useState('');

  const [collo, setCollo] = useState<number | ''>('');
  const [spalle, setSpalle] = useState<number | ''>('');
  const [torace, setTorace] = useState<number | ''>('');
  const [vita, setVita] = useState<number | ''>('');
  const [addome, setAddome] = useState<number | ''>('');
  const [fianchi, setFianchi] = useState<number | ''>('');

  const [braccioSinistroRilassato, setBraccioSinistroRilassato] = useState<number | ''>('');
  const [braccioDestroRilassato, setBraccioDestroRilassato] = useState<number | ''>('');
  const [braccioSinistroFlesso, setBraccioSinistroFlesso] = useState<number | ''>('');
  const [braccioDestroFlesso, setBraccioDestroFlesso] = useState<number | ''>('');

  const [avambraccioSinistro, setAvambraccioSinistro] = useState<number | ''>('');
  const [avambraccioDestro, setAvambraccioDestro] = useState<number | ''>('');

  const [cosciaSinistraProssimale, setCosciaSinistraProssimale] = useState<number | ''>('');
  const [cosciaDestraProssimale, setCosciaDestraProssimale] = useState<number | ''>('');
  const [cosciaSinistraMediale, setCosciaSinistraMediale] = useState<number | ''>('');
  const [cosciaDestraMediale, setCosciaDestraMediale] = useState<number | ''>('');

  const [polpaccioSinistro, setPolpaccioSinistro] = useState<number | ''>('');
  const [polpaccioDestro, setPolpaccioDestro] = useState<number | ''>('');

  const [skinfoldValues, setSkinfoldValues] = useState<Record<SkinfoldSite, number[]>>({
    pettorale: ['', '', ''] as any,
    addominale: ['', '', ''] as any,
    coscia: ['', '', ''] as any,
    tricipitale: ['', '', ''] as any,
    bicipitale: ['', '', ''] as any,
    sottoscapolare: ['', '', ''] as any,
    sovrailiaca: ['', '', ''] as any,
    ascellareMedia: ['', '', ''] as any,
    polpaccio: ['', '', ''] as any,
    lombare: ['', '', ''] as any
  });
  const [protocolName, setProtocolName] = useState('Personalizzato');
  const [caliperName, setCaliperName] = useState('');
  const [skinfoldNotes, setSkinfoldNotes] = useState('');

  const [method, setMethod] = useState<BodyCompositionMethod>('manuale');
  const [bodyFatPercent, setBodyFatPercent] = useState<number | ''>('');
  const [fatMassKg, setFatMassKg] = useState<number | ''>('');
  const [isFatMassOverridden, setIsFatMassOverridden] = useState(false);
  const [leanMassKg, setLeanMassKg] = useState<number | ''>('');
  const [isLeanMassOverridden, setIsLeanMassOverridden] = useState(false);
  const [skeletalMuscleMassKg, setSkeletalMuscleMassKg] = useState<number | ''>('');
  const [totalBodyWaterPercent, setTotalBodyWaterPercent] = useState<number | ''>('');
  const [visceralFatIndex, setVisceralFatIndex] = useState<number | ''>('');
  const [deviceName, setDeviceName] = useState('');

  // States for plicometria body composition calculations
  const [selectedFormulaId, setSelectedFormulaId] = useState<SkinfoldFormulaId>('jackson_pollock_3_male');
  const [selectedConversionId, setSelectedConversionId] = useState<BodyDensityConversionId>('siri_1961');
  const [customAge, setCustomAge] = useState<number | ''>('');
  const [customSesso, setCustomSesso] = useState<Sesso>('Uomo');
  const [calculationMode, setCalculationMode] = useState<'manuale' | 'formula'>('manuale');
  const [savedCalculation, setSavedCalculation] = useState<SavedBodyCompositionCalculation | null>(null);
  const [calculationOutdated, setCalculationOutdated] = useState(false);
  const [currentCalculationPreview, setCurrentCalculationPreview] = useState<BodyCompositionCalculationResult | null>(null);

  const [time, setTime] = useState('');
  const [fastingHours, setFastingHours] = useState<number | ''>('');
  const [hydrationNotes, setHydrationNotes] = useState('');
  const [lastTrainingHours, setLastTrainingHours] = useState<number | ''>('');
  const [operatorName, setOperatorName] = useState('');
  const [clothingNotes, setClothingNotes] = useState('');
  const [measurementLocation, setMeasurementLocation] = useState('');

  const [errors, setErrors] = useState<Record<string, string>>({});

  const containerRef = useRef<HTMLDivElement>(null);

  const sortedRilevazioni = client.rilevazioni && client.rilevazioni.length > 0
    ? [...client.rilevazioni].sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime())
    : [];

  const latestNormalized = sortedRilevazioni.length > 0 
    ? getNormalizedMeasurement(sortedRilevazioni[sortedRilevazioni.length - 1]) 
    : null;

  const previousNormalized = sortedRilevazioni.length >= 2 
    ? getNormalizedMeasurement(sortedRilevazioni[sortedRilevazioni.length - 2]) 
    : null;

  useEffect(() => {
    if (selectedMeasurementId) {
      const match = sortedRilevazioni.find(r => r.id === selectedMeasurementId);
      if (match) {
        setDetailedMeasurement(getNormalizedMeasurement(match));
        setAnthropometryView('storico');
      }
    }
  }, [selectedMeasurementId, client.rilevazioni]);

  // Derived auto-calc for fat mass & lean mass
  useEffect(() => {
    if (peso && bodyFatPercent !== '') {
      const computedFat = Number((peso * bodyFatPercent / 100).toFixed(2));
      const computedLean = Number((peso - computedFat).toFixed(2));
      if (!isFatMassOverridden) setFatMassKg(computedFat);
      if (!isLeanMassOverridden) setLeanMassKg(computedLean);
    } else {
      if (!isFatMassOverridden) setFatMassKg('');
      if (!isLeanMassOverridden) setLeanMassKg('');
    }
  }, [peso, bodyFatPercent, isFatMassOverridden, isLeanMassOverridden]);

  // Initial populate compare
  useEffect(() => {
    if (sortedRilevazioni.length >= 2) {
      setCompareStartId(sortedRilevazioni[0].id);
      setCompareEndId(sortedRilevazioni[sortedRilevazioni.length - 1].id);
    }
  }, [client.rilevazioni]);

  // Escape key support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (detailedMeasurement) setDetailedMeasurement(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [detailedMeasurement]);

  // Helpers to format current skinfolds and construct calculation inputs
  const getSkinfoldValuesMmForCalculation = (): Partial<Record<SkinfoldSite, number>> => {
    const skinfoldValuesMm: Partial<Record<SkinfoldSite, number>> = {};
    (Object.keys(skinfoldValues) as SkinfoldSite[]).forEach(site => {
      const readings = skinfoldValues[site].filter(r => r !== '' && r !== null && !isNaN(Number(r)));
      if (readings.length > 0) {
        const calc = calculateSkinfoldSelectedValue(readings.map(Number));
        if (calc.selectedValue !== undefined) {
          skinfoldValuesMm[site] = calc.selectedValue;
        }
      }
    });
    return skinfoldValuesMm;
  };

  const getCalculationInput = (): BodyCompositionCalculationInput => {
    return {
      formulaId: selectedFormulaId,
      conversionId: selectedConversionId,
      sesso: customSesso,
      eta: Number(customAge) || client.eta || 30,
      pesoKg: Number(peso) || 0,
      skinfoldValuesMm: getSkinfoldValuesMmForCalculation()
    };
  };

  // Effect to automatically detect if current inputs differ from saved calculation
  useEffect(() => {
    if (savedCalculation) {
      const currentInput = getCalculationInput();
      const currentSig = createBodyCompositionInputSignature(currentInput);
      setCalculationOutdated(savedCalculation.inputSignature !== currentSig);
    } else {
      setCalculationOutdated(false);
    }
  }, [
    savedCalculation,
    selectedFormulaId,
    selectedConversionId,
    customAge,
    customSesso,
    peso,
    skinfoldValues
  ]);

  const handleOpenForm = (existing: any = null, isDuplicate = false) => {
    setErrors({});
    setIsDuplicateMode(isDuplicate);
    setEditingMeasurement(isDuplicate ? null : existing);

    const todayStr = new Date().toISOString().substring(0, 10);
    
    if (existing) {
      const norm = getNormalizedMeasurement(existing);
      setData(isDuplicate ? todayStr : norm.data);
      setContext(norm.context ?? 'presenza');
      setPeso(norm.peso);
      setAltezza(norm.altezza ?? client.altezza ?? '');
      setNoteControllo(norm.noteControllo ?? '');

      const circ = norm.circonferenze ?? {};
      setCollo(circ.collo ?? '');
      setSpalle(circ.spalle ?? '');
      setTorace(circ.torace ?? '');
      setVita(circ.vita ?? '');
      setAddome(circ.addome ?? '');
      setFianchi(circ.fianchi ?? '');

      setBraccioSinistroRilassato(circ.braccioSinistroRilassato ?? '');
      setBraccioDestroRilassato(circ.braccioDestroRilassato ?? '');
      setBraccioSinistroFlesso(circ.braccioSinistroFlesso ?? '');
      setBraccioDestroFlesso(circ.braccioDestroFlesso ?? '');
      setAvambraccioSinistro(circ.avambraccioSinistro ?? '');
      setAvambraccioDestro(circ.avambraccioDestro ?? '');

      setCosciaSinistraProssimale(circ.cosciaSinistraProssimale ?? '');
      setCosciaDestraProssimale(circ.cosciaDestraProssimale ?? '');
      setCosciaSinistraMediale(circ.cosciaSinistraMediale ?? '');
      setCosciaDestraMediale(circ.cosciaDestraMediale ?? '');
      setPolpaccioSinistro(circ.polpaccioSinistro ?? '');
      setPolpaccioDestro(circ.polpaccioDestro ?? '');

      // Skinfolds Map
      const skinfoldMap: Record<SkinfoldSite, number[]> = {
        pettorale: ['', '', ''] as any,
        addominale: ['', '', ''] as any,
        coscia: ['', '', ''] as any,
        tricipitale: ['', '', ''] as any,
        bicipitale: ['', '', ''] as any,
        sottoscapolare: ['', '', ''] as any,
        sovrailiaca: ['', '', ''] as any,
        ascellareMedia: ['', '', ''] as any,
        polpaccio: ['', '', ''] as any,
        lombare: ['', '', ''] as any
      };
      
      if (norm.pliche?.readings) {
        norm.pliche.readings.forEach((r: SkinfoldReading) => {
          skinfoldMap[r.site] = [
            r.readings[0] ?? '',
            r.readings[1] ?? '',
            r.readings[2] ?? ''
          ] as any;
        });
      }
      setSkinfoldValues(skinfoldMap);
      setProtocolName(norm.pliche?.protocolName ?? 'Personalizzato');
      setCaliperName(norm.pliche?.caliperName ?? '');
      setSkinfoldNotes(norm.pliche?.notes ?? '');

      // Comp Corporea
      const cc = norm.composizioneCorporea ?? {};
      setMethod(cc.method ?? 'manuale');
      setBodyFatPercent(cc.bodyFatPercent ?? '');
      setFatMassKg(cc.fatMassKg ?? '');
      setIsFatMassOverridden(cc.manuallyEntered ?? false);
      setLeanMassKg(cc.leanMassKg ?? '');
      setIsLeanMassOverridden(cc.manuallyEntered ?? false);
      setSkeletalMuscleMassKg(cc.skeletalMuscleMassKg ?? '');
      setTotalBodyWaterPercent(cc.totalBodyWaterPercent ?? '');
      setVisceralFatIndex(cc.visceralFatIndex ?? '');
      setDeviceName(cc.deviceName ?? '');

      const saved = cc.savedCalculation ?? null;
      setSavedCalculation(saved);
      setCalculationMode(cc.calculationMode ?? (saved ? 'formula' : 'manuale'));
      setCalculationOutdated(cc.calculationOutdated ?? false);
      
      if (saved) {
        setSelectedFormulaId(saved.formulaId);
        setSelectedConversionId(saved.conversionId);
        setCustomAge(saved.etaUtilizzata);
        setCustomSesso(saved.sessoUtilizzato);
        setCurrentCalculationPreview(saved);
      } else {
        setSelectedFormulaId(client.sesso === 'Donna' ? 'jackson_pollock_3_female' : 'jackson_pollock_3_male');
        setSelectedConversionId('siri_1961');
        setCustomAge(client.eta ?? 30);
        setCustomSesso(client.sesso ?? 'Uomo');
        setCurrentCalculationPreview(null);
      }

      // Conditions
      const cond = norm.condizioni ?? {};
      setTime(cond.time ?? '');
      setFastingHours(cond.fastingHours ?? '');
      setHydrationNotes(cond.hydrationNotes ?? '');
      setLastTrainingHours(cond.lastTrainingHours ?? '');
      setOperatorName(cond.operatorName ?? '');
      setClothingNotes(cond.clothingNotes ?? '');
      setMeasurementLocation(cond.measurementLocation ?? '');
    } else {
      setData(todayStr);
      setContext('presenza');
      setPeso(latestNormalized?.peso ?? client.pesoAttuale ?? '');
      setAltezza(client.altezza ?? latestNormalized?.altezza ?? '');
      setNoteControllo('');

      setCollo(''); setSpalle(''); setTorace(''); setVita(''); setAddome(''); setFianchi('');
      setBraccioSinistroRilassato(''); setBraccioDestroRilassato('');
      setBraccioSinistroFlesso(''); setBraccioDestroFlesso('');
      setAvambraccioSinistro(''); setAvambraccioDestro('');
      setCosciaSinistraProssimale(''); setCosciaDestraProssimale('');
      setCosciaSinistraMediale(''); setCosciaDestraMediale('');
      setPolpaccioSinistro(''); setPolpaccioDestro('');

      setSkinfoldValues({
        pettorale: ['', '', ''] as any,
        addominale: ['', '', ''] as any,
        coscia: ['', '', ''] as any,
        tricipitale: ['', '', ''] as any,
        bicipitale: ['', '', ''] as any,
        sottoscapolare: ['', '', ''] as any,
        sovrailiaca: ['', '', ''] as any,
        ascellareMedia: ['', '', ''] as any,
        polpaccio: ['', '', ''] as any,
        lombare: ['', '', ''] as any
      });
      setProtocolName('Personalizzato');
      setCaliperName('');
      setSkinfoldNotes('');

      setMethod('manuale');
      setBodyFatPercent('');
      setFatMassKg('');
      setIsFatMassOverridden(false);
      setLeanMassKg('');
      setIsLeanMassOverridden(false);
      setSkeletalMuscleMassKg('');
      setTotalBodyWaterPercent('');
      setVisceralFatIndex('');
      setDeviceName('');

      setSavedCalculation(null);
      setCalculationMode('manuale');
      setCalculationOutdated(false);
      setSelectedFormulaId(client.sesso === 'Donna' ? 'jackson_pollock_3_female' : 'jackson_pollock_3_male');
      setSelectedConversionId('siri_1961');
      setCustomAge(client.eta ?? 30);
      setCustomSesso(client.sesso ?? 'Uomo');
      setCurrentCalculationPreview(null);

      setTime(''); setFastingHours(''); setHydrationNotes(''); setLastTrainingHours('');
      setOperatorName(''); setClothingNotes(''); setMeasurementLocation('');
    }

    setAnthropometryView('nuova');
  };

  const handleCopyFromLast = () => {
    if (!latestNormalized) {
      if (onShowToast) onShowToast('Nessuna rilevazione precedente da copiare.', 'warning');
      return;
    }
    
    // Copy circumferences and other params
    const circ = latestNormalized.circonferenze ?? {};
    setCollo(circ.collo ?? '');
    setSpalle(circ.spalle ?? '');
    setTorace(circ.torace ?? '');
    setVita(circ.vita ?? '');
    setAddome(circ.addome ?? '');
    setFianchi(circ.fianchi ?? '');

    setBraccioSinistroRilassato(circ.braccioSinistroRilassato ?? '');
    setBraccioDestroRilassato(circ.braccioDestroRilassato ?? '');
    setBraccioSinistroFlesso(circ.braccioSinistroFlesso ?? '');
    setBraccioDestroFlesso(circ.braccioDestroFlesso ?? '');
    setAvambraccioSinistro(circ.avambraccioSinistro ?? '');
    setAvambraccioDestro(circ.avambraccioDestro ?? '');

    setCosciaSinistraProssimale(circ.cosciaSinistraProssimale ?? '');
    setCosciaDestraProssimale(circ.cosciaDestraProssimale ?? '');
    setCosciaSinistraMediale(circ.cosciaSinistraMediale ?? '');
    setCosciaDestraMediale(circ.cosciaDestraMediale ?? '');
    setPolpaccioSinistro(circ.polpaccioSinistro ?? '');
    setPolpaccioDestro(circ.polpaccioDestro ?? '');

    // Copy Skinfolds readings
    const skinfoldMap: Record<SkinfoldSite, number[]> = {
      pettorale: ['', '', ''] as any,
      addominale: ['', '', ''] as any,
      coscia: ['', '', ''] as any,
      tricipitale: ['', '', ''] as any,
      bicipitale: ['', '', ''] as any,
      sottoscapolare: ['', '', ''] as any,
      sovrailiaca: ['', '', ''] as any,
      ascellareMedia: ['', '', ''] as any,
      polpaccio: ['', '', ''] as any,
      lombare: ['', '', ''] as any
    };
    if (latestNormalized.pliche?.readings) {
      latestNormalized.pliche.readings.forEach((r: SkinfoldReading) => {
        skinfoldMap[r.site] = [
          r.readings[0] ?? '',
          r.readings[1] ?? '',
          r.readings[2] ?? ''
        ] as any;
      });
    }
    setSkinfoldValues(skinfoldMap);
    setProtocolName(latestNormalized.pliche?.protocolName ?? 'Personalizzato');
    setCaliperName(latestNormalized.pliche?.caliperName ?? '');

    if (onShowToast) onShowToast('Parametri antropometrici copiati dall\'ultima rilevazione!', 'success');
  };

  const validateFields = (): boolean => {
    const errs: Record<string, string> = {};
    
    if (!peso || peso <= 0 || peso >= 500) {
      errs.peso = 'Il peso corporeo deve essere maggiore di 0 kg e inferiore a 500 kg.';
    }
    if (altezza !== '' && (altezza <= 0 || altezza >= 300)) {
      errs.altezza = 'L\'altezza deve essere compresa tra 0 cm e 300 cm.';
    }
    if (bodyFatPercent !== '' && (bodyFatPercent < 0 || bodyFatPercent > 100)) {
      errs.bodyFatPercent = 'La percentuale di grasso corporeo deve essere compresa tra 0% e 100%.';
    }
    if (totalBodyWaterPercent !== '' && (totalBodyWaterPercent < 0 || totalBodyWaterPercent > 100)) {
      errs.totalBodyWaterPercent = 'L\'acqua corporea totale deve essere compresa tra 0% e 100%.';
    }
    if (fastingHours !== '' && (fastingHours < 0 || fastingHours > 72)) {
      errs.fastingHours = 'Le ore di digiuno devono essere comprese tra 0 e 72.';
    }
    if (lastTrainingHours !== '' && (lastTrainingHours < 0 || lastTrainingHours > 168)) {
      errs.lastTrainingHours = 'Le ore dall\'ultimo allenamento devono essere comprese tra 0 e 168.';
    }

    // Validate circumferences range
    const circsKeys = {
      collo, spalle, torace, vita, addome, fianchi, 
      braccioSinistroRilassato, braccioDestroRilassato, braccioSinistroFlesso, braccioDestroFlesso,
      avambraccioSinistro, avambraccioDestro,
      cosciaSinistraProssimale, cosciaDestraProssimale, cosciaSinistraMediale, cosciaDestraMediale,
      polpaccioSinistro, polpaccioDestro
    };
    Object.entries(circsKeys).forEach(([key, val]) => {
      if (val !== '' && (val <= 0 || val >= 300)) {
        errs[key] = 'La circonferenza deve essere compresa tra 0 e 300 cm.';
      }
    });

    // Validate skinfolds
    (Object.entries(skinfoldValues) as [SkinfoldSite, (number | '')[]][]).forEach(([site, readings]) => {
      readings.forEach((val, i) => {
        if (val !== '' && val !== null && (Number(val) <= 0 || Number(val) >= 100)) {
          errs[`pliche_${site}_${i}`] = 'Le pliche devono essere comprese tra 0 e 100 mm.';
        }
      });
    });

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSaveMeasurement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateFields()) {
      if (onShowToast) onShowToast('Si prega di correggere gli errori di validazione nel form.', 'error');
      return;
    }

    const nowStr = new Date().toISOString();
    const finalId = editingMeasurement?.id || (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 'm_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9));
    
    // Map SkinfoldReadings array
    const plicheReadings: SkinfoldReading[] = (Object.entries(skinfoldValues) as [SkinfoldSite, (number | '')[]][])
      .map(([site, readings]) => {
        const numReadings = readings.filter(r => r !== '' && r !== null).map(Number);
        if (numReadings.length === 0) return null;
        const calc = calculateSkinfoldSelectedValue(numReadings);
        return {
          site,
          readings: numReadings,
          selectedValue: calc.selectedValue
        };
      })
      .filter(Boolean) as SkinfoldReading[];

    // Synchronize legacy values following requirements
    const syncVita = Number(vita) || editingMeasurement?.vita || 0;
    const syncTorace = Number(torace) || editingMeasurement?.torace || 0;
    
    const syncBraccio = 
      Number(braccioDestroFlesso) || 
      Number(braccioDestroRilassato) || 
      Number(braccioSinistroFlesso) || 
      Number(braccioSinistroRilassato) || 
      editingMeasurement?.braccio || 
      0;

    const syncCoscia = 
      Number(cosciaDestraMediale) || 
      Number(cosciaSinistraMediale) || 
      Number(cosciaDestraProssimale) || 
      Number(cosciaSinistraProssimale) || 
      editingMeasurement?.coscia || 
      0;

    const syncMassaGrassa = bodyFatPercent !== '' ? Number(bodyFatPercent) : editingMeasurement?.massaGrassa;

    const savedMeasurement: ClientMeasurement = {
      ...editingMeasurement,
      id: finalId,
      data,
      peso: Number(peso),
      vita: syncVita,
      torace: syncTorace,
      braccio: syncBraccio,
      coscia: syncCoscia,
      massaGrassa: syncMassaGrassa,
      noteControllo: noteControllo.trim() || undefined,
      
      context,
      altezza: altezza !== '' ? Number(altezza) : undefined,
      
      circonferenze: {
        collo: collo !== '' ? Number(collo) : undefined,
        spalle: spalle !== '' ? Number(spalle) : undefined,
        torace: torace !== '' ? Number(torace) : undefined,
        vita: vita !== '' ? Number(vita) : undefined,
        addome: addome !== '' ? Number(addome) : undefined,
        fianchi: fianchi !== '' ? Number(fianchi) : undefined,
        braccioSinistroRilassato: braccioSinistroRilassato !== '' ? Number(braccioSinistroRilassato) : undefined,
        braccioDestroRilassato: braccioDestroRilassato !== '' ? Number(braccioDestroRilassato) : undefined,
        braccioSinistroFlesso: braccioSinistroFlesso !== '' ? Number(braccioSinistroFlesso) : undefined,
        braccioDestroFlesso: braccioDestroFlesso !== '' ? Number(braccioDestroFlesso) : undefined,
        avambraccioSinistro: avambraccioSinistro !== '' ? Number(avambraccioSinistro) : undefined,
        avambraccioDestro: avambraccioDestro !== '' ? Number(avambraccioDestro) : undefined,
        cosciaSinistraProssimale: cosciaSinistraProssimale !== '' ? Number(cosciaSinistraProssimale) : undefined,
        cosciaDestraProssimale: cosciaDestraProssimale !== '' ? Number(cosciaDestraProssimale) : undefined,
        cosciaSinistraMediale: cosciaSinistraMediale !== '' ? Number(cosciaSinistraMediale) : undefined,
        cosciaDestraMediale: cosciaDestraMediale !== '' ? Number(cosciaDestraMediale) : undefined,
        polpaccioSinistro: polpaccioSinistro !== '' ? Number(polpaccioSinistro) : undefined,
        polpaccioDestro: polpaccioDestro !== '' ? Number(polpaccioDestro) : undefined
      },
      
      pliche: {
        protocolName,
        caliperName: caliperName.trim() || undefined,
        readings: plicheReadings,
        notes: skinfoldNotes.trim() || undefined
      },

      composizioneCorporea: {
        method,
        bodyFatPercent: bodyFatPercent !== '' ? Number(bodyFatPercent) : undefined,
        fatMassKg: fatMassKg !== '' ? Number(fatMassKg) : undefined,
        leanMassKg: leanMassKg !== '' ? Number(leanMassKg) : undefined,
        skeletalMuscleMassKg: skeletalMuscleMassKg !== '' ? Number(skeletalMuscleMassKg) : undefined,
        totalBodyWaterPercent: totalBodyWaterPercent !== '' ? Number(totalBodyWaterPercent) : undefined,
        visceralFatIndex: visceralFatIndex !== '' ? Number(visceralFatIndex) : undefined,
        deviceName: deviceName.trim() || undefined,
        manuallyEntered: isFatMassOverridden || isLeanMassOverridden,
        calculationMode,
        savedCalculation: savedCalculation ?? undefined,
        calculationOutdated
      },

      condizioni: {
        time: time || undefined,
        fastingHours: fastingHours !== '' ? Number(fastingHours) : undefined,
        hydrationNotes: hydrationNotes.trim() || undefined,
        lastTrainingHours: lastTrainingHours !== '' ? Number(lastTrainingHours) : undefined,
        operatorName: operatorName.trim() || undefined,
        clothingNotes: clothingNotes.trim() || undefined,
        measurementLocation: measurementLocation.trim() || undefined
      },

      createdAt: editingMeasurement ? editingMeasurement.createdAt : nowStr,
      updatedAt: nowStr
    };

    const currentMeasurements = client.rilevazioni ?? [];
    let updatedMeasurements: ClientMeasurement[] = [];
    if (editingMeasurement) {
      updatedMeasurements = currentMeasurements.map(m => m.id === finalId ? savedMeasurement : m);
    } else {
      // Avoid duplicate data for same date if required, here append or sort
      updatedMeasurements = [...currentMeasurements.filter(m => m.id !== finalId), savedMeasurement];
    }

    // Sort updated chronologically to find latest weight
    const sortedByDate = [...updatedMeasurements].sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime());
    const latestMeasurement = sortedByDate[sortedByDate.length - 1];

    const updatedClient: Client = {
      ...client,
      rilevazioni: sortedByDate,
      pesoAttuale: latestMeasurement ? latestMeasurement.peso : client.pesoAttuale
    };

    onUpdateClient(updatedClient);
    
    if (onShowToast) {
      onShowToast(editingMeasurement ? 'Rilevazione aggiornata con successo!' : 'Nuova rilevazione salvata!', 'success');
    }

    setAnthropometryView('storico');
    setDetailedMeasurement(getNormalizedMeasurement(savedMeasurement));
    setEditingMeasurement(null);
  };

  const handleRunCalculation = () => {
    const currentInput = getCalculationInput();
    const plicheReadings = (Object.entries(skinfoldValues) as [SkinfoldSite, (number | '')[]][]).map(([site, readings]) => ({
      site: site as SkinfoldSite,
      readings: readings.filter(r => r !== '').map(Number)
    }));

    const res = calculateBodyComposition(
      currentInput,
      plicheReadings,
      {
        time: time || undefined,
        fastingHours: fastingHours !== '' ? Number(fastingHours) : undefined,
        hydrationNotes: hydrationNotes.trim() || undefined,
        lastTrainingHours: lastTrainingHours !== '' ? Number(lastTrainingHours) : undefined,
        operatorName: operatorName.trim() || undefined,
        clothingNotes: clothingNotes.trim() || undefined,
        measurementLocation: measurementLocation.trim() || undefined
      },
      previousNormalized
    );

    setCurrentCalculationPreview(res);
    if (onShowToast) {
      if (res.status === 'invalid') {
        onShowToast('Il calcolo non è riuscito a causa di dati non validi o mancanti.', 'error');
      } else if (res.status === 'warning') {
        onShowToast('Calcolo eseguito con alcuni avvertimenti biometrici.', 'warning');
      } else {
        onShowToast('Composizione corporea calcolata con successo!', 'success');
      }
    }
  };

  const handleApplyCalculationResult = () => {
    if (!currentCalculationPreview || currentCalculationPreview.status === 'invalid') return;

    const { bodyFatPercent: bf, fatMassKg: fm, leanMassKg: lm } = currentCalculationPreview;
    
    if (bf !== undefined) {
      setBodyFatPercent(Number(bf.toFixed(2)));
    }
    if (fm !== undefined) {
      setFatMassKg(Number(fm.toFixed(2)));
      setIsFatMassOverridden(false);
    }
    if (lm !== undefined) {
      setLeanMassKg(Number(lm.toFixed(2)));
      setIsLeanMassOverridden(false);
    }

    const saved: SavedBodyCompositionCalculation = {
      ...currentCalculationPreview,
      id: savedCalculation?.id || 'calc_' + Date.now(),
      inputSignature: createBodyCompositionInputSignature(getCalculationInput())
    };

    setSavedCalculation(saved);
    setCalculationMode('formula');
    setCalculationOutdated(false);

    if (onShowToast) onShowToast('Risultato applicato con successo alla rilevazione corrente!', 'success');
  };

  const handleRestoreSavedCalculation = () => {
    if (!savedCalculation) return;

    setSelectedFormulaId(savedCalculation.formulaId);
    setSelectedConversionId(savedCalculation.conversionId);
    setCustomAge(savedCalculation.etaUtilizzata);
    setCustomSesso(savedCalculation.sessoUtilizzato);
    setPeso(savedCalculation.pesoUtilizzatoKg);

    const restoredSkinfoldValues = { ...skinfoldValues };
    Object.entries(savedCalculation.siteValuesMm).forEach(([site, val]) => {
      if (val !== undefined && val !== null) {
        restoredSkinfoldValues[site as SkinfoldSite] = [val, '', ''];
      }
    });
    setSkinfoldValues(restoredSkinfoldValues);

    setBodyFatPercent(savedCalculation.bodyFatPercent ?? '');
    setFatMassKg(savedCalculation.fatMassKg ?? '');
    setLeanMassKg(savedCalculation.leanMassKg ?? '');
    setIsFatMassOverridden(false);
    setIsLeanMassOverridden(false);

    setCurrentCalculationPreview(savedCalculation);
    setCalculationMode('formula');
    setCalculationOutdated(false);

    if (onShowToast) onShowToast('Parametri ripristinati dai dati della formula attiva!', 'info');
  };

  const handleDeleteMeasurement = (measureId: string) => {
    const performDelete = () => {
      const updatedMeasurements = (client.rilevazioni ?? []).filter(m => m.id !== measureId);
      
      // Update check connections setting measurementId to undefined
      const updatedCheckIns = (client.checkIns ?? []).map(c => 
        c.measurementId === measureId ? { ...c, measurementId: undefined } : c
      );

      const sortedByDate = [...updatedMeasurements].sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime());
      const latestMeasurement = sortedByDate[sortedByDate.length - 1];

      const updatedClient: Client = {
        ...client,
        rilevazioni: sortedByDate,
        checkIns: updatedCheckIns,
        pesoAttuale: latestMeasurement ? latestMeasurement.peso : client.pesoAttuale
      };

      onUpdateClient(updatedClient);
      
      if (onShowToast) onShowToast('Rilevazione eliminata con successo.', 'success');
      setDetailedMeasurement(null);
      setAnthropometryView('storico');
    };

    const target = (client.rilevazioni ?? []).find(m => m.id === measureId);
    const dateStr = target ? target.data.replace(/(\d{4})-(\d{2})-(\d{2})/, '$3/$2/$1') : '';
    const linked = (client.checkIns ?? []).filter(c => c.measurementId === measureId);

    const message = `Sei sicuro di voler eliminare la rilevazione del ${dateStr}? Questa operazione è irreversibile.` +
      (linked.length > 0 ? ` Ci sono ${linked.length} check collegati che perderanno il riferimento.` : '');

    if (onShowConfirm) {
      onShowConfirm({
        title: 'Eliminare rilevazione?',
        message,
        confirmText: 'Sì, elimina',
        isDestructive: true,
        onConfirm: performDelete
      });
    } else {
      if (window.confirm(message)) {
        performDelete();
      }
    }
  };

  // Asymmetries calculations helper
  const renderAsymmetryRow = (label: string, left?: number, right?: number) => {
    if (left === undefined || right === undefined || left <= 0 || right <= 0) return null;
    const diff = Math.abs(left - right);
    const avg = (left + right) / 2;
    const pct = avg > 0 ? (diff / avg) * 100 : 0;
    const hasAlert = pct > 5;

    return (
      <tr className="border-b border-white/5 text-xs text-white/80 hover:bg-white/5 transition-colors">
        <td className="p-3 font-bold text-white">{label}</td>
        <td className="p-3 text-center">{left} cm</td>
        <td className="p-3 text-center">{right} cm</td>
        <td className="p-3 text-center font-semibold text-white">{diff.toFixed(1)} cm</td>
        <td className="p-3 text-center">
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${hasAlert ? 'bg-amber-400/10 text-amber-300' : 'bg-black/30 text-white/60'}`}>
            {pct.toFixed(1)}%
          </span>
          {hasAlert && (
            <span className="block text-[8px] text-amber-400 mt-1 font-medium">Asimmetria &gt; 5%</span>
          )}
        </td>
      </tr>
    );
  };

  // Dual comparisons
  const compareInitial = sortedRilevazioni.find(r => r.id === compareStartId);
  const compareFinal = sortedRilevazioni.find(r => r.id === compareEndId);

  const renderCompareRow = (label: string, initialVal?: number, finalVal?: number, suffix = 'cm') => {
    if (initialVal === undefined && finalVal === undefined) return null;
    const init = initialVal ?? 0;
    const fin = finalVal ?? 0;
    const diff = fin - init;
    const pct = init > 0 ? (diff / init) * 100 : 0;
    
    let colorClass = 'text-white/40';
    let labelText = 'invariato';
    if (diff > 0.01) {
      colorClass = 'text-amber-400';
      labelText = 'aumento';
    } else if (diff < -0.01) {
      colorClass = 'text-emerald-400';
      labelText = 'riduzione';
    }

    return (
      <div className="grid grid-cols-5 gap-2 p-3 bg-black/10 border border-white/5 rounded-xl items-center text-xs">
        <span className="font-extrabold text-white truncate text-left col-span-2">{label}</span>
        <span className="text-center font-medium text-white/60">{initialVal !== undefined ? `${initialVal} ${suffix}` : '—'}</span>
        <span className="text-center font-medium text-white/60">{finalVal !== undefined ? `${finalVal} ${suffix}` : '—'}</span>
        <div className="text-right flex flex-col justify-center">
          {initialVal !== undefined && finalVal !== undefined ? (
            <>
              <span className={`font-black ${colorClass}`}>{diff > 0 ? `+${diff.toFixed(1)}` : diff.toFixed(1)} {suffix}</span>
              <span className="text-[9px] text-white/30 font-bold uppercase tracking-wider">{labelText} ({pct > 0 ? `+${pct.toFixed(1)}` : pct.toFixed(1)}%)</span>
            </>
          ) : (
            <span className="text-white/20 font-black">—</span>
          )}
        </div>
      </div>
    );
  };

  // Custom SVG line chart calculation
  const renderChart = () => {
    // Collect non-empty data points for metric
    const chartPoints = sortedRilevazioni.map(r => {
      const norm = getNormalizedMeasurement(r);
      let val: number | undefined = undefined;

      if (chartMetric === 'peso') val = norm.peso;
      else if (chartMetric === 'bodyFatPercent') val = norm.composizioneCorporea?.bodyFatPercent;
      else if (chartMetric === 'leanMassKg') val = norm.composizioneCorporea?.leanMassKg;
      else if (chartMetric === 'torace') val = norm.circonferenze?.torace;
      else if (chartMetric === 'vita') val = norm.circonferenze?.vita;
      else if (chartMetric === 'fianchi') val = norm.circonferenze?.fianchi;
      else if (chartMetric === 'plicheSum') val = norm.plicheSum;

      return { date: r.data, val };
    }).filter(p => p.val !== undefined && p.val !== null && !isNaN(p.val)) as { date: string; val: number }[];

    if (chartPoints.length < 2) {
      return (
        <div className="flex flex-col items-center justify-center h-48 bg-black/40 border border-white/5 rounded-xl p-4 text-center">
          <TrendingUp className="w-8 h-8 text-white/15 mb-2" />
          <p className="text-xs font-bold text-white/50 uppercase tracking-wider">Grafico non disponibile</p>
          <p className="text-[10px] text-white/30 max-w-xs mt-1">Registra almeno 2 rilevazioni con il parametro selezionato compilato per visualizzare l'andamento.</p>
        </div>
      );
    }

    const values = chartPoints.map(p => p.val);
    const minVal = Math.max(0, Math.min(...values) - 2);
    const maxVal = Math.max(...values) + 2;
    const valRange = maxVal - minVal || 1;

    // SVG coordinates config
    const width = 600;
    const height = 220;
    const paddingLeft = 40;
    const paddingRight = 20;
    const paddingTop = 20;
    const paddingBottom = 30;

    const chartWidth = width - paddingLeft - paddingRight;
    const chartHeight = height - paddingTop - paddingBottom;

    const points = chartPoints.map((p, i) => {
      const x = paddingLeft + (i / (chartPoints.length - 1)) * chartWidth;
      const y = paddingTop + chartHeight - ((p.val - minVal) / valRange) * chartHeight;
      return { x, y, val: p.val, date: p.date };
    });

    const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
    const areaD = `${pathD} L ${points[points.length - 1].x} ${paddingTop + chartHeight} L ${points[0].x} ${paddingTop + chartHeight} Z`;

    const metricLabels: Record<string, string> = {
      peso: 'Peso',
      bodyFatPercent: 'Massa Grassa %',
      leanMassKg: 'Massa Magra kg',
      torace: 'Torace',
      vita: 'Vita',
      fianchi: 'Fianchi',
      plicheSum: 'Somma Pliche'
    };

    return (
      <div className="space-y-4">
        <div className="flex flex-wrap justify-between items-center bg-[#1c1c1c] p-3 rounded-xl border border-white/5 gap-2">
          <span className="text-[10px] font-black uppercase text-white/50 tracking-wider">Metrica Selezionata</span>
          <div className="flex flex-wrap gap-1">
            {Object.entries(metricLabels).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setChartMetric(key as any)}
                className={`px-2.5 py-1 rounded text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                  chartMetric === key ? 'text-neutral-950' : 'bg-white/5 text-white/50 hover:bg-white/10 hover:text-white'
                }`}
                style={{ backgroundColor: chartMetric === key ? config.primaryColor : undefined }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="relative bg-black/20 rounded-xl p-3 border border-white/5">
          <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible">
            <defs>
              <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={config.primaryColor} stopOpacity="0.25" />
                <stop offset="100%" stopColor={config.primaryColor} stopOpacity="0.0" />
              </linearGradient>
            </defs>
            {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
              const y = paddingTop + ratio * chartHeight;
              const valLabel = (maxVal - ratio * valRange).toFixed(1);
              return (
                <g key={i}>
                  <line x1={paddingLeft} y1={y} x2={width - paddingRight} y2={y} stroke="rgba(255,255,255,0.04)" strokeWidth="1" strokeDasharray="3 3" />
                  <text x={paddingLeft - 8} y={y + 3} fill="rgba(255,255,255,0.3)" fontSize="8" fontFamily="monospace" textAnchor="end">{valLabel}</text>
                </g>
              );
            })}

            <path d={areaD} fill="url(#chartGradient)" />
            <path d={pathD} fill="none" stroke={config.primaryColor} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

            {points.map((p, i) => (
              <g key={i} className="group">
                <circle cx={p.x} cy={p.y} r="4.5" fill={config.primaryColor} stroke="#121212" strokeWidth="1.5" />
                <text x={p.x} y={p.y - 9} fill="white" fontSize="8" fontWeight="black" textAnchor="middle" className="opacity-0 group-hover:opacity-100 transition-opacity bg-black">{p.val.toFixed(1)}</text>
                <text x={p.x} y={paddingTop + chartHeight + 12} fill="rgba(255,255,255,0.4)" fontSize="8" textAnchor="middle">{p.date.substring(5).replace('-', '/')}</text>
              </g>
            ))}
          </svg>
        </div>
      </div>
    );
  };

  const getSkinfoldValidationWarning = (site: SkinfoldSite, vals: (number | '')[]) => {
    const numVals = vals.filter(v => v !== '' && v !== null && !isNaN(Number(v))).map(Number);
    if (numVals.length < 2) return null;
    const max = Math.max(...numVals);
    const min = Math.min(...numVals);
    if (max - min > 2) {
      return (
        <span className="text-[10px] text-amber-400 block mt-1">
          Le letture differiscono di oltre 2 mm. Valutare una nuova misurazione.
        </span>
      );
    }
    return null;
  };

  const calculateDynamicPlicheSumAndCount = () => {
    let sum = 0;
    let count = 0;
    (Object.entries(skinfoldValues) as [SkinfoldSite, (number | '')[]][]).forEach(([_, vals]) => {
      const numVals = vals.filter(v => v !== '' && v !== null && !isNaN(Number(v))).map(Number);
      if (numVals.length > 0) {
        const calc = calculateSkinfoldSelectedValue(numVals);
        if (calc.selectedValue !== undefined) {
          sum += calc.selectedValue;
          count++;
        }
      }
    });
    return { sum: Number(sum.toFixed(1)), count };
  };

  const { sum: dynamicPlicheSum, count: dynamicPlicheCount } = calculateDynamicPlicheSumAndCount();

  const currentInput = getCalculationInput();
  const plicheReadingsForValidation = (Object.entries(skinfoldValues) as [SkinfoldSite, (number | '')[]][]).map(([site, readings]) => ({
    site: site as SkinfoldSite,
    readings: readings.filter(r => r !== '').map(Number)
  }));

  const validation = validateBodyCompositionInput(
    currentInput,
    plicheReadingsForValidation,
    {
      time: time || undefined,
      fastingHours: fastingHours !== '' ? Number(fastingHours) : undefined,
      hydrationNotes: hydrationNotes.trim() || undefined,
      lastTrainingHours: lastTrainingHours !== '' ? Number(lastTrainingHours) : undefined,
      operatorName: operatorName.trim() || undefined,
      clothingNotes: clothingNotes.trim() || undefined,
      measurementLocation: measurementLocation.trim() || undefined
    },
    previousNormalized
  );

  const isCalculationInputValid = validation.status !== 'invalid';

  const toggleSection = (sec: keyof typeof collapseSections) => {
    setCollapseSections(prev => ({ ...prev, [sec]: !prev[sec] }));
  };

  const getSourcedLabel = (v: any, path: string) => {
    if (v === undefined || v === null) return '—';
    return v;
  };

  return (
    <div className="space-y-6" ref={containerRef}>
      
      {/* Tab select bar */}
      <div className="flex border-b border-white/5 pb-2 overflow-x-auto gap-2">
        {(['panoramica', 'storico', 'confronta', 'nuova'] as const).map(tab => {
          const isActive = anthropometryView === tab;
          const labels = {
            panoramica: 'Panoramica',
            storico: 'Storico Rilevazioni',
            confronta: 'Confronta',
            nuova: editingMeasurement ? 'Modifica Rilevazione' : 'Nuova Rilevazione'
          };
          return (
            <button
              key={tab}
              onClick={() => {
                if (tab === 'nuova') {
                  handleOpenForm();
                } else {
                  setAnthropometryView(tab);
                  setEditingMeasurement(null);
                }
              }}
              className={`px-4 py-2 text-xs font-black uppercase tracking-wider transition-all rounded-lg shrink-0 cursor-pointer ${
                isActive ? 'text-neutral-950 font-extrabold shadow-md' : 'text-white/40 hover:text-white hover:bg-white/5'
              }`}
              style={{ backgroundColor: isActive ? config.primaryColor : undefined }}
            >
              {labels[tab]}
            </button>
          );
        })}
      </div>

      {/* VIEW: PANORAMICA */}
      {anthropometryView === 'panoramica' && (
        <div className="space-y-6 text-left">
          {latestNormalized ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Left col: Ultima Rilevazione Summary */}
              <div className="lg:col-span-1 space-y-4">
                <div className="bg-[#181818] border border-white/5 rounded-2xl p-5 space-y-4">
                  <div className="flex justify-between items-center border-b border-white/5 pb-3">
                    <div className="flex items-center gap-2">
                      <Ruler className="w-4 h-4 text-white/40" />
                      <h3 className="text-xs font-black uppercase tracking-wider text-white">Ultimi Parametri</h3>
                    </div>
                    <span className="text-[10px] bg-white/5 text-[#CCFF00] font-black uppercase tracking-wider px-2 py-0.5 rounded" style={{ color: config.primaryColor }}>
                      {latestNormalized.data.replace(/(\d{4})-(\d{2})-(\d{2})/, '$3/$2/$1')}
                    </span>
                  </div>

                  <div className="space-y-3.5 text-xs">
                    {[
                      { label: 'Peso', val: `${latestNormalized.peso} kg`, prev: previousNormalized?.peso ? `${previousNormalized.peso} kg` : null, diff: previousNormalized ? latestNormalized.peso - previousNormalized.peso : null, suffix: ' kg' },
                      { label: 'Altezza', val: latestNormalized.altezza ? `${latestNormalized.altezza} cm` : '—', prev: null, diff: null },
                      { label: 'Vita', val: `${latestNormalized.circonferenze.vita} cm`, prev: previousNormalized ? `${previousNormalized.circonferenze.vita} cm` : null, diff: previousNormalized ? latestNormalized.circonferenze.vita - previousNormalized.circonferenze.vita : null, suffix: ' cm' },
                      { label: 'Torace', val: `${latestNormalized.circonferenze.torace} cm`, prev: previousNormalized ? `${previousNormalized.circonferenze.torace} cm` : null, diff: previousNormalized ? latestNormalized.circonferenze.torace - previousNormalized.circonferenze.torace : null, suffix: ' cm' },
                      { label: 'Fianchi', val: latestNormalized.circonferenze.fianchi ? `${latestNormalized.circonferenze.fianchi} cm` : '—', prev: previousNormalized?.circonferenze?.fianchi ? `${previousNormalized.circonferenze.fianchi} cm` : null, diff: previousNormalized?.circonferenze?.fianchi ? latestNormalized.circonferenze.fianchi - previousNormalized.circonferenze.fianchi : null, suffix: ' cm' },
                      { label: 'Grasso Corporeo %', val: latestNormalized.composizioneCorporea.bodyFatPercent !== undefined ? `${latestNormalized.composizioneCorporea.bodyFatPercent}%` : '—', prev: previousNormalized?.composizioneCorporea?.bodyFatPercent !== undefined ? `${previousNormalized.composizioneCorporea.bodyFatPercent}%` : null, diff: previousNormalized?.composizioneCorporea?.bodyFatPercent !== undefined ? latestNormalized.composizioneCorporea.bodyFatPercent - previousNormalized.composizioneCorporea.bodyFatPercent : null, suffix: '%' },
                      { label: 'Massa Grassa (kg)', val: latestNormalized.composizioneCorporea.fatMassKg !== undefined ? `${latestNormalized.composizioneCorporea.fatMassKg} kg` : '—', prev: previousNormalized?.composizioneCorporea?.fatMassKg !== undefined ? `${previousNormalized.composizioneCorporea.fatMassKg} kg` : null, diff: previousNormalized?.composizioneCorporea?.fatMassKg !== undefined ? latestNormalized.composizioneCorporea.fatMassKg - previousNormalized.composizioneCorporea.fatMassKg : null, suffix: ' kg' },
                      { label: 'Massa Magra (kg)', val: latestNormalized.composizioneCorporea.leanMassKg !== undefined ? `${latestNormalized.composizioneCorporea.leanMassKg} kg` : '—', prev: previousNormalized?.composizioneCorporea?.leanMassKg !== undefined ? `${previousNormalized.composizioneCorporea.leanMassKg} kg` : null, diff: previousNormalized?.composizioneCorporea?.leanMassKg !== undefined ? latestNormalized.composizioneCorporea.leanMassKg - previousNormalized.composizioneCorporea.leanMassKg : null, suffix: ' kg' },
                      { label: 'Somma Pliche', val: latestNormalized.plicheSum !== undefined ? `${latestNormalized.plicheSum} mm` : '—', prev: previousNormalized?.plicheSum !== undefined ? `${previousNormalized.plicheSum} mm` : null, diff: previousNormalized?.plicheSum !== undefined ? latestNormalized.plicheSum - previousNormalized.plicheSum : null, suffix: ' mm' }
                    ].map((row, i) => {
                      let changeEl = null;
                      if (row.diff !== null && row.diff !== undefined) {
                        const isNeg = row.diff < -0.01;
                        const isZero = Math.abs(row.diff) <= 0.01;
                        changeEl = (
                          <span className={`text-[10px] font-bold ${isZero ? 'text-white/30' : isNeg ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {isZero ? '—' : row.diff > 0 ? `+${row.diff.toFixed(1)}${row.suffix}` : `${row.diff.toFixed(1)}${row.suffix}`}
                          </span>
                        );
                      }

                      return (
                        <div key={i} className="flex justify-between items-center border-b border-white/5 pb-2">
                          <span className="text-white/50 font-bold">{row.label}:</span>
                          <div className="flex items-center gap-2">
                            <span className="text-white font-black">{row.val}</span>
                            {changeEl}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="bg-black/20 p-3 rounded-xl border border-white/5 space-y-2 text-[10px] font-medium text-white/50">
                    <p><span className="text-white/30 block uppercase tracking-wider text-[8px]">Metodo Stima</span> {latestNormalized.composizioneCorporea.method.toUpperCase()}</p>
                    <p><span className="text-white/30 block uppercase tracking-wider text-[8px]">Contesto Rilevazione</span> {latestNormalized.context?.toUpperCase() ?? 'N/D'}</p>
                  </div>
                </div>
              </div>

              {/* Right column: Charts */}
              <div className="lg:col-span-2 space-y-4">
                {renderChart()}
              </div>

            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-12 text-center bg-[#181818] border border-dashed border-white/5 rounded-2xl">
              <Scale className="w-12 h-12 text-white/10 mb-3" />
              <h3 className="text-sm font-black uppercase tracking-wider text-white">Nessuna misurazione registrata</h3>
              <p className="text-xs text-white/30 max-w-sm mt-1 mb-4 leading-relaxed">
                Registra la prima rilevazione antropometrica del cliente per iniziare a tracciare i grafici di progresso storico e le circonferenze bilaterali.
              </p>
              <button
                onClick={() => handleOpenForm()}
                className="px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider text-neutral-950 transition-all cursor-pointer shadow-md"
                style={{ backgroundColor: config.primaryColor }}
              >
                Crea prima rilevazione
              </button>
            </div>
          )}
        </div>
      )}

      {/* VIEW: STORICO */}
      {anthropometryView === 'storico' && (
        <div className="space-y-4 text-left">
          {sortedRilevazioni.length === 0 ? (
            <div className="p-8 text-center text-xs text-white/30 italic">
              Nessuna rilevazione salvata.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {[...sortedRilevazioni].reverse().map(r => {
                const norm = getNormalizedMeasurement(r);
                const isSelected = detailedMeasurement?.id === r.id;
                
                return (
                  <div 
                    key={r.id} 
                    className={`bg-[#181818] border rounded-2xl p-4 transition-all space-y-4 ${
                      isSelected ? 'border-transparent ring-2' : 'border-white/5 hover:border-white/10'
                    }`}
                    style={{ ringColor: isSelected ? config.primaryColor : undefined }}
                  >
                    <div className="flex flex-wrap justify-between items-center gap-2">
                      <div className="flex items-center gap-3">
                        <Calendar className="w-4 h-4 text-white/40" />
                        <span className="font-extrabold text-white text-xs sm:text-sm">
                          Rilevazione del {norm.data.replace(/(\d{4})-(\d{2})-(\d{2})/, '$3/$2/$1')}
                        </span>
                        <span className={`text-[8px] px-2 py-0.5 rounded font-black uppercase tracking-wider ${
                          norm.context === 'presenza' ? 'bg-[#CCFF00]/10 text-[#CCFF00]' : norm.context === 'online' ? 'bg-blue-500/10 text-blue-400' : 'bg-neutral-800 text-white/40'
                        }`} style={{ color: norm.context === 'presenza' ? config.primaryColor : undefined, backgroundColor: norm.context === 'presenza' ? `${config.primaryColor}10` : undefined }}>
                          {norm.context ?? 'presenza'}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setDetailedMeasurement(isSelected ? null : norm)}
                          className="p-1.5 rounded-lg bg-black/40 border border-white/5 text-white/50 hover:text-white transition-all cursor-pointer"
                          title="Apri Dettaglio"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleOpenForm(r, false)}
                          className="p-1.5 rounded-lg bg-black/40 border border-white/5 text-white/50 hover:text-white transition-all cursor-pointer"
                          title="Modifica"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleOpenForm(r, true)}
                          className="p-1.5 rounded-lg bg-black/40 border border-white/5 text-white/50 hover:text-white transition-all cursor-pointer"
                          title="Duplica come Nuova"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteMeasurement(r.id)}
                          className="p-1.5 rounded-lg bg-black/40 border border-white/5 text-white/20 hover:text-red-400 transition-all cursor-pointer"
                          title="Elimina"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Quick values preview */}
                    <div className="grid grid-cols-2 sm:grid-cols-6 gap-3 text-xs bg-black/20 p-3 rounded-xl border border-white/5">
                      <div>
                        <span className="text-[9px] text-white/35 uppercase tracking-wider block">Peso</span>
                        <span className="text-white font-extrabold mt-0.5 block">{norm.peso} kg</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-white/35 uppercase tracking-wider block">Vita</span>
                        <span className="text-white font-extrabold mt-0.5 block">{norm.circonferenze.vita} cm</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-white/35 uppercase tracking-wider block">Torace</span>
                        <span className="text-white font-extrabold mt-0.5 block">{norm.circonferenze.torace} cm</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-white/35 uppercase tracking-wider block">Grasso Corporeo</span>
                        <span className="text-white font-extrabold mt-0.5 block">{norm.composizioneCorporea.bodyFatPercent !== undefined ? `${norm.composizioneCorporea.bodyFatPercent}%` : '—'}</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-white/35 uppercase tracking-wider block">Massa Magra</span>
                        <span className="text-white font-extrabold mt-0.5 block">{norm.composizioneCorporea.leanMassKg !== undefined ? `${norm.composizioneCorporea.leanMassKg} kg` : '—'}</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-white/35 uppercase tracking-wider block">Pliche Totali</span>
                        <span className="text-white font-extrabold mt-0.5 block">{norm.plicheSum !== undefined ? `${norm.plicheSum} mm (${norm.plicheCount} siti)` : '—'}</span>
                      </div>
                    </div>

                    {/* Collapsible Details */}
                    {isSelected && (
                      <div className="border-t border-white/5 pt-4 space-y-5 animate-fade-in text-xs">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                          
                          {/* Circumferences Detailed */}
                          <div className="space-y-2">
                            <h4 className="font-extrabold text-[#CCFF00] uppercase tracking-wider text-[10px]" style={{ color: config.primaryColor }}>Circonferenze</h4>
                            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-white/70">
                              <p>Collo: <span className="text-white font-bold">{getSourcedLabel(norm.circonferenze.collo, '')} cm</span></p>
                              <p>Spalle: <span className="text-white font-bold">{getSourcedLabel(norm.circonferenze.spalle, '')} cm</span></p>
                              <p>Torace: <span className="text-white font-bold">{norm.circonferenze.torace} cm</span></p>
                              <p>Vita: <span className="text-white font-bold">{norm.circonferenze.vita} cm</span></p>
                              <p>Addome: <span className="text-white font-bold">{getSourcedLabel(norm.circonferenze.addome, '')} cm</span></p>
                              <p>Fianchi: <span className="text-white font-bold">{getSourcedLabel(norm.circonferenze.fianchi, '')} cm</span></p>
                              <p>Braccio Dx Flesso: <span className="text-white font-bold">{getSourcedLabel(norm.circonferenze.braccioDestroFlesso, '')} cm</span></p>
                              <p>Braccio Sx Flesso: <span className="text-white font-bold">{getSourcedLabel(norm.circonferenze.braccioSinistroFlesso, '')} cm</span></p>
                              <p>Coscia Dx Mediale: <span className="text-white font-bold">{getSourcedLabel(norm.circonferenze.cosciaDestraMediale, '')} cm</span></p>
                              <p>Coscia Sx Mediale: <span className="text-white font-bold">{getSourcedLabel(norm.circonferenze.cosciaSinistraMediale, '')} cm</span></p>
                            </div>
                          </div>

                          {/* Bilateral Asymmetry checks */}
                          <div className="space-y-2 bg-black/10 p-3 rounded-xl border border-white/5">
                            <h4 className="font-extrabold text-white uppercase tracking-wider text-[10px]">Analisi Asimmetria Bilaterale</h4>
                            <div className="overflow-x-auto">
                              <table className="w-full text-left">
                                <thead>
                                  <tr className="border-b border-white/5 text-[9px] uppercase tracking-wider text-white/40">
                                    <th className="pb-1">Segmento</th>
                                    <th className="pb-1 text-center">Sx</th>
                                    <th className="pb-1 text-center">Dx</th>
                                    <th className="pb-1 text-center">Diff</th>
                                    <th className="pb-1 text-center">Deviazione %</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                  {renderAsymmetryRow('Braccia Rilassate', norm.circonferenze.braccioSinistroRilassato, norm.circonferenze.braccioDestroRilassato)}
                                  {renderAsymmetryRow('Braccia Flesse', norm.circonferenze.braccioSinistroFlesso, norm.circonferenze.braccioDestroFlesso)}
                                  {renderAsymmetryRow('Avambracci', norm.circonferenze.avambraccioSinistro, norm.circonferenze.avambraccioDestro)}
                                  {renderAsymmetryRow('Cosce Prossimali', norm.circonferenze.cosciaSinistraProssimale, norm.circonferenze.cosciaDestraProssimale)}
                                  {renderAsymmetryRow('Cosce Mediali', norm.circonferenze.cosciaSinistraMediale, norm.circonferenze.cosciaDestraMediale)}
                                  {renderAsymmetryRow('Polpacci', norm.circonferenze.polpaccioSinistro, norm.circonferenze.polpaccioDestro)}
                                </tbody>
                              </table>
                            </div>
                          </div>

                          {/* Skinfolds & caliper notes */}
                          {norm.pliche.readings.length > 0 && (
                            <div className="md:col-span-2 space-y-2">
                              <h4 className="font-extrabold text-[#CCFF00] uppercase tracking-wider text-[10px]" style={{ color: config.primaryColor }}>Rapporto Plicometria</h4>
                              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                                {norm.pliche.readings.map((siteReading: SkinfoldReading, sIdx: number) => (
                                  <div key={sIdx} className="bg-black/15 p-2 rounded border border-white/5">
                                    <span className="block text-[9px] text-white/35 uppercase tracking-wider font-bold truncate">{siteReading.site}</span>
                                    <span className="block text-white font-extrabold text-sm mt-0.5">{siteReading.selectedValue} mm</span>
                                    <span className="block text-[8px] text-white/20 mt-0.5">Let.: {siteReading.readings.join(', ')}</span>
                                  </div>
                                ))}
                              </div>
                              <p className="text-[10px] text-white/35 italic">Protocollo: {norm.pliche.protocolName} • Plicometro: {norm.pliche.caliperName || 'Standard'}</p>
                            </div>
                          )}

                          {norm.composizioneCorporea?.savedCalculation && (
                            <div className="md:col-span-2 p-3 bg-black/15 border border-white/5 rounded-xl space-y-2">
                              <h4 className="font-extrabold text-[#CCFF00] uppercase tracking-wider text-[10px]" style={{ color: config.primaryColor }}>
                                Formula Plicometria Applicata
                              </h4>
                              <p className="text-[11px] text-white/80">
                                Calcolo effettuato tramite la formula <strong className="text-white">{norm.composizioneCorporea.savedCalculation.formulaLabel}</strong> ({norm.composizioneCorporea.savedCalculation.formulaVersion}) e conversione <strong className="text-white">{norm.composizioneCorporea.savedCalculation.conversionLabel}</strong>.
                              </p>
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px] bg-black/25 p-2 rounded">
                                <p className="text-white/50">Densità Corporea: <span className="text-white font-mono font-bold">{norm.composizioneCorporea.savedCalculation.bodyDensity?.toFixed(5)}</span></p>
                                <p className="text-white/50">Massa Grassa: <span className="text-white font-bold">{norm.composizioneCorporea.savedCalculation.bodyFatPercent?.toFixed(2)}%</span></p>
                                <p className="text-white/50">Massa Grassa (kg): <span className="text-white font-bold">{norm.composizioneCorporea.savedCalculation.fatMassKg?.toFixed(2)} kg</span></p>
                                <p className="text-white/50">Massa Magra (kg): <span className="text-white font-bold">{norm.composizioneCorporea.savedCalculation.leanMassKg?.toFixed(2)} kg</span></p>
                              </div>
                            </div>
                          )}

                          {/* Conditions & notes */}
                          {(norm.condizioni.operatorName || norm.noteControllo) && (
                            <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-white/5 pt-3">
                              {norm.condizioni.operatorName && (
                                <p className="text-[11px] text-white/50">
                                  <span className="text-white/30 block uppercase tracking-wider text-[8px]">Operatore & Luogo</span>
                                  Eseguito da {norm.condizioni.operatorName} presso {norm.condizioni.measurementLocation || 'PT Studio'}
                                </p>
                              )}
                              {norm.noteControllo && (
                                <p className="text-[11px] text-white/50">
                                  <span className="text-white/30 block uppercase tracking-wider text-[8px]">Note Controllo</span>
                                  "{norm.noteControllo}"
                                </p>
                              )}
                            </div>
                          )}

                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* VIEW: CONFRONTA */}
      {anthropometryView === 'confronta' && (
        <div className="space-y-6 text-left">
          {sortedRilevazioni.length < 2 ? (
            <div className="p-8 text-center text-xs text-white/30 italic">
              Registra almeno 2 rilevazioni per poterle confrontare.
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-[#181818] p-4 border border-white/5 rounded-2xl">
                <div className="space-y-1">
                  <label className="block text-[10px] font-black uppercase tracking-wider text-white/40">Rilevazione Iniziale</label>
                  <select
                    value={compareStartId}
                    onChange={(e) => setCompareStartId(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-black/40 border border-white/5 text-white focus:outline-none"
                  >
                    {sortedRilevazioni.map(r => (
                      <option key={r.id} value={r.id} disabled={r.id === compareEndId}>
                        {r.data.replace(/(\d{4})-(\d{2})-(\d{2})/, '$3/$2/$1')} - {r.peso} kg
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-black uppercase tracking-wider text-white/40">Rilevazione Finale</label>
                  <select
                    value={compareEndId}
                    onChange={(e) => setCompareEndId(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-black/40 border border-white/5 text-white focus:outline-none"
                  >
                    {sortedRilevazioni.map(r => (
                      <option key={r.id} value={r.id} disabled={r.id === compareStartId}>
                        {r.data.replace(/(\d{4})-(\d{2})-(\d{2})/, '$3/$2/$1')} - {r.peso} kg
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {compareInitial && compareFinal && (
                <div className="space-y-3">
                  <div className="grid grid-cols-5 gap-2 px-3 pb-1 border-b border-white/5 text-[9px] uppercase tracking-wider text-white/40 font-bold">
                    <span className="col-span-2 text-left">Parametro</span>
                    <span className="text-center">Inizio</span>
                    <span className="text-center">Fine</span>
                    <span className="text-right">Differenza</span>
                  </div>

                  {(() => {
                    const iniNorm = getNormalizedMeasurement(compareInitial);
                    const finNorm = getNormalizedMeasurement(compareFinal);

                    return (
                      <div className="space-y-2.5">
                        {renderCompareRow('Peso Corporeo', iniNorm.peso, finNorm.peso, 'kg')}
                        {renderCompareRow('Torace', iniNorm.circonferenze.torace, finNorm.circonferenze.torace)}
                        {renderCompareRow('Vita', iniNorm.circonferenze.vita, finNorm.circonferenze.vita)}
                        {renderCompareRow('Fianchi', iniNorm.circonferenze.fianchi, finNorm.circonferenze.fianchi)}
                        {renderCompareRow('Braccio Dx Flesso', iniNorm.circonferenze.braccioDestroFlesso, finNorm.circonferenze.braccioDestroFlesso)}
                        {renderCompareRow('Braccio Sx Flesso', iniNorm.circonferenze.braccioSinistroFlesso, finNorm.circonferenze.braccioSinistroFlesso)}
                        {renderCompareRow('Coscia Dx Mediale', iniNorm.circonferenze.cosciaDestraMediale, finNorm.circonferenze.cosciaDestraMediale)}
                        {renderCompareRow('Coscia Sx Mediale', iniNorm.circonferenze.cosciaSinistraMediale, finNorm.circonferenze.cosciaSinistraMediale)}
                        {renderCompareRow('Grasso Corporeo %', iniNorm.composizioneCorporea.bodyFatPercent, finNorm.composizioneCorporea.bodyFatPercent, '%')}
                        {renderCompareRow('Massa Grassa (kg)', iniNorm.composizioneCorporea.fatMassKg, finNorm.composizioneCorporea.fatMassKg, 'kg')}
                        {renderCompareRow('Massa Magra (kg)', iniNorm.composizioneCorporea.leanMassKg, finNorm.composizioneCorporea.leanMassKg, 'kg')}
                        {renderCompareRow('Somma Pliche', iniNorm.plicheSum, finNorm.plicheSum, 'mm')}
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* VIEW: NUOVA / FORM */}
      {anthropometryView === 'nuova' && (
        <form onSubmit={handleSaveMeasurement} className="space-y-5 text-left bg-[#121212] border border-white/5 p-5 rounded-2xl">
          <div className="flex flex-wrap justify-between items-center gap-3 pb-3 border-b border-white/5">
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider text-white">
                {editingMeasurement ? 'Modifica Rilevazione Atleta' : 'Nuova Rilevazione Atleta'}
              </h3>
              <p className="text-[10px] text-white/40 mt-0.5">Compila i dati biometrici. Solo Peso è obbligatorio.</p>
            </div>
            
            {!editingMeasurement && latestNormalized && (
              <button
                type="button"
                onClick={handleCopyFromLast}
                className="flex items-center gap-1.5 px-3 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg text-xs font-bold transition-all cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
                Copia valori da ultima rilevazione
              </button>
            )}
          </div>

          {/* Collapsible Section 1: Informazioni Generali */}
          <div className="border border-white/5 rounded-xl overflow-hidden">
            <button
              type="button"
              onClick={() => toggleSection('generali')}
              className="w-full flex justify-between items-center bg-black/20 p-3.5 text-xs font-black uppercase tracking-wider text-white border-b border-white/5 cursor-pointer"
            >
              <span>Informazioni Generali</span>
              <span className="text-white/40">{collapseSections.generali ? 'Nascondi' : 'Mostra'}</span>
            </button>

            {collapseSections.generali && (
              <div className="p-4 space-y-4 bg-black/5">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="block text-[10px] font-black uppercase tracking-wider text-white/40">Data Controllo *</label>
                    <input
                      type="date"
                      required
                      value={data}
                      onChange={(e) => setData(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl bg-black/40 border border-white/5 text-white focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[10px] font-black uppercase tracking-wider text-white/40">Contesto</label>
                    <select
                      value={context}
                      onChange={(e) => setContext(e.target.value as MeasurementContext)}
                      className="w-full px-3 py-2 text-xs rounded-xl bg-black/40 border border-white/5 text-white focus:outline-none"
                    >
                      <option value="presenza">Presenza</option>
                      <option value="online">Online</option>
                      <option value="autonoma">Autonoma</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[10px] font-black uppercase tracking-wider text-white/40">Peso Corporeo (kg) *</label>
                    <input
                      type="number"
                      step="0.05"
                      required
                      placeholder="es. 82.3"
                      value={peso}
                      onChange={(e) => setPeso(e.target.value === '' ? '' : Number(e.target.value))}
                      className={`w-full px-3 py-2 text-xs rounded-xl bg-black/40 border text-white focus:outline-none ${errors.peso ? 'border-red-500' : 'border-white/5'}`}
                    />
                    {errors.peso && <span className="text-[10px] text-red-400 font-medium block mt-1">{errors.peso}</span>}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="block text-[10px] font-black uppercase tracking-wider text-white/40">Altezza (cm)</label>
                    <input
                      type="number"
                      step="0.5"
                      placeholder="es. 178"
                      value={altezza}
                      onChange={(e) => setAltezza(e.target.value === '' ? '' : Number(e.target.value))}
                      className={`w-full px-3 py-2 text-xs rounded-xl bg-black/40 border text-white focus:outline-none ${errors.altezza ? 'border-red-500' : 'border-white/5'}`}
                    />
                    {errors.altezza && <span className="text-[10px] text-red-400 font-medium block mt-1">{errors.altezza}</span>}
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[10px] font-black uppercase tracking-wider text-white/40">Note Generali</label>
                    <input
                      type="text"
                      placeholder="es. Controllo post workout, ottima costanza"
                      value={noteControllo}
                      onChange={(e) => setNoteControllo(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl bg-black/40 border border-white/5 text-white focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Collapsible Section 2: Circonferenze */}
          <div className="border border-white/5 rounded-xl overflow-hidden">
            <button
              type="button"
              onClick={() => toggleSection('circonferenze')}
              className="w-full flex justify-between items-center bg-black/20 p-3.5 text-xs font-black uppercase tracking-wider text-white border-b border-white/5 cursor-pointer"
            >
              <span>Circonferenze Corporee (cm)</span>
              <span className="text-white/40">{collapseSections.circonferenze ? 'Nascondi' : 'Mostra'}</span>
            </button>

            {collapseSections.circonferenze && (
              <div className="p-4 bg-black/5 space-y-5">
                {/* Tronco */}
                <div className="space-y-2">
                  <h4 className="text-[10px] font-black uppercase text-white/35 tracking-wider">Tronco</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
                    {[
                      { key: 'collo', label: 'Collo', val: collo, setter: setCollo },
                      { key: 'spalle', label: 'Spalle', val: spalle, setter: setSpalle },
                      { key: 'torace', label: 'Torace', val: torace, setter: setTorace },
                      { key: 'vita', label: 'Vita', val: vita, setter: setVita },
                      { key: 'addome', label: 'Addome', val: addome, setter: setAddome },
                      { key: 'fianchi', label: 'Fianchi', val: fianchi, setter: setFianchi }
                    ].map(field => (
                      <div key={field.key} className="space-y-1">
                        <label className="block text-[9px] text-white/55 font-bold">{field.label}</label>
                        <input
                          type="number"
                          step="0.1"
                          placeholder="—"
                          value={field.val}
                          onChange={(e) => field.setter(e.target.value === '' ? '' : Number(e.target.value))}
                          className={`w-full px-2 py-1.5 text-xs rounded-lg bg-black/40 border text-white focus:outline-none ${errors[field.key] ? 'border-red-500' : 'border-white/5'}`}
                        />
                        {errors[field.key] && <span className="text-[8px] text-red-400 font-medium block mt-0.5">{errors[field.key]}</span>}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Arti Superiori */}
                <div className="space-y-2">
                  <h4 className="text-[10px] font-black uppercase text-white/35 tracking-wider">Arti Superiori</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
                    {[
                      { key: 'braccioDestroRilassato', label: 'Braccio Dx Ril.', val: braccioDestroRilassato, setter: setBraccioDestroRilassato },
                      { key: 'braccioSinistroRilassato', label: 'Braccio Sx Ril.', val: braccioSinistroRilassato, setter: setBraccioSinistroRilassato },
                      { key: 'braccioDestroFlesso', label: 'Braccio Dx Flesso', val: braccioDestroFlesso, setter: setBraccioDestroFlesso },
                      { key: 'braccioSinistroFlesso', label: 'Braccio Sx Flesso', val: braccioSinistroFlesso, setter: setBraccioSinistroFlesso },
                      { key: 'avambraccioDestro', label: 'Avambraccio Dx', val: avambraccioDestro, setter: setAvambraccioDestro },
                      { key: 'avambraccioSinistro', label: 'Avambraccio Sx', val: avambraccioSinistro, setter: setAvambraccioSinistro }
                    ].map(field => (
                      <div key={field.key} className="space-y-1">
                        <label className="block text-[9px] text-white/55 font-bold">{field.label}</label>
                        <input
                          type="number"
                          step="0.1"
                          placeholder="—"
                          value={field.val}
                          onChange={(e) => field.setter(e.target.value === '' ? '' : Number(e.target.value))}
                          className={`w-full px-2 py-1.5 text-xs rounded-lg bg-black/40 border text-white focus:outline-none ${errors[field.key] ? 'border-red-500' : 'border-white/5'}`}
                        />
                        {errors[field.key] && <span className="text-[8px] text-red-400 font-medium block mt-0.5">{errors[field.key]}</span>}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Arti Inferiori */}
                <div className="space-y-2">
                  <h4 className="text-[10px] font-black uppercase text-white/35 tracking-wider">Arti Inferiori</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
                    {[
                      { key: 'cosciaDestraProssimale', label: 'Coscia Dx Pross.', val: cosciaDestraProssimale, setter: setCosciaDestraProssimale },
                      { key: 'cosciaSinistraProssimale', label: 'Coscia Sx Pross.', val: cosciaSinistraProssimale, setter: setCosciaSinistraProssimale },
                      { key: 'cosciaDestraMediale', label: 'Coscia Dx Med.', val: cosciaDestraMediale, setter: setCosciaDestraMediale },
                      { key: 'cosciaSinistraMediale', label: 'Coscia Sx Med.', val: cosciaSinistraMediale, setter: setCosciaSinistraMediale },
                      { key: 'polpaccioDestro', label: 'Polpaccio Dx', val: polpaccioDestro, setter: setPolpaccioDestro },
                      { key: 'polpaccioSinistro', label: 'Polpaccio Sx', val: polpaccioSinistro, setter: setPolpaccioSinistro }
                    ].map(field => (
                      <div key={field.key} className="space-y-1">
                        <label className="block text-[9px] text-white/55 font-bold">{field.label}</label>
                        <input
                          type="number"
                          step="0.1"
                          placeholder="—"
                          value={field.val}
                          onChange={(e) => field.setter(e.target.value === '' ? '' : Number(e.target.value))}
                          className={`w-full px-2 py-1.5 text-xs rounded-lg bg-black/40 border text-white focus:outline-none ${errors[field.key] ? 'border-red-500' : 'border-white/5'}`}
                        />
                        {errors[field.key] && <span className="text-[8px] text-red-400 font-medium block mt-0.5">{errors[field.key]}</span>}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Collapsible Section 3: Plicometria */}
          <div className="border border-white/5 rounded-xl overflow-hidden">
            <button
              type="button"
              onClick={() => toggleSection('plicometria')}
              className="w-full flex justify-between items-center bg-black/20 p-3.5 text-xs font-black uppercase tracking-wider text-white border-b border-white/5 cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <span>Plicometria Manuale</span>
                {dynamicPlicheCount > 0 && (
                  <span className="text-[10px] bg-[#CCFF00]/10 text-[#CCFF00] font-black px-2 py-0.5 rounded" style={{ color: config.primaryColor, backgroundColor: `${config.primaryColor}10` }}>
                    {dynamicPlicheSum} mm ({dynamicPlicheCount} siti)
                  </span>
                )}
              </div>
              <span className="text-white/40">{collapseSections.plicometria ? 'Nascondi' : 'Mostra'}</span>
            </button>

            {collapseSections.plicometria && (
              <div className="p-4 bg-black/5 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pb-3 border-b border-white/5">
                  <div className="space-y-1">
                    <label className="block text-[10px] font-black uppercase tracking-wider text-white/40">Protocollo Plicometria</label>
                    <select
                      value={protocolName}
                      onChange={(e) => setProtocolName(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl bg-black/40 border border-white/5 text-white focus:outline-none"
                    >
                      <option value="Personalizzato">Personalizzato</option>
                      <option value="Jackson-Pollock 3 siti">Jackson-Pollock 3 siti</option>
                      <option value="Jackson-Pollock 7 siti">Jackson-Pollock 7 siti</option>
                      <option value="Durnin-Womersley">Durnin-Womersley</option>
                      <option value="Altro">Altro</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[10px] font-black uppercase tracking-wider text-white/40">Nome / Modello Calibro</label>
                    <input
                      type="text"
                      placeholder="es. Harpendem, Gima"
                      value={caliperName}
                      onChange={(e) => setCaliperName(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl bg-black/40 border border-white/5 text-white focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[10px] font-black uppercase tracking-wider text-white/40">Note Plicometria</label>
                    <input
                      type="text"
                      placeholder="Dettagli sulle rilevazioni..."
                      value={skinfoldNotes}
                      onChange={(e) => setSkinfoldNotes(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl bg-black/40 border border-white/5 text-white focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {SKIN_FOLD_SITES.map(({ site, label }) => {
                    const vals = skinfoldValues[site];
                    const calc = calculateSkinfoldSelectedValue(vals);
                    const warn = getSkinfoldValidationWarning(site, vals);

                    return (
                      <div key={site} className="p-3 bg-black/20 border border-white/5 rounded-xl space-y-2">
                        <div className="flex justify-between items-center border-b border-white/5 pb-1.5">
                          <span className="text-xs font-extrabold text-white">{label}</span>
                          {calc.selectedValue !== undefined && (
                            <span className="text-xs font-black text-[#CCFF00]" style={{ color: config.primaryColor }}>
                              {calc.selectedValue} mm
                            </span>
                          )}
                        </div>

                        <div className="grid grid-cols-3 gap-2">
                          {[0, 1, 2].map(idx => (
                            <div key={idx} className="space-y-1">
                              <span className="block text-[8px] text-white/45 font-semibold uppercase tracking-wider">Let. {idx + 1} (mm)</span>
                              <input
                                type="number"
                                step="0.1"
                                placeholder="0.0"
                                value={vals[idx] === undefined ? '' : vals[idx]}
                                onChange={(e) => {
                                  const updated = { ...skinfoldValues };
                                  updated[site][idx] = e.target.value === '' ? '' : Number(e.target.value) as any;
                                  setSkinfoldValues(updated);
                                }}
                                className={`w-full px-2 py-1 text-xs rounded bg-black/40 border text-white focus:outline-none ${
                                  errors[`pliche_${site}_${idx}`] ? 'border-red-500' : 'border-white/5'
                                }`}
                              />
                            </div>
                          ))}
                        </div>
                        {warn}
                      </div>
                    );
                  })}
                </div>

                <p className="text-[10px] text-white/35 font-medium italic">
                  * La somma delle pliche viene utilizzata per confrontare rilevazioni effettuate con gli stessi siti e lo stesso protocollo.
                </p>
              </div>
            )}
          </div>

          {/* Collapsible Section 4: Composizione Corporea */}
          <div className="border border-white/5 rounded-xl overflow-hidden">
            <button
              type="button"
              onClick={() => toggleSection('composizione')}
              className="w-full flex justify-between items-center bg-black/20 p-3.5 text-xs font-black uppercase tracking-wider text-white border-b border-white/5 cursor-pointer"
            >
              <span>Composizione Corporea & Stima Massa Grassa</span>
              <span className="text-white/40">{collapseSections.composizione ? 'Nascondi' : 'Mostra'}</span>
            </button>

            {collapseSections.composizione && (
              <div className="p-4 bg-black/5 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-1">
                    <label htmlFor="select-method" className="block text-[10px] font-black uppercase tracking-wider text-white/40">Metodo Rilevazione</label>
                    <select
                      id="select-method"
                      value={method}
                      onChange={(e) => {
                        const newMethod = e.target.value as BodyCompositionMethod;
                        setMethod(newMethod);
                        if (newMethod !== 'plicometria') {
                          setCalculationMode('manuale');
                        }
                      }}
                      className="w-full px-3 py-2 text-xs rounded-xl bg-black/40 border border-white/5 text-white focus:outline-none focus-visible:ring-1 focus-visible:ring-lime-400"
                    >
                      <option value="manuale">Manuale</option>
                      <option value="plicometria">Plicometria</option>
                      <option value="bioimpedenza">Bioimpedenza</option>
                      <option value="dexa">DEXA</option>
                      <option value="altro">Altro</option>
                    </select>
                  </div>

                  {method === 'plicometria' && (
                    <div className="space-y-1">
                      <label htmlFor="select-calc-mode" className="block text-[10px] font-black uppercase tracking-wider text-white/40">Modalità Inserimento</label>
                      <select
                        id="select-calc-mode"
                        value={calculationMode}
                        onChange={(e) => setCalculationMode(e.target.value as 'manuale' | 'formula')}
                        className="w-full px-3 py-2 text-xs rounded-xl bg-black/40 border border-white/5 text-white focus:outline-none focus-visible:ring-1 focus-visible:ring-lime-400"
                      >
                        <option value="manuale">Manuale</option>
                        <option value="formula">Formula Plicom.</option>
                      </select>
                    </div>
                  )}

                  <div className="space-y-1">
                    <label htmlFor="input-body-fat" className="block text-[10px] font-black uppercase tracking-wider text-white/40">Massa Grassa (%)</label>
                    <input
                      id="input-body-fat"
                      type="number"
                      step="0.1"
                      placeholder={calculationMode === 'formula' ? 'Calcolato da Formula' : 'es. 14.2'}
                      value={bodyFatPercent}
                      readOnly={calculationMode === 'formula'}
                      onChange={(e) => setBodyFatPercent(e.target.value === '' ? '' : Number(e.target.value))}
                      className={`w-full px-3 py-2 text-xs rounded-xl bg-black/40 border text-white focus:outline-none focus-visible:ring-1 focus-visible:ring-lime-400 ${
                        errors.bodyFatPercent ? 'border-red-500' : 'border-white/5'
                      } ${calculationMode === 'formula' ? 'opacity-70 bg-white/5 cursor-not-allowed font-bold text-lime-400' : ''}`}
                    />
                    {errors.bodyFatPercent && <span className="text-[10px] text-red-400 font-medium block mt-1">{errors.bodyFatPercent}</span>}
                  </div>

                  <div className="space-y-1">
                    <label htmlFor="input-muscle-mass" className="block text-[10px] font-black uppercase tracking-wider text-white/40">Massa Muscolare Scheletrica (kg)</label>
                    <input
                      id="input-muscle-mass"
                      type="number"
                      step="0.1"
                      placeholder="es. 38.5"
                      value={skeletalMuscleMassKg}
                      onChange={(e) => setSkeletalMuscleMassKg(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full px-3 py-2 text-xs rounded-xl bg-black/40 border border-white/5 text-white focus:outline-none focus-visible:ring-1 focus-visible:ring-lime-400"
                    />
                  </div>
                </div>

                {/* GUIDED PLICOMETRIA FORMULAS PANEL */}
                {method === 'plicometria' && calculationMode === 'formula' && (
                  <div className="border border-white/5 bg-black/20 p-4 rounded-xl space-y-4">
                    <div className="flex items-center justify-between border-b border-white/5 pb-2">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-lime-400" style={{ color: config.primaryColor }} />
                        <h4 className="text-xs font-black uppercase tracking-wider text-white">Calcolo Guidato da Plicometria</h4>
                      </div>
                      {savedCalculation && (
                        <span className="text-[10px] bg-emerald-400/10 text-emerald-400 px-2 py-0.5 rounded font-bold">
                          Formula Attiva
                        </span>
                      )}
                    </div>

                    {/* Outdated calculation warning */}
                    {calculationOutdated && (
                      <div className="flex items-start gap-2 p-3 bg-amber-400/10 border border-amber-400/20 text-amber-300 rounded-lg text-xs leading-relaxed" aria-live="assertive">
                        <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-extrabold uppercase text-[10px] tracking-wider">Rilevazioni Modificate</p>
                          <p className="text-[11px] text-white/70">
                            I dati biometrici o le pliche sono cambiati dopo l'ultimo calcolo. Premi "Calcola" per ricalcolare con i nuovi parametri, oppure "Ripristina" per ricaricare i valori usati nella formula salvata.
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Formula selection & configuration */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="space-y-1">
                        <label htmlFor="select-formula" className="block text-[10px] font-black uppercase tracking-wider text-white/40">Scegli Formula</label>
                        <select
                          id="select-formula"
                          value={selectedFormulaId}
                          onChange={(e) => setSelectedFormulaId(e.target.value as SkinfoldFormulaId)}
                          className="w-full px-3 py-2 text-xs rounded-xl bg-black/40 border border-white/5 text-white focus:outline-none focus-visible:ring-1 focus-visible:ring-lime-400"
                        >
                          {Object.values(BODY_COMPOSITION_FORMULAS).map(f => (
                            <option key={f.id} value={f.id}>
                              {f.label} ({f.version})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label htmlFor="select-conversion" className="block text-[10px] font-black uppercase tracking-wider text-white/40">Equazione di Conversione</label>
                        <select
                          id="select-conversion"
                          value={selectedConversionId}
                          onChange={(e) => setSelectedConversionId(e.target.value as BodyDensityConversionId)}
                          className="w-full px-3 py-2 text-xs rounded-xl bg-black/40 border border-white/5 text-white focus:outline-none focus-visible:ring-1 focus-visible:ring-lime-400"
                        >
                          <option value="siri_1961">Siri (1961)</option>
                          <option value="brozek_1963">Brozek (1963)</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label htmlFor="custom-sex" className="block text-[10px] font-black uppercase tracking-wider text-white/40">Sesso per Formula</label>
                        <select
                          id="custom-sex"
                          value={customSesso}
                          onChange={(e) => setCustomSesso(e.target.value as Sesso)}
                          className="w-full px-3 py-2 text-xs rounded-xl bg-black/40 border border-white/5 text-white focus:outline-none focus-visible:ring-1 focus-visible:ring-lime-400"
                        >
                          <option value="Uomo">Uomo</option>
                          <option value="Donna">Donna</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label htmlFor="custom-age" className="block text-[10px] font-black uppercase tracking-wider text-white/40">Età per Formula</label>
                        <input
                          id="custom-age"
                          type="number"
                          placeholder="es. 30"
                          value={customAge}
                          onChange={(e) => setCustomAge(e.target.value === '' ? '' : Number(e.target.value))}
                          className="w-full px-3 py-2 text-xs rounded-xl bg-black/40 border border-white/5 text-white focus:outline-none focus-visible:ring-1 focus-visible:ring-lime-400"
                        />
                      </div>
                    </div>

                    {/* Required Skinfold Checklist & Warnings */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-black/20 p-3 rounded-lg border border-white/5 space-y-2 text-left">
                        <h5 className="text-[10px] font-black uppercase tracking-wider text-white/40">
                          Requisiti Formula & Pliche
                        </h5>
                        
                        <p className="text-[11px] text-white/60">
                          {BODY_COMPOSITION_FORMULAS[selectedFormulaId]?.description}
                        </p>

                        <div className="grid grid-cols-2 gap-2 pt-1">
                          {getRequiredSites(selectedFormulaId).map(site => {
                            const readings = skinfoldValues[site].filter(v => v !== '' && v !== null);
                            const hasValue = readings.length > 0;
                            const calc = calculateSkinfoldSelectedValue(readings.map(Number));
                            const valStr = hasValue && calc.selectedValue !== undefined ? `${calc.selectedValue} mm` : '';

                            return (
                              <div key={site} className="flex items-center gap-1.5 text-[11px]">
                                {hasValue ? (
                                  <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                                ) : (
                                  <div className="w-3.5 h-3.5 rounded-full border border-red-500/40 bg-red-500/5 flex items-center justify-center shrink-0">
                                    <span className="text-[8px] text-red-400">!</span>
                                  </div>
                                )}
                                <span className={hasValue ? 'text-white font-medium' : 'text-white/40'}>
                                  {site}: {hasValue ? <span className="text-emerald-400 font-mono font-bold">{valStr}</span> : <span className="text-red-400/70 font-semibold">mancante</span>}
                                </span>
                              </div>
                            );
                          })}
                        </div>

                        {validation.status === 'invalid' && validation.errors.length > 0 && (
                          <p id="calc-error-desc" className="text-[10px] text-red-400 font-semibold pt-1">
                            ❌ Formula non applicabile: {validation.errors.join(', ')}
                          </p>
                        )}
                        {validation.status !== 'invalid' && validation.warnings.length > 0 && (
                          <p id="calc-warn-desc" className="text-[10px] text-amber-400 font-semibold pt-1">
                            ⚠️ Avvertimento: {validation.warnings.join(', ')}
                          </p>
                        )}
                      </div>

                      <div className="flex flex-col justify-center space-y-3 p-3 bg-black/20 rounded-lg border border-white/5">
                        <div className="flex flex-wrap gap-2.5">
                          <button
                            type="button"
                            onClick={handleRunCalculation}
                            disabled={!isCalculationInputValid}
                            className={`flex-1 min-w-[120px] py-2 px-4 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                              isCalculationInputValid 
                                ? 'text-neutral-950 hover:opacity-90 shadow-lg' 
                                : 'bg-white/5 text-white/20 border border-white/5 cursor-not-allowed'
                            }`}
                            style={{ backgroundColor: isCalculationInputValid ? config.primaryColor : undefined }}
                          >
                            Calcola
                          </button>
                          
                          {savedCalculation && (
                            <button
                              type="button"
                              onClick={handleRestoreSavedCalculation}
                              className="flex-1 min-w-[120px] py-2 px-4 rounded-xl text-xs font-black uppercase tracking-wider bg-black/40 border border-white/5 text-white/80 hover:text-white hover:bg-white/5 cursor-pointer transition-all"
                            >
                              Ripristina
                            </button>
                          )}
                        </div>
                        <p className="text-[9px] text-white/30 text-center">
                          Il calcolo richiede l'inserimento completo e valido di tutti i siti contrassegnati.
                        </p>
                      </div>
                    </div>

                    <div className="sr-only" aria-live="polite">
                      {currentCalculationPreview 
                        ? `Calcolo completato: Grasso corporeo staccato ${currentCalculationPreview.bodyFatPercent?.toFixed(2)}%`
                        : ''}
                    </div>

                    {currentCalculationPreview && (
                      <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3 text-left">
                        <div className="flex justify-between items-center border-b border-white/5 pb-2">
                          <h5 className="text-[10px] font-black uppercase tracking-wider text-[#CCFF00]" style={{ color: config.primaryColor }}>
                            Risultati Anteprima Formula
                          </h5>
                          <span className="text-[9px] text-white/40 font-mono">
                            id: {currentCalculationPreview.formulaId} • {currentCalculationPreview.conversionId}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                          <div className="bg-black/30 p-2.5 rounded-lg border border-white/5">
                            <span className="block text-[8px] text-white/35 uppercase tracking-wider font-bold">Densità Corporea</span>
                            <span className="block text-white font-mono font-black text-sm mt-0.5">
                              {currentCalculationPreview.bodyDensity?.toFixed(5) ?? '—'}
                            </span>
                          </div>

                          <div className="bg-black/30 p-2.5 rounded-lg border border-white/5">
                            <span className="block text-[8px] text-white/35 uppercase tracking-wider font-bold">Massa Grassa (%)</span>
                            <span className="block text-[#CCFF00] font-black text-sm mt-0.5" style={{ color: config.primaryColor }}>
                              {currentCalculationPreview.bodyFatPercent !== undefined ? `${currentCalculationPreview.bodyFatPercent.toFixed(2)}%` : '—'}
                            </span>
                          </div>

                          <div className="bg-black/30 p-2.5 rounded-lg border border-white/5">
                            <span className="block text-[8px] text-white/35 uppercase tracking-wider font-bold">Massa Grassa (kg)</span>
                            <span className="block text-white font-black text-sm mt-0.5">
                              {currentCalculationPreview.fatMassKg !== undefined ? `${currentCalculationPreview.fatMassKg.toFixed(2)} kg` : '—'}
                            </span>
                          </div>

                          <div className="bg-black/30 p-2.5 rounded-lg border border-white/5">
                            <span className="block text-[8px] text-white/35 uppercase tracking-wider font-bold">Massa Magra (kg)</span>
                            <span className="block text-white font-black text-sm mt-0.5">
                              {currentCalculationPreview.leanMassKg !== undefined ? `${currentCalculationPreview.leanMassKg.toFixed(2)} kg` : '—'}
                            </span>
                          </div>
                        </div>

                        {currentCalculationPreview.warnings && currentCalculationPreview.warnings.length > 0 && (
                          <div className="p-2.5 bg-amber-400/5 border border-amber-400/10 rounded text-[10px] text-amber-400 space-y-1">
                            {currentCalculationPreview.warnings.map((w, idx) => (
                              <p key={idx}>⚠️ {w}</p>
                            ))}
                          </div>
                        )}

                        <div className="flex justify-end pt-2">
                          <button
                            type="button"
                            onClick={handleApplyCalculationResult}
                            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-neutral-950 text-xs font-black uppercase tracking-wider rounded-lg transition-all cursor-pointer shadow-md"
                          >
                            Usa questo risultato
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-black/20 p-3.5 rounded-xl border border-white/5">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="block text-[10px] font-black uppercase tracking-wider text-white/40">Massa Grassa Calcolata (kg)</label>
                      {isFatMassOverridden && calculationMode !== 'formula' && (
                        <button
                          type="button"
                          onClick={() => setIsFatMassOverridden(false)}
                          className="text-[9px] text-amber-400 underline"
                        >
                          Ripristina calcolo automatico
                        </button>
                      )}
                    </div>
                    <input
                      type="number"
                      step="0.05"
                      placeholder="Automatica"
                      value={fatMassKg}
                      readOnly={calculationMode === 'formula'}
                      onChange={(e) => {
                        setFatMassKg(e.target.value === '' ? '' : Number(e.target.value));
                        setIsFatMassOverridden(true);
                      }}
                      className={`w-full px-3 py-2 text-xs rounded-xl bg-black/40 border text-white focus:outline-none focus-visible:ring-1 focus-visible:ring-lime-400 ${
                        calculationMode === 'formula' ? 'opacity-70 bg-white/5 cursor-not-allowed border-white/5' : 'border-white/5'
                      }`}
                    />
                    {isFatMassOverridden && calculationMode !== 'formula' && (
                      <span className="text-[9px] text-amber-400">Valore modificato manualmente</span>
                    )}
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="block text-[10px] font-black uppercase tracking-wider text-white/40">Massa Magra Calcolata (kg)</label>
                      {isLeanMassOverridden && calculationMode !== 'formula' && (
                        <button
                          type="button"
                          onClick={() => setIsLeanMassOverridden(false)}
                          className="text-[9px] text-amber-400 underline"
                        >
                          Ripristina calcolo automatico
                        </button>
                      )}
                    </div>
                    <input
                      type="number"
                      step="0.05"
                      placeholder="Automatica"
                      value={leanMassKg}
                      readOnly={calculationMode === 'formula'}
                      onChange={(e) => {
                        setLeanMassKg(e.target.value === '' ? '' : Number(e.target.value));
                        setIsLeanMassOverridden(true);
                      }}
                      className={`w-full px-3 py-2 text-xs rounded-xl bg-black/40 border text-white focus:outline-none focus-visible:ring-1 focus-visible:ring-lime-400 ${
                        calculationMode === 'formula' ? 'opacity-70 bg-white/5 cursor-not-allowed border-white/5' : 'border-white/5'
                      }`}
                    />
                    {isLeanMassOverridden && calculationMode !== 'formula' && (
                      <span className="text-[9px] text-amber-400">Valore modificato manualmente</span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div className="space-y-1">
                    <label className="block text-[10px] font-black uppercase tracking-wider text-white/40">Acqua Corporea (%)</label>
                    <input
                      type="number"
                      step="0.1"
                      placeholder="es. 55"
                      value={totalBodyWaterPercent}
                      onChange={(e) => setTotalBodyWaterPercent(e.target.value === '' ? '' : Number(e.target.value))}
                      className={`w-full px-3 py-2 text-xs rounded-xl bg-black/40 border text-white focus:outline-none ${errors.totalBodyWaterPercent ? 'border-red-500' : 'border-white/5'}`}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[10px] font-black uppercase tracking-wider text-white/40">Grasso Viscerale (Indice)</label>
                    <input
                      type="number"
                      step="1"
                      placeholder="es. 5"
                      value={visceralFatIndex}
                      onChange={(e) => setVisceralFatIndex(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full px-3 py-2 text-xs rounded-xl bg-black/40 border border-white/5 text-white focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[10px] font-black uppercase tracking-wider text-white/40">Strumento / Bioimpedenziometro</label>
                    <input
                      type="text"
                      placeholder="es. Tanita RD-545"
                      value={deviceName}
                      onChange={(e) => setDeviceName(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl bg-black/40 border border-white/5 text-white focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Collapsible Section 5: Condizioni */}
          <div className="border border-white/5 rounded-xl overflow-hidden">
            <button
              type="button"
              onClick={() => toggleSection('condizioni')}
              className="w-full flex justify-between items-center bg-black/20 p-3.5 text-xs font-black uppercase tracking-wider text-white border-b border-white/5 cursor-pointer"
            >
              <span>Condizioni della Rilevazione (Facoltativo)</span>
              <span className="text-white/40">{collapseSections.condizioni ? 'Nascondi' : 'Mostra'}</span>
            </button>

            {collapseSections.condizioni && (
              <div className="p-4 bg-black/5 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <div className="space-y-1">
                    <label className="block text-[10px] font-black uppercase tracking-wider text-white/40">Orario Misura</label>
                    <input
                      type="time"
                      value={time}
                      onChange={(e) => setTime(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl bg-black/40 border border-white/5 text-white focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[10px] font-black uppercase tracking-wider text-white/40">Digiuno (Ore)</label>
                    <input
                      type="number"
                      step="1"
                      placeholder="es. 12"
                      value={fastingHours}
                      onChange={(e) => setFastingHours(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full px-3 py-2 text-xs rounded-xl bg-black/40 border border-white/5 text-white focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[10px] font-black uppercase tracking-wider text-white/40">Idratazione / Note</label>
                    <input
                      type="text"
                      placeholder="es. Ottima, 2.5L acqua ieri"
                      value={hydrationNotes}
                      onChange={(e) => setHydrationNotes(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl bg-black/40 border border-white/5 text-white focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[10px] font-black uppercase tracking-wider text-white/40">Distanza Allenamento (Ore)</label>
                    <input
                      type="number"
                      step="1"
                      placeholder="es. 24"
                      value={lastTrainingHours}
                      onChange={(e) => setLastTrainingHours(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full px-3 py-2 text-xs rounded-xl bg-black/40 border border-white/5 text-white focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="block text-[10px] font-black uppercase tracking-wider text-white/40">Operatore / Rilevatore</label>
                    <input
                      type="text"
                      placeholder="es. Coach Rossi"
                      value={operatorName}
                      onChange={(e) => setOperatorName(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl bg-black/40 border border-white/5 text-white focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[10px] font-black uppercase tracking-wider text-white/40">Abbigliamento</label>
                    <input
                      type="text"
                      placeholder="es. Intimo"
                      value={clothingNotes}
                      onChange={(e) => setClothingNotes(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl bg-black/40 border border-white/5 text-white focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[10px] font-black uppercase tracking-wider text-white/40">Luogo Misurazione</label>
                    <input
                      type="text"
                      placeholder="es. PT Studio, Online"
                      value={measurementLocation}
                      onChange={(e) => setMeasurementLocation(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl bg-black/40 border border-white/5 text-white focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-white/5">
            <button
              type="button"
              onClick={() => {
                setAnthropometryView('storico');
                setEditingMeasurement(null);
              }}
              className="px-4 py-2 text-xs font-black uppercase tracking-wider rounded-xl border border-white/5 hover:bg-white/5 transition-colors text-white/40 hover:text-white"
            >
              Annulla
            </button>
            <button
              id="anthropometry-form-submit"
              type="submit"
              className="px-5 py-2 text-xs font-black uppercase tracking-wider text-neutral-950 rounded-xl transition-all shadow-md cursor-pointer"
              style={{ backgroundColor: config.primaryColor }}
            >
              {editingMeasurement ? 'Salva Modifiche' : 'Salva Rilevazione'}
            </button>
          </div>
        </form>
      )}

    </div>
  );
}
