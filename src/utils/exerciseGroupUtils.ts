/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { WorkoutExercise, ExerciseGroupType } from '../types';

// 6. VALORI PREDEFINITI
export const DEFAULT_GROUP_REST_BETWEEN_EXERCISES_SEC = 0;
export const DEFAULT_GROUP_REST_AFTER_ROUND_SEC = 90;
export const DEFAULT_GROUP_ROUNDS = 1;
export const DEFAULT_JUMPSET_REST_BETWEEN_EXERCISES_SEC = 60;

// 1. TIPI DI GRUPPO VALIDI
export const VALID_EXERCISE_GROUP_TYPES: ExerciseGroupType[] = [
  'superset',
  'compound_set',
  'triset',
  'giant_set',
  'jumpset',
  'circuit'
];

export interface ExerciseGroup {
  groupId: string;
  groupType: ExerciseGroupType;
  members: WorkoutExercise[];
  groupRestBetweenExercisesSec: number;
  groupRestAfterRoundSec: number;
  groupRounds: number;
}

/**
 * 2. NORMALIZZAZIONE DEL TIPO
 */
export function normalizeExerciseGroupType(value: any): ExerciseGroupType | undefined {
  if (value === undefined || value === null) return undefined;
  const lower = String(value).toLowerCase().trim();
  if (lower === 'superset') return 'superset';
  if (lower === 'compound_set' || lower === 'compound set') return 'compound_set';
  if (lower === 'triset') return 'triset';
  if (lower === 'giant_set' || lower === 'giant set') return 'giant_set';
  if (lower === 'jumpset') return 'jumpset';
  if (lower === 'circuit' || lower === 'circuito') return 'circuit';
  return undefined;
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

  const groupType = normalizeExerciseGroupType(exercise.groupType);
  const hasGroup = !!(exercise.groupId && exercise.groupId.trim() !== '' && groupType);

  const defaultRestBetween = groupType === 'jumpset'
    ? DEFAULT_JUMPSET_REST_BETWEEN_EXERCISES_SEC
    : DEFAULT_GROUP_REST_BETWEEN_EXERCISES_SEC;

  return {
    ...exercise,
    groupType,
    groupRestBetweenExercisesSec: hasGroup 
      ? (exercise.groupRestBetweenExercisesSec ?? defaultRestBetween) 
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
 * Restituisce true soltanto quando:
 * - groupId è una stringa non vuota;
 * - groupType viene riconosciuto da normalizeExerciseGroupType.
 */
export function isGroupedExercise(exercise: any): boolean {
  if (!exercise) return false;
  const groupId = exercise.groupId;
  if (typeof groupId !== 'string' || groupId.trim() === '') return false;
  const groupType = normalizeExerciseGroupType(exercise.groupType);
  if (groupType === undefined) return false;
  return VALID_EXERCISE_GROUP_TYPES.includes(groupType);
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
    const groupType = normalizeExerciseGroupType(leader.groupType)!;
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

  // 4. VALIDAZIONE DEL TIPO RICEVUTO
  const normalizedType = normalizeExerciseGroupType(groupType);
  if (!normalizedType) {
    errors.push('Tipologia del gruppo non valida.');
  }

  if (!members || members.length === 0) {
    errors.push('Il gruppo non contiene esercizi.');
    return { valid: false, errors };
  }

  const count = members.length;

  if (normalizedType) {
    // Dimensioni minime/esatte
    if (normalizedType === 'superset' && count < 2) {
      errors.push('Un superset deve contenere almeno 2 esercizi.');
    } else if (normalizedType === 'compound_set' && count !== 2) {
      errors.push('Un compound set deve contenere esattamente 2 esercizi.');
    } else if (normalizedType === 'compound_set' && count === 2) {
      if (members[0].distrettoMuscolare !== members[1].distrettoMuscolare) {
        errors.push('Un compound set richiede esercizi dello stesso distretto muscolare.');
      }
    } else if (normalizedType === 'jumpset' && count !== 2) {
      errors.push('Un jumpset deve contenere esattamente 2 esercizi.');
    } else if (normalizedType === 'jumpset' && count === 2) {
      if (members[0].distrettoMuscolare === members[1].distrettoMuscolare) {
        errors.push('Un jumpset richiede esercizi di distretti muscolari differenti.');
      }
    } else if (normalizedType === 'triset' && count !== 3) {
      errors.push('Un triset deve contenere esattamente 3 esercizi.');
    } else if (normalizedType === 'giant_set' && count < 4) {
      errors.push('Un giant set deve contenere almeno 4 esercizi.');
    } else if (normalizedType === 'circuit' && count < 4) {
      errors.push('Un circuito deve contenere almeno 4 esercizi.');
    }
  }

  // 6. groupId COMUNE
  let refGroupId: string | null = null;
  for (const m of members) {
    if (m.groupId && typeof m.groupId === 'string' && m.groupId.trim() !== '') {
      refGroupId = m.groupId;
      break;
    }
  }

  let hasGroupIdMismatch = false;
  const ordersSet = new Set<number>();
  let hasDuplicateOrder = false;

  members.forEach((member, index) => {
    const prefix = `Esercizio ${index + 1} ("${member.nome || 'Senza nome'}"): `;

    // groupId presente
    if (!member.groupId || typeof member.groupId !== 'string' || member.groupId.trim() === '') {
      errors.push(`${prefix}groupId mancante o non valido.`);
    } else if (refGroupId && member.groupId !== refGroupId) {
      hasGroupIdMismatch = true;
    }

    // 5. groupType OBBLIGATORIO PER OGNI MEMBRO
    const memberType = normalizeExerciseGroupType(member.groupType);
    if (!member.groupType) {
      errors.push(`${prefix}groupType assente.`);
    } else if (!memberType) {
      errors.push(`${prefix}groupType non riconosciuto.`);
    } else if (normalizedType && memberType !== normalizedType) {
      errors.push(`${prefix}ha un groupType differente rispetto al gruppo (${memberType || member.groupType} vs ${normalizedType}).`);
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
  });

  if (hasGroupIdMismatch) {
    errors.push('Gli esercizi del gruppo devono condividere lo stesso groupId.');
  }

  if (hasDuplicateOrder) {
    errors.push('Ci sono valori di groupOrder duplicati all’interno dello stesso gruppo.');
  }

  // 8. ORDINE DEI MEMBRI: sequenza continua a partire da 1
  let isSequenceValid = true;
  const sortedOrders = Array.from(ordersSet).sort((a, b) => a - b);
  if (sortedOrders.length !== count) {
    isSequenceValid = false;
  } else {
    for (let i = 0; i < count; i++) {
      if (sortedOrders[i] !== i + 1) {
        isSequenceValid = false;
        break;
      }
    }
  }

  if (!isSequenceValid) {
    errors.push('I groupOrder devono formare una sequenza continua a partire da 1.');
  }

  // 7. COERENZA DELLE IMPOSTAZIONI
  const normalizedMembers = members.map(normalizeExerciseGroupData);
  let hasRestBetweenMismatch = false;
  let hasRestAfterMismatch = false;
  let hasRoundsMismatch = false;

  if (normalizedMembers.length > 0) {
    const firstBetween = normalizedMembers[0].groupRestBetweenExercisesSec;
    const firstAfter = normalizedMembers[0].groupRestAfterRoundSec;
    const firstRounds = normalizedMembers[0].groupRounds;

    for (let i = 1; i < normalizedMembers.length; i++) {
      if (normalizedMembers[i].groupRestBetweenExercisesSec !== firstBetween) {
        hasRestBetweenMismatch = true;
      }
      if (normalizedMembers[i].groupRestAfterRoundSec !== firstAfter) {
        hasRestAfterMismatch = true;
      }
      if (normalizedMembers[i].groupRounds !== firstRounds) {
        hasRoundsMismatch = true;
      }
    }
  }

  if (hasRestBetweenMismatch) {
    errors.push('Il recupero tra gli esercizi non è uniforme nel gruppo.');
  }
  if (hasRestAfterMismatch) {
    errors.push('Il recupero dopo il giro non è uniforme nel gruppo.');
  }
  if (hasRoundsMismatch) {
    errors.push('Il numero di giri non è uniforme nel gruppo.');
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
 * 8. COPIA E DUPLICAZIONE / IDENTIFICATIVO UNIVOCO
 * Genera un nuovo identificativo stabile, non vuoto, senza spazi e sufficientemente univoco.
 */
export function createExerciseGroupId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `group_${crypto.randomUUID()}`;
  }

  // Fallback UUID v4 generator
  let uuid = '';
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    // Set UUID v4 variant and version bits
    bytes[6] = (bytes[6] & 0x0f) | 0x40; // Version 4
    bytes[8] = (bytes[8] & 0x3f) | 0x80; // Variant 10xxxxxx
    
    const hex: string[] = [];
    for (let i = 0; i < 16; i++) {
      hex.push(bytes[i].toString(16).padStart(2, '0'));
    }
    uuid = [
      hex.slice(0, 4).join(''),
      hex.slice(4, 6).join(''),
      hex.slice(6, 8).join(''),
      hex.slice(8, 10).join(''),
      hex.slice(10, 16).join('')
    ].join('-');
  } else {
    // Math.random & Date.now fallback
    const d = Date.now().toString(16);
    const r1 = Math.random().toString(16).substring(2, 10);
    const r2 = Math.random().toString(16).substring(2, 10);
    const r3 = Math.random().toString(16).substring(2, 6);
    uuid = `${d}-${r1}-${r2}-${r3}`;
  }

  return `group_${uuid}`;
}

// 10. TEST SUITE (MANUALI)
export function runExerciseGroupTests() {
  console.log('=== RUNNING EXERCISE GROUP UTILS SELF-TESTS ===');
  try {
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

    // 1. esercizio singolo senza gruppo
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
    normalizeExerciseGroupData(legacyEx);
    const originalUntouched = legacyEx.groupRest === 120 && legacyEx.groupRestAfterRoundSec === undefined;
    console.log('Test - Nessuna modifica ai dati legacy originali:', originalUntouched ? 'PASSED' : 'FAILED');

    // 13. groupType sconosciuto
    const invalidTypeRes = validateExerciseGroup('sconosciuto' as any, [exSuperset1, exSuperset2]);
    const isTypeInvalid = invalidTypeRes.valid === false && invalidTypeRes.errors.includes('Tipologia del gruppo non valida.');
    console.log('Test - groupType sconosciuto:', isTypeInvalid ? 'PASSED' : 'FAILED');

    // 14. membro senza groupType
    const memberNoType = { ...exSuperset1, groupType: undefined };
    const noTypeRes = validateExerciseGroup('superset', [memberNoType, exSuperset2]);
    const isNoTypeInvalid = noTypeRes.valid === false && noTypeRes.errors.some(e => e.includes('groupType assente.'));
    console.log('Test - Membro senza groupType:', isNoTypeInvalid ? 'PASSED' : 'FAILED');

    // 15. due membri con groupId differenti
    const memberDiffGroup = { ...exSuperset2, groupId: 'diff_group_id' };
    const diffGroupIdRes = validateExerciseGroup('superset', [exSuperset1, memberDiffGroup]);
    const isDiffGroupInvalid = diffGroupIdRes.valid === false && diffGroupIdRes.errors.includes('Gli esercizi del gruppo devono condividere lo stesso groupId.');
    console.log('Test - Due membri con groupId differenti:', isDiffGroupInvalid ? 'PASSED' : 'FAILED');

    // 16. recuperi differenti nello stesso gruppo
    const memberDiffRest = { ...exSuperset2, groupRestBetweenExercisesSec: 15 };
    const diffRestRes = validateExerciseGroup('superset', [exSuperset1, memberDiffRest]);
    const isDiffRestInvalid = diffRestRes.valid === false && diffRestRes.errors.includes('Il recupero tra gli esercizi non è uniforme nel gruppo.');
    console.log('Test - Recuperi differenti nel gruppo:', isDiffRestInvalid ? 'PASSED' : 'FAILED');

    // 17. numero di giri differente
    const memberDiffRounds = { ...exSuperset2, groupRounds: 4 };
    const diffRoundsRes = validateExerciseGroup('superset', [exSuperset1, memberDiffRounds]);
    const isDiffRoundsInvalid = diffRoundsRes.valid === false && diffRoundsRes.errors.includes('Il numero di giri non è uniforme nel gruppo.');
    console.log('Test - Numero di giri differente:', isDiffRoundsInvalid ? 'PASSED' : 'FAILED');

    // 18. ordini 1 e 3 (sequenza non continua)
    const memberOrder3 = { ...exSuperset2, groupOrder: 3 };
    const orderSequenceGapRes = validateExerciseGroup('superset', [exSuperset1, memberOrder3]);
    const isGapInvalid = orderSequenceGapRes.valid === false && orderSequenceGapRes.errors.includes('I groupOrder devono formare una sequenza continua a partire da 1.');
    console.log('Test - Ordini 1 e 3 non contigui:', isGapInvalid ? 'PASSED' : 'FAILED');

    // 19. ordini 1 e 2 validi
    const orderSequenceValidRes = validateExerciseGroup('superset', [exSuperset1, exSuperset2]);
    const isSequenceOk = orderSequenceValidRes.valid === true && !orderSequenceValidRes.errors.includes('I groupOrder devono formare una sequenza continua a partire da 1.');
    console.log('Test - Ordini 1 e 2 validi:', isSequenceOk ? 'PASSED' : 'FAILED');

    // 20. identificativo non vuoto
    const newId = createExerciseGroupId();
    const isIdValid = typeof newId === 'string' && newId.length > 0 && !newId.includes(' ');
    console.log('Test - Identificativo non vuoto e valido:', isIdValid ? 'PASSED' : 'FAILED');

    // 21. due chiamate consecutive producono identificativi differenti
    const anotherId = createExerciseGroupId();
    const isIdUnique = newId !== anotherId;
    console.log('Test - Identificativi univoci e differenti:', isIdUnique ? 'PASSED' : 'FAILED');

  } catch (error) {
    console.error('Error in self-tests:', error);
  }
  console.log('=== SELF-TESTS COMPLETED ===');
}
