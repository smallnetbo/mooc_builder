import React from 'react';
import { useCourseStore } from '../../store/courseStore';
import { GitCommit, Plus, Trash2 } from 'lucide-react';
import { nanoid } from 'nanoid';

export default function TimelineBlock({ lessonId, block }) {
  const { updateBlock, deleteBlock } = useCourseStore();
  const content = block.content || { steps: [] };
  const steps = content.steps || [];

  const handleUpdateSteps = (newSteps) => {
    updateBlock(lessonId, block.id, { ...content, steps: newSteps });
  };

  const handleAddStep = () => {
    const newStep = {
      id: nanoid(6),
      title: `Paso ${steps.length + 1}: Título de la Fase`,
      description: 'Descripción de las acciones o requerimientos de este paso.'
    };
    handleUpdateSteps([...steps, newStep]);
  };

  const handleRemoveStep = (id) => {
    handleUpdateSteps(steps.filter((s) => s.id !== id));
  };

  const handleStepChange = (id, field, value) => {
    handleUpdateSteps(
      steps.map((s) => (s.id === id ? { ...s, [field]: value } : s))
    );
  };

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-3 relative group">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2 text-xs font-bold text-slate-700">
          <GitCommit size={14} className="text-[#f58220]" />
          <span>Objeto Didáctico: Proceso por Pasos / Línea de Tiempo</span>
        </div>
        <button
          onClick={() => deleteBlock(lessonId, block.id)}
          className="text-slate-400 hover:text-red-500 transition-colors p-1"
          title="Eliminar bloque"
        >
          <Trash2 size={14} />
        </button>
      </div>

      <div className="space-y-3 border-l-2 border-[#f58220]/30 pl-4 ml-2">
        {steps.map((step, idx) => (
          <div key={step.id} className="bg-white border border-slate-200 rounded-lg p-3 space-y-2 shadow-xs relative">
            <div className="absolute -left-[25px] top-3.5 w-3 h-3 rounded-full bg-[#f58220] border-2 border-white ring-2 ring-orange-100" />
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold text-slate-400">Paso #{idx + 1}</span>
              <input
                type="text"
                className="flex-1 text-xs font-semibold p-1.5 border border-slate-300 rounded focus:outline-none focus:border-[#f58220]"
                placeholder="Título de la fase o paso"
                value={step.title || ''}
                onChange={(e) => handleStepChange(step.id, 'title', e.target.value)}
              />
              <button
                onClick={() => handleRemoveStep(step.id)}
                className="text-slate-400 hover:text-red-500 p-1"
                title="Eliminar paso"
              >
                <Trash2 size={13} />
              </button>
            </div>
            <textarea
              rows={2}
              className="w-full text-xs p-2 border border-slate-300 rounded focus:outline-none focus:border-[#f58220]"
              placeholder="Explicación detallada de este paso..."
              value={step.description || ''}
              onChange={(e) => handleStepChange(step.id, 'description', e.target.value)}
            />
          </div>
        ))}
      </div>

      <button
        onClick={handleAddStep}
        className="text-xs font-semibold text-[#f58220] hover:text-orange-600 flex items-center space-x-1 pt-1 cursor-pointer"
      >
        <Plus size={13} />
        <span>Añadir paso a la secuencia</span>
      </button>
    </div>
  );
}
