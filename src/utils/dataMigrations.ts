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
export function normalizeBackup(data: any): { 
  normalizedData: any; 
  wasConverted: boolean; 
  absentKeys: string[]; 
  invalidKeys: string[]; 
} {
  const absentKeys: string[] = [];
  const invalidKeys: string[] = [];

  // 1. Controllo tipo radice
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return { normalizedData: data, wasConverted: false, absentKeys: [], invalidKeys: ['root'] };
  }

  // 2. Controllo identità del backup
  const isCurrentFormat = data.appName === 'PT-Coach-App';
  const isOldFormat = data.type === 'pt_coach_backup' || (!data.appName && data.config);

  if (!isCurrentFormat && !isOldFormat) {
    invalidKeys.push('root');
    return {
      normalizedData: data,
      wasConverted: false,
      absentKeys: [],
      invalidKeys
    };
  }

  // Helper per versioni
  const parseAndValidateVersion = (val: any): number | null => {
    if (typeof val === 'number') {
      if (Number.isFinite(val) && Number.isInteger(val) && val >= 1) {
        return val;
      }
      return null;
    }
    if (typeof val === 'string') {
      const num = Number(val);
      if (!isNaN(num) && Number.isFinite(num) && Number.isInteger(num) && num >= 1) {
        return num;
      }
      return null;
    }
    return null;
  };

  // Helper per data
  const isValidDate = (val: any): boolean => {
    if (typeof val !== 'string') return false;
    const timestamp = Date.parse(val);
    return !isNaN(timestamp);
  };

  // 3. Valutazione versioni
  let backupVersionVal: number | null = null;
  if (isOldFormat) {
    const rawVersion = data.version !== undefined ? data.version : data.backupVersion;
    if (rawVersion === undefined) {
      backupVersionVal = 1; // default per vecchio formato
    } else {
      backupVersionVal = parseAndValidateVersion(rawVersion);
      if (backupVersionVal === null) {
        invalidKeys.push('backupVersion');
      }
    }
  } else {
    if (data.backupVersion === undefined) {
      invalidKeys.push('backupVersion');
    } else {
      backupVersionVal = parseAndValidateVersion(data.backupVersion);
      if (backupVersionVal === null) {
        invalidKeys.push('backupVersion');
      }
    }
  }

  let dataVersionVal: number | null = null;
  if (isOldFormat) {
    const rawDataVersion = data.dataVersion;
    if (rawDataVersion === undefined) {
      dataVersionVal = 1; // default per vecchio formato
    } else {
      dataVersionVal = parseAndValidateVersion(rawDataVersion);
      if (dataVersionVal === null) {
        invalidKeys.push('dataVersion');
      }
    }
  } else {
    if (data.dataVersion === undefined) {
      invalidKeys.push('dataVersion');
    } else {
      dataVersionVal = parseAndValidateVersion(data.dataVersion);
      if (dataVersionVal === null) {
        invalidKeys.push('dataVersion');
      }
    }
  }

  // 4. Valutazione data esportazione
  let exportedAtVal: string | null = null;
  const rawExportedAt = data.exportedAt !== undefined ? data.exportedAt : data.timestamp;
  if (rawExportedAt === undefined) {
    if (isOldFormat) {
      exportedAtVal = new Date().toISOString();
    } else {
      invalidKeys.push('exportedAt');
    }
  } else {
    if (isValidDate(rawExportedAt)) {
      exportedAtVal = rawExportedAt;
    } else {
      invalidKeys.push('exportedAt');
    }
  }

  const normalized: any = {
    appName: 'PT-Coach-App',
    backupVersion: backupVersionVal !== null ? backupVersionVal : undefined,
    dataVersion: dataVersionVal !== null ? dataVersionVal : undefined,
    exportedAt: exportedAtVal !== null ? exportedAtVal : undefined,
  };

  // 5. Array principali
  const arrayKeys = ['clients', 'exercises', 'plans', 'templates', 'logbook'];
  for (const key of arrayKeys) {
    if (data[key] === undefined) {
      absentKeys.push(key);
    } else {
      const val = data[key];
      if (Array.isArray(val)) {
        normalized[key] = val;
      } else if (typeof val === 'string') {
        try {
          const parsed = JSON.parse(val);
          if (Array.isArray(parsed)) {
            normalized[key] = parsed;
          } else {
            invalidKeys.push(key);
          }
        } catch {
          invalidKeys.push(key);
        }
      } else {
        invalidKeys.push(key);
      }
    }
  }

  // 6. Configurazione: coachConfig / config
  const hasCoachConfig = data.coachConfig !== undefined;
  const hasConfig = data.config !== undefined;

  if (!hasCoachConfig && !hasConfig) {
    absentKeys.push('coachConfig');
  } else {
    const rawConfig = hasCoachConfig ? data.coachConfig : data.config;
    if (rawConfig && typeof rawConfig === 'object' && !Array.isArray(rawConfig)) {
      normalized.coachConfig = rawConfig;
    } else if (typeof rawConfig === 'string') {
      try {
        const parsed = JSON.parse(rawConfig);
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
          normalized.coachConfig = parsed;
        } else {
          invalidKeys.push('coachConfig');
        }
      } catch {
        invalidKeys.push('coachConfig');
      }
    } else {
      invalidKeys.push('coachConfig');
    }
  }

  // Altre chiavi facoltative
  if (data.analysisSettings) {
    normalized.analysisSettings = data.analysisSettings;
  }
  if (data.otherPtKeys) {
    normalized.otherPtKeys = data.otherPtKeys;
  }

  return { 
    normalizedData: normalized, 
    wasConverted: isOldFormat, 
    absentKeys, 
    invalidKeys 
  };
}

