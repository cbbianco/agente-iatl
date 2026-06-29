import { homedir } from "node:os";
import { join } from "node:path";

/**
 * Rutas de instalación por runtime objetivo.
 *
 * @typedef {"cursor" | "vscode" | "vscode-claude" | "antigravity" | "docker"} RuntimeTarget
 */

/** @type {Record<RuntimeTarget, { label: string, agents: string, skills: string, hub: string, envVar?: string }>} */
export const RUNTIME_PATHS = {
  antigravity: {
    label: "Antigravity",
    agents: join(homedir(), ".antigravity", "agents"),
    skills: join(homedir(), ".antigravity", "skills"),
    hub: join(homedir(), ".antigravity", "iatl-knowledge"),
    envVar: "ANTIGRAVITY=1",
  },
  cursor: {
    label: "Cursor",
    agents: join(homedir(), ".cursor", "agents"),
    skills: join(homedir(), ".cursor", "skills"),
    hub: join(homedir(), ".cursor", "iatl-knowledge"),
    envVar: "CURSOR_AGENT=1",
  },
  "vscode-claude": {
    label: "VS Code + Claude Code",
    agents: join(homedir(), ".claude", "iatl", "agents"),
    skills: join(homedir(), ".claude", "iatl", "skills"),
    hub: join(homedir(), ".claude", "iatl-knowledge"),
    envVar: "IATL_IDE=vscode-claude",
  },
  vscode: {
    label: "VS Code (sin Claude Code)",
    agents: join(homedir(), ".iatl", "agents"),
    skills: join(homedir(), ".iatl", "skills"),
    hub: join(homedir(), ".iatl", "iatl-knowledge"),
    envVar: "IATL_IDE=vscode",
  },
  docker: {
    label: "Docker",
    agents: "/opt/iatl/agents",
    skills: "/opt/iatl/skills",
    hub: "/opt/iatl/iatl-knowledge",
    envVar: "IATL_IDE=docker",
  },
};

export const RUNTIME_CHOICES = [
  { value: "cursor", label: "Cursor — instala en ~/.cursor/" },
  { value: "vscode", label: "VS Code — instala en ~/.iatl/ (portable)" },
  { value: "vscode-claude", label: "VS Code + Claude Code — instala en ~/.claude/iatl/" },
  { value: "antigravity", label: "Antigravity — instala en ~/.antigravity/" },
  { value: "docker", label: "Docker — genera stack containerizado" },
];

export function resolvePaths(runtimeTarget) {
  const paths = RUNTIME_PATHS[runtimeTarget];
  if (!paths) {
    throw new Error(`Runtime no soportado: ${runtimeTarget}`);
  }
  return paths;
}
