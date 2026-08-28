// QuizBuilder.jsx — Constructor de evaluaciones avanzadas estilo Moodle
// Soporta configuración de intentos, temporizador, métodos de calificación,
// cálculo de puntajes fraccionados (33.33%) e importador GIFT/JSON.

import React, { useState } from 'react';
import { nanoid } from 'nanoid';
import { useCourseStore } from '../store/courseStore';
import { normalizeQuizConfig, DEFAULT_QUIZ_SETTINGS } from '../modules/quiz/types';
import { parseGIFT, parseQuizJSON, parseQuizMarkdown } from '../modules/quiz/giftParser';
import {
  Plus,
  Trash2,
  HelpCircle,
  Settings,
  Upload,
  FileCode,
  CheckCircle2,
  Clock,
  RotateCcw,
  Sliders,
  ChevronDown,
  ChevronUp,
  Percent,
  X
} from 'lucide-react';

export default function QuizBuilder({ assessment }) {
  const { addQuestion, updateQuestion, deleteQuestion } = useCourseStore();
  const quizConfig = normalizeQuizConfig(assessment);
  const settings = quizConfig.settings;

  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importFormat, setImportFormat] = useState('gift'); // 'gift' | 'json' | 'markdown'
  const [importText, setImportText] = useState('');
  const [importError, setImportError] = useState('');

  // Actualizador genérico de la configuración del assessment en el Zustand store
  const updateSettings = (newSettings) => {
    const updatedSettings = { ...settings, ...newSettings };
    useCourseStore.setState((s) => ({
      course: {
        ...s.course,
        modules: s.course.modules.map((m) => ({
          ...m,
          children: m.children.map((t) => ({
            ...t,
            children: t.children.map((n) =>
              n.id === assessment.id
                ? {
                    ...n,
                    passScore: Math.round(
                      (updatedSettings.passing_grade / updatedSettings.max_grade) * 100
                    ),
                    settings: updatedSettings,
                  }
                : n
            ),
          })),
        })),
      },
    }));
  };

  const handleAddQuestion = () => {
    addQuestion(assessment.id);
  };

  const handleAddOption = (qId, options) => {
    const newOpt = {
      id: 'o_' + nanoid(4),
      text: `Nueva Opción ${options.length + 1}`,
      weight_percentage: 0,
      is_correct: false,
    };
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

  const handleImportExecute = () => {
    setImportError('');
    if (!importText.trim()) {
      setImportError('Por favor pegue o escriba el contenido a importar.');
      return;
    }

    try {
      let parsed = [];
      if (importFormat === 'gift') {
        parsed = parseGIFT(importText);
      } else if (importFormat === 'json') {
        parsed = parseQuizJSON(importText);
      } else if (importFormat === 'markdown') {
        parsed = parseQuizMarkdown(importText);
      }

      if (!parsed || parsed.length === 0) {
        setImportError('No se encontraron preguntas válidas en el texto ingresado.');
        return;
      }

      const existing = assessment.questions || [];
      const updatedQuestions = [...existing, ...parsed];

      useCourseStore.setState((s) => ({
        course: {
          ...s.course,
          modules: s.course.modules.map((m) => ({
            ...m,
            children: m.children.map((t) => ({
              ...t,
              children: t.children.map((n) =>
                n.id === assessment.id ? { ...n, questions: updatedQuestions } : n
              ),
            })),
          })),
        },
      }));

      setImportText('');
      setShowImportModal(false);
      alert(`¡Se importaron exitosamente ${parsed.length} preguntas!`);
    } catch (err) {
      setImportError('Error de importación: ' + err.message);
    }
  };

  const sampleGIFT = `::Q1:: ¿Función principal del flujo de caja? {=Monitorear ingresos y egresos ~Calcular sólo impuestos ~Diseñar logotipos}

::Q2:: Marque los elementos de la gestión financiera {~%33.3333%Presupuesto ~%33.3333%Flujo de caja ~%33.3334%Estructura de costos ~%-50%Diseño gráfico}

::Q3:: ¿El balance general es un estado financiero? {T}`;

  return (
    <main className="flex-1 p-6 overflow-y-auto max-w-5xl mx-auto w-full">
      {/* HEADER DE EVALUACIÓN */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 pb-4 mb-6 gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <HelpCircle size={22} className="text-emerald-600" />
            <h1 className="text-xl font-bold text-slate-800">{assessment.title}</h1>
          </div>
          <p className="text-xs font-semibold text-slate-400 tracking-wider uppercase mt-1">
            EVALUACIÓN ESTILO MOODLE ({quizConfig.questions.length} PREGUNTAS)
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowImportModal(true)}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 text-xs font-bold cursor-pointer transition-colors"
            title="Importar preguntas desde formato GIFT, JSON o Markdown"
          >
            <Upload size={14} />
            <span>Importar (GIFT / JSON)</span>
          </button>

          <button
            onClick={() => setShowConfigModal(!showConfigModal)}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 text-xs font-bold cursor-pointer transition-colors shadow-2xs"
          >
            <Settings size={14} className="text-slate-500" />
            <span>Reglas y Ajustes</span>
          </button>
        </div>
      </div>

      {/* PANEL DE CONFIGURACIÓN MOODLE */}
      {showConfigModal && (
        <div className="bg-slate-900 text-white rounded-xl p-5 mb-6 shadow-xl space-y-4 border border-slate-800">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center space-x-2">
              <Sliders size={18} className="text-[#f58220]" />
              <h3 className="font-bold text-sm uppercase tracking-wider text-slate-200">
                Ajustes Moodle de la Evaluación
              </h3>
            </div>
            <button
              onClick={() => setShowConfigModal(false)}
              className="text-slate-400 hover:text-white"
            >
              <X size={16} />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            {/* Límite de Intentos */}
            <div>
              <label className="block text-slate-400 font-semibold mb-1">
                Límite de Intentos:
              </label>
              <select
                value={settings.max_attempts}
                onChange={(e) => updateSettings({ max_attempts: Number(e.target.value) })}
                className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1.5 font-bold text-white focus:outline-none focus:border-[#f58220]"
              >
                <option value={0}>Sin límite (Ilimitado)</option>
                <option value={1}>1 Intento único</option>
                <option value={2}>2 Intentos</option>
                <option value={3}>3 Intentos (Default)</option>
                <option value={5}>5 Intentos</option>
              </select>
            </div>

            {/* Tiempo Límite en Minutos */}
            <div>
              <label className="block text-slate-400 font-semibold mb-1">
                Tiempo Límite (Minutos):
              </label>
              <input
                type="number"
                min={0}
                max={180}
                value={Math.round(settings.time_limit_seconds / 60)}
                onChange={(e) =>
                  updateSettings({ time_limit_seconds: Math.max(0, Number(e.target.value)) * 60 })
                }
                placeholder="0 = Sin tiempo"
                className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1.5 font-bold text-white focus:outline-none focus:border-[#f58220]"
              />
              <span className="text-[10px] text-slate-500 mt-0.5 block">0 = Sin límite de tiempo</span>
            </div>

            {/* Calificación Máxima */}
            <div>
              <label className="block text-slate-400 font-semibold mb-1">
                Escala Máxima:
              </label>
              <select
                value={settings.max_grade}
                onChange={(e) => updateSettings({ max_grade: Number(e.target.value) })}
                className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1.5 font-bold text-white focus:outline-none focus:border-[#f58220]"
              >
                <option value={10.0}>Escala 0.0 – 10.0</option>
                <option value={20.0}>Escala 0.0 – 20.0</option>
                <option value={100.0}>Escala 0 – 100%</option>
              </select>
            </div>

            {/* Nota Mínima Aprobatoria */}
            <div>
              <label className="block text-slate-400 font-semibold mb-1">
                Nota Mínima para Aprobar:
              </label>
              <input
                type="number"
                step="0.1"
                min={0}
                max={settings.max_grade}
                value={settings.passing_grade}
                onChange={(e) => updateSettings({ passing_grade: Number(e.target.value) })}
                className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1.5 font-bold text-emerald-400 focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Método de Calificación */}
            <div className="sm:col-span-2">
              <label className="block text-slate-400 font-semibold mb-1">
                Método de Calificación Acumulada:
              </label>
              <select
                value={settings.grading_method}
                onChange={(e) => updateSettings({ grading_method: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1.5 font-bold text-white focus:outline-none focus:border-[#f58220]"
              >
                <option value="HIGHEST_SCORE">Calificación Más Alta (Highest Grade)</option>
                <option value="AVERAGE">Promedio de Todos los Intentos (Average)</option>
                <option value="FIRST_ATTEMPT">Primer Intento (First Attempt)</option>
                <option value="LAST_ATTEMPT">Último Intento (Last Attempt)</option>
              </select>
            </div>

            {/* Opciones Adicionales */}
            <div className="sm:col-span-2 flex flex-col justify-center space-y-2 pt-2">
              <label className="flex items-center space-x-2 cursor-pointer text-slate-300">
                <input
                  type="checkbox"
                  checked={settings.allow_review}
                  onChange={(e) => updateSettings({ allow_review: e.target.checked })}
                  className="accent-[#f58220] rounded"
                />
                <span>Permitir revisión detallada (marcas ✔/✖ y feedback al finalizar)</span>
              </label>

              <label className="flex items-center space-x-2 cursor-pointer text-slate-300">
                <input
                  type="checkbox"
                  checked={settings.shuffle_options}
                  onChange={(e) => updateSettings({ shuffle_options: e.target.checked })}
                  className="accent-[#f58220] rounded"
                />
                <span>Mezclar orden de opciones al azar en cada intento</span>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* LISTA DE PREGUNTAS DE LA EVALUACIÓN */}
      <div className="space-y-4">
        {quizConfig.questions.map((q, i) => (
          <div
            key={q.id}
            className="border border-slate-200 rounded-xl p-5 bg-white shadow-2xs space-y-4 transition-all hover:border-slate-300"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-extrabold text-[#f58220] uppercase tracking-wider bg-orange-50 px-2 py-0.5 rounded border border-orange-200">
                  Pregunta {i + 1}
                </span>
                <span className="text-xs text-slate-400 font-semibold">
                  ({q.options.filter((o) => (o.weight_percentage || 0) > 0).length > 1
                    ? 'Opción Múltiple Fraccionada'
                    : 'Opción Única'})
                </span>
              </div>
              <button
                onClick={() => deleteQuestion(assessment.id, q.id)}
                className="text-slate-400 hover:text-rose-600 text-xs font-semibold flex items-center space-x-1 cursor-pointer transition-colors"
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
              className="w-full text-sm font-semibold border-b border-slate-300 pb-2 focus:outline-none focus:border-[#f58220] text-slate-900"
            />

            {/* LISTA DE OPCIONES DE LA PREGUNTA */}
            <div className="space-y-2.5 pt-1">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <span>Opciones de respuesta:</span>
                <span>Ponderación / Puntaje (%)</span>
              </div>

              {q.options.map((opt) => {
                const currentWeight =
                  opt.weight_percentage !== undefined
                    ? opt.weight_percentage
                    : q.correctOptionId === opt.id
                    ? 100
                    : 0;

                return (
                  <div key={opt.id} className="flex items-center space-x-2 text-xs">
                    <input
                      type="radio"
                      name={`correct-${q.id}`}
                      checked={currentWeight === 100}
                      onChange={() => {
                        const newOpts = q.options.map((o) => ({
                          ...o,
                          weight_percentage: o.id === opt.id ? 100 : 0,
                          is_correct: o.id === opt.id,
                        }));
                        updateQuestion(assessment.id, q.id, {
                          correctOptionId: opt.id,
                          options: newOpts,
                        });
                      }}
                      className="accent-emerald-600 w-4 h-4 cursor-pointer"
                      title="Marcar como 100% Correcta"
                    />

                    <input
                      defaultValue={opt.text}
                      onBlur={(e) =>
                        updateQuestion(assessment.id, q.id, {
                          options: q.options.map((o) =>
                            o.id === opt.id ? { ...o, text: e.target.value } : o
                          ),
                        })
                      }
                      className={`flex-1 border rounded-md px-3 py-1.5 text-xs focus:outline-none ${
                        currentWeight > 0
                          ? 'border-emerald-500 bg-emerald-50/40 font-semibold text-emerald-900'
                          : currentWeight < 0
                          ? 'border-rose-300 bg-rose-50/40 text-rose-900'
                          : 'border-slate-300 bg-white text-slate-800'
                      }`}
                    />

                    {/* SELECTOR DE PESO PORCENTUAL FRACCIONADO (33.33%, 50%, -50%, etc.) */}
                    <select
                      value={currentWeight}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        const newOpts = q.options.map((o) =>
                          o.id === opt.id
                            ? { ...o, weight_percentage: val, is_correct: val > 0 }
                            : o
                        );
                        updateQuestion(assessment.id, q.id, { options: newOpts });
                      }}
                      className="border border-slate-300 rounded px-2 py-1 bg-slate-50 font-bold text-slate-700 text-xs focus:outline-none focus:border-indigo-500"
                    >
                      <option value={100}>100% (Correcta)</option>
                      <option value={50}>50% (Parcial)</option>
                      <option value={33.3333}>33.33% (1/3 Parcial)</option>
                      <option value={25}>25% (1/4 Parcial)</option>
                      <option value={0}>0% (Neutro)</option>
                      <option value={-25}>-25% (Penalización)</option>
                      <option value={-33.3333}>-33.33% (Penalización)</option>
                      <option value={-50}>-50% (Penalización)</option>
                      <option value={-100}>-100% (Penalización Total)</option>
                    </select>

                    {q.options.length > 2 && (
                      <button
                        onClick={() => handleRemoveOption(q.id, q.options, opt.id)}
                        className="text-slate-400 hover:text-rose-600 px-1 cursor-pointer"
                        title="Quitar opción"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                );
              })}

              <button
                onClick={() => handleAddOption(q.id, q.options)}
                className="text-[11px] font-semibold text-indigo-600 hover:underline pt-1 cursor-pointer block"
              >
                + Añadir Opción de Respuesta
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* BOTÓN AÑADIR PREGUNTA */}
      <div className="pt-6">
        <button
          onClick={handleAddQuestion}
          className="text-xs font-bold px-4 py-2.5 rounded-lg border border-emerald-600 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 flex items-center space-x-1.5 cursor-pointer shadow-2xs transition-colors"
        >
          <Plus size={15} />
          <span>Añadir Nueva Pregunta</span>
        </button>
      </div>

      {/* MODAL DE IMPORTACIÓN GIFT / JSON / MD */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4 border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <Upload size={20} className="text-indigo-600" />
                <h3 className="font-bold text-base text-slate-800">
                  Importar Preguntas al Cuestionario
                </h3>
              </div>
              <button
                onClick={() => setShowImportModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3">
              <div className="flex items-center space-x-4 text-xs font-bold">
                <span className="text-slate-500">Seleccione Formato:</span>
                <label className="flex items-center space-x-1 cursor-pointer">
                  <input
                    type="radio"
                    name="impFormat"
                    value="gift"
                    checked={importFormat === 'gift'}
                    onChange={() => setImportFormat('gift')}
                    className="accent-indigo-600"
                  />
                  <span>GIFT (Moodle)</span>
                </label>
                <label className="flex items-center space-x-1 cursor-pointer">
                  <input
                    type="radio"
                    name="impFormat"
                    value="json"
                    checked={importFormat === 'json'}
                    onChange={() => setImportFormat('json')}
                    className="accent-indigo-600"
                  />
                  <span>JSON Nativo</span>
                </label>
                <label className="flex items-center space-x-1 cursor-pointer">
                  <input
                    type="radio"
                    name="impFormat"
                    value="markdown"
                    checked={importFormat === 'markdown'}
                    onChange={() => setImportFormat('markdown')}
                    className="accent-indigo-600"
                  />
                  <span>Markdown Checklist</span>
                </label>
              </div>

              {importFormat === 'gift' && (
                <div className="text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-lg border border-slate-200 space-y-1">
                  <p className="font-bold text-slate-700">Ejemplo de Formato GIFT:</p>
                  <pre className="text-[10px] text-slate-600 font-mono whitespace-pre-wrap">
                    {sampleGIFT}
                  </pre>
                </div>
              )}

              <textarea
                rows={8}
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                placeholder="Pegue aquí el contenido en el formato seleccionado..."
                className="w-full p-3 font-mono text-xs border border-slate-300 rounded-xl focus:outline-none focus:border-indigo-500"
              ></textarea>

              {importError && (
                <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
                  {importError}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                onClick={() => setShowImportModal(false)}
                className="px-4 py-2 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-100"
              >
                Cancelar
              </button>
              <button
                onClick={handleImportExecute}
                className="px-5 py-2 rounded-lg text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md"
              >
                Procesar e Importar
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
