# Autenticación y modelos guardados — Plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Que cada usuario entre con su cuenta, guarde las configuraciones 3D que crea y vuelva a abrirlas desde una galería propia.

**Architecture:** Login obligatorio delante de toda la aplicación mediante `proxy.ts`. El modelo 3D no se serializa como geometría: se guarda el `CalculatorState` como `jsonb` y la escena procedural se redibuja al restaurarlo. Server Components para leer, Server Actions para mutar, y Row Level Security en Postgres como última línea de aislamiento.

**Tech Stack:** Next.js 16 (App Router), React 19, Supabase (Postgres + Auth + Storage) vía `@supabase/ssr`, zod para validación, vitest para tests unitarios.

**Spec:** `docs/superpowers/specs/2026-08-22-auth-y-modelos-guardados-design.md`

## Global Constraints

- **Next 16 renombró `middleware.ts` a `proxy.ts`.** El archivo va en la raíz y exporta una función llamada `proxy`. La documentación de `@supabase/ssr` todavía dice `middleware`; no copiarla literalmente.
- **`cookies()` de `next/headers` es asíncrona.** Siempre `const cookieStore = await cookies()`.
- **`params` y `searchParams` de una página son `Promise`.** Siempre `await`.
- **No se usa `SUPABASE_SERVICE_ROLE_KEY` en ninguna parte.** Todo acceso va con la sesión del usuario y sus políticas RLS.
- **Variables de entorno:** `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- **La miniatura nunca bloquea el guardado**, ni al capturar ni al subir.
- **Idioma de la interfaz: inglés** (`en-GB`), como todo el producto. Los comentarios de código y los documentos van en español, como el resto del repositorio.
- **Estilos:** el proyecto no usa clases de Tailwind en los componentes del calculador, usa objetos `style` en línea y los tokens de `ui/controls.tsx` (`ACCENT`, `FG`, `LINE`, `MUTED`, `microLabel`). Seguir ese patrón.
- **Tests:** vitest, archivos en `app/calculator/__tests__/`, ejecutados con `npx vitest run <ruta>`.

## Mapa de archivos

| Archivo | Responsabilidad |
|---|---|
| `supabase/migrations/0001_saved_models.sql` | tabla, índice, RLS y bucket |
| `app/calculator/persistence.ts` | serializar, validar y migrar la configuración (puro) |
| `app/calculator/__tests__/persistence.test.ts` | tests del anterior |
| `lib/supabase/client.ts` | cliente de navegador |
| `lib/supabase/server.ts` | cliente de servidor con cookies |
| `lib/supabase/proxy.ts` | `updateSession` — refresco y redirección |
| `proxy.ts` | punto de entrada del muro de login |
| `app/login/page.tsx` | pantalla de acceso |
| `app/login/LoginForm.tsx` | formulario cliente |
| `app/login/actions.ts` | Server Actions de acceso y alta |
| `app/auth/callback/route.ts` | intercambio del código OAuth |
| `app/auth/confirm/route.ts` | confirmación de email |
| `app/auth/signout/route.ts` | cierre de sesión |
| `app/calculator/thumbnail.ts` | captura y reescalado del canvas (puro salvo el canvas) |
| `app/calculator/actions.ts` | Server Action `saveModel` |
| `app/calculator/ui/SaveButton.tsx` | botón de guardar y su diálogo de nombre |
| `app/models/page.tsx` | galería |
| `app/models/ModelCard.tsx` | tarjeta con renombrar y borrar |
| `app/models/actions.ts` | Server Actions `renameModel` y `deleteModel` |

Modificados: `app/page.tsx`, `app/calculator/Calculator.tsx`, `app/calculator/Scene.tsx`, `app/calculator/ui/TopBar.tsx`, `package.json`, `.env.local.example`.

---

### Task 1: Módulo de persistencia (puro, sin Supabase)

Es la pieza más delicada y la única que se puede probar entera sin infraestructura, así que va primero. Convierte `CalculatorState` en el JSON que se guarda y lo reconstruye tolerando esquemas antiguos.

**Files:**
- Create: `app/calculator/persistence.ts`
- Test: `app/calculator/__tests__/persistence.test.ts`
- Modify: `package.json` (añadir `zod`)

**Interfaces:**
- Consumes: `CalculatorState`, `initialState` de `app/calculator/state.ts`; los tipos de unión de `config.ts` (`TierId`, `MaterialId`, `ExtRoofId`, `GlazingId`, `FrameId`, `LoftTypeId`, `LoftLayoutId`); `ZoneId`, `LookupStatus` de `zones.ts`.
- Produces:
  - `SAVED_SCHEMA_VERSION: 1`
  - `type SavedConfig` — el JSON validado
  - `toSavedConfig(state: CalculatorState): SavedConfig`
  - `fromSavedConfig(config: SavedConfig): CalculatorState`
  - `parseSavedConfig(raw: unknown, version: number): SavedConfig | null`

- [ ] **Step 1: Instalar zod**

```bash
npm install zod
```

- [ ] **Step 2: Escribir el test que falla**

Crear `app/calculator/__tests__/persistence.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { CalculatorState, initialState } from "../state";
import {
  fromSavedConfig,
  parseSavedConfig,
  SAVED_SCHEMA_VERSION,
  toSavedConfig,
} from "../persistence";

/** Una configuración completa y distinta de la inicial en todos sus campos. */
const configured: CalculatorState = {
  ...initialState,
  started: true,
  location: { postcode: "SW19 1AA", zone: "zone1", borough: "Merton", status: "ok" },
  ground: {
    enabled: true,
    tier: "highEnd",
    depth: 4.5,
    area: 29.7,
    material: "charredTimber",
    roof: "lantern",
    glazing: "sliding",
    frame: "bronze",
  },
  loft: { type: "mansardDormer", depth: 8.2, layout: "c", frame: "white" },
  activeTab: "loft",
  quoteOpen: true,
};

describe("toSavedConfig", () => {
  it("conserva location, ground y loft", () => {
    const saved = toSavedConfig(configured);
    expect(saved.location).toEqual(configured.location);
    expect(saved.ground).toEqual(configured.ground);
    expect(saved.loft).toEqual(configured.loft);
  });

  it("descarta el estado de interfaz", () => {
    const saved = toSavedConfig(configured) as Record<string, unknown>;
    expect(saved.started).toBeUndefined();
    expect(saved.activeTab).toBeUndefined();
    expect(saved.quoteOpen).toBeUndefined();
  });
});

describe("ida y vuelta", () => {
  it("reconstruye el proyecto y lo abre ya iniciado", () => {
    const restored = fromSavedConfig(toSavedConfig(configured));
    expect(restored.location).toEqual(configured.location);
    expect(restored.ground).toEqual(configured.ground);
    expect(restored.loft).toEqual(configured.loft);
    expect(restored.started).toBe(true);
    expect(restored.quoteOpen).toBe(false);
  });
});

