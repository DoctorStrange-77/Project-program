import React, { useState } from 'react';
import { Client, CoachConfig, WorkoutPlan, ClientMeasurement } from '../types';
import { 
  User, Award, Scale, Ruler, Calendar, BookOpen, Clock, ChevronLeft,
  Edit2, Trash2, Plus, Download, TrendingUp, Info, Activity, MessageSquare, ListTodo,
  FileText, Dumbbell, Settings, ClipboardList, CheckCircle, Flame, PieChart, Apple, ShieldAlert
} from 'lucide-react';
import LogbookTracker from './LogbookTracker';

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
  onShowToast
}: ClientWorkspaceProps) {
  // Tabs: 'panoramica' | 'check' | 'antropometria' | 'allenamento' | 'attrezzatura' | 'nutrizione' | 'insight' | 'logbook'
  const [clientWorkspaceTab, setClientWorkspaceTab] = useState<string>('panoramica');
  const [chartMetric, setChartMetric] = useState<'peso' | 'vita'>('peso');

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
    { id: 'check', label: 'Check', icon: Flame, badge: 'Prossimamente' },
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
            disabled
            className="flex items-center gap-1.5 px-3 py-2 bg-neutral-900 text-white/40 border border-white/5 rounded-lg text-xs font-bold transition-all cursor-not-allowed"
          >
            <Flame className="w-3.5 h-3.5" />
            Nuovo Check <span className="text-[8px] px-1 bg-white/5 rounded ml-1 text-white/30 font-bold uppercase tracking-wider">Prossimamente</span>
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
          </div>
        )}

        {/* TAB: CHECK (PROSSIMAMENTE) */}
        {clientWorkspaceTab === 'check' && (
          <div className="flex flex-col items-center justify-center p-12 text-center bg-[#181818] border border-white/5 rounded-2xl">
            <Flame className="w-12 h-12 text-white/10 mb-3" />
            <h3 className="text-sm font-black uppercase tracking-wider text-white">Gestione Check Atleta</h3>
            <p className="text-xs text-white/30 max-w-sm mt-1 mb-4">
              La sezione check ti consentirà di pianificare appuntamenti periodici, monitorare feedback energetici, livelli di stress e ore di sonno dell'atleta.
            </p>
            <span className="text-[10px] font-black uppercase text-[#CCFF00] tracking-wider px-3 py-1 bg-white/5 rounded-full" style={{ color: config.primaryColor }}>
              Prossimamente
            </span>
          </div>
        )}

        {/* TAB: ANTROPOMETRIA */}
        {clientWorkspaceTab === 'antropometria' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Chart Column */}
            <div className="lg:col-span-2 space-y-4">
              {renderChart()}

              {/* Rilevazioni History list */}
              <div className="bg-[#181818] border border-white/5 rounded-2xl p-5 space-y-3">
                <div className="flex justify-between items-center pb-2 border-b border-white/5">
                  <span className="text-[10px] font-black uppercase text-white/50 tracking-wider">Cronologia Rilevazioni</span>
                  <button
                    onClick={onAddMeasurement}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg text-[10px] font-bold transition-all cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    Nuova Rilevazione
                  </button>
                </div>

                {sortedRilevazioni.length === 0 ? (
                  <div className="p-8 text-center text-xs text-white/30 italic">
                    Nessuna misurazione registrata per questo atleta.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-white/5 text-white/40 uppercase tracking-wider font-bold text-[9px]">
                          <th className="p-2">Data</th>
                          <th className="p-2">Peso (kg)</th>
                          <th className="p-2">Vita (cm)</th>
                          <th className="p-2">Torace (cm)</th>
                          <th className="p-2">Braccio (cm)</th>
                          <th className="p-2">Coscia (cm)</th>
                          <th className="p-2">Massa Grassa</th>
                          <th className="p-2 text-right">Azioni</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[...sortedRilevazioni].reverse().map((r) => (
                          <tr key={r.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                            <td className="p-2 font-bold text-white">{r.data.replace(/(\d{4})-(\d{2})-(\d{2})/, '$3/$2/$1')}</td>
                            <td className="p-2 text-white/80">{r.peso} kg</td>
                            <td className="p-2 text-white/80">{r.vita} cm</td>
                            <td className="p-2 text-white/80">{r.torace} cm</td>
                            <td className="p-2 text-white/80">{r.braccio} cm</td>
                            <td className="p-2 text-white/80">{r.coscia} cm</td>
                            <td className="p-2 text-white/80">{r.massaGrassa ? `${r.massaGrassa}%` : '—'}</td>
                            <td className="p-2 text-right">
                              <button
                                onClick={() => onDeleteMeasurement(r.id)}
                                className="p-1 rounded hover:bg-white/5 text-white/20 hover:text-red-400 transition-colors cursor-pointer"
                                title="Elimina rilevazione"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            {/* Anthropometric specifications column */}
            <div className="space-y-4">
              {latestRilevazione && (
                <div className="bg-[#181818] border border-white/5 rounded-2xl p-5 space-y-4">
                  <div className="flex items-center gap-2 border-b border-white/5 pb-3">
                    <Info className="w-4 h-4 text-white/40" />
                    <h3 className="text-xs font-black uppercase tracking-wider text-white">Ultimi Dettagli Corporei</h3>
                  </div>
                  <div className="space-y-3.5 text-xs">
                    <div className="flex justify-between border-b border-white/5 pb-2">
                      <span className="text-white/40 font-medium">Peso:</span>
                      <span className="text-white font-bold">{latestRilevazione.peso} kg</span>
                    </div>
                    <div className="flex justify-between border-b border-white/5 pb-2">
                      <span className="text-white/40 font-medium">Circonferenza Vita:</span>
                      <span className="text-white font-bold">{latestRilevazione.vita} cm</span>
                    </div>
                    <div className="flex justify-between border-b border-white/5 pb-2">
                      <span className="text-white/40 font-medium">Torace:</span>
                      <span className="text-white font-bold">{latestRilevazione.torace} cm</span>
                    </div>
                    <div className="flex justify-between border-b border-white/5 pb-2">
                      <span className="text-white/40 font-medium">Braccio (Contratto):</span>
                      <span className="text-white font-bold">{latestRilevazione.braccio} cm</span>
                    </div>
                    <div className="flex justify-between border-b border-white/5 pb-2">
                      <span className="text-white/40 font-medium">Coscia:</span>
                      <span className="text-white font-bold">{latestRilevazione.coscia} cm</span>
                    </div>
                    <div className="flex justify-between border-b border-white/5 pb-2">
                      <span className="text-white/40 font-medium">Massa Grassa Stimata:</span>
                      <span className="text-white font-bold">{latestRilevazione.massaGrassa ? `${latestRilevazione.massaGrassa}%` : 'N/D'}</span>
                    </div>
                    {latestRilevazione.noteControllo && (
                      <div className="space-y-1 pt-1.5">
                        <span className="text-white/30 text-[9px] font-bold uppercase tracking-wider block">Note Rilevazione:</span>
                        <p className="text-white/70 italic text-[11px] leading-relaxed bg-black/25 p-2 rounded-lg border border-white/5">
                          "{latestRilevazione.noteControllo}"
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Physical limitations alert card */}
              <div className="bg-[#181818] border border-white/5 rounded-2xl p-5 space-y-3">
                <div className="flex items-center gap-1.5 text-xs font-black text-rose-400 uppercase tracking-wider border-b border-white/5 pb-2">
                  <ShieldAlert className="w-4 h-4 text-rose-400" />
                  <span>Limitazioni Fisiche</span>
                </div>
                <p className="text-xs text-white/70 leading-relaxed bg-red-950/5 p-2 rounded-lg border border-red-950/20">
                  {client.limitazioniFisiche || 'Nessuna limitazione o infortunio segnalato per questo atleta.'}
                </p>
              </div>
            </div>
          </div>
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
