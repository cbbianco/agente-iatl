/**
 * Clasificación automática de tickets Jira para ajustar nivel de análisis y reducir tokens.
 *
 * @typedef {"bug" | "refactor" | "feature" | "arquitectura" | "investigacion"} TicketClassification
 * @typedef {"fast" | "standard" | "full" | "light"} AnalysisPath
 */

const INVESTIGACION_RE =
  /\b(investigar|investigación|investigacion|spike|poc|proof of concept|análisis técnico|analisis tecnico|research|feasibility|viabilidad)\b/i;
const ARQUITECTURA_RE =
  /\b(arquitectura|architectural|migración legacy|migracion legacy|hexagonal|bounded context|refactor arquitect|diseño de sistema|diseno de sistema|cdk|infraestructura)\b/i;
const BUG_RE =
  /\b(bug|fix|hotfix|defect|defecto|error|incidencia|corrige|corregir|falla|fallo|regresión|regresion)\b/i;
const REFACTOR_RE =
  /\b(refactor|refactoring|deuda técnica|deuda tecnica|cleanup|limpieza|extraer|renombrar|simplificar)\b/i;

/**
 * @param {object} input
 * @param {string} [input.summary]
 * @param {string} [input.description]
 * @param {string} [input.issueType] - Bug, Story, Task, Spike, etc.
 * @param {string[]} [input.labels]
 * @param {string} [input.priority]
 * @returns {{ classification: TicketClassification, confidence: "high" | "medium" | "low", signals: string[] }}
 */
export function classifyTicket(input = {}) {
  const summary = input.summary ?? "";
  const description = input.description ?? "";
  const issueType = (input.issueType ?? "").toLowerCase();
  const labels = (input.labels ?? []).map((l) => l.toLowerCase());
  const text = `${summary} ${description}`.toLowerCase();
  const signals = [];

  if (issueType.includes("spike") || labels.some((l) => l.includes("spike") || l.includes("investigacion"))) {
    signals.push("issueType/label: spike|investigacion");
    return { classification: "investigacion", confidence: "high", signals };
  }
  if (INVESTIGACION_RE.test(text)) {
    signals.push("texto: investigación/spike");
    return { classification: "investigacion", confidence: "high", signals };
  }
  if (ARQUITECTURA_RE.test(text) || labels.some((l) => l.includes("arquitectura"))) {
    signals.push("texto/label: arquitectura");
    return { classification: "arquitectura", confidence: "high", signals };
  }
  if (issueType.includes("bug") || BUG_RE.test(text) || labels.some((l) => l.includes("bug"))) {
    signals.push("issueType/texto: bug");
    return { classification: "bug", confidence: issueType.includes("bug") ? "high" : "medium", signals };
  }
  if (REFACTOR_RE.test(text) || labels.some((l) => l.includes("refactor"))) {
    signals.push("texto/label: refactor");
    return { classification: "refactor", confidence: "medium", signals };
  }
  if (issueType.includes("story") || issueType.includes("feature") || issueType.includes("historia")) {
    signals.push("issueType: story/feature");
    return { classification: "feature", confidence: "high", signals };
  }

  signals.push("default: feature");
  return { classification: "feature", confidence: "low", signals };
}

/**
 * Perfil de análisis según clasificación — define qué agentes/pasos se activan.
 *
 * @param {TicketClassification} classification
 * @returns {object}
 */
export function getAnalysisProfile(classification) {
  /** @type {Record<TicketClassification, object>} */
  const profiles = {
    bug: {
      path: "fast",
      peerDebate: false,
      patternsAdvisor: false,
      crAnalystDepth: "focused",
      skipSections: ["alternativas-extensas", "debate-arquitectura"],
      tokenBudget: "low",
      description: "Bug menor — IATL → HITL → implementación → review focalizado",
    },
    refactor: {
      path: "standard",
      peerDebate: true,
      patternsAdvisor: false,
      crAnalystDepth: "standard",
      skipSections: [],
      tokenBudget: "medium",
      description: "Refactor — debate par TL estándar, paridad funcional obligatoria",
    },
    feature: {
      path: "standard",
      peerDebate: true,
      patternsAdvisor: false,
      crAnalystDepth: "standard",
      skipSections: [],
      tokenBudget: "medium",
      description: "Feature — debate → HITL → implementación → review completo",
    },
    arquitectura: {
      path: "full",
      peerDebate: true,
      patternsAdvisor: true,
      crAnalystDepth: "exhaustive",
      skipSections: [],
      tokenBudget: "high",
      description: "Arquitectura — debate extendido + patterns advisor + review especializado",
    },
    investigacion: {
      path: "light",
      peerDebate: true,
      patternsAdvisor: false,
      crAnalystDepth: "none",
      skipSections: ["implementacion", "review-post-codigo"],
      tokenBudget: "low",
      description: "Investigación — solo propuesta/documento, sin implementación hasta HITL explícito",
    },
  };
  return profiles[classification] ?? profiles.feature;
}

/**
 * Clasifica y devuelve perfil completo para @iatl.
 *
 * @param {object} issue
 */
export function classifyWithProfile(issue) {
  const { classification, confidence, signals } = classifyTicket(issue);
  const profile = getAnalysisProfile(classification);
  return {
    classification,
    confidence,
    signals,
    analysisPath: profile.path,
    profile,
    agentsToInvoke: buildAgentList(profile),
  };
}

function buildAgentList(profile) {
  const agents = ["@iatl"];
  if (profile.peerDebate) agents.push("@pfi-tl-peer-daniel-analisis");
  if (profile.peerDebate && profile.path !== "fast" && profile.path !== "light") {
    agents.push("@pfi-tl-peer-daniel-implementacion");
  }
  if (profile.patternsAdvisor) agents.push("@pfi-patterns-advisor");
  if (profile.crAnalystDepth !== "none") {
    agents.push("@pfi-review-orchestrator", "@pfi-cr-analyst", "Bugbot");
  }
  return agents;
}
