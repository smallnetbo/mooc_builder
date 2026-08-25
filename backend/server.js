// server.js — Microservicio Express.
// Gestión de exportación SCORM 1.2 y persistencia (crear, guardar, cargar) de cursos.
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { buildScormPackageBuffer } = require('./services/packageBuilder');

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));

const COURSES_DIR = path.join(__dirname, 'courses');
if (!fs.existsSync(COURSES_DIR)) {
  fs.mkdirSync(COURSES_DIR, { recursive: true });
}

// Exportación SCORM
app.post('/api/export', async (req, res) => {
  try {
    const body = req.body || {};
    const course = body.course ? body.course : body;
    const moduleId = body.moduleId || req.query.moduleId || null;

    if (!course?.title || !Array.isArray(course.modules)) {
      return res.status(400).json({ error: 'JSON de curso inválido: falta title o modules[]' });
    }

    const { zipBuffer, filename } = await buildScormPackageBuffer(course, moduleId);

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition');
    res.setHeader('Content-Length', zipBuffer.length);
    return res.status(200).send(zipBuffer);
  } catch (err) {
    console.error('Error generando paquete SCORM:', err);
    if (!res.headersSent) {
      return res.status(500).json({ error: 'Fallo al empaquetar el curso: ' + err.message });
    }
  }
});

// Listar cursos guardados en el servidor
app.get('/api/courses', (_req, res) => {
  try {
    const files = fs.readdirSync(COURSES_DIR).filter((f) => f.endsWith('.json'));
    const list = files.map((file) => {
      const filePath = path.join(COURSES_DIR, file);
      const stat = fs.statSync(filePath);
      try {
        const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        return {
          id: data.id || file.replace('.json', ''),
          title: data.title || 'Sin título',
          updatedAt: stat.mtime,
          moduleCount: Array.isArray(data.modules) ? data.modules.length : 0
        };
      } catch (e) {
        return null;
      }
    }).filter(Boolean);

    return res.json(list);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// Obtener un curso específico por ID
app.get('/api/courses/:id', (req, res) => {
  try {
    const filePath = path.join(COURSES_DIR, `${req.params.id}.json`);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Curso no encontrado' });
    }
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    return res.json(data);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// Guardar o actualizar un curso
app.post('/api/courses', (req, res) => {
  try {
    const course = req.body;
    if (!course || !course.id) {
      return res.status(400).json({ error: 'Curso inválido o sin ID' });
    }
    const filePath = path.join(COURSES_DIR, `${course.id}.json`);
    fs.writeFileSync(filePath, JSON.stringify(course, null, 2), 'utf8');
    return res.json({ ok: true, id: course.id, message: 'Curso guardado con éxito' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// Eliminar un curso
app.delete('/api/courses/:id', (req, res) => {
  try {
    const filePath = path.join(COURSES_DIR, `${req.params.id}.json`);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    return res.json({ ok: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

app.get('/health', (_req, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`SCORM export & courses service escuchando en :${PORT}`));
