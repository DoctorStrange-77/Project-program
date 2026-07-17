/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Client, WorkoutPlan, WorkoutTemplate, LogbookEntry, CoachConfig } from '../types';

export const CURRENT_DATA_VERSION = 2;

export interface AppBackup {
  appName: string;
  backupVersion: number;
  dataVersion: number;
  exportedAt: string;
  coachConfig: CoachConfig;
  clients: Client[];
  exercises: any[];
  plans: WorkoutPlan[];
  templates: WorkoutTemplate[];
  logbook: LogbookEntry[];
  analysisSettings?: Record<string, string>;
  otherPtKeys?: Record<string, string>;
}

// Ritorna tutte le chiavi in localStorage appartenenti all'applicazione (escluso il backup pre-importazione)
export function getAppKeys(): string[] {
  const keys: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key) {
      if (
        key.startsWith('pt_') ||
        key.startsWith('alert_ignore_') ||
        key.startsWith('alert_note_')
      ) {
        if (key !== 'pt_pre_import_backup' && key !== 'pt_pre_migration_logbook_backup') {
          keys.push(key);
        }
      }
    }
  }
  return keys;
}

// 1. Inizializzazione versione dei dati
export function initializeDataVersion(): void {
  if (!localStorage.getItem('pt_data_version')) {
    localStorage.setItem('pt_data_version', '1');
  }
}

// Migrazione da versione 1 a versione 2: associazione dei vecchi logbook senza planId
export function migration_1_to_2(): void {
  const savedPlans = localStorage.getItem('pt_plans');
  const savedLogbook = localStorage.getItem('pt_logbook');
  
  if (!savedLogbook) return; // Niente da migrare
  
  // Backup di sicurezza prima di modificare il logbook
  localStorage.setItem('pt_pre_migration_logbook_backup', savedLogbook);
  
  try {
    const plans: WorkoutPlan[] = savedPlans ? JSON.parse(savedPlans) : [];
    const logbook: LogbookEntry[] = JSON.parse(savedLogbook);
    
    const updatedLogbook = logbook.map(l => {
      // Se il planId è già presente, lo conserviamo intatto
      if (l.planId) return l;
      
      const clientPlans = plans.filter(p => p.clienteId === l.clienteId);
      if (clientPlans.length === 0) return l;
      
      // Caso 1: C'è un unico piano per l'atleta -> Corrispondenza affidabile al 100%
      if (clientPlans.length === 1) {
        return { ...l, planId: clientPlans[0].id };
      }
      
      // Caso 2: Più piani per lo stesso atleta. Controlliamo se programRowId trova un unico riscontro
      if (l.programRowId) {
        const matchingPlans = clientPlans.filter(p => {
          let hasRow = false;
          const checkEx = (ex: any) => { if (ex.programRowId === l.programRowId) hasRow = true; };
          if (p.giornate) p.giornate.forEach(d => d.esercizi?.forEach(checkEx));
          if (p.weeks) p.weeks.forEach(wk => wk.giornate?.forEach(d => d.esercizi?.forEach(checkEx)));
          return hasRow;
        });
        if (matchingPlans.length === 1) {
          return { ...l, planId: matchingPlans[0].id };
        }
      }
      
      // Caso 3: Controlliamo se programDayId trova un unico riscontro
      if (l.programDayId) {
        const matchingPlans = clientPlans.filter(p => {
          let hasDay = false;
          if (p.giornate) p.giornate.forEach(d => { if (d.programDayId === l.programDayId) hasDay = true; });
          if (p.weeks) p.weeks.forEach(wk => wk.giornate?.forEach(d => { if (d.programDayId === l.programDayId) hasDay = true; }));
          return hasDay;
        });
        if (matchingPlans.length === 1) {
          return { ...l, planId: matchingPlans[0].id };
        }
      }
      
      // Caso 4: Controlliamo tramite exerciseId, weekIndex e giornataNome
      if (l.exerciseId && l.weekIndex !== undefined && l.giornataNome) {
        const matchingPlans = clientPlans.filter(p => {
          let hasMatch = false;
          const checkEx = (ex: any, week: number, dayNome: string) => {
            if (ex.exerciseId === l.exerciseId && week === l.weekIndex && dayNome.toLowerCase() === l.giornataNome.toLowerCase()) {
              hasMatch = true;
            }
          };
          if (p.giornate) p.giornate.forEach(d => d.esercizi?.forEach(ex => checkEx(ex, 1, d.nome)));
          if (p.weeks) p.weeks.forEach(wk => wk.giornate?.forEach(d => d.esercizi?.forEach(ex => checkEx(ex, wk.weekIndex, d.nome))));
          return hasMatch;
        });
        if (matchingPlans.length === 1) {
          return { ...l, planId: matchingPlans[0].id };
        }
      }
      
      // Caso 5: Controlliamo se il nome dell'esercizio normalizzato trova una singola corrispondenza
      if (l.exerciseNome) {
        const normName = l.exerciseNome.trim().toLowerCase();
        const matchingPlans = clientPlans.filter(p => {
          let hasName = false;
          const checkEx = (ex: any) => { if (ex.nome && ex.nome.trim().toLowerCase() === normName) hasName = true; };
          if (p.giornate) p.giornate.forEach(d => d.esercizi?.forEach(checkEx));
          if (p.weeks) p.weeks.forEach(wk => wk.giornate?.forEach(d => d.esercizi?.forEach(checkEx)));
          return hasName;
        });
        if (matchingPlans.length === 1) {
          return { ...l, planId: matchingPlans[0].id };
        }
      }
      
      // In caso di ambiguità (0 o >1 riscontri) lasciamo undefined per sicurezza
      return l;
    });
    
    // Scrittura dei log modificati
    localStorage.setItem('pt_logbook', JSON.stringify(updatedLogbook));
    
    // Rimuove il backup temporaneo dopo il successo della migrazione
    localStorage.removeItem('pt_pre_migration_logbook_backup');
  } catch (error) {
    // Errore: rollback completo dello stato precedente dei log
    localStorage.setItem('pt_logbook', savedLogbook);
    localStorage.removeItem('pt_pre_migration_logbook_backup');
    throw error;
  }
}

