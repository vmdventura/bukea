# Bukea — Ficha de Google Play Console

> Preparado el 2026-09-03. La app nativa Android (`native/android/`, Capacitor, `com.bukea.app`) ya tiene un `.aab` de release firmado (ver `native/README.md`, sección "Firma y publicación"). La cuenta de Play Console **ya existe** (compartida con DeportesDO, ver memoria del proyecto) — no hay que crearla ni pagarla de nuevo. Esta ficha copia y adapta la del App Store (`docs/APP-STORE-CHECKLIST.md`) a los campos y límites propios de Play Console.

---

## 1. Datos técnicos del paquete

- **Nombre del paquete:** `com.bukea.app`
- **Tipo de app:** App nativa (Capacitor), no una TWA — el HTML va empaquetado dentro del `.aab`, no carga un sitio remoto envuelto. **No hace falta publicar `assetlinks.json`** (eso solo aplica a Trusted Web Activities).
- **`.aab` a subir:** `native/android/app/build/outputs/bundle/release/app-release.aab`
- **Keystore de firma:** `native/android/keystore/bukea-release.keystore` (alias `bukea-upload`) — SHA-1 documentado en `native/README.md`, necesario también para el credential OAuth de Android en Google Cloud Console (login de Google).

---

## 2. Presencia en la tienda → Ficha principal

### Nombre de la app (máx. 30 caracteres)
`Bukea`

### Descripción breve (máx. 80 caracteres)
```
Reserva tu cita de barbería, uñas o salón en RD. Rápido, gratis, sin llamadas.
```
(78 caracteres)

### Descripción completa (máx. 4000 caracteres)
```
Bukea es la forma más fácil de reservar tu barbero, tu manicurista o tu salón en República Dominicana. Busca por categoría o por zona, mira los servicios con sus precios en pesos, elige el día y la hora que te sirven y confirma. Sin llamadas, sin "¿tienes turno?".

📅 CITA REAL
Reserva con fecha y hora real, según la agenda de verdad del negocio — no horarios inventados.

💵 PAGA COMO PAGAMOS AQUÍ
Efectivo o transferencia, con las cuentas del negocio a la mano. Bukea no procesa pagos ni guarda datos de tarjetas.

💬 RECORDATORIOS POR WHATSAPP
Para que no se te pase la cita.

🗺️ BUSCA POR ZONA
Encuentra el negocio más cerca de ti, con "Cómo llegar" directo a Google Maps, Apple Maps o Waze.

✂️ ¿TIENES UN NEGOCIO?
Únete gratis: agenda en vivo, tu cuadre del día, tu perfil compartible para tu bio de Instagram o WhatsApp, y tu equipo si trabajas con más gente.

Bukea es gratis para clientes y para negocios. Bukear nunca fue tan fácil.
```
(941 caracteres, muy por debajo del límite)

### Categoría
- **Categoría de la app:** Estilo de vida
- **Etiquetas** (si Play Console las pide): belleza, citas, barbería, salón, República Dominicana

### Datos de contacto
- **Correo:** `hola@bukeard.com`
- **Sitio web:** `https://www.bukeard.com`
- **Teléfono:** (opcional — agregar si Víctor quiere exponer uno)
- **Política de privacidad:** `https://www.bukeard.com/privacidad`

