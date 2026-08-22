# Análisis del sitio y la app de Fresha — plano para recrear los de Bukea

> Recorrido el **22 de agosto de 2026** (web `fresha.com/es` con la cuenta de cliente de Víctor, `partners.fresha.com`, `for-business`, `pricing`). Complementa [TEST-FRESHA.md](TEST-FRESHA.md) (flujo de reserva en detalle) y [FLUJO-REGISTRO-FRESHA.md](FLUJO-REGISTRO-FRESHA.md) (wizard de registro).
>
> Objetivo: entender **cómo está armado Fresha** (website + app) para decidir **qué recrear en Bukea** (`www.bukeard.com` + `/app`), qué no copiar y en qué orden construirlo.

---

## 1. Mapa del ecosistema Fresha

Fresha son **cuatro superficies** que comparten una sola base de datos:

| Superficie | URL / app | Para quién | Qué hace |
|---|---|---|---|
| **Marketplace web** | `fresha.com/es` | Cliente final | Buscar, ver perfiles, reservar, gestionar citas (historial, mensajes, favoritos, billetera) |
| **App de clientes** | iOS / Android ("Fresha") | Cliente final | Lo mismo que el marketplace web, nativo; QR "Obtener la app" en la home |
| **Sitio "para negocios"** | `fresha.com/es/for-business`, `/pricing`, `/tipos de negocio`, `/herramientas` | Dueño/profesional (marketing) | Vender el software: beneficios, cifras, testimonios, precios, FAQ, CTA "Activar ya" |
| **Partner account / app de negocios** | `partners.fresha.com` + app "Fresha for Business" | Dueño/equipo | Calendario, clientes, ventas/TPV, marketing, informes, equipo |

El cliente y el negocio tienen **cuentas distintas** y **entradas distintas** (la home del marketplace tiene arriba a la derecha "Registra tu negocio" → partners). Esta separación es la primera cosa que Bukea debe replicar: hoy `bukeard.com` es una landing de descarga y `/app` mezcla cliente y negocio en la misma PWA.

---

## 2. Anatomía de cada página (marketplace web)

### 2.1 Home (`/es`)
1. **Header**: logo · "Registra tu negocio" · avatar/sesión.
2. **Hero**: título "Reserva servicios de cuidado personal" + **buscador de 3 campos** (tratamiento · ubicación · fecha) + botón Buscar. Debajo, contador vivo "632.210 citas reservadas hoy" (prueba social) y "Obtener la app" (QR en desktop).
3. **Bloques personalizados si hay sesión**: Próximas citas · Volver a reservar (cada cita pasada como tarjeta con un botón) · Visto recientemente.
4. **Carruseles de negocios**: Recomendado / Destacados · **Nuevo en Fresha** · **Tendencia** — tarjetas con foto, nombre, rating, barrio + ciudad, categoría, nº reseñas, corazón de favorito, badge ("Nuevo", "Ofertas", "Destacados"). En RD aparecen decenas de negocios de Santo Domingo (GS Hairdresser 1.728 reseñas, Guelo Barber 1.000, Montibello 2.785, Silv Beauty 652, Billy Boy Barber 131…), Santiago, SD Este, SPM, Hato Mayor, La Vega, Punta Cana.
5. **Descarga la app** (stores) · **Reseñas de clientes** (carrusel) · bloque "La solución n.º 1" con cifras (+1.000 M citas, +130.000 negocios, +120 países, +450.000 profesionales) y CTA "Fresha para negocios".
6. **SEO masivo**: "Buscar por ciudad" (países → ciudades → categoría en ciudad) y lista de categorías. Cada combinación es una landing indexable.
7. Footer con apps, ayuda, legal.

### 2.2 Landing categoría × ciudad (`/lp/es/bt/barberías/do-santo-domingo-…`)
Título SEO ("Los mejores barberos cerca de mí en Santo Domingo"), contador ("Elige entre 5 barberías"), chips de subcategoría, párrafo con rating promedio y precios desde, **tarjetas con 3 servicios y precios visibles**, bloque de reseñas recientes, **FAQ con schema**, texto SEO largo, enlaces a otras ciudades y categorías. Es una máquina de captación orgánica — Fresha aparece en Google por "barbería santo domingo".

