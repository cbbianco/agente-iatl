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
          
          <div class="card-construct-option selected">
            <div class="runtime-icon">📄</div>
            <div class="construct-info">
              <h3>landing-page</h3>
              <p>Construye un servidor de protocolo de contexto de modelo (MCP) local con assets premium de diseño (HTML/CSS) dinámicos para construir landings de alto impacto.</p>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Habilidad Seleccionada</label>
            <input type="text" class="form-control" value="landing-page" readonly>
          </div>

          <button class="btn-action" id="btn-build" onclick="startBuild()">
            <span>🏗️</span> Construir MCP de Landing-Page
          </button>
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

    function startBuild() {
      if (eventSource) {
        eventSource.close();
      }

      clearTerminal();
      document.getElementById('btn-install').disabled = true;
      document.getElementById('btn-build').disabled = true;

      writeTerminalLine('$ iatl-install --build landing-page', 'line-cmd');

      eventSource = new EventSource('/api/run-build?type=landing-page');

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
