# Bukea

Plataforma de reservas ("bukear" = to book, dominicanizado) para barbería, uñas, salones, cejas y maquillaje en República Dominicana. Marketplace de consumo + herramienta B2B, con cero comisión por cliente nuevo.

## Reglas de trabajo

- **Toda la comunicación, documentación, commits y copy del producto en español** (español dominicano para el copy de la app: "bukear", "confirmao", "la tarjetica").
- Precios siempre en RD$ (pesos dominicanos).
- El dueño del proyecto es Víctor (vmdventura).
- **Nunca uses guiones largos (`—`), guiones cortos (`-`) ni guiones medios (`–`) como separadores de texto, títulos o subtítulos en la interfaz de usuario.** Si hace falta separar frases o ideas en copy visible al usuario, usa un punto, una coma o un salto de línea. (No aplica a usos que no son separadores: palabras compuestas con guion, nombres de clase/CSS, atributos HTML, código, ni a rangos horarios tipo "9:00 - 6:00" si ya son el estándar del producto — ante la duda, preguntar.)

## Estructura del repositorio

| Ruta | Contenido |
|---|---|
| `docs/VISION.md` | Visión completa: nombre, competencia (Fresha, BarberTime…), diferenciadores, verticales, modelo de negocio |
| `docs/VALIDACION-GUION.md` | Guion de 9 preguntas, hoja de registro y lista de ~25 prospectos reales (Fresha, CitaApp) para la validación de calle (ROADMAP Etapa 2-3) |
| `docs/LOGIN-GOOGLE-APPLE-SETUP.md` | Pasos exactos (Google Cloud Console, Apple Developer) para activar `GOOGLE_CLIENT_ID`/`APPLE_CLIENT_ID` — el código ya soporta login con Google y Apple, degrada solo a "Próximamente" mientras falten |
| `docs/COMPETENCIA-LOCAL-RD.md` | CitaApp y Te Resuelvo — competidores dominicanos nativos (a diferencia de Fresha/Booksy). CitaApp ya tiene calendario con disponibilidad real por US$5–15/mes |
| `docs/ANALISIS-SITIO-BOOKSY.md` | Análisis de Booksy: confirma que **no opera en RD**, su modelo de precios (US$29,99 + US$20/miembro, cero comisión salvo Boost opcional) y detalles de UI aprovechables |
| `docs/ANALISIS-SITIO-FRESHA.md` | Mapa del ecosistema Fresha (marketplace, app, sitio para negocios, precios RD) y plano para recrear website + app de Bukea, con orden de construcción |
| `docs/TEST-FRESHA.md` | Protocolo y resultados del test comparativo Bukea vs Fresha (primer recorrido 2026-08-22) — repetir al cerrar cada etapa del roadmap |
| `docs/PLAN.md` | Plan del proyecto: estado actual, Fase 0 (fundación), roadmap MVP en 3 fases, reglas estratégicas — **mantener actualizado al completar tareas** |
| `docs/PANEL-ADMIN-PENDIENTES-2026-08-25.md` | Pendientes del panel de administración (Fase 1 y 2 ya construidas y en producción): login del panel sin Google/Apple, categorías/bancos fijos en código, Fase 3 sin empezar |
| `prototype/demo.html` | Demo interactivo v0.1 (HTML autocontenido, sin backend): primera pasada, mantenido como referencia histórica |
| `prototype/demo-v2.html` | Demo premium v2: misma navegación, pulido de tipografía (Fraunces + Plus Jakarta Sans), iconografía SVG real, color OKLCH y micro-interacciones — ver `DESIGN.md` |
| `PRODUCT.md` / `DESIGN.md` | Contexto de producto y sistema de diseño para trabajo con la skill `impeccable` |
| `backend/` | MVP backend real (Node/Express + MySQL) — perfiles de profesionales, reservas persistidas, login (teléfono+PIN, Google, Apple). Desplegado en producción de prueba, ver abajo |
| `native/` | Envoltorio nativo iOS con **Capacitor**: la app carga `www.bukeard.com/app` en vivo en un WKWebView, se instala en el simulador/dispositivo como app real (`com.bukea.app`) y es el proyecto base para el App Store. Ver `native/README.md` para compilar. Pods y artefactos de build están gitignored. |

## Decisiones ya tomadas (no re-litigar)

1. **El profesional es el perfil, no el local** — la clientela sigue al barbero/manicurista si se muda.
2. **Tres diferenciadores:** WhatsApp nativo (API de WhatsApp Business), pagos a la dominicana (efectivo/transferencia/tPago primero, tarjeta vía Azul/CardNET después), fila virtual para walk-ins.
3. **Orden de verticales:** barbería + uñas primero → salones → cejas/maquillaje.
4. **Modelo:** **lanzamiento 100 % gratis** (decisión 2026-08-22) para ganar densidad; después suscripción plana en pesos por silla (rango a fijar con datos del piloto; Fresha cobra RD$240–360/mes en RD), cero comisión, gratis siempre para el cliente final.
5. **Geografía:** una sola ciudad (Santo Domingo o Santiago) hasta tener densidad.
6. **Identidad visual del demo v0.1:** teal `#0f8583` como color primario, dorado `#d99a2b` para ratings, verde WhatsApp para mensajería. Tipografía system stack.

