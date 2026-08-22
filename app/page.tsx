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
