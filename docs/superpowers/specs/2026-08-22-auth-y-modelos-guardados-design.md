# Autenticación y modelos guardados por usuario

Fecha: 2026-08-22
Stack elegido: Supabase (Postgres + Auth + Storage) sobre Vercel Pro, vía integración del
Vercel Marketplace.

## Problema

El calculador es hoy una aplicación de una sola página sin estado persistente
(`app/page.tsx` → `<Calculator />`). Cada visita empieza de cero: el usuario configura una
extensión, ve un precio y, al cerrar la pestaña, lo pierde todo. No hay forma de volver a
un diseño anterior ni de comparar variantes, y el estudio no tiene registro de qué
configuró cada interesado.

## Decisiones tomadas

| Decisión | Elección | Motivo |
|---|---|---|
| Proveedor | Supabase | Único servicio que cubre Auth + Postgres + Storage; integración nativa en Vercel Pro |
| Momento del login | Obligatorio al entrar | Decisión de producto del cliente: todo visitante queda registrado |
| Métodos de acceso | Google OAuth + email/contraseña | Google para fricción mínima; contraseña como alternativa sin depender de terceros |
| Galería | Miniatura capturada del canvas | Es un configurador visual; sin imagen el usuario no reconoce sus proyectos |
| Acceso a datos | Server Components + Server Actions + RLS | El proyecto ya es App Router puro; RLS aísla aunque el código falle |

## Hallazgo central: el modelo 3D no es un archivo

Toda la geometría es procedural. `models/House.tsx`, `Extension.tsx` y `Loft.tsx` se
dibujan en tiempo real a partir de `CalculatorState` (`app/calculator/state.ts:23`), que son
unos veinte campos escalares. No hay mallas, ni `.glb`, ni assets: las texturas también se
generan en canvas (`models/materials.ts`).

Persistir un modelo es, por tanto, persistir un JSON de unos 300 bytes. Al restaurarlo se
hidrata el reducer con ese JSON y la escena se redibuja idéntica. El precio no se persiste
como fuente de verdad porque `calculatePrice()` es pura y se recalcula desde la
configuración.

## Esquema de base de datos

Una sola tabla nueva. Supabase ya gestiona `auth.users`, y el nombre y el avatar del usuario
llegan en `user_metadata`: de Google automáticamente, y del alta con contraseña porque el
formulario los envía en `options.data`. No hace falta una tabla `profiles` mientras no haya
que mostrar el nombre de *otro* usuario, y compartir modelos está fuera de alcance.

```sql
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
  updated_at     timestamptz not null default now()
);

create index saved_models_user_created_idx
  on public.saved_models (user_id, created_at desc);
```

`updated_at` lo escribe la Server Action de renombrado; no se añade un trigger porque en
esta versión guardar siempre crea una fila nueva y renombrar es la única mutación.

### Por qué `jsonb` y no una columna por opción

El conjunto de opciones cambia cada vez que evoluciona el configurador: el commit `b6d9267`
eliminó el sistema de patio entero. Con columnas, cada opción nueva o retirada sería una
migración; con `jsonb`, ninguna. No se pierde nada consultable porque nunca se filtrará por
"modelos con ventanas negras".

### Contenido de `config`

El `CalculatorState` menos lo efímero. Se guardan `location`, `ground` y `loft`. Se
descartan `started`, `activeTab` y `quoteOpen`, que son estado de interfaz, no del proyecto.

### Por qué `schema_version` y el snapshot de precio

`schema_version` permite migrar en lectura configuraciones antiguas cuando cambie la forma
del estado. `price_low` y `price_high` congelan lo que el usuario vio ese día: al actualizar
tarifas en `config.ts` (como hizo `355ccf8`) el precio recalculado difiere, y conviene poder
mostrar ambos en lugar de que la cifra mute en silencio.

### Miniaturas

Bucket privado `model-thumbnails`, ruta `{user_id}/{model_id}.webp`. Se guarda la ruta y no
la URL porque las URLs firmadas caducan; se firman en el servidor al renderizar la galería,
en una sola llamada por lote.

WebP con calidad 0.85 y 640×400 px pesa unos 25 KB, frente a los ~150 KB del mismo
fotograma en PNG. Con mil modelos guardados son 25 MB de bucket.

### Aislamiento (RLS)

RLS activo en la tabla y en el bucket. Política única para las cuatro operaciones:
`auth.uid() = user_id`. Nadie lee ni modifica los modelos de otro aunque una consulta olvide
su filtro.

## Rutas y flujo de pantallas

```
/                 protegida  · Server Component → <Calculator />
                             · ?model=<uuid> carga una configuración guardada
/login            pública    · Google + email/contraseña
/models           protegida  · galería "Mis modelos"
/auth/callback    Route Handler · intercambio del código OAuth por sesión
/auth/confirm     Route Handler · verificación del email en el alta con contraseña
/auth/signout     Route Handler · cierre de sesión
proxy.ts          refresco de cookies de sesión + redirección de no autenticados
```

