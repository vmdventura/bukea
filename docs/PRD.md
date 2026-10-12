# Bukea. Documento de Requisitos de Producto (PRD)

> Versión 1.0 · 8 de septiembre de 2026 · Dueño del producto: Víctor Manuel De La Rosa Ventura (VMD Ventura / AMS Multimedia)
>
> Este documento consolida en un solo lugar qué es Bukea, para quién es, contra quién compite, qué se ha construido (sitio web, app, panel de negocio, panel de administración, apps nativas), cómo funciona por dentro y qué falta. Sustituye la lectura dispersa de `VISION.md`, `PLAN.md`, `ROADMAP.md`, `BUKEA-V3.md`, los análisis de competencia y las bitácoras de tienda. Cuando un detalle técnico necesite más profundidad, se referencia el documento fuente.

---

## 1. Resumen ejecutivo

**Bukea** (dominicanización de *to book*: "¿Ya bukeaste tu cita?") es un marketplace de reservas para la vertical de belleza y servicios con cita en República Dominicana. Combina dos productos en una sola plataforma:

- **Lado cliente:** buscar un profesional (barbero, manicurista, estilista, maquillador, entrenador, etc.), ver sus servicios con precios en pesos y reservar con fecha y hora real en menos de 60 segundos.
- **Lado negocio:** agenda en vivo, "Mi Cuadre" (ventas de hoy, 7 días y mes), equipo, cuentas bancarias para cobrar por transferencia, perfil público compartible y notificaciones.

**Tesis:** el 90 % del mercado dominicano de citas de belleza funciona con WhatsApp + Instagram + cuaderno. Los players globales (Fresha, Booksy) asumen tarjeta, cobran en dólares o comisión, y no modelan la cultura local (efectivo, transferencia, walk-ins). Los players locales son o solo barbería (BarberTime), o solo agenda sin descubrimiento (CitaApp), o directorio sin calendario (Te Resuelvo). Nadie combina marketplace de consumo + toda la vertical + pagos a la dominicana + WhatsApp nativo + fila para walk-ins. Ese cuadrante es el de Bukea.

**Estado al 8 de septiembre de 2026:**

| Superficie | Estado |
|---|---|
| Sitio web público `bukeard.com` | En producción. Marketplace server-rendered con buscador, mapa, perfiles públicos, páginas para negocios, precios, nosotros, blog, descargar, contacto, legal |
| App cliente (PWA) `bukeard.com/app` | En producción. Login teléfono+PIN, WhatsApp OTP, Google, Apple. Reserva con disponibilidad real, pago efectivo/transferencia con comprobante, Mis citas, Cómo llegar |
| Panel de negocio `bukeard.com/negocio` | En producción. Wizard de registro, calendario Hoy/Semana/Mes, Mi Cuadre, servicios, horario, equipo, cuentas bancarias, redes, fotos, ubicación, soporte |
| Panel de administración `bukeard.com/admin` | En producción. Login solo con Google, súper admin fijo, 9 módulos |
| App iOS (`com.bukea.app`) | Enviada a revisión de Apple el 28 de agosto de 2026 (build 2). Estado de revisión por confirmar |
| App Android (`com.bukea.app`) | Enviada a revisión de Google Play el 4 de septiembre de 2026 (versionCode 2, 177 países). Estado por confirmar |
| Notificaciones | WhatsApp OTP activo (Meta Cloud API), correo SMTP activo, push FCM al dueño al recibir reserva (backend + app nativa, probado en iPhone físico el 6 de septiembre) |
| Modelo de negocio | Lanzamiento gratis. Plan Básico gratis, Plan Plus RD$500/mes. Primeros 50 negocios "fundadores" con Básico gratis de por vida |
| Validación en la calle (Etapa 3 del roadmap) | **En cero.** Ningún profesional real visitado todavía. Es el cuello de botella del proyecto |

---

## 2. Contexto y problema

### 2.1 El problema del cliente
- Reservar hoy implica escribir por WhatsApp o Instagram y esperar respuesta ("¿tienes turno?"), sin ver la agenda real.
- No hay historial, ni recordatorio confiable, ni forma de reprogramar sin conversación.
- Las apps globales piden tarjeta o correo como identidad; en RD la identidad es el teléfono y el pago es efectivo o transferencia.

### 2.2 El problema del negocio
- Citas en cuaderno o en el chat: se cruzan clientes, hay no-shows, no hay control de cuánto se vendió.
- Las herramientas existentes o cobran en dólares (Fresha RD$240 a RD$360/mes, Booksy US$29,99+US$20/miembro), o exigen tarjeta para probar (BarberTime), o son solo agenda sin traer clientes nuevos (CitaApp US$5 a US$15/mes).
- Ninguna habla el lenguaje del negocio dominicano: cuadre de caja, comisión por silla, NCF, transferencia con cédula/RNC del titular.

### 2.3 Por qué ahora
- Fresha ya tiene densidad real en Santo Domingo y Santiago (barberías con 40 a 1.700 reseñas). El mercado ya adopta reservas online; la ventana es de posicionamiento, no de educación.
- BarberTime crece rápido en Santo Domingo (150 negocios, 20.000 citas) pero es solo iPhone y solo barbería.
- Android domina alrededor del 85 % del mercado dominicano. Bukea corre en cualquier teléfono desde el día uno (PWA + iOS + Android).

---

## 3. Objetivos y métricas de éxito

### 3.1 Objetivo de producto
Que un cliente bukee una cita en menos de 60 segundos sin pensarlo, y que un profesional vea Bukea como extensión natural de cómo ya trabaja (no como imposición extranjera).

### 3.2 Métricas

| Métrica | Meta | Estado / instrumentación |
|---|---|---|
| Tiempo abrir app → cita confirmada | < 60 s | Pendiente cronometrar con usuario que no conozca la app (protocolo en `TEST-FRESHA.md` §5) |
| Profesionales validados en la calle | ≥ 10 con compromiso real ("yo me monto hoy") | 0 (Etapa 3 del roadmap sin iniciar) |
| Negocios activos en piloto | 5 a 10 con citas reales semanales | Pendiente de la Etapa 5 |
| Reservas confirmadas | Evento `booking_confirmed` en GA4 con valor RD$, categoría y método de pago | Instrumentado (GA4 `G-9P6W5CRECN`) |
| Embudo de activación del negocio | registrado → con servicios → alguna vez reservado → con reserva este mes | Visible en `/admin` → Métricas |
| Tasa de cancelación por negocio | Visible en top 10 de `/admin` | Instrumentado |
| Cupos fundadores | 50 negocios con `founding_free` | Contador en vivo en `/precios` |

### 3.3 Criterio de salida de la Fase 0 (fundación)
Dominios y marca asegurados + al menos 10 profesionales que digan "yo pago eso" (o, con la oferta gratis actual, "yo me monto hoy"). Víctor decidió el 5 de julio de 2026 arrancar el código en paralelo a la Fase 0; la Fase 0 sigue activa y sus pendientes no se dan por cumplidos.

---

## 4. Usuarios

### 4.1 Cliente final
- Hombres y mujeres en Santo Domingo (o Santiago). Usan el teléfono con una mano, muchas veces en la calle o en tránsito.
- Canal habitual con su barbero o estilista: WhatsApp e Instagram. No usan apps de reservas formales.
- Pagan en efectivo o transferencia con mucha más frecuencia que con tarjeta.
- Trabajo a resolver: encontrar a *su* profesional de confianza y bukear sin fricción, pagando como ya paga.

### 4.2 Profesional / dueño de negocio
- Barberos, manicuristas, estilistas, maquilladores, entrenadores personales, peluqueros caninos, tatuadores, etc.
- Tarea principal en cualquier pantalla: no perder tiempo ni perder un cliente.
- Trabajo a resolver: agenda ordenada, cuadre de caja claro, clientes nuevos sin pagar comisión, cobrar por transferencia sin dictar el número de cuenta por chat.