## Estado (2026-08-22)

- ✅ Visión, plan y demo v0.1 en el repo
- ✅ Nombre "Bukea" libre en App Store y Google Play (verificado 2026-07-04)
- ✅ Dominios verificados libres: `bukea.do`, `bukeard.com` (el .com principal), `getbukea.com`, `bukeaapp.com` — **sin registrar aún**
- ✅ Backend real de prueba (Node/Express + MySQL) desplegado en `https://www.bukeard.com/app/` (antes en `vmdventura.com/bukea`, hoy 404) — Víctor decidió arrancar el código en paralelo a la Fase 0 (ver decisión en `docs/PLAN.md`), no porque el criterio de salida se haya cumplido
- ⬜ Stack tecnológico definitivo sin decidir (el backend de prueba corre en hosting compartido de Víctor — BanaHosting/cPanel con Node.js Selector — no necesariamente el hosting final del MVP)
- ⬜ Fase 0 sigue pendiente: dominios sin registrar, marca ONAPI, validación con 10–15 profesionales

## Backend de prueba (`backend/`)

- Stack: Node.js + Express + MySQL (`mysql2`), con login (teléfono+PIN, Google, Apple — ver "Login" abajo) y disponibilidad real (ver "Fechas y horarios reales" abajo), datos semi-fijos (tres profesionales de prueba: Joel "El Fino" Batista, Yesenia Rodríguez, Carmen la Estilista).
- Endpoints (prefijo `BASE`, en producción `/app`): `GET /app/api/professionals?category=`, `GET /app/api/professionals/:slug` (público), `GET /app/api/professionals/:slug/availability/days` y `/availability/times` (disponibilidad real, público), `GET /app/api/professionals/:slug/stats` y `/bookings` (**requieren `Authorization: Bearer <token>` del dueño**), `POST /app/api/professionals` (crear negocio, **requiere sesión**), `POST /app/api/bookings` (**requiere sesión**), `GET /app/api/bookings/me` (**requiere sesión**), `POST /app/api/bookings/:id/cancel` (**requiere sesión** — cliente dueño de la cita o dueño del negocio), `POST /app/api/auth/{check,login,register,google,apple}`, `GET /app/api/auth/providers`, `GET /app/api/health`.
- Sirve también el frontend (`backend/public/index.html`, copia de `prototype/demo-v2.html` adaptada para consumir la API real en vez de datos hardcodeados).
- Desplegado en el hosting de Víctor (BanaHosting, cPanel con Node.js Selector), expuesto en `https://www.bukeard.com/app/` (migrado el 2026-07-15 desde `vmdventura.com/bukea`). Como Passenger reenvía la ruta completa sin recortar el prefijo, Express monta todo bajo `BASE` (= `process.env.BASE_PATH`, por defecto `/bukea`; en producción debe ser `/app`). `index.html` y `manifest.json` se sirven como plantilla: el servidor sustituye `__BASE_PATH__` por `BASE` (`API_BASE` en el JS del frontend, `start_url`/`scope` del manifest), así el mismo código corre en cualquier prefijo.
- Credenciales de MySQL viven como variables de entorno en el panel de Node.js de cPanel (no en un `.env` en el servidor, para no exponer la contraseña en un directorio web). Localmente, `backend/.env` (gitignored) las replica para desarrollo — usar `backend/.env.example` como plantilla. **Ojo:** si la contraseña contiene `#`, va entre comillas en el `.env` (dotenv corta el valor en un `#` sin comillas). Para desarrollo local existe un MySQL de Homebrew con la misma base/usuario/contraseña que producción (creado 2026-07-05); arrancar con `brew services start mysql`.
- Al arrancar, el servidor crea/migra las tablas (`backend/db/schema.sql` + migraciones idempotentes en `backend/db/init.js`) y siembra los profesionales de prueba si no existen — no requiere ejecutar un script aparte por SSH.

## Login (2026-08-22)

`users` acepta tres formas de entrar — teléfono+PIN, Google y Apple — todas emiten el mismo `token` de sesión (`backend/lib/oauth.js` verifica los idToken contra Google/Apple; `routes/auth.js` crea o vincula la cuenta por `google_sub`/`apple_sub`/email). El panel de negocio ("Mi negocio") ahora **exige esa sesión**: `professionals.owner_user_id` liga cada negocio a su dueño, y `/stats`/`/bookings` devuelven 403 si el token no es el del dueño — cierra el hueco de seguridad que encontró `docs/TEST-FRESHA.md` (antes bastaba con poner el slug de otro negocio en `localStorage`). Los negocios sembrados por `db/init.js` (Joel, Yesenia, Carmen) no tienen dueño real — su panel no es accesible hasta registrarlos de nuevo con una cuenta.

