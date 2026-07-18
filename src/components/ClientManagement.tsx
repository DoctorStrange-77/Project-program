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
import ClientWorkspace from './ClientWorkspace';

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

    const clientData: Client = editingClient
      ? {
          ...editingClient,
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
        }
      : {
          id: 'c_' + Date.now(),
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
          rilevazioni: [],
          checkIns: []
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
        <div 
          id="clients-list-container" 
          className={`${selectedClient ? 'lg:col-span-1' : 'lg:col-span-3'} space-y-4 ${showMobileDetail ? 'hidden lg:block' : 'block'}`}
        >
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

          <div className={`grid ${selectedClient ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'} gap-3 max-h-[600px] overflow-y-auto pr-1`}>
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

        {/* Client Details Workspace (Full screen toggle on mobile) */}
        {selectedClient && (
          <div 
            id="client-details-container" 
            className={`lg:col-span-2 ${showMobileDetail ? 'block' : 'hidden lg:block'}`}
          >
            <ClientWorkspace
              client={selectedClient}
              plans={plans}
              config={config}
              onEditClient={(c, e) => openEditClientModal(c, e)}
              onDeleteClient={(id, name, e) => handleDeleteClient(id, name, e)}
              onSelectClientForPlan={onSelectClientForPlan}
              onAddMeasurement={openMeasureModal}
              onDeleteMeasurement={handleDeleteMeasurement}
              onClose={() => {
                setSelectedClient(null);
                setShowMobileDetail(false);
              }}
              onShowToast={onShowToast}
              onUpdateClient={(updatedClient) => {
                onUpdateClient(updatedClient);
                setSelectedClient(updatedClient);
              }}
              onShowConfirm={onShowConfirm}
            />
          </div>
        )}
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
