# Contexto del Proyecto: MotoTrack SaaS

Plataforma B2B Multi-Tenant (Multi-Inquilino) optimizada para talleres de motocicletas, con generador de páginas web por taller, panel operativo de recepción/administración, interfaz móvil de mecánicos ("Manos Sucias") y rastreador en vivo en tiempo real con aprobación de presupuestos para el dueño de la moto.

## Stack Tecnológico Oficial
- **Framework Full-Stack:** Next.js 14/15 (App Router) + TypeScript.
- **Estilos y UI:** Tailwind CSS, shadcn/ui, Lucide Icons. Diseño Mobile-First estricto para pantallas táctiles.
- **Base de Datos y Backend:** Supabase (PostgreSQL, Auth, Realtime con WebSockets, Storage).
- **ORM / Consultas:** Prisma ORM o Drizzle ORM con tipado estricto de extremo a extremo.
- **Optimización Multimedia:** `browser-image-compression` para comprimir fotos del mecánico a formato WebP (~250 KB) antes de subirlas al almacenamiento.
- **Hosting y Rutas:** Vercel con soporte para subdominios comodín (`*.tudominio.com`).

## Arquitectura de Directorios (App Router)
- `src/app/(marketing)/`: Página de ventas y captación del SaaS.
- `src/app/t/[workshopSlug]/`: Micrositio público de cada taller, buscador de placa y agendamiento de citas.
- `src/app/t/[workshopSlug]/track/[token]/`: Live Tracker ("Pizza Tracker") e interfaz de aprobación interactiva para el cliente (sin necesidad de login).
- `src/app/dashboard/`: Panel administrativo y de recepción (Tablet/PC - Kanban, órdenes, historial clínico, catálogo de repuestos, configuración).
- `src/app/mechanic/`: Interfaz móvil exclusiva para técnicos ("Manos Sucias").
- `src/app/api/`: Webhooks de WhatsApp y tareas programadas (Cron jobs para limpieza de fotos >90 días).

## Modelo de Datos y Reglas Multi-Tenant
- **Aislamiento por Tenant:** Todas las tablas operativas (`workorders`, `customers`, `motorcycles`, `order_items`, `order_timeline_events`) obligatoriamente incluyen la columna `workshop_id`.
- **Seguridad (RLS):** Activar Row Level Security (RLS) en Supabase para que los empleados autenticados solo accedan a los registros de su respectivo `workshop_id` consultando la tabla `profiles`.
- **Tokens Públicos:** Las órdenes de trabajo cuentan con un `tracking_token UUID` único e impredecible para permitir el acceso seguro del cliente a su seguimiento en tiempo real vía Magic Link.

## Directrices de Desarrollo y UX
1. **Interfaz Táctil del Mecánico:** Botones con altura mínima de `56px` (`h-14` en Tailwind) y separación amplia para uso con guantes o grasa.
2. **Compresión Obligatoria:** Toda imagen capturada en terreno debe pasar por el compresor WebP (máximo 1280px, 0.25 MB) para garantizar fluidez con conexiones móviles lentas (Fast 3G).
3. **Estados de la Orden:** Manejar estrictamente la máquina de estados: `received` -> `diagnosing` -> `waiting_approval` -> `in_repair` -> `quality_check` -> `ready_for_pickup` -> `delivered`.
4. **Control de Presupuestos:** Una vez que el cliente aprueba o rechaza los ítems desde su enlace público, los botones de aprobación deben bloquearse en modo lectura.

## Estado Actual (Pausa)
- Base de datos (Multi-Tenant) y RLS configurados.
- Autenticación, Middleware y Clientes SSR listos.
- Flujo Administrativo: Kanban (`/dashboard/orders`), Recepción (`/dashboard/orders/new`) y Detalle de Presupuesto (`/dashboard/orders/[id]`) completados.
- Flujo Cliente: Live Tracker público (`/track/[token]`) funcional y mobile-first.
- Seguridad: Login con ruteo inteligente por roles (Admin vs. Mecánico).
- Flujo Operativo: Interfaz móvil "Manos Sucias" para mecánicos (`/mechanic`) completada con botones táctiles (Fat-Finger Friendly).
- **Siguiente paso pendiente:** Implementar el panel de personalización del taller en `src/app/dashboard/settings/page.tsx` (Subida de logo WebP en Supabase Storage y configuración de color principal de la marca).