import { existsSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

/**
 * Detecta el IDE activo donde corre el agente IATL.
 *
 * @returns {"cursor" | "antigravity" | "unknown"}
 */
export function detectIde(cwd = process.cwd()) {
  if (process.env.IATL_IDE === "cursor" || process.env.CURSOR_AGENT === "1") {
    return "cursor";
  }
  if (process.env.IATL_IDE === "antigravity" || process.env.ANTIGRAVITY === "1") {
    return "antigravity";
  }

  const markers = [
    { ide: "cursor", paths: [join(cwd, ".cursor"), join(homedir(), ".cursor")] },
    { ide: "antigravity", paths: [join(cwd, ".antigravity"), join(homedir(), ".antigravity")] },
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
    unknown: "IDE no detectado",
  };
  return labels[ide] ?? ide;
}
