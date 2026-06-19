# Tickets activos — snapshot para agentes

> Espejo de contexto operativo. Specs completos en `pfi-backend-core/docs/spec-driven/` (local, gitignored).

**Última sync:** 2026-06-19

---

## PFI-1238 — Marcaje manual campos obligatorios — **CERRADO HITL**

| Campo | Valor |
|-------|-------|
| Lambda | `lambda-marcaje-manual` |
| Endpoint | `POST /marcaje-manual` |
| Estado | **Implementación cerrada** — merge pendiente fuera de alcance agente |
| Hub | `ticket_closures` · sprint `2026-S12` · expira 2026-07-03 |

### Commits finales

| Rama | Commit |
|------|--------|
| `pfi-1238/feature/crear-marcaje-manual` | `eaee6a8c` |
| `conflict_resolutions/develop/...` | `d766eb85` |
| `conflict_resolutions/qa/...` | `f24996ef` |

### Learnings conservados (cierre)

1. Registro válido = 8 campos base + uid; EXTERNAL suma `idSistemaOrigen`, `idTipoFiltro`, `rutUsuarioMarcaManual`.
2. Orden guards: `MarcajeGuardarContextoGuard` **debajo** de `@RequireSessionWithProfile`.
3. Commits Markdown con `## Cómo probar`; prohibido subir `docs/` al repo.

---

## PFI-1228 — POST personas domicilio — **ACTIVO**

| Campo | Valor |
|-------|-------|
| Lambda | `lambda-casos` |
| Endpoint | `POST/PUT/GET /casos/{numeroCaso}/personas` |
| Rama | `pfi-1228/fix/post-persona-paridad-legacy` |
| Commit | `81733dd4` — domicilio + geo numérica en POST |
| Causa | Deuda PFI-1163: POST `@IsString()` vs legacy `number`; INSERT sin domicilio |
| Pendiente | QA DEV + ramas conflict develop/qa |

---

## PFI-1039 — Traza denuncias fecha Chile

| Campo | Valor |
|-------|-------|
| Rama | `pfi-1039/fix/traza-denuncia-decare-fecha-chile` (base `develop`) |
| Fix | `grabar-traza-inicial.domain-service.ts` → `fechaAuditoriaIsoChile` |
| Nota | Eventos/SAS ya mergeado en rama aparte |

---

## Cómo usar este archivo

@iatl y subagentes: consultar al arrancar sesión **además** de:

```bash
node ~/.cursor/iatl-knowledge/query.js --project-config
node ~/.cursor/iatl-knowledge/query.js --ticket PFI-XXXX
node ~/.cursor/iatl-knowledge/query.js --ticket-closure --ticket PFI-XXXX
node ~/.cursor/iatl-knowledge/query.js --working-branches --status active
```