// 4. Validazione della struttura di backup (Obbligatorietà di tutti i dati principali)
export function validateBackup(data: any): { isValid: boolean; error?: string } {
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return { isValid: false, error: 'Il file JSON non contiene un oggetto valido.' };
  }
  
  // Deve appartenere a questa applicazione
  if (data.appName !== 'PT-Coach-App') {
    return { isValid: false, error: 'Questo backup appartiene a un\'altra applicazione o ha un formato sconosciuto.' };
  }
  
  if (
    data.backupVersion === undefined || 
    typeof data.backupVersion !== 'number' || 
    !Number.isFinite(data.backupVersion) || 
    !Number.isInteger(data.backupVersion) || 
    data.backupVersion < 1
  ) {
    return { isValid: false, error: 'Versione del backup ("backupVersion") mancante o non valida.' };
  }

  if (
    data.dataVersion === undefined || 
    typeof data.dataVersion !== 'number' || 
    !Number.isFinite(data.dataVersion) || 
    !Number.isInteger(data.dataVersion) || 
    data.dataVersion < 1
  ) {
    return { isValid: false, error: 'Versione dei dati ("dataVersion") mancante o non valida.' };
  }

  if (data.dataVersion > CURRENT_DATA_VERSION) {
    return { 
      isValid: false, 
      error: `La versione dei dati nel backup (${data.dataVersion}) è superiore a quella supportata (${CURRENT_DATA_VERSION}).` 
    };
  }

  if (!data.exportedAt || typeof data.exportedAt !== 'string' || isNaN(Date.parse(data.exportedAt))) {
    return { isValid: false, error: 'Data di esportazione ("exportedAt") mancante o non valida.' };
  }

  // Se presenti, devono essere del tipo corretto
  if ('coachConfig' in data && data.coachConfig !== undefined) {
    if (!data.coachConfig || typeof data.coachConfig !== 'object' || Array.isArray(data.coachConfig)) {
      return { isValid: false, error: 'La configurazione ("coachConfig") non è un oggetto valido.' };
    }
  }

  const arraysToCheck = ['clients', 'exercises', 'plans', 'templates', 'logbook'];
  for (const key of arraysToCheck) {
    if (key in data && data[key] !== undefined) {
      if (!Array.isArray(data[key])) {
        return { isValid: false, error: `I dati di "${key}" presenti nel backup non sono un array valido.` };
      }
    }
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

    // Elimina pt_pre_import_backup soltanto dopo il completamento con successo
    localStorage.removeItem('pt_pre_import_backup');
    return true;
  } catch (error) {
    console.error('Errore durante il rollback del backup:', error);
    // Se il ripristino fallisce, conserva pt_pre_import_backup per consentire un nuovo tentativo
    return false;
  }
}

