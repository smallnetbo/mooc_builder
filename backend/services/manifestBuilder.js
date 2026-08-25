// manifestBuilder.js — Genera imsmanifest.xml para el paquete SCORM 1.2
// Registra index.html como el SCO principal con la experiencia interactiva completa.
const { create } = require('xmlbuilder2');

/**
 * @param {object} course - JSON del curso
 * @returns {{ xml: string }}
 */
function buildManifest(course) {
  const doc = create({ version: '1.0', standalone: true })
    .ele('manifest', {
      identifier: `MANIFEST-${course.id || 'course'}`,
      version: '1.2',
      xmlns: 'http://www.imsproject.org/xsd/imscp_rootv1p1p2',
      'xmlns:adlcp': 'http://www.adlnet.org/xsd/adlcp_rootv1p2',
    });

  doc.ele('metadata').ele('schema').txt('ADL SCORM').up().ele('schemaversion').txt('1.2');

  const orgs = doc.ele('organizations', { default: `ORG-${course.id || 'default'}` });
  const org = orgs.ele('organization', { identifier: `ORG-${course.id || 'default'}` });
  org.ele('title').txt(course.title || 'Curso Interactivo');

  // Ítem principal de entrada al reproductor del curso (Single-SCO interactivo)
  const mainItem = org.ele('item', {
    identifier: `ITEM-${course.id || 'main'}`,
    identifierref: `RES-${course.id || 'main'}`,
  });
  mainItem.ele('title').txt(course.title || 'Curso Interactivo');

  // Extraer lecciones/evaluaciones planas de un módulo o nodo
  function getLessons(node) {
    if (!node) return [];
    const list = [];
    function traverse(n) {
      if (!n) return;
      if (n.type === 'lesson' || n.type === 'assessment') {
        list.push(n);
      } else if (Array.isArray(n.children)) {
        n.children.forEach(traverse);
      }
    }
    traverse(node);
    return list;
  }

  // Generar la jerarquía de ítems para módulos y lecciones en el manifiesto de Moodle
  if (Array.isArray(course.modules)) {
    course.modules.forEach((mod, mIdx) => {
      const modId = mod.id || `mod-${mIdx}`;
      const modItem = mainItem.ele('item', {
        identifier: `ITEM-MOD-${modId}`,
        identifierref: `RES-${course.id || 'main'}`,
        parameters: `?mod=${encodeURIComponent(modId)}`,
      });
      modItem.ele('title').txt((mod.number ? mod.number + ': ' : '') + (mod.title || `Módulo ${mIdx + 1}`));

      const lessons = getLessons(mod);
      lessons.forEach((les, lIdx) => {
        const lesId = les.id || `les-${lIdx}`;
        const lesItem = modItem.ele('item', {
          identifier: `ITEM-LES-${lesId}`,
          identifierref: `RES-${course.id || 'main'}`,
          parameters: `?mod=${encodeURIComponent(modId)}&lesson=${encodeURIComponent(lesId)}`,
        });
        lesItem.ele('title').txt(les.title || `Lección ${lIdx + 1}`);
      });
    });
  }

  const resourcesEl = doc.ele('resources');
  const resEl = resourcesEl.ele('resource', {
    identifier: `RES-${course.id || 'main'}`,
    type: 'webcontent',
    'adlcp:scormtype': 'sco',
    href: 'index.html',
  });
  resEl.ele('file', { href: 'index.html' });
  resEl.ele('file', { href: 'shared/scorm-wrapper.js' });

  return { xml: doc.end({ prettyPrint: true }) };
}

module.exports = { buildManifest };

