# Métricas de calidad IATL

Evidencia cuantitativa del impacto del sistema multiagente. Basado en la evolución del trabajo desde las primeras historias (PFI-1019 → PFI-1238) hasta el ciclo actual con peer review, CR analyst y cierre HITL autónomo.

---

## Objetivo

Responder con datos:

- ¿Cuánto tarda un ticket de punta a punta?
- ¿Cuántos bugs detecta el peer review **antes** de implementar?
- ¿Cuántos detecta el review **final**?
- ¿Con qué frecuencia hay retrabajo?
- ¿Las propuestas se aceptan al primer intento?

---

## Métricas definidas

| Métrica | Campo Mongo | Cómo se captura |
|---------|-------------|-----------------|
| Tiempo por ticket | `durationMinutes` | `closedAt - startedAt` al cierre HITL |
| Bugs peer review | `peerReviewBugsFound` | Hallazgos en debate @pfi-tl-peer-daniel pre-HITL |
| Bugs review final | `finalReviewBugsFound` | `review_findings` + Bugbot al cierre |
| Tasa retrabajo | `reworkRounds` | Ciclos implementación → review → fix (>0 = retrabajo) |
| Aceptación propuesta | `proposalAcceptedFirstTry` | HITL aprobó sin rediseño interno |
| Deadlocks peer | `peerDeadlocks` | Veces que aplicó protocolo síntesis C |
| Clasificación | `classification` | De `ticket_classifications` |
| Ruta análisis | `analysisPath` | fast / standard / full / light |

---

## Colección `ticket_metrics`

```json
{
  "ticket": "PFI-1238",
  "project": "pfi-backend-core",
  "classification": "feature",
  "analysisPath": "standard",
  "startedAt": "2026-06-17T10:00:00.000Z",
  "closedAt": "2026-06-19T18:30:00.000Z",
  "durationMinutes": 2880,
  "peerReviewBugsFound": 2,
  "finalReviewBugsFound": 1,
  "reworkRounds": 0,
  "proposalAcceptedFirstTry": true,
  "peerDeadlocks": 0,
  "source": "iatl"
}
```

---

## Comandos

### Registrar al cierre de ticket

```bash
node ingest.js ticket_metric --ticket PFI-1238 \
  --classification feature \
  --analysis-path standard \
  --duration-minutes 2880 \
  --peer-bugs 2 \
  --final-bugs 1 \
  --rework-rounds 0 \
  --accepted-first true
```

O con payload JSON:

```bash
node ingest.js ticket_metric --ticket PFI-1238 --payload-file /tmp/metric-pfi-1238.json
```

### Consultar agregados

```bash
node query.js --ticket-metrics --project pfi-backend-core
node query.js --ticket-metrics --ticket PFI-1238
```

Respuesta incluye `aggregate` con promedios y tasas cuando hay datos.

---

## Evolución observada (línea base cualitativa)

| Fase | Tickets referencia | Cambio respecto a inicio |
|------|-------------------|--------------------------|
| **Fase 1 — Spec-driven básico** | PFI-1019, PFI-1117 | Sin peer TL; más retrabajo post-review |
| **Fase 2 — Peer gate Daniel** | PFI-1120, PFI-1131 | Bugs de diseño detectados pre-HITL |
| **Fase 3 — CR analyst + 2 .md** | PFI-1215, PFI-1228 | Hallazgos formales; menos sorpresas en PR |
| **Fase 4 — Hub Mongo + Chroma** | PFI-1235, PFI-1238 | Recall histórico; cierre autónomo |
| **Fase 5 — Clasificación + métricas** | Actual | Fast path bugs; observabilidad cuantitativa |

### Hipótesis a validar con métricas

1. **Peer review** reduce `finalReviewBugsFound` en tickets `feature` y `arquitectura`.
2. **Fast path** (`bug`) mantiene calidad con `durationMinutes` significativamente menor.
3. **`proposalAcceptedFirstTry`** sube cuando hay clasificación correcta al inicio.
4. **`reworkRounds`** correlaciona con tickets sin clasificación o mal clasificados.

---

## Responsabilidades

| Momento | Quién registra |
|---------|----------------|
| Inicio sesión | @iatl — `ingest session` (timestamp implícito) |
| Post peer debate | @iatl — contar objeciones → `peerReviewBugsFound` |
| Post review | @iatl — `review_findings` count → `finalReviewBugsFound` |
| Cierre HITL | @iatl — `ingest ticket_metric` completo vía `close-ticket.js` extensión futura |

---

## Dashboard (fase 3 roadmap)

Agregados planificados:

- Tiempo medio por `classification`
- Ratio peer bugs / final bugs
- Tasa aceptación primera propuesta por sprint
- Tickets con `reworkRounds > 1` (alerta)

Ver [diagrams.md](diagrams.md) y [NOTA evaluación](../../docs/spec-driven/NOTA-EVALUACION-ARQUITECTURA-MULTIAGENTE.md) en backend-core.
