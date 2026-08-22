/**
 * Las credenciales de Supabase, con un error legible cuando faltan. Sin esto
 * el SDK lanza "supabaseUrl is required", que no dice dónde ponerlas.
 */
function required(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(
      `Falta la variable de entorno ${name}. Copia .env.local.example a ` +
        `.env.local y rellénala desde el panel de Supabase (Project Settings → API).`
    );
  }
  return value;
}

export const supabaseUrl = () =>
  required("NEXT_PUBLIC_SUPABASE_URL", process.env.NEXT_PUBLIC_SUPABASE_URL);

export const supabaseAnonKey = () =>
  required("NEXT_PUBLIC_SUPABASE_ANON_KEY", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
