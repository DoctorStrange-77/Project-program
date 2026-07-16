/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Client, CoachConfig, Sesso, LivelloEsperienza, ClientMeasurement, WorkoutPlan } from '../types';
import { 
  Search, UserPlus, Edit2, Trash2, Calendar, Award, MessageSquare, 
  Plus, ArrowRight, User, X, Check, Ruler, Scale, Heart, Sparkles, 
  TrendingUp, List, ChevronLeft, Dumbbell, BookOpen, Download
} from 'lucide-react';
import LogbookTracker from './LogbookTracker';

interface ClientManagementProps {
  config: CoachConfig;
  clients: Client[];
  plans: WorkoutPlan[];
  onAddClient: (client: Client) => void;
  onUpdateClient: (client: Client) => void;
  onDeleteClient: (id: string) => void;
  onSelectClientForPlan: (client: Client) => void;
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

export default function ClientManagement({
  config,
  clients,
  plans,
  onAddClient,
  onUpdateClient,
  onDeleteClient,
  onSelectClientForPlan,
  onShowToast,
  onShowConfirm
}: ClientManagementProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [isMeasureModalOpen, setIsMeasureModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  
  // Tab within details: 'info' | 'misure' | 'logbook'
  const [detailsTab, setDetailsTab] = useState<'info' | 'misure' | 'logbook'>('info');
  // Metric for chart: 'peso' | 'vita'
  const [chartMetric, setChartMetric] = useState<'peso' | 'vita'>('peso');
  
  // Mobile navigation state: whether showing detail view instead of list
  const [showMobileDetail, setShowMobileDetail] = useState(false);

  // Form states - Client
  const [nome, setNome] = useState('');
  const [cognome, setCognome] = useState('');
  const [eta, setEta] = useState<number | ''>('');
  const [sesso, setSesso] = useState<Sesso>('Uomo');
  const [altezza, setAltezza] = useState<number | ''>('');
  const [pesoAttuale, setPesoAttuale] = useState<number | ''>('');
  const [obiettivo, setObiettivo] = useState('');
  const [livelloEsperienza, setLivelloEsperienza] = useState<LivelloEsperienza>('Intermedio');
  const [allenamentiSettimanali, setAllenamentiSettimanali] = useState<number>(3);
  const [dataInizio, setDataInizio] = useState('');
  const [limitazioniFisiche, setLimitazioniFisiche] = useState('');
  const [noteCoach, setNoteCoach] = useState('');
  const [prossimoControllo, setProssimoControllo] = useState('');

  // Form states - Measurement Rilevazione
  const [misuraData, setMisuraData] = useState(new Date().toISOString().substring(0, 10));
  const [misuraPeso, setMisuraPeso] = useState<number | ''>('');
  const [misuraVita, setMisuraVita] = useState<number | ''>('');
  const [misuraTorace, setMisuraTorace] = useState<number | ''>('');
  const [misuraBraccio, setMisuraBraccio] = useState<number | ''>('');
  const [misuraCoscia, setMisuraCoscia] = useState<number | ''>('');
  const [misuraMassaGrassa, setMisuraMassaGrassa] = useState<number | ''>('');
  const [misuraNote, setMisuraNote] = useState('');

  // Back button dismiss listeners for mobile
  useEffect(() => {
    const handlePopState = (e: PopStateEvent) => {
      if (isClientModalOpen) {
        setIsClientModalOpen(false);
        e.preventDefault();
      }
    };
    if (isClientModalOpen) {
      window.history.pushState({ modalOpen: 'client_form' }, '');
      window.addEventListener('popstate', handlePopState);
    }
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [isClientModalOpen]);

  useEffect(() => {
    const handlePopState = (e: PopStateEvent) => {
      if (isMeasureModalOpen) {
        setIsMeasureModalOpen(false);
        e.preventDefault();
      }
    };
    if (isMeasureModalOpen) {
      window.history.pushState({ modalOpen: 'measure_form' }, '');
      window.addEventListener('popstate', handlePopState);
    }
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [isMeasureModalOpen]);

  useEffect(() => {
    const handlePopState = (e: PopStateEvent) => {
      if (showMobileDetail) {
        setShowMobileDetail(false);
        e.preventDefault();
      }
    };
    if (showMobileDetail) {
      window.history.pushState({ modalOpen: 'client_details' }, '');
      window.addEventListener('popstate', handlePopState);
    }
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [showMobileDetail]);

  const openAddClientModal = () => {
    setEditingClient(null);
    setNome('');
    setCognome('');
    setEta('');
    setSesso('Uomo');
    setAltezza('');
    setPesoAttuale('');
    setObiettivo('');
    setLivelloEsperienza('Intermedio');
    setAllenamentiSettimanali(3);
    setDataInizio(new Date().toISOString().substring(0, 10));
    setLimitazioniFisiche('');
    setNoteCoach('');
    setProssimoControllo('');
    setIsClientModalOpen(true);
  };

  const openEditClientModal = (client: Client, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingClient(client);
    setNome(client.nome);
    setCognome(client.cognome);
    setEta(client.eta);
    setSesso(client.sesso);
    setAltezza(client.altezza || '');
    setPesoAttuale(client.pesoAttuale || '');
    setObiettivo(client.obiettivo);
    setLivelloEsperienza(client.livelloEsperienza);
    setAllenamentiSettimanali(client.allenamentiSettimanali);
    setDataInizio(client.dataInizio || new Date().toISOString().substring(0, 10));
    setLimitazioniFisiche(client.limitazioniFisiche || '');
    setNoteCoach(client.noteCoach || '');
    setProssimoControllo(client.prossimoControllo || '');
    setIsClientModalOpen(true);
  };

  const openMeasureModal = () => {
    if (!selectedClient) return;
    setMisuraData(new Date().toISOString().substring(0, 10));
    // Pre-fill fields with last values for convenience
    const sorted = selectedClient.rilevazioni && selectedClient.rilevazioni.length > 0
      ? [...selectedClient.rilevazioni].sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime())
      : [];
    const last = sorted[sorted.length - 1];
    setMisuraPeso(last ? last.peso : selectedClient.pesoAttuale || '');
    setMisuraVita(last ? last.vita : '');
    setMisuraTorace(last ? last.torace : '');
    setMisuraBraccio(last ? last.braccio : '');
    setMisuraCoscia(last ? last.coscia : '');
    setMisuraMassaGrassa(last && last.massaGrassa ? last.massaGrassa : '');
    setMisuraNote('');
    setIsMeasureModalOpen(true);
  };

  const handleDeleteClient = (id: string, name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    const performDelete = () => {
      onDeleteClient(id);
      if (selectedClient?.id === id) {
        setSelectedClient(null);
        setShowMobileDetail(false);
      }
      if (onShowToast) {
        onShowToast(`Cliente ${name} eliminato con successo.`, 'success');
      }
    };

    if (onShowConfirm) {
      onShowConfirm({
        title: 'Eliminare cliente?',
        message: `Sei sicuro di voler eliminare il cliente ${name}? Questa azione è irreversibile e rimuoverà il cliente e tutte le sue misurazioni.`,
        confirmText: 'Sì, elimina',
        isDestructive: true,
        onConfirm: performDelete
      });
    } else {
      const confirmed = window.confirm(`Sei sicuro di voler eliminare il cliente ${name}? Questa azione è irreversibile e rimuoverà il cliente e tutte le sue misurazioni.`);
      if (confirmed) {
        performDelete();
      }
    }
  };

  const handleClientSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim() || !cognome.trim() || !eta || !obiettivo.trim()) {
      if (onShowToast) {
        onShowToast('Tutti i campi obbligatori (*) devono essere compilati.', 'warning');
      } else {
        alert('Tutti i campi obbligatori (*) devono essere compilati.');
      }
      return;
    }

    const clientData: Client = {
      id: editingClient ? editingClient.id : 'c_' + Date.now(),
      nome: nome.trim(),
      cognome: cognome.trim(),
      eta: Number(eta),
      sesso,
      altezza: altezza ? Number(altezza) : undefined,
      pesoAttuale: pesoAttuale ? Number(pesoAttuale) : undefined,
      obiettivo: obiettivo.trim(),
      livelloEsperienza,
      allenamentiSettimanali,
      dataInizio: dataInizio || undefined,
      limitazioniFisiche: limitazioniFisiche.trim() || undefined,
      noteCoach: noteCoach.trim() || undefined,
      prossimoControllo: prossimoControllo || undefined,
      // preserve measurements if editing
      rilevazioni: editingClient ? editingClient.rilevazioni : []
    };

    if (editingClient) {
      onUpdateClient(clientData);
      if (selectedClient?.id === clientData.id) {
        setSelectedClient(clientData);
      }
    } else {
      onAddClient(clientData);
    }
    setIsClientModalOpen(false);
  };

  const handleMeasureSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClient) return;
    if (!misuraData || !misuraPeso || !misuraVita || !misuraTorace || !misuraBraccio || !misuraCoscia) {
      alert('Tutti i parametri antropometrici sono richiesti.');
      return;
    }

    const newMeasurement: ClientMeasurement = {
      id: 'm_' + Date.now(),
      data: misuraData,
      peso: Number(misuraPeso),
      vita: Number(misuraVita),
      torace: Number(misuraTorace),
      braccio: Number(misuraBraccio),
      coscia: Number(misuraCoscia),
      massaGrassa: misuraMassaGrassa ? Number(misuraMassaGrassa) : undefined,
      noteControllo: misuraNote.trim() || undefined
    };

    const currentRilevazioni = selectedClient.rilevazioni || [];
    // Append or replace measurement for same date
    const updatedRilevazioni = [...currentRilevazioni.filter(m => m.data !== newMeasurement.data), newMeasurement]
      .sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime());

