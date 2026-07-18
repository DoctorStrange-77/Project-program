import {
  SkinfoldFormulaId,
  BodyDensityConversionId,
  BodyCompositionCalculationStatus,
  BodyCompositionCalculationInput,
  BodyCompositionCalculationResult,
  Sesso,
  SkinfoldSite,
  SkinfoldReading,
  SkinfoldMeasurements,
  ClientMeasurement,
  MeasurementConditions,
  SavedBodyCompositionCalculation,
} from '../types';

export interface FormulaDefinition {
  id: SkinfoldFormulaId;
  label: string;
  version: string;
  sessoSupportato: Sesso | 'Entrambi';
  minAge: number;
  maxAge: number;
  sitiObbligatori: SkinfoldSite[];
  riferimento: string;
  avvertenze: string;
  calculateDensity: (eta: number, skinfoldSum: number, sesso: Sesso) => number;
}

interface DurninCoefficients {
  c: number;
  m: number;
}

export function getDurninCoefficients(sesso: Sesso, eta: number): DurninCoefficients | null {
  if (sesso === 'Uomo') {
    if (eta >= 17 && eta <= 19) return { c: 1.1620, m: 0.0630 };
    if (eta >= 20 && eta <= 29) return { c: 1.1631, m: 0.0632 };
    if (eta >= 30 && eta <= 39) return { c: 1.1422, m: 0.0544 };
    if (eta >= 40 && eta <= 49) return { c: 1.1620, m: 0.0700 };
    if (eta >= 50 && eta <= 72) return { c: 1.1715, m: 0.0779 };
  } else if (sesso === 'Donna') {
    if (eta >= 16 && eta <= 19) return { c: 1.1549, m: 0.0678 };
    if (eta >= 20 && eta <= 29) return { c: 1.1599, m: 0.0717 };
    if (eta >= 30 && eta <= 39) return { c: 1.1423, m: 0.0632 };
    if (eta >= 40 && eta <= 49) return { c: 1.1333, m: 0.0612 };
    if (eta >= 50 && eta <= 68) return { c: 1.1339, m: 0.0645 };
  }
  return null;
}

