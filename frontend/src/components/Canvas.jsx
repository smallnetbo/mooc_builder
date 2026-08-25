// Canvas.jsx — Área central de edición WYSIWYG de lección/evaluación
import React from 'react';
import { useCourseStore } from '../store/courseStore';
import TextBlock from './blocks/TextBlock';
import VideoBlock from './blocks/VideoBlock';
import QuizBuilder from './QuizBuilder';
import { Quote, Plus, Image as ImageIcon } from 'lucide-react';

function findLesson(course, lessonId) {
  for (const m of course.modules) {
    for (const t of m.children) {
      for (const n of t.children) {
        if (n.id === lessonId) return n;
      }
    }
  }
  return null;
}

const BLOCK_COMPONENTS = { text: TextBlock, video: VideoBlock };

export default function Canvas() {
  const { course, selectedLessonId, addBlock, updateLessonQuote } = useCourseStore();
  const node = selectedLessonId ? findLesson(course, selectedLessonId) : null;

  if (!node) {
    return (
      <main className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8">
        <p className="text-sm font-medium">Selecciona una lección o evaluación en el árbol lateral</p>
      </main>
    );
  }

  if (node.type === 'assessment') return <QuizBuilder assessment={node} />;

  return (
    <main className="flex-1 p-6 overflow-y-auto bg-white max-w-4xl mx-auto w-full">
      <div className="border-b border-slate-200 pb-4 mb-6">
        <h1 className="text-xl font-bold text-slate-800">{node.title}</h1>
        <p className="text-xs font-semibold text-slate-400 tracking-wider uppercase mt-1">
          {node.subtitle || 'ELEMENTO DEL MÓDULO'}
        </p>
      </div>

      {/* Editor de Banner Hero de Cita Resaltada (Captura 2) */}
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 mb-6 space-y-3">
        <div className="flex items-center space-x-2 text-xs font-bold text-slate-700">
          <Quote size={14} className="text-[#f58220]" />
          <span>Banner de Cita Resaltada (Hero Quote Card)</span>
        </div>

        <div className="space-y-2 text-xs">
          <textarea
            rows={2}
            className="w-full p-2 border border-slate-300 rounded bg-white focus:outline-none focus:border-[#f58220]"
            placeholder="Texto resaltado en la carta hero (ej: La gestión financiera hace referencia al proceso...)"
            value={node.quoteBanner?.text || ''}
            onChange={(e) => updateLessonQuote(node.id, { text: e.target.value })}
          />
          <div className="flex items-center space-x-2">
            <ImageIcon size={14} className="text-slate-400 shrink-0" />
            <input
              type="text"
              className="w-full p-1.5 border border-slate-300 rounded bg-white text-xs focus:outline-none focus:border-[#f58220]"
              placeholder="URL Imagen de fondo para el banner de cita"
              value={node.quoteBanner?.bgImage || ''}
              onChange={(e) => updateLessonQuote(node.id, { bgImage: e.target.value })}
            />
          </div>
        </div>
      </div>

      {/* Bloques de Contenido */}
      <div className="space-y-4">
        {node.blocks.map((block) => {
          const Block = BLOCK_COMPONENTS[block.kind];
          return Block ? <Block key={block.id} lessonId={node.id} block={block} /> : null;
        })}
      </div>

      <div className="flex gap-2 mt-6 pt-4 border-t border-slate-100">
        <button
          onClick={() => addBlock(node.id, 'text')}
          className="text-xs font-semibold px-3 py-2 rounded border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 flex items-center space-x-1 cursor-pointer"
        >
          <Plus size={13} />
          <span>Añadir Texto</span>
        </button>
        <button
          onClick={() => addBlock(node.id, 'video')}
          className="text-xs font-semibold px-3 py-2 rounded border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 flex items-center space-x-1 cursor-pointer"
        >
          <Plus size={13} />
          <span>Añadir Video</span>
        </button>
      </div>
    </main>
  );
}
