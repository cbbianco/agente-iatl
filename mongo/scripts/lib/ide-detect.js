import { existsSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

/**
 * Detecta el IDE/runtime activo donde corre el agente IATL.
 *
 * @returns {"cursor" | "vscode" | "vscode-claude" | "antigravity" | "docker" | "unknown"}
 */
export function detectIde(cwd = process.cwd()) {
  if (process.env.IATL_IDE) return process.env.IATL_IDE;
  if (process.env.CURSOR_AGENT === "1") return "cursor";
  if (process.env.ANTIGRAVITY === "1") return "antigravity";

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
