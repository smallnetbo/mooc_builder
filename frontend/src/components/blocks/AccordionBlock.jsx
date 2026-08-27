import React from 'react';
import { useCourseStore } from '../../store/courseStore';
import { ChevronDown, Plus, Trash2, Layers } from 'lucide-react';
import { nanoid } from 'nanoid';

export default function AccordionBlock({ lessonId, block }) {
  const { updateBlock, deleteBlock } = useCourseStore();
  const content = block.content || { items: [] };
  const items = content.items || [];

  const handleUpdateItems = (newItems) => {
    updateBlock(lessonId, block.id, { ...content, items: newItems });
  };

  const handleAddItem = () => {
    const newItem = {
      id: nanoid(6),
      title: `Sección ${items.length + 1}`,
      content: 'Escriba aquí el contenido detallado de esta sección.'
    };
    handleUpdateItems([...items, newItem]);
  };

  const handleRemoveItem = (id) => {
    handleUpdateItems(items.filter((it) => it.id !== id));
  };

  const handleItemChange = (id, field, value) => {
    handleUpdateItems(
      items.map((it) => (it.id === id ? { ...it, [field]: value } : it))
    );
  };

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-3 relative group">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2 text-xs font-bold text-slate-700">
          <Layers size={14} className="text-[#f58220]" />
          <span>Objeto Didáctico: Acordeón Desplegable</span>
        </div>
        <button
          onClick={() => deleteBlock(lessonId, block.id)}
          className="text-slate-400 hover:text-red-500 transition-colors p-1"
          title="Eliminar bloque"
        >
          <Trash2 size={14} />
        </button>
      </div>

      <div className="space-y-3">
        {items.map((item, idx) => (
          <div key={item.id} className="bg-white border border-slate-200 rounded-lg p-3 space-y-2 shadow-xs">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold text-slate-400">#{idx + 1}</span>
              <input
                type="text"
                className="flex-1 text-xs font-semibold p-1.5 border border-slate-300 rounded focus:outline-none focus:border-[#f58220]"
                placeholder="Título del ítem desplegable"
                value={item.title || ''}
                onChange={(e) => handleItemChange(item.id, 'title', e.target.value)}
              />
              <button
                onClick={() => handleRemoveItem(item.id)}
                className="text-slate-400 hover:text-red-500 p-1"
                title="Eliminar ítem"
              >
                <Trash2 size={13} />
              </button>
            </div>
            <textarea
              rows={2}
              className="w-full text-xs p-2 border border-slate-300 rounded focus:outline-none focus:border-[#f58220]"
              placeholder="Contenido explicativo desplegable..."
              value={item.content || ''}
              onChange={(e) => handleItemChange(item.id, 'content', e.target.value)}
            />
          </div>
        ))}
      </div>

      <button
        onClick={handleAddItem}
        className="text-xs font-semibold text-[#f58220] hover:text-orange-600 flex items-center space-x-1 pt-1 cursor-pointer"
      >
        <Plus size={13} />
        <span>Añadir ítem al acordeón</span>
      </button>
    </div>
  );
}
