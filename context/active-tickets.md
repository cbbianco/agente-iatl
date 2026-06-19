# Tickets activos — snapshot para agentes

> Espejo de contexto operativo. Specs completos en `pfi-backend-core/docs/spec-driven/` (local, gitignored).

**Última sync:** 2026-06-19

---

## PFI-1215 — Generación documental Seguridad — **ACTIVO**

| Campo | Valor |
|-------|-------|
| Lambda | `lambda-documento` |
| HU | Acta Incautación, Oficio Denuncia, Acta Entrega Imputados/Especies, Set Fotográfico |
| Rama feature | `pfi-1215/feature/generacion-documental-seguridad` (base PFI-1149 migración draft) |
| Conflict develop/qa | Creadas y pusheadas — alineadas a develop/qa |
| Gap vs develop | Faltan tipos 7+ (Acta Incautación, Oficio Denuncia); reutilizar 2/3/4 (mercancías/imputados/fotos) |
| Nota | Feature branch PFI-1149 desactualizada vs develop — rebase recomendado antes de codificar |

---

## PFI-1228 — POST personas domicilio — **ACTIVO**

| Campo | Valor |
|-------|-------|
| Lambda | `lambda-casos` |
| Endpoint | `POST/PUT/GET /casos/{numeroCaso}/personas` |
| Rama | `pfi-1228/fix/post-persona-paridad-legacy` |
| Commit | `81733dd4` — domicilio + geo numérica en POST |
| Pendiente | QA DEV + ramas conflict develop/qa |

---

## PFI-1039 — Traza denuncias fecha Chile

| Campo | Valor |
|-------|-------|
| Rama | `pfi-1039/fix/traza-denuncia-decare-fecha-chile` (base `develop`) |
| Fix | `fechaAuditoriaIsoChile` en traza DECARE |
| Estado | **active** — pendiente implementar |

---

## Cerrados recientes (HITL)

### PFI-1172 — Hermes validar documento — **CERRADO** (2026-06-19)

| Campo | Valor |
|-------|-------|
| Lambda | `lambda-documento` + authorizer + `RolesGuard` api-key |
| Endpoint | `GET /documento/validar/{idDocumento}` |
| Commits | feature `af72e845` (cómo probar) · conflict develop `2c187842` · conflict qa `c3793382` |
| Alcance | Solo documento + guard; **sin marcaje** |

### PFI-1238 — Marcaje manual — **CERRADO** (2026-06-19)

| Campo | Valor |
|-------|-------|
| Lambda | `lambda-marcaje-manual` · `POST /marcaje-manual` |
| Hub | `ticket_closures` · sprint `2026-S12` · expira 2026-07-03 |

---

## Resolución de tickets (agente)

Al recibir número sin URL → skill **`pfi-ticket-source-resolver`**: pregunta Jira/ClickUp/etc., MCP-first si disponible.

## Consultas Mongo

```bash
node ~/.cursor/iatl-knowledge/query.js --project-config
node ~/.cursor/iatl-knowledge/query.js --ticket PFI-XXXX
node ~/.cursor/iatl-knowledge/query.js --ticket-closure --ticket PFI-XXXX
node ~/.cursor/iatl-knowledge/query.js --working-branches --status active
```
