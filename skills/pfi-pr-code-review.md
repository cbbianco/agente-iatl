---
name: pfi-pr-code-review
description: >-
  Code review de PRs pfi-backend-core: alcance solo del PR indicado, criterio IATL
  de patrones (Strategy/Command con intercambio), SOLID/hexagonal, paginación,
  DRY. Usar cuando el usuario pida review de PR, code review, analizar rama/PR
  Bitbucket, o invocar @iatl para auditar un diff.
---

# Code review de PR — pfi-backend-core (IATL)

## Cuándo usar

- Usuario pasa URL/ número de PR o rama a revisar.
- Usuario pide "code review", "analiza el PR", "audita la rama".
- Agente **@iatl** ante tarea de review: **leer este skill primero** (obligatorio).
- Pipeline: @iatl → @pfi-review-orchestrator → @pfi-cr-analyst + Bugbot.

## Alcance (no negociable)

| Regla | Detalle |
|-------|---------|
| **Solo el PR indicado** | Diff `base...HEAD` del PR (típico `develop...rama-head`). |
| **Checkout** | `git fetch` + checkout rama head antes de analizar. |
| **No mezclar** | No extender hallazgos a otros tickets, ramas locales ni commits ajenos al diff. |
| **Entregable** | **Siempre 2 archivos `.md`** en `docs/spec-driven/` (ver § Entregables obligatorios). |
| **No fix** | Documentar; no commitear salvo pedido explícito (salvo que @iatl pida persistir los `.md`). |

## Skills complementarios (orden)

1. **Este skill** (`pfi-pr-code-review`) — estructura y criterio patrones.
2. **`pfi-iatl-developer-profile/reference.md`** — SOLID, hexagonal, naming.
3. **`legacy-migration`** — si el diff migra legacy → lambda-casos.
4. **`review-bugbot`** — vía @pfi-review-orchestrator; mismo diff (checkout previo).

## Criterio del equipo — Strategy y Command REALES

Un componente **solo** es Strategy o Command si cumple **las dos premisas**:

| # | Premisa (equipo PFI) | Equivalente en literatura |
|---|----------------------|---------------------------|
| **P1** | Debe poder implementarse **algoritmos diferentes** bajo la **misma necesidad** / mismo contrato. | GoF Strategy: *"family of algorithms"*; GoF Command: encapsular solicitudes **sustituibles**. |
| **P2** | Debe poder **intercambiar** esas implementaciones en **runtime** sin romper al cliente. | GoF Strategy: *"make them interchangeable"*; Command: *"parameterize clients with different requests"*. |

**Si falla P1 o P2** → no usar el nombre Strategy/Command. Nombrar el patrón real (pipeline, registry, script steps, etc.).

### Fuentes de referencia (citar en informes)

