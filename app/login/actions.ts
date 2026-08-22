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
