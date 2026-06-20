# ChromaDB — capa semántica IATL

Chroma corre **localmente** junto al hub Mongo. No se versiona el servidor ni el venv Python.

## Ubicación operativa

| Artefacto | Path local |
|-----------|------------|
| Datos persistentes | `~/.cursor/iatl-knowledge/chroma-data/` |
| Cliente Node | `~/.cursor/iatl-knowledge/lib/chroma.js` |
| Espejo scripts | `mongo/scripts/` (este repo) |

## Arrancar servidor

```bash
cd ~/.cursor/iatl-knowledge
npx chroma run --path ./chroma-data --port 8010
```

## Health check

```bash
curl -s http://127.0.0.1:8010/api/v2/heartbeat
node ~/.cursor/iatl-knowledge/query.js --chroma-health
```

## Búsqueda semántica

```bash
node ~/.cursor/iatl-knowledge/query.js --semantic-search "oficio fiscalia numero legacy"
```

## Nota sobre `chroma_local/`

La carpeta `chroma_local/` en este repo es un entorno Python de desarrollo local. Está en `.gitignore` — no commitear `venv/`.
