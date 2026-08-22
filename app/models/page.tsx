import Link from "next/link";
import { createServerSupabase } from "@/lib/supabase/server";
import { parseSavedConfig } from "@/app/calculator/persistence";
import { ModelCard, ModelRow } from "./ModelCard";

export const dynamic = "force-dynamic";

export default async function ModelsPage() {
  const supabase = await createServerSupabase();

  const { data: rows } = await supabase
    .from("saved_models")
    .select(
      "id, name, config, schema_version, price_low, price_high, thumbnail_path, created_at"
    )
    .order("created_at", { ascending: false });

  const list = rows ?? [];

  // una sola llamada firma todas las miniaturas presentes
  const paths = list
    .map((r) => r.thumbnail_path)
    .filter((p): p is string => typeof p === "string" && p.length > 0);
  const signed = paths.length
    ? (await supabase.storage.from("model-thumbnails").createSignedUrls(paths, 3600)).data ??
      []
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
    <main
      style={{
        minHeight: "100dvh",
        background: "#f8f6f3",
        padding: "40px clamp(20px, 5vw, 64px) 80px",
      }}
    >
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
        <h1
          style={{
            fontFamily: "var(--font-bodoni)",
            fontSize: "clamp(26px, 4vw, 38px)",
            fontWeight: 400,
            margin: 0,
          }}
        >
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
        <p
          style={{
            fontFamily: "var(--font-outfit)",
            fontWeight: 300,
            color: "rgba(26,25,22,0.55)",
          }}
        >
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
