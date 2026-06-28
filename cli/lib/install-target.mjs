import {
  copyFileSync,
  cpSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { resolvePaths } from "./paths.mjs";

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");

function ensureDir(path) {
  mkdirSync(path, { recursive: true });
}

function copyDir(src, dest) {
  if (!existsSync(src)) return 0;
  ensureDir(dest);
  cpSync(src, dest, { recursive: true, force: true });
  return 1;
}

function copyFilesFlat(srcDir, destDir, filter = () => true) {
  if (!existsSync(srcDir)) return 0;
  ensureDir(destDir);
  let count = 0;
  for (const name of readdirSync(srcDir)) {
    const src = join(srcDir, name);
    if (!statSync(src).isFile() || !filter(name)) continue;
    copyFileSync(src, join(destDir, name));
    count++;
  }
  return count;
}

/**
 * Copia artefactos del repo a las rutas operativas del runtime elegido.
 *
 * @param {import("./paths.mjs").RuntimeTarget} runtimeTarget
 * @param {string} projectRoot - ruta al checkout del repo de código (pfi-backend-core)
 */
export function installArtifacts(runtimeTarget, projectRoot) {
  const paths = resolvePaths(runtimeTarget);
  ensureDir(paths.agents);
  ensureDir(paths.skills);
  ensureDir(paths.hub);

  const agentsCopied = copyFilesFlat(
    join(REPO_ROOT, "agents"),
    paths.agents,
    (n) => n.endsWith(".md"),
  );

  copyDir(join(REPO_ROOT, "mongo", "scripts"), paths.hub);
  if (existsSync(join(REPO_ROOT, "mongo", "package.json"))) {
    copyFileSync(join(REPO_ROOT, "mongo", "package.json"), join(paths.hub, "package.json"));
  }
  if (existsSync(join(REPO_ROOT, "mongo", "config.example.json"))) {
    const example = join(REPO_ROOT, "mongo", "config.example.json");
    const dest = join(paths.hub, "config.example.json");
    if (!existsSync(join(paths.hub, "config.json"))) {
      copyFileSync(example, join(paths.hub, "config.json"));
    }
    copyFileSync(example, dest);
  }

  const skillsRoot = join(REPO_ROOT, "skills");
  for (const entry of readdirSync(skillsRoot)) {
    const src = join(skillsRoot, entry);
    if (statSync(src).isDirectory()) {
      copyDir(src, join(paths.skills, entry));
      continue;
    }
    if (!entry.endsWith(".md") || entry === "catalog.md") continue;
    const skillName = entry.replace(/\.md$/, "");
    const destSkillDir = join(paths.skills, skillName);
    ensureDir(destSkillDir);
    copyFileSync(src, join(destSkillDir, "SKILL.md"));
  }

  let repoVersion = "0.11.0";
  try {
    const pkg = JSON.parse(readFileSync(join(REPO_ROOT, "package.json"), "utf8"));
    if (pkg.version) repoVersion = pkg.version;
  } catch {
    /* usar default */
  }

  const runtimeManifest = {
    runtimeTarget,
    installedAt: new Date().toISOString(),
    repoVersion,
    paths,
    projectRoot,
    hubPath: paths.hub,
  };
  writeFileSync(join(paths.hub, "runtime.json"), `${JSON.stringify(runtimeManifest, null, 2)}\n`);

  if (runtimeTarget === "docker") {
    setupDockerStack(REPO_ROOT, projectRoot);
  }

  return { paths, agentsCopied };
}

export function writeIDEProjectHints(runtimeTarget, projectRoot, paths, config) {
  if (!projectRoot || !existsSync(projectRoot)) return;

  const project = config.project ?? "pfi-backend-core";
  const context = config.projectContext ?? "";
  const sprintLabel = config.sprintLabel ?? "";
  const sprintDuration = config.sprintDuration ?? "";
  const archTarget = config.architectureTarget ?? "";
  const archCurrent = config.architectureCurrent ?? "";

  const hintContent = `# 🧠 Instrucciones y Reglas de Arquitectura IATL

Estás ejecutando en el runtime: **${runtimeTarget}**

## 📋 Información del Proyecto
- **Proyecto Activo:** ${project}
- **Contexto:** ${context}
- **Sprint Activo:** ${sprintLabel ? `Sí (${sprintLabel}, duración: ${sprintDuration})` : "No"}
- **Arquitectura de Base:** ${archCurrent || "No especificada (Plana)"}
- **Arquitectura Objetivo:** ${archTarget || "No especificada (Plana)"}

## 📂 Ubicaciones del Entorno
- **Agentes Globales:** \`${paths.agents}\`
- **Hub de Conocimiento:** \`${paths.hub}\`

## 🛠️ Comandos del Hub Disponibles
- **Ver Configuración / Iniciar Sesión:**
  \`\`\`bash
  node ${paths.hub}/query.js --project-config
  \`\`\`
- **Clasificar Ticket / Tarea:**
  \`\`\`bash
  node ${paths.hub}/query.js --classify-ticket --summary "..." --issue-type Story
  \`\`\`
- **Revisión de Código y Arquitectura (COE Review):**
  \`\`\`bash
  node ${paths.hub}/coe-review.js
  \`\`\`
`;

  // 1. Escribir para Claude Code (.claude/IATL.md)
  if (runtimeTarget === "vscode-claude") {
    const claudeDir = join(projectRoot, ".claude");
    ensureDir(claudeDir);
    writeFileSync(join(claudeDir, "IATL.md"), hintContent, "utf8");
  }

  // 2. Escribir para Cursor (.cursorrules)
  if (runtimeTarget === "cursor") {
    writeFileSync(join(projectRoot, ".cursorrules"), hintContent, "utf8");
  }

  // 3. Escribir para VS Code (.vscode/IATL.md)
  if (runtimeTarget === "vscode") {
    const vscodeDir = join(projectRoot, ".vscode");
    ensureDir(vscodeDir);
    writeFileSync(join(vscodeDir, "IATL.md"), hintContent, "utf8");
  }

  // 4. Escribir para Antigravity (.antigravity.md en la raíz del proyecto)
  if (runtimeTarget === "antigravity") {
    writeFileSync(join(projectRoot, ".antigravity.md"), hintContent, "utf8");
  }
}

function setupDockerStack(repoRoot, projectRoot) {
  const dockerDir = join(repoRoot, "docker");
  const composeSrc = join(dockerDir, "docker-compose.yml");
  if (!existsSync(composeSrc)) return;

  const outDir = projectRoot ? join(projectRoot, ".iatl-docker") : join(repoRoot, "docker", "runtime");
  ensureDir(outDir);

  let compose = readFileSync(composeSrc, "utf8");
  compose = compose.replace(
    /context:\s*\.\./,
    `context: ${repoRoot.replace(/\\/g, "/")}`,
  );
  compose = compose.replace(
    /dockerfile:\s*docker\/Dockerfile/,
    `dockerfile: ${join(repoRoot, "docker", "Dockerfile").replace(/\\/g, "/")}`,
  );
  writeFileSync(join(outDir, "docker-compose.yml"), compose);

  if (existsSync(join(dockerDir, ".env.example"))) {
    copyFileSync(join(dockerDir, ".env.example"), join(outDir, ".env.example"));
  }
  writeFileSync(
    join(outDir, "README.md"),
    `${readFileSync(join(dockerDir, "README.md"), "utf8")}\n\nRepo arquitectura: \`${repoRoot}\`\n`,
  );
}

/**
 * Ejecuta setup del hub (npm install + setup-agent) en la ruta instalada.
 */
export function runHubSetup(hubPath, setupArgs = []) {
  const npm = spawnSync("npm", ["install"], { cwd: hubPath, stdio: "inherit" });
  if (npm.status !== 0) {
    throw new Error(`npm install falló en ${hubPath}`);
  }
  const setup = spawnSync(process.execPath, ["setup-agent.js", ...setupArgs], {
    cwd: hubPath,
    stdio: "inherit",
  });
  if (setup.status !== 0) {
    throw new Error(`setup-agent.js falló en ${hubPath}`);
  }
}

export function getRepoRoot() {
  return REPO_ROOT;
}