export const BODY_COMPOSITION_FORMULAS: Record<SkinfoldFormulaId, FormulaDefinition> = {
  jackson_pollock_3_male: {
    id: 'jackson_pollock_3_male',
    label: 'Jackson-Pollock 3 siti — Uomo',
    version: '1978',
    sessoSupportato: 'Uomo',
    minAge: 18,
    maxAge: 61,
    sitiObbligatori: ['pettorale', 'addominale', 'coscia'],
    riferimento: 'Jackson, A.S. & Pollock, M.L. (1978). Generalized equations for predicting body density of men. British Journal of Nutrition, 40(3), 497-504.',
    avvertenze: 'Ideale per soggetti attivi e atleti maschi di età compresa tra 18 e 61 anni.',
    calculateDensity: (eta, S) => {
      return 1.10938 - 0.0008267 * S + 0.0000016 * (S * S) - 0.0002574 * eta;
    }
  },
  jackson_pollock_3_female: {
    id: 'jackson_pollock_3_female',
    label: 'Jackson-Pollock 3 siti — Donna',
    version: '1980',
    sessoSupportato: 'Donna',
    minAge: 18,
    maxAge: 55,
    sitiObbligatori: ['tricipitale', 'sovrailiaca', 'coscia'],
    riferimento: 'Jackson, A.S., Pollock, M.L. & Ward, A. (1980). Generalized equations for predicting body density of women. Medicine & Science in Sports & Exercise, 12(3), 175-181.',
    avvertenze: 'Ideale per donne attive e atlete di età compresa tra 18 e 55 anni.',
    calculateDensity: (eta, S) => {
      return 1.0994921 - 0.0009929 * S + 0.0000023 * (S * S) - 0.0001392 * eta;
    }
  },
  jackson_pollock_7_male: {
    id: 'jackson_pollock_7_male',
    label: 'Jackson-Pollock 7 siti — Uomo',
    version: '1978',
    sessoSupportato: 'Uomo',
    minAge: 18,
    maxAge: 61,
    sitiObbligatori: ['pettorale', 'ascellareMedia', 'tricipitale', 'sottoscapolare', 'addominale', 'sovrailiaca', 'coscia'],
    riferimento: 'Jackson, A.S. & Pollock, M.L. (1978). Generalized equations for predicting body density of men. British Journal of Nutrition, 40(3), 497-504.',
    avvertenze: 'Offre una stima robusta grazie alla distribuzione dei punti su tutto il corpo. Indicato per uomini da 18 a 61 anni.',
    calculateDensity: (eta, S) => {
      return 1.112 - 0.00043499 * S + 0.00000055 * (S * S) - 0.00028826 * eta;
    }
  },
  jackson_pollock_7_female: {
    id: 'jackson_pollock_7_female',
    label: 'Jackson-Pollock 7 siti — Donna',
    version: '1980',
    sessoSupportato: 'Donna',
    minAge: 18,
    maxAge: 55,
    sitiObbligatori: ['pettorale', 'ascellareMedia', 'tricipitale', 'sottoscapolare', 'addominale', 'sovrailiaca', 'coscia'],
    riferimento: 'Jackson, A.S., Pollock, M.L. & Ward, A. (1980). Generalized equations for predicting body density of women. Medicine & Science in Sports & Exercise, 12(3), 175-181.',
    avvertenze: 'Offre una stima robusta grazie alla distribuzione dei punti su tutto il corpo. Indicato per donne da 18 a 55 anni.',
    calculateDensity: (eta, S) => {
      return 1.097 - 0.00046971 * S + 0.00000056 * (S * S) - 0.00012828 * eta;
    }
  },
  durnin_womersley_4: {
    id: 'durnin_womersley_4',
    label: 'Durnin-Womersley 4 siti',
    version: '1974',
    sessoSupportato: 'Entrambi',
    minAge: 16,
    maxAge: 72,
    sitiObbligatori: ['bicipitale', 'tricipitale', 'sottoscapolare', 'sovrailiaca'],
    riferimento: 'Durnin, J.V. & Womersley, J. (1974). Body fat assessed from total body density and its estimation from skinfold thickness on 481 men and women aged from 16 to 72 Years. British Journal of Nutrition, 32(1), 77-97.',
    avvertenze: 'Utilizza la somma di 4 pliche e il logaritmo in base 10. Intervalli di applicazione: Uomini 17-72 anni, Donne 16-68 anni.',
    calculateDensity: (eta, S, sesso) => {
      const L = Math.log10(S);
      const coeffs = getDurninCoefficients(sesso, eta);
      if (!coeffs) {
        throw new Error(`Coefficienti Durnin-Womersley non trovati per sesso "${sesso}" ed età ${eta}.`);
      }
      return coeffs.c - coeffs.m * L;
    }
  }
};

export function getFormulaDefinition(formulaId: SkinfoldFormulaId): FormulaDefinition {
  const formula = BODY_COMPOSITION_FORMULAS[formulaId];
  if (!formula) {
    throw new Error(`Formula "${formulaId}" non supportata.`);
  }
  return formula;
}

export function getRequiredSites(formulaId: SkinfoldFormulaId): SkinfoldSite[] {
  return getFormulaDefinition(formulaId).sitiObbligatori;
}

export function extractSelectedSkinfoldValues(
  pliche: SkinfoldMeasurements | SkinfoldReading[] | undefined
): Partial<Record<SkinfoldSite, number>> {
  const result: Partial<Record<SkinfoldSite, number>> = {};
  if (!pliche) return result;
  
  const readings = Array.isArray(pliche) ? pliche : pliche.readings || [];
  
  readings.forEach((r) => {
    if (r && r.site && r.selectedValue !== undefined && r.selectedValue !== null) {
      const val = r.selectedValue;
      if (Number.isFinite(val) && val > 0) {
        result[r.site] = val;
      }
    }
  });
  
  return result;
}

