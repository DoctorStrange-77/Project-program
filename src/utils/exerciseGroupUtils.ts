/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { WorkoutExercise, ExerciseGroupType } from '../types';

// 6. VALORI PREDEFINITI
export const DEFAULT_GROUP_REST_BETWEEN_EXERCISES_SEC = 0;
export const DEFAULT_GROUP_REST_AFTER_ROUND_SEC = 90;
export const DEFAULT_GROUP_ROUNDS = 1;

export interface ExerciseGroup {
  groupId: string;
  groupType: ExerciseGroupType;
  members: WorkoutExercise[];
  groupRestBetweenExercisesSec: number;
  groupRestAfterRoundSec: number;
  groupRounds: number;
}

/**
 * 4. UTILITY DEDICATE
 */

/**
 * Restituisce l’esercizio con i valori del gruppo normalizzati, usando groupRest come fallback legacy.
 * Usa sempre ?? e non || per i valori numerici.
 */
export function normalizeExerciseGroupData(exercise: WorkoutExercise): WorkoutExercise {
  if (!exercise) return exercise;

  let groupType = exercise.groupType;
  if (groupType) {
    const lower = String(groupType).toLowerCase().trim();
    if (lower === 'superset') {
      groupType = 'superset';
    } else if (lower === 'triset') {
      groupType = 'triset';
    } else if (lower === 'giant set' || lower === 'giant_set') {
      groupType = 'giant_set';
    } else if (lower === 'jumpset') {
      groupType = 'jumpset';
    } else if (lower === 'circuito' || lower === 'circuit') {
      groupType = 'circuit';
    } else if (lower === 'compound set' || lower === 'compound_set') {
      groupType = 'compound_set';
    }
  }

  const hasGroup = !!(exercise.groupId && groupType);

  return {
    ...exercise,
    groupType: groupType as ExerciseGroupType | undefined,
    groupRestBetweenExercisesSec: hasGroup 
      ? (exercise.groupRestBetweenExercisesSec ?? DEFAULT_GROUP_REST_BETWEEN_EXERCISES_SEC) 
      : exercise.groupRestBetweenExercisesSec,
    groupRestAfterRoundSec: hasGroup 
      ? (exercise.groupRestAfterRoundSec ?? exercise.groupRest ?? DEFAULT_GROUP_REST_AFTER_ROUND_SEC) 
      : exercise.groupRestAfterRoundSec,
    groupRounds: hasGroup 
      ? (exercise.groupRounds ?? DEFAULT_GROUP_ROUNDS) 
      : exercise.groupRounds,
  };
}

/**
 * Restituisce true soltanto quando groupId e groupType sono validi.
 */
export function isGroupedExercise(exercise: any): boolean {
  if (!exercise) return false;
  const groupId = exercise.groupId;
  const groupType = exercise.groupType;
  if (!groupId || typeof groupId !== 'string' || groupId.trim() === '') return false;
  if (!groupType) return false;
  
  const validTypes: string[] = ['superset', 'compound_set', 'triset', 'giant_set', 'jumpset', 'circuit'];
  return validTypes.includes(String(groupType).toLowerCase().trim());
}

/**
 * Restituisce i gruppi presenti nell’array, organizzati per groupId.
 * I membri devono essere ordinati tramite groupOrder.
 */
export function getExerciseGroups(exercises: WorkoutExercise[]): ExerciseGroup[] {
  if (!exercises) return [];

  const groupsMap = new Map<string, WorkoutExercise[]>();

  exercises.forEach(ex => {
    const normalized = normalizeExerciseGroupData(ex);
    if (isGroupedExercise(normalized)) {
      const gid = normalized.groupId!;
      if (!groupsMap.has(gid)) {
        groupsMap.set(gid, []);
      }
      groupsMap.get(gid)!.push(normalized);
    }
  });

  const result: ExerciseGroup[] = [];

  groupsMap.forEach((members, groupId) => {
    // Ordina i membri per groupOrder
    const sortedMembers = [...members].sort((a, b) => {
      const orderA = a.groupOrder ?? Infinity;
      const orderB = b.groupOrder ?? Infinity;
      return orderA - orderB;
    });

    const leader = sortedMembers[0];
    const groupType = String(leader.groupType).toLowerCase().trim() as ExerciseGroupType;
    const groupRestBetweenExercisesSec = leader.groupRestBetweenExercisesSec ?? DEFAULT_GROUP_REST_BETWEEN_EXERCISES_SEC;
    const groupRestAfterRoundSec = leader.groupRestAfterRoundSec ?? leader.groupRest ?? DEFAULT_GROUP_REST_AFTER_ROUND_SEC;
    const groupRounds = leader.groupRounds ?? DEFAULT_GROUP_ROUNDS;

    result.push({
      groupId,
      groupType,
      members: sortedMembers,
      groupRestBetweenExercisesSec,
      groupRestAfterRoundSec,
      groupRounds,
    });
  });

  return result;
}