describe("parseSavedConfig", () => {
  it("acepta un JSON válido", () => {
    const parsed = parseSavedConfig(toSavedConfig(configured), SAVED_SCHEMA_VERSION);
    expect(parsed).not.toBeNull();
    expect(parsed!.ground.material).toBe("charredTimber");
  });

  it("rellena con los valores por defecto un campo que falta", () => {
    const saved = toSavedConfig(configured) as Record<string, any>;
    delete saved.loft.layout;
    const parsed = parseSavedConfig(saved, SAVED_SCHEMA_VERSION);
    expect(parsed).not.toBeNull();
    expect(parsed!.loft.layout).toBe(initialState.loft.layout);
  });

  it("recorta un valor fuera de rango en lugar de rechazar el modelo", () => {
    const saved = toSavedConfig(configured) as Record<string, any>;
    saved.ground.depth = 99;
    const parsed = parseSavedConfig(saved, SAVED_SCHEMA_VERSION);
    expect(parsed!.ground.depth).toBe(5);
  });

  it("descarta un valor de unión desconocido y usa el por defecto", () => {
    const saved = toSavedConfig(configured) as Record<string, any>;
    saved.ground.material = "unobtanium";
    const parsed = parseSavedConfig(saved, SAVED_SCHEMA_VERSION);
    expect(parsed!.ground.material).toBe(initialState.ground.material);
  });

  it("devuelve null ante basura, sin lanzar", () => {
    expect(parseSavedConfig(null, 1)).toBeNull();
    expect(parseSavedConfig("nope", 1)).toBeNull();
    expect(parseSavedConfig(42, 1)).toBeNull();
  });

  it("devuelve null ante un esquema del futuro", () => {
    expect(parseSavedConfig(toSavedConfig(configured), 99)).toBeNull();
  });
});
```

- [ ] **Step 3: Ejecutar el test y comprobar que falla**

Run: `npx vitest run app/calculator/__tests__/persistence.test.ts`
Expected: FAIL — `Failed to resolve import "../persistence"`.

- [ ] **Step 4: Implementar `persistence.ts`**

Crear `app/calculator/persistence.ts`:

```ts
import { z } from "zod";
import { EXT_AREA, EXT_DEPTH, LOFT_DEPTH } from "./config";
import { CalculatorState, initialState } from "./state";

/**
 * Versión del formato guardado. Súbela cuando cambie la forma de SavedConfig
 * y añade el paso correspondiente en migrate().
 */
export const SAVED_SCHEMA_VERSION = 1;

/**
 * Tope de modelos por cuenta. Vive aquí y no en actions.ts porque un módulo
 * "use server" solo puede exportar funciones asíncronas: exportar una
 * constante desde allí anula todos los exports del módulo.
 */
export const MAX_MODELS_PER_USER = 50;

/**
 * Una unión de literales que, ante un valor desconocido, cae en el por defecto
 * en lugar de invalidar el modelo entero: un proyecto guardado con una opción
 * que después se retiró debe seguir abriéndose.
 */
const fallbackEnum = <T extends readonly [string, ...string[]]>(
  values: T,
  fallback: T[number]
) => z.enum(values).catch(fallback);

/**
 * Un número acotado. Lo que no es número cae en el por defecto, pero un número
 * fuera de rango se recorta al extremo más cercano en lugar de descartarse:
 * quien guardó la extensión más profunda posible debe recuperar el máximo, no
 * el valor de fábrica.
 */
const num = (min: number, max: number, fallback: number) =>
  z
    .number()
    .catch(fallback)
    .transform((v) => Math.min(max, Math.max(min, v)));

const locationSchema = z
  .object({
    postcode: z.string().max(16).catch(""),
    zone: fallbackEnum(["zone1", "zone2"], initialState.location.zone),
    borough: z.string().max(80).nullable().catch(null),
    status: fallbackEnum(
      ["idle", "loading", "ok", "notfound", "error"],
      initialState.location.status
    ),
  })
  .catch(initialState.location);

const groundSchema = z
  .object({
    enabled: z.boolean().catch(initialState.ground.enabled),
    tier: fallbackEnum(["standard", "highEnd"], initialState.ground.tier),
    depth: num(EXT_DEPTH.min, EXT_DEPTH.max, initialState.ground.depth),
    area: num(EXT_AREA.min, EXT_AREA.max, initialState.ground.area),
    material: fallbackEnum(
      ["render", "londonStock", "redBrick", "charredTimber", "zinc"],
      initialState.ground.material
    ),
    roof: fallbackEnum(
      ["flat", "rooflights", "lantern", "pitched"],
      initialState.ground.roof
    ),
    glazing: fallbackEnum(["double", "bifold", "sliding"], initialState.ground.glazing),
    frame: fallbackEnum(
      ["black", "white", "anthracite", "bronze"],
      initialState.ground.frame
    ),
  })
  .catch(initialState.ground);

const loftSchema = z
  .object({
    type: fallbackEnum(
      ["none", "boxDormer", "mansardDormer"],
      initialState.loft.type
    ),
    depth: num(LOFT_DEPTH.min, LOFT_DEPTH.max, initialState.loft.depth),
    layout: fallbackEnum(["a", "b", "c", "d"], initialState.loft.layout),
    frame: fallbackEnum(
      ["black", "white", "anthracite", "bronze"],
      initialState.loft.frame
    ),
  })
  .catch(initialState.loft);

const savedConfigSchema = z.object({
  location: locationSchema,
  ground: groundSchema,
  loft: loftSchema,
});

export type SavedConfig = z.infer<typeof savedConfigSchema>;

/** El proyecto, sin el estado de interfaz que no tiene sentido persistir. */
export function toSavedConfig(state: CalculatorState): SavedConfig {
  return {
    location: { ...state.location },
    ground: { ...state.ground },
    loft: { ...state.loft },
  };
}

/**
 * Reconstruye el estado completo sobre initialState, de modo que un campo
 * añadido después de guardar el modelo arranca con su valor por defecto.
 */
export function fromSavedConfig(config: SavedConfig): CalculatorState {
  return {
    ...initialState,
    started: true,
    location: { ...initialState.location, ...config.location },
    ground: { ...initialState.ground, ...config.ground },
    loft: { ...initialState.loft, ...config.loft },
    activeTab: config.ground.enabled ? "ground" : "loft",
    quoteOpen: false,
  };
}

/** Punto de extensión para futuras versiones del formato. */
function migrate(raw: unknown, version: number): unknown | null {
  if (version === SAVED_SCHEMA_VERSION) return raw;
  return null; // versión desconocida o del futuro
}

/**
 * Valida lo que viene de la base de datos. Devuelve null en lugar de lanzar:
 * un modelo ilegible debe degradar una tarjeta, no romper la galería.
 */
