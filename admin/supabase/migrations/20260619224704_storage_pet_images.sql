-- =============================================================================
-- Storage bucket para imágenes de mascotas + policies
-- - Bucket público (cualquiera lee, no requiere auth para ver)
-- - Upload/update/delete solo para el dueño del archivo
-- - Convención de path: <user_id>/<uuid>.<ext>
--   Las policies validan que la primera carpeta del path matchee con auth.uid()
-- =============================================================================

insert into storage.buckets (id, name, public)
values ('pet_images', 'pet_images', true)
on conflict (id) do nothing;

-- Lectura pública: cualquiera puede ver una imagen por URL
create policy "pet_images: public read"
  on storage.objects for select
  using (bucket_id = 'pet_images');

-- Upload: solo authenticated, y debe ir a una carpeta con su user id
create policy "pet_images: own upload"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'pet_images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Update: solo dueño o admin
create policy "pet_images: own update"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'pet_images'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or public.is_admin()
    )
  );

-- Delete: solo dueño o admin
create policy "pet_images: own delete"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'pet_images'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or public.is_admin()
    )
  );