Google/Apple necesitan credenciales que solo Víctor puede crear — ver `docs/LOGIN-GOOGLE-APPLE-SETUP.md`. Sin ellas, esos botones se ven como "Próximamente" y el teléfono+PIN sigue funcionando igual.

## Fechas y horarios reales (2026-08-22)

Reemplaza las etiquetas fijas ("Hoy", "Mañana", 4 horas fijas) que tenía el flujo de reserva desde el 5-jul — motivado por `docs/COMPETENCIA-LOCAL-RD.md`: CitaApp (competidor local mucho más simple) ya tenía esto resuelto.

- `professional_hours` guarda el horario semanal (varias filas por día permiten un hueco de almuerzo). Se siembra por defecto (martes a sábado 9am-6pm) al registrar un negocio (`lib/hours.js`) — **todavía no hay pantalla para editarlo**, es la próxima pieza obvia.
- `lib/availability.js` calcula los huecos libres en vivo: horario del día − citas ya confirmadas, en slots de 15 min, con un colchón de 30 min para no reservar "para ya mismo". Todo en huso horario de Santo Domingo, sin depender del huso del servidor.
- `bookings.appointment_at` es ahora la fuente de verdad (antes `day_label`/`time_label` eran texto libre); esos dos campos se siguen devolviendo en las respuestas de la API pero calculados a partir de `appointment_at`. `UNIQUE (professional_id, appointment_at)` evita el doble-booking a nivel de base de datos, y `POST /bookings` revalida el horario server-side antes de insertar.
- `bookings.status` (`confirmed`/`cancelled`) + `POST /api/bookings/:id/cancel` (cliente dueño de la cita o dueño del negocio) — cierra ROADMAP 4.3b.
- `GET /api/bookings/me` reemplaza el `localStorage` de "Mis citas" del cliente — cierra 4.2b.
- "Mi Cuadre" (`/:slug/stats`) pasó de calcular sobre `created_at` a calcular sobre `appointment_at` (con `created_at` de respaldo para reservas viejas sin fecha real), excluyendo canceladas.
- **Pendiente, a propósito fuera de esta pasada:** bloquear horarios sueltos (excepciones puntuales al horario semanal) y política de cancelación con penalidad (hoy se cancela sin restricción). ~~pantalla para editar el horario semanal~~ — resuelto la misma noche, ver abajo.

## Editar horario semanal (2026-08-22 noche)

`GET`/`PUT /api/professionals/:slug/hours` (dueño únicamente) + sección "Mi horario" en el panel de negocio: 7 días con casilla abierto/cerrado y hora de apertura/cierre. `PUT` reemplaza todas las filas de `professional_hours` del negocio — valida día (0-6), formato de hora y que el cierre sea después de la apertura. **Limitación consciente:** un solo rango por día en esta pantalla (el horario con hueco de almuerzo que trae el default sembrado se puede tener en la base de datos, pero editarlo desde aquí lo colapsa a un rango). Probado: guardar desde la UI persiste, la disponibilidad (`/availability/days`) refleja el cambio al instante, otro usuario no puede editar el horario de un negocio ajeno (403).

## Marketplace público (2026-08-22 noche)

`bukeard.com` deja de ser una landing estática y pasa a ser un marketplace de verdad, server-rendered (indexable, sin JS de framework), servido por el mismo Express que la app — `backend/routes/pages.js` + `backend/views/shared.js` (estilos y `pageShell()` compartidos, mismos tokens que `DESIGN.md`).

- `GET /` — home con buscador (`?q=`), chips de categoría (`?categoria=`) y tarjetas reales de la BD.
- `GET /p/:slug` — perfil público compartible de cada profesional (servicios, horario, badges, meta tags OG). Pensado para que el profesional lo pegue en su bio de Instagram/WhatsApp en vez del enlace de Fresha o CitaApp.
- `GET /negocios` — página "para negocios" (lo que se enseña en la validación de calle).
- `GET /precios` — "Bukea es gratis" con el detalle de qué incluye.
- Las cuatro enlazan HACIA la app (`BASE`) para reservar o unirse: `${BASE}/?pro=slug` abre ese perfil dentro de la PWA, `${BASE}/?join=1` abre "Únete a Bukea" — soportado por un hook nuevo en `boot()` de `index.html` que lee esos query params antes de mostrar el splash.
- Probado en local: las 4 páginas responden 200 (404 en perfil inexistente), búsqueda y filtro por categoría funcionan, ambos deep-links funcionan, mobile responsive.

### ⚠️ Falta un paso de despliegue que solo Víctor puede hacer

Estas páginas nuevas viven en el **mismo** proceso Node que ya sirve `/app` — pero hoy, en producción, el dominio `bukeard.com` (raíz) apunta a un hosting **estático separado** (la landing vieja, subida por FTP, fuera de este repo), mientras que el Node app en cPanel solo está montado en la URI `/app`. Para que `bukeard.com/`, `/p/:slug`, `/negocios` y `/precios` queden en vivo, hace falta uno de estos dos cambios en cPanel (Setup Node.js App), que no puedo hacer sin acceso:

