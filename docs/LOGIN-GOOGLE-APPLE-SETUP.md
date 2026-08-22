# Activar el login con Google y Apple

> El código ya está listo (2026-08-22): botones en la pantalla de bienvenida (cliente) y en "Únete a Bukea" (negocio — ahora exige sesión real, ver `docs/ROADMAP.md` 4.1). Mientras `GOOGLE_CLIENT_ID` / `APPLE_CLIENT_ID` no estén configurados en el servidor, cada botón se muestra automáticamente como "Próximamente" — no rompe nada dejarlos vacíos.
>
> Estos dos pasos (crear el cliente OAuth de Google y el Services ID de Apple) solo los puede hacer Víctor: requieren su cuenta de Google Cloud y su cuenta de Apple Developer (ya aprobada). Aquí está la ruta exacta.

## 1. Google — Google Cloud Console

1. Entra a [console.cloud.google.com](https://console.cloud.google.com) → crea (o reusa) un proyecto llamado **Bukea**.
2. **APIs y servicios → Pantalla de consentimiento de OAuth**: tipo **Externo**, nombre de la app "Bukea", correo de soporte, logo (opcional), dominio autorizado `bukeard.com`. Mientras esté en modo "Prueba" solo pueden iniciar sesión las cuentas de Google que agregues como "usuarios de prueba" — agrega la tuya para probar antes de publicar la app.
3. **Credenciales → Crear credenciales → ID de cliente de OAuth**:
   - Tipo de aplicación: **Aplicación web**
   - Nombre: `Bukea Web`
   - **Orígenes de JavaScript autorizados**: `https://www.bukeard.com` (y, para probar en tu máquina, `http://localhost:3000`)
   - No hace falta URI de redirección — el login usa Google Identity Services (One Tap / popup con id_token), no el flujo de redirect clásico.
4. Copia el **ID de cliente** (termina en `.apps.googleusercontent.com`).
5. En cPanel → *Setup Node.js App* → la app de Bukea → *Environment variables*, agrega `GOOGLE_CLIENT_ID` con ese valor. Para probar local, ponlo en `backend/.env`.
6. Cuando quieras que cualquier cuenta de Google pueda entrar (no solo tus usuarios de prueba), vuelve a la pantalla de consentimiento y publícala ("Publish app").

## 2. Apple — Apple Developer

Con la cuenta de desarrollador ya aprobada:

1. [developer.apple.com/account](https://developer.apple.com/account) → **Certificates, IDs & Profiles → Identifiers**.
2. Verifica que exista un **App ID** para `com.bukea.app` (el que ya usa el envoltorio Capacitor en `native/capacitor.config.json`) — si no existe, créalo primero (tipo App, sin capacidades especiales por ahora).
3. **Identifiers → "+" → Services IDs**:
   - Description: `Bukea Web Login`
   - Identifier: `com.bukea.web` (distinto del App ID — este es el que verá el navegador)
4. Edita ese Services ID → activa **Sign in with Apple → Configure**:
   - **Primary App ID**: `com.bukea.app`
   - **Domains and Subdomains**: `bukeard.com`, `www.bukeard.com`
   - **Return URLs**: `https://www.bukeard.com/app/` (tiene que calzar exacto con `redirectURI` que arma el frontend — hoy es el origen + `/app/`)
5. Apple pide **verificar el dominio**: descarga el archivo `apple-developer-domain-association.txt` que ofrece y súbelo por FTP a la **raíz** de `bukeard.com` (junto al `index.html` de la landing, **no** dentro de `/app`) en la ruta `/.well-known/apple-developer-domain-association.txt`. Ver `docs/hosting` / memoria de FTP para las credenciales.
6. Guarda. El identificador del Services ID (`com.bukea.web`) es el valor de `APPLE_CLIENT_ID` — no hace falta clave privada, Team ID ni Key ID: el frontend usa el flujo de id_token (`AppleID.auth.signIn()`), que el backend verifica contra las llaves públicas de Apple (`https://appleid.apple.com/auth/keys`), igual que un JWT normal.
7. En cPanel → *Setup Node.js App* → *Environment variables*, agrega `APPLE_CLIENT_ID=com.bukea.web`.

**Nota:** Apple exige HTTPS y un dominio real verificado — el botón de Apple no se puede probar en `localhost`. El de Google sí, agregando `http://localhost:3000` a los orígenes autorizados del paso 1.

## 3. Verificar que quedó activo

```bash
curl -s https://www.bukeard.com/app/api/auth/providers
```

Debe responder `{"google":true,"apple":true}` cuando ambas variables estén puestas. Si alguna sigue en `false`, revisa que la variable de entorno esté guardada en cPanel y que hayas reiniciado la app de Node.js (cPanel no recarga `.env`/variables solo).