export function parseSavedConfig(raw: unknown, version: number): SavedConfig | null {
  const migrated = migrate(raw, version);
  if (migrated === null || typeof migrated !== "object") return null;
  const result = savedConfigSchema.safeParse(migrated);
  return result.success ? result.data : null;
}
```

- [ ] **Step 5: Ejecutar los tests y comprobar que pasan**

Run: `npx vitest run app/calculator/__tests__/persistence.test.ts`
Expected: PASS, 9 tests.

Si `z.enum([...]).catch()` no existiera en la versión instalada de zod, comprobar la versión con `npm ls zod`: `.catch()` está disponible desde zod 3.20. No sustituir por `.optional().default()`, que no recupera de un valor presente pero inválido.

- [ ] **Step 6: Comprobar que no se rompió nada**

Run: `npm test`
Expected: PASS, incluidos `pricing.test.ts` y `zones.test.ts`.

- [ ] **Step 7: Commit**

```bash
git add package.json package-lock.json app/calculator/persistence.ts app/calculator/__tests__/persistence.test.ts
git commit -m "feat: serializacion tolerante a versiones del estado del calculador"
```

---

### Task 2: Esquema de base de datos y bucket

**Files:**
- Create: `supabase/migrations/0001_saved_models.sql`
- Create: `.env.local.example`
- Modify: `.gitignore` (asegurar que `.env*.local` está ignorado)

**Interfaces:**
- Produces: tabla `public.saved_models` y bucket `model-thumbnails`, ambos con RLS por `auth.uid()`.

- [ ] **Step 1: Escribir la migración**

Crear `supabase/migrations/0001_saved_models.sql`:

```sql
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
```

- [ ] **Step 2: Crear el proyecto de Supabase y aplicar la migración**

Esto lo hace una persona, no un agente:

1. En Vercel → el proyecto → *Storage* → *Marketplace* → Supabase → *Create*. La integración inyecta `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` en el proyecto de Vercel.
2. En el panel de Supabase → *SQL Editor* → pegar el contenido de la migración y ejecutarlo.
3. *Authentication* → *Providers* → habilitar **Google** (requiere Client ID y Secret de Google Cloud Console) y dejar **Email** habilitado.
4. *Authentication* → *URL Configuration* → *Site URL* con el dominio de producción, y en *Redirect URLs* añadir `http://localhost:3000/auth/callback` y `https://<dominio>/auth/callback`.
5. Copiar las dos variables a `.env.local` para el desarrollo local.

- [ ] **Step 3: Documentar las variables**

Crear `.env.local.example`:

```bash
# Supabase — Vercel las inyecta en producción con la integración del Marketplace.
# Para desarrollo local, cópialas del panel de Supabase → Project Settings → API.
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
```

- [ ] **Step 4: Verificar que RLS aísla de verdad**

En el SQL Editor de Supabase, con dos usuarios ya registrados:

```sql
-- Sustituir por ids reales de auth.users
select set_config('request.jwt.claims', '{"sub":"<UUID_USUARIO_A>"}', true);
insert into public.saved_models (user_id, name, config)
values ('<UUID_USUARIO_A>', 'Prueba A', '{}'::jsonb);

select set_config('request.jwt.claims', '{"sub":"<UUID_USUARIO_B>"}', true);
select count(*) from public.saved_models;  -- debe devolver 0
```

Expected: la segunda consulta devuelve `0`. Si devuelve `1`, RLS no está activo — revisar `alter table ... enable row level security`.

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/0001_saved_models.sql .env.local.example
git commit -m "feat: esquema de modelos guardados con RLS por usuario"
```

---

### Task 3: Clientes de Supabase y muro de login

**Files:**
- Create: `lib/supabase/client.ts`, `lib/supabase/server.ts`, `lib/supabase/proxy.ts`, `proxy.ts`
- Modify: `package.json`

**Interfaces:**
- Produces:
  - `createBrowserSupabase(): SupabaseClient` (`lib/supabase/client.ts`)
  - `createServerSupabase(): Promise<SupabaseClient>` (`lib/supabase/server.ts`)
  - `updateSession(request: NextRequest): Promise<NextResponse>` (`lib/supabase/proxy.ts`)

- [ ] **Step 1: Instalar las dependencias**

```bash
npm install @supabase/supabase-js @supabase/ssr
```

- [ ] **Step 2: Cliente de navegador**

Crear `lib/supabase/client.ts`:

```ts
import { createBrowserClient } from "@supabase/ssr";

export function createBrowserSupabase() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

- [ ] **Step 3: Cliente de servidor**

Crear `lib/supabase/server.ts`:

```ts
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/** En Next 16 cookies() es asíncrona, de ahí que la fábrica también lo sea. */
export async function createServerSupabase() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Un Server Component no puede escribir cookies. No es un fallo:
            // proxy.ts ya refrescó la sesión antes de llegar aquí.
          }
        },
      },
    }
  );
}
```

- [ ] **Step 4: Refresco de sesión y redirección**

Crear `lib/supabase/proxy.ts`:

```ts
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/** Rutas accesibles sin sesión. */
const PUBLIC_PATHS = ["/login", "/auth"];

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // getUser() revalida el token contra Supabase; getSession() solo lee la
  // cookie y se puede falsificar, así que no sirve para proteger rutas.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isPublic = PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );

  if (!user && !isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    // para devolverlo a donde iba una vez autenticado
    url.searchParams.set("next", pathname + request.nextUrl.search);
    return NextResponse.redirect(url);
  }

  if (user && pathname === "/login") {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return response;
}
```

- [ ] **Step 5: Punto de entrada `proxy.ts`**

Crear `proxy.ts` en la raíz del proyecto, al mismo nivel que `app/`:

```ts
import type { NextRequest } from "next/server";
import { updateSession } from "./lib/supabase/proxy";

// Next 16: el convenio se llama proxy, no middleware.
export async function proxy(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    // todo salvo estáticos e imágenes
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
```

- [ ] **Step 6: Comprobar el muro**

```bash
npm run dev
```

Abrir `http://localhost:3000` en una ventana privada.
Expected: redirección inmediata a `http://localhost:3000/login?next=%2F`. La página dará 404 todavía —`/login` se crea en la tarea siguiente—, pero la redirección demuestra que `proxy.ts` se está ejecutando. Si en vez de eso carga el calculador, el archivo no está en la raíz o la función no se llama `proxy`.

- [ ] **Step 7: Comprobar que compila y pasa el lint**

Run: `npm run build && npm run lint`
Expected: sin errores.

- [ ] **Step 8: Commit**

```bash
git add package.json package-lock.json lib/supabase proxy.ts
git commit -m "feat: clientes de supabase y muro de login en proxy.ts"
```

---

### Task 4: Pantalla de acceso y rutas de autenticación

**Files:**
- Create: `app/login/page.tsx`, `app/login/LoginForm.tsx`, `app/login/actions.ts`
- Create: `app/auth/callback/route.ts`, `app/auth/confirm/route.ts`, `app/auth/signout/route.ts`

**Interfaces:**
- Consumes: `createServerSupabase()` de `lib/supabase/server.ts`.
- Produces:
  - `type AuthResult = { error: string } | undefined`
  - `signInWithPassword(prev: AuthResult, formData: FormData): Promise<AuthResult>`
  - `signUpWithPassword(prev: AuthResult, formData: FormData): Promise<AuthResult>`
  - `signInWithGoogle(formData: FormData): Promise<never>`

- [ ] **Step 1: Server Actions de acceso**

Crear `app/login/actions.ts`:

