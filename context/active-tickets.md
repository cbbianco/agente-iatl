# Tickets activos — snapshot para agentes

> Espejo de contexto operativo. Specs completos en `pfi-backend-core/docs/spec-driven/` (local, gitignored).

**Última sync:** 2026-06-28

---

## PFI-1205 — Catálogo método detección AF — **ACTIVO**

| Campo | Valor |
|-------|-------|
| Lambda | `lambda-catalogo` |
| Endpoint | `GET /catalogo/tipo-metodo-deteccion` |
| Rama activa | `conflict_resolutions/develop/pfi-1205/feature/catalogo-metodo-deteccion-af` |
| Commit | `8d0d23c8` |
| Estado | Paridad legacy DEV 10/10 · sesión IATL `active` |
| Nota | Feature + conflict qa mergeadas; develop conflict en integración |

---

## PFI-1183 — Resultado equipo detección — **ACTIVO**

| Campo | Valor |
|-------|-------|
| Rama | `pfi-1183/feature/resultado-equipo-deteccion` |
| Alcance | Campo AF + grilla + vínculo oficio fiscal 1120 |

---

## Cerrados recientes (HITL)

### PFI-1243 — Especies conexas informacion-entrega — **CERRADO** (2026-06-28)

| Campo | Valor |
|-------|-------|
| Lambda | `lambda-casos` |
| Endpoints | `GET/POST/PUT .../personas/informacion-entrega` |
| CR | Cotejo informe Claude Code **11/11** — `docs/spec-driven/CODE-REVIEW-PFI-1243.md` |
| Fixes | V1–V3, P1–P2 (`617f58cb` / `d538b9b6` / `6c5468ce`) |
| QA | DEV T1–T7 sync OK · POST 409 duplicado · V3 fix `@IsOptional` en persona |
| Hub | `ticket_closures` + `resume_context` (traza cotejo CR + QA) |

### PFI-1245 — Roles mercancía área riesgo — **CERRADO** (2026-06-26)

| Campo | Valor |
|-------|-------|
| Lambda | `lambda-casos` |
| Política | GET todos roles · mutaciones solo Fiscalizador |

### PFI-1244 — FK cigarrillos — **CERRADO** (2026-06-26)

| Campo | Valor |
|-------|-------|
| Fix | `idCantidadCajetilla` 0→NULL en POST/PUT mercancía cigarrillo |

---

## Recuperación de sesión (@iatl)

```bash
node ~/.cursor/iatl-knowledge/query.js --ticket PFI-XXXX
# → session_context.resume_context (traza último learning)
node ~/.cursor/iatl-knowledge/query.js --ticket-closure --ticket PFI-XXXX
```

Al retomar ticket cerrado o relacionado: leer `resume_context` **antes** del chat.
