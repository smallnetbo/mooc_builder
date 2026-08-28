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

        const cfg = activeModule.coverConfig || {};
        const bgPosX = cfg.bgPositionX !== undefined ? cfg.bgPositionX : 50;
        const bgPosY = cfg.bgPositionY !== undefined ? cfg.bgPositionY : 50;
        const bgSize = cfg.bgSize || 'cover';
        const bgRepeat = cfg.bgRepeat || 'no-repeat';
        const bgOp = (cfg.bgOpacity !== undefined ? cfg.bgOpacity : 85) / 100;
        const bgColor = cfg.bgColor || '#0f172a';

        const overlayEnabled = cfg.overlayEnabled !== false;
        const topCol = cfg.overlayTopColor || '#000000';
        const topOp = (cfg.overlayTopOpacity !== undefined ? cfg.overlayTopOpacity : 50) / 100;
        const botCol = cfg.overlayBottomColor || activeModule.primaryColor || '#0f172a';
        const botOp = (cfg.overlayBottomOpacity !== undefined ? cfg.overlayBottomOpacity : 70) / 100;

        function toRgba(hex, alpha) {
          let c = String(hex || '#000000').replace('#', '');
          if (c.length === 3) c = c.split('').map(x => x + x).join('');
          const num = parseInt(c, 16);
          if (isNaN(num)) return 'rgba(0,0,0,' + alpha + ')';
          return 'rgba(' + ((num >> 16) & 255) + ',' + ((num >> 8) & 255) + ',' + (num & 255) + ',' + alpha + ')';
        }

        const overlayCss = overlayEnabled
          ? 'background: linear-gradient(to bottom, ' + toRgba(topCol, topOp) + ', ' + toRgba(botCol, botOp) + ');'
          : 'display: none;';

        const patternStyle = cfg.patternStyle || 'diamonds';
        const patternOp = (cfg.patternOpacity !== undefined ? cfg.patternOpacity : 20) / 100;
        let patternHtml = '';
        if (patternStyle !== 'none') {
          let patternSvg = '';
          if (patternStyle === 'diamonds') {
            patternSvg = '<pattern id="scorm-p-diamonds" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M20 0 L40 20 L20 40 L0 20 Z" fill="none" stroke="currentColor" stroke-width="1.2" stroke-opacity="0.7"/></pattern>';
          } else if (patternStyle === 'dots') {
            patternSvg = '<pattern id="scorm-p-dots" width="20" height="20" patternUnits="userSpaceOnUse"><circle cx="10" cy="10" r="3" fill="currentColor" fill-opacity="0.7"/></pattern>';
          } else if (patternStyle === 'grid') {
            patternSvg = '<pattern id="scorm-p-grid" width="30" height="30" patternUnits="userSpaceOnUse"><path d="M 30 0 L 0 0 0 30" fill="none" stroke="currentColor" stroke-width="1.2" stroke-opacity="0.5"/></pattern>';
          }
          patternHtml = '<div style="position:absolute; top:0; left:0; width:280px; height:280px; pointer-events:none; z-index:10; opacity:' + patternOp + ';"><svg width="100%" height="100%" viewBox="0 0 200 200"><defs>' + patternSvg + '</defs><rect width="200" height="200" fill="url(#scorm-p-' + patternStyle + ')"/></svg></div>';
        }

        const CURVES = {
          smooth: 'M0,0 Q720,130 1440,0 L1440,120 L0,120 Z',
          wave: 'M0,30 Q360,110 720,40 T1440,50 L1440,120 L0,120 Z',
          slant: 'M0,0 L1440,75 L1440,120 L0,120 Z',
          straight: 'M0,0 L1440,0 L1440,120 L0,120 Z',
          arch: 'M0,75 Q720,-35 1440,75 L1440,120 L0,120 Z'
        };
        const curvePath = CURVES[cfg.curveStyle] || CURVES.smooth;

        const coverImgStyle = "background-image: url('" + (activeModule.coverImage || 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?q=80&w=1600&auto=format&fit=crop') + "'); " +
          "background-position: " + bgPosX + "% " + bgPosY + "%; " +
          "background-size: " + bgSize + "; " +
          "background-repeat: " + bgRepeat + "; opacity: " + bgOp + ";";

        coverDiv.innerHTML = '<div class="cover-hero" style="background-color: ' + bgColor + ';">' +
          '<div class="cover-hero-bg" style="' + coverImgStyle + '"></div>' +
          '<div class="cover-hero-overlay" style="' + overlayCss + '"></div>' +
          patternHtml +
          '<div class="cover-hero-content">' +
            '<h1 class="cover-hero-title">' + (activeModule.number ? escapeHtml(activeModule.number) + ': ' : '') + escapeHtml(activeModule.title || '') + '</h1>' +
            '<button class="btn-cover-continue" onclick="startOrContinue()">CONTINUAR</button>' +
          '</div>' +
          '<div class="cover-hero-curve">' +
            '<svg viewBox="0 0 1440 120" preserveAspectRatio="none"><path d="' + curvePath + '" fill="currentColor"></path></svg>' +
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
          const qb = curLesson.quoteBanner;
          const qBg = qb.bgImage || 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?q=80&w=1200';
          const qPosX = qb.bgPositionX !== undefined ? qb.bgPositionX : 50;
          const qPosY = qb.bgPositionY !== undefined ? qb.bgPositionY : 50;
          const qSize = qb.bgSize || 'cover';
          const qRepeat = qb.bgRepeat || 'no-repeat';
          const qOp = (qb.bgOpacity !== undefined ? qb.bgOpacity : 30) / 100;
          const qColor = qb.bgColor || '#0f172a';
          const qOverlayEnabled = qb.overlayEnabled !== false;
          const qOverlayOp = (qb.overlayOpacity !== undefined ? qb.overlayOpacity : 70) / 100;

          const qBgStyle = "background-image: url('" + qBg + "'); " +
            "background-position: " + qPosX + "% " + qPosY + "%; " +
            "background-size: " + qSize + "; " +
            "background-repeat: " + qRepeat + "; opacity: " + qOp + ";";

          const qOverlayStyle = qOverlayEnabled
            ? "background: linear-gradient(to right, rgba(0,0,0," + qOverlayOp + "), rgba(0,0,0," + (qOverlayOp * 0.7) + "));"
            : "display: none;";

          quoteHtml = '<div class="quote-card" style="background-color: ' + qColor + ';">' +
            '<div class="quote-card-bg" style="' + qBgStyle + '"></div>' +
            '<div class="quote-card-overlay" style="' + qOverlayStyle + '"></div>' +
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

    window.activeAssessment = null;

    const QUIZ_RUNTIME = {};

    function getQuizRuntime(assessment) {
      const qId = (assessment && assessment.id) || 'quiz';
      if (!QUIZ_RUNTIME[qId]) {
        const settings = assessment ? (assessment.settings || {}) : {};
        const passScore = assessment ? (assessment.passScore || 70) : 70;
        const maxGrade = settings.max_grade || 10.0;
        const passingGrade = settings.passing_grade || (maxGrade === 10.0 ? Math.round(passScore / 10) : passScore);

        let attemptsHistory = [];
        try {
          const scormSuspend = ScormWrapper.getValue('cmi.suspend_data');
          if (scormSuspend && scormSuspend.startsWith('{')) {
            const parsed = JSON.parse(scormSuspend);
            if (parsed && parsed.quizAttempts && parsed.quizAttempts[qId]) {
              attemptsHistory = parsed.quizAttempts[qId];
            }
          }
        } catch (e) {}

        if (!attemptsHistory.length) {
          try {
            const localStr = localStorage.getItem('mooc_quiz_history_' + qId);
            if (localStr) attemptsHistory = JSON.parse(localStr) || [];
          } catch (e) {}
        }

        QUIZ_RUNTIME[qId] = {
          stage: 'cover',
          currentQIndex: 0,
          userAnswers: {},
          flaggedQuestions: {},
          timeRemaining: settings.time_limit_seconds || 0,
          timerInterval: null,
          attemptsHistory: attemptsHistory,
          showStartModal: false,
          showMaxAttemptsModal: false,
          showResultModal: false,
          lastResult: null,
          passingGrade: passingGrade,
          maxGrade: maxGrade,
          passScore: passScore
        };
      }
      return QUIZ_RUNTIME[qId];
    }

    function renderQuizFormHTML(assessment) {
      window.activeAssessment = assessment;
      const rt = getQuizRuntime(assessment);
      const questions = assessment.questions || [];
      const settings = assessment.settings || {};
      const maxAttempts = settings.max_attempts || 3;
      const timeLimitSecs = settings.time_limit_seconds || 0;
      const maxGrade = rt.maxGrade;
      const passingGrade = rt.passingGrade;

      // 1. STAGE === 'cover' (Moodle Cover Page)
      if (rt.stage === 'cover') {
        const canStart = maxAttempts === 0 || rt.attemptsHistory.length < maxAttempts;
        
        let historyRows = (rt.attemptsHistory || []).map((att, idx) => 
          '<tr style="border-bottom:1px solid #f1f5f9;">' +
            '<td style="padding:10px; font-weight:700;">Intento ' + (att.attemptNumber || (idx + 1)) + '</td>' +
            '<td style="padding:10px; color:#64748b;">Finalizado<br><span style="font-size:10px; color:#94a3b8;">' + (att.date || '') + '</span></td>' +
            '<td style="padding:10px; text-align:center; font-weight:800;">' + att.grade + ' / ' + maxGrade + '</td>' +
            '<td style="padding:10px; text-align:right;"><button type="button" style="color:#2563eb; font-weight:700; background:none; border:none; cursor:pointer;" onclick="onQuizAction(&quot;view_review&quot;, ' + idx + ')">Revisión</button></td>' +
          '</tr>'
        ).join('');

        let finalGradeHtml = '';
        if (rt.attemptsHistory.length > 0) {
          const grades = rt.attemptsHistory.map(a => Number(a.grade) || 0);
          const highest = Math.max(...grades);
          const isPassed = highest >= passingGrade;
          finalGradeHtml = '<div style="padding:14px; background:#f8fafc; border:1px solid #e2e8f0; border-radius:10px; display:flex; align-items:center; justify-content:space-between; margin-top:16px;">' +
            '<div><span style="font-size:12px; color:#64748b; font-weight:600; display:block;">Calificación registrada:</span><span style="font-size:16px; font-weight:900; color:#0f172a;">Calificación más alta: ' + highest.toFixed(2) + ' / ' + maxGrade + '</span></div>' +
            '<span style="padding:6px 12px; border-radius:6px; font-size:12px; font-weight:800; color:#fff; background:' + (isPassed ? '#16a34a' : '#e11d48') + ';">' + (isPassed ? '✓ APROBADO' : '✕ NO APROBADO') + '</span>' +
          '</div>';
        }

        let startModalHtml = '';
        if (rt.showStartModal) {
          startModalHtml = '<div style="position:fixed; inset:0; z-index:999; background:rgba(15,23,42,0.6); display:flex; align-items:center; justify-content:center; padding:16px;">' +
            '<div style="background:#fff; border-radius:16px; max-width:440px; width:100%; padding:24px; box-shadow:0 20px 25px rgba(0,0,0,0.25);">' +
              '<h3 style="font-size:16px; font-weight:800; color:#0f172a; margin-bottom:12px;">Comenzar Intento ' + (rt.attemptsHistory.length + 1) + (maxAttempts > 0 ? ' de ' + maxAttempts : '') + '</h3>' +
              '<p style="font-size:12.5px; color:#475569; line-height:1.5; margin-bottom:12px;">Está por comenzar su <strong>Intento ' + (rt.attemptsHistory.length + 1) + '</strong>.</p>' +
              (timeLimitSecs > 0 ? '<div style="padding:10px; background:#fffbeb; border:1px solid #fde68a; border-radius:8px; font-size:12px; color:#92400e; font-weight:600; margin-bottom:16px;">⚠️ Su intento tendrá un límite de tiempo de ' + Math.round(timeLimitSecs / 60) + ' minutos. El cronómetro no se detendrá.</div>' : '') +
              '<div style="display:flex; justify-content:flex-end; gap:10px;">' +
                '<button type="button" style="padding:8px 16px; border-radius:8px; border:1px solid #cbd5e1; background:#fff; font-size:12px; font-weight:700; cursor:pointer;" onclick="onQuizAction(&quot;close_modal&quot;)">Cancelar</button>' +
                '<button type="button" style="padding:8px 20px; border-radius:8px; border:none; background:var(--primary-orange); color:#fff; font-size:12px; font-weight:800; cursor:pointer;" onclick="onQuizAction(&quot;start_attempt_confirmed&quot;)">Comenzar Intento</button>' +
              '</div>' +
            '</div>' +
          '</div>';
        }

        let maxModalHtml = '';
        if (rt.showMaxAttemptsModal) {
          maxModalHtml = '<div style="position:fixed; inset:0; z-index:999; background:rgba(15,23,42,0.6); display:flex; align-items:center; justify-content:center; padding:16px;">' +
            '<div style="background:#fff; border-radius:16px; max-width:440px; width:100%; padding:24px; text-align:center; box-shadow:0 20px 25px rgba(0,0,0,0.25);">' +
              '<h3 style="font-size:17px; font-weight:900; color:#e11d48; margin-bottom:12px;">Límite de Intentos Alcanzado</h3>' +
              '<p style="font-size:12.5px; color:#475569; line-height:1.5; margin-bottom:16px;">Ha ocupado todos los intentos permitidos (<strong>' + rt.attemptsHistory.length + ' de ' + maxAttempts + '</strong>) para este cuestionario.</p>' +
              '<button type="button" style="width:100%; padding:10px; border-radius:8px; border:none; background:#0f172a; color:#fff; font-size:12px; font-weight:800; cursor:pointer;" onclick="onQuizAction(&quot;close_modal&quot;)">Entendido</button>' +
            '</div>' +
          '</div>';
        }

        return '<div class="quiz-card" style="background:#fff; border:1px solid #e2e8f0; border-radius:16px; padding:24px; box-shadow:0 4px 12px rgba(0,0,0,0.03); space-y:20px;">' +
          '<div style="background:linear-gradient(135deg, var(--primary-orange) 0%, #0f172a 100%); padding:24px; border-radius:12px; color:#fff; margin-bottom:20px;">' +
            '<span style="background:rgba(255,255,255,0.2); font-size:10px; font-weight:800; padding:3px 8px; border-radius:999px; text-transform:uppercase;">CUESTIONARIO</span>' +
            '<h2 style="font-size:20px; font-weight:900; margin-top:6px;">' + escapeHtml(assessment.title || '') + '</h2>' +
          '</div>' +
          '<div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(140px, 1fr)); gap:12px; background:#f8fafc; border:1px solid #e2e8f0; border-radius:12px; padding:16px; font-size:12px; margin-bottom:20px;">' +
            '<div><span style="color:#94a3b8; font-size:10px; font-weight:800; text-transform:uppercase; display:block;">Intentos Permitidos</span><span style="font-weight:900; color:#0f172a; font-size:13px;">' + (maxAttempts > 0 ? maxAttempts : 'Sin Límite') + '</span></div>' +
            '<div><span style="color:#94a3b8; font-size:10px; font-weight:800; text-transform:uppercase; display:block;">Tiempo Límite</span><span style="font-weight:900; color:#0f172a; font-size:13px;">' + (timeLimitSecs > 0 ? Math.round(timeLimitSecs / 60) + ' min' : 'Sin Límite') + '</span></div>' +
            '<div><span style="color:#94a3b8; font-size:10px; font-weight:800; text-transform:uppercase; display:block;">Calificación Aprobatoria</span><span style="font-weight:900; color:#166534; font-size:13px;">' + passingGrade + ' de ' + maxGrade + '</span></div>' +
            '<div><span style="color:#94a3b8; font-size:10px; font-weight:800; text-transform:uppercase; display:block;">Método Calificación</span><span style="font-weight:900; color:#0f172a; font-size:13px;">Calificación más alta</span></div>' +
          '</div>' +
          (rt.attemptsHistory.length > 0 ? '<div style="margin-bottom:20px;"><h4 style="font-size:11px; font-weight:800; color:#64748b; text-transform:uppercase; margin-bottom:8px;">Resumen de sus intentos previos</h4><table style="width:100%; font-size:12px; border-collapse:collapse;"><thead style="background:#f1f5f9; font-weight:800; color:#475569;"><tr><th style="padding:10px; text-align:left;">Intento</th><th style="padding:10px; text-align:left;">Estado</th><th style="padding:10px; text-align:center;">Calificación / ' + maxGrade + '</th><th style="padding:10px; text-align:right;">Revisión</th></tr></thead><tbody>' + historyRows + '</tbody></table></div>' : '') +
          finalGradeHtml +
          '<div style="margin-top:20px; display:flex; gap:12px; flex-wrap:wrap;">' +
            (canStart
              ? '<button type="button" class="btn-player-continue" style="flex:1; min-width:200px; font-weight:900; font-size:13px; padding:14px; background:' + (rt.attemptsHistory.length > 0 ? '#475569' : 'var(--primary-orange)') + ';" onclick="onQuizAction(&quot;request_start&quot;)">' + (rt.attemptsHistory.length === 0 ? 'Comenzar el cuestionario' : 'Reintentar el cuestionario') + '</button>'
              : '<button type="button" style="flex:1; min-width:200px; padding:14px; background:#e2e8f0; color:#64748b; font-weight:800; border-radius:8px; border:none; cursor:pointer;" onclick="onQuizAction(&quot;show_max_modal&quot;)">Límite de Intentos Alcanzado (' + maxAttempts + ' de ' + maxAttempts + ')</button>'
            ) +
            (rt.attemptsHistory.length > 0 || !canStart
              ? '<button type="button" class="btn-player-continue" style="flex:1; min-width:200px; font-weight:900; font-size:13px; padding:14px; background:var(--primary-orange);" onclick="nextLesson()">Continuar a la siguiente lección ›</button>'
              : ''
            ) +
          '</div>' +
          startModalHtml + maxModalHtml +
        '</div>';
      }

      // 2. STAGE === 'attempt' (Execution with Left Metadata Column, Clean Options, Floating Timer & Nav Grid)
      if (rt.stage === 'attempt') {
        const curQIdx = rt.currentQIndex || 0;
        const curQ = questions[curQIdx] || questions[0];
        const isMultiChoice = (curQ.options || []).filter(o => (o.weight_percentage || 0) > 0 || o.is_correct).length > 1;
        const inputType = isMultiChoice ? 'checkbox' : 'radio';
        const selectedOpts = rt.userAnswers[curQ.id] || [];

        const optsHtml = (curQ.options || []).map(o => {
          const isSelected = selectedOpts.includes(o.id);
          return '<label class="quiz-opt" style="display:flex; align-items:center; padding:14px; border:1px solid ' + (isSelected ? 'var(--primary-orange)' : '#e2e8f0') + '; background:' + (isSelected ? '#fff7ed' : '#fff') + '; border-radius:10px; margin-bottom:8px; cursor:pointer;">' +
            '<input type="' + inputType + '" name="q_' + curQ.id + '" value="' + o.id + '" ' + (isSelected ? 'checked' : '') + ' onchange="onQuizOptionSelect(&quot;' + o.id + '&quot;, ' + isMultiChoice + ')" style="margin-right:12px; accent-color:var(--primary-orange); width:16px; height:16px;">' +
            '<span style="font-size:13.5px; color:#1e293b; font-weight:500;">' + escapeHtml(o.text || '') + '</span>' +
          '</label>';
        }).join('');

        let navGridButtons = questions.map((q, idx) => {
          const isAns = (rt.userAnswers[q.id] || []).length > 0;
          const isCur = idx === curQIdx;
          const isFlag = Boolean(rt.flaggedQuestions[q.id]);
          return '<button type="button" onclick="onQuizNavIdx(' + idx + ')" style="position:relative; height:38px; border-radius:6px; border:1px solid ' + (isCur ? 'var(--primary-orange)' : '#cbd5e1') + '; font-size:12px; font-weight:800; background:' + (isAns ? '#0f172a' : '#fff') + '; color:' + (isAns ? '#fff' : '#334155') + '; cursor:pointer;">' +
            (idx + 1) + (isFlag ? '<span style="position:absolute; top:-2px; right:-2px; width:8px; height:8px; background:#f59e0b; border-radius:50%;"></span>' : '') +
          '</button>';
        }).join('');

        const isFlagged = Boolean(rt.flaggedQuestions[curQ.id]);

        return '<div class="quiz-card" style="background:#fff; border:1px solid #e2e8f0; border-radius:16px; padding:20px; box-shadow:0 4px 12px rgba(0,0,0,0.03);">' +
          '<div style="display:flex; align-items:center; justify-content:space-between; border-bottom:1px solid #e2e8f0; padding-bottom:12px; margin-bottom:20px;">' +
            '<div><h3 style="font-size:15px; font-weight:800; color:#0f172a;">' + escapeHtml(assessment.title || '') + '</h3><span style="font-size:11px; color:#94a3b8; font-weight:700;">Pregunta ' + (curQIdx + 1) + ' de ' + questions.length + '</span></div>' +
            (timeLimitSecs > 0 ? '<div class="quiz-timer-badge" style="padding:6px 12px; border-radius:8px; background:' + (rt.timeRemaining <= 120 ? '#e11d48' : 'var(--primary-orange)') + '; color:#fff; font-size:12px; font-weight:800;">⏱ Tiempo restante: ' + formatTimerSecs(rt.timeRemaining) + '</div>' : '') +
          '</div>' +
          '<div style="display:grid; grid-template-columns:1fr 240px; gap:20px;">' +
            '<div>' +
              '<div style="display:grid; grid-template-columns:140px 1fr; gap:16px; border:1px solid #e2e8f0; border-radius:12px; overflow:hidden; margin-bottom:16px;">' +
                '<div style="background:#f8fafc; border-right:1px solid #e2e8f0; padding:14px; font-size:11.5px; display:flex; flex-direction:column; justify-content:space-between;">' +
                  '<div><strong style="font-size:13px; color:#0f172a; display:block;">Pregunta ' + (curQIdx + 1) + '</strong><span style="color:#64748b; display:block; margin-top:2px;">' + (selectedOpts.length > 0 ? 'Respuesta guardada' : 'Sin responder aún') + '</span><span style="color:#64748b; display:block;">Se puntúa como ' + (curQ.points || 1) + ',00</span></div>' +
                  '<button type="button" style="margin-top:12px; padding:4px 8px; border-radius:4px; border:1px solid #cbd5e1; background:' + (isFlagged ? '#fef3c7' : '#fff') + '; color:' + (isFlagged ? '#92400e' : '#475569') + '; font-size:11px; font-weight:700; cursor:pointer;" onclick="onQuizToggleFlag(&quot;' + curQ.id + '&quot philosophy)">' + (isFlagged ? '⛳ Marcada' : 'Marcar pregunta') + '</button>' +
                '</div>' +
                '<div style="padding:16px; background:#fff;">' +
                  '<div style="font-weight:700; font-size:14.5px; color:#0f172a; margin-bottom:12px; line-height:1.5;">' + escapeHtml(curQ.text || '') + '</div>' +
                  '<div style="font-size:11px; font-weight:700; color:#94a3b8; text-transform:uppercase; margin-bottom:8px;">' + (isMultiChoice ? 'Seleccione una o más opciones:' : 'Seleccione una:') + '</div>' +
                  optsHtml +
                '</div>' +
              '</div>' +
              '<div style="display:flex; align-items:center; justify-content:space-between;">' +
                '<button type="button" style="padding:8px 16px; border-radius:8px; border:1px solid #cbd5e1; background:#fff; font-size:12px; font-weight:700; cursor:pointer;" ' + (curQIdx === 0 ? 'disabled style="opacity:0.4;"' : '') + ' onclick="onQuizNavIdx(' + (curQIdx - 1) + ')">‹ Anterior</button>' +
                (curQIdx < questions.length - 1
                  ? '<button type="button" style="padding:8px 20px; border-radius:8px; border:none; background:var(--primary-orange); color:#fff; font-size:12px; font-weight:800; cursor:pointer;" onclick="onQuizNavIdx(' + (curQIdx + 1) + ')">Siguiente ›</button>'
                  : '<button type="button" style="padding:8px 20px; border-radius:8px; border:none; background:#166534; color:#fff; font-size:12px; font-weight:800; cursor:pointer;" onclick="onQuizAction(&quot;go_summary&quot;)">Terminar intento...</button>'
                ) +
              '</div>' +
            '</div>' +
            '<div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:12px; padding:14px;">' +
              '<h4 style="font-size:11px; font-weight:800; color:#475569; text-transform:uppercase; margin-bottom:10px; border-bottom:1px solid #e2e8f0; padding-bottom:6px;">Navegación por el cuestionario</h4>' +
              '<div style="display:grid; grid-template-columns:repeat(4, 1fr); gap:6px; margin-bottom:12px;">' + navGridButtons + '</div>' +
              '<button type="button" style="width:100%; padding:8px; border-radius:6px; border:none; background:#166534; color:#fff; font-size:11px; font-weight:800; cursor:pointer;" onclick="onQuizAction(&quot;go_summary&quot;)">Terminar intento...</button>' +
            '</div>' +
          '</div>' +
        '</div>';
      }

      // 3. STAGE === 'summary' (Pre-submission Review)
      if (rt.stage === 'summary') {
        const rowsHtml = questions.map((q, idx) => {
          const isAns = (rt.userAnswers[q.id] || []).length > 0;
          return '<tr style="border-bottom:1px solid #f1f5f9;">' +
            '<td style="padding:10px; font-weight:700;">Pregunta ' + (idx + 1) + '</td>' +
            '<td style="padding:10px; font-weight:600; color:' + (isAns ? '#166534' : '#e11d48') + ';">' + (isAns ? 'Respuesta guardada' : 'Sin responder aún') + '</td>' +
          '</tr>';
        }).join('');

        let resultModalHtml = '';
        if (rt.showResultModal && rt.lastResult) {
          const res = rt.lastResult;
          resultModalHtml = '<div style="position:fixed; inset:0; z-index:999; background:rgba(15,23,42,0.6); display:flex; align-items:center; justify-content:center; padding:16px;">' +
            '<div style="background:#fff; border-radius:16px; max-width:420px; width:100%; padding:24px; text-align:center; box-shadow:0 20px 25px rgba(0,0,0,0.25);">' +
              '<h3 style="font-size:18px; font-weight:900; color:#0f172a; margin-bottom:12px;">' + (res.isPassed ? '¡Felicidades! Evaluación Aprobada' : 'Intento Finalizado') + '</h3>' +
              '<div style="padding:14px; background:#f8fafc; border-radius:10px; margin-bottom:14px;"><span style="font-size:11px; color:#94a3b8; font-weight:700; text-transform:uppercase; display:block;">Calificación Obtenida</span><span style="font-size:26px; font-weight:900; color:#0f172a;">' + res.grade + ' / ' + maxGrade + '</span><span style="font-size:12px; color:#64748b; font-weight:700; display:block;">(' + res.percentage + '%)</span></div>' +
              '<p style="font-size:12px; color:#475569; margin-bottom:16px;">' + (res.isPassed ? 'Has superado la calificación mínima de ' + passingGrade + ' requerida.' : 'No alcanzaste la nota mínima de ' + passingGrade + ' para aprobar.') + '</p>' +
              '<div style="display:flex; gap:10px;">' +
                '<button type="button" style="flex:1; padding:10px; border-radius:8px; border:none; background:#0f172a; color:#fff; font-size:11.5px; font-weight:800; cursor:pointer;" onclick="onQuizAction(&quot;view_review&quot;, ' + (rt.attemptsHistory.length - 1) + ')">Ver Revisión (✔/✕)</button>' +
                '<button type="button" style="flex:1; padding:10px; border-radius:8px; border:none; background:var(--primary-orange); color:#fff; font-size:11.5px; font-weight:800; cursor:pointer;" onclick="onQuizAction(&quot;go_cover&quot;)">Continuar</button>' +
              '</div>' +
            '</div>' +
          '</div>';
        }

        return '<div class="quiz-card" style="background:#fff; border:1px solid #e2e8f0; border-radius:16px; padding:24px; box-shadow:0 4px 12px rgba(0,0,0,0.03);">' +
          '<h3 style="font-size:18px; font-weight:800; color:#0f172a; margin-bottom:6px;">Resumen del intento</h3>' +
          '<p style="font-size:12px; color:#64748b; margin-bottom:16px;">Verifique sus respuestas antes del envío definitivo.</p>' +
          '<table style="width:100%; font-size:12px; border-collapse:collapse; margin-bottom:20px;"><thead style="background:#f1f5f9; font-weight:800; color:#475569;"><tr><th style="padding:10px; text-align:left;">Pregunta</th><th style="padding:10px; text-align:left;">Estado</th></tr></thead><tbody>' + rowsHtml + '</tbody></table>' +
          '<div style="display:flex; align-items:center; justify-content:space-between;">' +
            '<button type="button" style="padding:10px 18px; border-radius:8px; border:1px solid #cbd5e1; background:#fff; font-size:12px; font-weight:700; cursor:pointer;" onclick="onQuizAction(&quot;go_attempt&quot;)">Volver al intento</button>' +
            '<button type="button" style="padding:10px 22px; border-radius:8px; border:none; background:#166534; color:#fff; font-size:12px; font-weight:800; cursor:pointer;" onclick="submitQuizAttemptFinal()">Enviar todo y terminar</button>' +
          '</div>' +
          resultModalHtml +
        '</div>';
      }

      // 4. STAGE === 'review' (Detailed Feedback Review with Moodle Marks)
      if (rt.stage === 'review') {
        const att = rt.attemptsHistory[rt.reviewingAttemptIndex !== null ? rt.reviewingAttemptIndex : rt.attemptsHistory.length - 1] || {};
        const qResults = att.questionResults || {};

        const revQuestionsHtml = questions.map((q, idx) => {
          const sel = att.userAnswers?.[q.id] || [];
          const res = qResults[q.id] || { rawScore: 0, maxPoints: 1, percentage: 0 };
          const isFull = res.percentage >= 100;
          const isPart = res.percentage > 0 && res.percentage < 100;

          const optsHtml = (q.options || []).map(o => {
            const isSel = sel.includes(o.id);
            const isCorr = (o.weight_percentage || 0) > 0 || o.is_correct;
            let mark = '';
            if (isSel && isCorr) mark = '<strong style="color:#166534; margin-left:8px;">✓ Correcta</strong>';
            else if (isSel && !isCorr) mark = '<strong style="color:#e11d48; margin-left:8px;">✕ Incorrecta</strong>';

            return '<div style="padding:10px 14px; border:1px solid ' + (isSel ? (isCorr ? '#22c55e' : '#ef4444') : '#e2e8f0') + '; background:' + (isSel ? (isCorr ? '#f0fdf4' : '#fef2f2') : '#fff') + '; border-radius:8px; margin-bottom:6px; font-size:13px; font-weight:500;">' +
              '<input type="radio" ' + (isSel ? 'checked' : '') + ' disabled style="margin-right:8px;"> ' + escapeHtml(o.text || '') + mark +
            '</div>';
          }).join('');

          return '<div style="display:grid; grid-template-columns:140px 1fr; gap:16px; border:1px solid #e2e8f0; border-radius:12px; overflow:hidden; margin-bottom:16px;">' +
            '<div style="background:#f8fafc; border-right:1px solid #e2e8f0; padding:14px; font-size:11.5px;">' +
              '<strong style="font-size:13px; color:#0f172a; display:block;">Pregunta ' + (idx + 1) + '</strong>' +
              '<span style="font-weight:700; color:' + (isFull ? '#166534' : isPart ? '#d97706' : '#e11d48') + '; display:block; margin-top:2px;">' + (isFull ? 'Correcta' : isPart ? 'Parcialmente correcta' : 'Incorrecta') + '</span>' +
              '<span style="color:#64748b; display:block;">Se puntúa ' + res.rawScore + ' sobre ' + res.maxPoints + '</span>' +
            '</div>' +
            '<div style="padding:16px; background:#fff;">' +
              '<div style="font-weight:700; font-size:14.5px; color:#0f172a; margin-bottom:12px;">' + escapeHtml(q.text || '') + '</div>' +
              optsHtml +
            '</div>' +
          '</div>';
        }).join('');

        return '<div class="quiz-card" style="background:#fff; border:1px solid #e2e8f0; border-radius:16px; padding:24px; box-shadow:0 4px 12px rgba(0,0,0,0.03);">' +
          '<div style="display:flex; align-items:center; justify-content:space-between; border-bottom:1px solid #e2e8f0; padding-bottom:12px; margin-bottom:16px;">' +
            '<div><h3 style="font-size:17px; font-weight:800; color:#0f172a;">Revisión del Intento ' + (att.attemptNumber || 1) + '</h3><span style="font-size:11px; color:#64748b;">Finalizado en: ' + (att.date || '') + '</span></div>' +
            '<div style="display:flex; gap:8px;">' +
              '<button type="button" style="padding:8px 16px; border-radius:8px; border:1px solid #cbd5e1; background:#fff; font-size:12px; font-weight:700; cursor:pointer;" onclick="onQuizAction(&quot;go_cover&quot;)">Volver a carátula</button>' +
              '<button type="button" style="padding:8px 16px; border-radius:8px; border:none; background:var(--primary-orange); color:#fff; font-size:12px; font-weight:800; cursor:pointer;" onclick="nextLesson()">Continuar ›</button>' +
            '</div>' +
          '</div>' +
          '<div style="padding:14px; background:#f8fafc; border:1px solid #e2e8f0; border-radius:10px; display:flex; align-items:center; justify-content:space-between; margin-bottom:20px; font-size:12.5px;">' +
            '<div><strong>Calificación:</strong> ' + att.grade + ' de ' + maxGrade + ' (' + (att.attemptScore?.percentage || 0) + '%)</div>' +
            '<strong style="color:' + (att.isPassed ? '#166534' : '#e11d48') + ';">' + (att.isPassed ? 'Aprobado' : 'No Aprobado') + '</strong>' +
          '</div>' +
          revQuestionsHtml +
        '</div>';
      }

      return '<div>Evaluación</div>';
    }

    function formatTimerSecs(s) {
      const m = Math.floor(s / 60);
      const sec = s % 60;
      return (m < 10 ? '0' : '') + m + ':' + (sec < 10 ? '0' : '') + sec;
    }

    function onQuizAction(action, extra) {
      const assessment = window.activeAssessment;
      if (!assessment) return;
      const rt = getQuizRuntime(assessment);
      const settings = assessment.settings || {};
      const max = settings.max_attempts || 3;

      if (action === 'request_start') {
        if (max > 0 && rt.attemptsHistory.length >= max) {
          rt.showMaxAttemptsModal = true;
        } else if ((settings.time_limit_seconds || 0) > 0 || max > 0) {
          rt.showStartModal = true;
        } else {
          rt.stage = 'attempt';
          rt.userAnswers = {};
          rt.flaggedQuestions = {};
          rt.currentQIndex = 0;
          rt.timeRemaining = settings.time_limit_seconds || 0;
          startQuizTimer();
        }
      } else if (action === 'start_attempt_confirmed') {
        rt.showStartModal = false;
        rt.stage = 'attempt';
        rt.userAnswers = {};
        rt.flaggedQuestions = {};
        rt.currentQIndex = 0;
        rt.timeRemaining = settings.time_limit_seconds || 0;
        startQuizTimer();
      } else if (action === 'show_max_modal') {
        rt.showMaxAttemptsModal = true;
      } else if (action === 'close_modal') {
        rt.showStartModal = false;
        rt.showMaxAttemptsModal = false;
        rt.showResultModal = false;
      } else if (action === 'go_summary') {
        rt.stage = 'summary';
      } else if (action === 'go_attempt') {
        rt.stage = 'attempt';
      } else if (action === 'go_cover') {
        rt.stage = 'cover';
        rt.showResultModal = false;
      } else if (action === 'view_review') {
        rt.reviewingAttemptIndex = typeof extra === 'number' ? extra : rt.attemptsHistory.length - 1;
        rt.stage = 'review';
      }

      renderMainView();
    }

    function startQuizTimer() {
      const assessment = window.activeAssessment;
      if (!assessment) return;
      const rt = getQuizRuntime(assessment);
      if (rt.timerInterval) clearInterval(rt.timerInterval);

      if ((assessment.settings?.time_limit_seconds || 0) > 0) {
        rt.timerInterval = setInterval(() => {
          if (rt.stage !== 'attempt') {
            clearInterval(rt.timerInterval);
            return;
          }
          rt.timeRemaining--;
          if (rt.timeRemaining <= 0) {
            clearInterval(rt.timerInterval);
            submitQuizAttemptFinal(true);
          } else {
            const timerEl = document.querySelector('.quiz-timer-badge');
            if (timerEl) timerEl.textContent = '⏱ Tiempo restante: ' + formatTimerSecs(rt.timeRemaining);
          }
        }, 1000);
      }
    }

    function onQuizOptionSelect(optionId, isMultiChoice) {
      const assessment = window.activeAssessment;
      if (!assessment) return;
      const rt = getQuizRuntime(assessment);
      const curQIdx = rt.currentQIndex || 0;
      const questions = assessment.questions || [];
      const curQ = questions[curQIdx];
      if (!curQ) return;

      const current = rt.userAnswers[curQ.id] || [];
      if (isMultiChoice) {
        if (current.includes(optionId)) {
          rt.userAnswers[curQ.id] = current.filter(id => id !== optionId);
        } else {
          rt.userAnswers[curQ.id] = [...current, optionId];
        }
      } else {
        rt.userAnswers[curQ.id] = [optionId];
      }
    }

    function onQuizToggleFlag(questionId) {
      const assessment = window.activeAssessment;
      if (!assessment) return;
      const rt = getQuizRuntime(assessment);
      rt.flaggedQuestions[questionId] = !rt.flaggedQuestions[questionId];
      renderMainView();
    }

    function onQuizNavIdx(idx) {
      const assessment = window.activeAssessment;
      if (!assessment) return;
      const rt = getQuizRuntime(assessment);
      rt.currentQIndex = idx;
      rt.stage = 'attempt';
      renderMainView();
    }

    function submitQuizAttemptFinal(isAutoSubmit = false) {
      const assessment = window.activeAssessment;
      if (!assessment) return;
      const qId = assessment.id;
      const rt = getQuizRuntime(assessment);
      const questions = assessment.questions || [];

      let totalEarnedPoints = 0;
      let totalMaxPoints = 0;
      const questionResults = {};

      questions.forEach((q) => {
        const qPoints = Number(q.points) || 1;
        totalMaxPoints += qPoints;

        const selected = rt.userAnswers[q.id] || [];
        let netWeight = 0;

        selected.forEach(optId => {
          const opt = (q.options || []).find(o => o.id === optId);
          if (opt) {
            const w = opt.weight_percentage !== undefined ? Number(opt.weight_percentage) : (opt.is_correct || q.correctOptionId === opt.id ? 100 : 0);
            netWeight += w;
          }
        });

        const clampedWeight = Math.max(0, netWeight);
        const normWeight = Math.abs(clampedWeight - 100) < 0.01 ? 100 : clampedWeight;
        const earned = (normWeight / 100) * qPoints;

        totalEarnedPoints += earned;
        questionResults[q.id] = {
          rawScore: Math.round(earned * 100) / 100,
          maxPoints: qPoints,
          percentage: Math.round(normWeight * 100) / 100
        };
      });

      const scorePercent = totalMaxPoints > 0 ? Math.round((totalEarnedPoints / totalMaxPoints) * 100) : 100;
      const grade = totalMaxPoints > 0 ? Math.round(((totalEarnedPoints / totalMaxPoints) * rt.maxGrade) * 100) / 100 : rt.maxGrade;
      const isPassed = grade >= rt.passingGrade;

      const dateStr = new Date().toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

      const newRecord = {
        attemptNumber: rt.attemptsHistory.length + 1,
        date: dateStr,
        userAnswers: { ...rt.userAnswers },
        questionResults,
        grade,
        maxGrade: rt.maxGrade,
        percentage: scorePercent,
        isPassed
      };

      rt.attemptsHistory.push(newRecord);
      rt.lastResult = newRecord;

      try {
        ScormWrapper.setScoreAndStatus(scorePercent, isPassed ? 'passed' : 'failed');
        ScormWrapper.setValue('cmi.core.score.raw', String(scorePercent));
        ScormWrapper.setValue('cmi.core.lesson_status', isPassed ? 'passed' : 'failed');

        const prevSuspend = ScormWrapper.getValue('cmi.suspend_data');
        let suspendObj = {};
        if (prevSuspend && prevSuspend.startsWith('{')) suspendObj = JSON.parse(prevSuspend);
        suspendObj.quizAttempts = suspendObj.quizAttempts || {};
        suspendObj.quizAttempts[qId] = rt.attemptsHistory;

        ScormWrapper.setValue('cmi.suspend_data', JSON.stringify(suspendObj));
        ScormWrapper.commit();
      } catch (e) {}

      try {
        localStorage.setItem('mooc_quiz_history_' + qId, JSON.stringify(rt.attemptsHistory));
      } catch (e) {}

      rt.showResultModal = true;
      markCompleted(qId);
      renderMainView();

      if (isAutoSubmit) {
        alert('⏰ ¡El tiempo asignado se ha agotado! Sus respuestas han sido enviadas automáticamente.');
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

async function processCourseImageAssets(exportCourse) {
  const assetFiles = [];
  const imageBuffers = [];

  if (!exportCourse || !Array.isArray(exportCourse.modules)) {
    return { processedCourse: exportCourse, assetFiles, imageBuffers };
  }

  const clonedCourse = JSON.parse(JSON.stringify(exportCourse));

  for (let mIdx = 0; mIdx < clonedCourse.modules.length; mIdx++) {
    const mod = clonedCourse.modules[mIdx];
    if (mod && mod.coverImage) {
      const imgStr = String(mod.coverImage).trim();
      const modId = mod.id || `mod-${mIdx}`;

      if (imgStr.startsWith('data:image/')) {
        try {
          const match = imgStr.match(/^data:image\/([a-zA-Z0-9\+\-\.]+);base64,(.+)$/);
          if (match) {
            let ext = match[1].toLowerCase();
            if (ext === 'jpeg') ext = 'jpg';
            if (ext === 'svg+xml') ext = 'svg';
            const base64Data = match[2];
            const buffer = Buffer.from(base64Data, 'base64');
            const relPath = `assets/images/cover_${modId}.${ext}`;

            imageBuffers.push({ relPath, buffer });
            assetFiles.push(relPath);
            mod.coverImage = relPath;
          }
        } catch (err) {
          console.error(`Error procesando imagen base64 del módulo ${modId}:`, err);
        }
      } else if (imgStr.startsWith('http://') || imgStr.startsWith('https://')) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 6000);
          const res = await fetch(imgStr, { signal: controller.signal });
          clearTimeout(timeoutId);

          if (res.ok) {
            const arrayBuf = await res.arrayBuffer();
            const buffer = Buffer.from(arrayBuf);

            let ext = 'jpg';
            const contentType = res.headers.get('content-type') || '';
            if (contentType.includes('png')) ext = 'png';
            else if (contentType.includes('svg')) ext = 'svg';
            else if (contentType.includes('webp')) ext = 'webp';
            else if (contentType.includes('gif')) ext = 'gif';
            else {
              const urlExtMatch = imgStr.match(/\.(png|jpg|jpeg|svg|webp|gif)(\?|$)/i);
              if (urlExtMatch) ext = urlExtMatch[1].toLowerCase();
            }

            const relPath = `assets/images/cover_${modId}.${ext}`;
            imageBuffers.push({ relPath, buffer });
            assetFiles.push(relPath);
            mod.coverImage = relPath;
          }
        } catch (err) {
          console.warn(`No se pudo descargar la imagen remota ${imgStr} para el módulo ${modId}:`, err.message);
        }
      }
    }

    // Procesar imágenes de banners de cita en lecciones
    async function processLessonQuotes(node) {
      if (!node) return;
      if (node.quoteBanner && node.quoteBanner.bgImage) {
          const qImgStr = String(node.quoteBanner.bgImage).trim();
          const lesId = node.id || 'les';

          if (qImgStr.startsWith('data:image/')) {
            try {
              const match = qImgStr.match(/^data:image\/([a-zA-Z0-9\+\-\.]+);base64,(.+)$/);
              if (match) {
                let ext = match[1].toLowerCase();
                if (ext === 'jpeg') ext = 'jpg';
                if (ext === 'svg+xml') ext = 'svg';
                const base64Data = match[2];
                const buffer = Buffer.from(base64Data, 'base64');
                const relPath = `assets/images/quote_${lesId}.${ext}`;

                imageBuffers.push({ relPath, buffer });
                assetFiles.push(relPath);
                node.quoteBanner.bgImage = relPath;
              }
            } catch (err) {
              console.error(`Error procesando imagen base64 de cita para lección ${lesId}:`, err);
            }
          } else if (qImgStr.startsWith('http://') || qImgStr.startsWith('https://')) {
            try {
              const controller = new AbortController();
              const timeoutId = setTimeout(() => controller.abort(), 6000);
              const res = await fetch(qImgStr, { signal: controller.signal });
              clearTimeout(timeoutId);

              if (res.ok) {
                const arrayBuf = await res.arrayBuffer();
                const buffer = Buffer.from(arrayBuf);

                let ext = 'jpg';
                const contentType = res.headers.get('content-type') || '';
                if (contentType.includes('png')) ext = 'png';
                else if (contentType.includes('svg')) ext = 'svg';
                else if (contentType.includes('webp')) ext = 'webp';
                else if (contentType.includes('gif')) ext = 'gif';
                else {
                  const urlExtMatch = qImgStr.match(/\.(png|jpg|jpeg|svg|webp|gif)(\?|$)/i);
                  if (urlExtMatch) ext = urlExtMatch[1].toLowerCase();
                }

                const relPath = `assets/images/quote_${lesId}.${ext}`;
                imageBuffers.push({ relPath, buffer });
                assetFiles.push(relPath);
                node.quoteBanner.bgImage = relPath;
              }
            } catch (err) {
              console.warn(`No se pudo descargar la imagen remota de cita ${qImgStr} para lección ${lesId}:`, err.message);
            }
          }
        }

        if (Array.isArray(node.children)) {
          for (const child of node.children) {
            await processLessonQuotes(child);
          }
        }
      }

      await processLessonQuotes(mod);
    }

  return { processedCourse: clonedCourse, assetFiles, imageBuffers };
}

async function buildScormPackageBuffer(course, moduleId = null) {
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

  const { processedCourse, assetFiles, imageBuffers } = await processCourseImageAssets(exportCourse);

  return new Promise((resolve, reject) => {
    try {
      const { xml } = buildManifest(processedCourse, assetFiles);
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

      // Agregar imágenes procesadas al paquete ZIP
      for (const item of imageBuffers) {
        archive.append(item.buffer, { name: item.relPath });
      }

      // Generar y agregar el HTML5 autónomo del reproductor interactivo (index.html)
      const playerHtml = generateStandalonePlayerHTML(processedCourse);
      archive.append(playerHtml, { name: 'index.html' });

      archive.finalize().catch(reject);
    } catch (err) {
      reject(err);
    }
  });
}

module.exports = { buildScormPackageBuffer };

