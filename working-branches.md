# Registro diario de ramas — espejo repo

> Fuente operativa: Mongo `working_branches` vía skill `pfi-daily-branch-tracker`.  
> Actualizar este archivo al registrar/cerrar ramas.

**Última sync:** 2026-06-17

---

## Ramas activas

1. **PFI-1238** · `pfi-1238/feature/crear-marcaje-manual` · base `develop` · **active**
   - Lambda: `lambda-marcaje-manual` · `POST /marcaje-manual`
   - Negocio cerrado: obligatorios JSON `idProcesoNegocio`, `idTipoObjeto`, `idTipoAforo`, `idAreaRiesgo` + base datos prueba (`idObjetoSeleccionado`, `idAduana`, `identificacionObjeto`, `procedimiento`) en **INTERNAL y EXTERNAL**
   - Fix pendiente: DTO + validación común pre-bifurcación; retirar auto-resolución `idProcesoNegocio`
   - Spec: `docs/spec-driven/PFI-1238.md` (repo pfi-backend-core)
   - Conflict:
     - `conflict_resolutions/develop/pfi-1238/feature/crear-marcaje-manual`
     - `conflict_resolutions/qa/pfi-1238/feature/crear-marcaje-manual`

2. **PFI-1228** · `pfi-1228/fix/post-persona-paridad-legacy` · base `2f949755` (tip **PFI-1163**) · **active**
   - Lambda: `lambda-casos` · POST personas domicilio (región/provincia/comuna)
   - Fix pendiente: `@IsInt()` en POST + persistir domicilio en INSERT
   - Spec: `docs/spec-driven/PFI-1228.md`

3. **PFI-1039** · `pfi-1039/fix/traza-denuncia-decare-fecha-chile` · base `develop` · **active**
   - Lambda: denuncias · `grabar-traza-inicial.domain-service.ts` → `fechaAuditoriaIsoChile`
   - Eventos/SAS ya mergeado en rama aparte
   - Spec: `docs/spec-driven/PFI-1039.md`

---

## Ramas mergeadas (recientes)

4. **PFI-1039** · `pfi-1039/fix/fecha-auditoria-chile-dynamo` · eventos/SAS — mergeado PRs #219–#228
   - `conflict_resolutions/develop/pfi-1039/fix/fecha-auditoria-chile-dynamo`
   - `conflict_resolutions/qa/pfi-1039/fix/fecha-auditoria-chile-dynamo`

5. **PFI-1152** · `pfi-1152/fix/secuencial-pg-oficio-fiscalia` · pool PG secuencial — mergeado
   - `conflict_resolutions/develop/pfi-1152/fix/secuencial-pg-oficio-fiscalia`
   - `conflict_resolutions/qa/pfi-1152/fix/secuencial-pg-oficio-fiscalia`

6. **PFI-1163** · `pfi-1163/feature/mgiracion-servicio-casos-personas` · migración personas — mergeado PR #135

---

## Abandonadas / no usar

7. **PFI-1039** · `pfi-1039/fix/fecha-ocurrencia-traza-denuncia` · solo tests, base vieja — **abandoned**

---

## Comandos

```bash
node ~/.cursor/iatl-knowledge/query.js --working-branches --status active
node ~/.cursor/iatl-knowledge/ingest.js working_branch \
  --ticket PFI-XXXX --branch "..." --base develop --role feature --status active \
  --notes "contexto una línea"
```
