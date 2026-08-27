import React from 'react';
import { useCourseStore } from '../../store/courseStore';
import { AlertCircle, Lightbulb, AlertTriangle, Briefcase, Trash2 } from 'lucide-react';

const TYPE_CONFIG = {
  tip: { label: 'Consejo Práctico / Tip', icon: Lightbulb, color: 'text-emerald-600', border: 'border-emerald-200', bg: 'bg-emerald-50' },
  important: { label: 'Nota Importante', icon: AlertCircle, color: 'text-blue-600', border: 'border-blue-200', bg: 'bg-blue-50' },
  warning: { label: 'Alerta / Precaución', icon: AlertTriangle, color: 'text-amber-600', border: 'border-amber-200', bg: 'bg-amber-50' },
  example: { label: 'Caso Práctico / Ejemplo', icon: Briefcase, color: 'text-purple-600', border: 'border-purple-200', bg: 'bg-purple-50' }
};

export default function CalloutBlock({ lessonId, block }) {
  const { updateBlock, deleteBlock } = useCourseStore();
  const content = block.content || { type: 'tip', title: '', text: '' };
  const currentType = TYPE_CONFIG[content.type] ? content.type : 'tip';
  const config = TYPE_CONFIG[currentType];
  const IconComponent = config.icon;

  const handleChange = (field, value) => {
    updateBlock(lessonId, block.id, { ...content, [field]: value });
  };

  return (
    <div className={`border rounded-lg p-4 space-y-3 relative group transition-colors ${config.border} ${config.bg}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2 text-xs font-bold">
          <IconComponent size={16} className={config.color} />
          <span className="text-slate-800">Caja de Destacado:</span>
          <select
            className="text-xs font-semibold bg-white border border-slate-300 rounded px-2 py-1 text-slate-700 focus:outline-none focus:border-[#f58220]"
            value={currentType}
            onChange={(e) => handleChange('type', e.target.value)}
          >
            <option value="tip">💡 Consejo Práctico</option>
            <option value="important">📌 Nota Importante</option>
            <option value="warning">⚠️ Alerta / Precaución</option>
            <option value="example">🏢 Caso Práctico Real</option>
          </select>
        </div>
        <button
          onClick={() => deleteBlock(lessonId, block.id)}
          className="text-slate-400 hover:text-red-500 transition-colors p-1"
          title="Eliminar bloque"
        >
          <Trash2 size={14} />
        </button>
      </div>

      <div className="space-y-2">
        <input
          type="text"
          className="w-full text-xs font-bold p-2 border border-slate-300 rounded bg-white focus:outline-none focus:border-[#f58220]"
          placeholder="Título del cuadro destacado"
          value={content.title || ''}
          onChange={(e) => handleChange('title', e.target.value)}
        />
        <textarea
          rows={3}
          className="w-full text-xs p-2 border border-slate-300 rounded bg-white focus:outline-none focus:border-[#f58220]"
          placeholder="Escriba aquí el mensaje relevante o caso práctico..."
          value={content.text || ''}
          onChange={(e) => handleChange('text', e.target.value)}
        />
      </div>
    </div>
  );
}
