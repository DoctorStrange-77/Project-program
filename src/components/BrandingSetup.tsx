/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { CoachConfig } from '../types';
import { Dumbbell, Upload, Check, Sparkles } from 'lucide-react';

interface BrandingSetupProps {
  onComplete: (config: CoachConfig) => void;
}

const PRESET_COLORS = [
  { name: 'Volt / Bold', value: '#CCFF00', label: 'Volt High-Contrast' },
  { name: 'Smeraldo', value: '#10b981', label: 'Verde Smeraldo' },
  { name: 'Arancio', value: '#f97316', label: 'Arancione Carico' },
  { name: 'Rosso Corsa', value: '#ef4444', label: 'Rosso Intenso' },
  { name: 'Elettrico', value: '#3b82f6', label: 'Blu Elettrico' },
  { name: 'Viola Deep', value: '#8b5cf6', label: 'Viola Profondo' },
];

export default function BrandingSetup({ onComplete }: BrandingSetupProps) {
  const [nomeProgramma, setNomeProgramma] = useState('');
  const [nomeCoach, setNomeCoach] = useState('');
  const [teamName, setTeamName] = useState('');
  const [slogan, setSlogan] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#CCFF00'); // Volt default
  const [logoUrl, setLogoUrl] = useState('');
  const [dragActive, setDragActive] = useState(false);

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

    const config: CoachConfig = {
      nomeProgramma: nomeProgramma.trim(),
      nomeCoach: nomeCoach.trim(),
      teamName: teamName.trim() || undefined,
      slogan: slogan.trim() || undefined,
      primaryColor,
      logoUrl: logoUrl || undefined,
      isConfigured: true,
    };

    onComplete(config);
  };

  return (
    <div id="branding-setup-container" className="min-h-screen bg-[#080808] text-neutral-100 flex flex-col justify-center items-center p-4">
      <div id="setup-card" className="w-full max-w-2xl bg-[#121212] border border-white/5 rounded-2xl p-6 sm:p-10 shadow-2xl relative overflow-hidden">
        {/* Decorative ambient gradient */}
        <div 
          className="absolute -top-40 -right-40 w-80 h-80 rounded-full opacity-20 blur-3xl transition-all duration-700" 
          style={{ backgroundColor: primaryColor }}
        />

        <div className="flex items-center gap-3 mb-6 relative">
          <div className="p-3 rounded-xl bg-black/30 border border-white/5" style={{ borderColor: primaryColor }}>
            <Dumbbell className="w-8 h-8" style={{ color: primaryColor }} />
          </div>
          <div>
            <h1 className="text-2xl font-black uppercase tracking-tighter italic text-white">Benvenuto in CoachBoard</h1>
            <p className="text-xs text-white/40 font-medium">Configura la tua identità per personalizzare l'intera piattaforma.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 relative">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400">
                Nome del Programma <span className="text-red-500">*</span>
              </label>
              <input
                id="setup-input-programma"
                type="text"
                required
                placeholder="es. Power Gym, Iron Plan"
                value={nomeProgramma}
                onChange={(e) => setNomeProgramma(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-neutral-950 border border-neutral-800 text-neutral-100 placeholder-neutral-500 focus:outline-none focus:ring-2 focus:border-transparent transition-all"
                style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
              />
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400">
                Nome e Cognome Coach <span className="text-red-500">*</span>
              </label>
              <input
                id="setup-input-coach"
                type="text"
                required
                placeholder="es. Marco Rossi"
                value={nomeCoach}
                onChange={(e) => setNomeCoach(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-neutral-950 border border-neutral-800 text-neutral-100 placeholder-neutral-500 focus:outline-none focus:ring-2 focus:border-transparent transition-all"
                style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
              />
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400">
                Nome Team / Attività <span className="text-neutral-500">(Facoltativo)</span>
              </label>
              <input
                id="setup-input-team"
                type="text"
                placeholder="es. Iron Fitness Team"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-neutral-950 border border-neutral-800 text-neutral-100 placeholder-neutral-500 focus:outline-none focus:ring-2 focus:border-transparent transition-all"
                style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
              />
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400">
                Slogan Motivazionale <span className="text-neutral-500">(Facoltativo)</span>
              </label>
              <input
                id="setup-input-slogan"
                type="text"
                placeholder="es. Train Hard, Live Smart"
                value={slogan}
                onChange={(e) => setSlogan(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-neutral-950 border border-neutral-800 text-neutral-100 placeholder-neutral-500 focus:outline-none focus:ring-2 focus:border-transparent transition-all"
                style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
              />
            </div>
          </div>

          {/* Color Customizer */}
          <div className="space-y-3">
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400">
              Colore Principale dell'Interfaccia
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
              {PRESET_COLORS.map((color) => (
                <button
                  key={color.value}
                  type="button"
                  onClick={() => setPrimaryColor(color.value)}
                  className="flex items-center gap-2 p-2.5 rounded-xl bg-neutral-950 border transition-all text-left text-xs"
                  style={{
                    borderColor: primaryColor === color.value ? color.value : '#262626',
                    boxShadow: primaryColor === color.value ? `0 0 10px ${color.value}22` : 'none'
                  }}
                >
                  <span className="w-4 h-4 rounded-full block shrink-0" style={{ backgroundColor: color.value }} />
                  <span className="truncate text-neutral-300 font-medium">{color.name}</span>
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3 mt-2 bg-neutral-950 p-3 rounded-xl border border-neutral-850">
              <span className="text-xs text-neutral-400">Colore personalizzato:</span>
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
                  className="w-24 px-2 py-1 text-xs text-center bg-neutral-900 border border-neutral-800 rounded text-neutral-100 uppercase"
                />
              </div>
            </div>
          </div>

          {/* Logo Upload Drag and Drop */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400">
              Logo Personale <span className="text-neutral-500">(Facoltativo, consigliato fondo trasparente o scuro)</span>
            </label>
            
            <div className="flex gap-4 items-center">
              {logoUrl ? (
                <div className="relative w-20 h-20 bg-neutral-950 border border-neutral-800 rounded-xl p-2 flex items-center justify-center shrink-0">
                  <img src={logoUrl} alt="Preview Logo" className="max-w-full max-h-full object-contain rounded" />
                  <button
                    type="button"
                    onClick={() => setLogoUrl('')}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-600 text-white flex items-center justify-center text-[10px] font-bold hover:bg-red-500 transition-colors"
                  >
                    ×
                  </button>
                </div>
              ) : (
                <div 
                  className="w-20 h-20 bg-neutral-950 border-2 border-dashed border-neutral-800 rounded-xl flex items-center justify-center text-neutral-600 shrink-0"
                  style={{ borderColor: dragActive ? primaryColor : undefined }}
                >
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
                onClick={() => document.getElementById('logo-file-input')?.click()}
              >
                <Upload className="w-5 h-5 text-neutral-400 mb-1" />
                <p className="text-xs text-neutral-300 font-medium">Trascina qui il logo o <span style={{ color: primaryColor }} className="underline">sfoglia</span></p>
                <p className="text-[10px] text-neutral-500 mt-0.5">PNG, JPG, SVG (Consigliato quadrato)</p>
                <input
                  id="logo-file-input"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-4 border-t border-neutral-800/60">
            <button
              id="setup-submit-btn"
              type="submit"
              className="w-full flex items-center justify-center gap-2 py-4 px-6 rounded-xl text-neutral-950 font-bold tracking-wide transition-all shadow-lg text-sm uppercase cursor-pointer"
              style={{
                backgroundColor: primaryColor,
                boxShadow: `0 4px 14px ${primaryColor}44`,
              }}
            >
              <Check className="w-5 h-5" />
              Salva e Avvia Piattaforma
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
