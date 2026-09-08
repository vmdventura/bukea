# Bitácora: preparación y envío de Bukea al App Store

> Sesión del 2026-08-27 (madrugada del 28). Cubre desde la instrumentación de analítica hasta el envío final a revisión de Apple. Complementa `docs/APP-STORE-CHECKLIST.md` (el checklist original) con el registro de lo que realmente se hizo, en qué orden, y los problemas reales que aparecieron.

---

## 1. Google Analytics (GA4) con eventos de producto reales

Antes de esta sesión, GA4 (`G-9P6W5CRECN`) solo medía pageviews automáticos. Se agregó un capa de eventos de producto en `backend/public/index.html` (y su copia sincronizada `native/www/index.html`):

- Helper `window.track(name, params)` justo después de la config de `gtag`, a prueba de fallos (si GA está bloqueado o sin internet, no rompe la app).
- Eventos instrumentados:
  - `sign_up` / `login` — con `method`: `phone`, `google`, `apple`, `phone_otp`, `phone_reset`
  - `view_item` — al abrir el perfil de un negocio
  - `select_category` — al filtrar por categoría en el home
  - `booking_confirmed` — con valor en RD$, categoría del negocio y método de pago (evento de conversión principal)
  - `booking_cancelled` — desde "Mis citas" y desde el panel del negocio (`source: 'panel'`)
  - `business_signup` — al registrar un negocio nuevo
  - `account_deleted`
- Probado en local con `window.gtag` interceptado antes de desplegar. Desplegado a producción vía cPanel File Manager (archivo estático, sin reinicio de Node.js necesario).

## 2. Copy ASO para App Store Connect

Se redactó y cargó el copy completo optimizado para posicionamiento (ASO) en el nicho de belleza/citas en RD:

| Campo | Contenido | Caracteres |
|---|---|---|
| Nombre | `Bukea: citas y reservas` | 23/30 |
| Subtítulo | `Barbería, salón, uñas y spa` | 27/30 |
| Palabras clave | `barbero,manicure,pedicure,cejas,maquillaje,pilates,entrenador,peluqueria,canina,turno,agenda,rd,unas` | 100/100 |
| Descripción | Gancho + bullets para clientes + bullets para negocios | 1417/4000 |
| Texto promocional | `Bukea ya está en RD. Agenda tu cita en barbería, salón, spa o uñas por WhatsApp, sin comisión y sin usar tarjeta. Descárgala gratis.` | 132/170 |
| Categoría principal | Estilo de vida | — |
| Categoría secundaria | Compras | — |

Todo cargado directamente en App Store Connect (no quedó solo en un artifact de referencia).

## 3. Ficha en App Store Connect

- Confirmado: App ID `com.bukea.app` con **Sign In with Apple** ya activado en developer.apple.com.
- Confirmado: `iosClientId` de Google ya estaba puesto en `native/capacitor.config.json` (el checklist viejo decía que faltaba, ya no).
- Ficha "Bukea" creada en App Store Connect: iOS, Español (México), bundle `com.bukea.app`, SKU `bukea-ios`, acceso ilimitado.
- **Clasificación por edades**: cuestionario completo respondido con honestidad según las funciones reales de la app (sin contenido para adultos, sin redes sociales/chat interno, sin apuestas). Resultado: **4+** en 172 países.
- **Privacidad de la app**: cuestionario completo de recolección de datos, 9 tipos declarados con su propósito y vínculo de identidad — nombre, correo, teléfono, información de pago (cuenta bancaria del negocio), otra información financiera (cédula/RNC), ubicación aproximada (por IP, vía GA4), fotos/vídeos, ID de usuario, interacción con el producto (analítica). Publicada.
- **Precio**: $0.00 (gratis) en todos los países.
- URL de política de privacidad: `https://www.bukeard.com/privacidad` (verificada, responde 200).

## 4. Capturas de pantalla

### Para el App Store (iPhone 6.5", 1284×2778px)

El usuario generó 4 mockups elegantes en ChatGPT a partir de los prompts que le di (estilo teal oscuro/crema, fiel a la identidad de marca), usando las capturas reales de la app como base:

1. "Reserva tu cita en 60 segundos" (inicio)
2. "Hoy, esta semana, este mes. Todo claro" (resumen del panel de negocio)
3. "Tu agenda real, siempre a mano" (calendario)
4. "Sabe cuánto vendiste, al instante" (Mi Cuadre)

Se localizaron en `~/Downloads`, se redimensionaron a 1284×2778 con `sips`, y se subieron a la ficha.

### Para diseño/redes (generadas con Playwright headless, capturas reales de la app)

Se instaló Playwright localmente (`/tmp/bukea-shots`) para generar capturas reales de la app en alta resolución, ya que el entorno de esta sesión no tiene acceso de escritura a `~/Downloads` ni pantalla real para `screencapture`. Capturas hechas:

- Inicio, perfil de Olivercut (app y sitio web), Únete a Bukea, Mapa, Precios — contra producción
- Panel del negocio, Calendario (con citas reales de un negocio de prueba creado solo para esto), Mi perfil (ajustes) — contra un servidor **local**, con un negocio y 3 citas ficticias creadas únicamente para la captura, sin tocar producción

## 5. Bug encontrado y arreglado: avatar y fotos reales en el perfil dentro de la app

Al tomar las capturas se notó que la pantalla de perfil **dentro de la app nativa** (`/app/?pro=slug`) mostraba iniciales sobre gradiente en vez del logo real, y "Sus trabajos" mostraba 6 cuadros decorativos fijos en vez de las fotos reales del negocio — a diferencia del perfil público del sitio web (`/p/:slug`), que sí se había arreglado en una sesión anterior.

**Arreglado** en `backend/public/index.html` (`renderProfessional()`): el avatar ahora usa `prof.logoUrl` si existe (con `<img>`), y "Sus trabajos" usa `prof.photos` reales si el negocio tiene fotos, con respaldo a los gradientes decorativos originales si no tiene ninguna. Desplegado a producción y verificado con captura real de Olivercut.

## 6. Compilación y primer intento de subida (build 1) — RECHAZADO

1. `cd native && node build-www.js && npx cap sync ios` — falló la primera vez por `LANG` no configurado en UTF-8 en la terminal (CocoaPods lo requiere); se resolvió con `LANG=en_US.UTF-8 LC_ALL=en_US.UTF-8`.
2. Se descubrió que Xcode tenía abierto el proyecto equivocado (**DeportesDO**, otra app de Víctor) — se abrió el workspace correcto: `native/ios/App/App.xcworkspace`.
3. Team de firma asignado: **Advanced Multimedia Service Ams S.R.L.** (antes en "None").
4. Destino cambiado a "Any iOS Device (arm64)".
5. **Archive** → build exitoso → **Distribute App** → App Store Connect → subido sin errores de validación inicial.
6. **~1 minuto después, Apple rechazó el build automáticamente**: `ITMS-91061: Missing privacy manifest` en tres frameworks: `GoogleSignIn`, `GTMAppAuth`, `GTMSessionFetcher`.

### Diagnóstico

El plugin `@codetrix-studio/capacitor-google-auth@3.4.0-rc.4` (sin actualizar desde su lanzamiento) fija `GoogleSignIn ~> 6.2.4` en su podspec — una versión de 2023 sin el manifiesto de privacidad que Apple exige desde 2024 para SDKs de terceros de uso común.

## 7. Corrección y segundo intento (build 2) — ACEPTADO

1. Se editó directamente `node_modules/@codetrix-studio/capacitor-google-auth/CodetrixStudioCapacitorGoogleAuth.podspec`: `GoogleSignIn '~> 6.2.4'` → `GoogleSignIn '>= 7.1.0'`.
2. `pod update GoogleSignIn` resolvió las dependencias transitivas a versiones actuales con manifiesto de privacidad:
   - GoogleSignIn 6.2.4 → **9.2.0**
   - GTMAppAuth 1.3.1 → **5.0.0**
   - GTMSessionFetcher 2.3.0 → **3.5.0**
   - AppAuth 1.7.6 → 2.1.0
