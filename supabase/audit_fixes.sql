-- ============================================================================
-- MotoTrack SaaS - Auditoría Integral de Base de Datos (Propuesta de Correcciones)
-- Proyecto Supabase: ulqyrfkxsfomvqztsndm
-- IMPORTANTE: Revisar cuidadosamente antes de ejecutar en Supabase SQL Editor.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. ALINEACIÓN DE ROLES (public.user_role)
-- Nota: Actualmente el enum en BD solo contiene ('admin', 'mechanic', 'receptionist').
-- Se agregan 'owner' y 'manager' de forma idempotente (debe ejecutarse fuera de bloque BEGIN/COMMIT).
-- ----------------------------------------------------------------------------
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'owner';
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'manager';


-- ----------------------------------------------------------------------------
-- 2. TRIGGER DE AUTH (auth.users -> public.profiles)
-- Corrige error 23502: null value in column "full_name" violates not-null constraint
-- y maneja de forma segura workshop_id nulo/vacío/inválido al crear usuarios desde Dashboard.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
  v_full_name text;
  v_raw_workshop_id text;
  v_workshop_id uuid := NULL;
  v_raw_role text;
  v_role public.user_role := 'mechanic'::public.user_role;
BEGIN
  -- Garantizar un nombre no nulo y no vacío (prioridad: metadata -> parte local del email -> fallback)
  v_full_name := COALESCE(
    NULLIF(btrim(NEW.raw_user_meta_data->>'full_name'), ''),
    NULLIF(btrim(NEW.raw_user_meta_data->>'name'), ''),
    NULLIF(split_part(COALESCE(NEW.email, ''), '@', 1), ''),
    'Usuario'
  );

  -- Validar workshop_id si viene en metadata (evita error 22P02 con string vacío o FK inexistente)
  v_raw_workshop_id := NULLIF(btrim(NEW.raw_user_meta_data->>'workshop_id'), '');
  IF v_raw_workshop_id IS NOT NULL
     AND v_raw_workshop_id ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
    IF EXISTS (SELECT 1 FROM public.workshops WHERE id = v_raw_workshop_id::uuid) THEN
      v_workshop_id := v_raw_workshop_id::uuid;
    END IF;
  END IF;

  -- Leer rol solo desde raw_app_meta_data (no editable por el usuario final)
  v_raw_role := NULLIF(btrim(NEW.raw_app_meta_data->>'role'), '');
  IF v_raw_role IN ('admin', 'owner', 'manager', 'receptionist', 'mechanic') THEN
    v_role := v_raw_role::public.user_role;
  END IF;

  INSERT INTO public.profiles (id, workshop_id, full_name, role, active)
  VALUES (NEW.id, v_workshop_id, v_full_name, v_role, true)
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

-- Restringir ejecución directa vía Data API (solo Postgres dispara el trigger)
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();


-- ----------------------------------------------------------------------------
-- 3. FUNCIONES AUXILIARES DE SEGURIDAD (search_path fijo + aislamiento activo)
-- ----------------------------------------------------------------------------
CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC, anon;
GRANT USAGE ON SCHEMA private TO authenticated;

CREATE OR REPLACE FUNCTION public.get_my_workshop_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
  SELECT workshop_id
  FROM public.profiles
  WHERE id = (SELECT auth.uid())
    AND COALESCE(active, true) = true;
$$;

REVOKE ALL ON FUNCTION public.get_my_workshop_id() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_my_workshop_id() TO authenticated;

CREATE OR REPLACE FUNCTION private.has_workshop_role(allowed_roles text[])
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = (SELECT auth.uid())
      AND COALESCE(active, true) = true
      AND workshop_id IS NOT NULL
      AND role::text = ANY(allowed_roles)
  );
$$;

