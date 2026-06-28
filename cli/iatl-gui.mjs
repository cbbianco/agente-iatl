#!/usr/bin/env node
import { createServer } from "node:http";
import { spawn, exec } from "node:child_process";
import { platform } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const REPO_ROOT = join(__dirname, "..");
const PORT = 8020;

function openBrowser(url) {
  const start =
    platform() === "darwin"
      ? "open"
      : platform() === "win32"
      ? "start"
      : "xdg-open";
  exec(`${start} ${url}`).unref();
}

const htmlTemplate = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Portal de Instalación IATL</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Outfit:wght@400;500;600;700;800&family=Fira+Code:wght@400;500&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg: #030712;
      --card-bg: rgba(17, 24, 39, 0.45);
      --border: rgba(255, 255, 255, 0.08);
      --text: #f3f4f6;
      --text-muted: #9ca3af;
      --primary: #6366f1;
      --primary-hover: #4f46e5;
      --primary-glow: rgba(99, 102, 241, 0.35);
      --secondary: #a855f7;
      --secondary-hover: #9333ea;
      --secondary-glow: rgba(168, 85, 247, 0.35);
      --success: #10b981;
      --error: #ef4444;
      --transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: 'Inter', sans-serif;
      background: var(--bg);
      color: var(--text);
      min-height: 100vh;
      overflow-x: hidden;
      position: relative;
    }

    /* Ambient background glows */
    .glow-1 {
      position: absolute;
      top: -200px;
      left: -200px;
      width: 600px;
      height: 600px;
      background: radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, transparent 70%);
      z-index: -1;
      pointer-events: none;
    }

    .glow-2 {
      position: absolute;
      bottom: -200px;
      right: -200px;
      width: 600px;
      height: 600px;
      background: radial-gradient(circle, rgba(168, 85, 247, 0.12) 0%, transparent 70%);
      z-index: -1;
      pointer-events: none;
    }

    header {
      width: 90%;
      max-width: 1200px;
      margin: 40px auto 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .logo-container {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .logo-icon {
      font-size: 2.2rem;
      animation: pulse 2s infinite;
    }

    .logo-text {
      font-family: 'Outfit', sans-serif;
      font-weight: 800;
      font-size: 1.8rem;
      background: linear-gradient(135deg, #ffffff 30%, var(--primary) 70%, var(--secondary) 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .subtitle {
      font-size: 0.95rem;
      color: var(--text-muted);
      margin-top: 4px;
    }

    /* Main Container layout */
    .container {
      width: 90%;
      max-width: 1200px;
      margin: 0 auto 60px;
      display: grid;
      grid-template-columns: 1.2fr 0.8fr;
      gap: 30px;
    }

    @media (max-width: 1024px) {
      .container {
        grid-template-columns: 1fr;
      }
    }

    /* Tabs */
    .tabs-header {
      display: flex;
      gap: 10px;
      margin-bottom: 20px;
      border-bottom: 1px solid var(--border);
      padding-bottom: 10px;
    }

    .tab-btn {
      padding: 10px 20px;
      background: transparent;
      border: none;
      color: var(--text-muted);
      font-family: 'Outfit', sans-serif;
      font-weight: 600;
      font-size: 1rem;
      cursor: pointer;
      border-radius: 8px;
      transition: var(--transition);
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .tab-btn:hover {
      color: var(--text);
      background: rgba(255, 255, 255, 0.03);
    }

    .tab-btn.active {
      color: var(--primary);
      background: rgba(99, 102, 241, 0.1);
      box-shadow: inset 0 0 0 1px rgba(99, 102, 241, 0.2);
    }

    .tab-content {
      display: none;
    }

    .tab-content.active {
      display: block;
      animation: fadeIn 0.4s ease-out;
    }

    /* Card Panels */
    .panel {
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 16px;
      padding: 30px;
      backdrop-filter: blur(16px);
      box-shadow: 0 4px 30px rgba(0, 0, 0, 0.3);
    }

    .panel-title {
      font-family: 'Outfit', sans-serif;
      font-size: 1.3rem;
      margin-bottom: 24px;
      display: flex;
      align-items: center;
      gap: 10px;
      color: #ffffff;
      border-left: 4px solid var(--primary);
      padding-left: 12px;
    }

    /* Forms */
    .form-group {
      margin-bottom: 20px;
    }

    .form-label {
      display: block;
      font-size: 0.88rem;
      font-weight: 600;
      color: var(--text);
      margin-bottom: 8px;
    }

    .form-desc {
      font-size: 0.78rem;
      color: var(--text-muted);
      margin-bottom: 8px;
      margin-top: -4px;
    }

    .form-control {
      width: 100%;
      padding: 12px 16px;
      background: rgba(0, 0, 0, 0.3);
      border: 1px solid var(--border);
      border-radius: 8px;
      color: #ffffff;
      font-family: inherit;
      font-size: 0.92rem;
      transition: var(--transition);
    }

    .form-control:focus {
      outline: none;
      border-color: var(--primary);
      box-shadow: 0 0 0 3px var(--primary-glow);
    }

    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
    }

    @media (max-width: 600px) {
      .form-row {
        grid-template-columns: 1fr;
      }
    }

    .checkbox-group {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-top: 10px;
    }

    .checkbox-control {
      width: 18px;
      height: 18px;
      accent-color: var(--primary);
      cursor: pointer;
    }

    /* Runtime cards selector */
    .runtime-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
      gap: 12px;
      margin-bottom: 20px;
    }

    .runtime-card {
      background: rgba(255, 255, 255, 0.02);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 16px;
      text-align: center;
      cursor: pointer;
      transition: var(--transition);
      position: relative;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }

    .runtime-card:hover {
      background: rgba(255, 255, 255, 0.05);
      border-color: rgba(255, 255, 255, 0.2);
    }

    .runtime-card.selected {
      background: rgba(99, 102, 241, 0.1);
      border-color: var(--primary);
      box-shadow: 0 0 10px rgba(99, 102, 241, 0.2);
    }

    .runtime-icon {
      font-size: 1.8rem;
    }

    .runtime-name {
      font-size: 0.8rem;
      font-weight: 600;
    }

    /* Action Buttons */
    .btn-action {
      width: 100%;
      padding: 14px 28px;
      font-family: 'Outfit', sans-serif;
      font-weight: 700;
      font-size: 1.05rem;
      color: #ffffff;
      background: linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%);
      border: none;
      border-radius: 8px;
      cursor: pointer;
      transition: var(--transition);
      box-shadow: 0 4px 15px var(--primary-glow);
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
    }

    .btn-action:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px var(--primary-glow);
      opacity: 0.95;
    }

    .btn-action:disabled {
      background: #374151;
      box-shadow: none;
      transform: none;
      cursor: not-allowed;
      opacity: 0.6;
    }

    /* Console terminal panel */
    .terminal-panel {
      background: #05070f;
      border: 1px solid rgba(255, 255, 255, 0.05);
      border-radius: 16px;
      display: flex;
      flex-direction: column;
      height: 600px;
      box-shadow: inset 0 0 20px rgba(0, 0, 0, 0.8);
      position: sticky;
      top: 40px;
    }

    .terminal-header {
      padding: 12px 18px;
      background: rgba(255, 255, 255, 0.02);
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-top-left-radius: 16px;
      border-top-right-radius: 16px;
    }

    .terminal-dots {
      display: flex;
      gap: 6px;
    }

    .dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
    }

    .dot-red { background: #ff5f56; }
    .dot-yellow { background: #ffbd2e; }
    .dot-green { background: #27c93f; }

    .terminal-title {
      font-family: 'Fira Code', monospace;
      font-size: 0.78rem;
      color: var(--text-muted);
    }

    .terminal-body {
      flex: 1;
      padding: 20px;
      overflow-y: auto;
      font-family: 'Fira Code', monospace;
      font-size: 0.85rem;
      line-height: 1.5;
      color: #9cdcfe;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .terminal-line {
      white-space: pre-wrap;
      word-break: break-all;
    }

    .line-stdout {
      color: #d4d4d4;
    }

    .line-stderr {
      color: var(--error);
      background: rgba(239, 68, 68, 0.1);
      padding: 2px 6px;
      border-radius: 4px;
    }

    .line-cmd {
      color: var(--primary);
      font-weight: bold;
    }

    .line-success {
      color: var(--success);
      font-weight: bold;
    }

    /* Helper styling */
    .card-construct-option {
      background: rgba(255, 255, 255, 0.02);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 20px;
      cursor: pointer;
      transition: var(--transition);
      display: flex;
      align-items: center;
      gap: 16px;
      margin-bottom: 24px;
    }

    .card-construct-option.selected {
      background: rgba(99, 102, 241, 0.08);
      border-color: var(--primary);
      box-shadow: 0 0 15px rgba(99, 102, 241, 0.1);
    }

    .construct-info h3 {
      font-family: 'Outfit', sans-serif;
      margin-bottom: 4px;
    }

    .construct-info p {
      font-size: 0.8rem;
      color: var(--text-muted);
    }

    @keyframes pulse {
      0% { transform: scale(1); }
      50% { transform: scale(1.05); }
      100% { transform: scale(1); }
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }

    /* Wizard Styles */
    .wizard-progress {
      display: flex;
      justify-content: space-between;
      margin-bottom: 25px;
      position: relative;
    }
    .wizard-progress::before {
      content: '';
      position: absolute;
      top: 50%;
      left: 0;
      right: 0;
      height: 2px;
      background: var(--border);
      z-index: 1;
      transform: translateY(-50%);
    }
    .wizard-progress-bar {
      position: absolute;
      top: 50%;
      left: 0;
      height: 2px;
      background: var(--primary);
      z-index: 1;
      transform: translateY(-50%);
      transition: width 0.3s ease;
      width: 0%;
    }
    .wizard-dot {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: var(--card-bg);
      border: 2px solid var(--border);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.85rem;
      font-weight: bold;
      z-index: 2;
      transition: var(--transition);
      color: var(--text-muted);
    }
    .wizard-dot.active {
      border-color: var(--primary);
      background: var(--primary-glow);
      color: #ffffff;
    }
    .wizard-dot.completed {
      border-color: var(--success);
      background: var(--success);
      color: #ffffff;
    }
    .wizard-step {
      display: none;
      animation: fadeIn 0.4s ease-out;
    }
    .wizard-step.active {
      display: block;
    }
    .wizard-buttons {
      display: flex;
      justify-content: space-between;
      margin-top: 25px;
    }
    .btn-wizard {
      padding: 10px 20px;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
      transition: var(--transition);
      border: 1px solid var(--border);
      background: rgba(255, 255, 255, 0.02);
      color: var(--text);
    }
    .btn-wizard:hover {
      background: rgba(255, 255, 255, 0.05);
    }
    .btn-wizard-primary {
      background: var(--primary);
      border-color: var(--primary);
      color: #ffffff;
    }
    .btn-wizard-primary:hover {
      opacity: 0.9;
    }
  </style>
</head>
<body>
  <div class="glow-1"></div>
  <div class="glow-2"></div>

  <header>
    <div class="logo-container">
      <span class="logo-icon">🚀</span>
      <div>
        <h1 class="logo-text">IATL Setup Portal</h1>
        <div class="subtitle">Instalación interactiva y construcción autónoma de habilidades</div>
      </div>
    </div>
  </header>

  <div class="container">
    <div>
      <div class="tabs-header">
        <button class="tab-btn active" onclick="switchTab('install')">
          <span>🛠️</span> Instalación IATL
        </button>
        <button class="tab-btn" onclick="switchTab('build')">
          <span>🏗️</span> Construir Habilidad
        </button>
      </div>

      <!-- TAB 1: INSTALLATION -->
      <div id="tab-install" class="tab-content active">
        <div class="panel">
          <h2 class="panel-title">Configuración e Instalación del Entorno</h2>
          
          <div class="form-group">
            <label class="form-label">1. Selecciona Runtime Objetivo</label>
            <div class="runtime-grid">
              <div class="runtime-card selected" onclick="selectRuntime('cursor')" id="card-cursor">
                <span class="runtime-icon">🎯</span>
                <span class="runtime-name">Cursor</span>
              </div>
              <div class="runtime-card" onclick="selectRuntime('antigravity')" id="card-antigravity">
                <span class="runtime-icon">🪐</span>
                <span class="runtime-name">Antigravity</span>
              </div>
              <div class="runtime-card" onclick="selectRuntime('vscode-claude')" id="card-vscode-claude">
                <span class="runtime-icon">⚡</span>
                <span class="runtime-name">VS Code + Claude</span>
              </div>
              <div class="runtime-card" onclick="selectRuntime('vscode')" id="card-vscode">
                <span class="runtime-icon">💻</span>
                <span class="runtime-name">VS Code</span>
              </div>
              <div class="runtime-card" onclick="selectRuntime('docker')" id="card-docker">
                <span class="runtime-icon">🐳</span>
                <span class="runtime-name">Docker Compose</span>
              </div>
            </div>
            <input type="hidden" id="input-runtime" value="cursor">
          </div>

          <div class="form-group">
            <label class="form-label" for="project">Nombre del Proyecto (Slug)</label>
            <input type="text" class="form-control" id="project" value="pfi-backend-core" placeholder="ej. pfi-backend-core">
          </div>

          <div class="form-group">
            <label class="form-label" for="projectContext">Contexto del Proyecto (1 línea)</label>
            <input type="text" class="form-control" id="projectContext" value="Backend PFI: lambdas NestJS hexagonales, API Gateway, integración legacy Aduana">
          </div>

          <div class="form-row">
            <div class="form-group">
              <div class="checkbox-group">
                <input type="checkbox" class="checkbox-control" id="sprintActive" checked onchange="toggleSprintFields()">
                <label class="form-label" style="margin-bottom:0; cursor:pointer;" for="sprintActive">¿Sprint Activo?</label>
              </div>
            </div>
            <div class="form-group">
              <label class="form-label" for="retentionDays">Retención cierres HITL (días)</label>
              <input type="number" class="form-control" id="retentionDays" value="14">
            </div>
          </div>

          <div class="form-row" id="sprint-fields">
            <div class="form-group">
              <label class="form-label" for="sprintLabel">Etiqueta del Sprint</label>
              <input type="text" class="form-control" id="sprintLabel" value="Sprint 1" placeholder="ej. 2026-S12">
            </div>
            <div class="form-group">
              <label class="form-label" for="sprintDuration">Duración del Sprint</label>
              <input type="text" class="form-control" id="sprintDuration" value="2 semanas">
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label" for="architectureCurrent">Arquitectura de Base / Actual</label>
              <input type="text" class="form-control" id="architectureCurrent" value="layered" placeholder="ej. layered">
            </div>
            <div class="form-group">
              <label class="form-label" for="architectureTarget">Arquitectura Objetivo</label>
              <input type="text" class="form-control" id="architectureTarget" value="hexagonal-lambda-nestjs" placeholder="ej. hexagonal-lambda-nestjs">
            </div>
          </div>

          <div class="form-group">
            <label class="form-label" for="projectRoot">Ruta Local de Checkout (Ruta Absoluta del Código)</label>
            <input type="text" class="form-control" id="projectRoot" placeholder="Cargando ruta por defecto..." required>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label" for="legacyMonolithPath">Ruta Monolito Legacy SAM (Opcional)</label>
              <input type="text" class="form-control" id="legacyMonolithPath" placeholder="Ruta a código legacy">
            </div>
            <div class="form-group">
              <label class="form-label" for="legacyApiBaseDev">API Legacy DEV base URL (Opcional)</label>
              <input type="text" class="form-control" id="legacyApiBaseDev" placeholder="https://api-dev.ejemplo.cl">
            </div>
          </div>

          <div class="form-group checkbox-group">
            <input type="checkbox" class="checkbox-control" id="skipHubSetup">
            <label class="form-label" style="margin-bottom:0; cursor:pointer;" for="skipHubSetup">Omitir configuración de base Mongo/Chroma (solo copia archivos)</label>
          </div>

          <button class="btn-action" id="btn-install" onclick="startInstallation()">
            <span>🚀</span> Iniciar Instalación IATL
          </button>
        </div>
      </div>

      <!-- TAB 2: AUTONOMOUS BUILD -->
      <div id="tab-build" class="tab-content">
        <div class="panel">
          <h2 class="panel-title">Construcción Autónoma de Habilidades</h2>
          
          <div class="wizard-progress">
            <div class="wizard-progress-bar" id="wizard-progress-bar"></div>
            <div class="wizard-dot active" id="dot-1">1</div>
            <div class="wizard-dot" id="dot-2">2</div>
            <div class="wizard-dot" id="dot-3">3</div>
          </div>

          <form id="wizard-form" onsubmit="event.preventDefault();">
            <!-- STEP 1: Detalles de la página -->
            <div class="wizard-step active" id="step-1">
              <h3 style="margin-bottom: 15px; font-family:'Outfit'; font-size: 1.15rem; color:#ffffff;">Paso 1: Información de la Landing</h3>
              <div class="form-group">
                <label class="form-label" for="buildPageContext">Contexto de la Página</label>
                <textarea class="form-control" id="buildPageContext" rows="3" placeholder="Describe el propósito de la página, ej: SaaS para optimizar flujos de trabajo usando IA"></textarea>
              </div>
              <div class="form-group">
                <label class="form-label" for="buildPageTitle">Título de la Página</label>
                <input type="text" class="form-control" id="buildPageTitle" value="WorkFlowAI" placeholder="ej. WorkFlowAI">
              </div>
            </div>

            <!-- STEP 2: Selección de Assets -->
            <div class="wizard-step" id="step-2">
              <h3 style="margin-bottom: 15px; font-family:'Outfit'; font-size: 1.15rem; color:#ffffff;">Paso 2: Selección de Assets</h3>
              <div class="form-group">
                <label class="form-label">Estilo y HTML de base</label>
                <div class="checkbox-group" style="margin-bottom: 15px;">
                  <input type="radio" name="assetOption" id="assetGenerate" value="generate" checked onchange="toggleCustomAssetField()">
                  <label class="form-label" style="margin-bottom:0; cursor:pointer;" for="assetGenerate">Generar asset apropiado al desarrollo (Autónomo)</label>
                </div>
                <div class="checkbox-group">
                  <input type="radio" name="assetOption" id="assetCustom" value="custom" onchange="toggleCustomAssetField()">
                  <label class="form-label" style="margin-bottom:0; cursor:pointer;" for="assetCustom">Usar un asset de estilos/HTML específico</label>
                </div>
              </div>
              <div class="form-group" id="custom-asset-path-group" style="display: none;">
                <label class="form-label" for="customAssetPath">Ruta del Asset Específico</label>
                <input type="text" class="form-control" id="customAssetPath" placeholder="ej. mcp-landing-page/assets/custom-styles.css">
              </div>
            </div>

            <!-- STEP 3: Publicación -->
            <div class="wizard-step" id="step-3">
              <h3 style="margin-bottom: 15px; font-family:'Outfit'; font-size: 1.15rem; color:#ffffff;">Paso 3: Publicación Autónoma</h3>
              <div class="form-group">
                <label class="form-label">¿Deseas publicar la página de forma autónoma?</label>
                <div class="checkbox-group" style="margin-bottom: 10px;">
                  <input type="radio" name="publishOption" id="publishNone" value="none" checked onchange="togglePublishFields()">
                  <label class="form-label" style="margin-bottom:0; cursor:pointer;" for="publishNone">Solo construir localmente</label>
                </div>
                <div class="checkbox-group" style="margin-bottom: 10px;">
                  <input type="radio" name="publishOption" id="publishGithub" value="github" onchange="togglePublishFields()">
                  <label class="form-label" style="margin-bottom:0; cursor:pointer;" for="publishGithub">Publicar en GitHub Pages</label>
                </div>
                <div class="checkbox-group">
                  <input type="radio" name="publishOption" id="publishGitlab" value="gitlab" onchange="togglePublishFields()">
                  <label class="form-label" style="margin-bottom:0; cursor:pointer;" for="publishGitlab">Publicar en GitLab Pages</label>
                </div>
              </div>

              <div id="publish-fields" style="display: none;">
                <div class="form-group">
                  <label class="form-label" for="publishRepo">Repositorio (ej: username/repo-name)</label>
                  <input type="text" class="form-control" id="publishRepo" placeholder="ej. cbbianco/agente-iatl">
                </div>
                <div class="form-group">
                  <label class="form-label" for="publishBranch">Rama de publicación</label>
                  <input type="text" class="form-control" id="publishBranch" value="gh-pages" placeholder="ej. gh-pages">
                </div>
                <div class="form-group">
                  <label class="form-label" for="publishToken">Personal Access Token (PAT) / Credenciales</label>
                  <input type="password" class="form-control" id="publishToken" placeholder="Token de acceso para realizar push autónomo">
                </div>
              </div>
            </div>
          </form>

          <div class="wizard-buttons">
            <button class="btn-wizard" id="btn-wizard-prev" onclick="wizardPrev()" disabled>Anterior</button>
            <button class="btn-wizard btn-wizard-primary" id="btn-wizard-next" onclick="wizardNext()">Siguiente</button>
          </div>
        </div>
      </div>
    </div>

    <!-- TERMINAL LOG SIDEBAR -->
    <div>
      <div class="terminal-panel">
        <div class="terminal-header">
          <div class="terminal-dots">
            <div class="dot dot-red"></div>
            <div class="dot dot-yellow"></div>
            <div class="dot dot-green"></div>
          </div>
          <div class="terminal-title">iatl-installer-session.log</div>
        </div>
        <div class="terminal-body" id="terminal">
          <div class="terminal-line line-stdout">Listo para iniciar. Elige una opción y haz clic en Iniciar.</div>
        </div>
      </div>
    </div>
  </div>

  <script>
    // Cargar ruta por defecto al iniciar
    fetch('/api/default-paths')
      .then(res => res.json())
      .then(data => {
        document.getElementById('projectRoot').value = data.projectRoot || '';
      });

    function switchTab(tab) {
      document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
      
      if (tab === 'install') {
        document.querySelectorAll('.tab-btn')[0].classList.add('active');
        document.getElementById('tab-install').classList.add('active');
      } else {
        document.querySelectorAll('.tab-btn')[1].classList.add('active');
        document.getElementById('tab-build').classList.add('active');
      }
    }

    function selectRuntime(runtime) {
      document.querySelectorAll('.runtime-card').forEach(card => card.classList.remove('selected'));
      document.getElementById('card-' + runtime).classList.add('selected');
      document.getElementById('input-runtime').value = runtime;
    }

    function toggleSprintFields() {
      const active = document.getElementById('sprintActive').checked;
      document.getElementById('sprint-fields').style.display = active ? 'grid' : 'none';
    }

    function clearTerminal() {
      const term = document.getElementById('terminal');
      term.innerHTML = '';
    }

    function writeTerminalLine(text, type = 'line-stdout') {
      const term = document.getElementById('terminal');
      const line = document.createElement('div');
      line.className = 'terminal-line ' + type;
      line.textContent = text;
      term.appendChild(line);
      term.scrollTop = term.scrollHeight;
    }

    let eventSource = null;

    function startInstallation() {
      if (eventSource) {
        eventSource.close();
      }
      
      clearTerminal();
      document.getElementById('btn-install').disabled = true;
      document.getElementById('btn-build').disabled = true;

      const runtime = document.getElementById('input-runtime').value;
      const project = document.getElementById('project').value;
      const projectContext = document.getElementById('projectContext').value;
      const sprintActive = document.getElementById('sprintActive').checked;
      const sprintLabel = document.getElementById('sprintLabel').value;
      const sprintDuration = document.getElementById('sprintDuration').value;
      const architectureCurrent = document.getElementById('architectureCurrent').value;
      const architectureTarget = document.getElementById('architectureTarget').value;
      const projectRoot = document.getElementById('projectRoot').value;
      const retentionDays = document.getElementById('retentionDays').value;
      const legacyMonolithPath = document.getElementById('legacyMonolithPath').value;
      const legacyApiBaseDev = document.getElementById('legacyApiBaseDev').value;
      const skipHubSetup = document.getElementById('skipHubSetup').checked;

      writeTerminalLine('$ iatl-install --runtime ' + runtime + ' --project ' + project + '...', 'line-cmd');

      const params = new URLSearchParams({
        runtime,
        project,
        projectContext,
        sprintActive,
        sprintLabel,
        sprintDuration,
        architectureCurrent,
        architectureTarget,
        projectRoot,
        retentionDays,
        legacyMonolithPath,
        legacyApiBaseDev,
        skipHubSetup
      });

      eventSource = new EventSource('/api/run-install?' + params.toString());
      
      eventSource.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === 'stdout') {
          writeTerminalLine(data.text, 'line-stdout');
        } else if (data.type === 'stderr') {
          writeTerminalLine(data.text, 'line-stderr');
        } else if (data.type === 'done') {
          writeTerminalLine('\\n[Instalación completada exitosamente] código de salida: ' + data.code, 'line-success');
          eventSource.close();
          document.getElementById('btn-install').disabled = false;
          document.getElementById('btn-build').disabled = false;
        } else if (data.type === 'error') {
          writeTerminalLine('\\n[Error de ejecución]: ' + data.message, 'line-stderr');
          eventSource.close();
          document.getElementById('btn-install').disabled = false;
          document.getElementById('btn-build').disabled = false;
        }
      };

      eventSource.onerror = (err) => {
        writeTerminalLine('\\n[Conexión SSE cerrada o con error]', 'line-stderr');
        eventSource.close();
        document.getElementById('btn-install').disabled = false;
        document.getElementById('btn-build').disabled = false;
      };
    }

    let wizardStep = 1;
    const totalSteps = 3;

    function updateWizardUI() {
      // Ocultar todos los pasos
      for (let i = 1; i <= totalSteps; i++) {
        const step = document.getElementById('step-' + i);
        const dot = document.getElementById('dot-' + i);
        if (step) step.classList.remove('active');
        if (dot) {
          dot.classList.remove('active', 'completed');
          if (i < wizardStep) dot.classList.add('completed');
          else if (i === wizardStep) dot.classList.add('active');
        }
      }

      // Mostrar paso actual
      const currentStep = document.getElementById('step-' + wizardStep);
      if (currentStep) currentStep.classList.add('active');

      // Actualizar ancho de barra de progreso
      const progressPercent = ((wizardStep - 1) / (totalSteps - 1)) * 100;
      document.getElementById('wizard-progress-bar').style.width = progressPercent + '%';

      // Actualizar botones
      document.getElementById('btn-wizard-prev').disabled = wizardStep === 1;
      
      const nextBtn = document.getElementById('btn-wizard-next');
      if (wizardStep === totalSteps) {
        nextBtn.innerHTML = '<span>🏗️</span> Construir MCP';
        nextBtn.classList.add('btn-wizard-primary');
      } else {
        nextBtn.innerHTML = 'Siguiente';
        nextBtn.classList.remove('btn-wizard-primary');
      }
    }

    function wizardNext() {
      if (wizardStep < totalSteps) {
        wizardStep++;
        updateWizardUI();
      } else {
        startBuild();
      }
    }

    function wizardPrev() {
      if (wizardStep > 1) {
        wizardStep--;
        updateWizardUI();
      }
    }

    function toggleCustomAssetField() {
      const isCustom = document.getElementById('assetCustom').checked;
      document.getElementById('custom-asset-path-group').style.display = isCustom ? 'block' : 'none';
    }

    function togglePublishFields() {
      const isNone = document.getElementById('publishNone').checked;
      document.getElementById('publish-fields').style.display = isNone ? 'none' : 'block';
    }

    function startBuild() {
      if (eventSource) {
        eventSource.close();
      }

      clearTerminal();
      document.getElementById('btn-install').disabled = true;
      document.getElementById('btn-wizard-prev').disabled = true;
      document.getElementById('btn-wizard-next').disabled = true;

      const pageContext = document.getElementById('buildPageContext').value;
      const pageTitle = document.getElementById('buildPageTitle').value;
      const assetOption = document.querySelector('input[name="assetOption"]:checked').value;
      const customAssetPath = document.getElementById('customAssetPath').value;
      const publishOption = document.querySelector('input[name="publishOption"]:checked').value;
      const publishRepo = document.getElementById('publishRepo').value;
      const publishBranch = document.getElementById('publishBranch').value;
      const publishToken = document.getElementById('publishToken').value;

      writeTerminalLine('$ iatl-install --build landing-page --page-title "' + pageTitle + '"...', 'line-cmd');

      const params = new URLSearchParams({
        type: 'landing-page',
        pageContext,
        pageTitle,
        assetOption,
        customAssetPath,
        publishOption,
        publishRepo,
        publishBranch,
        publishToken
      });

      eventSource = new EventSource('/api/run-build?' + params.toString());

      eventSource.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === 'stdout') {
          writeTerminalLine(data.text, 'line-stdout');
        } else if (data.type === 'stderr') {
          writeTerminalLine(data.text, 'line-stderr');
        } else if (data.type === 'done') {
          writeTerminalLine('\\n[Construcción del MCP de Landing Pages completada con éxito]', 'line-success');
          eventSource.close();
          document.getElementById('btn-install').disabled = false;
          document.getElementById('btn-wizard-prev').disabled = false;
          document.getElementById('btn-wizard-next').disabled = false;
        } else if (data.type === 'error') {
          writeTerminalLine('\\n[Error de ejecución]: ' + data.message, 'line-stderr');
          eventSource.close();
          document.getElementById('btn-install').disabled = false;
          document.getElementById('btn-wizard-prev').disabled = false;
          document.getElementById('btn-wizard-next').disabled = false;
        }
      };

      eventSource.onerror = (err) => {
        writeTerminalLine('\\n[Conexión SSE cerrada o con error]', 'line-stderr');
        eventSource.close();
        document.getElementById('btn-install').disabled = false;
        document.getElementById('btn-wizard-prev').disabled = false;
        document.getElementById('btn-wizard-next').disabled = false;
      };
    }
  </script>
