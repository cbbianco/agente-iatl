# Learning trace — contexto al retomar sesión

**Versión hub:** 0.9.0 · **Sprint:** 2026-S12

## Problema

Los bullets de cierre HITL (`learnings[]`) resumen el qué, pero no el **cómo llegamos** ni la regla operativa descubierta en el camino. Al retomar un ticket días después, el agente reconstruía contexto desde el chat y repetía errores (ej. reutilizar `sessionId` expirado del transcript).

## Solución

El **último** learning del payload de cierre puede incluir un objeto `trace`:

| Campo | Uso |
|-------|-----|
| `howWeGotHere` | Secuencia cronológica de intentos/evidencias |
| `initialAssumption` | Qué creíamos al inicio |
| `actualFinding` | Qué descubrimos en realidad |
| `operationalRule` | Comando o regla concreta para la próxima vez |
| `useWhenResuming` | Cuándo aplicar al retomar |
| `evidence` | URLs, casos de prueba, códigos HTTP |

Persistencia:

- `ticket_closures.resumeContext`
- `learnings` con `isResumeTrace: true`
- Consulta: `query.js --ticket` → `session_context.resume_context`

## Ejemplo real — PFI-1243

**Bullet:** Sesión DEV vía profile legacy para curls en API nueva.

**Trazas clave:**

1. Sessions del transcript → 401
2. sessionId estático del link profile → PUT 401
3. Profile en vivo genera sessionId nuevo por request → 9/9 QA OK

**Regla:** `SESSION=$(curl -sS .../auth/cfleming/profile | jq -r .sessionId)`

## Mandato @iatl

Al ejecutar `query.js --ticket PFI-XXXX`:

1. Leer `session_context.resume_context` si existe
2. Usar `trace.howWeGotHere` + `operationalRule` como contexto primario
3. No inferir operativa de sesión/auth solo desde memoria del chat

## Scripts

```text
mongo/scripts/lib/learning-trace.js   # normalize + pickResumeTrace
mongo/scripts/close-ticket.js         # persiste resumeContext
mongo/scripts/query.js                # expone resume_context
```

Ver también: `skills/pfi-iatl-knowledge-hub.md` § Cierre HITL.
