#!/usr/bin/env node
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
  process.stdout.write(JSON.stringify({ jsonrpc: "2.0", id, result }) + "\n");
}

function sendError(id, code, message, data) {
  process.stdout.write(JSON.stringify({ jsonrpc: "2.0", id, error: { code, message, data } }) + "\n");
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
              text: "Available assets:\n- styles.css (Professional responsive UI stylesheet)\n- layout.html (Base structural template)"
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
          cssContent = cssContent.replace(/--primary:\s*[^;]+;/g, `--primary: ${primaryColor};`);
          cssContent = cssContent.replace(/--primary-glow:\s*[^;]+;/g, `--primary-glow: ${primaryColor}80;`);
        }
        if (secondaryColor) {
          cssContent = cssContent.replace(/--secondary:\s*[^;]+;/g, `--secondary: ${secondaryColor};`);
          cssContent = cssContent.replace(/--secondary-glow:\s*[^;]+;/g, `--secondary-glow: ${secondaryColor}80;`);
        }

        let themeClass = "theme-dark";
        if (theme === "light") themeClass = "theme-light";
        else if (theme === "glass") themeClass = "theme-glass";
        else if (theme === "neon") themeClass = "theme-neon";

        // Leer HTML base
        let html = readFileSync(join(__dirname, "assets", "layout.html"), "utf8");

        // Construir HTML de características
        let featuresHtml = "";
        if (features.length === 0) {
          // Defaults if none provided
          const defaults = [
            { title: "Arquitectura IATL", description: "Estructuras hexagonales y SOLID construidas con criterios de Team Lead.", icon: "⚡" },
            { title: "Ejecución Autónoma", description: "Gates automatizados de análisis e implementación sin intervención constante.", icon: "🤖" },
            { title: "Hub de Conocimiento", description: "Recuperación semántica basada en Chroma y persistencia robusta en Mongo.", icon: "📚" }
          ];
          defaults.forEach(f => {
            featuresHtml += `
            <div class="card glass">
              <div class="card-icon">${f.icon}</div>
              <h3 class="card-title">${f.title}</h3>
              <p class="card-text">${f.description}</p>
            </div>`;
          });
        } else {
          features.forEach(f => {
            const icon = f.icon || "⚡";
            featuresHtml += `
            <div class="card glass">
              <div class="card-icon">${icon}</div>
              <h3 class="card-title">${f.title}</h3>
              <p class="card-text">${f.description}</p>
            </div>`;
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
            testimonialsHtml += `
            <div class="card glass testimonial-card">
              <p class="testimonial-quote">"\ ${t.quote} "\ </p>
              <div class="testimonial-author">
                <span class="author-name">${t.author}</span>
                <span class="author-role">${t.role}</span>
              </div>
            </div>`;
          });
        } else {
          testimonials.forEach(t => {
            testimonialsHtml += `
            <div class="card glass testimonial-card">
              <p class="testimonial-quote">"\ ${t.quote} "\ </p>
              <div class="testimonial-author">
                <span class="author-name">${t.author}</span>
                <span class="author-role">${t.role || ""}</span>
              </div>
            </div>`;
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
          .replace(/<style id="theme-style"><\/style>/g, `<style id="theme-style">\n${cssContent}\n</style>`);

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
              ? `https://${config.publishToken}@github.com/${config.publishRepo}.git`
              : `https://oauth2:${config.publishToken}@gitlab.com/${config.publishRepo}.git`;
            
            execSync(`git push -f ${remoteUrl} master:${config.publishBranch || 'gh-pages'}`, { cwd: gitDir });
            deployMsg = `\n🚀 ¡Publicado autónomamente en ${config.publishOption === "github" ? "GitHub Pages" : "GitLab Pages"} (rama sol${config.publishBranch || 'gh-pages'})!`;
          } catch (deployErr) {
            deployMsg = `\n⚠️ Error en publicación autónoma: ${deployErr.message}`;
          }
        }

        return sendResponse(id, {
          content: [
            {
              type: "text",
              text: `¡Landing Page construida exitosamente!\nRuta: ${targetPath}\nTema: ${theme}\nColores: ${primaryColor} -> ${secondaryColor}\nFeatures: ${features.length || 3}\nTestimonios: sol${testimonials.length || 2}${deployMsg}`
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
