/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { CoachConfig } from '../types';
import { Save, Upload, Check, Dumbbell, Sparkles, Download } from 'lucide-react';

interface BrandingCustomizerProps {
  config: CoachConfig;
  onUpdateConfig: (newConfig: CoachConfig) => void;
  onShowToast?: (message: string, type: 'success' | 'error' | 'info' | 'warning') => void;
}

const PRESET_COLORS = [
  { name: 'Volt / Bold', value: '#CCFF00', label: 'Volt High-Contrast' },
  { name: 'Smeraldo', value: '#10b981', label: 'Verde Smeraldo' },
  { name: 'Arancio', value: '#f97316', label: 'Arancione Carico' },
  { name: 'Rosso Corsa', value: '#ef4444', label: 'Rosso Intenso' },
  { name: 'Elettrico', value: '#3b82f6', label: 'Blu Elettrico' },
  { name: 'Viola Deep', value: '#8b5cf6', label: 'Viola Profondo' },
];

export default function BrandingCustomizer({ config, onUpdateConfig, onShowToast }: BrandingCustomizerProps) {
  const [nomeProgramma, setNomeProgramma] = useState(config.nomeProgramma);
  const [nomeCoach, setNomeCoach] = useState(config.nomeCoach);
  const [teamName, setTeamName] = useState(config.teamName || '');
  const [slogan, setSlogan] = useState(config.slogan || '');
  const [primaryColor, setPrimaryColor] = useState(config.primaryColor);
  const [logoUrl, setLogoUrl] = useState(config.logoUrl || '');
  const [dragActive, setDragActive] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Keep state sync if config changes from outside (e.g. reset/load)
  useEffect(() => {
    setNomeProgramma(config.nomeProgramma);
    setNomeCoach(config.nomeCoach);
    setTeamName(config.teamName || '');
    setSlogan(config.slogan || '');
    setPrimaryColor(config.primaryColor);
    setLogoUrl(config.logoUrl || '');
  }, [config]);

  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Per favore carica un file immagine.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        setLogoUrl(e.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nomeProgramma.trim() || !nomeCoach.trim()) {
      alert('Il nome del programma ed il nome del coach sono obbligatori.');
      return;
    }

    const updated: CoachConfig = {
      nomeProgramma: nomeProgramma.trim(),
      nomeCoach: nomeCoach.trim(),
      teamName: teamName.trim() || undefined,
      slogan: slogan.trim() || undefined,
      primaryColor,
      logoUrl: logoUrl || undefined,
      isConfigured: true
    };

    onUpdateConfig(updated);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div id="branding-customizer-view" className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-black uppercase tracking-tighter italic text-white">Personalizzazione Identità</h1>
        <p className="text-xs text-white/40 font-medium">Modifica la veste grafica, i testi identificativi, i colori ed i loghi della tua attività.</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-[#121212] border border-white/5 rounded-2xl p-6 sm:p-8 space-y-6 relative overflow-hidden">
        {/* Ambient background glow */}
        <div 
          className="absolute -top-40 -right-40 w-80 h-80 rounded-full opacity-10 blur-3xl transition-all"
          style={{ backgroundColor: primaryColor }}
        />

        {savedSuccess && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold p-4 rounded-xl flex items-center gap-2 animate-fade-in">
            <Check className="w-4 h-4 shrink-0" />
            Configurazione salvata ed applicata istantaneamente!
          </div>
        )}

        {/* Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 relative z-10">
          <div className="space-y-1">
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400">
              Nome del Programma <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={nomeProgramma}
              onChange={(e) => setNomeProgramma(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl bg-neutral-950 border border-neutral-800 text-neutral-100 focus:outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400">
              Nome e Cognome Coach <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={nomeCoach}
              onChange={(e) => setNomeCoach(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl bg-neutral-950 border border-neutral-800 text-neutral-100 focus:outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400">
              Nome Team / Attività <span className="text-neutral-500">(Facoltativo)</span>
            </label>
            <input
              type="text"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl bg-neutral-950 border border-neutral-800 text-neutral-100 placeholder-neutral-700 focus:outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400">
              Slogan <span className="text-neutral-500">(Facoltativo)</span>
            </label>
            <input
              type="text"
              value={slogan}
              onChange={(e) => setSlogan(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl bg-neutral-950 border border-neutral-800 text-neutral-100 placeholder-neutral-700 focus:outline-none"
            />
          </div>
        </div>

        {/* Color presets selection */}
        <div className="space-y-3 relative z-10">
          <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400">
            Colore Principale Layout
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            {PRESET_COLORS.map((color) => (
              <button
                key={color.value}
                type="button"
                onClick={() => setPrimaryColor(color.value)}
                className="flex items-center gap-2 p-2 rounded-xl bg-neutral-950 border transition-all text-left text-xs"
                style={{
                  borderColor: primaryColor === color.value ? color.value : '#262626',
                  boxShadow: primaryColor === color.value ? `0 0 10px ${color.value}22` : 'none'
                }}
              >
                <span className="w-3.5 h-3.5 rounded-full block shrink-0" style={{ backgroundColor: color.value }} />
                <span className="truncate text-neutral-300 font-medium">{color.name}</span>
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3 bg-neutral-950 p-3 rounded-xl border border-neutral-850 w-fit">
            <span className="text-xs text-neutral-400">Selettore colore:</span>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="w-8 h-8 rounded border-0 cursor-pointer bg-transparent"
              />
              <input
                type="text"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                placeholder="#10b981"
                className="w-20 px-2 py-1 text-xs text-center bg-neutral-900 border border-neutral-800 rounded text-neutral-100 uppercase font-mono"
              />
            </div>
          </div>
        </div>

        {/* Logo upload */}
        <div className="space-y-3 relative z-10">
          <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400">
            Logo Logo d'Attività / Coach
          </label>

          <div className="flex gap-4 items-center">
            {logoUrl ? (
              <div className="relative w-20 h-20 bg-neutral-950 border border-neutral-800 rounded-xl p-2 flex items-center justify-center shrink-0">
                <img src={logoUrl} alt="Branding Logo" className="max-w-full max-h-full object-contain rounded" />
                <button
                  type="button"
                  onClick={() => setLogoUrl('')}
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-600 text-white flex items-center justify-center text-[10px] font-bold hover:bg-red-500 transition-colors"
                >
                  ×
                </button>
              </div>
            ) : (
              <div className="w-20 h-20 bg-neutral-950 border-2 border-dashed border-neutral-800 rounded-xl flex items-center justify-center text-neutral-600 shrink-0">
                <Dumbbell className="w-8 h-8 text-neutral-700" />
              </div>
            )}

            <div
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              className={`flex-1 min-h-[80px] rounded-xl border-2 border-dashed flex flex-col items-center justify-center p-3 text-center transition-all cursor-pointer ${
                dragActive ? 'bg-neutral-850' : 'bg-neutral-950 hover:bg-neutral-850'
              }`}
              style={{ borderColor: dragActive ? primaryColor : '#262626' }}
              onClick={() => document.getElementById('logo-customizer-file')?.click()}
            >
              <Upload className="w-5 h-5 text-neutral-400 mb-1" />
              <p className="text-xs text-neutral-300 font-medium">Trascina il logo qui o <span style={{ color: primaryColor }} className="underline">sfoglia</span></p>
              <p className="text-[10px] text-neutral-500 mt-0.5">PNG, JPG, SVG (Trasparente o Scuro)</p>
              <input
                id="logo-customizer-file"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="pt-4 border-t border-neutral-800/80 flex justify-end">
          <button
            type="submit"
            className="flex items-center gap-2 px-6 py-3.5 rounded-xl text-neutral-950 font-bold tracking-wider text-xs uppercase cursor-pointer transition-all shadow-lg hover:scale-105"
            style={{ 
              backgroundColor: primaryColor,
              boxShadow: `0 4px 12px ${primaryColor}44`
            }}
          >
            <Save className="w-4 h-4" />
            Salva Configurazioni
          </button>
        </div>
      </form>

    </div>
  );
}
