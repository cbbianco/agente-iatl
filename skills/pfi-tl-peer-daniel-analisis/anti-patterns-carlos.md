# Anti-patrones — Curva de entrega (referencia negativa)

**No usar como perfil positivo.** Lista de lo que @pfi-tl-peer-daniel debe **bloquear** en propuestas @iatl.

## Curva típica (evitar)

```text
feat grande → merge → fixes bajo presión TL/dev → deuda residual en develop
```

## Señales en propuesta

| Señal | Por qué rechazar |
|-------|------------------|
| "Deuda para ola 2" / "lo refactorizamos después" | DoD diferido — patrón curva Carlos |
| N facades/coordinators por subdominio sin P1+P2 | Acoplamiento estructural |
| `*.module.ts` con decenas de providers nuevos | Module god object |
| `Promise.all` en lecturas que comparten pool PG singleton | Race destroy/recreate pool |
| CRUD masivo sin tests de paridad | Riesgo funcional post-merge |
| Mapper "Strategy" sin intercambio runtime | Naming dishonesto |

## Caso de estudio (PFI)

**Mercancía área riesgo** (~112 `.ts`, múltiples facades, module inflado): entrega inicial grande + ráfaga de fixes posteriores. Referencia interna — no replicar estructura.

## GET selectividad (incidente)

`Promise.all` introducido en lectura concurrente sobre infra compartida → errores intermitentes pool PG / constructores Entity. Fix: secuencial o aislar conexiones — no paralelizar ciegamente.

## Veredicto par TL ante anti-patrón

- Deuda explícita → **RECHAZADO**
- Estructura inflada sin P1+P2 → **APTO_CON_CAMBIOS** (simplificar antes de HITL)
- Paralelismo riesgoso → **RECHAZADO** hasta diseño seguro