export function convertDensityToBodyFat(bodyDensity: number, conversionId: BodyDensityConversionId): number {
  if (conversionId === 'siri_1961') {
    return (4.95 / bodyDensity - 4.50) * 100;
  } else if (conversionId === 'brozek_1963') {
    return (4.570 / bodyDensity - 4.142) * 100;
  }
  throw new Error(`Conversione densità "${conversionId}" non supportata.`);
}

export function calculateFatAndLeanMass(pesoKg: number, bodyFatPercent: number): { fatMassKg: number; leanMassKg: number } {
  const fatMassKg = (pesoKg * bodyFatPercent) / 100;
  const leanMassKg = pesoKg - fatMassKg;
  return { fatMassKg, leanMassKg };
}

export function validateBodyCompositionInput(
  input: BodyCompositionCalculationInput,
  originalPliche?: SkinfoldReading[] | SkinfoldMeasurements,
  currentConditions?: MeasurementConditions,
  previousMeasurement?: ClientMeasurement
): { status: BodyCompositionCalculationStatus; errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];

  const { formulaId, conversionId, sesso, eta, pesoKg, skinfoldValuesMm } = input;

  if (!formulaId) {
    errors.push("Formula di calcolo non selezionata.");
  }
  const formula = formulaId ? BODY_COMPOSITION_FORMULAS[formulaId] : null;
  if (formulaId && !formula) {
    errors.push(`Formula "${formulaId}" non supportata.`);
  }

  if (sesso === 'Altro') {
    errors.push("Le formule disponibili richiedono una selezione binaria del modello di riferimento e non sono applicate automaticamente a questo profilo.");
  }

  if (formula) {
    if (formula.sessoSupportato !== 'Entrambi' && formula.sessoSupportato !== sesso) {
      errors.push(`La formula "${formula.label}" non è compatibile con il sesso selezionato (${sesso}).`);
    }

    if (eta === undefined || eta === null || !Number.isFinite(eta)) {
      errors.push("Età non valida o assente.");
    } else {
      let minAge = formula.minAge;
      let maxAge = formula.maxAge;
      if (formulaId === 'durnin_womersley_4') {
        if (sesso === 'Uomo') {
          minAge = 17;
          maxAge = 72;
        } else if (sesso === 'Donna') {
          minAge = 16;
          maxAge = 68;
        }
      }

      if (eta < minAge || eta > maxAge) {
        errors.push(`L'età di ${eta} anni è fuori dall'intervallo previsto per questa formula (${minAge}-${maxAge} anni).`);
      }
    }

    const requiredSites = formula.sitiObbligatori;
    let missingSites = false;
    requiredSites.forEach(site => {
      const val = skinfoldValuesMm[site];
      if (val === undefined || val === null) {
        errors.push(`Manca il valore della plica obbligatoria: ${site}.`);
        missingSites = true;
      } else if (!Number.isFinite(val) || val <= 0) {
        errors.push(`Il valore della plica obbligatoria "${site}" deve essere maggiore di zero.`);
        missingSites = true;
      } else if (val >= 100) {
        errors.push(`Il valore della plica obbligatoria "${site}" deve essere inferiore a 100 mm.`);
        missingSites = true;
      }
    });

    let sum = 0;
    if (!missingSites) {
      requiredSites.forEach(site => {
        sum += skinfoldValuesMm[site] || 0;
      });
      if (sum <= 0) {
        errors.push("La somma delle pliche deve essere maggiore di zero.");
      }
    }
  }

  if (pesoKg === undefined || pesoKg === null || !Number.isFinite(pesoKg) || pesoKg <= 0) {
    errors.push("Il peso corporeo è obbligatorio e deve essere maggiore di zero.");
  }

  if (conversionId !== 'siri_1961' && conversionId !== 'brozek_1963') {
    errors.push("Formula di conversione della densità non supportata.");
  }

  let density: number | undefined;
  if (errors.length === 0 && formula) {
    try {
      let sum = 0;
      formula.sitiObbligatori.forEach(site => {
        sum += skinfoldValuesMm[site] || 0;
      });
      density = formula.calculateDensity(eta, sum, sesso);
      if (!density || !Number.isFinite(density) || density <= 0) {
        errors.push("Il calcolo della densità corporea ha prodotto un valore non valido (minore o uguale a zero o non finito).");
      }
    } catch (e) {
      errors.push("Errore durante il calcolo della densità corporea.");
    }
  }

  if (errors.length === 0 && formula && density !== undefined) {
    let sum = 0;
    formula.sitiObbligatori.forEach(site => {
      sum += skinfoldValuesMm[site] || 0;
    });

    if (density < 0.90) {
      warnings.push(`Densità corporea insolitamente bassa (${density.toFixed(5)}).`);
    }
    if (density > 1.20) {
      warnings.push(`Densità corporea insolitamente alta (${density.toFixed(5)}).`);
    }

    const bf = convertDensityToBodyFat(density, conversionId);
    if (bf < 0) {
      warnings.push(`La percentuale di grasso corporeo calcolata è negativa (${bf.toFixed(2)}%).`);
    }
    if (bf > 70) {
      warnings.push(`La percentuale di grasso corporeo calcolata è insolitamente alta (${bf.toFixed(2)}%).`);
    }

    if (sum > 300) {
      warnings.push(`La somma delle pliche supera 300 mm (${sum.toFixed(1)} mm).`);
    }

    Object.entries(skinfoldValuesMm).forEach(([site, val]) => {
      if (val !== undefined && val !== null && val > 60) {
        warnings.push(`La plica "${site}" supera i 60 mm (${val.toFixed(1)} mm).`);
      }
    });

    if (originalPliche) {
      const readingsList = Array.isArray(originalPliche) ? originalPliche : originalPliche.readings || [];
      readingsList.forEach(r => {
        if (r && r.readings && r.readings.length > 1) {
          const validVals = r.readings.filter(v => typeof v === 'number' && Number.isFinite(v));
          if (validVals.length >= 2) {
            const diff = Math.max(...validVals) - Math.min(...validVals);
            if (diff > 2) {
              warnings.push(`Differenza superiore a 2 mm tra le letture del sito: ${r.site} (${diff.toFixed(1)} mm).`);
            }
          }
        }
      });
    }

    if (previousMeasurement) {
      const prevCond = previousMeasurement.condizioni;
      const prevPliche = previousMeasurement.pliche;
      if (prevCond && currentConditions) {
        if (prevCond.operatorName && currentConditions.operatorName && prevCond.operatorName !== currentConditions.operatorName) {
          warnings.push(`L'operatore della misurazione è differente rispetto al controllo precedente (Corrente: ${currentConditions.operatorName} • Precedente: ${prevCond.operatorName}).`);
        }
        if (prevCond.fastingHours !== undefined && currentConditions.fastingHours !== undefined && Math.abs((prevCond.fastingHours || 0) - (currentConditions.fastingHours || 0)) > 2) {
          warnings.push(`Le ore di digiuno differiscono significativamente rispetto al controllo precedente (Corrente: ${currentConditions.fastingHours}h • Precedente: ${prevCond.fastingHours}h).`);
        }
      }
      if (prevPliche && originalPliche) {
        const prevCaliper = prevPliche.caliperName;
        const currentCaliper = Array.isArray(originalPliche) ? undefined : originalPliche.caliperName;
        if (prevCaliper && currentCaliper && prevCaliper !== currentCaliper) {
          warnings.push(`Il plicometro utilizzato è differente rispetto alla misurazione precedente (Corrente: ${currentCaliper} • Precedente: ${prevCaliper}).`);
        }
      }
    }

    const declaredProtocol = Array.isArray(originalPliche) ? undefined : originalPliche?.protocolName;
    if (declaredProtocol) {
      const is3SiteFormula = formulaId.includes('3');
      const is7SiteFormula = formulaId.includes('7');
      const isDurnin = formulaId.includes('durnin');
      const lowerProtocol = declaredProtocol.toLowerCase();

      if (is3SiteFormula && !lowerProtocol.includes('3')) {
        warnings.push(`Il protocollo dichiarato (${declaredProtocol}) non corrisponde alla formula selezionata (${formula.label}).`);
      } else if (is7SiteFormula && !lowerProtocol.includes('7')) {
        warnings.push(`Il protocollo dichiarato (${declaredProtocol}) non corrisponde alla formula selezionata (${formula.label}).`);
      } else if (isDurnin && !lowerProtocol.includes('durnin') && !lowerProtocol.includes('4')) {
        warnings.push(`Il protocollo dichiarato (${declaredProtocol}) non corrisponde alla formula selezionata (${formula.label}).`);
      }
    }
  }

  const status: BodyCompositionCalculationStatus = errors.length > 0 ? 'invalid' : warnings.length > 0 ? 'warning' : 'valid';

  return { status, errors, warnings };
}