1. **Recomendado:** cambiar la "Application URL" del Node app de `bukeard.com/app` a `bukeard.com` (la raíz) — Passenger entonces enruta todo el dominio a este Express, que ya sabe servir `/app/*` (la PWA, vía `BASE`) y `/`, `/p/*`, `/negocios`, `/precios` (el marketplace). Probablemente haya que mover o borrar los archivos de la landing vieja del docroot para que no la tapen.
2. **Alternativa** si (1) da problemas: dejar el dominio raíz como está y exponer el marketplace en un subpath propio (ej. `bukeard.com/inicio`) — requiere ajustar los enlaces internos de `pages.js` (hoy asumen que viven en la raíz) y es un cambio de código adicional, no solo de configuración.

**Resuelto 2026-08-23.** Se cambió la "Application URL" del Node app de `bukeard.com/app` a `bukeard.com` (raíz) en *Setup Node.js App* (con Víctor logueado en su Chrome), y se renombró `index.html` (la landing vieja, 660 KB) a `landing-vieja-backup.html.bak` en `/home/hyghncjr/bukeard.com/` para que no le tapara la ruta `/` a Express. Reiniciado y verificado con `curl`: `/`, `/app`, `/negocios` y `/precios` responden 200 con el contenido nuevo (no la landing vieja). También quedó un `.htaccess` vacío (0 bytes) en `bukeard.com/bukea/` — resto de la migración del 15-jul desde `vmdventura.com/bukea`, inofensivo, se puede borrar cuando se limpie el hosting.

## Cuentas bancarias y comprobante de pago (2026-08-22 noche)

A pedido de Víctor tras ver capturas de Fresha/Google Maps: reforzar "transferencia" como método de pago de primera clase.

- **Cuentas bancarias**: `professional_bank_accounts` (banco, tipo, número, titular, **cédula/RNC del titular** — agregado 2026-08-23 a pedido de Víctor, así se verifica el destinatario como en una transferencia dominicana real) — `GET`/`PUT /api/professionals/:slug/bank-accounts` (dueño), y públicas dentro de `GET /api/professionals/:slug` (`bankAccounts[]`) porque el negocio las comparte a propósito para que le paguen. Editable desde "Mi negocio" con **banco y tipo de cuenta como listas desplegables** (`BANK_NAMES`/`ACCOUNT_TYPES` en `index.html` — banco incluye "Otro" con campo libre para cooperativas/bancos no listados); visibles en el perfil público (`/p/:slug`) y en el paso de pago de la reserva (con botón "Copiar" por cuenta) cuando el cliente elige "Transferencia".
- **Comprobante de pago**: `bookings.receipt_path` + `POST /api/bookings/:id/receipt` (multipart, solo el cliente dueño de la cita, `multer`, valida tipo — JPG/PNG/WEBP/PDF — y tamaño máx. 5MB, guarda en `backend/public/uploads/receipts/` servido está bajo `BASE` por el `express.static` que ya existía). Se puede adjuntar al confirmar la reserva o después desde "Mis citas" ("Adjuntar comprobante" / "Ver comprobante"); el negocio lo ve en su agenda pero no lo sube.
- `backend/public/uploads/receipts/*` está en `.gitignore` (son archivos de usuarios, no código) — la carpeta se versiona vacía con `.gitkeep`.

**Búsqueda por mapa (2026-08-23):** `professionals` gana `lat`/`lng`. `lib/geocode.js` geocodifica el **sector** (no hay campo de dirección exacta todavía) contra Nominatim/OpenStreetMap — gratis, decisión de Víctor. Se geocodifica en dos momentos: (a) al registrar un negocio, en segundo plano sin bloquear la respuesta; (b) al arrancar el servidor, `backfillMissingCoordinates()` en `db/init.js` completa hasta 20 negocios sin coordenadas por arranque (respetando el máximo de 1 solicitud/segundo de Nominatim). Nueva página **`/mapa`** en `bukeard.com` (Leaflet + tiles de OpenStreetMap, sin API key): mismos chips de categoría que el home, pines con popup (nombre, negocio, rating, "Bukear cita" → `?pro=slug`, "Ver perfil" → `/p/:slug`). Enlace "Ver en mapa" desde el home; "Ver como lista" de vuelta.

**Limitación consciente:** las coordenadas son a nivel de sector/barrio (centroid), no de dirección exacta — dos negocios en el mismo sector caen en el mismo pin. Subir la precisión requiere agregar un campo de dirección real al registro y volver a geocodificar. **Tampoco está en la app (PWA) todavía** — el mapa vive solo en el sitio web `bukeard.com/mapa`; llevarlo a la app es la extensión natural una vez validado.

## "Cómo llegar" (2026-08-23)

