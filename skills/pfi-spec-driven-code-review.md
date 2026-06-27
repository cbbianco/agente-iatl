---
name: pfi-spec-driven-code-review
description: >-
  Code review post spec-driven para pfi-backend-core: antipatrones, patrones GoF
  reales, complejidad ciclomática/cognitiva, hexagonal/SOLID, alineación de ramas.
  Usar cuando @iatl orqueste revisión antes de confirmar código tras una sesión
  spec-driven. Pipeline: @pfi-review-orchestrator → @pfi-cr-analyst + Bugbot.
  El analista NO commitea; entrega veredicto a @iatl vía orquestador.
---

# Code review post spec-driven — pfi-backend-core

## Cuándo usar

- **Después** de una sesión spec-driven (Jira PFI-XXXX, diseño aprobado, código implementado).
- **Antes** de que el usuario confirme commit, push, PR o deploy.
- **Orquestado por @iatl** — nunca como acción autónoma del revisor.

## Quién hace qué

| Rol | Responsabilidad |
|-----|-----------------|
| **@iatl** | Orquesta, absorbe hub Mongo, sintetiza, pide OK al usuario, persiste aprendizajes |
| **@pfi-review-orchestrator** | Pipeline review — invoca automáticamente CR analyst + Bugbot |
| **@pfi-cr-analyst** | Análisis exhaustivo — **code-review Claude MANDATORIO** + perfil + runtime |
| **@pfi-patterns-advisor** | Solo si usuario marca foco patrones — no en review rutinario |
| **Usuario** | Aprueba o rechaza veredicto final |

## Skills complementarios (orden de lectura)

**Profile stack:** `profile-stack.md` → knowledge-hub (Mongo) → reference → catalog → review-learnings → SKILL.md

Luego:

1. **`code-review/SKILL.md`** — **MANDATORIO** (ejecutado por @pfi-cr-analyst)
2. **Este skill** — gate post spec-driven + complejidad + runtime + informe
3. **`pfi-pr-code-review`** — Strategy/Command, paginación, DRY
4. **`legacy-migration`** — umbrales complejidad
5. **`pfi-qa-api-curls`** — runtime obligatorio si hay HTTP
6. **`review-bugbot`** — vía orquestador; @iatl sintetiza

## Alcance del diff

| Contexto | Diff a revisar |
|----------|----------------|
| Post spec-driven en rama de ticket | Solo archivos del ticket / spec acordado |
| Rama feature + conflict develop/qa | Verificar **alineación funcional** entre ramas, no solo Swagger |
| Pre-commit | Solo staged (coherente con pre-commit del repo) |

**No mezclar tickets.** Si el diff incluye otro PFI, marcar como fuera de alcance.

## Umbrales de complejidad (obligatorio reportar)

Contar puntos de decisión: `if`, `else`, `for`, `while`, `catch`, `&&`, `||`, `?:`, `case`.

| Métrica | Umbral | Acción en informe |
|---------|--------|-------------------|
| **Ciclomática (M)** por función/método | M > 10 | 🔴 Bloqueante — extraer métodos / Strategy real / early return |
| **Cognitiva** (anidamiento + breaks) | > 15 | 🟠 Advertencia — aplanar, guard clauses, extraer DomainService |
| **Archivo** | > 300 LOC lógica | 🟡 Sugerencia — dividir por capa |

Documentar **función + M estimado** en el informe cuando supere umbral.

## Validación runtime (obligatorio si hay endpoints HTTP)

**Readonly en repo** no excluye probar la API desplegada.

1. Leer skill **`pfi-qa-api-curls`**: identificar ruta, headers (session, identifier, profile), roles.
2. Generar curls para happy path + al menos un error esperado (404/400 según spec).
3. **Ejecutar** curls contra el stage indicado por @iatl (dev/qa/local).
4. Reportar en informe:

| Endpoint | curl | Status | ¿Paridad spec? | Notas |
|----------|------|--------|----------------|-------|

5. **NO APTO** si: 500 inesperado, contrato JSON distinto al spec, ruta 404 con controller registrado, o auth incorrecta vs rol documentado.
6. Si el entorno no está desplegado: marcar `RUNTIME PENDIENTE` — @iatl debe informar al usuario antes de APTO final.

## Checklist — antipatrones (bloqueantes si aplican)

### Arquitectura hexagonal

- [ ] Domain sin Nest, TypeORM ni imports de infra
- [ ] Application sin DTOs de presentation ni adapters concretos
- [ ] QueryAdapter **solo lectura**; PersistenceAdapter **solo escritura**
- [ ] DomainService orquesta; Usecase secuencial (no `Promise.all` cosmético)
- [ ] Assembler en domain para contrato legacy; no mapper de contrato en infra
- [ ] Gateway pequeño (ISP); no mega-gateway que orquesta
- [ ] DataSource/entities alineados si se reutiliza conexión en la misma invocación Lambda

