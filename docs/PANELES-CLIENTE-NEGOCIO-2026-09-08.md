# Paneles cliente y negocio: estado actual y pendientes (8 sep 2026)

Resumen de qué vive dónde hoy (panel del cliente, panel del negocio dentro de la app, panel de escritorio en bukeard.com/negocio), qué se cambió en esta sesión, y qué queda pendiente.

## 0. Problema principal a resolver

Palabras textuales de Víctor: "Mi idea es que en una misma app pudiera convivir el cliente y el dueño de negocio y este último pudiera ver todo siempre desde dentro de la app."

Hoy eso no es así del todo. El dueño convive con el cliente en la misma app (una sola app, ver punto 4), pero **no ve todo desde dentro**: una parte del panel de negocio (logo y fotos, ubicación exacta en el mapa, redes sociales, chat de soporte) solo existe en el panel de escritorio `bukeard.com/negocio`, al que se llega saliendo de las pantallas nativas de la app. Este es el problema principal a resolver, no un detalle menor: llevar el resto del panel de negocio adentro, para que el dueño nunca tenga que salir de la app a gestionar su negocio.

## 1. Panel del cliente (dentro de la app)

Ya existía antes de hoy, sin cambios de fondo:

- Inicio (buscar por categoría, "cerca de ti").
- Buscar / perfil público de cada negocio.
- Reservar cita (elegir servicio, fecha, hora, método de pago).
- Mis citas (historial, cancelar, adjuntar comprobante).
- Perfil (cuenta del cliente: cerrar sesión, eliminar cuenta).

Cambios de hoy que lo tocan:

- Comprobantes de pago (fotos/PDF de transferencia) ya no son archivos públicos. Ahora requieren sesión: solo el cliente dueño de la cita o el negocio pueden verlos.
- El botón "Perfil" del nav, cuando la cuenta es de un dueño de negocio (`accountType: 'owner'`) con sesión ya guardada, entra directo al panel de negocio en vez de mostrar la pantalla de cuenta de cliente primero (antes solo pasaba la primera vez que iniciaba sesión desde ahí).

## 2. Panel de negocio: qué vive dónde

### Dentro de la app nativa (mismo tema claro de la app, sin salir a otra pantalla)

- **Resumen**: Mi Cuadre (hoy / 7 días / mes), ventas recientes, mejores servicios, mejor miembro del equipo, agenda próxima.
- **Calendario**: vistas Hoy / Semana / Mes.
- **Servicios**: agregar, editar, quitar (precio y duración).
- **Horario semanal**.
- **Cuentas bancarias** (para que el cliente transfiera).
- **Equipo / colaboradores**.
- **Identidad del negocio**: nombre, nombre del negocio, categoría, sector.
- **Nuevo hoy: "Mi cuenta"** dentro de la pantalla "Mi perfil": correo (cambiar y verificar), teléfono (verificar por WhatsApp), contraseña (PIN).
- **Nuevo hoy: link para tu biografía** (Instagram/WhatsApp), debajo de "Mi perfil", con botón Copiar.

### Solo en el panel de escritorio (bukeard.com/negocio)

- Logo del negocio, galería de fotos, ubicación exacta en el mapa (pin arrastrable).
- Redes sociales (Instagram, Facebook, TikTok, sitio web).
- "Compartir mi perfil" (el mismo link + plantillas de WhatsApp, ya disponibles ahí desde antes de moverlos también a la app).
- Chat de soporte directo con Bukea.

Se llega a este panel desde la app tocando "Calendario y panel completo" — ya no es un iframe embebido (ver punto 3), es una navegación real a la página, con la sesión ya iniciada.

## 3. Cambios de esta sesión, en detalle

1. **Panel de negocio sin iframe.** Antes, "Calendario y panel completo" abría `bukeard.com/negocio` dentro de un `<iframe>` a pantalla completa. Ahora navega de verdad a esa página (`location.href`), y el panel muestra su propio botón "Volver a la app" (antes usaba `postMessage` al iframe padre, ya no aplica). Se corrigió de paso un bug: la URL se armaba con un regex que solo reconocía el sufijo `/app`, así que en ambientes con otro prefijo (ej. desarrollo local) armaba una ruta que no existía.
2. **Requisito de verificación para negocios nuevos.** Desde hoy, un negocio recién registrado necesita foto de perfil + correo verificado + teléfono verificado del dueño para aparecer en el marketplace (inicio, mapa, búsqueda). Si falta algo, el negocio queda oculto de esas listas pero su link directo (`/p/:slug`) sigue funcionando, y el panel le muestra un aviso con botones directos a lo que falta. **Los negocios que ya existían antes de hoy quedan exentos** — no se ocultan retroactivamente.
3. **Perfil público (`/p/:slug`) ajustado:**
   - La sección de negocios sugeridos ("También te puede interesar") ahora muestra **otras categorías**, no la misma categoría del negocio (antes mostraba competencia directa dentro del propio link que el negocio comparte).
   - Los botones Google Maps / Apple Maps / Waze quedaron centrados.
4. **Link para compartir + plantillas de WhatsApp.** Nuevos en el panel de escritorio (pestaña "Redes sociales") y en la app (pantalla "Mi perfil"): el link público del negocio con botón Copiar, y 3 mensajes de WhatsApp listos para copiar y pegar.
5. **"Mi perfil" (cuenta) y link de biografía llevados a la app**, con el mismo tema visual de la app (no el del panel de escritorio) — ver punto 2.

## 4. Decisión ya tomada: una sola app, no una app aparte para dueños

Se evaluó sacar una app separada tipo "Bukea Negocios" (como Fresha o Booksy). Se descartó: significa segundo bundle ID, segunda revisión de Apple/Google, mantenimiento doble de builds nativos — costo real que no se justifica con la cantidad de negocios activos de hoy. Esta parte del problema ya está resuelta. Lo que falta es lo del punto 0: que dentro de esa única app, el dueño vea todo, no una parte.

## 5. Pendiente / conocido

- **Llevar el resto del panel de negocio a la app** (ver punto 0): logo y fotos del negocio, ubicación exacta en el mapa, redes sociales, chat de soporte. Hoy solo existen en `bukeard.com/negocio`. Es el pendiente principal.
- **Caché del WebView en iOS.** La app carga `bukeard.com/app` en vivo, pero el WebView nativo puede quedarse con una versión vieja en caché. Si un cambio no se ve, hay que cerrar la app por completo (no solo minimizarla) y volver a abrirla.
- **Salto de tema al reservar.** Desde el perfil público (`/p/:slug`, tema claro) tocar "Reservar" manda a la app (`/app/?pro=slug`, tema propio de la app) — cambio visual notorio. Quedó identificado, sin resolver todavía; la opción que se recomendó es mover el flujo de reserva dentro de la misma página pública, pendiente de decisión para ejecutar.

## 6. Confiabilidad del backend (misma sesión, afecta directamente a estos paneles)

- Reserva de citas ahora es atómica (transacción con bloqueo) — evita que dos clientes tomen horarios que se solapan al mismo tiempo.
- Cancelar una cita ahora libera el horario de verdad en la base de datos (antes solo se veía libre en la pantalla, pero un `UNIQUE` en la base impedía reutilizarlo).
- Guardar servicios desde el panel ya no falla si alguno tiene reservas asociadas (se archivan en vez de borrarse).
- "Mi Cuadre" usa el precio del servicio al momento de la reserva, no el precio actual (si el negocio sube un precio, las citas viejas no cambian de valor solas).
