/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Client, WorkoutPlan, WorkoutTemplate, LogbookEntry, CoachConfig } from '../types';

export const CURRENT_DATA_VERSION = 1;

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

// 1. Inizializzazione versione dei dati
export function initializeDataVersion(): void {
  if (!localStorage.getItem('pt_data_version')) {
    localStorage.setItem('pt_data_version', String(CURRENT_DATA_VERSION));
  }
}

// 2. Esecuzione migrazioni controllate e idempotenti
export function runDataMigrations(): void {
  initializeDataVersion();
  const currentVersionStr = localStorage.getItem('pt_data_version');
  const currentVersion = currentVersionStr ? parseInt(currentVersionStr, 10) : 1;
  
  if (currentVersion < CURRENT_DATA_VERSION) {
    try {
      // In futuro:
      // if (currentVersion === 1) { ... migra a v2 ... }
      
      localStorage.setItem('pt_data_version', String(CURRENT_DATA_VERSION));
    } catch (error) {
      console.error('Errore durante la migrazione dei dati:', error);
    }
  }
}

// 3. Validazione della struttura di backup
export function validateBackup(data: any): { isValid: boolean; error?: string } {
  if (!data || typeof data !== 'object') {
    return { isValid: false, error: 'Il file JSON non contiene un oggetto valido.' };
  }
  
  // Controlla che appartenga a questa app (appName o type di PT-Coach)
  const isPtApp = data.appName === 'PT-Coach-App' || data.type === 'pt_coach_backup';
  if (!isPtApp) {
    return { isValid: false, error: 'Questo backup appartiene a un\'altra applicazione.' };
  }
  
  const backupVer = data.backupVersion !== undefined ? data.backupVersion : (data.version ? parseFloat(data.version) : null);
  if (backupVer === null) {
    return { isValid: false, error: 'Versione del backup (backupVersion) non trovata.' };
  }

  const dataVer = data.dataVersion !== undefined ? data.dataVersion : 1;
  if (dataVer > CURRENT_DATA_VERSION) {
    return { 
      isValid: false, 
      error: `La versione dei dati nel backup (${dataVer}) è superiore a quella supportata (${CURRENT_DATA_VERSION}).` 
    };
  }

  // Verifica che gli array principali siano realmente array
  if (data.clients !== undefined && !Array.isArray(data.clients)) {
    return { isValid: false, error: 'I dati relativi ai clienti ("clients") non sono un array valido.' };
  }
  if (data.exercises !== undefined && !Array.isArray(data.exercises)) {
    return { isValid: false, error: 'I dati relativi agli esercizi ("exercises") non sono un array valido.' };
  }
  if (data.plans !== undefined && !Array.isArray(data.plans)) {
    return { isValid: false, error: 'I dati relativi alle schede ("plans") non sono un array valido.' };
  }
  if (data.templates !== undefined && !Array.isArray(data.templates)) {
    return { isValid: false, error: 'I dati relativi ai modelli ("templates") non sono un array valido.' };
  }
  if (data.logbook !== undefined && !Array.isArray(data.logbook)) {
    return { isValid: false, error: 'I dati relativi al logbook ("logbook") non sono un array valido.' };
  }
  
  // Verifica che l'oggetto coachConfig se presente sia valido
  if (data.coachConfig !== undefined && typeof data.coachConfig !== 'object') {
    return { isValid: false, error: 'La configurazione ("coachConfig") non è un oggetto valido.' };
  }

  return { isValid: true };
}

// 4. Esportazione backup completo
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
      } else if (key === 'pt_favorite_exercises' || key === 'pt_recent_exercises') {
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

// 5. Creazione del pre-import backup di sicurezza nel localStorage
export function createPreImportBackup(): void {
  const currentKeys: Record<string, string> = {};
  
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && (key.startsWith('pt_') || key.startsWith('alert_ignore_') || key.startsWith('alert_note_'))) {
      const val = localStorage.getItem(key);
      if (val !== null) {
        currentKeys[key] = val;
      }
    }
  }
  
  localStorage.setItem('pt_pre_import_backup', JSON.stringify(currentKeys));
}

// 6. Ripristino del backup di sicurezza precedente all'importazione
export function restorePreImportBackup(): boolean {
  const backupStr = localStorage.getItem('pt_pre_import_backup');
  if (!backupStr) return false;

  try {
    const backupData: Record<string, string> = JSON.parse(backupStr);

    // Rimuove chiavi attuali dell'app prima del ripristino per non lasciare residui
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith('pt_') || key.startsWith('alert_ignore_') || key.startsWith('alert_note_'))) {
        if (key !== 'pt_pre_import_backup') {
          keysToRemove.push(key);
        }
      }
    }
    keysToRemove.forEach(k => localStorage.removeItem(k));

    // Scrive nuovamente tutti i vecchi dati
    Object.entries(backupData).forEach(([k, v]) => {
      localStorage.setItem(k, v);
    });

    return true;
  } catch (error) {
    console.error('Errore durante il rollback del backup:', error);
    return false;
  }
}

// 7. Unione generica con risoluzione conflitti
export async function mergeItems(
  currentList: any[],
  importedList: any[],
  onAskConflict: (itemType: string, currentItem: any, importedItem: any) => Promise<'current' | 'imported'>,
  itemType: string
): Promise<any[]> {
  const mergedMap = new Map<string, any>();

  currentList.forEach(item => {
    mergedMap.set(item.id, item);
  });

  for (const importedItem of importedList) {
    const existingItem = mergedMap.get(importedItem.id);
    if (!existingItem) {
      mergedMap.set(importedItem.id, importedItem);
    } else {
      // Conflitto rilevato. Cerca date di modifica
      const currentModDate = existingItem.updatedAt || existingItem.lastModified || existingItem.dataCreazione || existingItem.data;
      const importedModDate = importedItem.updatedAt || importedItem.lastModified || importedItem.dataCreazione || importedItem.data;

      if (currentModDate && importedModDate) {
        const currentMs = new Date(currentModDate).getTime();
        const importedMs = new Date(importedModDate).getTime();
        if (!isNaN(currentMs) && !isNaN(importedMs)) {
          if (importedMs > currentMs) {
            mergedMap.set(importedItem.id, importedItem);
          }
          continue; // Risolto tramite data più recente, salta richiesta
        }
      }

      // Se non c'è data o è uguale, chiedi all'utente
      const choice = await onAskConflict(itemType, existingItem, importedItem);
      if (choice === 'imported') {
        mergedMap.set(importedItem.id, importedItem);
      }
    }
  }

  return Array.from(mergedMap.values());
}
