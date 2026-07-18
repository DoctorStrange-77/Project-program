import React, { useState, useEffect } from 'react';
import { Client, CoachConfig, WorkoutPlan, ClientMeasurement, ClientCheckIn, ClientCheckType, ClientCheckStatus } from '../types';
import { 
  User, Award, Scale, Ruler, Calendar, BookOpen, Clock, ChevronLeft,
  Edit2, Trash2, Plus, Download, TrendingUp, Info, Activity, MessageSquare, ListTodo,
  FileText, Dumbbell, Settings, ClipboardList, CheckCircle, Flame, PieChart, Apple, ShieldAlert,
  Copy, Eye, X, AlertTriangle
} from 'lucide-react';
import LogbookTracker from './LogbookTracker';
import ClientAnthropometry from './ClientAnthropometry';

interface ClientWorkspaceProps {
  client: Client;
  plans: WorkoutPlan[];
  config: CoachConfig;
  onEditClient: (client: Client, e: React.MouseEvent) => void;
  onDeleteClient: (id: string, name: string, e: React.MouseEvent) => void;
  onSelectClientForPlan: (client: Client) => void;
  onAddMeasurement: () => void;
  onDeleteMeasurement: (measureId: string) => void;
  onClose: () => void;
  onShowToast?: (message: string, type: 'success' | 'error' | 'info' | 'warning') => void;
  onUpdateClient: (client: Client) => void;
  onShowConfirm?: (config: {
    title: string;
    message: string;
    confirmText: string;
    cancelText?: string;
    isDestructive?: boolean;
    onConfirm: () => void;
  }) => void;
}

