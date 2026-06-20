# Registro diario de ramas — espejo repo

> Fuente operativa: Mongo `working_branches` vía skill `pfi-daily-branch-tracker`.  
> Actualizar este archivo al registrar/cerrar ramas.

**Última sync:** 2026-06-19 (PFI-1120 pausada)

---

## Ramas activas

1. **PFI-1120** · Oficio a Fiscalía (`tipoDocumento=1`) · **active (pausada — retomar lunes)**
   - `pfi-1120/feature/oficio-fiscal` · commit `0fd5e642`
   - `pfi-1120/update/oficio-fiscal-draft-fixes` · commit `07e6f57b` · fixes numeroOficio legacy + articuladoDelitoDroga
   - Conflict develop feature: `conflict_resolutions/develop/pfi-1120/feature/oficio-fiscal` · `37cad943`
   - Conflict develop update: `conflict_resolutions/develop/pfi-1120/update/oficio-fiscal-draft-fixes` · `6d07336a`
   - Conflict qa feature: `conflict_resolutions/qa/pfi-1120/feature/oficio-fiscal` · `b2de472e`
   - Pendiente: PRs, validación QA, posible `conflict_resolutions/qa/pfi-1120/update/oficio-fiscal-draft-fixes`
   - Nota: orquestación **secuencial** en QA (no Promise.all — pool Postgres singleton)

2. **PFI-1215** · `pfi-1215/feature/generacion-documental-seguridad` · base `PFI-1149/migration/...` · **active**
   - Lambda: `lambda-documento` · HU2 generación documental Seguridad
   - Conflict develop: `conflict_resolutions/develop/pfi-1215/feature/generacion-documental-seguridad`
   - Conflict qa: `conflict_resolutions/qa/pfi-1215/feature/generacion-documental-seguridad`
   - Nota: rebase sobre develop recomendado (migración draft ya en develop)

3. **PFI-1228** · `pfi-1228/fix/post-persona-paridad-legacy` · base `develop` · **active**
   - Lambda: `lambda-casos` · POST personas domicilio + geo numérica
   - Commit: `81733dd4` · pendiente QA DEV

4. **PFI-1039** · `pfi-1039/fix/traza-denuncia-decare-fecha-chile` · base `develop` · **active**
   - `fechaAuditoriaIsoChile` en traza DECARE

---

## Ramas mergeadas / cerradas HITL (recientes)

5. **PFI-1172** · `pfi-1172/feature/registro-hermes-validar-documento` · **merged (cierre 2026-06-19)**
   - `GET /documento/validar/{idDocumento}` · Hermes + RolesGuard api-key
   - Commits: feature `af72e845` · conflict develop `2c187842` · conflict qa `c3793382`

6. **PFI-1238** · `pfi-1238/feature/crear-marcaje-manual` · **merged (cierre 2026-06-19)**
   - `POST /marcaje-manual` · commits feature `eaee6a8c`

7. **PFI-1152** · secuencial PG oficio fiscalía · PR #250 mergeado

---

## Abandonadas / no usar

8. **PFI-1039** · `pfi-1039/fix/fecha-ocurrencia-traza-denuncia` · solo tests, base vieja — **abandoned**

---

## Comandos

```bash
node ~/.cursor/iatl-knowledge/query.js --working-branches --status active
node ~/.cursor/iatl-knowledge/query.js --ticket-closure --ticket PFI-1172
node ~/.cursor/iatl-knowledge/ingest.js working_branch \
  --ticket PFI-XXXX --branch "..." --base develop --role feature --status active \
  --notes "contexto una línea"
```
