# Competencia local dominicana: CitaApp y Te Resuelvo

> Recorridas el **22 de agosto de 2026** (`citaapp.net`, `teresuelvo.com`, ficha de App Store de Te Resuelvo). A diferencia de Fresha y Booksy (ver `ANALISIS-SITIO-FRESHA.md` y `ANALISIS-SITIO-BOOKSY.md`), estos dos son **players dominicanos**, más pequeños pero más directos: nacieron para este mercado. Complementa `COMPETENCIA-BARBERTIME.md`.

---

## 1. CitaApp (`citaapp.net`) — el más parecido a lo que Bukea construyó primero

### Qué es
Una herramienta SaaS para que **un solo negocio** cree su página de reservas online — no un marketplace de descubrimiento como Fresha/Booksy/Bukea, sino algo más parecido a Calendly o a la ReservaSimple que ya menciona `docs/VISION.md`. Cada negocio tiene su propia página (`citaapp.net/nombre-del-negocio`), la comparte por WhatsApp/Instagram, y el cliente reserva ahí directamente. La home de CitaApp sí lista ~30 negocios ya activos a modo de directorio/prueba social, pero no hay buscador de "cerca de mí" ni descubrimiento por ubicación — el cliente llega porque el negocio le mandó el link.

### Lo que ya tiene funcionando (y Bukea todavía no)
- **Calendario con disponibilidad real**: probé la reserva de "Alquez Prime Barber Club" (Santo Domingo Este) — el calendario marca días "Disponible"/"Sin cupo", y al elegir una fecha muestra los horarios libres de verdad, respetando el horario del negocio (9am–6pm, con hueco de almuerzo 1pm–3pm). Esto es exactamente lo que le falta a Bukea (ROADMAP 4.2) — CitaApp ya lo resolvió con una herramienta genérica de "página de reservas", sin ser siquiera especialista en belleza.
- Perfil del negocio con foto de portada, descripción, **múltiples especialistas** (tab "Profesionales"), servicios con duración y precio en RD$, ubicación con enlace directo a Google Maps y Waze, teléfono.
- Recordatorios automáticos (mencionados en el marketing, no verificados en vivo).
- Se instala como PWA ("Instala CitaApp — reserva más rápido, como una app").

### Precios (vistos 22-ago-2026)
| Plan | Precio | Incluye |
|---|---|---|
| **Básico** | **US$5/mes** (o anual con 30% de descuento) | Página con marca propia, hasta 4 especialistas, calendario y recordatorios, mapa, 6 temas de diseño |
| **Premium** | **US$15/mes** | Todo lo anterior + hasta 8 especialistas, chatbot de WhatsApp (próximamente), temas exclusivos (próximamente), soporte prioritario |

14 días gratis, sin tarjeta, **"sin comisión por cita"**.

### Negocios reales que ya usa (Santo Domingo y alrededores, muestra)
Alquez Prime Barber Club, Classic Barber RD, Corte & Barba, D'Chuky Barber Flow, Jhann Barber Studio, La Barbería, Quiroz Barbershop, Fénix Nails Studio, SindyNails, Jade Beauty Center, M&L Beauty Center Nails, varias clínicas odontológicas y spas — unos **30 negocios** listados, casi todo barbería y uñas (las mismas dos verticales de arranque que eligió Bukea).

### Qué significa para Bukea
- **Es el competidor más barato y más simple del mercado dominicano** — US$5/mes (≈RD$300) es menos que la mitad del plan más económico de Fresha, y su calendario ya funciona de verdad. Si Bukea tarda en resolver fechas/horas reales, un barbero puede resolver su problema hoy mismo con US$5 en CitaApp.
- **No es un marketplace** — no compite por "descubrimiento" de clientes nuevos, solo por herramienta de agenda. Esto es justo el hueco donde Bukea sí puede ganar: Bukea combina agenda **+** marketplace de consumo **+** fila en vivo **+** pagos a la dominicana. Pero hay que dejar de perder por *funcionalidad básica* (fechas reales) frente a un competidor que la resolvió con menos ambición.
- **Validar con los mismos negocios**: varios de los prospectos que CitaApp ya convenció (barberías y nail centers de Santo Domingo) son candidatos directos para la validación de calle de Bukea (ROADMAP Etapa 3) — puede que ya paguen los US$5/mes de CitaApp, lo cual es información valiosa: "¿qué te falta de CitaApp que Bukea sí tiene?" es una pregunta más afilada que las genéricas del guion actual.

