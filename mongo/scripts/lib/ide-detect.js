import { existsSync } from "node:fs";
import { execSync } from "node:child_process";
import { homedir } from "node:os";
import { join } from "node:path";

function getIdeFromProcessTree() {
  if (process.platform === 'win32') return null;
  try {
    let currentPid = process.pid;
    let iterations = 0;
    while (currentPid && currentPid !== "1" && currentPid !== "0" && iterations < 30) {
      iterations++;
      const output = execSync(`ps -o ppid= -o comm= -p ${currentPid}`).toString().trim();
      if (!output) break;
      
      const parts = output.trim().split(/\s+/);
      const ppid = parts.shift();
      const comm = parts.join(' ').toLowerCase();
      
      if (comm.includes('cursor')) return 'cursor';
      if (comm.includes('antigravity')) return 'antigravity';
      if (comm.includes('code')) return 'vscode';
      
      currentPid = ppid;
    }
  } catch (err) {
    // ignore
  }
  return null;
}

/**
 * Detecta el IDE/runtime activo donde corre el agente IATL.
 *
 * @returns {"cursor" | "vscode" | "vscode-claude" | "antigravity" | "docker" | "unknown"}
 */
export function detectIde(cwd = process.cwd()) {
  if (process.env.IATL_IDE) return process.env.IATL_IDE;
  
  const treeIde = getIdeFromProcessTree();
  if (treeIde) return treeIde;
  
  if (
    process.env.ANTIGRAVITY === "1" ||
    process.env.ANTIGRAVITY_AGENT === "1" ||
    process.env.CHROME_DESKTOP === "antigravity.desktop" ||
    process.env.ANTIGRAVITY_EDITOR_APP_ROOT ||
    (process.env.VSCODE_NLS_CONFIG && process.env.VSCODE_NLS_CONFIG.includes("antigravity"))
  ) {
    return "antigravity";
  }

  if (
    process.env.CURSOR_AGENT === "1" ||
    process.env.TERM_PROGRAM === "Cursor" ||
    (process.env.TERM_PROGRAM_VERSION && process.env.TERM_PROGRAM_VERSION.toLowerCase().includes("cursor")) ||
    (process.env.VSCODE_IPC_HOOK && process.env.VSCODE_IPC_HOOK.toLowerCase().includes("cursor"))
  ) {
    return "cursor";
  }
  
  if (process.env.TERM_PROGRAM === "vscode") {
    return "vscode";
  }

  const markers = [
    { ide: "cursor", paths: [join(cwd, ".cursor"), join(homedir(), ".cursor")] },
    { ide: "antigravity", paths: [join(cwd, ".antigravity"), join(homedir(), ".antigravity")] },
    { ide: "vscode-claude", paths: [join(homedir(), ".claude", "iatl")] },
    { ide: "vscode", paths: [join(homedir(), ".iatl")] },
    { ide: "docker", paths: ["/opt/iatl"] },
  ];

  for (const { ide, paths } of markers) {
    if (paths.some((p) => existsSync(p))) {
      return ide;
    }
  }

  return "unknown";
}

export function ideLabel(ide) {
  const labels = {
    cursor: "Cursor",
    antigravity: "Antigravity",
    vscode: "VS Code",
    "vscode-claude": "VS Code + Claude Code",
    docker: "Docker",
    unknown: "Runtime no detectado",
  };
  return labels[ide] ?? ide;
}
