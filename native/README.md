# Bukea — App nativa iOS (Capacitor)

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

## Instalar dependencias (tras clonar)

`ios/App/Pods/` y `node_modules/` están gitignored — se regeneran:

```bash
cd native
npm install
export LANG=en_US.UTF-8 LC_ALL=en_US.UTF-8   # evita el bug de Unicode de CocoaPods
cd ios/App && pod install
```

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

## Configuración

`capacitor.config.json`:
- `appId`: `com.bukea.app` · `appName`: `Bukea`
- `server.url`: `https://www.bukeard.com/app/` — de dónde carga el contenido en vivo.
- `webDir`: `www/` — placeholder mínimo (Capacitor lo exige aunque carguemos remoto).

El ícono (la "b" itálica sobre teal con punto dorado) está en
`ios/App/App/Assets.xcassets/AppIcon.appiconset/`.

## Pendiente para publicar en App Store

- ~~Empaquetar el frontend dentro de la app~~ — resuelto 2026-08-24, ver "Empaquetar el frontend" arriba.
- ~~Cuenta Apple Developer (US$99/año)~~ — ya la tiene Víctor.
- Firma de código (certificado de distribución + provisioning profile en App Store Connect).
- Crear el registro de la app en App Store Connect (bundle ID `com.bukea.app`).
- Capturas de pantalla (6.7", 6.5", 5.5" como mínimo) y ficha del App Store (descripción, palabras clave, categoría).
- Política de privacidad pública (URL) — usar `https://www.bukeard.com/privacidad`, ya existe.
- Subir build a TestFlight, probar, y enviar a revisión.
