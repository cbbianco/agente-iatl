# Clasificación automática de tickets

Reduce tokens ajustando el nivel de análisis según el tipo de trabajo. Se ejecuta **al analizar un ticket**, antes de elaborar la Propuesta.

---

## Tipos

| Clasificación | Señales típicas | Ruta | Debate par TL | Patterns | Review |
|---------------|-----------------|------|---------------|----------|--------|
| **bug** | issueType Bug, "fix", "hotfix", "incidencia" | `fast` | No | No | Focalizado |
| **refactor** | "refactor", "deuda técnica", "limpieza" | `standard` | Sí | No | Estándar |
| **feature** | Story, historia, funcionalidad nueva | `standard` | Sí | No | Estándar |
| **arquitectura** | migración legacy, hexagonal, infra, CDK | `full` | Sí extendido | Sí | Exhaustivo |
| **investigacion** | spike, POC, "investigar", análisis | `light` | Sí breve | No | Sin código |

---

## Fast / Standard / Full / Light

| Ruta | Flujo resumido | Objetivo tokens |
|------|----------------|-----------------|
| **fast** | IATL → HITL → impl → review focal | Mínimo |
| **standard** | Debate → HITL → impl → review | Medio |
| **full** | Debate extendido → patterns → HITL → impl → review exhaustivo | Alto (justificado) |
| **light** | Propuesta/documento → HITL; sin impl hasta pedido explícito | Mínimo |

---

## Uso en @iatl (obligatorio tras fetch Jira)

```bash
node query.js --classify-ticket \
  --summary "Corregir validación catálogo marcaje" \
  --issue-type Bug \
  --labels backend,marcaje

node ingest.js ticket_classification \
  --ticket PFI-1238 \
  --summary "..." \
  --issue-type Bug
```

Respuesta ejemplo:

```json
{
  "classification": "bug",
  "confidence": "high",
  "analysisPath": "fast",
  "profile": {
    "path": "fast",
    "peerDebate": false,
    "tokenBudget": "low"
  },
  "agentsToInvoke": ["@iatl", "@pfi-review-orchestrator", "@pfi-cr-analyst", "Bugbot"]
}
```

---

## Reglas de @iatl según perfil

### bug (fast)

- Propuesta **corta**: causa, fix, archivos, riesgo.
- **Omitir:** debate extenso, alternativas múltiples, patterns advisor.
- **Mantener:** paridad tests, review post-código.

### refactor (standard)

- Debate par TL obligatorio.
- Enfatizar paridad funcional y diff mínimo.

### feature (standard)

- Flujo spec-driven completo estándar.
- Propuesta IATL con alternativas si aplica.

### arquitectura (full)

- Debate extendido + `@pfi-patterns-advisor` si hay decisión de diseño.
- Documentar ADR si la decisión es estructural (ver `adr/` futuro).

### investigacion (light)

- Entregar **documento de análisis** (opciones, riesgos, recomendación).
- **No implementar** hasta HITL explícito de "pasemos a implementación".

---

## Override humano

El desarrollador puede forzar nivel:

- *"trátalo como arquitectura"* → `full`
- *"es un bug menor, fast path"* → `fast`
- *"solo investigación"* → `light`

@iatl registra override en `ticket_classifications` con `source: hitl-override`.

---

## Implementación

- Módulo: `mongo/scripts/lib/ticket-classifier.js`
- Colección Mongo: `ticket_classifications`
- Diagrama: [diagrams.md](diagrams.md) §3
