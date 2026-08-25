// QuizRunner.jsx — Componente para responder la evaluación en el reproductor estudiante
import React, { useState } from 'react';

export default function QuizRunner({ assessment, onComplete, themeColor = '#f58220' }) {
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [passed, setPassed] = useState(false);

  const handleSelectOption = (questionId, optionId) => {
    if (submitted) return;
    setSelectedAnswers((prev) => ({ ...prev, [questionId]: optionId }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const questions = assessment.questions || [];
    if (questions.length === 0) return;

    let correctCount = 0;
    questions.forEach((q) => {
      if (selectedAnswers[q.id] === q.correctOptionId) {
        correctCount++;
      }
    });

    const finalScore = Math.round((correctCount / questions.length) * 100);
    const passThreshold = assessment.passScore ?? 70;
    const isPassed = finalScore >= passThreshold;

    setScore(finalScore);
    setPassed(isPassed);
    setSubmitted(true);
  };

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm space-y-6">
      <div className="border-b border-slate-100 pb-4">
        <h2 className="text-lg font-bold text-slate-800">{assessment.title}</h2>
        <p className="text-xs text-slate-500">Puntaje mínimo para aprobar: {assessment.passScore ?? 70}%</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {(assessment.questions || []).map((q, idx) => (
          <div key={q.id} className="space-y-3">
            <p className="text-xs sm:text-sm font-semibold text-slate-800">
              {idx + 1}. {q.text}
            </p>
            <div className="space-y-2">
              {q.options.map((opt) => {
                const isSelected = selectedAnswers[q.id] === opt.id;
                const isCorrect = q.correctOptionId === opt.id;

                let optionStyle = 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700';
                let customStyle = {};

                if (submitted) {
                  if (isCorrect) optionStyle = 'border-emerald-500 bg-emerald-50 text-emerald-900 font-medium';
                  else if (isSelected) optionStyle = 'border-rose-500 bg-rose-50 text-rose-900';
                } else if (isSelected) {
                  optionStyle = 'bg-slate-50 text-slate-900 font-medium border-2';
                  customStyle = { borderColor: themeColor };
                }

                return (
                  <label
                    key={opt.id}
                    onClick={() => handleSelectOption(q.id, opt.id)}
                    style={customStyle}
                    className={`flex items-center space-x-3 p-3 rounded-md border text-xs sm:text-sm cursor-pointer transition-all ${optionStyle}`}
                  >
                    <input
                      type="radio"
                      name={`question-${q.id}`}
                      checked={isSelected}
                      onChange={() => {}}
                      style={{ accentColor: themeColor }}
                    />
                    <span>{opt.text}</span>
                  </label>
                );
              })}
            </div>
          </div>
        ))}

        {!submitted ? (
          <button
            type="submit"
            style={{ backgroundColor: themeColor }}
            className="w-full text-white font-bold py-2.5 px-4 rounded text-xs tracking-wider uppercase transition-colors hover:brightness-105"
          >
            Enviar Evaluación
          </button>
        ) : (
          <div className="p-4 rounded-md text-center space-y-3 bg-slate-50 border border-slate-200">
            <p className={`text-base font-extrabold ${passed ? 'text-emerald-600' : 'text-rose-600'}`}>
              Resultado: {score}% — {passed ? '¡Aprobado!' : 'No Aprobado'}
            </p>
            <button
              type="button"
              onClick={onComplete}
              style={{ backgroundColor: themeColor }}
              className="text-white font-bold py-2 px-6 rounded text-xs tracking-wider uppercase hover:brightness-105"
            >
              Continuar al siguiente paso
            </button>
          </div>
        )}
      </form>
    </div>
  );
}