A pedido de Víctor tras ver una captura de Fresha (hoja con "Abrir con Apple Maps" / "Abrir con Google Maps"). `lib/geocode.js` exporta `directionLinks(name, neighborhood, lat, lng)` — arma los tres enlaces (Google Maps, Apple Maps, Waze) con coordenadas reales si el negocio ya está geocodificado, o una búsqueda por texto (nombre + sector) si no. El mismo cálculo vive duplicado en `index.html` (`directionLinks()` en JS de cliente) porque el navegador no puede `require()` el módulo de Node — ambas copias deben mantenerse en sync si cambia la lógica.

Dónde aparece: badge "Cómo llegar" en el perfil del profesional (app), botón en el ticket de confirmación, botón por cita en "Mis citas", y una sección con los 3 botones en el perfil público `/p/:slug`. En la app usa una hoja (`#directions-sheet`, mismo patrón visual que el onboarding); en el sitio web son enlaces directos.

## Colaboradores / equipo (2026-08-23)

A pedido de Víctor tras ver una captura de Fresha ("Equipo": Flamante, Yenifer, Billy en Billy Boy Barber) — adelanta parte de la Fase 2 del `docs/PLAN.md` porque quería mostrarlo pronto. Primer quiebre real de "el profesional es el perfil" (decisión 1 de este archivo): un negocio (típicamente categoría `salon`) puede tener **personas adicionales reservables** además del titular, que sigue siendo el dueño del perfil.

- `collaborators` (`professional_id`, `name`, `role`) — el titular **no** vive en esta tabla, es siempre `professionals.name`; la API antepone un objeto `{id: null, name, role: 'Titular'}` al listar el equipo, así el cliente y el negocio ven una sola lista (titular + colaboradores).
- `bookings.collaborator_id` (nullable, `ON DELETE SET NULL`) — `null` significa "atiende el titular". `POST /api/bookings` valida que el `collaboratorId` recibido pertenezca al mismo negocio antes de insertar (evita colar el id de un colaborador de otro profesional).
- `GET`/`PUT /api/professionals/:slug/collaborators` (dueño únicamente, mismo patrón reemplazar-todo que `/bank-accounts`) + sección "Mi equipo" en "Mi negocio".
- **Decisión consciente: la disponibilidad se calcula a nivel de negocio, no por colaborador.** Todos comparten el mismo `professional_hours` y las mismas citas ocupan el mismo calendario — si Flamante y Yenifer atienden a la vez, el sistema hoy no lo distingue (una cita a las 9am con cualquiera de los dos bloquea igual ese horario para el negocio completo). Suficiente para mostrar "quién te atiende" sin construir un calendario por persona; separar la disponibilidad por colaborador es la extensión natural si un piloto lo necesita.
- Dónde aparece: paso "¿Quién te va a atender?" en la reserva (solo se muestra si el negocio tiene más de una persona — titular + colaboradores — no aporta nada con uno solo), "Te atiende" en el ticket de confirmación, "Atiende"/"Atendió" en "Mis citas" y en la agenda de "Mi negocio", sección "Equipo" (avatares con iniciales) en el perfil público `/p/:slug`.

## Email en el registro + recuperar PIN (2026-08-23)

A pedido de Víctor: el teléfono sigue siendo la base del login y de las confirmaciones por WhatsApp (no se toca), pero ahora "Crear mi cuenta" tiene un campo de **correo opcional** (`users.email`) — sirve hoy solo para recuperar el PIN si se olvida, y deja la puerta abierta a campañas de email más adelante.

- `backend/lib/mailer.js` — envío por SMTP (`nodemailer`), mismo patrón que `lib/whatsapp.js`: si faltan `SMTP_HOST`/`SMTP_PORT`/`SMTP_USER`/`SMTP_PASSWORD`/`MAIL_FROM` en el entorno, `isConfigured()` da `false` y el endpoint responde 503 sin romper el resto del login.
- `POST /api/auth/forgot-pin` (body `{email}`) manda un código de 6 dígitos por correo (vence en 15 min, máx. 3 intentos cada 10 min, mismo patrón anti-abuso que el OTP de WhatsApp). `POST /api/auth/reset-pin` (body `{email, code, newPin}`) verifica el código y cambia el PIN, con sesión automática.
- `auth_codes` ahora sirve para dos cosas — código de WhatsApp (por `phone`) o código de recuperación (por `email`) — nunca los dos en la misma fila; `phone` pasó a ser opcional en esa tabla.
- Pantalla nueva "¿Olvidaste tu PIN?" en el login (enlace debajo de "Iniciar sesión"): pide el correo, muestra el campo de código + PIN nuevo, y entra a la sesión automáticamente al cambiarlo.
- ~~Falta activarlo en producción~~ — **✅ Activo desde el 2026-08-26**: buzón `no-reply@bukeard.com` creado en el hosting (cPanel → Email Accounts) y variables `SMTP_HOST=mail.bukeard.com`, `SMTP_PORT=465`, `SMTP_USER`/`MAIL_FROM=no-reply@bukeard.com` + `SMTP_PASSWORD` en Setup Node.js App. El certificado de `mail.bukeard.com` cubre `*.bukeard.com` (sin problemas de TLS). Verificado con un código real entregado al correo de Víctor.