export default function ClientWorkspace({
  client,
  plans,
  config,
  onEditClient,
  onDeleteClient,
  onSelectClientForPlan,
  onAddMeasurement,
  onDeleteMeasurement,
  onClose,
  onShowToast,
  onUpdateClient,
  onShowConfirm
}: ClientWorkspaceProps) {
  // Tabs: 'panoramica' | 'check' | 'antropometria' | 'allenamento' | 'attrezzatura' | 'nutrizione' | 'insight' | 'logbook'
  const [clientWorkspaceTab, setClientWorkspaceTab] = useState<string>('panoramica');
  const [chartMetric, setChartMetric] = useState<'peso' | 'vita'>('peso');
  const [selectedMeasurementId, setSelectedMeasurementId] = useState<string | null>(null);

  // Check-ins active state
  const [isCheckModalOpen, setIsCheckModalOpen] = useState(false);
  const [selectedCheckIn, setSelectedCheckIn] = useState<ClientCheckIn | null>(null);
  const [isViewingCheckIn, setIsViewingCheckIn] = useState<ClientCheckIn | null>(null);

  // Form states for CheckIn
  const [checkId, setCheckId] = useState('');
  const [checkData, setCheckData] = useState('');
  const [checkTipo, setCheckTipo] = useState<ClientCheckType>('presenza');
  const [checkStato, setCheckStato] = useState<ClientCheckStatus>('bozza');
  const [checkMeasurementId, setCheckMeasurementId] = useState('');
  
  const [checkAderenzaAllenamento, setCheckAderenzaAllenamento] = useState<number | ''>('');
  const [checkAderenzaNutrizione, setCheckAderenzaNutrizione] = useState<number | ''>('');
  const [checkAllenamentiPrevisti, setCheckAllenamentiPrevisti] = useState<number | ''>('');
  const [checkAllenamentiCompletati, setCheckAllenamentiCompletati] = useState<number | ''>('');
  const [checkCardioSessioni, setCheckCardioSessioni] = useState<number | ''>('');
  const [checkCardioMinuti, setCheckCardioMinuti] = useState<number | ''>('');
  const [checkPassiMedi, setCheckPassiMedi] = useState<number | ''>('');

  const [checkEnergia, setCheckEnergia] = useState<number | ''>('');
  const [checkSonnoQualita, setCheckSonnoQualita] = useState<number | ''>('');
  const [checkSonnoOre, setCheckSonnoOre] = useState<number | ''>('');
  const [checkStress, setCheckStress] = useState<number | ''>('');
  const [checkFame, setCheckFame] = useState<number | ''>('');
  const [checkDigestione, setCheckDigestione] = useState<number | ''>('');
  const [checkRecupero, setCheckRecupero] = useState<number | ''>('');

  const [checkFeedbackCliente, setCheckFeedbackCliente] = useState('');
  const [checkDifficoltaRiscontrate, setCheckDifficoltaRiscontrate] = useState('');
  const [checkEventiRilevanti, setCheckEventiRilevanti] = useState('');

  const [checkValutazioneCoach, setCheckValutazioneCoach] = useState('');
  const [checkModificheAllenamento, setCheckModificheAllenamento] = useState('');
  const [checkModificheNutrizione, setCheckModificheNutrizione] = useState('');
  const [checkAzioniConcordate, setCheckAzioniConcordate] = useState('');
  const [checkProssimoControllo, setCheckProssimoControllo] = useState('');
  
  const [confirmSpecialAllenamento, setConfirmSpecialAllenamento] = useState(false);

  // Keyboard close for Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsCheckModalOpen(false);
        setIsViewingCheckIn(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Return focus on unmount helper
  useEffect(() => {
    if (isCheckModalOpen || isViewingCheckIn) {
      const activeEl = document.activeElement as HTMLElement | null;
      return () => {
        if (activeEl && typeof activeEl.focus === 'function') {
          activeEl.focus();
        }
      };
    }
  }, [isCheckModalOpen, isViewingCheckIn]);

  const openNewCheckModal = (type: ClientCheckType = 'presenza') => {
    setCheckId('');
    setCheckData(new Date().toISOString().substring(0, 10));
    setCheckTipo(type);
    setCheckStato('bozza');
    setCheckMeasurementId('');
    
    setCheckAderenzaAllenamento('');
    setCheckAderenzaNutrizione('');
    setCheckAllenamentiPrevisti('');
    setCheckAllenamentiCompletati('');
    setCheckCardioSessioni('');
    setCheckCardioMinuti('');
    setCheckPassiMedi('');
    
    setCheckEnergia('');
    setCheckSonnoQualita('');
    setCheckSonnoOre('');
    setCheckStress('');
    setCheckFame('');
    setCheckDigestione('');
    setCheckRecupero('');
    
    setCheckFeedbackCliente('');
    setCheckDifficoltaRiscontrate('');
    setCheckEventiRilevanti('');
    
    setCheckValutazioneCoach('');
    setCheckModificheAllenamento('');
    setCheckModificheNutrizione('');
    setCheckAzioniConcordate('');
    setCheckProssimoControllo('');
    
    setConfirmSpecialAllenamento(false);
    setSelectedCheckIn(null);
    setIsCheckModalOpen(true);
  };

  const openEditCheckModal = (checkIn: ClientCheckIn) => {
    setCheckId(checkIn.id);
    setCheckData(checkIn.data);
    setCheckTipo(checkIn.tipo);
    setCheckStato(checkIn.stato);
    setCheckMeasurementId(checkIn.measurementId || '');
    
    setCheckAderenzaAllenamento(checkIn.aderenzaAllenamento !== undefined ? checkIn.aderenzaAllenamento : '');
    setCheckAderenzaNutrizione(checkIn.aderenzaNutrizione !== undefined ? checkIn.aderenzaNutrizione : '');
    setCheckAllenamentiPrevisti(checkIn.allenamentiPrevisti !== undefined ? checkIn.allenamentiPrevisti : '');
    setCheckAllenamentiCompletati(checkIn.allenamentiCompletati !== undefined ? checkIn.allenamentiCompletati : '');
    setCheckCardioSessioni(checkIn.cardioSessioni !== undefined ? checkIn.cardioSessioni : '');
    setCheckCardioMinuti(checkIn.cardioMinuti !== undefined ? checkIn.cardioMinuti : '');
    setCheckPassiMedi(checkIn.passiMedi !== undefined ? checkIn.passiMedi : '');
    
    setCheckEnergia(checkIn.energia !== undefined ? checkIn.energia : '');
    setCheckSonnoQualita(checkIn.sonnoQualita !== undefined ? checkIn.sonnoQualita : '');
    setCheckSonnoOre(checkIn.sonnoOre !== undefined ? checkIn.sonnoOre : '');
    setCheckStress(checkIn.stress !== undefined ? checkIn.stress : '');
    setCheckFame(checkIn.fame !== undefined ? checkIn.fame : '');
    setCheckDigestione(checkIn.digestione !== undefined ? checkIn.digestione : '');
    setCheckRecupero(checkIn.recupero !== undefined ? checkIn.recupero : '');
    
    setCheckFeedbackCliente(checkIn.feedbackCliente || '');
    setCheckDifficoltaRiscontrate(checkIn.difficoltaRiscontrate || '');
    setCheckEventiRilevanti(checkIn.eventiRilevanti || '');
    
    setCheckValutazioneCoach(checkIn.valutazioneCoach || '');
    setCheckModificheAllenamento(checkIn.modificheAllenamento || '');
    setCheckModificheNutrizione(checkIn.modificheNutrizione || '');
    setCheckAzioniConcordate(checkIn.azioniConcordate || '');
    setCheckProssimoControllo(checkIn.prossimoControllo || '');
    
    setConfirmSpecialAllenamento(false);
    setSelectedCheckIn(checkIn);
    setIsCheckModalOpen(true);
  };

  const handleCheckTipoChange = (type: ClientCheckType) => {
    setCheckTipo(type);
    if (type === 'presenza') {
      if (checkStato === 'da_inviare' || checkStato === 'inviato' || checkStato === 'ricevuto') {
        setCheckStato('bozza');
      }
    }
  };

  const handleCheckSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (checkAderenzaAllenamento !== '' && (checkAderenzaAllenamento < 0 || checkAderenzaAllenamento > 100)) {
      alert("Aderenza Allenamento deve essere compresa tra 0 e 100.");
      return;
    }
    if (checkAderenzaNutrizione !== '' && (checkAderenzaNutrizione < 0 || checkAderenzaNutrizione > 100)) {
      alert("Aderenza Nutrizione deve essere compresa tra 0 e 100.");
      return;
    }
    if (checkAllenamentiPrevisti !== '' && checkAllenamentiPrevisti < 0) {
      alert("Gli allenamenti previsti non possono essere negativi.");
      return;
    }
    if (checkAllenamentiCompletati !== '' && checkAllenamentiCompletati < 0) {
      alert("Gli allenamenti completati non possono essere negativi.");
      return;
    }
    if (checkCardioSessioni !== '' && checkCardioSessioni < 0) {
      alert("Le sessioni cardio non possono essere negative.");
      return;
    }
    if (checkCardioMinuti !== '' && checkCardioMinuti < 0) {
      alert("I minuti cardio non possono essere negativi.");
      return;
    }
    if (checkPassiMedi !== '' && checkPassiMedi < 0) {
      alert("I passi medi giornalieri non possono essere negativi.");
      return;
    }
    if (checkSonnoOre !== '' && (checkSonnoOre < 0 || checkSonnoOre > 24)) {
      alert("Le ore medie di sonno devono essere comprese tra 0 e 24.");
      return;
    }

    if (
      checkAllenamentiCompletati !== '' && 
      checkAllenamentiPrevisti !== '' && 
      checkAllenamentiCompletati > checkAllenamentiPrevisti && 
      !confirmSpecialAllenamento
    ) {
      alert("Attenzione: Gli allenamenti completati superano quelli previsti. Seleziona la casella di conferma per procedere.");
      return;
    }

    const nowStr = new Date().toISOString();
    const finalId = checkId || (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 'chk_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9));
    
    const newCheckIn: ClientCheckIn = {
      id: finalId,
      data: checkData,
      tipo: checkTipo,
      stato: checkStato,
      measurementId: checkMeasurementId || undefined,
      
      aderenzaAllenamento: checkAderenzaAllenamento !== '' ? Number(checkAderenzaAllenamento) : undefined,
      aderenzaNutrizione: checkAderenzaNutrizione !== '' ? Number(checkAderenzaNutrizione) : undefined,
      allenamentiPrevisti: checkAllenamentiPrevisti !== '' ? Number(checkAllenamentiPrevisti) : undefined,
      allenamentiCompletati: checkAllenamentiCompletati !== '' ? Number(checkAllenamentiCompletati) : undefined,
      cardioSessioni: checkCardioSessioni !== '' ? Number(checkCardioSessioni) : undefined,
      cardioMinuti: checkCardioMinuti !== '' ? Number(checkCardioMinuti) : undefined,
      passiMedi: checkPassiMedi !== '' ? Number(checkPassiMedi) : undefined,
      
      energia: checkEnergia !== '' ? Number(checkEnergia) : undefined,
      sonnoQualita: checkSonnoQualita !== '' ? Number(checkSonnoQualita) : undefined,
      sonnoOre: checkSonnoOre !== '' ? Number(checkSonnoOre) : undefined,
      stress: checkStress !== '' ? Number(checkStress) : undefined,
      fame: checkFame !== '' ? Number(checkFame) : undefined,
      digestione: checkDigestione !== '' ? Number(checkDigestione) : undefined,
      recupero: checkRecupero !== '' ? Number(checkRecupero) : undefined,
      
      feedbackCliente: checkFeedbackCliente.trim() || undefined,
      difficoltaRiscontrate: checkDifficoltaRiscontrate.trim() || undefined,
      eventiRilevanti: checkEventiRilevanti.trim() || undefined,
      
      valutazioneCoach: checkValutazioneCoach.trim() || undefined,
      modificheAllenamento: checkModificheAllenamento.trim() || undefined,
      modificheNutrizione: checkModificheNutrizione.trim() || undefined,
      azioniConcordate: checkAzioniConcordate.trim() || undefined,
      prossimoControllo: checkProssimoControllo || undefined,
      
      createdAt: selectedCheckIn ? selectedCheckIn.createdAt : nowStr,
      updatedAt: nowStr
    };

    const currentCheckIns = client.checkIns ?? [];
    let updatedCheckIns: ClientCheckIn[] = [];
    if (selectedCheckIn) {
      updatedCheckIns = currentCheckIns.map(c => c.id === checkId ? newCheckIn : c);
    } else {
      updatedCheckIns = [newCheckIn, ...currentCheckIns];
    }

    const updatedClient: Client = {
      ...client,
      checkIns: updatedCheckIns
    };

    if (checkProssimoControllo) {
      updatedClient.prossimoControllo = checkProssimoControllo;
    }

    onUpdateClient(updatedClient);
    setIsCheckModalOpen(false);
    
    if (isViewingCheckIn && isViewingCheckIn.id === checkId) {
      setIsViewingCheckIn(newCheckIn);
    }

    if (onShowToast) {
      onShowToast(selectedCheckIn ? 'Check aggiornato con successo!' : 'Nuovo check creato con successo!', 'success');
    }
  };

  const handleDuplicateCheckIn = (checkIn: ClientCheckIn) => {
    const newId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 'chk_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
    const nowStr = new Date().toISOString();
    const todayStr = nowStr.substring(0, 10);
    
    const duplicated: ClientCheckIn = {
      ...checkIn,
      id: newId,
      data: todayStr,
      stato: 'bozza',
      createdAt: nowStr,
      updatedAt: nowStr
    };
    
    const currentCheckIns = client.checkIns ?? [];
    const updatedCheckIns = [duplicated, ...currentCheckIns];
    
    const updatedClient: Client = {
      ...client,
      checkIns: updatedCheckIns
    };
    
    onUpdateClient(updatedClient);
    if (onShowToast) {
      onShowToast('Check duplicato come bozza con successo!', 'success');
    }
  };

  const handleDeleteCheckIn = (checkIn: ClientCheckIn) => {
    const performDelete = () => {
      const currentCheckIns = client.checkIns ?? [];
      const updatedCheckIns = currentCheckIns.filter(c => c.id !== checkIn.id);
      const updatedClient: Client = {
        ...client,
        checkIns: updatedCheckIns
      };
      onUpdateClient(updatedClient);
      if (onShowToast) {
        onShowToast('Check eliminato con successo.', 'success');
      }
    };

    const formattedType = checkIn.tipo === 'presenza' ? 'In presenza' : 'Online';
    const formattedDate = checkIn.data.replace(/(\d{4})-(\d{2})-(\d{2})/, '$3/$2/$1');

    if (onShowConfirm) {
      onShowConfirm({
        title: 'Eliminare check-in?',
        message: `Sei sicuro di voler eliminare il check del ${formattedDate} (${formattedType})? Questa operazione è irreversibile.`,
        confirmText: 'Sì, elimina',
        isDestructive: true,
        onConfirm: performDelete
      });
    } else {
      const confirmed = window.confirm(`Sei sicuro di voler eliminare il check del ${formattedDate} (${formattedType})? Questa operazione è irreversibile.`);
      if (confirmed) {
        performDelete();
      }
    }
  };

  const getDeterministicAlerts = (check: ClientCheckIn) => {
    const alerts: { type: 'warning' | 'info'; text: string; details: string }[] = [];
    
    if (check.aderenzaAllenamento !== undefined && check.aderenzaAllenamento < 70) {
      alerts.push({
        type: 'warning',
        text: 'Aderenza allenamento bassa',
        details: `Il valore registrato (${check.aderenzaAllenamento}%) è inferiore alla soglia consigliata del 70%.`
      });
    }
    
    if (check.aderenzaNutrizione !== undefined && check.aderenzaNutrizione < 70) {
      alerts.push({
        type: 'warning',
        text: 'Aderenza nutrizione bassa',
        details: `Il valore registrato (${check.aderenzaNutrizione}%) è inferiore alla soglia consigliata del 70%.`
      });
    }
    
    if (check.stress !== undefined && check.stress >= 8) {
      alerts.push({
        type: 'warning',
        text: 'Livello di stress elevato',
        details: `Il valore registrato (${check.stress}/10) indica uno stress percepito molto alto.`
      });
    }
    
    if (check.sonnoOre !== undefined && check.sonnoOre < 6) {
      alerts.push({
        type: 'warning',
        text: 'Sonno insufficiente',
        details: `La media delle ore di sonno registrata (${check.sonnoOre} ore) è inferiore al minimo consigliato di 6 ore.`
      });
    }
    
    if (check.energia !== undefined && check.energia <= 3) {
      alerts.push({
        type: 'warning',
        text: 'Livello energetico basso',
        details: `L'energia percepita registrata (${check.energia}/10) è molto bassa.`
      });
    }
    
    if (check.recupero !== undefined && check.recupero <= 3) {
      alerts.push({
        type: 'warning',
        text: 'Recupero inadeguato',
        details: `Il recupero percepito registrata (${check.recupero}/10) è inferiore alla soglia ideale.`
      });
    }
    
    return alerts;
  };

  const STATUS_LABELS: Record<ClientCheckStatus, string> = {
    bozza: 'Bozza',
    da_inviare: 'Da inviare',
    inviato: 'Inviato',
    ricevuto: 'Ricevuto',
    revisionato: 'Revisionato'
  };

  const STATUS_BADGES: Record<ClientCheckStatus, string> = {
    bozza: 'bg-neutral-800 text-white/50 border border-white/5',
    da_inviare: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
    inviato: 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
    ricevuto: 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20',
    revisionato: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
  };

  const checkInsList = client.checkIns ?? [];
  const totalChecks = checkInsList.length;
  const sortedCheckIns = [...checkInsList].sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
  const lastCheck = sortedCheckIns[0];
  const lastCheckDateStr = lastCheck ? lastCheck.data.replace(/(\d{4})-(\d{2})-(\d{2})/, '$3/$2/$1') : '—';
  const prossimoControlloStr = client.prossimoControllo ? client.prossimoControllo.replace(/(\d{4})-(\d{2})-(\d{2})/, '$3/$2/$1') : '—';
  const checksToReview = checkInsList.filter(c => c.stato === 'ricevuto' || c.stato === 'inviato').length;

  const renderPillRating = (
    label: string,
    value: number | '',
    onChange: (val: number) => void,
    directionMin: string,
    directionMax: string,
    id: string
  ) => {
    return (
      <div className="space-y-2">
        <label htmlFor={id} className="block text-xs font-bold text-white/70">
          {label}
        </label>
        <div className="flex flex-wrap gap-1.5" id={id}>
          {Array.from({ length: 10 }, (_, i) => i + 1).map((num) => {
            const isSelected = value === num;
            return (
              <button
                key={num}
                type="button"
                onClick={() => onChange(num)}
                className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center text-xs font-black transition-all cursor-pointer border ${
                  isSelected
                    ? 'text-neutral-950 border-transparent'
                    : 'bg-black/30 text-white/50 border-white/5 hover:border-white/20'
                }`}
                style={{
                  backgroundColor: isSelected ? config.primaryColor : undefined,
                }}
                aria-label={`${label}: ${num}`}
              >
                {num}
              </button>
            );
          })}
        </div>
        <div className="flex justify-between text-[10px] text-white/40 font-medium px-1">
          <span>{directionMin}</span>
          <span>{directionMax}</span>
        </div>
      </div>
    );
  };

  const renderCheckInCard = (check: ClientCheckIn) => {
    const alerts = getDeterministicAlerts(check);
    const linkedMeasurement = client.rilevazioni?.find(r => r.id === check.measurementId);
    
    return (
      <div 
        key={check.id} 
        className="bg-[#181818] border border-white/5 rounded-2xl p-5 space-y-4 hover:border-white/10 transition-all text-left"
      >
        <div className="flex flex-wrap justify-between items-start gap-2">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4" style={{ color: config.primaryColor }} />
              <h4 className="font-extrabold text-sm text-white">
                Check del {check.data.replace(/(\d{4})-(\d{2})-(\d{2})/, '$3/$2/$1')}
              </h4>
              <span className={`text-[9px] px-2 py-0.5 rounded font-black uppercase tracking-wider ${STATUS_BADGES[check.stato]}`}>
                {STATUS_LABELS[check.stato]}
              </span>
            </div>
            <p className="text-[10px] text-white/40 uppercase tracking-wider">
              Origine: {check.tipo === 'presenza' ? 'In presenza' : 'Online'}
            </p>
          </div>
          
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setIsViewingCheckIn(check)}
              className="p-1.5 rounded bg-black/40 border border-white/5 text-white/50 hover:text-white transition-all cursor-pointer"
              title="Apri Dettaglio"
              aria-label="Apri Dettaglio"
            >
              <Eye className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => openEditCheckModal(check)}
              className="p-1.5 rounded bg-black/40 border border-white/5 text-white/50 hover:text-white transition-all cursor-pointer"
              title="Modifica"
              aria-label="Modifica"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => handleDuplicateCheckIn(check)}
              className="p-1.5 rounded bg-black/40 border border-white/5 text-white/50 hover:text-white transition-all cursor-pointer"
              title="Duplica"
              aria-label="Duplica"
            >
              <Copy className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => handleDeleteCheckIn(check)}
              className="p-1.5 rounded bg-black/40 border border-white/5 text-white/20 hover:text-red-400 transition-all cursor-pointer"
              title="Elimina"
              aria-label="Elimina"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs bg-black/20 p-3 rounded-xl border border-white/5">
          <div>
            <span className="text-[9px] text-white/35 uppercase tracking-wider block">Aderenza Allenamento</span>
            <span className="text-white font-extrabold block mt-0.5">
              {check.aderenzaAllenamento !== undefined ? `${check.aderenzaAllenamento}%` : '—'}
            </span>
          </div>
          <div>
            <span className="text-[9px] text-white/35 uppercase tracking-wider block">Aderenza Nutrizione</span>
            <span className="text-white font-extrabold block mt-0.5">
              {check.aderenzaNutrizione !== undefined ? `${check.aderenzaNutrizione}%` : '—'}
            </span>
          </div>
          <div>
            <span className="text-[9px] text-white/35 uppercase tracking-wider block">Energia</span>
            <span className="text-white font-extrabold block mt-0.5">
              {check.energia !== undefined ? `${check.energia}/10` : '—'}
            </span>
          </div>
          <div>
            <span className="text-[9px] text-white/35 uppercase tracking-wider block">Sonno</span>
            <span className="text-white font-extrabold block mt-0.5 truncate">
              {check.sonnoOre !== undefined ? `${check.sonnoOre} ore (${check.sonnoQualita !== undefined ? `${check.sonnoQualita}/10` : '—'})` : '—'}
            </span>
          </div>
          <div>
            <span className="text-[9px] text-white/35 uppercase tracking-wider block">Stress</span>
            <span className="text-white font-extrabold block mt-0.5">
              {check.stress !== undefined ? `${check.stress}/10` : '—'}
            </span>
          </div>
          <div className="col-span-2 sm:col-span-1">
            <button
              onClick={() => {
                if (linkedMeasurement) {
                  setSelectedMeasurementId(linkedMeasurement.id);
                  setClientWorkspaceTab('antropometria');
                }
              }}
              className="text-left group cursor-pointer"
              type="button"
            >
              <span className="text-[9px] text-white/35 uppercase tracking-wider block group-hover:text-white/60 transition-colors">Rilevazione Corporea</span>
              <span className="text-white font-bold block mt-0.5 truncate group-hover:underline">
                {linkedMeasurement 
                  ? `${linkedMeasurement.peso} kg • ${linkedMeasurement.vita} cm` 
                  : '—'}
              </span>
            </button>
          </div>
          <div>
            <span className="text-[9px] uppercase tracking-wider font-black block" style={{ color: config.primaryColor }}>Prossimo Controllo</span>
            <span className="text-white font-extrabold block mt-0.5">
              {check.prossimoControllo 
                ? check.prossimoControllo.replace(/(\d{4})-(\d{2})-(\d{2})/, '$3/$2/$1') 
                : '—'}
            </span>
          </div>
        </div>

        {alerts.length > 0 && (
          <div className="space-y-1.5 pt-1">
            <span className="text-[9px] font-black uppercase text-amber-400 tracking-wider block">Indicatori di Attenzione</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {alerts.map((alert, idx) => (
                <div key={idx} className="bg-amber-500/5 border border-amber-500/10 rounded-lg p-2 flex gap-2 items-start text-[10px]">
                  <ShieldAlert className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                  <div className="text-left">
                    <p className="font-extrabold text-amber-300">{alert.text}</p>
                    <p className="text-white/60 leading-normal mt-0.5">{alert.details}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const clientPlans = plans.filter(p => p.clienteId === client.id);
  const activePlan = clientPlans.find(p => p.status === 'Attiva');

  // Sort rilevazioni chronologically
  const sortedRilevazioni = client.rilevazioni && client.rilevazioni.length > 0
    ? [...client.rilevazioni].sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime())
    : [];

  const latestRilevazione = sortedRilevazioni[sortedRilevazioni.length - 1];
  const previousRilevazione = sortedRilevazioni.length >= 2 ? sortedRilevazioni[sortedRilevazioni.length - 2] : null;

  // Single Client Export handler
  const handleExportClient = () => {
    const logbookData = localStorage.getItem('pt_logbook');
    const clientLogs = logbookData ? JSON.parse(logbookData).filter((l: any) => l.clienteId === client.id) : [];

    const exportObj = {
      type: "pt_single_client",
      client,
      plans: clientPlans,
      logbook: clientLogs
    };

    const sanitizedName = `${client.nome}_${client.cognome}`.toLowerCase().replace(/[^a-z0-9]/g, '_');
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(exportObj, null, 2))}`;
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', jsonString);
    downloadAnchor.setAttribute('download', `cliente_${sanitizedName}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    
    if (onShowToast) {
      onShowToast(`Profilo di ${client.nome} ${client.cognome} esportato con successo!`, 'success');
    }
  };

  // Custom SVG line chart calculation
  const renderChart = () => {
    if (sortedRilevazioni.length < 2) {
      return (
        <div className="flex flex-col items-center justify-center h-48 bg-black/40 border border-white/5 rounded-xl p-4 text-center">
          <TrendingUp className="w-8 h-8 text-white/15 mb-2" />
          <p className="text-xs font-bold text-white/50 uppercase tracking-wider">Grafico non disponibile</p>
          <p className="text-[10px] text-white/30 max-w-xs mt-1">Registra almeno 2 rilevazioni in date diverse per visualizzare l'andamento nel tempo.</p>
        </div>
      );
    }

    const values = sortedRilevazioni.map(r => chartMetric === 'peso' ? r.peso : r.vita);
    const minVal = Math.min(...values) - 1;
    const maxVal = Math.max(...values) + 1;
    const valRange = maxVal - minVal || 1;

    // SVG coordinates config
    const width = 500;
    const height = 180;
    const paddingLeft = 35;
    const paddingRight = 15;
    const paddingTop = 15;
    const paddingBottom = 25;

    const chartWidth = width - paddingLeft - paddingRight;
    const chartHeight = height - paddingTop - paddingBottom;

    // Calculate point positions
    const points = sortedRilevazioni.map((r, i) => {
      const val = chartMetric === 'peso' ? r.peso : r.vita;
      const x = paddingLeft + (i / (sortedRilevazioni.length - 1)) * chartWidth;
      const y = paddingTop + chartHeight - ((val - minVal) / valRange) * chartHeight;
      return { x, y, val, date: r.data };
    });

    const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
    const areaD = `${pathD} L ${points[points.length - 1].x} ${paddingTop + chartHeight} L ${points[0].x} ${paddingTop + chartHeight} Z`;

    return (
      <div className="space-y-2">
        <div className="flex justify-between items-center bg-black/40 p-2.5 rounded-xl border border-white/5">
          <span className="text-[10px] font-black uppercase text-white/50 tracking-wider">Grafico di Progresso</span>
          <div className="flex gap-1 bg-black/60 p-1 rounded-lg border border-white/5 text-[9px] font-black uppercase tracking-wider">
            <button
              onClick={() => setChartMetric('peso')}
              className={`px-2.5 py-1 rounded transition-all cursor-pointer ${
                chartMetric === 'peso' ? 'bg-neutral-800 text-white' : 'text-white/40 hover:text-white'
              }`}
            >
              Peso (kg)
            </button>
            <button
              onClick={() => setChartMetric('vita')}
              className={`px-2.5 py-1 rounded transition-all cursor-pointer ${
                chartMetric === 'vita' ? 'bg-neutral-800 text-white' : 'text-white/40 hover:text-white'
              }`}
            >
              Vita (cm)
            </button>
          </div>
        </div>

        <div className="relative bg-black/20 rounded-xl p-2 border border-white/5">
          <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible">
            {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
              const y = paddingTop + ratio * chartHeight;
              const valLabel = (maxVal - ratio * valRange).toFixed(1);
              return (
                <g key={i}>
                  <line 
                    x1={paddingLeft} 
                    y1={y} 
                    x2={width - paddingRight} 
                    y2={y} 
                    stroke="rgba(255,255,255,0.05)" 
                    strokeWidth="1" 
                    strokeDasharray="4 4" 
                  />
                  <text 
                    x={paddingLeft - 6} 
                    y={y + 3} 
                    fill="rgba(255,255,255,0.3)" 
                    fontSize="8" 
                    fontFamily="monospace"
                    textAnchor="end"
                  >
                    {valLabel}
                  </text>
                </g>
              );
            })}

            <path 
              d={areaD} 
              fill={`url(#gradient-${chartMetric})`}
              opacity="0.15"
            />

            <path 
              d={pathD} 
              fill="none" 
              stroke={config.primaryColor} 
              strokeWidth="2.5" 
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {points.map((p, i) => (
              <g key={i} className="group cursor-pointer">
                <circle 
                  cx={p.x} 
                  cy={p.y} 
                  r="4" 
                  fill={config.primaryColor} 
                  stroke="#121212" 
                  strokeWidth="1.5" 
                />
                <circle 
                  cx={p.x} 
                  cy={p.y} 
                  r="8" 
                  fill={config.primaryColor} 
                  opacity="0" 
                  className="hover:opacity-20 transition-opacity"
                />
                <text 
                  x={p.x} 
                  y={p.y - 8} 
                  fill="white" 
                  fontSize="8" 
                  fontFamily="sans-serif"
                  fontWeight="bold"
                  textAnchor="middle"
                >
                  {p.val}
                </text>
                <text 
                  x={p.x} 
                  y={height - 8} 
                  fill="rgba(255,255,255,0.4)" 
                  fontSize="7" 
                  fontWeight="600"
                  textAnchor="middle"
                >
                  {p.date.substring(5)}
                </text>
              </g>
            ))}

            <defs>
              <linearGradient id={`gradient-${chartMetric}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={config.primaryColor} />
                <stop offset="100%" stopColor={config.primaryColor} stopOpacity="0" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      </div>
    );
  };

  const tabs = [
    { id: 'panoramica', label: 'Panoramica', icon: ClipboardList },
    { id: 'check', label: 'Check', icon: Flame },
    { id: 'antropometria', label: 'Antropometria', icon: Ruler },
    { id: 'allenamento', label: 'Allenamento', icon: Dumbbell },
    { id: 'attrezzatura', label: 'Attrezzatura', icon: Settings, badge: 'Prossimamente' },
    { id: 'nutrizione', label: 'Nutrizione', icon: Apple, badge: 'Prossimamente' },
    { id: 'insight', label: 'Insight', icon: PieChart, badge: 'Prossimamente' },
    { id: 'logbook', label: 'Logbook', icon: FileText }
  ];

  // Weight variations calculation
  const weightChange = (() => {
    if (!latestRilevazione || !previousRilevazione) return null;
    const diff = latestRilevazione.peso - previousRilevazione.peso;
    const isNegative = diff < 0;
    return {
      value: `${isNegative ? '' : '+'}${diff.toFixed(1)} kg`,
      isNegative
    };
  })();

  return (
    <div className="bg-[#121212] border border-white/5 rounded-2xl p-4 sm:p-6 space-y-6">
      {/* Back button and Professional Header */}
      <div className="flex flex-col gap-4 border-b border-white/5 pb-6">
        <div className="flex justify-between items-center">
          <button 
            onClick={onClose}
            className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-white/60 hover:text-white transition-all cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
            Torna all'elenco
          </button>
          <div className="flex gap-2">
            <span 
              className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${
                activePlan ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
              }`}
            >
              {activePlan ? 'Programma Attivo' : 'Nessun Programma'}
            </span>
          </div>
        </div>

        {/* Core details layout */}
        <div className="flex flex-col md:flex-row gap-6 justify-between items-start md:items-center">
          <div className="flex items-center gap-4">
            <div 
              className="w-16 h-16 rounded-2xl flex items-center justify-center text-xl font-black text-neutral-950 shrink-0 uppercase shadow-md"
              style={{ backgroundColor: config.primaryColor }}
            >
              {client.nome.charAt(0)}{client.cognome.charAt(0)}
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-white leading-tight">
                {client.nome} {client.cognome}
              </h2>
              <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-white/40 mt-1 font-medium items-center">
                <span>{client.eta} Anni</span>
                <span className="w-1.5 h-1.5 rounded-full bg-white/20"></span>
                <span>{client.altezza ? `${client.altezza} cm` : 'Altezza N/D'}</span>
                <span className="w-1.5 h-1.5 rounded-full bg-white/20"></span>
                <span>{client.pesoAttuale ? `${client.pesoAttuale} kg` : 'Peso N/D'}</span>
              </div>
              <div className="flex flex-wrap gap-x-2 gap-y-1 text-[10px] font-bold text-white/50 uppercase tracking-wider mt-2">
                <span className="px-2 py-0.5 bg-neutral-800 rounded">{client.obiettivo}</span>
                <span className="px-2 py-0.5 bg-neutral-800 rounded">{client.livelloEsperienza}</span>
                <span className="px-2 py-0.5 bg-neutral-800 rounded">{client.allenamentiSettimanali} sedute/sett</span>
              </div>
            </div>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 gap-4 w-full md:w-auto text-left text-xs">
            <div className="bg-black/30 p-2.5 rounded-xl border border-white/5 min-w-[120px]">
              <span className="text-[8px] font-black text-white/30 uppercase tracking-wider block">Inizio</span>
              <span className="font-extrabold text-white block mt-0.5">
                {client.dataInizio ? client.dataInizio.replace(/(\d{4})-(\d{2})-(\d{2})/, '$3/$2/$1') : 'N/D'}
              </span>
            </div>
            <div className="bg-black/30 p-2.5 rounded-xl border border-white/5 min-w-[120px]">
              <span className="text-[8px] font-black text-white/30 uppercase tracking-wider block">Prossimo Controllo</span>
              <span className="font-extrabold block mt-0.5 text-white">
                {client.prossimoControllo ? client.prossimoControllo.replace(/(\d{4})-(\d{2})-(\d{2})/, '$3/$2/$1') : 'Da programmare'}
              </span>
            </div>
          </div>
        </div>

        {/* Actions bar */}
        <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-white/5">
          <button
            onClick={(e) => onEditClient(client, e)}
            className="flex items-center gap-1.5 px-3 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg text-xs font-bold transition-all cursor-pointer"
          >
            <Edit2 className="w-3.5 h-3.5" />
            Modifica Profilo
          </button>
          
          <button
            onClick={() => {
              setClientWorkspaceTab('check');
              openNewCheckModal('presenza');
            }}
            className="flex items-center gap-1.5 px-3 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg text-xs font-bold transition-all cursor-pointer"
          >
            <Flame className="w-3.5 h-3.5" style={{ color: config.primaryColor }} />
            Nuovo Check
          </button>

          <button
            onClick={onAddMeasurement}
            className="flex items-center gap-1.5 px-3 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg text-xs font-bold transition-all cursor-pointer"
          >
            <Scale className="w-3.5 h-3.5" />
            Nuova Rilevazione
          </button>

          <button
            onClick={() => onSelectClientForPlan(client)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-black uppercase tracking-wider text-neutral-950 transition-all cursor-pointer shadow-md ml-auto"
            style={{ backgroundColor: config.primaryColor }}
          >
            <Plus className="w-3.5 h-3.5" />
            Crea Scheda
          </button>
        </div>
      </div>

      {/* Internal Navigation Tabs */}
      <div className="border-b border-white/5 overflow-x-auto scrollbar-none flex gap-1 pb-1">
        {tabs.map((tab) => {
          const TabIcon = tab.icon;
          const isActive = clientWorkspaceTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setClientWorkspaceTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-black uppercase tracking-wider rounded-lg transition-all shrink-0 cursor-pointer ${
                isActive 
                  ? 'bg-neutral-800 text-white' 
                  : 'text-white/40 hover:text-white/70 hover:bg-neutral-900/40'
              }`}
            >
              <TabIcon className="w-3.5 h-3.5" style={{ color: isActive ? config.primaryColor : undefined }} />
              {tab.label}
              {tab.badge && (
                <span className="text-[7px] font-bold px-1 bg-white/5 text-white/30 rounded lowercase tracking-normal">
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tabs Content */}
      <div className="space-y-6">
        
        {/* TAB: PANORAMICA */}
        {clientWorkspaceTab === 'panoramica' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Card A: Stato Cliente */}
            <div className="bg-[#181818] border border-white/5 rounded-2xl p-5 space-y-4">
              <div className="flex items-center gap-2 border-b border-white/5 pb-3">
                <User className="w-4 h-4 text-white/40" />
                <h3 className="text-xs font-black uppercase tracking-wider text-white">Stato Cliente</h3>
              </div>
              <div className="grid grid-cols-2 gap-4 text-xs font-medium">
                <div>
                  <span className="text-[9px] text-white/35 uppercase tracking-wider block">Obiettivo</span>
                  <span className="text-white font-extrabold mt-0.5 block">{client.obiettivo}</span>
                </div>
                <div>
                  <span className="text-[9px] text-white/35 uppercase tracking-wider block">Livello Esperienza</span>
                  <span className="text-white font-extrabold mt-0.5 block">{client.livelloEsperienza}</span>
                </div>
                <div>
                  <span className="text-[9px] text-white/35 uppercase tracking-wider block">Frequenza</span>
                  <span className="text-white font-extrabold mt-0.5 block">{client.allenamentiSettimanali} sedute/sett</span>
                </div>
                <div>
                  <span className="text-[9px] text-white/35 uppercase tracking-wider block">Data Inizio</span>
                  <span className="text-white font-extrabold mt-0.5 block">
                    {client.dataInizio ? client.dataInizio.replace(/(\d{4})-(\d{2})-(\d{2})/, '$3/$2/$1') : 'N/D'}
                  </span>
                </div>
              </div>
            </div>

            {/* Card B: Composizione e misure */}
            <div className="bg-[#181818] border border-white/5 rounded-2xl p-5 space-y-4">
              <div className="flex items-center gap-2 border-b border-white/5 pb-3">
                <Scale className="w-4 h-4 text-white/40" />
                <h3 className="text-xs font-black uppercase tracking-wider text-white">Composizione & Misure</h3>
              </div>
              <div className="grid grid-cols-2 gap-4 text-xs font-medium">
                <div>
                  <span className="text-[9px] text-white/35 uppercase tracking-wider block">Peso Attuale</span>
                  <span className="text-white font-extrabold mt-0.5 block">{client.pesoAttuale ? `${client.pesoAttuale} kg` : 'N/D'}</span>
                </div>
                <div>
                  <span className="text-[9px] text-white/35 uppercase tracking-wider block">Ultima Circ. Vita</span>
                  <span className="text-white font-extrabold mt-0.5 block">
                    {latestRilevazione ? `${latestRilevazione.vita} cm` : 'N/D'}
                  </span>
                </div>
                <div>
                  <span className="text-[9px] text-white/35 uppercase tracking-wider block">Ultima Massa Grassa</span>
                  <span className="text-white font-extrabold mt-0.5 block">
                    {latestRilevazione && latestRilevazione.massaGrassa ? `${latestRilevazione.massaGrassa}%` : 'N/D'}
                  </span>
                </div>
                <div>
                  <span className="text-[9px] text-white/35 uppercase tracking-wider block">Variazione Peso Prec.</span>
                  {weightChange ? (
                    <span className={`font-black mt-0.5 block ${weightChange.isNegative ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {weightChange.value}
                    </span>
                  ) : (
                    <span className="text-white/30 font-extrabold mt-0.5 block">—</span>
                  )}
                </div>
              </div>
              <div className="text-[10px] text-white/30 pt-2 border-t border-white/5 text-right">
                {latestRilevazione ? `Rilevazione del ${latestRilevazione.data.replace(/(\d{4})-(\d{2})-(\d{2})/, '$3/$2/$1')}` : 'Nessuna rilevazione registrata'}
              </div>
            </div>

            {/* Card C: Programma Attivo */}
            <div className="bg-[#181818] border border-white/5 rounded-2xl p-5 space-y-4 md:col-span-2">
              <div className="flex items-center gap-2 border-b border-white/5 pb-3">
                <Dumbbell className="w-4 h-4 text-white/40" />
                <h3 className="text-xs font-black uppercase tracking-wider text-white">Programma Attivo</h3>
              </div>
              {activePlan ? (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div className="sm:col-span-2 space-y-1">
                    <p className="font-extrabold text-sm text-[#CCFF00]" style={{ color: config.primaryColor }}>{activePlan.nome}</p>
                    <p className="text-white/50 text-[11px] leading-relaxed">Obiettivo: {activePlan.obiettivo}</p>
                    <p className="text-[10px] text-white/30">Data Creazione: {activePlan.dataCreazione ? new Date(activePlan.dataCreazione).toLocaleDateString('it-IT') : 'N/D'}</p>
                  </div>
                  <div className="bg-black/20 p-3 rounded-xl border border-white/5 flex flex-col justify-center space-y-1.5">
                    <div className="flex justify-between">
                      <span className="text-white/40 text-[10px]">Durata:</span>
                      <span className="text-white font-bold">{activePlan.durataSettimane} Settimane</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/40 text-[10px]">Frequenza:</span>
                      <span className="text-white font-bold">{activePlan.allenamentiSettimanali} sedute/sett</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center p-6 text-center bg-black/10 border border-dashed border-white/5 rounded-xl">
                  <ClipboardList className="w-8 h-8 text-white/10 mb-2" />
                  <p className="text-xs font-bold text-white/50 uppercase tracking-wider">Nessun programma attivo</p>
                  <p className="text-[10px] text-white/30 max-w-xs mt-1 mb-3">L'atleta non ha programmi attivi al momento. Inizia creandone uno nuovo.</p>
                  <button
                    onClick={() => onSelectClientForPlan(client)}
                    className="px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider text-neutral-950 transition-all cursor-pointer shadow-md"
                    style={{ backgroundColor: config.primaryColor }}
                  >
                    Crea Scheda d'Allenamento
                  </button>
                </div>
              )}
            </div>

            {/* Card D: Storico sintetico */}
            <div className="bg-[#181818] border border-white/5 rounded-2xl p-5 space-y-4">
              <div className="flex items-center gap-2 border-b border-white/5 pb-3">
                <Activity className="w-4 h-4 text-white/40" />
                <h3 className="text-xs font-black uppercase tracking-wider text-white">Storico Sintetico</h3>
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs font-medium">
                <div className="bg-black/15 p-2 rounded-lg">
                  <span className="text-[9px] text-white/30 block uppercase tracking-wider">Total Programmi</span>
                  <span className="text-white text-lg font-black mt-0.5 block">{clientPlans.length}</span>
                </div>
                <div className="bg-black/15 p-2 rounded-lg">
                  <span className="text-[9px] text-white/30 block uppercase tracking-wider">Completati</span>
                  <span className="text-white text-lg font-black mt-0.5 block">
                    {clientPlans.filter(p => p.status === 'Completata').length}
                  </span>
                </div>
                <div className="bg-black/15 p-2 rounded-lg">
                  <span className="text-[9px] text-white/30 block uppercase tracking-wider">Archiviati</span>
                  <span className="text-white text-lg font-black mt-0.5 block">
                    {clientPlans.filter(p => p.status === 'Archiviata').length}
                  </span>
                </div>
                <div className="bg-black/15 p-2 rounded-lg">
                  <span className="text-[9px] text-white/30 block uppercase tracking-wider">Rilevazioni</span>
                  <span className="text-white text-lg font-black mt-0.5 block">{sortedRilevazioni.length}</span>
                </div>
              </div>
            </div>

            {/* Card E: Attività Recente */}
            <div className="bg-[#181818] border border-white/5 rounded-2xl p-5 space-y-4">
              <div className="flex items-center gap-2 border-b border-white/5 pb-3">
                <Clock className="w-4 h-4 text-white/40" />
                <h3 className="text-xs font-black uppercase tracking-wider text-white">Attività Recente</h3>
              </div>
              <div className="space-y-3.5 text-xs">
                {sortedRilevazioni.length > 0 && (
                  <div className="flex gap-2.5 items-start">
                    <div className="w-2 h-2 rounded-full bg-[#CCFF00] mt-1 shrink-0" style={{ backgroundColor: config.primaryColor }}></div>
                    <div>
                      <p className="font-extrabold text-white text-[11px]">Ultima rilevazione registrata</p>
                      <p className="text-white/50 text-[10px] mt-0.5">Peso: {latestRilevazione.peso} kg • Vita: {latestRilevazione.vita} cm</p>
                      <p className="text-white/30 text-[9px] mt-0.5">{latestRilevazione.data.replace(/(\d{4})-(\d{2})-(\d{2})/, '$3/$2/$1')}</p>
                    </div>
                  </div>
                )}
                {clientPlans.length > 0 && (() => {
                  const sortedPlans = [...clientPlans].sort((a, b) => {
                    const da = a.dataCreazione ? new Date(a.dataCreazione).getTime() : 0;
                    const db = b.dataCreazione ? new Date(b.dataCreazione).getTime() : 0;
                    return db - da;
                  });
                  const lastPlan = sortedPlans[0];
                  return (
                    <div className="flex gap-2.5 items-start">
                      <div className="w-2 h-2 rounded-full bg-blue-400 mt-1 shrink-0"></div>
                      <div>
                        <p className="font-extrabold text-white text-[11px]">Ultimo programma d'allenamento</p>
                        <p className="text-white/50 text-[10px] mt-0.5">"{lastPlan.nome}" ({lastPlan.status})</p>
                        {lastPlan.dataCreazione && (
                          <p className="text-white/30 text-[9px] mt-0.5">{new Date(lastPlan.dataCreazione).toLocaleDateString('it-IT')}</p>
                        )}
                      </div>
                    </div>
                  );
                })()}
                {sortedRilevazioni.length === 0 && clientPlans.length === 0 && (
                  <div className="text-white/30 text-center py-4 italic">
                    Nessuna attività registrata di recente.
                  </div>
                )}
              </div>
            </div>

            {/* Card F: Ultimo Check */}
            <div className="bg-[#181818] border border-white/5 rounded-2xl p-5 space-y-4 text-left">
              <div className="flex items-center gap-2 border-b border-white/5 pb-3">
                <Flame className="w-4 h-4 text-white/40" />
                <h3 className="text-xs font-black uppercase tracking-wider text-white">Ultimo Check Atleta</h3>
              </div>
              {lastCheck ? (
                <div className="space-y-3.5 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="font-extrabold text-white">Check del {lastCheck.data.replace(/(\d{4})-(\d{2})-(\d{2})/, '$3/$2/$1')}</span>
                    <span className={`text-[8px] px-2 py-0.5 rounded font-black uppercase tracking-wider ${STATUS_BADGES[lastCheck.stato]}`}>
                      {STATUS_LABELS[lastCheck.stato]}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 font-medium text-white/70">
                    <div className="bg-black/10 p-2 rounded">
                      <span className="text-[8px] text-white/30 uppercase tracking-wider block">Allenamento</span>
                      <span className="text-white font-bold mt-0.5 block">{lastCheck.aderenzaAllenamento !== undefined ? `${lastCheck.aderenzaAllenamento}%` : '—'}</span>
                    </div>
                    <div className="bg-black/10 p-2 rounded">
                      <span className="text-[8px] text-white/30 uppercase tracking-wider block">Nutrizione</span>
                      <span className="text-white font-bold mt-0.5 block">{lastCheck.aderenzaNutrizione !== undefined ? `${lastCheck.aderenzaNutrizione}%` : '—'}</span>
                    </div>
                    <div className="bg-black/10 p-2 rounded">
                      <span className="text-[8px] text-white/30 uppercase tracking-wider block">Energia</span>
                      <span className="text-white font-bold mt-0.5 block">{lastCheck.energia !== undefined ? `${lastCheck.energia}/10` : '—'}</span>
                    </div>
                    <div className="bg-black/10 p-2 rounded">
                      <span className="text-[8px] text-white/30 uppercase tracking-wider block">Stress</span>
                      <span className="text-white font-bold mt-0.5 block">{lastCheck.stress !== undefined ? `${lastCheck.stress}/10` : '—'}</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-white/5 text-[10px]">
                    <span className="text-white/40">Prossimo Controllo:</span>
                    <span className="text-[#CCFF00] font-black" style={{ color: config.primaryColor }}>
                      {lastCheck.prossimoControllo ? lastCheck.prossimoControllo.replace(/(\d{4})-(\d{2})-(\d{2})/, '$3/$2/$1') : '—'}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center p-4 text-center bg-black/10 border border-dashed border-white/5 rounded-xl h-44">
                  <p className="text-xs font-bold text-white/50 uppercase tracking-wider">Nessun check registrato</p>
                  <p className="text-[10px] text-white/30 max-w-xs mt-1 mb-3">Non ci sono valutazioni periodiche salvate per questo atleta.</p>
                  <button
                    onClick={() => {
                      setClientWorkspaceTab('check');
                      setTimeout(() => {
                        openNewCheckModal('presenza');
                      }, 50);
                    }}
                    className="px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider text-neutral-950 transition-all cursor-pointer shadow-md"
                    style={{ backgroundColor: config.primaryColor }}
                  >
                    Crea il primo check
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB: CHECK */}
        {clientWorkspaceTab === 'check' && (
          <div className="space-y-6">
            {/* Header / Stats row */}
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
              <div className="text-left">
                <h3 className="text-xs font-black uppercase tracking-wider text-white">Rapporti e Check-In Periodici</h3>
                <p className="text-[10px] text-white/40 mt-1">Monitora l'aderenza, il recupero e le valutazioni professionali dell'atleta</p>
              </div>
              <button
                onClick={() => openNewCheckModal('presenza')}
                className="flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-black uppercase tracking-wider text-neutral-950 transition-all cursor-pointer shadow-md self-start sm:self-auto"
                style={{ backgroundColor: config.primaryColor }}
              >
                <Plus className="w-4 h-4" />
                Nuovo Check
              </button>
            </div>

            {/* Indicator Cards Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-left">
              <div className="bg-black/30 p-3.5 rounded-xl border border-white/5">
                <span className="text-[8px] font-black text-white/30 uppercase tracking-wider block">Total Check-In</span>
                <span className="text-white font-black text-xl block mt-1">{totalChecks}</span>
              </div>
              <div className="bg-black/30 p-3.5 rounded-xl border border-white/5">
                <span className="text-[8px] font-black text-white/30 uppercase tracking-wider block">Ultimo Check</span>
                <span className="text-white font-black text-sm block mt-1.5 truncate">{lastCheckDateStr}</span>
              </div>
              <div className="bg-black/30 p-3.5 rounded-xl border border-white/5">
                <span className="text-[8px] font-black text-white/30 uppercase tracking-wider block">Prossimo Controllo</span>
                <span className="text-[#CCFF00] font-black text-sm block mt-1.5 truncate" style={{ color: config.primaryColor }}>{prossimoControlloStr}</span>
              </div>
              <div className="bg-black/30 p-3.5 rounded-xl border border-white/5 relative">
                <span className="text-[8px] font-black text-white/30 uppercase tracking-wider block">Da Revisionare</span>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="text-white font-black text-xl">{checksToReview}</span>
                  {checksToReview > 0 && (
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
                  )}
                </div>
              </div>
            </div>

            {/* Check-ins list / empty state */}
            {sortedCheckIns.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-12 text-center bg-[#181818] border border-dashed border-white/5 rounded-2xl">
                <Flame className="w-12 h-12 text-white/10 mb-3" />
                <h3 className="text-sm font-black uppercase tracking-wider text-white font-extrabold">Nessun check registrato</h3>
                <p className="text-xs text-white/30 max-w-sm mt-1 mb-4 leading-relaxed">
                  Registra le valutazioni fisiche e i resoconti periodici per monitorare i progressi, l'aderenza a dieta e allenamento, e i livelli di stress.
                </p>
                <button
                  onClick={() => openNewCheckModal('presenza')}
                  className="px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider text-neutral-950 transition-all cursor-pointer shadow-md"
                  style={{ backgroundColor: config.primaryColor }}
                >
                  Registra il primo check
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {sortedCheckIns.map(check => renderCheckInCard(check))}
              </div>
            )}
          </div>
        )}

        {/* TAB: ANTROPOMETRIA */}
        {clientWorkspaceTab === 'antropometria' && (
          <ClientAnthropometry
            client={client}
            config={config}
            onUpdateClient={onUpdateClient}
            onShowToast={onShowToast}
            onShowConfirm={onShowConfirm}
            selectedMeasurementId={selectedMeasurementId}
            onClearSelectedMeasurementId={() => setSelectedMeasurementId(null)}
          />
        )}

        {/* TAB: ALLENAMENTO */}
        {clientWorkspaceTab === 'allenamento' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-black uppercase tracking-wider text-white">Programmi d'Allenamento</h3>
              <button
                onClick={() => onSelectClientForPlan(client)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-black uppercase tracking-wider text-neutral-950 transition-all cursor-pointer shadow-md"
                style={{ backgroundColor: config.primaryColor }}
              >
                <Plus className="w-3.5 h-3.5" />
                Crea Scheda
              </button>
            </div>

            {clientPlans.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-12 text-center bg-[#181818] border border-dashed border-white/5 rounded-2xl">
                <Dumbbell className="w-12 h-12 text-white/10 mb-3" />
                <h3 className="text-sm font-black uppercase tracking-wider text-white">Nessuna scheda creata</h3>
                <p className="text-xs text-white/30 max-w-sm mt-1 mb-4">
                  Crea la prima scheda di allenamento per l'atleta definendo split settimanali, gruppi di esercizi e parametri di carico.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Active Plans first */}
                {['Attiva', 'Bozza', 'Completata', 'Archiviata'].map((status) => {
                  const plansByStatus = clientPlans.filter(p => p.status === status);
                  if (plansByStatus.length === 0) return null;

                  return (
                    <div key={status} className="col-span-1 md:col-span-2 space-y-3">
                      <div className="flex items-center gap-2">
                        <span className="h-px bg-white/5 flex-1"></span>
                        <span className="text-[10px] font-black uppercase tracking-wider text-white/35">
                          {status} ({plansByStatus.length})
                        </span>
                        <span className="h-px bg-white/5 flex-1"></span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {plansByStatus.map(p => {
                          let borderClass = 'border-white/5';
                          let statusBadge = 'bg-neutral-800 text-white/60';
                          if (p.status === 'Attiva') {
                            borderClass = 'border-emerald-500/30 bg-emerald-500/[0.01]';
                            statusBadge = 'bg-emerald-500/10 text-emerald-400';
                          } else if (p.status === 'Completata') {
                            borderClass = 'border-blue-500/30';
                            statusBadge = 'bg-blue-500/10 text-blue-400';
                          } else if (p.status === 'Bozza') {
                            borderClass = 'border-amber-500/30';
                            statusBadge = 'bg-amber-500/10 text-amber-400';
                          }

                          return (
                            <div key={p.id} className={`p-4 bg-[#181818] border ${borderClass} rounded-2xl flex flex-col justify-between space-y-4`}>
                              <div className="space-y-1.5 text-left">
                                <div className="flex justify-between items-start gap-2">
                                  <h4 className="font-extrabold text-sm text-white truncate max-w-[200px]" title={p.nome}>{p.nome}</h4>
                                  <span className={`text-[8px] px-1.5 py-0.5 rounded font-black uppercase tracking-wider shrink-0 ${statusBadge}`}>
                                    {p.status}
                                  </span>
                                </div>
                                <p className="text-[11px] text-white/50 truncate">Obiettivo: {p.obiettivo}</p>
                                <p className="text-[10px] text-white/30">
                                  {p.durataSettimane} settimane • {p.allenamentiSettimanali} sedute/sett
                                </p>
                              </div>

                              <div className="pt-3 border-t border-white/5 flex justify-between items-center text-[10px] text-white/40">
                                <span>{p.dataCreazione ? new Date(p.dataCreazione).toLocaleDateString('it-IT') : ''}</span>
                                <span className="font-semibold uppercase tracking-wider text-white/30">Visualizza in Lista Schede</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB: ATTREZZATURA (PROSSIMAMENTE) */}
        {clientWorkspaceTab === 'attrezzatura' && (
          <div className="flex flex-col items-center justify-center p-12 text-center bg-[#181818] border border-white/5 rounded-2xl">
            <Settings className="w-12 h-12 text-white/10 mb-3" />
            <h3 className="text-sm font-black uppercase tracking-wider text-white">Attrezzatura Palestra</h3>
            <p className="text-xs text-white/30 max-w-sm mt-1 mb-4">
              Configura i macchinari e i pesi disponibili nella palestra o a casa dell'atleta per ottimizzare le schede d'allenamento di conseguenza.
            </p>
            <span className="text-[10px] font-black uppercase text-[#CCFF00] tracking-wider px-3 py-1 bg-white/5 rounded-full" style={{ color: config.primaryColor }}>
              Prossimamente
            </span>
          </div>
        )}

        {/* TAB: NUTRIZIONE (PROSSIMAMENTE) */}
        {clientWorkspaceTab === 'nutrizione' && (
          <div className="flex flex-col items-center justify-center p-12 text-center bg-[#181818] border border-white/5 rounded-2xl">
            <Apple className="w-12 h-12 text-white/10 mb-3" />
            <h3 className="text-sm font-black uppercase tracking-wider text-white">Piano Nutrizionale</h3>
            <p className="text-xs text-white/30 max-w-sm mt-1 mb-4">
              Collega macronutrienti, calorie giornaliere raccomandate e piani alimentari specifici per garantire il raggiungimento degli obiettivi fisici.
            </p>
            <span className="text-[10px] font-black uppercase text-[#CCFF00] tracking-wider px-3 py-1 bg-white/5 rounded-full" style={{ color: config.primaryColor }}>
              Prossimamente
            </span>
          </div>
        )}

        {/* TAB: INSIGHT (PROSSIMAMENTE) */}
        {clientWorkspaceTab === 'insight' && (
          <div className="flex flex-col items-center justify-center p-12 text-center bg-[#181818] border border-white/5 rounded-2xl">
            <PieChart className="w-12 h-12 text-white/10 mb-3" />
            <h3 className="text-sm font-black uppercase tracking-wider text-white">Analisi Insight Avanzate</h3>
            <p className="text-xs text-white/30 max-w-sm mt-1 mb-4">
              Statistiche storiche avanzate, correlazione tra costanza negli allenamenti e variazioni corporee, e suggerimenti automatici AI.
            </p>
            <span className="text-[10px] font-black uppercase text-[#CCFF00] tracking-wider px-3 py-1 bg-white/5 rounded-full" style={{ color: config.primaryColor }}>
              Prossimamente
            </span>
          </div>
        )}

        {/* TAB: LOGBOOK */}
        {clientWorkspaceTab === 'logbook' && (
          <div className="space-y-4">
            <LogbookTracker client={client} config={config} onShowToast={onShowToast} />
          </div>
        )}

      </div>
    </div>
  );
}