### 4.3 Administrador de la plataforma
- Hoy una sola persona (Víctor, súper administrador fijo por correo).
- Necesita ver crecimiento, moderar cuentas bancarias y comprobantes, atender soporte, y operar en nombre de un negocio sin pedirle su PIN.

### 4.4 Principio central
**El profesional es el perfil, no el local.** La clientela sigue a su barbero o manicurista si se muda. Los colaboradores (equipo) existen como personas reservables adicionales, pero el titular sigue siendo el dueño del perfil.

---

## 5. Mercado y competencia

### 5.1 Mapa de competidores (verificado en vivo entre julio y agosto de 2026)

| Competidor | Tipo | Opera en RD | Precio al negocio | Fortalezas | Debilidades frente a Bukea |
|---|---|---|---|---|---|
| **Fresha** | Marketplace global + software | Sí, con densidad real en Santo Domingo, Santiago, SD Este | Independiente RD$359,95/mes; Equipo RD$239,95/miembro/mes; 20 WhatsApp gratis, luego RD$4,80 a 19 c/u | Producto maduro (10 años, 130.000 negocios), calendario real slots 15 min, lista de espera, login por WhatsApp/Google/Apple, SEO masivo por ciudad × categoría, pago en el local sin tarjeta | Genérico (spa, tatuaje, masaje), precios y ecosistema en dólares, sin fila en vivo, sin B2B dominicano (Cuadre, NCF, comisión por silla). Comisión por cliente nuevo: la página RD dice "Gratis", el Help Center habla de tarifa única (verificar con cuenta de negocio) |
| **BarberTime** (`mybarbertime.app`) | Marketplace local (BarberTime EIRL) | Sí, solo Santo Domingo | Básico RD$800, Premium RD$1.200, Negocios RD$3.000/mes. 1 mes gratis con tarjeta obligatoria | 150 negocios, 20.000 citas, 4,9★, recordatorios por WhatsApp, tarjeta/Apple Pay/Google Pay, reseñas verificadas, referidos RD$100, política de cancelación configurable | Solo iPhone (Android anunciado, listing 404 al 5 de julio), solo barbería hasta en el nombre, tarjeta como primera clase, sin fila virtual, centrado en el local no en el profesional |
| **Booksy** | Marketplace global | **No** (confirmado 22 de agosto: RD no está en su selector de 17 países) | US$29,99/mes todo incluido + US$20/miembro; cero comisión salvo "Boost" opcional (30 % de la primera visita) | Marca fuerte en barbería masculina, modelo de precios simple | Riesgo latente (ya en México, Colombia, Argentina, Chile, Brasil), no competidor activo hoy |
| **CitaApp** (`citaapp.net`) | SaaS de agenda dominicano | Sí, nativo | Básico US$5/mes, Premium US$15/mes, 14 días gratis sin tarjeta, sin comisión | Calendario con disponibilidad real funcionando, múltiples especialistas, PWA, ~30 negocios (casi todos barbería y uñas) | No es marketplace: el cliente llega porque el negocio compartió su link. Sin "cerca de mí", sin fila |
| **Te Resuelvo** (`teresuelvo.com`) | Directorio generalista dominicano con chat | Sí, nativo | Freemium, membresías sin precio público | Verificación de identidad, reseñas, chat directo, equipo activo (build cada horas) | Sin calendario de reservas (coordina por chat), muy temprano (2 reseñas en App Store), generalista (eventos, hogar, belleza) |
| **BarberEx** | App local a domicilio | Sí | n/d | Validó barbería móvil en RD | Solo domicilio, solo barbería |
| **ReservaSimple / AgendaPro / WeiBook / Noona** | Software B2B RD y LATAM | Parcial | n/d | Gestión completa, recordatorios WhatsApp, depósitos | Sin marca de consumo en RD |
| **WhatsApp + Instagram + cuaderno** | Statu quo | Es el 90 % del mercado | Gratis | Es como ya funciona todo el mundo | Caótico: citas perdidas, no-shows, sin historial, sin cuadre |

### 5.2 Tabla comparativa de capacidades

| Capacidad | Fresha | BarberTime | Booksy | CitaApp | Te Resuelvo | **Bukea (hoy)** |
|---|---|---|---|---|---|---|
| Opera en RD | Sí | Sí (SD) | No | Sí | Sí | Sí |
| Marketplace de descubrimiento | Sí | Sí | Sí | No | Sí (directorio) | **Sí** |
| Agenda con disponibilidad real | Sí | Sí | Sí | Sí | No | **Sí** (desde 22 de agosto) |
| Multivertical belleza y más | Sí | Solo barbería | Sí | Sí | Sí y más allá | **Sí, 12 categorías** |
| Android + iOS + web | Sí | Solo iOS | Sí | PWA | Sí | **PWA + iOS + Android** |
| Efectivo / transferencia primera clase | Depende del negocio | Tarjeta primero | Depende | Sí | n/a | **Sí, con cuentas bancarias + cédula/RNC + comprobante** |
| WhatsApp | Login + recordatorios de pago | Recordatorios | No en RD | Chatbot "próximamente" | No | **OTP activo; recordatorios pendientes** |
| Fila virtual para walk-ins | Lista de espera | No | Lista de espera | No | No | **Diferenciador, solo pantalla demo todavía** |
| Cuadre de caja en pesos | Reportes | n/d | Reportes | No | No | **Sí, "Mi Cuadre"** |
| Precio de entrada | RD$240 a 360 | RD$800 con tarjeta | US$30 | US$5 | Gratis | **Gratis, sin tarjeta, sin comisión** |
| Perfil público compartible | Sí | Sí (por local) | Sí | Sí | Sí | **Sí, `/p/:slug`, por profesional** |
| Búsqueda por mapa | Sí | Sí | Sí | No | n/d | **Sí (`/mapa`, Leaflet/OSM)** |
| Push al dueño al recibir reserva | Sí | Sí | Sí | n/d | n/d | **Sí (FCM, 6 de septiembre)** |
| NCF / comisión por silla | No | No | No | No | No | Planeado (Fase 3) |

### 5.3 Posicionamiento
- **Frente a Fresha:** precio en pesos y gratis para arrancar, pago a la dominicana de raíz, WhatsApp como identidad, Cuadre visible (no enterrado en reportes), fila en vivo, acompañamiento presencial.
- **Frente a BarberTime:** multivertical + Android/web + entrada gratis sin tarjeta + el profesional es el perfil.
- **Frente a CitaApp:** todo lo que CitaApp hace (agenda real) más marketplace que trae clientes nuevos, fila y pagos.
- **Ajuste del 5 de julio de 2026:** WhatsApp ya no es diferenciador único en barbería (BarberTime y Fresha lo tienen). La punta de lanza es **multivertical + funciona en cualquier teléfono**. WhatsApp, efectivo y fila siguen sumando.

### 5.4 Ventanas de riesgo competitivo
- BarberTime lanza Android (badge publicado, listing 404 al 5 de julio de 2026).
- Booksy entra a RD (ya está en 5 países de LATAM).
- Fresha sigue sumando densidad orgánica mientras la Etapa 3 de Bukea sigue en cero.

Documentos fuente: `COMPETENCIA-BARBERTIME.md`, `FLUJO-BARBERTIME.md`, `ANALISIS-SITIO-FRESHA.md`, `TEST-FRESHA.md`, `FLUJO-REGISTRO-FRESHA.md`, `ANALISIS-SITIO-BOOKSY.md`, `COMPETENCIA-LOCAL-RD.md`.

---

## 6. Propuesta de valor y diferenciadores

