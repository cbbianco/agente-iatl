# Peer Gate — Protocolo de desacuerdo (@iatl ↔ Daniel)

Copia de referencia del protocolo IATL Peer Gate cuando el debate par TL **no llega a acuerdo**.

## Cuándo aplica

- @iatl propone solución A.
- @pfi-tl-peer-daniel emite **RECHAZADO** o **APTO_CON_CAMBIOS** con cambios que @iatl no acepta como única vía.
- Tras **un ciclo de réplica** sigue sin consenso.

## Regla: no forzar un bando

**No** quedarse en empate. **No** presentar al usuario dos opciones igualadas sin recomendación.

## Procedimiento (obligatorio)

```text
1. Conservar idea A (@iatl) y idea B (Daniel) — registrar en peer_discussion
2. Generar idea C — síntesis que resuelva objeciones de ambos
   - Si hace falta, invocar @pfi-patterns-advisor (solo con foco patrones)
3. Evaluar A vs B vs C con criterios:
   - diff mínimo
   - sin deuda diferida
   - paridad legacy / contrato
   - operabilidad (deploy, QA)
   - SOLID / hexagonal IATL
4. Elegir la más sólida → Propuesta HITL única
5. En Propuesta HITL incluir:
   - Opción recomendada (una)
   - Breve mención de descartadas (1 línea c/u, por qué)
   - Siguiente paso concreto para el usuario
```

## Formato Propuesta HITL (post-deadlock)

```markdown
## Propuesta HITL — PFI-XXXX

### Recomendación (opción C — síntesis)
[Qué hacer, archivos, rama base]

### Alternativas evaluadas
| Opción | Origen | Por qué no se elige |
|--------|--------|---------------------|
| A | @iatl | ... |
| B | Daniel | ... |

### Siguiente paso
[Una acción concreta: aprobar / ajustar / pedir dato]
```

## Persistencia Mongo

```bash
node ~/.cursor/iatl-knowledge/ingest.js peer_discussion --ticket-json /tmp/peer-deadlock.json
```

Payload debe incluir: `ideaA`, `ideaB`, `ideaC`, `chosenOption`, `rationale`.

## Prohibido

- Presentar A y B al usuario pidiendo que elija sin recomendación
- Implementar sin HITL tras deadlock
- Ignorar veto Daniel por deuda diferida en la opción elegida

## Referencias

- Skill: `~/.cursor/skills/pfi-tl-peer-daniel/SKILL.md` § Desacuerdo
- Agente: `~/.cursor/agents/iatl.md` § Peer Gate deadlock (paso 3b)
