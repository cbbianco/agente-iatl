# Feedback loop — @iatl aprende del par TL

## Ciclo de retroalimentación

```text
Propuesta @iatl
    ↓
Debate @pfi-tl-peer-daniel
    ↓
peer_discussions (Mongo) + learnings tl-peer
    ↓
Próxima sesión: query.js --peer-discussions --ticket PFI-XXXX
    ↓
@iatl integra en Propuesta (no repetir errores)
    ↓
Poda semanal → reference.md §2.6 (reglas estables)
```

## Qué aprende @iatl

| Fuente | Tipo de aprendizaje |
|--------|---------------------|
| `peer_discussions.verdict` | Qué propuestas fueron rechazadas y por qué |
| `peer_discussions.requiredChanges` | Patrones de ajuste TL |
| `learnings` category `tl-peer` | Bullets accionables |
| `knowledge_sources` | URLs consultadas en debates previos |
| `review_findings` | Errores post-implementación |

## Límites de ingest

- Par TL: máx. **2 bullets** por ciclo → learnings
- @iatl post-review: máx. **3 bullets** por ciclo
- No duplicar reglas ya en `reference.md` §2.6

## Jerarquía de verdad

```text
Mongo (consultable por agentes)
  ↓ poda + promoción
reference.md (estable)
  ↓ sync
review-learnings.md (vista humana)
```

## Comandos útiles

```bash
# Historial debate ticket
node ~/.cursor/iatl-knowledge/query.js --peer-discussions --ticket PFI-1238

# Learnings activos tl-peer
node ~/.cursor/iatl-knowledge/query.js --active-learnings

# Añadir fuente nueva
node ~/.cursor/iatl-knowledge/ingest.js knowledge_source \
  --id "nestjs-docs" --category nodejs \
  --name "NestJS Docs" --url "https://docs.nestjs.com/" \
  --tags "nestjs,di"
```
