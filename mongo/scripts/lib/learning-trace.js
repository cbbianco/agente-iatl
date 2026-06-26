/**
 * Learnings con traza analítica — último bullet puede incluir `trace` para retomar sesión.
 *
 * Formato item en payload.learnings:
 *   "bullet corto"
 *   { "text": "bullet corto", "trace": { howWeGotHere, initialAssumption, actualFinding, ... } }
 */

export function normalizeLearningEntry(entry) {
  if (typeof entry === "string") {
    return { text: entry.trim(), trace: null };
  }
  if (entry && typeof entry === "object") {
    const text = String(entry.text ?? entry.summary ?? "").trim();
    const trace = entry.trace ?? null;
    return { text, trace: trace && typeof trace === "object" ? trace : null };
  }
  return { text: "", trace: null };
}

export function normalizeLearningsList(raw = []) {
  return raw.map(normalizeLearningEntry).filter((l) => l.text.length > 0);
}

/** Último learning con traza no vacía — contexto para retomar análisis. */
export function pickResumeTrace(normalizedLearnings) {
  for (let i = normalizedLearnings.length - 1; i >= 0; i--) {
    const { text, trace } = normalizedLearnings[i];
    if (trace && Object.keys(trace).length > 0) {
      return { text, trace, index: i };
    }
  }
  return null;
}

export function buildResumeContext(resumeTrace, ticket) {
  if (!resumeTrace) return null;
  return {
    mandate:
      "OBLIGATORIO al retomar análisis/QA: usar esta traza como contexto operativo antes de inferir desde el chat",
    ticket,
    summary_bullet: resumeTrace.text,
    trace: resumeTrace.trace,
  };
}
