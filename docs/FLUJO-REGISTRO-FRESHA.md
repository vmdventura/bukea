# Flujo de registro de Fresha (referencia para Bukea)

> Investigado el 2026-07-05 desde el Help Center oficial de Fresha.
> Fresha separa dos registros distintos: **cliente** (marketplace) y **negocio** (partners). Bukea debería replicar esta separación.

---

## 1. Registro de NEGOCIO (Fresha for Business / partners.fresha.com)

### Fase A — Crear la cuenta personal del dueño

1. **Pantalla de entrada**: solo pide el **email del negocio** → botón "Continuar".
   - Alternativas de un toque: **Google, Apple o Facebook**.
2. **Datos personales**: nombre y apellido.
3. **Contraseña** segura.
4. **Número de móvil** + **país** (⚠️ el país no se puede cambiar después).
5. **Verificación por SMS**: código de 4 dígitos (máx. 5 intentos, 10 seg de espera entre reenvíos).

### Fase B — Configurar el negocio (onboarding wizard)

Cada pregunta es una pantalla propia, una decisión a la vez:

6. Opción "crear un negocio nuevo" (vs. unirse a un workspace existente como empleado).
7. **Nombre del negocio** + sitio web (opcional).
8. **Tipo de servicio principal** + hasta 3 servicios relacionados más (máx. 4).
9. **Tamaño del equipo** (solo yo / 2-5 / 6-10 / etc.).
10. **Modelo operativo**: local físico, servicio a domicilio (móvil), u online. Si no tiene local, checkbox "no tengo ubicación"; si tiene, agrega la **dirección**.
11. **Software actual** que usa (opcional — dato para migración/marketing).
12. **¿Cómo conociste Fresha?** (opcional — dato de atribución).
13. Botón **"Listo"** → pantalla de confirmación "tu negocio está configurado" → entra directo al dashboard.

### Post-registro

- Se envía un **email de verificación** (no bloquea el uso inmediato).
- El móvil verificado queda asignado automáticamente como teléfono de contacto de la ubicación.
- El dashboard guía los siguientes pasos: agregar servicios, horarios, equipo y activar el perfil en el marketplace.

**Claves del diseño**: fricción mínima al inicio (solo email), verificación temprana del teléfono, wizard de una pregunta por pantalla, campos opcionales claramente marcados, y el usuario llega al producto funcionando en ~2 minutos.

---

## 2. Registro de CLIENTE (marketplace)

1. **Navegación libre sin cuenta**: cualquiera puede buscar negocios, ver servicios, precios y disponibilidad **sin registrarse**.
2. La cuenta solo se exige **al momento de confirmar una reserva** (registro "just-in-time").
3. Registro con **email + móvil verificado**, o social login (Google/Apple/Facebook).
4. La reserva queda ligada a un **perfil de cliente verificado** (el móvil verificado evita no-shows y spam).

### Flujo de reserva (donde ocurre el registro)

1. Cliente elige el/los **servicios** (puede combinar varios en una cita).
2. Elige **profesional** (o "cualquiera disponible"); si hay varios servicios, puede elegir uno distinto por servicio.
3. Elige **fecha y hora** según disponibilidad en tiempo real.
4. **Aquí se pide login/registro** si no tiene sesión.
5. Si el negocio tiene protección de citas activada: captura de **tarjeta o pago anticipado**.
6. Confirmación → notificación con detalles → la cita aparece en su cuenta → después puede **calificar y dejar reseña**.

**Alternativa sin registro**: el negocio puede crear la reserva manualmente desde su calendario con solo nombre y móvil del cliente (cliente "walk-in").

---

## 3. Recomendaciones para el registro de Bukea

| Principio de Fresha | Aplicación en Bukea |
|---|---|
| Dos flujos separados (cliente / negocio) | App o secciones separadas: registro de cliente ultraligero, registro de negocio con wizard |
| Registro just-in-time del cliente | No pedir cuenta para explorar; pedirla solo al confirmar la reserva |
| Verificación por SMS (4 dígitos) | En RD el móvil es la identidad principal — verificar por SMS o **WhatsApp** (ventaja de Bukea, ya hay doc de WhatsApp) |
| Wizard de una pregunta por pantalla | Máx. 7-8 pantallas para el negocio, con barra de progreso |
| Solo email para arrancar | Primera pantalla del negocio: solo email o social login |
| Campos opcionales marcados | Sitio web, software anterior y atribución nunca bloquean el avance |
| País fijado al crear cuenta | Bukea arranca solo RD — simplificar: país implícito |
| Llegar rápido al producto | Al terminar el wizard, dashboard con checklist: servicios → horario → equipo → publicar perfil |

### Diferencia sugerida para Bukea
- Usar **WhatsApp OTP** en vez de SMS (más barato y más usado en RD).
- En el paso de tipo de servicio, usar las categorías locales de Bukea (barbería, salón, spa, uñas, etc.).
- Considerar registro del negocio 100% desde el móvil (Fresha empuja el desktop para partners).

---

## Fuentes

- [Create a Fresha account as a business owner](https://www.fresha.com/help-center/knowledge-base/personal-account/32-create-a-fresha-account-as-a-business-owner)
- [Getting started with Fresha — How to create an account](https://www.fresha.com/help-center/academy/launch-your-workspace/getting-started/lessons/8)
- [Learn how clients book appointments online](https://www.fresha.com/help-center/knowledge-base/online-profile/599-learn-how-clients-book-appointments-online)
- [Fresha Partner Account](https://partners.fresha.com/)
