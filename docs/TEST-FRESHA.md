# Test Bukea vs Fresha — protocolo y resultados

> Primer recorrido: **22 de agosto de 2026**. Fresha recorrido con la cuenta de cliente de Víctor (Chrome, `fresha.com/es`); Bukea recorrido en `https://www.bukeard.com/app/` (vista móvil). Documento vivo: repetir el protocolo tras cada etapa del [ROADMAP](ROADMAP.md) y actualizar la tabla de brechas.
>
> Complementa [FLUJO-REGISTRO-FRESHA.md](FLUJO-REGISTRO-FRESHA.md) (registro de negocio, investigado desde el Help Center) y [COMPETENCIA-BARBERTIME.md](COMPETENCIA-BARBERTIME.md).

---

## 1. Protocolo (qué se compara y cómo)

| # | Flujo | En Fresha | En Bukea | Qué se mide |
|---|---|---|---|---|
| F1 | Descubrir y elegir negocio | Búsqueda / landing de ciudad / perfil del negocio | Inicio por categoría → listado → perfil del profesional | Información visible antes de reservar (fotos, reseñas, horario, dirección, equipo) |
| F2 | Reservar como cliente | Servicio → Hora → Confirmar | Servicio → Día/Hora/Pago → Confirmar | Nº de pasos, disponibilidad real, registro just-in-time, opciones de pago, política de cancelación |
| F3 | Después de reservar | Historial, detalle de cita, mensajes, cambiar/cancelar | "Mis citas", confirmación con WhatsApp simulado | Qué puede hacer el cliente con su cita |
| F4 | Registro del negocio | Wizard (ver FLUJO-REGISTRO-FRESHA) | "Únete a Bukea" | Pasos, campos, verificación, tiempo hasta el panel |
| F5 | Operar el negocio | Calendario, confirmar/cancelar, reportes | "Mi negocio" + "Mi Cuadre" | Qué puede hacer el dueño en su día a día |
| F6 | Notificaciones | Email/SMS/WhatsApp, recordatorios | WhatsApp (OTP y recordatorio, dormidos) | Qué recibe el cliente y cuándo |
| F7 | Walk-ins / fila | Lista de espera por fecha | Fila virtual en vivo | Cómo atienden al que llega sin cita |

Regla: **no crear citas reales en Fresha** (se detiene en "Revisar y confirmar"). En Bukea sí se reserva con un cliente de prueba (`Prueba Claude`, tel. 809-555-0100, PIN 1234).

---

## 2. Lo que se vio en Fresha (22-ago-2026)

