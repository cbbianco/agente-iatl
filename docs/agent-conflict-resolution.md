# Resolución de conflictos entre agentes

Protocolo formal cuando dos o más agentes del sistema IATL **no coinciden** en diagnóstico, prioridad o solución recomendada.

---

## Principios

1. **Una interfaz humana:** solo @iatl presenta opciones al desarrollador.
2. **No empates:** siempre una recomendación con rationale.
3. **Trazabilidad:** todo conflicto se registra en Mongo.
4. **Autoridad final:** desarrollador (HITL) > @iatl síntesis > agentes especializados.
5. **Veto de deuda:** @pfi-tl-peer-daniel puede bloquear opciones con deuda diferida no justificada.

---

## Matriz de autoridad

| Conflicto | Primera resolución | Escalamiento | Autoridad final |
|-----------|-------------------|--------------|-----------------|
| @iatl ↔ @pfi-tl-peer-daniel | Síntesis C (peer gate) | @pfi-patterns-advisor si es diseño | HITL usuario |
| @pfi-cr-analyst ↔ Bugbot | Matriz prioridad @iatl | Segunda pasada CR si Bugbot crítico | @iatl bloquea commit |
| @iatl ↔ @pfi-cr-analyst | @iatl re-evalúa con evidencia runtime | Presentar matriz al usuario | HITL usuario |
| @pfi-patterns-advisor ↔ Daniel | Daniel (arquitectura pragmática) | @iatl sintetiza | HITL usuario |
| CR analyst ↔ Daniel (modo B) | Daniel extiende antipatrones | @iatl consolida en síntesis | HITL usuario |
| Memoria Mongo ↔ spec actual | Spec + código prevalecen | Marcar learning como `deprecated` | @iatl + poda |

---

## Caso 1: @iatl ↔ @pfi-tl-peer-daniel (pre-HITL)

**Cuándo:** Daniel emite RECHAZADO o APTO_CON_CAMBIOS que @iatl no acepta tras un ciclo de réplica.

**Procedimiento:** ver [peer-gate-deadlock-protocol.md](peer-gate-deadlock-protocol.md).

Resumen:

```text
1. Registrar idea A (@iatl) e idea B (Daniel) en peer_discussions
2. Generar idea C — síntesis que absorbe objeciones válidas
3. Evaluar A vs B vs C: diff mínimo, paridad, SOLID, operabilidad
4. Presentar UNA Propuesta HITL recomendada (opción C salvo evidencia contraria)
5. Mencionar alternativas descartadas en 1 línea cada una
```

**Prohibido:** pedir al usuario que elija entre A y B sin recomendación.

---

## Caso 2: @pfi-cr-analyst ↔ Bugbot (post-código)

**Cuándo:** CR dice APTO pero Bugbot reporta crítico, o viceversa.

**Procedimiento @iatl:**

| Situación | Decisión |
|-----------|----------|
| Bugbot crítico (seguridad, regresión runtime) | **Bloquear** commit aunque CR diga APTO |
| CR NO APTO (hexagonal, spec, M>10) | **Bloquear** aunque Bugbot esté limpio |
| CR observación + Bugbot mismo tema menor | Priorizar arquitectura/spec (CR) |
| Bugbot falso positivo documentado | @iatl documenta en síntesis; puede APTO CON OBSERVACIONES |

**Persistencia:**

```bash
node ingest.js review_meta --ticket PFI-XXXX --payload-file /tmp/conflict-cr-bugbot.json
```

---

## Caso 3: @iatl ↔ @pfi-cr-analyst

**Cuándo:** @iatl considera que el CR es excesivo o incorrecto respecto al alcance del ticket.

**Procedimiento:**

1. @iatl **no descarta** el informe CR (es mandatorio).
2. Re-ejecutar evidencia: curl runtime, diff acotado al PR, spec Jira.
3. Si persiste desacuerdo → presentar al usuario:

```markdown
## Conflicto @iatl ↔ CR analyst

### Posición CR (mandatoria)
- [hallazgos]

### Posición @iatl
- [por qué el alcance/spec justifica APTO CON OBSERVACIONES]

### Recomendación @iatl
APTO CON OBSERVACIONES | NO APTO

### Tu decisión (HITL)
```

**Autoridad final:** usuario. @iatl implementa lo que HITL apruebe.

---

## Caso 4: @pfi-patterns-advisor ↔ @pfi-tl-peer-daniel

**Cuándo:** Patterns recomienda GoF estricto; Daniel prioriza diff mínimo y pragmatismo.

**Regla:** Daniel tiene **veto operativo** sobre deuda diferida y over-engineering. Patterns aporta catálogo; no impone patrón si Daniel rechaza con rationale de paridad/operabilidad.

**Excepción:** si el ticket está clasificado como `arquitectura` y el usuario marcó foco patrones → debate extendido obligatorio antes de veto.

---

## Caso 5: Conocimiento Mongo obsoleto vs decisión actual

**Cuándo:** `query.js --semantic-search` recupera learning que contradice spec o código actual.

**Procedimiento:**

1. Prevalece **spec Jira + código en rama + reference.md**.
2. Marcar learning conflictivo:

```bash
node ingest.js learning --ticket PFI-XXXX --category deprecated --text "Obsoleto: ..." --source iatl
```

3. En poda semanal → `prune.js` archiva learnings `deprecated`.

---

## Registro de decisiones (obligatorio)

| Evento | Colección | Campos clave |
|--------|-----------|--------------|
| Deadlock peer | `peer_discussions` | ideaA, ideaB, ideaC, chosenOption, rationale |
| Conflicto CR/Bugbot | `review_meta` | payload con ambos veredictos |
| Override HITL | `ticket_classifications` | source: hitl-override |
| Métrica post-conflicto | `ticket_metrics` | peerDeadlocks, reworkRounds |

---

## Escalamiento al usuario (HITL)

Escalar **solo** cuando:

- Síntesis C no desbloquea peer gate tras 2 ciclos.
- CR y Bugbot críticos en temas distintos (seguridad + arquitectura).
- Decisión de producto fuera del alcance técnico (negocio Aduana).
- Clasificación del ticket ambigua (`confidence: low`) y el coste de error es alto.

Formato escalamiento:

```markdown
## Escalamiento HITL — conflicto agentes

### Contexto
[Ticket, clasificación, agentes en conflicto]

### Opciones
| Opción | Pros | Contras | Origen |
|--------|------|---------|--------|

### Recomendación @iatl
[Una opción]

### Acción requerida
[Aprobar / ajustar / pedir dato negocio]
```

---

## Referencias

- [peer-gate-deadlock-protocol.md](peer-gate-deadlock-protocol.md) — caso @iatl ↔ Daniel
- [diagrams.md](../architecture/diagrams.md) §4 — flujo visual
- Agente [iatl.md](../agents/iatl.md) — matriz prioridad síntesis
