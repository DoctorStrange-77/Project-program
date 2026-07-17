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
  normalizeBackup,
  exportBackup, 
  replaceBackup,
  mergeBackup,
  restorePreImportBackup,
  clearAppLocalStorage
} from '../utils/dataMigrations';
import { DEMO_CLIENTS, DEMO_WORKOUT_PLANS, DEMO_TEMPLATES } from '../data/demoData';
import { INITIAL_EXERCISES } from '../data/exercises';

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
  const [backupWasConverted, setBackupWasConverted] = useState(false);
  const [absentKeys, setAbsentKeys] = useState<string[]>([]);
  const [invalidKeys, setInvalidKeys] = useState<string[]>([]);
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

        // 1. Normalizzazione se formato precedente
        const { normalizedData, wasConverted, absentKeys: detectedAbsentKeys, invalidKeys: detectedInvalidKeys } = normalizeBackup(parsedData);

        // 2. Validazione della struttura normalizzata (solo se NON ci sono invalidKeys)
        if (detectedInvalidKeys.length === 0) {
          const validation = validateBackup(normalizedData);
          if (!validation.isValid) {
            throw new Error(validation.error || 'Struttura di backup non valida.');
          }
        }

        // Mostriamo l'anteprima/riassunto prima di procedere
        setImportedBackupData(normalizedData);
        setBackupWasConverted(wasConverted);
        setAbsentKeys(detectedAbsentKeys);
        setInvalidKeys(detectedInvalidKeys);
        if (detectedInvalidKeys.length > 0) {
          onShowToast('Attenzione: Il backup contiene campi non validi o danneggiati!', 'error');
        } else if (wasConverted) {
          onShowToast('Backup in formato precedente letto e convertito con successo! Verifica il riepilogo.', 'warning');
        } else {
          onShowToast('Backup letto con successo! Verifica il riepilogo prima di procedere.', 'info');
        }
      } catch (err: any) {
        onShowToast(`Errore di validazione: ${err.message || 'File non valido.'}`, 'error');
        setImportedBackupData(null);
        setBackupWasConverted(false);
        setAbsentKeys([]);
        setInvalidKeys([]);
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
        const result = replaceBackup(data);
        if (result.success) {
          setHasPreImportBackup(true);

          // Aggiorna gli stati React in memoria del parent
          onUpdateClients(data.clients || []);
          onUpdatePlans(data.plans || []);
          onUpdateTemplates(data.templates || []);
          onUpdateExercises(data.exercises || []);
          onUpdateLogbook(data.logbook || []);
          onUpdateConfig(data.coachConfig || {});

          // Reset stato importazione
          setImportedBackupData(null);
          setBackupWasConverted(false);
          setAbsentKeys([]);
          setInvalidKeys([]);
          if (fileInputRef.current) fileInputRef.current.value = '';

          onShowToast('Database interamente ripristinato dal file di backup!', 'success');
        } else {
          onShowToast(result.error || 'Errore imprevisto durante il ripristino.', 'error');
        }
      }
    });
  };

  // 4. Modalità Unisci con i Dati Esistenti
  const handleMergeData = async (data: any) => {
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

    const result = await mergeBackup(
      data,
      clients,
      exercises,
      plans,
      templates,
      logbook,
      config,
      askConflict
    );

    if (result.success) {
      setHasPreImportBackup(true);

      // Aggiorna stati React
      onUpdateClients(result.mergedClients || []);
      onUpdateExercises(result.mergedExercises || []);
      onUpdatePlans(result.mergedPlans || []);
      onUpdateTemplates(result.mergedTemplates || []);
      onUpdateLogbook(result.mergedLogbook || []);
      onUpdateConfig(result.mergedConfig || config);

      setImportedBackupData(null);
      setBackupWasConverted(false);
      setAbsentKeys([]);
      setInvalidKeys([]);
      if (fileInputRef.current) fileInputRef.current.value = '';

      onShowToast('Dati uniti con successo! Eventuali conflitti sono stati risolti.', 'success');
    } else {
      onShowToast(result.error || 'Errore durante l\'unione dei dati.', 'error');
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
          setHasPreImportBackup(false);

          // Ricarica gli stati in React leggendoli dal localStorage appena ripristinato
          const savedConfig = localStorage.getItem('pt_coach_config');
          const savedClients = localStorage.getItem('pt_clients');
          const savedPlans = localStorage.getItem('pt_plans');
          const savedTemplates = localStorage.getItem('pt_templates');
          const savedExercises = localStorage.getItem('pt_exercises');
          const savedLogbook = localStorage.getItem('pt_logbook');

          // Aggiorna SEMPRE tutti gli stati. Se una chiave non esiste, usa array vuoto o configurazione di default
          onUpdateConfig(savedConfig ? JSON.parse(savedConfig) : {
            nomeProgramma: '',
            nomeCoach: '',
            primaryColor: '#CCFF00',
            isConfigured: false
          });
          onUpdateClients(savedClients ? JSON.parse(savedClients) : []);
          onUpdatePlans(savedPlans ? JSON.parse(savedPlans) : []);
          onUpdateTemplates(savedTemplates ? JSON.parse(savedTemplates) : []);
          onUpdateExercises(savedExercises ? JSON.parse(savedExercises) : []);
          onUpdateLogbook(savedLogbook ? JSON.parse(savedLogbook) : []);

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
          const demoBackupData = {
            appName: 'PT-Coach-App',
            backupVersion: 1,
            dataVersion: CURRENT_DATA_VERSION,
            exportedAt: new Date().toISOString(),
            coachConfig: {
              nomeProgramma: 'Coach Board',
              nomeCoach: 'Alessandro',
              primaryColor: '#CCFF00',
              isConfigured: true
            },
            clients: DEMO_CLIENTS,
            exercises: INITIAL_EXERCISES,
            plans: DEMO_WORKOUT_PLANS,
            templates: DEMO_TEMPLATES,
            logbook: []
          };

          const result = replaceBackup(demoBackupData);
          if (result.success) {
            setHasPreImportBackup(true);

            onUpdateClients(DEMO_CLIENTS);
            onUpdatePlans(DEMO_WORKOUT_PLANS);
            onUpdateTemplates(DEMO_TEMPLATES);
            onUpdateExercises(INITIAL_EXERCISES);
            onUpdateLogbook([]);
            onUpdateConfig(demoBackupData.coachConfig);

            onShowToast('Dati dimostrativi ripristinati correttamente!', 'success');
          } else {
            onShowToast(result.error || 'Errore durante il ripristino dei dati demo.', 'error');
          }
        } catch (err: any) {
          onShowToast(`Errore durante il ripristino dei dati demo: ${err.message}`, 'error');
        }
      }
    });
  };

  // 7. Cancellazione Totale
  const executeFullDelete = () => {
    try {
      // Svuota solo i dati specifici dell'app, salvando lo snapshot in pre-import backup tramite clearAppLocalStorage
      clearAppLocalStorage();
      setHasPreImportBackup(true);

      // Resetta gli stati in memoria
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

      onShowToast('Archivio dell\'app svuotato con successo! È possibile annullare l\'operazione tramite il pulsante di ripristino.', 'success');
      setConfirmClearStep(0);
    } catch (err: any) {
      onShowToast(`Errore durante lo svuotamento dell'archivio: ${err.message}`, 'error');
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
                setBackupWasConverted(false);
                setAbsentKeys([]);
                setInvalidKeys([]);
                if (fileInputRef.current) fileInputRef.current.value = '';
              }}
              className="p-1 hover:bg-white/5 rounded text-white/60 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {backupWasConverted && (
            <div className="bg-amber-950/20 border border-amber-900/40 p-3 rounded-xl flex items-center gap-2 text-amber-300 text-[11px] font-bold">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Nota: Questo file utilizza un formato di backup precedente (pt_coach_backup). È stato convertito e normalizzato automaticamente nel nuovo formato standard.</span>
            </div>
          )}

          {invalidKeys.length > 0 && (
            <div className="bg-red-950/20 border border-red-900/40 p-3 rounded-xl flex flex-col gap-2 text-red-400 text-[11px] font-bold">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <span>Errore: Questo backup contiene sezioni danneggiate o non valide:</span>
              </div>
              <ul className="list-disc pl-5 space-y-1 font-semibold text-red-300">
                {invalidKeys.map(k => (
                  <li key={k}>{k === 'clients' ? 'Atleti (clients)' :
                               k === 'exercises' ? 'Esercizi (exercises)' :
                               k === 'plans' ? 'Schede (plans)' :
                               k === 'templates' ? 'Modelli (templates)' :
                               k === 'logbook' ? 'Rilevazioni Logbook (logbook)' :
                               k === 'coachConfig' ? 'Configurazione Coach (coachConfig)' : k}</li>
                ))}
              </ul>
              <span>Sia la modalità "Sostituisci" che la modalità "Unisci" sono state disabilitate per proteggere l'integrità dei dati locali.</span>
            </div>
          )}

          {absentKeys.length > 0 && invalidKeys.length === 0 && (
            <div className="bg-[#1a1200] border border-amber-900/40 p-3 rounded-xl flex flex-col gap-2 text-amber-400 text-[11px] font-bold">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Attenzione: Questo backup è parziale. Mancano le seguenti sezioni principali:</span>
              </div>
              <ul className="list-disc pl-5 space-y-1 font-semibold text-amber-300">
                {absentKeys.map(k => (
                  <li key={k}>{k === 'clients' ? 'Atleti (clients)' :
                               k === 'exercises' ? 'Esercizi (exercises)' :
                               k === 'plans' ? 'Schede (plans)' :
                               k === 'templates' ? 'Modelli (templates)' :
                               k === 'logbook' ? 'Rilevazioni Logbook (logbook)' :
                               k === 'coachConfig' ? 'Configurazione Coach (coachConfig)' : k}</li>
                ))}
              </ul>
              <span>La modalità "Sostituisci tutti i dati" è disabilitata per evitare la perdita irreversibile dei dati non presenti nel file. È comunque possibile utilizzare "Unisci con i dati esistenti" (i dati assenti verranno preservati).</span>
            </div>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4 py-1">
            <div className="bg-black/40 p-3 rounded-xl border border-white/5">
              <span className="block text-[10px] uppercase font-bold text-white/40">Data Backup</span>
              <span className="block text-xs font-black text-white mt-1">
                {importedBackupData.exportedAt ? new Date(importedBackupData.exportedAt).toLocaleDateString() : 'N/D'}
              </span>
            </div>
            <div className="bg-black/40 p-3 rounded-xl border border-white/5">
              <span className="block text-[10px] uppercase font-bold text-white/40">Atleti</span>
              <span className="block text-sm font-black mt-1 text-white">
                {invalidKeys.includes('clients') ? <span className="text-red-500 font-bold">Danneggiato</span> : absentKeys.includes('clients') ? <span className="text-red-400 font-bold">Assente</span> : (importedBackupData.clients?.length || 0)}
              </span>
            </div>
            <div className="bg-black/40 p-3 rounded-xl border border-white/5">
              <span className="block text-[10px] uppercase font-bold text-white/40">Esercizi</span>
              <span className="block text-sm font-black mt-1 text-white">
                {invalidKeys.includes('exercises') ? <span className="text-red-500 font-bold">Danneggiato</span> : absentKeys.includes('exercises') ? <span className="text-red-400 font-bold">Assente</span> : (importedBackupData.exercises?.length || 0)}
              </span>
            </div>
            <div className="bg-black/40 p-3 rounded-xl border border-white/5">
              <span className="block text-[10px] uppercase font-bold text-white/40">Schede</span>
              <span className="block text-sm font-black mt-1 text-white">
                {invalidKeys.includes('plans') ? <span className="text-red-500 font-bold">Danneggiato</span> : absentKeys.includes('plans') ? <span className="text-red-400 font-bold">Assente</span> : (importedBackupData.plans?.length || 0)}
              </span>
            </div>
            <div className="bg-black/40 p-3 rounded-xl border border-white/5">
              <span className="block text-[10px] uppercase font-bold text-white/40">Modelli</span>
              <span className="block text-sm font-black mt-1 text-white">
                {invalidKeys.includes('templates') ? <span className="text-red-500 font-bold">Danneggiato</span> : absentKeys.includes('templates') ? <span className="text-red-400 font-bold">Assente</span> : (importedBackupData.templates?.length || 0)}
              </span>
            </div>
            <div className="bg-black/40 p-3 rounded-xl border border-white/5">
              <span className="block text-[10px] uppercase font-bold text-white/40">Logbook</span>
              <span className="block text-sm font-black mt-1 text-white">
                {invalidKeys.includes('logbook') ? <span className="text-red-500 font-bold">Danneggiato</span> : absentKeys.includes('logbook') ? <span className="text-red-400 font-bold">Assente</span> : (importedBackupData.logbook?.length || 0)}
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              onClick={() => handleReplaceAll(importedBackupData)}
              disabled={absentKeys.length > 0 || invalidKeys.length > 0}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 border rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow ${
                (absentKeys.length > 0 || invalidKeys.length > 0)
                  ? 'bg-neutral-900/40 text-white/20 border-white/5 cursor-not-allowed'
                  : 'bg-red-600 hover:bg-red-500 border-red-500/20 text-white cursor-pointer'
              }`}
            >
              <Trash2 className="w-4 h-4" />
              Sostituisci tutti i dati (Ripristino Completo)
            </button>

            <button
              onClick={() => handleMergeData(importedBackupData)}
              disabled={invalidKeys.length > 0}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 border rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow ${
                invalidKeys.length > 0
                  ? 'bg-neutral-900/40 text-white/20 border-white/5 cursor-not-allowed'
                  : 'bg-neutral-900 hover:bg-neutral-800 border-white/10 text-[#CCFF00] cursor-pointer'
              }`}
              style={invalidKeys.length > 0 ? {} : { borderColor: config.primaryColor, color: config.primaryColor }}
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
                CONFERMA FINALE: Verranno eliminati tutti i dati dell’app. Potrai annullare l’operazione tramite il punto di ripristino creato automaticamente. Eliminare tutto?
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
