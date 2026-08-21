-- Migration 013: Storage Bucket for Product Images

-- 1. Creer le bucket public product-images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-images',
  'product-images',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

-- 2. Politiques RLS sur storage.objects

-- Lecture publique de toutes les images produits
DROP POLICY IF EXISTS "Public product images access" ON storage.objects;
CREATE POLICY "Public product images access"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'product-images');

-- Upload pour les utilisateurs authentifies
DROP POLICY IF EXISTS "Authenticated users can upload product images" ON storage.objects;
CREATE POLICY "Authenticated users can upload product images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'product-images');

-- Modification pour les utilisateurs authentifies
DROP POLICY IF EXISTS "Authenticated users can update product images" ON storage.objects;
CREATE POLICY "Authenticated users can update product images"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'product-images');

-- Suppression pour les utilisateurs authentifies
DROP POLICY IF EXISTS "Authenticated users can delete product images" ON storage.objects;
CREATE POLICY "Authenticated users can delete product images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'product-images');
