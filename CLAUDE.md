# Bukea

Plataforma de reservas ("bukear" = to book, dominicanizado) para barbería, uñas, salones, cejas y maquillaje en República Dominicana. Marketplace de consumo + herramienta B2B, con cero comisión por cliente nuevo.

## Reglas de trabajo

- **Toda la comunicación, documentación, commits y copy del producto en español** (español dominicano para el copy de la app: "bukear", "confirmao", "la tarjetica").
- Precios siempre en RD$ (pesos dominicanos).
- El dueño del proyecto es Víctor (vmdventura).

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

Hasta que se haga ese cambio, `bukeard.com` sigue mostrando la landing vieja — el código nuevo se puede probar en local (`http://localhost:3000/`) pero no está en vivo.

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
- **Falta activarlo en producción:** como con Google/Apple, alguien tiene que crear las credenciales SMTP (ej. una cuenta de Gmail con contraseña de aplicación, o un servicio como Amazon SES/Postmark) y ponerlas en cPanel → *Setup Node.js App* → Environment variables. Mientras no estén, el botón funciona pero el backend responde "La recuperación por correo aún no está activa".

## Próximos pasos probables

1. Búsqueda basada en mapa (Leaflet/OSM) — la pieza que falta de esta noche.
2. Que Víctor decida y ejecute el cambio de despliegue del marketplace público (ver arriba).
3. Bloquear horarios sueltos (excepciones puntuales) y política de cancelación con penalidad — lo que queda de ROADMAP 4.3.
4. Ejecutar la Fase 0 en paralelo: registrar dominios, handles, marca ONAPI, validar con 10–15 profesionales (ahora con la oferta "gratis, móntate hoy").
