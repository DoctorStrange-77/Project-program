/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Client, WorkoutPlan, LogbookEntry, CoachConfig, AnalisiSettings, WorkoutDay, WorkoutExercise } from '../types';
import { 
  Search, Filter, TrendingUp, BarChart3, PieChart, Calendar, Flame, User, Clock, 
  Download, Printer, Settings, AlertCircle, RefreshCw, FileText, ChevronRight, Info, 
  X, ChevronDown, Layers, ArrowRight, Edit3, CheckCircle, MinusCircle, Percent, Save, Plus, ArrowLeftRight
} from 'lucide-react';
import { 
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  ComposedChart, Area, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';
import { 
  runFullAnalysis, 
  compareWeeksData, 
  comparePlansData, 
  generateAdvancedDemoData, 
  AnalysisResults, 
  ComparisonReport 
} from '../utils/analysisCalculations';

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

interface TrainingAnalysisProps {
  config: CoachConfig;
  clients: Client[];
  plans: WorkoutPlan[];
  logbook: LogbookEntry[];
  onAddClient?: (client: Client) => void;
  onAddPlan?: (plan: WorkoutPlan) => void;
  onAddLogs?: (logs: LogbookEntry[]) => void;
  onUpdateConfig?: (config: CoachConfig) => void;
  onShowToast?: (message: string, type: 'success' | 'error' | 'info' | 'warning') => void;
}

export default function TrainingAnalysis({
  config,
  clients,
  plans,
  logbook,
  onAddClient,
  onAddPlan,
  onAddLogs,
  onUpdateConfig,
  onShowToast
}: TrainingAnalysisProps) {
  const isIframe = typeof window !== 'undefined' && window.self !== window.top;
  // Global Tabs
  const [activeTab, setActiveTab] = useState<'dashboard' | 'stimolo' | 'rir' | 'esercizi' | 'confronto' | 'avvisi' | 'report' | 'settings'>('dashboard');

  // Selected Scope Filters
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [selectedPlanId, setSelectedPlanId] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedWeek, setSelectedWeek] = useState<string>('all');
  const [selectedDay, setSelectedDay] = useState<string>('all');
  const [selectedMuscle, setSelectedMuscle] = useState<string>('all');
  const [selectedExercise, setSelectedExercise] = useState<string>('all');
  const [hiddenDistricts, setHiddenDistricts] = useState<string[]>([]);

  // Chart configuration states
  const [volumeMode, setVolumeMode] = useState<'dirette' | 'ponderate'>('dirette');
  const [dataSource, setDataSource] = useState<'programmato' | 'eseguito' | 'confronto'>('confronto');

  // Week Comparison states
  const [compWeek1, setCompWeek1] = useState<number>(1);
  const [compWeek2, setCompWeek2] = useState<number>(2);

  // Plan Comparison states
  const [compPlan1, setCompPlan1] = useState<string>('');
  const [compPlan2, setCompPlan2] = useState<string>('');

  // Selected row for slide-out/detail modal in exercise table
  const [selectedExDetail, setSelectedExDetail] = useState<any | null>(null);

  // Parse custom settings or fall back to default
  const [analysisSettings, setAnalysisSettings] = useState<AnalisiSettings>({
    coeffMuscoliSecondari: 0.5,
    tempoTransizione: 90,
    sogliaVariazioneVolume: 10,
    limiteSerieGiornata: 20,
    intervalliRipetizioni: ["1–5", "6–8", "9–12", "13–15", "16–20", "oltre 20", "isometrico"],
    modalitaCalcoloVolumeLoad: 'completo',
    defaultVisualizzazioneSerie: 'dirette',
    numeroDecimali: 1,
    unitaCarico: 'kg',
    avvisiAttivi: {
      distrettoNonAllenato: true,
      singoloStimolo: true,
      volumeEccessivoGiornata: true,
      durataElevata: true,
      carichiMancanti: true
    }
  });

  // Load state from coach config if exists
  useEffect(() => {
    if (config.analisiSettings) {
      setAnalysisSettings(config.analisiSettings);
      if (config.analisiSettings.defaultVisualizzazioneSerie) {
        setVolumeMode(config.analisiSettings.defaultVisualizzazioneSerie);
      }
    }
  }, [config]);

  // Set default client and plan if available
  useEffect(() => {
    if (clients.length > 0 && !selectedClientId) {
      setSelectedClientId(clients[0].id);
    }
  }, [clients, selectedClientId]);

  useEffect(() => {
    if (selectedClientId) {
      const clientPlans = plans.filter(p => p.clienteId === selectedClientId);
      if (clientPlans.length > 0) {
        setSelectedPlanId(clientPlans[0].id);
      } else {
        setSelectedPlanId('');
      }
    }
  }, [selectedClientId, plans]);

  // Handle setting updates
  const saveSettings = (newSettings: AnalisiSettings) => {
    setAnalysisSettings(newSettings);
    if (onUpdateConfig) {
      onUpdateConfig({
        ...config,
        analisiSettings: newSettings
      });
    }
    if (onShowToast) {
      onShowToast('Impostazioni di analisi salvate con successo!', 'success');
    }
  };

  // Demo Injection logic
  const handleInjectDemoData = () => {
    const demo = generateAdvancedDemoData();
    
    // Add client if not already present
    if (onAddClient && !clients.some(c => c.id === demo.client.id)) {
      onAddClient(demo.client);
    }
    
    // Add plan if not already present
    if (onAddPlan && !plans.some(p => p.id === demo.plan.id)) {
      onAddPlan(demo.plan);
    }

    // Add logs
    if (onAddLogs) {
      // Filter out existing logs for this demo client to avoid duplication
      const existingLogsCount = logbook.filter(l => l.clienteId === demo.client.id).length;
      if (existingLogsCount === 0) {
        onAddLogs(demo.logbook);
      }
    }

    // Set active
    setSelectedClientId(demo.client.id);
    setSelectedPlanId(demo.plan.id);
    setSelectedWeek('all');
    setSelectedDay('all');
    setSelectedMuscle('all');
    setSelectedExercise('all');
    setActiveTab('dashboard');

    if (onShowToast) {
      onShowToast('Dati demo professionali di 6 settimane caricati con successo!', 'success');
    }
  };

  // Calculate full analysis results using the helper engine
  const analysis: AnalysisResults = runFullAnalysis(
    clients,
    plans,
    logbook,
    {
      clientId: selectedClientId,
      planId: selectedPlanId,
      statusFilter: selectedStatus,
      weekIndex: selectedWeek,
      dayId: selectedDay,
      muscle: selectedMuscle,
      exerciseName: selectedExercise
    },
    analysisSettings
  );

  const activeDistricts = React.useMemo(() => {
    if (!analysis.weeklyDistrictVolume || analysis.weeklyDistrictVolume.length === 0) return [];
    const districtsSet = new Set<string>();
    analysis.weeklyDistrictVolume.forEach(row => {
      Object.keys(row).forEach(key => {
        if (key !== 'week' && row[key] > 0) {
          districtsSet.add(key);
        }
      });
    });
    return Array.from(districtsSet);
  }, [analysis.weeklyDistrictVolume]);

  const selectedClient = clients.find(c => c.id === selectedClientId);
  const selectedPlan = plans.find(p => p.id === selectedPlanId);

  // Week and Day lists for filter dropdowns
  const availableWeeks = selectedPlan 
    ? Array.from({ length: selectedPlan.durataSettimane || 1 }, (_, i) => i + 1)
    : [];

  const availableDays = selectedPlan 
    ? Array.from(new Set(selectedPlan.giornate?.map(d => d.nome) || []))
    : [];

  const availableExercises = selectedPlan 
    ? Array.from(new Set(selectedPlan.giornate?.flatMap(d => d.esercizi.map(e => e.nome)) || []))
    : [];

  // Exporters
  const exportCSV = () => {
    if (!analysis || analysis.exerciseTable.length === 0) {
      if (onShowToast) onShowToast('Nessun dato da esportare.', 'error');
      return;
    }

    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Esercizio;Distretto;Serie Totali;Ripetizioni;Carico Medio;Carico Max;Volume Load;RIR Medio;Migliore Prestazione\n";

    analysis.exerciseTable.forEach(row => {
      csvContent += `"${row.nome}";"${row.distretto}";${row.serieTotali};${row.repsTotali};${row.caricoMedio};${row.caricoMassimo};${row.volumeLoad};${row.rirMedio};"${row.migliorePrestazione}"\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Analisi_Esercizi_${selectedClient?.nome || 'Allenamento'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    if (onShowToast) onShowToast('File CSV scaricato con successo!', 'success');
  };

  const exportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(analysis, null, 2));
    const link = document.createElement("a");
    link.setAttribute("href", dataStr);
    link.setAttribute("download", `Analisi_Allenamento_${selectedClient?.nome || 'Allenamento'}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    if (onShowToast) onShowToast('File JSON scaricato con successo!', 'success');
  };

  // Toggle ignoring alert
  const handleToggleIgnoreAlert = (alertId: string) => {
    const key = `alert_ignore_${selectedPlanId}_${alertId}`;
    const curVal = localStorage.getItem(key) === 'true';
    localStorage.setItem(key, (!curVal).toString());
    if (onShowToast) onShowToast(curVal ? 'Avviso riattivato' : 'Avviso ignorato', 'info');
  };

  // Save note for alert
  const handleSaveAlertNote = (alertId: string, noteText: string) => {
    const key = `alert_note_${selectedPlanId}_${alertId}`;
    localStorage.setItem(key, noteText);
    if (onShowToast) onShowToast('Nota salvata per l\'avviso', 'success');
  };

  return (
    <div id="training-analysis-main" className="space-y-6 text-gray-100">
      
      {/* Banner / Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-gray-900 border border-gray-800 p-6 rounded-2xl shadow-xl gap-4">
        <div>
          <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-200">
            Analisi Allenamento & Programmazione
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Strumenti biomeccanici e fisiologici di monitoraggio e periodizzazione dei carichi.
          </p>
        </div>
        <div className="flex gap-3">
          <button 
            id="inject-demo-btn"
            onClick={handleInjectDemoData}
            className="flex items-center gap-2 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-gray-900 font-semibold px-4 py-2.5 rounded-xl transition shadow-lg text-sm"
          >
            <Flame className="w-4 h-4" />
            Inietta 6 Settimane Demo
          </button>
          
          <button 
            id="print-analysis-btn"
            onClick={() => window.print()}
            className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-gray-100 px-4 py-2.5 rounded-xl transition border border-gray-700 text-sm"
          >
            <Printer className="w-4 h-4" />
            Stampa Report
          </button>
        </div>
      </div>

      {/* FILTERS CONTROL PANEL */}
      <div id="filters-panel" className="bg-gray-900/80 backdrop-blur-md border border-gray-800/80 p-5 rounded-2xl shadow-lg grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        
        {/* Client Selection */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-gray-400 flex items-center gap-1">
            <User className="w-3 h-3" /> CLIENTE
          </label>
          <select 
            id="filter-client"
            value={selectedClientId} 
            onChange={(e) => setSelectedClientId(e.target.value)}
            className="bg-gray-800/50 border border-gray-700 text-sm rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500 transition"
          >
            {clients.map(c => (
              <option key={c.id} value={c.id} className="bg-gray-900 text-white">{c.nome} {c.cognome}</option>
            ))}
            {clients.length === 0 && <option value="" className="bg-gray-900 text-white">Nessun cliente presente</option>}
          </select>
        </div>

        {/* Plan Selection */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-gray-400 flex items-center gap-1">
            <FileText className="w-3 h-3" /> PROGRAMMA
          </label>
          <select 
            id="filter-plan"
            value={selectedPlanId} 
            onChange={(e) => setSelectedPlanId(e.target.value)}
            className="bg-gray-800/50 border border-gray-700 text-sm rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500 transition"
          >
            {plans.filter(p => p.clienteId === selectedClientId).map(p => (
              <option key={p.id} value={p.id}>{p.nome} ({p.status})</option>
            ))}
            {plans.filter(p => p.clienteId === selectedClientId).length === 0 && (
              <option value="">Nessun programma</option>
            )}
          </select>
        </div>

        {/* Week Selection */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-gray-400 flex items-center gap-1">
            <Calendar className="w-3 h-3" /> SETTIMANA
          </label>
          <select 
            id="filter-week"
            value={selectedWeek} 
            onChange={(e) => setSelectedWeek(e.target.value)}
            className="bg-gray-800/50 border border-gray-700 text-sm rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500 transition"
          >
            <option value="all">Tutte le settimane ({availableWeeks.length})</option>
            {availableWeeks.map(w => (
              <option key={w} value={w}>Settimana {w}</option>
            ))}
          </select>
        </div>

        {/* Day Selection */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-gray-400 flex items-center gap-1">
            <Clock className="w-3 h-3" /> GIORNATA
          </label>
          <select 
            id="filter-day"
            value={selectedDay} 
            onChange={(e) => setSelectedDay(e.target.value)}
            className="bg-gray-800/50 border border-gray-700 text-sm rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500 transition"
          >
            <option value="all">Tutte le giornate</option>
            {availableDays.map((dName, idx) => (
              <option key={idx} value={dName}>{dName}</option>
            ))}
          </select>
        </div>

        {/* Muscle Selection */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-gray-400 flex items-center gap-1">
            <Layers className="w-3 h-3" /> DISTRETTO
          </label>
          <select 
            id="filter-muscle"
            value={selectedMuscle} 
            onChange={(e) => setSelectedMuscle(e.target.value)}
            className="bg-gray-800/50 border border-gray-700 text-sm rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500 transition"
          >
            <option value="all">Tutti i distretti (14)</option>
            <option value="Pettorali">Pettorali</option>
            <option value="Dorso">Dorso</option>
            <option value="Deltoidi anteriori">Deltoidi anteriori</option>
            <option value="Deltoidi laterali">Deltoidi laterali</option>
            <option value="Deltoidi posteriori">Deltoidi posteriori</option>
            <option value="Spalle">Spalle (Generico)</option>
            <option value="Bicipiti">Bicipiti</option>
            <option value="Tricipiti">Tricipiti</option>
            <option value="Quadricipiti">Quadricipiti</option>
            <option value="Femorali">Femorali</option>
            <option value="Glutei">Glutei</option>
            <option value="Adduttori">Adduttori</option>
            <option value="Abduttori">Abduttori</option>
            <option value="Polpacci">Polpacci</option>
            <option value="Addome">Addome</option>
          </select>
        </div>

      </div>

      {/* DASHBOARD TAB SELECTORS */}
      <div id="tabs-navigation" className="flex border-b border-gray-800 gap-1 overflow-x-auto pb-px">
        {[
          { id: 'dashboard', label: 'Panoramica', icon: TrendingUp },
          { id: 'stimolo', label: 'Stimolo & Frequenza', icon: BarChart3 },
          { id: 'rir', label: 'RIR & Ripetizioni', icon: PieChart },
          { id: 'esercizi', label: 'Analisi Esercizio', icon: Search },
          { id: 'confronto', label: 'Confronto', icon: ArrowLeftRight },
          { id: 'avvisi', label: 'Avvisi & Alunni', icon: AlertCircle },
          { id: 'report', label: 'Report & Export', icon: FileText },
          { id: 'settings', label: 'Configuratore', icon: Settings },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              id={`tab-btn-${tab.id}`}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-5 py-3.5 text-sm font-semibold transition border-b-2 whitespace-nowrap ${
                isActive 
                  ? 'border-emerald-500 text-emerald-400 bg-emerald-500/5' 
                  : 'border-transparent text-gray-400 hover:text-white hover:border-gray-700'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
              {tab.id === 'avvisi' && analysis.alerts.filter(a => !a.ignored).length > 0 && (
                <span className="bg-red-500 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full font-bold ml-1 animate-pulse">
                  {analysis.alerts.filter(a => !a.ignored).length}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* MAIN CONTENT ACCORDING TO SELECTED TAB */}
      <div className="transition-all duration-300">
        
        {/* TAB 1: DASHBOARD OVERVIEW */}
        {activeTab === 'dashboard' && (
          <div id="dashboard-view" className="space-y-6">
            
            {/* STATS SUMMARY GRID */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              
              <div className="bg-gray-900 border border-gray-800 p-4 rounded-2xl flex flex-col justify-between">
                <span className="text-xs text-gray-400 font-semibold tracking-wide">ALLENAMENTI</span>
                <div className="flex items-baseline mt-2 gap-2">
                  <span className="text-2xl font-bold text-white">{analysis.totalWorkoutsExecuted}</span>
                  <span className="text-xs text-gray-500">di {analysis.totalWorkoutsScheduled} prog.</span>
                </div>
                <div className="text-[10px] text-emerald-400 font-medium mt-1">Aderenza: {analysis.aderenzaAllenamenti}%</div>
              </div>

              <div className="bg-gray-900 border border-gray-800 p-4 rounded-2xl flex flex-col justify-between">
                <span className="text-xs text-gray-400 font-semibold tracking-wide">SERIE REALI</span>
                <div className="flex items-baseline mt-2 gap-2">
                  <span className="text-2xl font-bold text-white">{analysis.totalSetsExecuted}</span>
                  <span className="text-xs text-gray-500">di {analysis.totalSetsScheduled} prog.</span>
                </div>
                <div className="text-[10px] text-teal-400 font-medium mt-1">Aderenza Serie: {analysis.aderenzaSerie}%</div>
              </div>

              <div className="bg-gray-900 border border-gray-800 p-4 rounded-2xl flex flex-col justify-between">
                <span className="text-xs text-gray-400 font-semibold tracking-wide">COMPLETAMENTO</span>
                <div className="text-2xl font-bold text-emerald-400 mt-2">{analysis.completamentoPercent}%</div>
                <div className="w-full bg-gray-800 rounded-full h-1.5 mt-2">
                  <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: `${analysis.completamentoPercent}%` }}></div>
                </div>
              </div>

              <div className="bg-gray-900 border border-gray-800 p-4 rounded-2xl flex flex-col justify-between">
                <span className="text-xs text-gray-400 font-semibold tracking-wide">VOLUME LOAD</span>
                <div className="flex flex-col mt-2">
                  <span className="text-lg font-bold text-white truncate">
                    {analysis.totalVolumeLoadExecuted.toLocaleString()} {analysisSettings.unitaCarico}
                  </span>
                  <span className="text-[10px] text-gray-500">Prog: {analysis.totalVolumeLoadScheduled.toLocaleString()}</span>
                </div>
                <div className="text-[10px] text-gray-400 mt-1">Sforzo reale totale</div>
              </div>

              <div className="bg-gray-900 border border-gray-800 p-4 rounded-2xl flex flex-col justify-between">
                <span className="text-xs text-gray-400 font-semibold tracking-wide">RIR MEDIO</span>
                <div className="flex items-baseline mt-2 gap-2">
                  <span className="text-2xl font-bold text-white">{analysis.avgRirExecuted}</span>
                  <span className="text-xs text-gray-500">Prog: {analysis.avgRirScheduled}</span>
                </div>
                <div className="text-[10px] text-amber-400 font-medium mt-1">
                  Intensità reale: {analysis.avgRirExecuted <= 1 ? 'Elevata' : 'Moderata'}
                </div>
              </div>

              <div className="bg-gray-900 border border-gray-800 p-4 rounded-2xl flex flex-col justify-between">
                <span className="text-xs text-gray-400 font-semibold tracking-wide">DURATA MEDIA</span>
                <div className="flex items-baseline mt-2 gap-2">
                  <span className="text-2xl font-bold text-white">{analysis.avgDurationExecuted}m</span>
                  <span className="text-xs text-gray-500">Stima: {analysis.avgDurationScheduled}m</span>
                </div>
                <div className="text-[10px] text-gray-400 mt-1">Recupero medio: {analysis.avgRecuperoScheduled}s</div>
              </div>

            </div>

            {/* TWO COLUMN CHARTS SECTION */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Chart 1: Volume Stimolo per Muscle Group - Multi-week Line Progressions */}
              <div className="bg-gray-900 border border-gray-800 p-6 rounded-2xl shadow-lg lg:col-span-2">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                  <div>
                    <h3 className="font-bold text-gray-100 text-base">Stimolo Muscolare (Progressione Settimanale Serie)</h3>
                    <p className="text-xs text-gray-400">Andamento delle serie allenanti programmate per ciascun distretto muscolare attraverso tutte le settimane.</p>
                  </div>
                  <div className="text-[10px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-2.5 py-1 rounded-full font-semibold shrink-0">
                    Clicca sui distretti per mostrare/nascondere
                  </div>
                </div>

                {/* Custom Interactive Legend (Pills) */}
                <div className="flex flex-wrap gap-2 mb-6 max-h-36 overflow-y-auto pr-1">
                  {activeDistricts.map(dist => {
                    const color = DISTRICT_COLORS[dist] || '#8884d8';
                    const isHidden = hiddenDistricts.includes(dist);
                    return (
                      <button
                        key={dist}
                        onClick={() => {
                          if (isHidden) {
                            setHiddenDistricts(prev => prev.filter(d => d !== dist));
                          } else {
                            setHiddenDistricts(prev => [...prev, dist]);
                          }
                        }}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all border cursor-pointer ${
                          isHidden
                            ? 'bg-neutral-900/40 border-neutral-800 text-neutral-500 hover:text-neutral-400'
                            : 'bg-neutral-950 hover:bg-neutral-900 border-white/10 text-white shadow-sm'
                        }`}
                        style={!isHidden ? { borderLeft: `4px solid ${color}` } : undefined}
                      >
                        <span 
                          className="w-2.5 h-2.5 rounded-full shrink-0" 
                          style={{ backgroundColor: isHidden ? '#444' : color }}
                        />
                        <span className="uppercase tracking-wider text-[10px]">{dist}</span>
                      </button>
                    );
                  })}
                </div>

                <div className="h-96 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={analysis.weeklyDistrictVolume} margin={{ top: 10, right: 15, left: -20, bottom: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                      <XAxis dataKey="week" stroke="#999" tick={{ fill: '#999', fontSize: 11, fontWeight: 'bold' }} />
                      <YAxis stroke="#999" tick={{ fill: '#999', fontSize: 11 }} allowDecimals={false} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#111', borderColor: '#333', borderRadius: '12px', color: '#fff' }}
                        formatter={(value: any, name: string) => [
                          `${value} serie`, 
                          name
                        ]}
                      />
                      {activeDistricts.map(dist => {
                        if (hiddenDistricts.includes(dist)) return null;
                        const color = DISTRICT_COLORS[dist] || '#8884d8';
                        return (
                          <Line
                            key={dist}
                            type="monotone"
                            dataKey={dist}
                            name={dist}
                            stroke={color}
                            strokeWidth={3}
                            dot={{ r: 4, fill: color, stroke: '#111', strokeWidth: 1.5 }}
                            activeDot={{ r: 6, stroke: '#111', strokeWidth: 2 }}
                          />
                        );
                      })}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Chart 2: Weekly Progression Trends */}
              <div className="bg-gray-900 border border-gray-800 p-5 rounded-2xl shadow-lg">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h3 className="font-bold text-gray-100 text-base">Progressione Settimanale</h3>
                    <p className="text-xs text-gray-400">Andamento del carico di lavoro e del volume nel tempo.</p>
                  </div>
                  <div className="flex bg-gray-800 p-1 rounded-lg text-xs">
                    <button 
                      onClick={() => setDataSource('confronto')}
                      className={`px-2.5 py-1 rounded-md transition ${dataSource === 'confronto' ? 'bg-emerald-500 text-gray-900 font-semibold' : 'text-gray-400 hover:text-white'}`}
                    >
                      Tutto
                    </button>
                    <button 
                      onClick={() => setDataSource('eseguito')}
                      className={`px-2.5 py-1 rounded-md transition ${dataSource === 'eseguito' ? 'bg-emerald-500 text-gray-900 font-semibold' : 'text-gray-400 hover:text-white'}`}
                    >
                      Eseguito
                    </button>
                  </div>
                </div>

                <div className="h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={analysis.weeklyTrend} margin={{ top: 10, right: 10, left: -10, bottom: 20 }}>
                      <defs>
                        <linearGradient id="colorProg" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0.0}/>
                        </linearGradient>
                        <linearGradient id="colorReal" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.25}/>
                          <stop offset="95%" stopColor="#38bdf8" stopOpacity={0.0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                      <XAxis dataKey="week" stroke="#999" tick={{ fill: '#999', fontSize: 10 }} />
                      <YAxis 
                        yAxisId="left" 
                        stroke="#10b981" 
                        tickFormatter={(v) => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v}
                        tick={{ fill: '#999', fontSize: 10 }} 
                        label={{ value: 'Volume Carichi (kg)', angle: -90, position: 'insideLeft', fill: '#10b981', fontSize: 10, offset: 0 }}
                      />
                      <YAxis 
                        yAxisId="right" 
                        orientation="right" 
                        stroke="#a3e635" 
                        domain={[0, 100]}
                        tickFormatter={(v) => `${v}%`}
                        tick={{ fill: '#999', fontSize: 10 }} 
                        label={{ value: 'Completamento (%)', angle: 90, position: 'insideRight', fill: '#a3e635', fontSize: 10, offset: 0 }}
                      />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#111', borderColor: '#333', borderRadius: '12px' }} 
                        formatter={(value: any, name: string) => {
                          if (name.includes('%')) return [`${value}%`, name];
                          return [`${Number(value).toLocaleString()} kg`, name];
                        }}
                      />
                      <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: 11 }} />
                      
                      {dataSource !== 'eseguito' && (
                        <Area yAxisId="left" type="monotone" dataKey="volumeLoad" name="Vol. Programmato (kg)" stroke="#10b981" strokeWidth={2} fill="url(#colorProg)" activeDot={{ r: 5 }} />
                      )}
                      <Area yAxisId="left" type="monotone" dataKey="volumeLoadExecuted" name="Vol. Eseguito (kg)" stroke="#38bdf8" strokeWidth={2} fill="url(#colorReal)" activeDot={{ r: 5 }} />
                      <Line yAxisId="right" type="monotone" dataKey="completion" name="Tasso Completamento %" stroke="#a3e635" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} strokeDasharray="3 3" />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Chart 3: Muscle Stimulus Radar Chart */}
              <div className="bg-gray-900 border border-gray-800 p-5 rounded-2xl shadow-lg">
                <div>
                  <h3 className="font-bold text-gray-100 text-base">Profilo Stimolo Muscolare (Radar)</h3>
                  <p className="text-xs text-gray-400">Distribuzione delle serie programmate ed eseguite per ciascun distretto muscolare.</p>
                </div>

                <div className="h-80 w-full flex items-center justify-center mt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="75%" data={analysis.volumePerDistrict}>
                      <PolarGrid stroke="#222" />
                      <PolarAngleAxis dataKey="district" tick={{ fill: '#999', fontSize: 9, fontWeight: 'bold' }} />
                      <PolarRadiusAxis angle={30} domain={[0, 'auto']} tick={{ fill: '#444', fontSize: 8 }} />
                      <Radar name="Programmate" dataKey="scheduled" stroke="#10b981" fill="#10b981" fillOpacity={0.2} />
                      <Radar name="Eseguite" dataKey="executed" stroke="#38bdf8" fill="#38bdf8" fillOpacity={0.15} />
                      <Tooltip contentStyle={{ backgroundColor: '#111', borderColor: '#333', borderRadius: '12px', color: '#fff' }} />
                      <Legend verticalAlign="bottom" height={24} wrapperStyle={{ fontSize: 9 }} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>

            </div>

            {/* ADHERENCE AND COMPLETION ANALYSIS ACCORDING TO WEEKS */}
            <div className="bg-gray-900 border border-gray-800 p-5 rounded-2xl shadow-lg">
              <h3 className="font-bold text-gray-100 text-base mb-4">Stato di Avanzamento e Completamento</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {analysis.weeklyTrend.map((wt, i) => (
                  <div key={i} className="bg-gray-800/40 p-4 rounded-xl border border-gray-700/50 flex flex-col justify-between">
                    <span className="text-xs font-bold text-gray-300">{wt.week}</span>
                    <div className="flex justify-between items-baseline mt-2">
                      <span className="text-xl font-bold text-white">{wt.completion}%</span>
                      <span className="text-xs text-gray-400">{wt.setsExecuted} / {wt.sets} serie</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-1 mt-2">
                      <div 
                        className={`h-1 rounded-full ${wt.completion >= 80 ? 'bg-emerald-500' : wt.completion >= 50 ? 'bg-amber-500' : 'bg-red-500'}`} 
                        style={{ width: `${wt.completion}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* TAB 2: STIMOLO & FREQUENZA */}
        {activeTab === 'stimolo' && (
          <div id="stimolo-view" className="space-y-6">
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Left Column: Heatmap Grid of stimuli */}
              <div className="bg-gray-900 border border-gray-800 p-5 rounded-2xl shadow-lg lg:col-span-2">
                <h3 className="font-bold text-gray-100 text-base mb-1">Mappa di Distribuzione dello Stimolo</h3>
                <p className="text-xs text-gray-400 mb-4">Densità di lavoro (numero di serie) per ogni distretto muscolare nelle diverse giornate.</p>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-gray-800">
                        <th className="py-3 text-xs font-bold text-gray-400">DISTRETTO</th>
                        <th className="py-3 text-xs font-bold text-gray-400 text-center">GIORNO A</th>
                        <th className="py-3 text-xs font-bold text-gray-400 text-center">GIORNO B</th>
                        <th className="py-3 text-xs font-bold text-gray-400 text-center">GIORNO C</th>
                        <th className="py-3 text-xs font-bold text-gray-400 text-center">GIORNO D</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800/40">
                      {analysis.heatmap.map((row, i) => (
                        <tr key={i} className="hover:bg-gray-800/20">
                          <td className="py-3 font-semibold text-sm text-gray-200">{row.district}</td>
                          {['A: Spinta', 'B: Trazione', 'C: Gambe', 'D: Focus'].map((colKey) => {
                            const val = row[colKey] || 0;
                            // Intensity styles based on series volume
                            const bgStyle = val > 8 
                              ? 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-300' 
                              : val > 4 
                                ? 'bg-emerald-600/15 border border-emerald-500/20 text-emerald-400' 
                                : val > 0 
                                  ? 'bg-emerald-700/10 border border-emerald-500/10 text-emerald-500' 
                                  : 'text-gray-600';
                            return (
                              <td key={colKey} className="py-2 text-center text-xs">
                                <div className={`inline-block px-3 py-1 rounded-lg font-bold min-w-10 ${bgStyle}`}>
                                  {val || '-'}
                                </div>
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Right Column: Stimulus Frequency Card */}
              <div className="bg-gray-900 border border-gray-800 p-5 rounded-2xl shadow-lg flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-gray-100 text-base mb-1">Frequenza di Stimolo</h3>
                  <p className="text-xs text-gray-400 mb-4">Analisi fisiologica della multifrequenza e dei tempi di recupero ideali per muscolo.</p>
                  
                  <div className="space-y-4 overflow-y-auto max-h-96">
                    {analysis.frequency.map((item, idx) => (
                      <div key={idx} className="bg-gray-800/30 border border-gray-800 p-3 rounded-xl flex flex-col gap-2">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-sm text-gray-100">{item.district}</span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            item.sedute >= 2 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
                          }`}>
                            {item.sedute}x a settimana
                          </span>
                        </div>
                        <div className="text-xs text-gray-400 flex flex-wrap gap-1">
                          Giorni stimolo: {item.daysActive.map(d => (
                            <span key={d} className="bg-gray-800 px-1.5 py-0.5 rounded text-gray-300 font-semibold">{d}</span>
                          ))}
                        </div>
                        <div className="flex justify-between text-[11px] text-gray-500">
                          <span>Distanza media: ~{item.giorniDistanza} giorni</span>
                          <span>Fisiologia: {item.sedute >= 2 ? 'Ottimizzata' : 'Monofrequenza'}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-gray-800 text-[10px] text-gray-500 flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                  <span>La multifrequenza (2-3x) favorisce una sintesi proteica costante rispetto alla monofrequenza classica.</span>
                </div>
              </div>

            </div>

            {/* Daily volume stacked bars */}
            <div className="bg-gray-900 border border-gray-800 p-5 rounded-2xl shadow-lg">
              <h3 className="font-bold text-gray-100 text-base mb-1">Volumi e Ripartizioni Giornaliere</h3>
              <p className="text-xs text-gray-400 mb-5">Ripartizione del volume totale e dei tempi di recupero stimati per sessione.</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {analysis.dailyDistribution.map((day, dIdx) => (
                  <div key={dIdx} className="bg-gray-800/30 border border-gray-700/40 p-4 rounded-xl flex flex-col justify-between">
                    <div>
                      <h4 className="font-bold text-sm text-emerald-400 border-b border-gray-800 pb-2 mb-2">{day.dayName}</h4>
                      <div className="space-y-1 text-xs text-gray-300">
                        <div className="flex justify-between">
                          <span>Esercizi totali:</span>
                          <span className="font-semibold text-white">{day.totalExercises}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Serie totali:</span>
                          <span className="font-semibold text-white">{day.totalSets}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Recupero medio:</span>
                          <span className="font-semibold text-white">{day.avgRecupero}s</span>
                        </div>
                      </div>

                      {/* Mini stacked chart breakdown */}
                      <div className="mt-4 pt-3 border-t border-gray-800/80">
                        <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block mb-2">Composizione distretti:</span>
                        <div className="space-y-2 max-h-36 overflow-y-auto">
                          {Object.keys(day).map(key => {
                            if (['dayName', 'totalSets', 'totalExercises', 'duration', 'avgRecupero'].includes(key)) return null;
                            const val = day[key];
                            const pct = Math.round((val / day.totalSets) * 100);
                            return (
                              <div key={key} className="flex items-center gap-2 text-xs">
                                <span className="text-[10px] text-gray-300 w-16 truncate">{key}</span>
                                <div className="flex-1 bg-gray-700 rounded-full h-1.5 overflow-hidden">
                                  <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: `${pct}%` }}></div>
                                </div>
                                <span className="text-[10px] text-gray-500 w-6 text-right">{val}s.</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-gray-800 flex justify-between items-center text-[11px] text-gray-400">
                      <span>Durata stimata:</span>
                      <span className="font-bold text-white flex items-center gap-1">
                        <Clock className="w-3 h-3 text-emerald-400" /> {day.duration} min
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* TAB 3: RIR & RIPETIZIONI */}
        {activeTab === 'rir' && (
          <div id="rir-view" className="space-y-6">
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* RIR distribution chart */}
              <div className="bg-gray-900 border border-gray-800 p-5 rounded-2xl shadow-lg">
                <h3 className="font-bold text-gray-100 text-base mb-1">Distribuzione dell'Intensità (RIR)</h3>
                <p className="text-xs text-gray-400 mb-6">Confronto tra RIR programmato e RIR realmente riscontrato nel logbook.</p>

                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analysis.rirDistribution} margin={{ top: 10, right: 10, left: -20, bottom: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                      <XAxis dataKey="rir" stroke="#999" tick={{ fill: '#999', fontSize: 10 }} />
                      <YAxis stroke="#999" tick={{ fill: '#999', fontSize: 10 }} />
                      <Tooltip contentStyle={{ backgroundColor: '#111', borderColor: '#333', borderRadius: '12px' }} />
                      <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: 11 }} />
                      <Bar dataKey="scheduledSets" name="Serie Programmate" fill="#10b981" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="executedSets" name="Serie Eseguite (Log)" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Rep range distribution chart */}
              <div className="bg-gray-900 border border-gray-800 p-5 rounded-2xl shadow-lg flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-gray-100 text-base mb-1">Ripartizione Target di Ripetizioni</h3>
                  <p className="text-xs text-gray-400 mb-6">Percentuale di stimolo divisa per range di ripetizioni / profili di forza.</p>
                  
                  <div className="space-y-4">
                    {analysis.repsDistribution.map((row, idx) => (
                      <div key={idx} className="bg-gray-800/30 p-3 rounded-xl border border-gray-800/80 flex flex-col gap-1.5">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-bold text-emerald-400">{row.range} reps ({row.percentage}%)</span>
                          <span className="text-gray-400">{row.sets} serie totali</span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-1.5">
                          <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: `${row.percentage}%` }}></div>
                        </div>
                        <div className="text-[10px] text-gray-500 truncate mt-1">
                          Muscoli: {row.majorDistricts.join(', ')} | Esercizi: {row.majorExercises.join(', ')}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-gray-800 text-[10px] text-gray-500 flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                  <span>I range 1-5 favoriscono la forza massimale, 6-12 l'ipertrofia e oltre 15 la resistenza metabolica.</span>
                </div>
              </div>

            </div>

            {/* Techniques and intensity panel */}
            <div className="bg-gray-900 border border-gray-800 p-5 rounded-2xl shadow-lg">
              <h3 className="font-bold text-gray-100 text-base mb-1">Tecniche d'Intensità Utilizzate</h3>
              <p className="text-xs text-gray-400 mb-4">Panoramica dell'impiego di tecniche speciali per incrementare l'overload.</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {analysis.intensityTechniques.map((tech, idx) => (
                  <div key={idx} className="bg-gray-800/35 border border-gray-700/30 p-4 rounded-xl flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-baseline mb-2">
                        <h4 className="font-bold text-sm text-gray-200">{tech.technique}</h4>
                        <span className="text-xs text-emerald-400 font-bold">{tech.percentage}% degli es.</span>
                      </div>
                      <div className="text-xs text-gray-400">
                        Inserito in {tech.exercisesCount} esercizi ({tech.setsCount} serie totali).
                      </div>
                    </div>
                    {tech.districts.length > 0 && (
                      <div className="text-[10px] text-gray-500 mt-2 truncate">
                        Muscoli: {tech.districts.join(', ')}
                      </div>
                    )}
                  </div>
                ))}
                {analysis.intensityTechniques.length === 0 && (
                  <div className="col-span-full py-8 text-center text-xs text-gray-500">
                    Nessuna tecnica d'intensità programmata o rilevata (es. Top set, Drop set, Myo-reps, ecc.).
                  </div>
                )}
              </div>
            </div>

          </div>
        )}

        {/* TAB 4: ANALISI ESERCIZI (TABELLA COMPLETA) */}
        {activeTab === 'esercizi' && (
          <div id="esercizi-view" className="space-y-6">
            
            <div className="bg-gray-900 border border-gray-800 p-5 rounded-2xl shadow-lg">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                <div>
                  <h3 className="font-bold text-gray-100 text-base">Analisi Prestazione per Singolo Esercizio</h3>
                  <p className="text-xs text-gray-400">Archivio metrico di carichi, volume totale sollevato, progressione di RIR e record.</p>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={exportCSV}
                    className="flex items-center gap-1.5 bg-gray-800 hover:bg-gray-700 text-gray-100 text-xs px-3 py-2 rounded-xl transition border border-gray-700"
                  >
                    <Download className="w-3.5 h-3.5" /> Esporta CSV
                  </button>
                  <button 
                    onClick={exportJSON}
                    className="flex items-center gap-1.5 bg-gray-800 hover:bg-gray-700 text-gray-100 text-xs px-3 py-2 rounded-xl transition border border-gray-700"
                  >
                    <Download className="w-3.5 h-3.5" /> Esporta JSON
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-gray-800 text-xs text-gray-400 font-bold uppercase">
                      <th className="py-3 px-2">ESERCIZIO</th>
                      <th className="py-3 px-2">DISTRETTO</th>
                      <th className="py-3 px-2 text-center">APPARIZIONI</th>
                      <th className="py-3 px-2 text-center">SERIE TOT</th>
                      <th className="py-3 px-2 text-center">CARICO MEDIO</th>
                      <th className="py-3 px-2 text-center">CARICO MAX</th>
                      <th className="py-3 px-2 text-center">VOLUME LOAD</th>
                      <th className="py-3 px-2 text-center">RIR MEDIO</th>
                      <th className="py-3 px-2 text-right">MIGLIORE SET</th>
                      <th className="py-3 px-2 text-center">STORICO</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800/40 text-sm">
                    {analysis.exerciseTable.map((row, idx) => (
                      <tr key={idx} className="hover:bg-gray-800/30 transition">
                        <td className="py-3 px-2 font-bold text-gray-100">{row.nome}</td>
                        <td className="py-3 px-2 text-xs text-gray-300">
                          <span className="bg-gray-800 px-2 py-0.5 rounded text-gray-400 font-semibold">{row.distretto}</span>
                        </td>
                        <td className="py-3 px-2 text-center text-gray-300">{row.apparizioni}</td>
                        <td className="py-3 px-2 text-center text-gray-300">{row.serieTotali}</td>
                        <td className="py-3 px-2 text-center font-mono font-bold text-emerald-400">
                          {row.caricoMedio > 0 ? `${row.caricoMedio}${analysisSettings.unitaCarico}` : '-'}
                        </td>
                        <td className="py-3 px-2 text-center font-mono font-bold text-white">
                          {row.caricoMassimo > 0 ? `${row.caricoMassimo}${analysisSettings.unitaCarico}` : '-'}
                        </td>
                        <td className="py-3 px-2 text-center text-gray-400 font-mono">
                          {row.volumeLoad > 0 ? `${row.volumeLoad.toLocaleString()}${analysisSettings.unitaCarico}` : '-'}
                        </td>
                        <td className="py-3 px-2 text-center text-amber-400 font-semibold">{row.rirMedio ?? '-'}</td>
                        <td className="py-3 px-2 text-right text-xs font-mono text-emerald-300 font-semibold">{row.migliorePrestazione}</td>
                        <td className="py-3 px-2 text-center">
                          <button
                            onClick={() => setSelectedExDetail(row)}
                            className="text-emerald-400 hover:text-emerald-300 font-semibold text-xs flex items-center justify-center mx-auto gap-0.5"
                          >
                            Grafico <ChevronRight className="w-3 h-3" />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {analysis.exerciseTable.length === 0 && (
                      <tr>
                        <td colSpan={10} className="py-8 text-center text-gray-500 text-xs">
                          Nessun esercizio presente o registrato per questo piano.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* EXERCISE GRAPH HISTORY MODAL / SLIDE-OUT */}
            {selectedExDetail && (
              <div id="exercise-history-modal" className="bg-gray-900 border border-gray-800 p-5 rounded-2xl shadow-xl space-y-4">
                <div className="flex justify-between items-center border-b border-gray-800 pb-3">
                  <div>
                    <h3 className="font-bold text-gray-100 text-base flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-emerald-400" />
                      Storico Progressioni: {selectedExDetail.nome}
                    </h3>
                    <p className="text-xs text-gray-400">Analisi lineare del volume e del sovraccarico progressivo nel tempo.</p>
                  </div>
                  <button 
                    onClick={() => setSelectedExDetail(null)}
                    className="p-1.5 hover:bg-gray-800 rounded-lg text-gray-400 hover:text-white"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {selectedExDetail.history.length > 0 ? (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    
                    {/* Load over time */}
                    <div className="bg-gray-800/30 p-4 rounded-xl border border-gray-800">
                      <h4 className="text-xs font-bold text-gray-400 mb-2">Andamento Carichi Massimi (Sovraccarico Progressivo)</h4>
                      <div className="h-56 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={selectedExDetail.history} margin={{ left: -20, right: 10, top: 10, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                            <XAxis dataKey="data" stroke="#999" tick={{ fontSize: 9 }} />
                            <YAxis stroke="#999" tick={{ fontSize: 9 }} />
                            <Tooltip contentStyle={{ backgroundColor: '#111', borderColor: '#333' }} />
                            <Line type="monotone" dataKey="carico" name="Carico (kg)" stroke="#10b981" strokeWidth={2.5} activeDot={{ r: 5 }} />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Volume load over time */}
                    <div className="bg-gray-800/30 p-4 rounded-xl border border-gray-800">
                      <h4 className="text-xs font-bold text-gray-400 mb-2">Tonnage / Volume Load Totale Sollevato</h4>
                      <div className="h-56 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={selectedExDetail.history} margin={{ left: -20, right: 10, top: 10, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                            <XAxis dataKey="data" stroke="#999" tick={{ fontSize: 9 }} />
                            <YAxis stroke="#999" tick={{ fontSize: 9 }} />
                            <Tooltip contentStyle={{ backgroundColor: '#111', borderColor: '#333' }} />
                            <Line type="monotone" dataKey="volume" name="Volume Load (kg)" stroke="#38bdf8" strokeWidth={2.5} activeDot={{ r: 5 }} />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                  </div>
                ) : (
                  <div className="py-8 text-center text-xs text-gray-500">
                    Nessun dato registrato nel logbook per questo esercizio. Esegui allenamenti per tracciare le progressioni grafiche!
                  </div>
                )}
              </div>
            )}

          </div>
        )}

        {/* TAB 5: CONFRONTI SETTIMANE E PIANI */}
        {activeTab === 'confronto' && (
          <div id="confronto-view" className="space-y-6">
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Box 1: Week-to-Week Comparison */}
              <div className="bg-gray-900 border border-gray-800 p-5 rounded-2xl shadow-lg space-y-4">
                <div>
                  <h3 className="font-bold text-gray-100 text-base">Confronto Settimanale Interattivo</h3>
                  <p className="text-xs text-gray-400">Compara due settimane distinte per valutare i microcicli di carico e scarico.</p>
                </div>

                <div className="flex gap-4 items-center">
                  <div className="flex flex-col gap-1 w-full">
                    <span className="text-[10px] text-gray-400 font-bold uppercase">Settimana A</span>
                    <select
                      value={compWeek1}
                      onChange={(e) => setCompWeek1(Number(e.target.value))}
                      className="bg-gray-800 border border-gray-700 text-sm rounded-xl px-3 py-2 text-white"
                    >
                      {availableWeeks.map(w => (
                        <option key={w} value={w}>Settimana {w}</option>
                      ))}
                    </select>
                  </div>
                  <ArrowLeftRight className="w-5 h-5 text-gray-500 shrink-0 mt-4" />
                  <div className="flex flex-col gap-1 w-full">
                    <span className="text-[10px] text-gray-400 font-bold uppercase">Settimana B</span>
                    <select
                      value={compWeek2}
                      onChange={(e) => setCompWeek2(Number(e.target.value))}
                      className="bg-gray-800 border border-gray-700 text-sm rounded-xl px-3 py-2 text-white"
                    >
                      {availableWeeks.map(w => (
                        <option key={w} value={w}>Settimana {w}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {selectedPlan && (
                  <div className="bg-gray-800/35 border border-gray-800 p-4 rounded-xl space-y-4">
                    <h4 className="text-xs font-bold text-gray-300 uppercase border-b border-gray-800 pb-2">
                      Confronto Metriche: Sett {compWeek1} vs Sett {compWeek2}
                    </h4>
                    
                    {/* Render metrics table */}
                    {(() => {
                      const rep = compareWeeksData(selectedPlan, compWeek1, compWeek2, analysisSettings);
                      return (
                        <div className="space-y-4">
                          <div className="space-y-2">
                            {rep.metrics.map((m, idx) => {
                              const isPositive = m.diff.toString().startsWith('+') || (typeof m.diff === 'number' && m.diff > 0);
                              return (
                                <div key={idx} className="flex justify-between text-xs items-center py-1 border-b border-gray-800/40">
                                  <span className="text-gray-400 font-semibold">{m.label}</span>
                                  <div className="flex items-center gap-3">
                                    <span className="font-mono text-gray-300">{m.valA}</span>
                                    <ArrowRight className="w-3 h-3 text-gray-500" />
                                    <span className="font-mono text-white font-semibold">{m.valB}</span>
                                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                      isPositive ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'
                                    }`}>
                                      {m.percentDiff}
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>

                          {/* Added and removed list */}
                          {(rep.addedExercises.length > 0 || rep.removedExercises.length > 0) && (
                            <div className="text-[11px] text-gray-400 pt-2 border-t border-gray-800 space-y-2">
                              {rep.addedExercises.length > 0 && (
                                <div className="flex flex-col gap-1">
                                  <span className="font-bold text-emerald-400 uppercase tracking-wide">Esercizi Aggiunti:</span>
                                  <ul className="list-disc pl-4 space-y-0.5">
                                    {rep.addedExercises.map((ex, i) => <li key={i}>{ex}</li>)}
                                  </ul>
                                </div>
                              )}
                              {rep.removedExercises.length > 0 && (
                                <div className="flex flex-col gap-1">
                                  <span className="font-bold text-red-400 uppercase tracking-wide">Esercizi Rimossi / Scaricati:</span>
                                  <ul className="list-disc pl-4 space-y-0.5">
                                    {rep.removedExercises.map((ex, i) => <li key={i}>{ex}</li>)}
                                  </ul>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>

              {/* Box 2: Plan-to-Plan Comparison */}
              <div className="bg-gray-900 border border-gray-800 p-5 rounded-2xl shadow-lg space-y-4">
                <div>
                  <h3 className="font-bold text-gray-100 text-base">Confronto Programmi (Mesociclo)</h3>
                  <p className="text-xs text-gray-400">Compara due piani diversi dello stesso allievo per misurarne i progressi macroscopici.</p>
                </div>

                {(() => {
                  const clientPlans = plans.filter(p => p.clienteId === selectedClientId);
                  
                  return (
                    <div className="space-y-4">
                      <div className="flex gap-4 items-center">
                        <div className="flex flex-col gap-1 w-full">
                          <span className="text-[10px] text-gray-400 font-bold uppercase">Programma A</span>
                          <select
                            value={compPlan1}
                            onChange={(e) => setCompPlan1(e.target.value)}
                            className="bg-gray-800 border border-gray-700 text-sm rounded-xl px-3 py-2 text-white"
                          >
                            <option value="">Seleziona...</option>
                            {clientPlans.map(p => (
                              <option key={p.id} value={p.id}>{p.nome}</option>
                            ))}
                          </select>
                        </div>
                        <ArrowLeftRight className="w-5 h-5 text-gray-500 shrink-0 mt-4" />
                        <div className="flex flex-col gap-1 w-full">
                          <span className="text-[10px] text-gray-400 font-bold uppercase">Programma B</span>
                          <select
                            value={compPlan2}
                            onChange={(e) => setCompPlan2(e.target.value)}
                            className="bg-gray-800 border border-gray-700 text-sm rounded-xl px-3 py-2 text-white"
                          >
                            <option value="">Seleziona...</option>
                            {clientPlans.map(p => (
                              <option key={p.id} value={p.id}>{p.nome}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {compPlan1 && compPlan2 ? (
                        <div className="bg-gray-800/35 border border-gray-800 p-4 rounded-xl space-y-4">
                          {(() => {
                            const pA = plans.find(p => p.id === compPlan1);
                            const pB = plans.find(p => p.id === compPlan2);
                            if (pA && pB) {
                              const rep = comparePlansData(pA, pB, analysisSettings);
                              return (
                                <div className="space-y-2">
                                  {rep.metrics.map((m, idx) => (
                                    <div key={idx} className="flex justify-between text-xs items-center py-1 border-b border-gray-800/40">
                                      <span className="text-gray-400 font-semibold">{m.label}</span>
                                      <div className="flex items-center gap-3">
                                        <span className="font-mono text-gray-300">{m.valA}</span>
                                        <ArrowRight className="w-3 h-3 text-gray-500" />
                                        <span className="font-mono text-white font-semibold">{m.valB}</span>
                                        <span className="bg-gray-700 px-1.5 py-0.5 rounded text-[10px] text-gray-300">
                                          {m.percentDiff}
                                        </span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              );
                            }
                            return null;
                          })()}
                        </div>
                      ) : (
                        <div className="py-8 text-center text-xs text-gray-500">
                          Seleziona due programmi diversi per confrontare i parametri medi di pianificazione e densità.
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>

            </div>

          </div>
        )}

        {/* TAB 6: AVVISI CLINICI & WARNINGS */}
        {activeTab === 'avvisi' && (
          <div id="avvisi-view" className="space-y-6">
            
            <div className="bg-gray-900 border border-gray-800 p-5 rounded-2xl shadow-lg">
              <h3 className="font-bold text-gray-100 text-base mb-1">Avvisi e Diagnostica del Programma</h3>
              <p className="text-xs text-gray-400 mb-6">Controlli biometrici e fisiologici eseguiti sui volumi e sulla ripartizione dello stimolo.</p>

              <div className="space-y-4">
                {analysis.alerts.map((alert, idx) => (
                  <div 
                    key={idx} 
                    className={`p-4 rounded-xl border flex flex-col sm:flex-row justify-between items-start gap-4 transition ${
                      alert.ignored 
                        ? 'bg-gray-800/20 border-gray-800/50 opacity-60' 
                        : alert.type === 'warning' 
                          ? 'bg-red-500/10 border-red-500/25' 
                          : 'bg-blue-500/10 border-blue-500/25'
                    }`}
                  >
                    <div className="flex gap-3">
                      <AlertCircle className={`w-5 h-5 shrink-0 mt-0.5 ${
                        alert.ignored ? 'text-gray-500' : alert.type === 'warning' ? 'text-red-400' : 'text-blue-400'
                      }`} />
                      <div className="space-y-1">
                        <h4 className={`text-sm font-bold ${
                          alert.ignored ? 'text-gray-400' : alert.type === 'warning' ? 'text-red-300' : 'text-blue-300'
                        }`}>
                          {alert.title}
                        </h4>
                        <p className="text-xs text-gray-400">{alert.description}</p>
                        
                        {/* Note area */}
                        <div className="mt-2 flex gap-2 items-center">
                          <input
                            type="text"
                            placeholder="Aggiungi una nota coach per questo alert..."
                            defaultValue={alert.note}
                            onBlur={(e) => handleSaveAlertNote(alert.id, e.target.value)}
                            className="bg-gray-800 border border-gray-700 rounded px-2 py-0.5 text-[10px] w-64 text-white focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2 shrink-0">
                      <button
                        onClick={() => handleToggleIgnoreAlert(alert.id)}
                        className={`text-xs font-semibold px-2.5 py-1 rounded-lg border transition ${
                          alert.ignored 
                            ? 'bg-gray-800 border-gray-700 text-gray-400 hover:text-white' 
                            : 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700'
                        }`}
                      >
                        {alert.ignored ? 'Attiva' : 'Ignora'}
                      </button>
                    </div>
                  </div>
                ))}

                {analysis.alerts.length === 0 && (
                  <div className="py-12 text-center text-xs text-gray-500">
                    Ottimo lavoro! Il programma supera tutti i controlli fisiologici e di volume (nessun warning rilevato).
                  </div>
                )}
              </div>
            </div>

          </div>
        )}

        {/* TAB 7: REPORT & EXPORT */}
        {activeTab === 'report' && (
          <div id="report-view" className="space-y-6">
            {isIframe && (
                <div className="bg-orange-950/40 border border-orange-800/40 p-4 rounded-xl text-left text-xs text-orange-200 max-w-4xl mx-auto print:hidden flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-orange-400 shrink-0 mt-0.5 animate-pulse" />
                  <div className="space-y-1">
                    <p className="font-extrabold text-orange-300 text-[13px] uppercase tracking-wide">⚠️ NOTA PER LA STAMPA / SALVATAGGIO IN PDF</p>
                    <p className="text-white/80 leading-relaxed">
                      I browser bloccano l'apertura del dialogo di stampa (<code className="bg-black/30 px-1 py-0.5 rounded text-orange-300 font-mono text-[10px]">window.print()</code>) all'interno dell'anteprima (iframe).
                    </p>
                    <p className="font-bold text-[#CCFF00] leading-relaxed mt-1">
                      👉 Per generare il PDF del report correttamente, fai clic sul pulsante <span className="underline font-black">"Apri in una nuova scheda"</span> in alto a destra nell'interfaccia di AI Studio, e clicca di nuovo su "Stampa / Salva PDF".
                    </p>
                  </div>
                </div>
              )}
              
              <div className="bg-gray-900 border border-gray-800 p-6 rounded-2xl shadow-lg space-y-6 max-w-4xl mx-auto" id="printable-report">
              
              {/* Report Header */}
              <div className="flex justify-between items-start border-b border-gray-800 pb-4">
                <div>
                  <span className="text-xs font-bold text-emerald-400 tracking-wider uppercase">REPORT DI ANALISI SCHEDA COCHING</span>
                  <h2 className="text-2xl font-bold text-white mt-1">{selectedPlan?.nome}</h2>
                  <p className="text-xs text-gray-400 mt-1">
                    Cliente: {selectedClient?.nome} {selectedClient?.cognome} | Data Inizio: {selectedPlan?.dataInizio}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xs text-gray-400 block">Stampa Report Fisico</span>
                  <button 
                    onClick={() => window.print()}
                    className="mt-2 bg-emerald-500 text-gray-900 font-bold text-xs px-3.5 py-2 rounded-xl hover:bg-emerald-400 transition"
                  >
                    Stampa / Salva PDF
                  </button>
                </div>
              </div>

              {/* Summary Stats row */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gray-800/40 p-3 rounded-xl border border-gray-800">
                  <span className="text-[10px] text-gray-500 font-bold block uppercase">Completamento Programma</span>
                  <span className="text-lg font-bold text-emerald-400">{analysis.completamentoPercent}%</span>
                </div>
                <div className="bg-gray-800/40 p-3 rounded-xl border border-gray-800">
                  <span className="text-[10px] text-gray-500 font-bold block uppercase">Serie Reali Svolte</span>
                  <span className="text-lg font-bold text-white">{analysis.totalSetsExecuted} / {analysis.totalSetsScheduled}</span>
                </div>
                <div className="bg-gray-800/40 p-3 rounded-xl border border-gray-800">
                  <span className="text-[10px] text-gray-500 font-bold block uppercase">Volume Eseguito (Tonnage)</span>
                  <span className="text-lg font-bold text-white">{analysis.totalVolumeLoadExecuted.toLocaleString()} kg</span>
                </div>
                <div className="bg-gray-800/40 p-3 rounded-xl border border-gray-800">
                  <span className="text-[10px] text-gray-500 font-bold block uppercase">Intensità Media (RIR)</span>
                  <span className="text-lg font-bold text-amber-400">RIR {analysis.avgRirExecuted}</span>
                </div>
              </div>

              {/* Volumes table inside report */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-gray-300 uppercase tracking-wide">Distribuzione dei Volumi</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-gray-800 text-gray-500 font-bold uppercase">
                        <th className="py-2">DISTRETTO</th>
                        <th className="py-2 text-center">SERIE DIRETTI</th>
                        <th className="py-2 text-center">SERIE PONDERATE</th>
                        <th className="py-2 text-center">SERIE REALMENTE LOGGATE</th>
                        <th className="py-2 text-right">PERCENTUALE STIMOLO</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800/40">
                      {analysis.volumePerDistrict.map((row, idx) => {
                        const distPct = analysis.volumeDistribution.find(v => v.district === row.district)?.percentage || 0;
                        return (
                          <tr key={idx} className="text-gray-300">
                            <td className="py-2 font-bold text-gray-200">{row.district}</td>
                            <td className="py-2 text-center">{row.scheduled}</td>
                            <td className="py-2 text-center">{row.weighted}</td>
                            <td className="py-2 text-center text-sky-400 font-semibold">{row.executed}</td>
                            <td className="py-2 text-right text-emerald-400 font-bold">{distPct}%</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Coach notes */}
              <div className="bg-gray-800/20 border border-gray-800 p-4 rounded-xl space-y-2">
                <span className="text-[10px] text-gray-500 font-bold block uppercase">Considerazioni Tecniche e Biomeccaniche del Coach</span>
                <p className="text-xs text-gray-300 leading-relaxed">
                  {selectedClient?.noteCoach || 'Nessuna nota aggiuntiva. L\'allievo dimostra ottima progressione nei carichi e aderenza generale.'}
                </p>
              </div>

              <div className="text-center text-[10px] text-gray-600 border-t border-gray-800/60 pt-4">
                Generato automaticamente dal software di monitoraggio biomeccanico. Tutti i diritti riservati.
              </div>

            </div>

          </div>
        )}

        {/* TAB 8: IMPPOSTAZIONI / SETTINGS COEFF */}
        {activeTab === 'settings' && (
          <div id="settings-view" className="space-y-6">
            
            <div className="bg-gray-900 border border-gray-800 p-5 rounded-2xl shadow-lg space-y-5 max-w-2xl mx-auto">
              <div>
                <h3 className="font-bold text-gray-100 text-base">Configuratore Soglie e Biomeccanica</h3>
                <p className="text-xs text-gray-400">Modifica i parametri fisici di calcolo dei volumi, tempi di riposo e diagnostica avvisi.</p>
              </div>

              <div className="space-y-4">
                
                {/* Secondary muscles coeff */}
                <div className="flex justify-between items-center bg-gray-800/30 p-3 rounded-xl border border-gray-800/40">
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-gray-100 block">Coefficiente Muscoli Secondari</span>
                    <p className="text-[10px] text-gray-400">Peso assegnato alle serie dei muscoli sinergici / secondari (es. Tricipite nella Panca Piana).</p>
                  </div>
                  <input
                    type="number"
                    min="0"
                    max="1"
                    step="0.1"
                    value={analysisSettings.coeffMuscoliSecondari}
                    onChange={(e) => saveSettings({ ...analysisSettings, coeffMuscoliSecondari: parseFloat(e.target.value) || 0.5 })}
                    className="bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-sm w-20 text-center font-bold text-emerald-400 focus:outline-none"
                  />
                </div>

                {/* Transition time */}
                <div className="flex justify-between items-center bg-gray-800/30 p-3 rounded-xl border border-gray-800/40">
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-gray-100 block">Tempo Transizione Esercizi (secondi)</span>
                    <p className="text-[10px] text-gray-400">Tempo stimato di cammino o setup tra un esercizio e il successivo.</p>
                  </div>
                  <input
                    type="number"
                    min="0"
                    step="10"
                    value={analysisSettings.tempoTransizione}
                    onChange={(e) => saveSettings({ ...analysisSettings, tempoTransizione: parseInt(e.target.value) || 90 })}
                    className="bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-sm w-20 text-center font-bold text-white focus:outline-none"
                  />
                </div>

                {/* Limit max series day */}
                <div className="flex justify-between items-center bg-gray-800/30 p-3 rounded-xl border border-gray-800/40">
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-gray-100 block">Limite Consigliato Serie per Allenamento</span>
                    <p className="text-[10px] text-gray-400">Soglia massima di serie oltre la quale scatta l'avviso di stanchezza sistemica o volume "junk".</p>
                  </div>
                  <input
                    type="number"
                    min="5"
                    value={analysisSettings.limiteSerieGiornata}
                    onChange={(e) => saveSettings({ ...analysisSettings, limiteSerieGiornata: parseInt(e.target.value) || 20 })}
                    className="bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-sm w-20 text-center font-bold text-white focus:outline-none"
                  />
                </div>

                {/* Decimal counts */}
                <div className="flex justify-between items-center bg-gray-800/30 p-3 rounded-xl border border-gray-800/40">
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-gray-100 block">Numero Decimali</span>
                    <p className="text-[10px] text-gray-400">Precisione decimale nelle visualizzazioni di serie ponderate o RIR.</p>
                  </div>
                  <input
                    type="number"
                    min="0"
                    max="2"
                    value={analysisSettings.numeroDecimali}
                    onChange={(e) => saveSettings({ ...analysisSettings, numeroDecimali: parseInt(e.target.value) || 1 })}
                    className="bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-sm w-20 text-center font-bold text-white focus:outline-none"
                  />
                </div>

                {/* Units selection */}
                <div className="flex justify-between items-center bg-gray-800/30 p-3 rounded-xl border border-gray-800/40">
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-gray-100 block">Unità di Misura Carico</span>
                    <p className="text-[10px] text-gray-400">Seleziona Chilogrammi o Libbre per i calcoli del volume dei carichi.</p>
                  </div>
                  <select
                    value={analysisSettings.unitaCarico}
                    onChange={(e) => saveSettings({ ...analysisSettings, unitaCarico: e.target.value as 'kg' | 'lb' })}
                    className="bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none"
                  >
                    <option value="kg">KG (Chilogrammi)</option>
                    <option value="lb">LB (Libbre)</option>
                  </select>
                </div>

              </div>
            </div>

          </div>
        )}

      </div>

    </div>
  );
}