### 6.1 Tres diferenciadores (decisión fundacional)
1. **WhatsApp nativo** (WhatsApp Business Cloud API): verificación por código, confirmaciones, recordatorios, reprogramar con un toque, reserva vía chatbot sin instalar la app. *Estado: OTP activo en producción; recordatorios y chatbot pendientes.*
2. **Pagos a la dominicana:** efectivo y transferencia como primera clase (cuentas bancarias del negocio con banco, tipo, número, titular y cédula/RNC; botón copiar; comprobante adjunto), tPago después, tarjeta vía Azul/CardNET en Fase 3. *Estado: efectivo/transferencia/comprobante en producción. Bukea no procesa pagos.*
3. **Fila virtual para walk-ins:** turno en vivo, ves cuántos hay delante, aviso por WhatsApp cuando falten dos. *Estado: pantalla de demo con datos fijos; sin backend.*

### 6.2 Funciones que fidelizan (roadmap)
Cita recurrente, lealtad digital ("la tarjetica": 10 cortes = 1 gratis), propina digital, servicio a domicilio con zona de cobertura, foto del estilo adjunta a la cita (existe en el flujo de reserva), modo de bajo consumo de datos.

### 6.3 Lado B2B que ningún player global ofrece (roadmap)
Agenda multi-silla con comisión barbero/dueño (porcentaje por silla), reporte de caja ("Mi Cuadre" completo con cliente más recurrente, servicios top, no-shows, horas pico), inventario básico, facturación con NCF (DGII).

---

## 7. Modelo de negocio y precios

### 7.1 Decisiones
- **Lanzamiento 100 % gratis** (decisión 22 de agosto de 2026) para ganar densidad. Sin suscripción, sin comisión, sin tarjeta.
- **Cero comisión por cliente nuevo, siempre.** Ataque directo a la tarifa de Fresha.
- **Gratis siempre para el cliente final.**
- **Geografía:** una sola ciudad (Santo Domingo o Santiago) hasta tener densidad. Decisión final pendiente de la Etapa 3.

### 7.2 Planes publicados en `/precios` (desde 27 de agosto de 2026)

| Plan | Precio | Incluye |
|---|---|---|
| **Básico** | RD$0 (gratis hoy para cualquier negocio) | Perfil público, agenda con disponibilidad real, Mi Cuadre, cuentas bancarias, equipo, fotos, mapa, WhatsApp OTP |
| **Plus** | RD$500/mes (siempre de pago, sin excepción para fundadores) | Todo lo de Básico + WhatsApp ilimitado, reportes avanzados, soporte prioritario, equipo sin límite |

- **Programa fundador:** los primeros 50 negocios que completen el registro (`professionals.founding_free`) aseguran el plan Básico gratis de por vida, pase lo que pase con los precios. Contador en vivo en `/precios`.
- Referencias de mercado para fijar precio definitivo con datos del piloto: Fresha RD$240 a 360/mes; BarberTime RD$800 a 3.000/mes; CitaApp US$5 a 15/mes; Booksy US$29,99 + US$20/miembro (plantilla más simple para copiar).
- Monetización futura: destacados en el mapa, plan premium, procesamiento de pagos.

---

## 8. Alcance del producto: superficies

Bukea replica la arquitectura de 4 superficies de Fresha/Booksy, con su propia identidad y reglas:

| Superficie | URL / paquete | Para quién | Tecnología |
|---|---|---|---|
| Sitio web público (marketplace + marketing) | `https://www.bukeard.com` | Cliente, prospecto de negocio, buscadores | Express server-rendered, HTML indexable, sin framework JS |
| App cliente (PWA) | `https://www.bukeard.com/app` | Cliente final; también entrada de dueño a su panel | HTML/CSS/JS en un solo `index.html`, consume la API |
| Panel de negocio | `https://www.bukeard.com/negocio` | Dueño/profesional | HTML/CSS/JS servido por Express; también embebido en la app vía iframe |
| Panel de administración | `https://www.bukeard.com/admin` | Súper administrador | HTML/JS con fetch a `/api/admin/*` |
| App nativa iOS | `com.bukea.app` (App Store) | Cliente y dueño | Capacitor 6 + WKWebView con HTML empaquetado |
| App nativa Android | `com.bukea.app` (Google Play) | Cliente y dueño | Capacitor 6 + WebView con HTML empaquetado |
| API REST | `https://www.bukeard.com/app/api/*` y `/api/admin/*` | Todas las superficies | Node.js + Express + MySQL |

Todas comparten una sola base de datos MySQL y un solo proceso Node en cPanel.

---

## 9. Requisitos funcionales

Convención de estado: ✅ en producción · 🟡 construido con limitación conocida · ⬜ pendiente.

### 9.1 Sitio web público (`bukeard.com`)

| Ruta | Función | Estado |
|---|---|---|
| `/` | Home del marketplace: hero "Bukea tu cita de belleza en menos de 60 segundos", buscador de dos campos (servicio + ciudad) con chips de ciudad (Santo Domingo, Santiago, Punta Cana, La Romana, Puerto Plata), píldoras de 12 categorías, tarjetas reales de la BD (logo real como avatar, rating, sector, badge "Nuevo"), bloque "¿Tienes un negocio con citas?", footer con columnas y redes (`@bukeard`), banner de anuncio configurable desde admin | ✅ (filtrar por ciudad distinta a SD da 0 resultados a propósito: no hay columna ciudad todavía) |
| `/mapa` | Búsqueda por mapa con Leaflet + OpenStreetMap (sin API key), chips de categoría, pines con popup (nombre, negocio, rating, "Bukear cita", "Ver perfil") | ✅ (coordenadas por sector vía Nominatim, o exactas si el dueño arrastró el pin) |
| `/p/:slug` | Perfil público compartible por profesional, rediseñado tipo Fresha: portada con foto, avatar con logo real, estado abierto/cerrado en vivo, servicios con botón Reservar por servicio, horario semanal, galería de fotos, equipo (avatares con iniciales), cuentas bancarias con badge "✓ Verificada", redes sociales, "Cómo llegar" con mapa embebido y enlaces a Google Maps / Apple Maps / Waze, negocios cercanos, meta tags Open Graph. Pensado para pegar en la bio de Instagram/WhatsApp | ✅ |
| `/negocios` | Landing para dueños con franja fija arriba "Accede ahora a tu negocio" → `/negocio`. Beneficios estilo Booksy (bloques a ancho completo), "Explora las funciones" (WhatsApp de verdad, Pagos a la dominicana, Mi Cuadre, Calendario y equipo, Tu equipo también reserva, Cero comisión), "Comenzar es fácil" en 3 pasos, FAQ ampliado. Es lo que se enseña en la validación de calle | ✅ (refactor 7 de septiembre) |
| `/precios` | Planes Básico (gratis) y Plus (RD$500/mes), contador de cupos fundadores con barra de progreso, CTA "Únete ahora mismo", "Para el cliente, siempre gratis" | ✅ |
| `/nosotros` | Historia: "El problema que no se hablaba", "Cómo Bukea ayuda a vender más", "Lo que no vamos a cambiar" (el profesional es la estrella, efectivo y transferencia primero, cero comisión para empezar) | ✅ |
| `/descargar` | Botones App Store / Google Play (hoy decorativos: `TODO(publicación app stores)` en `pages.js`), "Para reservar tu cita" / "Para tu negocio" | 🟡 activar badges reales al aprobarse las apps |
| `/blog` | Estructura del blog (sin artículos todavía) | 🟡 |
| `/contacto` (GET/POST) | Formulario de contacto a `contacto@bukeard.com`, canales, tiempo de respuesta | ✅ |
| `/privacidad`, `/terminos` | Política y términos en español llano (requisito de App Store y Play Console) | ✅ |
| `/:categoria/:zona` | Landings SEO por categoría × zona | ⬜ cuando haya ≥ 5 negocios por categoría |

Deep links del sitio hacia la app: `/app/?pro=slug` abre ese perfil dentro de la PWA; `/app/?join=1` abre "Únete a Bukea".

**Categorías (12, en `views/shared.js`):** Barbería, Uñas, Salón, Maquillaje, Cejas & MUA, Pilates, Entrenador Personal, Peluquería Canina, Spa y Masajes, Trenzas y Rastas, Tatuadores, Servicios Profesionales. Las tres últimas se agregaron el 6 de septiembre de 2026. Cada categoría tiene pictograma propio en el sprite SVG; categorías y bancos viven fijos en código (decisión consciente, ver §14).

