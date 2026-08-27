import React from 'react';
import { useCourseStore } from '../../store/courseStore';
import { RefreshCw, Plus, Trash2 } from 'lucide-react';
import { nanoid } from 'nanoid';

export default function FlipCardBlock({ lessonId, block }) {
  const { updateBlock, deleteBlock } = useCourseStore();
  const content = block.content || { cards: [] };
  const cards = content.cards || [];

  const handleUpdateCards = (newCards) => {
    updateBlock(lessonId, block.id, { ...content, cards: newCards });
  };

  const handleAddCard = () => {
    const newCard = {
      id: nanoid(6),
      frontTitle: 'Término / Pregunta',
      backContent: 'Explicación o definición al voltear la tarjeta.'
    };
    handleUpdateCards([...cards, newCard]);
  };

  const handleRemoveCard = (id) => {
    handleUpdateCards(cards.filter((c) => c.id !== id));
  };

  const handleCardChange = (id, field, value) => {
    handleUpdateCards(
      cards.map((c) => (c.id === id ? { ...c, [field]: value } : c))
    );
  };

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-3 relative group">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2 text-xs font-bold text-slate-700">
          <RefreshCw size={14} className="text-[#f58220]" />
          <span>Objeto Didáctico: Tarjetas Volteables 3D (Flip Cards)</span>
        </div>
        <button
          onClick={() => deleteBlock(lessonId, block.id)}
          className="text-slate-400 hover:text-red-500 transition-colors p-1"
          title="Eliminar bloque"
        >
          <Trash2 size={14} />
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {cards.map((card, idx) => (
          <div key={card.id} className="bg-white border border-slate-200 rounded-lg p-3 space-y-2 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400">Tarjeta #{idx + 1}</span>
              <button
                onClick={() => handleRemoveCard(card.id)}
                className="text-slate-400 hover:text-red-500 p-1"
                title="Eliminar tarjeta"
              >
                <Trash2 size={13} />
              </button>
            </div>
            
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-slate-500">Cara Frontal (Título/Concepto)</label>
              <input
                type="text"
                className="w-full text-xs font-semibold p-1.5 border border-slate-300 rounded focus:outline-none focus:border-[#f58220]"
                placeholder="Frente: Concepto o Pregunta"
                value={card.frontTitle || ''}
                onChange={(e) => handleCardChange(card.id, 'frontTitle', e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-slate-500">Cara Posterior (Definición/Respuesta)</label>
              <textarea
                rows={2}
                className="w-full text-xs p-1.5 border border-slate-300 rounded focus:outline-none focus:border-[#f58220]"
                placeholder="Reverso: Explicación o Definición"
                value={card.backContent || ''}
                onChange={(e) => handleCardChange(card.id, 'backContent', e.target.value)}
              />
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={handleAddCard}
        className="text-xs font-semibold text-[#f58220] hover:text-orange-600 flex items-center space-x-1 pt-1 cursor-pointer"
      >
        <Plus size={13} />
        <span>Añadir tarjeta volteable</span>
      </button>
    </div>
  );
}
