import React from 'react';
import { useCourseStore } from '../../store/courseStore';
import { HelpCircle, Plus, Trash2, CheckCircle } from 'lucide-react';
import { nanoid } from 'nanoid';

export default function KnowledgeCheckBlock({ lessonId, block }) {
  const { updateBlock, deleteBlock } = useCourseStore();
  const content = block.content || { question: '', options: [], explanation: '' };
  const options = content.options || [];

  const handleChange = (field, value) => {
    updateBlock(lessonId, block.id, { ...content, [field]: value });
  };

  const handleAddOption = () => {
    const newOpt = {
      id: nanoid(6),
      text: `Opción ${options.length + 1}`,
      isCorrect: options.length === 0
    };
    handleChange('options', [...options, newOpt]);
  };

  const handleRemoveOption = (id) => {
    handleChange('options', options.filter((o) => o.id !== id));
  };

  const handleOptionTextChange = (id, text) => {
    handleChange(
      'options',
      options.map((o) => (o.id === id ? { ...o, text } : o))
    );
  };

  const handleSelectCorrect = (id) => {
    handleChange(
      'options',
      options.map((o) => ({ ...o, isCorrect: o.id === id }))
    );
  };

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-3 relative group">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2 text-xs font-bold text-slate-700">
          <HelpCircle size={14} className="text-[#f58220]" />
          <span>Objeto Didáctico: Verificación Rápida de Aprendizaje (Trivia)</span>
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
          placeholder="Pregunta de comprobación (ej: ¿Cuál es el beneficio de...?)"
          value={content.question || ''}
          onChange={(e) => handleChange('question', e.target.value)}
        />

        <div className="space-y-2">
          <label className="text-[11px] font-semibold text-slate-500">Opciones de Respuesta (Marque la correcta)</label>
          {options.map((opt, idx) => (
            <div key={opt.id} className="flex items-center space-x-2 bg-white border border-slate-200 rounded p-1.5">
              <input
                type="radio"
                name={`kc_correct_${block.id}`}
                checked={!!opt.isCorrect}
                onChange={() => handleSelectCorrect(opt.id)}
                className="accent-[#f58220] cursor-pointer"
                title="Marcar como opción correcta"
              />
              <input
                type="text"
                className="flex-1 text-xs p-1 border border-slate-200 rounded focus:outline-none focus:border-[#f58220]"
                placeholder={`Opción ${idx + 1}`}
                value={opt.text || ''}
                onChange={(e) => handleOptionTextChange(opt.id, e.target.value)}
              />
              <button
                onClick={() => handleRemoveOption(opt.id)}
                className="text-slate-400 hover:text-red-500 p-1"
                title="Eliminar opción"
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>

        <button
          onClick={handleAddOption}
          className="text-xs font-semibold text-[#f58220] hover:text-orange-600 flex items-center space-x-1 pt-1 cursor-pointer"
        >
          <Plus size={13} />
          <span>Añadir opción de respuesta</span>
        </button>

        <div className="pt-2">
          <label className="text-[11px] font-semibold text-slate-500">Retroalimentación / Explicación del Resultado</label>
          <textarea
            rows={2}
            className="w-full text-xs p-2 border border-slate-300 rounded bg-white focus:outline-none focus:border-[#f58220]"
            placeholder="Explicación que aparecerá al estudiante al responder..."
            value={content.explanation || ''}
            onChange={(e) => handleChange('explanation', e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}
