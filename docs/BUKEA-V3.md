# Bukea V3 — snapshot del producto (2026-08-23)

> Corte de estado tras el primer despliegue real a producción (`www.bukeard.com/app`) y una ronda de pulido de UI. "V3" marca este punto: MVP funcionando en vivo, no solo en local. Complementa a [ROADMAP.md](ROADMAP.md) (qué sigue) y [PLAN.md](PLAN.md) (fases/contexto) — este documento es la foto de "qué existe hoy y cómo se ve".

---

## Qué es Bukea (resumen)

Marketplace dominicano de citas de belleza (barbería, uñas, salón, maquillaje, cejas & MUA, pilates). El profesional es el perfil — no el local. Cero comisión para el cliente, gratis para el negocio en esta etapa. Diferenciadores frente a Fresha/BarberTime/Booksy: multivertical, WhatsApp nativo (en pausa, ver abajo), búsqueda por mapa, y ahora colaboradores/equipo.

---

## En producción hoy (`www.bukeard.com/app`)

**Cliente**
- Login por teléfono + PIN, o Google / Apple (botones con íconos reales de marca; Facebook se descartó, nunca tuvo backend)
- Registro con email **opcional** + recuperar PIN por correo (`¿Olvidaste tu PIN?`) — construido, pero el envío real de correo está apagado hasta que se configure SMTP en producción (responde 503, no rompe nada)
- Buscar por sector/categoría, ver perfil público de un profesional (`/p/:slug`), reservar con disponibilidad real (choques de horario y doble-booking bloqueados server-side)
- Elegir "¿Quién te va a atender?" cuando el negocio tiene colaboradores
- "Mis citas" leídas del servidor (no `localStorage`), cancelar cita
- Pagar en efectivo o transferencia — cuentas bancarias del negocio + subir foto/PDF del comprobante
- "Cómo llegar" (Google Maps / Apple Maps / Waze) en el perfil, ticket y "Mis citas"
- Búsqueda por mapa (`/mapa` en el sitio, Leaflet + OpenStreetMap, geocodificación automática por sector)
- Fila virtual (pantalla) — sin backend de walk-ins todavía

**Negocio ("Perfil", antes "Mi negocio")**
- Login real ligado a la cuenta (`owner_user_id`); ya no basta con saber el slug para ver la agenda de otro negocio
- Agenda: ver citas, confirmar quién atendió, cancelar
- Editar horario semanal (un rango por día; huecos de almuerzo aún requieren tocar la base de datos)
- "Mi equipo": agregar colaboradores reservables además del dueño
- "Mi Cuadre" básico: ventas de hoy / 7 días / mes
- Cuentas bancarias del negocio para mostrarlas al cliente

**Web pública (`bukeard.com`)**
- Marketplace con buscador y tarjetas reales (ya no es la landing vieja subida por FTP)
- Perfil público compartible por negocio, listado `/negocios`, `/precios`, mapa `/mapa`

---

## Lo que se hizo hoy, 2026-08-23 (sesión larga)

1. **Primer despliegue real a producción** — todo lo acumulado en local (desde el 2026-07-05) subido a `bukeard.com/app` por primera vez. No hay CI/CD: el proceso es manual vía cPanel (detalle en `CLAUDE.md` → "Despliegue a producción").
2. **Bug de producción encontrado y corregido**: `safeAlter()` no reconocía "llave foránea duplicada" en la variante de MySQL/MariaDB del hosting — tumbaba el arranque de la app (503). Corregido en `db/init.js`.
3. **"Mi negocio" → "Perfil"** en la navegación (es la cuenta del usuario, no un negocio genérico).
4. **Login social con íconos reales** (Google de 4 colores, Apple con silueta) en vez de botones de texto; Facebook eliminado.
5. **Email opcional + recuperar PIN por correo** — falta solo que Víctor cree credenciales SMTP.
6. **Colaboradores/equipo** — construido y probado end-to-end (ver ROADMAP.md 4.12).
7. **Pulido visual del login/onboarding** (a partir de una captura del teléfono de Víctor): texto del teléfono centrado → bandera+prefijo+número agrupados como un bloque → logo/título/subtexto de "¿Qué servicio buscas?" centrados.

Todo verificado en vivo con `curl` después de cada subida, commiteado y pusheado a `main` (hasta `e09058c`).

---

## Pendiente inmediato (no técnico, es de Víctor)

- **SMTP** para que "recuperar PIN por email" envíe correos de verdad (Gmail con contraseña de aplicación, o Amazon SES/Postmark)
- **Fase 0 de marca**: registrar `bukea.do`/`bukea.com.do`, reservar handles en redes, marca en ONAPI — sigue sin confirmarse en el repo
- **Validación real**: visitar/llamar 10–15 profesionales con la demo — la etapa que de verdad decide si el proyecto sigue (ver ROADMAP.md Etapa 3)

## Pendiente técnico (Etapa 4 del roadmap, sin completar)

- Recordatorios reales por WhatsApp (el OTP de WhatsApp existe pero está dormido, falta configurar Meta)
- Fotos reales de perfil/portafolio
- Decidir si se queda en BanaHosting o se migra
- Onboarding self-service del negocio (wizard tipo Fresha)
- Bloquear horarios sueltos (excepciones puntuales, no solo horario semanal fijo)
- Política de cancelación con penalidad

---

## Dónde está todo

- Roadmap detallado y checklist: [ROADMAP.md](ROADMAP.md)
- Fases y contexto de negocio: [PLAN.md](PLAN.md) / [VISION.md](VISION.md)
- Cómo desplegar a producción: `CLAUDE.md` → sección "Despliegue a producción"
- Setup de Google/Apple login: [LOGIN-GOOGLE-APPLE-SETUP.md](LOGIN-GOOGLE-APPLE-SETUP.md)
- Setup de WhatsApp: [WHATSAPP-SETUP.md](WHATSAPP-SETUP.md)
