# Bukea — App nativa iOS y Android (Capacitor)

> Actualizado 2026-08-27/28 tras el primer envío real a revisión de Apple. Para la cronología completa de esa sesión (qué se hizo, en qué orden, y por qué) ver `docs/BITACORA-APP-STORE-2026-08-27.md`. Este README es la referencia técnica de cómo funciona el proyecto por dentro, para poder corregir cosas sin tener que redescubrirlas.

Envoltorio nativo de la app web de Bukea. El HTML/CSS/JS del frontend va
**empaquetado dentro de la app** (no se carga remoto vía `server.url`) —
requisito de Apple (regla 4.2, "funcionalidad mínima": un WebView que solo
envuelve un sitio remoto se rechaza). Solo las llamadas a la API
(`fetch(API_BASE + '/api/...')`) van a `https://www.bukeard.com/app` en vivo.

- Se instala en el simulador o en un iPhone real como app de verdad (`com.bukea.app`),
  a pantalla completa y sin barras de Safari.
- El HTML queda fijo en el momento de compilar — para que un cambio en
  `backend/public/index.html` llegue a la app hay que regenerar `www/`
  (ver "Empaquetar el frontend" abajo) y volver a compilar.
- Es el mismo proyecto Xcode que luego se firma y se sube al App Store.

## Empaquetar el frontend

`native/www/` no se edita a mano — se genera desde `backend/public/`
(mismo HTML que sirve la PWA web) con los placeholders sustituidos en
build-time en vez de en caliente por el servidor:

```bash
cd native
node build-www.js       # regenera www/ desde backend/public/
npx cap sync ios        # copia www/ al proyecto Xcode + pod install
```

Corre esto cada vez que cambie `backend/public/index.html` o
`manifest.json`, antes de compilar. `build-www.js` reemplaza
`__BASE_PATH__` por la URL absoluta `https://www.bukeard.com/app` (no un
path relativo — la app no comparte origen con bukeard.com) y
`__GOOGLE_CLIENT_ID__`/`__APPLE_CLIENT_ID__` por los valores reales.

## Requisitos

- Xcode + simulador de iOS
- Node.js (para el CLI de Capacitor)
- CocoaPods (`pod`)
- **La terminal necesita `LANG`/`LC_ALL` en UTF-8** — sin esto, `pod install`
  falla con `Encoding::CompatibilityError` (bug conocido de CocoaPods con
  Ruby en terminales que no exportan la codificación, típico en entornos
  automatizados/CI). Ver comandos abajo, todos ya lo incluyen.

## Instalar dependencias (tras clonar)

`ios/App/Pods/` y `node_modules/` están gitignored — se regeneran:

```bash
cd native
npm install
export LANG=en_US.UTF-8 LC_ALL=en_US.UTF-8   # evita el bug de Unicode de CocoaPods
cd ios/App && pod install
```

### ⚠️ Parche necesario tras `npm install`: versión de GoogleSignIn

El plugin `@codetrix-studio/capacitor-google-auth@3.4.0-rc.4` (sin
actualizar desde su lanzamiento, un release candidate) fija en su podspec
una versión vieja de GoogleSignIn (`~> 6.2.4`, de 2023) que **no incluye
el manifiesto de privacidad que Apple exige desde 2024** para SDKs de
terceros de uso común (`PrivacyInfo.xcprivacy`). Subir un build con esa
versión lo rechaza Apple automáticamente con
`ITMS-91061: Missing privacy manifest` en `GoogleSignIn`, `GTMAppAuth` y
`GTMSessionFetcher` (pasó exactamente eso en el primer envío real,
2026-08-27 — ver la bitácora).

**Cada vez que se borre y regenere `node_modules/` desde cero**, hay que
volver a aplicar este parche antes de compilar un build que se vaya a
subir a App Store Connect:

```bash
# Edita el podspec del plugin, cambia la línea de dependencia:
#   s.dependency 'GoogleSignIn', '~> 6.2.4'
# por:
#   s.dependency 'GoogleSignIn', '>= 7.1.0'
$EDITOR native/node_modules/@codetrix-studio/capacitor-google-auth/CodetrixStudioCapacitorGoogleAuth.podspec

cd native/ios/App
export LANG=en_US.UTF-8 LC_ALL=en_US.UTF-8
pod update GoogleSignIn   # resuelve GoogleSignIn/GTMAppAuth/GTMSessionFetcher/AppAuth a versiones actuales
```

Versiones conocidas buenas (con manifiesto de privacidad, verificado
2026-08-27): GoogleSignIn 9.2.0, GTMAppAuth 5.0.0, GTMSessionFetcher 3.5.0,
AppAuth 2.1.0. Verificar que el manifiesto llegó de verdad:

```bash
find native/ios/App/Pods -iname "PrivacyInfo.xcprivacy" -path "*GoogleSignIn*"
find native/ios/App/Pods -iname "PrivacyInfo.xcprivacy" -path "*GTMAppAuth*"
find native/ios/App/Pods -iname "PrivacyInfo.xcprivacy" -path "*GTMSessionFetcher*"
```

**Ojo con la API:** GoogleSignIn 9.x cambió la API respecto a la 6.x que
esperaba el plugin (`GIDGoogleUser.authentication`/`.serverAuthCode` ya
no existen igual). El plugin vendorizado en `node_modules/` ya está
parchado para usar la API nueva
(`accessToken.tokenString`, `signIn(withPresenting:)`,
`GIDSignInResult.serverAuthCode` en
`node_modules/@codetrix-studio/capacitor-google-auth/ios/Plugin/Plugin.swift`).
Si se reinstala `node_modules/` desde npm limpio, ese parche también se
pierde — hay que reaplicar tanto el cambio del podspec como el de
`Plugin.swift`. **Considerar, si el proyecto sigue creciendo, hacer un
fork propio del plugin en vez de parchear `node_modules/` cada vez** —
es más robusto que depender de que nadie borre esa carpeta sin avisar.

## Compilar e instalar en el simulador

```bash
# ID de un simulador arrancado: xcrun simctl list devices available | grep Booted
SIM=<UUID-del-simulador>
cd native/ios/App
export LANG=en_US.UTF-8 LC_ALL=en_US.UTF-8
xcodebuild -workspace App.xcworkspace -scheme App -configuration Debug \
  -sdk iphonesimulator -destination "id=$SIM" -derivedDataPath build
xcrun simctl install "$SIM" build/Build/Products/Debug-iphonesimulator/App.app
xcrun simctl launch "$SIM" com.bukea.app
```

O simplemente `npx cap open ios` y darle Run (▶) en Xcode.

**Ojo con `xcodebuild` desde terminal vs. Xcode abierto:** si compilaste
alguna vez con `xcodebuild -derivedDataPath build` (como arriba) dentro de
`ios/App/`, queda una carpeta `ios/App/build/` que Xcode NO reconoce como
suya. Si luego intentas `pod install`/`cap sync` con Xcode teniendo el
proyecto abierto, `xcodebuild clean` (que corre `pod install` por dentro)
falla con `Could not delete .../build because it was not created by the
build system`. Solución: `rm -rf native/ios/App/build` y reintentar.

## Compilar, archivar y subir un build real (release)

Esto es lo que se hace para mandar un build a TestFlight/App Store
Connect. Requiere Xcode con la cuenta de Apple Developer ya logueada
(Xcode → Settings → Accounts).

1. **Sincronizar el frontend y los pods** (ver secciones de arriba):
   ```bash
   cd native
   node build-www.js
   LANG=en_US.UTF-8 LC_ALL=en_US.UTF-8 npx cap sync ios
   ```
2. **Incrementar el número de build** (`CURRENT_PROJECT_VERSION` en
   `ios/App/App.xcodeproj/project.pbxproj`, dos ocurrencias — Debug y
   Release). Apple no acepta subir dos veces el mismo número de build
   para la misma versión (`MARKETING_VERSION`), aunque el envío anterior
   haya sido rechazado. Se puede editar a mano el `.pbxproj` con
   `sed`/editor de texto sin abrir Xcode, o desde Xcode: General →
   Identity → Build.
