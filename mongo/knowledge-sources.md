# Knowledge sources — Índice URLs par TL

Colección Mongo: `knowledge_sources`.

Seed: `~/.cursor/skills/pfi-tl-peer-daniel/knowledge-sources.seed.json`

## Categorías canónicas

| category | Fuente | URL |
|----------|--------|-----|
| `design-patterns` | Refactoring.Guru — Catálogo | https://refactoring.guru/design-patterns |
| `nodejs` | Node.js Official Guides | https://nodejs.org/en/docs/guides/ |
| `rest-api` | Microsoft REST API Design | https://learn.microsoft.com/en-us/azure/architecture/best-practices/api-design |
| `aws` | AWS Lambda Best Practices | https://docs.aws.amazon.com/lambda/latest/dg/best-practices.html |

## Cuándo consulta cada categoría

| Debate sobre… | Categoría |
|---------------|-----------|
| Strategy/Command, facades, registry | design-patterns |
| async, errores, módulos en lambda | nodejs |
| contratos HTTP, códigos, recursos | rest-api |
| Lambda, Dynamo, trazas, despliegue | aws |

## Añadir fuente

**Opción A — CLI:**

```bash
node ~/.cursor/iatl-knowledge/ingest.js knowledge_source \
  --id "openapi-spec" \
  --category rest-api \
  --name "OpenAPI Specification" \
  --url "https://spec.openapis.org/oas/latest.html" \
  --tags "openapi,contract" \
  --priority 2
```

**Opción B — editar seed JSON y re-sembrar:**

```bash
npm run seed-sources
```

## Documento ejemplo

```json
{
  "sourceId": "aws-lambda-best-practices",
  "category": "aws",
  "name": "AWS Lambda — Best Practices",
  "url": "https://docs.aws.amazon.com/lambda/latest/dg/best-practices.html",
  "tags": ["lambda", "cold-start", "concurrency"],
  "enabled": true,
  "priority": 1,
  "createdAt": "...",
  "updatedAt": "..."
}
```

## Relación con pattern-sources.json

| Índice | Agente | Uso |
|--------|--------|-----|
| `knowledge_sources` (Mongo) | @pfi-tl-peer-daniel | Debate pre-HITL — 4 categorías amplias |
| `pattern-sources.json` | @pfi-patterns-advisor | Foco patrones GoF P1+P2 |

No duplicar innecesariamente; el par TL usa el catálogo general de patrones; patterns-advisor usa fuentes granulares (Strategy, Command, etc.).