### 9.2 App cliente (`/app`, PWA y apps nativas)

**Entrada y cuenta**
- Bienvenida "drenched" en teal con logo. Onboarding "¿Qué servicio buscas?" por categoría. Opción de continuar como invitado para explorar. ✅
- Login por teléfono dominicano (809/829/849, bandera + prefijo agrupados) + PIN de 4 dígitos (hash scrypt). ✅
- "Código por WhatsApp" (OTP de 6 dígitos, expira 5 min, máximo 3 envíos cada 10 min, 5 intentos) cuando `otp/status` responde `enabled:true`. ✅ activo desde el 26 de agosto de 2026, número +1 809 466 5692 "Bukea", plantilla `codigo_bukea`.
- Continuar con Google y con Apple (íconos reales de marca; Facebook eliminado). En iOS nativo usa la hoja nativa de Sign in with Apple y el plugin nativo de Google; en Android y web usa los SDK web. ✅
- Registro just-in-time: se pide cuenta solo al confirmar la reserva. Email opcional para recuperar PIN. Tipo de cuenta cliente u dueño (`account_type`) desde el registro. ✅
- "¿Olvidaste tu PIN?": código de 6 dígitos por correo (`forgot-pin`/`reset-pin`). ✅ SMTP activo desde 26 de agosto (`no-reply@bukeard.com`).
- Verificación de correo (`verify-email`, `resend-verification`), cambio de correo y de PIN, verificación de teléfono. ✅
- "Eliminar mi cuenta" con doble confirmación (anonimiza, oculta el negocio si tiene; regla 5.1.1 de Apple). ✅
- Registro del token push del dispositivo (`push-token`) al iniciar sesión en la app nativa. ✅

**Descubrir y reservar**
- Inicio con buscador, categorías, listado filtrado por categoría, tarjetas con logo real, rating, sector, tags de servicios. Evento GA4 `select_category`. ✅
- Perfil del profesional dentro de la app: avatar con logo real, chips "Responde por WhatsApp / Acepta efectivo / Cita recurrente", "Sus trabajos" con fotos reales (fallback a gradientes), servicios con duración y precio, badge "Cómo llegar". Evento `view_item`. ✅
- Reserva en una pantalla: día (calendario con días disponibles según horario real), hora (slots de 15 min calculados en vivo contra horario menos citas confirmadas, con colchón de 30 min; ambos parámetros configurables desde admin), "¿Quién te va a atender?" (solo si hay más de una persona), pago (Efectivo, Transferencia con cuentas del negocio y botón Copiar, tPago y Tarjeta como etiquetas), foto del estilo opcional. ✅
- Validación server-side de choque de horario y doble-booking (`UNIQUE(professional_id, appointment_at)`). ✅
- Confirmación "¡Bukeao! 🎉" con ticket, "Te atiende", botón "Cómo llegar", burbuja de WhatsApp simulada. Evento `booking_confirmed` con valor RD$. ✅
- Adjuntar comprobante de pago (JPG/PNG/WEBP/PDF, máximo 5 MB) al confirmar o después. ✅
- "Mis citas" leídas del servidor (`GET /bookings/me`), cancelar cita, ver/adjuntar comprobante, "Cómo llegar" por cita. Evento `booking_cancelled`. ✅
- "Mi cuenta" dentro de Mis citas: cerrar sesión, eliminar cuenta. ✅
- Fila virtual "EN VIVO": pantalla con 3 personas delante y aviso por WhatsApp. 🟡 datos fijos, "Coger mi turno" no persiste.

**Dueño dentro de la app**
- Pestaña "Perfil" separada del panel de negocio (desde 6 de septiembre). Login desde Perfil manda a cuentas de dueño directo al panel. "Tengo un negocio" / "Administrar mi negocio" con ícono de tienda. ✅
- "Mi negocio" nativo con "Mi Cuadre" y botón "Calendario y panel completo" que abre `/negocio` embebido, sin barra "Volver a la app" (se siente parte de la app). ✅
- Wizard corto de creación de negocio (4 pasos) con buscador de sectores reales de Santo Domingo. ✅ (no pregunta atribución todavía)

**Pendientes del lado cliente**
- ⬜ Recordatorios reales por WhatsApp (confirmación + recordatorio pre-cita). Es la brecha más visible frente a BarberTime y Fresha.
- ⬜ Fila virtual con backend.
- ⬜ Política de cancelación con penalidad (hoy se cancela sin restricción).
- ⬜ Mapa dentro de la app (hoy solo en el sitio).
- ⬜ Reseñas reales (los números de rating son sembrados o fijos).
- ⬜ Cita recurrente, "Volver a bukear", favoritos, mensajería cliente↔negocio.
- ⬜ Reserva por diseño en uñas con mini-cotización.

### 9.3 Panel de negocio (`/negocio`)

**Registro (wizard, una pregunta por pantalla, con barra de progreso)**
1. Tu nombre → 2. Nombre del negocio → 3. Sector (buscador de sectores reales) → 4. Categoría → 5. Servicios (al menos uno; nombre, duración en horas/minutos, precio RD$) + "¿Cómo conociste Bukea?" opcional (instagram, tiktok, amigo, google, visita, otro) → 6. Logo (omitible). ✅
- Exige sesión real. `professionals.owner_user_id` liga el negocio a su dueño. Horario por defecto martes a sábado 9 am a 6 pm se siembra al registrar. Geocodificación del sector en segundo plano. Cupo fundador asignado al completar. ✅
- Botón "Omitir por ahora" para cuentas sin negocio (por ejemplo, el admin). ✅
- `GET /api/professionals/me` resuelve el negocio del usuario desde cualquier dispositivo (antes dependía de `localStorage`). ✅

**Pestañas del panel**

| Pestaña | Función | Estado |
|---|---|---|
| Resumen | Contador de citas, "Mi Cuadre" (hoy / 7 días / mes en RD$ y número de citas, calculado sobre `appointment_at`, excluye canceladas) | ✅ |
| Calendario | Vistas Hoy / Semana / Mes, modal de detalle del día, detalle de cita con "Atiende/Atendió", comprobante de pago visible, WhatsApp del cliente, cancelar | ✅ (desde 6 de septiembre) |
| Servicios | Editable: filas con encabezados, duración en desplegable, precio con coma de miles, agregar, guardar (reemplaza todo el set) | ✅ |
| Horario | Lunes a domingo, abierto/cerrado y rango por día | 🟡 un solo rango por día desde la UI (la BD soporta huecos de almuerzo); sin bloqueo de horarios sueltos |
| Equipo | Colaboradores reservables (nombre, rol) además del titular | 🟡 disponibilidad se calcula por negocio, no por colaborador (decisión consciente) |
| Cuentas bancarias | Banco (lista de 15 bancos RD + Otro), tipo (Ahorros/Corriente), número, titular, cédula/RNC. Visibles en perfil público y en el paso de pago | ✅ |
| Redes sociales | Instagram, Facebook, TikTok, sitio web | ✅ |
| Negocio | Logo, galería de fotos (subir/borrar), ubicación exacta con pin arrastrable (Leaflet), "¿Necesitas ayuda?" (ticket por correo a `contacto@bukeard.com`) | ✅ (sin límite de fotos; ticket sin historial) |
| Mi perfil | Cuenta del usuario (nombre, correo, PIN, teléfono) separada de la identidad del negocio | ✅ |
| Mensajes | Hilo de soporte negocio ↔ administración (`support_messages`) | ✅ |

- Notificación push al dueño cuando un cliente reserva (FCM, iOS y Android, tokens obsoletos se borran solos). ✅ probado end-to-end en iPhone físico el 6 de septiembre de 2026.
- 🟡 El panel embebido en mobile ya no se ve como sitio aparte (arreglado 6 de septiembre), pero la vista de calendario en iframe sigue siendo la del escritorio.

