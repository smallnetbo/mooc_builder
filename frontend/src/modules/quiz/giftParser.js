// giftParser.js — Parsers para importar preguntas en formato GIFT (Moodle), JSON y Markdown

import { nanoid } from 'nanoid';

/**
 * Parsea texto en formato GIFT de Moodle a la estructura de preguntas del sistema.
 * Soporta:
 * - Título opcional: ::Título::
 * - Opción múltiple simple: {=Correcta ~Incorrecta1 ~Incorrecta2}
 * - Opción múltiple fraccionada: {~%33.3333%Op1 ~%33.3333%Op2 ~%33.3334%Op3 ~%-50%Mal1}
 * - Verdadero / Falso: {T} o {F} o {TRUE} o {FALSE}
 */
export function parseGIFT(giftText = '') {
  if (typeof giftText !== 'string' || !giftText.trim()) return [];

  const rawBlocks = giftText
    .split(/\n\s*\n/)
    .map((b) => b.trim())
    .filter((b) => b && !b.startsWith('//'));

  const questions = [];

  rawBlocks.forEach((block) => {
    // Extraer título ::Título:: si existe
    let title = '';
    let body = block;

    const titleMatch = block.match(/^::([^:]+)::\s*(.*)/s);
    if (titleMatch) {
      title = titleMatch[1].trim();
      body = titleMatch[2].trim();
    }

    // Extraer bloque entre llaves {...}
    const braceMatch = body.match(/^(.*?)\{([^}]+)\}(.*)$/s);
    if (!braceMatch) return;

    const questionText = (braceMatch[1] + (braceMatch[3] || '')).trim().replace(/\s+/g, ' ');
    const answerBlock = braceMatch[2].trim();

    if (!questionText) return;

    // Verificar si es Verdadero/Falso: {T}, {F}, {TRUE}, {FALSE}
    const tfMatch = answerBlock.match(/^(T|F|TRUE|FALSE)(#.*)?$/i);
    if (tfMatch) {
      const val = tfMatch[1].toUpperCase();
      const isTrue = val === 'T' || val === 'TRUE';

      questions.push({
        id: 'q_' + nanoid(6),
        text: questionText,
        type: 'true_false',
        points: 1,
        feedback: '',
        options: [
          { id: 'o_' + nanoid(4), text: 'Verdadero', weight_percentage: isTrue ? 100 : 0, is_correct: isTrue },
          { id: 'o_' + nanoid(4), text: 'Falso', weight_percentage: !isTrue ? 100 : 0, is_correct: !isTrue }
        ]
      });
      return;
    }

    // Parsear opciones múltiples (=, ~)
    const optionTokens = answerBlock.split(/(?=[=~])/);
    const options = [];

    optionTokens.forEach((tok) => {
      const trimmedTok = tok.trim();
      if (!trimmedTok) return;

      const isEqual = trimmedTok.startsWith('=');
      const isTilde = trimmedTok.startsWith('~');

      if (!isEqual && !isTilde) return;

      const content = trimmedTok.slice(1).trim();

      // Verificar si tiene porcentaje: %33.3333% o %-50%
      let weight = isEqual ? 100 : 0;
      let optionText = content;

      const weightMatch = content.match(/^%(-?\d+(?:\.\d+)?)%\s*(.*)/);
      if (weightMatch) {
        weight = parseFloat(weightMatch[1]);
        optionText = weightMatch[2].trim();
      }

      // Feedback opcional de opción #Feedback
      let feedback = '';
      const fbMatch = optionText.match(/^(.*?)\#(.*)$/);
      if (fbMatch) {
        optionText = fbMatch[1].trim();
        feedback = fbMatch[2].trim();
      }

      options.push({
        id: 'o_' + nanoid(4),
        text: optionText,
        weight_percentage: weight,
        is_correct: weight > 0,
        feedback
      });
    });

    if (options.length > 0) {
      const isMultiChoice = options.filter((o) => o.weight_percentage > 0).length > 1;
      questions.push({
        id: 'q_' + nanoid(6),
        text: questionText,
        type: isMultiChoice ? 'multiple_choice' : 'single_choice',
        points: 1,
        feedback: '',
        options
      });
    }
  });

  return questions;
}

/**
 * Parsea un archivo JSON nativo estructurado de preguntas.
 */
export function parseQuizJSON(jsonText = '') {
  try {
    const data = JSON.parse(jsonText);
    const questionsArray = Array.isArray(data) ? data : (Array.isArray(data.questions) ? data.questions : []);

    return questionsArray.map((q, idx) => ({
      id: q.id || 'q_' + nanoid(6),
      text: q.text || q.question || `Pregunta ${idx + 1}`,
      type: q.type || 'single_choice',
      points: Number(q.points) || 1,
      feedback: q.feedback || '',
      options: (q.options || []).map((o, oIdx) => ({
        id: o.id || 'o_' + nanoid(4),
        text: o.text || `Opción ${oIdx + 1}`,
        weight_percentage: o.weight_percentage !== undefined ? Number(o.weight_percentage) : (o.is_correct || o.isCorrect ? 100 : 0),
        is_correct: Boolean(o.is_correct || o.isCorrect || (o.weight_percentage > 0)),
        feedback: o.feedback || ''
      }))
    }));
  } catch (e) {
    throw new Error('Formato JSON de preguntas inválido: ' + e.message);
  }
}

/**
 * Parsea un documento Markdown con preguntas estilo lista:
 * # Pregunta
 * - [x] Opción correcta
 * - [ ] Opción incorrecta
 */
export function parseQuizMarkdown(mdText = '') {
  if (typeof mdText !== 'string' || !mdText.trim()) return [];

  const lines = mdText.split('\n');
  const questions = [];
  let currentQ = null;

  lines.forEach((line) => {
    const trimmed = line.trim();
    if (trimmed.startsWith('#') || trimmed.startsWith('Q:') || trimmed.match(/^\d+\.\s+/)) {
      if (currentQ && currentQ.options.length > 0) {
        questions.push(currentQ);
      }
      const text = trimmed.replace(/^#+\s*/, '').replace(/^Q:\s*/, '').replace(/^\d+\.\s*/, '').trim();
      currentQ = {
        id: 'q_' + nanoid(6),
        text,
        type: 'single_choice',
        points: 1,
        feedback: '',
        options: []
      };
    } else if (currentQ && (trimmed.startsWith('- [') || trimmed.startsWith('* ['))) {
      const isChecked = trimmed.includes('[x]') || trimmed.includes('[X]');
      const optText = trimmed.replace(/^[-*]\s*\[[ xX]\]\s*/, '').trim();
      currentQ.options.push({
        id: 'o_' + nanoid(4),
        text: optText,
        weight_percentage: isChecked ? 100 : 0,
        is_correct: isChecked,
        feedback: ''
      });
    }
  });

  if (currentQ && currentQ.options.length > 0) {
    questions.push(currentQ);
  }

  return questions.map((q) => ({
    ...q,
    type: q.options.filter((o) => o.is_correct).length > 1 ? 'multiple_choice' : 'single_choice'
  }));
}
