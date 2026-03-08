"use client";

import { useState } from 'react';
import { Loader2, X, Save, AlertTriangle } from 'lucide-react';
import { Expert } from '@/lib/types';

interface EditExpertDialogProps {
  isOpen: boolean;
  onClose: () => void;
  expert: Expert;
  onSave: (newData: Partial<Expert>) => Promise<void>;
}

export function EditExpertDialog({ isOpen, onClose, expert, onSave }: EditExpertDialogProps) {
  const [formData, setFormData] = useState<Partial<Expert>>({
    name: expert.name || '',
    cohort: expert.cohort || 1,
    sector: expert.sector || '',
    title: expert.title || '',
    currentTitle: expert.currentTitle || '',
    email: expert.email || '',
    bio: expert.bio || '',
    topics: expert.topics || [],
    links: {
      linkedin: expert.links?.linkedin || '',
      twitter: expert.links?.twitter || '',
      website: expert.links?.website || '',
      organizationName: expert.links?.organizationName || '',
      organizationUrl: expert.links?.organizationUrl || '',
    }
  });

  const [topicsStr, setTopicsStr] = useState((expert.topics || []).join(', '));
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    try {
      // Process topics string back to array
      const processedTopics = topicsStr
        .split(',')
        .map(t => t.trim())
        .filter(t => t.length > 0);

      const finalData = {
        ...formData,
        topics: processedTopics,
      };

      await onSave(finalData);
      onClose();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleLinkChange = (field: keyof NonNullable<Expert['links']>, value: string) => {
    setFormData(prev => ({
      ...prev,
      links: {
        ...(prev.links || {}),
        [field]: value
      }
    }));
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center p-4 backdrop-blur-sm">
      <div className="bg-zinc-900 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col border border-zinc-700">
        <div className="p-5 border-b border-zinc-800 flex justify-between items-center sticky top-0 bg-zinc-900 rounded-t-xl z-10">
          <h3 className="text-lg font-bold text-zinc-100">Editar Perfil de Experto</h3>
          <button onClick={onClose} disabled={isSaving} className="text-zinc-400 hover:text-zinc-200 p-1 rounded-full hover:bg-zinc-800 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex flex-col gap-6">
          {error && (
            <div className="bg-red-500/10 text-red-400 text-sm font-medium p-3 rounded-md border border-red-500/20 flex items-center gap-2">
              <AlertTriangle size={16} />
              <div><strong>Error:</strong> {error}</div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1 block">Nombre</label>
              <input
                type="text"
                value={formData.name || ''}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-md p-2 text-sm text-zinc-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none"
              />
            </div>
            
            <div className="flex gap-4">
              <div className="w-1/3">
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1 block">Cohorte</label>
                <input
                  type="number"
                  value={formData.cohort || ''}
                  onChange={e => setFormData({ ...formData, cohort: parseInt(e.target.value) || 1 })}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-md p-2 text-sm text-zinc-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none"
                />
              </div>
              <div className="flex-1">
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1 block">Sector</label>
                <input
                  type="text"
                  value={formData.sector || ''}
                  onChange={e => setFormData({ ...formData, sector: e.target.value })}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-md p-2 text-sm text-zinc-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1 block">Título Histórico</label>
              <input
                type="text"
                value={formData.title || ''}
                onChange={e => setFormData({ ...formData, title: e.target.value })}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-md p-2 text-sm text-zinc-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none"
              />
            </div>
            
            <div>
              <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1 block">Cargo Actual</label>
              <input
                type="text"
                value={formData.currentTitle || ''}
                onChange={e => setFormData({ ...formData, currentTitle: e.target.value })}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-md p-2 text-sm text-zinc-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none"
              />
            </div>
            
            <div>
              <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1 block">Email</label>
              <input
                type="email"
                value={formData.email || ''}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-md p-2 text-sm text-zinc-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none"
              />
            </div>
            
            <div>
              <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1 block">Temas (separados por coma)</label>
              <input
                type="text"
                value={topicsStr}
                onChange={e => setTopicsStr(e.target.value)}
                placeholder="Desarrollo Rural, Género, Agua..."
                className="w-full bg-zinc-800 border border-zinc-700 rounded-md p-2 text-sm text-zinc-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1 block">Biografía</label>
            <textarea
              value={formData.bio || ''}
              onChange={e => setFormData({ ...formData, bio: e.target.value })}
              className="w-full h-32 bg-zinc-800 border border-zinc-700 rounded-md p-2 text-sm text-zinc-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div className="border-t border-zinc-800 pt-4">
            <h4 className="text-sm font-bold text-zinc-300 mb-3 uppercase tracking-wider">Enlaces y Redes</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1 block">LinkedIn URL</label>
                <input
                  type="url"
                  value={formData.links?.linkedin || ''}
                  onChange={e => handleLinkChange('linkedin', e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-md p-2 text-sm text-zinc-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1 block">Twitter (X) URL</label>
                <input
                  type="url"
                  value={formData.links?.twitter || ''}
                  onChange={e => handleLinkChange('twitter', e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-md p-2 text-sm text-zinc-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1 block">Sitio Web Personal</label>
                <input
                  type="url"
                  value={formData.links?.website || ''}
                  onChange={e => handleLinkChange('website', e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-md p-2 text-sm text-zinc-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1 block">Nombre de Organización</label>
                <input
                  type="text"
                  value={formData.links?.organizationName || ''}
                  onChange={e => handleLinkChange('organizationName', e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-md p-2 text-sm text-zinc-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1 block">URL de Organización</label>
                <input
                  type="url"
                  value={formData.links?.organizationUrl || ''}
                  onChange={e => handleLinkChange('organizationUrl', e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-md p-2 text-sm text-zinc-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="p-5 border-t border-zinc-800 flex justify-end items-center gap-3 bg-zinc-900 rounded-b-xl">
          <button onClick={onClose} disabled={isSaving} className="text-sm font-medium text-zinc-300 bg-zinc-800 border border-zinc-700 hover:bg-zinc-700 hover:text-white px-4 py-2 rounded-lg transition-colors shadow-sm">
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-1.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-lg transition-colors shadow-sm disabled:bg-indigo-400"
          >
            {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            {isSaving ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </div>
      </div>
    </div>
  );
}