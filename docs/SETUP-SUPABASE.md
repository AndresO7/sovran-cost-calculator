# Configurar Supabase

El calculador exige sesión iniciada y guarda los modelos de cada usuario, así que no
arranca sin estas credenciales. Son unos diez minutos, una sola vez.

## 1. Crear el proyecto

En Vercel → el proyecto → **Storage** → **Marketplace** → **Supabase** → *Create*.

La integración inyecta `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` en el
proyecto de Vercel y factura por ahí. Si prefieres crearlo suelto en supabase.com, funciona
igual; solo tendrás que añadir esas dos variables a mano en Vercel.

## 2. Crear las tablas

Panel de Supabase → **SQL Editor** → pegar el contenido de
`supabase/migrations/0001_saved_models.sql` y ejecutarlo.

Crea la tabla `saved_models`, su índice, las políticas RLS y el bucket privado
`model-thumbnails` con sus políticas.

## 3. Habilitar los métodos de acceso

**Authentication → Providers**

- **Email**: ya viene habilitado. Déjalo así.
- **Google**: hay que crear credenciales OAuth en
  [Google Cloud Console](https://console.cloud.google.com/apis/credentials) →
  *Create Credentials* → *OAuth client ID* → *Web application*. En *Authorized redirect URIs*
  pon la que Supabase muestra en su propia pantalla del proveedor
  (`https://<tu-proyecto>.supabase.co/auth/v1/callback`). Copia el *Client ID* y el
  *Client Secret* a Supabase.

## 4. Configurar las URLs de retorno

**Authentication → URL Configuration**

- *Site URL*: el dominio de producción.
- *Redirect URLs*: añadir estas dos entradas.
  - `http://localhost:3000/**`
  - `https://<tu-dominio>/**`

Sin esto, el retorno de Google y el enlace de confirmación por email acaban en error.

## 5. Desarrollo local

```bash
cp .env.local.example .env.local
```

Rellenar las dos variables desde **Project Settings → API** (la clave que hace falta es la
`anon` / publishable, nunca la `service_role`; el código no la usa en ninguna parte).

```bash
npm run dev
```

## Comprobar que el aislamiento funciona

Con dos cuentas registradas, en el SQL Editor:

```sql
select set_config('request.jwt.claims', '{"sub":"<UUID_USUARIO_A>"}', true);
insert into public.saved_models (user_id, name, config)
values ('<UUID_USUARIO_A>', 'Prueba A', '{}'::jsonb);

select set_config('request.jwt.claims', '{"sub":"<UUID_USUARIO_B>"}', true);
select count(*) from public.saved_models;  -- debe devolver 0
```

Si la última consulta devuelve algo distinto de `0`, RLS no está activo y los modelos de un
usuario serían visibles para otro. Revisar que la migración se ejecutó entera.

## Qué se guarda de cada usuario

Ni mallas ni archivos `.glb`: el modelo 3D es procedural y se redibuja a partir de su
configuración. Lo que persiste es un JSON de unos 300 bytes en la columna `config` —
ubicación, extensión y loft— más una miniatura WebP de unos 25 KB en Storage. El detalle
está en `docs/superpowers/specs/2026-08-22-auth-y-modelos-guardados-design.md`.