// 2. Esecuzione migrazioni controllate, sequenziali, idempotenti e sicure
export function runDataMigrations(): void {
  initializeDataVersion();
  const currentVersionStr = localStorage.getItem('pt_data_version');
  let currentVersion = currentVersionStr ? parseInt(currentVersionStr, 10) : 1;
  
  if (currentVersion < CURRENT_DATA_VERSION) {
    try {
      if (currentVersion === 1) {
        migration_1_to_2();
        currentVersion = 2;
        localStorage.setItem('pt_data_version', '2');
      }
      
      // In futuro:
      // if (currentVersion === 2) { ... migration_2_to_3() ... }
    } catch (error) {
      console.error('Errore durante la migrazione dei dati:', error);
      // Non aggiorniamo la versione in caso di errore, così verrà riprovata la prossima volta
    }
  }
}

// 3. Normalizzazione dei backup precedenti (es: type = "pt_coach_backup")
export function normalizeBackup(data: any): { normalizedData: any; wasConverted: boolean } {
  if (!data || typeof data !== 'object') {
    return { normalizedData: data, wasConverted: false };
  }

  // Verifica se è il vecchio formato
  const isOldFormat = data.type === 'pt_coach_backup' || (!data.appName && data.config);

  if (!isOldFormat) {
    return { normalizedData: data, wasConverted: false };
  }

  const normalized: any = {
    appName: 'PT-Coach-App',
    backupVersion: typeof data.version === 'number' ? data.version : (data.backupVersion !== undefined ? Number(data.backupVersion) : 1),
    dataVersion: data.dataVersion !== undefined ? Number(data.dataVersion) : 1,
    exportedAt: data.timestamp || data.exportedAt || new Date().toISOString(),
  };

  // 1. Configurazione: config -> coachConfig
  let finalConfig: any = null;
  const rawConfig = data.coachConfig !== undefined ? data.coachConfig : data.config;
  if (rawConfig) {
    if (typeof rawConfig === 'string') {
      try {
        finalConfig = JSON.parse(rawConfig);
      } catch {
        finalConfig = null;
      }
    } else if (typeof rawConfig === 'object') {
      finalConfig = rawConfig;
    }
  }
  
  // Fallback se coachConfig è vuoto o non valido per non sovrascrivere con un oggetto vuoto
  if (!finalConfig || typeof finalConfig !== 'object' || Array.isArray(finalConfig)) {
    const currentConfigStr = localStorage.getItem('pt_coach_config');
    if (currentConfigStr) {
      try {
        finalConfig = JSON.parse(currentConfigStr);
      } catch {
        finalConfig = { nomeProgramma: '', nomeCoach: '', primaryColor: '#CCFF00', isConfigured: false };
      }
    } else {
      finalConfig = { nomeProgramma: '', nomeCoach: '', primaryColor: '#CCFF00', isConfigured: false };
    }
  }
  normalized.coachConfig = finalConfig;

  // Helpers per normalizzazione array (gestione stringhe da localStorage nel vecchio formato)
  const parseArray = (key: string, backupKey?: string): any[] => {
    const val = data[key] !== undefined ? data[key] : (backupKey ? data[backupKey] : undefined);
    if (!val) return [];
    if (typeof val === 'string') {
      try {
        const parsed = JSON.parse(val);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }
    return Array.isArray(val) ? val : [];
  };

  normalized.clients = parseArray('clients');
  normalized.plans = parseArray('plans');
  normalized.templates = parseArray('templates');
  normalized.logbook = parseArray('logbook');

  // Exercises mancanti -> conserva esercizi attuali o carica dal localStorage
  let parsedExercises = parseArray('exercises');
  if (parsedExercises.length === 0) {
    const currentExercisesStr = localStorage.getItem('pt_exercises');
    if (currentExercisesStr) {
      try {
        parsedExercises = JSON.parse(currentExercisesStr);
      } catch {
        parsedExercises = [];
      }
    }
  }
  normalized.exercises = parsedExercises;

  // Altre chiavi facoltative
  if (data.analysisSettings) {
    normalized.analysisSettings = data.analysisSettings;
  }
  if (data.otherPtKeys) {
    normalized.otherPtKeys = data.otherPtKeys;
  }

  return { normalizedData: normalized, wasConverted: true };
}

// 4. Validazione della struttura di backup (Obbligatorietà di tutti i dati principali)
export function validateBackup(data: any): { isValid: boolean; error?: string } {
  if (!data || typeof data !== 'object') {
    return { isValid: false, error: 'Il file JSON non contiene un oggetto valido.' };
  }
  
  // Deve appartenere a questa applicazione
  if (data.appName !== 'PT-Coach-App') {
    return { isValid: false, error: 'Questo backup appartiene a un\'altra applicazione o ha un formato sconosciuto.' };
  }
  
  if (data.backupVersion === undefined || typeof data.backupVersion !== 'number') {
    return { isValid: false, error: 'Versione del backup ("backupVersion") mancante o non valida.' };
  }

  if (data.dataVersion === undefined || typeof data.dataVersion !== 'number') {
    return { isValid: false, error: 'Versione dei dati ("dataVersion") mancante o non valida.' };
  }

  if (data.dataVersion > CURRENT_DATA_VERSION) {
    return { 
      isValid: false, 
      error: `La versione dei dati nel backup (${data.dataVersion}) è superiore a quella supportata (${CURRENT_DATA_VERSION}).` 
    };
  }

  if (!data.exportedAt || typeof data.exportedAt !== 'string') {
    return { isValid: false, error: 'Data di esportazione ("exportedAt") mancante o non valida.' };
  }

  // coachConfig deve essere un oggetto non nullo e non array
  if (!data.coachConfig || typeof data.coachConfig !== 'object' || Array.isArray(data.coachConfig)) {
    return { isValid: false, error: 'La configurazione ("coachConfig") è mancante o non è un oggetto valido.' };
  }

  // Tutti gli array principali sono obbligatori
  if (!Array.isArray(data.clients)) {
    return { isValid: false, error: 'I dati dei clienti ("clients") sono mancanti o non sono un array valido.' };
  }
  if (!Array.isArray(data.exercises)) {
    return { isValid: false, error: 'I dati degli esercizi ("exercises") sono mancanti o non sono un array valido.' };
  }
  if (!Array.isArray(data.plans)) {
    return { isValid: false, error: 'Le schede d\'allenamento ("plans") sono mancanti o non sono un array valido.' };
  }
  if (!Array.isArray(data.templates)) {
    return { isValid: false, error: 'I modelli d\'allenamento ("templates") sono mancanti o non sono un array valido.' };
  }
  if (!Array.isArray(data.logbook)) {
    return { isValid: false, error: 'I dati del logbook ("logbook") sono mancanti o non sono un array valido.' };
  }

  return { isValid: true };
}

// 5. Esportazione backup completo
export function exportBackup(
  clients: Client[],
  exercises: any[],
  plans: WorkoutPlan[],
  templates: WorkoutTemplate[],
  logbook: LogbookEntry[],
  coachConfig: CoachConfig
): AppBackup {
  const analysisSettings: Record<string, string> = {};
  const otherPtKeys: Record<string, string> = {};

  // Esporta esclusivamente le chiavi pt_ o alert_ realmente utilizzate dall'app
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key) {
      if (key.startsWith('alert_ignore_') || key.startsWith('alert_note_')) {
        const val = localStorage.getItem(key);
        if (val !== null) {
          analysisSettings[key] = val;
        }
      } else if (
        key === 'pt_favorite_exercises' || 
        key === 'pt_recent_exercises' || 
        key === 'pt_wizard_autosave'
      ) {
        const val = localStorage.getItem(key);
        if (val !== null) {
          otherPtKeys[key] = val;
        }
      }
    }
  }

  return {
    appName: 'PT-Coach-App',
    backupVersion: 1,
    dataVersion: CURRENT_DATA_VERSION,
    exportedAt: new Date().toISOString(),
    coachConfig,
    clients,
    exercises,
    plans,
    templates,
    logbook,
    analysisSettings,
    otherPtKeys
  };
}

