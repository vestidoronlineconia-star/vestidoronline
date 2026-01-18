-- ============================================
-- FASE 5: ELIMINAR TABLA TENANTS NO UTILIZADA
-- ============================================

-- Drop the unused tenants table
DROP TABLE IF EXISTS public.tenants CASCADE;