"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabase } from "@/lib/supabase/server";
import { parseSavedConfig, SAVED_SCHEMA_VERSION } from "./persistence";

export const MAX_MODELS_PER_USER = 50;

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

  const name =
    String(formData.get("name") ?? "").trim().slice(0, 80) || "Untitled project";

  let config;
  try {
    config = parseSavedConfig(
      JSON.parse(String(formData.get("config") ?? "")),
      SAVED_SCHEMA_VERSION
    );
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