### 9.4 Panel de administración (`/admin`)

- Login **solo con Google** (`login-google`). El PIN se eliminó del código el 27 de agosto. Súper administrador fijo `vmdventura@gmail.com` en `lib/super-admin.js`, reparado a `role='admin'` en cada arranque, protegido contra desactivarse a sí mismo. Sesión vence a las 8 horas. `requireAdmin` responde 404 (no 401/403) para no delatar la ruta. ✅

| Módulo | Función |
|---|---|
| Dashboard | Totales y actividad reciente |
| Usuarios | Ver/editar, resetear PIN, activar/desactivar (`disabled_at` bloquea todo método de login), enviar mensaje por WhatsApp o correo, exportar CSV |
| Negocios | Ver/editar, transferir propiedad a otro teléfono, ocultar/republicar (`hidden_at` saca del marketplace pero mantiene `/p/:slug`), crear en nombre de alguien, "Ver panel del negocio" (impersonación con token nuevo), atribución visible, exportar CSV |
| Reservas | Listado con filtros, cancelar, exportar CSV |
| Moderación | Cola de cuentas bancarias con verificar/quitar verificación (badge "✓ Verificada" en perfil público), galería de últimos 100 comprobantes con eliminar |
| Métricas | Crecimiento semanal (12 semanas), embudo de activación, % clientes que repiten, reservas por categoría y sector, top 10 negocios del mes con tasa de cancelación |
| Comunicación | Estado real de WhatsApp Cloud API y SMTP, mensaje de prueba por canal, `message_log` de cada envío. WhatsApp de texto libre solo entrega dentro de la ventana de 24 h de sesión |
| Soporte | Hilos de soporte por usuario (`support/threads`) |
| Configuración | Banner de anuncio del marketplace, colchón de antelación y tamaño de slot de disponibilidad (`platform_settings`) |

Pendientes de baja prioridad: categorías y bancos editables desde Configuración (hoy en código), Fase 3 (auditoría `admin_audit_log`, roles `support`/`moderator`) cuando exista un segundo administrador, login con Apple como alterna a Google.

### 9.5 Notificaciones y canales

| Canal | Uso | Estado |
|---|---|---|
| WhatsApp Cloud API (Meta) | OTP de login (plantilla `codigo_bukea`, Autenticación, Spanish DOM), mensaje manual desde admin | ✅ activo 26 de agosto. Pospago ~RD$0,80/código. Portafolio "bukeard" verificado bajo Advanced Multimedia Service Ams S.R.L. Nombre visible "Bukea" aprobado; marca azul no disponible aún |
| WhatsApp | Confirmación y recordatorio de cita, reprogramar por chat, chatbot de reserva | ⬜ |
| Correo SMTP (`mail.bukeard.com:465`) | Recuperar PIN, verificación de correo, ticket de soporte, correos transaccionales con marca | ✅ activo 26 de agosto |
| Push FCM | Al dueño cuando un cliente reserva | ✅ 6 de septiembre. `FIREBASE_SERVICE_ACCOUNT` en base64 en cPanel (el selector de Node exporta sin comillas y corrompe JSON plano) |
| Google Analytics GA4 | Pageviews + eventos `sign_up`, `login` (por método), `view_item`, `select_category`, `booking_confirmed`, `booking_cancelled`, `business_signup`, `account_deleted` | ✅ |

### 9.6 Pagos
- Bukea **no procesa pagos ni guarda datos de tarjeta**. Muestra las cuentas bancarias del negocio para que el cliente transfiera fuera de la app, y permite adjuntar el comprobante. Efectivo se paga en el local.
- tPago y tarjeta (Azul/CardNET) aparecen como opciones en la reserva pero son etiquetas; la integración es Fase 3.
- Esto simplifica las declaraciones de tienda ("Funciones financieras: no proporciona") y elimina riesgo regulatorio en el arranque.

---

## 10. Requisitos no funcionales

### 10.1 Seguridad
- Sesiones por token (`users.token`); panel de negocio y endpoints de dueño verifican `owner_user_id` (403 si no es el dueño). Cierra el hueco encontrado el 22 de agosto (antes bastaba con el slug en `localStorage`).
- Rate limit en memoria (`lib/rate-limit.js`): login 5 fallos/teléfono → 15 min, 20/IP → 30 min; admin 5/30 min y 10/IP/60 min; `/auth/check` 30/IP/10 min (anti enumeración); `/auth/register` 10/IP/hora.
- `trust proxy` (Passenger), cabeceras `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`. Corrección de XSS y de doble reserva (commit `b405198`).
- PIN con scrypt + salt. OAuth verificado contra JWKS de Google/Apple (audience web `com.bukea.web` y nativa `com.bukea.app`).
- Subidas con `multer`: tipo y tamaño validados (5 MB), rutas fuera de git.
- Soft delete: `users.disabled_at`, `professionals.hidden_at`. Eliminar cuenta anonimiza en vez de borrar.
- Credenciales solo en variables de entorno de cPanel, nunca en `.env` en el servidor.
- Límite operativo de Claude: nunca escribe contraseñas ni acepta términos legales en nombre de Víctor.

### 10.2 Accesibilidad e inclusión
- WCAG AA mínimo: contraste ≥ 4,5:1 cuerpo, ≥ 3:1 texto grande. Objetivos táctiles ≥ 44 px. Legible con brillo bajo y sol directo.
- `prefers-reduced-motion` respetado en toda animación. Foco de teclado visible en todo el sitio (arreglado tras crítica de agosto).
- Todo el copy en español dominicano. Sin multi-idioma previsto.
- Deuda conocida: tarjetas de profesional y servicio en la app son `div` con `onclick` (no botones).

### 10.3 Rendimiento y disponibilidad
- Sitio server-rendered sin framework, indexable. Leaflet desde CDN. Fuentes Google (Fraunces, Plus Jakarta Sans).
- Hosting compartido BanaHosting (cPanel Node.js Selector + Passenger). No es necesariamente el hosting definitivo (decisión pendiente 4.6 del roadmap).
- Notificaciones que fallan nunca tumban la reserva que las disparó (patrón `isConfigured()` en `lib/whatsapp.js`, `lib/mailer.js`, `lib/push.js`).

### 10.4 Reglas de contenido y UI
- Precios siempre en RD$. Copy con dominicanismos naturales ("bukear", "confirmao", "la tarjetica") sin caricatura.
- **Nunca guiones largos, cortos ni medios como separadores en la interfaz.** Usar punto, coma o salto de línea.
- Iconografía exclusivamente Lucide (24×24, `strokeWidth 2`), con excepciones documentadas: logo de WhatsApp y pictogramas de categoría.

---

## 11. Arquitectura técnica

### 11.1 Stack
- **Backend:** Node.js + Express 4, `mysql2`, `multer`, `nodemailer`, `google-auth-library`, `jsonwebtoken` + `jwks-rsa`, `firebase-admin`, `dotenv`.
- **Frontend cliente:** un solo `backend/public/index.html` (~228 KB) con CSS y JS inline, sprite SVG Lucide, PWA (`manifest.json`, pantalla completa, safe areas iOS).
- **Panel de negocio:** `backend/views/negocio.js` (~135 KB) genera el HTML.
- **Panel admin:** `backend/views/admin.js` (~85 KB).
- **Sitio público:** `backend/routes/pages.js` (~96 KB) + `backend/views/shared.js` (`pageShell()`, tokens de diseño, `ICON_SPRITE`, `CAT_LABELS`, `CITY_LABELS`, `FOUNDING_FREE_LIMIT`).
- **Nativo:** Capacitor 6 (`native/`), `build-www.js` genera `www/` desde `backend/public/` sustituyendo `__BASE_PATH__` por `https://www.bukeard.com/app` y los Client IDs. Plugins: `@codetrix-studio/capacitor-google-auth` (parche manual del podspec a GoogleSignIn ≥ 7.1.0 tras cada `npm install`), `@capacitor-community/apple-sign-in@6`, push FCM.

