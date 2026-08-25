# MOOC Authoring Tool → SCORM 1.2 Package Builder

## 1. Arquitectura y decisión tecnológica

```
┌─────────────────────┐        JSON (árbol del curso)       ┌──────────────────────┐
│   FRONTEND (SPA)     │ ───────────────────────────────────▶│  BACKEND (microservicio)│
│  React 18 + Vite     │        POST /api/export              │  Node.js + Express     │
│  Zustand (estado)    │ ◀─────────────────────────────────── │  xmlbuilder2 + archiver│
│  @dnd-kit (drag&drop)│        .zip (SCORM package)          │  (compilación + zip)   │
└─────────────────────┘                                       └──────────────────────┘
                                                                          │
                                                                          ▼
                                                          ┌───────────────────────────┐
                                                          │  Paquete .zip → Moodle      │
                                                          │  (Actividad SCORM)          │
                                                          └───────────────────────────┘
```

**Frontend: React + Vite (no Next.js).** El editor es 100% cliente (SPA), sin SSR ni rutas server-side — Next.js añadiría complejidad innecesaria aquí. `@dnd-kit` es la librería más moderna y accesible para árboles y canvas drag-and-drop (sucesora de react-beautiful-dnd, mantenida activamente). `Zustand` como store global es más liviano que Redux para un árbol de curso que cambia constantemente.

**Backend: Node.js + Express.** Se elige Node (en vez de PHP, que ya usas en otros proyectos) porque el ecosistema de generación de XML/ZIP en JS es superior y comparte tipos/schema con el frontend (mismo JSON del curso sin transformación intermedia): `xmlbuilder2` para el manifest y `archiver` para el zip. Es un microservicio *stateless* — no requiere base de datos, solo recibe el JSON del curso y devuelve un binario. Se puede desplegar en tu VPS con aaPanel igual que tus otros servicios (proceso Node con PM2 detrás de Nginx/reverse proxy).

## 2. Flujo de datos end-to-end

1. El usuario arma el curso en el **Tree Editor** (Módulo → Tema → Lección → Evaluación).
2. Cada nodo "Lección" contiene un array de **bloques** (texto, video, pregunta) editados en el **Canvas**.
3. Todo vive en un único objeto de estado (`courseStore.js`) — este *es* el modelo de datos que luego se serializa 1:1 hacia el manifest.
4. Al exportar, el frontend hace `POST /api/export` con ese JSON.
5. El backend recorre el árbol recursivamente, genera `imsmanifest.xml`, renderiza cada lección a HTML estático inyectando `scorm-wrapper.js`, y empaqueta todo en un `.zip`.
6. Ese `.zip` se sube a Moodle como actividad SCORM 1.2.

## 3. Archivos entregados

| Archivo | Responsabilidad |
|---|---|
| `frontend/src/store/courseStore.js` | Esquema de datos del curso + acciones (fuente de verdad) |
| `frontend/src/components/TreeEditor.jsx` | Árbol jerárquico Módulo>Tema>Lección>Evaluación |
| `frontend/src/components/Canvas.jsx` | Área central WYSIWYG, bloques drag&drop |
| `frontend/src/components/blocks/*.jsx` | Bloques de contenido (Texto, Video, Pregunta) |
| `frontend/src/components/QuizBuilder.jsx` | Constructor de evaluaciones + puntaje mínimo |
| `backend/server.js` | Endpoint Express que orquesta la exportación |
| `backend/services/manifestBuilder.js` | Genera `imsmanifest.xml` dinámicamente desde el árbol |
| `backend/services/packageBuilder.js` | Renderiza SCOs + arma el `.zip` final |
| `backend/templates/imsmanifest.template.xml` | Plantilla anotada de referencia |
| `scorm-wrapper/scorm-wrapper.js` | API wrapper SCORM 1.2 inyectado en cada curso exportado |

## 4. Estructura final del paquete ZIP (raíz del zip)

```
curso_123.zip
├── imsmanifest.xml
├── metadata.xml                    (opcional, LOM)
├── shared/
│   ├── scorm-wrapper.js            (mismo wrapper en todos los SCOs)
│   └── styles.css
└── sco/
    ├── leccion_1_1/
    │   ├── index.html              (bloques renderizados: texto+video)
    │   └── assets/
    ├── leccion_1_2/
    │   └── index.html
    └── evaluacion_1/
        └── index.html              (quiz autoevaluable, reporta score)
```

Cada carpeta bajo `sco/` es un SCO (Sharable Content Object) independiente referenciado como `<resource>` en el manifest, y cada `index.html` incluye `<script src="../../shared/scorm-wrapper.js">`.


Todos los componentes compilan sin errores de sintaxis. Reempaqueto el proyecto actualizado:

Ejecutó un comando, leyó un archivo

Listo, el proyecto ya trae el frontend armado con Vite + React + Tailwind. Para correrlo:

bash
# Frontend
cd frontend && npm install && npm run dev    # → http://localhost:5173

# Backend (en otra terminal)
cd backend && npm install && npm start       # → http://localhost:4000

El vite.config.js ya tiene el proxy configurado para que /api/export del frontend apunte al backend en localhost:4000, así que el botón "Exportar paquete SCORM" funciona directo en desarrollo sin configurar CORS manualmente. Validé la sintaxis de todo el JSX con esbuild antes de reempaquetar — compila limpio.