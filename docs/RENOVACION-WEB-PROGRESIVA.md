# Renovación de bukeard.com, avance progresivo

Inicio: 2026-10-11. Dirección aprobada por Víctor: **A "Aire", estilo Fresha** (ver `DESIGN.md`, sección "Renovación web pública"). Prototipo de las 3 direcciones: `prototype/renovacion-web.html`.

Reglas del proceso: una pantalla a la vez, siempre en local primero, sin desplegar hasta que Víctor lo ordene. Las apps iOS y Android no cambian. Copy sin guiones largos, medios ni cortos como separador.

## Decisiones tomadas

- Home con hero claro de borde a borde (manchas teal y durazno), titular en Plus Jakarta Sans 800, buscador en píldora.
- Botón "Mi Negocio" en el header, píldora teal sólida, apunta a `PORTAL_URL` (`views/shared.js`).
- Portal de negocios en `negocio.bukeard.com` (hoy `/negocio`), solo dueños, sesión separada por origen. Cuenta de cliente sin negocio ve un aviso antes de poder registrar uno.
- Panel lateral del login del portal alineado a la derecha, con línea dorada divisoria.

## Estado por pantalla

| Pantalla | Ruta | Estado |
|---|---|---|
| Home (index principal) | `/` | En curso, ver pendientes abajo |
| Portal de negocios (login) | `/negocio` | Primera pasada hecha (panel derecho, línea, aviso de cliente) |
| Para negocios (landing) | `/negocios` | Pendiente |
| Precios | `/precios` | Pendiente |
| Nosotros | `/nosotros` | Pendiente |
| Mapa | `/mapa` | Pendiente |
| Perfil público | `/p/:slug` | Pendiente |
| Descargar la app | `/descargar` | Pendiente |
| Blog | `/blog` | Pendiente |
| Contacto y ayuda | `/contacto` | Pendiente |
| Privacidad y términos | `/privacidad`, `/terminos` | Pendiente |
| Header y footer compartidos | `views/shared.js` | Listos |
| Panel del negocio (escritorio) | `/negocio` tras login | Pendiente |
| Panel de administración | `/admin` | Fuera de alcance por ahora |

## Pendientes del home

- Contador de prueba social tipo "citas reservadas hoy" (solo con dato real, nunca inventado).
- ~~Categorías con pictograma grande en vez de chips~~ Hecho 2026-10-11: sección "Explora por categoría" con fichas (13), filtro activo resaltado, deslizable en móvil. Los chips salieron del hero.
- Tarjetas de profesionales con foto de portada.
- ~~Sección de descarga de la app~~ Hecho 2026-10-11: botones reales en el hero y banda "Bukea en tu bolsillo" con teléfono de ejemplo. Falta el código QR (opcional).
- ~~Bloque Para negocios~~ Hecho 2026-10-11, inspirado en pelao.do: "Reservar es así de fácil" (3 preguntas y respuestas), "Todo lo que necesitas para tu negocio" (8 funciones), "¿Cómo funciona?" (4 pasos) y cierre con botón a Mi Negocio.
- ~~Footer renovado~~ Hecho 2026-10-11 en `views/shared.js` (aplica a todas las páginas públicas): 5 columnas (marca con botones de las tiendas y redes, Para clientes, Para negocios, Bukea, Legal) y línea dorada fina arriba.
- Verificación final a 1440, 768 y 390 px, con axe y Lighthouse sobre build de producción.

## Pendientes de infraestructura (antes de publicar)

1. Crear el subdominio `negocio.bukeard.com` en cPanel (segunda entrada en Setup Node.js App con el mismo código y variables).
2. Definir `PORTAL_URL=https://negocio.bukeard.com` en producción.
3. Confirmar con Víctor antes de desplegar (hay sync automático repo a servidor).

## Enlaces reales de la app (verificados 2026-10-11)

- App Store: https://apps.apple.com/do/app/bukea-citas-y-reservas/id6805996215
- Google Play: https://play.google.com/store/apps/details?id=com.bukea.app
- `/descargar` todavía dice "Próximamente" con badges sin enlace: actualizarlo cuando toque esa pantalla.

## Pasada de estética high-end (2026-10-11)

Aplicada con el skill `high-end-visual-design` sobre el sistema compartido (`views/shared.js`) y la home (`routes/pages.js`):

- Navegación isla flotante: píldora de vidrio separada del borde, con botón Mi Negocio y círculo de flecha (patrón botón dentro de botón).
- Doble bisel en tarjetas (profesionales, categorías, funciones, pasos) con tokens `--bezel` y `--bezel-hover`, sin bordes grises.
- Curva de movimiento única `cubic-bezier(0.32, 0.72, 0, 1)` (token `--ease-out-quart` redefinido, aplica a todo el sitio).
- Entradas al scroll con desenfoque y subida de 900 ms.
- Etiquetas eyebrow sobre los títulos de sección, y más espacio entre secciones.
- Decisión de conflicto: el skill prohíbe Lucide de trazo grueso, pero la regla del proyecto (`DESIGN.md`) fija Lucide 24x24 con trazo 2. Se mantuvo Lucide.
- Pendiente de esta pasada: vista en 1440 y 768 px, axe y Lighthouse; las demás pantallas heredan header, footer, tokens y reveal, pero no se han revisado una por una.

