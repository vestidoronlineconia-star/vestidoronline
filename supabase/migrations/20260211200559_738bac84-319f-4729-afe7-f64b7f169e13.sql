-- Remove the overly permissive public SELECT policy that exposes api_key, user_id, and usage metrics
DROP POLICY IF EXISTS "Public can view limited columns of active clients" ON public.embed_clients;