# Bukea — Plan del Proyecto

> Última actualización: 22 de agosto de 2026 · Documento hermano: [Visión de Producto](VISION.md)
> **¿Qué hacer ahora y en qué orden?** → ver [ROADMAP.md](ROADMAP.md), el checklist secuencial de ejecución (6 etapas).

## Dónde estamos hoy

| Área | Estado |
|---|---|
| Definición | ✅ Visión de producto, nombre y análisis de competencia (BarberTime) completos |
| Infraestructura | ✅ Repositorio propio `vmdventura/bukea` (privado) |
| Marca | 🟡 `bukeard.com` registrado y logo listo — faltan `bukea.do`, ONAPI y handles |
| Producto | 🟡 MVP de prueba funcional en producción (ver "Lo construido") — falta validar y endurecer |

## Fase 0 — Fundación (antes de escribir código)

- [ ] Registrar `bukea.do` y `bukea.com.do` en [nic.do](https://www.nic.do) — **prioridad #1**
- [x] Registrar `bukeard.com` — ✅ registrado (2026-07-05). "Bukea RD", el .com principal
- [x] Logo — ✅ listo (2026-07-05): "b" itálica serif + wordmark "Bukea", variantes crema y teal, tagline "Bukear nunca fue tan fácil"
- [ ] Registrar respaldo internacional: `bukea.io` / `getbukea.com`
- [ ] Reservar handles `@bukea` / `@bukea.do` en Instagram, TikTok, X y Facebook
- [ ] Búsqueda de marca en ONAPI (clases 35, 42 y 44) y solicitud de registro
- [x] Verificar disponibilidad del nombre en App Store y Google Play — ✅ verificado 2026-07-04: no existe ninguna app "Bukea" en ninguna de las dos tiendas
- [ ] Reservar el nombre "Bukea" en App Store Connect al crear la cuenta de Apple Developer (US$99/año; la reserva expira en ~180 días sin publicar)
- [ ] Validar con 10–15 barberos/manicuristas reales: ¿pagarían RD$500–1,500/mes por silla?

**Criterio de salida:** dominios y marca asegurados, y al menos 10 profesionales que digan "yo pago eso".

**Decisión (2026-07-05):** Víctor decidió arrancar el código del MVP en paralelo a completar la Fase 0, a sabiendas de que el criterio de salida formal (10+ profesionales validados, dominios registrados) todavía no se ha cumplido — no porque se haya dado por completado. Motivo: tener algo funcional que mostrar ayuda a la validación con profesionales reales. La Fase 0 sigue activa y sus pendientes no se tachan por este cambio.

## Lo construido (MVP de prueba)

App en producción en [www.bukeard.com/app](https://www.bukeard.com/app/) — Node.js + Express + MySQL, servida como PWA a pantalla completa (instalable, safe-areas de iOS). Código en `backend/`.

- **Login del cliente** — bienvenida "drenched" en teal con logo, número dominicano (809/829/849) + PIN de 4 dígitos (hash scrypt). Opción "continuar como invitado".
- **Verificación por WhatsApp (OTP)** — código completo y desplegado, dormido hasta configurar las credenciales de Meta (ver [WHATSAPP-SETUP.md](WHATSAPP-SETUP.md)). Costo por código: ~US$0.013 (~RD$0.80).
- **Flujo del cliente** — inicio por categorías → listado filtrado por categoría → perfil con servicios → reserva (día/hora/pago) → confirmación con recordatorio de WhatsApp simulado. Reservas guardadas en MySQL. Pantalla "Mis citas".
- **Lado B2B** — "Únete a Bukea": registro del negocio con sus servicios; panel "Mi negocio" con contador de citas, agenda en vivo y lista de servicios.
- **"Mi Cuadre" básico** — dentro de "Mi negocio", tres tarjetas con lo vendido: hoy, últimos 7 días y mes en curso (monto RD$ + número de citas). Endpoint `GET /bukea/api/professionals/:slug/stats`; desde el 22-ago-2026 los períodos se calculan sobre `appointment_at` (fecha real de la cita, con `created_at` como respaldo para reservas viejas), no sobre cuándo se creó la reserva.

**Limitaciones conocidas (deuda técnica del slice):** datos de fila virtual aún fijos; sin fotos reales (avatares con iniciales); el hosting de prueba (BanaHosting compartido) no es necesariamente el definitivo. ~~la sesión del negocio es solo `localStorage`~~ — resuelto 2026-08-22, ver "Login" en CLAUDE.md.

## Roadmap del MVP

### Fase 1 — El núcleo que reserva

Verticales: **barbería + uñas** (alta frecuencia, decisión rápida, muy Instagram).

- Perfil del profesional con portafolio visual (el profesional es el perfil, no el local)
- Agenda + reserva de citas + cita recurrente
- Confirmaciones y recordatorios por **WhatsApp**
- Pago en **efectivo y transferencia** como primera clase
- Reserva por diseño en uñas: foto + mini-cotización antes de aceptar
- **"Mi Cuadre" básico en "Mi negocio"**: cuánto vendió el profesional — resumen de hoy, últimos 7 días y mes ✅ ya construido en el MVP de prueba (2026-07-05, ver "Lo construido")

### Fase 2 — Lo que nadie más tiene

Vertical nueva: **salones** (reserva multi-servicio y multi-empleado).

- **Fila virtual para walk-ins** — turno en vivo con aviso por WhatsApp
- Lealtad digital (la tarjetica: 10 cortes = 1 gratis)
- Reseñas con foto verificada
- **"Mi Cuadre" completo — panel de detalles** (profundiza el Cuadre básico de Fase 1): cliente más recurrente, servicios más vendidos, ingreso por servicio, citas completadas vs. canceladas/no-show, horas y días pico — se alimenta de la lealtad y la recurrencia de esta fase

### Fase 3 — Monetización y eventos

Vertical con marketing dedicado: **cejas y maquillaje** (bodas, graduaciones, quinceañeros).

- Tarjeta vía adquirentes locales (Azul / CardNET)
- Facturación con **NCF (DGII)** — ningún player global lo ofrece
- Servicio a domicilio con zona de cobertura
- Paquetes de eventos (novia + cortejo) con depósito obligatorio

## Test contra Fresha (2026-08-22)

Primer recorrido comparativo documentado en [TEST-FRESHA.md](TEST-FRESHA.md). Tres hallazgos que cambian supuestos:

1. **Fresha ya tiene densidad real en Santo Domingo** (La Universidad del Corte 141 reseñas, Fernando The Barber 196, High Level Cuts 46, Kasús Barber & Nails 52…) y landings para Santiago y SD Este. "Baja penetración" ya no aplica; Víctor mismo reserva su barbero (Olivercut) por Fresha.
2. **Fresha ofrece "Continuar con WhatsApp"** en el login de negocios y **lista de espera** por fecha en la reserva. WhatsApp y "no hay hora" ya no distinguen por sí solos; la ventaja de Bukea debe estar en cero comisión, precio en pesos, fila en vivo y el lado B2B dominicano (Cuadre, NCF, comisión por silla).
3. **Precios de Fresha en RD (22-ago-2026):** Independiente **RD$359,95/mes**, Equipo **RD$239,95 por miembro/mes**, 20 WhatsApp gratis y luego RD$4,80–19 c/u; la fila "Marketplace – nuevos clientes" aparece como **"Gratis"** en la página RD (el Help Center aún habla de tarifa única — **verificar con cuenta de negocio** antes de seguir diciendo "Fresha cobra 20 %"). El rango RD$500–1.500/silla de Bukea queda por encima. **Decisión de Víctor (2026-08-22): Bukea es gratis de momento** — sin suscripción ni comisión para negocios ni clientes — para atraer usuarios y ganar densidad; el precio se define después, con datos del piloto (qué usan, cuántas citas, qué pagarían). El modelo de suscripción por silla sigue siendo el plan de monetización, no el de lanzamiento. Plano completo del sitio y la app en [ANALISIS-SITIO-FRESHA.md](ANALISIS-SITIO-FRESHA.md). **Booksy analizado también (22-ago-2026, [ANALISIS-SITIO-BOOKSY.md](ANALISIS-SITIO-BOOKSY.md)): confirma que no opera en RD** — no es competidor activo hoy, pero ya está en México/Colombia/Argentina/Chile/Brasil. Su modelo de precios (US$29,99/mes todo incluido + US$20/miembro, cero comisión salvo su "Boost" opcional) es una plantilla más simple que la de Fresha para cuando Bukea defina su propio precio.
4. **Competencia local dominicana (22-ago-2026, ver [COMPETENCIA-LOCAL-RD.md](COMPETENCIA-LOCAL-RD.md)):** CitaApp (US$5–15/mes) ya tenía un calendario de disponibilidad real funcionando con ~30 negocios RD — confirmó que las fechas/horas reales eran la brecha más urgente, porque un competidor mucho más simple ya la había resuelto. Te Resuelvo es un marketplace generalista muy temprano (2 reseñas), sin calendario, no es amenaza inmediata.
5. Las tres brechas que impedían enseñar Bukea a un piloto (fechas/disponibilidad reales 4.2, login real del negocio 4.1, agenda operable 4.3) **quedaron resueltas el 22-ago-2026** — ver ROADMAP. Falta: pantalla para editar el horario semanal, bloquear horarios sueltos, y política de cancelación con penalidad.

## Reglas estratégicas

1. **Una ciudad primero.** Santo Domingo o Santiago hasta lograr densidad de oferta. Un marketplace vacío no sirve a nadie.
2. **Cero comisión.** Ataque directo a la tarifa por cliente nuevo de Fresha (verificar su vigencia en RD, ver "Test contra Fresha"). **Lanzamiento 100 % gratis** (decisión 2026-08-22) para ganar densidad; después, suscripción plana en pesos por silla (rango a definir con datos del piloto — Fresha cobra RD$240–360); gratis siempre para el cliente.
3. **El hueco del mercado.** Nadie combina marketplace de consumo + toda la vertical de belleza + efectivo/transferencia + WhatsApp nativo + walk-ins. Ese cuadrante es de Bukea.
4. **Efecto multivertical.** La misma clienta usa uñas + cejas + salón (3–4 citas/mes) y se captura el hogar completo en una sola cuenta.
5. **Multivertical + funciona en cualquier teléfono son ahora la punta de lanza.** Tras analizar a BarberTime (ver [COMPETENCIA-BARBERTIME.md](COMPETENCIA-BARBERTIME.md)), WhatsApp ya no distingue frente a ellos en barbería: ellos también lo tienen. Lo que sí no tienen es Android/web (son solo iPhone, y Android domina ~85% de RD) ni verticales fuera de barbería. La PWA de Bukea corre en cualquier teléfono desde el día uno.

## Próximo paso inmediato

Completar Fase 0: registrar `bukea.do`, reservar handles sociales, iniciar marca en ONAPI, y **validar precio con 10–15 profesionales reales** (los 16 negocios públicos de BarberTime son prospectos de oro: ya adoptan tecnología de reservas). En paralelo, endurecer el MVP con el feedback de esa validación.