## Tema claro y oscuro (2026-10-11)

- Interruptor sol/luna en el header de las páginas públicas. Sigue el tema del sistema la primera vez y guarda la elección en `localStorage` (`bukea_theme`). Un script en el `<head>` fija `data-theme` antes de pintar, para evitar el parpadeo.
- Los tokens oscuros viven en `:root[data-theme="dark"]` (`views/shared.js`). Regla nueva: `--deep` es la superficie oscura de marca (constante) y `--teal-900` es texto fuerte (se aclara en oscuro). Las superficies nuevas deben usar `--deep`.
- Revisado en la home y en `/negocios`. Sin revisar en oscuro: `/precios`, `/nosotros`, `/mapa`, `/p/:slug`, `/descargar`, `/blog`, `/contacto`, legales. Fuera de alcance por ahora: portal `/negocio`, `/admin` y las apps.

## Pasada premium con impeccable (2026-10-11)

Home de `/` reconstruida sobre el mismo mundo (verde profundo, Fraunces y Plus Jakarta Sans, Lucide):

- **Hero partido:** texto y buscador a la izquierda, la app real (`05-home.png` de "Pantallas - Demo", sin datos) a la derecha dentro de un marco, que sube al cargar. Es el único momento de movimiento orquestado. En móvil el teléfono se oculta para dejar el buscador arriba.
- **Categorías con fotografía real** (las mismas de la app, `img/cats`, convertidas a webp en `public/img/site/`). Trenzas, tatuadores y servicios profesionales siguen con ícono porque no hay foto aún.
- **Sin tarjetas repetidas:** las funciones pasan a un panel principal (tu link propio) más una lista con filas separadas por líneas; los pasos son una línea de tiempo. Se eliminaron las etiquetas eyebrow, que el criterio de impeccable prohíbe.
- **Movimiento más sobrio:** la entrada al scroll pierde el desenfoque y sube menos.
- **Superficies del navegador tematizadas:** selección de texto, cursor, barra de scroll, subrayado y numerales tabulares.
- Detector de impeccable: sin hallazgos nuevos. Quedan 20 avisos de tipografía "sobreusada" (Fraunces y Plus Jakarta Sans), que son decisión fija del `DESIGN.md`, y un `transition: width` anterior en el medidor de fundadores (`/precios`, línea ~1321).
- **No usadas a propósito:** las capturas `01-mi-negocio-cuadre.png` y `04-perfil-publico.png` traen cifras y reseñas inflados en local (ver memoria del 27-ago). No deben mostrarse en el sitio público.
- Pendiente: la etiqueta eyebrow sigue en los heroes de `/negocios`, `/precios`, `/nosotros` y `/contacto` (`mktHeroHtml`), a quitar cuando toquemos esas pantallas.

## Fondo de ondas del hero (2026-10-11)

Tomado del tipo "side wave" de superdesigner.co (45 grados, 2 picos, 10 de cercanía), recoloreado a la paleta de Bukea: onda inferior izquierda en el verde del logo (`#0f8583`, 55 % de opacidad) y onda superior derecha en verde casi negro (`#04201f`, 70 %). Archivo propio: `backend/public/img/site/hero-waves.svg`, usado como `<img class="hero-waves">` dentro del hero de la home. Pendiente menor: en móvil el botón Buscar (teal) cae sobre la onda teal y pierde contraste.

## Teléfono del hero (2026-10-11)

Marco de teléfono generado en ChatGPT (pantalla magenta `#FF00FF`, fondo verde `#00FF00`), guardado en `design-assets/phone-mock-chroma.webp`. `design-assets/compose-phone.py` (correr con `python3 -I` desde la raíz del proyecto, solo Pillow) recorta el verde, pone la captura real sobre el magenta, la baja un 5 % para que no la tape la isla dinámica y exporta `backend/public/img/site/phone-hero.webp` con transparencia. Para cambiar la pantalla: cambiar la ruta `shot` en el script y volver a correrlo. El hero muestra solo la parte superior del teléfono (contenedor de 480 px).

La banda "Bukea en tu bolsillo" usa el mismo marco con la pantalla Calendario del panel del negocio (`Pantallas - Demo/03-calendario.png`, mes sin citas ni nombres): `backend/public/img/site/phone-band.webp`. Se eligió porque las capturas con citas, cuadre y perfil público traen datos de demostración (nombres, cifras y reseñas inflados en local) y no deben mostrarse en el sitio público. Para usar una pantalla con datos reales de producción: `python3 -I design-assets/compose-phone.py <captura.png> backend/public/img/site/phone-band.webp`.

