# Bukea — Visión de Producto

> **Bukea** — la app para bukear tu cita de barbería, salón, uñas, cejas y maquillaje en República Dominicana.

## 1. El nombre

**Bukea** es la dominicanización de *"to book"* (reservar). Se usa como verbo — *"¿Ya bukeaste tu cita?"*, *"Bukéalo"* — y es neutral entre todos los nichos: no se inclina a barbería ni a belleza femenina.

**Criterios que cumplió sobre otros candidatos** (Ponte, Nítido, TuTurno):

- Corto, pronunciable, memorable.
- Funciona como verbo (marca "verbalizable" = crecimiento orgánico boca a boca).
- Spanglish natural del habla dominicana.
- Marca única y registrable (no es palabra de diccionario).
- Neutral entre barbería, salón, uñas, cejas y maquillaje.

### Estado de dominios (chequeo DNS 2026-07-04 — confirmar en registrador)

| Dominio | Estado aparente |
|---|---|
| `bukea.do` | Posiblemente libre ✅ (prioridad #1 — registrar en nic.do) |
| `bukea.com.do` | Posiblemente libre ✅ |
| `bukeard.com` | **Disponible ✅ (confirmado 2026-07-04)** — "Bukea RD", excelente .com principal |
| `bukea.io`, `getbukea.com`, `bukeaapp.com`, `bukea.net` | Posiblemente libres ✅ |
| `bukea.com` | Resuelve — verificar si está parqueado/en venta |
| `bukea.app` | Resuelve — tomado |

### Checklist de registro pendiente

- [ ] Registrar `bukea.do` y `bukea.com.do` en [nic.do](https://www.nic.do)
- [ ] Registrar `bukeard.com` como dominio .com principal (disponible, confirmado 2026-07-04)
- [ ] Registrar `bukea.io` / `getbukea.com` como respaldo internacional
- [ ] Reservar handles: `@bukea` / `@bukea.do` en Instagram, TikTok, X, Facebook
- [ ] Búsqueda de marca en ONAPI (clases 35, 42 y 44) y solicitud de registro
- [x] Verificar disponibilidad del nombre en App Store y Google Play — ✅ verificado 2026-07-04: sin coincidencias exactas en ninguna tienda (lo más cercano: Buke, BUKA, Bukia, Bykea — otras categorías/mercados)
- [ ] Reservar "Bukea" en App Store Connect al crear la cuenta de Apple Developer (única reserva formal; en Google Play los nombres no se reservan — protege la marca vía ONAPI)

## 2. La oportunidad

### Referencia: Fresha (apps.apple.com/app/id1297230801)

Fresha es el marketplace de belleza y bienestar más grande del mundo (100,000+ negocios, 450,000+ profesionales). Su modelo actual: suscripción (~US$19.95/mes individual, ~US$14.95/usuario en equipo), **comisión de 20% (mín. US$6) por cada cliente nuevo** que llega por su marketplace, procesamiento de pagos 2.19% + US$0.20, y cobros extra por SMS y protección de no-shows.

**Por qué Fresha no encaja en RD** (y dónde está nuestra ventaja):

1. Es genérico (spas, masajes, tatuajes) — no habla el idioma del negocio de belleza dominicano.
2. Asume tarjeta internacional; en RD mandan el efectivo, la transferencia y tPago.
3. La comisión de 20%/US$6 es inviable para un corte de RD$300–500.
4. Comunica por SMS/email; en RD todo pasa por WhatsApp.
5. No modela el walk-in (la fila de la barbería) ni factura con NCF.

### Competencia en RD

| Competidor | Tipo | Fortaleza | Debilidad |
|---|---|---|---|
| **BarberTime** (mybarbertime.app) | Marketplace local | Competidor directo más avanzado: recordatorios WhatsApp, pagos con tarjeta/Apple Pay, reseñas, tracción en Santo Domingo. [Análisis completo](COMPETENCIA-BARBERTIME.md) | **Solo iPhone** (Android domina RD); solo barbería; tarjeta-céntrico; sin walk-ins; precio al negocio opaco |
| **Fresha** | Marketplace global | Producto maduro; salones listados en Santo Domingo | Comisión 20%; sin localización; baja penetración |
| **Booksy** | Marketplace global | Marca fuerte en barbería masculina | Sin operación real en RD |
| **BarberEx** | App local a domicilio | Validó demanda de barbería móvil en RD | Solo domicilio, solo barbería |
| **ReservaSimple** | Software B2B RD | Recordatorios WhatsApp, depósitos por transferencia | Sin marketplace de consumo |
| **AgendaPro / WeiBook / Noona** | Software B2B LATAM | Herramientas de gestión completas | Sin marca de consumo en RD |
| **WhatsApp + Instagram + cuaderno** | Statu quo | Es como funciona el 90% del mercado hoy | Caótico: citas perdidas, no-shows, sin historial |

**El hueco**: nadie combina (a) marketplace de consumo, (b) toda la vertical de belleza, (c) efectivo/transferencia como primera clase, (d) WhatsApp nativo y (e) walk-ins/fila virtual. Ese cuadrante está vacío y es el que ocupa Bukea.

> **Nota (2026-07-05):** tras analizar a BarberTime a fondo, WhatsApp ya no es diferenciador frente a ellos en barbería. La punta de lanza operativa de Bukea pasa a ser **multivertical + funciona en cualquier teléfono** (BarberTime es solo iPhone; Android domina ~85% de RD). WhatsApp, efectivo y fila virtual siguen sumando, pero ya no cargan solos la diferenciación. Ver [COMPETENCIA-BARBERTIME.md](COMPETENCIA-BARBERTIME.md).

## 3. El esquema de producto

### Principio central: el profesional es el perfil, no el local

La gente es fiel a *su* barbero, *su* manicurista, *su* estilista — no a la silla. Cada profesional tiene portafolio visual tipo Instagram, especialidades, calificación y agenda propia. Si se muda de local, su clientela lo sigue dentro de Bukea.

### Los tres diferenciadores que ganan el mercado

1. **WhatsApp nativo** (WhatsApp Business API): confirmaciones, recordatorios, reprogramación con un toque, y reserva vía chatbot sin instalar la app.
2. **Pagos a la dominicana**: efectivo como opción de primera clase, transferencia bancaria, tPago, y tarjeta vía adquirentes locales (Azul/CardNET). Depósito opcional por transferencia contra no-shows.
3. **Fila virtual para walk-ins**: "turno en vivo" — ves cuántos hay delante y te avisamos por WhatsApp cuando falten dos. Respeta la cultura de la barbería/salón dominicano.

### Funciones que fidelizan

- Cita recurrente ("cada 2 semanas con el mismo barbero"; "mi salón de todos los sábados").
- Lealtad digital (la tarjetica de 10 cortes = 1 gratis) y propina digital.
- Servicio a domicilio con zona de cobertura y cargo por traslado.
- El cliente adjunta la foto del estilo/diseño que quiere a la cita.
- Modo de bajo consumo de datos y funcionamiento básico offline.

### Lado B2B (el negocio)

- Agenda multi-silla con comisiones barbero/dueño (modelo dominicano de porcentaje por silla).
- **"Mi Cuadre"** — panel de estadísticas en "Mi negocio": el profesional ve cuánto vendió con resumen por día, últimos 7 días y mes (del dominicano "cuadrar la caja"). Encima, un panel de detalles para identificarlo todo: cliente más recurrente, servicios más vendidos, ingreso por servicio, citas completadas vs. canceladas/no-show, horas y días pico. Es el cuadre de caja digital que hoy llevan en una libreta.
- Inventario básico.
- Facturación con NCF (DGII) — ningún player global lo ofrece.

## 4. Verticales

Una sola plataforma con categorías — no apps separadas. El núcleo (perfil del profesional, portafolio, WhatsApp, pagos locales, lealtad, recurrencia) es común; cada vertical adapta el flujo de reserva:

### Barbería
Corte quincenal como ritual. Fila virtual, cita recurrente, walk-ins.

### Uñas
La más visual y más recurrente (relleno cada 2–3 semanas). **Reserva por diseño**: catálogo con niveles de precio (gel, acrílico, encapsuladas, arte por uña); la clienta adjunta foto del diseño y la manicurista confirma precio/duración antes de aceptar (mini-cotización en el flujo). Recordatorio de relleno/retiro. Domicilio común.

### Salones (peluquería femenina)
Reserva multi-servicio y multi-empleado (lavado → desrizado → tubi → plancha, con personas distintas). Duración/precio variables según preguntas al reservar (largo, tratamiento previo). El sábado de salón = alto volumen → fila virtual. Cita recurrente semanal.

### Cejas y maquillaje
Negocio de eventos (bodas, graduaciones, quinceañeros): domicilio, horarios extremos, **paquetes** (novia + cortejo) y **depósito obligatorio**. Retoque programado automático para microblading/laminado (4–6 semanas) con ficha de consentimiento digital. El antes/después en el portafolio es el argumento de venta.

**Orden de lanzamiento**: barbería + uñas primero (alta frecuencia, decisión rápida, muy Instagram) → salones en segunda ola → cejas/maquillaje como categoría desde el día 1, con marketing dedicado al tener densidad.

**Efecto multivertical**: la misma clienta usa uñas + cejas + salón (3–4 citas/mes por usuaria) y se captura el hogar completo (ella salón/uñas, él barbería) en una sola cuenta.

## 5. Modelo de negocio

Ataca directo el punto débil de Fresha: **cero comisión por cliente nuevo**.

- Suscripción plana en pesos: ~RD$500–1,500/mes por silla.
- Plan gratuito generoso para arrancar y lograr densidad de oferta.
- Monetización posterior: destacados en el mapa, plan premium, procesamiento de pagos.
- Gratis siempre para el cliente final.

## 6. Roadmap MVP

| Fase | Alcance |
|---|---|
| **1** | Perfiles de profesional + agenda + reserva + recordatorios por WhatsApp + pago en efectivo/transferencia. Verticales: barbería y uñas. |
| **2** | Fila virtual (walk-ins), lealtad digital, reseñas con foto verificada. Vertical: salones. |
| **3** | Pagos con tarjeta (Azul/CardNET), NCF, servicio a domicilio, paquetes de eventos (maquillaje). |

**Estrategia geográfica**: concentrarse en una ciudad (Santo Domingo o Santiago) hasta lograr densidad antes de expandir.

---

*Fuentes de investigación: [Fresha Pricing](https://www.fresha.com/pricing) · [Fresha marketplace fees](https://www.fresha.com/help-center/knowledge-base/billing-and-fees/188-marketplace-new-client-fees) · [Fresha Review 2026](https://thesalonbusiness.com/fresha-review/) · [BarberTime](https://mybarbertime.app/) · [ReservaSimple RD](https://www.reservasimple.com/mejores-plataformas-gestionar-turnos-republica-dominicana) · [BarberEx](https://cdn.com.do/estilos-de-vida/todo-lo-que-necesitas-saber-sobre-la-app-de-barberia-a-domicilio-barbeex/)*
