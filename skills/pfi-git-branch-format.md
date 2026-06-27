---
name: pfi-git-branch-format
description: >-
  Propone y crea ramas Git del repo pfi-backend-core con el formato estándar PFI
  (pfi-XXXX/feature/..., conflict_resolutions/develop/..., etc.). Usar cuando el
  usuario diga "haz una rama feature", "rama de conflicto", "crea rama para ticket"
  o pida el nombre de rama asociado a un Jira sin especificar el path completo.
---

# Formato de ramas PFI (pfi-backend-core)

## Cuando el usuario pide una rama

1. **Preguntar o inferir el ticket Jira** (número, ej. `1152`, `1073`, `PFI-1196`).
2. **Responder con el nombre completo propuesto** antes de crear la rama, salvo que el usuario ya haya dado el path exacto.
3. **Indicar siempre la base** (`main`, `develop`, `origin/qa`, …) según la tabla de abajo.
4. **Crear la rama** solo si el usuario lo pidió explícitamente o confirmó el nombre.

## Bases obligatorias (no improvisar)

| Tipo de rama | Base | Notas |
|--------------|------|--------|
| `pfi-{TICKET}/feature/...` | **`main`** | Siempre `git fetch` + `checkout main` + `pull` antes de `-b`. No usar `develop` salvo pedido explícito del usuario. |
| `pfi-{TICKET}/fix/...` (ticket) | `develop` | Salvo que el usuario indique otra base. |
| `conflict_resolutions/develop/pfi-{TICKET}/...` | **`develop`** | Paridad con integración a develop; suele llevar el mismo cambio que la feature pero base distinta. |
| `conflict_resolutions/qa/pfi-{TICKET}/...` | **`origin/qa`** | |
| `pfi/hotfix/...` | `main` o `qa` | Según destino del hotfix. |

Si ya existe una feature creada desde la base incorrecta, **recrear desde `main`** (cherry-pick del commit de cambio) y actualizar remoto con `--force-with-lease` en la rama feature, nunca en `main`/`develop`/`qa`.

## Patrones

| Tipo | Formato | Base típica | Ejemplo |
|------|---------|-------------|---------|
| Feature del ticket | `pfi-{TICKET}/feature/{slug-kebab}` | **`main`** | `pfi-1196/feature/aduana-obj-get-cases` |
| Fix del ticket | `pfi-{TICKET}/fix/{slug}` | `develop` | `pfi-1062/fix/cambio-tipo-dato` |
| Hotfix | `pfi/hotfix/{slug}` | `main` / `qa` | `pfi/hotfix/oracle-conexion-service-name` |
| Conflicto develop | `conflict_resolutions/develop/pfi-{TICKET}/{tipo}/{slug}` | **`develop`** | `conflict_resolutions/develop/pfi-1073/feature/integration-sas` |
| Conflicto qa | `conflict_resolutions/qa/pfi-{TICKET}/{tipo}/{slug}` | `origin/qa` | `conflict_resolutions/qa/pfi-1196/feature/area-control-selectividad` |
| Conflicto fix suelto | `conflict_resolutions/{base}/fix/{slug}` | según base | `conflict_resolutions/qa/fix/firmador-solo-get-casos` |
| Release integración | `release-{slug}` | rama feature | `release-unificar-eventos` |

## Ramas — qué NO commitear (feature, fix y conflict_resolutions)

En **cualquier rama** del ticket **no** incluir en commits/push:

- Carpeta **`docs/`** completa (informes QA, spec-driven, CODE-REVIEW, assets).
- **Scripts ad-hoc de prueba** creados para un ciclo QA puntual (p. ej. `/tmp/marcaje-qa-run.sh`).

Esos artefactos van en **chat, Jira o comentario de PR**. En ramas `conflict_resolutions/*` tampoco subir scripts operativos bajo `scripts/` salvo pedido explícito.

Al crear o actualizar ramas de conflicto, verificar que **QA y develop del mismo ticket** queden alineadas en el alcance del feature (misma estructura v2, mismo estado `D` post-extracción, sin docs ni scripts operativos).

**Reglas del slug:** minúsculas, kebab-case, sin espacios, descriptivo del alcance (no repetir el número de ticket en el slug salvo convención del equipo).

**Tipos comunes en `{tipo}`:** `feature`, `fix`, `update`, `refactor`, `chore`.

