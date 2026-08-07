import { describe, expect, it } from "vitest";
import { zoneForBorough } from "../zones";

describe("zoneForBorough", () => {
  it("maps every prime borough from the guide to Zone 1", () => {
    const prime = [
      "Kensington and Chelsea",
      "Westminster",
      "City of London",
      "Islington",
      "Camden",
      "Hammersmith and Fulham",
      "Wandsworth",
      "Southwark",
      "Lambeth",
      "Richmond upon Thames",
      "Greenwich",
    ];
    for (const borough of prime) {
      expect(zoneForBorough(borough), borough).toBe("zone1");
    }
  });

  it("maps other London boroughs to Zone 2", () => {
    for (const borough of ["Hackney", "Brent", "Ealing", "Newham", "Croydon"]) {
      expect(zoneForBorough(borough), borough).toBe("zone2");
    }
  });

  it("maps the rest of the UK to Zone 2", () => {
    for (const district of ["Manchester", "Edinburgh", "Cardiff", "Bristol, City of"]) {
      expect(zoneForBorough(district), district).toBe("zone2");
    }
  });

  it("ignores the council styling around the borough name", () => {
    expect(zoneForBorough("Royal Borough of Kensington & Chelsea")).toBe("zone1");
    expect(zoneForBorough("London Borough of Camden")).toBe("zone1");
    expect(zoneForBorough("City of Westminster")).toBe("zone1");
    expect(zoneForBorough("  hammersmith and fulham  ")).toBe("zone1");
  });

  it("keeps City of London intact rather than stripping it to London", () => {
    expect(zoneForBorough("City of London")).toBe("zone1");
  });

  it("falls back to Zone 2 when the borough is unknown", () => {
    expect(zoneForBorough(null)).toBe("zone2");
    expect(zoneForBorough(undefined)).toBe("zone2");
    expect(zoneForBorough("")).toBe("zone2");
  });
});