REVOKE ALL ON FUNCTION private.has_workshop_role(text[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.has_workshop_role(text[]) TO authenticated;


-- ----------------------------------------------------------------------------
-- 4. ÍNDICES PARA RENDIMIENTO DE RLS Y JOINS MULTI-TENANT
-- ----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_profiles_workshop_id ON public.profiles (workshop_id);
CREATE INDEX IF NOT EXISTS idx_customers_workshop_id ON public.customers (workshop_id);
CREATE INDEX IF NOT EXISTS idx_motorcycles_workshop_id ON public.motorcycles (workshop_id);
CREATE INDEX IF NOT EXISTS idx_motorcycles_customer_id ON public.motorcycles (customer_id);
CREATE INDEX IF NOT EXISTS idx_work_orders_workshop_id ON public.work_orders (workshop_id);
CREATE INDEX IF NOT EXISTS idx_work_orders_motorcycle_id ON public.work_orders (motorcycle_id);
CREATE INDEX IF NOT EXISTS idx_work_orders_mechanic_id ON public.work_orders (mechanic_id);
CREATE INDEX IF NOT EXISTS idx_order_items_workshop_id ON public.order_items (workshop_id);
CREATE INDEX IF NOT EXISTS idx_order_items_work_order_id ON public.order_items (work_order_id);
CREATE INDEX IF NOT EXISTS idx_order_timeline_events_workshop_id ON public.order_timeline_events (workshop_id);
CREATE INDEX IF NOT EXISTS idx_order_timeline_events_work_order_id ON public.order_timeline_events (work_order_id);


-- ----------------------------------------------------------------------------
-- 5. AUDITORÍA Y CORRECCIÓN DE POLÍTICAS RLS EN TODAS LAS TABLAS DE public
-- Roles soportados: owner, manager, admin, receptionist, mechanic
-- NOTA DE SEGURIDAD: Se eliminan las políticas anon con USING (true) en work_orders
-- y order_timeline_events, y se revoca acceso directo de anon a tablas.
-- Las rutas públicas (/track, /t/[slug], /api/cron/*) operan vía createAdminSupabaseClient()
-- (SUPABASE_SERVICE_ROLE_KEY) validando tracking_token o placa + últimos 4 dígitos.
-- ----------------------------------------------------------------------------
ALTER TABLE public.workshops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.motorcycles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_timeline_events ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon;

-- Eliminar políticas previas permisivas o inseguras
DROP POLICY IF EXISTS "Users can access their own workshop" ON public.workshops;
DROP POLICY IF EXISTS "Users can access their workshop profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can access their workshop customers" ON public.customers;
DROP POLICY IF EXISTS "Users can access their workshop motorcycles" ON public.motorcycles;
DROP POLICY IF EXISTS "Public live tracking by token" ON public.work_orders;
DROP POLICY IF EXISTS "Users can access their workshop work_orders" ON public.work_orders;
DROP POLICY IF EXISTS "Users can access their workshop order_items" ON public.order_items;
DROP POLICY IF EXISTS "Public timeline events for tracking" ON public.order_timeline_events;
DROP POLICY IF EXISTS "Users can access their workshop order_timeline_events" ON public.order_timeline_events;

-- Limpiar posibles políticas nuevas en caso de re-ejecución
DROP POLICY IF EXISTS "workshops_select_member" ON public.workshops;
DROP POLICY IF EXISTS "workshops_update_admin" ON public.workshops;

DROP POLICY IF EXISTS "profiles_select_self_or_workshop" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_admin" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_admin" ON public.profiles;
DROP POLICY IF EXISTS "profiles_delete_admin" ON public.profiles;

DROP POLICY IF EXISTS "customers_select_member" ON public.customers;
DROP POLICY IF EXISTS "customers_insert_staff" ON public.customers;
DROP POLICY IF EXISTS "customers_update_staff" ON public.customers;
DROP POLICY IF EXISTS "customers_delete_admin" ON public.customers;

DROP POLICY IF EXISTS "motorcycles_select_member" ON public.motorcycles;
DROP POLICY IF EXISTS "motorcycles_insert_staff" ON public.motorcycles;
DROP POLICY IF EXISTS "motorcycles_update_staff" ON public.motorcycles;
DROP POLICY IF EXISTS "motorcycles_delete_admin" ON public.motorcycles;

DROP POLICY IF EXISTS "work_orders_select_member" ON public.work_orders;
DROP POLICY IF EXISTS "work_orders_insert_staff" ON public.work_orders;
DROP POLICY IF EXISTS "work_orders_update_member" ON public.work_orders;
DROP POLICY IF EXISTS "work_orders_delete_admin" ON public.work_orders;

DROP POLICY IF EXISTS "order_items_select_member" ON public.order_items;
DROP POLICY IF EXISTS "order_items_insert_staff" ON public.order_items;
DROP POLICY IF EXISTS "order_items_update_staff" ON public.order_items;
DROP POLICY IF EXISTS "order_items_delete_staff" ON public.order_items;

DROP POLICY IF EXISTS "timeline_select_member" ON public.order_timeline_events;
DROP POLICY IF EXISTS "timeline_insert_member" ON public.order_timeline_events;
DROP POLICY IF EXISTS "timeline_update_admin" ON public.order_timeline_events;
DROP POLICY IF EXISTS "timeline_delete_admin" ON public.order_timeline_events;

-- 5.1 workshops
CREATE POLICY "workshops_select_member"
  ON public.workshops FOR SELECT
  TO authenticated
  USING (
    id = public.get_my_workshop_id()
    AND private.has_workshop_role(ARRAY['owner', 'manager', 'admin', 'receptionist', 'mechanic'])
  );

CREATE POLICY "workshops_update_admin"
  ON public.workshops FOR UPDATE
  TO authenticated
  USING (
    id = public.get_my_workshop_id()
    AND private.has_workshop_role(ARRAY['owner', 'manager', 'admin'])
  )
  WITH CHECK (
    id = public.get_my_workshop_id()
    AND private.has_workshop_role(ARRAY['owner', 'manager', 'admin'])
  );

-- 5.2 profiles
-- Permite leer el propio perfil aunque workshop_id sea NULL, o los perfiles del mismo taller
CREATE POLICY "profiles_select_self_or_workshop"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (
    id = (SELECT auth.uid())
    OR (
      workshop_id IS NOT NULL
      AND workshop_id = public.get_my_workshop_id()
      AND private.has_workshop_role(ARRAY['owner', 'manager', 'admin', 'receptionist', 'mechanic'])
    )
  );

CREATE POLICY "profiles_insert_admin"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (
    workshop_id = public.get_my_workshop_id()
    AND private.has_workshop_role(ARRAY['owner', 'manager', 'admin'])
  );

CREATE POLICY "profiles_update_admin"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (
    workshop_id = public.get_my_workshop_id()
    AND private.has_workshop_role(ARRAY['owner', 'manager', 'admin'])
  )
  WITH CHECK (
    workshop_id = public.get_my_workshop_id()
    AND private.has_workshop_role(ARRAY['owner', 'manager', 'admin'])
  );

CREATE POLICY "profiles_delete_admin"
  ON public.profiles FOR DELETE
  TO authenticated
  USING (
    workshop_id = public.get_my_workshop_id()
    AND id <> (SELECT auth.uid())
    AND private.has_workshop_role(ARRAY['owner', 'manager', 'admin'])
  );

-- 5.3 customers
CREATE POLICY "customers_select_member"
  ON public.customers FOR SELECT
  TO authenticated
  USING (
    workshop_id = public.get_my_workshop_id()
    AND private.has_workshop_role(ARRAY['owner', 'manager', 'admin', 'receptionist', 'mechanic'])
  );

CREATE POLICY "customers_insert_staff"
  ON public.customers FOR INSERT
  TO authenticated
  WITH CHECK (
    workshop_id = public.get_my_workshop_id()
    AND private.has_workshop_role(ARRAY['owner', 'manager', 'admin', 'receptionist'])
  );

CREATE POLICY "customers_update_staff"
  ON public.customers FOR UPDATE
  TO authenticated
  USING (
    workshop_id = public.get_my_workshop_id()
    AND private.has_workshop_role(ARRAY['owner', 'manager', 'admin', 'receptionist'])
  )
  WITH CHECK (
    workshop_id = public.get_my_workshop_id()
    AND private.has_workshop_role(ARRAY['owner', 'manager', 'admin', 'receptionist'])
  );

CREATE POLICY "customers_delete_admin"
  ON public.customers FOR DELETE
  TO authenticated
  USING (
    workshop_id = public.get_my_workshop_id()
    AND private.has_workshop_role(ARRAY['owner', 'manager', 'admin'])
  );

-- 5.4 motorcycles
CREATE POLICY "motorcycles_select_member"
  ON public.motorcycles FOR SELECT
  TO authenticated
  USING (
    workshop_id = public.get_my_workshop_id()
    AND private.has_workshop_role(ARRAY['owner', 'manager', 'admin', 'receptionist', 'mechanic'])
  );

CREATE POLICY "motorcycles_insert_staff"
  ON public.motorcycles FOR INSERT
  TO authenticated
  WITH CHECK (
    workshop_id = public.get_my_workshop_id()
    AND private.has_workshop_role(ARRAY['owner', 'manager', 'admin', 'receptionist'])
  );

CREATE POLICY "motorcycles_update_staff"
  ON public.motorcycles FOR UPDATE
  TO authenticated
  USING (
    workshop_id = public.get_my_workshop_id()
    AND private.has_workshop_role(ARRAY['owner', 'manager', 'admin', 'receptionist'])
  )
  WITH CHECK (
    workshop_id = public.get_my_workshop_id()
    AND private.has_workshop_role(ARRAY['owner', 'manager', 'admin', 'receptionist'])
  );

CREATE POLICY "motorcycles_delete_admin"
  ON public.motorcycles FOR DELETE
  TO authenticated
  USING (
    workshop_id = public.get_my_workshop_id()
    AND private.has_workshop_role(ARRAY['owner', 'manager', 'admin'])
  );

-- 5.5 work_orders
CREATE POLICY "work_orders_select_member"
  ON public.work_orders FOR SELECT
  TO authenticated
  USING (
    workshop_id = public.get_my_workshop_id()
    AND private.has_workshop_role(ARRAY['owner', 'manager', 'admin', 'receptionist', 'mechanic'])
  );

CREATE POLICY "work_orders_insert_staff"
  ON public.work_orders FOR INSERT
  TO authenticated
  WITH CHECK (
    workshop_id = public.get_my_workshop_id()
    AND private.has_workshop_role(ARRAY['owner', 'manager', 'admin', 'receptionist'])
  );

CREATE POLICY "work_orders_update_member"
  ON public.work_orders FOR UPDATE
  TO authenticated
  USING (
    workshop_id = public.get_my_workshop_id()
    AND private.has_workshop_role(ARRAY['owner', 'manager', 'admin', 'receptionist', 'mechanic'])
  )
  WITH CHECK (
    workshop_id = public.get_my_workshop_id()
    AND private.has_workshop_role(ARRAY['owner', 'manager', 'admin', 'receptionist', 'mechanic'])
  );

CREATE POLICY "work_orders_delete_admin"
  ON public.work_orders FOR DELETE
  TO authenticated
  USING (
    workshop_id = public.get_my_workshop_id()
    AND private.has_workshop_role(ARRAY['owner', 'manager', 'admin'])
  );

-- 5.6 order_items
CREATE POLICY "order_items_select_member"
  ON public.order_items FOR SELECT
  TO authenticated
  USING (
    workshop_id = public.get_my_workshop_id()
    AND private.has_workshop_role(ARRAY['owner', 'manager', 'admin', 'receptionist', 'mechanic'])
  );

CREATE POLICY "order_items_insert_staff"
  ON public.order_items FOR INSERT
  TO authenticated
  WITH CHECK (
    workshop_id = public.get_my_workshop_id()
    AND private.has_workshop_role(ARRAY['owner', 'manager', 'admin', 'receptionist'])
  );

CREATE POLICY "order_items_update_staff"
  ON public.order_items FOR UPDATE
  TO authenticated
  USING (
    workshop_id = public.get_my_workshop_id()
    AND private.has_workshop_role(ARRAY['owner', 'manager', 'admin', 'receptionist'])
  )
  WITH CHECK (
    workshop_id = public.get_my_workshop_id()
    AND private.has_workshop_role(ARRAY['owner', 'manager', 'admin', 'receptionist'])
  );

CREATE POLICY "order_items_delete_staff"
  ON public.order_items FOR DELETE
  TO authenticated
  USING (
    workshop_id = public.get_my_workshop_id()
    AND private.has_workshop_role(ARRAY['owner', 'manager', 'admin', 'receptionist'])
  );

-- 5.7 order_timeline_events
CREATE POLICY "timeline_select_member"
  ON public.order_timeline_events FOR SELECT
  TO authenticated
  USING (
    workshop_id = public.get_my_workshop_id()
    AND private.has_workshop_role(ARRAY['owner', 'manager', 'admin', 'receptionist', 'mechanic'])
  );

CREATE POLICY "timeline_insert_member"
  ON public.order_timeline_events FOR INSERT
  TO authenticated
  WITH CHECK (
    workshop_id = public.get_my_workshop_id()
    AND private.has_workshop_role(ARRAY['owner', 'manager', 'admin', 'receptionist', 'mechanic'])
  );

CREATE POLICY "timeline_update_admin"
  ON public.order_timeline_events FOR UPDATE
  TO authenticated
  USING (
    workshop_id = public.get_my_workshop_id()
    AND private.has_workshop_role(ARRAY['owner', 'manager', 'admin'])
  )
  WITH CHECK (
    workshop_id = public.get_my_workshop_id()
    AND private.has_workshop_role(ARRAY['owner', 'manager', 'admin'])
  );

CREATE POLICY "timeline_delete_admin"
  ON public.order_timeline_events FOR DELETE
  TO authenticated
  USING (
    workshop_id = public.get_my_workshop_id()
    AND private.has_workshop_role(ARRAY['owner', 'manager', 'admin'])
  );


-- ----------------------------------------------------------------------------
-- 6. STORAGE BUCKETS Y POLÍTICAS (evidences y logos)
-- Estado actual detectado: 0 buckets y 0 políticas en storage.objects.
-- Nota: El código usa upsert: true, lo cual requiere SELECT + INSERT + UPDATE.
-- Todas las rutas comienzan con {workshop_id}/... para aislar por tenant.
-- ----------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  (
    'evidences',
    'evidences',
    true,
    5242880, -- 5 MB
    ARRAY['image/webp', 'image/png', 'image/jpeg']
  ),
  (
    'logos',
    'logos',
    true,
    2097152, -- 2 MB
    ARRAY['image/webp', 'image/png', 'image/jpeg', 'image/svg+xml']
  )
ON CONFLICT (id) DO UPDATE
SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Limpiar políticas previas de storage si existieran
DROP POLICY IF EXISTS "Public read evidences and logos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated insert evidences by workshop" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated update evidences by workshop" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated delete evidences by workshop" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated insert logos by workshop admin" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated update logos by workshop admin" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated delete logos by workshop admin" ON storage.objects;

-- Lectura pública (necesaria para getPublicUrl en Live Tracker y Micrositio)
CREATE POLICY "Public read evidences and logos"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id IN ('evidences', 'logos'));

-- Bucket evidences: todos los roles activos del taller pueden subir/reemplazar en su carpeta {workshop_id}/
CREATE POLICY "Authenticated insert evidences by workshop"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'evidences'
    AND (storage.foldername(name))[1] = public.get_my_workshop_id()::text
    AND private.has_workshop_role(ARRAY['owner', 'manager', 'admin', 'receptionist', 'mechanic'])
  );

CREATE POLICY "Authenticated update evidences by workshop"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'evidences'
    AND (storage.foldername(name))[1] = public.get_my_workshop_id()::text
    AND private.has_workshop_role(ARRAY['owner', 'manager', 'admin', 'receptionist', 'mechanic'])
  )
  WITH CHECK (
    bucket_id = 'evidences'
    AND (storage.foldername(name))[1] = public.get_my_workshop_id()::text
    AND private.has_workshop_role(ARRAY['owner', 'manager', 'admin', 'receptionist', 'mechanic'])
  );

CREATE POLICY "Authenticated delete evidences by workshop"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'evidences'
    AND (storage.foldername(name))[1] = public.get_my_workshop_id()::text
    AND private.has_workshop_role(ARRAY['owner', 'manager', 'admin'])
  );

-- Bucket logos: solo administradores del taller (owner, manager, admin) pueden subir/reemplazar/borrar
CREATE POLICY "Authenticated insert logos by workshop admin"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'logos'
    AND (storage.foldername(name))[1] = public.get_my_workshop_id()::text
    AND private.has_workshop_role(ARRAY['owner', 'manager', 'admin'])
  );

CREATE POLICY "Authenticated update logos by workshop admin"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'logos'
    AND (storage.foldername(name))[1] = public.get_my_workshop_id()::text
    AND private.has_workshop_role(ARRAY['owner', 'manager', 'admin'])
  )
  WITH CHECK (
    bucket_id = 'logos'
    AND (storage.foldername(name))[1] = public.get_my_workshop_id()::text
    AND private.has_workshop_role(ARRAY['owner', 'manager', 'admin'])
  );

CREATE POLICY "Authenticated delete logos by workshop admin"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'logos'
    AND (storage.foldername(name))[1] = public.get_my_workshop_id()::text
    AND private.has_workshop_role(ARRAY['owner', 'manager', 'admin'])
  );
