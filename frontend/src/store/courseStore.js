// courseStore.js — Fuente única de verdad del curso y reproductor MOOC UI/UX.
import { create } from 'zustand';
import { nanoid } from 'nanoid';

const initialCourse = {
  id: 'course-mooc-1',
  title: 'Gestión Financiera para MyPEs',
  modules: [
    {
      id: 'mod-1',
      number: 'Módulo 1',
      title: 'Gestión empresarial',
      primaryColor: '#e11d48', // Rojo (Capturas 1 y 2 del usuario)
      coverImage: 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?q=80&w=1600&auto=format&fit=crop',
      objective: 'La gestión empresarial en las Micro y pequeñas empresas (MyPE) permitirá dirigir estratégicamente el rumbo de la empresa hacia el crecimiento, la sostenibilidad y el cumplimiento de los objetivos empresariales.',
      children: [
        {
          id: 'topic-m1',
          type: 'topic',
          title: 'Unidad Principal',
          children: [
            {
              id: 'm1-l1',
              type: 'lesson',
              title: 'Introducción',
              subtitle: 'ELEMENTO 1 DE 5',
              quoteBanner: {
                text: 'La gestión empresarial en las Micro y pequeñas empresas (MyPE) permitirá dirigir estratégicamente el rumbo de la empresa hacia el crecimiento, la sostenibilidad y el cumplimiento de los objetivos empresariales.',
                bgImage: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=1600&auto=format&fit=crop'
              },
              blocks: [
                {
                  id: 'm1-b1',
                  kind: 'text',
                  content: 'Le invitamos a analizar el siguiente video para profundizar en la gestión empresarial de las MyPE:'
                },
                {
                  id: 'm1-b2',
                  kind: 'video',
                  content: {
                    url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
                    caption: 'Video explicativo: Gestión Empresarial'
                  }
                }
              ]
            },
            {
              id: 'm1-l2',
              type: 'lesson',
              title: 'Elementos de la gestión empresarial',
              subtitle: 'ELEMENTO 2 DE 5',
              blocks: [{ id: 'b-m1-2', kind: 'text', content: 'Conozca los pilares fundamentales de la gestión empresarial.' }]
            },
            {
              id: 'm1-l3',
              type: 'lesson',
              title: 'Actividad',
              subtitle: 'ELEMENTO 3 DE 5',
              blocks: [{ id: 'b-m1-3', kind: 'text', content: 'Desarrolle el ejercicio práctico de análisis empresarial.' }]
            },
            {
              id: 'm1-l4',
              type: 'assessment',
              title: 'Evaluación',
              subtitle: 'ELEMENTO 4 DE 5',
              passScore: 70,
              questions: []
            },
            {
              id: 'm1-l5',
              type: 'lesson',
              title: 'Mensaje final',
              subtitle: 'ELEMENTO 5 DE 5',
              blocks: [{ id: 'b-m1-5', kind: 'text', content: 'Mensaje de cierre del módulo 1.' }]
            }
          ]
        }
      ]
    },
    {
      id: 'mod-2',
      number: 'Módulo 2',
      title: '¿Qué es la gestión financiera?',
      primaryColor: '#f58220', // Naranja
      coverImage: 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?q=80&w=1600&auto=format&fit=crop',
      objective: 'Comprender los conceptos fundamentales de la gestión financiera, reconociendo su importancia en la planeación, organización, dirección y control de los recursos financieros de una empresa.',
      children: [
        {
          id: 'topic-1',
          type: 'topic',
          title: 'Unidad Principal',
          children: [
            {
              id: 'les-1',
              type: 'lesson',
              title: 'Introducción',
              subtitle: 'ELEMENTO 1 DE 5',
              quoteBanner: {
                text: 'La gestión financiera hace referencia al proceso de planeación, organización, dirección y control de los recursos financieros de una empresa.',
                bgImage: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=1600&auto=format&fit=crop'
              },
              blocks: [
                {
                  id: 'b1',
                  kind: 'text',
                  content: 'Analice el siguiente video para que conozca más sobre la gestión financiera de las MyPE:'
                },
                {
                  id: 'b2',
                  kind: 'video',
                  content: {
                    url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
                    caption: 'Video explicativo: Introducción a la gestión financiera'
                  }
                }
              ]
            },
            {
              id: 'les-2',
              type: 'lesson',
              title: 'Elementos de la gestión financiera',
              subtitle: 'ELEMENTO 2 DE 5',
              quoteBanner: {
                text: 'El presupuesto, el flujo de caja y la estructura de costos son los cimientos esenciales de toda gestión financiera sostenible.',
                bgImage: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=1600&auto=format&fit=crop'
              },
              blocks: [
                {
                  id: 'b3',
                  kind: 'text',
                  content: 'Para lograr una adecuada gestión financiera es indispensable categorizar los ingresos fijos y variables, controlar los costos operativos y anticipar contingencias mediante un fondo de reserva.'
                }
              ]
            },
            {
              id: 'les-3',
              type: 'lesson',
              title: 'Actividad',
              subtitle: 'ELEMENTO 3 DE 5',
              quoteBanner: {
                text: 'Pon a prueba tus habilidades identificando el equilibrio financiero en un caso de estudio real de una MyPE.',
                bgImage: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?q=80&w=1600&auto=format&fit=crop'
              },
              blocks: [
                {
                  id: 'b4',
                  kind: 'text',
                  content: 'Lea detalladamente el enunciado a continuación y prepare su propuesta de flujo de caja para el próximo trimestre.'
                }
              ]
            },
            {
              id: 'les-4',
              type: 'assessment',
              title: 'Evaluación',
              subtitle: 'ELEMENTO 4 DE 5',
              passScore: 70,
              questions: [
                {
                  id: 'q1',
                  text: '¿Cuál es la función principal del flujo de caja en una MyPE?',
                  options: [
                    { id: 'o1', text: 'Monitorear los ingresos y egresos efectivos de dinero en un periodo' },
                    { id: 'o2', text: 'Calcular únicamente los impuestos anuales a la renta' },
                    { id: 'o3', text: 'Diseñar el logotipo de la empresa' }
                  ],
                  correctOptionId: 'o1'
                },
                {
                  id: 'q2',
                  text: '¿Qué abarca la gestión financiera según lo estudiado?',
                  options: [
                    { id: 'o1', text: 'Planeación, organización, dirección y control de recursos financieros' },
                    { id: 'o2', text: 'Gestión exclusiva de redes sociales' },
                    { id: 'o3', text: 'Mantenimiento técnico de maquinaria' }
                  ],
                  correctOptionId: 'o1'
                }
              ]
            },
            {
              id: 'les-5',
              type: 'lesson',
              title: 'Mensaje final',
              subtitle: 'ELEMENTO 5 DE 5',
              quoteBanner: {
                text: 'Una gestión financiera eficiente no solo protege la empresa, sino que impulsa su crecimiento y competitividad en el mercado.',
                bgImage: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=1600&auto=format&fit=crop'
              },
              blocks: [
                {
                  id: 'b5',
                  kind: 'text',
                  content: '¡Felicidades por haber concluido exitosamente el Módulo 2! Continúe aplicando los formatos de registro contable en su emprendimiento.'
                }
              ]
            }
          ]
        }
      ]
    },
    {
      id: 'mod-3',
      number: 'Módulo 3',
      title: '¿Qué son los estados financieros?',
      primaryColor: '#2563eb', // Azul (Capturas 3 y 4 del usuario)
      coverImage: 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?q=80&w=1600&auto=format&fit=crop',
      objective: 'Comprender la estructura e importancia de los estados financieros como herramienta de toma de decisiones.',
      children: [
        {
          id: 'topic-m3',
          type: 'topic',
          title: 'Unidad Principal',
          children: [
            {
              id: 'm3-l1',
              type: 'lesson',
              title: 'Introducción',
              subtitle: 'ELEMENTO 1 DE 6',
              quoteBanner: {
                text: 'Los Estados Financieros son informes detallados y se utilizan como una herramienta para determinar el desempeño y la situación actual de una empresa.',
                bgImage: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=1600&auto=format&fit=crop'
              },
              blocks: [{ id: 'b-m3-1', kind: 'text', content: 'Analice el siguiente video para que conozca más sobre los estados financieros de las MyPE:' }]
            },
            {
              id: 'm3-l2',
              type: 'lesson',
              title: '¿Para qué sirven los estados financieros?',
              subtitle: 'ELEMENTO 2 DE 6',
              blocks: [{ id: 'b-m3-2', kind: 'text', content: 'Permiten evaluar la rentabilidad y liquidez del negocio.' }]
            },
            {
              id: 'm3-l3',
              type: 'lesson',
              title: '¿Cuáles son los elementos de los estados financieros?',
              subtitle: 'ELEMENTO 3 DE 6',
              blocks: [{ id: 'b-m3-3', kind: 'text', content: 'Activos, pasivos, patrimonio, ingresos y gastos.' }]
            },
            {
              id: 'm3-l4',
              type: 'lesson',
              title: 'Tipos de estados financieros',
              subtitle: 'ELEMENTO 4 DE 6',
              blocks: [{ id: 'b-m3-4', kind: 'text', content: 'Balance general, estado de resultados, flujo de efectivo.' }]
            },
            {
              id: 'm3-l5',
              type: 'assessment',
              title: 'Evaluación',
              subtitle: 'ELEMENTO 5 DE 6',
              passScore: 70,
              questions: []
            },
            {
              id: 'm3-l6',
              type: 'lesson',
              title: 'Mensaje final',
              subtitle: 'ELEMENTO 6 DE 6',
              blocks: [{ id: 'b-m3-6', kind: 'text', content: 'Resumen final del Módulo 3.' }]
            }
          ]
        }
      ]
    },
    {
      id: 'mod-4',
      number: 'Módulo 4',
      title: '¿Cuáles son los tipos de estados financieros?',
      primaryColor: '#16a34a', // Verde (Captura 5 del usuario)
      coverImage: 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?q=80&w=1600&auto=format&fit=crop',
      objective: 'Profundizar en cada tipo de estado financiero y su utilidad práctica en las Micro y Pequeñas Empresas.',
      children: [
        {
          id: 'topic-m4',
          type: 'topic',
          title: 'Unidad Principal',
          children: [
            {
              id: 'm4-l1',
              type: 'lesson',
              title: 'Introducción',
              subtitle: 'ELEMENTO 1 DE 10',
              blocks: [{ id: 'b-m4-1', kind: 'text', content: 'Introducción a la tipología de estados financieros.' }]
            },
            {
              id: 'm4-l2',
              type: 'lesson',
              title: 'El Balance General',
              subtitle: 'ELEMENTO 2 DE 10',
              blocks: [{ id: 'b-m4-2', kind: 'text', content: 'Análisis de activos y pasivos.' }]
            },
            {
              id: 'm4-l3',
              type: 'lesson',
              title: 'Estado de resultados',
              subtitle: 'ELEMENTO 3 DE 10',
              blocks: [{ id: 'b-m4-3', kind: 'text', content: 'Pérdidas y ganancias.' }]
            }
          ]
        }
      ]
    }
  ]
};

