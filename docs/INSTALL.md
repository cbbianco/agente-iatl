# Guía de instalación — IATL / PFI Agent Architecture

Instala la arquitectura multiagente IATL para desarrollo spec-driven en **pfi-backend-core**: agentes, skills, hub Mongo y Chroma.

**Repositorio:** [github.com/cbbianco/agente-iatl](https://github.com/cbbianco/agente-iatl)

---

## Requisitos previos

| Componente | Versión / notas |
|------------|-----------------|
| **Node.js** | ≥ 18 |
| **npm** | incluido con Node |
| **Git** | clonar el repo de arquitectura |
| **MongoDB** | local en `127.0.0.1:27017` (o URI vía `IATL_MONGO_URI`) |
| **ChromaDB** | opcional pero recomendado — puerto **8010** (búsqueda semántica) |
| **Checkout backend** | `pfi-backend-core` (ruta absoluta al clonar) |

### MongoDB (Linux)

```bash
# Ubuntu/Debian — ejemplo con paquete oficial o contenedor
docker run -d --name iatl-mongo -p 27017:27017 mongo:7
```

Verificar:

```bash
# Si tienes mongosh instalado:
mongosh --eval 'db.runCommand({ ping: 1 })'

# Alternativa: health vía hub (tras instalar)
node ~/.cursor/iatl-knowledge/query.js --project-config
```

### ChromaDB (opcional, recomendado)

```bash
npx chroma run --path ~/.cursor/iatl-knowledge/chroma-data --port 8010
```

En otra terminal, tras instalar el hub:

```bash
node ~/.cursor/iatl-knowledge/query.js --chroma-health
```

---

## 1. Clonar el repositorio

```bash
git clone https://github.com/cbbianco/agente-iatl.git pfi-agent-architecture
cd pfi-agent-architecture
npm install
```

---

## 2. Instalación recomendada — CLI portable

El instalador copia **agentes**, **skills** (incl. perfiles completos) y **hub Mongo/Chroma** al runtime que elijas.

### Modo interactivo (Cursor)

```bash
cd pfi-agent-architecture
npm run install:iatl
```

El asistente pregunta:

1. **Runtime** — Cursor, VS Code, Claude Code, Antigravity o Docker
2. **Proyecto** — slug (`pfi-backend-core`)
3. **Contexto** — una línea descriptiva del backend
4. **Sprint** — ej. `2026-S12`
5. **Arquitectura objetivo** — ej. `hexagonal-lambda-nestjs`
6. **Retención HITL** — días (default `14`)
7. **Ruta legacy / API DEV** — opcional
8. **Ruta checkout** — carpeta local de `pfi-backend-core`

### Modo rápido (Cursor, sin preguntas)

```bash
npm run install:iatl:quick
```

Equivalente a:

```bash
node cli/iatl-install.mjs --non-interactive --runtime cursor \
  --project pfi-backend-core \
  --project-root /ruta/absoluta/a/pfi-backend-core
```

### Flags útiles

| Flag | Descripción |
|------|-------------|
| `--runtime cursor` | Instala en `~/.cursor/` |
| `--runtime vscode` | Instala en `~/.iatl/` |
| `--runtime vscode-claude` | Instala en `~/.claude/iatl/` |
| `--runtime antigravity` | Instala en `~/.antigravity/` |
| `--runtime docker` | Genera `.iatl-docker/` en el proyecto |
| `--non-interactive` | Sin prompts |
| `--skip-hub-setup` | Solo copia artefactos; no ejecuta `setup-agent.js` |
| `--sprint 2026-S12` | Etiqueta sprint en `config.json` |
| `--retention 14` | Días retención cierres HITL |

---

## 3. Ubicaciones tras instalar (Cursor)

| Artefacto | Ruta operativa |
|-----------|----------------|
| Agentes | `~/.cursor/agents/` |
| Skills | `~/.cursor/skills/` |
| Hub Mongo + scripts | `~/.cursor/iatl-knowledge/` |
| Config sprint | `~/.cursor/iatl-knowledge/config.json` |
| Chroma data | `~/.cursor/iatl-knowledge/chroma-data/` |

Mapa completo: [LOCATIONS.md](../LOCATIONS.md).

---

## 4. Instalación manual del hub (alternativa)

Si ya copiaste agentes/skills o prefieres control total:

```bash
# Copiar scripts del hub desde el repo
mkdir -p ~/.cursor/iatl-knowledge
cp -r mongo/scripts/* ~/.cursor/iatl-knowledge/
cp mongo/package.json ~/.cursor/iatl-knowledge/

cd ~/.cursor/iatl-knowledge
npm install
node setup-agent.js          # detecta IDE + config proyecto/sprint
npm run init                 # índices Mongo
npm run seed-sources         # URLs knowledge_sources
npm run migrate-chroma       # primera sync Mongo → Chroma
```

Copiar agentes y skills desde el repo:

```bash
REPO=/ruta/a/pfi-agent-architecture

cp "$REPO"/agents/*.md ~/.cursor/agents/

# Skills planos (.md → carpeta/SKILL.md)
for f in "$REPO"/skills/*.md; do
  [ "$(basename "$f")" = "catalog.md" ] && continue
  name=$(basename "$f" .md)
  mkdir -p ~/.cursor/skills/"$name"
  cp "$f" ~/.cursor/skills/"$name"/SKILL.md
done

# Skills con directorio completo (perfil, Daniel, etc.)
cp -r "$REPO"/skills/pfi-iatl-developer-profile ~/.cursor/skills/
cp -r "$REPO"/skills/pfi-tl-peer-daniel-analisis ~/.cursor/skills/
cp -r "$REPO"/skills/pfi-tl-peer-daniel-implementacion ~/.cursor/skills/
cp -r "$REPO"/skills/pfi-tl-peer-daniel ~/.cursor/skills/
```

---

## 5. Instalación Docker

Para CI o entorno sin IDE local:

```bash
cd pfi-agent-architecture
node cli/iatl-install.mjs --non-interactive --runtime docker \
  --project-root /ruta/a/pfi-backend-core

cd /ruta/a/pfi-backend-core/.iatl-docker
cp .env.example .env
docker compose up -d
docker compose exec iatl-hub node query.js --chroma-health
```

Detalle: [docker/README.md](../docker/README.md).

---

## 6. Verificación post-instalación

Ejecutar en orden:

```bash
HUB=~/.cursor/iatl-knowledge   # ajustar según runtime

# 1. Config del sprint
node "$HUB"/query.js --project-config

# 2. Mongo accesible
node "$HUB"/query.js --working-branches

# 3. Chroma (si está levantado)
node "$HUB"/query.js --chroma-health

# 4. Clasificación de ticket (smoke test)
node "$HUB"/query.js --classify-ticket \
  --summary "Corregir validación en endpoint selectividad" \
  --issue-type Bug
```

En **Cursor**, invocar `@iatl` en el chat del proyecto `pfi-backend-core`. El orquestador debe cargar skills desde `~/.cursor/skills/` y consultar Mongo al arrancar sesión.

---

## 7. MCP Jira Pandora (opcional)

Para resolver tickets `PFI-XXXX` sin pegar URL:

1. Configurar MCP `user-jira-pandora-pfi` en Cursor (Settings → MCP).
2. Usar skill `pfi-ticket-source-resolver` o pedir al agente: *analiza PFI-1202*.

Ver [skills/pfi-ticket-source-resolver.md](../skills/pfi-ticket-source-resolver.md).

---

## 8. Actualizar desde el repo

Cuando cambie la arquitectura en GitHub:

```bash
cd pfi-agent-architecture
git pull origin master
npm run install:iatl:quick
# o reinstalar con flags si cambiaste sprint/proyecto
```

Solo hub (sin re-copiar agentes):

```bash
cp -r mongo/scripts/* ~/.cursor/iatl-knowledge/
cd ~/.cursor/iatl-knowledge && npm install && npm run init
```

---

## 9. Solución de problemas

| Síntoma | Acción |
|---------|--------|
| `npm install` falla en hub | Node ≥ 18; borrar `node_modules` y reintentar |
| `query.js` no conecta Mongo | Verificar `docker ps` / servicio en `27017`; revisar `IATL_MONGO_URI` |
| `--chroma-health` error | Levantar Chroma en puerto 8010 o ignorar (Mongo sigue operativo) |
| Agente no ve skills | Confirmar carpetas en `~/.cursor/skills/<nombre>/SKILL.md` |
| `mongosh` no encontrado | No es obligatorio; usar `node query.js` del hub |
| Instalación Docker sin IDE | Usar `docker compose exec iatl-hub node query.js ...` |

---

## 10. Próximos pasos

1. Abrir **pfi-backend-core** en Cursor.
2. Invocar **@iatl** con un ticket: `arranquemos PFI-XXXX`.
3. Registrar rama feature: skill `pfi-git-branch-format` o `@iatl`.
4. Al cerrar ticket HITL: el hub ejecuta `close-ticket.js` (retención según `config.json`).

Documentación relacionada:

- [README.md](../README.md) — visión general
- [architecture/overview.md](../architecture/overview.md) — capas y diagrama
- [architecture/pipeline.md](../architecture/pipeline.md) — flujo spec-driven
- [mongo/README.md](../mongo/README.md) — colecciones y comandos hub
- [CHANGELOG.md](../CHANGELOG.md) — versiones del repo