### Contexto de mercado (hallazgo importante)
- Fresha **ya tiene tracción real en Santo Domingo**: la landing "Barberías en Santo Domingo" lista 5 negocios verificados con 187 reseñas en total (La Universidad del Corte y el Estilo · 141 reseñas · 5.0; High Level Cuts · 46 · 4.9; Embassy's Barber Room; Olivercut; Juniorstylo). Alrededor de Olivercut aparecen además Fernando The Barber (196 reseñas), Kasús Barber & Nails (52), Yamky-barberstudio (59), Homero stylo (18), GECS, Bebo38, y salones de uñas/cejas/estética (Castle Nails, Popi Lash, Bella Organic). Hay landings también para Santiago, San Pedro de Macorís y Santo Domingo Este.
- **Víctor mismo es cliente recurrente de Fresha** (Olivercut, ~cada 2–3 semanas desde dic-2025, "Corte de pelo más barba" RD$1,000 / 45 min). Es un caso de uso real para contrastar.
- **Implicación:** la línea de VISION.md "baja penetración" de Fresha en RD quedó desactualizada. Fresha no es un competidor teórico — ya opera en el mismo barrio y vertical donde Bukea quiere arrancar.

### F1 — Perfil del negocio (Olivercut)
- Fotos reales del local, galería, "Aún no hay reseñas", estado **Abierto hasta las 21:00**, dirección con "Cómo llegar", compartir, favorito.
- Lista de servicios con duración y precio (RD$800–1,300), botón "Reservar" por servicio o "Reservar ahora".
- Sección Equipo, Acerca de (texto libre del dueño), **horario semanal completo**, "Confirmación instantánea".
- Bloque "Establecimientos cerca" (cross-selling entre negocios) y enlaces SEO por categoría/ciudad.

### F2 — Reserva del cliente
- **3 pasos con barra de progreso**: Servicios → Hora → Confirmar. Panel lateral con el carrito (servicio, profesional, total) siempre visible.
- Fecha: carrusel de días con **disponibilidad real** (días cerrados deshabilitados), horas en **slots de 15 min** según horario y ocupación real.
- **"¿Ninguna cita te viene bien? Únete a la lista de espera"** — Fresha ya tiene lista de espera por fecha (no es fila en vivo, pero cubre parte del caso walk-in).
- Confirmar: política de cancelación (12 h), **penalidad por no cancelar (20% del servicio)**, campo "Comentarios o solicitudes" opcional. En este negocio **no pide tarjeta** (pago en el local) — a la dominicana, igual que Bukea.
- Login/registro solo al confirmar (just-in-time); con sesión iniciada no pide nada más.

### F3 — Después de reservar
- Menú del cliente: Perfil, **Historial**, Billetera, **Mensajes**, Favoritos, Formularios, Ajustes.
- Historial con pestañas (Citas, Tarjetas regalo, Membresías, Venta de productos, Bonos) y sección "Lista de espera".
- Detalle de cita: estado **Confirmada**, añadir al calendario, cómo llegar, **escribe un mensaje** al negocio, ver lugar, resumen con total, política, **Cambiar cita / Cancelar cita**, referencia de reserva, "Volver a reservar" en cada cita pasada.

### F4 — Registro del negocio
- Pantalla de entrada `partners.fresha.com`: email (código de verificación) **o "Continuar con WhatsApp"**, Google, Apple. ⚠️ **Novedad vs. julio:** Fresha ya usa WhatsApp como vía de acceso — el "WhatsApp nativo" de Bukea ya no sorprende por sí solo en el login; la ventaja tiene que estar en el uso (recordatorios, reprogramar por chat, fila).
- No se creó cuenta (no se recorrió el wizard); ver FLUJO-REGISTRO-FRESHA.md para los pasos documentados.

### F5/F6 — Panel del negocio y notificaciones
- No accesible sin cuenta partner. Pendiente para la próxima sesión (Víctor crea la cuenta de negocio en `partners.fresha.com`).

---

## 3. Lo que se vio en Bukea (`www.bukeard.com/app`, 22-ago-2026)

### F1 — Descubrir
- Onboarding inicial "¿Qué servicio buscas?" (6 categorías), inicio con buscador y ubicación fija "Ensanche Quisqueya, Santo Domingo".
- Listado por categoría: 2 profesionales reales en BD (Joel "El Fino", Randy "El Artista"), con barrio, tags de servicios y rating.
- Perfil: avatar con iniciales (sin foto), chips "Responde por WhatsApp / Acepta efectivo / Cita recurrente", portafolio **con placeholders de color** (sin fotos reales), servicios con duración y precio, botón "Bukear cita". **Sin horario, sin dirección/cómo llegar, sin reseñas reales, sin equipo.**

### F2 — Reservar
- 1 pantalla: DÍA (Hoy / Mañana / **"Sáb 6" / "Dom 7"** — etiquetas fijas, no son fechas reales; hoy era sábado 22) · HORA (**4 slots fijos**: 9:00, 10:30, 3:00, 4:30 PM, sin disponibilidad real) · PAGO (Efectivo, Transferencia, tPago, Tarjeta Azul/CardNET) · foto del estilo (opcional).
- Confirmar → **registro just-in-time** con teléfono dominicano + nombre + PIN de 4 dígitos (Google/Apple/Facebook "PRÓXIMAMENTE"). Funciona; ~20 segundos.
- Confirmación "¡Bukeao! 🎉" con resumen y **burbuja de WhatsApp simulada** ("Responde R para reprogramar o C para cancelar"). Sin política de cancelación, sin comentarios al profesional.

### F3 — Después
- "Mis citas" muestra la reserva — pero **se lee de `localStorage`, no del servidor** (cambiar de teléfono = se pierden). Sin cambiar/cancelar, sin mensajes, sin historial, sin "volver a reservar".
- Fila virtual: pantalla "EN VIVO" con 3 personas delante y aviso por WhatsApp — **datos fijos de demo**, "Coger mi turno" no persiste.

### F4 — Registro del negocio
- "Únete a Bukea": un solo formulario (tu nombre, negocio, sector, categoría, servicios dinámicos) → "Crear mi cuenta". Sin verificación de teléfono, sin contraseña, sin horario, sin dirección, sin fotos.

### F5 — Operar
- "Mi negocio": contador de citas, **"Mi Cuadre"** (hoy / 7 días / mes — funciona con datos reales), agenda (lista de citas con "Actualizar"), servicios, "Salir". **Sin confirmar/cancelar, sin bloquear horarios, sin calendario por día.**
- ⚠️ **Seguridad:** la sesión del negocio es solo `localStorage.bukea_pro_slug`; cualquiera que ponga el slug de otro profesional ve su agenda y su cuadre (verificado con `joel-el-fino`). Es deuda conocida del slice, pero **no se puede enseñar a un piloto real así**.
- ⚠️ Accesibilidad: las tarjetas de profesional y de servicio son `div` con `onclick` (no botones) — invisibles para lectores de pantalla y automatización.

---

## 4. Tabla de brechas (ordenada por impacto para el piloto)

| Brecha | Fresha | Bukea hoy | Acción en ROADMAP |
|---|---|---|---|
| **Fechas y disponibilidad reales** | Calendario real, slots 15 min, días cerrados, horario del negocio | Etiquetas fijas ("Sáb 6"), 4 horas fijas | **4.2** — bloquea todo lo demás (agenda, recordatorios, Cuadre por fecha de cita) |
| **Login real del negocio** | Email/WhatsApp/Google/Apple + verificación | `localStorage` sin clave; suplantable | **4.1** — imprescindible antes de cualquier piloto |
| **Agenda operable** | Calendario, confirmar/cancelar, bloquear, mensajes | Lista de citas de solo lectura | **4.3** |
| Cambiar / cancelar cita (cliente) | Sí, con política y penalidad 20% | No | Nuevo: 4.3b — junto con la agenda; definir política de cancelación por negocio |
| "Mis citas" del cliente | Servidor, historial completo, volver a reservar | `localStorage` | Nuevo: 4.2b — leer citas por `user_id` del servidor (ya hay login de cliente) |
| Perfil del negocio completo | Fotos, horario, dirección/mapa, equipo, acerca de | Iniciales, placeholders, sin horario ni dirección | **4.5** (fotos) + agregar horario/dirección al registro |
| Registro del negocio | Wizard con verificación de teléfono | Formulario único sin verificar | **4.7** |
| Notificaciones reales | Email/SMS/WhatsApp | Simuladas (código listo, Meta pendiente) | **2.1 / 4.4** |
| Lista de espera | Por fecha, dentro del flujo | Fila "en vivo" de demo (datos fijos) | **6.1** — mantener, pero ojo: Fresha ya cubre el caso "no hay hora" |
| Reseñas | Verificadas, por negocio | Números fijos de seed | **6.2** |
| Mensajería cliente↔negocio | Chat integrado | No (WhatsApp externo previsto) | Evaluar si el chat va por WhatsApp Business API (diferenciador) |
| Pago | Sin tarjeta en este negocio; opcional por negocio | Efectivo/transferencia/tPago/tarjeta (solo etiqueta) | Fase 3 |

**Donde Bukea ya está a la par o mejor (22-ago):** registro just-in-time del cliente con teléfono + PIN (más rápido que email), pago "a la dominicana" explícito desde el primer paso, copy local ("¡Bukeao!", "Confirmao"), "Mi Cuadre" (Fresha lo tiene, pero enterrado en reportes), categorías multivertical desde el inicio, PWA en cualquier teléfono.

**Lo que Fresha ya tiene y asumíamos que no:** densidad real en Santo Domingo (y Santiago), WhatsApp como login, lista de espera, pago en el local sin tarjeta, web + Android + iOS.

---

## 5. Próxima corrida del test

1. Víctor crea la cuenta de negocio en `partners.fresha.com` → recorrer F4 (wizard real) y F5/F6 (calendario, notificaciones, reportes, costos).
2. Repetir F1–F3 en Bukea cuando se cierren 4.1, 4.2 y 4.3, y actualizar la tabla.
3. Medir tiempos: cronometrar "abrir app → cita confirmada" en ambos con un usuario que no conozca ninguna de las dos.