`StartScreen` no cambia: el muro de login vive por delante, en `proxy.ts`, así que el
usuario ya llega autenticado a la pantalla de inicio actual.

### Nota de versión: `middleware.ts` ya no existe

Next 16 renombró el convenio a `proxy.ts` con exportación `proxy`
(`node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md`). La
documentación de `@supabase/ssr` todavía indica `middleware.ts`; copiarla tal cual deja el
refresco de sesión sin ejecutarse y las sesiones caducan de forma silenciosa.

## Componentes

| Archivo | Responsabilidad | Depende de |
|---|---|---|
| `lib/supabase/client.ts` | cliente de navegador | `@supabase/ssr` |
| `lib/supabase/server.ts` | cliente de servidor con cookies | `next/headers` |
| `lib/supabase/proxy.ts` | `updateSession(request)` | `@supabase/ssr` |
| `proxy.ts` | refresco + protección de rutas | `lib/supabase/proxy` |
| `app/calculator/persistence.ts` | serializar, validar y migrar la configuración | `state.ts`, zod |
| `app/calculator/actions.ts` | Server Action `saveModel` | persistence, supabase/server |
| `app/models/actions.ts` | Server Actions `renameModel`, `deleteModel` | supabase/server |
| `app/models/page.tsx` | galería | supabase/server |
| `app/login/*` | pantalla y acciones de acceso | supabase/server |
| `ui/SaveButton.tsx` | captura la miniatura y llama a `saveModel` | Scene, actions |

### `persistence.ts` es la pieza clave

Es puro y aislado, sin Supabase ni React:

- `toSavedConfig(state)` → descarta lo efímero.
- `fromSavedConfig(config)` → fusiona sobre `initialState` y marca `started: true`, de modo
  que un modelo guardado antes de añadir un campo nuevo sigue abriendo con el valor por
  defecto de ese campo.
- `migrate(raw, version)` → hoy identidad para v1; es el punto de extensión.
- Esquema zod que recorta valores fuera de rango en lugar de rechazar el modelo entero.

## Flujo de guardado

1. El usuario pulsa "Guardar" en `TopBar`.
2. `SaveButton` pide al canvas una captura: `gl.render(scene, camera)` seguido de
   `toDataURL` en el mismo tick, y reescalado a 640×400 en un canvas fuera de pantalla.
3. Una sola Server Action `saveModel({ name, config, price, thumbnail })` valida la sesión,
   inserta la fila y sube la imagen con el cliente de servidor —la sesión del propio
   usuario, sin clave de servicio— y hace `revalidatePath('/models')`.

Es una operación atómica: si la subida falla, no queda fila huérfana.

### Por qué no se activa `preserveDrawingBuffer`

El canvas se crea con `gl={{ antialias: true }}` (`app/calculator/Scene.tsx:43`). Activar
`preserveDrawingBuffer` permitiría capturar en cualquier momento, pero obliga al navegador a
conservar el framebuffer en cada fotograma de una escena que se renderiza en bucle. Capturar
de forma imperativa cuesta un render extra puntual y no penaliza el resto de la sesión.

## Manejo de errores

| Situación | Comportamiento |
|---|---|
| Sesión caducada al guardar | El estado se deja en `sessionStorage`, se redirige a `/login` y se reanuda el guardado al volver |
| Fallo en la captura de la miniatura | Se guarda igual con `thumbnail_path` nulo; la tarjeta muestra un marcador. La imagen nunca bloquea el guardado |
| `config` corrupto o de un esquema futuro | La galería muestra la tarjeta como "no se puede abrir" en lugar de romper la página |
| Límite de 50 modelos por usuario | La Server Action lo rechaza con un mensaje claro |
| Borrado | La Server Action elimina también el objeto de Storage, para no acumular huérfanos |

## Pruebas

El repositorio usa vitest con tests unitarios en `app/calculator/__tests__/`. Se sigue ese
patrón, sin introducir infraestructura nueva:

- `persistence.test.ts`: ida y vuelta `fromSavedConfig(toSavedConfig(s)) === s` salvo campos
  efímeros; configuración de esquema antiguo al que le falta un campo; valores fuera de
  rango recortados; JSON basura rechazado sin excepción.
- RLS: script SQL que inserta como usuario A y lee como usuario B esperando cero filas.
- Manual: Google, alta con contraseña, email sin confirmar, contraseña incorrecta, guardar
  con sesión caducada.

## Variables de entorno

`NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY`, inyectadas por la integración
de Vercel. No se usa clave de servicio en ninguna parte: todo acceso pasa por la sesión del
usuario y sus políticas RLS.

## Fuera de alcance

Compartir modelos entre usuarios, exportar a PDF, edición de un modelo guardado sobre sí
mismo (la primera versión siempre crea uno nuevo), panel de administración y envío real del
formulario de presupuesto, que hoy solo hace `setSent(true)` (`ui/QuoteModal.tsx:121`).