## Un ticket, varios alcances (lambda-casos — obligatorio)

Cuando un ticket (ej. PFI-1215) toca **varios endpoints independientes**, **una rama por alcance**. No combinar en el slug ni en un solo PR.

| Alcance | Tipo rama | Slug ejemplo | Prefijo commit |
|---------|-----------|--------------|----------------|
| Fix `GET /casos/selectividad/{numero}` | `fix` | `obtener-caso-selectividad` | `fix:` |
| PG secuencial personas | `fix` | `secuencial-pg-consultas-casos` | `fix:` |
| PG secuencial informacion-entrega | `update` | `secuencial-pg-informacion-entrega` | `update:` |
| Migración expediente documental | `feature` | `expediente-generacion-documental-casos-selectividad` | `feature:` |
| Draft documento (otra lambda) | `feature` | `generacion-documental-seguridad` | `feature:` / `update:` |

**Gate antes de push:** `git diff --stat origin/develop...HEAD` — validar conteo de archivos y que no aparezcan endpoints ajenos al alcance pedido.

**Prohibido:** ramas slug compuesto tipo `caso-selectividad-expediente-documental` (mezcla fix + feature).

**Ticket en path:** el número Jira del path debe coincidir con el ticket real del cambio (no subir personas 1215 bajo `pfi-1025/`).

## Respuesta al usuario

Cuando diga solo *"haz una rama feature"* o *"rama de conflicto"*:

```
Ticket Jira: PFI-{N} — {título breve si lo conoces}
Rama propuesta: `{nombre-completo}`
Base: `{main|develop|origin/qa|...}`
```

Si falta el número Jira, **pedirlo** antes de proponir el nombre.

## Ejemplos

**Usuario:** "haz una rama feature para acta prueba de campo, ticket 1152"

```
Rama: pfi-1152/feature/generacion-documental-acta-prueba-campo
Base: main
```

**Usuario:** "rama de conflicto develop para integration-sas 1073"

```
Rama: conflict_resolutions/develop/pfi-1073/feature/integration-sas
Base: develop
```

**Usuario:** "conflict qa del firmador"

→ Buscar ticket/rama origen (`fix/firmador-solo-get-casos`) y proponer:
```
Rama: conflict_resolutions/qa/fix/firmador-solo-get-casos
Base: origin/qa
```

## Mensajes de commit al subir ramas

Al hacer commit o push de una rama PFI, usar el skill **`pfi-commit-message-format`**:

- **Una sola línea:** `feature:`, `update:`, `chore:` o `fix:` + descripción breve.
- **Sin** cuerpo con resumen, curl ni tests en el commit.
- **Nunca** agregar `Co-authored-by:` (Cursor, Copilot u otro agente).

Ejemplos alineados con el tipo de rama:

| Rama | Prefijo típico | Ejemplo |
|------|----------------|---------|
| `pfi-XXXX/feature/...` | `feature:` | `feature: registrar endpoint validar documento para Hermes` |
| `pfi-XXXX/fix/...` | `update:` o `fix:` | `update: alinear criterio EXTERNAL con terna portal en marcas` |
| `conflict_resolutions/*/...` | mismo que la rama origen | mismo mensaje que el commit de la feature/fix |
| `pfi/chore/...` | `chore:` | `chore: actualizar registro clientes authorizer` |

## Comandos (referencia)

```bash
# Feature desde main (obligatorio para pfi-XXXX/feature/...)
git fetch origin main && git checkout main && git pull origin main
git checkout -b pfi-1196/feature/aduana-obj-get-cases

# Conflict develop desde develop
git fetch origin develop && git checkout develop && git pull origin develop
git checkout -b conflict_resolutions/develop/pfi-1196/feature/aduana-obj-get-cases

# Corregir feature creada por error desde develop
git fetch origin main
git checkout main && git pull origin main
git branch -D pfi-1196/feature/aduana-obj-get-cases  # local, si aplica
git checkout -b pfi-1196/feature/aduana-obj-get-cases
git cherry-pick <commit-del-cambio>
git push --force-with-lease origin pfi-1196/feature/aduana-obj-get-cases
```

## Repo

Bitbucket: `pfi-backend-core`. No force-push a `main`/`develop`/`qa` sin pedido explícito. En ramas feature propias del ticket, `--force-with-lease` está permitido al corregir la base.
