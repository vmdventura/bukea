# Bukea — App nativa iOS (Capacitor)

Envoltorio nativo de la app web de Bukea. Carga `https://www.bukeard.com/app/`
en vivo dentro de un WKWebView, así que:

- Se instala en el simulador o en un iPhone real como app de verdad (`com.bukea.app`),
  a pantalla completa y sin barras de Safari.
- Cualquier cambio que subamos al servidor aparece sin recompilar la app.
- Es el mismo proyecto Xcode que luego se firma y se sube al App Store.

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

- Empaquetar el frontend dentro de la app (en vez de `server.url` remoto) y apuntar
  solo la API al servidor, para cumplir las políticas de Apple.
- Cuenta Apple Developer (US$99/año) — pendiente de Fase 0.
- Firma de código, capturas, ficha del App Store.
