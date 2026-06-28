# Registro diario de ramas — espejo repo

> Fuente operativa: Mongo `working_branches` vía skill `pfi-daily-branch-tracker`.  
> Actualizar este archivo al registrar/cerrar ramas.

**Última sync:** 2026-06-28

---

## Ramas activas

1. **PFI-1205** · `conflict_resolutions/develop/pfi-1205/feature/catalogo-metodo-deteccion-af` · base `develop` · **active**
   - Lambda: `lambda-catalogo` · `GET /catalogo/tipo-metodo-deteccion`
   - Commit: `8d0d23c8` · paridad legacy DEV 10/10 confirmada
   - Feature/qa conflict: mergeadas previamente (`83e5031b`, `b567382f`)

2. **PFI-1183** · `pfi-1183/feature/resultado-equipo-deteccion` · base `main` · **active**
   - Campo Resultado equipo detección AF + grilla + oficio fiscal 1120

3. **PFI-1244** · `TBD/pfi-1244` · **active** (placeholder — ver ramas fix mergeadas abajo)

---

## Ramas mergeadas / cerradas HITL (recientes)

4. **PFI-1243** · especies conexas informacion-entrega · **merged (cierre 2026-06-28)**
   - `pfi-1243/feature/persistencia-especies-conexas-informacion-entrega` · `d538b9b6` (CR V1–V3 P1–P2)
   - `conflict_resolutions/develop/pfi-1243/...` · `617f58cb`
   - `conflict_resolutions/qa/pfi-1243/...` · `6c5468ce`
   - QA DEV T1–T7 sync · CR cotejo 11/11 informe Claude Code · V3: quitar `@IsOptional` en persona value/id

5. **PFI-1245** · roles mercancía área riesgo · **merged (2026-06-26)**
   - GET todos roles PFI · POST/PUT/DELETE solo Fiscalizador
   - Commits: feature `c5b774b5` · develop `809d2711` · qa `63d52810`

6. **PFI-1244** · fix FK cigarrillos · **merged (2026-06-26)**
   - `pfi-1244/fix/registro-mercancia-cigarrillos` · `c0e49a12`
   - normalizar `idCantidadCajetilla` 0→NULL

7. **PFI-1205** · feature + conflict qa · **merged** (develop sigue activa para integración)

8. **PFI-1120** · oficio fiscal · **merged/pausado** · `0fd5e642`

---

## Comandos

```bash
node ~/.cursor/iatl-knowledge/query.js --working-branches --status active
node ~/.cursor/iatl-knowledge/query.js --ticket-closure --ticket PFI-1243
node ~/.cursor/iatl-knowledge/ingest.js working_branch \
  --ticket PFI-XXXX --branch "..." --base develop --role feature --status active \
  --notes "contexto una línea"
```
