import { getMobilePlatform } from "@/shared/lib/deviceDetection";

describe("getMobilePlatform", () => {
  it("detects Android from a typical Android UA", () => {
    const ua =
      "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Mobile Safari/537.36";
    expect(getMobilePlatform(ua)).toBe("android");
  });

  it("detects iOS from an iPhone UA", () => {
    const ua =
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1";
    expect(getMobilePlatform(ua)).toBe("ios");
  });

  it("detects iOS from an iPad UA", () => {
    const ua =
      "Mozilla/5.0 (iPad; CPU OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1";
    expect(getMobilePlatform(ua)).toBe("ios");
  });

  it("returns other for desktop UA", () => {
    const ua =
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36";
    expect(getMobilePlatform(ua)).toBe("other");
  });

  it("returns other for empty string", () => {
    expect(getMobilePlatform("")).toBe("other");
  });
});
