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

  for (const skillMd of readdirSync(join(REPO_ROOT, "skills")).filter((f) => f.endsWith(".md"))) {
    const skillName = skillMd.replace(/\.md$/, "");
    const destSkillDir = join(paths.skills, skillName);
    ensureDir(destSkillDir);
    copyFileSync(join(REPO_ROOT, "skills", skillMd), join(destSkillDir, "SKILL.md"));
  }

  const runtimeManifest = {
    runtimeTarget,
    installedAt: new Date().toISOString(),
    repoVersion: "0.6.0",
    paths,
    projectRoot,
    hubPath: paths.hub,
  };
  writeFileSync(join(paths.hub, "runtime.json"), `${JSON.stringify(runtimeManifest, null, 2)}\n`);

  if (runtimeTarget === "docker") {
    setupDockerStack(REPO_ROOT, projectRoot);
  }

  if (runtimeTarget === "vscode-claude" && projectRoot) {
    writeClaudeCodeProjectHints(projectRoot, paths);
  }

  return { paths, agentsCopied };
}

function writeClaudeCodeProjectHints(projectRoot, paths) {
  const claudeDir = join(projectRoot, ".claude");
  ensureDir(claudeDir);
  const hint = `# IATL — Claude Code

Agentes instalados globalmente en: \`${paths.agents}\`
Hub Mongo/Chroma: \`${paths.hub}\`

Arranque sesión:
\`\`\`bash
node ${paths.hub}/query.js --project-config
node ${paths.hub}/query.js --classify-ticket --summary "..." --issue-type Story
\`\`\`

Orquestador: ver agente \`iatl.md\` en \`${paths.agents}\`.
`;
  writeFileSync(join(claudeDir, "IATL.md"), hint);
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