</body>
</html>`;

function guessDefaultProjectRoot() {
  const guess = join(platform() === "win32" ? "C:" : "/home/csar", "Documentos", "Proyectos", "Arkho", "PFI", "Node", "CLONE", "pfi-backend-core");
  return guess;
}

const server = createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  
  if (url.pathname === "/") {
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end(htmlTemplate);
    return;
  }
  
  if (url.pathname === "/api/default-paths") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ projectRoot: guessDefaultProjectRoot() }));
    return;
  }

  if (url.pathname === "/api/run-install" || url.pathname === "/api/run-build") {
    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive"
    });

    const sendEvent = (type, dataObj) => {
      res.write(`data: ${JSON.stringify({ type, ...dataObj })}\n\n`);
    };

    let args = [];
    if (url.pathname === "/api/run-build") {
      const type = url.searchParams.get("type") || "landing-page";
      args = ["cli/iatl-install.mjs", "--non-interactive", "--build", type];

      const pageContext = url.searchParams.get("pageContext");
      const pageTitle = url.searchParams.get("pageTitle");
      const assetOption = url.searchParams.get("assetOption");
      const customAssetPath = url.searchParams.get("customAssetPath");
      const publishOption = url.searchParams.get("publishOption");
      const publishRepo = url.searchParams.get("publishRepo");
      const publishBranch = url.searchParams.get("publishBranch");
      const publishToken = url.searchParams.get("publishToken");

      if (pageContext) args.push("--page-context", pageContext);
      if (pageTitle) args.push("--page-title", pageTitle);
      if (assetOption) args.push("--asset-option", assetOption);
      if (customAssetPath) args.push("--custom-asset-path", customAssetPath);
      if (publishOption) args.push("--publish-option", publishOption);
      if (publishRepo) args.push("--publish-repo", publishRepo);
      if (publishBranch) args.push("--publish-branch", publishBranch);
      if (publishToken) args.push("--publish-token", publishToken);
    } else {
      const runtime = url.searchParams.get("runtime") || "cursor";
      const project = url.searchParams.get("project") || "pfi-backend-core";
      const projectContext = url.searchParams.get("projectContext") || "";
      const sprintActive = url.searchParams.get("sprintActive") === "true";
      const sprintLabel = url.searchParams.get("sprintLabel") || "";
      const sprintDuration = url.searchParams.get("sprintDuration") || "";
      const architectureCurrent = url.searchParams.get("architectureCurrent") || "";
      const architectureTarget = url.searchParams.get("architectureTarget") || "";
      const projectRoot = url.searchParams.get("projectRoot") || "";
      const retentionDays = url.searchParams.get("retentionDays") || "14";
      const legacyMonolithPath = url.searchParams.get("legacyMonolithPath") || "";
      const legacyApiBaseDev = url.searchParams.get("legacyApiBaseDev") || "";
      const skipHubSetup = url.searchParams.get("skipHubSetup") === "true";

      args = [
        "cli/iatl-install.mjs",
        "--non-interactive",
        "--runtime", runtime,
        "--project", project,
        "--project-root", projectRoot,
        "--retention", retentionDays
      ];

      if (projectContext) args.push("--context", projectContext);
      if (sprintActive) {
        args.push("--sprint-active", "true");
        if (sprintLabel) args.push("--sprint", sprintLabel);
        if (sprintDuration) args.push("--sprint-duration", sprintDuration);
      } else {
        args.push("--sprint-active", "false");
      }
      if (architectureCurrent) args.push("--architecture-current", architectureCurrent);
      if (architectureTarget) args.push("--architecture", architectureTarget);
      if (legacyMonolithPath) args.push("--legacy-path", legacyMonolithPath);
      if (legacyApiBaseDev) args.push("--legacy-api", legacyApiBaseDev);
      if (skipHubSetup) args.push("--skip-hub-setup");
    }

    const scriptPath = join(REPO_ROOT, "cli", "iatl-install.mjs");
    const child = spawn(process.execPath, args, {
      cwd: REPO_ROOT
    });

    child.stdout.on("data", (data) => {
      const text = data.toString().trim();
      if (text) {
        // Enviar línea por línea para evitar buffers gigantes
        const lines = text.split("\n");
        lines.forEach(l => sendEvent("stdout", { text: l }));
      }
    });

    child.stderr.on("data", (data) => {
      const text = data.toString().trim();
      if (text) {
        const lines = text.split("\n");
        lines.forEach(l => sendEvent("stderr", { text: l }));
      }
    });

    child.on("close", (code) => {
      sendEvent("done", { code });
      res.end();
    });

    child.on("error", (err) => {
      sendEvent("error", { message: err.message });
      res.end();
    });

    req.on("close", () => {
      child.kill();
    });
    return;
  }

  res.writeHead(404, { "Content-Type": "text/plain" });
  res.end("404 Not Found");
});

server.listen(PORT, "127.0.0.1", () => {
  const url = `http://127.0.0.1:${PORT}`;
  console.log(`\n======================================================`);
  console.log(`🚀 Portal de Instalación IATL GUI levantado con éxito.`);
  console.log(`👉 Accede a: ${url}`);
  console.log(`======================================================\n`);
  openBrowser(url);
});