Ajustes del 2026-10-11 (tarde): el teléfono de la banda es más grande (390 px), con inclinación de -3 grados, halo y anillo detrás, y se endereza al pasar el mouse. Se quitó el `drop-shadow` que dibujaba un rectángulo detrás del teléfono. En "Explora por categoría", la ficha "Todos" pasó al final.

Fotos de las tres categorías que faltaban (2026-10-11): servicios profesionales, tatuadores y trenzas y rastas. Recortes cuadrados en `backend/public/img/cats/<categoría>.jpg` (800 px, los lee también la app) y `backend/public/img/site/cat-<categoría>.webp` (260 px, los usa la web). Las 12 categorías ya tienen foto. La copia empaquetada de la app (`native/www`) se actualiza con `native/build-www.js` en el siguiente build nativo. Origen de las fotos: las envió Víctor, confirmar licencia de uso antes de publicar.

Panel "Tu link propio" con fotografía (2026-10-11): manicurista dominicana chateando, imagen generada con IA a partir de un prompt propio (original en `design-assets/manicurista-whatsapp.webp`, exportada en `backend/public/img/site/feat-lead.webp`). Se vio la parte trasera del iPhone, sin pantalla, así que no necesita composición. Se quitó el halo dorado del panel y se agregó un degradado oscuro abajo para leer el texto. Es una imagen de IA: no presentarla como una clienta real de Bukea. El pie de la imagen en el `alt` dice "Manicurista dominicana chateando con una clienta".

Tarjeta "Tu link propio" en variante C (2026-10-11): conversación de WhatsApp sobre la foto (enlace enviado y respuesta "Listo, ya reservé"), rotulada "Conversación de ejemplo". La píldora del link pasa arriba, el texto va sobre el degradado verde, la tarjeta sube a 760 px en escritorio y la lista de funciones se centra verticalmente. Las otras variantes (A, B, D) siguen en `prototype/tu-link-propio.html` por si se quiere volver atrás. La conversación es ilustrativa y no representa mensajes reales.

## Sección "Todo lo que necesitas" en versión V3 (2026-10-11)

Construida en la home (`routes/pages.js`, clases `f3-*`): bloque verde profundo con la manicurista a la izquierda, título y chat de WhatsApp sobre la foto, y la tabla de 8 funciones en un panel oscuro a la derecha (movido 2.9 rem a la izquierda para tapar la franja dorada del marco de la repisa). Prototipos de las 3 versiones: `prototype/seccion-funciones.html`.

**Pendiente de decisión:** el link mostrado ahora es `bukeard.com/tunegocio` (sin `/p/`), pero la ruta real del perfil público sigue siendo `/p/:slug`. Para que ese link funcione hace falta una ruta `/:slug` que redirija a `/p/:slug` (con una lista de nombres reservados: admin, negocio, mapa, app, etc.). Sin eso, el texto de la web promete un formato que todavía no existe. Aplicar el mismo cambio en `/negocios`, el panel de negocio y la app, donde aparece `/p/`.

Foto nueva y formato "story" (2026-10-11): la manicurista se rehízo con trameria de esmaltes blanca detrás y estación a la vista (original en `design-assets/manicurista-trameria.webp`, exportada en `backend/public/img/site/feat-lead.webp`). La sección "Todo lo que necesitas" ahora tiene la foto a toda la altura como una story vertical (barras de progreso, avatar "Tu Negocio" y burbujas de chat sobre la pared vacía), y el título y la tabla a la derecha. En móvil: título, story (9:14, sin chat) y tabla apilados. Las burbujas son ilustrativas.

Ajuste (2026-10-11): la foto vertical queda limpia, sin barras de progreso, avatar ni burbujas de chat. "Story" significa aquí solo el formato vertical. El `alt` de la imagen sigue describiendo la escena.

## Home reorganizada por sesiones (2026-10-11)

Aplicada a la home real (`routes/pages.js`, `views/shared.js`):

- **Tres bandas de ancho completo** (`.band--a/b/c`) con una línea fina de unión arriba: A, categorías y mejor calificados; B, "Reservar es así de fácil" con fondo teñido (`--band-alt`) y la franja de descarga; C, el mundo de negocios (beneficios, pasos y cierre).
- **Banda verde "Bukea en tu bolsillo" eliminada.** Su lugar lo toma una franja clara de descarga (`.dl-strip`) con botones de App Store y Google Play y un QR. El QR sale de `api.qrserver.com` y apunta solo al App Store; antes de publicar conviene generarlo una vez como imagen propia y, si se quiere, mandar a cada teléfono a su tienda con una página intermedia.
- **Preguntas en tarjetas altas** (380 px): avatar y pregunta arriba, respuesta en el pie verde.
- **Pasos con los números centrados** (1, 2, 3 y 4), junto con el punto dorado y el texto.
- `body { overflow-x: clip }` para que las bandas de 100vw no generen desplazamiento horizontal.
- Archivos sin uso que quedaron: `backend/public/img/site/phone-band.webp`. Mockup del orden en `prototype/home-orden.html`.

## Patrón Polka Dots al 4 % (2026-10-11)