/**
 * Restituisce gli esercizi appartenenti al gruppo, ordinati.
 */
export function getGroupMembers(exercises: WorkoutExercise[], groupId: string): WorkoutExercise[] {
  if (!exercises || !groupId) return [];
  return exercises
    .filter(ex => ex.groupId === groupId)
    .map(normalizeExerciseGroupData)
    .sort((a, b) => (a.groupOrder ?? Infinity) - (b.groupOrder ?? Infinity));
}

/**
 * Restituisce il prossimo numero disponibile.
 */
export function getNextGroupOrder(exercises: WorkoutExercise[], groupId: string): number {
  if (!exercises || !groupId) return 1;
  const members = exercises.filter(ex => ex.groupId === groupId);
  if (members.length === 0) return 1;
  const orders = members
    .map(ex => ex.groupOrder)
    .filter((o): o is number => o !== undefined && Number.isFinite(o) && Number.isInteger(o) && o >= 1);
  if (orders.length === 0) return 1;
  return Math.max(...orders) + 1;
}

/**
 * Restituisce una copia dell’esercizio senza i campi relativi al gruppo.
 */
export function removeExerciseFromGroup(exercise: WorkoutExercise): WorkoutExercise {
  const {
    groupId,
    groupType,
    groupRest,
    groupOrder,
    groupRestBetweenExercisesSec,
    groupRestAfterRoundSec,
    groupRounds,
    ...rest
  } = exercise;
  return rest as WorkoutExercise;
}

/**
 * 5. REGOLE DI VALIDAZIONE
 */