### 11.2 Montaje de rutas
- `BASE = process.env.BASE_PATH` (`/app` en producción). Passenger reenvía la ruta completa, así que Express monta la PWA y `/api/*` bajo `BASE`, y el marketplace, `/negocio`, `/admin` y `/api/admin/*` en la raíz del dominio.
- `index.html` y `manifest.json` se sirven como plantilla con `__BASE_PATH__` sustituido.

### 11.3 Modelo de datos (MySQL `hyghncjr_bukea`)

| Tabla | Propósito |
|---|---|
| `users` | Cuenta única para cliente y dueño: teléfono, nombre, email (+verificación), PIN (salt/hash), `google_sub`, `apple_sub`, `token`, `role` (client/admin), `account_type` (client/owner), `disabled_at`, `admin_token` + `admin_token_expires_at`, `phone_verified_at` |
| `auth_codes` | Códigos de un solo uso por teléfono (WhatsApp) o email (recuperar PIN) |
| `email_verifications` | Tokens de verificación de correo |
| `professionals` | El perfil: slug, categoría, nombre, negocio, sector, rating, `owner_user_id`, `lat/lng`, `logo_path`, redes sociales, `hidden_at`, `referral_source`, `founding_free` |
| `services` | Nombre, duración, `price_cents` por profesional |
| `professional_hours` | Horario semanal (varias filas por día permiten huecos) |
| `collaborators` | Equipo reservable (el titular no vive aquí) |
| `bookings` | Cita: profesional, servicio, colaborador, cliente, `appointment_at` (fuente de verdad), `status` confirmed/cancelled, método de pago, comprobante. `UNIQUE(professional_id, appointment_at)` |
| `professional_bank_accounts` | Banco, tipo, número, titular, cédula/RNC, `verified_at` |
| `business_photos` | Galería 0..N |
| `message_log` | Registro de cada envío WhatsApp/correo |
| `support_messages` | Hilos negocio ↔ admin |
| `platform_settings` | Una fila: banner, colchón y slot de disponibilidad, `demo_cleanup_done` |
| `push_tokens` | Tokens FCM por usuario y plataforma |

Migraciones idempotentes en `db/init.js` (`safeAlter()`, con la excepción del `errno 121` de MariaDB del hosting). El servidor crea/migra tablas y siembra al arrancar; no requiere SSH. Regla: nunca usar `;` dentro de comentarios SQL en `schema.sql`.

### 11.4 API (89 endpoints)
- **Auth (`/app/api/auth`):** `check`, `register`, `login`, `session`, `otp/status|send|verify`, `google`, `apple`, `providers`, `forgot-pin`, `reset-pin`, `verify-email`, `resend-verification`, `change-email`, `change-pin`, `verify-phone/send|verify`, `push-token` (POST/DELETE), `delete-account`.
- **Profesionales (`/app/api/professionals`):** listado con `?category=`, `me`, crear, `:slug` público (incluye servicios, horario, equipo, cuentas bancarias, logo, redes, fotos), `availability/days|times`, `bookings`, `stats`, `profile`, `hours`, `bank-accounts`, `collaborators`, `logo`, `social`, `location`, `photos`, `services`, `messages`.
- **Reservas (`/app/api/bookings`):** crear, `me`, `:id/cancel`, `:id/receipt`.
- **Admin (`/api/admin`):** `login-google`, `me`, `dashboard`, `users*`, `businesses*` (incl. `transfer`, `toggle-hidden`, `impersonate`), `bookings*`, `moderation/*`, `metrics`, `communication/*`, `settings`, `support/threads*`.
- **Páginas:** `/`, `/mapa`, `/p/:slug`, `/negocio`, `/negocios`, `/nosotros`, `/precios`, `/descargar`, `/blog`, `/contacto`, `/privacidad`, `/terminos`, `/admin`.

### 11.5 Disponibilidad
`lib/availability.js`: huecos libres = horario del día menos citas confirmadas, en slots de 15 min, colchón de 30 min para no reservar "para ya mismo" (ambos configurables en `platform_settings`), huso horario de Santo Domingo explícito. `POST /bookings` revalida server-side.

### 11.6 Geocodificación y direcciones
`lib/geocode.js`: Nominatim (OpenStreetMap) por sector, en segundo plano al registrar y backfill de hasta 20 negocios por arranque (1 req/s). `directionLinks()` genera enlaces a Google Maps, Apple Maps y Waze (duplicado en el JS del cliente; mantener en sync). El dueño puede fijar coordenadas exactas arrastrando un pin.

### 11.7 Infraestructura y despliegue
- **Servidor:** BanaHosting, host `single2480a.banahosting.com`, usuario cPanel `hyghncjr`, app en `/home/hyghncjr/bukeard.com/bukea-app/`, Node.js Selector + Passenger, Application URL `bukeard.com` (raíz desde 23 de agosto).
- **Variables de entorno en cPanel:** MySQL, `BASE_PATH=/app`, `GOOGLE_CLIENT_ID`, `APPLE_CLIENT_ID`, `WHATSAPP_TOKEN|PHONE_ID|AUTH_TEMPLATE`, `SMTP_*`, `MAIL_FROM`, `FIREBASE_SERVICE_ACCOUNT` (base64).
- **Despliegue:** no hay CI/CD. Existe un sync automático repo → servidor que Víctor tiene corriendo, pero no siempre recoge los push (27 de agosto y 6 de septiembre se desplegó a mano por el Administrador de archivos de cPanel). Procedimiento manual documentado en memoria `bukea_deploy_produccion` y `CLAUDE.md`. Siempre verificar con `curl` el health y un endpoint dependiente del cambio.
- **Repositorio:** `vmdventura/bukea` (GitHub, privado), rama `main`. Al 8 de septiembre hay cambios sin commitear (push, categorías nuevas, Play Store, `native/android/`).
- **Local:** MySQL de Homebrew con misma base/usuario; `backend/.env` a partir de `.env.example`.

### 11.8 Apps nativas
- **iOS:** Xcode, Team "Advanced Multimedia Service Ams S.R.L." (Team ID `5N43U79UG4`), App ID `com.bukea.app` con Sign in with Apple, Services ID web `com.bukea.web`. Info.plist con descripciones de uso en español, sin cifrado exento, solo vertical, `CFBundleDevelopmentRegion=es`. Mínimo iOS 13.0 (subir a 15.0+ antes de primavera de 2027).
- **Android:** SDK 36, AGP 8.7.3, Gradle 8.9. Keystore de release `native/android/keystore/bukea-release.keystore` (alias `bukea-upload`, válido hasta 2054), **fuera de git e irrecuperable si se pierde**. Credential OAuth Android registrado (SHA-1 debug y release). Apple Sign-In en Android usa el SDK web (el plugin no tiene implementación Android); sin probar en dispositivo real.
- **Tiendas:** Apple Developer y App Store Connect (ficha "Bukea: citas y reservas", 4+, gratis, privacidad declarada con 9 tipos de datos). Google Play Console de organización "AMS Multimedia" (ID `7036363227179558088`, app ID `4974663936078844771`), ficha, Seguridad de los datos, IARC y gráficos completos. Cuenta de prueba para revisores: teléfono `8095550100`, PIN `1234`.

---

## 12. Diseño y marca

### 12.1 Identidad
- **Nombre:** Bukea. Ganó sobre Ponte, Nítido y TuTurno por ser verbalizable, spanglish natural, neutral entre nichos y registrable.
- **Tagline:** "Bukear nunca fue tan fácil". Slogan del hero: "Tu cita, en tus manos" (candidato a eslogan principal).
- **Logo:** "b" itálica serif + wordmark "Bukea", variantes crema y teal (carpeta `Bukea Logo + Linea Oficial`).
- **Personalidad:** boutique de belleza elevada con acento dominicano. Cálida, confiable, cuidada. No plantilla SaaS traducida, no fintech fría, no emojis como iconografía.

