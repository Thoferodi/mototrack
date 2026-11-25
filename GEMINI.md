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

## Estado Actual y Registro de Avances

### Stack Operativo
- **Core:** Next.js 14, TypeScript.
- **UI/UX:** Tailwind CSS, Shadcn UI, Lucide Icons.
- **Backend:** Supabase (Auth, Database, Storage).
- **Herramientas Especializadas:** `react-signature-canvas` (firmas digitales), `browser-image-compression` (optimización de imágenes).

### Hitos Completados
- **Infraestructura:** Reconstrucción de archivos raíz (`package.json`, `tsconfig.json`, `tailwind.config.ts`, `.gitignore`).
- **Calidad de Código:** Resolución integral de errores de sintaxis JSX y tipado estricto (`tsc --noEmit` y `next build` validados con éxito).
- **Despliegue:** Aplicación activa en producción vía Vercel.
- **Frontend:** Rediseño completo de la Landing Page principal (`src/app/page.tsx`).
- **Auditoría QA Bloque A (Auth y Dashboard):** Revisión y corrección de autenticación (`getUser()`), aislamiento multi-tenant por `workshop_id`, flujo de órdenes, presupuesto (`total_amount` excluyendo ítems rechazados), catálogo, vehículos y configuración.
- **Auditoría QA Bloque B (Modo Mecánico, Buscador Público y Portal del Cliente):**
  - **Modo Mecánico (`src/app/mechanic/**`):** Validación estricta con `getUser()` y `workshop_id`, botón táctil (`h-14`) de Cerrar Sesión y navegación de retorno, compresión real a WebP con `browser-image-compression` y subida vía `FormData` al bucket `evidences`, actualización de `workorders.updated_at`, etiquetas en español en el timeline, manejo de carga/error sin `useTransition` asíncrono roto ni `alert()`, y revalidación cruzada de rutas.
  - **Buscador Público (`src/app/track` y `src/app/t/[workshopSlug]`):** Soporte para consultas sin sesión mediante `createAdminSupabaseClient()` (`SUPABASE_SERVICE_ROLE_KEY` con fallback seguro), normalización de placa (mayúsculas y sin espacios), validación de últimos 4 dígitos del teléfono o UUID, estados de carga y errores claros.
  - **Portal del Cliente (`src/app/track/[token]` y `src/app/t/[workshopSlug]/track/[token]`):** Implementación unificada (`PublicTrackerView`), persistencia de aprobación/rechazo de ítems con recálculo de `workorders.total_amount` excluyendo rechazados, renderizado de evidencias fotográficas (`media_urls`) y etiquetas en español en el historial, estados de carga/error visibles y revalidación de rutas afectadas.

### Fase Actual
- **Cierre Auditoría QA (Bloques A y B completados):** Flujos principales de autenticación, dashboard, modo mecánico, buscador público y portal del cliente validados con `npx tsc --noEmit` y `npm run build`.
- **Optimización y Despliegue:** Verificar `SUPABASE_SERVICE_ROLE_KEY` en variables de entorno de producción (Vercel) para acceso público bajo RLS estricto y configurar Vercel Cron (`/api/cron/cleanup-media`) para limpieza automática >90 días.