---

## 2. Te Resuelvo (`teresuelvo.com`, app iOS/Android) — no es competencia directa, pero toca la misma cancha

### Qué es
Un marketplace **generalista** de servicios verificados en RD — no solo belleza: "eventos, belleza, bienestar, servicios del hogar y mucho más". El cliente explora perfiles por categoría, lee reseñas, **contacta por chat** y solicita el servicio. No hay calendario de reservas online con horarios — es más parecido a un directorio de proveedores verificados con mensajería, estilo Thumbtack/TaskRabbit, que a un sistema de citas.

### Estado (22-ago-2026)
Muy temprano: solo **2 calificaciones** en App Store (5.0), versión 1.0.43 actualizada hace 7 horas (desarrollo activo), copyright 2025 — lanzó recientemente. Hay una segunda app hermana, **"Te Resuelvo Pro"**, que es una herramienta de cumplimiento legal/laboral para negocios (asistente con IA para el Código de Trabajo, liquidaciones, TSS) — nada que ver con reservas, señal de que el equipo apunta a "herramientas para emprendedores dominicanos" en general, no solo belleza.

### Modelo
- Cliente: gratis, explora y contacta.
- Proveedor: perfil gratis para empezar, planes de membresía (mensual/trimestral/anual) para más alcance y posicionamiento — no se vieron precios públicos.
- Verificación de identidad para proveedores (insignia de verificado).

### Qué significa para Bukea
- **No compite por reserva instantánea con horario** — su flujo es "contacta por chat y coordina", el mismo problema de fricción que Bukea/Fresha/CitaApp ya resolvieron con calendario. No es una amenaza en el corto plazo para el caso de uso "bukear una cita ya".
- Sí compite por **atención y espacio en el teléfono** del mismo profesional dominicano que Bukea quiere reclutar — si un barbero ya se registró en Te Resuelvo para conseguir clientes de eventos/bodas, es un prospecto "tibio" más fácil de convertir que uno que no usa nada.
- Vale la pena **revisarlo de nuevo en unos meses** — está muy verde pero el equipo se mueve rápido (build hace 7h) y ya tiene dos productos (Te Resuelvo + Te Resuelvo Pro).

---

## 3. Tabla comparativa actualizada (los 4 jugadores relevantes en RD)

| | Fresha | Booksy | CitaApp | Te Resuelvo | Bukea |
|---|---|---|---|---|---|
| Opera en RD | Sí, con densidad | No | **Sí, nativo de RD** | **Sí, nativo de RD** | Sí (objetivo) |
| Tipo de producto | Marketplace + agenda | Marketplace + agenda | **Solo agenda** (sin descubrimiento) | Directorio + chat (sin agenda) | Marketplace + agenda + fila |
| Fechas/horas reales | Sí | Sí | **Sí** | N/A (no hay calendario) | **No todavía** (ROADMAP 4.2) |
| Precio negocio | RD$240–360/mes | US$30+20/miembro | **US$5–15/mes** | Freemium, membresía sin precio público | Gratis (lanzamiento) |
| Multivertical belleza | Sí | Sí | Sí (barbería/uñas mayoría) | Sí, y más allá de belleza | Sí |
| Fila para walk-ins | Lista de espera | Lista de espera | No | No | **Sí (diferenciador)** |
| Escala en RD | Alta (cientos de negocios, miles de reseñas) | Ninguna | Media (~30 negocios vistos) | Muy temprana (2 reseñas) | — |

**Conclusión que se suma a la de `ANALISIS-SITIO-FRESHA.md`:** el terreno dominicano ya tiene cuatro jugadores con enfoques distintos — ninguno cubre las cuatro cosas juntas que promete Bukea (marketplace + agenda real + fila en vivo + cero fricción de precio). Pero **CitaApp ya resolvió, con menos ambición, la pieza técnica que a Bukea más le urge (fechas/horas reales)** — es la señal más clara de que ROADMAP 4.2 no puede esperar.