| Patrón | Fuente | Intención / criterio aplicable |
|--------|--------|--------------------------------|
| **Strategy** | Gamma et al., *Design Patterns* (GoF), 1994 — Strategy | Familia de algoritmos intercambiables; el contexto delega en **una** estrategia elegida en runtime. [Refactoring.Guru — Strategy](https://refactoring.guru/design-patterns/strategy) |
| **Command** | GoF — Command | Encapsular solicitud como objeto; invoker; cola/undo; **sustitución** de comandos. [Refactoring.Guru — Command](https://refactoring.guru/design-patterns/command) |
| **Registry** | Fowler, *Patterns of Enterprise Application Architecture* — Registry | Mapa clave → implementación (ej. `AreaRiesgoContexto` → participante). No implica intercambio de algoritmos **dentro** del mismo paso. |
| **Pipeline / Script** | Fowler, *Refactoring* — Compose Method / Transaction Script | Pasos fijos o condicionales; **no** intercambio de algoritmos competidores. |

### Ejemplo Strategy **bien aplicado** (contraste para informes)

```typescript
// Contexto delega en UNA estrategia inyectada/intercambiada
interface CompressionStrategy {
  compress(data: Buffer): Buffer;
}
class ZipStrategy implements CompressionStrategy { ... }
class GzipStrategy implements CompressionStrategy { ... }

class Archiver {
  constructor(private strategy: CompressionStrategy) {}
  archive(data: Buffer) {
    return this.strategy.compress(data); // algoritmo intercambiable
  }
}
// Runtime: new Archiver(new GzipStrategy()) o new Archiver(new ZipStrategy())
```

### Ejemplo Command **bien aplicado** (contraste)

```typescript
interface Command { execute(): void; undo(): void; }
class Invoker {
  private history: Command[] = [];
  run(cmd: Command) { cmd.execute(); this.history.push(cmd); }
  undo() { this.history.pop()?.undo(); }
}
```

### Anti-ejemplo típico en PFI (pipeline nombrado Strategy)

```typescript
// NO Strategy: ejecuta TODAS las "estrategias" en serie; no hay elección ni sustitución
for (const step of [imputados, contenedores, mercanciaSuelta]) {
  await step.ejecutar(comando, id);
}
```

### Anti-ejemplo típico en PFI (script nombrado Command)

```typescript
// NO Command: sin Invoker, sin sustitución A↔B, sin undo — solo pasos condicionales
const comandos = [
  campo !== undefined && new PasoReinsercion(...),
].filter(Boolean) as ComandoInsercion[];
for (const cmd of comandos) await cmd.ejecutar();
```

### Violación de naming (documentar en informes)

| Sufijo/carpeta incorrecto | Implica (GoF) | Patrón real | Nombre honesto |
|---------------------------|---------------|-------------|----------------|
| `*Strategy`, `strategies/` | Algoritmos intercambiables | Pipeline | `Paso*`, `pasos-insercion/` |
| `Comando*`, `commands/` | Invoker + comandos sustituibles | Script steps | `PasoReinsercion*`, `pasos-reinsercion/` |

## Entregables obligatorios (2 archivos `.md`)

Todo code review (PR, rama o post spec-driven) **debe generar siempre dos documentos** en el repo:

| # | Archivo | Contenido |
|---|---------|-----------|
| 1 | `docs/spec-driven/CODE-REVIEW-PFI-XXXX.md` | Informe del code review: hallazgos por responsabilidad, severidad crítico→bajo, veredicto, checklist |
| 2 | `docs/spec-driven/ANTIPATRONES-CODE-REVIEW-PFI-XXXX.md` | Antipatrones nombrados, malas prácticas, contraste con patrones del monorepo, plan de remediación |

**Reglas:**
- El doc 2 **extiende** el doc 1 (no lo reemplaza); incluir enlace cruzado entre ambos.
- Quien ejecuta el análisis (@pfi-cr-analyst o agente en sesión directa) **escribe ambos** antes de cerrar.
- @iatl **entrega ambos** a **@pfi-tl-peer-daniel** (par arquitectura) antes de la síntesis al usuario.
- Daniel decide si extiende la información; puede añadir fuentes a `knowledge-sources.seed.json` y Mongo (`knowledge_source`).
- **Todo retroalimenta a @iatl**: learnings Mongo, bullets en `review-learnings.md`, síntesis consolidada.

### Estructura doc 1 — `CODE-REVIEW-PFI-XXXX.md`

```markdown
# Code Review — PR #N · PFI-XXXX
(metadatos, veredicto, enlace a ANTIPATRONES-CODE-REVIEW-PFI-XXXX.md)
```

### Estructura doc 2 — `ANTIPATRONES-CODE-REVIEW-PFI-XXXX.md`

```markdown
# Malas prácticas y antipatrones — PFI-XXXX
(enlace a CODE-REVIEW-PFI-XXXX.md)

## Taxonomía de antipatrones (AP-01…)
## Bloques por responsabilidad (crítico → bajo)
## Contraste con patrones existentes en monorepo
## Matriz antipatrón → capa → severidad
## Plan de remediación P0–P3
## Checklist PR (gate)
```

## Estructura del informe Markdown (doc 1)

```markdown
# Code Review — PR #N · PFI-XXXX
(metadatos, veredicto)

## Metodología (skill pfi-pr-code-review)

## Resumen ejecutivo

## 1. Paginación (con ejemplo numérico si aplica joins)

## 2. Patrones de diseño + arquitectura
### 2.x Criterio GoF (Strategy/Command) + fuentes
### 2.x Violación de naming — hexagonal + lightweight DDD (reference §2.1)
   - Mapa de capas esperado vs real
   - Tabla NAME-* por capa (Adapter, Repository, DomainService, Assembler, ApplicationInput)
   - Subconjunto GoF: Strategy/Command mal nombrados

## 3. DRY

## 4. Síntesis

## Checklist

## Veredicto
```

## Naming hexagonal + lightweight DDD (obligatorio en informes)

Además de patrones GoF, revisar **reference.md §2.1** — cada clase debe revelar capa y rol:

| Sufijo esperado | Capa | Anti-ejemplos típicos en PRs |
|-----------------|------|------------------------------|
| `QueryAdapter` | infra lectura | `*Lector`, `*Facade` GET |
| `PersistenceAdapter` | infra escritura | `*Insertor`, `*Actualizador`, `*Facade` POST/PUT |
| `*PostgresRepository` | infra impl | QueryBuilder suelto en coordinador |
| `*InterfaceRepository` | domain puerto | Repository solo en infra sin contrato domain |
| `DomainService` | domain orquestación | `*CleanupService` en infra |
| `*.assembler.ts` | domain ensamblado | `*Mapper` de contrato API en infra |
| `ApplicationInput` | application | Gateway importando `*RequestDto` de presentation |
| `Usecase` | application | `*Service` de caso de uso |

Carpetas ad-hoc (`coordinadores/`, `facades/`, `commands/`, `strategies/`) indican desvío de hexagonal si no mapean a adapter/repository/domain.

## Paginación — qué revisar

- Query params `page`/`limit` y envelope `{ data, total, page, limit }`.
- **`skip`/`take` + `leftJoinAndMapMany`**: riesgo de paginar filas SQL expandidas, no entidades padre ([TypeORM — pagination](https://typeorm.io/select-query-builder#adding-pagination)).
- Incluir **ejemplo numérico** en el informe cuando el PR use joins one-to-many.

## Bugbot (opcional mismo PR)

Tras checkout de la rama, invocar skill `review-bugbot` con:

```text
Full Repository Path: <repo>
Diff: branch changes
Base Branch: develop
Custom Instructions: <alcance PR + foco indicado por usuario>
```