### Patrones GoF (reference §2.3 + pfi-pr-code-review)

- [ ] Strategy/Command **solo** si P1 (algoritmos distintos) **y** P2 (intercambio runtime)
- [ ] Pipeline/script no nombrado Strategy/Command
- [ ] Registry vs Strategy distinguido

### Spec-driven / operación (lecciones de iteración)

- [ ] Cambio de **lógica** alineado en feature + conflict develop + conflict qa (no solo Swagger)
- [ ] Swagger/documentación ≠ código desplegado — verificar controller registrado en módulo
- [ ] Rutas duplicadas entre controllers (mismo `@Controller` + path)
- [ ] Canal INTERNAL vs EXTERNAL: reglas de validación y SQL no cruzadas
- [ ] 404 de negocio no convertido en 500 genérico
- [ ] Diff mínimo; sin archivos ajenos al ticket en staged

### Calidad general

- [ ] Paridad funcional con legacy/develop según spec
- [ ] Tests significativos (no triviales)
- [ ] JSDoc en métodos públicos exportados (§2.5 reference)
- [ ] Sin secrets, sin `as unknown as Dto` en tests nuevos

## Entregables obligatorios (2 archivos `.md`)

Igual que `pfi-pr-code-review` — **siempre dos documentos** en `docs/spec-driven/`:

| Archivo | Rol |
|---------|-----|
| `CODE-REVIEW-PFI-XXXX.md` | Informe puntual por responsabilidad y severidad |
| `ANTIPATRONES-CODE-REVIEW-PFI-XXXX.md` | Taxonomía AP-*, malas prácticas, contraste monorepo, remediación |

**Pipeline de retroalimentación:**

```text
@pfi-cr-analyst escribe ambos .md
  → @pfi-review-orchestrator (PaqueteReview + rutas .md)
  → @iatl entrega ambos a @pfi-tl-peer-daniel
  → Daniel: extiende / knowledge_sources / Mongo
  → informe Daniel → @iatl
  → @iatl síntesis al usuario + persist hub
```

## Formato de entrega (para @iatl, no para el usuario directo)

Además de los **2 `.md` en repo**, el analista entrega resumen interno:

```markdown
# Revisión post spec-driven — PFI-XXXX

## Artefactos generados
- docs/spec-driven/CODE-REVIEW-PFI-XXXX.md
- docs/spec-driven/ANTIPATRONES-CODE-REVIEW-PFI-XXXX.md

## Veredicto
APTO | APTO CON OBSERVACIONES | NO APTO

## Spec acordado vs implementación
| Requisito spec | Estado | Evidencia |
|----------------|--------|-----------|

## Complejidad
| Ubicación | M est. | Cognitiva est. | Acción |
|-----------|--------|----------------|--------|

## Antipatrones / malas prácticas
### 🔴 Bloqueantes
### 🟠 Advertencias
### 🟡 Sugerencias

## Patrones — evaluación GoF
| Componente | ¿Strategy/Command válido? | Patrón real | Recomendación |

## Alineación ramas (si aplica)
- feature vs conflict develop: ...
- conflict qa vs develop: ...

## Validación runtime
| Endpoint | Status | Paridad spec | Evidencia |
|----------|--------|--------------|-----------|

## Bugbot (hallazgos crudos — @iatl sintetiza)
| Severidad | Ubicación | Finding |

## Retroalimentación IATL (persistir — máx. 3 bullets)
- [Bullet reutilizable — @iatl mergea en review-learnings.md; poda semanal]

## Recomendación para @iatl
[Un párrafo: qué presentar al usuario y qué NO hacer hasta OK]
```

## Reglas del revisor

1. **No** editar archivos del repo, **no** `git commit`, **no** `git push`, **no** deploy CDK.
2. **Sí** ejecutar curls HTTP (skill `pfi-qa-api-curls`) para validación runtime.
3. **No** hablar al usuario como decisor — informe para **@iatl**; @iatl sintetiza con Bugbot.
4. Citar archivos con `path:line` cuando sea posible.
5. Si falta spec o stage de prueba, pedirlo a **@iatl**.
6. Cerrar con **Retroalimentación IATL (persistir)** — máx. 3 bullets.

## Flujo orquestado por @iatl

```text
Spec-driven (diseño OK usuario)
  → Implementación
  → @pfi-review-orchestrator
      → @pfi-cr-analyst (code-review Claude MANDATORIO + perfil + runtime)
      → review-bugbot (mismo diff, paralelo)
  → PaqueteReview → @iatl
  → Persistir Mongo (pfi-iatl-knowledge-hub) + review-learnings.md
  → Usuario OK → commit/push/PR/deploy

Foco patrones (opcional, solo si usuario lo marca):
  → @pfi-patterns-advisor (antes o durante debate)
```
