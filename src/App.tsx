/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { CoachConfig, Client, Exercise, WorkoutPlan, WorkoutTemplate, LogbookEntry } from './types';
import { INITIAL_EXERCISES } from './data/exercises';
import { DEMO_CLIENTS, DEMO_WORKOUT_PLANS, DEMO_TEMPLATES } from './data/demoData';

// Components
import BrandingSetup from './components/BrandingSetup';
import Dashboard from './components/Dashboard';
import ClientManagement from './components/ClientManagement';
import ExerciseDatabase from './components/ExerciseDatabase';
import WorkoutWizard from './components/WorkoutWizard';
import SavedWorkouts from './components/SavedWorkouts';
import BrandingCustomizer from './components/BrandingCustomizer';
import PrintSheet from './components/PrintSheet';
import TemplateManagement from './components/TemplateManagement';
import BackupManager from './components/BackupManager';
import TrainingAnalysis from './components/TrainingAnalysis';

// Icons
import { 
  LayoutDashboard, Users, FilePlus, FolderHeart, Dumbbell, Sliders, 
  Menu, X, Award, LogOut, Heart, Check, Info, AlertTriangle, ShieldAlert, Layers,
  ChevronRight, TrendingUp
} from 'lucide-react';

const STORAGE_KEYS = {
  CONFIG: 'pt_coach_config',
  CLIENTS: 'pt_clients',
  EXERCISES: 'pt_exercises',
  PLANS: 'pt_plans',
  TEMPLATES: 'pt_templates'
};

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
}

export interface ConfirmConfig {
  title: string;
  message: string;
  onConfirm: () => void;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
}