### 12.2 Sistema visual (`DESIGN.md`)
- **Color (OKLCH):** teal `#0f8583` primario (30 a 40 % de cada pantalla vía CTAs y estados activos), teal oscuro `#002626` de fondo nativo, dorado `#d99a2b` exclusivo para ratings y logros, verde WhatsApp `#25d366` exclusivo al módulo de WhatsApp, verde efectivo distinto, neutros tintados a teal (no crema genérica).
- **Tipografía:** Fraunces (display, nombres y momentos emocionales) + Plus Jakarta Sans (UI y cuerpo). Escala fija en rem, ratio 1,15 a 1,2.
- **Espaciado y radios:** escala 0,25 a 3 rem; 10 px controles, 16 px tarjetas, 24 px+ contenedores, 999 px píldoras. Sin "card dentro de card".
- **Motion:** 180 a 240 ms ease-out-quart, fade + slide de 8 px, micro-interacciones con propósito. En el sitio público hay entrada orquestada con `IntersectionObserver` (con fallback); en la app no hay animación por scroll.
- **Iconografía:** Lucide exclusivo. Sprites SVG con los `path` oficiales de `lucide-static`. Excepciones: `i-whatsapp` y pictogramas de categoría.
- **Assets:** sin fotografía de stock; avatares con logo real o monograma sobre gradiente con grano.

### 12.3 Dirección abierta (7 de septiembre de 2026)
Reducir dependencia de íconos lineales en `/negocios` y secciones públicas a favor de capturas reales de la app (agenda, Mi Cuadre, WhatsApp) o ilustraciones. Pendiente de decisión de Víctor.

---

## 13. Cronología de lo construido

| Fecha (2026) | Hito |
|---|---|
| 4 jul | Nombre verificado libre en App Store y Google Play. Dominios verificados. Visión, plan y análisis de Fresha |
| 5 jul | Demo v0.1 y v2 premium. Análisis de BarberTime. `bukeard.com` registrado, logo listo. Backend de prueba (Node/Express/MySQL) y "Mi Cuadre" básico. Decisión de arrancar código en paralelo a Fase 0 |
| 15 jul | Migración de la app a `bukeard.com/app` |
| 22 ago | Test comparativo vs Fresha. Análisis de Booksy, CitaApp y Te Resuelvo. Login real del negocio, Google/Apple, disponibilidad real, cancelar citas, editor de horario, marketplace público (código), cuentas bancarias + comprobante, guion de validación con ~25 prospectos. Decisión: lanzamiento gratis |
| 23 ago | Primer despliegue real a producción (bug `errno 121` corregido). Marketplace en vivo en la raíz del dominio. Google y Apple activados. Mapa Leaflet/OSM, "Cómo llegar", colaboradores/equipo, email opcional + recuperar PIN, rediseño premium del sitio, nav/footer/legal/contacto, GA4. Tablero de GitHub Projects |
| 24 ago | Panel de administración Fase 1 y 2. Regla Lucide. Meta configurado para WhatsApp |
| 25 ago | Ampliación del panel de negocio (logo, redes, fotos, ubicación exacta, servicios editables, ticket). Wizard de registro una pregunta por pantalla. Rate limit, eliminar cuenta, Sign in with Apple nativo, Info.plist. Cronograma visual del roadmap |
| 26 ago | WhatsApp OTP activo (método de pago en Meta). SMTP activo. Atribución "¿Cómo conociste Bukea?". Perfil de empresa de WhatsApp, Instagram `@bukeard` conectado |
| 27 ago | Súper admin fijo, `/admin` solo con Google, `/negocios` con franja de dueños. Planes Básico/Plus y programa fundador en `/precios`. Perfil público rediseñado tipo Fresha, Olivercut como negocio real de ejemplo, 4 negocios ficticios de demo, limpieza de negocios de prueba. Capturas y copy ASO |
| 28 ago | Build 1 rechazado por Apple (`ITMS-91061`, manifiesto de privacidad de GoogleSignIn). Build 2 aceptado y **enviado a revisión** |
| 3 sep | Plataforma Android, paridad de login, keystore de release, `.aab` firmado. Ficha completa en Play Console |
| 4 sep | `.aab` subido (SDK 36) y **enviado a revisión de Google Play** (177 países) |
| 6 sep | Cliente vs dueño desde el registro, "Mi perfil" separado de "Negocio", Calendario Hoy/Semana/Mes, horario lunes a domingo, buscador de sectores, push FCM al dueño (backend + nativo, probado en iPhone físico), 3 categorías nuevas (12 en total) desplegadas a mano |
| 7 sep | Presentación de ventajas en markdown. Refactor de `/negocios` con estructura Booksy. Discusión de dirección visual (íconos vs capturas) |

---

## 14. Roadmap y pendientes

### 14.1 Etapas del roadmap (`ROADMAP.md`)

| Etapa | Objetivo | Estado |
|---|---|---|
| 1. Asegurar la marca | `bukea.do` / `bukea.com.do` en nic.do, respaldo internacional, handles, ONAPI (clases 35, 42, 44), reserva en App Store Connect | 🟡 `bukeard.com` registrado, nombre reservado en App Store Connect al crear la ficha, Instagram `@bukeard` existe. Faltan `bukea.do`, ONAPI, resto de handles |
| 2. Preparar la validación | OTP WhatsApp, demo presentable, guion, prospectos, oferta | ✅ completa (WhatsApp activo, guion de 9 preguntas, ~25 prospectos, oferta gratis) |
| 3. Validación en la calle ⭐ | 10 a 15 profesionales con demo en mano, compromisos con nombre y teléfono, decidir ciudad y precio | **⬜ En cero.** Única etapa que no se puede acelerar con código |
| 4. Endurecer el MVP | Lo que un piloto necesita para operar su día completo | 🟡 La mayoría hecho (4.1, 4.2, 4.2b, 4.3, 4.3b, 4.3c, 4.5, 4.8 a 4.15). Faltan 4.4 recordatorios WhatsApp, 4.6 hosting definitivo, 4.7 onboarding asistido por WhatsApp, bloquear horarios sueltos, política de cancelación |
| 5. Piloto en vivo | 5 a 10 negocios, 2 a 4 semanas, medir, fijar precio y cobrar, publicar apps | 🟡 Apps enviadas a revisión; el piloto depende de la Etapa 3 |
| 6. Crecer | Fila virtual, salones multi-empleado, lealtad, reseñas, Mi Cuadre completo, Azul/CardNET, NCF, domicilio, eventos | ⬜ |

**Regla de oro:** las Etapas 1 a 3 mandan. El mayor riesgo no es técnico: es construir algo que nadie usa mientras BarberTime y Fresha ganan densidad en Santo Domingo.

### 14.2 Pendientes técnicos priorizados

| Prioridad | Pendiente | Por qué |
|---|---|---|
| Alta | Recordatorios reales por WhatsApp (confirmación + pre-cita) | Diferenciador prometido en la ficha de las tiendas y en `/negocios`; BarberTime y Fresha ya lo tienen |
| Alta | Activar badges reales en `/descargar` cuando Apple y Google aprueben | Hoy son decorativos |
| Alta | Commitear y subir a GitHub los cambios pendientes (push, categorías, Android, Play Store) | Riesgo de perder trabajo; respaldar keystore Android aparte |
| Media | Fila virtual con backend | Diferenciador 3, hoy solo demo |
| Media | Política de cancelación con penalidad y bloqueo de horarios sueltos | Necesario para operar un piloto real |
| Media | Reseñas reales post-servicio | Los ratings son sembrados; credibilidad del marketplace |
| Media | Mapa dentro de la app | Hoy solo en el sitio |
| Media | Decidir hosting definitivo (BanaHosting compartido vs migrar) | Antes de tener datos de clientes reales; el rate limit en memoria y el deploy manual no escalan |
| Media | Probar Google y Apple login end-to-end en dispositivos reales (TestFlight, Android físico) | No verificado tras actualizar GoogleSignIn 9.2.0 ni en Android |
| Baja | Subir iOS mínimo a 15.0+, quitar iPad/Mac/Vision de destinos, captura de iPad | Apple lo exigirá en primavera de 2027 |
| Baja | Reemplazar `@codetrix-studio/capacitor-google-auth` (RC sin mantenimiento) | Parche manual tras cada `npm install` |
| Baja | Landings SEO categoría × zona, columna ciudad en la BD | Cuando haya densidad |
| Baja | Categorías y bancos editables desde admin, auditoría y roles | Cuando aparezca la necesidad real |
| Baja | Atribución en el wizard corto de la PWA | Hoy solo en `/negocio` |

