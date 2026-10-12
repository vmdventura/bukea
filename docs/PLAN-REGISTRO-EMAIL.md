# Plan: registro y acceso por correo, estilo Fresha (2026-10-11)

Decisiones de Víctor:
- Cliente y negocio tienen puertas separadas, como Fresha (`fresha.com/es/user-flow` → "para clientes" / "para profesionales").
- En cada lado, **una sola pantalla para entrar o registrarse**: el sistema decide si la cuenta existe.
- Identidad: **correo + código de 6 dígitos** (sin WhatsApp). Google y Apple siguen disponibles. Quien ya tiene teléfono + PIN puede seguir usándolo.
- La cuenta del cliente vive en el sitio web (`bukeard.com`), no en la mini app.
- El negocio entra por `negocio.bukeard.com`; si la cuenta es nueva, sigue al quiz obligatorio de nuevo negocio.

Estado de cada tarea: ⬜ pendiente · ✅ hecha y probada.

---

## Fase 1. Backend: código por correo

| # | Tarea | Prueba |
|---|---|---|
| ✅ 1.1 | Tabla `signup_tokens` (hash del pase, correo, tipo de cuenta, vence en 30 min) en `db/init.js` | La tabla existe al arrancar |
| ✅ 1.2 | `POST /api/auth/email/send` `{email}`: genera código de 6 dígitos (vence en 15 min), máximo 3 por correo cada 10 min y límite por IP; lo envía con `mailer.sendLoginCode` | 200 `{sent:true}`; 4.º intento → 429; correo inválido → 400 |
| ✅ 1.3 | `mailer.sendLoginCode(email, code)` con la plantilla de marca | Se arma el correo (en local sin SMTP se registra en consola) |
| ✅ 1.4 | `POST /api/auth/email/verify` `{email, code, accountType}`: si la cuenta existe → sesión; si no → `{exists:false, signupToken}`; código malo suma intento, 5 intentos bloquea | Código correcto con cuenta existente → token; nuevo → signupToken; incorrecto → 401 |
| ✅ 1.5 | `POST /api/auth/email/register` `{signupToken, name, phone?, accountType}`: crea la cuenta con correo ya verificado, sin PIN; el pase se usa una sola vez | 200 con sesión; reutilizar el pase → 400; teléfono repetido → 409 |
| ✅ 1.6 | Modo prueba local: si no hay SMTP, `NODE_ENV` no es `production` y `EMAIL_CODE_DEBUG=1`, la respuesta de `send` incluye `devCode` | Funciona en local; en producción nunca aparece |

## Fase 2. Portal de negocio (`negocio.bukeard.com`)

| # | Tarea | Prueba |
|---|---|---|
| ✅ 2.1 | Pantalla combinada "Crea una cuenta o inicia sesión": correo → Continuar | Se ve en escritorio y celular |
| ✅ 2.2 | Paso del código (6 dígitos), con "Reenviar código" y "Cambiar correo" | Código correcto entra o sigue a completar cuenta |
| ✅ 2.3 | Paso "Completa tu cuenta" (cuenta nueva): nombre, teléfono, casilla de profesional | Crea la cuenta y abre el quiz obligatorio |
| ✅ 2.4 | Google y Apple combinados (crean o entran), sin `loginOnly` | Botones visibles; en producción ya verificados por Víctor |
| ✅ 2.5 | Enlace "Entrar con teléfono y PIN" para cuentas viejas (solo acceso) | Teléfono existente pide PIN; inexistente avisa |
| ✅ 2.6 | Enlace "¿Eres cliente? Ir a Bukea para clientes" | Lleva a `/entrar/cliente` |
| ✅ 2.7 | `/unete` y `?registro=1` llevan a la misma pantalla combinada | Botones de Únete abren el portal |

## Fase 3. Cliente en el sitio web

| # | Tarea | Prueba |
|---|---|---|
| ✅ 3.1 | `/entrar`: "Regístrate o inicia sesión" con dos opciones, Bukea para clientes y Bukea para negocios | 200, dos enlaces correctos |
| ✅ 3.2 | `/entrar/cliente`: misma pantalla combinada (correo → código → completar nombre), tipo cliente; guarda la sesión en `localStorage` (`bukea_session`, compartida con la mini app) | Cuenta nueva y existente terminan en `/cuenta` |
| ✅ 3.3 | `/cuenta`: "Mis citas" (próximas y pasadas) con cancelar, nombre y correo, cerrar sesión | Lista vacía y con citas; cancelar funciona |
| ✅ 3.4 | Barra: "Iniciar sesión" → `/entrar`; con sesión de cliente, muestra "Mi cuenta" | Cambia según la sesión |
| ✅ 3.5 | "Soy cliente" en `/unete` → `/entrar/cliente` | Enlace correcto |

## Fase 4. Pruebas y despliegue

| # | Tarea | Prueba |
|---|---|---|
| ✅ 4.1 | Script `scripts/test-auth-email.js`: recorre la API completa contra el servidor local | Todos los casos en verde |
| ✅ 4.2 | Recorrido en el navegador: negocio nuevo, negocio existente, cliente nuevo, cliente existente | Capturas en escritorio y celular |
| ✅ 4.3 | Despliegue y verificación con curl | Rutas 200 y textos nuevos en producción |

## Estado al 2026-10-11

- Fases 1 a 4 hechas y desplegadas. `node scripts/test-auth-email.js` pasa 26 de 26 en local; en producción se verificaron las páginas (200), `/precios` 404, `/negocios` 302 al portal y `POST /email/send` con `{sent:true}` (correo aceptado por el SMTP).
- No se probó en producción el recorrido completo con un código real recibido en un buzón: hace falta que Víctor lo haga una vez con su correo.
- Google y Apple en `/entrar/cliente`: añadidos y desplegados (2026-10-11). Apple usa la URL de retorno ya registrada de la app (`https://www.bukeard.com/app/`). No se probó el inicio de sesión real, solo que los botones están activos con los ids de producción.
- Quiz de nuevo negocio: ya no promete "gratis para siempre".
- Servidor: se movieron a la papelera de cPanel 30 zips de despliegue viejos; quedan `backend.zip`, `backup-2026-08-25.zip` y el último (`bukea-deploy-social-n.zip`) como respaldo.
- Nota de despliegue: el primer clic en reiniciar Node a veces no aplica; verificar con curl y repetir.

## Fase 5 (en curso)

- ✅ Reservar desde el sitio web: `/p/:slug/reservar`, cuenta al confirmar (2026-10-11, desplegado).
- ✅ Plantillas de correo con logo y correo de confirmación de cita (2026-10-12, desplegado; falta ver la confirmación en un caso real).
- ⬜ Código por correo instantáneo con contador de reenvío.
- ⬜ Verificación del teléfono sin WhatsApp (el marketplace hoy exige teléfono verificado para mostrar un negocio).

## Fase 5 (original)

- Reservar desde el sitio web, con la cuenta pedida al confirmar (como Fresha). Hoy la reserva vive en la mini app.
- Verificación del teléfono sin WhatsApp: el marketplace hoy exige teléfono verificado para mostrar un negocio.
