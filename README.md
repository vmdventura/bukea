# Bukea

> La app para bukear tu cita de barbería, salón, uñas, cejas y maquillaje en República Dominicana.
> **Bukear nunca fue tan fácil.**

## Documentación

- [Visión de Producto](docs/VISION.md) — el nombre, el problema, la oportunidad, el modelo de negocio y el roadmap.
- [Plan del Proyecto](docs/PLAN.md) — estado actual, Fase 0 de fundación, roadmap del MVP y reglas estratégicas.
- [Competencia — BarberTime](docs/COMPETENCIA-BARBERTIME.md) — análisis del competidor directo en Santo Domingo.
- [Verificación por WhatsApp](docs/WHATSAPP-SETUP.md) — guía para activar el login por OTP de WhatsApp.

## Estado del proyecto

🛠️ **Fase actual:** MVP de prueba en producción, en paralelo a la Fase 0 de fundación.

- **App funcional** en [www.bukeard.com/app](https://www.bukeard.com/app/): bienvenida con login por teléfono + PIN, inicio por categorías, listado de profesionales por categoría, reserva real (guardada en MySQL), lado B2B (registro y panel del negocio) y "Mis citas". Instalable como PWA a pantalla completa.
- **Fase 0** sigue activa: `bukeard.com` registrado y logo listo; faltan `bukea.do`, marca ONAPI, handles sociales y validar precio con 10–15 profesionales reales. Ver [PLAN.md](docs/PLAN.md).

> El MVP arrancó en paralelo a la Fase 0 por decisión del dueño (tener algo funcional ayuda a la validación), no porque el criterio de salida ya se cumpliera.

## Código

| Ruta | Contenido |
|---|---|
| `backend/` | MVP real: Node.js + Express + MySQL. API de auth, profesionales, reservas; sirve el frontend PWA desde `backend/public/`. Desplegado en el hosting de Víctor (BanaHosting / cPanel Node.js). |
| `prototype/demo-v2.html` | Demo premium navegable (segunda pasada, sin backend) — origen del frontend actual. |
| `prototype/demo.html` | Demo v0.1 original, referencia histórica. |
| `PRODUCT.md` / `DESIGN.md` | Contexto de producto y sistema de diseño. |
