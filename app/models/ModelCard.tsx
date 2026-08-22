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
      ? `£${model.price_low.toLocaleString("en-GB")} – £${model.price_high.toLocaleString(
          "en-GB"
        )}`
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
            <span
              style={{
                fontFamily: "var(--font-outfit)",
                fontSize: 10.5,
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                color: "#8a3a3a",
              }}
            >
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