const emptyLesson = (title = 'Nueva lección') => ({
  id: nanoid(8),
  type: 'lesson',
  title,
  subtitle: 'ELEMENTO NUEVO',
  quoteBanner: {
    text: 'Añada una cita o idea clave resaltada para esta lección.',
    bgImage: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=1600&auto=format&fit=crop'
  },
  blocks: [],
});

const emptyAssessment = (title = 'Nueva evaluación') => ({
  id: nanoid(8),
  type: 'assessment',
  title,
  subtitle: 'EVALUACIÓN',
  questions: [],
  passScore: 70,
});

const COLOR_PALETTE = ['#e11d48', '#f58220', '#2563eb', '#16a34a', '#7c3aed', '#0d9488', '#db2777'];

export const useCourseStore = create((set, get) => ({
  course: initialCourse,
  
  // Vista y Navegación
  viewMode: 'player', // 'editor' | 'player'
  playerScreen: 'cover', // 'cover' | 'lesson'
  selectedModuleId: 'mod-1',
  selectedLessonId: 'm1-l1',
  completedLessonIds: ['m1-l5'],
  sidebarOpen: true,

  setViewMode: (mode) => set({ viewMode: mode }),
  setPlayerScreen: (screen) => set({ playerScreen: screen }),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),

  selectModule: (moduleId) => {
    const { course } = get();
    const mod = course.modules.find((m) => m.id === moduleId);
    if (!mod) return;
    const firstLesson = getAllLessons(mod)[0];
    set({
      selectedModuleId: moduleId,
      selectedLessonId: firstLesson ? firstLesson.id : null,
      playerScreen: 'cover'
    });
  },

  selectLesson: (lessonId) => {
    set({
      selectedLessonId: lessonId,
      playerScreen: 'lesson'
    });
  },

  markLessonCompleted: (lessonId) => set((s) => {
    if (s.completedLessonIds.includes(lessonId)) return s;
    return { completedLessonIds: [...s.completedLessonIds, lessonId] };
  }),

  nextLesson: () => {
    const { course, selectedModuleId, selectedLessonId, markLessonCompleted } = get();
    const mod = course.modules.find((m) => m.id === selectedModuleId) || course.modules[0];
    if (!mod) return;
    const lessons = getAllLessons(mod);
    const currIndex = lessons.findIndex((l) => l.id === selectedLessonId);
    
    if (selectedLessonId) {
      markLessonCompleted(selectedLessonId);
    }

    if (currIndex >= 0 && currIndex < lessons.length - 1) {
      const nextL = lessons[currIndex + 1];
      set({ selectedLessonId: nextL.id, playerScreen: 'lesson' });
    } else {
      // Última lección completada del módulo actual: avanzar al siguiente módulo si existe
      const modIndex = course.modules.findIndex((m) => m.id === selectedModuleId);
      if (modIndex >= 0 && modIndex < course.modules.length - 1) {
        const nextMod = course.modules[modIndex + 1];
        const nextLessons = getAllLessons(nextMod);
        set({
          selectedModuleId: nextMod.id,
          selectedLessonId: nextLessons[0] ? nextLessons[0].id : null,
          playerScreen: 'lesson'
        });
      } else {
        set({ playerScreen: 'cover' });
      }
    }
  },

  prevLesson: () => {
    const { course, selectedModuleId, selectedLessonId } = get();
    const mod = course.modules.find((m) => m.id === selectedModuleId) || course.modules[0];
    if (!mod) return;
    const lessons = getAllLessons(mod);
    const currIndex = lessons.findIndex((l) => l.id === selectedLessonId);

    if (currIndex > 0) {
      const prevL = lessons[currIndex - 1];
      set({ selectedLessonId: prevL.id, playerScreen: 'lesson' });
    } else {
      set({ playerScreen: 'cover' });
    }
  },

  // --- Operaciones de Edición de Estructura ---
  addModule: (title) => set((s) => {
    const colorIdx = s.course.modules.length % COLOR_PALETTE.length;
    const newMod = {
      id: nanoid(8),
      type: 'module',
      number: `Módulo ${s.course.modules.length + 1}`,
      title,
      primaryColor: COLOR_PALETTE[colorIdx],
      coverImage: 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?q=80&w=1600&auto=format&fit=crop',
      objective: 'Describa aquí el objetivo principal del módulo.',
      children: []
    };
    return {
      course: { ...s.course, modules: [...s.course.modules, newMod] },
      selectedModuleId: newMod.id,
      playerScreen: 'cover'
    };
  }),

  updateModuleMeta: (moduleId, data) => set((s) => ({
    course: {
      ...s.course,
      modules: s.course.modules.map((m) => m.id === moduleId ? { ...m, ...data } : m)
    }
  })),

  addTopic: (moduleId, title) => set((s) => ({
    course: {
      ...s.course,
      modules: s.course.modules.map((m) => m.id === moduleId
        ? { ...m, children: [...m.children, { id: nanoid(8), type: 'topic', title, children: [] }] }
        : m),
    },
  })),

  addLessonOrAssessment: (moduleId, topicId, kind = 'lesson') => set((s) => {
    const newChild = kind === 'lesson' ? emptyLesson() : emptyAssessment();
    const newCourse = {
      ...s.course,
      modules: s.course.modules.map((m) => m.id !== moduleId ? m : {
        ...m,
        children: m.children.map((t) => t.id !== topicId ? t : {
          ...t,
          children: [...t.children, newChild],
        }),
      }),
    };
    return {
      course: newCourse,
      selectedLessonId: newChild.id
    };
  }),

  moveNode: (path, fromIndex, toIndex) => set((s) => {
    const clone = structuredClone(s.course);
    let arr = clone.modules;
    for (const id of path) arr = arr.find((n) => n.id === id).children;
    const [moved] = arr.splice(fromIndex, 1);
    arr.splice(toIndex, 0, moved);
    return { course: clone };
  }),

  deleteModule: (moduleId) => set((s) => {
    if (s.course.modules.length <= 1) {
      alert('El curso debe tener al menos un módulo.');
      return s;
    }
    const newModules = s.course.modules.filter((m) => m.id !== moduleId);
    const nextMod = newModules[0];
    const nextLesson = nextMod ? getAllLessons(nextMod)[0] : null;
    return {
      course: { ...s.course, modules: newModules },
      selectedModuleId: s.selectedModuleId === moduleId ? (nextMod ? nextMod.id : null) : s.selectedModuleId,
      selectedLessonId: s.selectedModuleId === moduleId ? (nextLesson ? nextLesson.id : null) : s.selectedLessonId,
    };
  }),

  deleteTopic: (moduleId, topicId) => set((s) => ({
    course: {
      ...s.course,
      modules: s.course.modules.map((m) => m.id !== moduleId ? m : {
        ...m,
        children: m.children.filter((t) => t.id !== topicId),
      }),
    },
  })),

  deleteLessonOrAssessment: (lessonId) => set((s) => {
    const newCourse = {
      ...s.course,
      modules: s.course.modules.map((m) => ({
        ...m,
        children: m.children.map((t) => ({
          ...t,
          children: t.children.filter((n) => n.id !== lessonId),
        })),
      })),
    };
    return {
      course: newCourse,
      selectedLessonId: s.selectedLessonId === lessonId ? null : s.selectedLessonId,
    };
  }),

  // --- Bloques de contenido ---
  addBlock: (lessonId, kind) => set((s) => ({
    course: updateLesson(s.course, lessonId, (lesson) => ({
      ...lesson,
      blocks: [...(lesson.blocks || []), { id: nanoid(8), kind, content: kind === 'text' ? '' : { url: '', caption: '' } }],
    })),
  })),

  updateBlock: (lessonId, blockId, content) => set((s) => ({
    course: updateLesson(s.course, lessonId, (lesson) => ({
      ...lesson,
      blocks: (lesson.blocks || []).map((b) => b.id === blockId ? { ...b, content } : b),
    })),
  })),

  deleteBlock: (lessonId, blockId) => set((s) => ({
    course: updateLesson(s.course, lessonId, (lesson) => ({
      ...lesson,
      blocks: (lesson.blocks || []).filter((b) => b.id !== blockId),
    })),
  })),

  updateLessonQuote: (lessonId, quoteBanner) => set((s) => ({
    course: updateLesson(s.course, lessonId, (lesson) => ({
      ...lesson,
      quoteBanner: { ...(lesson.quoteBanner || {}), ...quoteBanner }
    }))
  })),

  // --- Gestión de Preguntas de Evaluaciones ---
  addQuestion: (lessonId) => set((s) => ({
    course: updateLesson(s.course, lessonId, (assessment) => {
      const qNum = (assessment.questions || []).length + 1;
      const newQ = {
        id: nanoid(8),
        text: `Pregunta ${qNum}: Escriba el enunciado aquí`,
        options: [
          { id: 'o1', text: 'Opción A (Correcta)' },
          { id: 'o2', text: 'Opción B' },
          { id: 'o3', text: 'Opción C' }
        ],
        correctOptionId: 'o1'
      };
      return {
        ...assessment,
        questions: [...(assessment.questions || []), newQ]
      };
    })
  })),

  updateQuestion: (lessonId, questionId, updatedData) => set((s) => ({
    course: updateLesson(s.course, lessonId, (assessment) => ({
      ...assessment,
      questions: (assessment.questions || []).map((q) => q.id === questionId ? { ...q, ...updatedData } : q)
    }))
  })),

  deleteQuestion: (lessonId, questionId) => set((s) => ({
    course: updateLesson(s.course, lessonId, (assessment) => ({
      ...assessment,
      questions: (assessment.questions || []).filter((q) => q.id !== questionId)
    }))
  })),

  // --- Gestión de Persistencia (Crear, Guardar, Cargar) ---
  createNewCourse: (title = 'Nuevo Curso SCORM') => {
    const newId = 'course-' + nanoid(6);
    const firstModId = 'mod-' + nanoid(6);
    const firstTopicId = 'topic-' + nanoid(6);
    const firstLessonId = 'les-' + nanoid(6);

    const blankCourse = {
      id: newId,
      title: title,
      modules: [
        {
          id: firstModId,
          number: 'Módulo 1',
          title: 'Introducción al Curso',
          primaryColor: '#e11d48',
          coverImage: 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?q=80&w=1600&auto=format&fit=crop',
          objective: 'Describa aquí los objetivos clave de aprendizaje para este módulo.',
          children: [
            {
              id: firstTopicId,
              type: 'topic',
              title: 'Unidad Inicial',
              children: [
                {
                  id: firstLessonId,
                  type: 'lesson',
                  title: 'Lección de Bienvenida',
                  subtitle: 'ELEMENTO 1 DE 1',
                  quoteBanner: {
                    text: 'Bienvenido al nuevo módulo interactivo. Añada sus conceptos clave aquí.',
                    bgImage: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=1600&auto=format&fit=crop'
                  },
                  blocks: [
                    { id: 'b-init-1', kind: 'text', content: 'Escriba aquí el contenido explicativo de su lección.' }
                  ]
                }
              ]
            }
          ]
        }
      ]
    };

    set({
      course: blankCourse,
      selectedModuleId: firstModId,
      selectedLessonId: firstLessonId,
      playerScreen: 'cover',
      completedLessonIds: []
    });
    return blankCourse;
  },

  loadCourseData: (courseData) => {
    if (!courseData || !Array.isArray(courseData.modules)) {
      throw new Error('Estructura de curso inválida. Debe ser un JSON con modules[].');
    }

    const firstMod = courseData.modules[0];
    const firstLesson = firstMod ? getAllLessons(firstMod)[0] : null;

    set({
      course: courseData,
      selectedModuleId: firstMod ? firstMod.id : null,
      selectedLessonId: firstLesson ? firstLesson.id : null,
      playerScreen: 'cover',
      completedLessonIds: []
    });

    try {
      localStorage.setItem('active_course_backup', JSON.stringify(courseData));
    } catch (e) {}
  },

  saveCourseToServer: async () => {
    const { course } = get();
    const res = await fetch('/api/courses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(course)
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      throw new Error(`Error al guardar en el servidor (${res.status}): ${errText}`);
    }

    try {
      localStorage.setItem('active_course_backup', JSON.stringify(course));
    } catch (e) {}

    return await res.json();
  },

  downloadCourseJson: () => {
    const { course } = get();
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(course, null, 2));
    const safeTitle = (course.title || 'curso').replace(/[^a-zA-Z0-9_-]/g, '_');
    const filename = `${safeTitle}.json`;

    const a = document.createElement('a');
    a.setAttribute('href', dataStr);
    a.setAttribute('download', filename);
    document.body.appendChild(a);
    a.click();
    a.remove();
  },

  fetchServerCourses: async () => {
    const res = await fetch('/api/courses');
    if (!res.ok) throw new Error('Error al obtener cursos del servidor');
    return await res.json();
  },

  loadCourseFromServer: async (courseId) => {
    const res = await fetch(`/api/courses/${courseId}`);
    if (!res.ok) throw new Error('Error al cargar curso del servidor');
    const courseData = await res.json();
    get().loadCourseData(courseData);
  },

  deleteCourseFromServer: async (courseId) => {
    const res = await fetch(`/api/courses/${courseId}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Error al eliminar curso');
    return await res.json();
  },

  exportCourse: async (moduleId = null) => {
    const { course } = get();
    const res = await fetch('/api/export', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ course, moduleId }),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      throw new Error(`Fallo al generar el paquete SCORM (${res.status}): ${errText}`);
    }

    const disposition = res.headers.get('Content-Disposition') || '';
    let filename = '';
    const match = disposition.match(/filename="?([^"]+)"?/);
    if (match && match[1]) {
      filename = match[1];
    } else {
      if (moduleId) {
        const mod = (course.modules || []).find((m) => m.id === moduleId);
        if (mod) filename = `${mod.number || 'Modulo'}_${mod.title}`.replace(/[^a-zA-Z0-9_-]/g, '_') + '.zip';
      }
      if (!filename) {
        filename = `${(course.title || 'curso_scorm').replace(/[^a-zA-Z0-9_-]/g, '_')}_Completo.zip`;
      }
    }

    const arrayBuffer = await res.arrayBuffer();
    if (!arrayBuffer || arrayBuffer.byteLength === 0) {
      throw new Error('El paquete SCORM generado no contiene datos (0 bytes).');
    }

    const blob = new Blob([arrayBuffer], { type: 'application/zip' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();

    setTimeout(() => {
      if (document.body.contains(a)) {
        document.body.removeChild(a);
      }
      URL.revokeObjectURL(url);
    }, 1500);
  },
}));

// Helper para obtener todas las lecciones/evaluaciones planas de un módulo
export function getAllLessons(moduleNode) {
  if (!moduleNode || !moduleNode.children) return [];
  const list = [];
  for (const topic of moduleNode.children) {
    if (topic.children) {
      for (const item of topic.children) {
        list.push(item);
      }
    }
  }
  return list;
}

// Helper recursivo para actualizar una lección/evaluación
function updateLesson(course, lessonId, updater) {
  return {
    ...course,
    modules: course.modules.map((m) => ({
      ...m,
      children: m.children.map((t) => ({
        ...t,
        children: t.children.map((n) => n.id === lessonId ? updater(n) : n),
      })),
    })),
  };
}