export function validateExerciseGroup(
  groupType: ExerciseGroupType,
  members: WorkoutExercise[]
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!members || members.length === 0) {
    errors.push('Il gruppo non contiene esercizi.');
    return { valid: false, errors };
  }

  const count = members.length;
  const normalizedType = String(groupType).toLowerCase().trim() as ExerciseGroupType;

  // Dimensioni minime/esatte
  if (normalizedType === 'superset' && count < 2) {
    errors.push('Un superset deve contenere almeno 2 esercizi.');
  } else if (normalizedType === 'compound_set' && count < 2) {
    errors.push('Un compound set deve contenere almeno 2 esercizi.');
  } else if (normalizedType === 'jumpset' && count < 2) {
    errors.push('Un jumpset deve contenere almeno 2 esercizi.');
  } else if (normalizedType === 'triset' && count !== 3) {
    errors.push('Un triset deve contenere esattamente 3 esercizi.');
  } else if (normalizedType === 'giant_set' && count < 4) {
    errors.push('Un giant set deve contenere almeno 4 esercizi.');
  } else if (normalizedType === 'circuit' && count < 2) {
    errors.push('Un circuito deve contenere almeno 2 esercizi.');
  }

  const ordersSet = new Set<number>();
  let hasDuplicateOrder = false;

  members.forEach((member, index) => {
    const prefix = `Esercizio ${index + 1} ("${member.nome || 'Senza nome'}"): `;

    // groupId presente
    if (!member.groupId || typeof member.groupId !== 'string' || member.groupId.trim() === '') {
      errors.push(`${prefix}groupId mancante o non valido.`);
    }

    // groupOrder intero e maggiore o uguale a 1
    const order = member.groupOrder;
    if (order === undefined) {
      errors.push(`${prefix}groupOrder mancante.`);
    } else if (typeof order !== 'number' || !Number.isFinite(order) || !Number.isInteger(order) || order < 1) {
      errors.push(`${prefix}groupOrder deve essere un intero maggiore o uguale a 1.`);
    } else {
      if (ordersSet.has(order)) {
        hasDuplicateOrder = true;
      }
      ordersSet.add(order);
    }

    // groupRestBetweenExercisesSec maggiore o uguale a 0
    const restBetween = member.groupRestBetweenExercisesSec;
    if (restBetween !== undefined) {
      if (typeof restBetween !== 'number' || !Number.isFinite(restBetween) || restBetween < 0) {
        errors.push(`${prefix}groupRestBetweenExercisesSec deve essere maggiore o uguale a 0.`);
      }
    }

    // groupRestAfterRoundSec maggiore o uguale a 0
    const restAfter = member.groupRestAfterRoundSec !== undefined ? member.groupRestAfterRoundSec : member.groupRest;
    if (restAfter !== undefined) {
      if (typeof restAfter !== 'number' || !Number.isFinite(restAfter) || restAfter < 0) {
        errors.push(`${prefix}groupRestAfterRoundSec deve essere maggiore o uguale a 0.`);
      }
    }

    // groupRounds intero e maggiore o uguale a 1
    const rounds = member.groupRounds;
    if (rounds !== undefined) {
      if (typeof rounds !== 'number' || !Number.isFinite(rounds) || !Number.isInteger(rounds) || rounds < 1) {
        errors.push(`${prefix}groupRounds deve essere un intero maggiore o uguale a 1.`);
      }
    }

    // stesso groupType per tutti i membri
    if (member.groupType && String(member.groupType).toLowerCase().trim() !== normalizedType) {
      errors.push(`${prefix}ha un groupType differente rispetto al gruppo (${member.groupType} vs ${groupType}).`);
    }
  });

  if (hasDuplicateOrder) {
    errors.push('Ci sono valori di groupOrder duplicati all’interno dello stesso gruppo.');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * 7. ETICHETTE A1, A2, A3
 * Supporta almeno 26 gruppi, da A a Z.
 */
export function getGroupMemberLabel(groupIndex: number, memberOrder: number): string {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const char = letters[groupIndex % 26] || 'A';
  return `${char}${memberOrder}`;
}

/**
 * 8. COPIA E DUPLICAZIONE
 * Genera un nuovo identificativo stabile, non vuoto e sufficientemente univoco.
 */
export function createExerciseGroupId(): string {
  return 'g_' + Math.random().toString(36).substring(2, 9);
}

// 10. TEST SUITE
export function runExerciseGroupTests() {
  console.log('=== RUNNING EXERCISE GROUP UTILS SELF-TESTS ===');
  try {
    // 1. esercizio singolo senza gruppo
    const exSingle: WorkoutExercise = {
      id: 'ex1',
      exerciseId: 'orig1',
      nome: 'Panca Piana',
      distrettoMuscolare: 'Pettorali',
      serie: 4,
      repMin: 8,
      repMax: 10,
      rir: 2,
      recupero: 90,
      tut: '3-0-1-0'
    };
    const isGrpSingle = isGroupedExercise(exSingle);
    console.log('Test - Esercizio singolo senza gruppo isGroupedExercise:', isGrpSingle === false ? 'PASSED' : 'FAILED');

    // 2. vecchio campo groupRest
    const exLegacyRest: WorkoutExercise = {
      ...exSingle,
      groupId: 'g_legacy',
      groupType: 'superset' as any,
      groupRest: 120, // legacy fallback rest
      groupOrder: 1
    };
    const normalizedLegacy = normalizeExerciseGroupData(exLegacyRest);
    console.log('Test - Vecchio campo groupRest fallback:', normalizedLegacy.groupRestAfterRoundSec === 120 ? 'PASSED' : 'FAILED');

    // 3. recupero pari a 0
    const exZeroRest: WorkoutExercise = {
      ...exSingle,
      groupId: 'g_zero',
      groupType: 'superset' as any,
      groupRestAfterRoundSec: 0,
      groupOrder: 1
    };
    const normalizedZero = normalizeExerciseGroupData(exZeroRest);
    console.log('Test - Recupero pari a 0 preserved:', normalizedZero.groupRestAfterRoundSec === 0 ? 'PASSED' : 'FAILED');

    // 4. superset con due esercizi
    const exSuperset1: WorkoutExercise = {
      ...exSingle,
      id: 's1',
      groupId: 'g_super',
      groupType: 'superset' as any,
      groupOrder: 1,
      groupRestAfterRoundSec: 90,
      groupRestBetweenExercisesSec: 0,
      groupRounds: 3
    };
    const exSuperset2: WorkoutExercise = {
      ...exSingle,
      id: 's2',
      groupId: 'g_super',
      groupType: 'superset' as any,
      groupOrder: 2,
      groupRestAfterRoundSec: 90,
      groupRestBetweenExercisesSec: 0,
      groupRounds: 3
    };
    const validationSuperset = validateExerciseGroup('superset', [exSuperset1, exSuperset2]);
    console.log('Test - Superset valido con due esercizi:', validationSuperset.valid === true ? 'PASSED' : 'FAILED');

    // 5. triset con tre esercizi
    const exTriset1 = { ...exSingle, id: 't1', groupId: 'g_tri', groupType: 'triset' as any, groupOrder: 1, groupRounds: 3 };
    const exTriset2 = { ...exSingle, id: 't2', groupId: 'g_tri', groupType: 'triset' as any, groupOrder: 2, groupRounds: 3 };
    const exTriset3 = { ...exSingle, id: 't3', groupId: 'g_tri', groupType: 'triset' as any, groupOrder: 3, groupRounds: 3 };
    const validationTrisetValido = validateExerciseGroup('triset', [exTriset1, exTriset2, exTriset3]);
    console.log('Test - Triset valido con tre esercizi:', validationTrisetValido.valid === true ? 'PASSED' : 'FAILED');

    // 6. triset con due esercizi non valido
    const validationTrisetInvalido = validateExerciseGroup('triset', [exTriset1, exTriset2]);
    console.log('Test - Triset non valido con due esercizi:', validationTrisetInvalido.valid === false ? 'PASSED' : 'FAILED');

    // 7. giant set con quattro esercizi
    const exGiant1 = { ...exSingle, id: 'gs1', groupId: 'g_giant', groupType: 'giant_set' as any, groupOrder: 1, groupRounds: 3 };
    const exGiant2 = { ...exSingle, id: 'gs2', groupId: 'g_giant', groupType: 'giant_set' as any, groupOrder: 2, groupRounds: 3 };
    const exGiant3 = { ...exSingle, id: 'gs3', groupId: 'g_giant', groupType: 'giant_set' as any, groupOrder: 3, groupRounds: 3 };
    const exGiant4 = { ...exSingle, id: 'gs4', groupId: 'g_giant', groupType: 'giant_set' as any, groupOrder: 4, groupRounds: 3 };
    const validationGiant = validateExerciseGroup('giant_set', [exGiant1, exGiant2, exGiant3, exGiant4]);
    console.log('Test - Giant set valido con quattro esercizi:', validationGiant.valid === true ? 'PASSED' : 'FAILED');

    // 8. circuito con cinque esercizi
    const exCirc1 = { ...exSingle, id: 'c1', groupId: 'g_circ', groupType: 'circuit' as any, groupOrder: 1, groupRounds: 3 };
    const exCirc2 = { ...exSingle, id: 'c2', groupId: 'g_circ', groupType: 'circuit' as any, groupOrder: 2, groupRounds: 3 };
    const exCirc3 = { ...exSingle, id: 'c3', groupId: 'g_circ', groupType: 'circuit' as any, groupOrder: 3, groupRounds: 3 };
    const exCirc4 = { ...exSingle, id: 'c4', groupId: 'g_circ', groupType: 'circuit' as any, groupOrder: 4, groupRounds: 3 };
    const exCirc5 = { ...exSingle, id: 'c5', groupId: 'g_circ', groupType: 'circuit' as any, groupOrder: 5, groupRounds: 3 };
    const validationCirc = validateExerciseGroup('circuit', [exCirc1, exCirc2, exCirc3, exCirc4, exCirc5]);
    console.log('Test - Circuito valido con cinque esercizi:', validationCirc.valid === true ? 'PASSED' : 'FAILED');

    // 9. groupOrder duplicati
    const exDup1 = { ...exSingle, id: 'd1', groupId: 'g_dup', groupType: 'superset' as any, groupOrder: 1 };
    const exDup2 = { ...exSingle, id: 'd2', groupId: 'g_dup', groupType: 'superset' as any, groupOrder: 1 };
    const validationDup = validateExerciseGroup('superset', [exDup1, exDup2]);
    console.log('Test - GroupOrder duplicati non validi:', validationDup.valid === false ? 'PASSED' : 'FAILED');

    // 10. gruppi differenti nella stessa giornata
    const dayExercises = [exSuperset1, exSuperset2, exTriset1, exTriset2, exTriset3];
    const groups = getExerciseGroups(dayExercises);
    const hasDifferentGroups = groups.length === 2 && groups.some(g => g.groupType === 'superset') && groups.some(g => g.groupType === 'triset');
    console.log('Test - Gruppi differenti nella stessa giornata:', hasDifferentGroups === true ? 'PASSED' : 'FAILED');

    // 11. generazione delle etichette A1, A2, B1 e Z3
    const lblA1 = getGroupMemberLabel(0, 1);
    const lblA2 = getGroupMemberLabel(0, 2);
    const lblB1 = getGroupMemberLabel(1, 1);
    const lblZ3 = getGroupMemberLabel(25, 3);
    const lblsMatch = lblA1 === 'A1' && lblA2 === 'A2' && lblB1 === 'B1' && lblZ3 === 'Z3';
    console.log('Test - Generazione etichette:', lblsMatch ? 'PASSED' : 'FAILED');

    // 12. nessuna modifica dei dati legacy
    const legacyEx: WorkoutExercise = {
      ...exSingle,
      groupId: 'g_legacy',
      groupType: 'superset' as any,
      groupRest: 120
    };
    const resNorm = normalizeExerciseGroupData(legacyEx);
    // Verifichiamo che l'originale non sia stato modificato
    const originalUntouched = legacyEx.groupRest === 120 && legacyEx.groupRestAfterRoundSec === undefined;
    console.log('Test - Nessuna modifica ai dati legacy originali:', originalUntouched ? 'PASSED' : 'FAILED');

  } catch (error) {
    console.error('Error in self-tests:', error);
  }
  console.log('=== SELF-TESTS COMPLETED ===');
}
