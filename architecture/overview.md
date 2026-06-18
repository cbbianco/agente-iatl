# Visión — Arquitectura de agentes PFI

## Problema

Entregas rápidas con deuda estructural (curva feat → fix bajo presión) degradan develop. El orquestador IATL necesita un **par revisor** con criterio TL antes de presentar soluciones al desarrollador.

## Solución

Dos capas de inteligencia cooperativa:

| Capa | Agente | Perfil |
|------|--------|--------|
| Orquestación + HITL | @iatl | César — hexagonal estricto, spec-driven |
| Gate pre-HITL | @pfi-tl-peer-daniel | Daniel TL — pragmático, diff mínimo, sin deuda diferida |
| Gate post-código | @pfi-review-orchestrator | CR Claude + Bugbot |

## Principios

1. **Una interfaz humana:** solo @iatl habla con el desarrollador.
2. **Debate obligatorio:** toda Propuesta pasa por par TL antes de HITL.
3. **Memoria persistente:** Mongo indexa contexto; @iatl mejora sesión a sesión.
4. **Fuentes externas:** URLs curadas por categoría (patrones, Node, REST, AWS).
5. **Anti-patrón explícito:** curva Carlos documentada — no replicar.

## Jerarquía

```mermaid
flowchart TB
  U[Desarrollador César] <--> IATL[@iatl]
  IATL --> TL[@pfi-tl-peer-daniel]
  TL --> Mongo[(Mongo iatl_knowledge)]
  IATL --> Mongo
  IATL --> RO[@pfi-review-orchestrator]
  RO --> CR[@pfi-cr-analyst]
  RO --> BB[Bugbot]
  IATL --> PA[@pfi-patterns-advisor]
```

## Alcance repo vs ~/.cursor

- **Código lambdas:** `pfi-backend-core/src/lambda/`
- **Agentes/skills/hub:** `~/.cursor/` (no commitear secrets)
- **Esta carpeta:** documentación y copias de referencia versionadas en git
