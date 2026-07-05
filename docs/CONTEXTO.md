# Bukea — Contexto completo del proyecto

> **Instrucción para Claude:** Este documento es el traspaso completo de un proyecto en curso. Léelo entero antes de responder. Toda la comunicación, documentación, commits y copy del producto van **en español** (español dominicano para el copy de la app). No re-litigues las decisiones ya tomadas — continúa desde donde vamos.

## Qué es Bukea

**Bukea** (dominicanización de *"to book"* — "¿Ya bukeaste tu cita?") es una app de reservas para **barbería, uñas, salones, cejas y maquillaje en República Dominicana**. Es un marketplace de consumo + herramienta B2B para los negocios.

**El hueco del mercado:** nadie combina (a) marketplace de consumo, (b) toda la vertical de belleza, (c) efectivo/transferencia como primera clase, (d) WhatsApp nativo y (e) walk-ins/fila virtual. Fresha cobra 20% de comisión por cliente nuevo y no está localizado; BarberTime es solo barbería; el 90% del mercado funciona con WhatsApp + Instagram + cuaderno.

## Decisiones ya tomadas (NO re-discutir)

1. **Nombre: Bukea** — verbalizable, spanglish dominicano, neutral entre nichos. Ganó sobre Ponte, Nítido y TuTurno.
2. **El profesional es el perfil, no el local** — la clientela sigue a *su* barbero/manicurista si se muda. Portafolio visual tipo Instagram por profesional.
3. **Tres diferenciadores:** ① WhatsApp nativo (WhatsApp Business API: confirmaciones, recordatorios, chatbot de reserva), ② pagos a la dominicana (efectivo y transferencia primero, tPago, tarjeta vía Azul/CardNET después), ③ fila virtual para walk-ins (turno en vivo con aviso por WhatsApp).
4. **Orden de verticales:** barbería + uñas primero → salones (2da ola) → cejas/maquillaje (con marketing dedicado al tener densidad).
5. **Modelo de negocio:** suscripción plana RD$500–1,500/mes por silla; **cero comisión por cliente nuevo** (ataque directo a Fresha); plan gratuito generoso al inicio; gratis siempre para el cliente final.
6. **Geografía:** una sola ciudad (Santo Domingo o Santiago) hasta lograr densidad.
7. **Identidad visual del demo v0.1:** teal `#0f8583` primario, dorado `#d99a2b` para ratings, verde WhatsApp para mensajería.
8. **Lado B2B clave:** agenda multi-silla con comisión barbero/dueño (modelo dominicano de porcentaje por silla), reporte de caja, facturación con NCF (DGII) — ningún player global lo ofrece.

## Dónde vive todo

**Repositorio:** `vmdventura/bukea` (GitHub, privado) — rama `main`

| Ruta | Contenido |
|---|---|
| `CLAUDE.md` | Contexto para sesiones de Claude Code (versión corta de este documento) |
| `docs/VISION.md` | Visión completa: nombre, dominios, competencia, verticales, modelo de negocio, roadmap |
| `docs/PLAN.md` | Plan del proyecto: estado, Fase 0, roadmap MVP, reglas estratégicas — **mantenerlo actualizado** |
| `prototype/demo.html` | Demo interactivo v0.1: HTML autocontenido con 5 pantallas (inicio, perfil, reserva, confirmación, fila virtual) |

El proyecto deportivo **DeportesDO** vive en su propio repo (`vmdventura/DeportesDO`) y no tiene relación con Bukea.

## Estado actual (5 de julio de 2026)

**Hecho ✅**
- Visión de producto, análisis de competencia y plan completos
- Repo propio, separado de otros proyectos
- Nombre "Bukea" verificado libre en App Store y Google Play (2026-07-04)
- Dominios verificados libres (sin registrar aún): `bukea.do`, `bukea.com.do`, **`bukeard.com`** (el .com principal — "Bukea RD"), `bukea.io`, `getbukea.com`, `bukeaapp.com`
- Demo interactivo v0.1 en `prototype/demo.html`

**Pendiente ⬜ (Fase 0 — antes de escribir código de producción)**
- Registrar `bukea.do` y `bukea.com.do` en nic.do (prioridad #1) y `bukeard.com`
- Reservar handles `@bukea` / `@bukea.do` en Instagram, TikTok, X, Facebook
- Marca en ONAPI (clases 35, 42 y 44)
- Reservar "Bukea" en App Store Connect al crear cuenta Apple Developer (US$99/año)
- **Validar con 10–15 barberos/manicuristas reales que pagarían RD$500–1,500/mes por silla**

**Criterio de salida de Fase 0:** dominios y marca asegurados + 10 profesionales que digan "yo pago eso". El código del MVP no arranca antes.

## Roadmap del MVP

- **Fase 1 — El núcleo que reserva** (barbería + uñas): perfil con portafolio, agenda, reserva, cita recurrente, WhatsApp, efectivo/transferencia, reserva por diseño en uñas (foto + mini-cotización).
- **Fase 2 — Lo que nadie más tiene** (+ salones): fila virtual, lealtad digital (10 cortes = 1 gratis), reseñas con foto verificada, reserva multi-servicio/multi-empleado.
- **Fase 3 — Monetización y eventos** (+ cejas/maquillaje): tarjeta Azul/CardNET, NCF, domicilio, paquetes de eventos (novia + cortejo) con depósito.

## Sin decidir todavía

- Stack tecnológico del MVP (móvil, backend, integración WhatsApp Business API)
- Ciudad de lanzamiento (Santo Domingo vs Santiago)
- Pantallas B2B del demo (la agenda del barbero/dueño no está boceteada)

## Próximo paso sugerido

Iterar el demo (`prototype/demo.html`) con feedback del dueño y bocetear el lado B2B; en paralelo, ejecutar la Fase 0 (dominios y validación con negocios reales).
