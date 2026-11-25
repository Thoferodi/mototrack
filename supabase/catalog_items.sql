-- ============================================================================
-- MotoTrack SaaS - Tabla de Catálogo de Repuestos y Mano de Obra (catalog_items)
-- Ejecutar en Supabase SQL Editor para habilitar persistencia CRUD en /dashboard/catalog
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.catalog_items (
  id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  workshop_id uuid NOT NULL REFERENCES public.workshops(id) ON DELETE CASCADE,
  name text NOT NULL,
  type public.item_type NOT NULL,
  default_price numeric NOT NULL DEFAULT 0 CHECK (default_price >= 0),
  sku text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_catalog_items_workshop_id
  ON public.catalog_items (workshop_id);

ALTER TABLE public.catalog_items ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.catalog_items FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.catalog_items TO authenticated;

DROP POLICY IF EXISTS "catalog_items_select_member" ON public.catalog_items;
DROP POLICY IF EXISTS "catalog_items_insert_staff" ON public.catalog_items;
DROP POLICY IF EXISTS "catalog_items_update_staff" ON public.catalog_items;
DROP POLICY IF EXISTS "catalog_items_delete_staff" ON public.catalog_items;

CREATE POLICY "catalog_items_select_member"
  ON public.catalog_items FOR SELECT
  TO authenticated
  USING (
    workshop_id = (SELECT public.get_my_workshop_id())
    AND (SELECT private.has_workshop_role(ARRAY['owner', 'manager', 'admin', 'receptionist', 'mechanic']))
  );

CREATE POLICY "catalog_items_insert_staff"
  ON public.catalog_items FOR INSERT
  TO authenticated
  WITH CHECK (
    workshop_id = (SELECT public.get_my_workshop_id())
    AND (SELECT private.has_workshop_role(ARRAY['owner', 'manager', 'admin', 'receptionist']))
  );

CREATE POLICY "catalog_items_update_staff"
  ON public.catalog_items FOR UPDATE
  TO authenticated
  USING (
    workshop_id = (SELECT public.get_my_workshop_id())
    AND (SELECT private.has_workshop_role(ARRAY['owner', 'manager', 'admin', 'receptionist']))
  )
  WITH CHECK (
    workshop_id = (SELECT public.get_my_workshop_id())
    AND (SELECT private.has_workshop_role(ARRAY['owner', 'manager', 'admin', 'receptionist']))
  );

CREATE POLICY "catalog_items_delete_staff"
  ON public.catalog_items FOR DELETE
  TO authenticated
  USING (
    workshop_id = (SELECT public.get_my_workshop_id())
    AND (SELECT private.has_workshop_role(ARRAY['owner', 'manager', 'admin', 'receptionist']))
  );
