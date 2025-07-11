import { formatTime } from "../../../shared/lib/util";

describe("util functions (Centralized Test)", () => {
  describe("formatTime", () => {
    it("formats time correctly for minutes and seconds", () => {
      expect(formatTime(65)).toBe("01:05");
      expect(formatTime(125)).toBe("02:05");
      expect(formatTime(3661)).toBe("61:01"); // 61 minutes, 1 second
    });

    it("handles zero time", () => {
      expect(formatTime(0)).toBe("00:00");
    });

    it("handles single digit values", () => {
      expect(formatTime(5)).toBe("00:05");
      expect(formatTime(59)).toBe("00:59");
    });

    it("handles large numbers of minutes", () => {
      expect(formatTime(3600)).toBe("60:00"); // 60 minutes
      expect(formatTime(3665)).toBe("61:05"); // 61 minutes, 5 seconds
    });

    it("handles negative values and NaN", () => {
      expect(formatTime(-5)).toBe("00:00");
      expect(formatTime(NaN)).toBe("00:00");
    });
  });
});