// 6. Creazione del pre-import backup di sicurezza nel localStorage
export function createPreImportBackup(): void {
  const currentKeys: Record<string, string> = {};
  
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && (key.startsWith('pt_') || key.startsWith('alert_ignore_') || key.startsWith('alert_note_'))) {
      if (key !== 'pt_pre_import_backup' && key !== 'pt_pre_migration_logbook_backup') {
        const val = localStorage.getItem(key);
        if (val !== null) {
          currentKeys[key] = val;
        }
      }
    }
  }
  
  localStorage.setItem('pt_pre_import_backup', JSON.stringify(currentKeys));
}

// 7. Ripristino del backup di sicurezza precedente all'importazione
export function restorePreImportBackup(): boolean {
  const backupStr = localStorage.getItem('pt_pre_import_backup');
  if (!backupStr) return false;

  try {
    const backupData: Record<string, string> = JSON.parse(backupStr);

    // Identifica tutte le chiavi correnti dell'app
    const currentAppKeys = getAppKeys();
    currentAppKeys.forEach(k => localStorage.removeItem(k));

    // Scrive nuovamente tutti i dati salvati
    Object.entries(backupData).forEach(([k, v]) => {
      localStorage.setItem(k, v);
    });

    return true;
  } catch (error) {
    console.error('Errore durante il rollback del backup:', error);
    return false;
  }
}

