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
- **Frontend (Landing Page Modular estilo Huly):** Rediseño integral de la landing pública en `src/app/(marketing)/page.tsx` (Server Component con metadata SEO en español) y componentes modulares en `src/components/landing/` (`Navbar`, `GlowButton`, `HeroSection`, `ProblemSolution`, `BentoFeatures`, `ClientPortalShowcase`, `PricingSection`, `FaqSection`, `FinalCta`, `Footer`, `pricing-data.ts`) con `framer-motion`, haz volumétrico naranja/azul acero, Bento Grid con spotlight hover, contraste claro `#F8FAFC` con simulador interactivo de presupuesto y sección de precios Colombia/LATAM con toggle Mensual/Anual (-20%).
- **Rediseño Operativo Bloque 1 & Bloque 2 (Estética Huly × MotoTrack):**
  - **Bloque 1 (Login, Shell y Módulos Administrativos):** Aplicación de la estética oscura (`#08090C` fondo base, `#0B0D12` sidebar, `#101218` / `#13161E` tarjetas, `border-white/10`, acento `#F97316` y `color-scheme: dark` en inputs/selects) en `src/app/login/page.tsx` (tarjeta glass + botón con halo tipo `GlowButton`), `src/app/dashboard/DashboardShell.tsx` (sidebar oscuro, drawer móvil con botón de cierre y contenedor de logo adaptado a logos oscuros/transparentes), `src/app/dashboard/orders/**` (Kanban oscuro, badges translúcidos y `loading.tsx`), `src/app/dashboard/vehicles/**`, `src/app/dashboard/catalog/**` y `src/app/dashboard/settings/**`.
  - **Bloque 2 (Recepción, Detalle de Orden y Buscador Público):** Rediseño en `src/app/dashboard/orders/new/page.tsx` (tarjetas `#101218`, progreso de compresión WebP y `SignatureCanvas` sobre lienzo `bg-white` con trazo `#09090B` dentro de marco oscuro), `src/app/dashboard/orders/[id]/**` (`page.tsx` con `min-w-0` responsive, `status-selector.tsx` con select oscuro y botón WhatsApp esmeralda, `budget-manager.tsx` con tabla de 6 columnas, tipografía tabular y scroll oscuro contenido, `timeline.tsx` con nodos luminosos y soporte `bg-white` para firmas PNG) y `src/app/track/page.tsx` (continuidad oscura desde la landing manteniendo intacto el tema claro de `src/app/track/[token]/PublicTrackerView.tsx` y el Modo Mecánico `src/app/mechanic/**`).
- **Auditoría QA Bloque A (Auth y Dashboard):** Revisión y corrección de autenticación (`getUser()`), aislamiento multi-tenant por `workshop_id`, flujo de órdenes, presupuesto (`total_amount` excluyendo ítems rechazados), catálogo, vehículos y configuración.
- **Auditoría QA Bloque B (Modo Mecánico, Buscador Público y Portal del Cliente):**
  - **Modo Mecánico (`src/app/mechanic/**`):** Validación estricta con `getUser()` y `workshop_id`, botón táctil (`h-14`) de Cerrar Sesión y navegación de retorno, compresión real a WebP con `browser-image-compression` y subida vía `FormData` al bucket `evidences`, actualización de `workorders.updated_at`, etiquetas en español en el timeline, manejo de carga/error sin `useTransition` asíncrono roto ni `alert()`, y revalidación cruzada de rutas.
  - **Buscador Público (`src/app/track` y `src/app/t/[workshopSlug]`):** Soporte para consultas sin sesión mediante `createAdminSupabaseClient()` (`SUPABASE_SERVICE_ROLE_KEY` con fallback seguro), normalización de placa (mayúsculas y sin espacios), validación de últimos 4 dígitos del teléfono o UUID, estados de carga y errores claros.
  - **Portal del Cliente (`src/app/track/[token]` y `src/app/t/[workshopSlug]/track/[token]`):** Implementación unificada (`PublicTrackerView`), persistencia de aprobación/rechazo de ítems con recálculo de `workorders.total_amount` excluyendo rechazados, renderizado de evidencias fotográficas (`media_urls`) y etiquetas en español en el historial, estados de carga/error visibles y revalidación de rutas afectadas.
- **Auditoría de Producción y Cierre de Cron Job (`cleanup-media`):**
  - Endurecimiento de `src/app/api/cron/cleanup-media/route.ts`: validación obligatoria de `Authorization: Bearer ${process.env.CRON_SECRET}` (401 si falta o es inválido), uso de `createAdminSupabaseClient()`, filtro sobre `order_timeline_events` + `work_orders` para estados terminales (`delivered` y `cancelled`) con `updated_at` > 90 días, limpieza exclusiva del bucket `evidences` y soporte seguro de `?dryRun=true`.
  - Creación de `vercel.json` con cron diario `0 5 * * *` sobre `/api/cron/cleanup-media` (compatible con plan Hobby).
  - Auditoría en Vercel (`mototrack` / `thoferodi-2426`): variables `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` y `CRON_SECRET` confirmadas activas en `production` y `preview`, y último despliegue `dpl_5NbiWm1p37r56JSfxph2F5yxS6wK` en estado `READY` sin errores de runtime ni middleware.