## Panel de administración general (2026-08-24)

Fase 1 del concepto (dashboard, usuarios, negocios, reservas) construida y probada en local. Vive fuera de `BASE`, como el marketplace público: `GET /admin` (`views/admin.js`, un solo HTML con fetch al API, sin framework) y `/api/admin/*` (`routes/admin.js`), ambos montados en la raíz del mismo Express (`app.js`).

- **`users.role`** (`client` por defecto, `admin`) es lo único que da acceso. Se asigna a mano por SQL, nunca desde la app: `node db/make-admin.js <telefono>` promueve una cuenta ya registrada. **Falta ejecutarlo en producción** para que Víctor tenga acceso real — es el único paso pendiente para usar el panel en vivo.
- Login del panel: mismo teléfono+PIN de la cuenta normal, en `POST /api/admin/login`, pero solo emite sesión si `role = 'admin'`. `requireAdmin` (`lib/auth-middleware.js`) protege todo `/api/admin/*` y responde 404 (no 401/403) para no delatar la ruta a quien no tiene acceso, mismo patrón que ya proponía el documento de concepto.
- **`users.disabled_at`** y **`professionals.hidden_at`** (2026-08-24, nuevas): soft delete/ocultar sin borrar filas. Una cuenta desactivada no puede iniciar sesión por ningún método (teléfono+PIN, Google, Apple, OTP — ver los checks nuevos en `routes/auth.js` y `lib/auth-middleware.js`); un negocio oculto desaparece del marketplace público (`/`, `/mapa`, `GET /app/api/professionals`) pero sigue existiendo en la base y su perfil directo (`/p/:slug`) sigue accesible.
- Acciones que ya funcionan de punta a punta (probadas por API y en el navegador): ver/editar usuario, resetear PIN, activar/desactivar cuenta; ver/editar negocio, transferir propiedad a otro teléfono (la vía para reclamar Joel/Yesenia/Carmen, sembrados sin dueño real), ocultar/republicar, crear negocio en nombre de alguien; cancelar una reserva desde el panel.
- `lib/credentials.js` (nuevo) saca `normalizePhone`/`hashPin`/`PHONE_RE` de `routes/auth.js` para que `routes/admin.js` los reuse sin duplicar el login por PIN.
## Fase 2 del panel de administración (2026-08-24 noche)

Los cuatro módulos que faltaban del concepto, construidos y probados igual que la Fase 1 (por API y en el navegador).

- **Moderación**: `professional_bank_accounts.verified_at` (nueva columna) — cola de cuentas bancarias con botón verificar/quitar verificación; el perfil público (`/p/:slug`) muestra un badge "✓ Verificada" cuando aplica. Galería de comprobantes de pago (últimos 100) con botón para eliminar el archivo y desvincularlo de la reserva (`DELETE /api/admin/bookings/:id/receipt`).
- **Métricas**: crecimiento semanal (usuarios y negocios nuevos, últimas 12 semanas), embudo de activación (registrados → con servicios → alguna vez reservados → con reserva este mes), % de clientes que repiten, reservas por categoría y por sector, top 10 negocios por volumen del mes con su tasa de cancelación. "Exportar CSV" en Usuarios, Negocios y Reservas (botón en cada topbar, descarga con los filtros activos aplicados).
- **Comunicación**: estado real de WhatsApp Cloud API y SMTP (`isConfigured()` de `lib/whatsapp.js`/`lib/mailer.js`), botón de mensaje de prueba por canal, y **`message_log`** (nueva tabla) con el registro de cada envío. Mensaje manual a un usuario desde su propia ficha en Usuarios (nueva sección "Enviar mensaje" en el modal). El mensaje de WhatsApp usa `sendTextMessage` (texto libre, `type: text`) en vez de la plantilla de `sendAuthCode` — **solo entrega si el número le escribió a Bukea en las últimas 24 horas** (ventana de sesión de WhatsApp Business), suficiente para responder soporte, no para escribir en frío.
- **Configuración**: tabla `platform_settings` (nueva, una sola fila). Banner de anuncio activable/con texto, ya conectado al marketplace público (`pageShell()` en `views/shared.js`, ahora async, lo inyecta debajo del header). Colchón de antelación y tamaño de slot de la disponibilidad, ya conectados a `lib/availability.js` y a los dos endpoints de disponibilidad en `routes/professionals.js` (antes eran constantes fijas en el código). **Decisión consciente**: categorías de negocio y listas de bancos se quedan fijas en el código, no en esta pantalla — cada categoría nueva necesita también un ícono propio en `views/shared.js`, así que una UI que solo editara la lista sin resolver el ícono sería una función a medias.

Documento de concepto completo: https://claude.ai/code/artifact/09e53fa4-fa5b-4298-a340-e88babcef974

## "Ver panel del negocio" desde el admin + acceso desde cualquier dispositivo (2026-08-25)