### Gráficos
- **Ícono de alta resolución (512×512):** el mismo ícono de la app, ya generado — `native/android/app/src/main/res/mipmap-xxxhdpi/ic_launcher.png` (192×192, hay que exportar la versión 512 desde el maestro `native/ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png`, que sí es 1024×1024 y se puede reducir).
- **Gráfico de funciones (1024×500):** ✅ listo — `docs/play-store-assets/feature-graphic-1024x500.png`. Logo "b Bukea" (mismas tipografías de marca, Fraunces + Plus Jakarta Sans) + "Reserva tu cita en 60 segundos" sobre el degradado teal oscuro de la identidad visual. Renderizado con Chrome headless al tamaño exacto, PNG de 24 bits sin canal alfa.
- **Capturas de pantalla del teléfono:** ✅ listas — `docs/play-store-assets/screenshots/01-inicio.png` a `04-mi-cuadre.png`. Son las mismas 4 que se usaron en App Store Connect (`docs/BITACORA-APP-STORE-2026-08-27.md`, sección 4), **recortadas de 2.16:1 a exactamente 2.0:1** (853×1706 / 854×1708) porque Play Console rechaza cualquier captura con relación de aspecto mayor a 2:1 y las originales la excedían. El recorte quitó solo fondo vacío arriba y abajo, verificado una por una — ningún texto ni parte de la pantalla del teléfono se cortó.
  - ⚠️ **Estas 4 imágenes muestran un iPhone** (Dynamic Island, barra de estado "9:41" de iOS) porque son las mismas que se hicieron para el App Store. Play Console no las rechaza por esto (no es un requisito técnico), pero es una inconsistencia visible para quien compare las capturas con "esto es para Android". Decisión de Víctor: usarlas tal cual (más rápido) o pedir una tanda nueva con marco de teléfono Android/sin marco (más trabajo, mejor coherencia de marca).

---

## 3. Presencia en la tienda → Seguridad de los datos — ✅ completado en Play Console 2026-09-03

Todo el cuestionario ("Seguridad de los datos") se llenó y guardó dentro de la ficha real de Play Console (no solo documentado aquí): ubicación aproximada, información personal (nombre, correo, IDs de usuario, teléfono), información financiera (otra información financiera), fotos y vídeos, archivos y documentos, actividad en la app (interacciones), e IDs de dispositivo — los 9 tipos de la tabla de abajo, cada uno marcado "Se comparten" + propósito "Análisis" (vía GA4) donde aplica. Vista previa final revisada y guardada. Sección "Contenido de la aplicación" completa además con:
- **ID de publicidad:** No (la app no usa SDK nativo de Firebase/Ads, GA4 corre como JS en el WebView).
- **Aplicaciones gubernamentales:** No.
- **Funciones financieras:** "Mi aplicación no proporciona funciones financieras" (Bukea solo muestra cuentas bancarias del negocio para que el cliente transfiera manualmente fuera de la app; no procesa pagos).
- **Aplicaciones de salud:** "Mi aplicación no tiene ninguna función de salud".

Con esto, "Contenido de la aplicación" en Play Console quedó en 0 declaraciones pendientes ("Ya estás al día").

Basado en la revisión real del código (`backend/public/index.html`, `backend/routes/`, `backend/lib/`), no en una plantilla genérica — Bukea sí recopila datos personales, a diferencia de una app de solo lectura:

### ¿La app recopila o comparte datos de usuario?
**Sí.**

### Tipos de datos recopilados

Mismos 9 tipos que ya se declararon (y Apple ya aprobó) en la sección "Privacidad de la app" de App Store Connect — ver `docs/BITACORA-APP-STORE-2026-08-27.md` sección 3. Las dos primeras versiones de esta tabla se me habían quedado cortas (faltaba ubicación aproximada y la cédula/RNC como dato financiero aparte); ya corregido para que ambas fichas digan lo mismo:

| Categoría | Dato | Para qué | ¿Opcional? |
|---|---|---|---|
| Información personal | Nombre | Crear la cuenta, identificar al cliente ante el negocio | No |
| Información personal | Número de teléfono | Login (teléfono+PIN), confirmaciones por WhatsApp | No |
| Información personal | Correo electrónico | Solo para recuperar el PIN si se olvida | Sí |
| Información personal | Foto de perfil (si entra con Google/Apple) | Mostrarla en el perfil | Sí (la entrega el proveedor de login) |
| Información financiera | Cuentas bancarias (solo para negocios, no para clientes) | El negocio las muestra a sus clientes para recibir transferencias | Sí, decisión del negocio |
| Información financiera | Cédula/RNC del titular de la cuenta bancaria | Que el cliente verifique a quién le transfiere, como en una transferencia dominicana real | Sí, decisión del negocio |
| Fotos y videos | Comprobante de pago (imagen o PDF que el cliente adjunta) | Que el negocio verifique el pago de una cita | Sí |
| Ubicación | Ubicación aproximada (por IP, vía Google Analytics) | Analítica de uso agregada — la app **no** pide el GPS del dispositivo | No se puede desactivar dentro de la app |
| Historial de la app | Historial de citas (fecha, hora, negocio, estado) | Mostrar "Mis citas", que el negocio vea su agenda | No |
| Identificadores de la app | Identificador de dispositivo/uso vía Google Analytics (GA4) | Medir uso de la app (páginas vistas, eventos) | No se puede desactivar dentro de la app |

