# Design

## Theme

Boutique de belleza elevada con acento dominicano. Un solo acento comprometido (teal) sobre neutros cálidos con matiz propio (no crema genérica), con oro reservado para calificaciones y momentos de logro. Tipografía con un eje de contraste deliberado — serif cálida para nombres/momentos emocionales, sans humanista para todo lo demás — en vez de tres familias compitiendo.

## Color

Estrategia: **comprometida** (el teal de marca lleva 30-40% de cada pantalla vía CTAs, encabezados y estado activo). Todo en OKLCH; los neutros llevan una pizca del matiz del teal (~190°) en vez de calidez genérica tipo "crema AI".

```css
--teal-900: oklch(24% 0.045 195);   /* texto sobre teal, títulos oscuros */
--teal-700: oklch(37% 0.075 195);   /* #0a6462 aprox — hover/dark */
--teal-600: oklch(46% 0.09 195);    /* #0f8583 aprox — primario */
--teal-500: oklch(55% 0.095 195);   /* estados activos suaves */
--teal-100: oklch(93% 0.035 195);   /* fondos tintados, badges */
--teal-50:  oklch(97% 0.018 195);   /* fondo de pantalla, muy sutil */

--gold-600: oklch(72% 0.135 75);    /* #d99a2b aprox — ratings, logros */
--gold-100: oklch(94% 0.05 78);

--whatsapp: #25d366;   /* color de marca externa, no reinterpretar */
--cash:     oklch(48% 0.1 150);  /* efectivo — verde distinto al de WhatsApp */

--ink:   oklch(21% 0.02 200);
--soft:  oklch(45% 0.025 200);
--bg:    oklch(96% 0.012 195);   /* fondo de pantalla — neutro tintado a teal, no crema */
--card:  oklch(99% 0.004 195);
--line:  oklch(89% 0.012 195);
```

Reglas de uso: el acento teal solo en CTA primario, selección activa e indicadores de estado — nunca decorativo. Oro exclusivo para rating y "logros" (fila completada, cita confirmada). Verde de WhatsApp exclusivo al módulo de WhatsApp; verde de efectivo exclusivo a esa forma de pago — nunca intercambiables.

## Typography

- **Display** — `Fraunces` (serif cálida, óptica variable): nombre del profesional, saludo de inicio, momentos de logro (confirmación, "Bukeao 🎉"). Uso puntual, nunca en controles de UI.
- **UI/Body** — `Plus Jakarta Sans`: navegación, botones, precios, listas, formularios. Lleva toda la jerarquía funcional.
- Escala fija en rem, ratio ~1.15–1.2 (no fluida — esto es una app, no una landing):

```
--fs-xs: 0.6875rem   --fs-sm: 0.8125rem   --fs-base: 0.9375rem
--fs-md: 1.0625rem   --fs-lg: 1.25rem     --fs-xl: 1.5rem
--fs-display: 1.875rem
```

Peso: 700–800 para énfasis funcional (precios, nombres en listas), 400–500 para cuerpo/meta. Nunca mayúsculas en oraciones; solo en etiquetas cortas (badges, labels de opción).

## Layout & Spacing

Escala de espaciado en rem: `0.25 · 0.5 · 0.75 · 1 · 1.25 · 1.5 · 2 · 2.5 · 3`. Radios: `10px` controles pequeños, `16px` tarjetas, `24px+` contenedores grandes, `999px` píldoras/badges. Nada de "card dentro de card": las tarjetas de servicio y profesional son la única capa, sin wrapper adicional.

## Motion

- Transiciones de estado: 180–240ms, `cubic-bezier(0.22, 1, 0.36, 1)` (ease-out-quart).
- Cambio de pantalla: fade + slide sutil (8px), nunca slide completo tipo carrusel.
- Micro-interacciones con propósito: estrella de rating rellenándose, check de confirmación dibujándose, número de la fila con pulso al bajar, burbuja de WhatsApp con efecto de "escribiendo" antes del mensaje.
- Todo respeta `prefers-reduced-motion: reduce` (crossfade instantáneo como alternativa).
- Nada de animación de entrada por scroll ni orquestación de carga — es una app, el usuario ya está en la tarea.

## Iconography

**Ecosistema exclusivo: [Lucide](https://lucide.dev)** (decisión 2026-08-24). Web: `lucide-react`. Nativo: `lucide-react-native`. Siempre íconos individuales (import nombrado, nunca el paquete completo), grid 24x24, `strokeWidth={2}` — así todo el trazo se ve uniforme entre pantallas.

Hoy el backend web es HTML/CSS/JS servido por Express, sin React todavía, así que no hay un `import` real de `lucide-react`: en su lugar, `backend/views/shared.js` (`ICON_SPRITE`), `backend/views/negocio.js` (`n-*`) y `backend/public/index.html` incrustan como `<symbol>` los mismos `path`/`viewBox` oficiales de `lucide-static` (trazo 2px, grid 24x24) y se usan vía `<svg class="icon"><use href="#i-nombre"/></svg>`. El día que haya código React real en este proyecto (ej. si se migra el panel de negocio o la app nativa), ese código importa de `lucide-react`/`lucide-react-native` de verdad, no del sprite.

**Excepciones a propósito, sin equivalente en Lucide** (Lucide no incluye logos de marca ni pictogramas ilustrativos):
- `i-whatsapp` — logo de WhatsApp, se mantiene el trazo propio.
- `c-barberia`, `c-unas`, `c-salon`, `c-maquillaje`, `c-cejas`, `c-pilates` — pictogramas de categoría, ilustrativos y propios de Bukea (ver el círculo teal en `cat-badge`). `c-pilates` pasó brevemente por `person-standing` de Lucide (2026-08-24) pero volvió a ser un pictograma propio el mismo día (figura estirándose sobre una colchoneta) porque Lucide no tiene nada específico de pilates y la figura genérica no comunicaba la categoría. `c-salon` se rediseñó como un secador de pelo (antes eran unas barras abstractas).

Emoji se reserva para momentos de voz/personalidad puntuales (el mensaje de WhatsApp, el título "¿Qué vas a bukear hoy? 👋"), no para iconografía funcional repetida (categorías, navegación, pagos).

## Components (estados)

Cada control interactivo define: default, hover, active/selected, disabled cuando aplica. Mismo vocabulario de tarjeta en todas las pantallas (mismo radio, mismo borde, mismo padding) — si una tarjeta de servicio se ve distinta a una de profesional, algo está mal.

## Assets

Sin fotografía real disponible para el prototipo. Los avatares y el portafolio usan tratamientos degradados con textura sutil (ruido/grano ligero) y monograma tipográfico — nunca emoji suelto como sustituto de imagen. Esto es un placeholder consciente, no el estado final (el copy del footer lo aclara).
