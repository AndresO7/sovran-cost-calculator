// Location zones drive every rate in the calculator. The zone is derived from
// the property postcode via Postcodes.io, which returns the London borough
// (its `admin_district` field). Anything outside the prime list — including
// the rest of the UK — is Zone 2.

export type ZoneId = "zone1" | "zone2";

export const ZONES: Record<ZoneId, { label: string; sub: string }> = {
  zone1: { label: "Zone 1", sub: "Prime / Inner London" },
  zone2: { label: "Zone 2", sub: "Greater London / Rest of UK" },
};

/**
 * Zone 1 boroughs, normalised (see `normalise`). "City of Westminster" and
 * "Royal Greenwich" are listed alongside the plain names because councils
 * style themselves inconsistently and the API passes that styling through.
 */
const ZONE1 = new Set([
  "kensington and chelsea",
  "westminster",
  "city of westminster",
  "city of london",
  "islington",
  "camden",
  "hammersmith and fulham",
  "wandsworth",
  "southwark",
  "lambeth",
  "richmond upon thames",
  "greenwich",
  "royal greenwich",
]);

/**
 * Lower-cases, spells out "&", drops punctuation and strips the
 * "London Borough of" / "Royal Borough of" prefix — so "Royal Borough of
 * Kensington & Chelsea" matches "Kensington and Chelsea". The prefix is only
 * removed from the front, which keeps "City of London" intact.
 */
function normalise(borough: string): string {
  return borough
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z ]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^(the )?(royal |london )?borough of /, "");
}

export function zoneForBorough(borough: string | null | undefined): ZoneId {
  if (!borough) return "zone2";
  return ZONE1.has(normalise(borough)) ? "zone1" : "zone2";
}

export interface PostcodeLookup {
  zone: ZoneId;
  borough: string | null;
  /** the postcode as formatted by the API, e.g. "NW1 8NH" */
  postcode: string;
}

export type LookupStatus = "idle" | "loading" | "ok" | "notfound" | "error";

interface PostcodesIoResponse {
  status: number;
  result?: { postcode?: string; admin_district?: string | null } | null;
}

/**
 * Looks a UK postcode up on Postcodes.io. The API is public and CORS-enabled,
 * so this runs straight from the browser with no server route in between.
 *
 * Throws "notfound" for an unrecognised postcode and "error" for anything
 * else, so callers can tell "check your postcode" from "try again later".
 */
export async function lookupPostcode(
  raw: string,
  signal?: AbortSignal
): Promise<PostcodeLookup> {
  const trimmed = raw.trim();
  if (!trimmed) throw new Error("notfound");

  let res: Response;
  try {
    res = await fetch(
      `https://api.postcodes.io/postcodes/${encodeURIComponent(trimmed)}`,
      { signal }
    );
  } catch (e) {
    if ((e as Error)?.name === "AbortError") throw e;
    throw new Error("error");
  }

  if (res.status === 404) throw new Error("notfound");
  if (!res.ok) throw new Error("error");

  const data = (await res.json()) as PostcodesIoResponse;
  const borough = data.result?.admin_district ?? null;
  if (!data.result) throw new Error("notfound");

  return {
    zone: zoneForBorough(borough),
    borough,
    postcode: data.result.postcode ?? trimmed.toUpperCase(),
  };
}