3. La API de GoogleSignIn 9.x cambió respecto a la 6.x (`GIDGoogleUser.authentication`/`serverAuthCode` ya no existen igual) — se corrigió `Plugin.swift` del plugin de Google Auth para usar la API nueva (`accessToken.tokenString`, `signIn(withPresenting:)`, `GIDSignInResult.serverAuthCode`).
4. `CURRENT_PROJECT_VERSION` (Build) incrementado de 1 a 2 en `project.pbxproj`.
5. Recompilado, archivado, y subido de nuevo. **Apple lo aceptó**: el correo de confirmación solo trae la advertencia no bloqueante de siempre (`ITMS-90068: MinimumOSVersion too low`, relevante recién en primavera de 2027).

## 8. Envío final a revisión

1. Se canceló el envío anterior (rechazado, build 1) desde "Revisión de apps" en App Store Connect.
2. Se quitó el build 1 de la versión 1.0 y se asignó el **build 2**.
3. Notas para el revisor completadas:
   - Cuenta de prueba: teléfono `8095550100`, PIN `1234` (verificada con login real antes de escribirla)
   - Contacto: Victor Manuel De La Rosa Ventura, `8299060150`, `vmdventura@gmail.com`
   - Explicación de cómo probar una reserva, del modelo de pago (efectivo/transferencia, sin procesar pagos en la app), de Sign in with Apple y de "Eliminar mi cuenta"
4. Resueltos los 4 bloqueos que aparecieron al intentar enviar por primera vez: falta de captura para iPad de 13" (se dejó pendiente, ver sección 9), copyright vacío (`2026 Advanced Multimedia Service Ams S.R.L.`), franja de precios (gratis en todos los países), información de derechos de contenido.
5. **Enviado.** Estado: **Pendiente de revisión**. Tiempo típico 24-48 horas (primera vez con esta cuenta, así que puede tardar algo más).

## 9. Pendientes / notas para la próxima vez

- **Advertencia no bloqueante `MinimumOSVersion too low`**: la app declara iOS 13.0 como mínimo. Apple exigirá 15.0 o más a partir de primavera de 2027 para poder subir builds nuevos. No urgente, pero hay que subir el `Minimum Deployments` en Xcode antes de esa fecha.
- **Captura para iPad de 13"**: el proyecto de Xcode declara soporte para iPad (y también Mac/Apple Vision, heredado de la configuración por defecto de Capacitor) en "Supported Destinations", lo que le exigió a Apple una captura de iPad que no se llegó a subir formalmente antes del envío — revisar si el envío la pidió de nuevo o si Apple la marcó como opcional por venir del mismo binario que iPhone. Si vuelve a pedirla, lo más simple es o (a) subir una captura de iPad real, o (b) quitar iPad/Mac/Apple Vision de "Supported Destinations" en Xcode ya que la app no está pensada para esas pantallas.
- **`GoogleSignIn` y el resto de pods de Google actualizados solo localmente**: el fix del podspec vive en `node_modules/`, que no se versiona en git y se puede perder con un `npm install` limpio. Si se reinstalan las dependencias de `native/`, hay que volver a aplicar el mismo cambio (`GoogleSignIn '>= 7.1.0'` en el podspec del plugin) antes de compilar, o considerar hacer un fork/patch más permanente del plugin si el proyecto crece.
- **Botón de Google en la app nativa**: sigue funcionando con las credenciales ya configuradas (`iosClientId` puesto), pero no se volvió a probar de punta a punta tras el cambio de versión de GoogleSignIn — vale la pena probarlo en TestFlight cuando llegue el build aprobado, antes de asumir que sigue funcionando igual.
- **TestFlight**: no se llegó a crear un grupo de pruebas ni a instalar en un iPhone real antes de enviar a revisión (decisión explícita de Víctor: "envíalo directo a revisión"). Si Apple pide algo relacionado con el login de Apple o de Google que no se pueda reproducir en el simulador, ese sería el primer lugar para probarlo.