### 14.3 Pendientes administrativos (solo Víctor)
- Registrar `bukea.do` y `bukea.com.do`; reservar handles faltantes; marca en ONAPI.
- Confirmar estado de revisión en App Store Connect y Play Console; responder al Resolution Center si hay preguntas.
- Revisar por qué el sync automático repo → servidor no recoge todos los push.
- Sincronizar a mano el tablero de GitHub Projects (desactualizado desde 23 de agosto).
- Meta: reintentar agente humano para levantar la restricción publicitaria del portafolio AMS (los anuncios de Bukea pueden correr por el portafolio "bukeard", que no está restringido).
- **Salir a la calle con el guion de `VALIDACION-GUION.md`.**

---

## 15. Riesgos y supuestos

| Riesgo | Impacto | Mitigación |
|---|---|---|
| Construir sin validar (Etapa 3 en cero) | Alto | Congelar features nuevas no críticas hasta tener 10 compromisos reales |
| Fresha y BarberTime ganan densidad en Santo Domingo | Alto | Multivertical + Android + gratis + acompañamiento presencial; evaluar Santiago como ciudad de arranque |
| Rechazo de las tiendas (WebView "funcionalidad mínima", regla 4.2) | Medio | HTML empaquetado, notas al revisor con reserva real, cuenta demo; plan B: más lógica offline |
| Hosting compartido y deploy manual | Medio | Decidir migración (4.6) antes del piloto; documentar procedimiento (hecho) |
| Pérdida del keystore Android | Alto (rompe la cadena de firma) | Respaldar fuera de la máquina; considerar Play App Signing |
| Costo de WhatsApp por mensaje (~RD$0,80/código, más por conversación de utilidad) | Bajo hoy | Plan Plus con "WhatsApp ilimitado" debe cubrirlo cuando haya volumen |
| Datos de prueba visibles en producción (pasó el 24 de agosto) | Medio | Limpieza hecha (`demo_cleanup_done`); 4 negocios ficticios de demo marcados como ejemplo |
| Comisión de Fresha en RD podría ser "Gratis" (la página lo dice) | Medio para el pitch | Verificar con cuenta de negocio antes de seguir diciendo "Fresha cobra 20 %" |
| Supuesto: el teléfono es la identidad principal en RD | Base del login | Confirmado por comportamiento de mercado; email queda opcional |
| Supuesto: la clientela sigue al profesional, no al local | Base del modelo | Validar en la Etapa 3 (pregunta 7 del guion) |

---

## 16. Decisiones tomadas (no re-litigar)

1. Nombre: Bukea.
2. El profesional es el perfil, no el local.
3. Tres diferenciadores: WhatsApp nativo, pagos a la dominicana, fila virtual.
4. Orden de verticales: barbería + uñas → salones → cejas/maquillaje (hoy ya hay 12 categorías abiertas en el marketplace; el marketing dedicado sigue ese orden).
5. Lanzamiento gratis; Básico gratis, Plus RD$500/mes siempre de pago; 50 fundadores con Básico gratis de por vida; cero comisión; gratis para el cliente.
6. Una ciudad hasta tener densidad.
7. Identidad visual teal/dorado/verde WhatsApp, Fraunces + Plus Jakarta Sans, Lucide exclusivo.
8. B2B dominicano (comisión por silla, Cuadre, NCF) como diferenciador de largo plazo.
9. Una sola cuenta para cliente y dueño (Fresha las separa por dominio); se distingue por `account_type`.
10. Mapa con OpenStreetMap/Leaflet, no Google Maps (gratis, sin API key).
11. Disponibilidad por negocio, no por colaborador, hasta que un piloto lo pida.
12. Categorías y bancos fijos en código.
13. Panel admin solo con Google, sin PIN.
14. Bukea no procesa pagos.

## 17. Preguntas abiertas

- ¿Santo Domingo o Santiago como ciudad de lanzamiento? (Etapa 3.4)
- ¿Precio definitivo del Básico después del cupo fundador? (Etapa 5.4)
- ¿Fresha cobra o no comisión por cliente nuevo en RD hoy?
- ¿Se queda BanaHosting o se migra antes del piloto?
- ¿Capturas de app reales o ilustraciones para `/negocios`?
- ¿Mensajería cliente ↔ negocio dentro de la app o vía WhatsApp Business API?
- ¿Se agrega Apple como segunda puerta del panel admin?

---

## 18. Anexos

### 18.1 Glosario
- **Bukear / Bukeao / Confirmao:** reservar / reservado / confirmado, en dominicano.
- **Mi Cuadre:** panel de ventas del negocio (de "cuadrar la caja").
- **La tarjetica:** tarjeta de lealtad (10 cortes = 1 gratis).
- **Walk-in:** cliente que llega sin cita.
- **NCF:** Número de Comprobante Fiscal (DGII).
- **Fundador:** uno de los primeros 50 negocios con Básico gratis de por vida.

### 18.2 Cuentas y accesos de referencia
- Correo maestro: `vmdventura@gmail.com`. Contacto público: `contacto@bukeard.com`. Transaccional: `no-reply@bukeard.com`.
- Redes: `@bukeard` en Instagram, Facebook y TikTok.
- WhatsApp Business: +1 809 466 5692 "Bukea". Meta Business ID `1691207015507833`, Phone Number ID `1252026111331717`.
- Google Cloud proyecto `bukea-506417`. Apple Team ID `5N43U79UG4`. Play Console cuenta `7036363227179558088`.

### 18.3 Documentos fuente en el repo `vmdventura/bukea`
`CLAUDE.md`, `PRODUCT.md`, `DESIGN.md`, `README.md`, `docs/VISION.md`, `docs/PLAN.md`, `docs/ROADMAP.md`, `docs/BUKEA-V3.md`, `docs/CONTEXTO.md`, `docs/VALIDACION-GUION.md`, `docs/TEST-FRESHA.md`, `docs/ANALISIS-SITIO-FRESHA.md`, `docs/FLUJO-REGISTRO-FRESHA.md`, `docs/ANALISIS-SITIO-BOOKSY.md`, `docs/COMPETENCIA-BARBERTIME.md`, `docs/FLUJO-BARBERTIME.md`, `docs/COMPETENCIA-LOCAL-RD.md`, `docs/LOGIN-GOOGLE-APPLE-SETUP.md`, `docs/WHATSAPP-SETUP.md`, `docs/PANEL-ADMIN-PENDIENTES-2026-08-25.md`, `docs/PANEL-NEGOCIO-AMPLIACION-2026-08-25.md`, `docs/BUGS-PRODUCCION-2026-08-24.md`, `docs/APP-STORE-CHECKLIST.md`, `docs/BITACORA-APP-STORE-2026-08-27.md`, `docs/PLAY-STORE-CHECKLIST.md`, `native/README.md`.

### 18.4 Artifacts previos
- Cronograma visual del roadmap: https://claude.ai/code/artifact/6ec5d18e-e86f-4295-a457-2f9777268b1e
- Concepto del panel de administración: https://claude.ai/code/artifact/09e53fa4-fa5b-4298-a340-e88babcef974
- Comparativa de registro vs Fresha: https://claude.ai/code/artifact/d0c793c3-43ad-476f-85d7-d0cc0a43d4dd