- **Módulo de Gestión de Equipo (`/dashboard/team`):**
  - Navegación en `src/app/dashboard/DashboardShell.tsx` con enlace "Equipo" visible únicamente para `owner`, `admin` y `manager`.
  - Página `src/app/dashboard/team/page.tsx`, skeleton `loading.tsx`, componente cliente `TeamManager.tsx` (estética oscura Huly × MotoTrack, tarjetas KPI, tabla desktop + tarjetas móvil, modal de alta con generador criptográfico y copia de contraseña temporal, cambio de rol y modal de confirmación para activar/desactivar) y Server Actions en `src/app/dashboard/team/actions.ts` (`createTeamMember`, `updateMemberRole`, `toggleMemberActive`) con aislamiento estricto por `workshop_id`, validación de rol `owner` para asignar `admin`/`manager`, protección contra auto-desactivación o degradación del único administrador activo, y sincronización de `app_metadata.role` y `ban_duration` (`876000h` / `none`) en Supabase Auth.
  - Sincronización del enum `user_role` en `src/types/database.types.ts` (`admin`, `mechanic`, `receptionist`, `owner`, `manager`) y validación de cuentas desactivadas (`profiles.active === false` / `user_banned`) en `src/app/login/actions.ts`, `src/app/login/page.tsx`, `src/middleware.ts` y `src/app/dashboard/layout.tsx`.
- **Panel de Alta Rápida de Talleres (`/superadmin`):**
  - Control de acceso estricto en servidor (`src/app/superadmin/auth.ts`, `page.tsx`, `actions.ts`) validando `auth.getUser()` contra `process.env.SUPERADMIN_EMAILS` (lista separada por comas, insensible a mayúsculas y espacios): redirige a `/login` sin sesión y devuelve `notFound()` (404) a usuarios no autorizados; soporte en `src/app/login/actions.ts` para superadmins sin perfil previo.
  - Interfaz oscura Huly × MotoTrack (`src/app/superadmin/OnboardingManager.tsx` y `loading.tsx`): KPIs globales, formulario "Nuevo Taller Piloto" (autogeneración/validación en vivo de `slug`, WhatsApp, dirección opcional, color corporativo `#F97316`, `plan_type` del enum `workshop_plan`: `free` / `pro` / `enterprise`, dueño inicial `owner` con generador CSPRNG de contraseña temporal), directorio de talleres existentes (enlace directo a `/t/[slug]`, plan, WhatsApp, usuarios activos y órdenes) y tarjeta de entrega en 1 clic lista para copiar/enviar por WhatsApp.
  - Server Action atómica `createWorkshopWithOwner` con `createAdminSupabaseClient()`: validación previa de unicidad de `slug` y correo (Paso A), inserción en `workshops` (Paso B), creación en Auth (`email_confirm: true`, `app_metadata.role = 'owner'`) + `profiles` (Paso C) y rollback obligatorio en `workshops` (y Auth si aplica) ante cualquier fallo.
- **Paquete Final para Talleres Piloto (Comprobante PDF+QR, KPIs Mensuales y Rendimiento de Mecánicos):**
  - **Comprobante Imprimible / PDF con QR (`/dashboard/orders/[id]/receipt`):** Hoja en fondo blanco puro (`bg-white text-zinc-950`) con barra de impresión `PrintToolbar.tsx` (`print:hidden`), aislamiento `@media print` en `DashboardShell.tsx` y `src/app/globals.css`, botón "Comprobante / PDF" en `src/app/dashboard/orders/[id]/page.tsx`, logo del taller, datos del cliente/moto (`FUEL_LEVEL_LABELS`), tabla de `order_items` con Total Aprobado en COP, firma de recepción desde `order_timeline_events.media_urls`, línea de firma de entrega y código QR SVG generado localmente con `qrcode` hacia `${baseUrl}/track/${tracking_token}`.
  - **KPIs Mensuales en `/dashboard/orders`:** Cálculo en servidor en zona horaria `America/Bogota` (`src/lib/format.ts`) de Motos Activas, Entregadas (Mes), Ingresos Aprobados (Mes) y Ticket Promedio en COP con franja superior `tabular-nums`; privacidad por rol (`owner`/`admin`/`manager` ven los 4 KPIs; `receptionist` ve únicamente los 2 KPIs operativos).
  - **Asignación de Mecánico y Rendimiento (`/dashboard/performance`):** Selector de mecánico responsable (`work_orders.mechanic_id`) en `src/app/dashboard/orders/new/` (`NewOrderForm.tsx` + `createWorkOrder`) y en `src/app/dashboard/orders/[id]/` (`mechanic-selector.tsx` + `assignOrderMechanic`) con validación estricta de `workshop_id`; enlace "Rendimiento" en `DashboardShell.tsx` exclusivo para `owner`/`admin`/`manager`; vista `/dashboard/performance` (`page.tsx`, `PerformanceView.tsx`, `loading.tsx`) con filtro por período (`this_month`, `last_month`, `last_90d`, `all` en `America/Bogota`), métricas de activas/entregadas/mano de obra aprobada/total aprobado en COP, bloque separado para órdenes sin asignar y detalle desplegable de motos por mecánico con redirección automática para `receptionist` y `mechanic`.

### Fase Actual
- **Paquete final de talleres piloto verificado y listo para despliegue:** `npx tsc --noEmit`, `npm run build` y validación visual/funcional en escritorio (`1440x900`) y móvil (`390x844`) —incluyendo comprobante PDF+QR, KPIs por rol, asignación de mecánico y rendimiento— completados con éxito sin modificar `src/app/mechanic/**`, `/track/[token]` ni políticas RLS.