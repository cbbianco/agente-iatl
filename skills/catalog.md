# Catálogo skills — copia referencia

Fuente operativa: `~/.cursor/skills/pfi-iatl-developer-profile/skills-catalog.md`

## Perfil desarrollador (v1.6)

Copia completa en repo:

```text
pfi-agent-architecture/skills/pfi-iatl-developer-profile/
├── SKILL.md              # síntesis — Full Stack Senior (no TL orgánico)
├── reference.md          # spec v1.6 — modos, triage, IDE-agnóstico
├── profile-stack.md
├── skills-catalog.md
├── review-learnings.md
└── pattern-sources.json
```

## Skills PFI principales

| Skill | Rol |
|-------|-----|
| `pfi-iatl-developer-profile` | Perfil César — Full Stack Senior, hexagonal, HITL, orquestación multi-ticket |
| `pfi-iatl-knowledge-hub` | Hub Mongo + ChromaDB v2.0 |
| **`pfi-ticket-source-resolver`** | **Número de historia → pregunta plataforma → MCP-first (sin esperar link)** |
| **`pfi-daily-branch-tracker`** | **Registro diario ramas Git + espejo `working-branches.md`** |
| **`pfi-tl-peer-daniel-analisis`** | **Par TL Daniel análisis — pre-HITL + post CR** |
| **`pfi-tl-peer-daniel-implementacion`** | **Par TL Daniel implementación — plan + código** |
| **`pfi-tl-peer-daniel`** | **Alias → daniel-análisis** |
| `pfi-pr-code-review` | Review PR |
| `pfi-spec-driven-code-review` | Gate post spec-driven |
| `code-review` | Claude mandatorio en CR analyst |
| `pfi-jira-pandora-aduana` | Jira PFI |
| `pfi-qa-api-curls` | Curls HTTP |
| `legacy-migration` | Migración legacy |
| `pfi-commit-message-format` | Commits |
| `pfi-git-branch-format` | Ramas |

## Skill daily branch tracker

```text
~/.cursor/skills/pfi-daily-branch-tracker/
└── SKILL.md
```

Copia doc: [pfi-daily-branch-tracker.md](pfi-daily-branch-tracker.md)  
Copia doc hub: [pfi-iatl-knowledge-hub.md](pfi-iatl-knowledge-hub.md) — incluye § Cierre HITL autónomo  
Copia doc tickets: [pfi-ticket-source-resolver.md](pfi-ticket-source-resolver.md) — MCP-first por número de historia

## Skill par TL — archivos

```text
~/.cursor/skills/pfi-tl-peer-daniel-analisis/
├── SKILL.md
├── reference.md
├── anti-patterns-carlos.md
└── knowledge-sources.seed.json

~/.cursor/skills/pfi-tl-peer-daniel-implementacion/
└── SKILL.md

~/.cursor/skills/pfi-tl-peer-daniel/   # alias → analisis
└── SKILL.md
```

Agentes: `pfi-tl-peer-daniel-analisis.md`, `pfi-tl-peer-daniel-implementacion.md`, `pfi-tl-peer-daniel.md` (alias).

## Orden lectura (profile-stack)

1. `pfi-iatl-knowledge-hub`
2. `reference.md`
3. `skills-catalog.md`
4. `review-learnings.md`
5. `SKILL.md` (síntesis)

Agentes hijos cargan skills adicionales según rol (ver `profile-stack.md`).
