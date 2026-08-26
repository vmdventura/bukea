# Bukea — Checklist de publicación en el App Store

> Preparado el 2026-08-25. La app nativa (`native/`, Capacitor iOS, `com.bukea.app`) quedó lista en código para subirse; lo que falta son los pasos que requieren la cuenta de Apple Developer de Víctor.

---

## 1. Lo que ya quedó listo en código (2026-08-25)

| Requisito de Apple | Estado |
|---|---|
| **Regla 4.2 (funcionalidad mínima)** — el WebView no puede cargar un sitio remoto | ✅ Ya resuelto desde antes: el HTML va empaquetado dentro de la app (`build-www.js`), solo la API va a bukeard.com |
| **Regla 5.1.1(v) — eliminar cuenta dentro de la app** (obligatorio para toda app con registro) | ✅ Nuevo: `POST /api/auth/delete-account` (anonimiza la cuenta, oculta su negocio si tiene) + botón "Eliminar mi cuenta" en Mis citas, con doble confirmación. Probado de punta a punta en local |
| **Regla 4.8 — Sign in with Apple** (obligatorio si ofreces Google) | ✅ Nuevo: plugin nativo `@capacitor-community/apple-sign-in@6`, entitlement `App/App.entitlements`, y `loginWithApple()` usa la hoja nativa del sistema en la app (el SDK web no funciona en WKWebView). El backend acepta el token nativo (audience `com.bukea.app`) además del Service ID web |
| Descripciones de uso (cámara/fotos para comprobantes, logo y galería) | ✅ `NSCameraUsageDescription` y `NSPhotoLibraryUsageDescription` en español en Info.plist |
| Pregunta de cifrado de exportación | ✅ `ITSAppUsesNonExemptEncryption = false` (solo HTTPS estándar) |
| Orientación | ✅ Solo vertical en iPhone (la app está diseñada para eso) |
| Idioma declarado | ✅ `CFBundleDevelopmentRegion = es` |
| Ícono 1024×1024 sin transparencia | ✅ Ya existía (`AppIcon-512@2x.png`, RGB sin alpha) |
| Política de privacidad pública | ✅ Ya existía: `https://www.bukeard.com/privacidad` |
| Seguridad del login (fuerza bruta) | ✅ Nuevo: bloqueo por intentos fallidos por teléfono e IP en login normal y admin, límite de enumeración en `/check`, límite de registro masivo, cabeceras de seguridad — ver sección de seguridad en CLAUDE.md |
| Compila | ✅ `xcodebuild` (Debug, simulador) compila limpio con los 2 plugins; probada arrancando en el simulador iPhone 17 Pro contra la API de producción |

**⚠️ Antes de enviar a revisión hay que desplegar el backend a producción** — el botón "Eliminar mi cuenta" y el login de Apple nativo llaman a endpoints/cambios (`delete-account`, audience nativo) que hoy solo existen en el repo local. Si el revisor de Apple toca "Eliminar mi cuenta" contra el servidor viejo, falla y es rechazo seguro.

---

## 2. Lo que solo Víctor puede hacer (en orden)

