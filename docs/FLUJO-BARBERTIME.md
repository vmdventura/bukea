# Flujo de BarberTime (referencia para Bukea)

> Investigado el 2026-07-05 desde [mybarbertime.app](https://mybarbertime.app), su página [/for-professionals](https://mybarbertime.app/for-professionals) y el [App Store](https://apps.apple.com/do/app/barbertime-citas-y-barber%C3%ADas/id6762223923).
> Complementa [FLUJO-REGISTRO-FRESHA.md](FLUJO-REGISTRO-FRESHA.md) y actualiza [COMPETENCIA-BARBERTIME.md](COMPETENCIA-BARBERTIME.md).

---

## 1. Flujo del CLIENTE

### Registro
- App iOS (Android aún no publicado — ver hallazgos abajo).
- Login por **número de teléfono** + botones de **social login** (pantalla ya usada como referencia para el login de Bukea).
- Gratis para el cliente; solo paga los servicios que reserva.

### Reserva ("en 3 simples pasos" según su web)
1. **Buscar**: profesionales cercanos por ubicación (mapa interactivo), o por nombre, servicio, categoría; filtros de distancia, rating y disponibilidad en tiempo real por fecha/hora.
2. **Reservar**: elige barbería → elige **barbero** → elige **servicio** → elige fecha/hora → confirma "con un tap". Pago **online (tarjeta, Apple Pay, Google Pay con 3D Secure)** o **en persona (efectivo)**. Métodos de pago guardados para checkout rápido.
3. **Confirmación**: notificación automática + recordatorios por **WhatsApp** y push.

### Post-reserva
- Reprogramar o cancelar desde la app sin contactar al negocio; cada negocio define su ventana de cancelación gratis (cargo por cancelación tardía).
- Reembolso automático si el profesional cancela.
- Calificación y reseña verificada post-servicio.
- Programa de referidos: RD$100 por referido completado.

---

## 2. Flujo del NEGOCIO (onboarding B2B)

El registro **no es self-service puro**: los CTA "Empieza gratis" de su web abren **WhatsApp** — el onboarding arranca como conversación asistida.

Pasos que publican ("Listo en 5 minutos, sin compromiso"):
1. **Crear perfil**: servicios, precios y horario de atención.
2. **Compartir enlace**: cada barbería recibe un **enlace único de reservas** para distribuir por WhatsApp y redes.
3. **Recibir reservas**: gestión de citas, equipo, servicios, cobros y clientes desde un solo panel.

### Precios (ahora PÚBLICOS — antes eran opacos)

| Plan | Precio | Nota |
|---|---|---|
| Básico | RD$800/mes | |
| Premium | RD$1,200/mes | Marcado como "popular" |
| Negocios | RD$3,000/mes | Para equipos |

- **1 mes gratis** en todos los planes, "sin compromiso", pero **piden tarjeta para activar la cuenta**.

---

## 3. Hallazgos nuevos (2026-07-05)

1. **Android inminente pero NO publicado**: la web ya muestra badge de Google Play apuntando a `play.google.com/store/apps/details?id=app.mibarbertime.client`, pero el listing devuelve **404**. La ventana de "Bukea corre en Android y ellos no" se está cerrando — es cuestión de semanas, no de meses.
2. **Precios ya públicos** (RD$800–3,000/mes): la debilidad "precio opaco" de nuestro análisis quedó obsoleta. Bukea ya no puede diferenciarse solo por transparencia; puede hacerlo por **precio de entrada más bajo** (RD$500 vs RD$800) y por **no pedir tarjeta para probar**.
3. **Onboarding B2B por WhatsApp asistido**: no tienen wizard self-service como Fresha. Bukea puede ganar con las dos vías: wizard self-service (estilo Fresha) + opción de onboarding asistido por WhatsApp.
4. Ojo: la app "Barber Time" que aparece en Google Play (`com.brunoramos.barbertime.usuarios`) es de **otro desarrollador (Bruno Ramos, Uruguay)** — no confundirla.

---

## 4. BarberTime vs Fresha vs propuesta Bukea

| Aspecto | Fresha | BarberTime | Propuesta Bukea |
|---|---|---|---|
| Registro cliente | Just-in-time (al confirmar reserva) | Login teléfono + social al entrar | Just-in-time + WhatsApp OTP |
| Registro negocio | Wizard self-service (~2 min) | Conversación por WhatsApp | Wizard self-service + asistido por WhatsApp |
| Verificación | SMS 4 dígitos | Teléfono | WhatsApp OTP |
| Pago | Tarjeta/anticipo si el negocio lo exige | Tarjeta primera clase + efectivo | Efectivo/transferencia primero, tarjeta después |
| Prueba B2B | Gratis (modelo comisión) | 1 mes gratis **con tarjeta** | Prueba sin tarjeta |
| Precio B2B | Comisión por cliente nuevo | RD$800–3,000/mes público | RD$500–1,500/mes por silla, cero comisión |
| Enlace único de reservas | Sí (perfil marketplace) | Sí, para compartir por WhatsApp | Sí — y por profesional, no solo por local |

---

## Fuentes

- [BarberTime — Reserva tu cita en segundos](https://mybarbertime.app/)
- [BarberTime para profesionales](https://mybarbertime.app/for-professionals)
- [BarberTime en App Store](https://apps.apple.com/do/app/barbertime-citas-y-barber%C3%ADas/id6762223923)
- Listing Android (`app.mibarbertime.client`) — 404 al 2026-07-05
