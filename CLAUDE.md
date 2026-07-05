# Bukea

Plataforma de reservas ("bukear" = to book, dominicanizado) para barbería, uñas, salones, cejas y maquillaje en República Dominicana. Marketplace de consumo + herramienta B2B, con cero comisión por cliente nuevo.

## Reglas de trabajo

- **Toda la comunicación, documentación, commits y copy del producto en español** (español dominicano para el copy de la app: "bukear", "confirmao", "la tarjetica").
- Precios siempre en RD$ (pesos dominicanos).
- El dueño del proyecto es Víctor (vmdventura).

## Estructura del repositorio

| Ruta | Contenido |
|---|---|
| `docs/VISION.md` | Visión completa: nombre, competencia (Fresha, BarberTime…), diferenciadores, verticales, modelo de negocio |
| `docs/PLAN.md` | Plan del proyecto: estado actual, Fase 0 (fundación), roadmap MVP en 3 fases, reglas estratégicas — **mantener actualizado al completar tareas** |
| `prototype/demo.html` | Demo interactivo v0.1 (HTML autocontenido, sin backend): inicio, perfil, reserva, fila virtual, confirmación |

## Decisiones ya tomadas (no re-litigar)

1. **El profesional es el perfil, no el local** — la clientela sigue al barbero/manicurista si se muda.
2. **Tres diferenciadores:** WhatsApp nativo (API de WhatsApp Business), pagos a la dominicana (efectivo/transferencia/tPago primero, tarjeta vía Azul/CardNET después), fila virtual para walk-ins.
3. **Orden de verticales:** barbería + uñas primero → salones → cejas/maquillaje.
4. **Modelo:** suscripción plana RD$500–1,500/mes por silla, cero comisión, gratis para el cliente final.
5. **Geografía:** una sola ciudad (Santo Domingo o Santiago) hasta tener densidad.
6. **Identidad visual del demo v0.1:** teal `#0f8583` como color primario, dorado `#d99a2b` para ratings, verde WhatsApp para mensajería. Tipografía system stack.

## Estado (2026-07-05)

- ✅ Visión, plan y demo v0.1 en el repo
- ✅ Nombre "Bukea" libre en App Store y Google Play (verificado 2026-07-04)
- ✅ Dominios verificados libres: `bukea.do`, `bukeard.com` (el .com principal), `getbukea.com`, `bukeaapp.com` — **sin registrar aún**
- ⬜ Sin código de producción — el MVP no arranca hasta cerrar la Fase 0 (ver criterio de salida en `docs/PLAN.md`)
- ⬜ Stack tecnológico sin decidir

## Próximos pasos probables

1. Iterar el demo (`prototype/demo.html`) con feedback de Víctor — lado B2B (agenda del barbero) aún no tiene pantallas.
2. Decidir stack del MVP (móvil + backend + WhatsApp Business API).
3. Ejecutar la Fase 0: registrar dominios, handles, marca ONAPI, validar precio con 10–15 profesionales.
