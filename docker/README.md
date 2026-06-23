# IATL — Stack Docker

Ejecución containerizada de la arquitectura multiagente (hub Mongo + Chroma + artefactos).

## Servicios

| Servicio | Puerto | Rol |
|----------|--------|-----|
| `mongo` | 27017 | Hub operativo IATL |
| `chroma` | 8010 | Recall semántico |
| `iatl-hub` | — | Scripts query/ingest (volumen `/opt/iatl`) |

## Arranque

```bash
cd .iatl-docker   # generado por iatl-install con --runtime docker
cp .env.example .env
docker compose up -d
docker compose exec iatl-hub node query.js --chroma-health
```

## Variables (.env)

```env
IATL_MONGO_URI=mongodb://mongo:27017
IATL_MONGO_DB=iatl_knowledge
IATL_CHROMA_HOST=chroma
IATL_CHROMA_PORT=8000
IATL_PROJECT=pfi-backend-core
```

## Uso desde host

Monta el checkout del backend y ejecuta consultas contra el stack:

```bash
docker compose exec iatl-hub node query.js --project-config
docker compose exec iatl-hub node query.js --classify-ticket \
  --summary "Corregir validación marcaje" --issue-type Bug
```

## Notas

- Los agentes/skills viven en el volumen `iatl_artifacts` dentro del contenedor.
- Para desarrollo local con Cursor, preferir runtime `cursor` en lugar de Docker.
- CI/CD puede usar este stack para tests de integración del hub sin IDE.
