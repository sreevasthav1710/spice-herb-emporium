DROP POLICY IF EXISTS "authenticated users can upload payment screenshots" ON storage.objects;
DROP POLICY IF EXISTS "owners can view payment screenshots" ON storage.objects;
DROP POLICY IF EXISTS "admins can view payment screenshots" ON storage.objects;

ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS screenshot_url text;

INSERT INTO storage.buckets (id, name, public)
SELECT 'public', 'public', true
WHERE NOT EXISTS (
  SELECT 1 FROM storage.buckets WHERE id = 'public'
);

CREATE POLICY "authenticated users can upload payment screenshots"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'public'
  AND (storage.foldername(name))[1] = 'payment'
  AND (storage.foldername(name))[2] = 'screenshots'
  AND auth.uid()::text = split_part(storage.filename(name), '_', 1)
);

CREATE POLICY "owners can view payment screenshots"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'public'
  AND (storage.foldername(name))[1] = 'payment'
  AND (storage.foldername(name))[2] = 'screenshots'
  AND auth.uid()::text = split_part(storage.filename(name), '_', 1)
);

CREATE POLICY "admins can view payment screenshots"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'public'
  AND (storage.foldername(name))[1] = 'payment'
  AND (storage.foldername(name))[2] = 'screenshots'
  AND public.is_admin()
);