Aplicado el patrón **Polka Dots** de Hero Patterns (Steve Schoger, CC BY 4.0), con la opacidad bakeada al 4 % en el SVG: en la banda "Reservar es así de fácil" (`.band--b`, puntos verdes del logo; en tema oscuro, blancos), en la tarjeta de cierre `.biz-cta` y en el footer (puntos blancos). Tokens `--dots-teal`, `--dots-white` y `--dots-band` en `views/shared.js`. Atribución obligatoria en el pie: "Patrones: Hero Patterns de Steve Schoger, CC BY 4.0". Comparación de patrones: `prototype/patrones.html`. Topography se descartó por peso (91 KB).

"Reservar es así de fácil" en versión 1 (2026-10-11): tarjetas de igual tamaño (330 x 415 px en escritorio) y alineadas, sin escalonar. Cada una lleva ícono, pregunta centrada, un fragmento de la app que demuestra la respuesta (lista de precios, horas libres, mapa con botones de navegación) y la respuesta en el pie verde. Los fragmentos son datos genéricos de ejemplo, no de un negocio real. Mockups de las 3 composiciones: `prototype/reserva-facil.html`.

## Enlace corto del negocio (2026-10-11)

`bukeard.com/<slug>` ahora redirige (302) a `bukeard.com/p/<slug>`. Ruta `GET /:slug` al final de `routes/pages.js`, que solo actúa si el slug existe en la base y no es un nombre reservado; si no, pasa al siguiente manejador (admin, la app, el 404). `lib/reserved-slugs.js` define los nombres reservados (admin, mapa, negocio, nosotros, app, bukea, etc.) y el patrón válido; el registro de negocios (`routes/professionals.js`) añade `-bukea` a un slug reservado para que ningún negocio pise una ruta del sitio.

Pendiente: los enlaces que muestran el panel de negocio y la app ("link para tu biografía", compartir perfil) siguen usando `/p/<slug>`. Cambiarlos al formato corto cuando se despliegue. En producción la ruta solo funciona si el dominio raíz sirve este Express (ya es el caso, ver CLAUDE.md, despliegue del 23-ago).

## Movimiento del home (2026-10-11)

Solo `transform` y `opacity`, sin librerías, dentro de `@media (prefers-reduced-motion: no-preference)` y con `.js` como guarda (sin JS o con movimiento reducido todo queda visible).

- Hero: olas con deriva lenta (34 s, alternate) y teléfono con flotación (6,5 s). Ambos se pausan al salir del viewport (`.hero.is-offscreen`, observer en `views/shared.js`).
- Categorías: entrada escalonada de las 12 fichas (`--k` × 55 ms) al llegar al viewport (`.rv` en `.cat-row`).
- Tarjetas Q&A: filas de precio entran en cascada; chips de hora aparecen y 11:30 se selecciona con pulso y aro; el pin del mapa cae con onda en el suelo; botones de navegación entran al final.
- Pasos: los números se encienden (opacidad, escala, color) y el punto dorado aparece en cascada.
- Foto de la manicurista: zoom lento de 22 s una sola vez al entrar.
- `views/shared.js`: el observer ahora vigila `.reveal` y `.rv` (grupo sin estilo propio).
Verificado en local a 1462 px y 375 px: sin desborde, nada queda oculto, animaciones activas. No desplegado.

## Despliegue a producción (2026-10-11)

Subido a `bukeard.com` por cPanel: respaldo previo `backend.zip` y paquete `bukea-deploy-20261011.zip` (extraído en `/home/hyghncjr/bukeard.com/bukea-app`), reinicio de la app Node. Verificado con curl: home con el movimiento nuevo, `/carmen-la-estilista` redirige 302 a `/p/carmen-la-estilista`, `/admin`, `/mapa`, `/negocios` y `/app/api/health` en 200. Línea de atribución de Hero Patterns retirada del footer a pedido de Víctor (la licencia CC BY 4.0 pide crédito: queda pendiente decidir dónde acreditarlo o cambiar el patrón). `negocio.bukeard.com` sigue sin crearse; `/tunegocio` solo redirige si existe un negocio con ese nombre.

## Ruta fija /tunegocio (2026-10-11)

`GET /tunegocio` redirige 302 a `/negocios` (antes del atajo por nombre en `routes/pages.js`). `tunegocio` quedó en `lib/reserved-slugs.js`. Desplegado y verificado en producción con curl (también en mayúsculas).

## Resto de páginas afinadas desde el home (2026-10-11)

