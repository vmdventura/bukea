# Ampliación del panel de negocio — 25 ago 2026

Resumen de lo construido y desplegado a producción (bukeard.com/negocio) en esta sesión, a pedido de Víctor: completar el perfil del negocio más allá de nombre/sector/categoría (logo, redes sociales, fotos, ubicación exacta, soporte directo), y convertir "Servicios" de solo lectura a editable.

## 1. Login/registro: logo del negocio

Nuevo paso 6 en el wizard de registro (`nb-step-6`), después de crear la cuenta y antes de entrar al dashboard:

- Título "Sube el logo de tu negocio", con vista previa circular y placeholder de cámara.
- Input de archivo (`accept="image/*"`), botón "Guardar y continuar" y enlace "Omitir por ahora" (no bloquea el flujo).
- Sube vía `POST /api/professionals/:slug/logo` (multipart, campo `logo`).
- La barra de progreso del wizard pasó de 5 a 6 pasos (`NB_STEPS = 6`).

## 2. Servicios: ahora editable

Antes: `panel-servicios` era de solo lectura ("por ahora hazlo desde la app móvil").

Ahora: mismo patrón que Cuentas bancarias y Equipo — filas editables (nombre, duración en min, precio en RD$), botón "Agregar servicio", botón "Guardar cambios" que reemplaza todos los servicios del negocio.

- Endpoint nuevo: `PUT /api/professionals/:slug/services` — reemplaza todo el set de servicios (borra e inserta, igual que bank-accounts/collaborators). Valida que haya al menos un servicio con nombre, duración > 0 y precio ≥ 0.

## 3. Pestaña nueva "Redes sociales"

Campos simples de texto (sin íconos de marca — la regla del proyecto es solo Lucide, con excepción única de WhatsApp): Instagram, Facebook, TikTok, Sitio web. Acepta handle (`@negocio`) o URL completa, sin validar formato.

- Endpoint: `PUT /api/professionals/:slug/social`.
- Columnas nuevas en `professionals`: `social_instagram`, `social_facebook`, `social_tiktok`, `social_website` (VARCHAR 190, nullable).

## 4. Pestaña nueva "Negocio"

Cuatro bloques:

1. **Logo del negocio** — mismo mecanismo que el paso 6 del wizard, pero editable en cualquier momento (`POST /:slug/logo`).
2. **Fotos del negocio** — galería tipo grid, subir de una en una (`POST /:slug/photos`), borrar individualmente (`DELETE /:slug/photos/:photoId`). Tabla nueva `business_photos` (id, professional_id, path, created_at).
3. **Ubicación en el mapa** — Leaflet + OpenStreetMap (mismo stack que `/mapa` en el sitio público), pin arrastrable inicializado en las coordenadas actuales del negocio (`lat`/`lng`, ya existían de la geocodificación por sector). Botón "Guardar ubicación" → `PUT /:slug/location`. Resuelve la limitación conocida de que el registro solo geocodifica el sector, no la dirección exacta.
4. **¿Necesitas ayuda?** — textarea + botón "Abrir ticket". Envía un correo directo a `hola@bukeard.com` con el contexto del negocio (nombre, slug, quién escribe). Sin tabla de tickets ni estado (abierto/cerrado) — decisión explícita de Víctor de mantenerlo simple por ahora. `POST /:slug/ticket`.

## Cambios de base de datos

**Tabla `professionals`** — columnas nuevas:
- `logo_path VARCHAR(255)`
- `social_instagram`, `social_facebook`, `social_tiktok`, `social_website VARCHAR(190)`

**Tabla nueva `business_photos`**:
```sql
CREATE TABLE business_photos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  professional_id INT NOT NULL,
  path VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (professional_id) REFERENCES professionals(id) ON DELETE CASCADE
);
```

Migraciones agregadas a `backend/db/init.js` (`migrate()`), con el patrón `safeAlter()` ya existente (ignora "columna ya existe" en reinicios repetidos).

