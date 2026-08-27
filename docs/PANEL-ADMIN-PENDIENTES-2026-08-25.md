# Pendientes del panel de administración — 2026-08-25

> El panel de administración general (Fase 1 y Fase 2 del concepto) ya está construido y verificado en vivo en `bukeard.com/admin`. Este documento anota lo que quedó fuera a propósito o sin resolver, para retomarlo en otra sesión sin tener que redescubrirlo. Ver `CLAUDE.md` para el detalle completo de lo que ya existe.

**Actualización (2026-08-25, mismo día):** se construyó "Ver panel del negocio" en la ficha de cada negocio del Módulo Negocios (impersonación real, no solo el modal de edición) — ya no es un pendiente. De paso se arregló un bug real: un dueño que entraba a `/negocio` desde otro dispositivo/navegador veía el asistente "Crea tu negocio" aunque ya tuviera uno, porque la app solo sabía a qué negocio pertenecía por un valor guardado en ese navegador. Ver `bukea_omitir_negocio.md` en memoria para el detalle técnico.

**Actualización (2026-08-27, seguridad máxima del panel):** el pendiente #1 de abajo (login solo por teléfono+PIN) quedó resuelto. Se agregó login con Google en `/admin` (mismo patrón que `/negocio`, reutiliza `lib/oauth.js`) y un correo fijo de super administrador (`lib/super-admin.js`, `vmdventura@gmail.com`) que se autoprovisiona/repara solo en cada arranque del servidor (`ensureSuperAdmin()` en `db/init.js`) y no se puede desactivar desde el propio panel. Primero se agregó un código por correo como segundo factor sobre el PIN, pero Víctor pidió explícitamente descartar el PIN del todo ("para evitar futuros ataques") — así que `/api/admin/login` y `/login/verify-code` se eliminaron: Google es la única puerta. La sesión del panel también vence sola a las 8 horas (antes no vencía nunca). Apple queda pendiente, no se pidió esta vez.

---

## 1. ~~El login del panel solo acepta teléfono + PIN, no Google/Apple~~ — ✅ Resuelto 2026-08-27

Ver la actualización arriba. El PIN no quedó como respaldo: se eliminó por completo, Google es el único camino de entrada. Queda un pendiente menor: Apple no se agregó (solo Google) — si algún día Google falla o cambia de cuenta, no hay puerta trasera, así que si eso preocupa habría que agregar Apple como alterna, no PIN.

---

## 2. Categorías de negocio y listas de bancos siguen fijas en el código — 🟢 Prioridad baja

**Dónde:** `VALID_CATEGORIES` en `routes/professionals.js`/`routes/admin.js`, `CAT_LABELS`/`CAT_ICONS` en `views/shared.js`, y `BANK_NAMES`/`ACCOUNT_TYPES` en `public/index.html`

**Qué pasa:** La pantalla de Configuración del panel no las deja editar. Fue una decisión consciente, no un olvido: cada categoría nueva necesita también un ícono propio (Lucide, ver regla en memoria `bukea_iconografia_lucide`) y una entrada visual en el marketplace, así que una UI que solo editara la lista en base de datos resolvería la mitad del problema.

**Fix sugerido, si hace falta de verdad:** Antes de construir la UI, definir si vale la pena o si conviene seguir agregando categorías directamente en código (como se ha hecho hasta ahora) — probablemente no vale la pena hasta que haya una necesidad real de una categoría nueva.

---

## 3. Fase 3 del concepto original no existe — 🟢 Prioridad baja

**Dónde:** N/A (nada construido)

**Qué pasa:** El [documento de concepto](https://claude.ai/code/artifact/09e53fa4-fa5b-4298-a340-e88babcef974) definía una Fase 3 con auditoría de acciones del admin (`admin_audit_log`) y roles adicionales (`support`, `moderator`) para cuando haya más de una persona administrando. Hoy solo existe `role = 'admin'` (todo o nada) y ninguna acción del panel queda registrada con quién la hizo.

**Fix sugerido:** Construirlo cuando de verdad haya un segundo administrador — antes de eso, es trabajo especulativo.

---

## Resumen para retomar

| # | Pendiente | Prioridad | Cuándo vale la pena hacerlo |
|---|-----------|-----------|------------------------------|
| 1 | ~~Login del panel con Google/Apple~~ | ✅ Resuelto (Google, 2026-08-27) | Apple sigue pendiente si hace falta |
| 2 | Categorías y bancos editables desde Configuración | 🟢 Baja | Solo si aparece una necesidad real de agregar categorías seguido |
| 3 | Fase 3: auditoría y roles de equipo | 🟢 Baja | Cuando haya un segundo administrador de verdad |

**Todo lo demás del panel (Fase 1 y Fase 2 completas) ya está construido, desplegado y probado en producción** — no hay que redescubrirlo ni volver a construirlo.
