# Spec-driven — Flujo con par TL

## Formato Propuesta IATL (pre-HITL)

Antes de mostrar al desarrollador, @iatl completa:

1. **Propuesta**
2. **A favor**
3. **En contra**
4. **Alternativas**
5. **Recomendación**

Luego **obligatorio:** invocar @pfi-tl-peer-daniel.

## Gate par TL

El par TL puede:

- **RECHAZAR** — deuda diferida, scope inflado, Promise.all riesgoso
- **Exigir cambios** — simplificar antes de HITL
- **Aprobar** — presentar al desarrollador

Si @iatl y Daniel no llegan a consenso tras un ciclo de réplica → **protocolo deadlock** (idea C, una recomendación). Ver [docs/peer-gate-deadlock-protocol.md](../docs/peer-gate-deadlock-protocol.md).

## Registro de ramas

Al proponer HITL con rama concreta, @iatl registra en Mongo `working_branches` y actualiza [working-branches.md](../working-branches.md). Ver skill `pfi-daily-branch-tracker`.

## Después de HITL

1. Spec en `docs/spec-driven/PFI-XXXX.md` (repo, si aplica)
2. Implementación con estándar IATL
3. Review pipeline post-código
4. Learnings → Mongo

## Documentos spec en repo

Los specs de ticket viven en:

```text
docs/spec-driven/PFI-XXXX.md
docs/spec-driven/DECISIONES-CODE-REVIEW-PFI-XXXX.md
```

Esta carpeta `pfi-agent-architecture/` documenta **cómo** trabajan los agentes, no reemplaza los specs por ticket.

## Ejemplo ciclo (PFI-1238 — actual)

```text
PFI-1238 → negocio cierra: obligatorios JSON idProcesoNegocio, idTipoObjeto,
           idTipoAforo, idAreaRiesgo + base datos prueba (INTERNAL y EXTERNAL)
        → @iatl propone: DTO @IsNotEmpty + validación común pre-bifurcación;
           retirar auto-resolución idProcesoNegocio
        → @pfi-tl-peer-daniel: veredicto (diff mínimo, sin deuda canal)
        → César aprueba HITL
        → implementación en pfi-1238/feature/crear-marcaje-manual
        → review → commit (si pide)
```

Snapshot tickets: [context/active-tickets.md](../context/active-tickets.md).
