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
| `docs/PLAN.md` | Plan del proyecto: estado actual, Fase 0 (fundación), roadmap MVP en 3 fases, reglas estratégicas — **mantener actualizado al completar tareas** |
| `prototype/demo.html` | Demo interactivo v0.1 (HTML autocontenido, sin backend): primera pasada, mantenido como referencia histórica |
| `prototype/demo-v2.html` | Demo premium v2: misma navegación, pulido de tipografía (Fraunces + Plus Jakarta Sans), iconografía SVG real, color OKLCH y micro-interacciones — ver `DESIGN.md` |
| `PRODUCT.md` / `DESIGN.md` | Contexto de producto y sistema de diseño para trabajo con la skill `impeccable` |
| `backend/` | MVP backend real (Node/Express + MySQL) — slice mínimo: perfil de un profesional de prueba + reserva persistida en base de datos, sin login. Desplegado en producción de prueba, ver abajo |

## Decisiones ya tomadas (no re-litigar)

1. **El profesional es el perfil, no el local** — la clientela sigue al barbero/manicurista si se muda.
2. **Tres diferenciadores:** WhatsApp nativo (API de WhatsApp Business), pagos a la dominicana (efectivo/transferencia/tPago primero, tarjeta vía Azul/CardNET después), fila virtual para walk-ins.
3. **Orden de verticales:** barbería + uñas primero → salones → cejas/maquillaje.
4. **Modelo:** suscripción plana RD$500–1,500/mes por silla, cero comisión, gratis para el cliente final.
5. **Geografía:** una sola ciudad (Santo Domingo o Santiago) hasta tener densidad.
6. **Identidad visual del demo v0.1:** teal `#0f8583` como color primario, dorado `#d99a2b` para ratings, verde WhatsApp para mensajería. Tipografía system stack.

## Estado (2026-07-05)

- ✅ Visión, plan y demo v0.1 en el repo
- ✅ Nombre "Bukea" libre en App Store y Google Play (verificado 2026-07-04)
- ✅ Dominios verificados libres: `bukea.do`, `bukeard.com` (el .com principal), `getbukea.com`, `bukeaapp.com` — **sin registrar aún**
- ✅ Backend real de prueba (Node/Express + MySQL) desplegado en `https://vmdventura.com/bukea/` — Víctor decidió arrancar el código en paralelo a la Fase 0 (ver decisión en `docs/PLAN.md`), no porque el criterio de salida se haya cumplido
- ⬜ Stack tecnológico definitivo sin decidir (el backend de prueba corre en hosting compartido de Víctor — BanaHosting/cPanel con Node.js Selector — no necesariamente el hosting final del MVP)
- ⬜ Fase 0 sigue pendiente: dominios sin registrar, marca ONAPI, validación con 10–15 profesionales

## Backend de prueba (`backend/`)

- Stack: Node.js + Express + MySQL (`mysql2`), sin autenticación, datos semi-fijos (un profesional de prueba: Joel "El Fino" Batista con 3 servicios).
- Endpoints: `GET /bukea/api/professionals/:slug`, `POST /bukea/api/bookings`, `GET /bukea/api/health`.
- Sirve también el frontend (`backend/public/index.html`, copia de `prototype/demo-v2.html` adaptada para consumir la API real en vez de datos hardcodeados).
- Desplegado en el hosting de Víctor (BanaHosting, cPanel con Node.js Selector) bajo `/vmdventura.com/bukea-app/`, expuesto en `https://vmdventura.com/bukea/`. La app en cPanel está montada con URI `vmdventura.com/bukea`, y como Passenger reenvía la ruta completa sin recortar el prefijo, tanto las rutas de Express como los `fetch` del frontend usan el prefijo `/bukea` explícitamente (ver `BASE` en `backend/app.js`).
- Credenciales de MySQL viven como variables de entorno en el panel de Node.js de cPanel (no en un `.env` en el servidor, para no exponer la contraseña en un directorio web). Localmente, `backend/.env` (gitignored) las replica para desarrollo — usar `backend/.env.example` como plantilla.
- Al arrancar, el servidor crea las tablas (`backend/db/schema.sql`) y siembra el profesional de prueba si no existe (`backend/db/init.js`) — no requiere ejecutar un script aparte por SSH.

## Próximos pasos probables

1. Iterar el demo premium (`prototype/demo-v2.html`) con feedback de Víctor — lado B2B (agenda del barbero) aún no tiene pantallas.
2. Ampliar el backend de prueba: más profesionales/servicios reales, login básico, panel de agenda para el profesional.
3. Ejecutar la Fase 0 en paralelo: registrar dominios, handles, marca ONAPI, validar precio con 10–15 profesionales.
