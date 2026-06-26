---
name: pfi-ticket-source-resolver
description: >-
  Resuelve historias por número o URL: pregunta plataforma (Jira, ClickUp, etc.),
  detecta MCP disponible y descarga el ticket sin esperar link del usuario. El link
  sigue siendo válido como alternativa. Usar cuando el usuario mencione PFI-XXXX,
  un número de historia, ticket, HU o pida abrir/cerrar/analizar un issue sin URL.
---

# PFI — Resolución de fuente de ticket (MCP-first)

## Cuándo usar

- Usuario dice: *"PFI-1215"*, *"la 1172"*, *"abramos el ticket 1238"* **sin URL**
- Inicio de sesión spec-driven con clave de issue
- Cierre HITL: *"cerremos la 1172"*
- Análisis HU / backlog desde número de historia

**Siempre** combinar con `pfi-iatl-knowledge-hub` (Mongo) y, si aplica, `pfi-jira-pandora-aduana`.

## Flujo obligatorio

```text
1. Extraer identificador (PFI-1215, 1215, URL completa)
2. ¿Viene URL en el mensaje?
   SÍ → inferir plataforma desde host/path → fetch (flujo link — sin cambios)
   NO → paso 3
3. Preguntar plataforma (una pregunta corta):
   "¿Dónde está la historia: Jira Pandora PFI, ClickUp, Confluence u otro?"
   - Si el ID es PFI-\d+ → sugerir Jira Pandora como opción (Recommended)
4. Consultar registro MCP (tabla abajo) para la plataforma elegida
5. ¿MCP configurado y tool disponible?
   SÍ → leer schema del tool → ping si aplica → fetch INMEDIATO (no pedir link)
   NO → pedir link o pegar descripción manual
6. Persistir análisis en docs/spec-driven/PFI-{N}.md si es spec-driven
7. Registrar sesión Mongo: ingest.js session --ticket PFI-XXXX
```

**Regla clave:** si hay MCP, **no esperar** el link del usuario. El link solo se pide cuando no hay integración.

## Registro de plataformas (extensible)

| Plataforma | Patrón ID | MCP `server` (CallMcpTool) | Tool principal | Estado |
|------------|-----------|----------------------------|----------------|--------|
| **Jira Pandora PFI** | `PFI-\d+` | `user-jira-pandora-pfi` | `jira_get_issue` | ✅ Operativo |
| **Jira Pandora (búsqueda)** | JQL | `user-jira-pandora-pfi` | `jira_search` | ✅ Operativo |
| **Atlassian Cloud** | URL atlassian.net | `plugin-atlassian-atlassian` | Ver tools en `mcps/plugin-atlassian-atlassian/tools/` | ⚠️ Confluence/Jira cloud — no reemplaza Pandora |
| **ClickUp** | — | — | — | ❌ Sin MCP — usar link o copy/paste |
| **Linear** | — | — | — | ❌ Sin MCP |
| **Otro / link directo** | URL arbitraria | — | `WebFetch` si es público | Fallback manual |

Antes de cada `CallMcpTool`: leer descriptor en  
`mcps/<server>/tools/<toolName>.json` del workspace activo.

## Jira Pandora — fetch automático

```bash
# 1. Verificar (opcional si falló antes)
CallMcpTool: server=user-jira-pandora-pfi, toolName=jira_ping

# 2. Obtener issue
CallMcpTool: server=user-jira-pandora-pfi, toolName=jira_get_issue
arguments: { "issueKey": "PFI-1215" }
```

Skill detallada: `pfi-jira-pandora-aduana/SKILL.md` · inventario: `mcp-inventory.md`

## Flujo con URL (sin cambios — compatibilidad)

| URL contiene | Acción |
|--------------|--------|
| `pandora.aduana.cl/jira` + `PFI-XXXX` | Extraer `issueKey` → `jira_get_issue` (MCP) |
| `atlassian.net` / `jira.com` | MCP Atlassian plugin o WebFetch según tool |
| ClickUp / otro | WebFetch o pedir copy del cuerpo |

El usuario puede seguir pegando:  
`http://pandora.aduana.cl/jira/browse/PFI-1215` — el agente extrae la clave y usa MCP igual.

## Pregunta al usuario (plantilla)

Cuando solo hay número sin plataforma ni URL:

> Para bajar la historia **PFI-1215**, ¿en qué plataforma está?
> - **Jira Pandora PFI** (recomendado si el prefijo es PFI-)
> - ClickUp
> - Confluence / otro
>
> Si tienes MCP de Jira activo, la bajo directamente — no necesitas pasarme el link.

Si el usuario responde "Jira" o "pandora" → fetch inmediato sin pedir URL.

## Integración @iatl

En arranque de sesión con ticket:

1. Ejecutar este skill (resolver fuente + fetch issue)
2. `query.js --ticket PFI-XXXX` (Mongo histórico)
3. `query.js --working-branches --status active`
4. `ingest.js session` si es trabajo nuevo

## Añadir plataforma nueva

1. Registrar fila en tabla § Registro de plataformas
2. Documentar MCP server + tools en `pfi-iatl-developer-profile/skills-catalog.md` § MCP
3. Copia doc → `pfi-agent-architecture/skills/pfi-ticket-source-resolver.md`
4. Si no hay MCP: documentar fallback (link / export manual)

## Seguridad

- No repetir credenciales Jira en chat ni commits
- No commitear `~/.cursor/jira-pandora.env`