### 2.3 Perfil del negocio (`/es/a/olivercut-…`)
Breadcrumb (Inicio › Barberías › RD › Santo Domingo › Negocio) · nombre, rating/"Aún no hay reseñas", **Abierto hasta las 21:00**, dirección + Cómo llegar · compartir/favorito · **galería de fotos** · **Servicios** (nombre, duración, precio, botón Reservar por servicio) · **Equipo** · **Acerca de** (texto del dueño) · **Horario semanal** · "Confirmación instantánea" · mapa · tarjeta flotante "Reservar ahora" con horario y dirección · **Establecimientos cerca** (cross-selling) · categorías en la ciudad.

### 2.4 Flujo de reserva (`…/booking`)
Modal de pantalla completa, 3 pasos con migas (Servicios → Hora → Confirmar), carrito lateral fijo. Detalle en [TEST-FRESHA.md §2](TEST-FRESHA.md). Claves: disponibilidad real en slots de 15 min, lista de espera, política de cancelación y penalidad, comentario opcional, login just-in-time, sin tarjeta si el negocio no la exige.

### 2.5 Cuenta del cliente (`/es/activity`)
Sidebar: Perfil · Historial · Billetera · Mensajes · Favoritos · Formularios · Ajustes. Historial con tabs (Citas, Tarjetas regalo, Membresías, Productos, Bonos) + sección "Lista de espera". Detalle de cita: estado, añadir al calendario, cómo llegar, escribir mensaje, ver lugar, resumen, política, **Cambiar / Cancelar cita**, referencia.

---

## 3. Anatomía del sitio "para negocios"

### 3.1 `/for-business`
Header propio (Tipos de negocio · Herramientas · Precios · Marketplace · **Registrarse** · Menú). Hero "El software n.º 1 para salones y spas" + CTA "Activar ya" / "Ver en acción" + **captura grande del calendario** (desktop + móvil). Logos de Capterra/GetApp/Trustpilot con 4.8. Cifras. Selector por tipo de negocio (Salón, Barbero, Uñas, Spa…). Tres pilares: **Gestionar / Crece / Recibe pagos**. Bloques: software todo en uno, marketplace, testimonios en video y texto, **resultados en %** (26 % más clientes, 89 % menos inasistencias…), servicios de acompañamiento, soporte 24/7, FAQ, "La plataforma que se adapta a tu negocio" (carrusel de verticales), CTA final, descarga de las dos apps.

### 3.2 `/pricing` (precios en RD, vistos el 22-ago-2026)
| Plan | Precio | Incluye |
|---|---|---|
| **Independiente** | **RD$359,95/mes** (7 días de prueba) | 1 columna de calendario, 20 SMS/WhatsApp gratis, 50 emails, soporte email/chat |
| **Equipo** | **RD$239,95 por miembro/mes** | Calendario multi-columna, 20 SMS/WhatsApp por miembro, soporte telefónico, comisiones por ventas, turnos, fichaje, precio/duración por miembro |
| Empresa | a medida (20+ miembros) | |

