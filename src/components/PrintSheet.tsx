/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { WorkoutPlan, CoachConfig, WorkoutWeek, WorkoutDay } from '../types';
import { Printer, X, Dumbbell, Sparkles, AlertCircle } from 'lucide-react';

interface PrintSheetProps {
  config: CoachConfig;
  plan: WorkoutPlan;
  onClose: () => void;
}

export default function PrintSheet({ config, plan, onClose }: PrintSheetProps) {
  const [printOption, setPrintOption] = useState<'all' | 'specific'>('specific');
  const [selectedWeek, setSelectedWeek] = useState<number>(1);
  const [isIframe] = useState(() => {
    try {
      return window.self !== window.top;
    } catch (e) {
      return true;
    }
  });

  const handlePrintTrigger = () => {
    window.print();
  };

  const hasWeeks = plan.weeks && plan.weeks.length > 0;

  // Gather weeks to print based on options
  const weeksToPrint: WorkoutWeek[] = (() => {
    if (!hasWeeks) {
      // Legacy fallback: single week 
      return [{
        weekIndex: 1,
        giornate: plan.giornate
      }];
    }

    if (printOption === 'all') {
      return plan.weeks!;
    } else {
      const match = plan.weeks!.find(w => w.weekIndex === selectedWeek);
      return match ? [match] : [plan.weeks![0]];
    }
  })();

  return (
    <div id="print-sheet-overlay" className="fixed inset-0 z-50 bg-neutral-950 overflow-y-auto p-4 sm:p-8 flex flex-col items-center">
      
      {/* Navigation Controls (Hidden in Print) */}
      <div className="w-full max-w-4xl flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 mb-6 bg-neutral-900 border border-neutral-800 p-4 rounded-xl print:hidden shrink-0">
        <div className="flex items-center gap-2">
          <Dumbbell className="w-5 h-5 text-[#CCFF00]" style={{ color: config.primaryColor }} />
          <span className="text-xs font-black uppercase text-white/80 tracking-wider">Anteprima di Stampa</span>
        </div>

        {/* Print options selector */}
        {hasWeeks && (
          <div className="flex flex-wrap items-center gap-3 text-xs">
            <div className="flex items-center gap-1 bg-black/40 p-1 border border-white/5 rounded-lg">
              <button
                onClick={() => setPrintOption('specific')}
                className={`px-2.5 py-1 rounded-md font-bold uppercase text-[9px] transition-all cursor-pointer ${printOption === 'specific' ? 'bg-neutral-800 text-white' : 'text-white/40 hover:text-white'}`}
              >
                Stampa Singola Settimana
              </button>
              <button
                onClick={() => setPrintOption('all')}
                className={`px-2.5 py-1 rounded-md font-bold uppercase text-[9px] transition-all cursor-pointer ${printOption === 'all' ? 'bg-neutral-800 text-white' : 'text-white/40 hover:text-white'}`}
              >
                Stampa Tutte {plan.weeks?.length}
              </button>
            </div>

            {printOption === 'specific' && (
              <select
                value={selectedWeek}
                onChange={(e) => setSelectedWeek(Number(e.target.value))}
                className="bg-black border border-white/10 px-2 py-1 text-xs text-white rounded focus:outline-none"
              >
                {plan.weeks?.map(w => (
                  <option key={w.weekIndex} value={w.weekIndex}>Settimana {w.weekIndex}</option>
                ))}
              </select>
            )}
          </div>
        )}

        <div className="flex items-center gap-3 text-xs self-end sm:self-auto">
          <button
            onClick={handlePrintTrigger}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-neutral-950 font-black uppercase tracking-wider transition-all cursor-pointer shadow-md"
            style={{ backgroundColor: config.primaryColor }}
          >
            <Printer className="w-4 h-4" />
            Stampa Ora
          </button>
          
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-white/5 hover:bg-neutral-800 text-white/50 hover:text-white font-semibold transition-colors cursor-pointer"
          >
            Chiudi
          </button>
        </div>
      </div>

      {isIframe && (
        <div className="w-full max-w-4xl bg-orange-950/40 border border-orange-800/40 p-4 rounded-xl text-left text-xs text-orange-200 mb-6 flex items-start gap-3 print:hidden">
          <AlertCircle className="w-5 h-5 text-orange-400 shrink-0 mt-0.5 animate-pulse" />
          <div className="space-y-1">
            <p className="font-extrabold text-orange-300 text-[13px] uppercase tracking-wide">⚠️ NOTA PER LA STAMPA / SALVATAGGIO IN PDF</p>
            <p className="text-white/80 leading-relaxed">
              I browser moderni bloccano l'apertura del dialogo di stampa (<code className="bg-black/30 px-1 py-0.5 rounded text-orange-300 font-mono text-[10px]">window.print()</code>) all'interno delle anteprime incorporate (iframe).
            </p>
            <p className="font-bold text-[#CCFF00] leading-relaxed mt-1">
              👉 Per scaricare il PDF correttamente, fai clic sul pulsante <span className="underline font-black">"Apri in una nuova scheda"</span> in alto a destra nell'interfaccia di AI Studio, e clicca di nuovo su "Stampa Ora"!
            </p>
          </div>
        </div>
      )}

      {/* Printable Sheet Area */}
      <div className="w-full max-w-4xl space-y-12">
        {weeksToPrint.map((week, wkIdx) => (
          <div 
            key={week.weekIndex}
            id="print-document" 
            className={`w-full bg-white text-neutral-900 p-8 sm:p-12 rounded-xl shadow-2xl print:shadow-none print:p-0 print:m-0 print:w-full border border-neutral-200 ${
              wkIdx > 0 ? 'print:break-before-page print:mt-12' : ''
            }`}
          >
            {/* Header Branding */}
            <div className="flex justify-between items-start border-b-2 border-neutral-800 pb-6">
              <div className="space-y-1 text-left">
                {config.logoUrl ? (
                  <img src={config.logoUrl} alt="Logo" className="h-10 w-auto object-contain mb-2 max-w-[130px]" />
                ) : (
                  <div className="w-8 h-8 rounded-lg bg-neutral-900 text-white flex items-center justify-center font-black text-xs mb-2">
                    {config.nomeProgramma.substring(0, 2).toUpperCase()}
                  </div>
                )}
                <h1 className="text-xl font-black tracking-tight text-neutral-950 uppercase">{config.nomeProgramma}</h1>
                {config.teamName && <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">{config.teamName}</p>}
                {config.slogan && <p className="text-[10px] italic text-neutral-400 font-serif">"{config.slogan}"</p>}
              </div>

              <div className="text-right text-xs space-y-0.5">
                <p className="font-extrabold text-neutral-950 text-sm">Coach: {config.nomeCoach}</p>
                <p className="text-neutral-500 font-bold uppercase tracking-wider text-[9px]">Scheda d'Allenamento</p>
                {hasWeeks && (
                  <p className="text-neutral-900 font-black text-xs uppercase tracking-wider mt-1 bg-neutral-100 px-2 py-0.5 rounded inline-block">
                    Settimana {week.weekIndex} di {plan.durataSettimane}
                  </p>
                )}
                <p className="text-neutral-400 font-mono text-[10px]">Creato: {plan.dataCreazione ? new Date(plan.dataCreazione).toLocaleDateString('it-IT') : ''}</p>
              </div>
            </div>

            {/* Client details box */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-5 border-b border-neutral-200 text-xs text-neutral-700 text-left">
              <div className="space-y-0.5 text-left">
                <span className="text-[9px] uppercase font-bold text-neutral-400 tracking-wider">Atleta</span>
                <p className="font-extrabold text-neutral-900 text-sm">{plan.clienteNomeCompleto}</p>
              </div>
              <div className="space-y-0.5 text-left">
                <span className="text-[9px] uppercase font-bold text-neutral-400 tracking-wider">Obiettivo</span>
                <p className="font-bold text-neutral-900">{plan.obiettivo}</p>
              </div>
              <div className="space-y-0.5 text-left">
                <span className="text-[9px] uppercase font-bold text-neutral-400 tracking-wider">Durata Programma</span>
                <p className="font-bold text-neutral-900">{plan.durataSettimane} settimane</p>
              </div>
              <div className="space-y-0.5 text-left">
                <span className="text-[9px] uppercase font-bold text-neutral-400 tracking-wider">Data Inizio</span>
                <p className="font-bold text-neutral-900">{plan.dataInizio ? new Date(plan.dataInizio).toLocaleDateString('it-IT') : 'Al primo avvio'}</p>
              </div>
            </div>

            {/* Coach general notes */}
            {plan.noteGenerali && (
              <div className="py-4 border-b border-neutral-200 text-xs text-left">
                <span className="text-[9px] uppercase font-bold text-neutral-400 tracking-wider block mb-1">Linee Guida del Programma</span>
                <p className="text-neutral-600 leading-relaxed italic">"{plan.noteGenerali}"</p>
              </div>
            )}

            {/* Workout Days Grid */}
            <div className="space-y-8 py-5">
              {week.giornate.map((day, dIdx) => (
                <div key={day.id} className="space-y-3 print:break-inside-avoid text-left">
                  <h2 className="text-xs font-black uppercase tracking-wider text-neutral-950 border-b border-neutral-800 pb-1 flex justify-between items-center">
                    <span>{day.nome}</span>
                    <span className="text-[10px] text-neutral-400 font-semibold">{day.esercizi.length} esercizi</span>
                  </h2>

                  {day.esercizi.length === 0 ? (
                    <p className="text-xs text-neutral-400 italic">Nessun esercizio programmato per questa giornata.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-neutral-300 text-neutral-400 uppercase font-black text-[9px] tracking-wider">
                            <th className="pb-1.5 w-[35%]">Esercizio</th>
                            <th className="pb-1.5 text-center w-[12%]">Recupero</th>
                            <th className="pb-1.5 text-center w-[10%]">Tempo</th>
                            {plan.weeks && plan.weeks.length > 0 ? (
                              plan.weeks.map((w) => (
                                <th key={w.weekIndex} className="pb-1.5 text-center font-bold text-neutral-900 border-l border-neutral-200">
                                  W{w.weekIndex}
                                </th>
                              ))
                            ) : (
                              <>
                                <th className="pb-1.5 text-center w-[10%]">Serie</th>
                                <th className="pb-1.5 text-center w-[12%]">Ripetizioni</th>
                                <th className="pb-1.5 text-center w-[10%]">RIR</th>
                                <th className="pb-1.5 text-right w-[11%]">Carico</th>
                              </>
                            )}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-150">
                          {day.esercizi.map((ex, exIdx) => {
                            const isInGroup = !!ex.groupId;
                            const isGroupLeader = isInGroup && (exIdx === 0 || day.esercizi[exIdx - 1]?.groupId !== ex.groupId);
                            const isGroupTrailer = isInGroup && (exIdx === day.esercizi.length - 1 || day.esercizi[exIdx + 1]?.groupId !== ex.groupId);

                            return (
                              <tr key={ex.id} className={`align-top ${isInGroup ? 'bg-neutral-50/50' : ''}`}>
                                <td className="py-2.5 pr-2 relative text-left">
                                  {/* Left grouping visual bar */}
                                  {isInGroup && (
                                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-neutral-900" />
                                  )}
                                  
                                  <div className={isInGroup ? 'pl-3' : ''}>
                                    <p className="font-extrabold text-neutral-950">
                                      {exIdx + 1}. {ex.nome}
                                      {isGroupLeader && (
                                        <span className="text-[8px] font-black uppercase text-neutral-600 border border-neutral-300 px-1 rounded ml-1.5 bg-white inline-block">
                                          {ex.groupType}
                                        </span>
                                      )}
                                    </p>
                                    <div className="flex flex-wrap items-center gap-1.5 text-[9px] text-neutral-500 uppercase font-semibold mt-0.5">
                                      <span>{ex.distrettoMuscolare}</span>
                                      {ex.tecnicaIntensita && ex.tecnicaIntensita !== 'Nessuna' && (
                                        <>
                                          <span>•</span>
                                          <span className="font-extrabold text-neutral-800">{ex.tecnicaIntensita}</span>
                                        </>
                                      )}
                                    </div>

                                    {ex.noteSpecificheSettimana && (
                                      <p className="text-[9px] text-neutral-800 font-bold mt-0.5">🎯 Focus: {ex.noteSpecificheSettimana}</p>
                                    )}

                                    {ex.noteTecniche && (
                                      <p className="text-[9px] text-neutral-500 italic mt-0.5 font-medium">💡 {ex.noteTecniche}</p>
                                    )}

                                    {ex.linkVideo && (
                                      <p className="text-[9px] text-sky-700 font-bold mt-0.5 flex items-center gap-1">
                                        🔗 Video Tutorial: <a href={ex.linkVideo} target="_blank" rel="noopener noreferrer" className="underline hover:text-sky-850 break-all">{ex.linkVideo}</a>
                                      </p>
                                    )}
                                  </div>
                                </td>
                                <td className="py-2.5 text-center text-neutral-700 font-medium">
                                  {isInGroup && isGroupLeader ? `Grp: ${ex.groupRest}s` : `${ex.recupero}s`}
                                </td>
                                <td className="py-2.5 text-center text-neutral-500 font-mono text-[10px]">{ex.tut || '3-0-1-0'}</td>
                                {plan.weeks && plan.weeks.length > 0 ? (
                                  plan.weeks.map((w) => {
                                    const targetWeekObj = plan.weeks?.find(wk => wk.weekIndex === w.weekIndex);
                                    const targetDayObj = targetWeekObj?.giornate[dIdx];
                                    const targetEx = targetDayObj?.esercizi[exIdx];

                                    return (
                                      <td key={w.weekIndex} className="py-2.5 text-center text-neutral-900 border-l border-neutral-200/50 font-medium">
                                        {targetEx ? (
                                          targetEx.blocks && targetEx.blocks.length > 0 ? (
                                            <div className="flex flex-col items-start gap-1 text-[9px] font-mono leading-tight px-1.5 py-0.5">
                                              {targetEx.blocks.map((b, idx) => {
                                                const label = b.nome || `Blocco ${idx + 1}`;
                                                const repsRange = b.repMin === b.repMax ? b.repMin : `${b.repMin}–${b.repMax}`;
                                                const rirStr = b.rir !== undefined ? `RIR ${b.rir}` : '';
                                                const caricoStr = b.caricoPrevisto ? ` @ ${b.caricoPrevisto}` : '';
                                                return (
                                                  <div key={b.id || idx} className="text-left font-semibold text-neutral-800 whitespace-nowrap">
                                                    {label} — {b.serie} × {repsRange} — {rirStr}{caricoStr}
                                                  </div>
                                                );
                                              })}
                                            </div>
                                          ) : (
                                            <div className="flex flex-col items-center">
                                              <span className="font-extrabold text-[11px]">
                                                {targetEx.serie}s x {targetEx.repMin}-{targetEx.repMax}
                                              </span>
                                              <span className="text-[9px] text-neutral-500 font-semibold">
                                                RIR {targetEx.rir}
                                              </span>
                                              {targetEx.caricoPrevisto && (
                                                <span className="text-[9px] text-neutral-700 font-bold mt-0.5 bg-neutral-100 px-1 rounded">
                                                  {targetEx.caricoPrevisto}
                                                </span>
                                              )}
                                            </div>
                                          )
                                        ) : (
                                          <span className="text-neutral-350">-</span>
                                        )}
                                      </td>
                                    );
                                  })
                                ) : (
                                  ex.blocks && ex.blocks.length > 0 ? (
                                    <td colSpan={4} className="py-2.5 text-center">
                                      <div className="flex flex-col items-center gap-1 text-[9px] font-mono leading-tight px-1.5 py-0.5">
                                        {ex.blocks.map((b, idx) => {
                                          const label = b.nome || `Blocco ${idx + 1}`;
                                          const repsRange = b.repMin === b.repMax ? b.repMin : `${b.repMin}–${b.repMax}`;
                                          const rirStr = b.rir !== undefined ? `RIR ${b.rir}` : '';
                                          const caricoStr = b.caricoPrevisto ? ` @ ${b.caricoPrevisto}` : '';
                                          return (
                                            <div key={b.id || idx} className="text-left font-semibold text-neutral-800 whitespace-nowrap">
                                              {label} — {b.serie} × {repsRange} — {rirStr}{caricoStr}
                                            </div>
                                          );
                                        })}
                                      </div>
                                    </td>
                                  ) : (
                                    <>
                                      <td className="py-2.5 text-center font-extrabold text-neutral-900">{ex.serie}</td>
                                      <td className="py-2.5 text-center text-neutral-700 font-medium">{ex.repMin}-{ex.repMax}</td>
                                      <td className="py-2.5 text-center text-neutral-700">RIR {ex.rir}</td>
                                      <td className="py-2.5 text-right text-neutral-800 font-extrabold pr-1">
                                        {ex.caricoPrevisto ? ex.caricoPrevisto : <span className="text-neutral-300 font-normal">_______</span>}
                                      </td>
                                    </>
                                  )
                                )}
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Footer info */}
            <div className="mt-10 border-t border-neutral-300 pt-5 text-center text-[10px] text-neutral-400 flex justify-between items-center">
              <p>Programmazione creata professionalmente con {config.nomeProgramma}</p>
              <p className="font-bold text-neutral-800">Firma Coach: _____________________</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
