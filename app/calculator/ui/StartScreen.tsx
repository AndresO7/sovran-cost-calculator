"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { CalculatorAction, LocationState } from "../state";
import { lookupPostcode, LookupStatus } from "../zones";
import { ACCENT, Arrow, FAINT, FG, GHOST, LINE, microLabel, MUTED } from "./controls";

type Focus = "ground" | "loft" | "both";

const FOCUS_OPTIONS: Array<{ id: Focus; label: string; blurb: string; icon: React.ReactNode }> = [
  {
    id: "ground",
    label: "Ground floor",
    blurb: "Rear extension onto the garden",
    icon: (
      <svg width="40" height="34" viewBox="0 0 44 36" aria-hidden>
        <g stroke="currentColor" strokeWidth="1.1" fill="none">
          <rect x="10" y="10" width="14" height="23" />
          <path d="M10 10 L17 5 L24 10" />
          <rect x="24" y="20" width="12" height="13" stroke="#c9a96e" />
          <line x1="6" y1="33" x2="40" y2="33" />
        </g>
      </svg>
    ),
  },
  {
    id: "loft",
    label: "Loft",
    blurb: "Dormer conversion within the roof",
    icon: (
      <svg width="40" height="34" viewBox="0 0 44 36" aria-hidden>
        <g stroke="currentColor" strokeWidth="1.1" fill="none">
          <rect x="12" y="16" width="20" height="17" />
          <path d="M12 16 L22 8 L32 16" />
          <rect x="18" y="10.5" width="8" height="5.5" stroke="#c9a96e" />
          <line x1="8" y1="33" x2="36" y2="33" />
        </g>
      </svg>
    ),
  },
  {
    id: "both",
    label: "Both",
    blurb: "Extension and loft together",
    icon: (
      <svg width="40" height="34" viewBox="0 0 44 36" aria-hidden>
        <g stroke="currentColor" strokeWidth="1.1" fill="none">
          <rect x="10" y="14" width="14" height="19" />
          <path d="M10 14 L17 7 L24 14" />
          <rect x="14" y="9.5" width="6" height="4.5" stroke="#c9a96e" />
          <rect x="24" y="22" width="11" height="11" stroke="#c9a96e" />
          <line x1="6" y1="33" x2="39" y2="33" />
        </g>
      </svg>
    ),
  },
];

const footnote: React.CSSProperties = {
  fontFamily: "var(--font-outfit)",
  fontWeight: 300,
  fontSize: 11,
  letterSpacing: "0.06em",
  lineHeight: 1.7,
  color: FAINT,
  marginTop: 14,
};

const optionRow: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "clamp(14px, 1.4vw, 20px)",
  width: "100%",
  textAlign: "left",
  padding: "clamp(13px, 1.9vh, 19px) clamp(16px, 1.6vw, 24px)",
  background: "rgba(26,25,22,0.02)",
  border: "1px solid rgba(26,25,22,0.1)",
  cursor: "pointer",
  transition: "border-color 0.3s ease, background 0.3s ease, transform 0.3s ease",
  color: "rgba(26,25,22,0.55)",
};

/**
 * Zone 2 covers Greater London and the rest of the UK — the safe fallback,
 * used only when the lookup service itself is down. The postcode is still
 * required; what is missing in that case is the borough, not the answer.
 */
const FALLBACK: LocationState = {
  postcode: "",
  zone: "zone2",
  borough: null,
  status: "error",
};

/**
 * Title-sheet intro: two questions — what are you extending, and where is the
 * property — then straight into the configurator. The postcode resolves to a
 * pricing zone, so the first figure the user sees is already right.
 */