```ts
"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createServerSupabase } from "@/lib/supabase/server";

export type AuthResult = { error: string } | undefined;

/** Evita el open redirect: solo se acepta una ruta interna. */
function safeNext(value: FormDataEntryValue | null): string {
  const next = typeof value === "string" ? value : "/";
  return next.startsWith("/") && !next.startsWith("//") ? next : "/";
}

export async function signInWithPassword(
  _prev: AuthResult,
  formData: FormData
): Promise<AuthResult> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return { error: "Enter your email and password." };

  const supabase = await createServerSupabase();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: "That email and password don't match an account." };

  revalidatePath("/", "layout");
  redirect(safeNext(formData.get("next")));
}

export async function signUpWithPassword(
  _prev: AuthResult,
  formData: FormData
): Promise<AuthResult> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const fullName = String(formData.get("fullName") ?? "").trim();

  if (!fullName) return { error: "Enter your name." };
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email))
    return { error: "Enter a valid email address." };
  if (password.length < 8)
    return { error: "Use at least 8 characters for your password." };

  const origin = (await headers()).get("origin") ?? "";
  const supabase = await createServerSupabase();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      // el nombre vive en user_metadata; no hay tabla de perfiles
      data: { full_name: fullName },
      emailRedirectTo: `${origin}/auth/confirm`,
    },
  });

  if (error) return { error: error.message };
  return { error: "Check your inbox to confirm your email address." };
}

export async function signInWithGoogle(formData: FormData) {
  const origin = (await headers()).get("origin") ?? "";
  const next = safeNext(formData.get("next"));
  const supabase = await createServerSupabase();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}`,
    },
  });

  if (error || !data.url) redirect("/login?error=google");
  redirect(data.url);
}
```

Nota sobre `signUpWithPassword`: devuelve el aviso de confirmación en el campo `error` para no añadir un segundo canal de estado. El formulario lo pinta en tono neutro cuando el texto empieza por `Check`.

- [ ] **Step 2: Formulario cliente**

Crear `app/login/LoginForm.tsx`:

```tsx
"use client";

import { useActionState, useState } from "react";
import {
  AuthResult,
  signInWithGoogle,
  signInWithPassword,
  signUpWithPassword,
} from "./actions";

const field: React.CSSProperties = {
  width: "100%",
  background: "transparent",
  border: "none",
  borderBottom: "1px solid rgba(26,25,22,0.15)",
  padding: "10px 2px",
  fontFamily: "var(--font-outfit)",
  fontWeight: 300,
  fontSize: 14,
  color: "#1a1916",
  outline: "none",
};

const primaryButton: React.CSSProperties = {
  width: "100%",
  marginTop: 28,
  padding: "13px 0",
  background: "#1a1916",
  color: "#f8f6f3",
  border: "none",
  cursor: "pointer",
  fontFamily: "var(--font-outfit)",
  fontSize: 11,
  letterSpacing: "0.22em",
  textTransform: "uppercase",
};

