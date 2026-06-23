# Diagramas de arquitectura IATL

Visualización de componentes, secuencias y decisiones. Complementa [overview.md](overview.md) y [pipeline.md](pipeline.md).

---

## 1. Diagrama de componentes

```mermaid
flowchart TB
  subgraph Human["Capa humana"]
    DEV[Desarrollador César]
  end

  subgraph Runtime["Runtime portable"]
    CLI[iatl-install CLI]
    CUR[Cursor ~/.cursor]
    VSC[VS Code ~/.iatl]
    CC[Claude Code ~/.claude/iatl]
    AG[Antigravity ~/.antigravity]
    DKR[Docker stack]
  end

  subgraph Orquestacion["Orquestación"]
    IATL[@iatl]
  end

  subgraph Gates["Gates especializados"]
    TL[@pfi-tl-peer-daniel]
    RO[@pfi-review-orchestrator]
    CR[@pfi-cr-analyst]
    BB[Bugbot]
    PA[@pfi-patterns-advisor]
  end

  subgraph Hub["Hub conocimiento"]
    MONGO[(MongoDB operativo)]
    CHROMA[(ChromaDB semántico)]
    TC[ticket_classifications]
    TM[ticket_metrics]
  end

  subgraph External["Externos"]
    JIRA[Jira MCP]
    WEB[Fuentes web curadas]
  end

  DEV <-->|HITL| IATL
  CLI --> CUR & VSC & CC & AG & DKR
  CUR & VSC & CC & AG & DKR --> IATL

  IATL --> TL
  IATL --> RO
  RO --> CR
  RO --> BB
  IATL -.->|foco patrones| PA

  IATL --> MONGO
  TL --> MONGO
  CR --> MONGO
  MONGO --> CHROMA

  MONGO --- TC
  MONGO --- TM

  IATL --> JIRA
  TL --> WEB
```

---

## 2. Diagrama de secuencia — ciclo ticket completo

```mermaid
sequenceDiagram
  participant U as Desarrollador
  participant I as @iatl
  participant Q as query.js
  participant J as Jira MCP
  participant C as ticket-classifier
  participant T as @pfi-tl-peer-daniel
  participant R as @pfi-review-orchestrator
  participant M as Mongo

  U->>I: PFI-XXXX / analizar ticket
  I->>J: fetch issue (MCP)
  J-->>I: summary, type, labels
  I->>Q: --classify-ticket
  Q->>C: classifyWithProfile
  C-->>I: classification + analysisPath + agentsToInvoke
  I->>M: ingest ticket_classification

  alt path = fast (bug)
    I->>U: Propuesta corta HITL
  else path = standard (feature/refactor)
    I->>T: debate par TL
    T-->>I: veredicto
    I->>U: Propuesta HITL
  else path = full (arquitectura)
    I->>T: debate extendido
    I->>I: @pfi-patterns-advisor
    T-->>I: veredicto + patrones
    I->>U: Propuesta HITL
  else path = light (investigación)
    I->>U: documento análisis (sin código)
  end

  U->>I: aprueba HITL
  I->>I: implementación
  I->>R: review post-código
  R-->>I: PaqueteReview + 2 .md
  I->>M: ingest ticket_metric + learnings
  I->>U: síntesis + cierre
```

---

## 3. Flujo de decisiones — clasificación y nivel de análisis

```mermaid
flowchart TD
  START([Ticket recibido]) --> FETCH[Obtener issue Jira MCP]
  FETCH --> CLASS[classify-ticket]

  CLASS --> INV{investigación?}
  INV -->|sí| LIGHT[path: light<br/>solo documento]
  INV -->|no| ARCH{arquitectura?}

  ARCH -->|sí| FULL[path: full<br/>debate + patterns + CR exhaustivo]
  ARCH -->|no| BUG{bug?}

  BUG -->|sí| FAST[path: fast<br/>sin debate par TL]
  BUG -->|no| REF{refactor?}

  REF -->|sí| STD[path: standard<br/>debate + paridad]
  REF -->|no| FEAT[path: standard<br/>feature normal]

  LIGHT --> HITL1{HITL usuario}
  FAST --> HITL2{HITL usuario}
  STD --> DEBATE[Debate @pfi-tl-peer-daniel]
  FULL --> DEBATE_EXT[Debate extendido + patterns]
  FEAT --> DEBATE

  DEBATE --> DEAD{desacuerdo?}
  DEBATE_EXT --> DEAD
  DEAD -->|sí| SYNTH[síntesis C — ver conflict-resolution]
  DEAD -->|no| HITL3{HITL usuario}
  SYNTH --> HITL3

  HITL1 -->|investigar más| IMPL
  HITL2 --> IMPL[Implementación]
  HITL3 -->|aprueba| IMPL

  IMPL --> REVIEW[Review orquestador]
  REVIEW --> METRIC[ingest ticket_metric]
  METRIC --> CLOSE[Cierre HITL]
  CLOSE --> END([Fin ciclo])

  LIGHT -.->|sin implementación| END
```

---

## 4. Flujo de decisiones — resolución de conflictos

```mermaid
flowchart TD
  CONFLICT([Desacuerdo detectado]) --> TYPE{Tipo de conflicto}

  TYPE -->|@iatl ↔ Daniel| PEER[Protocolo peer gate deadlock]
  TYPE -->|CR ↔ Bugbot| CRBB[Matriz prioridad @iatl]
  TYPE -->|@iatl ↔ CR analyst| CRATL[Escalar a HITL con evidencia]
  TYPE -->|Patterns ↔ TL| PAT[Daniel tiene veto arquitectura]

  PEER --> ABC[Registrar A, B → generar C]
  ABC --> EVAL[Evaluar diff/paridad/SOLID]
  EVAL --> ONE[Una Propuesta HITL recomendada]

  CRBB --> CRIT{Bug crítico Bugbot?}
  CRIT -->|sí| BLOCK[Bloquear commit]
  CRIT -->|no| CRWIN[Priorizar CR si arquitectura]

  CRATL --> HITL[Usuario decide con matriz]

  PAT --> DANIEL[Veredicto Daniel prevalece en deuda diferida]

  ONE --> MONGO[(peer_discussions)]
  BLOCK --> MONGO
  CRWIN --> MONGO
  HITL --> MONGO
  DANIEL --> MONGO
```

Ver [../docs/agent-conflict-resolution.md](../docs/agent-conflict-resolution.md) para procedimientos detallados.

---

## Referencias

- [ticket-classification.md](ticket-classification.md) — perfiles por tipo
- [quality-metrics.md](quality-metrics.md) — métricas del ciclo
- [pipeline.md](pipeline.md) — flujo textual
