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
| `docs/PLAN.md` | Plan del proyecto: estado, Fase 0, "Lo construido", roadmap MVP, reglas estratégicas — **mantenerlo actualizado** |
| `docs/COMPETENCIA-BARBERTIME.md` | Análisis del competidor directo (BarberTime) |
| `docs/WHATSAPP-SETUP.md` | Guía para activar el login por OTP de WhatsApp |
| `backend/` | MVP real (Node.js + Express + MySQL) desplegado en `vmdventura.com/bukea` — sirve el frontend PWA desde `backend/public/` |
| `prototype/demo-v2.html` | Demo premium navegable (segunda pasada) — origen del frontend actual |
| `prototype/demo.html` | Demo v0.1 original, referencia histórica |

El proyecto deportivo **DeportesDO** vive en su propio repo (`vmdventura/DeportesDO`) y no tiene relación con Bukea.

## Estado actual (5 de julio de 2026)

**Hecho ✅**
- Visión de producto, plan y análisis de competencia (BarberTime) completos
- Repo propio, separado de otros proyectos
- Nombre "Bukea" verificado libre en App Store y Google Play (2026-07-04)
- **`bukeard.com` registrado** (el .com principal — "Bukea RD") y **logo listo** ("b" itálica serif + wordmark, variantes crema/teal, tagline "Bukear nunca fue tan fácil")
- **MVP de prueba funcional en producción** en `vmdventura.com/bukea` (Node + Express + MySQL, PWA): login por teléfono + PIN, inicio por categorías, listado filtrado, reserva real en MySQL, lado B2B (registro y panel del negocio), "Mis citas". Verificación por WhatsApp lista pero dormida (falta cuenta Meta).

**Pendiente ⬜ (Fase 0 — sigue activa)**
- Registrar `bukea.do` y `bukea.com.do` en nic.do (prioridad #1); respaldo `bukea.io` / `getbukea.com`
- Reservar handles `@bukea` / `@bukea.do` en Instagram, TikTok, X, Facebook
- Marca en ONAPI (clases 35, 42 y 44)
- Reservar "Bukea" en App Store Connect al crear cuenta Apple Developer (US$99/año)
- **Validar con 10–15 barberos/manicuristas reales que pagarían RD$500–1,500/mes por silla**

**Criterio de salida de Fase 0:** dominios y marca asegurados + 10 profesionales que digan "yo pago eso". **Nota:** el MVP arrancó en paralelo a la Fase 0 por decisión de Víctor (tener algo funcional ayuda a validar), no porque el criterio ya se cumpliera.

## Roadmap del MVP

- **Fase 1 — El núcleo que reserva** (barbería + uñas): perfil con portafolio, agenda, reserva, cita recurrente, WhatsApp, efectivo/transferencia, reserva por diseño en uñas (foto + mini-cotización).
- **Fase 2 — Lo que nadie más tiene** (+ salones): fila virtual, lealtad digital (10 cortes = 1 gratis), reseñas con foto verificada, reserva multi-servicio/multi-empleado.
- **Fase 3 — Monetización y eventos** (+ cejas/maquillaje): tarjeta Azul/CardNET, NCF, domicilio, paquetes de eventos (novia + cortejo) con depósito.

## Sin decidir todavía

- Hosting definitivo del MVP (hoy en BanaHosting compartido / cPanel Node.js — de prueba, no necesariamente el final)
- Ciudad de lanzamiento (Santo Domingo vs Santiago) — reevaluar tras el análisis de BarberTime
- Login real del negocio (hoy solo `localStorage`, sin contraseña)

## Diferenciación (ajuste 2026-07-05)

Tras analizar a BarberTime, WhatsApp ya no distingue a Bukea en barbería (ellos también lo tienen). La punta de lanza pasa a ser **multivertical + funciona en cualquier teléfono** (BarberTime es solo iPhone; Android domina ~85% de RD). Ver `docs/COMPETENCIA-BARBERTIME.md`.

## Próximo paso sugerido

Ejecutar la Fase 0 (registrar `bukea.do`, handles, ONAPI, validar precio con 10–15 profesionales — los 16 negocios públicos de BarberTime son prospectos de oro) y endurecer el MVP con ese feedback.
