// scoring.test.js — Pruebas unitarias para el motor de calificación y parsers de evaluación

import assert from 'assert';
import { calculateQuestionScore, calculateAttemptScore, calculateFinalGrade } from './scoring.js';
import { parseGIFT, parseQuizJSON } from './giftParser.js';

console.log('--- RUNNING QUIZ SUBSYSTEM UNIT TESTS ---');

// TEST 1: Cálculo exacto de preguntas con 3 opciones correctas fraccionadas (33.3333% cada una)
{
  const qFractional = {
    id: 'q_frac',
    points: 10,
    options: [
      { id: 'o1', text: 'Op 1', weight_percentage: 33.3333 },
      { id: 'o2', text: 'Op 2', weight_percentage: 33.3333 },
      { id: 'o3', text: 'Op 3', weight_percentage: 33.3334 },
      { id: 'o4', text: 'Mal', weight_percentage: -50 }
    ]
  };

  const res3Options = calculateQuestionScore(qFractional, ['o1', 'o2', 'o3']);
  assert.strictEqual(res3Options.percentage, 100, '3 opciones de 33.3333% deben sumar 100%');
  assert.strictEqual(res3Options.rawScore, 10, 'El puntaje debe ser 10 de 10 puntos');

  const res2Options = calculateQuestionScore(qFractional, ['o1', 'o2']);
  assert.strictEqual(res2Options.percentage, 66.67, '2 opciones deben dar ~66.67%');
  assert.strictEqual(res2Options.rawScore, 6.6667, 'Puntaje proporcional correcto');
  console.log('✓ Test 1 Passed: Puntaje fraccionado 33.33% exacto');
}

// TEST 2: Prevención de notas negativas ante selecciones erróneas con penalización
{
  const qPenalized = {
    id: 'q_pen',
    points: 5,
    options: [
      { id: 'o1', text: 'Buena', weight_percentage: 20 },
      { id: 'o2', text: 'Mala 1', weight_percentage: -50 },
      { id: 'o3', text: 'Mala 2', weight_percentage: -100 }
    ]
  };

  const resPenalized = calculateQuestionScore(qPenalized, ['o2', 'o3']);
  assert.strictEqual(resPenalized.percentage, 0, 'Porcentaje no debe ser menor a 0%');
  assert.strictEqual(resPenalized.rawScore, 0, 'Puntaje neto no debe ser menor a 0');

  const resMixed = calculateQuestionScore(qPenalized, ['o1', 'o2']); // +20 - 50 = -30 -> 0
  assert.strictEqual(resMixed.percentage, 0, 'Total negativo debe sujetarse a 0');
  console.log('✓ Test 2 Passed: Prevención de notas negativas');
}

// TEST 3: Correcto cálculo de calificación final bajo método "Calificación más alta" e "Historial"
{
  const settingsHighest = { grading_method: 'HIGHEST_SCORE', passing_grade: 7.0 };
  const settingsAverage = { grading_method: 'AVERAGE', passing_grade: 7.0 };
  const settingsFirst = { grading_method: 'FIRST_ATTEMPT', passing_grade: 7.0 };
  const settingsLast = { grading_method: 'LAST_ATTEMPT', passing_grade: 7.0 };

  const attempts = [
    { grade: 4.5 },
    { grade: 9.0 },
    { grade: 6.0 }
  ];

  const resHighest = calculateFinalGrade(attempts, settingsHighest);
  assert.strictEqual(resHighest.finalGrade, 9.0, 'Calificación más alta debe ser 9.0');
  assert.strictEqual(resHighest.isPassed, true, '9.0 debe ser aprobado (>= 7.0)');

  const resAvg = calculateFinalGrade(attempts, settingsAverage);
  assert.strictEqual(resAvg.finalGrade, 6.5, 'Promedio debe ser 6.5');
  assert.strictEqual(resAvg.isPassed, false, '6.5 debe ser reprobado (< 7.0)');

  const resFirst = calculateFinalGrade(attempts, settingsFirst);
  assert.strictEqual(resFirst.finalGrade, 4.5, 'Primer intento debe ser 4.5');

  const resLast = calculateFinalGrade(attempts, settingsLast);
  assert.strictEqual(resLast.finalGrade, 6.0, 'Último intento debe ser 6.0');

  console.log('✓ Test 3 Passed: Métodos de calificación acumulada (Highest, Average, First, Last)');
}

// TEST 4: GIFT Parser
{
  const giftSample = `
::Q1:: Pregunta Simple {=Correcta ~Incorrecta1 ~Incorrecta2}

::Q2:: Pregunta Fraccionada {~%33.3333%Op1 ~%33.3333%Op2 ~%33.3334%Op3 ~%-50%Mal1}

::Q3:: Enunciado Verdadero Falso {T}
`;

  const parsedQuestions = parseGIFT(giftSample);
  assert.strictEqual(parsedQuestions.length, 3, 'Debe parsear 3 preguntas GIFT');
  assert.strictEqual(parsedQuestions[0].text, 'Pregunta Simple');
  assert.strictEqual(parsedQuestions[0].options.find(o => o.text === 'Correcta').weight_percentage, 100);
  assert.strictEqual(parsedQuestions[1].options.length, 4);
  assert.strictEqual(parsedQuestions[1].options[0].weight_percentage, 33.3333);
  assert.strictEqual(parsedQuestions[2].type, 'true_false');

  console.log('✓ Test 4 Passed: Parser GIFT de Moodle correctamente verificado');
}

// TEST 5: Verificación de pertenencia de usuario en calificaciones e intentos
{
  const settings = { grading_method: 'HIGHEST_SCORE', passing_grade: 7.0 };

  const attemptsMixedUsers = [
    { userId: 'user_123', grade: 4.0 },
    { userId: 'user_456', grade: 10.0 }, // Intento de otro usuario
    { userId: 'user_123', grade: 8.5 }
  ];

  // Para user_123, la nota más alta debe ser 8.5 (ignorando el 10.0 de user_456)
  const resUser123 = calculateFinalGrade(attemptsMixedUsers, settings, 'user_123');
  assert.strictEqual(resUser123.finalGrade, 8.5, 'La nota más alta de user_123 debe ser 8.5');
  assert.strictEqual(resUser123.isPassed, true);

  // Para user_456, la nota debe ser 10.0
  const resUser456 = calculateFinalGrade(attemptsMixedUsers, settings, 'user_456');
  assert.strictEqual(resUser456.finalGrade, 10.0, 'La nota de user_456 debe ser 10.0');

  // Para un usuario nuevo user_789 sin intentos, debe dar 0
  const resUser789 = calculateFinalGrade(attemptsMixedUsers, settings, 'user_789');
  assert.strictEqual(resUser789.finalGrade, 0, 'Usuario sin intentos debe tener nota 0');
  assert.strictEqual(resUser789.isPassed, false);

  console.log('✓ Test 5 Passed: Verificación de pertenencia y aislamiento de intentos por usuario');
}

console.log('--- ALL QUIZ UNIT TESTS PASSED SUCCESSFULLY ---');