- **`GET /api/professionals/me`** (nuevo, `requireAuth`) devuelve el slug del negocio del usuario logueado o `null`. Arregla un bug real: `views/negocio.js` solo sabía a qué negocio pertenecía el dueño por un valor guardado en ese navegador (`localStorage`), así que entrar desde otro dispositivo mostraba el asistente "Crea tu negocio" aunque ya existiera uno. `afterLogin()` ahora consulta este endpoint antes de mostrar el asistente.
- **"Ver panel del negocio"** en la ficha de cada negocio (Módulo Negocios del admin, solo si tiene dueño real): `POST /api/admin/businesses/:id/impersonate` emite un token de sesión nuevo para el dueño (cierra cualquier sesión suya abierta en otro lado, mismo costo que "Resetear PIN") y abre `/negocio?admin_view=<token>&slug=<slug>` en pestaña nueva — `boot()` en `negocio.js` arma la sesión con esos parámetros y limpia la URL de inmediato.

## WhatsApp OTP activo en producción (2026-08-26)

La verificación por WhatsApp dejó de estar dormida. Configuración en Meta hecha el 24-ago (número real **+1 809-466-5692 "Bukea"**, plantilla `codigo_bukea` de Autenticación en Spanish (DOM) aprobada, token/phone ID en cPanel); el 26-ago Víctor agregó el **método de pago** en Meta Business, que era el único bloqueo: sin tarjeta, la Cloud API responde 200 `sent:true` pero Meta descarta el mensaje en silencio (síntoma engañoso, no hay error). Verificado con un código real entregado. Pospago: Meta cobra a la tarjeta por consumo (~RD$0.80/código), no hay que recargar crédito. El frontend ya muestra solo el enlace "código por WhatsApp" en el login cuando `otp/status` responde `enabled:true`. Ver `docs/WHATSAPP-SETUP.md`.

## Atribución en el registro de negocio (2026-08-26)

Cierra la brecha 4 de la comparativa vs Fresha: pregunta opcional **"¿Cómo conociste Bukea?"** en el paso de servicios del asistente de `/negocio` (select, nunca bloquea). `professionals.referral_source` (VARCHAR 40, migración en `db/init.js`), valores válidos `instagram|tiktok|amigo|google|visita|otro` (whitelist en `routes/professionals.js`, cualquier otro valor se guarda NULL). El panel de admin la muestra en la ficha del negocio ("Conoció Bukea por: …"). Probado de punta a punta en local. El wizard corto de la PWA (`index.html`, 4 pasos) NO la pregunta todavía — extensión natural si se quiere el dato también ahí.

## Seguridad del login (2026-08-25)

Motivado por la comparativa de registro vs Fresha (`docs/` no tiene doc propio; ver memoria de proyecto): el PIN de 4 dígitos no tenía ninguna protección contra fuerza bruta.

- **`lib/rate-limit.js`** (nuevo): contadores en memoria del proceso. `check()` responde si una clave está bloqueada, `hit()` registra un intento y bloquea al exceder el máximo, `clear()` limpia al entrar bien.
- Aplicado en: login normal (5 fallos por teléfono → 15 min; 20 por IP → 30 min), login del admin (5/30 min y 10 por IP/60 min), `/auth/check` (30 solicitudes por IP/10 min, contra enumeración de números), `/auth/register` (10 por IP/hora, contra cuentas masivas). Un login correcto limpia el contador del teléfono, no el de la IP.
- `app.js`: `trust proxy` (sin esto `req.ip` sería siempre 127.0.0.1 detrás de Passenger) + cabeceras `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`.
- **Eliminar cuenta** (`POST /api/auth/delete-account`, requisito App Store 5.1.1): anonimiza la fila de `users` (nombre "Cuenta eliminada", credenciales y subs en NULL, `disabled_at`) y oculta su negocio si tiene. Botón "Eliminar mi cuenta" con doble confirmación en la sección "Mi cuenta" de Mis citas (`index.html`), junto a "Cerrar sesión" del cliente (antes no existía).

## Preparación App Store (2026-08-25)

Ver **`docs/APP-STORE-CHECKLIST.md`** — checklist completo con lo hecho y los pasos que solo Víctor puede dar (cuenta de Apple Developer, App Store Connect, credencial iOS de Google). Resumen de lo que cambió en código:

- **Sign in with Apple nativo**: plugin `@capacitor-community/apple-sign-in@6` (la v7 pide Capacitor 7 y el proyecto usa 6), entitlement `native/ios/App/App/App.entitlements` cableado en el pbxproj (Debug y Release). `loginWithApple()` en `index.html` usa la hoja nativa cuando corre empaquetada (el SDK web de Apple no funciona en WKWebView); `lib/oauth.js` acepta el token nativo con audience `com.bukea.app` además del Service ID web (`APPLE_NATIVE_CLIENT_ID` para cambiarlo).
- Info.plist: `NSCameraUsageDescription`/`NSPhotoLibraryUsageDescription` en español, `ITSAppUsesNonExemptEncryption=false`, solo orientación vertical en iPhone, `CFBundleDevelopmentRegion=es`.
- Verificado: `xcodebuild` compila limpio y la app arranca en el simulador contra producción.
- **Ojo:** el botón de Google en la app nativa sigue "Próximamente" hasta que exista el OAuth client de tipo iOS (`iosClientId` en `capacitor.config.json` sigue siendo placeholder). Y **hay que desplegar el backend antes de enviar a revisión** (delete-account y el audience de Apple solo existen en el repo).

