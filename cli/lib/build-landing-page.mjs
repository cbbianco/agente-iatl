import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { getLandingPageType } from "./landing-page-types.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const REPO_ROOT = join(__dirname, "..", "..");

function ensureDir(path) {
  mkdirSync(path, { recursive: true });
}

export async function buildLandingPageMcp(options = {}) {
  const landingPageType = options.landingPageType ?? "curriculum";
  const typeMeta = getLandingPageType(landingPageType);
  const mcpDir = join(REPO_ROOT, "mcp-landing-page");
  const assetsDir = join(mcpDir, "assets");

  console.log(`🛠️  Iniciando construcción autónoma del MCP de Landing Pages (${typeMeta.label})...\n`);

  ensureDir(mcpDir);
  ensureDir(assetsDir);

  // 1. Escribir package.json del MCP
  const pkgContent = {
    name: "landing-page-mcp",
    version: "1.0.0",
    description: "MCP Server de construcción autónoma para Landing Pages de alta estética",
    type: "module",
    main: "index.js",
    bin: {
      "landing-page-mcp": "./index.js"
    },
    engines: {
      "node": ">=18"
    }
  };
  writeFileSync(join(mcpDir, "package.json"), JSON.stringify(pkgContent, null, 2) + "\n", "utf8");
  console.log("✅ package.json creado.");

  // Escribir config.json del MCP
  const configContent = {
    landingPageType,
    pageContext: options.pageContext ?? typeMeta.defaultContext,
    pageTitle: options.pageTitle ?? typeMeta.defaultTitle,
    assetOption: options.assetOption ?? "generate",
    customAssetPath: options.customAssetPath ?? "",
    publishOption: options.publishOption ?? "none",
    publishRepo: options.publishRepo ?? "",
    publishBranch: options.publishBranch ?? "gh-pages",
    publishToken: options.publishToken ?? "",
    layoutAsset: typeMeta.layoutAsset,
  };
  writeFileSync(join(mcpDir, "config.json"), JSON.stringify(configContent, null, 2) + "\n", "utf8");
  console.log("✅ config.json creado.");

  // 2. Escribir index.js (MCP Server Zero-Dependency JSON-RPC over stdio)
  const indexContent = `#!/usr/bin/env node
import { createInterface } from "readline";
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Cargar configuración de compilación y publicación
let config = {};
try {
  const configPath = join(__dirname, "config.json");
  if (existsSync(configPath)) {
    config = JSON.parse(readFileSync(configPath, "utf8"));
  }
} catch (e) {
  // ignore
}

const rl = createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false
});

rl.on("line", (line) => {
  try {
    const request = JSON.parse(line);
    handleRequest(request);
  } catch (err) {
    sendError(null, -32700, "Parse error: " + err.message);
  }
});

function sendResponse(id, result) {
  process.stdout.write(JSON.stringify({ jsonrpc: "2.0", id, result }) + "\\n");
}

function sendError(id, code, message, data) {
  process.stdout.write(JSON.stringify({ jsonrpc: "2.0", id, error: { code, message, data } }) + "\\n");
}

function handleRequest(req) {
  const { method, params, id } = req;
  
  if (method === "initialize") {
    return sendResponse(id, {
      protocolVersion: "2024-11-05",
      capabilities: {
        tools: {}
      },
      serverInfo: {
        name: "landing-page-mcp",
        version: "1.0.0"
      }
    });
  }

  if (method === "tools/list") {
    return sendResponse(id, {
      tools: [
        {
          name: "list_assets",
          description: "List available assets (CSS styles, HTML templates) for landing page construction.",
          inputSchema: { type: "object", properties: {} }
        },
        {
          name: "get_asset_content",
          description: "Retrieve raw content of a specific asset.",
          inputSchema: {
            type: "object",
            properties: {
              name: { type: "string", description: "Name of the asset file (e.g. styles.css, layout.html)" }
            },
            required: ["name"]
          }
        },
        {
          name: "build_landing_page",
          description: "Autonomously build a complete, highly aesthetic landing page with custom branding, features, themes, and layouts.",
          inputSchema: {
            type: "object",
            properties: {
              targetPath: { type: "string", description: "Absolute path where the index.html should be saved." },
              title: { type: "string", description: "Title of the landing page." },
              heroTitle: { type: "string", description: "Main hero H1 headline." },
              heroSubtitle: { type: "string", description: "Supporting text for hero section." },
              ctaText: { type: "string", description: "Primary action button text (default: Get Started)." },
              ctaUrl: { type: "string", description: "Primary action target URL (default: #)." },
              theme: { type: "string", enum: ["dark", "light", "glass", "neon"], description: "Theme style of the landing page (dark, light, glass, neon)." },
              primaryColor: { type: "string", description: "Primary color in hex format (e.g., #6366f1)." },
              secondaryColor: { type: "string", description: "Secondary gradient color in hex format (e.g., #ec4899)." },
              features: {
                type: "array",
                description: "Array of features/benefits (typically 3 items).",
                items: {
                  type: "object",
                  properties: {
                    title: { type: "string" },
                    description: { type: "string" },
                    icon: { type: "string", description: "Emoji representing the feature (e.g. ⚡, 🛡️, 🚀, 💡)" }
                  },
                  required: ["title", "description"]
                }
              },
              testimonials: {
                type: "array",
                description: "Testimonials list.",
                items: {
                  type: "object",
                  properties: {
                    quote: { type: "string" },
                    author: { type: "string" },
                    role: { type: "string" }
                  },
                  required: ["quote", "author"]
                }
              }
            },
            required: ["targetPath", "title", "heroTitle"]
          }
        }
      ]
    });
  }

  if (method === "tools/call") {
    const { name, arguments: args } = params;
    
    if (name === "list_assets") {
      try {
        return sendResponse(id, {
          content: [
            {
              type: "text",
              text: "Available assets:\\n- styles.css (Professional responsive UI stylesheet)\\n- layout.html (Base structural template)"
            }
          ]
        });
      } catch (err) {
        return sendError(id, -32603, err.message);
      }
    }

    if (name === "get_asset_content") {
      try {
        const assetName = args.name;
        const filePath = join(__dirname, "assets", assetName);
        const data = readFileSync(filePath, "utf8");
        return sendResponse(id, {
          content: [{ type: "text", text: data }]
        });
      } catch (err) {
        return sendError(id, -32602, "Asset not found: " + err.message);
      }
    }

    if (name === "build_landing_page") {
      try {
        const {
          targetPath,
          title,
          heroTitle,
          heroSubtitle = "El futuro de la automatización está aquí.",
          ctaText = "Comenzar",
          ctaUrl = "#",
          theme = "dark",
          primaryColor = "#6366f1",
          secondaryColor = "#a855f7",
          features = [],
          testimonials = []
        } = args;

        // Validar directorio destino
        const dir = dirname(targetPath);
        mkdirSync(dir, { recursive: true });

        // Leer CSS
        let cssContent = readFileSync(join(__dirname, "assets", "styles.css"), "utf8");

        // Adaptar colores en las variables CSS
        if (primaryColor) {
          cssContent = cssContent.replace(/--primary:\\s*[^;]+;/g, \`--primary: \${primaryColor};\`);
          cssContent = cssContent.replace(/--primary-glow:\\s*[^;]+;/g, \`--primary-glow: \${primaryColor}80;\`);
        }
        if (secondaryColor) {
          cssContent = cssContent.replace(/--secondary:\\s*[^;]+;/g, \`--secondary: \${secondaryColor};\`);
          cssContent = cssContent.replace(/--secondary-glow:\\s*[^;]+;/g, \`--secondary-glow: \${secondaryColor}80;\`);
        }

        let themeClass = "theme-dark";
        if (theme === "light") themeClass = "theme-light";
        else if (theme === "glass") themeClass = "theme-glass";
        else if (theme === "neon") themeClass = "theme-neon";

        // Leer HTML base según tipo configurado
        const layoutFile = config.landingPageType === "curriculum"
          ? "layout-curriculum.html"
          : "layout.html";
        let html = readFileSync(join(__dirname, "assets", layoutFile), "utf8");

        // Construir HTML de características
        let featuresHtml = "";
        if (features.length === 0) {
          // Defaults if none provided
          const defaults = config.landingPageType === "curriculum"
            ? [
              { title: "Experiencia profesional", description: "Trayectoria en desarrollo backend, arquitectura hexagonal y liderazgo técnico.", icon: "💼" },
              { title: "Educación", description: "Formación académica y certificaciones relevantes al perfil.", icon: "🎓" },
              { title: "Habilidades", description: "Stack técnico, metodologías y herramientas dominadas.", icon: "🛠️" }
            ]
            : [
            { title: "Arquitectura IATL", description: "Estructuras hexagonales y SOLID construidas con criterios de Team Lead.", icon: "⚡" },
            { title: "Ejecución Autónoma", description: "Gates automatizados de análisis e implementación sin intervención constante.", icon: "🤖" },
            { title: "Hub de Conocimiento", description: "Recuperación semántica basada en Chroma y persistencia robusta en Mongo.", icon: "📚" }
          ];
          defaults.forEach(f => {
            featuresHtml += \`
            <div class="card glass">
              <div class="card-icon">\${f.icon}</div>
              <h3 class="card-title">\${f.title}</h3>
              <p class="card-text">\${f.description}</p>
            </div>\`;
          });
        } else {
          features.forEach(f => {
            const icon = f.icon || "⚡";
            featuresHtml += \`
            <div class="card glass">
              <div class="card-icon">\${icon}</div>
              <h3 class="card-title">\${f.title}</h3>
              <p class="card-text">\${f.description}</p>
            </div>\`;
          });
        }

        // Construir HTML de testimonios
        let testimonialsHtml = "";
        if (testimonials.length === 0) {
          const defaults = [
            { quote: "La consistencia de código aumentó radicalmente. Los gates pre-HITL atrapan la deuda técnica antes del deploy.", author: "César Bianco", role: "Technical Leader @ Arkho" },
            { quote: "El orquestador IATL nos ahorró horas de alineación y revisiones manuales de dependencias y patrones.", author: "Daniel TL", role: "Peer Revisor AI" }
          ];
          defaults.forEach(t => {
            testimonialsHtml += \`
            <div class="card glass testimonial-card">
              <p class="testimonial-quote">"\\ \${t.quote} "\\ </p>
              <div class="testimonial-author">
                <span class="author-name">\${t.author}</span>
                <span class="author-role">\${t.role}</span>
              </div>
            </div>\`;
          });
        } else {
          testimonials.forEach(t => {
            testimonialsHtml += \`
            <div class="card glass testimonial-card">
              <p class="testimonial-quote">"\\ \${t.quote} "\\ </p>
              <div class="testimonial-author">
                <span class="author-name">\${t.author}</span>
                <span class="author-role">\${t.role || ""}</span>
              </div>
            </div>\`;
          });
        }

        // Reemplazar placeholders en el HTML
        html = html
          .replace(/{{TITLE}}/g, title)
          .replace(/{{THEME_CLASS}}/g, themeClass)
          .replace(/{{HERO_TITLE}}/g, heroTitle)
          .replace(/{{HERO_SUBTITLE}}/g, heroSubtitle)
          .replace(/{{CTA_TEXT}}/g, ctaText)
          .replace(/{{CTA_URL}}/g, ctaUrl)
          .replace(/{{FEATURES_GRID}}/g, featuresHtml)
          .replace(/{{TESTIMONIALS_GRID}}/g, testimonialsHtml)
          .replace(/<style id="theme-style"><\\/style>/g, \`<style id="theme-style">\\n\${cssContent}\\n</style>\`);

        writeFileSync(targetPath, html, "utf8");

        let deployMsg = "";
        if (config.publishOption && config.publishOption !== "none") {
          try {
            const gitDir = dirname(targetPath);
            const { execSync } = await import("child_process");
            if (!existsSync(join(gitDir, ".git"))) {
              execSync("git init", { cwd: gitDir });
            }
            execSync("git add .", { cwd: gitDir });
            const status = execSync("git status --porcelain", { cwd: gitDir }).toString().trim();
            if (status) {
              execSync('git commit -m "Deploy landing page to pages"', { cwd: gitDir });
            }
            const remoteUrl = config.publishOption === "github" 
              ? \`https://\${config.publishToken}@github.com/\${config.publishRepo}.git\`
              : \`https://oauth2:\${config.publishToken}@gitlab.com/\${config.publishRepo}.git\`;
            
            execSync(\`git push -f \${remoteUrl} master:\${config.publishBranch || 'gh-pages'}\`, { cwd: gitDir });
            deployMsg = \`\\n🚀 ¡Publicado autónomamente en \${config.publishOption === "github" ? "GitHub Pages" : "GitLab Pages"} (rama \sol\${config.publishBranch || 'gh-pages'})!\`;
          } catch (deployErr) {
            deployMsg = \`\\n⚠️ Error en publicación autónoma: \${deployErr.message}\`;
          }
        }

        return sendResponse(id, {
          content: [
            {
              type: "text",
              text: \`¡Landing Page construida exitosamente!\\nRuta: \${targetPath}\\nTema: \${theme}\\nColores: \${primaryColor} -> \${secondaryColor}\\nFeatures: \${features.length || 3}\\nTestimonios: \sol\${testimonials.length || 2}\${deployMsg}\`
            }
          ]
        });
      } catch (err) {
        return sendError(id, -32603, "Error construyendo la landing page: " + err.message);
      }
    }

    return sendError(id, -32601, "Método no encontrado: " + name);
  }

  // Ignorar notificaciones sin ID
  if (id === undefined) return;
  return sendError(id, -32601, "Método no encontrado: " + method);
}
`;
  writeFileSync(join(mcpDir, "index.js"), indexContent, { encoding: "utf8", mode: 0o755 });
  console.log("✅ index.js creado (ejecutable).");

  // 3. Escribir assets/layout.html
  const layoutContent = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{TITLE}}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Outfit:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style id="theme-style"></style>
