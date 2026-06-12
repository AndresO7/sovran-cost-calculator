"use client";

import { Component, ReactNode, useEffect, useMemo, useReducer, useRef } from "react";
import dynamic from "next/dynamic";
import gsap from "gsap";
import { PROTOTYPES } from "./config";
import { calculatePrice } from "./pricing";
import { CalculatorState, initialState, reducer } from "./state";
import { ConfigPanel } from "./ui/ConfigPanel";
import { ACCENT, FAINT, microLabel, MUTED } from "./ui/controls";
import { QuoteModal } from "./ui/QuoteModal";
import { SiteNav } from "./ui/SiteNav";
import { StartScreen } from "./ui/StartScreen";
import { TopBar } from "./ui/TopBar";

const Scene = dynamic(() => import("./Scene"), {
  ssr: false,
  loading: () => <SceneFallback message="Preparing your model…" />,
});

export default function Calculator() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const price = useMemo(() => calculatePrice(state), [state]);
  const rootRef = useRef<HTMLDivElement>(null);

  // entrance reveal — runs once the intro questions are answered
  useEffect(() => {
    const root = rootRef.current;
    if (!root || !state.started) return;
    const ctx = gsap.context(() => {
      gsap.from(".calc-topbar", { y: -24, opacity: 0, duration: 0.9, ease: "power3.out" });
      gsap.from(".calc-viewport", { opacity: 0, duration: 1.4, delay: 0.25, ease: "power2.out" });
      gsap.from(".calc-panel", { x: 36, opacity: 0, duration: 1.0, delay: 0.35, ease: "power3.out" });
    }, root);
    return () => ctx.revert();
  }, [state.started]);

  return (
    <div ref={rootRef} className="calc-root" style={{ position: "relative" }}>
      <SiteNav />
      {state.started ? (
        <>
          <TopBar state={state} price={price} dispatch={dispatch} />
          <div className="calc-body">
            <div
              className="calc-viewport"
              style={{ position: "relative", background: "var(--background)" }}
            >
              <SceneBoundary>
                <Scene state={state} />
              </SceneBoundary>
              <ViewportDressing state={state} />
            </div>
            <ConfigPanel state={state} dispatch={dispatch} />
          </div>
        </>
      ) : (
        <StartScreen dispatch={dispatch} />
      )}
      {state.quoteOpen && <QuoteModal state={state} price={price} dispatch={dispatch} />}
    </div>
  );
}

/** Architectural overlays: corner ticks, plot data, ghost wordmark, hint. */
function ViewportDressing({ state }: { state: CalculatorState }) {
  const proto = PROTOTYPES[state.prototype];
  const size = proto.sizes[state.ground.size];
  const inset = "clamp(14px, 1.8vw, 26px)";
  const tick = (pos: React.CSSProperties) => (
    <span
      aria-hidden
      style={{
        position: "absolute",
        width: 14,
        height: 14,
        borderColor: "rgba(201,169,110,0.4)",
        borderStyle: "solid",
        pointerEvents: "none",
        ...pos,
      }}
    />
  );
  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      {tick({ top: inset, left: inset, borderWidth: "1px 0 0 1px" })}
      {tick({ top: inset, right: inset, borderWidth: "1px 1px 0 0" })}
      {tick({ bottom: inset, left: inset, borderWidth: "0 0 1px 1px" })}
      {tick({ bottom: inset, right: inset, borderWidth: "0 1px 1px 0" })}

      {/* plot data, drawing-title style */}
      <div
        style={{
          position: "absolute",
          top: `calc(${inset} + 10px)`,
          left: `calc(${inset} + 18px)`,
        }}
      >
        <div style={{ ...microLabel, color: "rgba(239,233,225,0.55)" }}>{proto.label}</div>
        <div
          style={{
            fontFamily: "var(--font-bodoni)",
            fontStyle: "italic",
            fontWeight: 400,
            fontSize: "clamp(13px, 1.1vw, 16px)",
            color: ACCENT,
            marginTop: 5,
            letterSpacing: "0.06em",
          }}
        >
          {size.w.toFixed(1)} × {size.d.toFixed(1)} m — {size.area} m²
        </div>
      </div>

      {/* ghost wordmark */}
      <span
        aria-hidden
        style={{
          position: "absolute",
          right: `calc(${inset} + 16px)`,
          bottom: `calc(${inset} + 2px)`,
          fontFamily: "var(--font-bodoni)",
          fontWeight: 500,
          fontSize: "clamp(34px, 4.5vw, 64px)",
          letterSpacing: "0.16em",
          color: "rgba(239,233,225,0.05)",
          lineHeight: 1,
          userSelect: "none",
        }}
      >
        SOVRAN
      </span>

      <div
        style={{
          position: "absolute",
          left: `calc(${inset} + 18px)`,
          bottom: `calc(${inset} + 8px)`,
          ...microLabel,
          fontSize: 9,
        }}
      >
        Drag to orbit · Scroll to zoom
      </div>
    </div>
  );
}

function SceneFallback({ message }: { message: string }) {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 18,
        color: MUTED,
      }}
    >
      <div
        style={{
          width: 34,
          height: 34,
          borderRadius: "50%",
          border: "1px solid rgba(201,169,110,0.25)",
          borderTopColor: ACCENT,
          animation: "spin 0.9s linear infinite",
        }}
      />
      <span style={{ ...microLabel, color: FAINT }}>{message}</span>
    </div>
  );
}

/** If WebGL fails, keep the configurator + pricing alive with a graceful note. */
class SceneBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    if (this.state.failed) {
      return (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 40,
            textAlign: "center",
          }}
        >
          <p
            style={{
              fontFamily: "var(--font-outfit)",
              fontWeight: 300,
              fontSize: 14,
              lineHeight: 1.75,
              color: MUTED,
              maxWidth: 380,
            }}
          >
            Your browser couldn&apos;t start the 3D viewer — the configurator
            and live pricing still work on the right.
          </p>
        </div>
      );
    }
    return this.props.children;
  }
}
