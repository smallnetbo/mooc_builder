// TreeEditor.jsx — Panel lateral: Módulos > Temas > Lecciones/Evaluaciones
// Usa @dnd-kit/core + @dnd-kit/sortable para reordenar nodos por nivel.
//
// IMPORTANTE: los `listeners` de useSortable() van SOLO en el ícono de
// "agarre" (⠿), nunca en el contenedor completo de la fila. Si se aplican
// al div completo, capturan el pointerdown de los botones internos
// (+ Tema, + Lección) y el click nunca llega a dispararse.
import React from 'react';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useCourseStore } from '../store/courseStore';

function SortableNode({ id, children }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };
  // children es una función que recibe (dragHandleProps) para que el consumidor
  // decida exactamente dónde poner el handle, sin envolver botones/inputs.
  return (
    <div ref={setNodeRef} style={style}>
      {children({ ...attributes, ...listeners })}
    </div>
  );
}

function DragHandle(props) {
  return (
    <span {...props} className="cursor-grab select-none text-slate-400 hover:text-slate-600 px-1" title="Arrastrar para reordenar">
      ⠿
    </span>
  );
}

export default function TreeEditor() {
  const {
    course,
    addModule,
    deleteModule,
    addTopic,
    deleteTopic,
    addLessonOrAssessment,
    deleteLessonOrAssessment,
    selectModule,
    selectLesson,
    moveNode,
    selectedLessonId,
    selectedModuleId
  } = useCourseStore();

  // distance:8 evita que un simple click se interprete como inicio de drag.
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const handleDragEnd = (path) => (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const siblings = resolveSiblings(course, path);
    const fromIndex = siblings.findIndex((n) => n.id === active.id);
    const toIndex = siblings.findIndex((n) => n.id === over.id);
    moveNode(path, fromIndex, toIndex);
  };

  return (
    <aside className="w-72 border-r border-slate-200 h-full overflow-y-auto bg-slate-50 p-3">
      <div className="flex items-center justify-between mb-2">
        <h2 className="font-semibold text-sm text-slate-700">Estructura del curso</h2>
        <button onClick={() => addModule('Nuevo módulo')} className="text-xs px-2 py-1 rounded bg-indigo-600 text-white cursor-pointer hover:bg-indigo-700 font-semibold">+ Módulo</button>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd([])}>
        <SortableContext items={course.modules.map((m) => m.id)} strategy={verticalListSortingStrategy}>
          {course.modules.map((module) => (
            <SortableNode key={module.id} id={module.id}>
              {(dragHandleProps) => (
                <div className="mb-2">
                  <div
                    onClick={() => selectModule(module.id)}
                    className={`flex items-center justify-between font-medium text-sm py-1.5 px-2 rounded cursor-pointer transition-colors ${
                      selectedModuleId === module.id
                        ? 'bg-indigo-100 text-indigo-900 font-bold border-l-4 border-indigo-600 shadow-2xs'
                        : 'hover:bg-slate-200/70 text-slate-700'
                    }`}
                  >
                    <span className="flex items-center pr-1 truncate">
                      <DragHandle {...dragHandleProps} />
                      <span className="truncate">📦 {module.number ? `${module.number}: ` : ''}{module.title}</span>
                    </span>
                    <div className="flex items-center space-x-1 shrink-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          addTopic(module.id, 'Nuevo tema');
                        }}
                        className="text-xs text-indigo-600 hover:text-indigo-800 cursor-pointer font-semibold"
                        title="Agregar tema a este módulo"
                      >
                        + Tema
                      </button>
                      {course.modules.length > 1 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm(`¿Eliminar ${module.title}?`)) deleteModule(module.id);
                          }}
                          className="text-xs text-rose-500 hover:text-rose-700 px-1 cursor-pointer font-bold"
                          title="Eliminar módulo"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </div>

                  <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd([module.id])}>
                    <SortableContext items={module.children.map((t) => t.id)} strategy={verticalListSortingStrategy}>
                      {module.children.map((topic) => (
                        <SortableNode key={topic.id} id={topic.id}>
                          {(topicHandleProps) => (
                            <div className="ml-3 mb-1">
                              <div className="flex items-center justify-between text-xs font-semibold py-1 px-1 text-slate-600">
                                <span className="flex items-center truncate">
                                  <DragHandle {...topicHandleProps} />
                                  <span className="truncate">📁 {topic.title}</span>
                                </span>
                                <div className="flex items-center space-x-1 shrink-0">
                                  <button onClick={() => addLessonOrAssessment(module.id, topic.id, 'lesson')} className="text-xs text-indigo-600 hover:underline">+ Lección</button>
                                  <button onClick={() => addLessonOrAssessment(module.id, topic.id, 'assessment')} className="text-xs text-emerald-600 hover:underline">+ Eval.</button>
                                  <button
                                    onClick={() => {
                                      if (confirm(`¿Eliminar tema ${topic.title}?`)) deleteTopic(module.id, topic.id);
                                    }}
                                    className="text-xs text-rose-400 hover:text-rose-600 px-0.5"
                                    title="Eliminar tema"
                                  >
                                    ✕
                                  </button>
                                </div>
                              </div>
                              {topic.children.map((node) => (
                                <div
                                  key={node.id}
                                  onClick={() => selectLesson(node.id)}
                                  className={`ml-5 text-xs py-1 px-2 rounded cursor-pointer flex items-center justify-between transition-colors ${
                                    selectedLessonId === node.id ? 'bg-indigo-100 text-indigo-900 font-bold' : 'hover:bg-slate-200/50 text-slate-700'
                                  }`}
                                >
                                  <span className="truncate pr-1">
                                    {node.type === 'lesson' ? '📄' : '✅'} {node.title}
                                  </span>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      deleteLessonOrAssessment(node.id);
                                    }}
                                    className="text-slate-400 hover:text-rose-600 text-[10px] px-1"
                                    title="Eliminar lección"
                                  >
                                    ✕
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </SortableNode>
                      ))}
                    </SortableContext>
                  </DndContext>
                </div>
              )}
            </SortableNode>
          ))}
        </SortableContext>
      </DndContext>
    </aside>
  );
}

function resolveSiblings(course, path) {
  let arr = course.modules;
  for (const id of path) arr = arr.find((n) => n.id === id).children;
  return arr;
}