// 8. SOSTITUISCI TUTTI I DATI (Ripristino Completo)
export function replaceBackup(data: any): { success: boolean; error?: string } {
  try {
    // 1. Crea pre-import backup di sicurezza
    createPreImportBackup();

    // 2. Identifica e memorizza tutte le chiavi dell'app correnti per un eventuale rollback immediato
    const appKeys = getAppKeys();
    const rollbackData: Record<string, string> = {};
    appKeys.forEach(k => {
      const val = localStorage.getItem(k);
      if (val !== null) rollbackData[k] = val;
    });

    // 3. Rimuovi esclusivamente le chiavi appartenenti all'applicazione
    appKeys.forEach(k => localStorage.removeItem(k));

    // 4. Scrivi i dati importati
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
    } catch (writeErr: any) {
      // Rollback automatico immediato in caso di fallimento della scrittura (es: localStorage pieno)
      appKeys.forEach(k => localStorage.removeItem(k));
      Object.entries(rollbackData).forEach(([k, v]) => {
        localStorage.setItem(k, v);
      });
      return { 
        success: false, 
        error: `Spazio insufficiente (localStorage pieno) o errore di scrittura. Ripristinato stato precedente: ${writeErr.message || writeErr}` 
      };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || String(err) };
  }
}

// Helper per ottenere millisecondi validi per il confronto delle date
function getValidDateMs(dateVal: any): number | null {
  if (!dateVal) return null;
  const ms = new Date(dateVal).getTime();
  return isNaN(ms) ? null : ms;
}