- `mktHeroHtml()` (`routes/pages.js`) ahora arma el mismo hero del home: verde profundo con olas y deriva lenta, titular en la sans de UI, sin etiqueta superior (el parámetro `eyebrow` se ignora). Lo usan `/negocios`, `/precios`, `/nosotros`, `/contacto`, `/descargar`, `/blog`, `/privacidad` y `/terminos` (estas dos con variante `slim`).
- `/descargar`: reescrita. Botones reales de App Store y Google Play en el hero, QR hacia la ficha, dos tarjetas (clientes y negocios, la de negocios en verde profundo con puntos) y botón a Mi Negocio. Se quitó el texto de "Próximamente" y de "app web".
- `/p/:slug`: cabecera del perfil en banda verde con olas, avatar con aro y badges en vidrio claro.
- `/blog`: pasa de `.m-hero` plano al hero compartido.
- `/mapa` queda igual (es una herramienta, no una página de marketing).
- Verificado en local: 9 rutas en 200 y sin desborde horizontal a 375 px. No desplegado.

## Subdominio negocio.bukeard.com (2026-10-11)

Creado en cPanel (Dominios) con la misma carpeta de documentos que `bukeard.com` (`/home/hyghncjr/bukeard.com`), así lo atiende la misma app de Node: el middleware de `app.js` sirve el portal cuando el host empieza por `negocio.`. AutoSSL emitió el certificado (válido hasta enero de 2027). Variable de entorno `PORTAL_URL=https://negocio.bukeard.com` guardada en Setup Node.js App y app reiniciada: el botón "Mi Negocio" y los enlaces "Accede a tu negocio" apuntan al subdominio. `bukeard.com/negocio` sigue funcionando.

## Despliegue de las páginas afinadas (2026-10-11)

Subidos `routes/pages.js`, `lib/reserved-slugs.js` y `views/shared.js` (`bukea-deploy-20261011d.zip`) a `/home/hyghncjr/bukeard.com/bukea-app` y reinicio de la app. Verificado con curl: `/`, `/descargar`, `/negocios`, `/precios`, `/nosotros`, `/contacto`, `/blog`, `/privacidad`, `/terminos`, `/mapa` y `/p/carmen-la-estilista` en 200; `/tunegocio` 302; `negocio.bukeard.com` 200; health 200. `/descargar` ya no contiene "Próximamente". Respaldo previo en el servidor: `backend.zip`.

## Aviso por correo de negocio nuevo (2026-10-11)

`POST /api/professionals` (alta de negocio) manda, después del commit y sin esperar, un correo a `SUPER_ADMIN_EMAIL` (vmdventura@gmail.com) con negocio, profesional, categoría, sector, número de servicios, cuenta (nombre, teléfono, correo), cómo conoció Bukea y si entró al cupo fundador, más enlaces al perfil y al panel (`sendNewBusinessAlert` en `lib/mailer.js`, `notifyNewBusiness` en `routes/professionals.js`). No se envía en reintentos del mismo dueño (`existing`), ni si el SMTP no está configurado; si el envío falla solo se registra en consola. Texto del usuario escapado en el HTML. Probado en local con un SMTP falso: alta 201, aviso intentado, error registrado sin afectar el alta; datos de prueba borrados. Pendiente: desplegar.

## Escribir primero a los dueños desde el panel (2026-10-11)

Panel admin, pantalla Soporte: botón "Escribir a dueños". Abre una ventana con la lista de dueños con negocio (marcados los que aún no tienen conversación), un mensaje precargado de saludo y 3 preguntas sobre cómo se sienten usando Bukea, con `{nombre}` y `{negocio}` personalizados por dueño, y contador de elegidos. Backend en `routes/admin.js`: `GET /api/admin/support/owners` y `POST /api/admin/support/broadcast` (máx. 100, valida mensaje y destinatarios). Cada mensaje entra al hilo de Soporte del dueño (lo ve en la app y en el panel web, sin la ventana de 24 h de WhatsApp) y se avisa por correo, o por WhatsApp si no tiene correo; todo queda en `message_log`. Las respuestas del dueño llegan al mismo chat de Soporte del panel. Probado en local (API y pantalla) con SMTP falso; datos de prueba borrados. Pendiente: desplegar.

## Botón "Abrir WhatsApp" en el panel admin (2026-10-11)

`views/admin.js`: helper `waLink()`/`waButton()` arma un enlace `wa.me` con el número en formato internacional (los de 10 dígitos llevan el 1 delante) y un saludo precargado ("Hola {nombre}, soy Víctor, de Bukea."). Botón en la ficha del negocio (titular), la ficha del usuario, la cabecera del chat de Soporte y cada fila de la ventana "Escribir a dueños". Abre tu propio WhatsApp en otra pestaña; no usa la API de Bukea ni la ventana de 24 h. Probado en local en las cuatro pantallas; datos de prueba borrados. Pendiente: desplegar.

## Correo central contacto@bukeard.com (2026-10-11)

Buzón `contacto@bukeard.com` creado en cPanel por Víctor. Reenviadores: `hola@bukeard.com` copia a `contacto@bukeard.com`, y `contacto@bukeard.com` copia a `vmdventura@gmail.com`. Sitio y correo del formulario de contacto y de los tickets de negocio pasan a `contacto@` (`views/shared.js`, `lib/mailer.js`, `lib/geocode.js`), desplegado y reiniciado (`bukea-deploy-20261011e.zip`). Pendiente: cambiar el correo de soporte en las fichas de App Store y Google Play; probar un envío real al formulario de contacto.