export function calculateBodyDensity(input: BodyCompositionCalculationInput): number {
  const { formulaId, eta, sesso, skinfoldValuesMm } = input;
  const formula = BODY_COMPOSITION_FORMULAS[formulaId];
  if (!formula) {
    throw new Error(`Formula "${formulaId}" non supportata.`);
  }
  let sum = 0;
  formula.sitiObbligatori.forEach(site => {
    const val = skinfoldValuesMm[site];
    if (val === undefined || val === null) {
      throw new Error(`Manca la plica obbligatoria: ${site}`);
    }
    sum += val;
  });
  return formula.calculateDensity(eta, sum, sesso);
}

export function calculateBodyComposition(
  input: BodyCompositionCalculationInput,
  originalPliche?: SkinfoldReading[] | SkinfoldMeasurements,
  currentConditions?: MeasurementConditions,
  previousMeasurement?: ClientMeasurement
): BodyCompositionCalculationResult {
  const validation = validateBodyCompositionInput(input, originalPliche, currentConditions, previousMeasurement);

  const formula = input.formulaId ? BODY_COMPOSITION_FORMULAS[input.formulaId] : null;
  const requiredSites = formula ? formula.sitiObbligatori : [];
  
  let skinfoldSumMm = 0;
  if (formula) {
    formula.sitiObbligatori.forEach(site => {
      skinfoldSumMm += input.skinfoldValuesMm[site] || 0;
    });
  }

  const result: BodyCompositionCalculationResult = {
    status: validation.status,
    formulaId: input.formulaId,
    formulaLabel: formula ? formula.label : 'N/D',
    formulaVersion: formula ? formula.version : 'N/D',
    conversionId: input.conversionId,
    conversionLabel: input.conversionId === 'siri_1961' ? 'Siri (1961)' : 'Brozek (1963)',
    sessoUtilizzato: input.sesso,
    etaUtilizzata: input.eta,
    pesoUtilizzatoKg: input.pesoKg,
    sitesRequired: requiredSites,
    siteValuesMm: { ...input.skinfoldValuesMm },
    skinfoldSumMm,
    errors: validation.errors,
    warnings: validation.warnings,
    calculatedAt: new Date().toISOString()
  };

  if (validation.status !== 'invalid' && formula) {
    const bd = calculateBodyDensity(input);
    const bf = convertDensityToBodyFat(bd, input.conversionId);
    const masses = calculateFatAndLeanMass(input.pesoKg, bf);

    result.bodyDensity = bd;
    result.bodyFatPercent = bf;
    result.fatMassKg = masses.fatMassKg;
    result.leanMassKg = masses.leanMassKg;
  }

  return result;
}