3. **Abrir el workspace correcto** — `native/ios/App/App.xcworkspace`
   (¡no `.xcodeproj`! CocoaPods requiere el workspace). Si Xcode ya
   estaba abierto con otro proyecto de Víctor (pasó una vez: tenía
   **DeportesDO** abierto en vez de Bukea), confirmar en la barra de
   título / bundle identifier antes de seguir — el bundle de Bukea es
   siempre `com.bukea.app`.
4. **Signing & Capabilities → Team**: debe decir **Advanced Multimedia
   Service Ams S.R.L.** (la organización, no el "Personal Team" de
   Víctor) — mismo Team que la cuenta usada en App Store Connect y
   developer.apple.com. "Automatically manage signing" resuelve el
   certificado y provisioning profile solo, una vez el Team está bien
   puesto.
5. **Destino del build**: en el selector de esquema/destino de Xcode,
   cambiar de un simulador o dispositivo físico específico a
   **"Any iOS Device (arm64)"** — es el destino genérico que hace falta
   para poder archivar.
6. **Product → Archive**. Compila en modo Release y abre la ventana
   Organizer con el archivo (`.xcarchive`) listo.
7. **Distribute App → App Store Connect → Distribute** (con las opciones
   recomendadas por defecto). Sube el `.ipa`, Apple lo analiza
   (típicamente 1-3 minutos) y devuelve advertencias o errores.
8. Verificar el correo/la sección **TestFlight** en App Store Connect —
   el build pasa a "Lista para enviar" cuando Apple termina de
   procesarlo. Solo entonces se puede asignar a una versión y enviar a
   revisión.

## Configuración

`capacitor.config.json`:
- `appId`: `com.bukea.app` · `appName`: `Bukea`
- `webDir`: `www/` — el paquete generado por `build-www.js`, ver arriba.
- `server.hostname`/`iosScheme`: sirve el contenido local bajo `https://localhost`
  en vez del esquema `capacitor://` por defecto — mejor compatibilidad con SDKs
  de terceros que verifican el origen.
- `plugins.GoogleAuth`: config del login nativo de Google (`iosClientId`,
  `serverClientId` — **ya están puestos con valores reales**, no son
  placeholders desde el 2026-08-27). `androidClientId` (agregado
  2026-09-03) usa **el mismo valor que `serverClientId`** a propósito: en
  Android, `GoogleSignInOptions.requestIdToken()` recibe directamente el
  Client ID cuya audiencia debe verificar el backend (no hay un parámetro
  `serverClientID` separado como en iOS) — así que tiene que ser el Client
  ID **web**, el mismo que ya usa `GOOGLE_CLIENT_ID` en el backend
  (`lib/oauth.js`), no un Client ID de tipo "Android". Ver la sección
  "Login con Google en Android" más abajo para el paso de configuración
  que falta en Google Cloud Console.

El ícono (la "b" itálica sobre teal con punto dorado) está en
`ios/App/App/Assets.xcassets/AppIcon.appiconset/` — un solo archivo
universal de 1024×1024 sin canal alfa (`AppIcon-512@2x.png`), formato
moderno de asset catalog. App Store Connect lo toma automáticamente del
binario subido, no hay que cargarlo aparte en la web.

## Login con Google dentro de la app

Google bloquea a propósito su SDK **web** de login dentro de cualquier
WebView embebido en una app nativa (política antiphishing desde 2016: el
script `accounts.google.com/gsi/client` ni siquiera llega a cargar ahí,
aunque el resto de la red funcione perfecto). Por eso la app usa el
plugin nativo `@codetrix-studio/capacitor-google-auth` en vez del SDK web
(el sitio web `bukeard.com` sigue usando el SDK web de siempre, ese no
tiene el problema). El código en `backend/public/index.html` ya detecta
el contexto (`window.Capacitor.isNativePlatform()`) y usa uno u otro
automáticamente.

