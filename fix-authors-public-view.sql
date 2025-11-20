-- Fix for authors_public view security issue
-- This removes SECURITY DEFINER and recreates the view with proper security

-- Drop the existing view
DROP VIEW IF EXISTS public.authors_public;

-- Recreate the view WITHOUT security definer
-- This view shows only public author information
CREATE VIEW public.authors_public AS
SELECT
  id,
  name,
  handle,
  bio,
  avatar_url,
  website_url,
  created_at,
  updated_at
FROM public.authors
WHERE status = 'approved'
  AND listing_status::boolean = true;

-- Grant appropriate permissions
GRANT SELECT ON public.authors_public TO anon, authenticated;

-- Add comment explaining the view
COMMENT ON VIEW public.authors_public IS 'Public view of approved authors with listing_status=true. Does not use SECURITY DEFINER to avoid security risks.';
