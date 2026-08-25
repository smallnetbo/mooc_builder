// QuizBuilder.jsx — Constructor de evaluaciones: preguntas de opción múltiple,
// respuesta correcta y puntaje mínimo de aprobación (mapeado a SCORM 1.2).
import React from 'react';
import { nanoid } from 'nanoid';
import { useCourseStore } from '../store/courseStore';
import { Plus, Trash2, CheckCircle2, HelpCircle } from 'lucide-react';

export default function QuizBuilder({ assessment }) {
  const { addQuestion, updateQuestion, deleteQuestion } = useCourseStore();

  const setPassScore = (val) => {
    useCourseStore.setState((s) => ({
      course: {
        ...s.course,
        modules: s.course.modules.map((m) => ({
          ...m,
          children: m.children.map((t) => ({
            ...t,
            children: t.children.map((n) => n.id === assessment.id ? { ...n, passScore: Number(val) } : n),
          })),
        })),
      },
    }));
  };

  const handleAddQuestion = () => {
    addQuestion(assessment.id);
  };

  const handleAddOption = (qId, options) => {
    const newOpt = { id: 'o_' + nanoid(4), text: `Nueva Opción ${options.length + 1}` };
    updateQuestion(assessment.id, qId, { options: [...options, newOpt] });
  };

  const handleRemoveOption = (qId, options, optId) => {
    if (options.length <= 2) {
      alert('La pregunta debe tener al menos 2 opciones.');
      return;
    }
    const filtered = options.filter((o) => o.id !== optId);
    updateQuestion(assessment.id, qId, { options: filtered });
  };

  return (
    <main className="flex-1 p-6 overflow-y-auto max-w-4xl mx-auto w-full">
      <div className="flex items-center justify-between border-b border-slate-200 pb-4 mb-6">
        <div>
          <div className="flex items-center space-x-2">
            <HelpCircle size={20} className="text-emerald-600" />
            <h1 className="text-xl font-bold text-slate-800">{assessment.title}</h1>
          </div>
          <p className="text-xs font-semibold text-slate-400 tracking-wider uppercase mt-1">
            EVALUACIÓN DEL MÓDULO
          </p>
        </div>

        <div className="flex items-center space-x-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700">
          <span>Puntaje mínimo de aprobación (%):</span>
          <input
            type="number"
            min={10}
            max={100}
            defaultValue={assessment.passScore || 70}
            onBlur={(e) => setPassScore(e.target.value)}
            className="w-16 border border-slate-300 rounded px-2 py-1 bg-white text-center font-bold text-slate-900 focus:outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      <div className="space-y-4">
        {(assessment.questions || []).map((q, i) => (
          <div key={q.id} className="border border-slate-200 rounded-lg p-4 bg-white shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#f58220] uppercase tracking-wider">
                Pregunta {i + 1}
              </span>
              <button
                onClick={() => deleteQuestion(assessment.id, q.id)}
                className="text-slate-400 hover:text-rose-600 text-xs font-medium flex items-center space-x-1 cursor-pointer"
                title="Eliminar pregunta"
              >
                <Trash2 size={14} />
                <span>Eliminar</span>
              </button>
            </div>

            <input
              placeholder={`Enunciado de la pregunta ${i + 1}...`}
              defaultValue={q.text}
              onBlur={(e) => updateQuestion(assessment.id, q.id, { text: e.target.value })}
              className="w-full text-sm font-semibold border-b border-slate-300 pb-1.5 focus:outline-none focus:border-indigo-500"
            />

            <div className="space-y-2 pt-1">
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Opciones (marcar el botón radial para la alternativa correcta):
              </div>
              {(q.options || []).map((opt) => (
                <div key={opt.id} className="flex items-center space-x-2 text-xs">
                  <input
                    type="radio"
                    name={`correct-${q.id}`}
                    checked={q.correctOptionId === opt.id}
                    onChange={() => updateQuestion(assessment.id, q.id, { correctOptionId: opt.id })}
                    className="accent-emerald-600 w-4 h-4 cursor-pointer"
                    title="Marcar como respuesta correcta"
                  />
                  <input
                    defaultValue={opt.text}
                    onBlur={(e) => updateQuestion(assessment.id, q.id, {
                      options: (q.options || []).map((o) => o.id === opt.id ? { ...o, text: e.target.value } : o),
                    })}
                    className={`flex-1 border rounded px-2.5 py-1.5 text-xs focus:outline-none ${
                      q.correctOptionId === opt.id
                        ? 'border-emerald-500 bg-emerald-50/40 font-semibold text-emerald-900'
                        : 'border-slate-300 bg-white text-slate-800'
                    }`}
                  />
                  {(q.options || []).length > 2 && (
                    <button
                      onClick={() => handleRemoveOption(q.id, q.options, opt.id)}
                      className="text-slate-400 hover:text-rose-600 px-1 cursor-pointer"
                      title="Quitar opción"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
              <button
                onClick={() => handleAddOption(q.id, q.options || [])}
                className="text-[11px] font-semibold text-indigo-600 hover:underline pt-1 cursor-pointer block"
              >
                + Añadir Opción de Respuesta
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="pt-6">
        <button
          onClick={handleAddQuestion}
          className="text-xs font-bold px-4 py-2.5 rounded-lg border border-emerald-600 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 flex items-center space-x-1.5 cursor-pointer shadow-2xs transition-colors"
        >
          <Plus size={15} />
          <span>Añadir Pregunta de Opción Múltiple</span>
        </button>
      </div>
    </main>
  );
}