export function createBodyCompositionInputSignature(input: BodyCompositionCalculationInput): string {
  const { formulaId, conversionId, sesso, eta, pesoKg, skinfoldValuesMm } = input;
  const sortedSites = Object.keys(skinfoldValuesMm)
    .sort()
    .map(site => {
      const val = skinfoldValuesMm[site as SkinfoldSite];
      return `${site}:${val !== undefined && val !== null ? val.toFixed(4) : 'null'}`;
    })
    .join(',');
  return `${formulaId}|${conversionId}|${sesso}|${eta}|${pesoKg.toFixed(4)}|[${sortedSites}]`;
}

export function isSavedCalculationOutdated(
  savedCalculation: SavedBodyCompositionCalculation,
  currentInput: BodyCompositionCalculationInput
): boolean {
  const currentSig = createBodyCompositionInputSignature(currentInput);
  return savedCalculation.inputSignature !== currentSig;
}

/**
 * TECHNICAL TEST SUITE VERIFICATION FUNCTION (Development-Only)
 * Verifies all specified vector test cases and returns true if they pass within tolerance.
 */
export function runVerificationTests(): boolean {
  const toleranceDensity = 0.000001;
  const toleranceFatPercent = 0.001;

  const results = {
    case1: false,
    case2: false,
    case3: false,
    case4: false,
    case5: false,
    case6: false,
  };

  // CASO 1 — Jackson-Pollock 3 uomo: S = 60 mm, Età = 30
  try {
    const input1: BodyCompositionCalculationInput = {
      formulaId: 'jackson_pollock_3_male',
      conversionId: 'siri_1961',
      sesso: 'Uomo',
      eta: 30,
      pesoKg: 80,
      skinfoldValuesMm: { pettorale: 20, addominale: 20, coscia: 20 }
    };
    const res = calculateBodyComposition(input1);
    if (res.bodyDensity !== undefined && res.bodyFatPercent !== undefined) {
      const bdMatch = Math.abs(res.bodyDensity - 1.057816) < toleranceDensity;
      const bfMatch = Math.abs(res.bodyFatPercent - 17.9453) < toleranceFatPercent;
      results.case1 = bdMatch && bfMatch;
    }
  } catch (e) {
    console.error('Test Case 1 failed with exception', e);
  }

  // CASO 2 — Jackson-Pollock 7 uomo: S = 100 mm, Età = 30
  try {
    const input2: BodyCompositionCalculationInput = {
      formulaId: 'jackson_pollock_7_male',
      conversionId: 'siri_1961',
      sesso: 'Uomo',
      eta: 30,
      pesoKg: 80,
      skinfoldValuesMm: {
        pettorale: 14.2,
        ascellareMedia: 14.2,
        tricipitale: 14.2,
        sottoscapolare: 14.2,
        addominale: 14.2,
        sovrailiaca: 14.2,
        coscia: 14.8 // sum close to 100
      }
    };
    // Let's force S=100 precisely
    const rawInput2: BodyCompositionCalculationInput = {
      formulaId: 'jackson_pollock_7_male',
      conversionId: 'siri_1961',
      sesso: 'Uomo',
      eta: 30,
      pesoKg: 80,
      skinfoldValuesMm: {
        pettorale: 100 / 7,
        ascellareMedia: 100 / 7,
        tricipitale: 100 / 7,
        sottoscapolare: 100 / 7,
        addominale: 100 / 7,
        sovrailiaca: 100 / 7,
        coscia: 100 / 7
      }
    };
    const res = calculateBodyComposition(rawInput2);
    if (res.bodyDensity !== undefined && res.bodyFatPercent !== undefined) {
      const bdMatch = Math.abs(res.bodyDensity - 1.0653532) < toleranceDensity;
      const bfMatch = Math.abs(res.bodyFatPercent - 14.6346) < toleranceFatPercent;
      results.case2 = bdMatch && bfMatch;
    }
  } catch (e) {
    console.error('Test Case 2 failed with exception', e);
  }

  // CASO 3 — Jackson-Pollock 3 donna: S = 60 mm, Età = 30
  try {
    const input3: BodyCompositionCalculationInput = {
      formulaId: 'jackson_pollock_3_female',
      conversionId: 'siri_1961',
      sesso: 'Donna',
      eta: 30,
      pesoKg: 60,
      skinfoldValuesMm: { tricipitale: 20, sovrailiaca: 20, coscia: 20 }
    };
    const res = calculateBodyComposition(input3);
    if (res.bodyDensity !== undefined && res.bodyFatPercent !== undefined) {
      const bdMatch = Math.abs(res.bodyDensity - 1.0440221) < toleranceDensity;
      const bfMatch = Math.abs(res.bodyFatPercent - 24.1279) < toleranceFatPercent;
      results.case3 = bdMatch && bfMatch;
    }
  } catch (e) {
    console.error('Test Case 3 failed with exception', e);
  }

  // CASO 4 — Jackson-Pollock 7 donna: S = 100 mm, Età = 30
  try {
    const rawInput4: BodyCompositionCalculationInput = {
      formulaId: 'jackson_pollock_7_female',
      conversionId: 'siri_1961',
      sesso: 'Donna',
      eta: 30,
      pesoKg: 60,
      skinfoldValuesMm: {
        pettorale: 100 / 7,
        ascellareMedia: 100 / 7,
        tricipitale: 100 / 7,
        sottoscapolare: 100 / 7,
        addominale: 100 / 7,
        sovrailiaca: 100 / 7,
        coscia: 100 / 7
      }
    };
    const res = calculateBodyComposition(rawInput4);
    if (res.bodyDensity !== undefined && res.bodyFatPercent !== undefined) {
      const bdMatch = Math.abs(res.bodyDensity - 1.0517806) < toleranceDensity;
      const bfMatch = Math.abs(res.bodyFatPercent - 20.6305) < toleranceFatPercent;
      results.case4 = bdMatch && bfMatch;
    }
  } catch (e) {
    console.error('Test Case 4 failed with exception', e);
  }

  // CASO 5 — Durnin-Womersley uomo 20–29: S = 60 mm
  try {
    const rawInput5: BodyCompositionCalculationInput = {
      formulaId: 'durnin_womersley_4',
      conversionId: 'siri_1961',
      sesso: 'Uomo',
      eta: 25,
      pesoKg: 75,
      skinfoldValuesMm: {
        bicipitale: 15,
        tricipitale: 15,
        sottoscapolare: 15,
        sovrailiaca: 15
      }
    };
    const res = calculateBodyComposition(rawInput5);
    if (res.bodyDensity !== undefined && res.bodyFatPercent !== undefined) {
      const bdMatch = Math.abs(res.bodyDensity - 1.0507208) < toleranceDensity;
      const bfMatch = Math.abs(res.bodyFatPercent - 21.1052) < toleranceFatPercent;
      results.case5 = bdMatch && bfMatch;
    }
  } catch (e) {
    console.error('Test Case 5 failed with exception', e);
  }

  // CASO 6 — Durnin-Womersley donna 20–29: S = 60 mm
  try {
    const rawInput6: BodyCompositionCalculationInput = {
      formulaId: 'durnin_womersley_4',
      conversionId: 'siri_1961',
      sesso: 'Donna',
      eta: 25,
      pesoKg: 60,
      skinfoldValuesMm: {
        bicipitale: 15,
        tricipitale: 15,
        sottoscapolare: 15,
        sovrailiaca: 15
      }
    };
    const res = calculateBodyComposition(rawInput6);
    if (res.bodyDensity !== undefined && res.bodyFatPercent !== undefined) {
      const bdMatch = Math.abs(res.bodyDensity - 1.0324066) < toleranceDensity;
      const bfMatch = Math.abs(res.bodyFatPercent - 29.4623) < toleranceFatPercent;
      results.case6 = bdMatch && bfMatch;
    }
  } catch (e) {
    console.error('Test Case 6 failed with exception', e);
  }

  return Object.values(results).every(v => v);
}
