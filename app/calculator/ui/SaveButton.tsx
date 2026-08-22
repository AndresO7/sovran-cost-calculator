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
    const today = new Date().toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

    const form = new FormData();
    form.set("name", `Project · ${today}`);
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
        // no perder el trabajo: Calculator lo recupera al volver
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
