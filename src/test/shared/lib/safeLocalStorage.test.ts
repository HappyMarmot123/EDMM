import { safeLocalStorage } from "@/shared/lib/safeLocalStorage";

describe("safeLocalStorage", () => {
  afterEach(() => {
    (window.localStorage.getItem as jest.Mock).mockClear?.();
    (window.localStorage.setItem as jest.Mock).mockClear?.();
    jest.restoreAllMocks();
  });

  it("reads and writes through window.localStorage", () => {
    expect(safeLocalStorage.setItem("edmm:test", "1")).toBe(true);
    const read = safeLocalStorage.getItem("edmm:test");
    expect(read.isBrowser).toBe(true);
    expect(read.value).toBe("1");
  });

  it("returns null value when key is absent", () => {
    const read = safeLocalStorage.getItem("edmm:absent");
    expect(read.isBrowser).toBe(true);
    expect(read.value).toBeNull();
  });

  it("falls back to in-memory store when localStorage throws", () => {
    jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error("blocked");
    });
    jest.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error("blocked");
    });

    expect(safeLocalStorage.setItem("edmm:fallback", "42")).toBe(false);
    const read = safeLocalStorage.getItem("edmm:fallback");
    expect(read.isBrowser).toBe(true);
    expect(read.value).toBe("42");
  });
});
