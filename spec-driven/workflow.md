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

## Ejemplo ciclo

```text
PFI-1238 → @iatl propone fix response 201 POST /marcaje-manual
        → @pfi-tl-peer-daniel: indaga PFI-1164, REST guidelines, veredicto APTO_CON_CAMBIOS
        → @iatl ajusta alcance a 2 archivos
        → César aprueba
        → implementación → review → commit (si pide)
```
