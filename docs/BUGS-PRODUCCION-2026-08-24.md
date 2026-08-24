# Bugs encontrados en producción (bukeard.com) — 2026-08-24

> Encontrados en una revisión en vivo de www.bukeard.com (desktop + mobile 375px), navegando el home, `/precios`, `/mapa` y el flujo de reserva completo de un perfil público. Sin errores de consola ni requests fallidos en ningún caso — los bugs son de datos y de layout, no de backend caído.

---

## 1. Dato de prueba (QA) visible en producción — 🔴 Alta prioridad

**Dónde:** Home (`bukeard.com`), listado de profesionales, y `/mapa`

**Qué pasa:** El perfil "Prueba Verificacion" (negocio "Negocio de Prueba QA · Piantini", servicio "Corte de prueba") aparece como un profesional real más, con su propia tarjeta, badge "Nuevo" y perfil público en `/p/prueba-verificacion`. También cuenta en el total "6 profesionales en el mapa" de `/mapa`.

**Por qué importa:** Es lo primero que ve cualquier visitante o prospecto de la Etapa 3. Un dato de QA filtrado en el listado público mina la credibilidad del producto en el peor momento — justo cuando estás por empezar a mostrar la demo a profesionales reales.

**Fix sugerido:** Borrar el registro de la base de datos, o si se necesita mantener para pruebas, agregar un flag `is_test`/`hidden` que lo excluya de las consultas públicas (home, mapa, búsqueda).

---

## 2. Hero de la home ocupa varias pantallas vacías en mobile — 🔴 Alta prioridad

**Dónde:** Home (`bukeard.com`), viewport mobile (375×812, iPhone estándar)

**Qué pasa:** La sección hero ("Bukea tu cita en menos de 60 segundos") tiene una altura fija o mínima que en mobile ocupa el equivalente a 3-4 pantallas completas, la mayor parte en blanco. El usuario tiene que hacer scroll largo por espacio vacío antes de llegar al buscador (ciudad + categoría) y a las tarjetas de profesionales.

**Por qué importa:** Contradice directamente la promesa central del producto ("reserva en 60 segundos") en el canal donde más tráfico real vas a tener — el celular. Un prospecto de la Etapa 3 que abre el link en su teléfono ve una pantalla casi en blanco antes de ver nada útil.

**Fix sugerido:** Revisar el CSS del contenedor hero — probablemente un `min-height` o `height` en viewport units (`100vh` o similar) pensado para desktop que no tiene breakpoint para mobile. Debe ajustarse a `min-height: auto` o un valor fijo razonable (~500-600px) en mobile, y que el buscador quede visible sin scroll o con scroll mínimo.

---

## 3. Fade-in de texto lento en perfiles públicos — 🟡 Prioridad media

**Dónde:** Perfiles públicos `/p/:slug` (probado en `/p/carmen-la-estilista`)

**Qué pasa:** Al cargar el perfil, el nombre del profesional, negocio, rating y badges aparecen con muy baja opacidad (casi invisibles) durante ~2 segundos antes de llegar a su opacidad final. Las secciones "Servicios" y "Cómo llegar" tardan aún más en aparecer.

**Por qué importa:** No es un error de datos (todo está en el HTML desde el primer render), pero da la sensación de una página rota o a medio cargar durante ese lapso — especialmente notorio si el visitante llega directo a un perfil compartido por WhatsApp.

**Fix sugerido:** Acortar la duración/delay de la animación de entrada, o quitarla en estos elementos above-the-fold.

---

## Resumen para el equipo

| # | Bug | Prioridad | Área |
|---|-----|-----------|------|
| 1 | Perfil de prueba QA visible públicamente | 🔴 Alta | Datos / backend |
| 2 | Hero de home rompe el layout en mobile | 🔴 Alta | CSS / frontend |
| 3 | Fade-in lento en perfiles públicos | 🟡 Media | CSS / frontend |

**Recomendación de orden:** arreglar el #1 y el #2 antes de retomar la Etapa 3 (validación en la calle) del [ROADMAP.md](ROADMAP.md) — ambos afectan la primera impresión que va a tener cada uno de los ~25 prospectos cuando abra el link en su teléfono.
