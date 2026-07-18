/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { CoachConfig, Client, WorkoutPlan, Exercise } from '../types';
import { 
  Users, FileText, Dumbbell, UserPlus, FilePlus, Search, Trophy, 
  RotateCcw, History, ClipboardList, CheckCircle2
} from 'lucide-react';

interface DashboardProps {
  config: CoachConfig;
  clients: Client[];
  plans: WorkoutPlan[];
  exercises: Exercise[];
  onNavigate: (section: string) => void;
  onQuickAction: (action: 'add-client' | 'create-plan' | 'open-database') => void;
  hasAutosave: boolean;
  onResumeLastDraft: () => void;
  onShowToast?: (message: string, type: 'success' | 'error' | 'info' | 'warning') => void;
}

export default function Dashboard({ 
  config, 
  clients, 
  plans, 
  exercises, 
  onNavigate,
  onQuickAction,
  hasAutosave,
  onResumeLastDraft
}: DashboardProps) {
  // Stats
  const totalClients = clients.length;
  
  // Active plans and client with active plans
  const activePlans = plans.filter(p => p.status === 'Attiva');
  const activeClientsCount = clients.filter(c => 
    plans.some(p => p.clienteId === c.id && p.status === 'Attiva')
  ).length;

  const draftPlansCount = plans.filter(p => p.status === 'Bozza').length;
  const activePlansCount = activePlans.length;
  const completedPlansCount = plans.filter(p => p.status === 'Completata').length;
  const totalExercises = exercises.length;

  // Recent 3 modified/created plans
  const recentModifiedPlans = [...plans].sort((a, b) => {
    const dateA = a.dataCreazione || '1970-01-01';
    const dateB = b.dataCreazione || '1970-01-01';
    return new Date(dateB).getTime() - new Date(dateA).getTime();
  }).slice(0, 3);

  return (
    <div id="dashboard-view" className="space-y-8">
      {/* Welcome Hero Panel */}
      <div 
        id="dashboard-hero" 
        className="relative bg-[#121212] border border-white/5 rounded-2xl p-6 sm:p-8 overflow-hidden"
      >
        {/* Ambient background accent */}
        <div 
          className="absolute -top-32 -right-32 w-64 h-64 rounded-full opacity-10 blur-3xl transition-all"
          style={{ backgroundColor: config.primaryColor }}
        />
        
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative z-10">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/40">
              <Trophy className="w-4 h-4" style={{ color: config.primaryColor }} />
              <span>{config.teamName || 'Coach Board'}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tighter italic text-white leading-tight">
              Bentornato, Coach <br />
              <span style={{ color: config.primaryColor }}>{config.nomeCoach}</span>
            </h1>
            {config.slogan && (
              <p className="text-white/60 italic text-xs font-semibold">"{config.slogan}"</p>
            )}
          </div>
          
          {(() => {
            const now = new Date();
            const weekday = now.toLocaleDateString('it-IT', { weekday: 'long' }).toUpperCase();
            const dayNum = now.getDate();
            const month = now.toLocaleDateString('it-IT', { month: 'long' }).toUpperCase();
            const year = now.getFullYear();
            return (
              <div className="text-right flex flex-col items-end font-mono text-xs sm:text-sm tracking-wider uppercase leading-none shrink-0 self-end sm:self-center">
                <div className="font-black text-white/50 text-[11px] sm:text-xs">{weekday} {dayNum}</div>
                <div className="font-bold text-white/40 text-[10px] sm:text-[11px] mt-0.5">{month}</div>
                <div className="font-semibold text-white/30 text-[9px] sm:text-[10px] mt-0.5">{year}</div>
              </div>
            );
          })()}
        </div>
      </div>

      {/* Stats Grid Section - Fully responsive metrics */}
      <div id="dashboard-stats-wrapper" className="space-y-4">
        <h2 className="text-xs font-black text-white/40 uppercase tracking-widest">Panoramica Attività & Metriche</h2>
        <div id="dashboard-stats-grid" className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {/* Stat 1: Clienti Registrati */}
          <div 
            id="stat-card-clients" 
            onClick={() => onNavigate('Clienti')}
            className="bg-[#121212] border border-white/5 hover:border-white/10 rounded-2xl p-4 sm:p-6 flex flex-col justify-between transition-all cursor-pointer group"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[9px] font-black text-white/40 uppercase tracking-widest leading-none">Clienti Totali</p>
                <p className="text-3xl sm:text-4xl font-black text-white tracking-tighter group-hover:scale-105 transition-transform origin-left mt-2 leading-none">
                  {totalClients}
                </p>
              </div>
              <div className="p-2 sm:p-3 rounded-xl bg-black/30 border border-white/5 text-white/60" style={{ color: config.primaryColor }}>
                <Users className="w-4 sm:w-5 h-4 sm:h-5" />
              </div>
            </div>
            <p className="text-[10px] text-white/30 mt-3 font-semibold">{activeClientsCount} con schede attive</p>
          </div>

          {/* Stat 2: Schede Attive */}
          <div 
            id="stat-card-plans-active" 
            onClick={() => onNavigate('Schede salvate')}
            className="bg-[#121212] border border-white/5 hover:border-white/10 rounded-2xl p-4 sm:p-6 flex flex-col justify-between transition-all cursor-pointer group"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[9px] font-black text-white/40 uppercase tracking-widest leading-none">Schede Attive</p>
                <p className="text-3xl sm:text-4xl font-black text-white tracking-tighter group-hover:scale-105 transition-transform origin-left mt-2 leading-none">
                  {activePlansCount}
                </p>
              </div>
              <div className="p-2 sm:p-3 rounded-xl bg-black/30 border border-white/5 text-white/60" style={{ color: config.primaryColor }}>
                <ClipboardList className="w-4 sm:w-5 h-4 sm:h-5" />
              </div>
            </div>
            <p className="text-[10px] text-white/30 mt-3 font-semibold">{draftPlansCount} in bozza / compilazione</p>
          </div>

          {/* Stat 3: Schede Completate */}
          <div 
            id="stat-card-plans-completed" 
            onClick={() => onNavigate('Schede salvate')}
            className="bg-[#121212] border border-white/5 hover:border-white/10 rounded-2xl p-4 sm:p-6 flex flex-col justify-between transition-all cursor-pointer group"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[9px] font-black text-white/40 uppercase tracking-widest leading-none">Completate</p>
                <p className="text-3xl sm:text-4xl font-black text-white tracking-tighter group-hover:scale-105 transition-transform origin-left mt-2 leading-none">
                  {completedPlansCount}
                </p>
              </div>
              <div className="p-2 sm:p-3 rounded-xl bg-black/30 border border-white/5 text-white/60" style={{ color: config.primaryColor }}>
                <CheckCircle2 className="w-4 sm:w-5 h-4 sm:h-5" />
              </div>
            </div>
            <p className="text-[10px] text-white/30 mt-3 font-semibold">Storico programmi atleti</p>
          </div>

          {/* Stat 4: Esercizi Disponibili */}
          <div 
            id="stat-card-exercises" 
            onClick={() => onNavigate('Database esercizi')}
            className="bg-[#121212] border border-white/5 hover:border-white/10 rounded-2xl p-4 sm:p-6 flex flex-col justify-between transition-all cursor-pointer group"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[9px] font-black text-white/40 uppercase tracking-widest leading-none">Esercizi Database</p>
                <p className="text-3xl sm:text-4xl font-black text-white tracking-tighter group-hover:scale-105 transition-transform origin-left mt-2 leading-none">
                  {totalExercises}
                </p>
              </div>
              <div className="p-2 sm:p-3 rounded-xl bg-black/30 border border-white/5 text-white/60" style={{ color: config.primaryColor }}>
                <Dumbbell className="w-4 sm:w-5 h-4 sm:h-5" />
              </div>
            </div>
            <p className="text-[10px] text-white/30 mt-3 font-semibold">Tecniche d'intensità incluse</p>
          </div>
        </div>
      </div>

      {/* Quick Action Grid */}
      <div id="dashboard-quick-actions" className="space-y-4">
        <h2 className="text-xs font-black text-white/40 uppercase tracking-widest">Azioni Rapide</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {/* OPTIONAL Action: Resume draft (only visible if draft is available) */}
          {hasAutosave && (
            <div 
              id="action-resume-draft"
              onClick={onResumeLastDraft}
              className="relative bg-[#1a1c12] border-2 border-dashed p-5 rounded-2xl transition-all cursor-pointer group hover:shadow-xl overflow-hidden flex flex-col justify-between"
              style={{ borderColor: config.primaryColor }}
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-xl bg-black/50 text-white shrink-0">
                  <RotateCcw className="w-4 h-4 animate-pulse" style={{ color: config.primaryColor }} />
                </div>
                <h3 className="font-extrabold text-white text-xs uppercase tracking-wider">Riprendi Ultima Bozza</h3>
              </div>
              <p className="text-[11px] text-white/70 leading-relaxed font-semibold">
                Trovata una scheda d'allenamento in compilazione non salvata. Clicca qui per riprendere subito!
              </p>
              <span className="text-[9px] font-bold uppercase tracking-widest mt-3 underline" style={{ color: config.primaryColor }}>Ripristina Ora &rarr;</span>
            </div>
          )}

          {/* Action 1: Add Client */}
          <div 
            id="action-add-client"
            onClick={() => onQuickAction('add-client')}
            className="relative bg-[#121212] border border-white/5 hover:border-white/10 p-5 rounded-2xl transition-all cursor-pointer group hover:shadow-xl overflow-hidden flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2.5 rounded-xl bg-black/30 text-neutral-300 border border-white/5 group-hover:text-white" style={{ borderColor: config.primaryColor }}>
                  <UserPlus className="w-4 h-4" style={{ color: config.primaryColor }} />
                </div>
                <h3 className="font-black text-white text-xs uppercase tracking-wider">Nuovo Cliente</h3>
              </div>
              <p className="text-[11px] text-white/50 leading-relaxed font-semibold">
                Registra un nuovo atleta inserendo dati antropometrici, livello, frequenza, limitazioni fisiche e note.
              </p>
            </div>
            <span className="text-[9px] font-bold uppercase tracking-widest text-white/30 mt-3 group-hover:text-white transition-colors">Aggiungi Atleta &rarr;</span>
          </div>

          {/* Action 2: Create Workout Plan */}
          <div 
            id="action-create-plan"
            onClick={() => onQuickAction('create-plan')}
            className="relative bg-[#121212] border border-white/5 hover:border-white/10 p-5 rounded-2xl transition-all cursor-pointer group hover:shadow-xl overflow-hidden flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2.5 rounded-xl bg-black/30 text-neutral-300 border border-white/5 group-hover:text-white" style={{ borderColor: config.primaryColor }}>
                  <FilePlus className="w-4 h-4" style={{ color: config.primaryColor }} />
                </div>
                <h3 className="font-black text-white text-xs uppercase tracking-wider">Nuova Scheda</h3>
              </div>
              <p className="text-[11px] text-white/50 leading-relaxed font-semibold">
                Costruisci una scheda passo dopo passo calcolando automaticamente i carichi previsti ed i volumi muscolari.
              </p>
            </div>
            <span className="text-[9px] font-bold uppercase tracking-widest text-white/30 mt-3 group-hover:text-white transition-colors">Inizia Wizard &rarr;</span>
          </div>

          {/* Action 3: Open Database */}
          <div 
            id="action-open-database"
            onClick={() => onQuickAction('open-database')}
            className="relative bg-[#121212] border border-white/5 hover:border-white/10 p-5 rounded-2xl transition-all cursor-pointer group hover:shadow-xl overflow-hidden flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2.5 rounded-xl bg-black/30 text-neutral-300 border border-white/5 group-hover:text-white" style={{ borderColor: config.primaryColor }}>
                  <Search className="w-4 h-4" style={{ color: config.primaryColor }} />
                </div>
                <h3 className="font-black text-white text-xs uppercase tracking-wider">Database Esercizi</h3>
              </div>
              <p className="text-[11px] text-white/50 leading-relaxed font-semibold">
                Visualizza, filtra e personalizza oltre 30 esercizi inclusi o creane di nuovi con distretti specifici.
              </p>
            </div>
            <span className="text-[9px] font-bold uppercase tracking-widest text-white/30 mt-3 group-hover:text-white transition-colors">Apri Archivio &rarr;</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick overview of latest clients */}
        <div id="latest-clients-panel" className="bg-[#121212] border border-white/5 rounded-2xl p-5 sm:p-6 text-left">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
              <Users className="w-4 h-4 text-white" style={{ color: config.primaryColor }} />
              Clienti Inseriti Di Recente
            </h2>
            <button 
              onClick={() => onNavigate('Clienti')}
              className="text-xs font-black uppercase tracking-wider hover:underline"
              style={{ color: config.primaryColor }}
            >
              Vedi tutti
            </button>
          </div>

          {clients.length === 0 ? (
            <p className="text-xs text-white/40 py-4">Nessun cliente registrato al momento.</p>
          ) : (
            <div className="space-y-3">
              {clients.slice(-3).reverse().map((client) => (
                <div key={client.id} className="bg-black/20 border border-white/5 p-4 rounded-xl space-y-2 text-xs">
                  <div className="flex justify-between items-center">
                    <p className="font-extrabold text-white text-sm">{client.nome} {client.cognome}</p>
                    <span className="text-[10px] text-white/45 font-mono">{client.eta} anni • {client.sesso}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[11px] text-white/70 pt-1 border-t border-white/5">
                    <div>
                      <span className="block text-[8px] uppercase tracking-wider text-white/30 font-bold">Obiettivo</span>
                      <p className="font-semibold text-white/90 truncate">{client.obiettivo}</p>
                    </div>
                    <div>
                      <span className="block text-[8px] uppercase tracking-wider text-white/30 font-bold">Livello & Freq</span>
                      <p className="font-black text-[10px]" style={{ color: config.primaryColor }}>{client.livelloEsperienza} • {client.allenamentiSettimanali}x</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recently Modified Workout Plans */}
        <div id="latest-plans-panel" className="bg-[#121212] border border-white/5 rounded-2xl p-5 sm:p-6 text-left">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
              <History className="w-4 h-4 text-white" style={{ color: config.primaryColor }} />
              Ultime Schede Modificate
            </h2>
            <button 
              onClick={() => onNavigate('Schede salvate')}
              className="text-xs font-black uppercase tracking-wider hover:underline"
              style={{ color: config.primaryColor }}
            >
              Vedi tutte
            </button>
          </div>

          {plans.length === 0 ? (
            <p className="text-xs text-white/40 py-4">Nessun programma creato al momento.</p>
          ) : (
            <div className="space-y-3">
              {recentModifiedPlans.map((plan) => {
                const client = clients.find(c => c.id === plan.clienteId);
                return (
                  <div key={plan.id} className="bg-black/20 border border-white/5 p-4 rounded-xl space-y-2 text-xs">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-extrabold text-white text-sm">{plan.nome}</p>
                        <p className="text-[10px] text-white/40 mt-0.5">Per {plan.clienteNomeCompleto || (client ? `${client.nome} ${client.cognome}` : 'Sconosciuto')}</p>
                      </div>
                      <span 
                        className="px-2 py-0.5 rounded-full text-[9px] uppercase font-black tracking-wider border"
                        style={{ 
                          backgroundColor: plan.status === 'Attiva' ? `${config.primaryColor}15` : 'transparent',
                          borderColor: plan.status === 'Attiva' ? config.primaryColor : plan.status === 'Bozza' ? '#eab308' : '#404040',
                          color: plan.status === 'Attiva' ? config.primaryColor : plan.status === 'Bozza' ? '#eab308' : '#a3a3a3'
                        }}
                      >
                        {plan.status}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 text-[11px] text-white/70 pt-1 border-t border-white/5">
                      <div>
                        <span className="block text-[8px] uppercase tracking-wider text-white/30 font-bold">Obiettivo</span>
                        <p className="font-semibold text-white/90 truncate">{plan.obiettivo}</p>
                      </div>
                      <div>
                        <span className="block text-[8px] uppercase tracking-wider text-white/30 font-bold">Struttura</span>
                        <p className="font-black text-[10px] text-white/80">{plan.allenamentiSettimanali} sedute • {plan.durataSettimane} sett.</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
