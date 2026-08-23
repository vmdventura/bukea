# Bukea — Roadmap paso a paso

> Creado el 2026-07-05 para responder "¿qué sigue y en qué orden?". Este es el documento de ejecución; [PLAN.md](PLAN.md) guarda el contexto y las fases, este archivo dice **qué hacer ahora**. Al completar un paso, táchalo aquí y actualiza PLAN.md si aplica.
>
> **Contexto de urgencia:** BarberTime está por lanzar Android (badge ya publicado, ver [FLUJO-BARBERTIME.md](FLUJO-BARBERTIME.md)) y ya publica precios (RD$800–3,000/mes). La ventana de ventaja de Bukea se mide en semanas.

---

## ✅ Lo que ya está hecho (no perder de vista el avance)

- Visión, plan, análisis de competencia (Fresha + BarberTime) y flujos de referencia documentados
- **Primer test comparativo Bukea vs Fresha** (2026-08-22, ver [TEST-FRESHA.md](TEST-FRESHA.md)): flujo de cliente recorrido en ambos; tabla de brechas lista
- Nombre "Bukea" verificado libre en App Store y Google Play
- `bukeard.com` registrado + logo listo
- MVP de prueba **funcionando en producción** ([www.bukeard.com/app](https://www.bukeard.com/app/)): login cliente con PIN, flujo de reserva completo, registro de negocio, panel "Mi negocio" con "Mi Cuadre" básico
- OTP por WhatsApp programado (dormido, falta configurar Meta)
- Envoltorio iOS con Capacitor listo para compilar

---

## ETAPA 1 — Asegurar la marca (esta semana, ~1 día de gestiones)

Todo esto es administrativo, barato y **lo primero porque es lo único irrecuperable si alguien se adelanta**.

- [ ] 1.1 Registrar `bukea.do` y `bukea.com.do` en [nic.do](https://www.nic.do)
- [ ] 1.2 Registrar respaldo internacional: `getbukea.com` (y opcional `bukea.io`)
- [ ] 1.3 Reservar handles `@bukea` / `@bukea.do` en Instagram, TikTok, X y Facebook (aunque queden vacíos)
- [ ] 1.4 Búsqueda de anterioridad en ONAPI (clases 35, 42, 44) y someter la solicitud de marca
- [ ] 1.5 Crear cuenta Apple Developer (US$99/año) y reservar el nombre "Bukea" en App Store Connect

**Salida:** nadie puede quitarte el nombre. → Pasa a Etapa 2.

---## ETAPA 2 — Preparar la validación (semana 1–2)

El MVP ya existe; ahora hay que dejarlo presentable para enseñarlo a profesionales reales.

- [ ] 2.1 Configurar credenciales de Meta y **despertar el OTP de WhatsApp** ([WHATSAPP-SETUP.md](WHATSAPP-SETUP.md)) — es EL diferenciador demostrable en vivo
- [ ] 2.2 Cargar 3–5 profesionales de demo realistas (barbería + uñas) con servicios y precios de mercado
- [x] 2.3 Guion de validación — **materiales listos 2026-08-22 noche**: 9 preguntas fijas + hoja de registro en [VALIDACION-GUION.md](VALIDACION-GUION.md) (ajustado a la oferta gratis: ya no pregunta precio, pregunta compromiso de uso)
- [x] 2.4 Lista de prospectos — **borrador listo 2026-08-22 noche** en [VALIDACION-GUION.md](VALIDACION-GUION.md) §4: ~25 negocios reales de Fresha y CitaApp en Santo Domingo (verificados en vivo esta sesión) + BarberTime y entorno de Víctor pendientes de sumar
- [x] 2.5 Oferta de arranque: **Bukea gratis, sin tarjeta, sin fecha de corte por ahora** (decisión de Víctor 2026-08-22) — contraataque al mes gratis con tarjeta de BarberTime y a los RD$240–360/mes de Fresha. El precio se fija en la Etapa 5 con datos del piloto

**Salida:** demo enseñable + guion + lista de prospectos. → Pasa a Etapa 3.

---

## ETAPA 3 — Validación en la calle (semana 2–5) ⭐ LA ETAPA CRÍTICA

Nada de lo que sigue tiene sentido sin esto. Es la única etapa que no se puede delegar ni acelerar con código.

- [ ] 3.1 Visitar/llamar 10–15 profesionales con la demo en mano (mitad barberos, mitad uñas)
- [ ] 3.2 Registrar cada respuesta en la hoja (precio aceptado, dolores, si usan BarberTime y qué pagan)
- [ ] 3.3 Conseguir **compromisos concretos**: "cuando esté, yo me monto" con nombre y teléfono
- [ ] 3.4 Con los datos: **decidir ciudad** (Santo Domingo vs Santiago) y **confirmar precio**

**Criterio de salida (el de Fase 0):** ≥10 profesionales que digan "yo pago eso". Si no se logra → ajustar precio/propuesta y repetir, NO seguir construyendo a ciegas.

---

## ETAPA 4 — Endurecer el MVP para pilotos reales (semana 4–8, solapa con la 3)

Construir solo lo que los pilotos necesitan para operar de verdad, priorizado por el feedback de la Etapa 3.

- [x] 4.1 Login real del negocio — **hecho 2026-08-22**: teléfono+PIN, Google y Apple (`docs/LOGIN-GOOGLE-APPLE-SETUP.md` para activar Google/Apple en producción); `professionals.owner_user_id` protege `/stats` y `/bookings`
- [x] 4.2 Fechas reales en las reservas — **hecho 2026-08-22**: horario semanal real por profesional (`professional_hours`, sembrado por defecto mar-sáb 9am-6pm al registrarse, editable solo por API todavía — falta pantalla), disponibilidad calculada en vivo (horario − citas ya tomadas), reserva revalidada server-side contra choques de horario y doble-booking (`UNIQUE (professional_id, appointment_at)`). `day_label`/`time_label` ahora se calculan de `appointment_at`, no son texto libre
- [x] 4.2b "Mis citas" del cliente leídas del servidor por usuario — **hecho 2026-08-22**: `GET /api/bookings/me`, ya no vive en `localStorage`
- [x] 4.3 Agenda del profesional: ver/cancelar citas — **hecho 2026-08-22** (`GET /:slug/bookings` ahora trae `status` y fecha real); **falta:** confirmar explícitamente y **bloquear horarios sueltos** (hoy solo hay horario semanal fijo, no excepciones puntuales)
- [x] 4.3c Editar el horario semanal desde "Mi negocio" — **hecho 2026-08-22 noche**: `GET`/`PUT /:slug/hours`, un rango por día (varios rangos por día para huecos de almuerzo siguen requiriendo editar la base de datos directamente)
- [x] 4.3b Cambiar/cancelar cita desde el cliente — **hecho 2026-08-22** (`POST /api/bookings/:id/cancel`, cliente o dueño); **falta:** política de cancelación configurable con penalidad (hoy se puede cancelar sin restricción)
- [ ] 4.4 Recordatorios reales por WhatsApp (confirmación + recordatorio pre-cita)
- [ ] 4.5 Fotos reales de perfil y portafolio (el profesional es el perfil)
- [ ] 4.6 Decidir stack/hosting definitivo (¿se queda BanaHosting o migrar?) — decidir aquí, antes de tener datos de clientes reales
- [x] 4.8 Convertir `bukeard.com` de landing a **marketplace público** — **código hecho 2026-08-22 noche**: home con buscador y tarjetas reales, perfil público compartible `/p/:slug`, `/negocios`, `/precios` (plano en [ANALISIS-SITIO-FRESHA.md](ANALISIS-SITIO-FRESHA.md) §5). **Falta un paso de despliegue que solo Víctor puede hacer** — ver "Marketplace público: falta apuntar el dominio" en `CLAUDE.md`. Hasta entonces, `bukeard.com` sigue mostrando la landing vieja (subida por FTP, fuera del repo) y las páginas nuevas solo viven en local/en el código
- [ ] 4.7 Onboarding self-service del negocio estilo Fresha (wizard, ver [FLUJO-REGISTRO-FRESHA.md](FLUJO-REGISTRO-FRESHA.md)) + opción asistida por WhatsApp
- [x] 4.9 Cuentas bancarias del negocio + comprobante de pago — **hecho 2026-08-22 noche**: el cliente copia el número de cuenta y adjunta la foto/PDF del comprobante al pagar por transferencia; el negocio lo ve en su agenda
- [x] 4.10 Búsqueda basada en mapa — **hecho 2026-08-23**: `/mapa` en `bukeard.com` con Leaflet/OpenStreetMap (gratis, decisión de Víctor), geocodificación automática por sector (`lib/geocode.js`, Nominatim) al registrar un negocio o al arrancar el servidor para los que falten. Coordenadas a nivel de barrio, no de dirección exacta — falta agregar un campo de dirección real para más precisión, y llevar el mismo mapa a la app (hoy solo está en el sitio web)
- [x] 4.11 "Cómo llegar" (Google Maps / Apple Maps / Waze) — **hecho 2026-08-23**, a pedido de Víctor tras ver una captura de Fresha: hoja con los 3 enlaces en el perfil (app), el ticket de confirmación, "Mis citas" y el perfil público `/p/:slug`
- [x] 4.12 Colaboradores/equipo — **hecho 2026-08-23**, a pedido de Víctor tras ver una captura de Fresha (adelanta parte de la Fase 2 del PLAN): un negocio puede agregar personas adicionales que también atienden citas (`collaborators`), el cliente elige "¿Quién te va a atender?" al reservar si hay más de uno, "Mi equipo" en el panel del negocio, sección "Equipo" en el perfil público `/p/:slug`. **Disponibilidad sigue siendo por negocio, no por colaborador** — todos comparten el mismo horario y calendario (ver nota en `CLAUDE.md`)

**Salida:** un negocio real puede operar su día completo en Bukea sin ayuda.

> Prioridad y evidencia de estos puntos: [TEST-FRESHA.md](TEST-FRESHA.md) (primer recorrido comparativo, 2026-08-22). Repetir el test al cerrar 4.1–4.3.

---

## ETAPA 5 — Piloto en vivo (semana 8–12)

- [ ] 5.1 Montar 5–10 negocios comprometidos de la Etapa 3 (onboarding presencial si hace falta)
- [ ] 5.2 Acompañarlos 2–4 semanas: citas reales, clientes reales, medir no-shows y uso
- [ ] 5.3 Corregir el top de fricciones que reporten
- [ ] 5.4 Definir el precio con datos del piloto y empezar a cobrar (los fundadores mantienen condiciones especiales) — validar que **pagan**, no solo que usan
- [ ] 5.5 Publicar la app iOS (Capacitor ya está listo) y evaluar TWA/PWA para Android

**Salida:** 5+ negocios activos con citas reales por semana. Aquí termina "el MVP demostró que funciona".

---

## ETAPA 6 — Crecer (mes 4+, corresponde a Fases 2–3 del PLAN)

En orden, según el roadmap del MVP:

- [ ] 6.1 Fila virtual para walk-ins (nadie la tiene — mantener prioridad)
- [ ] 6.2 Vertical salones (multi-servicio, multi-empleado) + lealtad ("la tarjetica") + reseñas con foto
- [ ] 6.3 "Mi Cuadre" completo (panel de detalles)
- [ ] 6.4 Tarjeta vía Azul/CardNET, NCF (DGII), domicilio, paquetes de eventos

---

## Regla de oro del roadmap

**Las Etapas 1–3 mandan.** El código (Etapa 4) solo avanza en paralelo si no le quita tiempo a la validación. El mayor riesgo del proyecto hoy no es técnico — es construir algo que nadie paga, mientras BarberTime gana densidad en Santo Domingo.
