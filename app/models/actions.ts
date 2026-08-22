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
    .maybeSingle();

  await supabase.from("saved_models").delete().eq("id", id);

  if (row?.thumbnail_path) {
    await supabase.storage.from("model-thumbnails").remove([row.thumbnail_path]);
  }

  revalidatePath("/models");
}
