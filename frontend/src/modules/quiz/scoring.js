// scoring.js — Motor de calificación pura con soporte para fracciones y penalizaciones

/**
 * Calcula el puntaje de una pregunta individual basado en las opciones seleccionadas.
 * - Soporta porcentajes parciales (ej. 33.3333%, 50%, -50%).
 * - No permite puntajes netos negativos por pregunta (mínimo 0).
 */
export function calculateQuestionScore(question, selectedOptionIds = []) {
  if (!question || !Array.isArray(question.options) || question.options.length === 0) {
    return { rawScore: 0, maxPoints: question?.points || 1, percentage: 0 };
  }

  const selectedIds = Array.isArray(selectedOptionIds) ? selectedOptionIds : [selectedOptionIds].filter(Boolean);
  const qPoints = Number(question.points) || 1;

  let netWeightPercent = 0;

  selectedIds.forEach((id) => {
    const opt = question.options.find((o) => o.id === id);
    if (opt) {
      const weight = Number(opt.weight_percentage) !== undefined && !isNaN(Number(opt.weight_percentage))
        ? Number(opt.weight_percentage)
        : (opt.is_correct ? 100 : 0);
      netWeightPercent += weight;
    }
  });

  // Regla de Oro: Las penalizaciones no deben generar un puntaje neto menor a 0 por pregunta.
  const clampedPercentage = Math.max(0, netWeightPercent);
  
  // Normalizar porcentaje (ej. 99.9999% a 100% si está muy cercano)
  const normalizedPercentage = Math.abs(clampedPercentage - 100) < 0.01 ? 100 : clampedPercentage;

  const earnedPoints = (normalizedPercentage / 100) * qPoints;

  return {
    rawScore: Math.round(earnedPoints * 10000) / 10000,
    maxPoints: qPoints,
    percentage: Math.round(normalizedPercentage * 100) / 100
  };
}

/**
 * Calcula la calificación total de un intento normalizada a max_grade (ej. escala 10.0 o 100.0).
 */
export function calculateAttemptScore(quizConfig, answersMap = {}) {
  const questions = quizConfig?.questions || [];
  const maxGrade = Number(quizConfig?.settings?.max_grade) || 10.0;

  if (questions.length === 0) {
    return {
      earnedPoints: 0,
      totalMaxPoints: 0,
      grade: 0,
      percentage: 0,
      questionResults: {}
    };
  }

  let totalEarnedPoints = 0;
  let totalMaxPoints = 0;
  const questionResults = {};

  questions.forEach((q) => {
    const selected = answersMap[q.id] || [];
    const res = calculateQuestionScore(q, selected);
    questionResults[q.id] = res;

    totalEarnedPoints += res.rawScore;
    totalMaxPoints += res.maxPoints;
  });

  const percentage = totalMaxPoints > 0 ? (totalEarnedPoints / totalMaxPoints) * 100 : 0;
  const grade = totalMaxPoints > 0 ? (totalEarnedPoints / totalMaxPoints) * maxGrade : 0;

  // Redondear a 2 decimales para UI / SCORM
  const roundedGrade = Math.round(grade * 100) / 100;
  const roundedPercentage = Math.round(percentage * 100) / 100;

  return {
    earnedPoints: Math.round(totalEarnedPoints * 100) / 100,
    totalMaxPoints: Math.round(totalMaxPoints * 100) / 100,
    grade: roundedGrade,
    percentage: roundedPercentage,
    questionResults
  };
}

/**
 * Calcula la nota final agregada a partir del historial de intentos y el método configurado.
 * Métodos: "HIGHEST_SCORE" | "AVERAGE" | "FIRST_ATTEMPT" | "LAST_ATTEMPT"
 */
export function calculateFinalGrade(attemptsHistory = [], settings = {}, userId = null) {
  let userAttempts = Array.isArray(attemptsHistory) ? attemptsHistory : [];

  if (userId) {
    userAttempts = userAttempts.filter((a) => !a.userId || a.userId === userId);
  }

  if (userAttempts.length === 0) {
    return { finalGrade: 0, isPassed: false };
  }

  const method = settings.grading_method || 'HIGHEST_SCORE';
  const passingGrade = Number(settings.passing_grade) !== undefined ? Number(settings.passing_grade) : 7.0;

  const grades = userAttempts.map((a) => Number(a.grade) || 0);

  let finalGrade = 0;

  switch (method) {
    case 'HIGHEST_SCORE':
      finalGrade = Math.max(...grades);
      break;
    case 'AVERAGE': {
      const sum = grades.reduce((acc, curr) => acc + curr, 0);
      finalGrade = sum / grades.length;
      break;
    }
    case 'FIRST_ATTEMPT':
      finalGrade = grades[0];
      break;
    case 'LAST_ATTEMPT':
      finalGrade = grades[grades.length - 1];
      break;
    default:
      finalGrade = Math.max(...grades);
      break;
  }

  finalGrade = Math.round(finalGrade * 100) / 100;
  const isPassed = finalGrade >= passingGrade;

  return {
    finalGrade,
    isPassed,
    method
  };
}