## Despliegue de los tres cambios del panel (2026-10-11)

Subidos `routes/admin.js`, `views/admin.js`, `routes/professionals.js` y `lib/mailer.js` (`bukea-deploy-20261011f.zip`) y reinicio de la app: aviso por correo de negocio nuevo a `vmdventura@gmail.com`, "Escribir a dueños" en Soporte y botón "Abrir WhatsApp" en el panel. Verificado con curl: `/`, `/contacto`, `/admin`, `/negocios` y health en 200; `/admin` trae el botón de redactar y `waLink`; la API admin sin token responde 404 (protegida). No se probó el aviso de negocio nuevo en producción para no crear un negocio de prueba real. Correo: se eliminó el reenviador `contacto@` a Gmail (el buzón es el destino); el iPhone mostraba los mensajes del formulario en la categoría "Novedades", se pasó la bandeja Bukeard a vista de lista.

## Menú renovado, ref. Fresha (2026-10-11)

`views/shared.js`. Cabecera: logo, "Iniciar sesión" (texto), "Mi Negocio" (píldora llena con flecha) y botón "Menú" con ícono que cambia a X al abrir; en móvil queda solo el ícono. El desplegable pasa de una lista plana de 11 enlaces en mayúscula a tarjetas agrupadas: "Para clientes" (iniciar sesión o registrarse, ver negocios en el mapa, descargar la app, ayuda y servicio al cliente), "Bukea" (nosotros, por qué Bukea, precios, blog) y una tarjeta verde profunda "Para negocios" hacia el portal, con el interruptor de modo oscuro al pie. Se quitaron Inicio y Nosotros de la barra (el logo lleva al inicio). En móvil el panel ocupa el ancho del header y se desplaza si no cabe. Símbolos nuevos: i-x, i-chevron-right, i-arrow-right. Verificado en local a 375 px y escritorio; no desplegado.

Menú renovado desplegado en producción (2026-10-11, `bukea-deploy-20261011g.zip`, solo `views/shared.js`). Verificado: 11 rutas en 200 y menú abierto en `bukeard.com` con barra "Iniciar sesión, Mi Negocio, Menú" y 9 filas en tres bloques.

## Página /unete y tope de 30 fundadores (2026-10-11, solo local)

- Nueva ruta `GET /unete` en `routes/pages.js`: franja de login a Mi Negocio, ventajas de Bukea frente a apps internacionales, contador y rejilla de 30 cupos fundadores, planes (fundador RD$0 de por vida, Plan Bukea RD$500/mes con 1 mes de prueba), pasos y preguntas. `/contacto` queda fuera.
- `FOUNDING_FREE_LIMIT` pasa de 50 a 30 (`views/shared.js`). Pendiente antes de desplegar: revisar cuántos `founding_free = 1` hay en producción; si son más de 30 no se les puede quitar el beneficio.
- Pie de página: "Por qué Bukea" y "Precios" se sustituyen por "Planes y cupos fundadores" hacia `/unete`. `/negocios` y `/precios` siguen existiendo sin cambios (mencionan 50 vía la constante, ahora 30).
- Pendiente: el mes de prueba y el cobro de RD$500 no existen en el backend. La página solo comunica la oferta.

### Pulido de /unete (2026-10-11, local)
- Hero y barra de acceso de la primera versión (`mktHeroHtml` + `m-access-bar`); cupos como conteo regresivo, sin lista de fundadores.
- "Por qué Bukea" con el diseño oscuro de la tabla del home, sin foto, Bukea a la derecha, divisores y encabezados centrados con "Bukea" en dorado.
- Planes centrados: fundador oscuro con borde dorado, Plan Bukea claro; el botón del plan de pago queda inactivo mientras haya cupos.
- Pulido: ✕ pasó de glifo a ícono SVG, objetivos táctiles de 46 a 56 px, foco visible en preguntas, rejilla de funciones con tamaños variados.

### Pasada de espacios y jerarquías en todo el sitio (2026-10-11, local)
- Títulos de sección de las páginas de marketing (`.m-section-head h2`) pasan de 30 px a la misma escala que el home (`clamp(1.7rem, 3.2vw, 2.4rem)`), con más aire arriba (4.5rem) y abajo (2rem). Afecta `/negocios` y `/nosotros`.
- `/negocios`: la grilla de funciones dejaba un hueco a la derecha; la tarjeta "Cero comisión" ahora ocupa dos columnas.
- `/unete`: ritmo vertical homogéneo entre bandas (4.5rem), cifras del contador y del precio bajan para que el titular del hero mande.
- `/precios` redirige (302) a `/unete`: tenía copy contradictorio (Básico gratis para todos, "primeros 50"). Los enlaces de `/contacto` y de la búsqueda vacía apuntan a `/unete`.
- Pendiente de decisión de Víctor: `/negocios` sigue diciendo "RD$0 de mensualidad" y "gratis" en sus FAQ, lo que contradice el plan de RD$500 tras el cupo 30.