## Seguridad máxima del panel + súper administrador fijo + /negocios exclusivo (2026-08-27)

A pedido explícito de Víctor: "dejar siempre registrado" su acceso, cerrar el hueco de un panel protegido solo por un PIN de 4 dígitos, y que `/negocios` sea inequívocamente la puerta de entrada de dueños (no una landing mezclada con clientes).

- **`lib/super-admin.js`** (nuevo): `SUPER_ADMIN_EMAIL = 'vmdventura@gmail.com'`, fijo en código, no en configuración editable. `ensureSuperAdmin()` en `db/init.js` corre en cada arranque del servidor y repara esa cuenta a `role='admin'` + `disabled_at=NULL` si ya existe con ese correo. `routes/admin.js` la blinda contra `toggle-disabled` desde el propio panel (403).
- **Login del panel (`/admin`) solo con Google — el PIN se retiró por completo** (actualización el mismo día, a pedido explícito de Víctor: "descartar el PIN para evitar futuros ataques"): `POST /api/admin/login-google` (reutiliza `lib/oauth.js`) es ahora la única puerta — `POST /api/admin/login` y `/login/verify-code` (el intento intermedio de PIN + código por correo) se eliminaron del código, no solo se ocultaron. `views/admin.js` ya no tiene formulario de teléfono/PIN, solo el botón de Google (visible cuando `GOOGLE_CLIENT_ID` está configurado; si no, muestra un aviso en vez de un formulario roto). El correo del súper administrador se autoprovisiona/repara en el acto la primera vez que entra así, aunque su cuenta `admin` todavía no exista en esa base. Cualquier otro admin necesita `role='admin'` ya asignado (`db/make-admin.js`) con ese mismo correo de Google guardado.
- **Sesión del panel con vencimiento**: nueva columna `users.admin_token_expires_at`; `issueAdminToken()` la fija a `NOW() + 8 horas` en cada login exitoso, `requireAdmin` (`lib/auth-middleware.js`) rechaza el token si venció. La sesión de la app normal sigue sin vencer, esto es solo para `/admin` por ser la puerta más sensible.
- **`/negocios` exclusivo para dueños**: franja fija arriba de todo el contenido de marketing (`.m-access-bar` en `routes/pages.js`) con el CTA "Accede ahora a tu negocio" → `/negocio`, siempre visible sin tener que bajar por la página. Aplica la lectura de `docs/ANALISIS-SITIO-FRESHA.md` (Fresha separa cliente/negocio en dominios distintos, `fresha.com` vs `partners.fresha.com`) sin necesitar un subdominio propio: la franja hace ese mismo trabajo de "esta página es para dueños, aquí entras si ya tienes cuenta" sin dejar de servir como landing de marketing para prospectos nuevos.
- Apple no se agregó al login del panel (no se pidió esta vez) — ver pendiente en `docs/PANEL-ADMIN-PENDIENTES-2026-08-25.md`.
- Probado en local de punta a punta: migración corre limpia, login con PIN emite token cuando la cuenta no tiene correo (o SMTP no está configurado), `/admin/me` valida el token recién emitido, `toggle-disabled` rechaza con 403 sobre la cuenta del súper administrador, `/login-google` responde 404 (mismo patrón "no delatar la ruta") cuando `GOOGLE_CLIENT_ID` no está configurado, la franja de `/negocios` aparece en el HTML servido.

### ⚠️ Falta un paso que solo Víctor puede hacer

Para que el súper administrador quede activo en producción de verdad, Víctor tiene que entrar una vez a `https://www.bukeard.com/admin` con el botón "Entrar con Google" usando `vmdventura@gmail.com` — ahí se autoprovisiona la cuenta (si no existe) o se repara a `role='admin'` (si ya existía con otro estado). `GOOGLE_CLIENT_ID` ya está configurado en producción desde el login social del 23-ago (ver `bukea_login_social` en memoria), así que el botón debería aparecer sin pasos adicionales — si no aparece, revisar que esa variable siga puesta en *Setup Node.js App* de cPanel.

## Próximos pasos probables

1. Búsqueda basada en mapa (Leaflet/OSM) — la pieza que falta de esta noche.
2. Que Víctor decida y ejecute el cambio de despliegue del marketplace público (ver arriba).
3. Bloquear horarios sueltos (excepciones puntuales) y política de cancelación con penalidad — lo que queda de ROADMAP 4.3.
4. Ejecutar la Fase 0 en paralelo: registrar dominios, handles, marca ONAPI, validar con 10–15 profesionales (ahora con la oferta "gratis, móntate hoy").
