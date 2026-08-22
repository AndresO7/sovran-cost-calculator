import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { supabaseAnonKey, supabaseUrl } from "./env";

/** En Next 16 cookies() es asíncrona, de ahí que la fábrica también lo sea. */
export async function createServerSupabase() {
  const cookieStore = await cookies();

  return createServerClient(
    supabaseUrl(),
    supabaseAnonKey(),
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