    // update client's current weight
    const updatedClient: Client = {
      ...selectedClient,
      pesoAttuale: Number(misuraPeso),
      rilevazioni: updatedRilevazioni
    };

    onUpdateClient(updatedClient);
    setSelectedClient(updatedClient);
    setIsMeasureModalOpen(false);
  };

  const handleDeleteMeasurement = (measureId: string) => {
    if (!selectedClient) return;
    const confirmed = window.confirm('Sei sicuro di voler eliminare questa misurazione antropometrica?');
    if (!confirmed) return;

    const currentRilevazioni = selectedClient.rilevazioni || [];
    const updatedRilevazioni = currentRilevazioni.filter(r => r.id !== measureId);

    const updatedClient: Client = {
      ...selectedClient,
      rilevazioni: updatedRilevazioni
    };

    // If we deleted the most recent measurement, update current weight to the previous one
    if (updatedRilevazioni.length > 0) {
      updatedClient.pesoAttuale = updatedRilevazioni[updatedRilevazioni.length - 1].peso;
    }

    onUpdateClient(updatedClient);
    setSelectedClient(updatedClient);
  };

  // Filter clients based on search query
  const filteredClients = clients.filter(client => {
    const fullName = `${client.nome} ${client.cognome}`.toLowerCase();
    const query = searchTerm.toLowerCase();
    return fullName.includes(query);
  });

  const selectClient = (client: Client) => {
    setSelectedClient(client);
    setDetailsTab('info');
    setShowMobileDetail(true);
  };

  const handleExportClient = (client: Client, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    
    // Filter plans and logbook for this client
    const clientPlans = plans.filter(p => p.clienteId === client.id);
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
    if (!selectedClient || !selectedClient.rilevazioni || selectedClient.rilevazioni.length < 2) {
      return (
        <div className="flex flex-col items-center justify-center h-48 bg-black/40 border border-white/5 rounded-xl p-4 text-center">
          <TrendingUp className="w-8 h-8 text-white/15 mb-2" />
          <p className="text-xs font-bold text-white/50 uppercase tracking-wider">Grafico non disponibile</p>
          <p className="text-[10px] text-white/30 max-w-xs mt-1">Registra almeno 2 rilevazioni in date diverse per visualizzare l'andamento nel tempo.</p>
        </div>
      );
    }

    // Sort measurements chronologically
    const sorted = [...selectedClient.rilevazioni].sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime());
    const values = sorted.map(r => chartMetric === 'peso' ? r.peso : r.vita);
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
    const points = sorted.map((r, i) => {
      const val = chartMetric === 'peso' ? r.peso : r.vita;
      const x = paddingLeft + (i / (sorted.length - 1)) * chartWidth;
      const y = paddingTop + chartHeight - ((val - minVal) / valRange) * chartHeight;
      return { x, y, val, date: r.data };
    });

    // Create polyline path
    const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
    // Create area path under the line
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
            {/* Horizontal Grid lines */}
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

            {/* Area Path */}
            <path 
              d={areaD} 
              fill={`url(#gradient-${chartMetric})`}
              opacity="0.15"
            />

            {/* Line Path */}
            <path 
              d={pathD} 
              fill="none" 
              stroke={config.primaryColor} 
              strokeWidth="2.5" 
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Data Nodes */}
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
                {/* Micro-label directly on node */}
                <text 
                  x={p.x} 
                  y={p.y - 8} 
                  fill="white" 
                  fontSize="8" 
                  fontFamily="sans-serif"
                  fontWeight="bold"
                  textAnchor="middle"
                  className="bg-neutral-900"
                >
                  {p.val}
                </text>
                {/* Date axis label */}
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

            {/* Gradient definition */}
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

  return (
    <div id="clients-view" className="space-y-6">
      {/* Header and Add client */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black uppercase tracking-tighter italic text-white">Archivio Clienti</h1>
          <p className="text-xs text-white/40 font-medium">Inserisci, modifica e organizza i profili e le antropometrie dei tuoi atleti.</p>
        </div>
        
        <button
          id="add-client-btn"
          onClick={openAddClientModal}
          className="flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-black uppercase tracking-wider text-neutral-950 transition-all cursor-pointer shadow-lg"
          style={{ backgroundColor: config.primaryColor }}
        >
          <UserPlus className="w-4 h-4" />
          Nuovo Cliente
        </button>
      </div>

      {/* Main Layout: Client list and Details pane */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Client List (Hidden on mobile if detail is active) */}
        <div id="clients-list-container" className={`lg:col-span-2 space-y-4 ${showMobileDetail ? 'hidden lg:block' : 'block'}`}>
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-4 top-3.5 w-5 h-5 text-white/30" />
            <input
              id="client-search-input"
              type="text"
              placeholder="Cerca cliente per nome o cognome..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-[#121212] border border-white/5 text-white placeholder-white/30 focus:outline-none focus:ring-1 focus:border-transparent transition-all text-xs sm:text-sm"
              style={{ '--tw-ring-color': config.primaryColor } as React.CSSProperties}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[600px] overflow-y-auto pr-1">
            {filteredClients.length === 0 ? (
              <div className="col-span-full bg-[#121212] border border-white/5 rounded-2xl p-8 text-center text-white/40">
                <User className="w-10 h-10 text-white/10 mx-auto mb-2" />
                <p className="text-sm font-bold uppercase tracking-wider">Nessun cliente trovato</p>
                <p className="text-xs text-white/30 mt-1">Inserisci un nuovo atleta o prova ad aggiustare la ricerca.</p>
              </div>
            ) : (
              filteredClients.map((client) => {
                const isSelected = selectedClient?.id === client.id;
                return (
                  <div
                    key={client.id}
                    id={`client-card-${client.id}`}
                    onClick={() => selectClient(client)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer flex justify-between items-center bg-[#121212] ${
                      isSelected 
                        ? 'border-transparent shadow-md' 
                        : 'border-white/5 hover:border-white/10'
                    }`}
                    style={{ 
                      borderColor: isSelected ? config.primaryColor : undefined,
                      boxShadow: isSelected ? `0 0 12px ${config.primaryColor}22` : undefined
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-black text-neutral-950 shrink-0 uppercase"
                        style={{ backgroundColor: isSelected ? config.primaryColor : '#252525', color: isSelected ? '#0a0a0a' : '#ffffff' }}
                      >
                        {client.nome.charAt(0)}{client.cognome.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-bold text-white text-sm tracking-tight truncate">{client.nome} {client.cognome}</h3>
                        <p className="text-white/40 text-[10px] uppercase tracking-wider mt-0.5">{client.obiettivo} • {client.eta} anni</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={(e) => openEditClientModal(client, e)}
                        className="p-2 rounded-lg bg-black/40 border border-white/5 hover:bg-white/5 text-white/40 hover:text-white transition-all cursor-pointer"
                        title="Modifica profilo"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => handleDeleteClient(client.id, `${client.nome} ${client.cognome}`, e)}
                        className="p-2 rounded-lg bg-black/40 border border-white/5 hover:bg-white/5 text-white/20 hover:text-red-400 transition-all cursor-pointer"
                        title="Elimina cliente"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      <ArrowRight className="w-4 h-4 text-white/30 ml-1 hidden sm:block" />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Client Details Pane (Full screen toggle on mobile) */}
        <div id="client-details-container" className={`lg:col-span-1 ${showMobileDetail ? 'block' : 'hidden lg:block'}`}>
          {selectedClient ? (
            <div className="bg-[#121212] border border-white/5 rounded-2xl p-6 space-y-5 sticky top-6">
              {/* Mobile Back navigation */}
              <div className="flex lg:hidden justify-between items-center pb-2 border-b border-white/5">
                <button 
                  onClick={() => setShowMobileDetail(false)}
                  className="flex items-center gap-1.5 text-xs font-bold text-white/60 hover:text-white"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Torna all'elenco
                </button>
                <span className="text-[10px] font-black uppercase text-[#CCFF00] tracking-wider">Atleta</span>
              </div>

              {/* Detail Header */}
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-12 h-12 rounded-full flex items-center justify-center text-sm font-black text-neutral-950 shrink-0 uppercase"
                    style={{ backgroundColor: config.primaryColor }}
                  >
                    {selectedClient.nome.charAt(0)}{selectedClient.cognome.charAt(0)}
                  </div>
                  <div>
                    <h2 className="font-extrabold text-white text-base tracking-tight leading-none">{selectedClient.nome} {selectedClient.cognome}</h2>
                    <p className="text-white/40 text-[10px] uppercase tracking-wider mt-1">{selectedClient.sesso} • {selectedClient.eta} Anni</p>
                  </div>
                </div>
                <button 
                  onClick={() => {
                    setSelectedClient(null);
                    setShowMobileDetail(false);
                  }}
                  className="text-white/40 hover:text-white p-1 cursor-pointer hidden lg:block"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Sub tabs inside client details */}
              <div className="flex border-b border-white/5">
                <button
                  onClick={() => setDetailsTab('info')}
                  className={`flex-1 pb-2.5 text-center text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                    detailsTab === 'info' 
                      ? 'text-white border-b-2' 
                      : 'text-white/40 hover:text-white/70'
                  }`}
                  style={{ borderBottomColor: detailsTab === 'info' ? config.primaryColor : 'transparent' }}
                >
                  Profilo
                </button>
                <button
                  onClick={() => setDetailsTab('misure')}
                  className={`flex-1 pb-2.5 text-center text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                    detailsTab === 'misure' 
                      ? 'text-white border-b-2' 
                      : 'text-white/40 hover:text-white/70'
                  }`}
                  style={{ borderBottomColor: detailsTab === 'misure' ? config.primaryColor : 'transparent' }}
                >
                  Misure
                </button>
                <button
                  onClick={() => setDetailsTab('logbook')}
                  className={`flex-1 pb-2.5 text-center text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                    detailsTab === 'logbook' 
                      ? 'text-white border-b-2' 
                      : 'text-white/40 hover:text-white/70'
                  }`}
                  style={{ borderBottomColor: detailsTab === 'logbook' ? config.primaryColor : 'transparent' }}
                >
                  Registro
                </button>
              </div>

              {/* Details Content: General info Tab */}
              {detailsTab === 'info' ? (
                <div className="space-y-4">
                  {/* Anthropometric Specs */}
                  <div className="grid grid-cols-3 gap-3 bg-black/40 p-3 rounded-xl border border-white/5 text-center">
                    <div className="space-y-0.5">
                      <span className="text-[9px] uppercase font-black text-white/30 tracking-wider flex items-center justify-center gap-0.5"><Ruler className="w-3.5 h-3.5" />Altezza</span>
                      <p className="text-xs font-extrabold text-white">{selectedClient.altezza ? `${selectedClient.altezza} cm` : 'N/D'}</p>
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-[9px] uppercase font-black text-white/30 tracking-wider flex items-center justify-center gap-0.5"><Scale className="w-3.5 h-3.5" />Peso</span>
                      <p className="text-xs font-extrabold text-white">{selectedClient.pesoAttuale ? `${selectedClient.pesoAttuale} kg` : 'N/D'}</p>
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-[9px] uppercase font-black text-white/30 tracking-wider flex items-center justify-center gap-0.5"><Calendar className="w-3.5 h-3.5" />Inizio</span>
                      <p className="text-xs font-extrabold text-white">{selectedClient.dataInizio ? selectedClient.dataInizio.replace(/(\d{4})-(\d{2})-(\d{2})/, '$3/$2') : 'N/D'}</p>
                    </div>
                  </div>

                  {/* Level & frequency & prossimo controllo */}
                  <div className="grid grid-cols-2 gap-3 bg-black/20 p-3 rounded-xl border border-white/5">
                    <div className="space-y-0.5">
                      <span className="text-[9px] uppercase font-black text-white/40 tracking-wider">Esperienza</span>
                      <p className="text-xs font-bold text-white">{selectedClient.livelloEsperienza}</p>
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-[9px] uppercase font-black text-white/40 tracking-wider">Frequenza</span>
                      <p className="text-xs font-bold text-white">{selectedClient.allenamentiSettimanali} sedute/sett</p>
                    </div>
                    <div className="space-y-0.5 col-span-2 pt-1 border-t border-white/5 flex justify-between items-center text-xs">
                      <span className="text-[9px] uppercase font-black text-white/40 tracking-wider">Prossimo Controllo:</span>
                      <span className="font-extrabold text-[#CCFF00]" style={{ color: config.primaryColor }}>
                        {selectedClient.prossimoControllo 
                          ? selectedClient.prossimoControllo.replace(/(\d{4})-(\d{2})-(\d{2})/, '$3/$2/$1')
                          : 'Da programmare'}
                      </span>
                    </div>
                  </div>

                  {/* Goal */}
                  <div className="space-y-1 bg-black/10 p-3 rounded-xl border border-white/5">
                    <div className="flex items-center gap-1.5 text-[10px] font-black uppercase text-white/40 tracking-wider">
                      <Award className="w-3.5 h-3.5" style={{ color: config.primaryColor }} />
                      <span>Obiettivo Principale</span>
                    </div>
                    <p className="text-xs font-extrabold text-white mt-1">{selectedClient.obiettivo}</p>
                  </div>

                  {/* Physical limitations */}
                  <div className="space-y-1 bg-red-950/5 p-3 rounded-xl border border-red-950/20">
                    <div className="flex items-center gap-1.5 text-[10px] font-black uppercase text-red-400 tracking-wider">
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Limitazioni / Infortuni</span>
                    </div>
                    <p className="text-xs text-red-200/70 mt-1 leading-relaxed">
                      {selectedClient.limitazioniFisiche || 'Nessuna limitazione fisica segnalata.'}
                    </p>
                  </div>

                  {/* Internal Coach Notes */}
                  <div className="space-y-1 bg-black/10 p-3 rounded-xl border border-white/5">
                    <div className="flex items-center gap-1.5 text-[10px] font-black uppercase text-white/40 tracking-wider">
                      <BookOpen className="w-3.5 h-3.5" style={{ color: config.primaryColor }} />
                      <span>Note del Coach</span>
                    </div>
                    <p className="text-xs text-white/70 mt-1 leading-relaxed italic">
                      {selectedClient.noteCoach || 'Nessuna nota aggiuntiva salvata.'}
                    </p>
                  </div>

                  {/* --- SCHEDA ATTIVA --- */}
                  <div className="space-y-2">
                    <span className="text-[10px] uppercase font-black text-white/40 tracking-wider block">Scheda Attiva</span>
                    {(() => {
                      const activePlan = plans.find(p => p.clienteId === selectedClient.id && p.status === 'Attiva');
                      if (!activePlan) {
                        return (
                          <div className="p-3 bg-black/20 border border-white/5 rounded-xl text-center text-xs text-white/30 italic">
                            Nessun programma attivo al momento.
                          </div>
                        );
                      }
                      return (
                        <div className="p-3 bg-emerald-500/5 border border-emerald-500/25 rounded-xl space-y-1.5 text-xs text-left">
                          <div className="flex justify-between items-center font-bold">
                            <span className="text-white truncate">{activePlan.nome}</span>
                            <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-black uppercase text-[8px] tracking-wider">Attiva</span>
                          </div>
                          <p className="text-white/50 text-[10px] leading-relaxed">
                            {activePlan.durataSettimane} settimane • {activePlan.allenamentiSettimanali} allenamenti/sett
                          </p>
                          <p className="text-white/40 text-[9px] italic truncate">Obiettivo: {activePlan.obiettivo}</p>
                        </div>
                      );
                    })()}
                  </div>

                  {/* --- STORICO DELLE SCHEDE --- */}
                  <div className="space-y-2">
                    <span className="text-[10px] uppercase font-black text-white/40 tracking-wider block">Storico Schede</span>
                    {(() => {
                      const otherPlans = plans.filter(p => p.clienteId === selectedClient.id && p.status !== 'Attiva');
                      if (otherPlans.length === 0) {
                        return (
                          <div className="p-3 bg-black/10 border border-white/5 rounded-xl text-center text-xs text-white/30 italic">
                            Nessuna scheda d'allenamento nello storico.
                          </div>
                        );
                      }
                      return (
                        <div className="space-y-1.5 max-h-[140px] overflow-y-auto pr-1">
                          {otherPlans.map(p => {
                            const badgeStyle = p.status === 'Completata' 
                              ? 'bg-blue-500/10 text-blue-400' 
                              : p.status === 'Bozza' 
                              ? 'bg-amber-500/10 text-amber-400' 
                              : 'bg-neutral-500/10 text-neutral-400';
                            return (
                              <div key={p.id} className="p-2.5 bg-black/20 border border-white/5 rounded-xl flex justify-between items-center text-xs">
                                <div className="min-w-0 pr-2 text-left">
                                  <p className="font-semibold text-white/80 truncate leading-snug">{p.nome}</p>
                                  <p className="text-white/40 text-[9px]">{p.durataSettimane} sett • {p.dataCreazione ? new Date(p.dataCreazione).toLocaleDateString('it-IT') : ''}</p>
                                </div>
                                <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider shrink-0 ${badgeStyle}`}>
                                  {p.status}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })()}
                  </div>

                  {/* Single Client Export */}
                  <button
                    onClick={() => handleExportClient(selectedClient)}
                    className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-xs uppercase tracking-wider text-white border border-white/5 hover:bg-neutral-800 transition-all cursor-pointer shadow-sm"
                  >
                    <Download className="w-4 h-4 text-[#CCFF00]" style={{ color: config.primaryColor }} />
                    Esporta Profilo (JSON)
                  </button>

                  {/* Quick Workout Button */}
                  <button
                    id="btn-create-plan-for-client"
                    onClick={() => onSelectClientForPlan(selectedClient)}
                    className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-black text-xs uppercase tracking-wider text-neutral-950 transition-all cursor-pointer shadow-md"
                    style={{ backgroundColor: config.primaryColor }}
                  >
                    Crea scheda d'allenamento
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              ) : detailsTab === 'misure' ? (
                /* Details Content: Anthropometric measurements Tab */
                <div className="space-y-4">
                  {/* Metrics Summary and Variations */}
                  {selectedClient.rilevazioni && selectedClient.rilevazioni.length > 0 && (() => {
                    const sortedRilevazioni = [...selectedClient.rilevazioni].sort(
                      (a, b) => new Date(a.data).getTime() - new Date(b.data).getTime()
                    );
                    const latest = sortedRilevazioni[sortedRilevazioni.length - 1];
                    const first = sortedRilevazioni[0];
                    const prev = sortedRilevazioni.length >= 2 ? sortedRilevazioni[sortedRilevazioni.length - 2] : null;

                    const getDiffLabel = (current: number, base: number, unit: string) => {
                      const diff = current - base;
                      if (diff === 0) return <span className="text-white/40">0{unit}</span>;
                      const isNegative = diff < 0;
                      const colorClass = isNegative ? "text-emerald-400 font-bold" : "text-rose-400 font-bold";
                      return <span className={`font-black ${colorClass}`}>{isNegative ? '' : '+'}{diff.toFixed(1)}{unit}</span>;
                    };

                    return (
                      <div className="p-3.5 bg-black/40 border border-white/5 rounded-xl space-y-3 text-xs text-left">
                        <div className="flex justify-between items-center pb-1 border-b border-white/5">
                          <p className="text-[10px] uppercase font-black text-white/50 tracking-wider">Variazioni Antropometriche</p>
                          <span className="text-[9px] text-white/40">Ultima: {latest.data.replace(/(\d{4})-(\d{2})-(\d{2})/, '$3/$2/$1')}</span>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2 text-[11px] font-medium">
                          <div className="bg-black/30 p-2.5 rounded-lg border border-white/5 space-y-1">
                            <p className="text-[9px] text-white/30 font-bold uppercase">Peso Corporeo</p>
                            <div className="flex justify-between items-baseline">
                              <span className="text-white font-extrabold text-sm">{latest.peso} kg</span>
                              {prev && <div className="text-[10px]">{getDiffLabel(latest.peso, prev.peso, "kg")}</div>}
                            </div>
                            {sortedRilevazioni.length >= 2 && (
                              <p className="text-[9px] text-white/30 pt-1 border-t border-white/5 flex justify-between">
                                <span>Var. Totale:</span>
                                {getDiffLabel(latest.peso, first.peso, "kg")}
                              </p>
                            )}
                          </div>

                          <div className="bg-black/30 p-2.5 rounded-lg border border-white/5 space-y-1">
                            <p className="text-[9px] text-white/30 font-bold uppercase">Circ. Vita</p>
                            <div className="flex justify-between items-baseline">
                              <span className="text-white font-extrabold text-sm">{latest.vita} cm</span>
                              {prev && <div className="text-[10px]">{getDiffLabel(latest.vita, prev.vita, "cm")}</div>}
                            </div>
                            {sortedRilevazioni.length >= 2 && (
                              <p className="text-[9px] text-white/30 pt-1 border-t border-white/5 flex justify-between">
                                <span>Var. Totale:</span>
                                {getDiffLabel(latest.vita, first.vita, "cm")}
                              </p>
                            )}
                          </div>

                          <div className="bg-black/30 p-2.5 rounded-lg border border-white/5 col-span-2 space-y-1">
                            <p className="text-[9px] text-white/30 font-bold uppercase mb-1">Altri Parametri (Diff vs Prec.)</p>
                            <div className="grid grid-cols-3 gap-1.5 text-center">
                              <div className="bg-black/20 p-1.5 rounded">
                                <span className="block text-white/30 font-bold uppercase text-[7px] tracking-wider mb-0.5">Torace</span>
                                <span className="text-white font-bold">{latest.torace}cm</span>
                                {prev && <span className="block text-[9px] mt-0.5">{getDiffLabel(latest.torace, prev.torace, "")}</span>}
                              </div>
                              <div className="bg-black/20 p-1.5 rounded">
                                <span className="block text-white/30 font-bold uppercase text-[7px] tracking-wider mb-0.5">Braccio</span>
                                <span className="text-white font-bold">{latest.braccio}cm</span>
                                {prev && <span className="block text-[9px] mt-0.5">{getDiffLabel(latest.braccio, prev.braccio, "")}</span>}
                              </div>
                              <div className="bg-black/20 p-1.5 rounded">
                                <span className="block text-white/30 font-bold uppercase text-[7px] tracking-wider mb-0.5">Coscia</span>
                                <span className="text-white font-bold">{latest.coscia}cm</span>
                                {prev && <span className="block text-[9px] mt-0.5">{getDiffLabel(latest.coscia, prev.coscia, "")}</span>}
                              </div>
                            </div>
                            
                            {latest.massaGrassa !== undefined && (
                              <div className="pt-2 border-t border-white/5 flex justify-between text-[10px] text-white/60">
                                <span>Percentuale Massa Grassa:</span>
                                <span className="font-extrabold text-white">
                                  {latest.massaGrassa}% 
                                  {prev && prev.massaGrassa !== undefined && (
                                    <span className="ml-1 text-[9px]">({getDiffLabel(latest.massaGrassa, prev.massaGrassa, "%")})</span>
                                  )}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Dynamic Trend Chart */}
                  {renderChart()}

                  {/* Measurement controls and History */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] uppercase font-black text-white/40 tracking-wider">Storico Rilevazioni</span>
                      <button
                        onClick={openMeasureModal}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider text-neutral-950 cursor-pointer shadow"
                        style={{ backgroundColor: config.primaryColor }}
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Aggiungi
                      </button>
                    </div>

                    <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                      {!selectedClient.rilevazioni || selectedClient.rilevazioni.length === 0 ? (
                        <div className="text-center p-6 bg-black/20 rounded-xl border border-white/5 text-white/30 text-xs">
                          Nessun controllo antropometrico registrato.
                        </div>
                      ) : (
                        [...selectedClient.rilevazioni]
                          .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())
                          .map((m) => (
                            <div key={m.id} className="p-3 bg-black/40 rounded-xl border border-white/5 space-y-1.5 text-xs text-left relative">
                              <button
                                onClick={() => handleDeleteMeasurement(m.id)}
                                className="absolute top-2 right-2 p-1 rounded bg-black/40 text-white/30 hover:text-red-400 cursor-pointer transition-colors"
                                title="Elimina misura"
                              >
                                <X className="w-3 h-3" />
                              </button>
                              
                              <div className="flex justify-between font-bold text-[#CCFF00]">
                                <span>{m.data.replace(/(\d{4})-(\d{2})-(\d{2})/, '$3/$2/$1')}</span>
                                {m.massaGrassa && <span className="text-white/40">BF: {m.massaGrassa}%</span>}
                              </div>
                              
                              <div className="grid grid-cols-5 gap-1 text-[10px] font-medium text-white/70 bg-black/20 p-1.5 rounded border border-white/5">
                                <div className="text-center">
                                  <span className="block text-white/30 font-bold uppercase text-[8px]">Peso</span>
                                  <span>{m.peso}kg</span>
                                </div>
                                <div className="text-center">
                                  <span className="block text-white/30 font-bold uppercase text-[8px]">Vita</span>
                                  <span>{m.vita}cm</span>
                                </div>
                                <div className="text-center">
                                  <span className="block text-white/30 font-bold uppercase text-[8px]">Torace</span>
                                  <span>{m.torace}cm</span>
                                </div>
                                <div className="text-center">
                                  <span className="block text-white/30 font-bold uppercase text-[8px]">Braccio</span>
                                  <span>{m.braccio}cm</span>
                                </div>
                                <div className="text-center">
                                  <span className="block text-white/30 font-bold uppercase text-[8px]">Coscia</span>
                                  <span>{m.coscia}cm</span>
                                </div>
                              </div>

                              {m.noteControllo && (
                                <p className="text-[10px] text-white/45 italic leading-snug">Note: {m.noteControllo}</p>
                              )}
                            </div>
                          ))
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                /* Details Content: Logbook Tab */
                <div className="space-y-4">
                  <LogbookTracker client={selectedClient} config={config} onShowToast={onShowToast} />
                </div>
              )}
            </div>
          ) : (
            <div className="bg-[#121212] border border-white/5 rounded-2xl p-8 text-center text-white/40 sticky top-6">
              <User className="w-12 h-12 text-white/10 mx-auto mb-3" />
              <p className="text-xs font-black uppercase tracking-wider">Dettagli Cliente</p>
              <p className="text-[11px] text-white/30 mt-1 leading-relaxed">
                Seleziona un atleta dall'archivio a sinistra per visualizzarne i dettagli completi, aggiornare il peso attuale, consultare e inserire le misurazioni o compilare le schede d'allenamento.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Modal: Add/Edit Client */}
      {isClientModalOpen && (
        <div id="client-form-modal" className="fixed inset-0 z-50 bg-neutral-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-lg bg-[#121212] border border-white/10 rounded-2xl overflow-hidden shadow-2xl relative my-8">
            <div className="p-6 border-b border-white/10 flex justify-between items-center">
              <h3 className="font-black text-white text-sm uppercase tracking-wider">
                {editingClient ? 'Modifica Profilo Cliente' : 'Registra Nuovo Cliente'}
              </h3>
              <button 
                onClick={() => setIsClientModalOpen(false)}
                className="text-white/40 hover:text-white p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleClientSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-[10px] font-black uppercase tracking-wider text-white/40">Nome <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    required
                    placeholder="es. Mario"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-black/40 border border-white/5 text-white placeholder-white/20 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] font-black uppercase tracking-wider text-white/40">Cognome <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    required
                    placeholder="es. Rossi"
                    value={cognome}
                    onChange={(e) => setCognome(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-black/40 border border-white/5 text-white placeholder-white/20 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-[10px] font-black uppercase tracking-wider text-white/40">Età <span className="text-red-500">*</span></label>
                  <input
                    type="number"
                    required
                    min="1"
                    max="120"
                    placeholder="es. 35"
                    value={eta}
                    onChange={(e) => setEta(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-black/40 border border-white/5 text-white placeholder-white/20 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] font-black uppercase tracking-wider text-white/40">Sesso</label>
                  <select
                    value={sesso}
                    onChange={(e) => setSesso(e.target.value as Sesso)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-black/40 border border-white/5 text-white focus:outline-none"
                  >
                    <option value="Uomo">Uomo</option>
                    <option value="Donna">Donna</option>
                    <option value="Altro">Altro</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-[10px] font-black uppercase tracking-wider text-white/40">Altezza (cm)</label>
                  <input
                    type="number"
                    min="50"
                    max="250"
                    placeholder="es. 180"
                    value={altezza}
                    onChange={(e) => setAltezza(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-black/40 border border-white/5 text-white placeholder-white/20 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] font-black uppercase tracking-wider text-white/40">Peso Attuale (kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="10"
                    max="300"
                    placeholder="es. 82.5"
                    value={pesoAttuale}
                    onChange={(e) => setPesoAttuale(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-black/40 border border-white/5 text-white placeholder-white/20 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-[10px] font-black uppercase tracking-wider text-white/40">Livello Esperienza</label>
                  <select
                    value={livelloEsperienza}
                    onChange={(e) => setLivelloEsperienza(e.target.value as LivelloEsperienza)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-black/40 border border-white/5 text-white focus:outline-none"
                  >
                    <option value="Principiante">Principiante</option>
                    <option value="Intermedio">Intermedio</option>
                    <option value="Avanzato">Avanzato</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] font-black uppercase tracking-wider text-white/40">Allenamenti / Settimana</label>
                  <select
                    value={allenamentiSettimanali}
                    onChange={(e) => setAllenamentiSettimanali(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-black/40 border border-white/5 text-white focus:outline-none"
                  >
                    {[1, 2, 3, 4, 5, 6, 7].map(num => (
                      <option key={num} value={num}>{num} allenamenti</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-[10px] font-black uppercase tracking-wider text-white/40">Data Inizio Percorso</label>
                  <input
                    type="date"
                    value={dataInizio}
                    onChange={(e) => setDataInizio(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-black/40 border border-white/5 text-white focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] font-black uppercase tracking-wider text-white/40">Prossimo Controllo (Opzionale)</label>
                  <input
                    type="date"
                    value={prossimoControllo}
                    onChange={(e) => setProssimoControllo(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-black/40 border border-white/5 text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-black uppercase tracking-wider text-white/40">Obiettivo Primario <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  required
                  placeholder="es. Sviluppo massa muscolare e forza"
                  value={obiettivo}
                  onChange={(e) => setObiettivo(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-black/40 border border-white/5 text-white placeholder-white/20 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-black uppercase tracking-wider text-white/40">Limitazioni Fisiche / Infortuni (Facoltativo)</label>
                <textarea
                  placeholder="es. Leggera infiammazione alla cuffia dei rotatori, evitare squat pesanti..."
                  value={limitazioniFisiche}
                  onChange={(e) => setLimitazioniFisiche(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-black/40 border border-white/5 text-white placeholder-white/20 focus:outline-none resize-none"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-black uppercase tracking-wider text-white/40">Note Private Coach (Facoltativo)</label>
                <textarea
                  placeholder="Dettagli e note strategiche personali visibili solo al PT..."
                  value={noteCoach}
                  onChange={(e) => setNoteCoach(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-black/40 border border-white/5 text-white placeholder-white/20 focus:outline-none resize-none"
                />
              </div>

              <div className="pt-4 border-t border-white/10 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsClientModalOpen(false)}
                  className="px-4 py-2 text-xs font-black uppercase tracking-wider rounded-xl border border-white/5 hover:bg-white/5 transition-colors text-white/40 hover:text-white"
                >
                  Annulla
                </button>
                <button
                  id="client-form-submit"
                  type="submit"
                  className="px-5 py-2 text-xs font-black uppercase tracking-wider text-neutral-950 rounded-xl transition-all shadow-md cursor-pointer"
                  style={{ backgroundColor: config.primaryColor }}
                >
                  {editingClient ? 'Salva Modifiche' : 'Registra Cliente'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Anthropometric Measurement */}
      {isMeasureModalOpen && (
        <div id="measure-form-modal" className="fixed inset-0 z-50 bg-neutral-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-lg bg-[#121212] border border-white/10 rounded-2xl overflow-hidden shadow-2xl relative my-8">
            <div className="p-6 border-b border-white/10 flex justify-between items-center">
              <h3 className="font-black text-white text-sm uppercase tracking-wider">
                Aggiungi Rilevazione: {selectedClient?.nome} {selectedClient?.cognome}
              </h3>
              <button 
                onClick={() => setIsMeasureModalOpen(false)}
                className="text-white/40 hover:text-white p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleMeasureSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="space-y-1">
                <label className="block text-[10px] font-black uppercase tracking-wider text-white/40">Data Rilevazione <span className="text-red-500">*</span></label>
                <input
                  type="date"
                  required
                  value={misuraData}
                  onChange={(e) => setMisuraData(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-black/40 border border-white/5 text-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-[10px] font-black uppercase tracking-wider text-white/40">Peso Corporeo (kg) <span className="text-red-500">*</span></label>
                  <input
                    type="number"
                    step="0.1"
                    min="10"
                    max="300"
                    required
                    placeholder="es. 82.5"
                    value={misuraPeso}
                    onChange={(e) => setMisuraPeso(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-black/40 border border-white/5 text-white placeholder-white/20 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] font-black uppercase tracking-wider text-white/40">Circonferenza Vita (cm) <span className="text-red-500">*</span></label>
                  <input
                    type="number"
                    step="0.1"
                    min="30"
                    max="200"
                    required
                    placeholder="es. 88.0"
                    value={misuraVita}
                    onChange={(e) => setMisuraVita(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-black/40 border border-white/5 text-white placeholder-white/20 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-[10px] font-black uppercase tracking-wider text-white/40">Circonferenza Torace (cm) <span className="text-red-500">*</span></label>
                  <input
                    type="number"
                    step="0.1"
                    min="40"
                    max="250"
                    required
                    placeholder="es. 105.0"
                    value={misuraTorace}
                    onChange={(e) => setMisuraTorace(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-black/40 border border-white/5 text-white placeholder-white/20 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] font-black uppercase tracking-wider text-white/40">Circonferenza Braccio (cm) <span className="text-red-500">*</span></label>
                  <input
                    type="number"
                    step="0.1"
                    min="10"
                    max="100"
                    required
                    placeholder="es. 38.5"
                    value={misuraBraccio}
                    onChange={(e) => setMisuraBraccio(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-black/40 border border-white/5 text-white placeholder-white/20 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-[10px] font-black uppercase tracking-wider text-white/40">Circonferenza Coscia (cm) <span className="text-red-500">*</span></label>
                  <input
                    type="number"
                    step="0.1"
                    min="20"
                    max="150"
                    required
                    placeholder="es. 58.0"
                    value={misuraCoscia}
                    onChange={(e) => setMisuraCoscia(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-black/40 border border-white/5 text-white placeholder-white/20 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] font-black uppercase tracking-wider text-white/40">Stima Massa Grassa (% - Opzionale)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="2"
                    max="60"
                    placeholder="es. 14.5"
                    value={misuraMassaGrassa}
                    onChange={(e) => setMisuraMassaGrassa(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-black/40 border border-white/5 text-white placeholder-white/20 focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-black uppercase tracking-wider text-white/40">Note / Commenti della Rilevazione (Facoltativo)</label>
                <textarea
                  placeholder="Annotazioni sul controllo (es. post weekend libero, ottima aderenza...)"
                  value={misuraNote}
                  onChange={(e) => setMisuraNote(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-black/40 border border-white/5 text-white placeholder-white/20 focus:outline-none resize-none"
                />
              </div>

              <div className="pt-4 border-t border-white/10 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsMeasureModalOpen(false)}
                  className="px-4 py-2 text-xs font-black uppercase tracking-wider rounded-xl border border-white/5 hover:bg-white/5 transition-colors text-white/40 hover:text-white"
                >
                  Annulla
                </button>
                <button
                  id="measure-form-submit"
                  type="submit"
                  className="px-5 py-2 text-xs font-black uppercase tracking-wider text-neutral-950 rounded-xl transition-all shadow-md cursor-pointer"
                  style={{ backgroundColor: config.primaryColor }}
                >
                  Salva Rilevazione
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
