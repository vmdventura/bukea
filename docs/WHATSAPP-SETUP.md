# Verificación por WhatsApp — Guía de activación

> ✅ **ACTIVO EN PRODUCCIÓN desde el 2026-08-26.** La configuración de Meta se hizo el 24-ago
> (número real +1 809-466-5692 "Bukea", plantilla `codigo_bukea` aprobada, variables en cPanel)
> y el 26-ago se agregó el método de pago en Meta Business — era lo único que faltaba: sin
> tarjeta, la API acepta el mensaje (responde 200) pero Meta lo descarta en silencio.
> Verificado con un código real entregado al teléfono de Víctor. El resto de esta guía queda
> como referencia de cómo se montó.

El backend ya tiene todo el código para enviar códigos de verificación (OTP) por WhatsApp.
Esta guía cubre lo que hay que hacer en Meta (lo hace Víctor, requiere cuentas y documentos
del negocio) y cómo activar al final.

## Costo

- Cada código enviado: **US$0.013** (~RD$0.80) — tarifa "Authentication" para RD (región "Rest of Latin America").
- La API de Meta (Cloud API) no tiene mensualidad; se paga solo por mensaje con tarjeta en Meta Business.

## Parte 1 — En Meta (lo hace Víctor)

1. **Meta Business Manager** — [business.facebook.com](https://business.facebook.com)
   - Crear (o usar) el portafolio de negocio.
   - Completar la **verificación del negocio** (Configuración del negocio → Centro de seguridad → Verificación).
     Piden documentos: registro mercantil o factura de servicios a nombre del negocio, sitio web, teléfono.
     Sin esto Meta limita a 250 conversaciones/día — suficiente para arrancar, pero conviene verificarse.

2. **App en Meta for Developers** — [developers.facebook.com](https://developers.facebook.com)
   - Crear app → tipo **Business** → agregar el producto **WhatsApp**.
   - En "API Setup" Meta regala un número de prueba; para producción hay que **agregar un número real**:
     un número (puede ser fijo o móvil) que **no esté registrado en WhatsApp normal**. Se verifica por SMS o llamada.
   - Anotar el **Phone Number ID** (aparece en API Setup, no es el número en sí).

3. **Token permanente**
   - Business Manager → Configuración del negocio → Usuarios → **Usuarios del sistema** → crear usuario de sistema (rol admin).
   - Generar token con los permisos `whatsapp_business_messaging` y `whatsapp_business_management`, sin vencimiento.
   - Guardar ese token (es el `WHATSAPP_TOKEN`).

4. **Plantilla de autenticación**
   - WhatsApp Manager → Plantillas de mensaje → Crear plantilla → categoría **Autenticación**.
   - Nombre sugerido: `codigo_bukea`, idioma **Español**.
   - Meta genera el texto automáticamente ("<code> es tu código de verificación") con botón de autocompletar.
   - Esperar aprobación (normalmente minutos u horas).

## Parte 2 — Activar en cPanel (2 minutos)

En **Setup Node.js App** → editar la app de Node.js de Bukea (URI `www.bukeard.com/app`) → *Environment variables*, agregar:

| Variable | Valor |
|---|---|
| `WHATSAPP_TOKEN` | el token permanente del usuario de sistema |
| `WHATSAPP_PHONE_ID` | el Phone Number ID del número |
| `WHATSAPP_AUTH_TEMPLATE` | `codigo_bukea` (o el nombre que tenga la plantilla aprobada) |

Guardar y **reiniciar la app**. Listo: `GET /bukea/api/auth/otp/status` debe responder `{"enabled":true}`.

## Cómo funciona ya en el backend

- `POST /api/auth/otp/send { phone }` — genera un código de 6 dígitos (hash scrypt en `auth_codes`,
  expira en 5 min, máx. 3 envíos por número cada 10 min) y lo envía por la plantilla de WhatsApp.
- `POST /api/auth/otp/verify { phone, code }` — 5 intentos máximo; si el número ya tiene cuenta
  devuelve sesión directa, si es nuevo devuelve `exists:false` para que el frontend pida el nombre.
- `GET /api/auth/otp/status` — le dice al frontend si el canal está activo (para cambiar el flujo
  de PIN a OTP automáticamente cuando se configure).

## Pendiente al activar

- Ajustar el frontend para usar OTP cuando `otp/status` devuelva `enabled:true`
  (hoy usa PIN de 4 dígitos como puente).
