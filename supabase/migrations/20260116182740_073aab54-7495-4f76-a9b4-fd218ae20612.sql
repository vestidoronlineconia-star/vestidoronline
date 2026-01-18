-- =============================================
-- PHASE 2 & 3: Complete Database Schema
-- =============================================

-- 1. Onboarding Progress Table
CREATE TABLE public.onboarding_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.embed_clients(id) ON DELETE CASCADE,
  completed_steps jsonb DEFAULT '[]'::jsonb,
  current_step text DEFAULT 'welcome',
  is_complete boolean DEFAULT false,
  last_step_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  UNIQUE(client_id)
);

ALTER TABLE public.onboarding_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their onboarding progress"
  ON public.onboarding_progress FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.embed_clients 
    WHERE embed_clients.id = onboarding_progress.client_id 
    AND embed_clients.user_id = auth.uid()
  ));

-- 2. Client Products Table
CREATE TABLE public.client_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.embed_clients(id) ON DELETE CASCADE,
  name text NOT NULL,
  sku text,
  image_url text NOT NULL,
  category text NOT NULL,
  sizes text[] DEFAULT '{}'::text[],
  price decimal(10,2),
  is_active boolean DEFAULT true,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_client_products_client ON public.client_products(client_id);
CREATE INDEX idx_client_products_category ON public.client_products(category);
CREATE INDEX idx_client_products_sku ON public.client_products(sku);

ALTER TABLE public.client_products ENABLE ROW LEVEL SECURITY;

-- Policy for client owners
CREATE POLICY "Users can manage their client products"
  ON public.client_products FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.embed_clients 
    WHERE embed_clients.id = client_products.client_id 
    AND embed_clients.user_id = auth.uid()
  ));

-- Public policy for widget to read active products
CREATE POLICY "Anyone can read active products of active clients"
  ON public.client_products FOR SELECT
  USING (is_active = true AND EXISTS (
    SELECT 1 FROM public.embed_clients 
    WHERE embed_clients.id = client_products.client_id 
    AND embed_clients.is_active = true
  ));

-- Trigger for updated_at
CREATE TRIGGER update_client_products_updated_at
  BEFORE UPDATE ON public.client_products
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 3. Client Webhooks Table
CREATE TABLE public.client_webhooks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.embed_clients(id) ON DELETE CASCADE,
  url text NOT NULL,
  events text[] NOT NULL DEFAULT '{}'::text[],
  secret text NOT NULL DEFAULT gen_random_uuid()::text,
  is_active boolean DEFAULT true,
  last_triggered_at timestamptz,
  last_status_code integer,
  failure_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_client_webhooks_client ON public.client_webhooks(client_id);

ALTER TABLE public.client_webhooks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their webhooks"
  ON public.client_webhooks FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.embed_clients 
    WHERE embed_clients.id = client_webhooks.client_id 
    AND embed_clients.user_id = auth.uid()
  ));

-- 4. Webhook Deliveries Log Table
CREATE TABLE public.webhook_deliveries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_id uuid NOT NULL REFERENCES public.client_webhooks(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  payload jsonb NOT NULL,
  status_code integer,
  response_body text,
  duration_ms integer,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_webhook_deliveries_webhook ON public.webhook_deliveries(webhook_id, created_at DESC);

ALTER TABLE public.webhook_deliveries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their webhook deliveries"
  ON public.webhook_deliveries FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.client_webhooks w
    JOIN public.embed_clients c ON c.id = w.client_id
    WHERE w.id = webhook_deliveries.webhook_id
    AND c.user_id = auth.uid()
  ));

-- 5. Team Role Enum
DO $$ BEGIN
  CREATE TYPE public.team_role AS ENUM ('owner', 'admin', 'editor', 'viewer');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 6. Client Team Members Table
CREATE TABLE public.client_team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.embed_clients(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  role public.team_role NOT NULL DEFAULT 'viewer',
  invited_by uuid REFERENCES auth.users(id),
  invited_at timestamptz DEFAULT now(),
  accepted_at timestamptz,
  UNIQUE(client_id, email)
);

CREATE INDEX idx_client_team_members_client ON public.client_team_members(client_id);
CREATE INDEX idx_client_team_members_user ON public.client_team_members(user_id);
CREATE INDEX idx_client_team_members_email ON public.client_team_members(email);

ALTER TABLE public.client_team_members ENABLE ROW LEVEL SECURITY;

-- Owners and admins can manage team
CREATE POLICY "Team managers can manage members"
  ON public.client_team_members FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.client_team_members tm
      WHERE tm.client_id = client_team_members.client_id
      AND tm.user_id = auth.uid()
      AND tm.role IN ('owner', 'admin')
    )
    OR
    EXISTS (
      SELECT 1 FROM public.embed_clients
      WHERE embed_clients.id = client_team_members.client_id
      AND embed_clients.user_id = auth.uid()
    )
  );

-- Users can view their own membership
CREATE POLICY "Users can view their memberships"
  ON public.client_team_members FOR SELECT
  USING (user_id = auth.uid());

-- 7. API Rate Limits Table
CREATE TABLE public.api_rate_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.embed_clients(id) ON DELETE CASCADE,
  endpoint text NOT NULL,
  request_count integer DEFAULT 0,
  window_start timestamptz DEFAULT now()
);

CREATE INDEX idx_api_rate_limits_client_endpoint ON public.api_rate_limits(client_id, endpoint, window_start);

ALTER TABLE public.api_rate_limits ENABLE ROW LEVEL SECURITY;

-- Only edge functions should access this table (using service role)
CREATE POLICY "Service role only for rate limits"
  ON public.api_rate_limits FOR ALL
  USING (false);

-- 8. Function to check team membership and role
CREATE OR REPLACE FUNCTION public.get_user_role_for_client(p_client_id uuid, p_user_id uuid)
RETURNS public.team_role AS $$
DECLARE
  v_role public.team_role;
BEGIN
  -- Check if user is the owner
  IF EXISTS (SELECT 1 FROM public.embed_clients WHERE id = p_client_id AND user_id = p_user_id) THEN
    RETURN 'owner'::public.team_role;
  END IF;
  
  -- Check team membership
  SELECT role INTO v_role
  FROM public.client_team_members
  WHERE client_id = p_client_id AND user_id = p_user_id AND accepted_at IS NOT NULL;
  
  RETURN v_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 9. Function to check if user has permission
CREATE OR REPLACE FUNCTION public.user_has_client_permission(p_client_id uuid, p_user_id uuid, p_required_role public.team_role)
RETURNS boolean AS $$
DECLARE
  v_user_role public.team_role;
  v_role_level integer;
  v_required_level integer;
BEGIN
  v_user_role := public.get_user_role_for_client(p_client_id, p_user_id);
  
  IF v_user_role IS NULL THEN
    RETURN false;
  END IF;
  
  -- Role hierarchy: owner > admin > editor > viewer
  v_role_level := CASE v_user_role
    WHEN 'owner' THEN 4
    WHEN 'admin' THEN 3
    WHEN 'editor' THEN 2
    WHEN 'viewer' THEN 1
    ELSE 0
  END;
  
  v_required_level := CASE p_required_role
    WHEN 'owner' THEN 4
    WHEN 'admin' THEN 3
    WHEN 'editor' THEN 2
    WHEN 'viewer' THEN 1
    ELSE 0
  END;
  
  RETURN v_role_level >= v_required_level;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;