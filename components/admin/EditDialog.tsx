"use client";

import { useState } from 'react';
import { Loader2, X, Save, AlertTriangle } from 'lucide-react';

interface EditDialogProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    initialData: Record<string, unknown>;
    onSave: (newData: Record<string, unknown>) => Promise<void>;
}

export function EditDialog({ isOpen, onClose, title, initialData, onSave }: EditDialogProps) {
    const [data, setData] = useState(initialData);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (!isOpen) return null;

    const handleSave = async () => {
        setIsSaving(true);
        setError(null);
        try {
            await onSave(data);
            onClose();
        } catch (e) {
            setError((e as Error).message);
        } finally {
            setIsSaving(false);
        }
    };
    
    const renderField = (key: string, value: unknown) => {
        const stringValue = String(value || '');
        if (key === 'quote' || key === 'description') {
            return (
                <textarea
                    value={stringValue}
                    onChange={(e) => setData({ ...data, [key]: e.target.value })}
                    className="w-full h-32 border border-gray-300 rounded-md p-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
            );
        }
        return (
            <input
                type="text"
                value={stringValue}
                onChange={(e) => setData({ ...data, [key]: e.target.value })}
                className="w-full border border-gray-300 rounded-md p-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
        );
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-xl border border-gray-200">
                <div className="p-5 border-b border-gray-100 flex justify-between items-center">
                    <h3 className="text-lg font-bold text-gray-900">{title}</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100" disabled={isSaving}>
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 flex flex-col gap-4">
                    {Object.entries(data).map(([key, value]) => (
                        <div key={key}>
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block">{key}</label>
                            {renderField(key, value)}
                        </div>
                    ))}
                     {error && (
                        <div className="bg-red-50 text-red-700 text-sm font-medium p-3 rounded-md border border-red-200 mt-2 flex items-center gap-2">
                            <AlertTriangle size={16} />
                            <div><strong>Error:</strong> {error}</div>
                        </div>
                    )}
                </div>

                <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end items-center gap-3">
                    <button onClick={onClose} disabled={isSaving} className="text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 px-4 py-2 rounded-lg transition-colors shadow-sm">
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
