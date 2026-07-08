import {
  isMusicView,
  normalizeMusicView,
  parseMusicView,
} from "@/widgets/musicShell/musicView";

describe("music view parsing", () => {
  it("parses a valid view from string", () => {
    expect(parseMusicView("pop")).toBe("pop");
    expect(parseMusicView("edm")).toBe("edm");
    expect(parseMusicView("recent")).toBe("recent");
  });

  it("returns undefined for an invalid view", () => {
    expect(parseMusicView("all")).toBeUndefined();
    expect(parseMusicView(["all", "pop"])).toBeUndefined();
    expect(parseMusicView(undefined)).toBeUndefined();
  });

  it("uses route-first string when parse input is array", () => {
    expect(parseMusicView(["edm", "pop"])).toBe("edm");
  });

  it("exposes valid view predicate", () => {
    expect(isMusicView("edm")).toBe(true);
    expect(isMusicView("all")).toBe(false);
    expect(isMusicView(undefined)).toBe(false);
  });

  it("normalizes unknown views to pop", () => {
    expect(normalizeMusicView("pop")).toBe("pop");
    expect(normalizeMusicView("all")).toBe("pop");
  });
});