export function LoginForm({ next }: { next: string }) {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const action = mode === "signin" ? signInWithPassword : signUpWithPassword;
  const [result, formAction, pending] = useActionState<AuthResult, FormData>(
    action,
    undefined
  );

  const isNotice = result?.error.startsWith("Check");

  return (
    <div style={{ width: "100%", maxWidth: 360 }}>
      <form action={signInWithGoogle}>
        <input type="hidden" name="next" value={next} />
        <button
          type="submit"
          style={{
            ...primaryButton,
            marginTop: 0,
            background: "transparent",
            color: "#1a1916",
            border: "1px solid rgba(26,25,22,0.2)",
          }}
        >
          Continue with Google
        </button>
      </form>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          margin: "26px 0 22px",
          color: "rgba(26,25,22,0.4)",
          fontSize: 10,
          letterSpacing: "0.2em",
          textTransform: "uppercase",
        }}
      >
        <span style={{ flex: 1, height: 1, background: "rgba(26,25,22,0.12)" }} />
        or
        <span style={{ flex: 1, height: 1, background: "rgba(26,25,22,0.12)" }} />
      </div>

      <form action={formAction}>
        <input type="hidden" name="next" value={next} />
        {mode === "signup" && (
          <input name="fullName" placeholder="Full name" style={field} autoComplete="name" />
        )}
        <input
          name="email"
          type="email"
          placeholder="Email"
          style={{ ...field, marginTop: mode === "signup" ? 18 : 0 }}
          autoComplete="email"
        />
        <input
          name="password"
          type="password"
          placeholder="Password"
          style={{ ...field, marginTop: 18 }}
          autoComplete={mode === "signin" ? "current-password" : "new-password"}
        />

        {result?.error && (
          <p
            style={{
              marginTop: 16,
              fontSize: 13,
              fontFamily: "var(--font-outfit)",
              color: isNotice ? "rgba(26,25,22,0.6)" : "#8a3a3a",
            }}
          >
            {result.error}
          </p>
        )}

        <button type="submit" disabled={pending} style={primaryButton}>
          {pending ? "One moment…" : mode === "signin" ? "Sign in" : "Create account"}
        </button>
      </form>

      <button
        type="button"
        onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
        style={{
          marginTop: 22,
          background: "none",
          border: "none",
          cursor: "pointer",
          fontFamily: "var(--font-outfit)",
          fontSize: 13,
          color: "rgba(26,25,22,0.55)",
          textDecoration: "underline",
          textUnderlineOffset: 4,
        }}
      >
        {mode === "signin"
          ? "No account yet? Create one"
          : "Already have an account? Sign in"}
      </button>
    </div>
  );
}
```

- [ ] **Step 3: Página de acceso**

Crear `app/login/page.tsx`:

```tsx
import { LoginForm } from "./LoginForm";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const { next, error } = await searchParams;

  return (
    <main
      style={{
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px 24px",
        background: "#f8f6f3",
      }}
    >
      <h1
        style={{
          fontFamily: "var(--font-bodoni)",
          fontSize: "clamp(30px, 5vw, 44px)",
          fontWeight: 400,
          letterSpacing: "0.01em",
          color: "#1a1916",
          marginBottom: 10,
        }}
      >
        SOVRAN
      </h1>
      <p
        style={{
          fontFamily: "var(--font-outfit)",
          fontWeight: 300,
          fontSize: 14,
          color: "rgba(26,25,22,0.55)",
          marginBottom: 42,
          textAlign: "center",
          maxWidth: 340,
        }}
      >
        Sign in to design your extension and keep every version you create.
      </p>

      {error === "google" && (
        <p style={{ color: "#8a3a3a", fontSize: 13, marginBottom: 18 }}>
          Google sign-in didn&apos;t complete. Please try again.
        </p>
      )}

      <LoginForm next={next ?? "/"} />
    </main>
  );
}
```

- [ ] **Step 4: Rutas de autenticación**

Crear `app/auth/callback/route.ts`:

```ts
import { NextResponse, type NextRequest } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const nextParam = searchParams.get("next") ?? "/";
  const next = nextParam.startsWith("/") && !nextParam.startsWith("//") ? nextParam : "/";

  if (code) {
    const supabase = await createServerSupabase();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${origin}${next}`);
  }

  return NextResponse.redirect(`${origin}/login?error=google`);
}
```

Crear `app/auth/confirm/route.ts`:

```ts
import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createServerSupabase } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;

  if (tokenHash && type) {
    const supabase = await createServerSupabase();
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (!error) return NextResponse.redirect(`${origin}/`);
  }

  return NextResponse.redirect(`${origin}/login?error=confirm`);
}
```

Crear `app/auth/signout/route.ts`:

```ts
import { NextResponse, type NextRequest } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabase();
  await supabase.auth.signOut();
  return NextResponse.redirect(new URL("/login", request.nextUrl.origin), {
    status: 303,
  });
}
```

- [ ] **Step 5: Comprobar el alias `@/`**

Run: `grep -n '"@/\*"' tsconfig.json`
Expected: una línea con `"@/*": ["./*"]`. Si no aparece, añadir a `compilerOptions`:

```json
"baseUrl": ".",
"paths": { "@/*": ["./*"] }
```

- [ ] **Step 6: Probar los tres flujos a mano**

```bash
npm run dev
```

1. `http://localhost:3000` → redirige a `/login?next=%2F`.
2. Crear cuenta con email → aparece "Check your inbox…", llega el correo, el enlace lleva a `/auth/confirm` y de ahí al calculador.
3. Cerrar sesión con `curl -X POST http://localhost:3000/auth/signout -i` y comprobar el `303` a `/login`.
4. "Continue with Google" → vuelve autenticado al calculador.

Expected: los cuatro pasos completan sin error de consola.

- [ ] **Step 7: Commit**

```bash
git add app/login app/auth
git commit -m "feat: pantalla de acceso con google y email/contrasena"
```

---

### Task 5: Captura de la miniatura desde el canvas

**Files:**
- Create: `app/calculator/thumbnail.ts`
- Modify: `app/calculator/Scene.tsx` (añadir el puente de captura)
- Modify: `app/calculator/Calculator.tsx` (sostener la referencia)

**Interfaces:**
- Consumes: nada de tareas anteriores.
- Produces:
  - `type CaptureFn = () => string | null`
  - `type CaptureRef = { current: CaptureFn | null }`
  - `Scene` acepta la prop opcional `captureRef?: CaptureRef`
  - `dataUrlToThumbnailBlob(dataUrl: string, w?: number, h?: number): Promise<Blob | null>` (`thumbnail.ts`)

- [ ] **Step 1: Utilidad de reescalado**

Crear `app/calculator/thumbnail.ts`:

```ts
/** Ancho y alto de la miniatura que se guarda. */
export const THUMB_W = 640;
export const THUMB_H = 400;

export type CaptureFn = () => string | null;
export type CaptureRef = { current: CaptureFn | null };

/**
 * Reescala la captura del canvas a un WebP pequeño. Devuelve null ante
 * cualquier fallo: la miniatura es decoración y nunca debe impedir guardar.
 */
export async function dataUrlToThumbnailBlob(
  dataUrl: string,
  w = THUMB_W,
  h = THUMB_H
): Promise<Blob | null> {
  try {
    const image = new Image();
    image.src = dataUrl;
    await image.decode();

    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    // recorte centrado para llenar el encuadre sin deformar
    const scale = Math.max(w / image.width, h / image.height);
    const dw = image.width * scale;
    const dh = image.height * scale;
    ctx.drawImage(image, (w - dw) / 2, (h - dh) / 2, dw, dh);

    return await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/webp", 0.85)
    );
  } catch {
    return null;
  }
}
```

- [ ] **Step 2: Puente de captura dentro del Canvas**

En `app/calculator/Scene.tsx`, añadir al import de React el hook que falte y crear el componente. Insertar justo después del componente `GlassEnvironment` (línea 28):

```tsx
/**
 * Expone una función de captura al exterior del Canvas. Renderiza a demanda y
 * lee el buffer en el mismo tick: así no hace falta preserveDrawingBuffer, que
 * obligaría a conservar el framebuffer en cada fotograma de la escena.
 */
function CaptureBridge({ captureRef }: { captureRef: CaptureRef }) {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  const camera = useThree((s) => s.camera);

  useEffect(() => {
    captureRef.current = () => {
      try {
        gl.render(scene, camera);
        return gl.domElement.toDataURL("image/webp", 0.9);
      } catch {
        return null;
      }
    };
    return () => {
      captureRef.current = null;
    };
  }, [captureRef, gl, scene, camera]);

  return null;
}
```

Añadir el import al principio del archivo:

```tsx
import { CaptureRef } from "./thumbnail";
```

Cambiar la firma de `Scene` (línea 34) por:

```tsx
export default function Scene({
  state,
  captureRef,
}: {
  state: CalculatorState;
  captureRef?: CaptureRef;
}) {
```

Y montar el puente dentro del `<Canvas>`, junto a `<GlassEnvironment />`:

```tsx
      <GlassEnvironment />
      {captureRef && <CaptureBridge captureRef={captureRef} />}
```

- [ ] **Step 3: Sostener la referencia en Calculator**

En `app/calculator/Calculator.tsx`, dentro del componente `Calculator`, después de `const rootRef = useRef<HTMLDivElement>(null);`:

```tsx
  // la rellena CaptureBridge una vez montado el canvas
  const captureRef = useRef<CaptureFn | null>(null);
```

Añadir al import de `./thumbnail`:

```tsx
import { CaptureFn } from "./thumbnail";
```

Y pasarla a la escena:

```tsx
                <Scene state={state} captureRef={captureRef} />
```

- [ ] **Step 4: Comprobar la captura en el navegador**

```bash
npm run dev
```

Con el calculador abierto, en la consola del navegador no debe haber errores de WebGL. Para verificar la captura antes de que exista el botón, pegar en la consola:

```js
document.querySelector("canvas").toDataURL("image/webp", 0.9).length
```

Expected: un número mayor que 10000. Un valor de ~2000 o un data URL de `data:,` significa que el buffer está vacío; en ese caso la captura debe hacerse siempre a través de `CaptureBridge`, que renderiza antes de leer.

- [ ] **Step 5: Comprobar que compila**

Run: `npm run build && npm test`
Expected: sin errores.

- [ ] **Step 6: Commit**

```bash
git add app/calculator/thumbnail.ts app/calculator/Scene.tsx app/calculator/Calculator.tsx
git commit -m "feat: captura webp del canvas a demanda"
```

---

### Task 6: Guardar un modelo

**Files:**
- Create: `app/calculator/actions.ts`, `app/calculator/ui/SaveButton.tsx`
- Modify: `app/calculator/ui/TopBar.tsx` (montar el botón y el menú de cuenta)
- Modify: `app/calculator/Calculator.tsx` (pasar `state`, `price` y `captureRef` a TopBar)

**Interfaces:**
- Consumes: `toSavedConfig`, `SAVED_SCHEMA_VERSION` (Task 1); `createServerSupabase` (Task 3); `CaptureFn`, `dataUrlToThumbnailBlob` (Task 5).
- Produces:
  - `type SaveResult = { ok: true; id: string } | { ok: false; error: string; code: "unauthenticated" | "limit" | "invalid" | "server" }`
  - `saveModel(formData: FormData): Promise<SaveResult>`
  - `<SaveButton state price captureRef />`

**Cuidado:** un módulo `"use server"` solo puede exportar funciones asíncronas. Exportar una constante desde `actions.ts` hace que el módulo se quede sin exports y el build falle con `Export saveModel doesn't exist in target module`. `tsc --noEmit` no lo detecta; solo `npm run build`. Por eso `MAX_MODELS_PER_USER` vive en `persistence.ts`. Los `export type` sí son válidos, porque se borran al compilar.

- [ ] **Step 1: Server Action de guardado**

Crear `app/calculator/actions.ts`:

```ts
"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabase } from "@/lib/supabase/server";
import {
  MAX_MODELS_PER_USER,
  parseSavedConfig,
  SAVED_SCHEMA_VERSION,
} from "./persistence";

export type SaveResult =
  | { ok: true; id: string }
  | {
      ok: false;
      error: string;
      code: "unauthenticated" | "limit" | "invalid" | "server";
    };

export async function saveModel(formData: FormData): Promise<SaveResult> {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, code: "unauthenticated", error: "Your session expired." };
  }

  const name = String(formData.get("name") ?? "").trim().slice(0, 80) || "Untitled project";

  let config;
  try {
    config = parseSavedConfig(JSON.parse(String(formData.get("config") ?? "")), SAVED_SCHEMA_VERSION);
  } catch {
    config = null;
  }
  if (!config) {
    return { ok: false, code: "invalid", error: "This configuration can't be saved." };
  }

  const { count } = await supabase
    .from("saved_models")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id);

  if ((count ?? 0) >= MAX_MODELS_PER_USER) {
    return {
      ok: false,
      code: "limit",
      error: `You've reached ${MAX_MODELS_PER_USER} saved models. Delete one to save another.`,
    };
  }

  const toInt = (v: FormDataEntryValue | null) => {
    const n = Number(v);
    return Number.isFinite(n) ? Math.round(n) : null;
  };

  const { data: row, error } = await supabase
    .from("saved_models")
    .insert({
      user_id: user.id,
      name,
      config,
      schema_version: SAVED_SCHEMA_VERSION,
      price_low: toInt(formData.get("priceLow")),
      price_high: toInt(formData.get("priceHigh")),
    })
    .select("id")
    .single();

  if (error || !row) {
    return { ok: false, code: "server", error: "Couldn't save your model. Try again." };
  }

  // La miniatura es el último paso y nunca invalida el guardado: si falla,
  // la tarjeta se pinta con un marcador y la configuración sigue intacta.
  const thumbnail = formData.get("thumbnail");
  if (thumbnail instanceof File && thumbnail.size > 0) {
    const path = `${user.id}/${row.id}.webp`;
    const { error: uploadError } = await supabase.storage
      .from("model-thumbnails")
      .upload(path, thumbnail, { contentType: "image/webp", upsert: true });

    if (!uploadError) {
      await supabase.from("saved_models").update({ thumbnail_path: path }).eq("id", row.id);
    }
  }

  revalidatePath("/models");
  return { ok: true, id: row.id };
}
```

- [ ] **Step 2: Botón de guardar**

Crear `app/calculator/ui/SaveButton.tsx`:

```tsx
"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { saveModel } from "../actions";
import { toSavedConfig } from "../persistence";
import { PriceBreakdown } from "../pricing";
import { CalculatorState } from "../state";
import { CaptureFn, dataUrlToThumbnailBlob } from "../thumbnail";
import { ACCENT, FG, LINE } from "./controls";