### Portal negocio.bukeard.com: regreso al inicio y registro solo profesional (2026-10-11, local)
- Botón "Volver al inicio de Bukea" arriba de la tarjeta de acceso y de la de registro de negocio (`views/negocio.js`, clase `.auth-home`). Apunta a `SITE_URL` (por defecto `https://www.bukeard.com/`) en el subdominio y a `/` en local y en `/negocio`.
- Registro de cuenta: título "Crea tu cuenta de negocio", aviso de que es solo para profesionales y dueños, y casilla obligatoria "Soy profesional o dueño de un negocio de belleza". El registro ya enviaba `accountType: 'owner'`.

### Pulido del portal de negocio (2026-10-11, local)
- Bug: el registro de cuenta de negocio (teléfono + PIN) no pedía correo, pero `POST /auth/register` lo exige desde 2026-08-27. Se agregó el campo "Tu correo" con validación y se envía en el registro.
- Resumen del panel en móvil: las tres tarjetas de cifras ocupaban una pantalla completa apilada; ahora van en una fila de tres. Etiquetas aclaradas ("Citas hoy", "Citas en 7 días", "Citas este mes").
- Pendiente de decisión: el panel izquierdo del acceso dice "Gratis para siempre, sin tarjeta de crédito", lo que contradice el plan de RD$500 tras el cupo 30.

### Menú del sitio reorganizado (2026-10-11, local)
- Barra de escritorio: Inicio, Únete, Mi Negocio, Menú, Contacto y modo oscuro al final. Sin "Iniciar sesión" de cliente (ni en barra, menú ni pie), para no mandar a la mini app `/app` por ahora.
- Menú desplegable: grupos "Descubre" (Descargar la app, Nosotros) e "Información" (Blog, Términos, Privacidad).
- Menú móvil: bloque inicial con Mi Negocio (botón oscuro), Únete con etiqueta de cupos gratis en vivo (`getFoundingSpotsLeft`, caché de 60 s en `views/shared.js`), Inicio y Contacto; luego los dos grupos anteriores.

### Únete = registro, Mi Negocio = acceso (2026-10-11, local)
- `/unete` manda todos sus botones de registro a `PORTAL_REGISTER_URL` (`<portal>/?registro=1`, definido en `views/shared.js`). La franja "Iniciar sesión en Mi Negocio" sigue yendo al portal sin parámetro.
- Portal sin `?registro=1`: solo acceso. Teléfono no encontrado muestra "No encontramos una cuenta con ese número" con enlace a `/unete`. Google/Apple envían `loginOnly: true`.
- Portal con `?registro=1`: abre directo "Crea tu cuenta de negocio" (teléfono, nombre, correo, PIN, casilla de profesional, Google/Apple) y enlace "¿Ya tienes cuenta? Inicia sesión".
- Backend: `POST /auth/google` y `/auth/apple` aceptan `loginOnly`; si la cuenta no existe responden 404 "Esta cuenta no está registrada".
- Pendiente: `/negocios` y otros enlaces a `PORTAL_URL` siguen llevando al acceso, no al registro.

### Despliegue del 2026-10-11 (registro/acceso, menú, /unete)
- En producción: separación Únete (registro) y Mi Negocio (acceso solo para registrados), correo en el registro del portal, Google y Apple solo inician sesión en el acceso (`loginOnly`), menú y barra nuevos, `/unete` con cupos fundadores.
- Verificado por Víctor: Google y Apple funcionan en el portal.
- Pendiente: `/negocios` sigue con copy viejo (RD$0 de mensualidad); mes de prueba y cobro de RD$500 aún no existen en el backend.

### /negocios = acceso, /unete = registro con quiz obligatorio (2026-10-11, local)
- `/negocios` pasa a ser una portada corta para negocios con cuenta: botón "Entrar a Mi Negocio", qué hay adentro (agenda, Mi Cuadre, cuentas y comprobantes), ayuda por `/contacto` y enlace a `/unete`. Sin promesas de precio. `/tunegocio` sigue redirigiendo aquí.
- Quiz de nuevo usuario: el asistente existente de "Crea tu negocio" (nombre, negocio, categoría, sector, servicios, cómo conociste Bukea) deja de poder omitirse; se quitó "Omitir por ahora" (solo queda "Cerrar sesión"). El logo sigue siendo opcional.

### Despliegue: acceso directo y pregunta en Únete (2026-10-11)
- `/negocios` y `/tunegocio` redirigen (302) directo al login de Mi Negocio; el asistente de nuevo negocio ya no se puede omitir.
- `/unete` abre con "¿Cómo quieres unirte?": "Tengo un negocio" (registro en el portal con el quiz obligatorio) y "Soy cliente" (`/descargar`, no la mini app).
- Nota operativa: tras extraer el zip, el primer clic en el ícono de reinicio de Node.js a veces no aplica; un segundo clic sí. Verificar siempre con curl antes de dar por hecho el despliegue.

