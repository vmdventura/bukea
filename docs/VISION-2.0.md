# Bukea 2.0 — Visión del Producto

> **Documento aspiracional / alterno.** Propone un rediseño premium (Flutter, nueva paleta, arquitectura de monorepo con apps separadas) que **no coincide** con las decisiones ya tomadas en [../CLAUDE.md](../CLAUDE.md) ni con lo ya construido en `backend/` (Node/Express + MySQL, teal `#0f8583`). Se guarda aquí como insumo para discusión futura — no reemplaza [VISION.md](VISION.md) ni [PLAN.md](PLAN.md), que siguen siendo la fuente de verdad vigente.

> La plataforma premium para descubrir, reservar y gestionar servicios de belleza y bienestar.

---

# Filosofía

Bukea no es una aplicación para hacer citas.

Es el sistema operativo para profesionales de belleza.

El objetivo es eliminar el caos de:

- WhatsApp
- Instagram
- Agenda física
- Llamadas
- Excel

y convertir todo en una experiencia simple.

---

# Principios de Diseño

## Premium First

La aplicación debe sentirse como un producto Apple.

Mucho espacio en blanco.

Fotografía profesional.

Animaciones suaves.

Interfaces limpias.

---

## Mobile First

Toda decisión debe pensarse primero para iPhone.

---

## Simplicidad

Menos botones.

Menos texto.

Menos ruido.

Más acciones.

---

## Fotografía antes que iconografía

Las categorías deben vender experiencias.

No servicios.

---

# Identidad Visual

Inspiración

- Apple
- Airbnb
- Linear
- Arc Browser
- Notion

---

# Paleta

Primary

#00BFA5

Background

#FAFAF7

Surface

#FFFFFF

Text

#111827

Subtitle

#6B7280

Border

#E5E7EB

Success

#22C55E

Warning

#F59E0B

Danger

#EF4444

---

# Tipografía

Marca

Playfair Display

Interfaz

Inter

iOS

SF Pro

---

# Espaciado

4

8

12

16

24

32

48

64

Todo debe seguir una cuadrícula de 8 px.

---

# Arquitectura

```
apps/
    mobile/
    admin/

backend/

packages/

    design_system/

    ui/

    core/

    api/

    models/

docs/
```

---

# Tecnologías

Flutter

Riverpod

GoRouter

Dio

Firebase

Drift

Freezed

Google Maps

Lottie

---

# Módulos

## Cliente

- Splash
- Onboarding
- Login
- Registro
- Home
- Buscar
- Categorías
- Negocio
- Profesional
- Reserva
- Pago
- Confirmación
- Mis citas
- Favoritos
- Perfil
- Ajustes

---

## Profesional

Dashboard

Agenda

Clientes

Inventario

Caja

Ingresos

Equipo

Sucursales

Reportes

---

## Administrador

Usuarios

Negocios

Moderación

Analytics

Suscripciones

CMS

---

# Home

## Hero

Hola, Víctor 👋

Reserva tu próxima cita

[ Buscar ]

📍 Santo Domingo

---

## Categorías

Cada categoría utiliza:

Fotografía

+

Icono

+

Nombre

Ejemplos

💈 Barberías

💇 Salones

💅 Nails

🧖 Spa

💄 Makeup

🏋️ Pilates

---

## Secciones

Profesionales destacados

Cerca de ti

Más reservados

Nuevos

Promociones

---

# Perfil del Negocio

Hero con fotografía

Logo

Rating

Cantidad de reseñas

Mapa

Servicios

Equipo

Galería

Opiniones

Reservar

---

# Flujo de Reserva

Negocio

↓

Profesional

↓

Servicio

↓

Fecha

↓

Hora

↓

Confirmación

↓

Pago

↓

WhatsApp

---

# IA

Responder automáticamente consultas

Detectar huecos libres

Mover clientes en lista de espera

Sugerir promociones

Predecir cancelaciones

Analizar ingresos

Recomendar horarios

---

# Componentes

Buttons

Cards

Search

Inputs

Bottom Sheet

Calendar

Date Picker

Avatar

Rating

Badges

Tags

Chips

Business Card

Professional Card

Promotion Card

Bottom Navigation

FAB

Dialogs

Skeleton

Toast

Snackbars

---

# Animaciones

Fade

Scale

Hero

Shared Transition

Haptic Feedback

Loading Skeleton

Animated Search

Parallax

---

# Modelo de Negocio

Gratis

Agenda

Clientes

Reservas

WhatsApp

---

Pro

IA

Recordatorios

Analíticas

Campañas

No Shows

---

Premium

Multi-sucursal

CRM

Inventario

Caja

Equipo

Marketing

API

---

# Roadmap

## Sprint 1

Proyecto Flutter

Design System

Home

Navegación

Componentes

---

## Sprint 2

Buscar

Perfil

Reserva

Login

Registro

Favoritos

---

## Sprint 3

Dashboard Profesional

Agenda

Clientes

Caja

Inventario

---

## Sprint 4

Backend

API

Firebase

Push

WhatsApp

Pagos

---

## Sprint 5

IA

Analytics

Marketplace

Optimización

App Store

Google Play

---

# Objetivo

Crear la aplicación de reservas más elegante y completa de Latinoamérica, con una experiencia premium enfocada en el mercado dominicano y preparada para escalar internacionalmente.