// 8. SOSTITUISCI TUTTI I DATI (Ripristino Completo)
export function replaceBackup(data: any): { success: boolean; error?: string } {
  try {
    // Verifica se ci sono campi principali assenti per mostrare un errore bloccante
    const absentKeys: string[] = [];
    if (data.clients === undefined) absentKeys.push('clients');
    if (data.exercises === undefined) absentKeys.push('exercises');
    if (data.plans === undefined) absentKeys.push('plans');
    if (data.templates === undefined) absentKeys.push('templates');
    if (data.logbook === undefined) absentKeys.push('logbook');
    if (data.coachConfig === undefined) absentKeys.push('coachConfig');

    if (absentKeys.length > 0) {
      return { 
        success: false, 
        error: `Impossibile sovrascrivere interamente il database: il backup è parziale e mancano le seguenti sezioni principali: ${absentKeys.join(', ')}.` 
      };
    }

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
      // Rollback automatico completo in caso di fallimento della scrittura
      // 1. Richiama getAppKeys() dopo il tentativo fallito per prendere anche nuove chiavi parzialmente create
      const postFailKeys = getAppKeys();
      // 2. Rimuovi tutte le chiavi dell'app attualmente presenti, comprese quelle appena create
      postFailKeys.forEach(k => localStorage.removeItem(k));
      // 3. Ripristina lo snapshot precedente
      Object.entries(rollbackData).forEach(([k, v]) => {
        localStorage.setItem(k, v);
      });
      // 4. Nessuna chiave importata parzialmente rimane nel localStorage
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

    // 2. Unisci ciascun set di dati (conservando i dati attuali per i campi assenti)
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
      // 1. Richiama getAppKeys() dopo il tentativo fallito per prendere anche nuove chiavi parzialmente create
      const postFailKeys = getAppKeys();
      // 2. Rimuovi tutte le chiavi dell'app attualmente presenti, comprese quelle appena create
      postFailKeys.forEach(k => localStorage.removeItem(k));
      // 3. Ripristina lo snapshot precedente
      Object.entries(rollbackData).forEach(([k, v]) => {
        localStorage.setItem(k, v);
      });
      // 4. Nessuna chiave importata parzialmente rimane nel localStorage
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
  // 1. Crea pre-import backup di sicurezza
  createPreImportBackup();

  // 2. Rimuovi le chiavi dell'app
  const appKeys = getAppKeys();
  appKeys.forEach(k => {
    localStorage.removeItem(k);
  });

  // 3. Salva uno stato vuoto esplicito
  localStorage.setItem('pt_clients', JSON.stringify([]));
  localStorage.setItem('pt_plans', JSON.stringify([]));
  localStorage.setItem('pt_templates', JSON.stringify([]));
  localStorage.setItem('pt_exercises', JSON.stringify([]));
  localStorage.setItem('pt_logbook', JSON.stringify([]));
  localStorage.setItem('pt_coach_config', JSON.stringify({
    nomeProgramma: '',
    nomeCoach: '',
    primaryColor: '#CCFF00',
    isConfigured: false
  }));
  localStorage.setItem('pt_data_version', String(CURRENT_DATA_VERSION));
  localStorage.setItem('pt_archive_initialized', 'true');
}