- **Comunicaciones**: email gratis; SMS/WhatsApp 20 gratis al mes y luego **RD$4,80–19 por WhatsApp**; SMS marketing RD$27,12.
- **Marketplace**: "Clientes habituales: Gratis". En la fila **"Nuevos clientes: se aplica una tarifa única"** la página RD muestra **"Gratis"** — pero el [Help Center](https://www.fresha.com/help-center/knowledge-base/billing-and-fees/188-marketplace-new-client-fees) sigue diciendo que hay una tarifa única con mínimo y máximo "ver página de precios". ⚠️ **Verificar con la cuenta de negocio** antes de seguir usando "Fresha cobra 20 %" en el pitch de Bukea.
- Complementos: fidelidad RD$1.205/centro, reseñas Google RD$365, chat de equipo RD$179/miembro, Insights RD$235/miembro, sincronización RD$9.500/centro.
- Herramientas incluidas en ambos planes: calendario, **listas de espera**, TPV, clientes, formularios, reseñas, **chat con clientes**, inventario, tienda online, facturas, informes, marketing, ofertas, tarjetas regalo, bonos, membresías, app móvil, reservas de grupo, reservas online, enlaces directos, reservas por Facebook/Instagram/Google.

**Implicación para Bukea:** el modelo "RD$500–1.500/mes por silla" queda **por encima** de Fresha (RD$360 solo / RD$240 por silla). Hay que reposicionar: o precio igual/menor con un plan gratis real, o justificar el precio con lo que Fresha no tiene en RD (fila en vivo, Cuadre en pesos, NCF, comisión barbero/dueño, onboarding presencial, WhatsApp ilimitado). **Decisión de Víctor (22-ago-2026): Bukea gratis de momento** para atraer usuarios; el precio se define con datos del piloto. `/precios` arranca entonces como página de "Gratis — sin comisión, sin tarjeta" con el "qué incluye".

### 3.3 `partners.fresha.com/users/login`
Pantalla oscura, "Fresha para profesionales — Crea una cuenta o inicia sesión". **Solo email** (código de verificación) o **Continuar con WhatsApp / Google / Apple**. Enlace "¿Eres cliente? Ir a Fresha para clientes". reCAPTCHA. Una sola pantalla sirve de login y registro.

---

## 4. Dónde está lo nuestro hoy

| Superficie Bukea | Estado 22-ago-2026 |
|---|---|
| **`www.bukeard.com`** (landing) | Página única exportada de Claude Design (JS empaquetado, 676 KB, "Unpacking…"): hero "Tu cita, en tus manos" + 3 pasos (Busca · Bukea · Confirmao) + botones App Store / Google Play (sin apps publicadas) + footer. **Sin buscador, sin negocios, sin enlace a `/app`, sin sección para negocios, sin precios, sin SEO por categoría/ciudad.** No está en el repo (subida por FTP). |
| **`www.bukeard.com/app`** (PWA) | Cliente + negocio en una sola PWA: onboarding por categoría, listado, perfil, reserva (fechas fijas), registro teléfono+PIN, Mis citas (localStorage), Fila (demo), Únete/Mi negocio (sesión por slug sin clave). Ver [TEST-FRESHA.md §3](TEST-FRESHA.md). |
| App nativa | Envoltorio Capacitor iOS que carga `/app` (no publicado). |

---

## 5. Plano: qué recrear en Bukea

Principio: **misma arquitectura de superficies que Fresha, con la identidad y las reglas de Bukea** (el profesional es el perfil, pesos, efectivo/transferencia, WhatsApp, fila, cero comisión). No copiar el look de Fresha (violeta/negro) — usar el sistema de [DESIGN.md](../DESIGN.md) (teal, crema, Fraunces/Plus Jakarta).

### 5.1 Website `www.bukeard.com` — de landing a marketplace público

| Ruta | Página | Equivalente Fresha | Contenido | Prioridad |
|---|---|---|---|---|
| `/` | **Home marketplace** | `/es` | Header (logo · "Para negocios" · Entrar) · hero con **buscador** (servicio · zona de Santo Domingo · fecha) · chips de categorías (barbería, uñas, salón, cejas, maquillaje) · carruseles **Cerca de ti / Nuevos en Bukea / Mejor valorados** con tarjetas reales de la BD · "Así funciona" (3 pasos actuales) · bloque **"Para negocios: cero comisión"** con CTA · reseñas · descarga/instalar PWA · footer con categorías × zonas | **P1** |
| `/p/:slug` | **Perfil público del profesional** | `/es/a/:slug` | Foto/portafolio, nombre + negocio + barrio, rating, **Abierto hasta…**, dirección + cómo llegar, servicios con Bukear, horario semanal, acerca de, "Profesionales cerca". **Compartible** (el barbero lo pega en su bio de Instagram/WhatsApp → reemplaza la URL de Fresha). Abre el flujo de reserva | **P1** |
| `/:categoria/:zona` | **Landings SEO** ("Barberías en Santo Domingo", "Uñas en Piantini") | `/lp/es/bt/…` | Título, contador, tarjetas con 3 servicios y precios, reseñas, FAQ con schema, enlaces cruzados | P2 (cuando haya ≥5 negocios por categoría) |
| `/negocios` | **Para negocios** | `/for-business` | Hero "Tu agenda, tu clientela, cero comisión" + captura del panel · pilares **Agenda / Cuadre / WhatsApp** · cifras reales cuando existan · tipos de negocio · comparativa honesta vs Fresha/BarberTime · testimonios de pilotos · FAQ · CTA "Únete gratis" | **P1** (es lo que se enseña en la validación) |
| `/precios` | Precios | `/pricing` | "Bukea es gratis": sin suscripción, sin comisión, sin tarjeta; qué incluye; "cuando cobremos, los fundadores mantienen condiciones especiales" | P1 |
| `/entrar` · `/negocio/entrar` | Entradas separadas cliente / negocio | `fresha.com` vs `partners.fresha.com` | Cliente: teléfono + PIN/OTP WhatsApp. Negocio: teléfono o email + clave, OTP por WhatsApp | P1 (va con ROADMAP 4.1) |

Implementación sugerida: estas páginas las sirve **el mismo Express** (`backend/`) con plantillas del servidor (HTML real, indexable), leyendo la misma MySQL. La landing actual empaquetada se retira (o se guarda el diseño como referencia en `prototype/`).

### 5.2 App (`/app`) — separar cliente y negocio

| Pantalla | Equivalente Fresha | Qué cambiar respecto a hoy | Prioridad |
|---|---|---|---|
| Inicio cliente | Home app | Añadir buscador y "Próximas citas / Volver a bukear" (del servidor, por usuario) | P1 |
| Perfil + reserva | Booking modal | **Fechas y horas reales** (horario del profesional + ocupación), slots de 15/30 min, política de cancelación, comentario opcional, lista de espera cuando no hay hora (precursor de la fila) | **P1** (ROADMAP 4.2) |
| Mis citas | Historial | Del servidor; detalle con cambiar/cancelar, añadir al calendario, cómo llegar, volver a bukear, escribir por WhatsApp | P1 (4.2b / 4.3b) |
| Cuenta | Perfil / Ajustes / Favoritos | Nombre, teléfono, favoritos, cerrar sesión | P2 |
| **Panel negocio** (`/negocio`) | Partner app | Sacarlo de la PWA de cliente a su propia ruta con **login real** (4.1); calendario por día con citas, confirmar/cancelar/bloquear (4.3); servicios y horario editables; Cuadre; enlace "Compartir mi perfil" (`/p/:slug`) | **P1** |
| Registro negocio | Wizard partners | Una pregunta por pantalla: teléfono + OTP → nombre → negocio/categoría → servicios → horario → dirección → foto → listo (4.7) | P1-P2 |
| Fila virtual | (Fresha solo lista de espera) | Mantener como diferenciador, pero conectarla a datos reales | P2 (6.1) |

### 5.3 Lo que NO conviene copiar ahora
Tarjetas regalo, membresías, bonos, tienda de productos, inventario, TPV, formularios de consulta, multi-sede, HIPAA/ISO. Son Fase 3+ o nunca; Fresha los tiene porque lleva 10 años y 130.000 negocios.

---

## 6. Orden de construcción propuesto

1. **Backend primero** (desbloquea todo): horario por profesional + disponibilidad real + citas con fecha real (4.2), login real del negocio (4.1), citas del cliente por usuario (4.2b), cambiar/cancelar (4.3/4.3b).
2. **Perfil público `/p/:slug`** compartible + **home marketplace `/`** con buscador y tarjetas reales (reemplaza la landing actual).
3. **`/negocios` + `/precios`** con el mensaje decidido por Víctor — es la pieza para la validación en la calle (ROADMAP Etapa 2–3).
4. **Panel de negocio** separado con calendario operable.
5. Landings SEO por categoría × zona cuando haya densidad.

Cada paso se valida repitiendo el [TEST-FRESHA.md](TEST-FRESHA.md) sobre el flujo afectado.