### ¿Se comparte con terceros?
- **Con el negocio que el cliente reserva** — necesario para que sepa quién llega y pueda contactarlo.
- **Con Meta (WhatsApp Business API)** — para enviar confirmaciones y recordatorios de citas.
- **Con Google (Analytics, GA4)** — datos de uso agregados, ver arriba.
- **Con Google/Apple (si el usuario elige entrar con esos botones)** — solo para autenticar, no se comparte nada de vuelta hacia ellos que no hayan entregado ellos mismos.
- **No se vende información a nadie**, y no hay redes de publicidad (AdMob, Meta Ads SDK, etc.) integradas en la app.

### Prácticas de seguridad
- **¿Los datos se transmiten cifrados?** Sí, todo el tráfico va sobre HTTPS.
- **¿Se puede pedir que se borren los datos?** Sí — "Eliminar mi cuenta" dentro de la app (anonimiza nombre, teléfono, correo y oculta el negocio si tiene uno; `POST /api/auth/delete-account`), o escribiendo a `hola@bukeard.com`.
- **¿Los datos son necesarios para la función principal de la app?** Sí (nombre, teléfono e historial de citas son indispensables para reservar).

Play Console pide marcar cada tipo de dato individualmente en su propio formulario paso a paso — usar la tabla de arriba como guía para cada pantalla del cuestionario.

---

## 3.1 Acceso a la app (equivalente a las "Notas para el revisor" de Apple)

Play Console pregunta si la app tiene contenido restringido detrás de un login, y pide credenciales de prueba para que el revisor entre — lo mismo que se le dio a Apple el 2026-08-27 (ver bitácora, sección 8):

- **¿Se necesita iniciar sesión para usar la app?** Sí, para reservar o para el panel de negocio (explorar el marketplace sin cuenta sí funciona).
- **Cuenta de prueba:** teléfono `8095550100`, PIN `1234` (la misma cuenta que ya se usó con Apple — **verificado de nuevo el 2026-09-03**, `POST /api/auth/check` confirma que la cuenta "Prueba Claude" sigue existiendo en producción; no se probó el PIN para no gastar el contador de intentos del rate limit, pero la cuenta está viva).
- **Instrucciones para el revisor** (mismo texto que se le dio a Apple, adaptado):
  > Bukea es un marketplace de reservas de belleza en República Dominicana. Puedes explorar el marketplace sin cuenta. Para reservar una cita o ver el panel de negocio, usa la cuenta de prueba (teléfono 8095550100, PIN 1234). El pago es en efectivo o transferencia directa al negocio — la app no procesa pagos ni guarda datos de tarjetas.

## 3.2 Anuncios

**No, la app no muestra anuncios.** (No hay AdMob ni ningún SDK de publicidad integrado — confirmado revisando `native/android/app/build.gradle` y los plugins de Capacitor instalados.)

## 3.3 Audiencia objetivo y contenido

- **Grupo de edad objetivo:** 18 años o más (la app permite crear un negocio, reservar y pagar/coordinar transferencias — no está dirigida a menores, igual que se declaró implícitamente en la clasificación "4+" de Apple, que es sobre *contenido*, no sobre a quién se dirige el marketing).
- **¿Apela a niños aunque no sea el público principal?** No.
- **Apps de noticias / apps del gobierno / apps de salud financiera (declaraciones adicionales que a veces pide Play Console):** No aplica a ninguna.

---

