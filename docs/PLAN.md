# Bukea — Plan del Proyecto

> Última actualización: 5 de julio de 2026 · Documento hermano: [Visión de Producto](VISION.md)
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

App en producción en [vmdventura.com/bukea](https://vmdventura.com/bukea/) — Node.js + Express + MySQL, servida como PWA a pantalla completa (instalable, safe-areas de iOS). Código en `backend/`.

- **Login del cliente** — bienvenida "drenched" en teal con logo, número dominicano (809/829/849) + PIN de 4 dígitos (hash scrypt). Opción "continuar como invitado".
- **Verificación por WhatsApp (OTP)** — código completo y desplegado, dormido hasta configurar las credenciales de Meta (ver [WHATSAPP-SETUP.md](WHATSAPP-SETUP.md)). Costo por código: ~US$0.013 (~RD$0.80).
- **Flujo del cliente** — inicio por categorías → listado filtrado por categoría → perfil con servicios → reserva (día/hora/pago) → confirmación con recordatorio de WhatsApp simulado. Reservas guardadas en MySQL. Pantalla "Mis citas".
- **Lado B2B** — "Únete a Bukea": registro del negocio con sus servicios; panel "Mi negocio" con contador de citas, agenda en vivo y lista de servicios.
- **"Mi Cuadre" básico** — dentro de "Mi negocio", tres tarjetas con lo vendido: hoy, últimos 7 días y mes en curso (monto RD$ + número de citas). Endpoint `GET /bukea/api/professionals/:slug/stats`; los períodos se calculan sobre `created_at` de la reserva porque `day_label` es texto libre, no fecha real — al migrar a fechas reales, el cuadre debería pasar a la fecha de la cita.
- **Panel de administrador interno** — `/bukea/admin`, protegido con contraseña propia (no la de ningún profesional ni cliente). Muestra de un vistazo: profesionales totales, ventas hoy/7 días/mes/histórico de toda la plataforma, tabla de profesionales con sus citas y venta, y las últimas 20 reservas de cualquier profesional. Es la vista que responde "¿qué está pasando en la app?" sin entrar a phpMyAdmin ni esperar un CRM externo.

**Limitaciones conocidas (deuda técnica del slice):** la sesión del negocio es solo `localStorage` (sin login real todavía); datos de fila virtual aún fijos; sin fotos reales (avatares con iniciales); el hosting de prueba (BanaHosting compartido) no es necesariamente el definitivo.

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

## Reglas estratégicas

1. **Una ciudad primero.** Santo Domingo o Santiago hasta lograr densidad de oferta. Un marketplace vacío no sirve a nadie.
2. **Cero comisión.** Ataque directo al 20%/US$6 de Fresha. Suscripción plana RD$500–1,500/mes por silla; plan gratuito generoso al arrancar; gratis siempre para el cliente.
3. **El hueco del mercado.** Nadie combina marketplace de consumo + toda la vertical de belleza + efectivo/transferencia + WhatsApp nativo + walk-ins. Ese cuadrante es de Bukea.
4. **Efecto multivertical.** La misma clienta usa uñas + cejas + salón (3–4 citas/mes) y se captura el hogar completo en una sola cuenta.
5. **Multivertical + funciona en cualquier teléfono son ahora la punta de lanza.** Tras analizar a BarberTime (ver [COMPETENCIA-BARBERTIME.md](COMPETENCIA-BARBERTIME.md)), WhatsApp ya no distingue frente a ellos en barbería: ellos también lo tienen. Lo que sí no tienen es Android/web (son solo iPhone, y Android domina ~85% de RD) ni verticales fuera de barbería. La PWA de Bukea corre en cualquier teléfono desde el día uno.

## Fusión con "Bukea 2.0" (visión alterna, 2026-07-15)

Víctor compartió una propuesta de rediseño premium ("Bukea 2.0": Flutter, paleta `#00BFA5`, arquitectura de monorepo) guardada en [`docs/VISION-2.0.md`](VISION-2.0.md). Se comparó contra la dirección vigente y se decidió **combinar**: no re-litigar lo ya resuelto, pero sí absorber ideas de alcance que no chocan con lo construido.

**No se adopta** (ya decidido y en producción, no re-abrir): cambio de stack a Flutter/Firebase, paleta `#00BFA5`, tipografía Playfair Display/Inter. El sistema de diseño vigente (Fraunces + Plus Jakarta Sans, teal OKLCH, ver [DESIGN.md](../DESIGN.md)) ya está implementado en `prototype/demo-v2.html` y `backend/public/index.html`.

**Sí se incorpora** (ideas de alcance de producto, no de stack):

- [x] "Opiniones" (reseñas de texto) en el perfil del profesional — agregado a `prototype/demo-v2.html` y `backend/public/index.html` (2026-07-15).
- [ ] Favoritos y Ajustes del lado cliente — pendiente, candidato a Fase 2.
- [ ] Ideas de IA (predecir cancelaciones, detectar huecos libres, sugerir horarios) — candidato para una fase posterior a la Fase 3, sin alterar el roadmap de 3 fases ya definido.
- [ ] Formalizar el modelo de negocio en niveles explícitos (Gratis / Pro / Premium) en vez de solo "plan gratuito + monetización posterior" — pendiente de confirmar con Víctor antes de escribirlo en VISION.md.
- [x] Panel de administrador interno básico — ✅ construido (2026-07-15): `/bukea/admin`, protegido con contraseña (`ADMIN_PASSWORD` en `.env`), muestra totales (profesionales, ventas hoy/7 días/mes/histórico), tabla de profesionales con sus citas y venta, y actividad reciente de todas las reservas. Todavía no incluye moderación, analytics avanzado, suscripciones ni CMS — eso sigue como necesidad futura.

## WordPress en bukeard.com — en pausa (2026-07-15)

Víctor había decidido mover todo el motor de reservas a WordPress + un plugin de booking/marketplace (Directorist + Directorist Booking, evaluado ese mismo día contra Dokan/WCFM y Booknetic SaaS). Al intentar instalarlo se descubrió que `bukeard.com` ya sirve un `index.html` estático (una landing con botones de App Store/Google Play, del 5 de julio) y que la instalación de WordPress nunca se completó (el formulario de Softaculous se llenó pero no se ejecutó). Con el MVP ya probado de punta a punta ese mismo día (reserva real, cuenta just-in-time, "Mi Cuadre" con datos reales), se decidió **pausar WordPress** y priorizar salir a validar precio con profesionales reales usando lo que ya funciona — WordPress queda como opción a retomar si esa validación confirma que vale la pena invertir en una reconstrucción mayor.

## Mudanza del MVP a bukeard.com/app (decisión 2026-07-15 — en curso)

En vez de WordPress, se decidió mover el MVP de prueba (Node/Express + MySQL) y el panel de administrador de `vmdventura.com/bukea` a `bukeard.com/app`, dejando la landing estática existente intacta en la raíz del dominio.

**Ya listo en el código** (probado localmente sirviendo la misma app bajo `/bukea` y bajo `/app` sin diferencias):
- [x] `backend/public/index.html` ya no tiene `/bukea/api/...` fijo — calcula la ruta base desde `location.pathname`, como ya hacía `admin.html`.
- [x] `backend/public/manifest.json` usa un placeholder que `app.js` resuelve al servirlo, para que `start_url`/`scope` de la PWA coincidan con la ruta real de despliegue.

**Pendiente — requiere acceso al cPanel de BanaHosting que esta sesión no tiene:**
- [ ] Crear la app Node.js en cPanel (Node.js Selector) con: *Application root* una carpeta nueva bajo `bukeard.com` (ej. `bukeard.com/bukea-app`, mismo patrón que ya usa `vmdventura.com/bukea-app`), *Application URL* `bukeard.com/app`, *Startup file* `app.js`.
- [ ] Variables de entorno en esa app: `BASE_PATH=/app`, las mismas `DB_HOST/DB_USER/DB_PASSWORD/DB_NAME` (decidir si comparte la misma base de datos que `vmdventura.com/bukea` o usa una copia), y **`ADMIN_PASSWORD`/`ADMIN_SESSION_SECRET` propios** (no dejar los valores por defecto del código en producción).
- [ ] Subir el código de `backend/` a esa carpeta (File Manager o Git) y correr `npm install` desde el panel de Node.js Selector.
- [ ] Decidir qué pasa con `vmdventura.com/bukea` (¿se apaga, queda de respaldo, o corren ambos en paralelo un tiempo?)

## Próximo paso inmediato

Mudar el MVP a `bukeard.com/app` (bloqueado en Víctor — necesita crear la app Node.js en cPanel, ver sección arriba) y, en paralelo, seguir la Fase 0: registrar `bukea.do`, reservar handles sociales, iniciar marca en ONAPI, y **validar precio con 10–15 profesionales reales** usando la landing de `bukeard.com` + el MVP ya funcional.