type Status = { kind: "idle" } | { kind: "saved" } | { kind: "error"; message: string };

export function SaveButton({
  state,
  price,
  captureRef,
}: {
  state: CalculatorState;
  price: PriceBreakdown;
  captureRef: React.RefObject<CaptureFn | null>;
}) {
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const save = () => {
    const defaultName = new Date().toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

    const form = new FormData();
    form.set("name", `Project · ${defaultName}`);
    form.set("config", JSON.stringify(toSavedConfig(state)));
    form.set("priceLow", String(price.total.low));
    form.set("priceHigh", String(price.total.high));

    startTransition(async () => {
      const dataUrl = captureRef.current?.() ?? null;
      const blob = dataUrl ? await dataUrlToThumbnailBlob(dataUrl) : null;
      if (blob) form.set("thumbnail", blob, "thumbnail.webp");

      const result = await saveModel(form);

      if (result.ok) {
        setStatus({ kind: "saved" });
        setTimeout(() => setStatus({ kind: "idle" }), 2600);
        return;
      }

      if (result.code === "unauthenticated") {
        // no perder el trabajo: se retoma tras volver a entrar
        sessionStorage.setItem("sovran:pending-save", form.get("config") as string);
        router.push(`/login?next=${encodeURIComponent("/")}`);
        return;
      }

      setStatus({ kind: "error", message: result.error });
    });
  };

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <button
        onClick={save}
        disabled={pending}
        style={{
          background: "transparent",
          border: `1px solid ${LINE}`,
          padding: "8px 16px",
          cursor: pending ? "wait" : "pointer",
          fontFamily: "var(--font-outfit)",
          fontSize: 10.5,
          letterSpacing: "0.2em",
          textTransform: "uppercase",
          color: FG,
          whiteSpace: "nowrap",
        }}
      >
        {pending ? "Saving…" : "Save model"}
      </button>

      {status.kind === "saved" && (
        <span style={{ fontSize: 12, color: ACCENT, whiteSpace: "nowrap" }}>Saved</span>
      )}
      {status.kind === "error" && (
        <span style={{ fontSize: 12, color: "#8a3a3a", maxWidth: 220 }}>
          {status.message}
        </span>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Montar el botón y el menú de cuenta en TopBar**

En `app/calculator/ui/TopBar.tsx`, ampliar la firma (línea 28) a:

```tsx
export function TopBar({
  price,
  location,
  dispatch,
  state,
  captureRef,
}: {
  price: PriceBreakdown;
  location: LocationState;
  dispatch: React.Dispatch<CalculatorAction>;
  state: CalculatorState;
  captureRef: React.RefObject<CaptureFn | null>;
}) {
```

Añadir los imports:

```tsx
import Link from "next/link";
import { CalculatorState } from "../state";
import { CaptureFn } from "../thumbnail";
import { SaveButton } from "./SaveButton";
```

E insertar, justo antes del cierre del `<div className="calc-topbar">`, un bloque alineado a la derecha:

```tsx
      <div
        style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 16 }}
      >
        <SaveButton state={state} price={price} captureRef={captureRef} />
        <Link
          href="/models"
          style={{
            fontFamily: "var(--font-outfit)",
            fontSize: 10.5,
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            color: FG,
            textDecoration: "none",
            whiteSpace: "nowrap",
          }}
        >
          My models
        </Link>
        <form action="/auth/signout" method="post">
          <button
            type="submit"
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              fontFamily: "var(--font-outfit)",
              fontSize: 10.5,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color: MUTED,
              whiteSpace: "nowrap",
            }}
          >
            Sign out
          </button>
        </form>
      </div>
```

Si ya existe un elemento con `marginLeft: "auto"` en la barra (el bloque del precio), quitarle esa propiedad para que el nuevo grupo quede a la derecha del todo y el precio conserve su posición.

Comprobar que `MUTED` está en el import de `./controls` al principio de `TopBar.tsx`: ese import solo lista los tokens que el archivo usa hoy, no todos los que exporta el módulo.

- [ ] **Step 4: Pasar las props desde Calculator**

En `app/calculator/Calculator.tsx`, sustituir la línea del TopBar por:

```tsx
          <TopBar
            price={price}
            location={state.location}
            dispatch={dispatch}
            state={state}
            captureRef={captureRef}
          />
```

- [ ] **Step 5: Probar el guardado de punta a punta**

```bash
npm run dev
```

1. Entrar con una cuenta, configurar una extensión y pulsar "Save model".
2. Expected: el botón muestra "Saving…" y luego aparece "Saved".
3. En el panel de Supabase → *Table Editor* → `saved_models`: una fila con `config` poblado y `thumbnail_path` con la forma `<uuid>/<uuid>.webp`.
4. En *Storage* → `model-thumbnails`: la imagen, de unos 20–30 KB.

- [ ] **Step 6: Comprobar el límite**

En el SQL Editor, con el id de un usuario de prueba:

```sql
insert into public.saved_models (user_id, name, config)
select '<UUID_USUARIO>', 'Relleno ' || g, '{}'::jsonb
from generate_series(1, 50) g;
```

Volver a pulsar "Save model".
Expected: el mensaje "You've reached 50 saved models…". Después, limpiar con
`delete from public.saved_models where name like 'Relleno %';`

- [ ] **Step 7: Commit**

```bash
git add app/calculator/actions.ts app/calculator/ui/SaveButton.tsx app/calculator/ui/TopBar.tsx app/calculator/Calculator.tsx
git commit -m "feat: guardar la configuracion del modelo con su miniatura"
```

---

### Task 7: Galería "My models"

**Files:**
- Create: `app/models/page.tsx`, `app/models/ModelCard.tsx`, `app/models/actions.ts`

**Interfaces:**
- Consumes: `createServerSupabase` (Task 3); `parseSavedConfig` (Task 1).
- Produces:
  - `renameModel(id: string, name: string): Promise<void>`
  - `deleteModel(id: string): Promise<void>`
  - `interface ModelRow { id: string; name: string; price_low: number | null; price_high: number | null; created_at: string; thumbnailUrl: string | null; readable: boolean }`

- [ ] **Step 1: Server Actions de la galería**

Crear `app/models/actions.ts`:

```ts
"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabase } from "@/lib/supabase/server";

export async function renameModel(id: string, name: string) {
  const clean = name.trim().slice(0, 80);
  if (!clean) return;

  const supabase = await createServerSupabase();
  // RLS ya limita la fila al dueño; el filtro por id es suficiente
  await supabase
    .from("saved_models")
    .update({ name: clean, updated_at: new Date().toISOString() })
    .eq("id", id);

  revalidatePath("/models");
}

export async function deleteModel(id: string) {
  const supabase = await createServerSupabase();

  // leer la ruta antes de borrar la fila, para no dejar la imagen huérfana
  const { data: row } = await supabase
    .from("saved_models")
    .select("thumbnail_path")
    .eq("id", id)
    .single();

  await supabase.from("saved_models").delete().eq("id", id);

  if (row?.thumbnail_path) {
    await supabase.storage.from("model-thumbnails").remove([row.thumbnail_path]);
  }

  revalidatePath("/models");
}
```

- [ ] **Step 2: Tarjeta**

Crear `app/models/ModelCard.tsx`:

```tsx
"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { deleteModel, renameModel } from "./actions";

export interface ModelRow {
  id: string;
  name: string;
  price_low: number | null;
  price_high: number | null;
  created_at: string;
  thumbnailUrl: string | null;
  readable: boolean;
}

const LINE = "rgba(26,25,22,0.12)";

export function ModelCard({ model }: { model: ModelRow }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(model.name);
  const [pending, startTransition] = useTransition();

  const commitName = () => {
    setEditing(false);
    if (name.trim() && name !== model.name) {
      startTransition(() => renameModel(model.id, name));
    }
  };

  const price =
    model.price_low != null && model.price_high != null
      ? `£${model.price_low.toLocaleString("en-GB")} – £${model.price_high.toLocaleString("en-GB")}`
      : "—";

  return (
    <article
      style={{
        border: `1px solid ${LINE}`,
        background: "#fdfcfa",
        opacity: pending ? 0.5 : 1,
        transition: "opacity 0.2s ease",
      }}
    >
      <div style={{ position: "relative", aspectRatio: "16 / 10", background: "#efe9dd" }}>
        {model.thumbnailUrl ? (
          // next/image necesitaría configurar el dominio de Supabase; para una
          // URL firmada y efímera no compensa
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={model.thumbnailUrl}
            alt={model.name}
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          />
        ) : (
          <div
            style={{
              width: "100%",
              height: "100%",
              display: "grid",
              placeItems: "center",
              fontFamily: "var(--font-outfit)",
              fontSize: 11,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color: "rgba(26,25,22,0.35)",
            }}
          >
            No preview
          </div>
        )}
      </div>

      <div style={{ padding: "16px 18px 18px" }}>
        {editing ? (
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={commitName}
            onKeyDown={(e) => {
              if (e.key === "Enter") commitName();
              if (e.key === "Escape") {
                setName(model.name);
                setEditing(false);
              }
            }}
            style={{
              width: "100%",
              border: "none",
              borderBottom: `1px solid ${LINE}`,
              background: "transparent",
              fontFamily: "var(--font-bodoni)",
              fontSize: 17,
              padding: "2px 0",
              outline: "none",
            }}
          />
        ) : (
          <h2
            onClick={() => setEditing(true)}
            title="Click to rename"
            style={{
              fontFamily: "var(--font-bodoni)",
              fontSize: 17,
              fontWeight: 400,
              cursor: "text",
              margin: 0,
            }}
          >
            {model.name}
          </h2>
        )}

        <p
          style={{
            fontFamily: "var(--font-outfit)",
            fontWeight: 300,
            fontSize: 13,
            color: "rgba(26,25,22,0.55)",
            margin: "8px 0 0",
          }}
        >
          {price}
          <span style={{ margin: "0 8px" }}>·</span>
          {new Date(model.created_at).toLocaleDateString("en-GB", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })}
        </p>

        <div style={{ display: "flex", gap: 18, marginTop: 16 }}>
          {model.readable ? (
            <Link
              href={`/?model=${model.id}`}
              style={{
                fontFamily: "var(--font-outfit)",
                fontSize: 10.5,
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                color: "#1a1916",
              }}
            >
              Open
            </Link>
          ) : (
            <span style={{ fontSize: 10.5, color: "#8a3a3a", letterSpacing: "0.2em", textTransform: "uppercase" }}>
              Can&apos;t open
            </span>
          )}
          <button
            onClick={() => startTransition(() => deleteModel(model.id))}
            style={{
              background: "none",
              border: "none",
              padding: 0,
              cursor: "pointer",
              fontFamily: "var(--font-outfit)",
              fontSize: 10.5,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color: "rgba(26,25,22,0.45)",
            }}
          >
            Delete
          </button>
        </div>
      </div>
    </article>
  );
}
```

El botón de borrar no abre ningún `confirm()`: un diálogo modal del navegador bloquea la página. La acción es inmediata y la tarjeta se atenúa mientras se procesa.

- [ ] **Step 3: Página de la galería**

Crear `app/models/page.tsx`:

```tsx
import Link from "next/link";
import { createServerSupabase } from "@/lib/supabase/server";
import { parseSavedConfig } from "@/app/calculator/persistence";
import { ModelCard, ModelRow } from "./ModelCard";

export const dynamic = "force-dynamic";

export default async function ModelsPage() {
  const supabase = await createServerSupabase();

  const { data: rows } = await supabase
    .from("saved_models")
    .select("id, name, config, schema_version, price_low, price_high, thumbnail_path, created_at")
    .order("created_at", { ascending: false });

  const list = rows ?? [];

  // una sola llamada firma todas las miniaturas presentes
  const paths = list.map((r) => r.thumbnail_path).filter((p): p is string => !!p);
  const signed = paths.length
    ? (await supabase.storage.from("model-thumbnails").createSignedUrls(paths, 3600)).data ?? []
    : [];
  const urlByPath = new Map(signed.map((s) => [s.path, s.signedUrl]));

  const models: ModelRow[] = list.map((r) => ({
    id: r.id,
    name: r.name,
    price_low: r.price_low,
    price_high: r.price_high,
    created_at: r.created_at,
    thumbnailUrl: r.thumbnail_path ? urlByPath.get(r.thumbnail_path) ?? null : null,
    readable: parseSavedConfig(r.config, r.schema_version) !== null,
  }));

  return (
    <main style={{ minHeight: "100dvh", background: "#f8f6f3", padding: "40px clamp(20px, 5vw, 64px) 80px" }}>
      <header
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          gap: 20,
          paddingBottom: 24,
          borderBottom: "1px solid rgba(26,25,22,0.12)",
          marginBottom: 40,
        }}
      >
        <h1 style={{ fontFamily: "var(--font-bodoni)", fontSize: "clamp(26px, 4vw, 38px)", fontWeight: 400, margin: 0 }}>
          My models
        </h1>
        <Link
          href="/"
          style={{
            fontFamily: "var(--font-outfit)",
            fontSize: 10.5,
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            color: "#1a1916",
            whiteSpace: "nowrap",
          }}
        >
          New model
        </Link>
      </header>

      {models.length === 0 ? (
        <p style={{ fontFamily: "var(--font-outfit)", fontWeight: 300, color: "rgba(26,25,22,0.55)" }}>
          Nothing saved yet. Design an extension and press “Save model”.
        </p>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: 28,
          }}
        >
          {models.map((m) => (
            <ModelCard key={m.id} model={m} />
          ))}
        </div>
      )}
    </main>
  );
}
```

- [ ] **Step 4: Probar la galería**

```bash
npm run dev
```

1. Guardar dos modelos distintos desde el calculador.
2. Ir a `/models`: dos tarjetas con su miniatura, precio y fecha.
3. Hacer clic en el nombre, cambiarlo y pulsar Enter → el nombre persiste tras recargar.
4. Pulsar "Delete" en una → desaparece; comprobar en Supabase que la fila y el archivo de Storage ya no están.
5. Abrir `/models` con otra cuenta → cero tarjetas.

- [ ] **Step 5: Commit**

```bash
git add app/models
git commit -m "feat: galeria de modelos guardados con renombrar y borrar"
```

---

### Task 8: Abrir un modelo guardado

Cierra el círculo: `/?model=<uuid>` carga la configuración en el servidor y el calculador arranca ya con ella.

**Files:**
- Modify: `app/page.tsx`
- Modify: `app/calculator/Calculator.tsx` (aceptar un estado inicial)

**Interfaces:**
- Consumes: `parseSavedConfig`, `fromSavedConfig` (Task 1); `createServerSupabase` (Task 3).
- Produces: `Calculator` acepta la prop opcional `initial?: CalculatorState`.

- [ ] **Step 1: Calculator acepta un estado inicial**

En `app/calculator/Calculator.tsx`, cambiar la firma y el `useReducer`:

```tsx
export default function Calculator({ initial }: { initial?: CalculatorState }) {
  const [state, dispatch] = useReducer(reducer, initial ?? initialState);
```

El import de `initialState` desde `./state` se mantiene: es el valor por defecto cuando no llega ninguno.

- [ ] **Step 2: La página carga el modelo**

Sustituir el contenido de `app/page.tsx` por:

```tsx
import { createServerSupabase } from "@/lib/supabase/server";
import Calculator from "./calculator/Calculator";
import { fromSavedConfig, parseSavedConfig } from "./calculator/persistence";
import { CalculatorState } from "./calculator/state";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ model?: string }>;
}) {
  const { model } = await searchParams;
  let initial: CalculatorState | undefined;

  if (model) {
    const supabase = await createServerSupabase();
    // RLS limita la consulta a los modelos del usuario; un id ajeno no devuelve nada
    const { data } = await supabase
      .from("saved_models")
      .select("config, schema_version")
      .eq("id", model)
      .maybeSingle();

    const config = data ? parseSavedConfig(data.config, data.schema_version) : null;
    if (config) initial = fromSavedConfig(config);
  }

  return <Calculator initial={initial} />;
}
```

Un id inexistente, ajeno o ilegible no rompe nada: `initial` queda `undefined` y el calculador abre en su pantalla de inicio.

- [ ] **Step 3: Recuperar el trabajo tras una sesión caducada**

La Task 6 guarda la configuración en `sessionStorage` bajo `sovran:pending-save` antes de mandar al usuario a `/login`. Aquí se lee de vuelta; sin este paso aquello sería código muerto y el usuario perdería su diseño.

No se reintenta el guardado solo: se le devuelve el modelo a la pantalla y él decide. Guardar algo sin que lo pida, después de un redirect, es una sorpresa desagradable.

En `app/calculator/Calculator.tsx`, dentro del componente, junto a los demás efectos:

```tsx
  // Tras volver de /login por una sesión caducada, devolver a la pantalla el
  // modelo que el usuario estaba a punto de guardar.
  useEffect(() => {
    if (initial) return; // una URL con ?model= manda sobre lo pendiente
    const raw = sessionStorage.getItem("sovran:pending-save");
    if (!raw) return;
    sessionStorage.removeItem("sovran:pending-save");
    try {
      const config = parseSavedConfig(JSON.parse(raw), SAVED_SCHEMA_VERSION);
      if (config) dispatch({ type: "RESTORE", state: fromSavedConfig(config) });
    } catch {
      // una configuración pendiente ilegible se descarta en silencio
    }
  }, [initial]);
```

Añadir el import:

```tsx
import { fromSavedConfig, parseSavedConfig, SAVED_SCHEMA_VERSION } from "./persistence";
```

Esto necesita una acción nueva en el reducer. En `app/calculator/state.ts`, añadir a la unión `CalculatorAction`:

```ts
  | { type: "RESTORE"; state: CalculatorState }
```

Y el caso correspondiente en `reducer`, antes de `default`:

```ts
    case "RESTORE":
      return action.state;
```

- [ ] **Step 4: Probar la recuperación**

Con el calculador abierto y un modelo configurado, simular la caducidad en la consola del navegador borrando las cookies de sesión:

```js
document.cookie.split(";").forEach((c) => {
  const n = c.split("=")[0].trim();
  if (n.startsWith("sb-")) document.cookie = `${n}=; Max-Age=0; path=/`;
});
```

Pulsar "Save model".
Expected: redirección a `/login`; tras volver a entrar, el calculador aparece con el mismo modelo configurado —no en la pantalla de inicio— y `sessionStorage.getItem("sovran:pending-save")` devuelve `null`.

- [ ] **Step 5: Probar el ciclo completo**

```bash
npm run dev
```

1. Configurar una extensión distinta de la de por defecto (por ejemplo, tier `highEnd`, material `charredTimber`, loft `mansardDormer`) y guardarla.
2. Ir a `/models` y pulsar "Open".
3. Expected: el calculador abre directamente en el modelo —sin pasar por la pantalla de inicio— y el 3D y el precio coinciden con lo guardado.
4. Probar `/?model=00000000-0000-0000-0000-000000000000`.
   Expected: abre la pantalla de inicio normal, sin error.
5. Con la sesión de otra cuenta, abrir la URL de un modelo ajeno.
   Expected: pantalla de inicio normal — RLS no devuelve la fila.

- [ ] **Step 6: Comprobación final**

Run: `npm test && npm run lint && npm run build`
Expected: todo en verde.

- [ ] **Step 7: Commit**

```bash
git add app/page.tsx app/calculator/Calculator.tsx app/calculator/state.ts
git commit -m "feat: abrir un modelo guardado desde la galeria"
```

---

## Verificación final

Antes de dar el trabajo por terminado, ejecutar y pegar la salida real:

```bash
npm test
npm run lint
npm run build
```

Y recorrer a mano: registro con email → confirmación → configurar → guardar → galería → renombrar → abrir → cerrar sesión → entrar con Google → comprobar que la galería de Google está vacía (es otra cuenta).
