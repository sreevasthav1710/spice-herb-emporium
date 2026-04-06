DROP POLICY IF EXISTS "admins can upload product images" ON storage.objects;
DROP POLICY IF EXISTS "admins can view product images" ON storage.objects;

INSERT INTO storage.buckets (id, name, public)
SELECT 'public', 'public', true
WHERE NOT EXISTS (
  SELECT 1 FROM storage.buckets WHERE id = 'public'
);

CREATE POLICY "admins can upload product images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'public'
  AND (storage.foldername(name))[1] = 'products'
  AND public.is_admin()
);

CREATE POLICY "admins can view product images"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'public'
  AND (storage.foldername(name))[1] = 'products'
  AND public.is_admin()
);