### Registro y acceso por correo estilo Fresha (2026-10-11, desplegado)
- Backend: `POST /api/auth/email/send|verify|register` (código de 6 dígitos por correo, pase de un solo uso `signup_tokens`, sin PIN). `EMAIL_CODE_DEBUG=1` solo funciona en local sin SMTP.
- Portal `negocio.bukeard.com`: una sola pantalla correo → código → completar cuenta → quiz obligatorio. Teléfono + PIN queda como acceso alternativo para cuentas viejas.
- Cliente en el sitio: `/entrar` (cliente o negocio), `/entrar/cliente` (correo → código → nombre), `/cuenta` (Mis citas, cancelar). Sesión compartida con la mini app (`bukea_session`).
- Barra, menú móvil y pie: "Iniciar sesión" (pasa a "Mi cuenta" con sesión). "Soy cliente" en `/unete` va a `/entrar/cliente`.
- Pruebas: `backend/scripts/test-auth-email.js`. Plan: `docs/PLAN-REGISTRO-EMAIL.md`.

### Reserva desde el sitio web (2026-10-11, desplegado)
- Nueva página `/p/:slug/reservar` (`backend/routes/reservar.js`): servicio, persona (si hay equipo), fecha, hora y pago en una sola pantalla con resumen lateral. Usa los mismos endpoints que la mini app (`/api/professionals/:slug`, disponibilidad, `/api/bookings`).
- La cuenta se pide al confirmar: sin sesión, el botón lleva a `/entrar/cliente?next=` con la selección en la URL y regresa a la reserva. Con transferencia permite adjuntar el comprobante al terminar.
- Los botones "Reservar" y "Bukear cita" de `/p/:slug` y del mapa ya no abren la mini app.
- Probado en local y en celular (375 px). En producción solo se verificó que la página y la disponibilidad responden; no se hizo una reserva real.

### Panel de administración (2026-10-11 y 2026-10-12, desplegado)
- Usuarios: filtro "Nuevos (7 días)", casillas, envío de correo a varios (`POST /api/admin/users/bulk-message`, máximo 50, variable `{nombre}`, queda en Comunicación).
- Negocios: filtro "Nuevos (7 días)" y botón WhatsApp por fila con el saludo ya escrito (si el dueño no tiene teléfono muestra "Sin teléfono").
- Todo clicable: tarjetas del Dashboard y Métricas, alertas de "Requiere atención", filas de actividad, usuarios, negocios, reservas, top de negocios y registro de Comunicación.
- "Cerrar sesión" visible y fijo en el teléfono (antes estaba oculto en pantallas angostas).
- Correo de bienvenida automático al crear cuenta (cliente o negocio).

### Plantillas de correo (2026-10-12, desplegado)
- `backend/lib/email-template.js` (estructura y componentes) y `backend/lib/mailer.js`. Cabecera verde profundo con el logo (PNG alojado en `/app/icon-192.png`), línea dorada, tarjeta blanca, pie con enlaces.
- Siete plantillas: código de acceso, bienvenida cliente, bienvenida negocio, recuperar PIN, verificar correo, mensaje del equipo (panel) y avisos internos (negocio nuevo, ticket, contacto). Octava: confirmación de cita (`sendBookingConfirmation`, se envía al reservar sin bloquear la reserva).
- Vista previa local: `node scripts/preview-emails.js` genera `backend/tmp-email-preview/`.
- Verificado en producción: el código de acceso llega con el diseño nuevo y el logo. Sin ver aún en producción: bienvenida nueva, cita confirmada y mensajes del panel.

### Nota de despliegue (2026-10-12)
- El botón "reiniciar" de cPanel Node.js a veces no aplica aunque se extraigan los archivos. Lo que sí funcionó: **detener y luego iniciar** la app (unos segundos de caída). Probar el clic por referencia de elemento, no por coordenadas. `tmp/restart.txt` no funcionó.
- Verificar siempre con un cambio observable (por ejemplo un correo real), no solo con `/api/health`.
- La sesión de cPanel caduca: al pasar un rato pide usuario y contraseña, que debe escribir Víctor.

### Hallazgos de la prueba de registro de cliente en producción (2026-10-12)
- Registro con correo nuevo, código, nombre y bienvenida: funciona de punta a punta.
- El correo con el código tardó una vez unos 10 minutos (servidor de correo del hosting); los demás llegaron en 1 a 2 minutos. La pantalla tarda unos 8 s en pasar al paso del código porque espera el envío.
- Cuentas de prueba creadas en producción: `vmdventura+prueba1@gmail.com` ("Prueba Cliente Uno") y envíos de código a `+prueba2` a `+prueba6`.

### Pendientes
1. Código por correo: pasar al instante y enviar en segundo plano, contador de reenvío, evaluar servicio de envío transaccional.
2. Despliegue automático (hoy es manual por cPanel).
3. Cobro del plan de RD$500 y control de los 30 cupos gratis en el backend.
4. Probar en producción Google y Apple de cliente, una reserva completa y el pago por transferencia con comprobante.