</head>
<body class="{{THEME_CLASS}}">
  <nav class="navbar">
    <div class="nav-container">
      <div class="logo">
        <span class="logo-icon">✨</span>
        <span class="logo-text">IATL-Craft</span>
      </div>
      <div class="nav-links">
        <a href="#features">Características</a>
        <a href="#testimonials">Testimonios</a>
        <a href="{{CTA_URL}}" class="btn btn-sm btn-primary">{{CTA_TEXT}}</a>
      </div>
    </div>
  </nav>

  <header class="hero">
    <div class="hero-bg"></div>
    <div class="hero-container">
      <h1 class="hero-title">{{HERO_TITLE}}</h1>
      <p class="hero-subtitle">{{HERO_SUBTITLE}}</p>
      <div class="hero-actions">
        <a href="{{CTA_URL}}" class="btn btn-lg btn-primary">{{CTA_TEXT}}</a>
        <a href="#features" class="btn btn-lg btn-secondary">Explorar</a>
      </div>
    </div>
  </header>

  <main>
    <section id="features" class="section">
      <div class="section-container">
        <h2 class="section-title">Habilidades Clave</h2>
        <div class="grid grid-3">
          {{FEATURES_GRID}}
        </div>
      </div>
    </section>

    <section id="testimonials" class="section section-alt">
      <div class="section-container">
        <h2 class="section-title">Testimonios del Equipo</h2>
        <div class="grid grid-2">
          {{TESTIMONIALS_GRID}}
        </div>
      </div>
    </section>

    <section class="section cta-section">
      <div class="cta-card glass">
        <h2 class="cta-title">¿Listo para escalar tus proyectos?</h2>
        <p class="cta-text-p">Generación autónoma y control estricto de arquitectura para código moderno.</p>
        <a href="{{CTA_URL}}" class="btn btn-lg btn-primary">{{CTA_TEXT}}</a>
      </div>
    </section>
  </main>

  <footer class="footer">
    <div class="footer-container">
      <p>&copy; 2026 IATL-Craft. Todos los derechos reservados.</p>
      <p class="footer-tagline">Construido autónomamente con el MCP IATL Landing-Page.</p>
    </div>
  </footer>
