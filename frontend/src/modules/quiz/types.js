// types.js — Definición de estructuras y valores por defecto para el módulo de evaluaciones estilo Moodle

export const DEFAULT_QUIZ_SETTINGS = {
  max_attempts: 3,             // 0 para ilimitados
  time_limit_seconds: 900,      // 0 para sin límite (default: 15 minutos = 900 segs)
  auto_submit_on_timeout: true, // Auto envía al agotarse el tiempo
  passing_grade: 7.0,           // Nota mínima aprobatoria (escala 0-10 o 0-100)
  max_grade: 10.0,              // Calificación máxima (escala 10.0 o 100.0)
  grading_method: 'HIGHEST_SCORE', // "HIGHEST_SCORE" | "AVERAGE" | "FIRST_ATTEMPT" | "LAST_ATTEMPT"
  shuffle_questions: false,     // Mezclar preguntas aleatoriamente
  shuffle_options: false,       // Mezclar opciones aleatoriamente
  allow_review: true,           // Permite ver respuestas correctas y feedback al finalizar
};

/**
 * Garantiza que una evaluación (assessment) contenga la configuración de Quiz Moodle.
 */
export function normalizeQuizConfig(assessment = {}) {
  const settings = {
    ...DEFAULT_QUIZ_SETTINGS,
    ...(assessment.settings || {}),
  };

  // Mapear passScore legacy (0-100) si no se configuró passing_grade explícito
  if (assessment.passScore !== undefined && assessment.settings?.passing_grade === undefined) {
    if (settings.max_grade === 10.0 && assessment.passScore > 10) {
      settings.passing_grade = Math.round((assessment.passScore / 10) * 10) / 10;
    } else {
      settings.passing_grade = Number(assessment.passScore);
    }
  }

  const questions = (assessment.questions || []).map((q, idx) => {
    const isMultipleChoice = (q.options || []).filter(o => o.weight_percentage > 0 || o.is_correct).length > 1;
    return {
      id: q.id || `q_${idx + 1}`,
      text: q.text || `Pregunta ${idx + 1}`,
      type: q.type || (isMultipleChoice ? 'multiple_choice' : 'single_choice'),
      points: q.points !== undefined ? Number(q.points) : 1,
      feedback: q.feedback || '',
      options: (q.options || []).map((o, oIdx) => {
        let weight = o.weight_percentage !== undefined ? Number(o.weight_percentage) : undefined;
        let isCorrect = o.is_correct !== undefined ? Boolean(o.is_correct) : undefined;

        // Compatibilidad con esquema legacy: correctOptionId
        if (q.correctOptionId) {
          isCorrect = o.id === q.correctOptionId;
          weight = isCorrect ? 100 : 0;
        } else if (weight === undefined && isCorrect !== undefined) {
          weight = isCorrect ? 100 : 0;
        } else if (weight !== undefined && isCorrect === undefined) {
          isCorrect = weight > 0;
        }

        return {
          id: o.id || `o_${oIdx + 1}`,
          text: o.text || `Opción ${oIdx + 1}`,
          weight_percentage: weight !== undefined ? weight : 0,
          is_correct: Boolean(isCorrect),
          feedback: o.feedback || ''
        };
      })
    };
  });

  return {
    quiz_id: assessment.id || 'quiz_default',
    title: assessment.title || 'Evaluación',
    description: assessment.description || 'Responda las siguientes preguntas.',
    settings,
    questions,
  };
}