## 4. Clasificación de contenido (cuestionario IARC)

La app no tiene violencia, contenido sexual, apuestas, ni interacción pública entre usuarios (los mensajes van negocio↔cliente por WhatsApp, fuera de la app):

| Pregunta del cuestionario | Respuesta sugerida |
|---|---|
| Violencia | Ninguna |
| Contenido sexual/desnudez | Ninguno |
| Lenguaje soez | Ninguno |
| Referencias a drogas/alcohol/tabaco | Ninguna |
| Juego con dinero real o simulado | No |
| Contenido generado por el usuario visible a otros usuarios | No (las reseñas/calificaciones, si existen, no son de texto libre público) |
| Comparte ubicación | No (la ubicación del negocio es por sector/texto, no pide GPS del dispositivo) |
| Compras dentro de la app | No (Bukea no procesa pagos) |

Resultado esperado: clasificación para todo público (equivalente a "PEGI 3" / "Everyone").

---

## 5. Notas de la versión (release inicial)

```
🎉 Primera versión de Bukea para Android: reserva tu cita de barbería, uñas, salón y más en República Dominicana. Agenda real, pago en efectivo o transferencia, recordatorios por WhatsApp. Gratis para clientes y para negocios.
```

---

## 6. Capturas de pantalla — ✅ resueltas 2026-09-03

Se reutilizaron las 4 capturas ya hechas para App Store en vez de generar unas nuevas desde cero — ver sección 2 arriba (`docs/play-store-assets/screenshots/`). Cumplen los requisitos técnicos de Play Console: PNG, lado más largo 1706-1708px (dentro del rango 320-3840px permitido), relación de aspecto 2:1 exacta (el máximo que acepta Play Console; las originales de App Store eran 2.16:1 y se recortaron).

Si más adelante se quiere una tanda nueva específica para Android (por la marca de iPhone visible, ver nota de la sección 2), las mismas 4 pantallas de la app siguen siendo las más representativas:
1. Inicio con categorías.
2. Resumen del panel de negocio.
3. Calendario con citas reales.
4. Mi Cuadre (ventas del negocio).

---

## 7. Pasos que solo Víctor puede hacer, en orden

1. ✅ **Entrar a Play Console** con la cuenta existente (`vmdventura@gmail.com`, organización "AMS Multimedia") → **Crear app** hecho.
2. ✅ **Ficha principal** (nombre, descripciones, categoría, contacto) cargada.
3. ✅ **"Seguridad de los datos"** completo (ver sección 3 arriba, actualizado 2026-09-03).
4. ✅ **Clasificación de contenido** (cuestionario IARC) completa.
5. ✅ **Gráficos subidos** — ícono 512×512, gráfico de funciones 1024×500 y las 4 capturas, todos en `docs/play-store-assets/`.
6. ✅ **Credential OAuth de Android registrado** en Google Cloud Console (2026-09-03, debug y release) — ver `native/README.md`, sección "Login con Google y Apple en Android". Google avisa que la propagación puede tardar hasta un par de horas.
7. ✅ **Crear una versión** (Producción, directo, decisión de Víctor 2026-09-04) → `app-release.aab` subido, versión 2 (1.0). **Bloqueó el primer intento:** Google exige `targetSdkVersion`/`compileSdkVersion` mínimo 36 (el proyecto tenía 34) — se instaló el SDK platform 36 y build-tools 36.0.0, se subió Android Gradle Plugin a 8.7.3 y el Gradle wrapper a 8.9 (`native/android/variables.gradle`, `build.gradle`, `gradle-wrapper.properties`), se recompiló y refirmó el `.aab` con el mismo keystore. `versionCode` pasó de 1 a 2 porque el primer intento (SDK 34, rechazado) ya había consumido el código 1. 177 países/regiones (mundial, decisión de Víctor) en vez de solo RD.
8. ✅ **Enviado a revisión** el 2026-09-04 (11 cambios: versión, países, ficha, clasificación, etc.). Google Play suele revisar en horas, a veces hasta un par de días en el primer envío de una cuenta/app nueva.
