export const ACTIVE_SESSION_STATUSES = [
  "active",
  "active_analysis",
  "active_spec_driven",
  "open",
];

export function isSessionActive(status) {
  return ACTIVE_SESSION_STATUSES.includes(status);
}

export function formatSessionStatusLabel(status) {
  const map = {
    active: "Activo",
    active_analysis: "Activo (análisis)",
    active_spec_driven: "Activo (spec-driven)",
    open: "Abierto",
    closed: "Cerrado",
  };
  if (!status) return "Sin estado registrado";
  return map[status] ?? (isSessionActive(status) ? "Activo" : "Cerrado");
}

export function formatVerdictLabel(verdict) {
  if (!verdict) return null;
  const map = {
    closed_implementation: "Implementación cerrada (HITL)",
    closed: "Cerrado",
    APROBADO: "Aprobado HITL",
    rejected: "Rechazado HITL",
  };
  return map[verdict] ?? verdict;
}

/**
 * Agrega campos coherentes para UI del drawer de ticket.
 */
export function buildTicketInsights({
  sessions = [],
  closure = null,
  ticketMetric = null,
  classification = null,
  learnings = [],
  findings = [],
  peerDiscussions = [],
  workingBranches = [],
}) {
  const sortedSessions = [...sessions].sort(
    (a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0),
  );
  const latest = sortedSessions[0] ?? null;
  const isActive = sortedSessions.some((s) => isSessionActive(s.status));
  const reopenedCount = Math.max(0, sortedSessions.length - 1);

  const durationMinutes =
    ticketMetric?.durationMinutes ??
    latest?.durationMinutes ??
    (closure?.closedAt && latest?.createdAt
      ? Math.round(
          (new Date(closure.closedAt).getTime() - new Date(latest.createdAt).getTime()) /
            60000,
        )
      : null);

  const reworkRounds =
    ticketMetric?.reworkRounds ?? latest?.reworkRounds ?? null;

  const classificationLabel =
    classification?.issueType ??
    classification?.classification ??
    latest?.classification ??
    "No clasificado";

  const verdictLabel = closure
    ? formatVerdictLabel(closure.verdict)
    : isActive
      ? "En curso — sin cierre HITL"
      : "Sin cierre HITL registrado";

  const summaryParts = [];
  if (closure?.summary) {
    summaryParts.push(closure.summary);
  } else if (latest?.checkpoints?.length) {
    const lastCp = latest.checkpoints[latest.checkpoints.length - 1];
    summaryParts.push(`Último checkpoint (${lastCp.phase}): ${lastCp.summary}`);
  } else if (isActive) {
    summaryParts.push(
      `Sesión ${formatSessionStatusLabel(latest?.status)} en rama \`${latest?.branch || "—"}\`. Fase: ${latest?.currentPhase || "—"}.`,
    );
  } else {
    summaryParts.push("No hay resumen de cierre HITL ni checkpoints recientes para este ticket.");
  }

  if (workingBranches.length) {
    const main = workingBranches[0];
    summaryParts.push(
      `Rama principal: \`${main.branch}\` (${main.role || "feature"}, base ${main.base || "—"}).`,
    );
  }
  if (findings.length) {
    summaryParts.push(`${findings.length} hallazgo(s) de code review (${findings.filter((f) => f.status === "open").length} abiertos).`);
  }
  if (peerDiscussions.length) {
    summaryParts.push(`${peerDiscussions.length} debate(s) con par TL registrados.`);
  }
  if (learnings.length) {
    summaryParts.push(`${learnings.length} aprendizaje(s) activos en Mongo.`);
  }

  const checkpoints = sortedSessions.flatMap((s) =>
    (s.checkpoints || []).map((cp) => ({ ...cp, sessionId: s.sessionId })),
  );

  return {
    isActive,
    statusLabel: isActive
      ? formatSessionStatusLabel(latest?.status)
      : closure
        ? "Cerrado (HITL)"
        : formatSessionStatusLabel(latest?.status),
    classificationLabel,
    durationHours:
      durationMinutes != null && durationMinutes > 0
        ? (durationMinutes / 60).toFixed(1)
        : null,
    durationNote:
      durationMinutes != null && durationMinutes > 0
        ? null
        : "Sin duración medida — el ticket no tiene métrica de cierre ni timestamps suficientes.",
    reworkRounds: reworkRounds ?? 0,
    reworkNote:
      reworkRounds == null ? "Sin dato de rework (no hay ticket_metrics)." : null,
    reopenedCount,
    verdictLabel,
    hasClosure: Boolean(closure),
    summaryDetailed: summaryParts.join(" "),
    latestBranch: latest?.branch ?? workingBranches[0]?.branch ?? "—",
    latestPhase: latest?.currentPhase ?? "—",
    sessionCount: sortedSessions.length,
    checkpoints: checkpoints.slice(0, 8),
    endpoints: closure?.endpoints ?? [],
    closedAt: closure?.closedAt ?? null,
  };
}
