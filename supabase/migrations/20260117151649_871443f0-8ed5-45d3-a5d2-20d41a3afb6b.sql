-- Create access_requests table
CREATE TABLE public.access_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  email text NOT NULL,
  company_name text,
  website_url text,
  message text,
  status text NOT NULL DEFAULT 'pending',
  reviewed_by uuid,
  reviewed_at timestamptz,
  rejection_reason text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT access_requests_status_check CHECK (status IN ('pending', 'approved', 'rejected')),
  CONSTRAINT access_requests_user_id_unique UNIQUE (user_id)
);

-- Enable RLS
ALTER TABLE public.access_requests ENABLE ROW LEVEL SECURITY;

-- Users can view their own requests
CREATE POLICY "Users can view their own access requests"
ON public.access_requests
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own requests
CREATE POLICY "Users can create their own access requests"
ON public.access_requests
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Admins can view all requests
CREATE POLICY "Admins can view all access requests"
ON public.access_requests
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Admins can update all requests
CREATE POLICY "Admins can update access requests"
ON public.access_requests
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

-- Admins can delete requests
CREATE POLICY "Admins can delete access requests"
ON public.access_requests
FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

-- Add trigger for updated_at
CREATE TRIGGER update_access_requests_updated_at
BEFORE UPDATE ON public.access_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();