### Paso 1 — Cuenta de Apple Developer (US$99/año, 1-2 días de espera)
1. [developer.apple.com/programs/enroll](https://developer.apple.com/programs/enroll) con el Apple ID que vaya a ser el dueño (recomendado: el asociado a vmdventura@gmail.com).
2. La verificación de identidad/pago puede tardar 24-48 horas.

### Paso 2 — App ID y capacidades (5 min, en developer.apple.com)
1. Certificates, Identifiers & Profiles → Identifiers → `+` → App ID `com.bukea.app`.
2. Marcar la capacidad **Sign in with Apple** en ese App ID (sin esto, el build firmado se rechaza al subir).

### Paso 3 — Credenciales de Google para la app nativa (15 min, opcional pero recomendado)
El botón de Google en la app nativa está en "Próximamente" hasta esto:
1. Google Cloud Console → el mismo proyecto del login web → Credentials → Create OAuth client ID → tipo **iOS**, bundle `com.bukea.app`.
2. Poner el client ID resultante en `native/capacitor.config.json` → `plugins.GoogleAuth.iosClientId` (hoy dice `__IOS_GOOGLE_CLIENT_ID__`) y recompilar.
   - Si se decide lanzar sin Google en la app, el botón queda "Próximamente" y no es motivo de rechazo (Apple sí, Google no es obligatorio).

### Paso 4 — App Store Connect (30 min)
1. [appstoreconnect.apple.com](https://appstoreconnect.apple.com) → Mis apps → `+` → Nueva app: nombre **Bukea**, idioma principal **español (México)** (no hay es-DO), bundle `com.bukea.app`, SKU `bukea-ios`.
   - El nombre "Bukea" estaba libre (verificado 2026-07-04) — este paso lo reserva de verdad.
2. Ficha (borrador listo abajo, sección 3).
3. **App Privacy**: declarar recolección de: nombre, número de teléfono, correo (opcional), fotos que el usuario sube. Uso: funcionalidad de la app. No se comparte con terceros. No hay tracking ni anuncios.

### Paso 5 — Compilar, firmar y subir (20 min, desde este Mac)
```bash
cd native && node build-www.js && npx cap sync ios
open ios/App/App.xcworkspace
```
En Xcode: seleccionar el equipo (Signing & Capabilities → Team, con la cuenta ya activa), destino "Any iOS Device", menú Product → Archive → Distribute App → App Store Connect. La firma automática crea los certificados sola.

### Paso 6 — TestFlight primero (recomendado, 1 día)
Al subir el build aparece en TestFlight en ~10-30 min (revisión automática). Probarlo en el iPhone real de Víctor: login con Apple de verdad, una reserva real, eliminar una cuenta de prueba.

### Paso 7 — Enviar a revisión
1. En la ficha: adjuntar el build, capturas (sección 3), y en **Notas para el revisor** dejar una cuenta demo:
   > Cuenta de prueba: teléfono 8095550100, PIN 1234. La app es un marketplace de reservas de belleza en República Dominicana. El pago es en efectivo o transferencia directa al negocio, la app no procesa pagos.
2. Enviar. **Tiempo de revisión típico en 2026: 24-48 horas** (el 90 % de las apps). La primera revisión de una cuenta nueva puede tardar más o recibir preguntas — planificar **1 semana de colchón**.
3. Si rechazan: se responde en Resolution Center y la re-revisión suele ser más rápida (horas).

---

## 3. Borrador de la ficha del App Store

- **Nombre:** Bukea
- **Subtítulo (30 chars):** `Tu cita, en tus manos` (21)
- **Categoría:** Estilo de vida (secundaria: Salud y forma física)
- **Descripción:**
  > Bukea es la forma más fácil de reservar tu barbero, tu manicurista o tu salón en República Dominicana. Busca por categoría o por zona, mira los servicios con sus precios en pesos, elige el día y la hora que te sirven y confirma. Sin llamadas, sin "¿tienes turno?".
  >
  > • Reserva con fecha y hora real, según la agenda del negocio
  > • Paga como pagamos aquí: efectivo o transferencia, con las cuentas del negocio a mano
  > • Recordatorios por WhatsApp para que no se te pase la cita
  > • ¿Tienes un negocio? Únete gratis: agenda en vivo, tu cuadre del día y tu perfil compartible
  >
  > Bukea es gratis para clientes y para negocios. Bukear nunca fue tan fácil.
- **Palabras clave (100 chars):** `barberia,cita,barbero,unas,salon,belleza,reserva,manicure,republica dominicana,turno` (85)
- **URL de soporte:** `https://www.bukeard.com/negocios` (o crear `/soporte`)
- **URL de privacidad:** `https://www.bukeard.com/privacidad`
- **Capturas (obligatorias, 6.9" — iPhone 17 Pro Max del simulador sirve):** 1) inicio con categorías, 2) perfil de un negocio con servicios, 3) reserva con día/hora, 4) confirmación de cita, 5) Mis citas. Tomarlas con datos reales bonitos, no con la base vacía.

---

## 4. Riesgos de rechazo conocidos y su mitigación

| Riesgo | Mitigación |
|---|---|
| 4.2 funcionalidad mínima ("es solo un WebView") | El HTML va empaquetado; en las notas del revisor subrayar reserva real, agenda, cuenta. Si aun así lo señalan, el plan B documentado es empaquetar más lógica offline |
| Revisor toca "Eliminar mi cuenta" y falla | Desplegar el backend ANTES de enviar (sección 1) |
| Sign in with Apple no funciona en el dispositivo del revisor | Probarlo en TestFlight en un iPhone real antes de enviar (el simulador a veces no deja completar SIWA) |
| Contenido/datos de prueba visibles (negocios sembrados falsos) | Antes de las capturas y del envío, revisar que el marketplace muestre negocios presentables |
| La cuenta demo del revisor está bloqueada por el rate limit | El bloqueo dura 15 min y solo aplica con PIN incorrecto; con el PIN correcto de las notas no se dispara |
