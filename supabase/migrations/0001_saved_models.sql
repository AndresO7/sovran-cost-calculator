-- Modelos guardados por usuario.
-- La configuración va como jsonb porque el conjunto de opciones del
-- configurador cambia con frecuencia y nunca se filtra por su contenido.

create extension if not exists pgcrypto;

create table public.saved_models (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users(id) on delete cascade,
  name           text not null default 'Untitled project',
  config         jsonb not null,
  schema_version smallint not null default 1,
  price_low      integer,
  price_high     integer,
  thumbnail_path text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  constraint saved_models_name_len check (char_length(name) between 1 and 80)
);

create index saved_models_user_created_idx
  on public.saved_models (user_id, created_at desc);

alter table public.saved_models enable row level security;

create policy "saved_models_select_own" on public.saved_models
  for select using (auth.uid() = user_id);
create policy "saved_models_insert_own" on public.saved_models
  for insert with check (auth.uid() = user_id);
create policy "saved_models_update_own" on public.saved_models
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "saved_models_delete_own" on public.saved_models
  for delete using (auth.uid() = user_id);

-- Bucket privado de miniaturas. La primera carpeta de la ruta es el id del
-- usuario, y eso es lo que aisla los archivos entre cuentas.
insert into storage.buckets (id, name, public)
values ('model-thumbnails', 'model-thumbnails', false)
on conflict (id) do nothing;

create policy "thumbnails_select_own" on storage.objects
  for select using (
    bucket_id = 'model-thumbnails'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
create policy "thumbnails_insert_own" on storage.objects
  for insert with check (
    bucket_id = 'model-thumbnails'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
create policy "thumbnails_delete_own" on storage.objects
  for delete using (
    bucket_id = 'model-thumbnails'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
