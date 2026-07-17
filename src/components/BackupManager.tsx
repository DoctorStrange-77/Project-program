/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { CoachConfig, Client, WorkoutPlan, WorkoutTemplate, LogbookEntry, Exercise } from '../types';
import { 
  Download, Upload, RefreshCw, Trash2, ShieldAlert, Check, X, FileJson, AlertCircle, HelpCircle, ShieldCheck
} from 'lucide-react';
import { 
  CURRENT_DATA_VERSION, 
  validateBackup, 
  exportBackup, 
  createPreImportBackup, 
  restorePreImportBackup, 
  mergeItems 
} from '../utils/dataMigrations';

interface BackupManagerProps {
  config: CoachConfig;
  clients: Client[];
  plans: WorkoutPlan[];
  templates: WorkoutTemplate[];
  exercises: Exercise[];
  logbook: LogbookEntry[];
  onUpdateConfig: (config: CoachConfig) => void;
  onUpdateClients: (clients: Client[]) => void;
  onUpdatePlans: (plans: WorkoutPlan[]) => void;
  onUpdateTemplates: (templates: WorkoutTemplate[]) => void;
  onUpdateExercises: (exercises: Exercise[]) => void;
  onUpdateLogbook: (logbook: LogbookEntry[]) => void;
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
  exercises,
  logbook,
  onUpdateConfig,
  onUpdateClients,
  onUpdatePlans,
  onUpdateTemplates,
  onUpdateExercises,
  onUpdateLogbook,
  onShowToast,
  onShowConfirm
}: BackupManagerProps) {
  const [importedBackupData, setImportedBackupData] = useState<any | null>(null);
  const [hasPreImportBackup, setHasPreImportBackup] = useState(false);
  const [confirmClearStep, setConfirmClearStep] = useState(0); // 0 = default, 1 = first warning, 2 = final double warning
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Check if safety backup exists on mount/update
  useEffect(() => {
    setHasPreImportBackup(!!localStorage.getItem('pt_pre_import_backup'));
  }, []);

  // 1. Export All Data
  const handleExportAll = () => {
    try {
      const backupObj = exportBackup(clients, exercises, plans, templates, logbook, config);
      const jsonString = JSON.stringify(backupObj, null, 2);
      
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const downloadAnchor = document.createElement('a');
      
      // Filename styled exactly as: backup-coach-YYYY-MM-DD.json
      const todayStr = new Date().toISOString().split('T')[0]; // "2026-07-17"
      downloadAnchor.setAttribute('href', url);
      downloadAnchor.setAttribute('download', `backup-coach-${todayStr}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      URL.revokeObjectURL(url);
      
      onShowToast('Backup completo esportato con successo!', 'success');
    } catch (error: any) {
      onShowToast(`Errore durante l'esportazione: ${error.message || error}`, 'error');
    }
  };

  // 2. Read and Validate JSON file
  const handleImportFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const fileContent = e.target?.result as string;
        if (!fileContent || fileContent.trim() === '') {
          throw new Error('Il file di backup è vuoto.');
        }

        const parsedData = JSON.parse(fileContent);

        // Validazione della struttura
        const validation = validateBackup(parsedData);
        if (!validation.isValid) {
          throw new Error(validation.error || 'Struttura di backup non valida.');
        }

        // Se valido, mostriamo l'anteprima/riassunto prima di procedere
        setImportedBackupData(parsedData);
        onShowToast('Backup letto con successo! Verifica il riepilogo prima di procedere.', 'info');
      } catch (err: any) {
        onShowToast(`Errore di validazione: ${err.message || 'File non valido.'}`, 'error');
        setImportedBackupData(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsText(file);
  };

  // 3. Modalità Sostituisci Tutti i Dati
  const handleReplaceAll = (data: any) => {
    onShowConfirm({
      title: '⚠️ SOVRASCRIVERE COMPLETAMENTE?',
      message: 'Se scegli questa opzione, tutti i dati attualmente presenti sul dispositivo verranno eliminati e sostituiti interamente dal file di backup. Verrà creata una copia di rollback per poter annullare l\'operazione.',
      confirmText: 'Sì, sovrascrivi tutto',
      cancelText: 'Annulla',
      isDestructive: true,
      onConfirm: () => {
        try {
          // 1. Snapshot dello stato corrente (per rollback e undo)
          createPreImportBackup();
          setHasPreImportBackup(true);

          // 2. Aggiorna localStorage
          // Per garantire atomicità, eseguiamo le scritture in un try interno. Se fallisce, facciamo il rollback.
          try {
            localStorage.setItem('pt_clients', JSON.stringify(data.clients || []));
            localStorage.setItem('pt_plans', JSON.stringify(data.plans || []));
            localStorage.setItem('pt_templates', JSON.stringify(data.templates || []));
            localStorage.setItem('pt_exercises', JSON.stringify(data.exercises || []));
            localStorage.setItem('pt_logbook', JSON.stringify(data.logbook || []));
            localStorage.setItem('pt_coach_config', JSON.stringify(data.coachConfig || {}));
            localStorage.setItem('pt_data_version', String(data.dataVersion || CURRENT_DATA_VERSION));

            if (data.analysisSettings) {
              Object.entries(data.analysisSettings).forEach(([key, val]) => {
                localStorage.setItem(key, val as string);
              });
            }
            if (data.otherPtKeys) {
              Object.entries(data.otherPtKeys).forEach(([key, val]) => {
                localStorage.setItem(key, val as string);
              });
            }
          } catch (storageError: any) {
            // Rollback immediato
            restorePreImportBackup();
            throw new Error(`Spazio di archiviazione insufficiente (localStorage pieno) o errore di scrittura: ${storageError.message || storageError}`);
          }

          // 3. Aggiorna gli stati React in memoria del parent (solo se la scrittura su disco è completata con successo)
          onUpdateClients(data.clients || []);
          onUpdatePlans(data.plans || []);
          onUpdateTemplates(data.templates || []);
          onUpdateExercises(data.exercises || []);
          onUpdateLogbook(data.logbook || []);
          onUpdateConfig(data.coachConfig || {});

          // Reset stato importazione
          setImportedBackupData(null);
          if (fileInputRef.current) fileInputRef.current.value = '';

          onShowToast('Database interamente ripristinato dal file di backup!', 'success');
        } catch (error: any) {
          onShowToast(error.message || 'Errore imprevisto durante il ripristino.', 'error');
        }
      }
    });
  };

  // 4. Modalità Unisci con i Dati Esistenti
  const handleMergeData = async (data: any) => {
    try {
      // 1. Snapshot dello stato corrente
      createPreImportBackup();
      setHasPreImportBackup(true);

      // Risoluzione dei conflitti interattiva
      const askConflict = async (itemType: string, currentItem: any, importedItem: any): Promise<'current' | 'imported'> => {
        const name = currentItem.nome || currentItem.nomeCompleto || currentItem.nomeProgramma || currentItem.exerciseNome || `ID: ${currentItem.id}`;
        const labelType = itemType === 'clients' ? 'Atleta' :
                          itemType === 'exercises' ? 'Esercizio' :
                          itemType === 'plans' ? 'Scheda' :
                          itemType === 'templates' ? 'Modello' :
                          itemType === 'logbook' ? 'Rilevazione logbook' : 'Elemento';
        
        const proceed = window.confirm(
          `Conflitto rilevato per "${labelType}": "${name}".\n\nDesideri sovrascrivere l'elemento sul dispositivo con quello importato dal backup?\n\n[OK = Importa dal backup, ANNULLA = Conserva attuale]`
        );
        return proceed ? 'imported' : 'current';
      };

      // 2. Unisci gli array principali
      const mergedClients = await mergeItems(clients, data.clients || [], askConflict, 'clients');
      const mergedExercises = await mergeItems(exercises, data.exercises || [], askConflict, 'exercises');
      const mergedPlans = await mergeItems(plans, data.plans || [], askConflict, 'plans');
      const mergedTemplates = await mergeItems(templates, data.templates || [], askConflict, 'templates');
      const mergedLogbook = await mergeItems(logbook, data.logbook || [], askConflict, 'logbook');
      
      const mergedConfig = { ...config, ...(data.coachConfig || {}) };

      // 3. Scrivi in localStorage con protezione rollback
      try {
        localStorage.setItem('pt_clients', JSON.stringify(mergedClients));
        localStorage.setItem('pt_plans', JSON.stringify(mergedPlans));
        localStorage.setItem('pt_templates', JSON.stringify(mergedTemplates));
        localStorage.setItem('pt_exercises', JSON.stringify(mergedExercises));
        localStorage.setItem('pt_logbook', JSON.stringify(mergedLogbook));
        localStorage.setItem('pt_coach_config', JSON.stringify(mergedConfig));
        
        if (data.analysisSettings) {
          Object.entries(data.analysisSettings).forEach(([key, val]) => {
            localStorage.setItem(key, val as string);
          });
        }
        if (data.otherPtKeys) {
          Object.entries(data.otherPtKeys).forEach(([key, val]) => {
            localStorage.setItem(key, val as string);
          });
        }
      } catch (storageError: any) {
        restorePreImportBackup();
        throw new Error(`localStorage pieno o errore di scrittura durante l'unione: ${storageError.message || storageError}`);
      }

      // 4. Aggiorna stati React
      onUpdateClients(mergedClients);
      onUpdateExercises(mergedExercises);
      onUpdatePlans(mergedPlans);
      onUpdateTemplates(mergedTemplates);
      onUpdateLogbook(mergedLogbook);
      onUpdateConfig(mergedConfig);

      setImportedBackupData(null);
      if (fileInputRef.current) fileInputRef.current.value = '';

      onShowToast('Dati uniti con successo! Eventuali conflitti sono stati risolti.', 'success');
    } catch (error: any) {
      onShowToast(error.message || 'Errore durante l\'unione dei dati.', 'error');
    }
  };

  // 5. Annulla Ultimo Ripristino (Rollback)
  const handleUndoRestore = () => {
    onShowConfirm({
      title: 'Annullare l\'ultimo ripristino?',
      message: 'Vuoi davvero annullare l\'ultima importazione o unione e ritornare allo stato precedente?',
      confirmText: 'Sì, ripristina stato precedente',
      cancelText: 'No',
      isDestructive: true,
      onConfirm: () => {
        const success = restorePreImportBackup();
        if (success) {
          localStorage.removeItem('pt_pre_import_backup');
          setHasPreImportBackup(false);

          // Ricarica gli stati in React leggendoli dal localStorage appena ripristinato
          const savedConfig = localStorage.getItem('pt_coach_config');
          const savedClients = localStorage.getItem('pt_clients');
          const savedPlans = localStorage.getItem('pt_plans');
          const savedTemplates = localStorage.getItem('pt_templates');
          const savedExercises = localStorage.getItem('pt_exercises');
          const savedLogbook = localStorage.getItem('pt_logbook');

          if (savedConfig) onUpdateConfig(JSON.parse(savedConfig));
          if (savedClients) onUpdateClients(JSON.parse(savedClients));
          if (savedPlans) onUpdatePlans(JSON.parse(savedPlans));
          if (savedTemplates) onUpdateTemplates(JSON.parse(savedTemplates));
          if (savedExercises) onUpdateExercises(JSON.parse(savedExercises));
          if (savedLogbook) onUpdateLogbook(JSON.parse(savedLogbook));

          onShowToast('Ultimo ripristino annullato con successo! Dati riportati allo stato precedente.', 'success');
        } else {
          onShowToast('Impossibile annullare l\'ultimo ripristino.', 'error');
        }
      }
    });
  };

  // 6. Ripristino Dati Dimostrativi
  const handleRestoreDemo = () => {
    onShowConfirm({
      title: 'Ripristinare Dati Dimostrativi?',
      message: 'Questa azione sovrascriverà tutti i clienti, schede d\'allenamento e modelli attuali con la configurazione di prova iniziale. Vuoi procedere?',
      confirmText: 'Sì, Ripristina Demo',
      isDestructive: true,
      onConfirm: () => {
        try {
          createPreImportBackup();
          setHasPreImportBackup(true);

          const { DEMO_CLIENTS, DEMO_WORKOUT_PLANS, DEMO_TEMPLATES } = require('../data/demoData');
          const { INITIAL_EXERCISES } = require('../data/exercises');

          localStorage.setItem('pt_clients', JSON.stringify(DEMO_CLIENTS));
          localStorage.setItem('pt_plans', JSON.stringify(DEMO_WORKOUT_PLANS));
          localStorage.setItem('pt_templates', JSON.stringify(DEMO_TEMPLATES));
          localStorage.setItem('pt_exercises', JSON.stringify(INITIAL_EXERCISES));
          localStorage.removeItem('pt_logbook');

          onUpdateClients(DEMO_CLIENTS);
          onUpdatePlans(DEMO_WORKOUT_PLANS);
          onUpdateTemplates(DEMO_TEMPLATES);
          onUpdateExercises(INITIAL_EXERCISES);
          onUpdateLogbook([]);

          onShowToast('Dati dimostrativi ripristinati correttamente!', 'success');
        } catch (err: any) {
          onShowToast(`Errore durante il ripristino dei dati demo: ${err.message}`, 'error');
        }
      }
    });
  };

  // 7. Cancellazione Totale
  const executeFullDelete = () => {
    try {
      createPreImportBackup();
      setHasPreImportBackup(true);

      localStorage.clear();
      onUpdateClients([]);
      onUpdatePlans([]);
      onUpdateTemplates([]);
      onUpdateExercises([]);
      onUpdateLogbook([]);
      onUpdateConfig({
        nomeProgramma: '',
        nomeCoach: '',
        primaryColor: '#CCFF00',
        isConfigured: false
      });

      onShowToast('Archivio interamente ripulito. Verrà eseguito il riavvio...', 'success');
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (err: any) {
      onShowToast(`Errore durante la pulizia totale: ${err.message}`, 'error');
    }
  };

  const triggerDoubleConfirmDelete = () => {
    if (confirmClearStep === 0) {
      setConfirmClearStep(1);
    }
  };

  const cancelDelete = () => {
    setConfirmClearStep(0);
  };

  return (
    <div id="backup-manager-section" className="space-y-6">
      
      {/* Intestazione */}
      <div>
        <h2 className="text-lg font-black uppercase tracking-wider text-white flex items-center gap-2">
          <FileJson className="w-5 h-5" style={{ color: config.primaryColor || '#CCFF00' }} />
          Backup e ripristino locale
        </h2>
        <p className="text-xs text-white/40 font-medium">Esporta, importa e mantieni al sicuro tutti i dati locali sul tuo browser.</p>
      </div>

      {/* Box Info Privacy */}
      <div className="bg-[#121212] border border-blue-950/30 p-4 rounded-xl flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
        <div className="text-left">
          <p className="text-xs font-bold text-white">Nota sulla Sicurezza & Privacy</p>
          <p className="text-[11px] text-white/50 leading-relaxed mt-0.5">
            Il backup può contenere dati personali dei clienti. Conservalo in un luogo sicuro e non condividerlo senza autorizzazione.
            Nessun dato viene inviato a servizi esterni: l’intera procedura avviene offline, direttamente nel tuo browser.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        {/* Sezione Esportazione e Importazione principale */}
        <div className="bg-[#121212] border border-white/5 p-5 rounded-2xl space-y-4 text-left">
          <h3 className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-1.5">
            <Download className="w-4 h-4 text-white/60" />
            Salvataggio & Caricamento Database
          </h3>
          <p className="text-[11px] text-white/50 leading-relaxed">
            Conserva una copia completa di tutta l'applicazione (Impostazioni, Clienti, Schede d'allenamento, Modelli, Esercizi, Registro Logbook e impostazioni analisi).
          </p>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            {/* Pulsante Esporta */}
            <button
              onClick={handleExportAll}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-[#1c1c1c] hover:bg-neutral-800 border border-white/5 rounded-xl text-xs font-bold uppercase tracking-wider text-white transition-all cursor-pointer shadow-sm"
            >
              <Download className="w-4 h-4" style={{ color: config.primaryColor || '#CCFF00' }} />
              Esporta backup completo
            </button>

            {/* Pulsante Seleziona File JSON */}
            <label className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-neutral-900 hover:bg-neutral-800 border border-white/10 rounded-xl text-xs font-bold uppercase tracking-wider text-white/80 hover:text-white transition-all cursor-pointer shadow-sm text-center">
              <Upload className="w-4 h-4 text-white/40" />
              <span>Importa backup</span>
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

        {/* Sezione Sicurezza / Rollback */}
        <div className="bg-[#121212] border border-white/5 p-5 rounded-2xl space-y-4 text-left">
          <h3 className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-1.5">
            <ShieldAlert className="w-4 h-4 text-white/60" />
            Ripristino Stato Precedente
          </h3>
          <p className="text-[11px] text-white/50 leading-relaxed">
            Se hai commesso un errore durante l'importazione o unione dei dati, puoi ritornare istantaneamente alla configurazione precedente.
          </p>

          <div className="pt-2">
            <button
              onClick={handleUndoRestore}
              disabled={!hasPreImportBackup}
              className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shadow-sm ${
                hasPreImportBackup 
                  ? 'bg-amber-950/20 hover:bg-amber-950/40 text-amber-300 border border-amber-900/40' 
                  : 'bg-neutral-900/40 text-white/20 border border-white/5 cursor-not-allowed'
              }`}
            >
              <RefreshCw className={`w-4 h-4 ${hasPreImportBackup ? 'text-amber-400' : 'text-white/10'}`} />
              Annulla ultimo ripristino
            </button>
            {!hasPreImportBackup && (
              <p className="text-[10px] text-white/30 text-center mt-2 italic">Nessun punto di ripristino disponibile al momento.</p>
            )}
          </div>
        </div>
      </div>

      {/* Anteprima / Riepilogo Dati del file importato */}
      {importedBackupData && (
        <div className="bg-neutral-900 border border-white/10 p-5 rounded-2xl text-left space-y-4 animate-fade-in">
          <div className="flex justify-between items-center border-b border-white/5 pb-2">
            <h3 className="text-sm font-black uppercase tracking-wider text-[#CCFF00]" style={{ color: config.primaryColor || '#CCFF00' }}>
              Riepilogo Dati File Selezionato
            </h3>
            <button 
              onClick={() => {
                setImportedBackupData(null);
                if (fileInputRef.current) fileInputRef.current.value = '';
              }}
              className="p-1 hover:bg-white/5 rounded text-white/60 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4 py-1">
            <div className="bg-black/40 p-3 rounded-xl border border-white/5">
              <span className="block text-[10px] uppercase font-bold text-white/40">Data Backup</span>
              <span className="block text-xs font-black text-white mt-1">
                {importedBackupData.exportedAt ? new Date(importedBackupData.exportedAt).toLocaleDateString() : 'N/D'}
              </span>
            </div>
            <div className="bg-black/40 p-3 rounded-xl border border-white/5">
              <span className="block text-[10px] uppercase font-bold text-white/40">Atleti</span>
              <span className="block text-sm font-black text-white mt-1">{importedBackupData.clients?.length || 0}</span>
            </div>
            <div className="bg-black/40 p-3 rounded-xl border border-white/5">
              <span className="block text-[10px] uppercase font-bold text-white/40">Esercizi</span>
              <span className="block text-sm font-black text-white mt-1">{importedBackupData.exercises?.length || 0}</span>
            </div>
            <div className="bg-black/40 p-3 rounded-xl border border-white/5">
              <span className="block text-[10px] uppercase font-bold text-white/40">Schede</span>
              <span className="block text-sm font-black text-white mt-1">{importedBackupData.plans?.length || 0}</span>
            </div>
            <div className="bg-black/40 p-3 rounded-xl border border-white/5">
              <span className="block text-[10px] uppercase font-bold text-white/40">Modelli</span>
              <span className="block text-sm font-black text-white mt-1">{importedBackupData.templates?.length || 0}</span>
            </div>
            <div className="bg-black/40 p-3 rounded-xl border border-white/5">
              <span className="block text-[10px] uppercase font-bold text-white/40">Logbook</span>
              <span className="block text-sm font-black text-white mt-1">{importedBackupData.logbook?.length || 0}</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              onClick={() => handleReplaceAll(importedBackupData)}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-red-600 hover:bg-red-500 border border-red-500/20 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shadow"
            >
              <Trash2 className="w-4 h-4 text-white" />
              Sostituisci tutti i dati (Ripristino Completo)
            </button>

            <button
              onClick={() => handleMergeData(importedBackupData)}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-neutral-900 hover:bg-neutral-800 border border-white/10 text-[#CCFF00] rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shadow"
              style={{ borderColor: config.primaryColor, color: config.primaryColor }}
            >
              <RefreshCw className="w-4 h-4" />
              Unisci con i dati esistenti
            </button>
          </div>
        </div>
      )}

      {/* Cancellazione Totale / Demo Area */}
      <div className="bg-[#121212] border border-red-950/20 p-5 rounded-2xl text-left space-y-4">
        <h3 className="text-xs font-black uppercase tracking-wider text-red-500 flex items-center gap-1.5">
          <AlertCircle className="w-4 h-4" />
          Ripristino e Cancellazione Archivio
        </h3>
        
        <div className="flex flex-col sm:flex-row gap-3 pt-1">
          {/* Ripristina Dati di Esempio */}
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