## Subida de archivos

`backend/lib/uploads.js` ganó dos configuraciones nuevas de `multer`, mismo patrón que `receiptUpload`:
- `logoUpload` → `public/uploads/logos/`
- `photoUpload` → `public/uploads/business-photos/`

Ambas solo aceptan imágenes (JPG/PNG/WEBP, no PDF — a diferencia de los comprobantes de pago). Límite 5MB. Los directorios se crean solos al arrancar (`fs.mkdirSync(..., {recursive:true})`) para que un deploy nuevo no dependa de un `.gitkeep` manual.

## Correo

`backend/lib/mailer.js` ganó `sendTicket({businessName, slug, fromName, fromEmail, message})` — mismo mecanismo que `sendPinResetCode`, gateado por `isConfigured()` (revisa las 5 variables SMTP). Si no está configurado, el endpoint responde 503 con un mensaje claro en vez de fallar en silencio.

## Endpoints nuevos (`backend/routes/professionals.js`)

| Método | Ruta | Qué hace |
|---|---|---|
| POST | `/:slug/logo` | Sube/reemplaza el logo |
| PUT | `/:slug/social` | Guarda las 4 redes sociales |
| PUT | `/:slug/location` | Guarda lat/lng exactos (pin arrastrado) |
| POST | `/:slug/photos` | Sube una foto a la galería |
| DELETE | `/:slug/photos/:photoId` | Borra una foto |
| PUT | `/:slug/services` | Reemplaza todos los servicios |
| POST | `/:slug/ticket` | Envía el ticket de soporte por correo |

Todos requieren sesión (`requireAuth`) y verifican que el negocio pertenezca al usuario (`findOwnedProfessional`), igual que el resto de endpoints de "Mi negocio".

`GET /:slug` (perfil, público) ahora también devuelve `logoUrl`, `social {instagram, facebook, tiktok, website}` y `photos [{id, url}]`.

## Frontend (`backend/views/negocio.js`)

- Sidebar del dashboard: nuevos ítems "Redes sociales" y "Negocio", entre "Cuentas bancarias" y "Mi perfil".
- Íconos Lucide agregados al sprite: `n-camera`, `n-image`, `n-building`, `n-share`, `n-pin`, `n-message`, `n-trash`.
- Leaflet 1.9.4 (CSS + JS) cargado desde unpkg, mismo CDN que usa `/mapa` en el sitio público.
- El mapa se inicializa perezosamente (`setTimeout(initBizMap, 0)`) la primera vez que el usuario entra a la pestaña "Negocio" — Leaflet necesita el contenedor visible para medir su tamaño correctamente.

## Qué falta / no se hizo

- El perfil público (`/p/:slug` en `pages.js`) **no** se actualizó para mostrar el logo, las redes sociales ni la galería — hoy esos datos se guardan pero no se ven en ningún lado público todavía. Es el siguiente paso natural si Víctor quiere que los clientes los vean.
- El ticket de soporte no genera ningún registro consultable (ni tabla, ni panel de administración) — es solo un correo. Si en algún momento se necesita historial o estado, habría que construir la tabla de tickets que se descartó en esta ronda.
- No hay límite de fotos en la galería (podría valer la pena ponerlo si se abusa del espacio en disco).

## Despliegue

Desplegado en producción (`bukeard.com`) el 25 de agosto de 2026 vía zip completo (no archivo por archivo, por el volumen de cambios): respaldo previo (`backup-2026-08-25.zip` en `bukea-app/`), zip local con `backend/` completo (excluyendo `node_modules`, `.env`, y el contenido de `public/uploads/*`), extraído y movido a `bukea-app/` preservando las carpetas de `uploads/` ya existentes en el servidor. Sin dependencias npm nuevas — reinicio simple de la app Node. Verificado con `curl`/lectura directa a `/app/api/health` y `/app/api/professionals/:slug` (columnas nuevas presentes en la respuesta) antes de confirmar el despliegue.