// Unione generica con risoluzione conflitti
export async function mergeItems(
  currentList: any[],
  importedList: any[],
  onAskConflict: (itemType: string, currentItem: any, importedItem: any) => Promise<'current' | 'imported'>,
  itemType: string
): Promise<any[]> {
  const mergedMap = new Map<string, any>();

  currentList.forEach(item => {
    if (item && item.id) {
      mergedMap.set(item.id, item);
    }
  });

  for (const importedItem of importedList) {
    if (!importedItem || !importedItem.id) continue;
    const existingItem = mergedMap.get(importedItem.id);
    if (!existingItem) {
      mergedMap.set(importedItem.id, importedItem);
    } else {
      // Conflitto rilevato per ID identico. Cerca date di modifica
      const currentModDate = existingItem.updatedAt || existingItem.lastModified || existingItem.dataCreazione || existingItem.data;
      const importedModDate = importedItem.updatedAt || importedItem.lastModified || importedItem.dataCreazione || importedItem.data;

      const currentMs = getValidDateMs(currentModDate);
      const importedMs = getValidDateMs(importedModDate);

      let resolveByDate = false;
      if (currentMs !== null && importedMs !== null) {
        if (importedMs > currentMs) {
          mergedMap.set(importedItem.id, importedItem);
          resolveByDate = true;
        } else if (currentMs > importedMs) {
          // Mantieni quello attuale
          resolveByDate = true;
        }
      }

      if (!resolveByDate) {
        // Se le date sono identiche, manca una delle date, o non sono valide, chiedi all'utente
        const choice = await onAskConflict(itemType, existingItem, importedItem);
        if (choice === 'imported') {
          mergedMap.set(importedItem.id, importedItem);
        }
      }
    }
  }

  return Array.from(mergedMap.values());
}

// 9. UNISCI CON I DATI ESISTENTI
export async function mergeBackup(
  data: any,
  currentClients: Client[],
  currentExercises: any[],
  currentPlans: WorkoutPlan[],
  currentTemplates: WorkoutTemplate[],
  currentLogbook: LogbookEntry[],
  currentConfig: CoachConfig,
  onAskConflict: (itemType: string, currentItem: any, importedItem: any) => Promise<'current' | 'imported'>
): Promise<{ 
  success: boolean; 
  error?: string; 
  mergedClients?: Client[];
  mergedExercises?: any[];
  mergedPlans?: WorkoutPlan[];
  mergedTemplates?: WorkoutTemplate[];
  mergedLogbook?: LogbookEntry[];
  mergedConfig?: CoachConfig;
}> {
  try {
    // 1. Crea pre-import backup di sicurezza
    createPreImportBackup();

    // 2. Unisci ciascun set di dati
    const mergedClients = await mergeItems(currentClients, data.clients || [], onAskConflict, 'clients');
    const mergedExercises = await mergeItems(currentExercises, data.exercises || [], onAskConflict, 'exercises');
    const mergedPlans = await mergeItems(currentPlans, data.plans || [], onAskConflict, 'plans');
    const mergedTemplates = await mergeItems(currentTemplates, data.templates || [], onAskConflict, 'templates');
    const mergedLogbook = await mergeItems(currentLogbook, data.logbook || [], onAskConflict, 'logbook');
    const mergedConfig = { ...currentConfig, ...(data.coachConfig || {}) };

    // 3. Salva lo stato corrente in memoria per eventuale rollback immediato
    const appKeys = getAppKeys();
    const rollbackData: Record<string, string> = {};
    appKeys.forEach(k => {
      const val = localStorage.getItem(k);
      if (val !== null) rollbackData[k] = val;
    });

    // 4. Scrivi i dati uniti
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
    } catch (writeErr: any) {
      // Rollback completo
      appKeys.forEach(k => localStorage.removeItem(k));
      Object.entries(rollbackData).forEach(([k, v]) => {
        localStorage.setItem(k, v);
      });
      return { 
        success: false, 
        error: `Spazio insufficiente (localStorage pieno) o errore di scrittura durante l'unione. Ripristinato stato originale: ${writeErr.message || writeErr}` 
      };
    }

    return {
      success: true,
      mergedClients,
      mergedExercises,
      mergedPlans,
      mergedTemplates,
      mergedLogbook,
      mergedConfig
    };
  } catch (err: any) {
    return { success: false, error: err.message || String(err) };
  }
}

// 10. CANCELLAZIONE TOTALE DELLE CHIAVI DELL'APP (Con abilitazione Annulla ultimo ripristino)
export function clearAppLocalStorage(): void {
  // Crea un backup completo prima di svuotare
  createPreImportBackup();

  // Preleva esclusivamente le chiavi appartenenti all'applicazione
  const appKeys = getAppKeys();
  appKeys.forEach(k => {
    localStorage.removeItem(k);
  });
}