</body>
</html>
`;
  writeFileSync(join(assetsDir, "layout.html"), layoutContent, "utf8");
  console.log("✅ assets/layout.html creado.");

  const curriculumLayoutContent = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{TITLE}}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Outfit:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style id="theme-style"></style>
</head>
<body class="{{THEME_CLASS}} cv-page">
  <header class="hero cv-hero">
    <div class="hero-container">
      <p class="cv-kicker">Currículum vitae</p>
      <h1 class="hero-title">{{HERO_TITLE}}</h1>
      <p class="hero-subtitle">{{HERO_SUBTITLE}}</p>
      <div class="hero-actions">
        <a href="{{CTA_URL}}" class="btn btn-lg btn-primary">{{CTA_TEXT}}</a>
      </div>
    </div>
  </header>
  <main>
    <section class="section">
      <div class="section-container">
        <h2 class="section-title">Perfil profesional</h2>
        <div class="grid grid-3">{{FEATURES_GRID}}</div>
      </div>
    </section>
    <section class="section section-alt">
      <div class="section-container">
        <h2 class="section-title">Referencias</h2>
        <div class="grid grid-2">{{TESTIMONIALS_GRID}}</div>
      </div>
    </section>
  </main>
  <footer class="footer">
    <div class="footer-container">
      <p>&copy; 2026 {{TITLE}}. Generado con MCP IATL Landing-Page (tipo curriculum).</p>
    </div>
  </footer>
</body>
</html>
`;
  writeFileSync(join(assetsDir, "layout-curriculum.html"), curriculumLayoutContent, "utf8");
  console.log("✅ assets/layout-curriculum.html creado (tipo curriculum).");

  // 4. Escribir assets/styles.css
  const stylesContent = `:root {
  --font-heading: 'Outfit', sans-serif;
  --font-body: 'Inter', sans-serif;
  --transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  --primary: #6366f1;
  --primary-glow: rgba(99, 102, 241, 0.5);
  --secondary: #a855f7;
  --secondary-glow: rgba(168, 85, 247, 0.5);
}

/* Temas estéticos */
.theme-dark {
  --bg-gradient: linear-gradient(180deg, #0b0f19 0%, #030712 100%);
  --bg-card: rgba(17, 24, 39, 0.6);
  --border-card: rgba(255, 255, 255, 0.05);
  --text-main: #f3f4f6;
  --text-muted: #9ca3af;
  --nav-bg: rgba(3, 7, 18, 0.8);
}

.theme-light {
  --bg-gradient: linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%);
  --bg-card: rgba(255, 255, 255, 0.85);
  --border-card: rgba(0, 0, 0, 0.05);
  --text-main: #0f172a;
  --text-muted: #64748b;
  --nav-bg: rgba(248, 250, 252, 0.8);
}

.theme-glass {
  --bg-gradient: linear-gradient(135deg, #1e1b4b 0%, #311042 100%);
  --bg-card: rgba(255, 255, 255, 0.03);
  --border-card: rgba(255, 255, 255, 0.08);
  --text-main: #f8fafc;
  --text-muted: #cbd5e1;
  --nav-bg: rgba(30, 27, 75, 0.6);
}

.theme-neon {
  --bg-gradient: linear-gradient(180deg, #020205 0%, #080710 100%);
  --bg-card: rgba(15, 10, 25, 0.8);
  --border-card: rgba(168, 85, 247, 0.2);
  --text-main: #ffffff;
  --text-muted: #a78bfa;
  --nav-bg: rgba(2, 2, 5, 0.9);
}

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html {
  scroll-behavior: smooth;
}

body {
  font-family: var(--font-body);
  background: var(--bg-gradient);
  color: var(--text-main);
  line-height: 1.6;
  overflow-x: hidden;
  min-height: 100vh;
}

h1, h2, h3, h4, h5, h6 {
  font-family: var(--font-heading);
  font-weight: 700;
  line-height: 1.2;
}

/* Navbar */
.navbar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 70px;
  background: var(--nav-bg);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--border-card);
  z-index: 1000;
  display: flex;
  align-items: center;
}

.nav-container {
  width: 90%;
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.logo {
  display: flex;
  align-items: center;
  gap: 10px;
  font-family: var(--font-heading);
  font-weight: 800;
  font-size: 1.5rem;
}

.logo-text {
  background: linear-gradient(90deg, var(--primary), var(--secondary));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.nav-links {
  display: flex;
  align-items: center;
  gap: 30px;
}

.nav-links a {
  text-decoration: none;
  color: var(--text-muted);
  font-weight: 500;
  transition: var(--transition);
}

.nav-links a:hover {
  color: var(--text-main);
}

/* Hero Section */
.hero {
  position: relative;
  padding: 160px 0 100px;
  text-align: center;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  min-height: 75vh;
}

.hero-bg {
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 100%;
  max-width: 1400px;
  height: 100%;
  background: radial-gradient(circle at top, rgba(99, 102, 241, 0.15) 0%, rgba(168, 85, 247, 0.05) 50%, transparent 100%);
  z-index: -1;
  pointer-events: none;
}

.hero-container {
  width: 90%;
  max-width: 850px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
}

.hero-title {
  font-size: 3.5rem;
  font-weight: 800;
  letter-spacing: -0.02em;
  background: linear-gradient(135deg, #ffffff 30%, #a5b4fc 70%, var(--primary) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: slideUp 0.8s cubic-bezier(0.16, 1, 0.3, 1);
}

.theme-light .hero-title {
  background: linear-gradient(135deg, #0f172a 0%, #334155 70%, var(--primary) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.hero-subtitle {
  font-size: 1.25rem;
  color: var(--text-muted);
  max-width: 650px;
  animation: slideUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.1s both;
}

.hero-actions {
  display: flex;
  gap: 16px;
  animation: slideUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.2s both;
}

/* Botones */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  text-decoration: none;
  font-family: var(--font-heading);
  font-weight: 600;
  border-radius: 8px;
  transition: var(--transition);
  cursor: pointer;
  border: none;
}

.btn-sm {
  padding: 8px 16px;
  font-size: 0.875rem;
}

.btn-lg {
  padding: 14px 28px;
  font-size: 1.05rem;
}

.btn-primary {
  background: linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%);
  color: #ffffff;
  box-shadow: 0 4px 15px var(--primary-glow);
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px var(--primary-glow);
  opacity: 0.95;
}

.btn-secondary {
  background: rgba(255, 255, 255, 0.05);
  color: var(--text-main);
  border: 1px solid var(--border-card);
}

.theme-light .btn-secondary {
  background: rgba(0, 0, 0, 0.02);
  color: var(--text-main);
  border: 1px solid rgba(0, 0, 0, 0.08);
}

.btn-secondary:hover {
  background: rgba(255, 255, 255, 0.1);
  transform: translateY(-2px);
}

/* Sections */
.section {
  padding: 100px 0;
}

.section-alt {
  background: rgba(0, 0, 0, 0.15);
}

.theme-light .section-alt {
  background: rgba(0, 0, 0, 0.01);
}

.section-container {
  width: 90%;
  max-width: 1200px;
  margin: 0 auto;
}

.section-title {
  font-size: 2.25rem;
  text-align: center;
  margin-bottom: 60px;
  background: linear-gradient(90deg, #ffffff 30%, var(--primary) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.theme-light .section-title {
  background: linear-gradient(90deg, #0f172a 30%, var(--primary) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

/* Grid & Tarjetas */
.grid {
  display: grid;
  gap: 30px;
}

.grid-3 {
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
}

.grid-2 {
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
}

@media (max-width: 768px) {
  .grid-2 {
    grid-template-columns: 1fr;
  }
}

.card {
  background: var(--bg-card);
  border: 1px solid var(--border-card);
  border-radius: 16px;
  padding: 40px;
  transition: var(--transition);
}

.card:hover {
  transform: translateY(-6px);
  border-color: rgba(99, 102, 241, 0.3);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
}

.card.glass {
  backdrop-filter: blur(12px);
}

.card-icon {
  font-size: 2.5rem;
  margin-bottom: 24px;
}

.card-title {
  font-size: 1.25rem;
  margin-bottom: 16px;
}

.card-text {
  color: var(--text-muted);
}

/* Testimonials */
.testimonial-card {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 30px;
}

.testimonial-quote {
  font-style: italic;
  font-size: 1.1rem;
  color: var(--text-main);
}

.testimonial-author {
  display: flex;
  flex-direction: column;
}

.author-name {
  font-weight: 600;
  color: var(--primary);
}

.author-role {
  font-size: 0.85rem;
  color: var(--text-muted);
}

/* CTA */
.cta-section {
  text-align: center;
}

.cta-card {
  max-width: 900px;
  margin: 0 auto;
  padding: 60px 40px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.05) 0%, rgba(168, 85, 247, 0.05) 100%);
}

.cta-title {
  font-size: 2.5rem;
}

.cta-text-p {
  color: var(--text-muted);
  max-width: 500px;
  margin-bottom: 12px;
}

/* Footer */
.footer {
  padding: 50px 0;
  border-top: 1px solid var(--border-card);
  background: rgba(0, 0, 0, 0.2);
  text-align: center;
  color: var(--text-muted);
  font-size: 0.9rem;
}

.footer-container {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.footer-tagline {
  font-size: 0.8rem;
  opacity: 0.7;
}

/* Keyframes */
@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
`;
  writeFileSync(join(assetsDir, "styles.css"), stylesContent, "utf8");
  console.log("✅ assets/styles.css creado.");

  // 5. Escribir README.md
  const readmeContent = `# Landing Page MCP Server

Este servidor MCP permite construir de forma autónoma landing pages responsivas de alta estética con temas dinámicos (dark, light, glass, neon) y assets integrados.

## Herramientas de Construcción Disponibles

1. \`list_assets\`: Lista los archivos base del generador (\`styles.css\`, \`layout.html\`).
2. \`get_asset_content\`: Obtiene el contenido de un asset específico.
3. \`build_landing_page\`: Crea un archivo HTML completamente autocontenido con estilos y copy inyectados en la ruta especificada.

## Integración en Clientes de IA

### 1. Cursor
Añade en **Settings > Models > MCP**:
- **Name**: \`landing-page-mcp\`
- **Type**: \`stdio\`
- **Command**: \`node ${join(mcpDir, "index.js")}\`

### 2. Claude Desktop
Añade en tu archivo de configuración de Claude (\`config.json\`):
\`\`\`json
{
  "mcpServers": {
    "landing-page-mcp": {
      "command": "node",
      "args": ["${join(mcpDir, "index.js").replace(/\\/g, "/")}"]
    }
  }
}
\`\`\`

### 3. Antigravity
Registrado automáticamente si se utiliza en la suite operativa.
`;
  writeFileSync(join(mcpDir, "README.md"), readmeContent, "utf8");
  console.log("✅ README.md creado.");

  console.log(`\n🎉 ¡MCP de Landing Pages construido exitosamente!`);
  console.log(`📂 Ubicación: ${mcpDir}`);
  console.log(`🤖 Ejecutable listo en: node ${join(mcpDir, "index.js")}\n`);
}
