---
name: pfi-iatl-knowledge-hub
description: >-
  Hub Mongo local de contexto y retroalimentación para agentes IATL. Fuente de verdad
  centralizada: sessions, review_findings, pattern_evals, learnings. Poda y promoción
  a reference.md. Usar al arrancar @iatl, @pfi-review-orchestrator, @pfi-cr-analyst
  y tras cada ciclo de review.
---

# IATL Knowledge Hub — Mongo local

## Cuándo usar

- **@iatl** — al iniciar sesión con ticket; tras review; poda semanal; promoción a `reference.md`
- **@pfi-tl-peer-daniel** — consultar `knowledge_sources`, `peer_discussions`, learnings `tl-peer`; modo B post CR
- **@pfi-review-orchestrator** — antes/después del pipeline review; validar 2 `.md` generados
- **@pfi-cr-analyst** — consultar contexto histórico del ticket
- **@pfi-patterns-advisor** — consultar evaluaciones previas (`--tag patterns`)

## Ubicación

`~/.cursor/iatl-knowledge/` — ver `README.md` para instalación.

## Arranque rápido

```bash
cd ~/.cursor/iatl-knowledge && npm install && npm run init
```

## Consulta obligatoria (@iatl — inicio de sesión con ticket)

```bash
node ~/.cursor/iatl-knowledge/query.js --project-config
node ~/.cursor/iatl-knowledge/query.js --ticket PFI-XXXX
node ~/.cursor/iatl-knowledge/query.js --ticket-closure --ticket PFI-XXXX
node ~/.cursor/iatl-knowledge/query.js --active-learnings
node ~/.cursor/iatl-knowledge/query.js --working-branches --status active
```

Integrar hallazgos en decisiones y orquestación.

## Configuración proyecto / sprint (obligatoria al instalar o cambiar proyecto)

Archivo: `~/.cursor/iatl-knowledge/config.json`

```json
{
  "project": "pfi-backend-core",
  "sprintLabel": "2026-S12",
  "retentionDays": 14
}
```

| Campo | Descripción |
|-------|-------------|
| `project` | Identificador del repo/proyecto |
| `sprintLabel` | Etiqueta del sprint activo (ej. `2026-S12`) |
| `retentionDays` | Días de retención de cierres HITL y learnings de cierre (default **14** = 2 semanas) |

**Si falta `config.json` o `_missing: true`**, el agente **debe preguntar al usuario** antes de cerrar tickets:

1. ¿Proyecto? (ej. `pfi-backend-core`)
2. ¿Sprint? (ej. `2026-S12`)
3. ¿Retención en días? (default 14)

Luego persistir con `node -e` o editando `config.json`.

## Cierre HITL de ticket (autónomo — @iatl)

**Disparador:** el usuario confirma cierre de ticket/rama (ej. *"cerremos la 1238"*, *"implementación lista"*).

**Flujo obligatorio del agente (sin pedir permiso extra):**

1. Verificar `config.json` (preguntar proyecto/sprint si falta).
2. Sintetizar **último acordado**: alcance, veredicto implementación, commits, endpoints, learnings (máx. 3 bullets).
3. Ejecutar:

```bash
node ~/.cursor/iatl-knowledge/close-ticket.js \
  --ticket PFI-XXXX \
  --payload-file /tmp/pfi-XXXX-closure.json
```

4. Marcar ramas `working_branches` → `merged` en el payload.
5. Confirmar al usuario con `query.js --ticket-closure --ticket PFI-XXXX`.
6. Si hay ticket activo siguiente → registrar sesión/rama nueva.

**Retención:** learnings de categoría `ticket-closure` y documento `ticket_closures` llevan `expiresAt = now + retentionDays`. Tras expirar, `prune.js` archiva.

## Ingesta tras review

| Evento | Comando |
|--------|---------|
| Learning nuevo | `ingest.js learning --ticket ... --category ... --text "..."` |
| Hallazgo CR | `ingest.js review_finding --severity ... --location ... --summary ...` |
| Evaluación patrón | `ingest.js pattern_eval --component ... --declared ... --real ...` |
| Paquete orquestador | `ingest.js review_meta --payload-file ...` |
| Fuente conocimiento TL | `ingest.js knowledge_source --id ... --category ... --url ...` |
| Debate par TL | `ingest.js peer_discussion --ticket-json ...` |
| **Rama en trabajo** | `ingest.js working_branch --ticket ... --branch ... --base ... --role ... --status active` |
| Nueva sesión | `ingest.js session --ticket ... --branch ... --architectura_target ...` |

**Artefactos CR en repo (obligatorios):** cada review deja `docs/spec-driven/CODE-REVIEW-PFI-XXXX.md` y `ANTIPATRONES-CODE-REVIEW-PFI-XXXX.md`. @iatl referencia rutas en `review_meta`; @pfi-tl-peer-daniel (modo B) puede extender el segundo y registrar `knowledge_source` si faltó contexto.

## Poda ( @iatl — semanal o >30 learnings activos)

```bash
node ~/.cursor/iatl-knowledge/prune.js --dry-run
node ~/.cursor/iatl-knowledge/prune.js --max-active 30 --archive-days 7
```

Luego:

1. Promover reglas estables → `reference.md` §2.6
2. Sincronizar bullets activos → `review-learnings.md` (vista humana)
3. Registrar `Última poda: YYYY-MM-DD` en reference § Mantenimiento

## Jerarquía de verdad

```text
Mongo (índice, consultable por agentes)
  ↓ promoción poda
reference.md (reglas estables)
  ↓ sync export
review-learnings.md (memoria viva legible)
```

## Reglas

- Máx. **3 bullets nuevos** por ciclo de review hacia learnings
- No duplicar en Mongo lo ya promovido en reference §2.6
- Mongo no reemplaza skills — los complementa con contexto histórico