**Configurado y con credencial real desde 2026-08-27** — ver
`capacitor.config.json` (`plugins.GoogleAuth.iosClientId`). Si hace falta
recrear la credencial (por ejemplo si se pierde o hay que rotarla):

1. En [Google Cloud Console](https://console.cloud.google.com/apis/credentials),
   mismo proyecto que el Client ID web, crear: **Crear credenciales →
   ID de cliente de OAuth → Tipo: iOS**.
2. **Bundle ID:** `com.bukea.app`
3. Google entrega un **Client ID** (`NUMEROS-hash.apps.googleusercontent.com`)
   y un **iOS URL scheme** (`com.googleusercontent.apps.NUMEROS-hash`).
4. Reemplazar `iosClientId` en `capacitor.config.json` y el URL scheme en
   `ios/App/App/Info.plist` (`CFBundleURLTypes`).
5. Recompilar y probar el botón de Google en el simulador o en
   TestFlight — **no se volvió a probar de punta a punta tras
   actualizar GoogleSignIn de 6.2.4 a 9.2.0** (ver sección de arriba),
   así que conviene probarlo antes de asumir que el flujo sigue igual.

## Sign In with Apple

Plugin `@capacitor-community/apple-sign-in@6` (la v7 pide Capacitor 7 y
el proyecto usa 6). Entitlement en
`ios/App/App/App.entitlements`, cableado en el `.pbxproj` (Debug y
Release), y capacidad activada en el App ID `com.bukea.app` en
developer.apple.com (confirmado 2026-08-27, checkbox "Sign In with
Apple" marcado). `loginWithApple()` en `index.html` usa la hoja nativa
del sistema cuando corre empaquetada (el SDK web de Apple no funciona en
WKWebView); `backend/lib/oauth.js` acepta el token nativo con audience
`com.bukea.app` además del Service ID web.

## Estado en App Store Connect (referencia rápida)

- **App ID**: `6805996215` · bundle `com.bukea.app`
- **Team**: Advanced Multimedia Service Ams S.R.L. (organización, no
  personal)
- **Ficha**: "Bukea: citas y reservas", Español (México), gratis,
  categoría Estilo de vida / Compras
- **Historial de builds subidos**:
  - Build 1 (2026-08-27, ~21:04) — **rechazado**, `ITMS-91061` (ver
    arriba). Envío cancelado en App Store Connect.
  - Build 2 (2026-08-27/28, madrugada) — aceptado por Apple, enviado a
    revisión y **aprobado**: versión 1.0 quedó publicada en la App
    Store. El tren de versión 1.0 quedó cerrado para builds nuevos
    (Apple exige subir `MARKETING_VERSION` para poder subir otro build).
  - Build 4, versión 1.1 (2026-09-09, ~22:13) — subido a App Store
    Connect vía `xcodebuild -exportArchive ... -exportOptionsPlist
    (destination: upload)` en vez del flujo manual de Xcode (Organizer
    tuvo problemas de accesibilidad al automatizar clics en el navegador
    de proyecto). **Solo subido, no enviado a revisión todavía** — falta
    entrar a App Store Connect, asignar el build a la versión 1.1 y
    tocar "Enviar a revisión" una vez Apple termine de procesarlo
    (unos minutos). Trae el selector de Provincia/Sector con hoja +
    buscador, "Cerrar sesión" y "Eliminar mi cuenta" en el panel de
    negocio, y el resto de los cambios acumulados desde el build 2.
    Misma advertencia no bloqueante de siempre:
    `ITMS-90068: MinimumOSVersion too low` — el proyecto declara iOS 13.0
    como mínimo, y Apple exigirá 15.0+ a partir de primavera de 2027
    para poder subir builds nuevos. No urgente todavía, pero hay que
    subir `Minimum Deployments` en Xcode antes de esa fecha.

**Nota sobre el flujo de subida (2026-09-09):** automatizar el
Organizer de Xcode por clics resultó frágil (el navegador de proyecto
de Xcode no expone sus filas como elementos de accesibilidad normales;
un clic en la fila raíz "App" la ponía en modo renombrar en vez de
seleccionarla). Se usó en su lugar `xcodebuild archive` +
`xcodebuild -exportArchive` con un `ExportOptions.plist` con
`<key>destination</key><string>upload</string>` — sube directo a App
Store Connect sin pasar por el Organizer, usando la firma automática y
la cuenta de Apple Developer ya logueada en Xcode. Comandos:

```bash
cd native/ios/App
export LANG=en_US.UTF-8 LC_ALL=en_US.UTF-8
xcodebuild -workspace App.xcworkspace -scheme App -configuration Release \
  -destination "generic/platform=iOS" -archivePath build-archive/Bukea.xcarchive \
  -allowProvisioningUpdates archive
xcodebuild -exportArchive -archivePath build-archive/Bukea.xcarchive \
  -exportOptionsPlist build-archive/ExportOptions.plist \
  -exportPath build-archive/export -allowProvisioningUpdates
```
`build-archive/` queda gitignored (es un artefacto de build, como
`build/`).
- **Supported Destinations** en Xcode incluye iPhone, iPad, Mac
  (Designed for iPad) y Apple Vision (Designed for iPad) — configuración
  por defecto de Capacitor, nunca se decidió explícitamente soportar
  iPad/Mac/Vision. Si App Store Connect vuelve a pedir una captura de
  iPad de 13" para poder enviar, lo más simple es quitar esos destinos
  extra en General → Supported Destinations, ya que la app no está
  pensada para esas pantallas.
- Detalle completo de todo el proceso de envío: `docs/BITACORA-APP-STORE-2026-08-27.md`.

## Android (Capacitor)

Mismo proyecto web, empaquetado también para Android (`android/`, plataforma
agregada el 2026-09-03 con `npx cap add android`). Mismo `applicationId`
que el `appId` de iOS: `com.bukea.app`.

### Requisitos

- **Java 17** (`brew install openjdk@17`) — Gradle no corre con el `java`
  del sistema si no está instalado.
- **Android SDK** (command line tools, sin Android Studio):
  `brew install --cask android-commandlinetools`. Tras instalarlo:
  ```bash
  export ANDROID_HOME="/opt/homebrew/share/android-commandlinetools"
  export JAVA_HOME="/opt/homebrew/opt/openjdk@17"
  mkdir -p ~/Library/Android/sdk ~/.android
  touch ~/.android/repositories.cfg   # evita "Failed to read or create install properties file"
  yes | "$ANDROID_HOME/cmdline-tools/latest/bin/sdkmanager" --licenses
  yes | "$ANDROID_HOME/cmdline-tools/latest/bin/sdkmanager" --sdk_root="$HOME/Library/Android/sdk" \
    "platform-tools" "platforms;android-34" "build-tools;34.0.0"
  ```
  **Ojo:** hay que pasar `--sdk_root="$HOME/Library/Android/sdk"` explícito
  en cada instalación de paquetes — sin ese flag `sdkmanager` se cuelga en
  10% con "Warning: Failed to read or create install properties file" y
  nunca termina (bug conocido de esta versión de las command line tools
  contra el `ANDROID_HOME` que instala Homebrew, que es un symlink).
- `android/local.properties` (gitignored) apunta Gradle al SDK:
  ```
  sdk.dir=/Users/<tu-usuario>/Library/Android/sdk
  ```

### Empaquetar el frontend y compilar

```bash
cd native
node build-www.js         # regenera www/ desde backend/public/ (igual que iOS)
npx cap sync android       # copia www/ a android/app/src/main/assets/public + plugins
cd android
export JAVA_HOME="/opt/homebrew/opt/openjdk@17"
export ANDROID_HOME="$HOME/Library/Android/sdk"
./gradlew assembleDebug    # genera app/build/outputs/apk/debug/app-debug.apk
```

Para instalar en un emulador o dispositivo conectado:
`$ANDROID_HOME/platform-tools/adb install app/build/outputs/apk/debug/app-debug.apk`.

O `npx cap open android` para abrir el proyecto en Android Studio (si está
instalado) y compilar/depurar desde ahí.

### Ícono

Generado desde el mismo ícono maestro de iOS
(`ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png`,
1024×1024) hacia todas las densidades de `android/app/src/main/res/mipmap-*/`
(`ic_launcher.png`/`ic_launcher_round.png` planos + `ic_launcher_foreground.png`
del ícono adaptativo, escalado al 66% dentro del área segura). El color de
fondo del ícono adaptativo (`values/ic_launcher_background.xml`) es
`#0F6F6A`, tomado del teal del logo. Si el logo maestro cambia, regenerar
con un script equivalente (Pillow/`sips`) en vez de editar los PNG a mano.

### Firma y publicación (Google Play)

**Keystore de release generado y build firmado el 2026-09-03.**
`android/keystore/bukea-release.keystore` (PKCS12, alias `bukea-upload`,
válido hasta 2054) firma ahora los builds `release`. Las credenciales
viven en `android/keystore.properties` — **ninguno de los dos archivos
está en git** (ver `.gitignore`), son secretos permanentes: si se
pierden, no hay forma de recuperarlos ni de volver a subir
actualizaciones sobre la misma ficha de Play Store (habría que publicar
la app de nuevo desde cero, con otro `applicationId`). **Víctor: haz un
respaldo de la carpeta `android/keystore/` completa (el `.keystore` + el
`.properties`) en un lugar seguro fuera de este repo (un gestor de
contraseñas, una carpeta cifrada) antes de seguir** — no quedó copia en
ningún otro lado.

Cómo se armó (`android/app/build.gradle` lee `keystore.properties` si
existe; si no, el build de release simplemente no queda firmado, no
falla):

```bash
cd native/android
keytool -genkeypair -v -keystore keystore/bukea-release.keystore \
  -alias bukea-upload -keyalg RSA -keysize 2048 -validity 10000
```

Para generar un `.aab` firmado (lo que pide Play Console, no el `.apk`):

```bash
cd native
node build-www.js && npx cap sync android
cd android
export JAVA_HOME="/opt/homebrew/opt/openjdk@17"
export ANDROID_HOME="$HOME/Library/Android/sdk"
./gradlew bundleRelease   # genera app/build/outputs/bundle/release/app-release.aab
```

**SHA-1 del keystore de release** (hace falta para el credential OAuth
de Android en Google Cloud Console, ver "Login con Google y Apple en
Android" abajo — esta huella sí es la definitiva, a diferencia de la de
debug que cambia por máquina):

```
49:E7:DE:4F:66:81:60:C2:B9:8A:6A:66:0B:E2:9A:57:E1:D5:C5:98
```

(recalculable con `keytool -list -v -keystore android/keystore/bukea-release.keystore -alias bukea-upload`,
pide el `storePassword` de `keystore.properties`).

**La cuenta de Google Play Console ya existe** — se creó el 2026-07-10
para DeportesDO (otro producto de Víctor bajo la misma organización) y
sirve para publicar cualquier número de apps, no es una cuenta por app:
Play Console de organización "AMS Multimedia", ID de cuenta
`7036363227179558088`, dueño `vmdventura@gmail.com` (mismo correo
maestro de Bukea). Ya está pagado el registro único de US$25 y la
identidad de la organización (Advanced Multimedia Service Ams S.R.L.)
verificada. **No hace falta crear cuenta ni pagar de nuevo** — el
siguiente paso es directamente crear la ficha de la app "Bukea" dentro
de esa cuenta existente (Play Console → Crear app → paquete
`com.bukea.app`).

Falta todavía, no se hizo esta pasada:

- Crear la ficha de la app dentro de la cuenta de Play Console existente
  y subir el primer `.aab`, decidiendo si inscribirse en **Play App
  Signing** (recomendado por Google: Google guarda una copia de la clave
  de distribución final y `bukea-upload` pasa a ser solo la "clave de
  carga" — protege contra la pérdida total del keystore).
- Ficha en Play Console (capturas, descripción, política de privacidad,
  clasificación de contenido) — mismo trabajo que se hizo para App Store
  Connect, ver `docs/BITACORA-APP-STORE-2026-08-27.md` como referencia.

### Login con Google y Apple en Android (paridad con iOS, 2026-09-03)

El código de `backend/public/index.html` distingue ahora tres contextos
(antes solo distinguía "nativo" vs. "navegador", lo cual trataba a
Android igual que iOS aunque los dos plugins nativos de login están
pensados solo para iOS): `isNativeApp` (cualquier app empaquetada),
`isIosApp` (`Capacitor.getPlatform() === 'ios'`) y el navegador normal
(ninguno de los dos).

- **Google**: `@codetrix-studio/capacitor-google-auth` sí tiene
  implementación real en Android (a diferencia de Apple, ver abajo), así
  que Android usa el mismo plugin nativo que iOS
  (`window.Capacitor.Plugins.GoogleAuth`, gateado por `isNativeApp`, sin
  cambios). Lo que sí hacía falta era el Client ID: el código en Android
  llama `requestIdToken(androidClientId)` (`GoogleAuth.java` del plugin,
  `initialize()`), y sin `plugins.GoogleAuth.androidClientId` en
  `capacitor.config.json` caía al placeholder que trae el plugin por
  defecto (`"Your Web Client Key"`, en
  `node_modules/@codetrix-studio/capacitor-google-auth/android/src/main/res/values/strings.xml`)
  — el botón se veía activo (el guard de "Próximamente" solo miraba
  `iosClientId`, que sí es real) pero el login fallaba en silencio al
  tocarlo. Ya está corregido: `androidClientId` se agregó con **el mismo
  valor que `serverClientId`** (ver nota en "Configuración" arriba).
  ✅ **Resuelto 2026-09-03** — Google Play Services rechaza el sign-in
  (`DEVELOPER_ERROR`, código 10) si no existe un **credential de tipo
  Android** registrado en el mismo proyecto de Google Cloud Console,
  aparte del Client ID que usa el código. Se crearon los dos que hacían
  falta, en el proyecto "Bukea" de Google Cloud Console (con la sesión de
  `vmdventura@gmail.com` — **ojo:** este Chrome también tiene activa la
  cuenta `inprocessstudios@gmail.com`, hay que cambiar de cuenta antes de
  entrar a Credenciales o carga el proyecto equivocado):
  - **Bukea Android (debug)** — `com.bukea.app` +
    `23:B6:BC:87:23:AB:22:37:D8:08:40:17:D9:4E:A5:76:1C:F6:B9:D8` → client
    id `419876529270-58ak...apps.googleusercontent.com`
  - **Bukea Android (release)** — `com.bukea.app` +
    `49:E7:DE:4F:66:81:60:C2:B9:8A:6A:66:0B:E2:9A:57:E1:D5:C5:98` → client
    id `419876529270-7fjh...apps.googleusercontent.com`

  Google avisa que la propagación puede tardar de minutos a un par de
  horas — si el login de Google en Android falla con `DEVELOPER_ERROR`
  poco después de este cambio, esperar y reintentar antes de asumir que
  algo está mal configurado. Ninguno de estos dos Client ID va en el
  código (a diferencia de `androidClientId` en `capacitor.config.json`,
  que sigue siendo el Client ID **web**) — con que existan, registrados
  con el SHA-1 correcto, alcanza.

  Referencia de lo que hacía falta, para el próximo keystore de release
  que se genere (por ejemplo si se pierde el actual, ver "Firma y
  publicación" abajo — habría que repetir este paso con el SHA-1 nuevo):
  - **Nombre del paquete:** `com.bukea.app`
  - **Huella digital del certificado SHA-1:** hacen falta **dos**
    credenciales de tipo Android registradas por separado (una por
    keystore), o el login de Google solo funcionará en una de las dos
    variantes:
    - **Debug** (para poder probar mientras se desarrolla) —
      `23:B6:BC:87:23:AB:22:37:D8:08:40:17:D9:4E:A5:76:1C:F6:B9:D8`, del
      keystore de debug de esta máquina en particular (**no sirve para
      release** — cada máquina genera el suyo automáticamente; para
      recalcularlo en otra: `keytool -list -v -keystore
      ~/.android/debug.keystore -alias androiddebugkey -storepass android
      -keypass android | grep SHA1`).
    - **Release** (la que de verdad importa, la del build que se sube a
      Play Store) —
      `49:E7:DE:4F:66:81:60:C2:B9:8A:6A:66:0B:E2:9A:57:E1:D5:C5:98`, del
      keystore `android/keystore/bukea-release.keystore` generado el
      2026-09-03 (ver "Firma y publicación" arriba). Si más adelante se
      habilita **Play App Signing** y Google reemplaza la clave de
      distribución final, hay que agregar también el SHA-1 que Google
      asigne ahí.
  - No hace falta usar el Client ID que Google entregue ahí en ningún
    lado del código — solo con que exista, registrado con el SHA-1
    correcto, Google Play Services deja de rechazar el sign-in.
- **Apple**: `@capacitor-community/apple-sign-in` **no tiene
  implementación real en Android** — su carpeta `android/` existe (por
  eso Capacitor sí registra el plugin al hacer `cap sync android`, y
  `window.Capacitor.Plugins.SignInWithApple` existe en tiempo de
  ejecución) pero el único método Java que trae es un `echo()` de
  plantilla, sin `authorize()`. Antes de esta pasada, el código de
  `index.html` solo miraba `isNativeApp` para decidir "usar el plugin
  nativo", así que en Android el botón se mostraba activo pero
  `.authorize()` fallaba con un error genérico al tocarlo. Ya está
  corregido: el gate ahora es `isIosApp` (no `isNativeApp`), así que en
  Android (y en el navegador) el botón usa el mismo **SDK web de Apple**
  (`AppleID.auth`) que ya usa el sitio `bukeard.com` — el comentario
  original del código ya documentaba que, a diferencia de Google, Apple
  no bloquea su SDK web dentro de un WebView embebido, así que en teoría
  debería funcionar igual dentro del WebView de Android. **No se probó
  de punta a punta en un dispositivo/emulador Android real** (el popup
  `usePopup: true` de `AppleID.auth` depende de que el WebView de
  Capacitor soporte ventanas emergentes; no se verificó esta pasada) —
  conviene probarlo antes de asumir que el flujo completo funciona.

## Pendientes conocidos

- Subir `Minimum Deployments` de iOS 13.0 a 15.0+ antes de primavera de
  2027 (fecha límite dura de Apple para poder seguir subiendo builds).
- Decidir si quitar Mac/Apple Vision de "Supported Destinations" (ver
  arriba) o dejarlos y resolver las capturas que pidan.
- Probar el login de Google de punta a punta en un dispositivo real
  (TestFlight) tras la actualización de GoogleSignIn 6.2.4 → 9.2.0 — no
  se hizo antes de enviar a revisión.
- Considerar reemplazar `@codetrix-studio/capacitor-google-auth` (sin
  mantenimiento activo, versión `3.4.0-rc.4`) por una alternativa
  mantenida si el parcheo manual de `node_modules/` se vuelve una carga
  recurrente.
- **Android** (ver sección "Login con Google y Apple en Android" arriba):
  ✅ credential OAuth de tipo Android ya registrado en Google Cloud
  Console (2026-09-03, debug y release). Falta probar en un
  dispositivo/emulador real que el login de Google y el de Apple por SDK
  web funcionen de punta a punta dentro del WebView de Capacitor
  dentro del WebView de Capacitor. El `.aab` de release ya está firmado
  (2026-09-03, ver "Firma y publicación (Google Play)" arriba) — la
  cuenta de Google Play Console ya existe (compartida con DeportesDO, ver
  esa misma sección), falta crear la ficha de la app y subirlo por
  primera vez.
