// Canvas.jsx — Área central de edición WYSIWYG de lección/evaluación
import React from 'react';
import { useCourseStore } from '../store/courseStore';
import TextBlock from './blocks/TextBlock';
import VideoBlock from './blocks/VideoBlock';
import AccordionBlock from './blocks/AccordionBlock';
import FlipCardBlock from './blocks/FlipCardBlock';
import TimelineBlock from './blocks/TimelineBlock';
import CalloutBlock from './blocks/CalloutBlock';
import GalleryBlock from './blocks/GalleryBlock';
import ResourceBlock from './blocks/ResourceBlock';
import KnowledgeCheckBlock from './blocks/KnowledgeCheckBlock';
import QuizBuilder from './QuizBuilder';
import {
  Quote,
  Plus,
  Image as ImageIcon,
  Type,
  Video,
  Layers,
  RefreshCw,
  GitCommit,
  AlertCircle,
  Download,
  HelpCircle
} from 'lucide-react';

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

const BLOCK_COMPONENTS = {
  text: TextBlock,
  video: VideoBlock,
  accordion: AccordionBlock,
  flipcard: FlipCardBlock,
  timeline: TimelineBlock,
  callout: CalloutBlock,
  gallery: GalleryBlock,
  resource: ResourceBlock,
  knowledge_check: KnowledgeCheckBlock
};

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

      {/* BARRA DE HERRAMIENTAS DE BLOQUES INTERACTIVOS (AGREGAR OBJETOS DIDÁCTICOS) */}
      <div className="mt-8 pt-4 border-t border-slate-200 space-y-2">
        <label className="text-xs font-bold text-slate-600 block uppercase tracking-wider">
          + Añadir Objeto Didáctico o Interactivo a la Lección
        </label>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => addBlock(node.id, 'text')}
            className="text-xs font-semibold px-3 py-2 rounded border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 flex items-center space-x-1.5 cursor-pointer shadow-2xs transition-colors"
          >
            <Type size={13} className="text-indigo-600" />
            <span>Texto</span>
          </button>

          <button
            onClick={() => addBlock(node.id, 'video')}
            className="text-xs font-semibold px-3 py-2 rounded border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 flex items-center space-x-1.5 cursor-pointer shadow-2xs transition-colors"
          >
            <Video size={13} className="text-red-500" />
            <span>Video</span>
          </button>

          <button
            onClick={() => addBlock(node.id, 'accordion')}
            className="text-xs font-semibold px-3 py-2 rounded border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 flex items-center space-x-1.5 cursor-pointer shadow-2xs transition-colors"
          >
            <Layers size={13} className="text-[#f58220]" />
            <span>Acordeón</span>
          </button>

          <button
            onClick={() => addBlock(node.id, 'flipcard')}
            className="text-xs font-semibold px-3 py-2 rounded border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 flex items-center space-x-1.5 cursor-pointer shadow-2xs transition-colors"
          >
            <RefreshCw size={13} className="text-purple-600" />
            <span>Tarjetas 3D</span>
          </button>

          <button
            onClick={() => addBlock(node.id, 'timeline')}
            className="text-xs font-semibold px-3 py-2 rounded border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 flex items-center space-x-1.5 cursor-pointer shadow-2xs transition-colors"
          >
            <GitCommit size={13} className="text-blue-600" />
            <span>Línea de Tiempo</span>
          </button>

          <button
            onClick={() => addBlock(node.id, 'callout')}
            className="text-xs font-semibold px-3 py-2 rounded border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 flex items-center space-x-1.5 cursor-pointer shadow-2xs transition-colors"
          >
            <AlertCircle size={13} className="text-amber-500" />
            <span>Caja Destacada</span>
          </button>

          <button
            onClick={() => addBlock(node.id, 'gallery')}
            className="text-xs font-semibold px-3 py-2 rounded border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 flex items-center space-x-1.5 cursor-pointer shadow-2xs transition-colors"
          >
            <ImageIcon size={13} className="text-emerald-600" />
            <span>Galería</span>
          </button>

          <button
            onClick={() => addBlock(node.id, 'resource')}
            className="text-xs font-semibold px-3 py-2 rounded border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 flex items-center space-x-1.5 cursor-pointer shadow-2xs transition-colors"
          >
            <Download size={13} className="text-cyan-600" />
            <span>Recurso / PDF</span>
          </button>

          <button
            onClick={() => addBlock(node.id, 'knowledge_check')}
            className="text-xs font-semibold px-3 py-2 rounded border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 flex items-center space-x-1.5 cursor-pointer shadow-2xs transition-colors"
          >
            <HelpCircle size={13} className="text-pink-600" />
            <span>Trivia Rápida</span>
          </button>
        </div>
      </div>
    </main>
  );
}
