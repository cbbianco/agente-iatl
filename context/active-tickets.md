# Tickets activos — snapshot para agentes

> Espejo de contexto operativo. Specs completos en `pfi-backend-core/docs/spec-driven/`.

**Última sync:** 2026-06-17

---

## PFI-1238 — Marcaje manual campos obligatorios

| Campo | Valor |
|-------|-------|
| Lambda | `lambda-marcaje-manual` |
| Endpoint | `POST /marcaje-manual` |
| Rama | `pfi-1238/feature/crear-marcaje-manual` (base `develop`) |
| Estado | Análisis cerrado — **pendiente implementar** |

### Decisión negocio (cerrada)

Registro de marca **completo y válido** = **8 campos obligatorios en JSON** (INTERNAL y EXTERNAL):

**Catálogo / negocio (4):**

| Campo negocio | JSON |
|---------------|------|
| Proceso negocio | `idProcesoNegocio` |
| Tipo objeto | `idTipoObjeto` |
| Tipo aforo | `idTipoAforo` |
| Área riesgo | `idAreaRiesgo` |

**Base datos prueba (4):** `idObjetoSeleccionado`, `idAduana`, `identificacionObjeto`, `procedimiento`

**EXTERNAL** suma reglas canal: `idSistemaOrigen`, `idTipoFiltro`, `rutUsuarioMarcaManual`.

### Gap código actual

- DTO: los 4 catálogos siguen `@IsOptional`
- INTERNAL: auto-resuelve `idProcesoNegocio` si falta — **retirar**
- EXTERNAL: no exige catálogos → INSERT con null

### Fix acordado

1. `@IsNotEmpty` en los 4 catálogos en DTO
2. Validación común **antes** de bifurcar INTERNAL/EXTERNAL
3. Eliminar auto-resolución `idProcesoNegocio` en domain service

---

## PFI-1228 — POST personas domicilio

| Campo | Valor |
|-------|-------|
| Lambda | `lambda-casos` |
| Rama | `pfi-1228/fix/post-persona-paridad-legacy` (base tip PFI-1163 `2f949755`) |
| Causa | Deuda PFI-1163: POST `@IsString()` vs legacy `number`; INSERT sin domicilio |

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
node ~/.cursor/iatl-knowledge/query.js --ticket PFI-XXXX
node ~/.cursor/iatl-knowledge/query.js --working-branches --status active
```
