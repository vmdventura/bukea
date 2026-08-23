# Guion de validación en la calle — listo para mañana

> Cubre ROADMAP Etapa 2 (2.2, 2.3, 2.4) y prepara la Etapa 3. Nada de esto es código — es lo que Víctor ejecuta en persona o por teléfono/WhatsApp. Objetivo de la Etapa 3: **≥10 profesionales que digan "yo pago eso"** (o, con la oferta actual, "yo me monto hoy").

---

## 1. La oferta con la que se sale a la calle

Bukea es gratis desde el 22-ago-2026 (ver `docs/PLAN.md`), así que el guion **no pide pagar** — pide **compromiso de uso**:

> "Bukea es gratis, sin tarjeta, para siempre para tus clientes y por ahora también para ti. Te ayudo a montar tu perfil ahora mismo en el teléfono — ¿me das 5 minutos?"

Si el profesional ya usa algo (Fresha, CitaApp, BarberTime, WhatsApp+cuaderno), la pregunta cambia a: "¿qué te falta de eso que Bukea sí tendría?" — más afilada que un genérico "¿qué te duele?".

---

## 2. Guion — 9 preguntas fijas

Usar las mismas preguntas, en el mismo orden, con cada profesional — así las respuestas se pueden comparar.

1. ¿Cómo manejas tus citas hoy? (WhatsApp, cuaderno, Instagram, o alguna app)
2. Si usa una app: ¿cuál? ¿Cuánto pagas al mes? ¿Qué es lo que más te gusta de ella?
3. ¿Qué es lo que más te molesta o te hace perder tiempo en tu día a día con las citas?
4. ¿Te ha pasado que dos clientes lleguen a la misma hora, o que alguien no llegue sin avisar?
5. ¿Cómo cobras — efectivo, transferencia, tarjeta? ¿Con qué frecuencia?
6. ¿Atiendes gente sin cita (walk-ins)? ¿Cómo manejas el orden cuando hay varios esperando?
7. [Mostrar el perfil público `/p/:slug` en el teléfono, o el demo] ¿Esto te serviría para tu negocio?
8. Si te ayudo a montar tu perfil ahora mismo, gratis, ¿lo usarías esta semana?
9. ¿Puedo dejarte mi número y seguir contigo la próxima semana para ver cómo te fue?

**Compromiso a buscar en la 8 y la 9:** un "sí" con nombre, teléfono y fecha — no una intención vaga. Anotarlo tal cual lo dijo.

---

## 3. Hoja de registro (una fila por profesional)

| Nombre | Negocio | Teléfono | Categoría | ¿Usa algo hoy? (cuál, cuánto paga) | Mayor dolor | ¿Se montó? (sí/no/tal vez) | Fecha de seguimiento | Notas |
|---|---|---|---|---|---|---|---|---|
| | | | | | | | | |

Sugerencia: una hoja de Google Sheets compartida, o incluso una nota de WhatsApp a sí mismo por cada visita — lo importante es que las 9 preguntas queden registradas siempre, no la herramienta.

---

## 4. Lista de prospectos — punto de partida

Compilada en esta sesión (22-ago-2026) recorriendo Fresha y CitaApp en vivo — **verificar que sigan operando y conseguir el teléfono antes de visitar** (algunos ya están en la ficha, otros hay que buscarlos). Mitad barbería, mitad uñas/salón, como pide la Etapa 3.

### De Fresha (ya usan una app de reservas — candidatos "tibios", clientes de Fresha que Bukea puede ganar)
- La Universidad del Corte y el Estilo — Calle San Antonio, Santo Domingo (141 reseñas, 5.0)
- High Level Cuts — Nacional, Santo Domingo (46 reseñas, 4.9)
- Fernando The Barber — Santo Domingo Norte (196 reseñas, 4.9)
- Embassy's Barber Room — Santo Domingo
- Olivercut — Buena Vista 1ra, Santo Domingo
- Kasús Barber & Nails — Buena Vista 1ra (52 reseñas — barbería + uñas en un solo negocio, candidato multivertical)
- Guelo Barber Studio — Ensanche Ozama (1.000 reseñas — negocio grande, buena referencia si se logra)
- GS Hairdresser — Piantini (1.728 reseñas)
- Ovalles Barber Shop — El Millón
- Yamky-barberstudio — Distrito Nacional
- Homero stylo — Ensanche Luperón
- Silv Beauty Salon & Nail Bar — Julieta Morales (uñas)
- Good Nails, Beauty Bar and Barbershop — Gazcue (uñas + barbería)

### De CitaApp (ya pagan US$5–15/mes por una herramienta más simple — la pregunta clave: "¿qué te falta de esto?")
- Alquez Prime Barber Club — Santo Domingo Este, tel. 8495743472 (perfil completo, buen ejemplo para mostrar en la visita)
- Classic Barber RD
- Corte & Barba
- D'Chuky Barber Flow
- Jhann Barber Studio
- La Barbería
- Quiroz Barbershop
- Fénix Nails Studio (uñas)
- SindyNails (uñas)
- Jade Beauty Center (salón)
- M&L Beauty Center Nails (uñas)

### De BarberTime
- Víctor ya tiene identificados ~16 negocios públicos en la app BarberTime (no capturados en esta sesión) — revisar `mybarbertime.app` o la app y sacar la lista actualizada antes de salir a la calle.

### Del entorno de Víctor
- Barberías/salones de uñas de confianza cercanos — suelen ser los más fáciles de convencer primero (ya hay relación) y sirven para practicar el guion antes de ir con desconocidos.

**Meta:** empezar por 2-3 del "entorno de Víctor" para calibrar el guion, luego atacar la lista de Fresha/CitaApp — son prospectos de oro porque ya demostraron que pagarían por resolver este problema.

---

## 5. Qué mostrar en la visita

1. El perfil público de un profesional real, ej. `http://localhost:3000/p/joel-el-fino` (o la URL en vivo cuando `bukeard.com` quede apuntado al Node app — ver `CLAUDE.md`).
2. El flujo de reserva completo en el teléfono (día/hora real, confirmación con WhatsApp simulado).
3. El panel "Mi negocio" con "Mi Cuadre" — esto es lo que más engancha a un dueño de negocio.
4. Si acepta montarse: registrarlo ahí mismo con `?join=1` desde el teléfono de Víctor o el del profesional.

---

## 6. Después de cada visita

Actualizar la hoja de registro el mismo día — la memoria falla después de la quinta visita. Al llegar a 10+ compromisos reales, seguir con ROADMAP Etapa 3.4 (decidir ciudad y confirmar precio) y Etapa 5 (montar el piloto).
