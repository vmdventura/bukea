# Mudar el MVP a bukeard.com/app — Guía de ejecución

El backend (`backend/`) ya está listo para correr bajo cualquier subruta —
probado localmente sirviendo la misma app bajo `/bukea` y bajo `/app` sin
diferencias (ver commit "Hacer la ruta base de la app dinámica"). Esta guía
cubre lo que hay que hacer en cPanel (lo hace Víctor, esta sesión no tiene
acceso a BanaHosting) para que quede corriendo en `bukeard.com/app`, dejando
la landing estática que ya existe en la raíz del dominio intacta.

## Antes de empezar

- Confirma que `bukeard.com` ya apunta a este mismo hosting de BanaHosting
  (si lo registraste en otro sitio y nunca cambiaste los nameservers, esto
  no va a funcionar todavía).
- Ten a mano las credenciales de MySQL que ya usa `vmdventura.com/bukea`
  (están en el panel de Node.js de esa app, o en tu `backend/.env` local).

## Parte 1 — Crear la app Node.js en cPanel

1. cPanel → **Setup Node.js App** → **Create Application**.
2. Rellenar:

   | Campo | Valor |
   |---|---|
   | Node.js version | la misma que usa `vmdventura.com/bukea-app` |
   | Application mode | Production |
   | Application root | `bukeard.com/bukea-app` (carpeta nueva) |
   | Application URL | `bukeard.com/app` |
   | Application startup file | `app.js` |

3. Guardar — cPanel crea la carpeta y un entorno virtual de Node ahí dentro.

## Parte 2 — Variables de entorno

Dentro de esa misma app, en **Environment variables**, agregar:

| Variable | Valor |
|---|---|
| `BASE_PATH` | `/app` |
| `DB_HOST` | igual que en `vmdventura.com/bukea` |
| `DB_USER` | igual que en `vmdventura.com/bukea` |
| `DB_PASSWORD` | igual que en `vmdventura.com/bukea` (entre comillas si tiene `#`) |
| `DB_NAME` | igual que en `vmdventura.com/bukea` — **decide si comparten la misma base de datos** (mismos profesionales/reservas en ambas URLs) o si prefieres una copia separada para no mezclar datos de prueba |
| `ADMIN_PASSWORD` | una contraseña tuya real — **no dejes el valor por defecto** `bukea-admin` |
| `ADMIN_SESSION_SECRET` | cualquier texto largo y aleatorio |

Si más adelante activas WhatsApp real, agrega también `WHATSAPP_TOKEN`,
`WHATSAPP_PHONE_ID` y `WHATSAPP_AUTH_TEMPLATE` (ver
[WHATSAPP-SETUP.md](WHATSAPP-SETUP.md)).

## Parte 3 — Subir el código

**Opción A — File Manager (más simple, sin Git):**

1. En tu computadora, comprime la carpeta `backend/` de este repo en un `.zip`
   (solo el código — `node_modules/` y `.env` no hace falta incluirlos).
2. cPanel → **File Manager** → entra a `bukeard.com/bukea-app` → sube el `.zip`
   → click derecho → **Extract**.
3. Confirma que `app.js`, `package.json`, `routes/`, `db/`, `public/` quedaron
   directo dentro de `bukeard.com/bukea-app` (no dentro de una subcarpeta
   `backend/` extra — si Softaculous/el zip crea una carpeta intermedia,
   mueve el contenido un nivel arriba).

**Opción B — Git (mejor si vas a actualizar seguido):**
Si tu plan de BanaHosting permite `git clone`/`git pull` por SSH o cPanel Git
Version Control, dime y armamos ese flujo en vez del zip — es más cómodo para
cuando hagamos cambios después.

## Parte 4 — Instalar dependencias y arrancar

1. En **Setup Node.js App**, entra a la app que creaste y click en
   **Run NPM Install** (instala `express`, `mysql2`, `dotenv` desde el
   `package.json` que subiste).
2. Click en **Restart** (o **Start App** si es la primera vez).
3. cPanel muestra el estado de la app — debe decir corriendo/running.

## Parte 5 — Verificar

Desde tu navegador (o dime y lo reviso yo si para entonces ya está expuesto
a internet y alcanzable):

- `https://bukeard.com/app/api/health` → debe responder `{"ok":true}`
- `https://bukeard.com/app/` → debe cargar la app (splash → inicio)
- `https://bukeard.com/app/admin` → panel interno, pide la contraseña que
  pusiste en `ADMIN_PASSWORD`
- `https://bukeard.com/app/manifest.json` → `start_url` y `scope` deben decir
  `/app/`, no `/bukea/`

## Al terminar

Avísame y seguimos con:
- Confirmar que la landing en la raíz de `bukeard.com` sigue intacta (no la
  tocamos en ningún paso de esta guía).
- Decidir qué pasa con `vmdventura.com/bukea` — ¿se apaga, queda de respaldo,
  o corren ambos un tiempo mientras validamos?
