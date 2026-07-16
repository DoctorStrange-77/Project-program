/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { CoachConfig, Client, WorkoutPlan, WorkoutTemplate, LogbookEntry } from '../types';
import { 
  Download, Upload, RefreshCw, Trash2, ShieldAlert, Check, X, FileJson, AlertCircle
} from 'lucide-react';

interface BackupManagerProps {
  config: CoachConfig;
  clients: Client[];
  plans: WorkoutPlan[];
  templates: WorkoutTemplate[];
  onUpdateConfig: (config: CoachConfig) => void;
  onUpdateClients: (clients: Client[]) => void;
  onUpdatePlans: (plans: WorkoutPlan[]) => void;
  onUpdateTemplates: (templates: WorkoutTemplate[]) => void;
  onShowToast: (message: string, type: 'success' | 'error' | 'info' | 'warning') => void;
  onShowConfirm: (config: {
    title: string;
    message: string;
    confirmText: string;
    cancelText?: string;
    isDestructive?: boolean;
    onConfirm: () => void;
  }) => void;
}

export default function BackupManager({
  config,
  clients,
  plans,
  templates,
  onUpdateConfig,
  onUpdateClients,
  onUpdatePlans,
  onUpdateTemplates,
  onShowToast,
  onShowConfirm
}: BackupManagerProps) {
  const [selectedClientToExport, setSelectedClientToExport] = useState('');
  const [selectedPlanToExport, setSelectedPlanToExport] = useState('');
  const [confirmClearStep, setConfirmClearStep] = useState(0); // 0 = default, 1 = first warning, 2 = final double warning
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Helper: Trigger file download
  const downloadJSONFile = (data: any, fileName: string) => {
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(data, null, 2))}`;
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', jsonString);
    downloadAnchor.setAttribute('download', fileName);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // 1. Export All Data
  const handleExportAll = () => {
    const logbookData = localStorage.getItem('pt_logbook');
    const backupObj = {
      version: "1.1",
      type: "pt_coach_backup",
      timestamp: new Date().toISOString(),
      config,
      clients,
      plans,
      templates,
      logbook: logbookData ? JSON.parse(logbookData) : []
    };
    downloadJSONFile(backupObj, `backup_completo_pt_${new Date().toISOString().split('T')[0]}.json`);
    onShowToast('Backup completo esportato con successo!', 'success');
  };

  // 2. Export Single Client
  const handleExportSingleClient = () => {
    if (!selectedClientToExport) {
      onShowToast('Seleziona un cliente da esportare.', 'warning');
      return;
    }
    const client = clients.find(c => c.id === selectedClientToExport);
    if (!client) return;

    // Grab plans and logbook for this specific client
    const clientPlans = plans.filter(p => p.clienteId === client.id);
    const logbookData = localStorage.getItem('pt_logbook');
    const clientLogs = logbookData ? JSON.parse(logbookData).filter((l: LogbookEntry) => l.clienteId === client.id) : [];

    const exportObj = {
      type: "pt_single_client",
      client,
      plans: clientPlans,
      logbook: clientLogs
    };

    const sanitizedName = `${client.nome}_${client.cognome}`.toLowerCase().replace(/[^a-z0-9]/g, '_');
    downloadJSONFile(exportObj, `cliente_${sanitizedName}.json`);
    onShowToast(`Profilo di ${client.nome} ${client.cognome} esportato con successo!`, 'success');
  };

  // 3. Export Single Plan
  const handleExportSinglePlan = () => {
    if (!selectedPlanToExport) {
      onShowToast('Seleziona una scheda da esportare.', 'warning');
      return;
    }
    const plan = plans.find(p => p.id === selectedPlanToExport);
    if (!plan) return;

    const exportObj = {
      type: "pt_single_plan",
      plan
    };

    const sanitizedName = plan.nome.toLowerCase().replace(/[^a-z0-9]/g, '_');
    downloadJSONFile(exportObj, `scheda_${sanitizedName}.json`);
    onShowToast(`Scheda "${plan.nome}" esportata con successo!`, 'success');
  };

  // 4. Import JSON Backup File
  const handleImportFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const fileContent = e.target?.result as string;
        const data = JSON.parse(fileContent);

        // A. Validate file structure
        if (!data || typeof data !== 'object') {
          throw new Error('Il file non è un oggetto JSON valido.');
        }

        if (data.type === 'pt_coach_backup') {
          // Validate full backup format
          if (!data.config || !Array.isArray(data.clients) || !Array.isArray(data.plans)) {
            throw new Error('Struttura del backup completo non valida o incompleta.');
          }

          // Full Backup Confirmation Flow
          onShowConfirm({
            title: 'Ripristina Backup Completo',
            message: `File di backup valido rilevato. Contiene ${data.clients.length} clienti e ${data.plans.length} schede. Desideri unire i dati a quelli esistenti (consigliato) o sovrascrivere l'intero database?`,
            confirmText: 'Unisci (Conserva attuali)',
            cancelText: 'Annulla',
            onConfirm: () => {
              // Option A: Merge Data (Avoiding duplicates by ID)
              const mergedConfig = { ...config, ...data.config, isConfigured: true };
              
              // Unique clients
              const existingClientIds = new Set(clients.map(c => c.id));
              const newClients = data.clients.filter((c: Client) => !existingClientIds.has(c.id));
              const mergedClients = [...clients, ...newClients];

              // Unique plans
              const existingPlanIds = new Set(plans.map(p => p.id));
              const newPlans = data.plans.filter((p: WorkoutPlan) => !existingPlanIds.has(p.id));
              const mergedPlans = [...plans, ...newPlans];

              // Unique templates
              const existingTemplateIds = new Set(templates.map(t => t.id));
              const newTemplates = (data.templates || []).filter((t: WorkoutTemplate) => !existingTemplateIds.has(t.id));
              const mergedTemplates = [...templates, ...newTemplates];

              // Unique logbooks
              const currentLogsStr = localStorage.getItem('pt_logbook');
              const currentLogs: LogbookEntry[] = currentLogsStr ? JSON.parse(currentLogsStr) : [];
              const existingLogIds = new Set(currentLogs.map(l => l.id));
              const newLogs = (data.logbook || []).filter((l: LogbookEntry) => !existingLogIds.has(l.id));
              const mergedLogs = [...currentLogs, ...newLogs];

              // Apply Changes
              onUpdateConfig(mergedConfig);
              onUpdateClients(mergedClients);
              onUpdatePlans(mergedPlans);
              onUpdateTemplates(mergedTemplates);
              localStorage.setItem('pt_clients', JSON.stringify(mergedClients));
              localStorage.setItem('pt_plans', JSON.stringify(mergedPlans));
              localStorage.setItem('pt_templates', JSON.stringify(mergedTemplates));
              localStorage.setItem('pt_coach_config', JSON.stringify(mergedConfig));
              localStorage.setItem('pt_logbook', JSON.stringify(mergedLogs));

              onShowToast('Dati uniti con successo dal backup!', 'success');
              if (fileInputRef.current) fileInputRef.current.value = '';
            }
          });

          // Also allow complete overwrite if requested, but request explicit second confirmation
          setTimeout(() => {
            onShowConfirm({
              title: '⚠️ SOVRASCRIVERE completamente?',
              message: 'Se scegli questa opzione, tutti i dati attualmente presenti sul dispositivo verranno eliminati e sostituiti interamente dal file di backup. Confermi di voler procedere con la SOVRASCRITTURA?',
              confirmText: 'Sì, sovrascrivi tutto (Pericolo)',
              cancelText: 'No, unisci soltanto',
              isDestructive: true,
              onConfirm: () => {
                const importedConfig = { ...data.config, isConfigured: true };
                onUpdateConfig(importedConfig);
                onUpdateClients(data.clients);
                onUpdatePlans(data.plans);
                onUpdateTemplates(data.templates || []);
                
                localStorage.setItem('pt_clients', JSON.stringify(data.clients));
                localStorage.setItem('pt_plans', JSON.stringify(data.plans));
                localStorage.setItem('pt_templates', JSON.stringify(data.templates || []));
                localStorage.setItem('pt_coach_config', JSON.stringify(importedConfig));
                localStorage.setItem('pt_logbook', JSON.stringify(data.logbook || []));

                onShowToast('Database sovrascritto interamente con i dati del backup!', 'success');
                if (fileInputRef.current) fileInputRef.current.value = '';
              }
            });
          }, 300);

        } else if (data.type === 'pt_single_client') {
          // Single client import
          if (!data.client || !data.client.id || !data.client.nome) {
            throw new Error('Dati del singolo cliente non validi.');
          }

          onShowConfirm({
            title: 'Importa Singolo Cliente',
            message: `Desideri importare il profilo del cliente "${data.client.nome} ${data.client.cognome}" insieme alle sue ${data.plans?.length || 0} schede e ${data.logbook?.length || 0} logbook?`,
            confirmText: 'Importa Cliente',
            onConfirm: () => {
              // Merge client
              const updatedClients = [...clients.filter(c => c.id !== data.client.id), data.client];
              onUpdateClients(updatedClients);
              localStorage.setItem('pt_clients', JSON.stringify(updatedClients));

              // Merge plans
              const importedPlans = data.plans || [];
              const importedPlanIds = new Set(importedPlans.map((p: any) => p.id));
              const updatedPlans = [...plans.filter(p => !importedPlanIds.has(p.id)), ...importedPlans];
              onUpdatePlans(updatedPlans);
              localStorage.setItem('pt_plans', JSON.stringify(updatedPlans));

              // Merge logbook
              const importedLogs = data.logbook || [];
              const importedLogIds = new Set(importedLogs.map((l: any) => l.id));
              const logbookData = localStorage.getItem('pt_logbook');
              const currentLogs = logbookData ? JSON.parse(logbookData) : [];
              const updatedLogs = [...currentLogs.filter((l: any) => !importedLogIds.has(l.id)), ...importedLogs];
              localStorage.setItem('pt_logbook', JSON.stringify(updatedLogs));

              onShowToast(`Cliente ${data.client.nome} ${data.client.cognome} importato con successo!`, 'success');
              if (fileInputRef.current) fileInputRef.current.value = '';
            }
          });

        } else if (data.type === 'pt_single_plan') {
          // Single plan import
          if (!data.plan || !data.plan.id || !data.plan.nome) {
            throw new Error('Dati della singola scheda non validi.');
          }

          onShowConfirm({
            title: 'Importa Singola Scheda',
            message: `Desideri importare la scheda di allenamento "${data.plan.nome}" associata a "${data.plan.clienteNomeCompleto}"?`,
            confirmText: 'Importa Scheda',
            onConfirm: () => {
              const updatedPlans = [...plans.filter(p => p.id !== data.plan.id), data.plan];
              onUpdatePlans(updatedPlans);
              localStorage.setItem('pt_plans', JSON.stringify(updatedPlans));

              onShowToast(`Scheda "${data.plan.nome}" importata con successo!`, 'success');
              if (fileInputRef.current) fileInputRef.current.value = '';
            }
          });

        } else {
          throw new Error('Tipo di file di backup non riconosciuto.');
        }

      } catch (err: any) {
        onShowToast(`Errore di validazione: ${err.message || 'File non valido.'}`, 'error');
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsText(file);
  };

  // 5. Restore Demo Data
  const handleRestoreDemo = () => {
    onShowConfirm({
      title: 'Ripristinare Dati Dimostrativi?',
      message: 'Questa azione sovrascriverà tutti i clienti, schede d\'allenamento e modelli attuali con la configurazione di prova iniziale. Vuoi procedere?',
      confirmText: 'Sì, Ripristina Demo',
      isDestructive: true,
      onConfirm: () => {
        const { DEMO_CLIENTS, DEMO_WORKOUT_PLANS, DEMO_TEMPLATES } = require('../data/demoData');
        const { INITIAL_EXERCISES } = require('../data/exercises');

        onUpdateClients(DEMO_CLIENTS);
        onUpdatePlans(DEMO_WORKOUT_PLANS);
        onUpdateTemplates(DEMO_TEMPLATES);
        
        localStorage.setItem('pt_clients', JSON.stringify(DEMO_CLIENTS));
        localStorage.setItem('pt_plans', JSON.stringify(DEMO_WORKOUT_PLANS));
        localStorage.setItem('pt_templates', JSON.stringify(DEMO_TEMPLATES));
        localStorage.setItem('pt_exercises', JSON.stringify(INITIAL_EXERCISES));
        localStorage.removeItem('pt_logbook');

        onShowToast('Dati dimostrativi ripristinati correttamente!', 'success');
      }
    });
  };

  // 6. Double confirmation delete
  const triggerDoubleConfirmDelete = () => {
    if (confirmClearStep === 0) {
      setConfirmClearStep(1);
    }
  };

  const cancelDelete = () => {
    setConfirmClearStep(0);
  };

  const executeFullDelete = () => {
    localStorage.clear();
    onShowToast('Archivio interamente ripulito. Riavvio in corso...', 'success');
    setTimeout(() => {
      window.location.reload();
    }, 1200);
  };

  return (
    <div id="backup-manager-section" className="space-y-6">
      
      {/* Title */}
      <div>
        <h2 className="text-lg font-black uppercase tracking-wider text-white flex items-center gap-2">
          <FileJson className="w-5 h-5 text-[#CCFF00]" style={{ color: config.primaryColor }} />
          Gestione Backup e Ripristino
        </h2>
        <p className="text-xs text-white/40 font-medium">Esporta e importa i tuoi dati in formato JSON protetto per non perdere mai le tue informazioni.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        {/* Full Backup Column */}
        <div className="bg-[#121212] border border-white/5 p-5 rounded-2xl space-y-4 text-left">
          <h3 className="text-xs font-black uppercase tracking-wider text-white">Salvataggio & Caricamento Database</h3>
          <p className="text-[11px] text-white/50 leading-relaxed">
            Conserva una copia completa di tutta l'applicazione (Impostazioni, Clienti, Rilevazioni, Schede di allenamento, Modelli e Registro Logbook).
          </p>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            {/* Export All */}
            <button
              onClick={handleExportAll}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-[#1c1c1c] hover:bg-neutral-800 border border-white/5 rounded-xl text-xs font-bold uppercase tracking-wider text-white transition-all cursor-pointer shadow-sm"
            >
              <Download className="w-4 h-4 text-[#CCFF00]" style={{ color: config.primaryColor }} />
              Esporta Tutto (JSON)
            </button>

            {/* Import Trigger */}
            <label className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-neutral-900 hover:bg-neutral-800 border border-white/10 rounded-xl text-xs font-bold uppercase tracking-wider text-white/80 hover:text-white transition-all cursor-pointer shadow-sm text-center">
              <Upload className="w-4 h-4 text-white/40" />
              <span>Importa file JSON</span>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleImportFile}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {/* Partial Single Export Column */}
        <div className="bg-[#121212] border border-white/5 p-5 rounded-2xl space-y-4 text-left">
          <h3 className="text-xs font-black uppercase tracking-wider text-white">Esportazioni Selettive Singole</h3>
          <p className="text-[11px] text-white/50 leading-relaxed">
            Esporta ed estrai esclusivamente i dati di un singolo atleta (con relativi log) o una singola scheda d'allenamento.
          </p>

          <div className="space-y-3 pt-2">
            {/* Single Client Export */}
            <div className="flex gap-2 items-center">
              <select
                value={selectedClientToExport}
                onChange={(e) => setSelectedClientToExport(e.target.value)}
                className="flex-1 px-3 py-2 bg-neutral-950 border border-white/5 rounded-xl text-xs text-white focus:outline-none"
              >
                <option value="" className="bg-neutral-900 text-white">-- Seleziona un Atleta --</option>
                {clients.map(c => (
                  <option key={c.id} value={c.id} className="bg-neutral-900 text-white">{c.nome} {c.cognome}</option>
                ))}
              </select>
              <button
                onClick={handleExportSingleClient}
                className="p-2.5 bg-neutral-900 border border-white/5 hover:border-[#CCFF00]/25 rounded-xl text-white/80 hover:text-white transition-all cursor-pointer shrink-0"
                title="Esporta Profilo Atleta"
              >
                <Download className="w-4 h-4" />
              </button>
            </div>

            {/* Single Plan Export */}
            <div className="flex gap-2 items-center">
              <select
                value={selectedPlanToExport}
                onChange={(e) => setSelectedPlanToExport(e.target.value)}
                className="flex-1 px-3 py-2 bg-black border border-white/5 rounded-xl text-xs text-white focus:outline-none"
              >
                <option value="">-- Seleziona una Scheda --</option>
                {plans.map(p => (
                  <option key={p.id} value={p.id}>{p.nome} ({p.clienteNomeCompleto})</option>
                ))}
              </select>
              <button
                onClick={handleExportSinglePlan}
                className="p-2.5 bg-neutral-900 border border-white/5 hover:border-[#CCFF00]/25 rounded-xl text-white/80 hover:text-white transition-all cursor-pointer shrink-0"
                title="Esporta Scheda d'Allenamento"
              >
                <Download className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Demo and Wipe Area */}
      <div className="bg-[#121212] border border-red-950/20 p-5 rounded-2xl text-left space-y-4">
        <h3 className="text-xs font-black uppercase tracking-wider text-red-500 flex items-center gap-1.5">
          <AlertCircle className="w-4 h-4" />
          Ripristino e Cancellazione Archivio
        </h3>
        
        <div className="flex flex-col sm:flex-row gap-3 pt-1">
          {/* Restore Demo Data */}
          <button
            onClick={handleRestoreDemo}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-[#1e1414] hover:bg-[#281818] border border-red-900/10 hover:border-red-900/30 text-red-300 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            Ripristina Dati di Esempio
          </button>

          {/* Wipe All Data - Double Confirm Trigger */}
          {confirmClearStep === 0 ? (
            <button
              onClick={triggerDoubleConfirmDelete}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-red-950/20 hover:bg-red-950/40 border border-red-950 text-red-400 hover:text-red-300 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              Cancellazione Totale
            </button>
          ) : confirmClearStep === 1 ? (
            <div className="flex-1 flex flex-col gap-2 p-3 bg-red-950/20 border border-red-900 rounded-xl">
              <p className="text-[10px] text-red-200 font-bold leading-normal">
                ⚠️ SEI SICURO? Tutti i clienti, schede d'allenamento, logbook e preferenze verranno eliminati permanentemente.
              </p>
              <div className="flex gap-2 text-[10px] font-bold uppercase">
                <button
                  onClick={() => setConfirmClearStep(2)}
                  className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg cursor-pointer"
                >
                  Sì, Procedi
                </button>
                <button
                  onClick={cancelDelete}
                  className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg cursor-pointer"
                >
                  Annulla
                </button>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col gap-2 p-3 bg-red-900/40 border-2 border-red-600 rounded-xl">
              <p className="text-[10px] text-white font-black leading-normal flex items-center gap-1">
                <ShieldAlert className="w-4 h-4 text-white shrink-0" />
                CONFERMA FINALE: Non potrai annullare questa operazione. Eliminare tutto?
              </p>
              <div className="flex gap-2 text-[10px] font-bold uppercase">
                <button
                  onClick={executeFullDelete}
                  className="px-3 py-1.5 bg-white text-red-700 hover:bg-red-100 rounded-lg cursor-pointer"
                >
                  SÌ, ELIMINA DEFINITIVAMENTE
                </button>
                <button
                  onClick={cancelDelete}
                  className="px-3 py-1.5 bg-neutral-900 text-white hover:bg-neutral-800 rounded-lg cursor-pointer"
                >
                  Annulla
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