export function StartScreen({ dispatch }: { dispatch: React.Dispatch<CalculatorAction> }) {
  const [step, setStep] = useState<"focus" | "postcode">("focus");
  const [focus, setFocus] = useState<Focus>("ground");
  const [postcode, setPostcode] = useState("");
  const [status, setStatus] = useState<LookupStatus>("idle");
  const [resolved, setResolved] = useState<LocationState | null>(null);
  const [leaving, setLeaving] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const stepRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from("[data-intro]", {
        y: 24,
        opacity: 0,
        duration: 0.85,
        stagger: 0.08,
        ease: "power3.out",
        delay: 0.1,
      });
    }, rootRef);
    return () => ctx.revert();
  }, []);

  // fade the question column when swapping between the two steps
  useEffect(() => {
    if (step !== "postcode" || !stepRef.current) return;
    gsap.from(stepRef.current, { y: 16, opacity: 0, duration: 0.5, ease: "power3.out" });
  }, [step]);

  const begin = (location: LocationState) => {
    if (leaving) return;
    setLeaving(true);
    gsap.to(rootRef.current, {
      opacity: 0,
      duration: 0.5,
      ease: "power2.in",
      onComplete: () => dispatch({ type: "BEGIN", focus, location }),
    });
  };

  const chooseFocus = (f: Focus) => {
    setFocus(f);
    setStep("postcode");
  };

  const lookup = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // already resolved and unedited — this press is the "Begin" press
    if (resolved) return begin(resolved);
    if (!postcode.trim() || status === "loading") return;

    setStatus("loading");
    try {
      const hit = await lookupPostcode(postcode);
      const location: LocationState = {
        postcode: hit.postcode,
        zone: hit.zone,
        borough: hit.borough,
        status: "ok",
      };
      setPostcode(hit.postcode);
      setResolved(location);
      setStatus("ok");
    } catch (err) {
      setStatus((err as Error)?.message === "notfound" ? "notfound" : "error");
    }
  };

  const editPostcode = (value: string) => {
    setPostcode(value);
    if (resolved) setResolved(null);
    if (status !== "idle") setStatus("idle");
  };

  return (
    <div
      ref={rootRef}
      className="start-root"
      style={{
        flex: 1,
        minHeight: 0,
        position: "relative",
        overflow: "hidden",
        background:
          "radial-gradient(1100px 600px at 74% 14%, rgba(184,148,78,0.08), transparent 60%), var(--background)",
      }}
    >
      {/* ghost numeral, clipped by the container */}
      <span
        aria-hidden
        style={{
          position: "absolute",
          right: "clamp(8px, 3vw, 56px)",
          bottom: "-0.22em",
          fontFamily: "var(--font-bodoni)",
          fontStyle: "italic",
          fontWeight: 400,
          fontSize: "clamp(180px, 26vw, 380px)",
          lineHeight: 1,
          color: GHOST,
          pointerEvents: "none",
          userSelect: "none",
        }}
      >
        01
      </span>

      <div
        className="start-cols"
        style={{
          height: "100%",
          display: "grid",
          gridTemplateColumns: "1.05fr 1px 1fr",
          alignItems: "stretch",
          padding: "0 clamp(20px, 4vw, 64px)",
          gap: "clamp(20px, 3.5vw, 56px)",
          maxWidth: 1380,
          margin: "0 auto",
        }}
      >
        {/* left — editorial heading */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            gap: "clamp(14px, 2.4vh, 24px)",
            paddingBottom: "4vh",
          }}
        >
          <div data-intro style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ width: 36, height: 1, background: ACCENT, display: "inline-block" }} />
            <span style={microLabel}>Sovran Cost Calculator</span>
          </div>
          <h1
            data-intro
            style={{
              fontFamily: "var(--font-inter-tight)",
              fontWeight: 900,
              textTransform: "uppercase",
              fontSize: "clamp(30px, 3.9vw, 58px)",
              letterSpacing: "-0.01em",
              lineHeight: 1.04,
              color: FG,
              maxWidth: "12em",
            }}
          >
            Your extension,
            <br />
            priced{" "}
            <em style={{ fontStyle: "italic", color: FG }}>in thirty seconds</em>
          </h1>
          <p
            data-intro
            style={{
              fontFamily: "var(--font-outfit)",
              fontWeight: 300,
              fontSize: "clamp(12.5px, 1vw, 15px)",
              lineHeight: 1.8,
              color: MUTED,
              maxWidth: 440,
            }}
          >
            One question, then shape your project on a live architectural
            model — sizes, materials and finishes, costed as you design.
          </p>
        </div>

        {/* hairline divider */}
        <div data-intro style={{ background: LINE, margin: "10vh 0" }} className="start-divider" />

        {/* right — the question */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            paddingBottom: "4vh",
          }}
        >
          <div data-intro ref={stepRef} style={{ width: "100%", maxWidth: 520 }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginBottom: 16 }}>
              <span style={{ fontFamily: "var(--font-bodoni)", fontStyle: "italic", color: ACCENT, fontSize: 15 }}>
                {step === "focus" ? "01" : "02"}
              </span>
              <span style={{ ...microLabel, color: "rgba(26,25,22,0.55)" }}>
                {step === "focus"
                  ? "What do you want to extend?"
                  : "Where is the property?"}
              </span>
              {step === "postcode" && (
                <button
                  onClick={() => setStep("focus")}
                  style={{
                    marginLeft: "auto",
                    fontFamily: "var(--font-outfit)",
                    fontWeight: 300,
                    fontSize: 11,
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    color: FAINT,
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  ← Back
                </button>
              )}
            </div>

            {step === "focus" ? (
              <>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {FOCUS_OPTIONS.map((o) => (
                    <button
                      key={o.id}
                      onClick={() => chooseFocus(o.id)}
                      style={optionRow}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = "rgba(184,148,78,0.6)";
                        e.currentTarget.style.background = "rgba(184,148,78,0.08)";
                        e.currentTarget.style.transform = "translateX(4px)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = "rgba(26,25,22,0.1)";
                        e.currentTarget.style.background = "rgba(26,25,22,0.02)";
                        e.currentTarget.style.transform = "translateX(0)";
                      }}
                    >
                      {o.icon}
                      <span style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                        <span
                          style={{
                            fontFamily: "var(--font-outfit)",
                            fontWeight: 400,
                            fontSize: "clamp(14px, 1.15vw, 16.5px)",
                            letterSpacing: "0.05em",
                            color: "rgba(26,25,22,0.85)",
                          }}
                        >
                          {o.label}
                        </span>
                        <span
                          style={{
                            fontFamily: "var(--font-outfit)",
                            fontWeight: 300,
                            fontSize: 11.5,
                            letterSpacing: "0.06em",
                            color: FAINT,
                          }}
                        >
                          {o.blurb}
                        </span>
                      </span>
                      <span className="row-arrow" style={{ marginLeft: "auto", color: ACCENT, opacity: 0.45 }}>
                        <Arrow />
                      </span>
                    </button>
                  ))}
                </div>
                <p style={footnote}>
                  You can change any of this later in the configurator.
                </p>
              </>
            ) : (
              <PostcodeStep
                postcode={postcode}
                status={status}
                resolved={resolved}
                onEdit={editPostcode}
                onSubmit={lookup}
                onContinueUnverified={() =>
                  begin({ ...FALLBACK, postcode: postcode.trim().toUpperCase() })
                }
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Postcode question — mandatory, there is no way past it. Resolving is a
 * two-press affair on purpose: the first press looks the postcode up and
 * shows the area it landed in, the second confirms it. The rate band the
 * postcode resolves to is never surfaced; it only drives the arithmetic.
 */
function PostcodeStep({
  postcode,
  status,
  resolved,
  onEdit,
  onSubmit,
  onContinueUnverified,
}: {
  postcode: string;
  status: LookupStatus;
  resolved: LocationState | null;
  onEdit: (value: string) => void;
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
  onContinueUnverified: () => void;
}) {
  const loading = status === "loading";

  return (
    <form onSubmit={onSubmit} noValidate>
      <p
        style={{
          fontFamily: "var(--font-outfit)",
          fontWeight: 300,
          fontSize: "clamp(12.5px, 1vw, 14px)",
          lineHeight: 1.8,
          color: MUTED,
          marginBottom: 18,
        }}
      >
        Build rates vary sharply across London. Your postcode sets the rate
        band your estimate is calculated against.
      </p>

      <div style={{ display: "flex", alignItems: "stretch", gap: 10 }}>
        <input
          name="postcode"
          value={postcode}
          onChange={(e) => onEdit(e.target.value)}
          placeholder="e.g. NW1 8NH"
          autoComplete="postal-code"
          autoCapitalize="characters"
          spellCheck={false}
          aria-label="Property postcode"
          style={{
            flex: 1,
            minWidth: 0,
            background: "transparent",
            border: "none",
            borderBottom: `1px solid ${LINE}`,
            padding: "12px 2px",
            fontFamily: "var(--font-outfit)",
            fontWeight: 300,
            fontSize: 16,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: FG,
            outline: "none",
          }}
        />
        <button
          type="submit"
          disabled={loading || (!resolved && !postcode.trim())}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 10,
            fontFamily: "var(--font-outfit)",
            fontWeight: 400,
            fontSize: 11,
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            whiteSpace: "nowrap",
            color: resolved ? "#f8f6f3" : FG,
            background: resolved ? FG : "transparent",
            border: `1px solid ${resolved ? FG : "rgba(26,25,22,0.2)"}`,
            padding: "0 20px",
            cursor: loading ? "wait" : "pointer",
            opacity: !resolved && !postcode.trim() ? 0.4 : 1,
            transition: "all 0.35s ease",
          }}
        >
          {loading ? "Checking…" : resolved ? "Begin" : "Check"}
          {!loading && <Arrow />}
        </button>
      </div>

      {/* the area the postcode landed in — shown before the user commits to
          it, so the confirmation is of somewhere they recognise */}
      {resolved && resolved.borough && (
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            gap: 10,
            flexWrap: "wrap",
            marginTop: 16,
            padding: "12px 14px",
            border: "1px solid rgba(184,148,78,0.45)",
            background: "rgba(184,148,78,0.07)",
          }}
        >
          <span
            style={{
              fontFamily: "var(--font-outfit)",
              fontWeight: 400,
              fontSize: 12.5,
              letterSpacing: "0.06em",
              color: FG,
            }}
          >
            {resolved.borough}
          </span>
        </div>
      )}

      {status === "notfound" && (
        <p style={{ ...footnote, color: "#b06a4c" }}>
          We couldn&apos;t find that postcode. Check it and try again.
        </p>
      )}
      {status === "error" && (
        <>
          <p style={{ ...footnote, color: "#b06a4c" }}>
            The postcode lookup is unavailable right now. Try again in a
            moment, or continue and we&apos;ll confirm your area on the quote.
          </p>
          <button
            type="button"
            onClick={onContinueUnverified}
            disabled={!postcode.trim()}
            style={{
              ...footnote,
              display: "block",
              marginTop: 8,
              background: "transparent",
              border: "none",
              padding: 0,
              textAlign: "left",
              cursor: postcode.trim() ? "pointer" : "not-allowed",
              opacity: postcode.trim() ? 1 : 0.5,
              textDecoration: "underline",
              textUnderlineOffset: 4,
            }}
          >
            Continue with {postcode.trim().toUpperCase() || "this postcode"}
          </button>
        </>
      )}
    </form>
  );
}
