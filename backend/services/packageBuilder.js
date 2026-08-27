// packageBuilder.js — Genera el paquete SCORM 1.2 interactivo autónomo
// Incluye Carátula Inicial del Módulo, Menú Lateral Naranja (#f58220), Barra de Navegación,
// Barra de Progreso % COMPLETA, Evaluaciones y Sincronización SCORM 1.2.

const archiver = require('archiver');
const path = require('path');
const fs = require('fs');
const { buildManifest } = require('./manifestBuilder');

const SCORM_WRAPPER_PATH = path.join(__dirname, '..', '..', 'scorm-wrapper', 'scorm-wrapper.js');

function generateStandalonePlayerHTML(course) {
  const jsonCourseData = JSON.stringify(course).replace(/</g, '\\u003c').replace(/>/g, '\\u003e');

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${course.title || 'Curso SCORM'}</title>
  <style>
    :root {
      --primary-orange: #f58220;
      --primary-orange-hover: #e07010;
      --dark-slate: #0f172a;
      --bg-gray: #f8f9fa;
      --sidebar-bg: #f4f4f6;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background-color: var(--bg-gray);
      color: #1e293b;
      height: 100vh;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }
    button { cursor: pointer; border: none; background: none; font-family: inherit; }
    
    /* Top Header Bar */
    .app-header {
      height: 48px;
      background-color: #ffffff;
      border-bottom: 1px solid #e2e8f0;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 16px;
      position: sticky;
      top: 0;
      z-index: 40;
      flex-shrink: 0;
      box-shadow: 0 1px 2px rgba(0,0,0,0.03);
    }
    .header-btn {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
      font-weight: 700;
      color: #334155;
      padding: 6px 10px;
      border-radius: 4px;
      transition: all 0.2s;
      text-transform: uppercase;
    }
    .header-btn:hover { color: var(--primary-orange); background-color: #f1f5f9; }

    /* App Layout Body */
    .app-body {
      flex: 1;
      display: flex;
      min-height: 0;
      position: relative;
      overflow: hidden;
    }

    /* Sidebar Navigation */
    .app-sidebar {
      width: 288px;
      background-color: var(--sidebar-bg);
      border-right: 1px solid #e2e8f0;
      display: flex;
      flex-direction: column;
      flex-shrink: 0;
      z-index: 20;
      transition: transform 0.2s ease-in-out;
    }
    .app-sidebar.hidden { display: none; }
    
    .sidebar-header {
      background-color: var(--primary-orange);
      color: #ffffff;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.05);
    }
    .sidebar-header-top {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
    }
    .sidebar-title {
      font-size: 14px;
      font-weight: 800;
      line-height: 1.3;
    }
    .search-toggle-btn {
      color: white;
      padding: 4px;
      border-radius: 4px;
    }
    .search-toggle-btn:hover { background: rgba(255,255,255,0.2); }
    .search-input {
      width: 100%;
      padding: 6px 10px;
      border-radius: 4px;
      border: none;
      background: rgba(255,255,255,0.25);
      color: white;
      font-size: 12px;
    }
    .search-input::placeholder { color: rgba(255,255,255,0.75); }
    .search-input:focus { outline: 1px solid white; background: rgba(255,255,255,0.35); }

    /* Progress bar */
    .progress-container { display: flex; flex-direction: column; gap: 4px; }
    .progress-label {
      font-size: 10px;
      font-weight: 800;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      color: rgba(255,255,255,0.9);
    }
    .progress-track {
      width: 100%;
      height: 6px;
      background: rgba(255,255,255,0.3);
      border-radius: 999px;
      overflow: hidden;
    }
    .progress-fill {
      height: 100%;
      background: #ffffff;
      width: 0%;
      transition: width 0.4s ease;
      border-radius: 999px;
    }

    /* Sidebar List */
    .sidebar-nav {
      flex: 1;
      overflow-y: auto;
    }
    .sidebar-item {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      padding: 14px 16px;
      font-size: 12px;
      border-bottom: 1px solid rgba(226, 232, 240, 0.6);
      cursor: pointer;
      transition: background 0.15s;
    }
    .sidebar-item:hover { background-color: rgba(226, 232, 240, 0.6); }
    .sidebar-item.active {
      background-color: #ffffff;
      font-weight: 800;
      color: #0f172a;
      border-left: 4px solid var(--primary-orange);
    }
    .sidebar-item-title {
      display: flex;
      align-items: center;
      gap: 10px;
      line-height: 1.4;
      flex: 1;
      padding-right: 8px;
    }
    
    /* Status Badges */
    .status-badge {
      width: 18px;
      height: 18px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      margin-top: 1px;
    }
    .status-badge.completed {
      background-color: var(--primary-orange);
      color: white;
    }
    .status-badge.active {
      border: 2px solid var(--primary-orange);
    }
    .status-badge.active::after {
      content: "";
      width: 6px;
      height: 6px;
      background-color: var(--primary-orange);
      border-radius: 50%;
    }
    .status-badge.pending {
      border: 1px solid #cbd5e1;
    }

    /* Main View Container */
    .main-view {
      flex: 1;
      overflow-y: auto;
      background-color: #ffffff;
      display: flex;
      flex-direction: column;
    }

    /* COVER PAGE STYLES (ModuleCoverView) */
    .cover-container {
      width: 100%;
      min-h: 100%;
      display: flex;
      flex-direction: column;
      background: white;
    }
    .cover-hero {
      position: relative;
      width: 100%;
      background: var(--dark-slate);
      color: white;
      min-height: 440px;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      overflow: hidden;
      text-align: center;
      padding: 40px 20px 80px 20px;
    }
    .cover-hero-bg {
      position: absolute;
      inset: 0;
      background-size: cover;
      background-position: center;
      opacity: 0.35;
    }
    .cover-hero-overlay {
      position: absolute;
      inset: 0;
      background: linear-gradient(to bottom, rgba(0,0,0,0.5), rgba(0,0,0,0.7));
    }
    .cover-hero-content {
      position: relative;
      z-index: 10;
      max-width: 800px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 24px;
    }
    .cover-hero-title {
      font-size: 32px;
      font-weight: 800;
      line-height: 1.25;
      letter-spacing: -0.02em;
    }
    .btn-cover-continue {
      background-color: #ffffff;
      color: #0f172a;
      font-size: 13px;
      font-weight: 800;
      padding: 14px 40px;
      border-radius: 999px;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      box-shadow: 0 10px 25px rgba(0,0,0,0.25);
      transition: transform 0.2s, background-color 0.2s;
    }
    .btn-cover-continue:hover {
      background-color: #f8fafc;
      transform: scale(1.04);
    }
    
    /* Curved SVG Bottom */
    .cover-hero-curve {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      width: 100%;
      overflow: hidden;
      line-height: 0;
      z-index: 20;
    }
    .cover-hero-curve svg {
      position: relative;
      display: block;
      width: 100%;
      height: 90px;
      color: #ffffff;
    }

    .cover-body {
      max-width: 760px;
      width: 100%;
      margin: 0 auto;
      padding: 40px 24px;
      display: flex;
      flex-direction: column;
      gap: 32px;
    }
    .cover-objective {
      text-align: center;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .cover-objective h3 {
      font-size: 12px;
      font-weight: 800;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: #334155;
    }
    .cover-objective p {
      font-size: 14px;
      color: #475569;
      line-height: 1.6;
      max-width: 600px;
      margin: 0 auto;
    }

    .cover-checklist {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0,0,0,0.04);
    }
    .cover-checklist-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px 20px;
      border-bottom: 1px solid #f1f5f9;
      cursor: pointer;
      transition: background 0.15s;
    }
    .cover-checklist-item:last-child { border-bottom: none; }
    .cover-checklist-item:hover { background-color: #f8fafc; }
    .checklist-title-group {
      display: flex;
      align-items: center;
      gap: 14px;
      font-size: 14px;
      font-weight: 600;
      color: #334155;
    }

    /* PLAYER CONTENT AREA */
    .player-container {
      width: 100%;
      max-width: 780px;
      margin: 0 auto;
      padding: 32px 24px 60px 24px;
      display: flex;
      flex-direction: column;
      gap: 28px;
    }
    .player-header {
      text-align: center;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .player-title {
      font-size: 26px;
      font-weight: 800;
      color: #0f172a;
    }
    .player-subtitle {
      font-size: 11px;
      font-weight: 800;
      letter-spacing: 0.1em;
      color: #94a3b8;
      text-transform: uppercase;
    }

    /* Quote Banner */
    .quote-card {
      position: relative;
      border-radius: 12px;
      overflow: hidden;
      background: var(--dark-slate);
      color: white;
      padding: 32px;
      box-shadow: 0 10px 20px rgba(0,0,0,0.12);
    }
    .quote-card-bg {
      position: absolute;
      inset: 0;
      background-size: cover;
      background-position: center;
      opacity: 0.3;
    }
    .quote-card-content {
      position: relative;
      z-index: 10;
      max-width: 600px;
    }
    .quote-accent-line {
      width: 48px;
      height: 4px;
      background: #ffffff;
      border-radius: 2px;
      margin-bottom: 16px;
    }
    .quote-text {
      font-size: 17px;
      font-weight: 700;
      line-height: 1.55;
    }

    /* Content Blocks */
    .block-text-p {
      font-size: 14.5px;
      line-height: 1.65;
      color: #334155;
      margin-bottom: 18px;
    }
    .block-video-box {
      width: 100%;
      aspect-ratio: 16 / 9;
      background: #000;
      border-radius: 10px;
      overflow: hidden;
      margin-bottom: 24px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      position: relative;
    }
    .block-video-box iframe {
      width: 100%;
      height: 100%;
      border: 0;
    }
    .video-placeholder {
      position: absolute;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      background-size: cover;
      background-position: center;
      cursor: pointer;
    }
    .play-btn-circle {
      width: 64px;
      height: 64px;
      border-radius: 50%;
      background: rgba(15, 23, 42, 0.85);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 10px 25px rgba(0,0,0,0.3);
      transition: transform 0.2s, background-color 0.2s;
    }
    .video-placeholder:hover .play-btn-circle {
      background-color: var(--primary-orange);
      transform: scale(1.1);
    }

    /* Main Bottom Continuation Button */
    .btn-player-continue {
      width: 100%;
      background-color: var(--primary-orange);
      color: #ffffff;
      font-size: 13px;
      font-weight: 800;
      text-align: center;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      padding: 15px 24px;
      border-radius: 6px;
      box-shadow: 0 4px 12px rgba(245, 130, 32, 0.35);
      transition: background-color 0.2s;
      margin-top: 16px;
    }
    .btn-player-continue:hover {
      background-color: var(--primary-orange-hover);
    }

    /* Quiz Styling */
    .quiz-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 24px;
      box-shadow: 0 2px 6px rgba(0,0,0,0.03);
    }
    .quiz-question { margin-bottom: 24px; }
    .quiz-q-title { font-weight: 700; font-size: 14px; margin-bottom: 12px; color: #0f172a; }
    .quiz-opt {
      display: flex;
      align-items: center;
      padding: 12px 16px;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      margin-bottom: 8px;
      cursor: pointer;
      font-size: 13.5px;
      transition: background 0.15s;
    }
    .quiz-opt:hover { background-color: #f8fafc; }
    .quiz-opt input { margin-right: 12px; accent-color: var(--primary-orange); }

    /* ACCORDION */
    .scorm-accordion { margin-bottom: 24px; display: flex; flex-direction: column; gap: 8px; }
    .acc-item { border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; background: #fff; }
    .acc-header { width: 100%; display: flex; align-items: center; justify-content: space-between; padding: 14px 18px; background: #f8fafc; font-weight: 700; font-size: 13.5px; color: #1e293b; border: none; cursor: pointer; text-align: left; }
    .acc-header:hover { background: #f1f5f9; }
    .acc-icon { font-size: 11px; color: #64748b; }
    .acc-body { padding: 16px 18px; font-size: 13.5px; line-height: 1.6; color: #334155; border-top: 1px solid #f1f5f9; }

    /* FLIP CARDS 3D */
    .scorm-flipcards-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 16px; margin-bottom: 24px; }
    .flipcard-wrapper { height: 180px; perspective: 1000px; cursor: pointer; }
    .flipcard-inner { position: relative; width: 100%; height: 100%; border-radius: 12px; transition: transform 0.6s; transform-style: preserve-3d; box-shadow: 0 4px 12px rgba(0,0,0,0.08); }
    .flipcard-wrapper.flipped .flipcard-inner { transform: rotateY(180deg); }
    .flipcard-front, .flipcard-back { position: absolute; inset: 0; border-radius: 12px; padding: 20px; display: flex; flex-direction: column; justify-content: space-between; text-align: center; backface-visibility: hidden; -webkit-backface-visibility: hidden; }
    .flipcard-front { background: var(--primary-orange); color: #fff; }
    .flipcard-front h4 { font-size: 15px; font-weight: 800; line-height: 1.4; margin: auto 0; }
    .flipcard-back { background: #0f172a; color: #fff; transform: rotateY(180deg); }
    .flipcard-back p { font-size: 13px; font-weight: 500; line-height: 1.5; margin: auto 0; max-height: 110px; overflow-y: auto; }
    .flip-hint { font-size: 10px; font-weight: 800; letter-spacing: 0.1em; opacity: 0.75; text-transform: uppercase; }

    /* TIMELINE */
    .scorm-timeline { margin: 20px 0 24px 16px; border-left: 2px solid rgba(245, 130, 32, 0.4); padding-left: 24px; display: flex; flex-direction: column; gap: 16px; }
    .timeline-step { position: relative; background: #fff; border: 1px solid #e2e8f0; border-radius: 10px; padding: 16px; box-shadow: 0 2px 6px rgba(0,0,0,0.03); }
    .timeline-badge { position: absolute; left: -36px; top: 16px; width: 22px; height: 22px; border-radius: 50%; background: var(--primary-orange); color: #fff; font-size: 10px; font-weight: 800; display: flex; align-items: center; justify-content: center; }
    .timeline-step h4 { font-size: 14px; font-weight: 700; color: #0f172a; margin-bottom: 4px; }
    .timeline-step p { font-size: 13px; color: #475569; line-height: 1.5; }

    /* CALLOUT BOXES */
    .scorm-callout { border-radius: 10px; padding: 18px 20px; margin-bottom: 24px; border: 1px solid; display: flex; flex-direction: column; gap: 6px; }
    .callout-tip { background: #f0fdf4; border-color: #bbf7d0; color: #166534; }
    .callout-important { background: #eff6ff; border-color: #bfdbfe; color: #1e40af; }
    .callout-warning { background: #fffbeb; border-color: #fde68a; color: #92400e; }
    .callout-example { background: #faf5ff; border-color: #e9d5ff; color: #6b21a8; }
    .callout-title { font-size: 13px; font-weight: 800; letter-spacing: 0.05em; text-transform: uppercase; }
    .callout-text { font-size: 13.5px; line-height: 1.55; color: #334155; }

    /* GALLERY */
    .scorm-gallery { background: #0f172a; border-radius: 12px; overflow: hidden; padding: 16px; margin-bottom: 24px; color: #fff; }
    .gallery-slide img { width: 100%; max-height: 380px; object-fit: contain; border-radius: 8px; background: #000; }
    .gallery-caption { font-size: 12px; font-style: italic; color: #cbd5e1; margin-top: 8px; text-align: center; }
    .gallery-controls { display: flex; align-items: center; justify-content: space-between; margin-top: 12px; padding-top: 8px; border-top: 1px solid #1e293b; }
    .gallery-btn { background: #1e293b; color: #fff; border: 1px solid #334155; border-radius: 6px; padding: 6px 14px; font-size: 12px; font-weight: 700; cursor: pointer; }
    .gallery-btn:hover { background: #334155; }
    .gallery-counter { font-size: 11px; font-weight: 800; color: #94a3b8; }

    /* RESOURCE DOWNLOAD CARD */
    .scorm-resource-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 18px 20px; display: flex; align-items: center; justify-content: space-between; gap: 16px; margin-bottom: 24px; box-shadow: 0 2px 8px rgba(0,0,0,0.04); }
    .resource-icon { width: 44px; height: 44px; border-radius: 10px; background: var(--primary-orange); color: #fff; font-size: 11px; font-weight: 900; display: flex; align-items: center; justify-content: center; text-transform: uppercase; flex-shrink: 0; }
    .resource-info { flex: 1; }
    .resource-info h4 { font-size: 14px; font-weight: 700; color: #0f172a; margin-bottom: 2px; }
    .resource-info p { font-size: 12.5px; color: #64748b; line-height: 1.4; }
    .resource-size { font-size: 10px; font-weight: 700; color: #94a3b8; display: inline-block; margin-top: 4px; }
    .btn-resource-dl { background: var(--primary-orange); color: #fff; text-decoration: none; font-size: 12px; font-weight: 800; padding: 10px 18px; border-radius: 8px; white-space: nowrap; transition: opacity 0.15s; }
    .btn-resource-dl:hover { opacity: 0.9; }

    /* KNOWLEDGE CHECK (TRIVIA) */
    .scorm-kc-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 22px; margin-bottom: 24px; box-shadow: 0 2px 8px rgba(0,0,0,0.04); display: flex; flex-direction: column; gap: 14px; }
    .kc-badge { font-size: 10px; font-weight: 800; letter-spacing: 0.1em; color: var(--primary-orange); text-transform: uppercase; }
    .kc-question { font-size: 15px; font-weight: 800; color: #0f172a; line-height: 1.4; }
    .kc-options { display: flex; flex-direction: column; gap: 8px; }
    .kc-opt-label { display: flex; align-items: center; padding: 12px 16px; border: 1px solid #cbd5e1; border-radius: 8px; cursor: pointer; font-size: 13.5px; transition: background 0.15s; }
    .kc-opt-label:hover { background: #f8fafc; }
    .kc-opt-label input { margin-right: 12px; accent-color: var(--primary-orange); }
    .btn-kc-check { background: var(--primary-orange); color: #fff; border: none; font-size: 12px; font-weight: 800; letter-spacing: 0.05em; text-transform: uppercase; padding: 11px 20px; border-radius: 6px; cursor: pointer; align-self: flex-start; }
    .btn-kc-check:hover { background-color: var(--primary-orange-hover); }
    .kc-result { padding: 14px 16px; border-radius: 8px; font-size: 13px; line-height: 1.5; font-weight: 600; margin-top: 4px; }
    .kc-result.correct { background: #f0fdf4; border: 1px solid #bbf7d0; color: #166534; }
    .kc-result.incorrect { background: #fef2f2; border: 1px solid #fecaca; color: #991b1b; }
  </style>
</head>
<body onload="initApp()" onunload="ScormWrapper.terminate()">

  <!-- HEADER DE LA NAVEGACIÓN -->
  <header class="app-header">
    <div style="display: flex; align-items: center; gap: 8px;">
      <button class="header-btn" onclick="toggleSidebar()" title="Alternar menú lateral">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M3 12h18M3 6h18M3 18h18"/></svg>
      </button>
    </div>

    <button class="header-btn" onclick="goToCover()" title="Volver a la carátula">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 19V5M5 12l7-7 7 7"/></svg>
      <span>Inicio</span>
    </button>

    <button class="header-btn" onclick="finishCourse()" style="font-weight: 800;">
      <span>TERMINAR</span>
    </button>
  </header>

  <!-- CUERPO PRINCIPAL (SIDEBAR + CONTENIDO) -->
  <div class="app-body">
    <!-- MENÚ LATERAL IZQUIERDO -->
    <aside class="app-sidebar" id="sidebar">
      <div class="sidebar-header">
        <div class="sidebar-header-top">
          <div style="flex: 1; margin-right: 8px;">
            <div style="font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; color: rgba(255,255,255,0.85); margin-bottom: 3px;">
              Seleccionar Módulo
            </div>
            <select id="module-select" onchange="onModuleChange(this.value)" style="width: 100%; font-size: 12px; font-weight: 800; background: rgba(0,0,0,0.25); color: white; border: 1px solid rgba(255,255,255,0.4); border-radius: 4px; padding: 4px 6px; cursor: pointer; outline: none;">
            </select>
          </div>
          <button class="search-toggle-btn" onclick="toggleSearchInput()" title="Buscar lección">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
          </button>
        </div>

        <div id="search-box" style="display: none;">
          <input type="text" class="search-input" id="search-input" placeholder="Buscar lección..." oninput="onSearchInput(this.value)">
        </div>

        <div class="progress-container">
          <div class="progress-label" id="sb-progress-text">0% COMPLETA</div>
          <div class="progress-track">
            <div class="progress-fill" id="sb-progress-fill"></div>
          </div>
        </div>
      </div>

      <nav class="sidebar-nav" id="sidebar-nav"></nav>
    </aside>

    <!-- ÁREA DE CONTENIDO (CARÁTULA O REPRODUCTOR) -->
    <main class="main-view" id="main-view"></main>
  </div>

  <script src="shared/scorm-wrapper.js"></script>
  <script>
    const COURSE = ${jsonCourseData};
    let activeModule = (COURSE.modules && COURSE.modules[0]) ? COURSE.modules[0] : { title: COURSE.title, children: [] };
    
    // Obtener todas las lecciones planas del módulo activo (recursivo)
    function getAllLessons(mod) {
      if (!mod) return [];
      const list = [];
      function traverse(node) {
        if (!node) return;
        if (node.type === 'lesson' || node.type === 'assessment') {
          list.push(node);
        } else if (Array.isArray(node.children)) {
          node.children.forEach(traverse);
        }
      }
      traverse(mod);
      return list;
    }
    let ALL_LESSONS = getAllLessons(activeModule);

    let state = {
      playerScreen: 'cover', // 'cover' | 'lesson'
      selectedLessonId: ALL_LESSONS[0] ? ALL_LESSONS[0].id : null,
      completedLessonIds: [],
      sidebarOpen: true,
      searchQuery: ''
    };

    function escapeHtml(str) {
      if (str === null || str === undefined) return '';
      return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    }

    function updateThemeColor() {
      const color = activeModule.primaryColor || '#f58220';
      document.documentElement.style.setProperty('--primary-orange', color);
      document.documentElement.style.setProperty('--primary-orange-hover', color);
    }

    function populateModuleSelect() {
      const sel = document.getElementById('module-select');
      if (!sel) return;
      sel.innerHTML = '';
      (COURSE.modules || []).forEach(m => {
        const opt = document.createElement('option');
        opt.value = m.id;
        opt.textContent = (m.number ? m.number + ': ' : '') + (m.title || '');
        opt.style.color = '#0f172a';
        opt.style.fontWeight = '600';
        if (m.id === activeModule.id) opt.selected = true;
        sel.appendChild(opt);
      });
    }

    function onModuleChange(moduleId) {
      const mod = (COURSE.modules || []).find(m => m.id === moduleId);
      if (!mod) return;
      activeModule = mod;
      ALL_LESSONS = getAllLessons(activeModule);
      state.selectedLessonId = ALL_LESSONS[0] ? ALL_LESSONS[0].id : null;
      state.playerScreen = 'cover';
      updateThemeColor();
      saveScormState();
      renderSidebar();
      renderMainView();
    }

    function initApp() {
      try {
        ScormWrapper.init();
      } catch (e) {
        console.warn('Error inicializando SCORM:', e);
      }
      
      // Parsear parámetros de URL (cuando se navega desde el árbol de Moodle)
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const urlModId = urlParams.get('mod');
        const urlLessonId = urlParams.get('lesson');

        if (urlModId) {
          const foundMod = (COURSE.modules || []).find(m => m.id === urlModId);
          if (foundMod) {
            activeModule = foundMod;
          }
        }

        // Restaurar estado guardado en SCORM (si existe y es válido)
        try {
          const savedLoc = ScormWrapper.getValue('cmi.core.lesson_location');
          if (savedLoc && typeof savedLoc === 'string' && savedLoc.trim() !== '') {
            (COURSE.modules || []).forEach(m => {
              const lessons = getAllLessons(m);
              if (lessons.some(l => l.id === savedLoc)) {
                activeModule = m;
                ALL_LESSONS = lessons;
                state.selectedLessonId = savedLoc;
              }
            });
          }

          const savedData = ScormWrapper.getValue('cmi.suspend_data');
          if (savedData && typeof savedData === 'string' && savedData.trim().startsWith('{')) {
            const parsed = JSON.parse(savedData);
            if (Array.isArray(parsed.completed)) state.completedLessonIds = parsed.completed;
            if (parsed.screen) state.playerScreen = parsed.screen;
          }
        } catch (e) {
          console.warn('Sin datos previos válidos de SCORM:', e);
        }

        if (urlLessonId) {
          (COURSE.modules || []).forEach(m => {
            const lessons = getAllLessons(m);
            if (lessons.some(l => l.id === urlLessonId)) {
              activeModule = m;
              ALL_LESSONS = lessons;
              state.selectedLessonId = urlLessonId;
              state.playerScreen = 'lesson';
            }
          });
        }
      } catch (e) {
        console.warn('Error al procesar parámetros/estado inicial:', e);
      }

      if (!activeModule) {
        activeModule = (COURSE.modules && COURSE.modules[0]) ? COURSE.modules[0] : { title: COURSE.title, children: [] };
      }
      ALL_LESSONS = getAllLessons(activeModule);
      if (!state.selectedLessonId && ALL_LESSONS.length > 0) {
        state.selectedLessonId = ALL_LESSONS[0].id;
      }

      if (!Array.isArray(state.completedLessonIds)) {
        state.completedLessonIds = [];
      }

      try { updateThemeColor(); } catch (e) { console.error(e); }
      try { populateModuleSelect(); } catch (e) { console.error(e); }
      try { renderSidebar(); } catch (e) { console.error(e); }
      try { renderMainView(); } catch (e) { console.error(e); }
    }

    function saveScormState() {
      if (state.selectedLessonId) {
        ScormWrapper.setLocation(state.selectedLessonId);
      }
      try {
        ScormWrapper.setValue('cmi.suspend_data', JSON.stringify({
          completed: state.completedLessonIds,
          screen: state.playerScreen
        }));
        ScormWrapper.commit();
      } catch (e) {}
    }

    function toggleSidebar() {
      state.sidebarOpen = !state.sidebarOpen;
      const sb = document.getElementById('sidebar');
      if (sb) {
        if (state.sidebarOpen) sb.classList.remove('hidden');
        else sb.classList.add('hidden');
      }
    }

    function toggleSearchInput() {
      const box = document.getElementById('search-box');
      if (box) {
        box.style.display = box.style.display === 'none' ? 'block' : 'none';
      }
    }

    function onSearchInput(val) {
      state.searchQuery = val.toLowerCase();
      renderSidebar();
    }

    function goToCover() {
      state.playerScreen = 'cover';
      saveScormState();
      renderMainView();
    }

    function formatEmbedUrl(url) {
      if (!url) return '';
      let str = String(url).trim();
      if (str.includes('youtube.com/watch?v=')) {
        const vId = str.split('watch?v=')[1]?.split('&')[0];
        if (vId) return 'https://www.youtube.com/embed/' + vId;
      }
      if (str.includes('youtu.be/')) {
        const vId = str.split('youtu.be/')[1]?.split('?')[0];
        if (vId) return 'https://www.youtube.com/embed/' + vId;
      }
      return str;
    }

    function selectLesson(id) {
      if (!id && ALL_LESSONS.length > 0) id = ALL_LESSONS[0].id;
      if (!id) return;
      state.selectedLessonId = id;
      state.playerScreen = 'lesson';
      saveScormState();
      renderSidebar();
      renderMainView();
      const mainEl = document.getElementById('main-view');
      if (mainEl) mainEl.scrollTop = 0;
    }

    function startOrContinue() {
      if (!ALL_LESSONS || ALL_LESSONS.length === 0) {
        alert('Este módulo no tiene lecciones creadas.');
        return;
      }
      const firstUnfinished = ALL_LESSONS.find(l => !state.completedLessonIds.includes(l.id));
      if (firstUnfinished) {
        selectLesson(firstUnfinished.id);
      } else {
        // Si todas las lecciones del módulo actual fueron completadas, avanza al siguiente módulo del curso
        const curModIdx = (COURSE.modules || []).findIndex(m => m.id === activeModule.id);
        if (curModIdx >= 0 && curModIdx < (COURSE.modules || []).length - 1) {
          const nextMod = COURSE.modules[curModIdx + 1];
          onModuleChange(nextMod.id);
          const nextLessons = getAllLessons(nextMod);
          if (nextLessons[0]) {
            selectLesson(nextLessons[0].id);
          }
        } else if (ALL_LESSONS[0]) {
          selectLesson(ALL_LESSONS[0].id);
        }
      }
    }

    function markCompleted(id) {
      if (!state.completedLessonIds.includes(id)) {
        state.completedLessonIds.push(id);
      }
      // Verificar completitud total
      if (state.completedLessonIds.length >= ALL_LESSONS.length && ALL_LESSONS.length > 0) {
        ScormWrapper.setStatus('completed');
      }
      saveScormState();
      renderSidebar();
    }

    function nextLesson() {
      const curIdx = ALL_LESSONS.findIndex(l => l.id === state.selectedLessonId);
      if (curIdx >= 0 && ALL_LESSONS[curIdx]) {
        markCompleted(ALL_LESSONS[curIdx].id);
      }

      if (curIdx >= 0 && curIdx < ALL_LESSONS.length - 1) {
        selectLesson(ALL_LESSONS[curIdx + 1].id);
      } else {
        // Fin de lecciones del módulo actual -> Verificar si existe un siguiente módulo
        const curModIdx = (COURSE.modules || []).findIndex(m => m.id === activeModule.id);
        if (curModIdx >= 0 && curModIdx < (COURSE.modules || []).length - 1) {
          const nextMod = COURSE.modules[curModIdx + 1];
          alert('¡Módulo completado! Avanzando a: ' + (nextMod.number ? nextMod.number + ': ' : '') + (nextMod.title || 'Siguiente Módulo'));
          onModuleChange(nextMod.id);
          const nextLessons = getAllLessons(nextMod);
          if (nextLessons[0]) {
            selectLesson(nextLessons[0].id);
          }
        } else {
          ScormWrapper.setStatus('completed');
          alert('¡Felicitaciones! Has completado todos los módulos del curso.');
          goToCover();
        }
      }
    }

    function finishCourse() {
      if (state.selectedLessonId) markCompleted(state.selectedLessonId);
      ScormWrapper.setStatus('completed');
      alert('Progreso guardado en Moodle. Puedes cerrar esta ventana.');
    }

    /* RENDERIZADO DEL SIDEBAR */
    function renderSidebar() {
      const modTitleEl = document.getElementById('sb-module-title');
      if (modTitleEl) {
        modTitleEl.innerText = (activeModule.number ? activeModule.number + ': ' : '') + (activeModule.title || '');
      }

      const modSelect = document.getElementById('module-select');
      if (modSelect && modSelect.value !== activeModule.id) {
        modSelect.value = activeModule.id;
      }

      const compList = Array.isArray(state.completedLessonIds) ? state.completedLessonIds : [];
      const completedCount = ALL_LESSONS.filter(l => compList.includes(l.id)).length;
      const progressPercent = ALL_LESSONS.length > 0 ? Math.round((completedCount / ALL_LESSONS.length) * 100) : 0;
      
      const progressTextEl = document.getElementById('sb-progress-text');
      if (progressTextEl) progressTextEl.innerText = progressPercent + '% COMPLETA';

      const progressFillEl = document.getElementById('sb-progress-fill');
      if (progressFillEl) progressFillEl.style.width = progressPercent + '%';

      const navEl = document.getElementById('sidebar-nav');
      if (!navEl) return;
      navEl.innerHTML = '';

      const query = (state.searchQuery || '').toLowerCase();
      const filtered = ALL_LESSONS.filter(l => (l.title || '').toLowerCase().includes(query));

      filtered.forEach(lesson => {
        const isCurrent = state.playerScreen === 'lesson' && lesson.id === state.selectedLessonId;
        const isCompleted = compList.includes(lesson.id);

        const itemDiv = document.createElement('div');
        itemDiv.className = 'sidebar-item' + (isCurrent ? ' active' : '');
        itemDiv.onclick = () => selectLesson(lesson.id);

        let badgeHtml = '<div class="status-badge pending"></div>';
        if (isCompleted) {
          badgeHtml = '<div class="status-badge completed"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5"><path d="M20 6 9 17l-5-5"/></svg></div>';
        } else if (isCurrent) {
          badgeHtml = '<div class="status-badge active"></div>';
        }

        const iconSvg = lesson.type === 'assessment' 
          ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f58220" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>'
          : '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m9 18 6-6-6-6"/></svg>';

        itemDiv.innerHTML = '<div class="sidebar-item-title">' + iconSvg + '<span>' + escapeHtml(lesson.title || '') + '</span></div>' + badgeHtml;
        navEl.appendChild(itemDiv);
      });
    }

    /* RENDERIZADO DEL ÁREA PRINCIPAL */
    function renderMainView() {
      const container = document.getElementById('main-view');
      container.innerHTML = '';

      if (state.playerScreen === 'cover') {
        // VISTA CARÁTULA (ModuleCoverView)
        const coverDiv = document.createElement('div');
        coverDiv.className = 'cover-container';

        const bgImage = activeModule.coverImage || 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?q=80&w=1600&auto=format&fit=crop';
        
        const compList = Array.isArray(state.completedLessonIds) ? state.completedLessonIds : [];
        let checklistHtml = ALL_LESSONS.map((l, idx) => {
          const isComp = compList.includes(l.id);
          const isAct = !isComp && (idx === 0 || compList.includes(ALL_LESSONS[idx - 1]?.id));

          let statusBadge = '<div class="status-badge pending"></div>';
          if (isComp) {
            statusBadge = '<div class="status-badge completed"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5"><path d="M20 6 9 17l-5-5"/></svg></div>';
          } else if (isAct) {
            statusBadge = '<div class="status-badge active"></div>';
          }

          return '<div class="cover-checklist-item" onclick="selectLesson(\\'' + l.id + '\\')">' +
            '<div class="checklist-title-group">' +
              '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="2"><path d="M3 12h18M3 6h18M3 18h18"/></svg>' +
              '<span>' + escapeHtml(l.title || '') + '</span>' +
            '</div>' +
            statusBadge +
          '</div>';
        }).join('');

        coverDiv.innerHTML = '<div class="cover-hero">' +
          '<div class="cover-hero-bg" style="background-image: url(' + "'" + (activeModule.coverImage || 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?q=80&w=1600&auto=format&fit=crop') + "'" + ')"></div>' +
          '<div class="cover-hero-overlay"></div>' +
          '<div class="cover-hero-content">' +
            '<h1 class="cover-hero-title">' + (activeModule.number ? escapeHtml(activeModule.number) + ': ' : '') + escapeHtml(activeModule.title || '') + '</h1>' +
            '<button class="btn-cover-continue" onclick="startOrContinue()">CONTINUAR</button>' +
          '</div>' +
          '<div class="cover-hero-curve">' +
            '<svg viewBox="0 0 1440 120" preserveAspectRatio="none"><path d="M0,0 Q720,130 1440,0 L1440,120 L0,120 Z" fill="currentColor"></path></svg>' +
          '</div>' +
        '</div>' +
        '<div class="cover-body">' +
          '<div class="cover-objective">' +
            '<h3>OBJETIVO</h3>' +
            '<p>' + escapeHtml(activeModule.objective || 'Describa aquí los objetivos clave de aprendizaje para este módulo.') + '</p>' +
          '</div>' +
          '<div class="cover-checklist">' + checklistHtml + '</div>' +
        '</div>';
        container.appendChild(coverDiv);

      } else {
        // VISTA REPRODUCTOR DE LECCIÓN (ModulePlayerView)
        const curLessonIdx = ALL_LESSONS.findIndex(l => l.id === state.selectedLessonId);
        const curLesson = ALL_LESSONS[curLessonIdx] || ALL_LESSONS[0];

        if (!curLesson) {
          container.innerHTML = '<div style="padding: 40px; text-align: center;">No hay lecciones.</div>';
          return;
        }

        const playerDiv = document.createElement('div');
        playerDiv.className = 'player-container';

        // Header de lección
        const headerHtml = '<div class="player-header">' +
          '<h1 class="player-title">' + escapeHtml(curLesson.title || '') + '</h1>' +
          '<div class="player-subtitle">ELEMENTO ' + (curLessonIdx + 1) + ' DE ' + ALL_LESSONS.length + '</div>' +
        '</div>';

        // Banner Cita Concepto Clave
        let quoteHtml = '';
        if (curLesson.quoteBanner && curLesson.quoteBanner.text) {
          const qBg = curLesson.quoteBanner.bgImage || 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?q=80&w=1200';
          quoteHtml = '<div class="quote-card">' +
            '<div class="quote-card-bg" style="background-image: url(' + "'" + qBg + "'" + ')"></div>' +
            '<div class="quote-card-content">' +
              '<div class="quote-accent-line"></div>' +
              '<div class="quote-text">' + escapeHtml(curLesson.quoteBanner.text) + '</div>' +
            '</div>' +
          '</div>';
        }

        // Bloques de contenido o Quiz
        let contentHtml = '';
        if (curLesson.type === 'assessment') {
          contentHtml = renderQuizFormHTML(curLesson);
        } else {
          (curLesson.blocks || []).forEach((b, bIdx) => {
            if (b.kind === 'text') {
              contentHtml += '<div class="block-text-p">' + escapeHtml(b.content || '') + '</div>';
            } else if (b.kind === 'video') {
              const rawUrl = typeof b.content === 'object' ? b.content.url : b.content;
              const embedUrl = formatEmbedUrl(rawUrl);
              if (embedUrl) {
                contentHtml += '<div class="block-video-box"><iframe src="' + embedUrl + '" allowfullscreen allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"></iframe></div>';
              } else {
                contentHtml += '<div class="block-video-box"><div class="video-placeholder" style="background-image: url(https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?q=80&w=1200)"><div class="play-btn-circle"><svg width="24" height="24" viewBox="0 0 24 24" fill="white"><polygon points="5 3 19 12 5 21 5 3"/></svg></div></div></div>';
              }
            } else if (b.kind === 'accordion') {
              const items = b.content && Array.isArray(b.content.items) ? b.content.items : [];
              let accHtml = '<div class="scorm-accordion">';
              items.forEach((item, idx) => {
                accHtml += '<div class="acc-item">' +
                  '<button type="button" class="acc-header" onclick="toggleAccordionItem(this)">' +
                    '<span>' + escapeHtml(item.title || '') + '</span>' +
                    '<span class="acc-icon">' + (idx === 0 ? '▲' : '▼') + '</span>' +
                  '</button>' +
                  '<div class="acc-body" style="display:' + (idx === 0 ? 'block' : 'none') + ';">' + escapeHtml(item.content || '') + '</div>' +
                '</div>';
              });
              accHtml += '</div>';
              contentHtml += accHtml;
            } else if (b.kind === 'flipcard') {
              const cards = b.content && Array.isArray(b.content.cards) ? b.content.cards : [];
              let flipHtml = '<div class="scorm-flipcards-grid">';
              cards.forEach(c => {
                flipHtml += '<div class="flipcard-wrapper" onclick="toggleFlipCard(this)">' +
                  '<div class="flipcard-inner">' +
                    '<div class="flipcard-front">' +
                      '<div class="flip-hint">VOLTEAR ↺</div>' +
                      '<h4>' + escapeHtml(c.frontTitle || '') + '</h4>' +
                    '</div>' +
                    '<div class="flipcard-back">' +
                      '<div class="flip-hint">REVERSO ↺</div>' +
                      '<p>' + escapeHtml(c.backContent || '') + '</p>' +
                    '</div>' +
                  '</div>' +
                '</div>';
              });
              flipHtml += '</div>';
              contentHtml += flipHtml;
            } else if (b.kind === 'timeline') {
              const steps = b.content && Array.isArray(b.content.steps) ? b.content.steps : [];
              let timeHtml = '<div class="scorm-timeline">';
              steps.forEach((s, idx) => {
                timeHtml += '<div class="timeline-step">' +
                  '<div class="timeline-badge">' + (idx + 1) + '</div>' +
                  '<h4>' + escapeHtml(s.title || '') + '</h4>' +
                  '<p>' + escapeHtml(s.description || '') + '</p>' +
                '</div>';
              });
              timeHtml += '</div>';
              contentHtml += timeHtml;
            } else if (b.kind === 'callout') {
              const c = b.content || {};
              const type = c.type || 'tip';
              const titles = { tip: '💡 CONSEJO PRÁCTICO', important: '📌 NOTA IMPORTANTE', warning: '⚠️ ALERTA', example: '🏢 CASO PRÁCTICO' };
              contentHtml += '<div class="scorm-callout callout-' + type + '">' +
                '<h4 class="callout-title">' + (escapeHtml(c.title) || titles[type] || 'DESTACADO') + '</h4>' +
                '<p class="callout-text">' + escapeHtml(c.text || '') + '</p>' +
              '</div>';
            } else if (b.kind === 'gallery') {
              const images = b.content && Array.isArray(b.content.images) ? b.content.images : [];
              if (images.length > 0) {
                let galHtml = '<div class="scorm-gallery" data-current="0" data-total="' + images.length + '">';
                images.forEach((img, idx) => {
                  galHtml += '<div class="gallery-slide" style="display:' + (idx === 0 ? 'block' : 'none') + ';">' +
                    '<img src="' + escapeHtml(img.url || '') + '" alt="slide">' +
                    '<p class="gallery-caption">' + escapeHtml(img.caption || '') + '</p>' +
                  '</div>';
                });
                if (images.length > 1) {
                  galHtml += '<div class="gallery-controls">' +
                    '<button type="button" class="gallery-btn" onclick="navigateGallery(this, -1)">‹ Anterior</button>' +
                    '<span class="gallery-counter">1 / ' + images.length + '</span>' +
                    '<button type="button" class="gallery-btn" onclick="navigateGallery(this, 1)">Siguiente ›</button>' +
                  '</div>';
                }
                galHtml += '</div>';
                contentHtml += galHtml;
              }
            } else if (b.kind === 'resource') {
              const r = b.content || {};
              contentHtml += '<div class="scorm-resource-card">' +
                '<div class="resource-icon">' + escapeHtml(r.fileType || 'DOC') + '</div>' +
                '<div class="resource-info">' +
                  '<h4>' + escapeHtml(r.fileTitle || '') + '</h4>' +
                  '<p>' + escapeHtml(r.description || '') + '</p>' +
                  (r.fileSize ? '<span class="resource-size">Tamaño: ' + escapeHtml(r.fileSize) + '</span>' : '') +
                '</div>' +
                '<a href="' + escapeHtml(r.fileUrl || '#') + '" target="_blank" download class="btn-resource-dl">Descargar</a>' +
              '</div>';
            } else if (b.kind === 'knowledge_check') {
              const kc = b.content || {};
              const options = Array.isArray(kc.options) ? kc.options : [];
              let kcHtml = '<div class="scorm-kc-card" data-explanation="' + escapeHtml(kc.explanation || '') + '">' +
                '<div class="kc-badge">COMPROBACIÓN RÁPIDA DE CONOCIMIENTO</div>' +
                '<h4 class="kc-question">' + escapeHtml(kc.question || '') + '</h4>' +
                '<div class="kc-options">';
              options.forEach((opt) => {
                kcHtml += '<label class="kc-opt-label">' +
                  '<input type="radio" name="kc_opt_' + bIdx + '" value="' + (opt.isCorrect ? '1' : '0') + '"> ' +
                  '<span>' + escapeHtml(opt.text || '') + '</span>' +
                '</label>';
              });
              kcHtml += '</div>' +
                '<button type="button" class="btn-kc-check" onclick="checkTriviaAnswer(this)">Comprobar Respuesta</button>' +
                '<div class="kc-result" style="display:none;"></div>' +
              '</div>';
              contentHtml += kcHtml;
            }
          });
        }

        playerDiv.innerHTML = headerHtml + quoteHtml + contentHtml + 
          (curLesson.type === 'assessment' ? '' : '<button class="btn-player-continue" onclick="nextLesson()">CONTINUAR</button>');

        container.appendChild(playerDiv);
      }
    }

    function renderQuizFormHTML(assessment) {
      const questions = assessment.questions || [];
      let qHtml = questions.map((q, i) => {
        const optsHtml = (q.options || []).map(o => 
          '<label class="quiz-opt"><input type="radio" name="q_' + i + '" value="' + o.id + '"> <span>' + o.text + '</span></label>'
        ).join('');

        return '<div class="quiz-question"><div class="quiz-q-title">' + (i + 1) + '. ' + q.text + '</div>' + optsHtml + '</div>';
      }).join('');

      return '<div class="quiz-card"><form id="quiz-form">' + qHtml + '</form>' +
        '<div id="quiz-result-box" style="display:none; padding:16px; border-radius:8px; border:1px solid; margin-top:16px; text-align:center;"></div>' +
        '<button type="button" class="btn-player-continue" id="btn-quiz-submit" style="margin-top:16px;" onclick="submitQuiz(\\'' + assessment.id + '\\', ' + (assessment.passScore || 70) + ', ' + questions.length + ')">ENVIAR RESPUESTAS</button></div>';
    }

    function submitQuiz(assessmentId, passScore, questionCount) {
      const form = document.getElementById('quiz-form');
      if (!form) return;

      let correct = 0;
      for (let i = 0; i < questionCount; i++) {
        const selected = form.querySelector('input[name="q_' + i + '"]:checked');
        const q = (ALL_LESSONS.find(l => l.id === assessmentId)?.questions || [])[i];
        if (selected && q && selected.value === q.correctOptionId) {
          correct++;
        }
      }

      const scorePercent = questionCount > 0 ? Math.round((correct / questionCount) * 100) : 100;
      const passed = scorePercent >= passScore;

      ScormWrapper.setScoreAndStatus(scorePercent, passed ? 'passed' : 'failed');
      
      const resultBox = document.getElementById('quiz-result-box');
      const submitBtn = document.getElementById('btn-quiz-submit');
      if (submitBtn) submitBtn.style.display = 'none';

      if (resultBox) {
        resultBox.style.display = 'block';
        if (passed) {
          markCompleted(assessmentId);
          resultBox.style.background = '#f0fdf4';
          resultBox.style.borderColor = '#bbf7d0';
          resultBox.style.color = '#166534';
          resultBox.innerHTML = '<div style="font-size:16px; font-weight:800; margin-bottom:6px;">¡Excelente! Puntaje: ' + scorePercent + '% (Aprobado)</div>' +
            '<div style="font-size:13px; margin-bottom:14px;">Has superado el puntaje mínimo requerido (' + passScore + '%).</div>' +
            '<button type="button" class="btn-player-continue" onclick="nextLesson()">CONTINUAR A LA SIGUIENTE LECCIÓN</button>';
        } else {
          resultBox.style.background = '#fef2f2';
          resultBox.style.borderColor = '#fecaca';
          resultBox.style.color = '#991b1b';
          resultBox.innerHTML = '<div style="font-size:16px; font-weight:800; margin-bottom:6px;">Puntaje: ' + scorePercent + '% (No alcanzado)</div>' +
            '<div style="font-size:13px; margin-bottom:14px;">Requieres al menos un ' + passScore + '% para aprobar. Revisa las lecciones e inténtalo nuevamente.</div>' +
            '<button type="button" class="btn-player-continue" onclick="renderMainView()" style="background:#64748b;">REINTENTAR CUESTIONARIO</button>';
        }
      }
    }

    function toggleAccordionItem(btn) {
      const item = btn.closest('.acc-item');
      if (!item) return;
      const body = item.querySelector('.acc-body');
      const icon = item.querySelector('.acc-icon');
      const isVisible = body.style.display === 'block';
      body.style.display = isVisible ? 'none' : 'block';
      if (icon) icon.textContent = isVisible ? '▼' : '▲';
    }

    function toggleFlipCard(cardEl) {
      cardEl.classList.toggle('flipped');
    }

    function navigateGallery(btn, dir) {
      const gal = btn.closest('.scorm-gallery');
      if (!gal) return;
      let curr = parseInt(gal.getAttribute('data-current') || '0', 10);
      const total = parseInt(gal.getAttribute('data-total') || '1', 10);
      const slides = gal.querySelectorAll('.gallery-slide');
      
      slides[curr].style.display = 'none';
      curr = (curr + dir + total) % total;
      slides[curr].style.display = 'block';
      gal.setAttribute('data-current', curr);
      
      const counter = gal.querySelector('.gallery-counter');
      if (counter) counter.textContent = (curr + 1) + ' / ' + total;
    }

    function checkTriviaAnswer(btn) {
      const card = btn.closest('.scorm-kc-card');
      if (!card) return;
      const selected = card.querySelector('input[type="radio"]:checked');
      const resBox = card.querySelector('.kc-result');
      if (!resBox) return;
      if (!selected) {
        alert('Por favor seleccione una opción.');
        return;
      }
      const isCorrect = selected.value === '1';
      const explanation = card.getAttribute('data-explanation') || '';
      resBox.style.display = 'block';
      if (isCorrect) {
        resBox.className = 'kc-result correct';
        resBox.innerHTML = '<strong>¡Correcto! 🎉</strong><br>' + escapeHtml(explanation);
      } else {
        resBox.className = 'kc-result incorrect';
        resBox.innerHTML = '<strong>Respuesta Incorrecta</strong><br>' + escapeHtml(explanation);
      }
    }
  </script>
</body>
</html>`;
}

function buildScormPackageBuffer(course, moduleId = null) {
  return new Promise((resolve, reject) => {
    try {
      let exportCourse = course;
      let filename = '';

      if (moduleId) {
        const targetModule = (course.modules || []).find((m) => m.id === moduleId);
        if (targetModule) {
          exportCourse = {
            ...course,
            id: `${course.id}-${targetModule.id}`,
            title: `${targetModule.number ? targetModule.number + ': ' : ''}${targetModule.title}`,
            modules: [targetModule],
          };
          const safeModTitle = `${targetModule.number || 'Modulo'}_${targetModule.title}`.replace(/[^a-zA-Z0-9_-]/g, '_');
          filename = `${safeModTitle}.zip`;
        }
      }

      if (!filename) {
        const safeTitle = (course.title || 'curso_scorm').replace(/[^a-zA-Z0-9_-]/g, '_');
        filename = `${safeTitle}_Completo.zip`;
      }

      const { xml } = buildManifest(exportCourse);
      const archive = archiver('zip', { zlib: { level: 9 } });
      const chunks = [];

      archive.on('data', (chunk) => chunks.push(chunk));
      archive.on('end', () => resolve({ zipBuffer: Buffer.concat(chunks), filename }));
      archive.on('error', (err) => reject(err));

      // Agregar manifiesto XML SCORM 1.2
      archive.append(xml, { name: 'imsmanifest.xml' });

      // Agregar wrapper de API SCORM 1.2
      if (fs.existsSync(SCORM_WRAPPER_PATH)) {
        archive.file(SCORM_WRAPPER_PATH, { name: 'shared/scorm-wrapper.js' });
      } else {
        archive.append('window.ScormWrapper = { init:()=>{}, terminate:()=>{}, setLocation:()=>{}, setStatus:()=>{}, setScoreAndStatus:()=>{} };', { name: 'shared/scorm-wrapper.js' });
      }

      // Generar y agregar el HTML5 autónomo del reproductor interactivo (index.html)
      const playerHtml = generateStandalonePlayerHTML(exportCourse);
      archive.append(playerHtml, { name: 'index.html' });

      archive.finalize().catch(reject);
    } catch (err) {
      reject(err);
    }
  });
}

module.exports = { buildScormPackageBuffer };

