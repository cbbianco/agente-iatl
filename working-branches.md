# Registro diario de ramas — espejo repo

> Fuente operativa: Mongo `working_branches` vía skill `pfi-daily-branch-tracker`.  
> Actualizar este archivo al registrar/cerrar ramas.

**Última sync:** 2026-06-19

---

## Ramas activas

1. **PFI-1228** · `pfi-1228/fix/post-persona-paridad-legacy` · base `develop` · **active**
   - Lambda: `lambda-casos` · POST personas domicilio + geo numérica
   - Commit: `81733dd4` · fix backend completo; pendiente QA DEV
   - Spec: `docs/spec-driven/PFI-1228.md` (local)

2. **PFI-1039** · `pfi-1039/fix/traza-denuncia-decare-fecha-chile` · base `develop` · **active**
   - Lambda: denuncias · `fechaAuditoriaIsoChile`
   - Eventos/SAS ya mergeado en rama aparte

---

## Ramas mergeadas / cerradas HITL (recientes)

3. **PFI-1238** · `pfi-1238/feature/crear-marcaje-manual` · **merged (cierre HITL 2026-06-19)**
   - Lambda: `lambda-marcaje-manual` · `POST /marcaje-manual`
   - Commits: feature `eaee6a8c` · conflict develop `d766eb85` · conflict qa `f24996ef`
   - Hub: `ticket_closures` · learnings hasta 2026-07-03

4. **PFI-1152** · `pfi-1152/fix/secuencial-pg-oficio-fiscalia` · mergeado PR #250

5. **PFI-1163** · `pfi-1163/feature/mgiracion-servicio-casos-personas` · mergeado PR #135

6. **PFI-1039** · `pfi-1039/fix/fecha-auditoria-chile-dynamo` · eventos/SAS — mergeado PRs #219–#228

---

## Abandonadas / no usar

7. **PFI-1039** · `pfi-1039/fix/fecha-ocurrencia-traza-denuncia` · solo tests, base vieja — **abandoned**

---

## Comandos

```bash
node ~/.cursor/iatl-knowledge/query.js --working-branches --status active
node ~/.cursor/iatl-knowledge/query.js --ticket-closure --ticket PFI-1238
node ~/.cursor/iatl-knowledge/close-ticket.js --ticket PFI-XXXX --payload-file /tmp/closure.json
node ~/.cursor/iatl-knowledge/ingest.js working_branch \
  --ticket PFI-XXXX --branch "..." --base develop --role fix --status active \
  --notes "contexto una línea"
```