export default function App() {
  // --- STATE ---
  const [config, setConfig] = useState<CoachConfig | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [plans, setPlans] = useState<WorkoutPlan[]>([]);
  const [templates, setTemplates] = useState<WorkoutTemplate[]>([]);
  const [logbook, setLogbook] = useState<LogbookEntry[]>([]);
  
  const [currentSection, setCurrentSection] = useState<string>('Dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedClientForPlan, setSelectedClientForPlan] = useState<Client | null>(null);
  const [editingPlan, setEditingPlan] = useState<WorkoutPlan | null>(null);
  const [activePrintPlan, setActivePrintPlan] = useState<WorkoutPlan | null>(null);

  // Template-specific wizard states
  const [isTemplateMode, setIsTemplateMode] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<WorkoutTemplate | null>(null);
  const [preselectedTemplate, setPreselectedTemplate] = useState<WorkoutTemplate | null>(null);

  // Toast and Confirm dialog state
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [confirmConfig, setConfirmConfig] = useState<ConfirmConfig | null>(null);
  const [hasAutosave, setHasAutosave] = useState(false);

  // Active plan conflict resolution state
  const [planConflictData, setPlanConflictData] = useState<{
    newPlan: WorkoutPlan;
    activePlan: WorkoutPlan;
    onResolve: (action: 'archive' | 'complete' | 'keep') => void;
  } | null>(null);

  // --- LOCAL STORAGE SEED & LOAD ---
  useEffect(() => {
    // 1. Load Coach Configuration
    const savedConfig = localStorage.getItem(STORAGE_KEYS.CONFIG);
    if (savedConfig) {
      setConfig(JSON.parse(savedConfig));
    } else {
      setConfig({
        nomeProgramma: '',
        nomeCoach: '',
        primaryColor: '#CCFF00',
        isConfigured: false
      });
    }

    // 2. Load/Seed Clients
    const savedClients = localStorage.getItem(STORAGE_KEYS.CLIENTS);
    if (savedClients) {
      setClients(JSON.parse(savedClients));
    } else {
      // Seed initial demo clients
      setClients(DEMO_CLIENTS);
      localStorage.setItem(STORAGE_KEYS.CLIENTS, JSON.stringify(DEMO_CLIENTS));
    }

    // 3. Load/Seed Exercises
    const savedExercises = localStorage.getItem(STORAGE_KEYS.EXERCISES);
    if (savedExercises) {
      setExercises(JSON.parse(savedExercises));
    } else {
      // Seed initial 30+ exercises
      setExercises(INITIAL_EXERCISES);
      localStorage.setItem(STORAGE_KEYS.EXERCISES, JSON.stringify(INITIAL_EXERCISES));
    }

    // 4. Load/Seed Workout Plans
    const savedPlans = localStorage.getItem(STORAGE_KEYS.PLANS);
    if (savedPlans) {
      setPlans(JSON.parse(savedPlans));
    } else {
      // Seed initial demo plan for Mario Rossi
      setPlans(DEMO_WORKOUT_PLANS);
      localStorage.setItem(STORAGE_KEYS.PLANS, JSON.stringify(DEMO_WORKOUT_PLANS));
    }

    // 5. Load/Seed Workout Templates
    const savedTemplates = localStorage.getItem(STORAGE_KEYS.TEMPLATES);
    if (savedTemplates) {
      setTemplates(JSON.parse(savedTemplates));
    } else {
      setTemplates(DEMO_TEMPLATES);
      localStorage.setItem(STORAGE_KEYS.TEMPLATES, JSON.stringify(DEMO_TEMPLATES));
    }
  }, []);

  // Sync logbook entries whenever navigation changes
  useEffect(() => {
    const savedLogbook = localStorage.getItem('pt_logbook');
    if (savedLogbook) {
      setLogbook(JSON.parse(savedLogbook));
    } else {
      setLogbook([]);
    }
  }, [currentSection]);

  // --- TEMPLATE CRUD ACTIONS ---
  const handleAddTemplate = (newTpl: WorkoutTemplate) => {
    const updated = [...templates, newTpl];
    setTemplates(updated);
    localStorage.setItem(STORAGE_KEYS.TEMPLATES, JSON.stringify(updated));
  };

  const handleUpdateTemplate = (updatedTpl: WorkoutTemplate) => {
    const updated = templates.map(t => t.id === updatedTpl.id ? updatedTpl : t);
    setTemplates(updated);
    localStorage.setItem(STORAGE_KEYS.TEMPLATES, JSON.stringify(updated));
  };

  const handleDeleteTemplate = (id: string) => {
    const updated = templates.filter(t => t.id !== id);
    setTemplates(updated);
    localStorage.setItem(STORAGE_KEYS.TEMPLATES, JSON.stringify(updated));
  };

  const handleDuplicateTemplate = (tpl: WorkoutTemplate) => {
    const duplicated: WorkoutTemplate = {
      ...tpl,
      id: 'tpl_copy_' + Date.now(),
      nome: `${tpl.nome} (Copia)`
    };
    const updated = [...templates, duplicated];
    setTemplates(updated);
    localStorage.setItem(STORAGE_KEYS.TEMPLATES, JSON.stringify(updated));
    triggerToast(`Modello "${tpl.nome}" duplicato correttamente!`, 'success');
  };

  const handleAssignTemplate = (tpl: WorkoutTemplate, client: Client) => {
    setIsTemplateMode(false);
    setEditingTemplate(null);
    setPreselectedTemplate(tpl);
    setSelectedClientForPlan(client);
    setEditingPlan(null);
    setCurrentSection('Crea scheda');
  };

  const handleStartCreateTemplate = () => {
    setIsTemplateMode(true);
    setEditingTemplate(null);
    setPreselectedTemplate(null);
    setSelectedClientForPlan(null);
    setEditingPlan(null);
    setCurrentSection('Crea scheda');
  };

  const handleStartEditTemplate = (tpl: WorkoutTemplate) => {
    setIsTemplateMode(true);
    setEditingTemplate(tpl);
    setPreselectedTemplate(null);
    setSelectedClientForPlan(null);
    setEditingPlan(null);
    setCurrentSection('Crea scheda');
  };

  // Monitor autosave availability
  useEffect(() => {
    const autosave = localStorage.getItem('pt_wizard_autosave');
    setHasAutosave(!!autosave);
  }, [currentSection]);

  // Toast and confirm handlers
  const triggerToast = (message: string, type: Toast['type'] = 'success') => {
    const id = Date.now().toString() + Math.random().toString();
    setToasts(prev => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const triggerConfirm = (config: ConfirmConfig) => {
    setConfirmConfig(config);
  };

  // --- BRANDING ACTIONS ---
  const handleOnboardingComplete = (newConfig: CoachConfig) => {
    setConfig(newConfig);
    localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(newConfig));
    triggerToast('Onboarding completato con successo!', 'success');
  };

  const handleUpdateConfig = (newConfig: CoachConfig) => {
    setConfig(newConfig);
    localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(newConfig));
    triggerToast('Impostazioni aggiornate correttamente!', 'success');
  };

  const handleResetApp = () => {
    triggerConfirm({
      title: 'Resettare l\'applicazione?',
      message: 'Sei sicuro di voler resettare tutta l\'applicazione? Questo rimuoverà permanentemente tutti i dati (clienti, schede, modifiche) e ripristinerà lo stato iniziale.',
      confirmText: 'Reset Totale',
      isDestructive: true,
      onConfirm: () => {
        localStorage.clear();
        triggerToast('Dati eliminati con successo. Riavvio...', 'success');
        setTimeout(() => {
          window.location.reload();
        }, 1200);
      }
    });
  };

  // --- CLIENT ACTIONS ---
  const handleAddClient = (newClient: Client) => {
    const updated = [...clients, newClient];
    setClients(updated);
    localStorage.setItem(STORAGE_KEYS.CLIENTS, JSON.stringify(updated));
    triggerToast(`Cliente ${newClient.nome} ${newClient.cognome} aggiunto con successo!`, 'success');
  };

  const handleUpdateClient = (updatedClient: Client) => {
    const updated = clients.map(c => c.id === updatedClient.id ? updatedClient : c);
    setClients(updated);
    localStorage.setItem(STORAGE_KEYS.CLIENTS, JSON.stringify(updated));
    triggerToast(`Scheda cliente di ${updatedClient.nome} modificata correttamente!`, 'success');
  };

  const handleDeleteClient = (id: string) => {
    const target = clients.find(c => c.id === id);
    const updated = clients.filter(c => c.id !== id);
    setClients(updated);
    localStorage.setItem(STORAGE_KEYS.CLIENTS, JSON.stringify(updated));

    // Clean up plans associated with this client
    const updatedPlans = plans.filter(p => p.clienteId !== id);
    setPlans(updatedPlans);
    localStorage.setItem(STORAGE_KEYS.PLANS, JSON.stringify(updatedPlans));
    
    triggerToast(`Cliente ${target ? target.nome : ''} ed eventuali schede associati rimossi definitivamente!`, 'success');
  };

  // --- EXERCISE ACTIONS ---
  const handleAddExercise = (newEx: Exercise) => {
    const updated = [...exercises, newEx];
    setExercises(updated);
    localStorage.setItem(STORAGE_KEYS.EXERCISES, JSON.stringify(updated));
    triggerToast(`Esercizio "${newEx.nome}" aggiunto al database!`, 'success');
  };

  const handleUpdateExercise = (updatedEx: Exercise) => {
    const updated = exercises.map(ex => ex.id === updatedEx.id ? updatedEx : ex);
    setExercises(updated);
    localStorage.setItem(STORAGE_KEYS.EXERCISES, JSON.stringify(updated));
    triggerToast(`Esercizio "${updatedEx.nome}" modificato correttamente!`, 'success');
  };

  const handleDeleteExercise = (id: string) => {
    const target = exercises.find(e => e.id === id);
    const updated = exercises.filter(ex => ex.id !== id);
    setExercises(updated);
    localStorage.setItem(STORAGE_KEYS.EXERCISES, JSON.stringify(updated));
    triggerToast(`Esercizio "${target ? target.nome : ''}" rimosso correttamente dal database!`, 'success');
  };

  // --- LOGBOOK ACTIONS ---
  const handleAddLogs = (newLogs: LogbookEntry[]) => {
    const savedLogbook = localStorage.getItem('pt_logbook');
    let currentLogs: LogbookEntry[] = [];
    if (savedLogbook) {
      currentLogs = JSON.parse(savedLogbook);
    }
    const newLogIds = new Set(newLogs.map(l => l.id));
    const filteredExisting = currentLogs.filter(l => !newLogIds.has(l.id));
    const updated = [...filteredExisting, ...newLogs];
    setLogbook(updated);
    localStorage.setItem('pt_logbook', JSON.stringify(updated));
  };

  // --- PLAN CONFLICT RESOLVER ---
  const checkPlanActiveConflict = (newPlan: WorkoutPlan, onSuccess: (finalPlans: WorkoutPlan[]) => void) => {
    if (newPlan.status !== 'Attiva') {
      onSuccess(plans.map(p => p.id === newPlan.id ? newPlan : p).concat(plans.some(p => p.id === newPlan.id) ? [] : [newPlan]));
      return;
    }
    const existingActive = plans.find(p => p.clienteId === newPlan.clienteId && p.status === 'Attiva' && p.id !== newPlan.id);
    if (existingActive) {
      setPlanConflictData({
        newPlan,
        activePlan: existingActive,
        onResolve: (action) => {
          const updatedPlans = plans.map(p => {
            if (p.id === existingActive.id) {
              if (action === 'archive') {
                return { ...p, status: 'Archiviata' as const };
              } else if (action === 'complete') {
                return { ...p, status: 'Completata' as const };
              }
            }
            return p;
          });
          
          let final: WorkoutPlan[];
          const exists = updatedPlans.some(p => p.id === newPlan.id);
          if (exists) {
            final = updatedPlans.map(p => p.id === newPlan.id ? newPlan : p);
          } else {
            final = [...updatedPlans, newPlan];
          }
          onSuccess(final);
          setPlanConflictData(null);
        }
      });
    } else {
      onSuccess(plans.map(p => p.id === newPlan.id ? newPlan : p).concat(plans.some(p => p.id === newPlan.id) ? [] : [newPlan]));
    }
  };

  // --- PLAN ACTIONS ---
  const handleSavePlan = (newPlan: WorkoutPlan) => {
    checkPlanActiveConflict(newPlan, (finalPlans) => {
      setPlans(finalPlans);
      localStorage.setItem(STORAGE_KEYS.PLANS, JSON.stringify(finalPlans));
      
      const exists = plans.some(p => p.id === newPlan.id);
      if (exists) {
        triggerToast(`Scheda "${newPlan.nome}" salvata con successo!`, 'success');
      } else {
        triggerToast(`Nuovo programma "${newPlan.nome}" creato con successo!`, 'success');
      }
      
      // Clear wizard transient variables and shift
      setSelectedClientForPlan(null);
      setEditingPlan(null);
      localStorage.removeItem('pt_wizard_autosave');
      setCurrentSection('Schede salvate');
    });
  };

  const handleEditPlan = (plan: WorkoutPlan) => {
    setEditingPlan(plan);
    setSelectedClientForPlan(null);
    setCurrentSection('Crea scheda');
  };

  const handleDuplicatePlan = (plan: WorkoutPlan) => {
    const duplicatedPlan: WorkoutPlan = {
      ...plan,
      id: 'plan_copy_' + Date.now(),
      nome: `${plan.nome} (Copia)`,
      dataCreazione: new Date().toISOString().split('T')[0]
    };
    const updated = [...plans, duplicatedPlan];
    setPlans(updated);
    localStorage.setItem(STORAGE_KEYS.PLANS, JSON.stringify(updated));
    triggerToast(`Scheda duplicata come "${duplicatedPlan.nome}"!`, 'success');
  };

  const handleDeletePlan = (id: string) => {
    const target = plans.find(p => p.id === id);
    const updated = plans.filter(p => p.id !== id);
    setPlans(updated);
    localStorage.setItem(STORAGE_KEYS.PLANS, JSON.stringify(updated));
    triggerToast(`Scheda "${target ? target.nome : ''}" eliminata definitivamente!`, 'success');
  };

  const handleUpdatePlanStatus = (planId: string, nextStatus: any) => {
    const targetPlan = plans.find(p => p.id === planId);
    if (!targetPlan) return;

    const updatedPlanObj = { ...targetPlan, status: nextStatus };
    checkPlanActiveConflict(updatedPlanObj, (finalPlans) => {
      setPlans(finalPlans);
      localStorage.setItem(STORAGE_KEYS.PLANS, JSON.stringify(finalPlans));
      triggerToast(`Stato della scheda aggiornato a "${nextStatus}"!`, 'success');
    });
  };

  const handlePrintPlan = (plan: WorkoutPlan) => {
    setActivePrintPlan(plan);
  };

  // --- NAVIGATION ACTIONS ---
  const handleQuickAction = (action: 'add-client' | 'create-plan' | 'open-database') => {
    if (action === 'add-client') {
      setCurrentSection('Clienti');
      setSelectedClientForPlan(null);
      setEditingPlan(null);
      // Wait for ClientManagement to mount and click open
      setTimeout(() => {
        const btn = document.getElementById('add-client-btn-trigger');
        if (btn) btn.click();
      }, 100);
    } else if (action === 'create-plan') {
      setSelectedClientForPlan(null);
      setEditingPlan(null);
      setCurrentSection('Crea scheda');
    } else if (action === 'open-database') {
      setCurrentSection('Database esercizi');
    }
  };

  const handleSelectClientForPlan = (client: Client) => {
    setSelectedClientForPlan(client);
    setEditingPlan(null);
    setCurrentSection('Crea scheda');
  };

  const handleResumeLastDraft = () => {
    sessionStorage.setItem('pt_resume_autosave_trigger', 'true');
    setSelectedClientForPlan(null);
    setEditingPlan(null);
    setCurrentSection('Crea scheda');
  };

  // Loader Guard
  if (!config) {
    return (
      <div className="min-h-screen bg-neutral-950 text-neutral-100 flex items-center justify-center font-semibold text-sm">
        Caricamento impostazioni in corso...
      </div>
    );
  }

  // If user hasn't configured the PT application name and details, show the Setup Screen
  if (!config.isConfigured) {
    return <BrandingSetup onComplete={handleOnboardingComplete} />;
  }

  // Primary navigation configuration
  const navItems = [
    { name: 'Dashboard', icon: LayoutDashboard },
    { name: 'Clienti', icon: Users },
    { name: 'Crea scheda', icon: FilePlus },
    { name: 'Template', icon: Layers },
    { name: 'Schede salvate', icon: FolderHeart },
    { name: 'Analisi allenamento', icon: TrendingUp },
    { name: 'Database esercizi', icon: Dumbbell },
    { name: 'Personalizzazione', icon: Sliders },
  ];

  const renderActiveSection = () => {
    switch (currentSection) {
      case 'Dashboard':
        return (
          <Dashboard 
            config={config} 
            clients={clients} 
            plans={plans} 
            exercises={exercises} 
            onNavigate={setCurrentSection}
            onQuickAction={handleQuickAction}
            hasAutosave={hasAutosave}
            onResumeLastDraft={handleResumeLastDraft}
            onShowToast={triggerToast}
          />
        );
      case 'Clienti':
        return (
          <ClientManagement 
            config={config}
            clients={clients}
            plans={plans}
            onAddClient={handleAddClient}
            onUpdateClient={handleUpdateClient}
            onDeleteClient={handleDeleteClient}
            onSelectClientForPlan={handleSelectClientForPlan}
            onShowToast={triggerToast}
            onShowConfirm={triggerConfirm}
          />
        );
      case 'Crea scheda':
        return (
          <WorkoutWizard 
            config={config}
            clients={clients}
            exercises={exercises}
            onSavePlan={handleSavePlan}
            onAddClient={handleAddClient}
            preselectedClient={selectedClientForPlan}
            editingPlan={editingPlan}
            isTemplateMode={isTemplateMode}
            editingTemplate={editingTemplate}
            preselectedTemplate={preselectedTemplate}
            onSaveTemplate={(tpl) => {
              if (editingTemplate) {
                handleUpdateTemplate(tpl);
                triggerToast(`Modello "${tpl.nome}" aggiornato correttamente!`, 'success');
              } else {
                handleAddTemplate(tpl);
                triggerToast(`Modello "${tpl.nome}" creato correttamente!`, 'success');
              }
              setIsTemplateMode(false);
              setEditingTemplate(null);
              setPreselectedTemplate(null);
              setCurrentSection('Template');
            }}
            onCancelTemplate={() => {
              setIsTemplateMode(false);
              setEditingTemplate(null);
              setPreselectedTemplate(null);
              setCurrentSection('Template');
            }}
            onShowToast={triggerToast}
            onShowConfirm={triggerConfirm}
          />
        );
      case 'Template':
        return (
          <TemplateManagement
            config={config}
            templates={templates}
            clients={clients}
            onAddTemplate={handleAddTemplate}
            onUpdateTemplate={handleUpdateTemplate}
            onDeleteTemplate={handleDeleteTemplate}
            onDuplicateTemplate={handleDuplicateTemplate}
            onAssignTemplate={handleAssignTemplate}
            onStartCreateTemplate={handleStartCreateTemplate}
            onStartEditTemplate={handleStartEditTemplate}
            onShowToast={triggerToast}
            onShowConfirm={triggerConfirm}
          />
        );
      case 'Schede salvate':
        return (
          <SavedWorkouts 
            config={config}
            plans={plans}
            onEditPlan={handleEditPlan}
            onDuplicatePlan={handleDuplicatePlan}
            onDeletePlan={handleDeletePlan}
            onPrintPlan={handlePrintPlan}
            onUpdatePlanStatus={handleUpdatePlanStatus}
            onShowToast={triggerToast}
            onShowConfirm={triggerConfirm}
          />
        );
      case 'Database esercizi':
        return (
          <ExerciseDatabase 
            config={config}
            exercises={exercises}
            onAddExercise={handleAddExercise}
            onUpdateExercise={handleUpdateExercise}
            onDeleteExercise={handleDeleteExercise}
            onShowToast={triggerToast}
            onShowConfirm={triggerConfirm}
          />
        );
      case 'Analisi allenamento':
        return (
          <TrainingAnalysis
            config={config}
            clients={clients}
            plans={plans}
            logbook={logbook}
            onAddClient={handleAddClient}
            onAddPlan={handleSavePlan}
            onAddLogs={handleAddLogs}
            onUpdateConfig={handleUpdateConfig}
            onShowToast={triggerToast}
          />
        );
      case 'Personalizzazione':
        return (
          <div className="space-y-6 max-w-4xl text-left">
            <BrandingCustomizer 
              config={config} 
              onUpdateConfig={handleUpdateConfig} 
              onShowToast={triggerToast}
            />
            
            <div className="border border-white/5 bg-[#121212]/30 p-6 rounded-2xl">
              <BackupManager
                config={config}
                clients={clients}
                plans={plans}
                templates={templates}
                onUpdateConfig={setConfig}
                onUpdateClients={setClients}
                onUpdatePlans={setPlans}
                onUpdateTemplates={setTemplates}
                onShowToast={triggerToast}
                onShowConfirm={triggerConfirm}
              />
            </div>
          </div>
        );
      default:
        return <div>Sezione non trovata</div>;
    }
  };

  return (
    <div id="app-root-container" className="min-h-screen bg-[#080808] text-neutral-150 flex flex-col md:flex-row font-sans pb-16 md:pb-0">
      
      {/* If print plan is active, we display the Print Sheet directly. (Hides rest of page) */}
      {activePrintPlan && (
        <PrintSheet 
          config={config} 
          plan={activePrintPlan} 
          onClose={() => setActivePrintPlan(null)} 
        />
      )}

      {/* --- DESKTOP SIDEBAR --- */}
      <aside 
        id="desktop-sidebar" 
        className="hidden md:flex flex-col w-64 shrink-0 bg-[#121212] border-r border-white/10 p-5 sticky top-0 h-screen justify-between z-30"
      >
        <div className="space-y-6">
          {/* Logo / Title Branding */}
          <div className="flex items-center gap-3 pb-4 border-b border-white/10">
            {config.logoUrl ? (
              <div className="w-10 h-10 rounded-xl bg-neutral-950 border border-white/10 p-1 flex items-center justify-center shrink-0 overflow-hidden">
                <img src={config.logoUrl} alt="Logo" className="max-w-full max-h-full object-contain" />
              </div>
            ) : (
              <div 
                className="w-10 h-10 rounded-lg flex items-center justify-center font-black text-sm text-neutral-950 shrink-0"
                style={{ backgroundColor: config.primaryColor }}
              >
                {config.nomeProgramma.substring(0, 2).toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              <h2 className="font-black text-white text-sm tracking-tighter uppercase leading-none">{config.nomeProgramma}</h2>
              <p className="text-[10px] text-white/40 uppercase tracking-widest mt-1">Coach {config.nomeCoach}</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentSection === item.name;
              return (
                <button
                  key={item.name}
                  id={`nav-link-${item.name.toLowerCase().replace(/\s+/g, '-')}`}
                  onClick={() => setCurrentSection(item.name)}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-black uppercase tracking-wider text-white/50 hover:text-white transition-all text-left cursor-pointer"
                  style={{ 
                    color: isActive ? config.primaryColor : undefined,
                    backgroundColor: isActive ? `${config.primaryColor}15` : undefined,
                    borderLeft: isActive ? `4px solid ${config.primaryColor}` : '4px solid transparent'
                  }}
                >
                  <Icon className="w-4 h-4 shrink-0" style={{ color: isActive ? config.primaryColor : undefined }} />
                  <span>{item.name}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Coach small branding info / footer */}
        <div className="pt-4 border-t border-white/5 text-center space-y-1">
          <p className="text-[10px] text-white/20 uppercase tracking-widest flex items-center justify-center gap-1">
            <Heart className="w-3 h-3 text-[#CCFF00] fill-[#CCFF00]" style={{ color: config.primaryColor, fill: config.primaryColor }} /> Powered by CoachBoard
          </p>
        </div>
      </aside>

      {/* --- MOBILE NAVBAR --- */}
      <header 
        id="mobile-header" 
        className="md:hidden bg-[#121212] border-b border-white/10 p-4 flex items-center justify-between sticky top-0 z-40 shrink-0"
      >
        <div className="flex items-center gap-2.5">
          {config.logoUrl ? (
            <img src={config.logoUrl} alt="Logo" className="w-8 h-8 object-contain rounded-lg" />
          ) : (
            <div 
              className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs text-neutral-950"
              style={{ backgroundColor: config.primaryColor }}
            >
              {config.nomeProgramma.substring(0, 2).toUpperCase()}
            </div>
          )}
          <span className="font-black text-white text-sm tracking-tighter uppercase leading-none">{config.nomeProgramma}</span>
        </div>

        <button 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-1.5 rounded-lg bg-neutral-950 border border-neutral-800 text-neutral-400 hover:text-neutral-200 cursor-pointer"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </header>

      {/* Mobile Drawer menu (richiudibile, slides in on side or overlay) */}
      {mobileMenuOpen && (
        <div 
          id="mobile-drawer-overlay" 
          className="md:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-start animate-fade-in"
          onClick={() => setMobileMenuOpen(false)}
        >
          <div 
            className="w-4/5 max-w-sm bg-[#121212] border-r border-white/10 h-full p-6 flex flex-col justify-between animate-slide-in-left"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="space-y-6">
              <div className="flex justify-between items-center pb-4 border-b border-white/5">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs text-neutral-950"
                    style={{ backgroundColor: config.primaryColor }}
                  >
                    {config.nomeProgramma.substring(0, 2).toUpperCase()}
                  </div>
                  <span className="font-black text-white text-xs uppercase tracking-wider">{config.nomeProgramma}</span>
                </div>
                <button 
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1 text-white/40 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <nav className="space-y-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentSection === item.name;
                  return (
                    <button
                      key={item.name}
                      onClick={() => {
                        setCurrentSection(item.name);
                        setMobileMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider text-neutral-400 hover:text-neutral-100 transition-all text-left"
                      style={{ 
                        color: isActive ? '#ffffff' : undefined,
                        backgroundColor: isActive ? `${config.primaryColor}11` : undefined,
                        borderLeft: isActive ? `3px solid ${config.primaryColor}` : '3px solid transparent'
                      }}
                    >
                      <Icon className="w-4.5 h-4.5 shrink-0" style={{ color: isActive ? config.primaryColor : undefined }} />
                      <span>{item.name}</span>
                    </button>
                  );
                })}
              </nav>
            </div>

            <div className="pb-4 border-t border-white/5 pt-4 text-center">
              <p className="text-[10px] text-neutral-500 font-semibold">{config.teamName || 'CoachBoard'}</p>
              <p className="text-[9px] text-neutral-600 mt-0.5">Gestione Atleti ed Allenamenti</p>
            </div>
          </div>
        </div>
      )}

      {/* --- MOBILE BOTTOM NAVIGATION BAR --- */}
      <div 
        id="mobile-bottom-nav"
        className="sm:hidden fixed bottom-0 left-0 right-0 h-16 bg-[#121212] border-t border-white/10 flex justify-around items-center z-40 pb-1 shadow-[0_-4px_24px_rgba(0,0,0,0.5)]"
      >
        {[
          { name: 'Dashboard', section: 'Dashboard', icon: LayoutDashboard },
          { name: 'Clienti', section: 'Clienti', icon: Users },
          { name: 'Crea scheda', section: 'Crea scheda', icon: FilePlus },
          { name: 'Schede', section: 'Schede salvate', icon: FolderHeart }
        ].map((btn) => {
          const Icon = btn.icon;
          const isActive = currentSection === btn.section;
          return (
            <button
              key={btn.section}
              onClick={() => setCurrentSection(btn.section)}
              className="flex flex-col items-center justify-center w-16 h-full text-[10px] font-black uppercase tracking-widest transition-colors cursor-pointer"
              style={{ color: isActive ? config.primaryColor : 'rgba(255, 255, 255, 0.4)' }}
            >
              <Icon className="w-5 h-5 mb-0.5" />
              <span>{btn.name}</span>
            </button>
          );
        })}
      </div>

      {/* --- MAIN MAIN AREA --- */}
      <main id="app-main-content" className="flex-1 p-4 sm:p-6 md:p-8 overflow-y-auto max-w-full pb-20 sm:pb-8">
        {renderActiveSection()}
      </main>

      {/* --- GLOBAL TOASTS CONTAINER --- */}
      <div className="fixed bottom-20 sm:bottom-6 right-4 sm:right-6 z-50 space-y-2 pointer-events-none max-w-xs sm:max-w-sm w-full">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={`p-4 rounded-xl border shadow-2xl pointer-events-auto flex items-start gap-3 animate-slide-in bg-black/90 backdrop-blur-md ${
              toast.type === 'success' 
                ? 'border-emerald-500/30 text-emerald-400' 
                : toast.type === 'error'
                ? 'border-rose-500/30 text-rose-400'
                : toast.type === 'warning'
                ? 'border-amber-500/30 text-amber-400'
                : 'border-sky-500/30 text-sky-400'
            }`}
          >
            {toast.type === 'success' && <Check className="w-4 h-4 shrink-0 mt-0.5" />}
            {toast.type === 'error' && <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />}
            {toast.type === 'warning' && <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />}
            {toast.type === 'info' && <Info className="w-4 h-4 shrink-0 mt-0.5" />}
            <div className="flex-1 text-xs leading-relaxed font-bold">
              {toast.message}
            </div>
            <button 
              onClick={() => removeToast(toast.id)}
              className="text-white/40 hover:text-white shrink-0 p-0.5 hover:bg-white/5 rounded-md"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>

      {/* --- GLOBAL CUSTOM CONFIRMATION DIALOG --- */}
      {confirmConfig && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-[#121212] border border-white/10 rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-2xl text-left">
            <h3 className="font-black text-white uppercase tracking-wider text-sm flex items-center gap-2">
              {confirmConfig.isDestructive ? (
                <AlertTriangle className="w-4.5 h-4.5 text-rose-500" />
              ) : (
                <Info className="w-4.5 h-4.5 text-white" style={{ color: config.primaryColor }} />
              )}
              {confirmConfig.title}
            </h3>
            <p className="text-xs text-white/60 leading-relaxed font-medium">{confirmConfig.message}</p>
            <div className="flex justify-end gap-3 pt-2 text-xs">
              <button
                onClick={() => setConfirmConfig(null)}
                className="px-4 py-2 bg-neutral-900 border border-white/5 hover:bg-neutral-800 text-white/60 hover:text-white rounded-xl font-bold uppercase tracking-wider transition-colors cursor-pointer"
              >
                {confirmConfig.cancelText || 'Annulla'}
              </button>
              <button
                onClick={() => {
                  confirmConfig.onConfirm();
                  setConfirmConfig(null);
                }}
                className={`px-4 py-2 rounded-xl font-black uppercase tracking-wider transition-colors cursor-pointer ${
                  confirmConfig.isDestructive 
                    ? 'bg-rose-600 hover:bg-rose-700 text-white' 
                    : 'text-neutral-950 hover:bg-white/90'
                }`}
                style={{ backgroundColor: confirmConfig.isDestructive ? undefined : config.primaryColor }}
              >
                {confirmConfig.confirmText || 'Conferma'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- WORKOUT PLAN STATUS CONFLICT RESOLVER MODAL --- */}
      {planConflictData && (
        <div id="plan-conflict-resolver-modal" className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in text-left">
          <div className="bg-[#121212] border border-white/10 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-amber-500/10 text-amber-400 rounded-xl">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-black text-white uppercase tracking-wider text-sm">
                  Conflitto Scheda Attiva
                </h3>
                <p className="text-[11px] text-white/40 mt-1">
                  L'atleta <strong style={{ color: config.primaryColor }}>{planConflictData.newPlan.clienteNomeCompleto}</strong> ha già una scheda con stato <span className="text-emerald-400 font-bold uppercase">Attiva</span>:
                </p>
              </div>
            </div>

            <div className="p-3.5 bg-black/40 border border-white/5 rounded-xl space-y-1">
              <p className="font-extrabold text-white text-xs leading-none">{planConflictData.activePlan.nome}</p>
              <p className="text-[10px] text-white/40 font-semibold">Creata il: {planConflictData.activePlan.dataCreazione ? new Date(planConflictData.activePlan.dataCreazione).toLocaleDateString('it-IT') : ''}</p>
            </div>

            <p className="text-xs text-white/60 leading-relaxed font-medium">
              Scegli come gestire la scheda precedente per evitare di avere molteplici programmi attivi contemporaneamente:
            </p>

            <div className="flex flex-col gap-2 pt-2">
              <button
                onClick={() => planConflictData.onResolve('archive')}
                className="w-full text-left p-3 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-white/5 hover:border-white/10 text-xs font-bold transition-all text-white flex justify-between items-center group cursor-pointer"
              >
                <div>
                  <p className="group-hover:text-[#CCFF00] transition-colors text-xs font-bold">Archivia la scheda precedente</p>
                  <p className="text-[10px] text-white/40 font-normal mt-0.5">La imposta su "Archiviata"</p>
                </div>
                <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-white" />
              </button>

              <button
                onClick={() => planConflictData.onResolve('complete')}
                className="w-full text-left p-3 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-white/5 hover:border-white/10 text-xs font-bold transition-all text-white flex justify-between items-center group cursor-pointer"
              >
                <div>
                  <p className="group-hover:text-[#CCFF00] transition-colors text-xs font-bold">Imposta come completata</p>
                  <p className="text-[10px] text-white/40 font-normal mt-0.5">La imposta su "Completata"</p>
                </div>
                <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-white" />
              </button>

              <button
                onClick={() => planConflictData.onResolve('keep')}
                className="w-full text-left p-3 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-white/5 hover:border-white/10 text-xs font-bold transition-all text-white/80 hover:text-white flex justify-between items-center group cursor-pointer"
              >
                <div>
                  <p className="text-xs font-bold">Lascia entrambe attive</p>
                  <p className="text-[10px] text-white/30 font-normal mt-0.5">Consigliato solo per transizioni o programmi multipli</p>
                </div>
                <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-white" />
              </button>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setPlanConflictData(null)}
                className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 border border-white/5 text-white/50 hover:text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
              >
                Annulla
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
