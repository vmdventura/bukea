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
- **Pendiente, a propósito fuera de esta pasada:** pantalla para editar el horario semanal, bloquear horarios sueltos (excepciones puntuales al horario semanal), y política de cancelación con penalidad (hoy se cancela sin restricción).

## Próximos pasos probables

1. Pantalla para que el negocio edite su horario semanal y bloquee horarios sueltos (ROADMAP 4.3, lo que quedó pendiente).
2. Convertir `bukeard.com` de landing a marketplace público — perfil compartible `/p/:slug`, `/negocios`, `/precios` (ROADMAP 4.8, plano en `docs/ANALISIS-SITIO-FRESHA.md` §5).
3. Ejecutar la Fase 0 en paralelo: registrar dominios, handles, marca ONAPI, validar con 10–15 profesionales (ahora con la oferta "gratis, móntate hoy").
