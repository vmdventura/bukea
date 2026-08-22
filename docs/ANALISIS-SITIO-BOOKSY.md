# Análisis del sitio y la app de Booksy

> Recorrido el **22 de agosto de 2026** (`booksy.com/es-us`, `biz.booksy.com/es-us`, `/precios`). Mismo objetivo que [ANALISIS-SITIO-FRESHA.md](ANALISIS-SITIO-FRESHA.md): entender cómo está armado para decidir qué aplica a Bukea. Complementa la fila de Booksy en `docs/VISION.md`.

---

## 1. Lo primero y más importante: Booksy **no opera en República Dominicana**

El selector de región del sitio (`booksy.com` → ícono de bandera arriba a la derecha) lista exactamente estos países: Australia, Alemania, Francia, Países Bajos, Portugal, España, Irlanda, Polonia, Reino Unido, Canadá, Estados Unidos, México, Argentina, Chile, Brasil, Colombia, Sudáfrica. **República Dominicana no está.** Buscar "Santo Domingo" en el buscador solo devuelve negocios de EE. UU. que casualmente se llaman "Santo Domingo Nails Spa" (en Terrytown, NJ) — no hay operación real en el país.

Esto **confirma** (no contradice) lo que ya decía `docs/VISION.md`: *"Booksy: marca fuerte en barbería masculina, pero sin operación real en RD"*. A diferencia de Fresha (que sí tiene decenas de negocios activos en Santo Domingo, ver [TEST-FRESHA.md](TEST-FRESHA.md)), Booksy no es today un competidor directo en el mercado dominicano — es una amenaza latente si decide expandirse a Latinoamérica (ya está en México, Colombia, Argentina, Chile, Brasil).

---

## 2. Estructura del sitio (misma lógica de 4 superficies que Fresha)

| Superficie | URL | Para quién |
|---|---|---|
| Marketplace web | `booksy.com/es-us` | Cliente |
| App de clientes | "Booksy" (iOS/Android) | Cliente |
| Sitio para negocios | `biz.booksy.com/es-us` (+ `/precios`, `/funciones`, `/tipos-de-negocio`) | Dueño (marketing) |
| App/panel de negocio | "Booksy Biz" (iOS/Android/web) | Dueño/equipo |

### 2.1 Home del marketplace
Header simple (buscar · dónde · cuándo · "Iniciar sesión/Registrarse" · "Añade tu negocio a la lista"). Categorías en chips (Peluquería, Barbería, Salón de uñas, Cuidado de la piel, Cejas y pestañas, Masaje, Maquillaje, Bienestar y Day Spa…). Carrusel **"Recomendado"** — casi todas las tarjetas llevan la etiqueta **"Patrocinado"** (a diferencia de Fresha, que mezcla orgánico y destacado, aquí el marketplace se siente más como inventario publicitario). Cada tarjeta: foto, rating, nº de reseñas, dirección completa, a veces "Ahorre hasta 10%". Debajo, bloques de descarga de las dos apps (cliente y Biz) y "Busca especialistas por ciudad" (lista de ciudades de EE. UU. — el mismo patrón SEO que Fresha, por país).

### 2.2 Perfil del negocio
Galería de fotos grande + miniaturas ("Mostrar todas las fotos", +23). Nombre, dirección, rating y nº de reseñas, badges **"Recomendado por Booksy"** y **"Patrocinado"**, **"Empresario"** (verificado). Servicios agrupados en "Servicios más populares" / "Otros servicios" con precio y duración, botón **Agendar** por servicio. Sección de reseñas muy completa: distribución por estrellas, fotos de clientes, filtros, "Cliente verificado" + qué servicio + qué empleado atendió + fecha. Panel lateral: **"Cupones de sesiones"** (paga varias sesiones por adelantado y úsalas cuando quieras — como un bono/paquete), mapa, **"Quiénes somos"** (texto libre del dueño — en el ejemplo, un negocio "solo efectivo" lo dice ahí mismo), horario de apertura, y **"Inicia sesión o crea una cuenta para contactar con este negocio"** (mensajería bloqueada sin cuenta).

### 2.3 Flujo de reserva
Modal de pantalla completa: carrusel de fechas (día por día, con leyenda de disponibilidad) → horas agrupadas por **Mañana / Mediodía / Tarde** con el conteo de slots libres entre paréntesis → carrito lateral "Tu pedido" (servicio, precio, duración, **empleado asignado**, "Agregar otro servicio", total) → Continuar → **login**: correo (con verificación), o **Facebook / Apple** (no ofrece Google en este paso, a diferencia de Fresha). Nunca llegué a completar la reserva (para no crear una cita real).

### 2.4 Sitio "para negocios" (`biz.booksy.com`)
Hero con captura de la app (calendario visual con colores por servicio/empleado) + "Empieza gratis ahora". Tres pilares (parafraseados): **mantén las reservas sin complicaciones**, **libérate de tareas rutinarias**, **construye un negocio del que estés orgulloso**. Cifras: +310.000 profesionales, +44 millones de clientes, **20% más reservas por cliente**, **25% menos ausencias/cancelaciones**. Testimonio en cita. Bloques de funciones (pagos, marketing, calendario, protección contra ausencias) cada uno con su propia página. "Comenzar es fácil" en 3 pasos: configura tu perfil → comparte tu enlace de reserva (QR + botones para Google/redes) → empieza a recibir reservas. FAQ.

### 2.5 Precios (`/precios`) — el dato más útil para Bukea

| Concepto | Booksy |
|---|---|
| **Suscripción** | **US$29,99/mes** — todo incluido, **un solo plan** (no hay niveles "Independiente" vs "Equipo" como Fresha) |
| **Por miembro adicional** | **+US$20/mes cada uno** |
| **Prueba gratis** | 14 días, sin tarjeta |
| **Compromiso** | Ninguno, cancela cuando quieras |
| **Comisión por cliente nuevo del marketplace** | **Ninguna**, a menos que actives **Boost** (opcional): entonces 30% del costo de la primera visita, solo por los clientes que llegaron vía Boost |
| **Procesamiento de pagos** | Móvil 2,69%+$0.30; lector de tarjeta Booksy 2,49%+$0.10; Tap to Pay 2,49%+$0.20; depósito al día siguiente gratis, "pago rápido" (30 min) 1,5% |
| **Todo lo demás** (reservas ilimitadas, recordatorios, marketing por email/SMS —2.000 SMS gratis/mes—, formularios, reservas por Google, informes, listas de espera, protección contra ausencias, tarjetas de regalo, membresías y paquetes) | **Sin costo extra**, incluido en la suscripción base |

**Lectura para Bukea:** el modelo de Booksy es más simple y más honesto que el de Fresha — **una sola tarifa plana, todo incluido, cero comisión por defecto** (la comisión solo aparece si el negocio *elige* pagar por más visibilidad vía Boost). Esto es estructuralmente muy parecido a lo que Bukea ya prometía ("cero comisión, suscripción plana") — y **Bukea ya decidió (22-ago-2026) lanzar gratis**, lo cual todavía va un paso más allá de Booksy y Fresha en el arranque. Cuando llegue el momento de cobrar, el modelo de Booksy (una tarifa + recargo por silla adicional, todo incluido, sin niveles) es una plantilla más simple de copiar que la de Fresha (dos planes con features distintas).

---

## 3. Qué suma al plano de construcción de Bukea

No cambia el plano de rutas/pantallas de [ANALISIS-SITIO-FRESHA.md §5](ANALISIS-SITIO-FRESHA.md) (Booksy tiene la misma arquitectura de 4 superficies), pero aporta detalles concretos a incorporar cuando se construyan:

- **Perfil público**: sección "Quiénes somos" de texto libre (el dueño puede aclarar "solo efectivo", horario especial, etc. sin que sea un campo estructurado) — fácil de agregar al perfil de Bukea.
- **Reseñas con contexto**: mostrar qué servicio y qué profesional atendió en cada reseña (no solo el negocio) — relevante para Bukea porque "el profesional es el perfil".
- **Reserva**: agrupar horas por Mañana/Mediodía/Tarde con el conteo de slots — más legible que una lista plana de horas, aplica directo a ROADMAP 4.2 (fechas/horas reales).
- **"Compartir tu enlace de reserva"** con QR y botones para Google/redes — mismo espíritu que el perfil público compartible `/p/:slug` ya planeado.
- **Cupones de sesiones / paquetes** — Fase 3+, no ahora (ver DESIGN/ROADMAP), pero queda anotado como feature de Booksy y Fresha por igual.
- **Login sin Google** en el paso de reserva (solo correo/Facebook/Apple) — Bukea, en cambio, ya ofrece Google + Apple + teléfono (ver login social 2026-08-22), lo cual es una ventaja de fricción para el mercado dominicano donde el teléfono es la identidad principal.

## 4. Tabla comparativa rápida (Fresha vs Booksy vs Bukea)

| | Fresha | Booksy | Bukea (hoy / decisión) |
|---|---|---|---|
| Opera en RD | Sí, con densidad real | **No** | Sí (objetivo) |
| Precio negocio | RD$360 solo / RD$240 por miembro | US$29,99 + US$20/miembro | **Gratis por ahora** (decisión 22-ago-2026) |
| Comisión por cliente nuevo | Sí (verificar vigencia, ver TEST-FRESHA) | No, salvo Boost opcional (30%) | Ninguna |
| Login cliente | Email, WhatsApp, Google, Apple | Email, Facebook, Apple (no Google) | Teléfono+PIN, Google, Apple |
| Fila / lista de espera | Lista de espera por fecha | Lista de espera (mencionada en features) | Fila **en vivo** (diferenciador, aún demo) |
| Pago sin tarjeta | Depende del negocio | Depende del negocio | Efectivo/transferencia de raíz |
